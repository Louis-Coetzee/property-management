import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { generateInquiryNotificationEmail } from '@/lib/email-templates';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { to, inquiry, listingTitle, listingImage, hostName, listingId, listing } = data;

    if (!to || !inquiry || !listingTitle || !hostName || !listingId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    let recipients: string[] = [];
    const notificationsEnabled = listing?.notificationsEnabled !== false;

    if (notificationsEnabled) {
      recipients = [to];
    } else {
      try {
        const sites = await convex.query(api.sites.getAllSites, {});
        const mainSite = sites && sites.length > 0 ? sites[0] : null;
        const adminEmails = mainSite?.settings?.adminNotificationEmails || [];
        recipients = [...adminEmails];
      } catch (error) {
        console.error('Error fetching admin emails:', error);
      }

      if (listing?.agents && listing.agents.length > 0) {
        const agentEmails = listing.agents.map((agent: any) => agent.email).filter((email: string) => email);
        recipients = [...recipients, ...agentEmails];
      }

      if (recipients.length === 0) {
        recipients = [to];
      }
    }

    const emailTemplate = generateInquiryNotificationEmail(
      { to: recipients[0], inquiry, listingTitle, listingImage, hostName },
      {
        companyName: 'RefreshTech',
        logoType: 'text',
        logoText: 'RefreshTech',
        logoTextColor: '#059669',
        primaryColor: '#059669',
        secondaryColor: '#047857',
      }
    );

    const results: Array<{ recipient: string; success: boolean; id?: string; error?: string }> = [];
    for (const recipient of recipients) {
      try {
        const result = await sendEmail({
          to: recipient,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
        results.push({ recipient, success: result.success, id: result.id, error: result.error });
      } catch (error) {
        results.push({ recipient, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Inquiry notification emails sent to ${successCount} recipient(s)`,
      results,
      totalRecipients: recipients.length,
      successCount,
      failureCount: results.filter(r => !r.success).length,
    });

  } catch (error) {
    console.error('Error in send-inquiry-notification-email API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
