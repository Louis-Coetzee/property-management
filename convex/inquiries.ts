import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  validateUserCompanyAccess,
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";
// ============================================================================
// Inquiry Queries
// ============================================================================

// Get all inquiries for a company
export const getInquiriesByCompany = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    const inquiries = await ctx.db
      .query("inquiries")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    let filteredInquiries = inquiries;

    // Filter by status if provided
    if (args.status) {
      filteredInquiries = inquiries.filter((i) => i.status === args.status);
    }

    // Sort by submittedAt descending (newest first)
    const sortedInquiries = filteredInquiries.sort(
      (a, b) => b.submittedAt - a.submittedAt
    );

    if (args.limit) {
      return sortedInquiries.slice(0, args.limit);
    }

    return sortedInquiries;
  },
});

// Get inquiries by status for a company
export const getInquiriesByStatus = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    const inquiries = await ctx.db
      .query("inquiries")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", args.companyId).eq("status", args.status)
      )
      .collect();

    return inquiries.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

// Get inquiries by form
export const getInquiriesByForm = query({
  args: {
        userId: v.id("users"),
    formId: v.id("forms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the form to validate company access
    const form = await ctx.db.get(args.formId);
    if (!form) {
      throw new Error("NOT_FOUND: Form not found");
    }

    // Get the website to get companyId
    const website = await ctx.db.get(form.websiteId);
    if (!website) {
      throw new Error("NOT_FOUND: Website not found");
    }

    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

    const inquiries = await ctx.db
      .query("inquiries")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .collect();

    const sortedInquiries = inquiries.sort(
      (a, b) => b.submittedAt - a.submittedAt
    );

    if (args.limit) {
      return sortedInquiries.slice(0, args.limit);
    }

    return sortedInquiries;
  },
});

// Get inquiries by website
export const getInquiriesByWebsite = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the website to validate company access
    const website = await ctx.db.get(args.websiteId);
    if (!website) {
      throw new Error("NOT_FOUND: Website not found");
    }

    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

    const inquiries = await ctx.db
      .query("inquiries")
      .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
      .collect();

    const sortedInquiries = inquiries.sort(
      (a, b) => b.submittedAt - a.submittedAt
    );

    if (args.limit) {
      return sortedInquiries.slice(0, args.limit);
    }

    return sortedInquiries;
  },
});

// Get a single inquiry by ID
export const getInquiryById = query({
  args: {
    userId: v.id("users"),
    inquiryId: v.id("inquiries"),
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.db.get(args.inquiryId);

    if (!inquiry) {
      return null;
    }

    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, inquiry.companyId);

    return inquiry;
  },
});

// Get inquiry statistics for a company
export const getInquiryStats = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    const inquiries = await ctx.db
      .query("inquiries")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const totalInquiries = inquiries.length;
    const newInquiries = inquiries.filter((i) => i.status === "new").length;
    const contactedInquiries = inquiries.filter(
      (i) => i.status === "contacted"
    ).length;
    const qualifiedInquiries = inquiries.filter(
      (i) => i.status === "qualified"
    ).length;
    const convertedInquiries = inquiries.filter(
      (i) => i.status === "converted"
    ).length;
    const lostInquiries = inquiries.filter((i) => i.status === "lost").length;
    const archivedInquiries = inquiries.filter(
      (i) => i.status === "archived"
    ).length;

    // Get inquiries from last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentInquiries = inquiries.filter(
      (i) => i.submittedAt >= thirtyDaysAgo
    ).length;

    return {
      total: totalInquiries,
      new: newInquiries,
      contacted: contactedInquiries,
      qualified: qualifiedInquiries,
      converted: convertedInquiries,
      lost: lostInquiries,
      archived: archivedInquiries,
      recent: recentInquiries,
    };
  },
});

// ============================================================================
// Inquiry Mutations
// ============================================================================

