import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getPlatformDomain } from './domainUtils';

function generateSecureToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateCompanyBrandedEmail(content: string, primaryColor: string, companyName: string, branding?: { logoUrl?: string; logoType?: string; logoText?: string; logoTextColor?: string }) {
  let logoSection = '';
  if (branding?.logoType === 'image' && branding.logoUrl) {
    logoSection = `<img src="${branding.logoUrl}" alt="${companyName}" style="max-height: 60px; max-width: 200px; object-fit: contain; margin-bottom: 10px;">`;
  } else if (branding?.logoType === 'text' && branding.logoText) {
    logoSection = `<div style="font-size: 28px; font-weight: bold; color: ${branding.logoTextColor || primaryColor}; font-family: Arial, sans-serif; margin: 0;">${branding.logoText}</div>`;
  } else {
    logoSection = `<div style="font-size: 28px; font-weight: bold; color: ${primaryColor}; font-family: Arial, sans-serif; margin: 0;">${companyName}</div>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${companyName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: white; padding: 30px 20px; text-align: center; border-bottom: 4px solid ${primaryColor};">
          ${logoSection}
        </div>
        <div style="padding: 30px;">
          ${content}
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            This email was sent by ${companyName}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export const inviteMemberAction = action({
  args: {
    inviterUserId: v.id("users"),
    companyId: v.id("companies"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    contactNumber: v.string(),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    role: v.optional(v.string()),
    cardPermissions: v.optional(v.record(v.string(), v.string())),
    sendWelcomeEmail: v.boolean(),
    requireEmailVerification: v.boolean(),
    requirePasswordChange: v.boolean(),
  },
  handler: async (ctx: any, args: any) => {
    const password = generateRandomPassword();
    const bcrypt = await import("bcryptjs");
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result: any = await ctx.runMutation(api.teamMembers.inviteMemberMutation, {
      inviterUserId: args.inviterUserId,
      companyId: args.companyId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      contactNumber: args.contactNumber,
      passwordHash,
      plainPassword: password,
      department: args.department,
      position: args.position,
      role: args.role,
      cardPermissions: args.cardPermissions,
      sendWelcomeEmail: args.sendWelcomeEmail,
      requireEmailVerification: args.requireEmailVerification,
      requirePasswordChange: args.requirePasswordChange,
    });

    if (args.sendWelcomeEmail && result?.userCreated) {
      try {
        const company: any = await ctx.runQuery(api.companies.getById, { companyId: args.companyId });
        if (company) {
          const domain = company.subdomain || company.customDomain || getPlatformDomain();
          const primaryColor = company.branding?.primaryColor || '#308a29';

          const welcomeContent = `
            <h2 style="color: #333; margin-top: 0;">Hello ${args.firstName}!</h2>
            <p>You've been added as a team member at ${company.name}.</p>
            <p><strong>Your login credentials:</strong></p>
            <p>Email: ${args.email}</p>
            <p>Password: ${password}</p>
            <p>Login URL: https://${domain}/auth/login</p>
            ${args.requirePasswordChange ? '<p style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;"><strong>Important:</strong> You will be required to change your password upon first login.</p>' : ''}
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The ${company.name} Team</p>
          `;

          const html = generateCompanyBrandedEmail(welcomeContent, primaryColor, company.name, company.branding);

          await ctx.scheduler.runAfter(0, api.emailActions.sendClientEmailAction, {
            to: [args.email],
            subject: `Welcome to ${company.name}!`,
            html: html,
          });
        }
      } catch (emailError) {
        console.error('📧 [TEAM INVITE] Failed to schedule welcome email:', emailError);
      }
    }

    if (args.requireEmailVerification && result?.userCreated) {
      try {
        const company: any = await ctx.runQuery(api.companies.getById, { companyId: args.companyId });
        if (company) {
          const domain = company.subdomain || company.customDomain || getPlatformDomain();
          const primaryColor = company.branding?.primaryColor || '#308a29';
          const verificationToken = result.emailVerificationToken;
          const verificationUrl = `https://${domain}/auth/verify-email?token=${verificationToken}`;

          const verifyContent = `
            <h2 style="color: #333; margin-top: 0;">Hello ${args.firstName}!</h2>
            <p>Thank you for joining ${company.name}. To complete your registration and access the portal, please verify your email address.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: ${primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 14px;">
              ${verificationUrl}
            </p>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>Important:</strong> This verification link will expire in 24 hours.</p>
            </div>
            <p>If you didn't create an account with ${company.name}, please ignore this email.</p>
            <p>Best regards,<br>The ${company.name} Team</p>
          `;

          const html = generateCompanyBrandedEmail(verifyContent, primaryColor, company.name, company.branding);

          await ctx.scheduler.runAfter(0, api.emailActions.sendClientEmailAction, {
            to: [args.email],
            subject: `Verify your email for ${company.name}`,
            html: html,
          });
        }
      } catch (emailError) {
        console.error('📧 [TEAM INVITE] Failed to schedule verification email:', emailError);
      }
    }

    return { ...result, password };
  },
});