import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSiteSettings = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    return settings ?? null;
  },
});

export const getAllSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("siteSettings").collect();
  },
});

export const upsertSiteSettings = mutation({
  args: {
    key: v.string(),
    settings: v.any(),
    updatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        settings: args.settings,
        updatedAt: now,
        updatedBy: args.updatedBy,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("siteSettings", {
        key: args.key,
        settings: args.settings,
        updatedAt: now,
        updatedBy: args.updatedBy,
      });
    }
  },
});
