import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  validateUserCompanyAccess,
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";

const SUBDOMAIN_BASE = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';

// Get all websites for a company
export const getWebsitesByCompany = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    try {
      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

      const websites = await ctx.db
        .query("websites")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      return websites;
    } catch (error) {
      console.error('Error fetching websites:', error);
      throw error;
    }
  },
});

// Get a website by ID
export const getWebsiteById = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        return null;
      }

      // Validate user has access to the company that owns this website
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      return website;
    } catch (error) {
      console.error('Error fetching website:', error);
      throw error;
    }
  },
});

// Get a website by domain (searches in the domains array)
export const getWebsiteByDomain = query({
  args: {
    userId: v.id("users"),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Get all active websites and filter by domain
      const websites = await ctx.db
        .query("websites")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      // Find website where the domain exists in the domains array
      const website = websites.find(website => website.domains?.includes(args.domain));

      if (!website) {
        return null;
      }

      // Validate user has access to the company that owns this website
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      return website;
    } catch (error) {
      console.error('Error fetching website by domain:', error);
      throw error;
    }
  },
});

// Get app by website ID
export const getAppByWebsiteId = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Get the website first
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        return null;
      }

      // Validate user has access to the company that owns this website
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      // Find the app record that has this website's domains
      // For websites, we look for an app with type "website"
      const apps = await ctx.db
        .query("apps")
        .withIndex("by_type", (q) => q.eq("type", "website"))
        .collect();

      // Find the app that matches this website's domains
      const app = apps.find(app => {
        if (app.domains.length !== website.domains?.length) {
          return false;
        }
        // Check if all domains match (order independent)
        return app.domains.every(domain => website.domains?.includes(domain)) &&
               website.domains.every(domain => app.domains.includes(domain));
      });

      return app || null;
    } catch (error) {
      console.error('Error fetching app by website ID:', error);
      throw error;
    }
  },
});

// Create a new website
export const createWebsite = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    name: v.string(),
    description: v.string(), // Now required
    domains: v.array(v.string()), // Array of domains (subdomains and/or custom domains)
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Validate user has at least "member" role in the company
      await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "member");

      const now = Date.now();

      // If no domains provided, create a default subdomain based on the website name
      let domains = args.domains || [];
      if (domains.length === 0) {
        const subdomain = args.name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 63);
        domains = [`${subdomain}.${SUBDOMAIN_BASE}`];
      }

      const websiteId = await ctx.db.insert("websites", {
        companyId: args.companyId,
        name: args.name,
        description: args.description,
        domains,
        isPublished: args.isPublished !== undefined ? args.isPublished : false,
        isActive: true,
        createdBy: authUser.tokenIdentifier as any,
        createdAt: now,
        updatedAt: now,
      });

      // Create domainMappings for each domain
      for (const domain of domains) {
        // Determine if subdomain or custom domain
        const domainType = domain.includes('.') && !domain.includes('://')
          ? (domain.endsWith('.livewebapp.site') || domain.includes('livewebapp.site') ? 'subdomain' : 'custom')
          : 'subdomain';

        await ctx.db.insert("domainMappings", {
          companyId: args.companyId,
          entityId: websiteId,
          entityType: "website",
          domainType: domainType,
          domainValue: domain,
          status: domainType === 'subdomain' ? 'active' : 'pending_configuration',
          lastChecked: now,
          createdBy: authUser.tokenIdentifier as any,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Create corresponding app record
      await ctx.db.insert("apps", {
        type: "website",
        domains: domains,
        createdAt: now,
        updatedAt: now,
      });

      return websiteId;
    } catch (error) {
      console.error('Error creating website:', error);
      throw error;
    }
  },
});

