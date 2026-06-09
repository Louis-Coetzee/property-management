import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

const appUrl = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN 
  ? `https://${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN}` 
  : 'https://refreshcrm.vercel.app';

/**
 * Contact Form Submission
 */
export const submitContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const { name, email, phone, subject, message } = args;

    const contactRecordId = await ctx.db.insert("analytics", {
      eventType: "contact_form_submission",
      entityType: "contact_form",
      metadata: {
        formData: {
          name,
          email,
          phone: phone || "",
          subject,
          message,
        },
        contactEmail: email,
        contactPhone: phone || "",
      },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    await ctx.scheduler.runAfter(0, api.contact.sendClientConfirmationEmail, {
      contactRecordId,
      name,
      email,
      subject,
      message,
    });

    await ctx.scheduler.runAfter(0, api.contact.sendAdminNotificationEmail, {
      contactRecordId,
      name,
      email,
      phone: phone || "",
      subject,
      message,
    });

    return contactRecordId;
  },
});

/**
 * Send confirmation email to client
 */
export const sendClientConfirmationEmail = action({
  args: {
    contactRecordId: v.id("analytics"),
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const emailData = {
      to: args.email,
      subject: `Contact Form Received - ${args.subject}`,
      name: args.name,
      originalSubject: args.subject,
      originalMessage: args.message,
      isForClient: true,
    };

    try {
      const response = await fetch(`${appUrl}/api/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Contact-System'
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send client confirmation: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending client confirmation:', error);
      throw error;
    }
  },
});

/**
 * Send notification email to admin
 */
export const sendAdminNotificationEmail = action({
  args: {
    contactRecordId: v.id("analytics"),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const emailData = {
      to: process.env.ADMIN_EMAIL || 'louis@refreshtech.co.za',
      subject: `New Contact Form Submission - ${args.subject}`,
      name: args.name,
      email: args.email,
      phone: args.phone,
      originalSubject: args.subject,
      originalMessage: args.message,
      isForClient: false,
    };

    try {
      const response = await fetch(`${appUrl}/api/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Contact-System'
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send admin notification: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending admin notification:', error);
      throw error;
    }
  },
});
