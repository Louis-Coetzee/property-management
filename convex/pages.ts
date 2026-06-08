import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  validateUserCompanyAccess,
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";
// Get all pages for a website
export const getPagesByWebsite = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Fetch the website to get the company ID
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      const pages = await ctx.db
        .query("pages")
        .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
        .collect();

      const activePages = pages.filter(p => p.isActive);
      return activePages.sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        return a.createdAt - b.createdAt;
      });
    } catch (error) {
      console.error("Error fetching pages:", error);
      throw error;
    }
  },
});

// Get a page by ID
export const getPageById = query({
  args: {
        userId: v.id("users"),
    pageId: v.id("pages"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);
      if (!page) {
        return null;
      }

      // Fetch the website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      return page;
    } catch (error) {
      console.error("Error fetching page:", error);
      throw error;
    }
  },
});

// Get home page for a website
export const getHomePage = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Fetch the website to get the company ID
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      const homePage = await ctx.db
        .query("pages")
        .withIndex("by_home_page", (q) => q.eq("websiteId", args.websiteId).eq("isHomePage", true))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();

      return homePage;
    } catch (error) {
      console.error("Error fetching home page:", error);
      throw error;
    }
  },
});

// Get a page by slug
export const getPageBySlug = query({
  args: {
    slug: v.string(),
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Fetch the website to get the company ID
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      const pages = await ctx.db
        .query("pages")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .collect();

      const page = pages.find(p => p.websiteId === args.websiteId && p.isActive);
      return page || null;
    } catch (error) {
      console.error("Error fetching page by slug:", error);
      throw error;
    }
  },
});

// Public query to get a page by slug without authentication
export const getPageBySlugPublic = query({
  args: {
    slug: v.string(),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const pages = await ctx.db
        .query("pages")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .collect();

      const page = pages.find(p => p.websiteId === args.websiteId && p.isActive && p.isPublished);
      return page || null;
    } catch (error) {
      console.error("Error fetching page by slug (public):", error);
      throw error;
    }
  },
});

// Public query to get home page without authentication
export const getHomePagePublic = query({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const homePage = await ctx.db
        .query("pages")
        .withIndex("by_home_page", (q) => q.eq("websiteId", args.websiteId).eq("isHomePage", true))
        .filter((q) => q.eq(q.field("isActive"), true))
        .filter((q) => q.eq(q.field("isPublished"), true))
        .first();

      return homePage;
    } catch (error) {
      console.error("Error fetching home page (public):", error);
      throw error;
    }
  },
});

// Public query to get all pages by website without authentication
export const getPagesByWebsitePublic = query({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const pages = await ctx.db
        .query("pages")
        .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
        .collect();

      const activePages = pages.filter(p => p.isActive && p.isPublished);
      return activePages.sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        return a.createdAt - b.createdAt;
      });
    } catch (error) {
      console.error("Error fetching pages (public):", error);
      throw error;
    }
  },
});

// Create a new page
export const createPage = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
    name: v.string(),
    slug: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    contentType: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Fetch the website to get the company ID
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has member-level access to this company (required for creating)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const now = Date.now();

      const existingPages = await ctx.db
        .query("pages")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .collect();

      const conflictingPage = existingPages.find(p => p.websiteId === args.websiteId && p.isActive);
      if (conflictingPage) {
        throw new Error("A page with this slug already exists");
      }

      const pageId = await ctx.db.insert("pages", {
        websiteId: args.websiteId,
        name: args.name,
        slug: args.slug,
        title: args.title,
        description: args.description,
        content: args.content,
        contentType: args.contentType,
        isPublished: args.isPublished !== undefined ? args.isPublished : true,
        sortOrder: args.sortOrder,
        isHomePage: false,
        isActive: true,
        createdBy: authUser.userId as any,
        createdAt: now,
        updatedAt: now,
      });

      return pageId;
    } catch (error) {
      console.error("Error creating page:", error);
      throw error;
    }
  },
});

// Update a page
export const updatePage = mutation({
  args: {
    userId: v.id("users"),
    pageId: v.id("pages"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    contentType: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);

      if (!page) {
        throw new Error("Page not found");
      }

      // Fetch the website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has member-level access to this company (required for updating)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const now = Date.now();

      if (args.slug !== undefined && args.slug !== page.slug) {
        const existingPages = await ctx.db
          .query("pages")
          .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
          .collect();

        const conflictingPage = existingPages.find(p => p.websiteId === page.websiteId && p._id !== page._id && p.isActive);
        if (conflictingPage) {
          throw new Error("A page with this slug already exists");
        }
      }

      const updateData: any = {
        updatedAt: now,
      };

      if (args.name !== undefined) updateData.name = args.name;
      if (args.slug !== undefined) updateData.slug = args.slug;
      if (args.title !== undefined) updateData.title = args.title;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.content !== undefined) updateData.content = args.content;
      if (args.contentType !== undefined) updateData.contentType = args.contentType;
      if (args.isPublished !== undefined) updateData.isPublished = args.isPublished;
      if (args.sortOrder !== undefined) updateData.sortOrder = args.sortOrder;

      await ctx.db.patch(args.pageId, updateData);

      return { success: true };
    } catch (error) {
      console.error("Error updating page:", error);
      throw error;
    }
  },
});

