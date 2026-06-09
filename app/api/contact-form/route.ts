import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, siteName, inquiryType } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { message: 'Name, email, subject, and message are required' },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'info@findaccommodation.co.za';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16911c;">New Contact Form Submission</h2>
        <p><strong>Site:</strong> ${siteName || 'Find Accommodation'}</p>
        <p><strong>Inquiry Type:</strong> ${inquiryType || 'General'}</p>
        <hr style="border: 1px solid #e5e7eb;" />
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; background: #f9fafb; padding: 12px; border: 1px solid #e5e7eb;">${message}</p>
      </div>
    `;

    await resend.emails.send({
      from: `Find Accommodation <noreply@${process.env.RESEND_DOMAIN || 'findaccommodation.co.za'}>`,
      to: adminEmail,
      subject: `[Contact Form] ${subject}`,
      html: htmlContent,
      replyTo: email,
    });

    // Send confirmation to user
    await resend.emails.send({
      from: `Find Accommodation <noreply@${process.env.RESEND_DOMAIN || 'findaccommodation.co.za'}>`,
      to: email,
      subject: 'We received your message - Find Accommodation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16911c;">Thank you for contacting us!</h2>
          <p>Hi ${name},</p>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p><strong>Your inquiry:</strong></p>
          <p style="white-space: pre-wrap; background: #f9fafb; padding: 12px; border: 1px solid #e5e7eb;">${message}</p>
          <p>If you need immediate assistance, please call us at 068 900 6679.</p>
          <br />
          <p>Best regards,</p>
          <p><strong>Find Accommodation Team</strong></p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'Message sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
