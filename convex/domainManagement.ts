import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { stripPlatformDomain } from './domainUtils';

// Entity types for domain management
export const ENTITY_TYPES = {
  WEBSITE: "website",
  CALENDAR: "calendar",
  STORE: "store",
  BUSINESS: "business",
  COURSE_SITE: "courseSite",
  PROPERTY_SITE: "propertySite",
  SCHEDULER: "scheduler",
  VEHICLE_DEALERSHIP_SITE: "vehicleDealershipSite",
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

// Domain types
export const DOMAIN_TYPES = {
  SUBDOMAIN: "subdomain",
  CUSTOM: "custom",
} as const;

export type DomainType = (typeof DOMAIN_TYPES)[keyof typeof DOMAIN_TYPES];

// Get all domains for an entity
export const getEntityDomains = query({
  args: {
    entityId: v.id("websites"),
    entityType: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const domains = await ctx.db
        .query("domainMappings")
        .withIndex("by_entity", (q) =>
          q.eq("entityId", args.entityId).eq("entityType", args.entityType)
        )
        .collect();

      // Separate into subdomains and custom domains
      const subDomains = domains
        .filter((d) => d.domainType === DOMAIN_TYPES.SUBDOMAIN)
        .map((d) => d.domainValue);

      const customDomains = domains
        .filter((d) => d.domainType === DOMAIN_TYPES.CUSTOM)
        .map((d) => d.domainValue);

      return {
        subDomains,
        customDomains,
      };
    } catch (error) {
      console.error('Error fetching entity domains:', error);
      throw error;
    }
  },
});

// Get all domains for a company
export const getCompanyDomains = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    try {
      const domains = await ctx.db
        .query("domainMappings")
        .withIndex("by_company", (q) =>
          q.eq("companyId", args.companyId)
        )
        .collect();

      return domains;
    } catch (error) {
      console.error('Error fetching company domains:', error);
      throw error;
    }
  },
});

// Get domain mapping by domain value (for registration lookup)
export const getDomainMapping = query({
  args: {
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Try to find by exact domain value match
      const mapping = await ctx.db
        .query("domainMappings")
        .withIndex("by_domain_value", (q) =>
          q.eq("domainValue", args.domain)
        )
        .first();

      // If not found, try removing subdomain prefix
      if (!mapping) {
        const subdomainPart = stripPlatformDomain(args.domain);
        const subMapping = await ctx.db
          .query("domainMappings")
          .withIndex("by_domain_value", (q) =>
            q.eq("domainValue", subdomainPart)
          )
          .first();
        return subMapping || null;
      }

      return mapping;
    } catch (error) {
      console.error('Error fetching domain mapping:', error);
      return null;
    }
  },
});

// Add a custom domain to a company
export const addCompanyCustomDomain = mutation({
  args: {
    companyId: v.id("companies"),
    customDomain: v.string(),
    requestingUserId: v.id("users"),
    domainType: v.optional(v.union(v.literal("subdomain"), v.literal("custom"))),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      const domainType = args.domainType || "custom";

      // Check if domain already exists for this company
      const existing = await ctx.db
        .query("domainMappings")
        .withIndex("by_company", (q) =>
          q.eq("companyId", args.companyId)
        )
        .filter((q) =>
          q.eq(q.field("domainValue"), args.customDomain)
        )
        .first();

      if (existing) {
        throw new Error("Domain already exists for this company");
      }

      // Check if domain is used by another company
      const globalCheck = await ctx.db
        .query("domainMappings")
        .withIndex("by_domain_value", (q) => q.eq("domainValue", args.customDomain))
        .first();

      if (globalCheck) {
        throw new Error("Domain is already in use");
      }

      // Add the domain - cast entityId to any to handle both website and company IDs
      const domainMappingId = await ctx.db.insert("domainMappings", {
        companyId: args.companyId,
        entityId: args.companyId as any,
        entityType: "company",
        domainType: domainType,
        domainValue: args.customDomain,
        status: domainType === "subdomain" ? "active" : "pending_configuration",
        lastChecked: now,
        createdBy: args.requestingUserId,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, domainMappingId };
    } catch (error) {
      console.error('Error adding domain to company:', error);
      throw error;
    }
  },
});