// Create an inquiry (called when a form is submitted)
// Note: This is typically called from public forms, so it may not require auth
// However, we still validate the company exists and the form belongs to it
export const createInquiry = mutation({
  args: {
    companyId: v.id("companies"),
    websiteId: v.id("websites"),
    formId: v.id("forms"),
    formName: v.string(),
    data: v.array(
      v.object({
        fieldId: v.string(),
        fieldLabel: v.string(),
        value: v.string(),
      })
    ),
    submitterName: v.optional(v.string()),
    submitterEmail: v.optional(v.string()),
    submitterPhone: v.optional(v.string()),
    sourcePage: v.optional(v.string()),
    vehicleId: v.optional(v.id("vehicles")),
    vehicleName: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate the company exists
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    // Validate the website belongs to the company
    const website = await ctx.db.get(args.websiteId);
    if (!website || website.companyId !== args.companyId) {
      throw new Error("FORBIDDEN: Website does not belong to this company");
    }

    // Validate the form belongs to the website
    const form = await ctx.db.get(args.formId);
    if (!form || form.websiteId !== args.websiteId) {
      throw new Error("FORBIDDEN: Form does not belong to this website");
    }

    const now = Date.now();

    const inquiryId = await ctx.db.insert("inquiries", {
      companyId: args.companyId,
      websiteId: args.websiteId,
      formId: args.formId,
      formName: args.formName,
      data: args.data,
      submitterName: args.submitterName,
      submitterEmail: args.submitterEmail,
      submitterPhone: args.submitterPhone,
      sourcePage: args.sourcePage,
      vehicleId: args.vehicleId,
      vehicleName: args.vehicleName,
      status: "new",
      assignedTo: undefined,
      notes: undefined,
      emailSent: false,
      emailSentAt: undefined,
      emailsSentLog: undefined,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      referrer: args.referrer,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return inquiryId;
  },
});

// Update inquiry status
export const updateInquiryStatus = mutation({
  args: {
    userId: v.id("users"),
    inquiryId: v.id("inquiries"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const inquiry = await ctx.db.get(args.inquiryId);

    if (!inquiry) {
      throw new Error("NOT_FOUND: Inquiry not found");
    }

    // Validate user has access to this company
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      inquiry.companyId
    );

    const now = Date.now();

    await ctx.db.patch(args.inquiryId, {
      status: args.status,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Assign inquiry to a user
export const assignInquiry = mutation({
  args: {
    userId: v.id("users"),
    inquiryId: v.id("inquiries"),
    assignedTo: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const inquiry = await ctx.db.get(args.inquiryId);

    if (!inquiry) {
      throw new Error("NOT_FOUND: Inquiry not found");
    }

    // Validate user has access to this company (requires member role)
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      inquiry.companyId,
      "member"
    );

    const now = Date.now();

    await ctx.db.patch(args.inquiryId, {
      assignedTo: args.assignedTo,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Add notes to an inquiry
export const addInquiryNotes = mutation({
  args: {
    userId: v.id("users"),
    inquiryId: v.id("inquiries"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const inquiry = await ctx.db.get(args.inquiryId);

    if (!inquiry) {
      throw new Error("NOT_FOUND: Inquiry not found");
    }

    // Validate user has access to this company (requires member role)
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      inquiry.companyId,
      "member"
    );

    const now = Date.now();

    await ctx.db.patch(args.inquiryId, {
      notes: args.notes,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Update email sent status
export const updateInquiryEmailStatus = mutation({
  args: {
    userId: v.id("users"),
    inquiryId: v.id("inquiries"),
    emailSent: v.boolean(),
    emailsSentLog: v.optional(
      v.array(
        v.object({
          recipient: v.string(),
          sentAt: v.number(),
          status: v.string(),
          errorMessage: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const inquiry = await ctx.db.get(args.inquiryId);

    if (!inquiry) {
      throw new Error("NOT_FOUND: Inquiry not found");
    }

    // Validate user has access to this company (requires member role)
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      inquiry.companyId,
      "member"
    );

    const now = Date.now();

    await ctx.db.patch(args.inquiryId, {
      emailSent: args.emailSent,
      emailSentAt: args.emailSent ? now : undefined,
      emailsSentLog: args.emailsSentLog,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Delete an inquiry (soft delete by archiving)
export const deleteInquiry = mutation({
  args: {
    userId: v.id("users"),
    inquiryId: v.id("inquiries"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const inquiry = await ctx.db.get(args.inquiryId);

    if (!inquiry) {
      throw new Error("NOT_FOUND: Inquiry not found");
    }

    // Validate user has access to this company (requires member role)
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      inquiry.companyId,
      "member"
    );

    const now = Date.now();

    // Soft delete by archiving
    await ctx.db.patch(args.inquiryId, {
      status: "archived",
      updatedAt: now,
    });

    return { success: true };
  },
});

// Permanently delete an inquiry
export const permanentDeleteInquiry = mutation({
  args: {
    userId: v.id("users"),
    inquiryId: v.id("inquiries"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const inquiry = await ctx.db.get(args.inquiryId);

    if (!inquiry) {
      throw new Error("NOT_FOUND: Inquiry not found");
    }

    // Validate user has admin permissions for this company
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      inquiry.companyId,
      "admin"
    );

    await ctx.db.delete(args.inquiryId);
    return { success: true };
  },
});
