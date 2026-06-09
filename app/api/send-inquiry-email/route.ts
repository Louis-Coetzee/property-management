import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'no-reply@online-site.co.za';

interface InquiryEmailRequest {
  inquiryId: string;
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
  message: string;
  sentBy: string;
  pdfBase64?: string;
  siteSettings?: any;
}

function generateInquiryEmailTemplate(inquiry: any, senderName: string, senderEmail: string, message: string, siteSettings?: any) {
  const companyName = siteSettings?.companyName || 'RefreshTech';
  const primaryColor = siteSettings?.primaryColor || '#2563eb';

  return {
    subject: `Inquiry Forwarded: ${inquiry.inquiryType?.replace('_', ' ') || 'Inquiry'} from ${inquiry.customerName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, ${primaryColor} 0%, #1d4ed8 100%); padding: 25px 30px; text-align: center;">
            <div style="color: #ffffff; font-size: 14px; opacity: 0.9;">Customer Inquiry Forwarded</div>
        </div>
        <div style="padding: 40px 30px;">
            <h1 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">Inquiry Details Forwarded</h1>
            <p style="color: #475569; font-size: 16px; margin: 0 0 30px 0;">
                ${senderName} (${senderEmail}) has forwarded you a customer inquiry.
            </p>
            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid ${primaryColor};">
                <h3 style="color: ${primaryColor}; font-size: 16px; margin: 0 0 10px 0;">Message from ${senderName}:</h3>
                <p style="color: #475569; font-size: 14px; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0;">Customer Information</h3>
                <p style="margin: 4px 0;"><strong>Name:</strong> ${inquiry.customerName}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> ${inquiry.customerEmail}</p>
                ${inquiry.customerPhone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${inquiry.customerPhone}</p>` : ''}
                <p style="margin: 4px 0;"><strong>Type:</strong> ${inquiry.inquiryType?.replace('_', ' ').toUpperCase() || 'General'}</p>
            </div>
            <div style="text-align: center; margin: 40px 0;">
                <a href="mailto:${inquiry.customerEmail}?subject=Re: Inquiry"
                   style="display: inline-block; background: ${primaryColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    Reply to Customer
                </a>
            </div>
        </div>
    </div>
</body>
</html>`
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: InquiryEmailRequest = await request.json();
    const { inquiryId, recipientEmail, senderName, senderEmail, message, sentBy, pdfBase64, siteSettings } = body;

    if (!inquiryId || !recipientEmail || !senderName || !senderEmail || !message || !sentBy) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail) || !emailRegex.test(senderEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    const inquiry = {
      _id: inquiryId,
      customerName: 'Customer',
      customerEmail: recipientEmail,
      inquiryDetails: { subject: 'Inquiry' },
      createdAt: new Date().toISOString()
    };

    const emailTemplate = generateInquiryEmailTemplate(inquiry, senderName, senderEmail, message, siteSettings);

    const emailData: any = {
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    };

    if (pdfBase64) {
      emailData.attachments = [
        {
          filename: `inquiry-${inquiry._id.slice(-8)}.pdf`,
          content: pdfBase64,
          contentType: 'application/pdf',
        }
      ];
    }

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to send email', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry email sent successfully',
      emailId: data?.id,
    });

  } catch (error) {
    console.error('[INQUIRY-EMAIL] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
