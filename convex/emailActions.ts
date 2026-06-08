import { action } from "./_generated/server";
import { v } from "convex/values";
import { sendVerificationEmail, sendPasswordResetEmail, sendFormSubmissionEmail, sendFileShareEmail, sendThankYouEmail } from "../lib/email";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Email action for sending verification emails
export const sendVerificationEmailAction = action({
  args: {
    email: v.string(),
    firstName: v.string(),
    verificationToken: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Use the branded email function from lib/email.ts
      const result = await sendVerificationEmail({
        email: args.email,
        firstName: args.firstName,
        verificationToken: args.verificationToken,
        domain: args.domain,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        message: 'Verification email sent successfully',
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error(`Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Email action for sending password reset emails
export const sendPasswordResetEmailAction = action({
  args: {
    email: v.string(),
    firstName: v.string(),
    resetToken: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Use the branded email function from lib/email.ts
      const result = await sendPasswordResetEmail({
        email: args.email,
        firstName: args.firstName,
        resetToken: args.resetToken,
        domain: args.domain,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        message: 'Password reset email sent successfully',
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error(`Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Email action for sending form submission emails to recipients
export const sendFormSubmissionEmailAction = action({
  args: {
    recipients: v.array(v.string()),
    formName: v.string(),
    formId: v.optional(v.string()), // Optional for contact forms
    submissionData: v.array(v.object({
      fieldId: v.string(),
      fieldLabel: v.string(),
      value: v.string(),
    })),
    domain: v.string(),
    websiteId: v.id("websites"),
    submitterName: v.optional(v.string()),
    submitterEmail: v.optional(v.string()),
    submittedAt: v.number(),
    // Optional: email confirmation settings if the form has an email confirmation field
    emailConfirmationTitle: v.optional(v.string()),
    emailConfirmationSubtitle: v.optional(v.string()),
    emailConfirmationMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch website branding for professional email templates
      // Note: In email action context, we don't have userId, so we use public queries
      const website = await ctx.runQuery(api.websites.getWebsiteByIdPublic, {
        websiteId: args.websiteId,
      });

      let websiteBranding = undefined;
      let companyName = undefined;

      if (website) {
        websiteBranding = website.branding;
        // Get company name using public query
        const company = await ctx.runQuery(api.companies.getByCompanyIdPublic, {
          companyId: website.companyId,
        });
        companyName = company?.name || website.name;
      }

      // Use the form submission email function from lib/email.ts
      const result = await sendFormSubmissionEmail({
        recipients: args.recipients,
        formName: args.formName,
        formId: args.formId,
        submissionData: args.submissionData,
        domain: args.domain,
        websiteId: args.websiteId,
        submitterName: args.submitterName,
        submitterEmail: args.submitterEmail,
        submittedAt: args.submittedAt,
        emailConfirmationTitle: args.emailConfirmationTitle,
        emailConfirmationSubtitle: args.emailConfirmationSubtitle,
        emailConfirmationMessage: args.emailConfirmationMessage,
        websiteBranding,
        companyName,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        message: 'Form submission email sent successfully',
      };
    } catch (error) {
      console.error('Form submission email sending error:', error);
      throw new Error(`Failed to send form submission email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Email action for sending file/folder share emails
export const sendFileShareEmailAction = action({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    sharerName: v.string(),
    sharerEmail: v.string(),
    itemType: v.string(),
    itemName: v.string(),
    permission: v.string(),
    domain: v.string(),
    accessUrl: v.optional(v.string()),
    message: v.optional(v.string()),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch company branding
      const company = await ctx.runQuery(api.companies.getByCompanyIdPublic, {
        companyId: args.companyId,
      });

      let companyBranding = undefined;
      let companyName = undefined;

      if (company) {
        companyBranding = company.branding;
        companyName = company.name;
      }

      const result = await sendFileShareEmail({
        recipientEmail: args.recipientEmail,
        recipientName: args.recipientName,
        sharerName: args.sharerName,
        sharerEmail: args.sharerEmail,
        itemType: args.itemType as 'file' | 'folder',
        itemName: args.itemName,
        permission: args.permission as 'view' | 'edit' | 'read-write',
        domain: args.domain,
        accessUrl: args.accessUrl,
        message: args.message,
        companyBranding: companyBranding,
        companyName: companyName,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        message: 'File share email sent successfully',
      };
    } catch (error) {
      console.error('File share email sending error:', error);
      throw new Error(`Failed to send file share email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Email action for sending thank you emails to form submitters
export const sendThankYouEmailAction = action({
  args: {
    to: v.string(),
    subject: v.string(),
    message: v.string(),
    submitterName: v.optional(v.string()),
    domain: v.string(),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch website branding for professional email templates
      const website = await ctx.runQuery(api.websites.getWebsiteByIdPublic, {
        websiteId: args.websiteId,
      });

      let websiteBranding = undefined;
      let companyName = undefined;

      if (website) {
        websiteBranding = website.branding;
        // Get company name using public query
        const company = await ctx.runQuery(api.companies.getByCompanyIdPublic, {
          companyId: website.companyId,
        });
        companyName = company?.name || website.name;
      }

      const result = await sendThankYouEmail({
        to: args.to,
        subject: args.subject,
        message: args.message,
        submitterName: args.submitterName,
        domain: args.domain,
        websiteBranding,
        companyName,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        message: 'Thank you email sent successfully',
      };
    } catch (error) {
      console.error('Thank you email sending error:', error);
      throw new Error(`Failed to send thank you email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Action for sending client welcome/verification emails
export const sendClientEmailAction = action({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log('📧 [CLIENT EMAIL ACTION] Sending to:', args.to);
      console.log('📧 [CLIENT EMAIL ACTION] Subject:', args.subject);
      console.log('📧 [CLIENT EMAIL ACTION] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
      console.log('📧 [CLIENT EMAIL ACTION] FROM_EMAIL:', process.env.FROM_EMAIL);
      
      const emailPayload = {
        from: process.env.FROM_EMAIL || 'noreply@refreshcrm.co.za',
        to: args.to,
        subject: args.subject,
        html: args.html,
      };

      console.log('📧 [CLIENT EMAIL ACTION] Payload:', JSON.stringify(emailPayload, null, 2));
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      console.log('📧 [CLIENT EMAIL ACTION] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📧 [CLIENT EMAIL ACTION] Error:', errorText);
        throw new Error(`Failed to send email: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📧 [CLIENT EMAIL ACTION] Success! Message ID:', result.id);
      
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error('📧 [CLIENT EMAIL ACTION] Failed:', error);
      throw error;
    }
  },
});

// Action to hash password (for use in mutations since mutations can't use bcrypt)
export const hashPasswordAction = action({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const bcrypt = await import("bcryptjs");
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(args.password, saltRounds);
      return { passwordHash };
    } catch (error) {
      console.error('Failed to hash password:', error);
      throw new Error("Failed to hash password");
    }
  },
});