// Update a website
export const updateWebsite = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    domains: v.optional(v.array(v.string())),
    primaryDomain: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const website = await ctx.db.get(args.websiteId);

      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has "admin" role in the company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      const now = Date.now();

      // Prepare update data
      const updateData: any = {
        ...(args.name !== undefined && { name: args.name }),
        ...(args.description !== undefined && { description: args.description }),
        ...(args.isPublished !== undefined && { isPublished: args.isPublished }),
        ...(args.primaryDomain !== undefined && { primaryDomain: args.primaryDomain }),
        updatedAt: now,
      };

      // If domains are being updated - sync with domainMappings table
      if (args.domains !== undefined) {
        const oldDomains = website.domains || [];
        const newDomains = args.domains;
        
        // Find domains to add (in new but not in old)
        const domainsToAdd = newDomains.filter(d => !oldDomains.includes(d));
        
        // Find domains to remove (in old but not in new)
        const domainsToRemove = oldDomains.filter(d => !newDomains.includes(d));

        // Get existing domain mappings for this website
        const existingMappings = await ctx.db
          .query("domainMappings")
          .withIndex("by_entity", (q) =>
            q.eq("entityId", args.websiteId).eq("entityType", "website")
          )
          .collect();

        const existingDomainValues = existingMappings.map(m => m.domainValue);

        // Remove domains from domainMappings that are no longer in the list
        for (const domain of domainsToRemove) {
          const mappingToRemove = existingMappings.find(m => m.domainValue === domain);
          if (mappingToRemove) {
            await ctx.db.delete(mappingToRemove._id);
          }
        }

        // Add new domains to domainMappings
        for (const domain of domainsToAdd) {
          // Determine if subdomain or custom domain
          const domainType = domain.includes('.') && !domain.includes('://') 
            ? (domain.endsWith('.livewebapp.site') || domain.includes('livewebapp.site') ? 'subdomain' : 'custom')
            : 'subdomain';

          // Check if already exists
          if (!existingDomainValues.includes(domain)) {
            await ctx.db.insert("domainMappings", {
              companyId: website.companyId,
              entityId: args.websiteId,
              entityType: "website",
              domainType: domainType,
              domainValue: domain,
              status: domainType === 'subdomain' ? 'active' : 'pending_configuration',
              lastChecked: now,
              createdBy: args.userId,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        // Update websites.domains array
        updateData.domains = args.domains;

        // Auto-set primary domain: use the last added domain unless explicitly provided
        // Only update primaryDomain if:
        // 1. domains were added (not just removed)
        // 2. primaryDomain wasn't explicitly provided in args
        // 3. there's no existing primaryDomain OR the existing primaryDomain was removed
        if (domainsToAdd.length > 0 && args.primaryDomain === undefined) {
          const lastAddedDomain = domainsToAdd[domainsToAdd.length - 1];
          
          // Check if current primaryDomain is still valid (still in the domains list)
          const currentPrimaryStillValid = website.primaryDomain && newDomains.includes(website.primaryDomain);
          
          // Set primary to last added domain if current is invalid or not set
          if (!currentPrimaryStillValid) {
            updateData.primaryDomain = lastAddedDomain;
            console.log(`Auto-setting primary domain to: ${lastAddedDomain} (latest added domain)`);
          }
        }
      }

      await ctx.db.patch(args.websiteId, updateData);

      // Update the corresponding app record if domains changed
      if (args.domains !== undefined) {
        const apps = await ctx.db
          .query("apps")
          .withIndex("by_type", (q) => q.eq("type", "website"))
          .collect();

        // Find the app that matches this website
        const app = apps.find(app => {
          return app.domains.every(domain => website.domains?.includes(domain)) &&
                 website.domains.every(domain => app.domains.includes(domain));
        });

        if (app) {
          // Update the existing app record
          await ctx.db.patch(app._id, {
            domains: args.domains,
            updatedAt: now,
          });
        } else {
          // Create a new app record (shouldn't happen but just in case)
          await ctx.db.insert("apps", {
            type: "website",
            domains: args.domains,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating website:', error);
      throw error;
    }
  },
});

// Delete a website (hard delete - permanently removes from database)
export const deleteWebsite = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const website = await ctx.db.get(args.websiteId);

      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has "admin" role in the company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      // First, delete all domainMappings for this website
      const domainMappings = await ctx.db
        .query("domainMappings")
        .withIndex("by_entity", (q) =>
          q.eq("entityId", args.websiteId).eq("entityType", "website")
        )
        .collect();

      for (const mapping of domainMappings) {
        await ctx.db.delete(mapping._id);
      }

      // Find and delete the corresponding app record
      const apps = await ctx.db
        .query("apps")
        .withIndex("by_type", (q) => q.eq("type", "website"))
        .collect();

      // Find the app that matches this website's domains
      const app = apps.find(app => {
        return app.domains.every(domain => website.domains?.includes(domain)) &&
               website.domains.every(domain => app.domains.includes(domain));
      });

      if (app) {
        await ctx.db.delete(app._id);
      }

      // Hard delete - permanently remove the website from the database
      await ctx.db.delete(args.websiteId);

      console.log(`Website ${args.websiteId} (${website.name}) permanently deleted with ${domainMappings.length} domain mappings`);

      return { success: true };
    } catch (error) {
      console.error('Error deleting website:', error);
      throw error;
    }
  },
});

