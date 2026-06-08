import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get integration settings by name
export const getIntegrationByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    return integration;
  },
});

// Get all integration settings
export const getAllIntegrations = query({
  handler: async (ctx) => {
    const integrations = await ctx.db.query("integrations").collect();
    return integrations;
  },
});

// Save or update integration settings
export const saveIntegration = mutation({
  args: {
    name: v.string(),
    config: v.record(v.string(), v.any()),
    mode: v.optional(v.string()),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if integration already exists
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        config: args.config,
        mode: args.mode,
        enabled: args.enabled,
        updatedAt: now,
      });
      return { ...existing, config: args.config, mode: args.mode, enabled: args.enabled, updatedAt: now };
    } else {
      // Create new
      const id = await ctx.db.insert("integrations", {
        name: args.name,
        config: args.config,
        mode: args.mode,
        enabled: args.enabled,
        createdAt: now,
        updatedAt: now,
      });
      return { _id: id, ...args, createdAt: now, updatedAt: now };
    }
  },
});

// Get BobGo integration settings (convenience function)
export const getBobgoSettings = query({
  handler: async (ctx) => {
    const bobgo = await ctx.db
      .query("integrations")
      .withIndex("by_name", (q) => q.eq("name", "bobgo"))
      .first();

    return bobgo || null;
  },
});

// Save BobGo settings (convenience mutation)
export const saveBobgoSettings = mutation({
  args: {
    sandboxApiKey: v.string(),
    sandboxApiSecret: v.string(),
    liveApiKey: v.string(),
    liveApiSecret: v.string(),
    sandboxUserEmail: v.string(),
    sandboxUserPassword: v.string(),
    liveUserEmail: v.string(),
    liveUserPassword: v.string(),
    enabled: v.boolean(),
    mode: v.string(), // "sandbox" | "live"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const config = {
      sandboxApiKey: args.sandboxApiKey,
      sandboxApiSecret: args.sandboxApiSecret,
      liveApiKey: args.liveApiKey,
      liveApiSecret: args.liveApiSecret,
      sandboxUserEmail: args.sandboxUserEmail,
      sandboxUserPassword: args.sandboxUserPassword,
      liveUserEmail: args.liveUserEmail,
      liveUserPassword: args.liveUserPassword,
    };

    // Check if bobgo integration already exists
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_name", (q) => q.eq("name", "bobgo"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        config,
        mode: args.mode,
        enabled: args.enabled,
        updatedAt: now,
      });
      return { success: true, updated: true };
    } else {
      await ctx.db.insert("integrations", {
        name: "bobgo",
        config,
        mode: args.mode,
        enabled: args.enabled,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, created: true };
    }
  },
});