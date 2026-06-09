import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { generateBookingStatusChangeEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, inquiry, inquiryId, newStatus, listingTitle } = body;

    if (!to || !inquiry || !newStatus || !listingTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: to, inquiry, newStatus, and listingTitle are required' },
        { status: 400 }
      );
    }

    const emailTemplate = generateBookingStatusChangeEmail(inquiry, newStatus, listingTitle);

    const emailResult = await sendEmail({
      to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Status change email sent successfully',
        emailId: emailResult.id,
        recipientEmail: to,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send status change email',
        details: emailResult.error,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in status change email endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Booking Status Change Email API',
    description: 'Send booking status change notifications to guests',
    methods: ['POST'],
  });
}
