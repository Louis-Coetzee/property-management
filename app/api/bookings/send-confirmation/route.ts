import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { bookingCode, bookingData } = await request.json();

    const sites = await convex.query(api.sites.getAllSites, {});
    const mainSite = sites && sites.length > 0 ? sites[0] : null;

    // Use Resend via PM's email system
    const { sendEmail } = await import('@/lib/email');

    const guestEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .booking-code { background: #f0fdf4; border: 2px solid #10b981; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .booking-code h2 { color: #059669; margin: 0; font-size: 28px; }
          .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
            <p>Thank you for your booking</p>
          </div>
          <div class="content">
            <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
            <p>Your booking has been confirmed! We're excited to host you.</p>
            <div class="booking-code">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Your Booking Reference</p>
              <h2>${bookingCode}</h2>
            </div>
            <div class="details">
              <h3 style="margin-top: 0;">Booking Details</h3>
              <div class="detail-row"><strong>Property:</strong><span>${bookingData.listingTitle}</span></div>
              <div class="detail-row"><strong>Check-in:</strong><span>${bookingData.checkInDate}</span></div>
              <div class="detail-row"><strong>Check-out:</strong><span>${bookingData.checkOutDate}</span></div>
              <div class="detail-row"><strong>Guests:</strong><span>${bookingData.numberOfGuests}</span></div>
              <div class="detail-row"><strong>Nights:</strong><span>${bookingData.numberOfNights}</span></div>
              <div class="detail-row"><strong>Total Amount:</strong><span><strong>R${bookingData.totalAmount.toFixed(2)}</strong></span></div>
            </div>
            <p style="margin-top: 30px;"><strong>What's Next?</strong></p>
            <ul>
              <li>Keep this email for your records</li>
              <li>The property owner will contact you with check-in details</li>
              <li>View your booking anytime in your dashboard</li>
            </ul>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} RefreshTech. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResult = await sendEmail({
      to: bookingData.email,
      subject: `Booking Confirmed - ${bookingCode}`,
      html: guestEmailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}
