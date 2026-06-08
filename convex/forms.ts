import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  validateUserCompanyAccess,
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";
// ============================================================================
// Form Queries
// ============================================================================

// Get all forms for a website
export const getFormsByWebsite = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Fetch website to get companyId for access validation
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has access to this company (at least member role)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const forms = await ctx.db
        .query("forms")
        .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
        .collect();

      const activeForms = forms.filter(f => f.isActive);
      return activeForms.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error fetching forms:", error);
      throw error;
    }
  },
});

// Get a form by ID
export const getFormById = query({
  args: {
        userId: v.id("users"),
    formId: v.id("forms"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const form = await ctx.db.get(args.formId);
      if (!form) {
        return null;
      }

      if (!form.isActive) {
        return null;
      }

      // Fetch website to get companyId for access validation
      const website = await ctx.db.get(form.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has access to this company (at least member role)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      return form;
    } catch (error) {
      console.error("Error fetching form:", error);
      throw error;
    }
  },
});

// Public query to get a form by ID without authentication
export const getFormByIdPublic = query({
  args: {
    formId: v.id("forms"),
  },
  handler: async (ctx, args) => {
    try {
      const form = await ctx.db.get(args.formId);
      if (!form) {
        return null;
      }

      if (!form.isActive) {
        return null;
      }

      return form;
    } catch (error) {
      console.error("Error fetching form (public):", error);
      throw error;
    }
  },
});

// Public query to get all forms for a website without authentication
export const getFormsByWebsitePublic = query({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const forms = await ctx.db
        .query("forms")
        .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
        .collect();

      const activeForms = forms.filter(f => f.isActive);
      return activeForms.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error fetching forms (public):", error);
      throw error;
    }
  },
});

// Get EasyQuotes configuration for a specific form
export const getEasyQuotesConfigForForm = query({
  args: {
        userId: v.id("users"),
    formId: v.id("forms"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const form = await ctx.db.get(args.formId);
      if (!form || !form.isActive) {
        return null;
      }

      // Get the website to check EasyQuotes integration
      const website = await ctx.db.get(form.websiteId);
      if (!website) {
        return null;
      }

      // Validate user has access to this company (at least member role)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const easyQuotesSetting = website.integrations?.easyQuotes;
      if (!easyQuotesSetting) {
        return null;
      }

      // Handle both old boolean format and new object format
      const isEnabled = typeof easyQuotesSetting === 'boolean'
        ? easyQuotesSetting
        : easyQuotesSetting?.enabled ?? false;

      if (!isEnabled) {
        return null;
      }

      // Check if this specific form is in the enabled forms list
      const formIds = typeof easyQuotesSetting === 'object' && easyQuotesSetting?.formIds
        ? easyQuotesSetting.formIds
        : [];

      if (!formIds.includes(args.formId)) {
        return null;
      }

      // Return the EasyQuotes configuration (excluding sensitive live credentials)
      const mode = typeof easyQuotesSetting === 'object' && easyQuotesSetting?.mode
        ? easyQuotesSetting.mode
        : 'test';

      // Indicate if live credentials are configured (without revealing them)
      const hasLiveCredentials = typeof easyQuotesSetting === 'object' &&
        easyQuotesSetting?.liveCredentials &&
        Object.keys(easyQuotesSetting.liveCredentials).length > 0;

      return {
        enabled: true,
        mode,
        hasLiveCredentials,
      };
    } catch (error) {
      console.error("Error fetching EasyQuotes config:", error);
      throw error;
    }
  },
});