// Toggle website publish status
export const toggleWebsitePublish = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const website = await ctx.db.get(args.websiteId);

      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has "admin" role in the company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      const now = Date.now();
      const newStatus = !website.isPublished;
      await ctx.db.patch(args.websiteId, {
        isPublished: newStatus,
        updatedAt: now,
      });

      return { success: true, isPublished: newStatus };
    } catch (error) {
      console.error('Error toggling website publish status:', error);
      throw error;
    }
  },
});

// Update website branding settings
export const updateWebsiteBranding = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
    branding: v.optional(v.object({
      primaryColor: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      faviconUrl: v.optional(v.string()),
      logoType: v.optional(v.union(v.literal("image"), v.literal("text"))),
      logoText: v.optional(v.string()),
      logoTextColor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const website = await ctx.db.get(args.websiteId);

      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has "admin" role in the company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      const now = Date.now();

      // Merge existing branding with new branding values
      const existingBranding = website.branding || {};
      const newBranding = {
        ...existingBranding,
        ...args.branding,
      };

      await ctx.db.patch(args.websiteId, {
        branding: newBranding,
        updatedAt: now,
      });

      return { success: true, branding: newBranding };
    } catch (error) {
      console.error('Error updating website branding:', error);
      throw error;
    }
  },
});

// Update website integrations settings
export const updateWebsiteIntegrations = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
    integrations: v.optional(v.object({
      autoTrader: v.optional(v.boolean()),
      easyQuotes: v.optional(v.object({
        enabled: v.boolean(),
        formIds: v.optional(v.array(v.id("forms"))),
        mode: v.optional(v.string()),
        liveCredentials: v.optional(v.object({
          username: v.optional(v.string()),
          password: v.optional(v.string()),
          clientId: v.optional(v.string()),
          clientSecret: v.optional(v.string()),
          dealerId: v.optional(v.string()),
        })),
      })),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const website = await ctx.db.get(args.websiteId);

      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has "admin" role in the company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      const now = Date.now();

      // Encryption key for live credentials (in production, use environment variable)
      const ENCRYPTION_KEY = process.env.EASYQUOTES_ENCRYPTION_KEY || 'easyquotes-encryption-key-change-in-production';

      // Simple encryption function for live credentials
      const encrypt = (text: string): string => {
        if (!text) return '';
        // Simple XOR-based encryption (in production, use proper encryption like AES-256)
        const key = ENCRYPTION_KEY;
        let result = '';
        for (let i = 0; i < text.length; i++) {
          result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return Buffer.from(result).toString('base64');
      };

      // Encrypt live credentials before storing
      let encryptedCredentials = undefined;
      if (args.integrations?.easyQuotes?.liveCredentials) {
        const creds = args.integrations.easyQuotes.liveCredentials;
        encryptedCredentials = {
          username: creds.username ? encrypt(creds.username) : undefined,
          password: creds.password ? encrypt(creds.password) : undefined,
          clientId: creds.clientId ? encrypt(creds.clientId) : undefined,
          clientSecret: creds.clientSecret ? encrypt(creds.clientSecret) : undefined,
          dealerId: creds.dealerId ? encrypt(creds.dealerId) : undefined,
        };
      }

      // Prepare the easyQuotes integration object with encrypted credentials
      const easyQuotesIntegration = args.integrations?.easyQuotes
        ? {
            ...args.integrations.easyQuotes,
            liveCredentials: encryptedCredentials,
          }
        : undefined;

      // Merge existing integrations with new integrations values
      const existingIntegrations = website.integrations || {};
      const newIntegrations = {
        ...existingIntegrations,
        ...args.integrations,
        ...(easyQuotesIntegration && { easyQuotes: easyQuotesIntegration }),
      };

      await ctx.db.patch(args.websiteId, {
        integrations: newIntegrations,
        updatedAt: now,
      });

      return { success: true, integrations: newIntegrations };
    } catch (error) {
      console.error('Error updating website integrations:', error);
      throw error;
    }
  },
});

