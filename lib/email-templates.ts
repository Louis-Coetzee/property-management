/**
 * Email Templates - Adapted from Find Accommodation for Property Management
 */

import { env } from './env';
import { emailColors } from './theme';
import { createHash } from 'crypto';

const appName = 'RefreshTech';
const currentYear = new Date().getFullYear();

interface StoreSettings {
  name?: string;
  companyName?: string;
  email?: string;
  logoUrl?: string;
  companyLogo?: string;
  logoText?: string;
  logoTextColor?: string;
  logoType?: 'image' | 'text';
  domain?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactNumber?: string;
  address?: string;
  socialMedia?: {
    facebook?: string;
    facebookEnabled?: boolean;
    instagram?: string;
    instagramEnabled?: boolean;
    twitter?: string;
    twitterEnabled?: boolean;
    linkedin?: string;
    linkedinEnabled?: boolean;
    youtube?: string;
    youtubeEnabled?: boolean;
  };
}

const emailStyles = {
  container: `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 0;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  `,
  header: `
    background-color: ${emailColors.primary};
    padding: 30px 40px;
    text-align: center;
  `,
  footer: `
    background-color: ${emailColors.background};
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: ${emailColors.text.secondary};
    border-top: 1px solid #e5e7eb;
  `,
  body: `
    padding: 40px 40px;
    color: ${emailColors.text.primary};
  `,
  heading: `
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  `,
  paragraph: `
    margin-bottom: 16px;
    font-size: 16px;
    line-height: 24px;
    color: #918f8e;
  `,
  button: `
    display: inline-block;
    background-color: ${emailColors.primary};
    color: #ffffff;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    margin: 20px 0;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `,
  link: `
    color: ${emailColors.primary};
    text-decoration: underline;
  `,
  divider: `
    border: 0;
    height: 1px;
    background-color: #e5e7eb;
    margin: 24px 0;
  `,
  note: `
    background-color: #f3f4f6;
    padding: 16px;
    border-radius: 6px;
    font-size: 14px;
    margin-top: 24px;
    margin-bottom: 24px;
    border-left: 4px solid ${emailColors.primary};
  `,
};

const generateEmailHeader = (options?: {
  companyName?: string;
  companyLogo?: string;
  logoType?: 'image' | 'text';
  logoText?: string;
  logoTextColor?: string;
  title?: string;
}) => {
  const companyName = options?.companyName || appName;
  const title = options?.title || companyName;

  if (options?.logoType === 'text' && options?.logoText) {
    return `
      <div style="${emailStyles.header}">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <h1 style="${emailStyles.heading}; color: ${options.logoTextColor || '#ffffff'};">
            ${options.logoText}
          </h1>
        </div>
      </div>
    `;
  } else if (options?.logoType === 'image' && options?.companyLogo) {
    return `
      <div style="${emailStyles.header}">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <img src="${options.companyLogo}" alt="${companyName} Logo" style="height: 32px; width: auto; object-fit: contain;" />
          <h1 style="${emailStyles.heading}">${title}</h1>
        </div>
      </div>
    `;
  } else {
    return `
      <div style="${emailStyles.header}">
        <h1 style="${emailStyles.heading}">${title}</h1>
      </div>
    `;
  }
};

