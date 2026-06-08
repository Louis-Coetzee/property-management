import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Booking Payment Settings
 * Separate payment settings specifically for the booking system
 */

// Get booking payment settings for a company (public - no auth required)
export const getBookingPaymentSettingsPublic = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    try {
      const settings = await ctx.db
        .query("bookingPaymentSettings")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .first();

      return settings;
    } catch (error) {
      console.error("Error fetching booking payment settings:", error);
      return null;
    }
  },
});

// Get booking payment settings for a company (authenticated)
export const getBookingPaymentSettings = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    try {
      const settings = await ctx.db
        .query("bookingPaymentSettings")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .first();

      return settings;
    } catch (error) {
      console.error("Error fetching booking payment settings:", error);
      return null;
    }
  },
});

// Create or update booking payment settings
export const updateBookingPaymentSettings = mutation({
  args: {
    companyId: v.id("companies"),
    payfast: v.optional(v.object({
      enabled: v.boolean(),
      testMode: v.boolean(),
      merchantId: v.string(),
      merchantKey: v.string(),
      passphrase: v.optional(v.string()),
    })),
    paypal: v.optional(v.object({
      enabled: v.boolean(),
      testMode: v.boolean(),
      testClientId: v.string(),
      testClientSecret: v.string(),
      liveClientId: v.string(),
      liveClientSecret: v.string(),
    })),
    allowCashPayment: v.optional(v.boolean()),
    requirePrepayment: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    try {
      // Check if settings exist
      const existing = await ctx.db
        .query("bookingPaymentSettings")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .first();

      if (existing) {
        // Update existing settings
        await ctx.db.patch(existing._id, {
          payfast: args.payfast,
          paypal: args.paypal,
          allowCashPayment: args.allowCashPayment,
          requirePrepayment: args.requirePrepayment,
          updatedAt: now,
        });
        return existing._id;
      } else {
        // Create new settings
        const newId = await ctx.db.insert("bookingPaymentSettings", {
          companyId: args.companyId,
          payfast: args.payfast,
          paypal: args.paypal,
          allowCashPayment: args.allowCashPayment ?? true,
          requirePrepayment: args.requirePrepayment ?? false,
          createdAt: now,
          updatedAt: now,
        });
        return newId;
      }
    } catch (error) {
      console.error("Error updating booking payment settings:", error);
      throw error;
    }
  },
});