// Get EasyQuotes configuration for a website (used for default vehicle inquiry form)
export const getEasyQuotesConfigForWebsite = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        return null;
      }

      // Validate user has access to this company (at least member role)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const easyQuotesSetting = website.integrations?.easyQuotes;
      if (!easyQuotesSetting) {
        return null;
      }

      // Handle both old boolean format and new object format
      const isEnabled = typeof easyQuotesSetting === 'boolean'
        ? easyQuotesSetting
        : easyQuotesSetting?.enabled ?? false;

      if (!isEnabled) {
        return null;
      }

      // Return the EasyQuotes configuration
      const mode = typeof easyQuotesSetting === 'object' && easyQuotesSetting?.mode
        ? easyQuotesSetting.mode
        : 'test';

      // Indicate if live credentials are configured (without revealing them)
      const hasLiveCredentials = typeof easyQuotesSetting === 'object' &&
        easyQuotesSetting?.liveCredentials &&
        Object.keys(easyQuotesSetting.liveCredentials).length > 0;

      return {
        enabled: true,
        mode,
        hasLiveCredentials,
      };
    } catch (error) {
      console.error("Error fetching EasyQuotes config for website:", error);
      throw error;
    }
  },
});

// Public: Get EasyQuotes configuration for a website (no auth required)
// Used for public vehicle inquiry forms
export const getEasyQuotesConfigForWebsitePublic = query({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        return null;
      }

      const easyQuotesSetting = website.integrations?.easyQuotes;
      if (!easyQuotesSetting) {
        return null;
      }

      // Handle both old boolean format and new object format
      const isEnabled = typeof easyQuotesSetting === 'boolean'
        ? easyQuotesSetting
        : easyQuotesSetting?.enabled ?? false;

      if (!isEnabled) {
        return null;
      }

      // Return the EasyQuotes configuration
      const mode = typeof easyQuotesSetting === 'object' && easyQuotesSetting?.mode
        ? easyQuotesSetting.mode
        : 'test';

      // Indicate if live credentials are configured (without revealing them)
      const hasLiveCredentials = typeof easyQuotesSetting === 'object' &&
        easyQuotesSetting?.liveCredentials &&
        Object.keys(easyQuotesSetting.liveCredentials).length > 0;

      return {
        enabled: true,
        mode,
        hasLiveCredentials,
      };
    } catch (error) {
      console.error("Error fetching EasyQuotes config for website:", error);
      return null;
    }
  },
});

// Get form submissions for a website
export const getFormSubmissionsByWebsite = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Fetch website to get companyId for access validation
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has access to this company (at least member role)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const submissions = await ctx.db
        .query("formSubmissions")
        .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
        .collect();

      const sortedSubmissions = submissions.sort((a, b) => b.submittedAt - a.submittedAt);

      if (args.limit) {
        return sortedSubmissions.slice(0, args.limit);
      }

      return sortedSubmissions;
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      throw error;
    }
  },
});

// Get form submissions for a specific form
export const getFormSubmissionsByForm = query({
  args: {
        userId: v.id("users"),
    formId: v.id("forms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const form = await ctx.db.get(args.formId);
      if (!form) {
        throw new Error("Form not found");
      }

      // Fetch website to get companyId for access validation
      const website = await ctx.db.get(form.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has access to this company (at least member role)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const submissions = await ctx.db
        .query("formSubmissions")
        .withIndex("by_form", (q) => q.eq("formId", args.formId))
        .collect();

      const sortedSubmissions = submissions.sort((a, b) => b.submittedAt - a.submittedAt);

      if (args.limit) {
        return sortedSubmissions.slice(0, args.limit);
      }

      return sortedSubmissions;
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      throw error;
    }
  },
});

// Get submission statistics for a website
export const getFormSubmissionStats = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Fetch website to get companyId for access validation
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has access to this company (at least member role)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const submissions = await ctx.db
        .query("formSubmissions")
        .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
        .collect();

      const totalSubmissions = submissions.length;
      const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
      const sentSubmissions = submissions.filter(s => s.status === 'sent').length;
      const failedSubmissions = submissions.filter(s => s.status === 'failed').length;

      return {
        total: totalSubmissions,
        pending: pendingSubmissions,
        sent: sentSubmissions,
        failed: failedSubmissions,
      };
    } catch (error) {
      console.error("Error fetching form submission stats:", error);
      throw error;
    }
  },
});

// ============================================================================
// Form Mutations
// ============================================================================