const generateEmailFooter = (socialMediaSettings?: StoreSettings['socialMedia']) => {
  const socialIcons: Array<{ name: string; href: string; svg: string; color: string }> = [];

  if (socialMediaSettings?.facebookEnabled && socialMediaSettings?.facebook) {
    socialIcons.push({
      name: 'Facebook',
      href: socialMediaSettings.facebook,
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
      color: '#6b7280'
    });
  }

  if (socialMediaSettings?.instagramEnabled && socialMediaSettings?.instagram) {
    socialIcons.push({
      name: 'Instagram',
      href: socialMediaSettings.instagram,
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
      color: '#6b7280'
    });
  }

  const displaySocialIcons = socialIcons.length > 0 ? socialIcons : [
    {
      name: 'Facebook',
      href: 'https://facebook.com',
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
      color: '#6b7280'
    },
  ];

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; padding: 24px 20px; border-top: 1px solid #e5e7eb;">
      <tr>
        <td style="padding: 24px 20px; text-align: center;">
          <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">
              <span style="color: #918f8e;">Refresh</span> <span style="color: #059669;">Tech</span>
            </h3>
          </div>
          <div style="margin-bottom: 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
              <tr>
                ${displaySocialIcons.map((icon) => `
                  <td style="padding: 0 8px;">
                    <a href="${icon.href}" style="text-decoration: none; color: ${icon.color}; display: inline-block;" target="_blank">${icon.svg}</a>
                  </td>
                `).join('')}
              </tr>
            </table>
          </div>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            © ${currentYear} RefreshTech. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  `;
};

export const getBaseTemplate = (content: string, storeSettings?: StoreSettings) => {
  const companyName = 'RefreshTech';

  const logoSection = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
        <tr>
          <td style="padding: 0; text-align: center;">
            <div style="font-size: 24px; font-weight: 600; white-space: nowrap; line-height: 1.2;">
              <span style="color: #918f8e;">Refresh</span> <span style="color: #059669;">Tech</span>
            </div>
          </td>
        </tr>
      </table>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${companyName}</title>
      <style>
        @media screen and (max-width: 600px) {
          .email-container { width: 100% !important; max-width: 100% !important; }
          .content-padding { padding: 20px 15px !important; }
          .header-padding { padding: 20px 15px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #918f8e; background-color: #f9fafb;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; width: 100%;">
        <tr>
          <td class="header-padding" style="background-color: #ffffff; padding: 30px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            ${logoSection}
          </td>
        </tr>
        <tr>
          <td class="content-padding" style="padding: 35px 30px; background-color: #ffffff;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background-color: #f9fafb;">
            ${generateEmailFooter(storeSettings?.socialMedia)}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Generate booking confirmation email for guests
export function generateBookingConfirmationEmail(
  inquiry: any,
  listingTitle: string,
  hostName: string
): string {
  const formatCurrency = (amount: number, currency: string) => {
    return currency === 'ZAR' ? `R${amount.toLocaleString()}` : `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const content = `
    <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 20px 0;">
      Booking Request Confirmation
    </h2>
    <p style="color: #475569; font-size: 16px; text-align: center; margin: 0 0 30px 0;">
      Thank you for your booking request. We've received your inquiry and it's currently being processed.
    </p>
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb;">
      <h3 style="margin-top: 0; color: #2563eb;">${listingTitle}</h3>
      <div style="display: grid; gap: 12px; margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Check-in</span>
          <span style="font-weight: 600; color: #918f8e;">${formatDate(inquiry.checkInDate)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Check-out</span>
          <span style="font-weight: 600; color: #918f8e;">${formatDate(inquiry.checkOutDate)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Duration</span>
          <span style="font-weight: 600; color: #918f8e;">${inquiry.totalNights} night${inquiry.totalNights > 1 ? 's' : ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Guests</span>
          <span style="font-weight: 600; color: #918f8e;">${inquiry.numberOfGuests} guest${inquiry.numberOfGuests > 1 ? 's' : ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #6b7280;">Total Amount</span>
          <span style="font-weight: 600; color: #918f8e;">${formatCurrency(inquiry.totalAmount, inquiry.currency)}</span>
        </div>
      </div>
    </div>
    ${inquiry.message ? `
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #918f8e;">Your Message:</h4>
        <p style="margin-bottom: 0; font-style: italic;">"${inquiry.message}"</p>
      </div>
    ` : ''}
    <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #0c4a6e; margin-top: 0;">What happens next?</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Your host <strong>${hostName}</strong> will review your request</li>
        <li>You'll receive an email once they respond (usually within 24 hours)</li>
        <li>If approved, you'll receive booking confirmation and payment instructions</li>
      </ul>
    </div>
    <p style="margin-top: 30px;">
      <strong>Important:</strong> This is not a confirmed booking yet. Please wait for your host's response before making any travel arrangements.
    </p>
  `;

  return getBaseTemplate(content);
}