// Remove a domain from a company (can be subdomain or custom domain)
export const removeCompanyCustomDomain = mutation({
  args: {
    companyId: v.id("companies"),
    domainId: v.id("domainMappings"),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const domainMapping = await ctx.db.get(args.domainId);
      
      if (!domainMapping) {
        throw new Error("Domain not found");
      }

      if (domainMapping.companyId !== args.companyId) {
        throw new Error("Domain does not belong to this company");
      }

      await ctx.db.delete(args.domainId);
      
      return { success: true };
    } catch (error) {
      console.error('Error removing domain from company:', error);
      throw error;
    }
  },
});

// Add a subdomain to an entity
export const addSubdomain = mutation({
  args: {
    entityId: v.id("websites"),
    entityType: v.string(),
    subdomain: v.string(),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();

      // Get the website to find its companyId
      const website = await ctx.db.get(args.entityId);
      if (!website) {
        throw new Error("Website not found");
      }
      const companyId = website.companyId;

      // Check if subdomain already exists for this entity
      const existing = await ctx.db
        .query("domainMappings")
        .withIndex("by_entity", (q) =>
          q.eq("entityId", args.entityId).eq("entityType", args.entityType)
        )
        .filter((q) =>
          q.eq(q.field("domainValue"), args.subdomain)
        )
        .first();

      if (existing) {
        throw new Error("Subdomain already exists");
      }

      // Check if subdomain is taken globally (for subdomains)
      const globalCheck = await ctx.db
        .query("domainMappings")
        .withIndex("by_domain_value", (q) =>
          q.eq("domainValue", args.subdomain)
        )
        .first();

      if (globalCheck && globalCheck.entityId !== args.entityId) {
        throw new Error("Subdomain is already in use");
      }

      // Add the subdomain
      const domainMappingId = await ctx.db.insert("domainMappings", {
        companyId: companyId,
        entityId: args.entityId,
        entityType: args.entityType,
        domainType: DOMAIN_TYPES.SUBDOMAIN,
        domainValue: args.subdomain,
        status: "active",
        lastChecked: now,
        createdBy: args.requestingUserId,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, domainMappingId };
    } catch (error) {
      console.error('Error adding subdomain:', error);
      throw error;
    }
  },
});

// Remove a subdomain from an entity
export const removeSubdomain = mutation({
  args: {
    entityId: v.id("websites"),
    entityType: v.string(),
    subdomain: v.string(),
    requestingUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    try {
      // Find the domain mapping
      const domainMapping = await ctx.db
        .query("domainMappings")
        .withIndex("by_entity", (q) =>
          q.eq("entityId", args.entityId).eq("entityType", args.entityType)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("domainType"), DOMAIN_TYPES.SUBDOMAIN),
            q.eq(q.field("domainValue"), args.subdomain)
          )
        )
        .first();

      if (!domainMapping) {
        throw new Error("Subdomain not found for this entity");
      }

      // Delete the domain mapping
      await ctx.db.delete(domainMapping._id);

      return { success: true };
    } catch (error) {
      console.error('Error removing subdomain:', error);
      throw error;
    }
  },
});