// Public query to get a website by domain without authentication
export const getWebsiteByDomainPublic = query({
  args: {
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // First, check domainMappings for the domain (any type)
      const domainMapping = await ctx.db
        .query("domainMappings")
        .withIndex("by_domain_value", (q) => q.eq("domainValue", args.domain))
        .first();

      let website: any = null;

      if (domainMapping && domainMapping.entityType === "website") {
        // Get website from domain mapping
        website = await ctx.db.get(domainMapping.entityId);
      } else {
        // Get all active websites and filter by domain in the domains array
        const websites = await ctx.db
          .query("websites")
          .withIndex("by_active", (q) => q.eq("isActive", true))
          .collect();

        // Find website where the domain exists in the domains array
        website = websites.find(website => website.domains?.includes(args.domain));
      }

      if (!website) {
        return null;
      }

      // Only return if published
      if (!website.isPublished) {
        return null;
      }

      return website;
    } catch (error) {
      console.error('Error fetching website by domain (public):', error);
      throw error;
    }
  },
});

// Public query to get a website by ID without authentication
export const getWebsiteByIdPublic = query({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        return null;
      }

      // Only return if active and published
      if (!website.isActive || !website.isPublished) {
        return null;
      }

      return website;
    } catch (error) {
      console.error('Error fetching website by ID (public):', error);
      throw error;
    }
  },
});

// Get decrypted live credentials for EasyQuotes (for internal use only)
export const getEasyQuotesCredentials = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const website = await ctx.db.get(args.websiteId);

      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has "admin" role in the company (credentials are sensitive)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      const easyQuotesSetting = website.integrations?.easyQuotes;
      if (!easyQuotesSetting || typeof easyQuotesSetting !== 'object') {
        return null;
      }

      const ENCRYPTION_KEY = process.env.EASYQUOTES_ENCRYPTION_KEY || 'easyquotes-encryption-key-change-in-production';

      // Decryption function
      const decrypt = (encrypted: string): string => {
        if (!encrypted) return '';
        const decoded = Buffer.from(encrypted, 'base64').toString();
        const key = ENCRYPTION_KEY;
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
          result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
      };

      // Return appropriate credentials based on mode
      if (easyQuotesSetting.mode === 'live' && easyQuotesSetting.liveCredentials) {
        const creds = easyQuotesSetting.liveCredentials;
        return {
          mode: 'live',
          username: creds.username ? decrypt(creds.username) : '',
          password: creds.password ? decrypt(creds.password) : '',
          clientId: creds.clientId ? decrypt(creds.clientId) : '',
          clientSecret: creds.clientSecret ? decrypt(creds.clientSecret) : '',
          dealerId: creds.dealerId ? decrypt(creds.dealerId) : '',
        };
      }

      // Return test credentials
      return {
        mode: 'test',
        username: 'ESTest',
        password: 'eb7475f7-92b8-4dd8-8cdd-deb70e0f081b',
        clientId: 'b3259840-0b2e-4ed7-b928-7774bcfea500',
        clientSecret: 'sLf5YNNdTFLDyUrVD7MTtTLYsQqPfpbdkLPfmCE2wdpztpqDRK',
        dealerId: '355',
      };
    } catch (error) {
      console.error('Error getting EasyQuotes credentials:', error);
      throw error;
    }
  },
});