// Generate host notification email
export function generateHostNotificationEmail(
  inquiry: any,
  listingTitle: string,
  hostName: string
): string {
  const formatCurrency = (amount: number, currency: string) => {
    return currency === 'ZAR' ? `R${amount.toLocaleString()}` : `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const content = `
    <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 20px 0;">
      New Booking Request
    </h2>
    <p style="color: #475569; font-size: 16px; text-align: center; margin: 0 0 30px 0;">
      Hi ${hostName}! You have a new booking request for your property.
    </p>
    <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="margin-top: 0; color: #059669;">${listingTitle}</h3>
      <div style="display: grid; gap: 12px; margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Check-in</span>
          <span style="font-weight: 600; color: #918f8e;">${formatDate(inquiry.checkInDate)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Check-out</span>
          <span style="font-weight: 600; color: #918f8e;">${formatDate(inquiry.checkOutDate)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Guests</span>
          <span style="font-weight: 600; color: #918f8e;">${inquiry.numberOfGuests} guest${inquiry.numberOfGuests > 1 ? 's' : ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #6b7280;">Total Amount</span>
          <span style="font-weight: 600; color: #918f8e;">${formatCurrency(inquiry.totalAmount, inquiry.currency)}</span>
        </div>
      </div>
    </div>
    <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #d97706;">
      <h3 style="margin-top: 0; color: #d97706;">Guest Information</h3>
      <p style="margin: 4px 0;"><strong>Name:</strong> ${inquiry.guestName}</p>
      <p style="margin: 4px 0;"><strong>Email:</strong> ${inquiry.guestEmail}</p>
      ${inquiry.guestPhone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${inquiry.guestPhone}</p>` : ''}
    </div>
    ${inquiry.message ? `
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #918f8e;">Guest Message:</h4>
        <p style="margin-bottom: 0; font-style: italic;">"${inquiry.message}"</p>
      </div>
    ` : ''}
    <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0c4a6e;">Action Required</h3>
      <p style="margin-bottom: 0;">Please respond to this booking request within 24 hours. Log in to your dashboard to approve or decline this request.</p>
    </div>
    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      <strong>Pro Tip:</strong> Quick responses lead to more bookings!
    </p>
  `;

  return getBaseTemplate(content);
}

// Generate admin booking notification email
export function generateAdminBookingNotificationEmail(data: {
  inquiry: any;
  inquiryId: string;
  listingTitle: string;
  listingImage?: string;
  listingUrl?: string;
}): { subject: string; html: string } {
  const { inquiry, inquiryId, listingTitle, listingImage, listingUrl } = data;

  const content = `
    <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
      New Booking Request - Admin Notification
    </h2>
    <p style="color: #475569; font-size: 16px; margin: 0 0 20px 0;">
      A new booking request has been submitted for <strong>${listingTitle}</strong>.
    </p>
    ${listingImage ? `<img src="${listingImage}" alt="${listingTitle}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin: 16px 0;" />` : ''}
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #918f8e;">Booking Details</h3>
      <p style="margin: 4px 0;"><strong>Guest:</strong> ${inquiry.guestName}</p>
      <p style="margin: 4px 0;"><strong>Email:</strong> ${inquiry.guestEmail}</p>
      ${inquiry.guestPhone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${inquiry.guestPhone}</p>` : ''}
      <p style="margin: 4px 0;"><strong>Check-in:</strong> ${inquiry.checkInDate}</p>
      <p style="margin: 4px 0;"><strong>Check-out:</strong> ${inquiry.checkOutDate}</p>
      <p style="margin: 4px 0;"><strong>Guests:</strong> ${inquiry.numberOfGuests}</p>
      <p style="margin: 4px 0;"><strong>Total:</strong> R${inquiry.totalAmount?.toFixed(2) || '0.00'}</p>
    </div>
    ${listingUrl ? `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${listingUrl}" style="display: inline-block; background: #059669; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
          View Booking Details
        </a>
      </div>
    ` : ''}
  `;

  return {
    subject: `New Booking Request - ${listingTitle}`,
    html: getBaseTemplate(content),
  };
}

// Generate owner booking notification email
export function generateOwnerBookingNotificationEmail(data: {
  inquiry: any;
  inquiryId: string;
  listingTitle: string;
  listingImage?: string;
  listingUrl?: string;
}): { subject: string; html: string } {
  const { inquiry, inquiryId, listingTitle, listingImage, listingUrl } = data;

  const content = `
    <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
      New Booking Request for Your Property
    </h2>
    <p style="color: #475569; font-size: 16px; margin: 0 0 20px 0;">
      Your property <strong>${listingTitle}</strong> has received a new booking request.
    </p>
    ${listingImage ? `<img src="${listingImage}" alt="${listingTitle}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin: 16px 0;" />` : ''}
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #918f8e;">Booking Details</h3>
      <p style="margin: 4px 0;"><strong>Check-in:</strong> ${inquiry.checkInDate}</p>
      <p style="margin: 4px 0;"><strong>Check-out:</strong> ${inquiry.checkOutDate}</p>
      <p style="margin: 4px 0;"><strong>Guests:</strong> ${inquiry.numberOfGuests}</p>
      <p style="margin: 4px 0;"><strong>Total:</strong> R${inquiry.totalAmount?.toFixed(2) || '0.00'}</p>
    </div>
    <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0c4a6e;">Action Required</h3>
      <p style="margin-bottom: 0;">Please confirm availability within 24 hours so we can finalize the booking.</p>
    </div>
    ${listingUrl ? `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${listingUrl}" style="display: inline-block; background: #1e40af; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
          View Booking Request
        </a>
      </div>
    ` : ''}
  `;

  return {
    subject: `New Booking Request - ${listingTitle}`,
    html: getBaseTemplate(content),
  };
}

// Generate inquiry confirmation email template (for guest)
export function generateInquiryConfirmationEmail(
  emailData: {
    to: string;
    inquiry: any;
    listingTitle: string;
    listingImage?: string | null;
    hostName: string;
  },
  branding: {
    companyName: string;
    logoType: 'text' | 'image';
    logoText?: string;
    logoTextColor?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }
) {
  const { inquiry, listingTitle, listingImage, hostName } = emailData;
  const { primaryColor = '#059669' } = branding;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return currency === 'ZAR' ? `R${amount.toLocaleString()}` : `${currency} ${amount.toLocaleString()}`;
  };

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="background: #ffffff; padding: 24px 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #16911c;">Inquiry Sent Successfully!</h1>
        <p style="margin: 8px 0 0 0; font-size: 15px; color: #6b7280;">Your booking request has been received</p>
      </div>
    </div>
    ${listingImage ? `<img src="${listingImage}" alt="${listingTitle}" style="max-width: 100%; width: 100%; height: auto; max-height: 450px; object-fit: cover; border-radius: 12px; margin-bottom: 24px;" />` : ''}
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px 20px; border-left: 4px solid ${primaryColor}; margin-bottom: 24px;">
      <h2 style="color: ${primaryColor}; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Your Inquiry Details</h2>
      <p style="margin: 4px 0;"><strong>Property:</strong> ${listingTitle}</p>
      <p style="margin: 4px 0;"><strong>Check-in:</strong> ${formatDate(inquiry.checkInDate)}</p>
      <p style="margin: 4px 0;"><strong>Check-out:</strong> ${formatDate(inquiry.checkOutDate)}</p>
      <p style="margin: 4px 0;"><strong>Guests:</strong> ${inquiry.numberOfGuests}</p>
      <p style="margin: 4px 0;"><strong>Nights:</strong> ${inquiry.totalNights}</p>
      ${inquiry.message ? `<p style="margin: 8px 0 0 0;"><strong>Your Message:</strong> <em>"${inquiry.message}"</em></p>` : ''}
    </div>
    <div style="background: #ffffff; border: 2px solid ${primaryColor}; border-radius: 12px; padding: 24px 20px; margin-bottom: 24px;">
      <h3 style="color: ${primaryColor}; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Pricing Breakdown</h3>
      <p style="margin: 4px 0;">${formatPrice(inquiry.pricePerNight, inquiry.currency)} x ${inquiry.totalNights} nights</p>
      ${inquiry.cleaningFee > 0 ? `<p style="margin: 4px 0;">Cleaning fee: ${formatPrice(inquiry.cleaningFee, inquiry.currency)}</p>` : ''}
      <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 12px 0;">
      <p style="font-size: 18px; font-weight: 700;">Total: <span style="color: ${primaryColor};">${formatPrice(inquiry.totalAmount, inquiry.currency)}</span></p>
    </div>
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #92400e; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">What Happens Next?</h3>
      <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
        <li>Our team will review your request</li>
        <li>We'll coordinate with the property host to confirm availability</li>
        <li>You should receive a response within 2-4 hours</li>
        <li>Once confirmed, we'll send you booking confirmation and payment details</li>
      </ul>
    </div>
  `;

  return {
    subject: `Booking Request Sent - ${listingTitle}`,
    html: getBaseTemplate(content),
  };
}

// Generate inquiry notification email template (for host)
export function generateInquiryNotificationEmail(
  emailData: {
    to: string;
    inquiry: any;
    listingTitle: string;
    listingImage?: string | null;
    hostName: string;
  },
  branding: {
    companyName: string;
    logoType: 'text' | 'image';
    logoText?: string;
    logoTextColor?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }
) {
  const { inquiry, listingTitle, listingImage, hostName } = emailData;
  const { primaryColor = '#059669' } = branding;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return currency === 'ZAR' ? `R${amount.toLocaleString()}` : `${currency} ${amount.toLocaleString()}`;
  };

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="background: #ffffff; padding: 24px 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #16911c;">New Booking Request!</h1>
        <p style="margin: 8px 0 0 0; font-size: 15px; color: #6b7280;">You have a new inquiry for your property</p>
      </div>
    </div>
    ${listingImage ? `<img src="${listingImage}" alt="${listingTitle}" style="max-width: 100%; width: 100%; height: auto; max-height: 450px; object-fit: cover; border-radius: 12px; margin-bottom: 24px;" />` : ''}
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px 20px; border-left: 4px solid ${primaryColor}; margin-bottom: 24px;">
      <h2 style="color: ${primaryColor}; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Property: ${listingTitle}</h2>
      <h3 style="color: #918f8e; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Guest Information</h3>
      <p style="margin: 4px 0;"><strong>Name:</strong> ${inquiry.guestName}</p>
      <p style="margin: 4px 0;"><strong>Email:</strong> ${inquiry.guestEmail}</p>
      ${inquiry.guestPhone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${inquiry.guestPhone}</p>` : ''}
    </div>
    <div style="background: #ffffff; border: 2px solid ${primaryColor}; border-radius: 12px; padding: 24px 20px; margin-bottom: 24px;">
      <h3 style="color: ${primaryColor}; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Booking Details</h3>
      <p style="margin: 4px 0;"><strong>Check-in:</strong> ${formatDate(inquiry.checkInDate)}</p>
      <p style="margin: 4px 0;"><strong>Check-out:</strong> ${formatDate(inquiry.checkOutDate)}</p>
      <p style="margin: 4px 0;"><strong>Guests:</strong> ${inquiry.numberOfGuests}</p>
      <p style="margin: 4px 0;"><strong>Nights:</strong> ${inquiry.totalNights}</p>
      <div style="background: #f0fdf4; border-radius: 8px; padding: 12px 16px; margin-top: 12px;">
        <p style="color: #15803d; font-size: 16px; font-weight: 600; margin: 0;">Total Earnings: ${formatPrice(inquiry.totalAmount, inquiry.currency)}</p>
      </div>
    </div>
    ${inquiry.message ? `
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px 20px; margin-bottom: 24px;">
        <h3 style="color: #918f8e; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Message from Guest:</h3>
        <p style="color: #6b7280; font-style: italic; margin: 0; line-height: 1.6;">"${inquiry.message}"</p>
      </div>
    ` : ''}
    <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">What Happens Next</h3>
      <p style="color: #1e40af; margin: 0; line-height: 1.6; font-size: 14px;">
        Please confirm availability within <strong>24 hours</strong> so we can finalize the booking and send payment details to the guest.
      </p>
    </div>
  `;

  return {
    subject: `New Booking Request - ${listingTitle} (${inquiry.guestName})`,
    html: getBaseTemplate(content),
  };
}

// Generate enhanced alert notification email with listing details
export const generateEnhancedAlertNotificationEmail = (data: {
  userEmail: string;
  userName: string;
  alertName: string;
  listing: {
    id: string;
    title: string;
    description: string;
    pricePerNight: number;
    currency?: string;
    location: { city: string; province: string; suburb?: string };
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    coverImage?: string;
    featuredImage?: string;
  };
}, storeSettings?: StoreSettings) => {
  const { userName, alertName, listing } = data;
  const primaryColor = storeSettings?.primaryColor || '#059669';
  const currency = listing.currency || 'ZAR';
  const listingImage = listing.coverImage || listing.featuredImage;

  const formatPrice = (price: number, curr: string = 'ZAR') => {
    const symbol = curr === 'ZAR' ? 'R' : '$';
    return `${symbol}${price.toLocaleString()}`;
  };

  const content = `
    <h2 style="color: #1F2937; font-size: 22px; font-weight: 700; margin-bottom: 16px;">
      New Match Found for "${alertName}"
    </h2>
    <p style="color: #475569; font-size: 16px; margin: 0 0 16px 0;">Hi ${userName},</p>
    <p style="color: #475569; font-size: 16px; margin: 0 0 30px 0;">
      We found a new accommodation listing that matches your search criteria:
    </p>
    <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 24px 0; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
      ${listingImage ? `<img src="${listingImage}" alt="${listing.title}" style="width: 100%; height: 308px; object-fit: cover; display: block;" />` : ''}
      <div style="padding: 20px;">
        <h3 style="color: #1F2937; font-size: 18px; font-weight: 600; margin-bottom: 12px;">${listing.title}</h3>
        <div style="color: ${primaryColor}; font-size: 20px; font-weight: 700; margin-bottom: 12px;">
          ${formatPrice(listing.pricePerNight, currency)} per night
        </div>
        <div style="color: #6b7280; margin-bottom: 12px; font-size: 14px;">
          ${listing.location.suburb ? `${listing.location.suburb}, ` : ''}${listing.location.city}, ${listing.location.province}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 16px; margin: 16px 0; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
          <span style="font-size: 14px; color: #918f8e;">${listing.propertyType}</span>
          <span style="font-size: 14px; color: #918f8e;">${listing.bedrooms} bed</span>
          <span style="font-size: 14px; color: #918f8e;">${listing.bathrooms} bath</span>
          <span style="font-size: 14px; color: #918f8e;">Up to ${listing.maxGuests} guests</span>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          ${listing.description.length > 150 ? listing.description.substring(0, 150) + '...' : listing.description}
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://refreshproperty.vercel.app'}/listings/${listing.id}"
             style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; font-weight: 600; font-size: 16px; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
            View Full Listing
          </a>
        </div>
      </div>
    </div>
  `;

  return {
    subject: `New ${listing.propertyType} in ${listing.location.city} - ${alertName}`,
    html: getBaseTemplate(content),
  };
};

// Alert Creation Confirmation Email
export const generateAlertCreationEmail = (data: {
  userName: string;
  alertName: string;
  alertCriteria: {
    location: string;
    priceMin?: number;
    priceMax?: number;
    listingTypes?: string[];
    maxGuests?: number;
    facilities?: string[];
  };
}, storeSettings?: StoreSettings) => {
  const { userName, alertName, alertCriteria } = data;
  const primaryColor = storeSettings?.primaryColor || '#059669';

  const formatCriteria = () => {
    const criteria: string[] = [];
    criteria.push(`Location: ${alertCriteria.location}`);
    if (alertCriteria.priceMin || alertCriteria.priceMax) {
      criteria.push(`Price: R${alertCriteria.priceMin || 0} - R${alertCriteria.priceMax || 'Any'}`);
    }
    if (alertCriteria.maxGuests) criteria.push(`Max Guests: ${alertCriteria.maxGuests}`);
    if (alertCriteria.listingTypes && alertCriteria.listingTypes.length > 0) {
      criteria.push(`Property Types: ${alertCriteria.listingTypes.join(', ')}`);
    }
    if (alertCriteria.facilities && alertCriteria.facilities.length > 0) {
      criteria.push(`Required Facilities: ${alertCriteria.facilities.join(', ')}`);
    }
    return criteria.map(c => `<li style="color: #918f8e; font-size: 14px; margin-bottom: 8px;">${c}</li>`).join('');
  };

  const content = `
    <h2 style="color: #1F2937; font-size: 20px; font-weight: 600; margin-bottom: 16px;">
      Your Search Alert is Active!
    </h2>
    <p style="color: #475569; font-size: 16px; margin: 0 0 16px 0;">Hi ${userName},</p>
    <p style="color: #475569; font-size: 16px; margin: 0 0 16px 0;">
      Your search alert "<strong>${alertName}</strong>" has been created successfully and is now active.
    </p>
    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; font-size: 14px; margin: 24px 0; border-left: 4px solid #2563EB;">
      <h3 style="color: #1F2937; font-size: 16px; font-weight: 600; margin-bottom: 12px;">Your Alert Criteria:</h3>
      <ul style="margin: 0; padding-left: 20px;">${formatCriteria()}</ul>
    </div>
    <p style="color: #475569; font-size: 16px; margin: 0 0 16px 0;">
      We'll monitor new listings and send you email notifications whenever we find accommodation that matches your criteria.
    </p>
  `;

  return {
    subject: `Alert Created: ${alertName}`,
    html: getBaseTemplate(content),
  };
};

// Generate professional payment details email for guests
export function generatePaymentDetailsEmail(inquiry: any, listing: any, siteSettings?: any) {
  const primaryColor = '#059669';

  const checkInDate = new Date(inquiry.checkInDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const checkOutDate = new Date(inquiry.checkOutDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const formatPrice = (price: number, currency: string = 'ZAR') => {
    const symbols: { [key: string]: string } = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R' };
    return `${symbols[currency] || currency}${price.toLocaleString()}`;
  };

  const paymentDetails = listing.paymentDetails;
  const banking = paymentDetails?.bankingDetails;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 12px 24px; margin-bottom: 16px;">
        <p style="color: #1e40af; font-size: 14px; margin: 0 0 4px 0; font-weight: 600; letter-spacing: 1px;">BOOKING REFERENCE</p>
        <p style="color: #1e3a8a; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: 2px;">${inquiry.bookingNumber || 'PENDING'}</p>
      </div>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: ${primaryColor}; font-size: 32px; margin: 0 0 8px 0; font-weight: 700;">Booking Approved!</h1>
      <p style="color: #6B7280; font-size: 18px; margin: 0;">Your booking request for ${listing.title} has been approved</p>
    </div>
    <div style="background: #ecfdf5; border: 2px solid ${primaryColor}; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <h2 style="color: #047857; font-size: 20px; margin: 0 0 12px 0; font-weight: 600;">Payment Required to Secure Booking</h2>
      <p style="color: #918f8e; line-height: 1.6; margin: 0; font-size: 16px;">
        Congratulations! Your booking request has been approved. To secure your reservation, please complete the payment using the banking details below.
      </p>
    </div>
    <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #b45309; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Payment Processing & Check-in Policy</h3>
      <p style="color: #78350f; line-height: 1.6; margin: 0; font-size: 14px;">
        <strong>Please note:</strong> Some payments may take up to 72 hours to reflect. Check-ins will only be allowed once payment has been confirmed. Please send proof of payment immediately after making payment.
      </p>
    </div>
    <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Send Proof of Payment</h3>
      <p style="color: #1e40af; line-height: 1.6; margin: 0 0 12px 0; font-size: 14px;">
        To secure your reservation, please send your proof of payment to:
      </p>
      <div style="background: #ffffff; border-radius: 8px; padding: 16px; margin-top: 12px;">
        <p style="color: #918f8e; margin: 8px 0; font-size: 14px;">
          <strong>Email:</strong> <a href="mailto:info@refreshtech.co.za" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">info@refreshtech.co.za</a>
        </p>
        <p style="color: #6b7280; margin: 12px 0 0 0; font-size: 13px; font-style: italic;">
          Please include your booking number (${inquiry.bookingNumber || 'PENDING'}) in your proof of payment.
        </p>
      </div>
    </div>
    ${listing.featuredImage || listing.images?.[0] ? `
      <img src="${listing.featuredImage || listing.images[0]}" alt="${listing.title}"
           style="width: 100%; max-width: 500px; height: auto; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; margin: 24px 0; display: block; margin-left: auto; margin-right: auto;" />
    ` : ''}
    <div style="background: #e0f2fe; border: 2px solid #0ea5e9; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h2 style="color: #0369a1; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">Booking Summary</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #bae6fd; color: #075985;">Property:</td><td style="padding: 8px 0; border-bottom: 1px solid #bae6fd; color: #0c4a6e; font-weight: 600; text-align: right;">${listing.title}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #bae6fd; color: #075985;">Guest:</td><td style="padding: 8px 0; border-bottom: 1px solid #bae6fd; color: #0c4a6e; font-weight: 600; text-align: right;">${inquiry.guestName}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #bae6fd; color: #075985;">Check-in:</td><td style="padding: 8px 0; border-bottom: 1px solid #bae6fd; color: #0c4a6e; font-weight: 600; text-align: right;">${checkInDate}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #bae6fd; color: #075985;">Check-out:</td><td style="padding: 8px 0; border-bottom: 1px solid #bae6fd; color: #0c4a6e; font-weight: 600; text-align: right;">${checkOutDate}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #bae6fd; color: #075985;">Guests:</td><td style="padding: 8px 0; border-bottom: 1px solid #bae6fd; color: #0c4a6e; font-weight: 600; text-align: right;">${inquiry.numberOfGuests}</td></tr>
        <tr><td style="padding: 8px 0; color: #075985;">Nights:</td><td style="padding: 8px 0; color: #0c4a6e; font-weight: 600; text-align: right;">${inquiry.totalNights}</td></tr>
      </table>
    </div>
    <div style="background: #d1fae5; border: 2px solid ${primaryColor}; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="color: #047857; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Price Breakdown</h3>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; color: #065f46;">${formatPrice(inquiry.pricePerNight, inquiry.currency)} x ${inquiry.totalNights} nights</td><td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; color: #047857; font-weight: 600; text-align: right;">${formatPrice(inquiry.pricePerNight * inquiry.totalNights, inquiry.currency)}</td></tr>
        ${inquiry.cleaningFee ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; color: #065f46;">Cleaning fee</td><td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; color: #047857; font-weight: 600; text-align: right;">${formatPrice(inquiry.cleaningFee, inquiry.currency)}</td></tr>` : ''}
        <tr><td style="padding: 12px 0; font-size: 18px; font-weight: 700; color: #064e3b;">Total Amount</td><td style="padding: 12px 0; font-size: 18px; font-weight: 700; color: ${primaryColor}; text-align: right;">${formatPrice(inquiry.totalAmount, inquiry.currency)}</td></tr>
      </table>
    </div>
    ${banking && (banking.bankName || banking.accountNumber) ? `
      <div style="background: #d1fae5; border: 2px solid ${primaryColor}; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h2 style="color: #047857; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">Banking Details</h2>
        <div style="background: #ffffff; border-radius: 8px; padding: 16px; border: 1px solid #a7f3d0;">
          ${banking.bankName ? `<p style="margin: 8px 0; color: #374151;"><strong>Bank Name:</strong> ${banking.bankName}</p>` : ''}
          ${banking.accountHolder ? `<p style="margin: 8px 0; color: #374151;"><strong>Account Holder:</strong> ${banking.accountHolder}</p>` : ''}
          ${banking.accountNumber ? `<p style="margin: 8px 0; color: #374151;"><strong>Account Number:</strong> ${banking.accountNumber}</p>` : ''}
          ${banking.branchCode ? `<p style="margin: 8px 0; color: #374151;"><strong>Branch Code:</strong> ${banking.branchCode}</p>` : ''}
          ${banking.accountType ? `<p style="margin: 8px 0; color: #374151;"><strong>Account Type:</strong> ${banking.accountType}</p>` : ''}
        </div>
      </div>
    ` : ''}
  `;

  return {
    subject: `Booking Approved - Payment Required - ${listing.title}`,
    html: getBaseTemplate(content),
  };
}

// Contact form email for admin
export function generateContactConfirmationEmail(data: {
  to: string;
  name: string;
  subject: string;
  message: string;
}, branding?: any): { subject: string; html: string } {
  const content = `
    <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 20px 0;">
      Thank You for Contacting Us
    </h2>
    <p style="color: #475569; font-size: 16px; margin: 0 0 16px 0;">Dear ${data.name},</p>
    <p style="color: #475569; font-size: 16px; margin: 0 0 16px 0;">
      Thank you for contacting us regarding: <strong>"${data.subject}"</strong>
    </p>
    <p style="color: #475569; font-size: 16px; margin: 0 0 16px 0;">
      We have received your message and will respond within 24 hours during business days.
    </p>
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h4 style="margin-top: 0; color: #059669;">Details You Submitted:</h4>
      <p style="margin: 4px 0;"><strong>Name:</strong> ${data.name}</p>
      <p style="margin: 4px 0;"><strong>Email:</strong> ${data.to}</p>
      <p style="margin: 4px 0;"><strong>Subject:</strong> ${data.subject}</p>
      <p style="margin: 4px 0;"><strong>Message:</strong> ${data.message.replace(/\n/g, '<br>')}</p>
    </div>
    <p style="color: #475569; font-size: 16px; margin: 30px 0 0 0;">
      Best regards,<br>The RefreshTech Team
    </p>
  `;

  return {
    subject: `Thank you for contacting us`,
    html: getBaseTemplate(content),
  };
}

export function generateContactAdminNotificationEmail(data: {
  to: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}, branding?: any): { subject: string; html: string } {
  const content = `
    <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
      New Contact Form Submission
    </h2>
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>Name:</strong> ${data.name}</p>
      <p style="margin: 8px 0;"><strong>Email:</strong> ${data.email}</p>
      ${data.phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${data.phone}</p>` : ''}
      <p style="margin: 8px 0;"><strong>Subject:</strong> ${data.subject}</p>
      <p style="margin: 8px 0;"><strong>Message:</strong></p>
      <div style="background: #ffffff; padding: 15px; border-left: 4px solid #3b82f6; margin: 8px 0;">
        ${data.message.replace(/\n/g, '<br>')}
      </div>
    </div>
  `;

  return {
    subject: `New Contact Form Submission: ${data.subject}`,
    html: getBaseTemplate(content),
  };
}

// Inquiry email forwarding template
function generateInquiryEmailTemplate(
  inquiry: any,
  senderName: string,
  senderEmail: string,
  message: string,
  siteSettings?: any
) {
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
        </div>
    </div>
</body>
</html>`
  };
}

// Re-export for backward compatibility
export {
  generateInquiryEmailTemplate as generateInquiryForwardEmail,
};
