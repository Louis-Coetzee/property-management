import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSiteByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const originalDomain = args.domain.toLowerCase();
    let site = await ctx.db
      .query("sites")
      .withIndex("by_domain", (q) => q.eq("domain", originalDomain))
      .first();
    if (!site && originalDomain.startsWith('www.')) {
      const domainWithoutWww = originalDomain.substring(4);
      site = await ctx.db
        .query("sites")
        .withIndex("by_domain", (q) => q.eq("domain", domainWithoutWww))
        .first();
    }
    if (!site && !originalDomain.startsWith('www.')) {
      const domainWithWww = `www.${originalDomain}`;
      site = await ctx.db
        .query("sites")
        .withIndex("by_domain", (q) => q.eq("domain", domainWithWww))
        .first();
    }
    return site;
  },
});

export const getSiteById = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.siteId);
  },
});

export const getAllSites = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sites").collect();
  },
});

export const createSite = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    domain: v.string(),
    isActive: v.boolean(),
    logo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("User not found");
    const existingSite = await ctx.db
      .query("sites")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain.toLowerCase()))
      .first();
    if (existingSite) throw new ConvexError("Domain is already taken");
    const siteId = await ctx.db.insert("sites", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      domain: args.domain.toLowerCase(),
      isActive: args.isActive,
      logo: args.logo,
      userRoles: [{ userId: args.userId, roles: ["admin", "user"] }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { success: true, siteId };
  },
});

export const adminCreateSite = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    domain: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existingSite = await ctx.db
      .query("sites")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain.toLowerCase()))
      .first();
    if (existingSite) throw new ConvexError("Domain is already taken");
    const siteId = await ctx.db.insert("sites", {
      name: args.name,
      description: args.description,
      domain: args.domain.toLowerCase(),
      isActive: args.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { success: true, siteId };
  },
});

export const updateSiteSettings = mutation({
  args: {
    siteId: v.id("sites"),
    settings: v.any(),
  },
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.siteId);
    if (!site) throw new ConvexError("Site not found");
    await ctx.db.patch(args.siteId, {
      settings: args.settings,
      updatedAt: new Date().toISOString(),
    });
    return await ctx.db.get(args.siteId);
  },
});

export const getSiteByName = query({
  args: { siteName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sites")
      .filter((q) => q.eq(q.field("name"), args.siteName))
      .first();
  },
});

export const getSiteModeStatus = query({
  args: {},
  handler: async (ctx) => {
    const sites = await ctx.db.query("sites").collect();
    if (!sites || sites.length === 0) {
      return { comingSoonEnabled: false, maintenanceEnabled: false, message: '' };
    }
    const mainSite = sites[0];
    const siteMode = mainSite.settings?.siteMode;
    if (!siteMode) {
      return { comingSoonEnabled: false, maintenanceEnabled: false, message: '' };
    }
    return {
      comingSoonEnabled: siteMode.comingSoonEnabled || false,
      maintenanceEnabled: siteMode.maintenanceEnabled || false,
      comingSoonMessage: siteMode.comingSoonMessage || '',
      maintenanceMessage: siteMode.maintenanceMessage || '',
    };
  },
});
