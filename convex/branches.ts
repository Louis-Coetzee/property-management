import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";
// ============================================================================
// Branch Queries
// ============================================================================

// Get all branches for a company
export const getBranchesByCompany = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access
    const { authUser } = await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const branches = await ctx.db
        .query("branches")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      return branches;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  },
});

// Get active branches for a company
export const getActiveBranchesByCompany = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access
    const { authUser } = await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const branches = await ctx.db
        .query("branches")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      return branches;
    } catch (error) {
      console.error('Error fetching active branches:', error);
      throw error;
    }
  },
});

// Get branches for a website
export const getBranchesByWebsite = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      // Get the website to find its company
      const website = await ctx.db.get(args.websiteId);
      if (!website || !website.companyId) {
        return [];
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      // Get all branches for that company
      const branches = await ctx.db
        .query("branches")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      return branches;
    } catch (error) {
      console.error('Error fetching branches by website:', error);
      throw error;
    }
  },
});

// Get a branch by ID
export const getBranchById = query({
  args: {
        userId: v.id("users"),
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const branch = await ctx.db.get(args.branchId);
      if (!branch) {
        return null;
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, branch.companyId);

      return branch;
    } catch (error) {
      console.error('Error fetching branch:', error);
      throw error;
    }
  },
});

// Get all branches (admin view)
export const getAllBranches = query({
  args: {
        userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // This is an admin-only query - requires authentication
    // In a production environment, you might want to add additional
    // checks to ensure only system admins can access this
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const branches = await ctx.db
        .query("branches")
        .collect();

      return branches;
    } catch (error) {
      console.error('Error fetching all branches:', error);
      throw error;
    }
  },
});

// Get branch statistics for a company
export const getBranchStatistics = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access
    const { authUser } = await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const allBranches = await ctx.db
        .query("branches")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const activeBranches = allBranches.filter(b => b.isActive);

      return {
        total: allBranches.length,
        active: activeBranches.length,
        inactive: allBranches.length - activeBranches.length,
      };
    } catch (error) {
      console.error('Error fetching branch statistics:', error);
      throw error;
    }
  },
});

// ============================================================================
// Branch Mutations
// ============================================================================

// Create a new branch
export const createBranch = mutation({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
    name: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access (requires member role or higher)
    const { authUser, userCompany } = await validateCompanyResourceAccess(
      ctx,
      args.userId,
      args.companyId,
      "member"
    );

    try {
      const now = Date.now();

      const branchId = await ctx.db.insert("branches", {
        companyId: args.companyId,
        name: args.name,
        address: args.address,
        city: args.city,
        state: args.state,
        zipCode: args.zipCode,
        country: args.country,
        phone: args.phone,
        email: args.email,
        isActive: args.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, branchId };
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  },
});

// Update an existing branch
export const updateBranch = mutation({
  args: {
        userId: v.id("users"),
    branchId: v.id("branches"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const branch = await ctx.db.get(args.branchId);
      if (!branch) {
        throw new Error("Branch not found");
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, branch.companyId, "member");

      const now = Date.now();

      // Build update object with only provided fields
      const updates: any = {
        updatedAt: now,
        updatedBy: authUser.tokenIdentifier,
      };
      if (args.name !== undefined) updates.name = args.name;
      if (args.address !== undefined) updates.address = args.address;
      if (args.city !== undefined) updates.city = args.city;
      if (args.state !== undefined) updates.state = args.state;
      if (args.zipCode !== undefined) updates.zipCode = args.zipCode;
      if (args.country !== undefined) updates.country = args.country;
      if (args.phone !== undefined) updates.phone = args.phone;
      if (args.email !== undefined) updates.email = args.email;
      if (args.isActive !== undefined) updates.isActive = args.isActive;

      await ctx.db.patch(args.branchId, updates);

      return { success: true };
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  },
});

// Delete a branch
export const deleteBranch = mutation({
  args: {
        userId: v.id("users"),
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const branch = await ctx.db.get(args.branchId);
      if (!branch) {
        throw new Error("Branch not found");
      }

      // Validate user has access to this company (requires manager role or higher to delete)
      await validateCompanyResourceAccess(ctx, args.userId, branch.companyId, "manager");

      // Check if there are any vehicles associated with this branch
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
        .collect();

      if (vehicles.length > 0) {
        throw new Error(`Cannot delete branch. It has ${vehicles.length} vehicle(s) associated with it. Please reassign or remove the vehicles first.`);
      }

      await ctx.db.delete(args.branchId);

      return { success: true };
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  },
});

// Toggle branch active status
export const toggleBranchStatus = mutation({
  args: {
        userId: v.id("users"),
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const branch = await ctx.db.get(args.branchId);
      if (!branch) {
        throw new Error("Branch not found");
      }

      // Validate user has access to this company (requires member role or higher)
      await validateCompanyResourceAccess(ctx, args.userId, branch.companyId, "member");

      const now = Date.now();
      await ctx.db.patch(args.branchId, {
        isActive: !branch.isActive,
        updatedAt: now,
      });

      return { success: true, isActive: !branch.isActive };
    } catch (error) {
      console.error('Error toggling branch status:', error);
      throw error;
    }
  },
});