// Create a new form
export const createForm = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
    name: v.string(),
    description: v.optional(v.string()),
    fields: v.array(v.object({
      id: v.string(),
      label: v.string(),
      type: v.string(),
      placeholder: v.optional(v.string()),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
      validation: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        pattern: v.optional(v.string()),
      })),
    })),
    recipients: v.array(v.string()),
    submitButtonText: v.optional(v.string()),
    successMessage: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    themeColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Fetch website to get companyId for access validation
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has access to this company (at least member role to create)
      const { userCompany } = await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const now = Date.now();

      // Validate recipients
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const recipient of args.recipients) {
        if (!emailRegex.test(recipient)) {
          throw new Error(`Invalid email address: ${recipient}`);
        }
      }

      // Validate fields
      if (args.fields.length === 0) {
        throw new Error("Form must have at least one field");
      }

      const formId = await ctx.db.insert("forms", {
        websiteId: args.websiteId,
        name: args.name,
        description: args.description,
        fields: args.fields,
        recipients: args.recipients,
        submitButtonText: args.submitButtonText,
        successMessage: args.successMessage,
        errorMessage: args.errorMessage,
        themeColor: args.themeColor,
        isActive: true,
        createdBy: authUser.tokenIdentifier as any,
        createdAt: now,
        updatedAt: now,
      });

      console.log("Form created:", args.name);

      return formId;
    } catch (error) {
      console.error("Error creating form:", error);
      throw error;
    }
  },
});

// Update a form
export const updateForm = mutation({
  args: {
    userId: v.id("users"),
    formId: v.id("forms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    fields: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
      type: v.string(),
      placeholder: v.optional(v.string()),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
      validation: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        pattern: v.optional(v.string()),
      })),
    }))),
    recipients: v.optional(v.array(v.string())),
    submitButtonText: v.optional(v.string()),
    successMessage: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    themeColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const form = await ctx.db.get(args.formId);

      if (!form) {
        throw new Error("Form not found");
      }

      // Fetch website to get companyId for access validation
      const website = await ctx.db.get(form.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has access to this company (at least member role to update)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const now = Date.now();

      // Validate recipients if provided
      if (args.recipients) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const recipient of args.recipients) {
          if (!emailRegex.test(recipient)) {
            throw new Error(`Invalid email address: ${recipient}`);
          }
        }
      }

      // Validate fields if provided
      if (args.fields && args.fields.length === 0) {
        throw new Error("Form must have at least one field");
      }

      const updateData: any = {
        updatedAt: now,
        updatedBy: authUser.tokenIdentifier,
      };

      if (args.name !== undefined) updateData.name = args.name;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.fields !== undefined) updateData.fields = args.fields;
      if (args.recipients !== undefined) updateData.recipients = args.recipients;
      if (args.submitButtonText !== undefined) updateData.submitButtonText = args.submitButtonText;
      if (args.successMessage !== undefined) updateData.successMessage = args.successMessage;
      if (args.errorMessage !== undefined) updateData.errorMessage = args.errorMessage;
      if (args.themeColor !== undefined) updateData.themeColor = args.themeColor;

      await ctx.db.patch(args.formId, updateData);

      console.log("Form updated:", form.name);

      return { success: true };
    } catch (error) {
      console.error("Error updating form:", error);
      throw error;
    }
  },
});

