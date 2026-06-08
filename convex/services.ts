import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all active services for a company
export const listActiveForCompany = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const services = await ctx.db
      .query("services")
      .withIndex("by_company_active", (q) => 
        q.eq("companyId", args.companyId).eq("isActive", true)
      )
      .order("asc")
      .collect();

    return services;
  },
});

// Get all services for a company
export const getServicesByCompany = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const services = await ctx.db
      .query("services")
      .withIndex("by_company_active", (q) => q.eq("companyId", args.companyId))
      .order("asc")
      .collect();

    return services;
  },
});

// Get a single service by ID
export const getServiceById = query({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.serviceId);
  },
});

// Create a new service
export const createService = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    price: v.number(),
    duration: v.optional(v.number()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const serviceId = await ctx.db.insert("services", {
      companyId: args.companyId,
      name: args.name,
      description: args.description,
      category: args.category,
      price: args.price,
      duration: args.duration,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
      sortOrder: now,
    });

    return serviceId;
  },
});

// Update a service
export const updateService = mutation({
  args: {
    serviceId: v.id("services"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    price: v.optional(v.number()),
    duration: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { serviceId, ...updates } = args;

    const existingService = await ctx.db.get(serviceId);
    if (!existingService) {
      throw new Error("Service not found");
    }

    await ctx.db.patch(serviceId, updates);

    return serviceId;
  },
});

// Delete a service
export const deleteService = mutation({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const existingService = await ctx.db.get(args.serviceId);
    if (!existingService) {
      throw new Error("Service not found");
    }

    await ctx.db.delete(args.serviceId);

    return args.serviceId;
  },
});

// Toggle service active status
export const toggleService = mutation({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const existingService = await ctx.db.get(args.serviceId);
    if (!existingService) {
      throw new Error("Service not found");
    }

    await ctx.db.patch(args.serviceId, {
      isActive: !existingService.isActive,
    });

    return args.serviceId;
  },
});

// Reorder services
export const reorderServices = mutation({
  args: {
    serviceIds: v.array(v.id("services")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.serviceIds.length; i++) {
      await ctx.db.patch(args.serviceIds[i], {
        sortOrder: i,
      });
    }

    return true;
  },
});

// Get services by website (for website builder showcase)
export const getServicesByWebsite = query({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // Get the website to find the associated company
    const website = await ctx.db.get(args.websiteId);
    if (!website) {
      throw new Error("Website not found");
    }

    // Get all services for this company
    const services = await ctx.db
      .query("services")
      .withIndex("by_company_active", (q) => q.eq("companyId", website.companyId))
      .collect();

    return services;
  },
});

// Get active services by website (public, for frontend rendering)
export const getActiveServicesByWebsitePublic = query({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // Get the website to find the associated company
    const website = await ctx.db.get(args.websiteId);
    if (!website) {
      return [];
    }

    // Get all active services for this company
    const services = await ctx.db
      .query("services")
      .withIndex("by_company_active", (q) =>
        q.eq("companyId", website.companyId).eq("isActive", true)
      )
      .collect();

    // Sort by sortOrder
    services.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return services;
  },
});

// Get service categories by website
export const getServiceCategoriesByWebsite = query({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // Get the website to find the associated company
    const website = await ctx.db.get(args.websiteId);
    if (!website) {
      return [];
    }

    const services = await ctx.db
      .query("services")
      .withIndex("by_company_active", (q) => q.eq("companyId", website.companyId))
      .collect();

    // Get unique categories
    const categories = new Set<string>();
    services.forEach((service) => {
      if (service.category) {
        categories.add(service.category);
      }
    });

    return Array.from(categories).sort();
  },
});
