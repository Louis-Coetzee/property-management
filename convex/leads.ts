import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  validateUserCompanyAccess,
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";
import { Id } from "./_generated/dataModel";

// Lead status enum values
const LeadStatus = {
  new: "new",
  contacted: "contacted",
  qualified: "qualified",
  converted: "converted",
  lost: "lost",
};

// Get all leads for a company
export const getLeadsByCompany = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const leads = await ctx.db
        .query("leads")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      return leads;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  },
});

// Get leads by status
export const getLeadsByStatus = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const leads = await ctx.db
        .query("leads")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .filter((q) => q.eq(q.field("status"), args.status))
        .collect();

      return leads;
    } catch (error) {
      console.error('Error fetching leads by status:', error);
      throw error;
    }
  },
});

// Get leads by assigned user
export const getLeadsByAssignedUser = query({
  args: {
    assignedTo: v.id("users"),
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const leads = await ctx.db
        .query("leads")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      // Filter by assigned user (check if assignedTo array includes the user)
      if (args.assignedTo) {
        return leads.filter(lead => 
          lead.assignedTo && lead.assignedTo.includes(args.assignedTo as Id<'users'>)
        );
      }
      return leads;
    } catch (error) {
      console.error('Error fetching leads by assigned user:', error);
      throw error;
    }
  },
});

// Get leads by vehicle
export const getLeadsByVehicle = query({
  args: {
    userId: v.id("users"),
    vehicleId: v.id("vehicles"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      // First verify the vehicle belongs to the company
      const vehicle = await ctx.db.get(args.vehicleId);
      if (!vehicle || vehicle.companyId !== args.companyId) {
        throw new Error("FORBIDDEN: Vehicle does not belong to this company");
      }

      const leads = await ctx.db
        .query("leads")
        .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
        .collect();

      return leads;
    } catch (error) {
      console.error('Error fetching leads by vehicle:', error);
      throw error;
    }
  },
});

// Get leads by source
export const getLeadsBySource = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const leads = await ctx.db
        .query("leads")
        .withIndex("by_source", (q) => q.eq("source", args.source))
        .collect();

      // Filter by company
      return leads.filter(lead => lead.companyId === args.companyId);
    } catch (error) {
      console.error('Error fetching leads by source:', error);
      throw error;
    }
  },
});

// Get a lead by ID
export const getLeadById = query({
  args: {
    userId: v.id("users"),
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    try {
      const lead = await ctx.db.get(args.leadId);

      if (!lead) {
        return null;
      }

      // Validate user has access to the lead's company
      await validateCompanyResourceAccess(ctx, args.userId, lead.companyId);

      return lead;
    } catch (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
  },
});

// Create a new lead
export const createLead = mutation({
  args: {
    userId: v.optional(v.id("users")),
    companyId: v.id("companies"),
    websiteId: v.optional(v.id("websites")),
    formId: v.optional(v.id("forms")),
    source: v.string(),
    sourceDetails: v.optional(v.string()),
    vehicleId: v.optional(v.id("vehicles")),
    vehicleName: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    formData: v.optional(v.array(v.object({
      fieldId: v.string(),
      fieldLabel: v.string(),
      value: v.string(),
    }))),
    method: v.optional(v.string()),
    status: v.optional(v.string()),
    description: v.optional(v.string()),
    relatedToName: v.optional(v.string()),
    relatedToId: v.optional(v.id("clients")),
    notes: v.optional(v.string()),
    assignedTo: v.optional(v.array(v.id("users"))),
    startDate: v.optional(v.string()),
    startTime: v.optional(v.string()),
    value: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string()),
    sourcePage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    if (args.userId) {
      await validateCompanyResourceAccess(ctx, args.userId, args.companyId);
    }

    let clientData = null;
    if (args.clientId) {
      const client = await ctx.db.get(args.clientId);
      if (!client || client.companyId !== args.companyId) {
        throw new Error("FORBIDDEN: Client does not belong to this company");
      }
      clientData = client;
    }

    try {
      const now = Date.now();

      const leadId = await ctx.db.insert("leads", {
        companyId: args.companyId,
        websiteId: args.websiteId,
        formId: args.formId,
        source: args.source,
        sourceDetails: args.sourceDetails,
        vehicleId: args.vehicleId,
        vehicleName: args.vehicleName,
        clientId: args.clientId,
        firstName: args.clientId && clientData ? clientData.contactName.split(' ')[0] : args.firstName,
        lastName: args.clientId && clientData ? clientData.contactName.split(' ').slice(1).join(' ') : args.lastName,
        email: args.clientId && clientData ? clientData.email : args.email,
        phone: args.clientId && clientData ? clientData.contactNumber : args.phone,
        formData: args.formData,
        method: args.method,
        status: args.status || "new_lead",
        description: args.description,
        relatedToName: args.relatedToName,
        relatedToId: args.relatedToId,
        notes: args.notes || undefined,
        assignedTo: args.assignedTo && args.assignedTo.length > 0 ? args.assignedTo : (args.userId ? [args.userId] : undefined),
        startDate: args.startDate || new Date().toISOString().split('T')[0],
        startTime: args.startTime,
        value: args.value,
        emailSent: undefined,
        emailSentAt: undefined,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        referrer: args.referrer,
        sourcePage: args.sourcePage,
        createdAt: now,
        updatedAt: now,
      });

      return leadId;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  },
});

// Update a lead
export const updateLead = mutation({
  args: {
    userId: v.id("users"),
    leadId: v.id("leads"),
    clientId: v.optional(v.id("clients")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    method: v.optional(v.string()),
    status: v.optional(v.string()),
    description: v.optional(v.string()),
    relatedToName: v.optional(v.string()),
    relatedToId: v.optional(v.id("clients")),
    notes: v.optional(v.string()),
    assignedTo: v.optional(v.array(v.id("users"))),
    startDate: v.optional(v.string()),
    startTime: v.optional(v.string()),
    value: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);

    if (!lead) {
      throw new Error("NOT_FOUND: Lead not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, lead.companyId);

    const now = Date.now();

    const updateData: any = {
      updatedAt: now,
    };

    if (args.clientId !== undefined) {
      const client = await ctx.db.get(args.clientId);
      if (!client || client.companyId !== lead.companyId) {
        throw new Error("FORBIDDEN: Client does not belong to this company");
      }
      updateData.clientId = args.clientId;
      updateData.firstName = client.contactName.split(' ')[0];
      updateData.lastName = client.contactName.split(' ').slice(1).join(' ');
      updateData.email = client.email;
      updateData.phone = client.contactNumber;
    } else {
      if (args.firstName !== undefined) updateData.firstName = args.firstName;
      if (args.lastName !== undefined) updateData.lastName = args.lastName;
      if (args.email !== undefined) updateData.email = args.email;
      if (args.phone !== undefined) updateData.phone = args.phone;
    }
    if (args.method !== undefined) updateData.method = args.method;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.relatedToName !== undefined) updateData.relatedToName = args.relatedToName;
    if (args.relatedToId !== undefined) updateData.relatedToId = args.relatedToId;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.assignedTo !== undefined) updateData.assignedTo = args.assignedTo;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.startTime !== undefined) updateData.startTime = args.startTime;
    if (args.value !== undefined) updateData.value = args.value;

    await ctx.db.patch(args.leadId, updateData)

    return { success: true };
  },
});

