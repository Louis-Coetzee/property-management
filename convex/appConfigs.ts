import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all app configurations (admin only)
export const getAllAppConfigs = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the user to check if they're admin
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("UNAUTHORIZED: User not found");
    }

    // Check if user is admin (check userType field)
    if (user.userType !== "admin" && user.userType !== "administrator") {
      throw new Error("FORBIDDEN: Admin access required");
    }

    const appConfigs = await ctx.db
      .query("appConfigs")
      .collect();

    return appConfigs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },
});

// Get public app configurations (for displaying on company apps page)
export const getPublicAppConfigs = query({
  args: {},
  handler: async (ctx) => {
    const appConfigs = await ctx.db
      .query("appConfigs")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Return only public-facing data
    return appConfigs
      .filter(config => !config.isComingSoon)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(config => ({
        _id: config._id,
        appKey: config.appKey,
        name: config.name,
        description: config.description,
        icon: config.icon,
        gradient: config.gradient,
        features: config.features,
        pricing: config.pricing || null,
      }));
  },
});

// Get app config by key
export const getAppConfigByKey = query({
  args: {
    appKey: v.string(),
  },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("appConfigs")
      .withIndex("by_app_key", (q) => q.eq("appKey", args.appKey))
      .collect();

    return configs[0] || null;
  },
});

