import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all users for admin autocomplete
export const getAllUsers = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the user to check if they're admin
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("UNAUTHORIZED: User not found");
    }

    if (user.userType !== "admin" && user.userType !== "administrator") {
      throw new Error("FORBIDDEN: Admin access required");
    }

    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      userType: u.userType,
    }));
  },
});

// Search users by email or name
export const searchUsers = query({
  args: {
    userId: v.id("users"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the user to check if they're admin
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("UNAUTHORIZED: User not found");
    }

    if (user.userType !== "admin" && user.userType !== "administrator") {
      throw new Error("FORBIDDEN: Admin access required");
    }

    const users = await ctx.db.query("users").collect();
    const term = args.searchTerm.toLowerCase();

    return users
      .filter((u) =>
        u.email.toLowerCase().includes(term) ||
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term)
      )
      .map((u) => ({
        _id: u._id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        userType: u.userType,
      }));
  },
});

// Get admin settings by user ID
export const getAdminSettingsByUserId = query({
  args: {
    targetUserId: v.id("users"),
    requesterId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the requester to check if they're admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester) {
      throw new Error("UNAUTHORIZED: User not found");
    }

    if (requester.userType !== "admin" && requester.userType !== "administrator") {
      throw new Error("FORBIDDEN: Admin access required");
    }

    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();

    return settings || null;
  },
});

// Get or create admin settings for a user (for the settings page)
export const getMyAdminSettings = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("UNAUTHORIZED: User not found");
    }

    // Allow any logged-in user to get their settings
    const settings = await ctx.db
      .query("adminSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return settings || null;
  },
});

// Upsert admin settings
export const upsertAdminSettings = mutation({
  args: {
    userId: v.id("users"),
    targetUserId: v.optional(v.id("users")),

    // PayFast config
    payfast: v.optional(v.object({
      enabled: v.boolean(),
      testMode: v.boolean(),
      merchantId: v.optional(v.string()),
      merchantKey: v.optional(v.string()),
      passphrase: v.optional(v.string()),
    })),

    // PayPal config
    paypal: v.optional(v.object({
      enabled: v.boolean(),
      testMode: v.boolean(),
      testClientId: v.optional(v.string()),
      testClientSecret: v.optional(v.string()),
      liveClientId: v.optional(v.string()),
      liveClientSecret: v.optional(v.string()),
    })),

    // App pricing
    appPricing: v.optional(v.object({
      businessTools: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
      websites: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
      vehicleDealership: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
      onlineStore: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
      bookingsApp: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
      realEstate: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
    })),

    // Admin details
    adminEmail: v.optional(v.string()),
    adminName: v.optional(v.string()),
    adminPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("UNAUTHORIZED: User not found");
    }

    // Check admin access
    if (user.userType !== "admin" && user.userType !== "administrator") {
      throw new Error("FORBIDDEN: Admin access required");
    }

    const targetId = args.targetUserId || args.userId;
    const now = Date.now();

    const existing = await ctx.db
      .query("adminSettings")
      .withIndex("by_user", (q) => q.eq("userId", targetId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.payfast !== undefined && { payfast: args.payfast }),
        ...(args.paypal !== undefined && { paypal: args.paypal }),
        ...(args.appPricing !== undefined && { appPricing: args.appPricing }),
        ...(args.adminEmail !== undefined && { adminEmail: args.adminEmail }),
        ...(args.adminName !== undefined && { adminName: args.adminName }),
        ...(args.adminPhone !== undefined && { adminPhone: args.adminPhone }),
        updatedAt: now,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("adminSettings", {
        userId: targetId,
        payfast: args.payfast,
        paypal: args.paypal,
        appPricing: args.appPricing,
        adminEmail: args.adminEmail,
        adminName: args.adminName,
        adminPhone: args.adminPhone,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

// Get all admin settings (for debug/super admin)
export const getAllAdminSettings = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("UNAUTHORIZED: User not found");
    }

    if (user.userType !== "admin" && user.userType !== "administrator") {
      throw new Error("FORBIDDEN: Admin access required");
    }

    const settings = await ctx.db.query("adminSettings").collect();
    return settings;
  },
});

// Enable app access for a user (called after successful payment)
export const enableAppAccess = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    appKey: v.string(),
    paymentProvider: v.string(),
    paymentId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    billingCycle: v.string(),
    paypalSubscriptionId: v.optional(v.string()),
    paypalPlanId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("UNAUTHORIZED: User not found");
    }

    const now = Date.now();

    // Create or update app subscription
    const existingSubscription = await ctx.db
      .query("appSubscriptions")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .filter((q) => q.eq(q.field("appKey"), args.appKey))
      .first();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        paymentProvider: args.paymentProvider,
        paymentStatus: "completed",
        paymentId: args.paymentId,
        status: "active",
        startDate: now,
        endDate: args.billingCycle === "yearly" ? now + 365 * 24 * 60 * 60 * 1000 : now + 30 * 24 * 60 * 60 * 1000,
        paypalSubscriptionId: args.paypalSubscriptionId,
        paypalPlanId: args.paypalPlanId,
        updatedAt: now,
      });
    } else {
      // Create new subscription
      await ctx.db.insert("appSubscriptions", {
        userId: args.userId,
        companyId: args.companyId,
        appKey: args.appKey,
        paymentProvider: args.paymentProvider,
        paymentStatus: "completed",
        paymentId: args.paymentId,
        amount: args.amount,
        currency: args.currency,
        billingCycle: args.billingCycle,
        status: "active",
        startDate: now,
        endDate: args.billingCycle === "yearly" ? now + 365 * 24 * 60 * 60 * 1000 : now + 30 * 24 * 60 * 60 * 1000,
        paypalSubscriptionId: args.paypalSubscriptionId,
        paypalPlanId: args.paypalPlanId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Enable app in company record
    const company = await ctx.db.get(args.companyId);
    if (company) {
      const enabledApps = company.enabledApps || {};
      await ctx.db.patch(args.companyId, {
        enabledApps: {
          ...enabledApps,
          [args.appKey]: {
            enabled: true,
            enabledAt: now,
          },
        },
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Get app subscription for a user/company
export const getAppSubscription = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    appKey: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("appSubscriptions")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .filter((q) => q.eq(q.field("appKey"), args.appKey))
      .first();

    return subscription || null;
  },
});

// Get all subscriptions for a user
export const getUserSubscriptions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("appSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return subscriptions;
  },
});

// Update subscription by payment ID (for webhooks)
export const updateSubscriptionByPaymentId = mutation({
  args: {
    paymentId: v.string(),
    paymentStatus: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("appSubscriptions")
      .withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
      .first();

    if (!subscription) {
      throw new Error("NOT_FOUND: Subscription not found");
    }

    const now = Date.now();
    await ctx.db.patch(subscription._id, {
      paymentStatus: args.paymentStatus,
      ...(args.status && { status: args.status }),
      updatedAt: now,
    });

    return { success: true };
  },
});