// Delete a page (soft delete)
export const deletePage = mutation({
  args: {
    userId: v.id("users"),
    pageId: v.id("pages"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);

      if (!page) {
        throw new Error("Page not found");
      }

      // Fetch the website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has admin-level access to this company (required for deleting)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      const now = Date.now();

      await ctx.db.patch(args.pageId, {
        isActive: false,
        updatedAt: now,
      });

      console.log("Page deleted:", page.name);

      return { success: true };
    } catch (error) {
      console.error("Error deleting page:", error);
      throw error;
    }
  },
});

// Toggle page publish status
export const togglePagePublish = mutation({
  args: {
    userId: v.id("users"),
    pageId: v.id("pages"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);

      if (!page) {
        throw new Error("Page not found");
      }

      // Fetch the website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has member-level access to this company (required for updating)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const now = Date.now();
      const newStatus = !page.isPublished;

      await ctx.db.patch(args.pageId, {
        isPublished: newStatus,
        updatedAt: now,
      });

      return { success: true, isPublished: newStatus };
    } catch (error) {
      console.error("Error toggling page publish status:", error);
      throw error;
    }
  },
});

// Set a page as home page for a website
export const setHomePage = mutation({
  args: {
    userId: v.id("users"),
    pageId: v.id("pages"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);

      if (!page) {
        throw new Error("Page not found");
      }

      // Fetch the website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has member-level access to this company (required for updating)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const now = Date.now();

      const allPages = await ctx.db
        .query("pages")
        .withIndex("by_website", (q) => q.eq("websiteId", page.websiteId))
        .collect();

      const activePages = allPages.filter(p => p.isActive);
      for (const p of activePages) {
        if (p.isHomePage) {
          await ctx.db.patch(p._id, {
            isHomePage: false,
            updatedAt: now,
          });
        }
      }

      await ctx.db.patch(args.pageId, {
        isHomePage: true,
        updatedAt: now,
      });

      console.log("Home page set:", page.name);

      return { success: true };
    } catch (error) {
      console.error("Error setting home page:", error);
      throw error;
    }
  },
});

// Generate a unique slug from a name
export const generateSlug = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Fetch the website to get the company ID
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      let baseSlug = args.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 100);

      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await ctx.db
          .query("pages")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .collect();

        const conflictingPage = existing.find(p => p.websiteId === args.websiteId && p.isActive);
        if (!conflictingPage) {
          return slug;
        }

        slug = baseSlug + "-" + String(counter);
        counter++;
      }
    } catch (error) {
      console.error("Error generating slug:", error);
      throw error;
    }
  },
});

// ============================================================================
// Page Builder Mutations
// ============================================================================

// Initialize a page for page builder usage
export const initializePageBuilder = mutation({
  args: {
    userId: v.id("users"),
    pageId: v.id("pages"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);

      if (!page) {
        throw new Error("Page not found");
      }

      // Fetch the website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has member-level access to this company (required for updating)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const now = Date.now();

      // Initialize with empty page builder content
      const pageContent = {
        sections: [],
        version: "1.0",
        lastModified: now,
      };

      await ctx.db.patch(args.pageId, {
        content: JSON.stringify(pageContent),
        contentType: "pageBuilder",
        updatedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error("Error initializing page builder:", error);
      throw error;
    }
  },
});

// Add a section to a page
export const addSection = mutation({
  args: {
    userId: v.id("users"),
    pageId: v.id("pages"),
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);

      if (!page) {
        throw new Error("Page not found");
      }

      // Fetch the website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has member-level access to this company (required for updating)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const now = Date.now();

      // Parse existing content or create new
      let pageContent: any = { sections: [], version: "1.0", lastModified: now };
      if (page.content) {
        try {
          pageContent = JSON.parse(page.content);
        } catch (e) {
          console.error("Failed to parse page content, starting fresh");
        }
      }

      // Determine the next order value
      const nextOrder = pageContent.sections.length > 0
        ? Math.max(...pageContent.sections.map((s: any) => s.order || 0)) + 1
        : 0;

      // Create new section based on template
      const newSection = {
        id: `section_${now}_${Math.random().toString(36).substr(2, 9)}`,
        type: args.templateId.startsWith('hero-') ? 'hero' : 'unknown',
        templateId: args.templateId,
        order: nextOrder,
        content: getDefaultContentForTemplate(args.templateId),
        settings: {},
        createdAt: now,
        updatedAt: now,
      };

      pageContent.sections.push(newSection);
      pageContent.lastModified = now;

      await ctx.db.patch(args.pageId, {
        content: JSON.stringify(pageContent),
        contentType: "pageBuilder",
        updatedAt: now,
      });

      return { success: true, sectionId: newSection.id };
    } catch (error) {
      console.error("Error adding section:", error);
      throw error;
    }
  },
});

