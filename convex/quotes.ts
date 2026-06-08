import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./security";

export const listByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return quotes.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: {
    userId: v.id("users"),
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const quote = await ctx.db.get(args.quoteId);
    return quote;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    quoteNumber: v.string(),
    clientId: v.optional(v.id("clients")),
    clientName: v.string(),
    clientEmail: v.optional(v.string()),
    clientCompany: v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    clientAddress: v.optional(v.string()),
    status: v.string(),
    items: v.array(v.object({
      itemType: v.optional(v.string()),
      itemId: v.optional(v.string()),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      customPrice: v.optional(v.number()),
      total: v.number(),
    })),
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    validUntil: v.optional(v.string()),
    notes: v.optional(v.string()),
    template: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const publicToken = Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);

    const quoteId = await ctx.db.insert("quotes", {
      companyId: args.companyId,
      clientId: args.clientId,
      quoteNumber: args.quoteNumber,
      clientName: args.clientName,
      clientEmail: args.clientEmail,
      clientCompany: args.clientCompany,
      clientPhone: args.clientPhone,
      clientAddress: args.clientAddress,
      status: args.status,
      items: args.items,
      subtotal: args.subtotal,
      taxRate: args.taxRate,
      taxAmount: args.taxAmount,
      total: args.total,
      validUntil: args.validUntil,
      notes: args.notes,
      template: args.template,
      publicToken,
      publicEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, quoteId };
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    quoteId: v.id("quotes"),
    quoteNumber: v.string(),
    clientId: v.optional(v.id("clients")),
    clientName: v.string(),
    clientEmail: v.optional(v.string()),
    clientCompany: v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    clientAddress: v.optional(v.string()),
    status: v.string(),
    items: v.array(v.object({
      itemType: v.optional(v.string()),
      itemId: v.optional(v.string()),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      customPrice: v.optional(v.number()),
      total: v.number(),
    })),
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    validUntil: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    template: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    const updates: any = {
      clientId: args.clientId,
      quoteNumber: args.quoteNumber,
      clientName: args.clientName,
      clientEmail: args.clientEmail,
      clientCompany: args.clientCompany,
      clientPhone: args.clientPhone,
      clientAddress: args.clientAddress,
      status: args.status,
      items: args.items,
      subtotal: args.subtotal,
      taxRate: args.taxRate,
      taxAmount: args.taxAmount,
      total: args.total,
      validUntil: args.validUntil,
      notes: args.notes,
      template: args.template,
      updatedAt: Date.now(),
    };

    if (args.sentAt) updates.sentAt = args.sentAt;
    if (args.acceptedAt) updates.acceptedAt = args.acceptedAt;
    if (args.rejectedAt) updates.rejectedAt = args.rejectedAt;

    await ctx.db.patch(args.quoteId, updates);

    return { success: true };
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    await ctx.db.delete(args.quoteId);

    return { success: true };
  },
});

export const markAsSent = mutation({
  args: {
    userId: v.id("users"),
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    await ctx.db.patch(args.quoteId, {
      status: "sent",
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const markAsAccepted = mutation({
  args: {
    userId: v.id("users"),
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    await ctx.db.patch(args.quoteId, {
      status: "accepted",
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const markAsRejected = mutation({
  args: {
    userId: v.id("users"),
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    await ctx.db.patch(args.quoteId, {
      status: "rejected",
      rejectedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
