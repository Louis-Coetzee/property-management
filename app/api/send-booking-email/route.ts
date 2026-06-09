import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { generateBookingConfirmationEmail, generateHostNotificationEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, inquiry, listingTitle, hostName, isForGuest } = body;

    if (!to || !inquiry) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailTemplate = isForGuest
      ? generateBookingConfirmationEmail(inquiry, listingTitle, hostName)
      : generateHostNotificationEmail(inquiry, listingTitle, hostName);

    const emailResult = await sendEmail({
      to,
      subject,
      html: emailTemplate,
    });

    if (!emailResult.success) {
      console.error('Failed to send booking email:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending booking email:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
