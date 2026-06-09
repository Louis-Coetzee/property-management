// Use fetch instead of Resend SDK to avoid import issues in Convex

export interface EmailVerificationData {
  email: string;
  firstName: string;
  verificationToken: string;
  domain: string;
}

export interface PasswordResetData {
  email: string;
  firstName: string;
  resetToken: string;
  domain: string;
}

export interface FormSubmissionEmailData {
  recipients: string[];
  formName: string;
  formId?: string; // Optional for contact forms
  submissionData: Array<{
    fieldId: string;
    fieldLabel: string;
    value: string;
  }>;
  domain: string;
  websiteId: string;
  submitterName?: string;
  submitterEmail?: string;
  submittedAt: number;
  emailConfirmationTitle?: string;
  emailConfirmationSubtitle?: string;
  emailConfirmationMessage?: string;
  websiteBranding?: WebsiteBranding;
  companyName?: string;
}

export interface FileShareEmailData {
  recipientEmail: string;
  recipientName: string;
  sharerName: string;
  sharerEmail: string;
  itemType: 'file' | 'folder';
  itemName: string;
  permission: 'view' | 'edit' | 'read-write';
  domain: string;
  accessUrl?: string;
  message?: string;
  companyBranding?: CompanyBranding;
  companyName?: string;
}

interface CompanyBranding {
  primaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  logoType?: 'image' | 'text';
  logoText?: string;
  logoTextColor?: string;
}

interface CalendarBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  logoType?: 'text' | 'image';
  textLogo?: {
    text: string;
    color: string;
    fontSize: string;
    fontWeight: string;
    fontFamily?: string;
  };
  companyName?: string;
}

// Website branding interface from Convex
interface WebsiteBranding {
  primaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  logoType?: 'image' | 'text';
  logoText?: string;
  logoTextColor?: string;
}