// Update lead status
export const updateLeadStatus = mutation({
  args: {
    userId: v.id("users"),
    leadId: v.id("leads"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);

    if (!lead) {
      throw new Error("NOT_FOUND: Lead not found");
    }

    // Validate user has access to the lead's company
    await validateCompanyResourceAccess(ctx, args.userId, lead.companyId);

    const validStatuses = ["new_lead", "contacted", "qualified", "engaged", "proposal", "negotiation", "closed_won", "closed_lost"];
    if (!validStatuses.includes(args.status)) {
      throw new Error("INVALID_INPUT: Invalid status value");
    }

    const now = Date.now();
    await ctx.db.patch(args.leadId, {
      status: args.status,
      updatedAt: now,
    });

    return { success: true, status: args.status };
  },
});

// Delete a lead
export const deleteLead = mutation({
  args: {
    userId: v.id("users"),
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);

    if (!lead) {
      throw new Error("NOT_FOUND: Lead not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, lead.companyId);

    if (lead.vehicleId) {
      const vehicle = await ctx.db.get(lead.vehicleId);
      if (vehicle && vehicle.leadIds) {
        const updatedLeadIds = vehicle.leadIds.filter(id => id !== args.leadId);
        await ctx.db.patch(lead.vehicleId, {
          leadIds: updatedLeadIds,
          leadCount: Math.max(0, (vehicle.leadCount || 0) - 1),
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.delete(args.leadId);

    return { success: true };
  },
});

// Bulk update lead status
export const bulkUpdateLeadStatus = mutation({
  args: {
    userId: v.id("users"),
    leadIds: v.array(v.id("leads")),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const validStatuses = ["new", "contacted", "qualified", "converted", "lost"];
    if (!validStatuses.includes(args.status)) {
      throw new Error("INVALID_INPUT: Invalid status value");
    }

    const now = Date.now();
    const results = [];

    for (const leadId of args.leadIds) {
      const lead = await ctx.db.get(leadId);
      if (lead) {
        // Validate user has access to this lead's company
        await validateCompanyResourceAccess(ctx, args.userId, lead.companyId);

        await ctx.db.patch(leadId, {
          status: args.status,
          updatedAt: now,
        });
        results.push({ leadId, success: true });
      } else {
        results.push({ leadId, success: false, error: "Lead not found" });
      }
    }

    return { success: true, results };
  },
});

// Get lead statistics
export const getLeadStatistics = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const leads = await ctx.db
        .query("leads")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const stats = {
        total: leads.length,
        byStatus: {
          new: 0,
          contacted: 0,
          qualified: 0,
          converted: 0,
          lost: 0,
        },
        thisMonth: 0,
        assignedCount: 0,
      };

      const now = Date.now();
      const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

      leads.forEach(lead => {
        // By status
        if (stats.byStatus[lead.status as keyof typeof stats.byStatus] !== undefined) {
          stats.byStatus[lead.status as keyof typeof stats.byStatus]++;
        }

        // This month
        if (lead.createdAt >= oneMonthAgo) {
          stats.thisMonth++;
        }

        // Assigned
        if (lead.assignedTo) {
          stats.assignedCount++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching lead statistics:', error);
      throw error;
    }
  },
});

// Get recent leads for a company
export const getRecentLeads = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const limit = args.limit || 10;
      const leads = await ctx.db
        .query("leads")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      // Sort by createdAt descending and take the limit
      return leads
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent leads:', error);
      throw error;
    }
  },
});