// Update app configuration
export const updateAppConfig = mutation({
  args: {
    userId: v.id("users"),
    appConfigId: v.id("appConfigs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    gradient: v.optional(v.string()),
    pricing: v.optional(v.object({
      monthlyPrice: v.number(),
      currency: v.optional(v.string()),
      enabled: v.boolean(),
    })),
    features: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    isComingSoon: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
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

    const existing = await ctx.db.get(args.appConfigId);
    if (!existing) {
      throw new Error("NOT_FOUND: App configuration not found");
    }

    const now = Date.now();
    const updateData: any = {
      updatedAt: now,
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.icon !== undefined) updateData.icon = args.icon;
    if (args.gradient !== undefined) updateData.gradient = args.gradient;
    if (args.pricing !== undefined) updateData.pricing = args.pricing;
    if (args.features !== undefined) updateData.features = args.features;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;
    if (args.isComingSoon !== undefined) updateData.isComingSoon = args.isComingSoon;
    if (args.sortOrder !== undefined) updateData.sortOrder = args.sortOrder;

    await ctx.db.patch(args.appConfigId, updateData);

    return { success: true };
  },
});

// Update app pricing
export const updateAppPricing = mutation({
  args: {
    userId: v.id("users"),
    appConfigId: v.id("appConfigs"),
    pricing: v.object({
      monthlyPrice: v.number(),
      currency: v.optional(v.string()),
      enabled: v.boolean(),
    }),
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

    const existing = await ctx.db.get(args.appConfigId);
    if (!existing) {
      throw new Error("NOT_FOUND: App configuration not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.appConfigId, {
      pricing: args.pricing,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Initialize default app configurations
export const initializeDefaultApps = mutation({
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

    const now = Date.now();
    const defaultApps = [
      {
        appKey: "businessTools",
        name: "Business Tools",
        description: "Essential tools for daily operations",
        icon: "Wrench",
        gradient: "bg-gradient-to-r from-blue-500 to-blue-600",
        features: [
          "Client management & CRM",
          "Products & services catalog",
          "Quotes & invoices",
          "Payment tracking",
          "Lead management",
          "User roles and departments",
          "Team messaging & collaboration",
          "File storage & sharing",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 1,
      },
      {
        appKey: "websites",
        name: "Website Builder",
        description: "Create and manage professional websites",
        icon: "Globe",
        gradient: "bg-gradient-to-r from-purple-500 to-purple-600",
        features: [
          "Custom domains",
          "Multiple pages per site",
          "Customizable template",
          "Forms & lead capture",
          "Responsive design",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 2,
      },
      {
        appKey: "onlineStore",
        name: "Online Store",
        description: "Sell products and services online",
        icon: "ShoppingBag",
        gradient: "bg-gradient-to-r from-orange-500 to-orange-600",
        features: [
          "Shopping cart & checkout",
          "Payment gateways",
          "Integrate with business tools",
          "Integrate with website builder",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 3,
      },
      {
        appKey: "bookingsApp",
        name: "Booking System",
        description: "Manage appointments and bookings",
        icon: "Calendar",
        gradient: "bg-gradient-to-r from-cyan-500 to-cyan-600",
        features: [
          "Online appointment scheduling",
          "Automated reminders",
          "Service & staff management",
          "Payment gateways",
          "Integrate with business tools",
          "Integrate with website builder",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 4,
      },
      {
        appKey: "vehicleDealership",
        name: "Vehicle Dealership",
        description: "Complete vehicle inventory management",
        icon: "Car",
        gradient: "bg-gradient-to-r from-emerald-500 to-emerald-600",
        features: [
          "Vehicle inventory management",
          "Online listings showcase",
          "Multi-branch support",
          "Access to all business tools",
          "Access to website builder",
          "Integrations with Auto Trader and Easy Quotes",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 5,
      },
      {
        appKey: "realEstate",
        name: "Real Estate",
        description: "Property listings and management",
        icon: "Home",
        gradient: "bg-gradient-to-r from-teal-500 to-teal-600",
        features: [
          "Property listings management",
          "Advanced search & filtering",
          "Lead capture forms",
          "Integrate with business tools",
          "Integrate with website builder",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 6,
      },
    ];

    const created = [];
    for (const app of defaultApps) {
      const existing = await ctx.db
        .query("appConfigs")
        .withIndex("by_app_key", (q) => q.eq("appKey", app.appKey))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("appConfigs", {
          ...app,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        created.push({ appKey: app.appKey, id });
      }
    }

    return { created, message: `Initialized ${created.length} apps` };
  },
});

// Reset all apps to default configurations
export const resetAppsToDefaults = mutation({
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

    const now = Date.now();
    const defaultApps = [
      {
        appKey: "businessTools",
        name: "Business Tools",
        description: "Essential tools for daily operations",
        icon: "Wrench",
        gradient: "bg-gradient-to-r from-blue-500 to-blue-600",
        features: [
          "Client management & CRM",
          "Products & services catalog",
          "Quotes & invoices",
          "Payment tracking",
          "Lead management",
          "User roles and departments",
          "Team messaging & collaboration",
          "File storage & sharing",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 1,
      },
      {
        appKey: "websites",
        name: "Website Builder",
        description: "Create and manage professional websites",
        icon: "Globe",
        gradient: "bg-gradient-to-r from-purple-500 to-purple-600",
        features: [
          "Custom domains",
          "Multiple pages per site",
          "Customizable template",
          "Forms & lead capture",
          "Responsive design",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 2,
      },
      {
        appKey: "onlineStore",
        name: "Online Store",
        description: "Sell products and services online",
        icon: "ShoppingBag",
        gradient: "bg-gradient-to-r from-orange-500 to-orange-600",
        features: [
          "Shopping cart & checkout",
          "Payment gateways",
          "Integrate with business tools",
          "Integrate with website builder",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 3,
      },
      {
        appKey: "bookingsApp",
        name: "Booking System",
        description: "Manage appointments and bookings",
        icon: "Calendar",
        gradient: "bg-gradient-to-r from-cyan-500 to-cyan-600",
        features: [
          "Online appointment scheduling",
          "Automated reminders",
          "Service & staff management",
          "Payment gateways",
          "Integrate with business tools",
          "Integrate with website builder",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 4,
      },
      {
        appKey: "vehicleDealership",
        name: "Vehicle Dealership",
        description: "Complete vehicle inventory management",
        icon: "Car",
        gradient: "bg-gradient-to-r from-emerald-500 to-emerald-600",
        features: [
          "Vehicle inventory management",
          "Online listings showcase",
          "Multi-branch support",
          "Access to all business tools",
          "Access to website builder",
          "Integrations with Auto Trader and Easy Quotes",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 5,
      },
      {
        appKey: "realEstate",
        name: "Real Estate",
        description: "Property listings and management",
        icon: "Home",
        gradient: "bg-gradient-to-r from-teal-500 to-teal-600",
        features: [
          "Property listings management",
          "Advanced search & filtering",
          "Lead capture forms",
          "Integrate with business tools",
          "Integrate with website builder",
        ],
        pricing: {
          monthlyPrice: 0,
          currency: "ZAR",
          enabled: true,
        },
        sortOrder: 6,
      },
    ];

    const updated = [];
    const created = [];

    for (const app of defaultApps) {
      const existing = await ctx.db
        .query("appConfigs")
        .withIndex("by_app_key", (q) => q.eq("appKey", app.appKey))
        .first();

      if (existing) {
        // Update existing app with new defaults
        await ctx.db.patch(existing._id, {
          name: app.name,
          description: app.description,
          icon: app.icon,
          gradient: app.gradient,
          features: app.features,
          sortOrder: app.sortOrder,
          updatedAt: now,
        });
        updated.push(app.appKey);
      } else {
        // Create new app
        await ctx.db.insert("appConfigs", {
          ...app,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        created.push(app.appKey);
      }
    }

    return {
      updated,
      created,
      message: `Reset ${updated.length} apps, created ${created.length} new apps`
    };
  },
});

// Import app configurations from JSON
export const importAppConfigs = mutation({
  args: {
    userId: v.id("users"),
    configs: v.array(v.object({
      appKey: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      icon: v.optional(v.string()),
      gradient: v.optional(v.string()),
      pricing: v.optional(v.object({
        monthlyPrice: v.number(),
        yearlyPrice: v.optional(v.number()),
        currency: v.optional(v.string()),
        enabled: v.boolean(),
      })),
      features: v.optional(v.array(v.string())),
      isActive: v.optional(v.boolean()),
      isComingSoon: v.optional(v.boolean()),
      sortOrder: v.optional(v.number()),
    })),
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

    const now = Date.now();
    const updated = [];
    const created = [];
    const skipped = [];

    for (const config of args.configs) {
      const existing = await ctx.db
        .query("appConfigs")
        .withIndex("by_app_key", (q) => q.eq("appKey", config.appKey))
        .first();

      if (existing) {
        // Update existing config
        await ctx.db.patch(existing._id, {
          name: config.name,
          description: config.description,
          icon: config.icon,
          gradient: config.gradient,
          pricing: config.pricing,
          features: config.features,
          isActive: config.isActive ?? existing.isActive,
          isComingSoon: config.isComingSoon,
          sortOrder: config.sortOrder,
          updatedAt: now,
        });
        updated.push(config.appKey);
      } else {
        // Create new config
        await ctx.db.insert("appConfigs", {
          appKey: config.appKey,
          name: config.name,
          description: config.description,
          icon: config.icon,
          gradient: config.gradient,
          pricing: config.pricing,
          features: config.features,
          isActive: config.isActive ?? true,
          isComingSoon: config.isComingSoon,
          sortOrder: config.sortOrder,
          createdAt: now,
          updatedAt: now,
        });
        created.push(config.appKey);
      }
    }

    return {
      updated,
      created,
      total: args.configs.length,
      message: `Imported ${args.configs.length} configs: ${updated.length} updated, ${created.length} created`
    };
  },
});