// Update section content
export const updateSectionContent = mutation({
  args: {
    userId: v.id("users"),
    pageId: v.id("pages"),
    sectionId: v.string(),
    content: v.any(),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);

      if (!page) {
        throw new Error("Page not found");
      }

      // Fetch the website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has member-level access to this company (required for updating)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      if (!page.content) {
        throw new Error("Page content is empty");
      }

      const pageContent = JSON.parse(page.content);
      const sectionIndex = pageContent.sections.findIndex((s: any) => s.id === args.sectionId);

      if (sectionIndex === -1) {
        throw new Error("Section not found");
      }

      const now = Date.now();
      pageContent.sections[sectionIndex].content = args.content;
      pageContent.sections[sectionIndex].updatedAt = now;
      pageContent.lastModified = now;

      // Update settings if provided
      if (args.settings !== undefined) {
        pageContent.sections[sectionIndex].settings = args.settings;
      }

      await ctx.db.patch(args.pageId, {
        content: JSON.stringify(pageContent),
        updatedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating section content:", error);
      throw error;
    }
  },
});

// Update section order
export const updateSectionOrder = mutation({
  args: {
    userId: v.id("users"),
    pageId: v.id("pages"),
    sections: v.array(v.object({
      id: v.string(),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);

      if (!page) {
        throw new Error("Page not found");
      }

      // Fetch the website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has member-level access to this company (required for updating)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      if (!page.content) {
        throw new Error("Page content is empty");
      }

      const pageContent = JSON.parse(page.content);
      const sectionMap = new Map(pageContent.sections.map((s: any) => [s.id, s]));

      // Update order for each section
      for (const { id, order } of args.sections) {
        const section = sectionMap.get(id);
        if (section) {
          (section as any).order = order;
        }
      }

      // Sort sections by order
      pageContent.sections.sort((a: any, b: any) => a.order - b.order);

      const now = Date.now();
      pageContent.lastModified = now;

      await ctx.db.patch(args.pageId, {
        content: JSON.stringify(pageContent),
        updatedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating section order:", error);
      throw error;
    }
  },
});

// Set all page content with sections (used for AI import)
export const setPageContent = mutation({
  args: {
    userId: v.id("users"),
    pageId: v.id("pages"),
    sections: v.array(v.object({
      id: v.string(),
      type: v.string(),
      templateId: v.string(),
      order: v.number(),
      content: v.any(),
      settings: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
    pointerSettings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);

      if (!page) {
        throw new Error("Page not found");
      }

      // Fetch this website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has member-level access to this company (required for updating)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      const now = Date.now();

      // Build page content
      const pageContent = {
        sections: args.sections.map((section, index) => ({
          ...section,
          order: index + 1,
          createdAt: section.createdAt || now,
          updatedAt: now,
        })),
        version: "1.0",
        lastModified: now,
        pointerSettings: args.pointerSettings || null,
      };

      await ctx.db.patch(args.pageId, {
        content: JSON.stringify(pageContent),
        contentType: "pageBuilder",
        updatedAt: now,
      });

      return { success: true, sectionCount: args.sections.length };
    } catch (error) {
      console.error("Error setting page content:", error);
      throw error;
    }
  },
});

// Delete a section
export const deleteSection = mutation({
  args: {
    userId: v.id("users"),
    pageId: v.id("pages"),
    sectionId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      const page = await ctx.db.get(args.pageId);

      if (!page) {
        throw new Error("Page not found");
      }

      // Fetch the website to get the company ID
      const website = await ctx.db.get(page.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has member-level access to this company (required for updating)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "member");

      if (!page.content) {
        throw new Error("Page content is empty");
      }

      const pageContent = JSON.parse(page.content);
      const initialLength = pageContent.sections.length;
      pageContent.sections = pageContent.sections.filter((s: any) => s.id !== args.sectionId);

      if (pageContent.sections.length === initialLength) {
        throw new Error("Section not found");
      }

      // Reorder remaining sections
      pageContent.sections = pageContent.sections.map((s: any, index: number) => ({
        ...s,
        order: index,
      }));

      const now = Date.now();
      pageContent.lastModified = now;

      await ctx.db.patch(args.pageId, {
        content: JSON.stringify(pageContent),
        updatedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting section:", error);
      throw error;
    }
  },
});

// Helper function to get default content for a template
function getDefaultContentForTemplate(templateId: string): Record<string, any> {
  const defaults: Record<string, any> = {
    'hero-basic': {
      headline: 'Welcome to Our Website',
      subheadline: 'Build beautiful pages with our easy-to-use page builder',
      ctaText: 'Get Started',
      ctaLink: '#',
      backgroundColor: '#ffffff',
      textColor: '#1a1a1a',
    },
    'hero-modern': {
      headline: 'Create Something Amazing',
      subheadline: 'Transform your ideas into stunning web experiences',
      ctaText: 'Start Building',
      ctaLink: '#',
      backgroundColor: '#4f46e5',
      backgroundImage: '',
      textColor: '#ffffff',
    },
  };

  return defaults[templateId] || {
    title: 'New Section',
    description: 'Add your content here',
  };
}

// ============================================================================
// Migration: Update old filter data in page content
// ============================================================================

// Migrate ListingsShowcase section filter data from old format to new format
export const migrateListingsShowcaseFilters = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);

      // Fetch the website to get the company ID
      const website = await ctx.db.get(args.websiteId);
      if (!website) {
        throw new Error("Website not found");
      }

      // Validate the user has admin-level access to this company (required for migration operations)
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId, "admin");

      const pages = await ctx.db
        .query("pages")
        .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
        .collect();

      let migratedCount = 0;

      for (const page of pages) {
        if (!page.content || page.contentType !== 'pageBuilder') continue;

        try {
          const pageContent = JSON.parse(page.content);
          let modified = false;

          // Process each section
          for (const section of pageContent.sections) {
            if (section.content?.filterBy) {
              const filterBy = section.content.filterBy;

              // Remove old vehicleTypeIds and branchIds
              if (filterBy.vehicleTypeIds || filterBy.branchIds) {
                delete filterBy.vehicleTypeIds;
                delete filterBy.branchIds;
                modified = true;
                console.log('  Removed vehicleTypeIds and branchIds');
              }

              // Fix invalid condition values - COMPLETELY RESET conditionIds
              // Valid values are ONLY: 'new', 'used', 'certified'
              if (filterBy.conditionIds) {
                const validConditions = ['new', 'used', 'certified'];

                // Check if any invalid values exist
                const hasInvalid = filterBy.conditionIds.some((id: string) => !validConditions.includes(id));

                if (hasInvalid) {
                  console.log('  Found invalid conditionIds:', filterBy.conditionIds);

                  // Map common invalid values to valid ones
                  const mappedIds = filterBy.conditionIds.map((id: string) => {
                    const lowerId = id.toLowerCase();
                    // Map "Very Good" or "Excellent" to "used" (pre-owned)
                    if (lowerId.includes('very good') || lowerId.includes('excellent') || lowerId === 'good') {
                      return 'used';
                    }
                    // Map "New" to "new" (lowercase)
                    if (lowerId === 'new') {
                      return 'new';
                    }
                    // Map "Certified" to "certified"
                    if (lowerId === 'certified') {
                      return 'certified';
                    }
                    // Map "Pre-Owned" or "Used" to "used"
                    if (lowerId.includes('pre-owned') || lowerId.includes('preowned') || lowerId === 'used') {
                      return 'used';
                    }
                    // Return only if it's already valid
                    if (validConditions.includes(lowerId)) {
                      return lowerId;
                    }
                    return null;
                  }).filter(Boolean);

                  // If we have valid mapped IDs, use them; otherwise, remove conditionIds entirely
                  if (mappedIds.length > 0) {
                    // Remove duplicates
                    filterBy.conditionIds = Array.from(new Set(mappedIds));
                    console.log('  Mapped to valid conditionIds:', filterBy.conditionIds);
                  } else {
                    delete filterBy.conditionIds;
                    console.log('  Removed conditionIds (no valid values)');
                  }
                  modified = true;
                }
              }

              // Initialize empty arrays for new filter fields if they don't exist
              if (!filterBy.brandIds) {
                filterBy.brandIds = [];
              }
              if (!filterBy.conditionIds) {
                filterBy.conditionIds = [];
              }
            }
          }

          if (modified) {
            const now = Date.now();
            await ctx.db.patch(page._id, {
              content: JSON.stringify(pageContent),
              updatedAt: now,
            });
            migratedCount++;
            console.log(`Migrated page: ${page.name}`);
          }
        } catch (e) {
          console.error(`Failed to process page ${page._id}:`, e);
        }
      }

      console.log(`Migration complete: ${migratedCount} pages updated`);

      return { success: true, migratedCount };
    } catch (error) {
      console.error('Error migrating ListingsShowcase filters:', error);
      throw error;
    }
  },
});
