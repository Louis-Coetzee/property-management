import { query } from "./_generated/server";
import { v } from "convex/values";

// Check if a subdomain is available
export const checkSubdomainAvailability = query({
  args: {
    subdomain: v.string(),
    excludeWebsiteId: v.optional(v.union(v.id("websites"), v.id("companies"))),
  },
  handler: async (ctx, args) => {
    try {
      // Normalize subdomain and construct full domain
      const normalizedSubdomain = args.subdomain.toLowerCase().trim();
      const SUBDOMAIN_BASE = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';
      const fullDomain = `${normalizedSubdomain}.${SUBDOMAIN_BASE}`;

      // Get all active websites and check if the domain exists in their domains array
      const websites = await ctx.db
        .query("websites")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      const existingWebsite = websites.find(website => website.domains?.includes(fullDomain));

      // If found and not the current website (for editing)
      if (existingWebsite) {
        if (args.excludeWebsiteId && existingWebsite._id === args.excludeWebsiteId) {
          return { available: true, message: "Subdomain is available" };
        }
        return {
          available: false,
          message: "This subdomain is already taken. Please choose another."
        };
      }

      return { available: true, message: "Subdomain is available" };
    } catch (error) {
      console.error('Error checking subdomain availability:', error);
      return { available: false, message: "Error checking subdomain availability" };
    }
  },
});

// Check if a custom domain is available
export const checkCustomDomainAvailability = query({
  args: {
    customDomain: v.string(),
    excludeWebsiteId: v.optional(v.union(v.id("websites"), v.id("companies"))),
  },
  handler: async (ctx, args) => {
    try {
      // Normalize domain
      const normalizedDomain = args.customDomain.toLowerCase().trim();

      // Get all active websites and check if the domain exists in their domains array
      const websites = await ctx.db
        .query("websites")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      const existingWebsite = websites.find(website => website.domains?.includes(normalizedDomain));

      // If found and not the current website (for editing)
      if (existingWebsite) {
        if (args.excludeWebsiteId && existingWebsite._id === args.excludeWebsiteId) {
          return { available: true, message: "Domain is available" };
        }
        return {
          available: false,
          message: "This domain is already in use. Please choose another."
        };
      }

      return { available: true, message: "Domain is available" };
    } catch (error) {
      console.error('Error checking custom domain availability:', error);
      return { available: false, message: "Error checking domain availability" };
    }
  },
});

// Validate subdomain format
export const validateSubdomainFormat = query({
  args: {
    subdomain: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const subdomain = args.subdomain.toLowerCase().trim();

      // Check length
      if (subdomain.length < 3) {
        return {
          valid: false,
          message: "Subdomain must be at least 3 characters long"
        };
      }

      if (subdomain.length > 63) {
        return {
          valid: false,
          message: "Subdomain must be less than 64 characters"
        };
      }

      // Check format: only lowercase letters, numbers, and hyphens
      // Must start and end with letter or number
      const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

      if (!subdomainRegex.test(subdomain)) {
        return {
          valid: false,
          message: "Subdomain can only contain lowercase letters, numbers, and hyphens. Must start and end with a letter or number."
        };
      }

      // Check for consecutive hyphens
      if (subdomain.includes('--')) {
        return {
          valid: false,
          message: "Subdomain cannot contain consecutive hyphens"
        };
      }

      return { valid: true, message: "Valid subdomain format" };
    } catch (error) {
      console.error('Error validating subdomain format:', error);
      return { valid: false, message: "Error validating subdomain" };
    }
  },
});
