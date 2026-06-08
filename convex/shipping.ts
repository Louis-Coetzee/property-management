import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./security";

export const listByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const shippingOptions = await ctx.db
      .query("shippingOptions")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return shippingOptions.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },
});

export const getById = query({
  args: {
    userId: v.id("users"),
    shippingId: v.id("shippingOptions"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const shippingOption = await ctx.db.get(args.shippingId);
    if (!shippingOption) {
      return null;
    }

    return shippingOption;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    estimatedDays: v.optional(v.string()),
    isFree: v.boolean(),
    freeShippingThreshold: v.optional(v.number()),
    // BobGo shipping
    shippingType: v.optional(v.string()),
    bobgoServiceCode: v.optional(v.string()),
    pickupAddress: v.optional(v.string()),
    pickupPostalCode: v.optional(v.string()),
    pickupCity: v.optional(v.string()),
    pickupProvince: v.optional(v.string()),
    pickupCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const now = Date.now();
    
    // Get highest sort order
    const existingOptions = await ctx.db
      .query("shippingOptions")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
    
    const maxSortOrder = existingOptions.reduce((max, opt) => {
      const order = opt.sortOrder || 0;
      return order > max ? order : max;
    }, -1);

    const shippingId = await ctx.db.insert("shippingOptions", {
      companyId: args.companyId,
      name: args.name,
      description: args.description,
      price: args.price,
      estimatedDays: args.estimatedDays,
      isFree: args.isFree || false,
      freeShippingThreshold: args.freeShippingThreshold,
      isActive: true,
      sortOrder: maxSortOrder + 1,
      // BobGo shipping
      shippingType: args.shippingType || 'manual',
      bobgoServiceCode: args.bobgoServiceCode,
      pickupAddress: args.pickupAddress,
      pickupPostalCode: args.pickupPostalCode,
      pickupCity: args.pickupCity,
      pickupProvince: args.pickupProvince,
      pickupCountry: args.pickupCountry,
      createdAt: now,
      updatedAt: now,
    });

    return shippingId;
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    shippingId: v.id("shippingOptions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    estimatedDays: v.optional(v.string()),
    isFree: v.optional(v.boolean()),
    freeShippingThreshold: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    // BobGo shipping
    shippingType: v.optional(v.string()),
    bobgoServiceCode: v.optional(v.string()),
    pickupAddress: v.optional(v.string()),
    pickupPostalCode: v.optional(v.string()),
    pickupCity: v.optional(v.string()),
    pickupProvince: v.optional(v.string()),
    pickupCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const shippingOption = await ctx.db.get(args.shippingId);
    if (!shippingOption) {
      throw new Error("Shipping option not found");
    }

    const { userId, shippingId, ...updates } = args;
    
    await ctx.db.patch(args.shippingId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return args.shippingId;
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    shippingId: v.id("shippingOptions"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const shippingOption = await ctx.db.get(args.shippingId);
    if (!shippingOption) {
      throw new Error("Shipping option not found");
    }

    await ctx.db.delete(args.shippingId);

    return true;
  },
});