// Add a custom domain to an entity
export const addCustomDomain = mutation({
  args: {
    entityId: v.id("websites"),
    entityType: v.string(),
    customDomain: v.string(),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();

      // Get the website to find its companyId
      const website = await ctx.db.get(args.entityId);
      if (!website) {
        throw new Error("Website not found");
      }
      const companyId = website.companyId;

      // Check if custom domain already exists for this entity
      const existing = await ctx.db
        .query("domainMappings")
        .withIndex("by_entity", (q) =>
          q.eq("entityId", args.entityId).eq("entityType", args.entityType)
        )
        .filter((q) =>
          q.eq(q.field("domainValue"), args.customDomain)
        )
        .first();

      if (existing) {
        throw new Error("Custom domain already exists for this entity");
      }

      // Check if custom domain is used by another entity
      const globalCheck = await ctx.db
        .query("domainMappings")
        .withIndex("by_domain_value", (q) => q.eq("domainValue", args.customDomain))
        .filter((q) => q.eq(q.field("domainType"), DOMAIN_TYPES.CUSTOM))
        .first();

      if (globalCheck && globalCheck.entityId !== args.entityId) {
        throw new Error("Custom domain is already in use");
      }

      // Add the custom domain
      const domainMappingId = await ctx.db.insert("domainMappings", {
        companyId: companyId,
        entityId: args.entityId,
        entityType: args.entityType,
        domainType: DOMAIN_TYPES.CUSTOM,
        domainValue: args.customDomain,
        status: "pending_configuration",
        lastChecked: now,
        createdBy: args.requestingUserId,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, domainMappingId };
    } catch (error) {
      console.error('Error adding custom domain:', error);
      throw error;
    }
  },
});

// Remove a custom domain from an entity
export const removeCustomDomain = mutation({
  args: {
    entityId: v.id("websites"),
    entityType: v.string(),
    customDomain: v.string(),
    requestingUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    try {
      // Find the domain mapping
      const domainMapping = await ctx.db
        .query("domainMappings")
        .withIndex("by_entity", (q) =>
          q.eq("entityId", args.entityId).eq("entityType", args.entityType)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("domainType"), DOMAIN_TYPES.CUSTOM),
            q.eq(q.field("domainValue"), args.customDomain)
          )
        )
        .first();

      if (!domainMapping) {
        throw new Error("Custom domain not found for this entity");
      }

      // Delete the domain mapping
      await ctx.db.delete(domainMapping._id);

      return { success: true };
    } catch (error) {
      console.error('Error removing custom domain:', error);
      throw error;
    }
  },
});

// Update domain status (for DNS verification)
export const updateDomainStatus = mutation({
  args: {
    domainMappingId: v.id("domainMappings"),
    status: v.string(),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      await ctx.db.patch(args.domainMappingId, {
        status: args.status,
        lastChecked: now,
        updatedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating domain status:', error);
      throw error;
    }
  },
});

// Check if a subdomain is available globally
export const checkSubdomainAvailability = query({
  args: {
    subdomain: v.string(),
    excludeEntityId: v.optional(v.union(v.id("websites"), v.id("companies"))),
    excludeEntityType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const existing = await ctx.db
        .query("domainMappings")
        .withIndex("by_domain_value", (q) => q.eq("domainValue", args.subdomain))
        .filter((q) => q.eq(q.field("domainType"), DOMAIN_TYPES.SUBDOMAIN))
        .first();

      if (!existing) {
        return { available: true, message: "Subdomain is available" };
      }

      if (args.excludeEntityId && existing.entityId === args.excludeEntityId) {
        return { available: true, message: "Subdomain is available" };
      }

      return { available: false, message: "Subdomain is already in use" };
    } catch (error) {
      console.error('Error checking subdomain availability:', error);
      throw error;
    }
  },
});

// Check if a custom domain is available globally
export const checkCustomDomainAvailability = query({
  args: {
    customDomain: v.string(),
    excludeEntityId: v.optional(v.union(v.id("websites"), v.id("companies"))),
    excludeEntityType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const existing = await ctx.db
        .query("domainMappings")
        .withIndex("by_domain_value", (q) => q.eq("domainValue", args.customDomain))
        .filter((q) => q.eq(q.field("domainType"), DOMAIN_TYPES.CUSTOM))
        .first();

      if (!existing) {
        return { available: true, message: "Custom domain is available" };
      }

      // If excluding an entity, check if the existing domain belongs to that entity
      if (args.excludeEntityId && existing.entityId === args.excludeEntityId) {
        return { available: true, message: "Custom domain is available" };
      }

      return { available: false, message: "Custom domain is already in use" };
    } catch (error) {
      console.error('Error checking custom domain availability:', error);
      throw error;
    }
  },
});
