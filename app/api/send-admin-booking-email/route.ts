import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { generateAdminBookingNotificationEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { to, inquiry, inquiryId, listingTitle, listingImage, listingUrl } = data;

    if (!to || !inquiry || !inquiryId || !listingTitle) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailTemplate = generateAdminBookingNotificationEmail({
      inquiry,
      inquiryId,
      listingTitle,
      listingImage,
      listingUrl,
    });

    const result = await sendEmail({
      to: to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to send email', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin booking notification email sent successfully',
      id: result.id,
    });

  } catch (error) {
    console.error('Error in send-admin-booking-email API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
