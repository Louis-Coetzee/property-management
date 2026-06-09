import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { generateContactConfirmationEmail, generateContactAdminNotificationEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { to, subject, name, email, phone, originalSubject, originalMessage, isForClient } = data;

    if (!to || !name || !originalSubject || !originalMessage) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailTemplate = isForClient
      ? generateContactConfirmationEmail(
          { to, name, subject: originalSubject, message: originalMessage },
          { companyName: 'RefreshTech', primaryColor: '#059669' }
        )
      : generateContactAdminNotificationEmail(
          { to, name, email: email || '', phone: phone || '', subject: originalSubject, message: originalMessage },
          { companyName: 'RefreshTech', primaryColor: '#059669' }
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
      message: 'Contact email sent successfully',
      id: result.id,
    });

  } catch (error) {
    console.error('Error in send-contact-email API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
