import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { generateAlertCreationEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, userName, alertName, alertCriteria } = body;

    if (!userEmail || !userName || !alertName || !alertCriteria) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailTemplate = generateAlertCreationEmail(
      { userName, alertName, alertCriteria },
      {
        companyName: 'RefreshTech',
        logoType: 'text',
        logoText: 'RefreshTech',
        logoTextColor: '#059669',
        primaryColor: '#059669',
      }
    );

    const result = await sendEmail({
      to: userEmail,
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
      message: 'Alert creation email sent successfully',
      id: result.id,
    });

  } catch (error) {
    console.error('Error in send-alert-creation-email API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
