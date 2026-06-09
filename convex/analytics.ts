import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create analytics record
export const create = internalMutation({
  args: {
    eventType: v.union(
      v.literal("page_view"),
      v.literal("contact_view"),
      v.literal("contact_form_submission"),
      v.literal("listing_contact_form"),
      v.literal("home_page_view"),
      v.literal("contact_page_view"),
      v.literal("listing_page_view")
    ),
    entityId: v.optional(v.union(v.id("listings"), v.id("users"), v.string())),
    entityType: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    metadata: v.optional(v.object({
      listingId: v.optional(v.id("listings")),
      listingTitle: v.optional(v.string()),
      hostId: v.optional(v.id("users")),
      page: v.optional(v.string()),
      referrer: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      location: v.optional(v.string()),
      formData: v.optional(v.any()),
      contactEmail: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
    })),
    timestamp: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analytics", {
      eventType: args.eventType,
      entityId: args.entityId,
      entityType: args.entityType,
      userId: args.userId,
      sessionId: args.sessionId,
      metadata: args.metadata,
      timestamp: args.timestamp,
      createdAt: args.createdAt,
    });
  },
});

// Get analytics by event type
export const getByEventType = query({
  args: {
    eventType: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_event_type", (q) => q.eq("eventType", args.eventType as any))
      .order("desc")
      .take(args.limit || 100);
    
    return analytics;
  },
});

// Get analytics for a specific entity (e.g., listing)
export const getByEntity = query({
  args: {
    entityId: v.union(v.id("listings"), v.id("users"), v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .order("desc")
      .take(args.limit || 100);
    
    return analytics;
  },
});

// Get analytics count by event type for a specific entity
export const getCountByEventType = query({
  args: {
    entityId: v.union(v.id("listings"), v.id("users"), v.string()),
    eventType: v.string(),
  },
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .filter((q) => q.eq(q.field("eventType"), args.eventType))
      .collect();
    
    return analytics.length;
  },
});

// Get page view analytics
export const getPageViewStats = query({
  args: {
    page: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("analytics")
      .withIndex("by_event_type", (q) => q.eq("eventType", "page_view"));

    if (args.page) {
      query = query.filter((q) => q.eq(q.field("metadata.page"), args.page));
    }

    if (args.dateFrom) {
      query = query.filter((q) => q.gte(q.field("timestamp"), args.dateFrom!));
    }

    if (args.dateTo) {
      query = query.filter((q) => q.lte(q.field("timestamp"), args.dateTo!));
    }

    const analytics = await query.collect();
    
    return {
      total: analytics.length,
      analytics: analytics.slice(0, 100),
    };
  },
});

// Get listing analytics summary
export const getListingAnalytics = query({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_entity", (q) => q.eq("entityId", args.listingId))
      .collect();

    const summary = {
      pageViews: 0,
      contactViews: 0,
      contactFormSubmissions: 0,
    };

    analytics.forEach((event) => {
      switch (event.eventType) {
        case "listing_page_view":
          summary.pageViews++;
          break;
        case "contact_view":
          summary.contactViews++;
          break;
        case "listing_contact_form":
          summary.contactFormSubmissions++;
          break;
      }
    });

    return summary;
  },
});

// Get general analytics dashboard data
export const getDashboardStats = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("analytics");

    if (args.dateFrom) {
      query = query.filter((q) => q.gte(q.field("timestamp"), args.dateFrom!));
    }

    if (args.dateTo) {
      query = query.filter((q) => q.lte(q.field("timestamp"), args.dateTo!));
    }

    const analytics = await query.collect();

    const stats = {
      totalEvents: analytics.length,
      pageViews: 0,
      contactViews: 0,
      contactFormSubmissions: 0,
      homePageViews: 0,
      contactPageViews: 0,
      listingPageViews: 0,
    };

    analytics.forEach((event) => {
      switch (event.eventType) {
        case "page_view":
          stats.pageViews++;
          break;
        case "contact_view":
          stats.contactViews++;
          break;
        case "contact_form_submission":
          stats.contactFormSubmissions++;
          break;
        case "home_page_view":
          stats.homePageViews++;
          break;
        case "contact_page_view":
          stats.contactPageViews++;
          break;
        case "listing_page_view":
          stats.listingPageViews++;
          break;
      }
    });

    return stats;
  },
}); 