// Copy/duplicate a website with all its pages
export const copyWebsite = mutation({
  args: {
    userId: v.id("users"),
    sourceWebsiteId: v.id("websites"),
    newName: v.string(),
    newDomain: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Get the source website
      const sourceWebsite = await ctx.db.get(args.sourceWebsiteId);
      if (!sourceWebsite) {
        throw new Error("Source website not found");
      }

      // Validate user has access to the company that owns this website
      await validateCompanyResourceAccess(ctx, args.userId, sourceWebsite.companyId, "admin");

      // Check if domain is already in use
      const existingWebsites = await ctx.db
        .query("websites")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      const domainInUse = existingWebsites.some(w => w.domains?.includes(args.newDomain));
      if (domainInUse) {
        throw new Error("This domain is already in use. Please choose a different one.");
      }

      const now = Date.now();

      // Create the new website
      const newWebsiteId = await ctx.db.insert("websites", {
        companyId: sourceWebsite.companyId,
        name: args.newName,
        description: sourceWebsite.description || '',
        domains: [args.newDomain],
        isPublished: false, // Copies start as unpublished
        isActive: true,
        branding: sourceWebsite.branding,
        integrations: sourceWebsite.integrations,
        contactPhone: sourceWebsite.contactPhone,
        contactEmail: sourceWebsite.contactEmail,
        address: sourceWebsite.address,
        inquiryFormId: sourceWebsite.inquiryFormId,
        createdBy: authUser.tokenIdentifier as any,
        createdAt: now,
        updatedAt: now,
      });

      // Create corresponding app record for the new website
      await ctx.db.insert("apps", {
        type: "website",
        domains: [args.newDomain],
        createdAt: now,
        updatedAt: now,
      });

      // Copy all pages from the source website
      const sourcePages = await ctx.db
        .query("pages")
        .withIndex("by_website", (q) => q.eq("websiteId", args.sourceWebsiteId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Copy each page to the new website
      for (const page of sourcePages) {
        await ctx.db.insert("pages", {
          websiteId: newWebsiteId,
          name: page.name,
          slug: page.slug,
          title: page.title,
          description: page.description,
          content: page.content,
          contentType: page.contentType,
          isPublished: false, // Copied pages start as unpublished
          isHomePage: page.isHomePage,
          isActive: true,
          sortOrder: page.sortOrder,
          createdBy: authUser.tokenIdentifier as any,
          createdAt: now,
          updatedAt: now,
        });
      }

      return {
        success: true,
        websiteId: newWebsiteId,
        pagesCopied: sourcePages.length
      };
    } catch (error) {
      console.error('Error copying website:', error);
      throw error;
    }
  },
});

// Update website contact information
export const updateWebsiteContact = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
    inquiryFormId: v.optional(v.id("forms")),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const website = await ctx.db.get(args.websiteId);

      if (!website) {
        throw new Error("Website not found");
      }

      // Validate user has "admin" role in the company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      const now = Date.now();

      const updateData: any = {
        updatedBy: authUser.tokenIdentifier,
        updatedAt: now,
      };

      if (args.inquiryFormId !== undefined) {
        updateData.inquiryFormId = args.inquiryFormId;
      }
      if (args.contactPhone !== undefined) {
        updateData.contactPhone = args.contactPhone || undefined;
      }
      if (args.contactEmail !== undefined) {
        updateData.contactEmail = args.contactEmail || undefined;
      }
      if (args.address !== undefined) {
        updateData.address = args.address || undefined;
      }

      await ctx.db.patch(args.websiteId, updateData);

      return { success: true };
    } catch (error) {
      console.error('Error updating website contact:', error);
      throw error;
    }
  },
});
