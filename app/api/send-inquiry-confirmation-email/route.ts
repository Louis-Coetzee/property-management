import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { generateInquiryConfirmationEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { to, inquiry, listingTitle, listingImage, hostName } = data;

    if (!to || !inquiry || !listingTitle || !hostName) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailTemplate = generateInquiryConfirmationEmail(
      { to, inquiry, listingTitle, listingImage, hostName },
      {
        companyName: 'RefreshTech',
        logoType: 'text',
        logoText: 'RefreshTech',
        logoTextColor: '#059669',
        primaryColor: '#059669',
        secondaryColor: '#047857',
      }
    );

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
      message: 'Inquiry confirmation email sent successfully',
      id: result.id,
    });

  } catch (error) {
    console.error('Error in send-inquiry-confirmation-email API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
