import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Subscribe to newsletter
export const subscribe = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email, source = "coming_soon", userAgent, ipAddress } = args;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ConvexError("Invalid email format");
    }

    const existingSubscription = await ctx.db
      .query("newsletterSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        throw new ConvexError("This email is already subscribed to our newsletter");
      } else {
        await ctx.db.patch(existingSubscription._id, {
          isActive: true,
          subscribedAt: new Date().toISOString(),
          source,
          userAgent,
          ipAddress,
        });
        return { success: true, message: "Successfully reactivated your subscription!" };
      }
    }

    const subscriptionId = await ctx.db.insert("newsletterSubscriptions", {
      email: email.toLowerCase(),
      subscribedAt: new Date().toISOString(),
      isActive: true,
      source,
      userAgent,
      ipAddress,
    });

    return { success: true, message: "Successfully subscribed to newsletter!", id: subscriptionId };
  },
});

// Unsubscribe from newsletter
export const unsubscribe = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;
    
    const subscription = await ctx.db
      .query("newsletterSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!subscription) {
      throw new ConvexError("Email not found in our newsletter");
    }

    await ctx.db.patch(subscription._id, {
      isActive: false,
    });

    return { success: true, message: "Successfully unsubscribed from newsletter" };
  },
});

// Check if email is subscribed
export const checkSubscription = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;
    
    const subscription = await ctx.db
      .query("newsletterSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    return {
      isSubscribed: !!subscription?.isActive,
      subscribedAt: subscription?.subscribedAt,
    };
  },
});

// Get all active subscriptions (admin only)
export const getAllActiveSubscriptions = query({
  args: {},
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("newsletterSubscriptions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();

    return subscriptions.map(sub => ({
      id: sub._id,
      email: sub.email,
      subscribedAt: sub.subscribedAt,
      source: sub.source,
    }));
  },
});

// Get subscription statistics
export const getStats = query({
  args: {},
  handler: async (ctx, args) => {
    const allSubscriptions = await ctx.db.query("newsletterSubscriptions").collect();
    
    const active = allSubscriptions.filter(sub => sub.isActive).length;
    const inactive = allSubscriptions.filter(sub => !sub.isActive).length;
    
    const bySource = allSubscriptions.reduce((acc, sub) => {
      if (!sub.isActive) return acc;
      const source = sub.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSubscriptions = allSubscriptions.filter(
      sub => sub.isActive && new Date(sub.subscribedAt) > sevenDaysAgo
    ).length;

    return {
      total: allSubscriptions.length,
      active,
      inactive,
      recent: recentSubscriptions,
      bySource,
    };
  },
}); 