// Fetch calendar branding for domain
async function getCalendarBranding(domain: string): Promise<CalendarBranding | null> {
  try {
    // Get @ bookings app URL from environment variables
    // Try multiple possible environment variable names for flexibility
    const bookingsAppUrl = process.env.BOOKINGS_APP_URL ||
                          process.env.NEXT_PUBLIC_BOOKINGS_APP_URL ||
                          'https://newbookings.vercel.app';

    const response = await fetch(`${bookingsAppUrl}/api/calendar/branding?domain=${domain}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch branding for domain ${domain}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.branding || null;
  } catch (error) {
    console.warn(`Error fetching branding for domain ${domain}:`, error);
    return null;
  }
}

// Generate branded email template
function generateEmailTemplate(
  content: string,
  branding: CalendarBranding | null,
  domain: string,
  websiteBranding?: WebsiteBranding,
  websiteCompanyName?: string
) {
  // Use website branding if provided, otherwise fall back to calendar branding
  const primaryColor = websiteBranding?.primaryColor || branding?.primaryColor || '#4F46E5';
  const companyName = websiteCompanyName || branding?.companyName || domain;

  // Generate logo section
  let logoSection = '';
  if (websiteBranding?.logoType === 'image' && websiteBranding.logoUrl) {
    // Use website image logo
    logoSection = `
      <img src="${websiteBranding.logoUrl}" alt="${companyName}" style="max-height: 60px; max-width: 200px; object-fit: contain;">
    `;
  } else if (websiteBranding?.logoType === 'text' && websiteBranding.logoText) {
    // Use website text logo
    logoSection = `
      <div style="font-size: 32px; font-weight: 700; color: ${websiteBranding.logoTextColor || '#1e293b'}; font-family: Arial, sans-serif; margin: 0;">
        ${websiteBranding.logoText}
      </div>
    `;
  } else if (branding?.logoType === 'image' && branding.logo) {
    // Fall back to calendar image logo
    logoSection = `
      <img src="${branding.logo}" alt="${companyName}" style="max-height: 60px; max-width: 200px; object-fit: contain; margin-bottom: 10px;">
      <div style="font-size: 24px; font-weight: bold; color: ${primaryColor}; margin: 0;">
        ${companyName}
      </div>
    `;
  } else if (branding?.logoType === 'text' && branding.textLogo) {
    // Fall back to calendar text logo
    logoSection = `
      <div style="font-size: ${parseInt(branding.textLogo.fontSize) + 4}px; font-weight: ${branding.textLogo.fontWeight}; color: ${branding.textLogo.color}; font-family: ${branding.textLogo.fontFamily || 'Arial, sans-serif'}; margin: 0;">
        ${branding.textLogo.text}
      </div>
    `;
  } else {
    // Default: company name as text logo
    logoSection = `
      <div style="font-size: 28px; font-weight: bold; color: ${primaryColor}; font-family: Arial, sans-serif; margin: 0;">
        ${companyName}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notification from ${companyName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header with white background and colored border -->
        <div style="background: white; padding: 30px 20px; text-align: center; border-bottom: 4px solid ${primaryColor};">
          ${logoSection}
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            This email was sent by ${companyName}
          </p>
          <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">
            If you have any questions, please contact us.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate email template with Find Accommodation logo - hardcoded for this deployment
function generateRefreshTechEmailTemplate(content: string, primaryColor: string, secondaryColor: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Find Accommodation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header with Find Accommodation logo - white background -->
        <div style="background: white; padding: 30px 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 32px; font-weight: bold; margin: 0;">
            <span style="color: ${primaryColor};">Find</span> <span style="color: ${secondaryColor};">Accommodation</span>
          </div>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: ${secondaryColor}; font-size: 14px;">
            This email was sent by Find Accommodation
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendVerificationEmail(data: EmailVerificationData) {
  // DEBUG: Log email sending attempt
  console.log('📧 [EMAIL DEBUG] sendVerificationEmail called with:', {
    email: data.email,
    firstName: data.firstName,
    domain: data.domain,
    token: data.verificationToken,
    resendApiKey: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
    fromEmail: process.env.FROM_EMAIL,
  });

  // Create verification URL using @ domain where user registered
  let verificationUrl;

  if (data.domain.includes('.')) {
    // Full domain like "refreshauth2.vercel.app" - generate clean URL for middleware to rewrite
    verificationUrl = `https://${data.domain}/auth/verify-email?token=${data.verificationToken}`;
  } else {
    // Simple domain name for local development - use as path segment
    verificationUrl = `http://localhost:3000/${data.domain}/auth/verify-email?token=${data.verificationToken}`;
  }

  console.log('📧 [EMAIL DEBUG] Verification URL:', verificationUrl);

  // Use Find Accommodation branding - hardcoded for this deployment
  const primaryColor = '#308a29';
  const secondaryColor = '#6e6e6e';
  const companyName = 'Find Accommodation';

  const content = `
    <h2 style="color: #333; margin-top: 0;">Hello ${data.firstName}!</h2>

    <p>Thank you for registering an account with ${companyName}. To complete your registration and secure your account, please verify your email address by clicking on button below:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: ${primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
        Verify Email Address
      </a>
    </div>

    <p>If on button doesn't work, copy and paste this link into your browser:</p>
    <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 14px;">
      ${verificationUrl}
    </p>

    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;"><strong>Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with ${companyName}, please ignore this email.</p>
    </div>

    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

    <p>Best regards,<br>The ${companyName} Team</p>
  `;

  try {
    const emailPayload = {
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: [data.email],
      subject: `Verify your email for ${companyName}`,
      html: generateRefreshTechEmailTemplate(content, primaryColor, secondaryColor),
    };

    console.log('📧 [EMAIL DEBUG] Sending email with payload:', JSON.stringify(emailPayload, null, 2));

    // Use fetch to send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 [EMAIL DEBUG] Resend API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('📧 [EMAIL ERROR] Resend API error:', errorData);
      console.error('📧 [EMAIL ERROR] Full response:', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📧 [EMAIL DEBUG] Email sent successfully:', result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('📧 [EMAIL ERROR] Email sending error:', error);
    if (error instanceof Error) {
      console.error('📧 [EMAIL ERROR] Error message:', error.message);
      console.error('📧 [EMAIL ERROR] Error stack:', error.stack);
    }
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail(data: PasswordResetData) {
  // DEBUG: Log email sending attempt
  console.log('📧 [EMAIL DEBUG] sendPasswordResetEmail called with:', {
    email: data.email,
    firstName: data.firstName,
    domain: data.domain,
    token: data.resetToken,
    resendApiKey: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
    fromEmail: process.env.FROM_EMAIL,
  });

  // Create reset URL using @ domain where user requested reset
  let resetUrl;

  if (data.domain.includes('.')) {
    // Full domain like "refreshauth2.vercel.app" - generate clean URL for middleware to rewrite
    resetUrl = `https://${data.domain}/auth/reset-password?token=${data.resetToken}`;
  } else {
    // Simple domain name for local development - use as path segment
    resetUrl = `http://localhost:3000/${data.domain}/auth/reset-password?token=${data.resetToken}`;
  }

  console.log('📧 [EMAIL DEBUG] Password reset URL:', resetUrl);

  // Use Find Accommodation branding - hardcoded for this deployment
  const primaryColor = '#308a29';
  const secondaryColor = '#6e6e6e';
  const companyName = 'Find Accommodation';

  const content = `
    <h2 style="color: #333; margin-top: 0;">Hello ${data.firstName}!</h2>

    <p>We received a request to reset on password for your ${companyName} account. If you made this request, click on button below to set a new password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: ${primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
        Reset Password
      </a>
    </div>

    <p>If on button doesn't work, copy and paste this link into your browser:</p>
    <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 14px;">
      ${resetUrl}
    </p>

    <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #721c24;"><strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
    </div>

    <p>For your security, this link can only be used once. If you need to reset your password again, you'll need to make a new request.</p>

    <p>If you have any questions or concerns about your account security, please contact our support team immediately.</p>

    <p>Best regards,<br>The ${companyName} Team</p>
  `;

  try {
    const emailPayload = {
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: [data.email],
      subject: `Reset your password for ${companyName}`,
      html: generateRefreshTechEmailTemplate(content, primaryColor, secondaryColor),
    };

    console.log('📧 [EMAIL DEBUG] Sending password reset email with payload:', JSON.stringify(emailPayload, null, 2));

    // Use fetch to send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 [EMAIL DEBUG] Resend API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('📧 [EMAIL ERROR] Resend API error:', errorData);
      console.error('📧 [EMAIL ERROR] Full response:', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📧 [EMAIL DEBUG] Password reset email sent successfully:', result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('📧 [EMAIL ERROR] Email sending error:', error);
    if (error instanceof Error) {
      console.error('📧 [EMAIL ERROR] Error message:', error.message);
      console.error('📧 [EMAIL ERROR] Error stack:', error.stack);
    }
    throw new Error('Failed to send password reset email');
  }
}

export async function sendFormSubmissionEmail(data: FormSubmissionEmailData) {
  // DEBUG: Log email sending attempt
  console.log('📧 [FORM EMAIL DEBUG] sendFormSubmissionEmail called with:', {
    recipients: data.recipients,
    formName: data.formName,
    formId: data.formId,
    submissionCount: data.submissionData.length,
    domain: data.domain,
    websiteId: data.websiteId,
    submitterName: data.submitterName,
    submitterEmail: data.submitterEmail,
    resendApiKey: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
    fromEmail: process.env.FROM_EMAIL,
    hasWebsiteBranding: !!data.websiteBranding,
  });

  // Fetch calendar branding (as fallback)
  const branding = await getCalendarBranding(data.domain);

  // Use website branding if provided, otherwise fall back to calendar branding
  const primaryColor = data.websiteBranding?.primaryColor || branding?.primaryColor || '#4F46E5';
  const companyName = data.companyName || branding?.companyName || data.domain;

  // Format submission date
  const submittedDate = new Date(data.submittedAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  });

  // Build submission data table
  let submissionTable = '';
  data.submissionData.forEach((field) => {
    // Skip email confirmation settings fields
    if (field.fieldId.includes('email_confirmation_')) {
      return;
    }

    submissionTable += `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: #374151;">
          ${field.fieldLabel}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
          ${field.value || '<em style="color: #9ca3af;">No value provided</em>'}
        </td>
      </tr>
    `;
  });

  // Build content with conditional email confirmation section
  let emailConfirmationSection = '';
  if (data.emailConfirmationTitle || data.emailConfirmationSubtitle || data.emailConfirmationMessage) {
    emailConfirmationSection = `
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px;">
          ${data.emailConfirmationTitle || 'Email Confirmation'}
        </h3>
        ${data.emailConfirmationSubtitle ? `<p style="margin: 0 0 10px 0; color: #047857;">${data.emailConfirmationSubtitle}</p>` : ''}
        ${data.emailConfirmationMessage ? `<p style="margin: 0; color: #065f46;">${data.emailConfirmationMessage}</p>` : ''}
      </div>
    `;
  }

  const content = `
    <h2 style="color: #333; margin-top: 0;">New Form Submission: ${data.formName}</h2>

    <p>A new form submission has been received on your website.</p>

    ${data.submitterName ? `<p><strong>Submitted by:</strong> ${data.submitterName}</p>` : ''}
    ${data.submitterEmail ? `<p><strong>Email:</strong> <a href="mailto:${data.submitterEmail}" style="color: ${primaryColor}; text-decoration: none;">${data.submitterEmail}</a></p>` : ''}

    <p><strong>Submitted at:</strong> ${submittedDate}</p>

    ${emailConfirmationSection}

    <h3 style="color: #333; margin-top: 30px;">Form Data:</h3>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: ${primaryColor}; color: white;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${primaryColor};">
            Field
          </th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${primaryColor};">
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        ${submissionTable}
      </tbody>
    </table>

    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

    <p>Best regards,<br>The ${companyName} Team</p>
  `;

  try {
    // Send to each recipient individually for better tracking
    const results = [];

    for (const recipient of data.recipients) {
      const emailPayload = {
        from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
        to: [recipient],
        subject: `New Form Submission: ${data.formName}`,
        html: generateEmailTemplate(content, branding, data.domain, data.websiteBranding, data.companyName),
      };

      console.log('📧 [FORM EMAIL DEBUG] Sending to recipient:', recipient);

      // Use fetch to send email via Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      console.log('📧 [FORM EMAIL DEBUG] Resend API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('📧 [FORM EMAIL ERROR] Resend API error:', errorData);
        console.error('📧 [FORM EMAIL ERROR] Full response:', {
          status: response.status,
          statusText: response.statusText,
        });
        results.push({ recipient, success: false, error: errorData });
      } else {
        const result = await response.json();
        console.log('📧 [FORM EMAIL DEBUG] Email sent successfully to', recipient, ':', result);
        results.push({ recipient, success: true, messageId: result.id });
      }
    }

    // Check if all emails were sent successfully
    const allSuccess = results.every(r => r.success);
    if (!allSuccess) {
      console.error('📧 [FORM EMAIL ERROR] Some emails failed:', results);
      throw new Error(`Failed to send form submission emails to some recipients: ${JSON.stringify(results)}`);
    }

    return { success: true, messageId: results[0]?.messageId };
  } catch (error) {
    console.error('📧 [FORM EMAIL ERROR] Email sending error:', error);
    if (error instanceof Error) {
      console.error('📧 [FORM EMAIL ERROR] Error message:', error.message);
      console.error('📧 [FORM EMAIL ERROR] Error stack:', error.stack);
    }
    throw new Error('Failed to send form submission email');
  }
}

export async function sendFileShareEmail(data: FileShareEmailData) {
  console.log('📧 [FILE SHARE EMAIL] Sending file/folder share notification:', {
    recipientEmail: data.recipientEmail,
    recipientName: data.recipientName,
    sharerName: data.sharerName,
    sharerEmail: data.sharerEmail,
    itemType: data.itemType,
    itemName: data.itemName,
    permission: data.permission,
    domain: data.domain,
    hasCompanyBranding: !!data.companyBranding,
    companyName: data.companyName,
  });

  // Fetch calendar branding as fallback
  const branding = await getCalendarBranding(data.domain);

  // Convert company branding to website branding format for the template function
  const websiteBranding = data.companyBranding ? {
    primaryColor: data.companyBranding.primaryColor,
    logoUrl: data.companyBranding.logoUrl,
    logoType: data.companyBranding.logoType,
    logoText: data.companyBranding.logoText,
    logoTextColor: data.companyBranding.logoTextColor,
  } : undefined;

  // Use company branding if provided, otherwise fall back to calendar branding
  const primaryColor = data.companyBranding?.primaryColor || branding?.primaryColor || '#3b82f6';
  const companyName = data.companyName || branding?.companyName || data.domain;

  // Build permission description
  let permissionDesc = '';
  switch (data.permission) {
    case 'view':
      permissionDesc = 'You can only view this item.';
      break;
    case 'edit':
      permissionDesc = 'You can view and edit this item.';
      break;
    case 'read-write':
      permissionDesc = 'You have full access to view, edit, and manage this item.';
      break;
  }

  const content = `
    <h2 style="color: #333; margin-top: 0;">${data.itemType === 'file' ? 'File' : 'Folder'} Shared with You</h2>

    <p><strong>${data.sharerName}</strong> (${data.sharerEmail}) has shared a ${data.itemType} with you:</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px;"><strong>Item:</strong></p>
      <p style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 600;">${data.itemName}</p>

      <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px;"><strong>Access Level:</strong></p>
      <p style="margin: 0; color: #1e293b; font-size: 14px;">${permissionDesc}</p>
    </div>

    ${data.message ? `
      <div style="margin: 20px 0;">
        <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px;"><strong>Message from ${data.sharerName}:</strong></p>
        <p style="margin: 0; color: #4b5563; font-style: italic;">"${data.message}"</p>
      </div>
    ` : ''}

    ${data.accessUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.accessUrl}" style="background: ${primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
          Access ${data.itemType === 'file' ? 'File' : 'Folder'}
        </a>
      </div>

      <p style="text-align: center; margin: 10px 0;">or visit the file manager to view all shared items</p>
    ` : `
      <p style="text-align: center; margin: 30px 0; color: #64748b; font-size: 14px;">
        You can access this item from the File Manager section.
      </p>
    `}

    <div style="background: #e0f2fe; border: 1px solid #bae6fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #075985;">
        <strong>Access Information:</strong> This ${data.itemType} is hosted on ${companyName}'s secure file storage system.
      </p>
    </div>

    <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>

    <p>Best regards,<br>The ${companyName} Team</p>
  `;

  try {
    const emailPayload = {
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: [data.recipientEmail],
      subject: `${data.itemType === 'file' ? 'File' : 'Folder'} Shared: ${data.itemName}`,
      html: generateEmailTemplate(content, branding, data.domain, websiteBranding, companyName),
    };

    console.log('📧 [FILE SHARE EMAIL] Sending email with payload:', JSON.stringify(emailPayload, null, 2));

    // Use fetch to send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 [FILE SHARE EMAIL] Resend API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('📧 [FILE SHARE EMAIL ERROR] Resend API error:', errorData);
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📧 [FILE SHARE EMAIL] Email sent successfully:', result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('📧 [FILE SHARE EMAIL ERROR] Email sending error:', error);
    if (error instanceof Error) {
      console.error('📧 [FILE SHARE EMAIL ERROR] Error message:', error.message);
      console.error('📧 [FILE SHARE EMAIL ERROR] Error stack:', error.stack);
    }
    throw new Error('Failed to send file share notification email');
  }
}

export interface ThankYouEmailData {
  to: string;
  subject: string;
  message: string;
  submitterName?: string;
  domain: string;
  websiteBranding?: WebsiteBranding;
  companyName?: string;
}

export async function sendThankYouEmail(data: ThankYouEmailData) {
  console.log('📧 [THANK YOU EMAIL] Sending thank you email:', {
    to: data.to,
    subject: data.subject,
    domain: data.domain,
    hasWebsiteBranding: !!data.websiteBranding,
    companyName: data.companyName,
  });

  // Fetch calendar branding as fallback
  const branding = await getCalendarBranding(data.domain);

  // Use website branding if provided
  const primaryColor = data.websiteBranding?.primaryColor || branding?.primaryColor || '#4F46E5';
  const companyName = data.companyName || branding?.companyName || data.domain;

  const greeting = data.submitterName ? `Hello ${data.submitterName}!` : 'Hello!';

  const content = `
    <h2 style="color: #333; margin-top: 0;">${greeting}</h2>

    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46; font-size: 16px; line-height: 1.6;">
        ${data.message}
      </p>
    </div>

    <p>We appreciate you taking the time to reach out to us. Our team will review your message and get back to you as soon as possible.</p>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #4b5563; font-size: 14px;">
        <strong>What happens next?</strong><br>
        One of our team members will review your submission and respond within 1-2 business days.
      </p>
    </div>

    <p>In the meantime, feel free to explore our website for more information about our services.</p>

    <p>Best regards,<br>The ${companyName} Team</p>
  `;

  try {
    const emailPayload = {
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: [data.to],
      subject: data.subject,
      html: generateEmailTemplate(content, branding, data.domain, data.websiteBranding, data.companyName),
    };

    console.log('📧 [THANK YOU EMAIL] Sending email with payload:', JSON.stringify({
      ...emailPayload,
      html: '[HTML content]'
    }, null, 2));

    // Use fetch to send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 [THANK YOU EMAIL] Resend API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('📧 [THANK YOU EMAIL ERROR] Resend API error:', errorData);
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📧 [THANK YOU EMAIL] Email sent successfully:', result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('📧 [THANK YOU EMAIL ERROR] Email sending error:', error);
    if (error instanceof Error) {
      console.error('📧 [THANK YOU EMAIL ERROR] Error message:', error.message);
      console.error('📧 [THANK YOU EMAIL ERROR] Error stack:', error.stack);
    }
    throw new Error('Failed to send thank you email');
  }
}

export interface OrderConfirmationEmailData {
  to: string;
  customerName: string;
  orderNumber: string;
  orderTotal: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  shippingAddress?: string;
  shippingMethod?: string;
  domain: string;
  websiteBranding?: WebsiteBranding;
  companyName?: string;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData) {
  console.log('📧 [ORDER CONFIRMATION EMAIL] Sending order confirmation:', {
    to: data.to,
    orderNumber: data.orderNumber,
    domain: data.domain,
  });

  const branding = await getCalendarBranding(data.domain);
  const primaryColor = data.websiteBranding?.primaryColor || branding?.primaryColor || '#4F46E5';
  const companyName = data.companyName || branding?.companyName || data.domain;

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #374151;">${item.description}</p>
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; color: #374151;">${item.quantity}</p>
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <p style="margin: 0; color: #374151;">R${item.unitPrice.toFixed(2)}</p>
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <p style="margin: 0; color: #374151; font-weight: 600;">R${item.total.toFixed(2)}</p>
      </td>
    </tr>
  `).join('');

  const content = `
    <h2 style="color: #333; margin-top: 0;">Thank you for your order!</h2>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
      Dear ${data.customerName},<br><br>
      Thank you for your order. We have received your payment and your order is being processed.
    </p>

    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Order Number</p>
      <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${primaryColor};">${data.orderNumber}</p>
    </div>

    <h3 style="color: #333; margin-top: 24px; margin-bottom: 12px;">Order Details</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background: ${primaryColor};">
          <th style="padding: 12px 8px; text-align: left; color: white; font-weight: 600;">Item</th>
          <th style="padding: 12px 8px; text-align: center; color: white; font-weight: 600;">Qty</th>
          <th style="padding: 12px 8px; text-align: right; color: white; font-weight: 600;">Price</th>
          <th style="padding: 12px 8px; text-align: right; color: white; font-weight: 600;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Order Total</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: 700; font-size: 18px; color: ${primaryColor};">R${data.orderTotal.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    ${data.shippingAddress ? `
    <h3 style="color: #333; margin-top: 24px; margin-bottom: 12px;">Shipping Address</h3>
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
      ${data.shippingAddress}
    </p>
    ` : ''}

    ${data.shippingMethod ? `
    <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
      <strong>Shipping Method:</strong> ${data.shippingMethod}
    </p>
    ` : ''}

    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0; color: #065f46; font-size: 16px; line-height: 1.6;">
        You will receive a notification when your order is shipped.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
      If you have any questions about your order, please contact us.
    </p>

    <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
      Best regards,<br>The ${companyName} Team
    </p>
  `;

  try {
    const emailPayload = {
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: [data.to],
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: generateEmailTemplate(content, branding, data.domain, data.websiteBranding, companyName),
    };

    console.log('📧 [ORDER CONFIRMATION EMAIL] Sending email with payload:', JSON.stringify(emailPayload, null, 2));

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 [ORDER CONFIRMATION EMAIL] Resend API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('📧 [ORDER CONFIRMATION EMAIL ERROR] Resend API error:', errorData);
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📧 [ORDER CONFIRMATION EMAIL] Email sent successfully:', result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('📧 [ORDER CONFIRMATION EMAIL ERROR] Email sending error:', error);
    if (error instanceof Error) {
      console.error('📧 [ORDER CONFIRMATION EMAIL ERROR] Error message:', error.message);
    }
    throw new Error('Failed to send order confirmation email');
  }
}

export interface AdminOrderNotificationData {
  to: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderTotal: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  shippingAddress?: string;
  shippingMethod?: string;
  domain: string;
  websiteBranding?: WebsiteBranding;
  companyName?: string;
}

export async function sendAdminOrderNotification(data: AdminOrderNotificationData) {
  console.log('📧 [ADMIN ORDER NOTIFICATION] Sending admin notification:', {
    to: data.to,
    orderNumber: data.orderNumber,
    customerEmail: data.customerEmail,
  });

  const branding = await getCalendarBranding(data.domain);
  const primaryColor = data.websiteBranding?.primaryColor || branding?.primaryColor || '#4F46E5';
  const companyName = data.companyName || branding?.companyName || data.domain;

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #374151;">${item.description}</p>
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; color: #374151;">${item.quantity}</p>
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <p style="margin: 0; color: #374151;">R${item.unitPrice.toFixed(2)}</p>
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <p style="margin: 0; color: #374151; font-weight: 600;">R${item.total.toFixed(2)}</p>
      </td>
    </tr>
  `).join('');

  const content = `
    <h2 style="color: #333; margin-top: 0;">🔔 New Order Received!</h2>
    
    <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.6;">
        A new order has been placed on your store. Please process it as soon as possible.
      </p>
    </div>

    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Order Number</p>
      <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${primaryColor};">${data.orderNumber}</p>
    </div>

    <h3 style="color: #333; margin-top: 24px; margin-bottom: 12px;">Customer Details</h3>
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
      <strong>Name:</strong> ${data.customerName}<br>
      <strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: ${primaryColor}; text-decoration: none;">${data.customerEmail}</a>
    </p>

    <h3 style="color: #333; margin-top: 24px; margin-bottom: 12px;">Order Details</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background: ${primaryColor};">
          <th style="padding: 12px 8px; text-align: left; color: white; font-weight: 600;">Item</th>
          <th style="padding: 12px 8px; text-align: center; color: white; font-weight: 600;">Qty</th>
          <th style="padding: 12px 8px; text-align: right; color: white; font-weight: 600;">Price</th>
          <th style="padding: 12px 8px; text-align: right; color: white; font-weight: 600;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Order Total</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: 700; font-size: 18px; color: ${primaryColor};">R${data.orderTotal.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    ${data.shippingAddress ? `
    <h3 style="color: #333; margin-top: 24px; margin-bottom: 12px;">Shipping Address</h3>
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
      ${data.shippingAddress}
    </p>
    ` : ''}

    ${data.shippingMethod ? `
    <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
      <strong>Shipping Method:</strong> ${data.shippingMethod}
    </p>
    ` : ''}

    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-top: 24px;">
      Please log in to your admin dashboard to process this order.
    </p>
  `;

  try {
    const emailPayload = {
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: [data.to],
      subject: `🔔 New Order #${data.orderNumber} - ${companyName}`,
      html: generateEmailTemplate(content, branding, data.domain, data.websiteBranding, companyName),
    };

    console.log('📧 [ADMIN ORDER NOTIFICATION] Sending email to:', data.to);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 [ADMIN ORDER NOTIFICATION] Resend API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('📧 [ADMIN ORDER NOTIFICATION ERROR] Resend API error:', errorData);
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📧 [ADMIN ORDER NOTIFICATION] Email sent successfully:', result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('📧 [ADMIN ORDER NOTIFICATION ERROR] Email sending error:', error);
    if (error instanceof Error) {
      console.error('📧 [ADMIN ORDER NOTIFICATION ERROR] Error message:', error.message);
    }
    throw new Error('Failed to send admin order notification email');
  }
}

export interface InvoiceEmailData {
  to: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  total: number;
  dueDate: string;
  issueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  status: string;
  notes?: string;
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
  pdfUrl?: string;
  paymentUrl?: string;
  paymentLink?: string;
  showBankingDetails?: boolean;
  currency?: {
    code?: string;
    symbol?: string;
    symbolPosition?: 'before' | 'after';
  };
  bankingDetails?: {
    bankName?: string;
    branchCode?: string;
    accountType?: string;
    accountNumber?: string;
    accountHolder?: string;
    swiftCode?: string;
  };
  template?: 'default' | 'modern';
}

function formatMoney(value: number, currency?: { code?: string; symbol?: string; symbolPosition?: 'before' | 'after' }): string {
  const code = currency?.code || 'ZAR';
  const symbol = currency?.symbol || (code === 'ZAR' ? 'R' : code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : code);
  const position = currency?.symbolPosition || 'before';
  const formatted = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  if (position === 'after') {
    return value.toFixed(2) + ' ' + symbol;
  }
  return formatted;
}

export async function sendInvoiceEmail(data: InvoiceEmailData) {
  console.log('📧 [INVOICE EMAIL] Sending invoice email to:', data.to);

  const primaryColor = data.branding?.primaryColor || '#4F46E5';
  const logoUrl = data.branding?.logoUrl;
  const showTax = (data.taxRate || 0) > 0 && (data.taxAmount || 0) > 0;
  const money = (v: number) => formatMoney(v, data.currency);
  const isModern = data.template === 'modern';

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
        ${item.description}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #4b5563;">
        ${money(item.unitPrice)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500; color: #111827;">
        ${money(item.total)}
      </td>
    </tr>
  `).join('');

  const statusColor = data.status === 'paid' ? '#059669' : data.status === 'sent' ? '#2563eb' : data.status === 'overdue' ? '#dc2626' : '#6b7280';
  const statusLabel = data.status.charAt(0).toUpperCase() + data.status.slice(1);

  const banking = data.showBankingDetails === false ? null : data.bankingDetails;
  const hasBanking = banking && (banking.bankName || banking.accountNumber || banking.branchCode || banking.accountHolder);
  const payNowUrl = data.paymentLink && data.paymentLink.trim() !== '' ? data.paymentLink : data.paymentUrl;

  const content = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${logoUrl ? `<img src="${logoUrl}" alt="${data.companyName}" style="max-height: 60px; margin-bottom: 20px;">` : `<h1 style="color: ${primaryColor}; margin: 0 0 20px 0;">${data.companyName}</h1>`}

      <h2 style="color: #111827; margin: 0 0 10px 0;">Invoice ${data.invoiceNumber}</h2>

      <p style="color: #6b7280; margin: 0 0 20px 0;">
        Dear ${data.clientName}${data.clientCompany ? ` (${data.clientCompany})` : ''},
      </p>

      <p style="color: #4b5563;">
        Please find your invoice below. You can view and pay this invoice online by clicking the button below.
      </p>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Status</td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">
                ${statusLabel}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Issue Date</td>
            <td style="padding: 8px 0; text-align: right; color: #111827;">${data.issueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Due Date</td>
            <td style="padding: 8px 0; text-align: right; color: #111827;">${data.dueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 18px; font-weight: 600;">Total Amount</td>
            <td style="padding: 8px 0; text-align: right; font-size: 24px; font-weight: 700; color: ${primaryColor};">${money(data.total)}</td>
          </tr>
        </table>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: ${isModern ? primaryColor : '#0f172a'}; color: white;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${isModern ? primaryColor : '#0f172a'};">Description</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${isModern ? primaryColor : '#0f172a'};">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid ${isModern ? primaryColor : '#0f172a'};">Unit Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid ${isModern ? primaryColor : '#0f172a'};">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="text-align: right; padding: 8px 0; color: #6b7280;">Subtotal</td>
          <td style="text-align: right; padding: 8px 0; color: #111827; width: 100px;">${money(data.subtotal)}</td>
        </tr>
        ${showTax ? `
        <tr>
          <td style="text-align: right; padding: 8px 0; color: #6b7280;">Tax (${data.taxRate}%)</td>
          <td style="text-align: right; padding: 8px 0; color: #111827;">${money(data.taxAmount)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="text-align: right; padding: 12px 0; font-size: 18px; font-weight: 600; color: #111827;">Total</td>
          <td style="text-align: right; padding: 12px 0; font-size: 24px; font-weight: 700; color: ${primaryColor};">${money(data.total)}</td>
        </tr>
      </table>

      ${hasBanking ? `
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: ${primaryColor}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0; font-weight: 700;">Banking Details</p>
        <table style="width: 100%; font-size: 13px;">
          ${banking!.accountHolder ? `<tr><td style="padding: 4px 0; color: #6b7280;">Account Holder</td><td style="padding: 4px 0; color: #111827; font-weight: 500; text-align: right;">${banking!.accountHolder}</td></tr>` : ''}
          ${banking!.bankName ? `<tr><td style="padding: 4px 0; color: #6b7280;">Bank</td><td style="padding: 4px 0; color: #111827; font-weight: 500; text-align: right;">${banking!.bankName}</td></tr>` : ''}
          ${banking!.accountType ? `<tr><td style="padding: 4px 0; color: #6b7280;">Account Type</td><td style="padding: 4px 0; color: #111827; font-weight: 500; text-align: right; text-transform: capitalize;">${banking!.accountType}</td></tr>` : ''}
          ${banking!.accountNumber ? `<tr><td style="padding: 4px 0; color: #6b7280;">Account Number</td><td style="padding: 4px 0; color: #111827; font-weight: 500; text-align: right; font-family: monospace;">${banking!.accountNumber}</td></tr>` : ''}
          ${banking!.branchCode ? `<tr><td style="padding: 4px 0; color: #6b7280;">Branch Code</td><td style="padding: 4px 0; color: #111827; font-weight: 500; text-align: right; font-family: monospace;">${banking!.branchCode}</td></tr>` : ''}
          ${banking!.swiftCode ? `<tr><td style="padding: 4px 0; color: #6b7280;">SWIFT / BIC</td><td style="padding: 4px 0; color: #111827; font-weight: 500; text-align: right; font-family: monospace;">${banking!.swiftCode}</td></tr>` : ''}
        </table>
      </div>
      ` : ''}

      ${data.notes ? `
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #6b7280; margin: 0;"><strong>Notes:</strong> ${data.notes}</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        ${payNowUrl ? `
        <a href="${payNowUrl}" style="display: inline-block; background: ${primaryColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Pay Now
        </a>
        ` : ''}
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          If you have any questions about this invoice, please contact us.
          ${data.companyEmail ? `<br>Email: <a href="mailto:${data.companyEmail}" style="color: ${primaryColor};">${data.companyEmail}</a>` : ''}
          ${data.companyPhone ? `<br>Phone: ${data.companyPhone}` : ''}
        </p>
      </div>
    </div>
  `;

  const emailPayload = {
    from: process.env.FROM_EMAIL || 'noreply@refreshcrm.co.za',
    to: data.to,
    subject: `Invoice ${data.invoiceNumber} from ${data.companyName} - ${money(data.total)}`,
    html: generateRefreshTechEmailTemplate(content, primaryColor, '#1f2937'),
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to send email: ${response.status} ${errorData}`);
    }

    const result = await response.json();
    console.log('📧 [INVOICE EMAIL] Email sent successfully:', result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('📧 [INVOICE EMAIL ERROR] Email sending error:', error);
    throw new Error('Failed to send invoice email');
  }
}

// Generic sendEmail function used by FA API routes (booking, inquiry, alert, contact emails)
export async function sendEmail(data: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; id?: string; error?: string; actualRecipient?: string }> {
  const fromEmail = data.from || process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'RefreshTech <no-reply@online-site.co.za>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [data.to],
        subject: data.subject,
        html: data.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[sendEmail] Failed:', response.status, errorData);
      return { success: false, error: `Failed to send email: ${response.status} ${errorData}` };
    }

    const result = await response.json();
    return { success: true, id: result.id, actualRecipient: data.to };
  } catch (error) {
    console.error('[sendEmail] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
