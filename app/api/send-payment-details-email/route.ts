import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { generatePaymentDetailsEmail } from '@/lib/email-templates';
import { validateEmailConfig, debugEmailConfig, env } from '@/lib/env';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    const emailConfigValid = validateEmailConfig();
    if (!emailConfigValid) {
      return NextResponse.json(
        { error: 'Email configuration is invalid', debug: debugEmailConfig() },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { inquiry, listing, recipientEmail } = body;

    if (!inquiry || !listing || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: inquiry, listing, and recipientEmail are required' },
        { status: 400 }
      );
    }

    if (!listing.paymentDetails) {
      return NextResponse.json(
        { error: 'No payment details configured for this listing', listingTitle: listing.title },
        { status: 400 }
      );
    }

    let siteSettings: any = null;
    try {
      const siteResult = await fetchQuery(api.sites.getSiteByDomain, {
        domain: request.headers.get('host') || 'refreshproperty.vercel.app'
      });
      if (siteResult) {
        siteSettings = siteResult;
      }
    } catch (error) {
      console.warn('Could not fetch site settings:', error);
    }

    const emailTemplate = generatePaymentDetailsEmail(inquiry, listing, siteSettings);

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Payment details email sent successfully',
        emailId: emailResult.id,
        recipientEmail,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send payment details email',
        details: emailResult.error,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in payment details email endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Payment Details Email API',
    description: 'Send payment details and instructions to guests for their booking',
    methods: ['POST'],
    requiredFields: ['inquiry', 'listing', 'recipientEmail'],
  });
}