// Delete a form (soft delete)
export const deleteForm = mutation({
  args: {
    userId: v.id("users"),
    formId: v.id("forms"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const form = await ctx.db.get(args.formId);

      if (!form) {
        throw new Error("Form not found");
      }

      // Fetch website to get companyId for access validation
      const website = await ctx.db.get(form.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has access to this company (admin role required to delete)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      const now = Date.now();

      await ctx.db.patch(args.formId, {
        isActive: false,
        updatedAt: now,
      });

      console.log("Form deleted:", form.name);

      return { success: true };
    } catch (error) {
      console.error("Error deleting form:", error);
      throw error;
    }
  },
});

// Duplicate a form
export const duplicateForm = mutation({
  args: {
    userId: v.id("users"),
    formId: v.id("forms"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const originalForm = await ctx.db.get(args.formId);

      if (!originalForm) {
        throw new Error("Form not found");
      }

      // Fetch website to get companyId for access validation
      const website = await ctx.db.get(originalForm.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has access to this company (at least member role to duplicate)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const now = Date.now();

      const newFormId = await ctx.db.insert("forms", {
        websiteId: originalForm.websiteId,
        name: `${originalForm.name} (Copy)`,
        description: originalForm.description,
        fields: originalForm.fields,
        recipients: originalForm.recipients,
        submitButtonText: originalForm.submitButtonText,
        successMessage: originalForm.successMessage,
        errorMessage: originalForm.errorMessage,
        themeColor: originalForm.themeColor,
        isActive: true,
        createdBy: authUser.tokenIdentifier as any,
        createdAt: now,
        updatedAt: now,
      });

      console.log("Form duplicated:", originalForm.name);

      return newFormId;
    } catch (error) {
      console.error("Error duplicating form:", error);
      throw error;
    }
  },
});

// ============================================================================
// Form Submission Mutations
// ============================================================================

// Submit a form (public endpoint - no authentication required)
export const submitForm = mutation({
  args: {
    formId: v.id("forms"),
    data: v.array(v.object({
      fieldId: v.string(),
      fieldLabel: v.string(),
      value: v.string(),
    })),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    domain: v.optional(v.string()), // Domain for email branding
    sourcePage: v.optional(v.string()), // URL of page where form was submitted
    vehicleId: v.optional(v.id("vehicles")), // If submitted from a vehicle listing page
    vehicleName: v.optional(v.string()), // Vehicle name for display
  },
  handler: async (ctx, args) => {
    try {
      // Note: This is a public endpoint for form submissions
      // Authentication is not required, but we validate the form is active

      const form = await ctx.db.get(args.formId);

      if (!form || !form.isActive) {
        throw new Error("Form not found or inactive");
      }

      const now = Date.now();

      // Extract submitter name and email from submission data (if they exist)
      const submitterName = args.data.find(d => d.fieldId === 'name' || d.fieldId === 'full_name' || d.fieldLabel.toLowerCase().includes('name'))?.value;
      const submitterEmail = args.data.find(d => d.fieldId === 'email' || d.fieldId === 'email_address' || d.fieldLabel.toLowerCase().includes('email'))?.value;
      const submitterPhone = args.data.find(d => d.fieldId === 'phone' || d.fieldId === 'telephone' || d.fieldId === 'mobile' || d.fieldLabel.toLowerCase().includes('phone'))?.value;

      // Extract email confirmation settings (if any field was configured)
      const emailConfirmationTitle = args.data.find(d => d.fieldId.includes('email_confirmation_title'))?.value;
      const emailConfirmationSubtitle = args.data.find(d => d.fieldId.includes('email_confirmation_subtitle'))?.value;
      const emailConfirmationMessage = args.data.find(d => d.fieldId.includes('email_confirmation_message'))?.value;

      // Get website to find company ID
      const website = await ctx.db.get(form.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Create the submission record
      const submissionId = await ctx.db.insert("formSubmissions", {
        formId: args.formId,
        websiteId: form.websiteId,
        data: args.data,
        submittedAt: now,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        status: "pending",
        emailsSent: form.recipients.map(recipient => ({
          recipient,
          status: "pending" as const,
        })),
      });

      console.log("Form submitted:", form.name);

      // Parse submitter name into first and last name
      let firstName = '';
      let lastName = '';
      if (submitterName) {
        const nameParts = submitterName.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else {
        firstName = submitterEmail?.split('@')[0] || 'Unknown';
        lastName = '';
      }

      // Determine source from form name or default to inquiry_form
      const source = form.name?.toLowerCase().includes('contact')
        ? 'contact_form'
        : 'inquiry_form';

      // Create a lead record instead of inquiry
      await ctx.db.insert("leads", {
        companyId: website.companyId,
        websiteId: form.websiteId,
        formId: args.formId,
        source,
        sourceDetails: form.name, // Store form name as source detail
        vehicleId: args.vehicleId,
        vehicleName: args.vehicleName,
        firstName,
        lastName,
        email: submitterEmail || '',
        phone: submitterPhone,
        formData: args.data, // Store original form data
        status: "new",
        assignedTo: undefined,
        notes: undefined,
        emailSent: false,
        emailSentAt: undefined,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        referrer: undefined,
        sourcePage: args.sourcePage,
        createdAt: now,
        updatedAt: now,
      });

      console.log("Lead created for form:", form.name);

      // Schedule form submission emails to be sent
      if (form.recipients.length > 0) {
        await ctx.scheduler.runAfter(0, api.emailActions.sendFormSubmissionEmailAction, {
          recipients: form.recipients,
          formName: form.name,
          formId: args.formId,
          submissionData: args.data,
          domain: args.domain || 'unknown',
          websiteId: form.websiteId,
          submitterName,
          submitterEmail,
          submittedAt: now,
          emailConfirmationTitle,
          emailConfirmationSubtitle,
          emailConfirmationMessage,
        });
      }

      return { success: true, submissionId };
    } catch (error) {
      console.error("Error submitting form:", error);
      throw error;
    }
  },
});

// Update submission status (called by email action - internal, no auth required)
export const updateSubmissionStatus = mutation({
  args: {
    submissionId: v.id("formSubmissions"),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    emailsSent: v.optional(v.array(v.object({
      recipient: v.string(),
      status: v.string(),
      sentAt: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    try {
      // This is called internally by the email scheduler
      // No authentication required for internal system calls

      const submission = await ctx.db.get(args.submissionId);

      if (!submission) {
        throw new Error("Submission not found");
      }

      const updateData: any = {
        status: args.status,
      };

      if (args.errorMessage) updateData.errorMessage = args.errorMessage;
      if (args.emailsSent) updateData.emailsSent = args.emailsSent;

      await ctx.db.patch(args.submissionId, updateData);

      console.log("Submission status updated:", args.status);

      return { success: true };
    } catch (error) {
      console.error("Error updating submission status:", error);
      throw error;
    }
  },
});

// Delete a form submission
export const deleteFormSubmission = mutation({
  args: {
    userId: v.id("users"),
    submissionId: v.id("formSubmissions"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const submission = await ctx.db.get(args.submissionId);

      if (!submission) {
        throw new Error("Submission not found");
      }

      // Get the form to find the website for access validation
      if (!submission.formId) {
        throw new Error("Submission has no form ID");
      }
      const form = await ctx.db.get(submission.formId);
      if (!form) {
        throw new Error("Form not found");
      }

      // Fetch website to get companyId for access validation
      if (!form.websiteId) {
        throw new Error("Form has no website ID");
      }
      const website = await ctx.db.get(form.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has access to this company (admin role required to delete submissions)
      if (!website.companyId) {
        throw new Error("Website has no company ID");
      }
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      await ctx.db.delete(args.submissionId);

      console.log("Form submission deleted:", submission._id);

      return { success: true };
    } catch (error) {
      console.error("Error deleting form submission:", error);
      throw error;
    }
  },
});

// ============================================================================
// Contact Section Form Submission
// ============================================================================

// Submit a contact section form (public endpoint - no authentication required)
export const submitContactForm = mutation({
  args: {
    websiteId: v.id("websites"),
    pageSlug: v.optional(v.string()),
    sectionId: v.string(),
    formData: v.array(v.object({
      fieldId: v.string(),
      fieldLabel: v.string(),
      value: v.string(),
    })),
    recipients: v.array(v.string()),
    sendThankYouEmail: v.optional(v.boolean()),
    thankYouEmailSubject: v.optional(v.string()),
    thankYouEmailMessage: v.optional(v.string()),
    successMessage: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Get website
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      const now = Date.now();

      // Extract submitter info from form data
      const submitterName = args.formData.find(d =>
        d.fieldId === 'name' || d.fieldId === 'full_name' || d.fieldLabel.toLowerCase().includes('name')
      )?.value;
      const submitterEmail = args.formData.find(d =>
        d.fieldId === 'email' || d.fieldId === 'email_address' || d.fieldLabel.toLowerCase().includes('email')
      )?.value;
      const submitterPhone = args.formData.find(d =>
        d.fieldId === 'phone' || d.fieldId === 'telephone' || d.fieldId === 'mobile' || d.fieldLabel.toLowerCase().includes('phone')
      )?.value;

      // Create submission record
      const submissionId = await ctx.db.insert("formSubmissions", {
        contactFormSource: `contact_${args.sectionId}`, // Use section ID as contact form source
        websiteId: args.websiteId,
        data: args.formData,
        submittedAt: now,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        status: "pending",
        emailsSent: args.recipients.map(recipient => ({
          recipient,
          status: "pending" as const,
        })),
      });

      console.log("Contact form submitted for section:", args.sectionId);

      // Parse submitter name
      let firstName = '';
      let lastName = '';
      if (submitterName) {
        const nameParts = submitterName.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else {
        firstName = submitterEmail?.split('@')[0] || 'Unknown';
      }

      // Create a lead record
      await ctx.db.insert("leads", {
        companyId: website.companyId,
        websiteId: args.websiteId,
        // Don't set formId for contact forms - it's only for form builder forms
        source: 'contact_form',
        sourceDetails: `Contact Form - ${args.pageSlug || 'Unknown Page'}`,
        firstName,
        lastName,
        email: submitterEmail || '',
        phone: submitterPhone,
        formData: args.formData,
        status: "new",
        assignedTo: undefined,
        notes: undefined,
        emailSent: false,
        emailSentAt: undefined,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        referrer: undefined,
        sourcePage: args.pageSlug,
        createdAt: now,
        updatedAt: now,
      });

      console.log("Lead created for contact form");

      // Schedule notification emails
      if (args.recipients.length > 0) {
        await ctx.scheduler.runAfter(0, api.emailActions.sendFormSubmissionEmailAction, {
          recipients: args.recipients,
          formName: 'Contact Form',
          submissionData: args.formData,
          domain: website.domains?.[0] || 'unknown',
          websiteId: args.websiteId,
          submitterName,
          submitterEmail,
          submittedAt: now,
        });
      }

      // Schedule thank you email if enabled and submitter email exists
      if (args.sendThankYouEmail && submitterEmail) {
        await ctx.scheduler.runAfter(0, api.emailActions.sendThankYouEmailAction, {
          to: submitterEmail,
          subject: args.thankYouEmailSubject || 'Thank you for contacting us!',
          message: args.thankYouEmailMessage || 'We have received your message and will get back to you shortly.',
          submitterName,
          domain: website.domains?.[0] || 'unknown',
          websiteId: args.websiteId,
        });
      }

      return {
        success: true,
        submissionId,
        message: args.successMessage || 'Thank you for your message! We\'ll get back to you soon.'
      };
    } catch (error) {
      console.error("Error submitting contact form:", error);
      throw error;
    }
  },
});

// ============================================================================
// Vehicle Inquiry Form Submission
// ============================================================================

// Submit a vehicle inquiry form (public endpoint - no authentication required)
export const submitVehicleInquiry = mutation({
  args: {
    websiteId: v.id("websites"),
    pageSlug: v.optional(v.string()),
    formData: v.array(v.object({
      fieldId: v.string(),
      fieldLabel: v.string(),
      value: v.string(),
    })),
    vehicleData: v.object({
      name: v.string(),
      make: v.optional(v.string()),
      model: v.optional(v.string()),
      year: v.optional(v.number()),
      reference: v.optional(v.string()),
      condition: v.optional(v.string()),
      price: v.optional(v.number()),
      image: v.optional(v.string()),
    }),
    recipients: v.array(v.string()),
    sendThankYouEmail: v.optional(v.boolean()),
    thankYouEmailSubject: v.optional(v.string()),
    thankYouEmailMessage: v.optional(v.string()),
    successMessage: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Get website
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      const now = Date.now();

      // Extract submitter info from form data
      const submitterName = `${args.formData.find(d => d.fieldId === 'firstName')?.value || ''} ${args.formData.find(d => d.fieldId === 'lastName')?.value || ''}`.trim();
      const submitterEmail = args.formData.find(d => d.fieldId === 'email')?.value;
      const submitterPhone = args.formData.find(d => d.fieldId === 'contactNumber')?.value;

      // Create submission record
      const submissionId = await ctx.db.insert("formSubmissions", {
        contactFormSource: `vehicle_inquiry_${args.vehicleData.reference || 'unknown'}`,
        websiteId: args.websiteId,
        data: args.formData,
        submittedAt: now,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        status: "pending",
        emailsSent: args.recipients.map(recipient => ({
          recipient,
          status: "pending" as const,
        })),
      });

      console.log("Vehicle inquiry submitted for:", args.vehicleData.name);

      // Parse submitter name
      const firstName = args.formData.find(d => d.fieldId === 'firstName')?.value || submitterEmail?.split('@')[0] || 'Unknown';
      const lastName = args.formData.find(d => d.fieldId === 'lastName')?.value || '';

      // Create a lead record
      await ctx.db.insert("leads", {
        companyId: website.companyId,
        websiteId: args.websiteId,
        source: 'vehicle_inquiry',
        sourceDetails: `Vehicle Inquiry - ${args.vehicleData.name} (${args.vehicleData.reference || 'No Reference'})`,
        firstName,
        lastName,
        email: submitterEmail || '',
        phone: submitterPhone,
        formData: args.formData,
        status: "new",
        assignedTo: undefined,
        notes: `Vehicle: ${args.vehicleData.name}\nReference: ${args.vehicleData.reference || 'N/A'}\nMake: ${args.vehicleData.make || 'N/A'}\nModel: ${args.vehicleData.model || 'N/A'}\nYear: ${args.vehicleData.year || 'N/A'}\nCondition: ${args.vehicleData.condition || 'N/A'}\nPrice: ${args.vehicleData.price || 'N/A'}`,
        emailSent: false,
        emailSentAt: undefined,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        referrer: undefined,
        sourcePage: args.pageSlug,
        createdAt: now,
        updatedAt: now,
      });

      console.log("Lead created for vehicle inquiry");

      // Build vehicle data for email
      const vehicleInfo = [
        { fieldId: 'vehicle_name', fieldLabel: 'Vehicle', value: args.vehicleData.name },
        { fieldId: 'vehicle_reference', fieldLabel: 'Reference', value: args.vehicleData.reference || 'N/A' },
        { fieldId: 'vehicle_make', fieldLabel: 'Make', value: args.vehicleData.make || 'N/A' },
        { fieldId: 'vehicle_model', fieldLabel: 'Model', value: args.vehicleData.model || 'N/A' },
        { fieldId: 'vehicle_year', fieldLabel: 'Year', value: args.vehicleData.year?.toString() || 'N/A' },
        { fieldId: 'vehicle_condition', fieldLabel: 'Condition', value: args.vehicleData.condition || 'N/A' },
        { fieldId: 'vehicle_price', fieldLabel: 'Price', value: args.vehicleData.price ? args.vehicleData.price.toLocaleString() : 'N/A' },
      ];

      // Combine vehicle info with form data
      const allSubmissionData = [...vehicleInfo, ...args.formData];

      // Schedule notification emails
      if (args.recipients.length > 0) {
        await ctx.scheduler.runAfter(0, api.emailActions.sendFormSubmissionEmailAction, {
          recipients: args.recipients,
          formName: `Vehicle Inquiry - ${args.vehicleData.name}`,
          submissionData: allSubmissionData,
          domain: website.domains?.[0] || 'unknown',
          websiteId: args.websiteId,
          submitterName,
          submitterEmail,
          submittedAt: now,
        });
      }

      // Schedule thank you email if enabled and submitter email exists
      if (args.sendThankYouEmail && submitterEmail) {
        await ctx.scheduler.runAfter(0, api.emailActions.sendThankYouEmailAction, {
          to: submitterEmail,
          subject: args.thankYouEmailSubject || 'Thank you for your inquiry!',
          message: args.thankYouEmailMessage || 'We have received your vehicle inquiry and will get back to you shortly.',
          submitterName,
          domain: website.domains?.[0] || 'unknown',
          websiteId: args.websiteId,
        });
      }

      return {
        success: true,
        submissionId,
        message: args.successMessage || 'Thank you for your inquiry! We\'ll get back to you soon.'
      };
    } catch (error) {
      console.error("Error submitting vehicle inquiry:", error);
      throw error;
    }
  },
});
