import { query } from "./_generated/server";
import { v } from "convex/values";

// Get an app by its domain
export const getAppByDomain = query({
  args: {
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get all apps and find the one with the matching domain
      const apps = await ctx.db
        .query("apps")
        .collect();

      // Find the app that contains this domain in its domains array
      const app = apps.find(app =>
        app.domains && app.domains.includes(args.domain)
      );

      return app || null;
    } catch (error) {
      console.error('Error fetching app by domain:', error);
      throw error;
    }
  },
});

// Get an app by ID
export const getAppById = query({
  args: {
    appId: v.id("apps"),
  },
  handler: async (ctx, args) => {
    try {
      const app = await ctx.db.get(args.appId);
      return app;
    } catch (error) {
      console.error('Error fetching app by ID:', error);
      throw error;
    }
  },
});
