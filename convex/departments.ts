import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";

// ============================================================================
// Department Queries
// ============================================================================

// Get all departments for a company
export const getDepartmentsByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access
    const { authUser } = await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const departments = await ctx.db
        .query("departments")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      // Fetch branch names for departments that are assigned to branches
      const departmentsWithBranchNames = await Promise.all(
        departments.map(async (dept) => {
          let branchName = null;
          if (dept.branchId) {
            const branch = await ctx.db.get(dept.branchId);
            branchName = branch?.name || null;
          }
          return {
            ...dept,
            branchName,
          };
        })
      );

      return departmentsWithBranchNames;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },
});

// Get active departments for a company
export const getActiveDepartmentsByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access
    const { authUser } = await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const departments = await ctx.db
        .query("departments")
        .withIndex("by_company_active", (q) =>
          q.eq("companyId", args.companyId).eq("isActive", true)
        )
        .collect();

      // Fetch branch names for departments that are assigned to branches
      const departmentsWithBranchNames = await Promise.all(
        departments.map(async (dept) => {
          let branchName = null;
          if (dept.branchId) {
            const branch = await ctx.db.get(dept.branchId);
            branchName = branch?.name || null;
          }
          return {
            ...dept,
            branchName,
          };
        })
      );

      return departmentsWithBranchNames;
    } catch (error) {
      console.error('Error fetching active departments:', error);
      throw error;
    }
  },
});

// Get departments for a specific branch
export const getDepartmentsByBranch = query({
  args: {
    userId: v.id("users"),
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      // Get the branch to find its company
      const branch = await ctx.db.get(args.branchId);
      if (!branch) {
        return [];
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, branch.companyId);

      // Get all departments for this branch
      const departments = await ctx.db
        .query("departments")
        .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
        .collect();

      return departments;
    } catch (error) {
      console.error('Error fetching departments by branch:', error);
      throw error;
    }
  },
});

// Get a department by ID
export const getDepartmentById = query({
  args: {
    userId: v.id("users"),
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const department = await ctx.db.get(args.departmentId);
      if (!department) {
        return null;
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, department.companyId);

      // Fetch branch name if assigned
      let branchName = null;
      if (department.branchId) {
        const branch = await ctx.db.get(department.branchId);
        branchName = branch?.name || null;
      }

      return {
        ...department,
        branchName,
      };
    } catch (error) {
      console.error('Error fetching department:', error);
      throw error;
    }
  },
});

// Get department statistics for a company
export const getDepartmentStatistics = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access
    const { authUser } = await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const allDepartments = await ctx.db
        .query("departments")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const activeDepartments = allDepartments.filter(d => d.isActive);

      // Count departments by branch
      const departmentsByBranch: Record<string, number> = {};
      const companyWideCount = allDepartments.filter(d => !d.branchId).length;

      for (const dept of allDepartments) {
        if (dept.branchId) {
          const branchId = dept.branchId.toString();
          departmentsByBranch[branchId] = (departmentsByBranch[branchId] || 0) + 1;
        }
      }

      return {
        total: allDepartments.length,
        active: activeDepartments.length,
        inactive: allDepartments.length - activeDepartments.length,
        companyWide: companyWideCount,
        byBranch: departmentsByBranch,
      };
    } catch (error) {
      console.error('Error fetching department statistics:', error);
      throw error;
    }
  },
});

// ============================================================================
// Department Mutations
// ============================================================================

// Create a new department
export const createDepartment = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    title: v.string(),
    description: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
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

    // If branchId is provided, validate it belongs to the same company
    if (args.branchId) {
      const branch = await ctx.db.get(args.branchId);
      if (!branch) {
        throw new Error("Branch not found");
      }
      if (branch.companyId !== args.companyId) {
        throw new Error("Branch does not belong to this company");
      }
    }

    try {
      const now = Date.now();

      const departmentId = await ctx.db.insert("departments", {
        companyId: args.companyId,
        title: args.title,
        description: args.description,
        branchId: args.branchId,
        isActive: args.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, departmentId };
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },
});

// Update an existing department
export const updateDepartment = mutation({
  args: {
    userId: v.id("users"),
    departmentId: v.id("departments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const department = await ctx.db.get(args.departmentId);
      if (!department) {
        throw new Error("Department not found");
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, department.companyId, "member");

      // If branchId is being updated, validate it belongs to the same company
      if (args.branchId !== undefined && args.branchId !== null) {
        const branch = await ctx.db.get(args.branchId);
        if (!branch) {
          throw new Error("Branch not found");
        }
        if (branch.companyId !== department.companyId) {
          throw new Error("Branch does not belong to this company");
        }
      }

      const now = Date.now();

      // Build update object with only provided fields
      const updates: any = {
        updatedAt: now,
        updatedBy: authUser.tokenIdentifier,
      };
      if (args.title !== undefined) updates.title = args.title;
      if (args.description !== undefined) updates.description = args.description;
      if (args.branchId !== undefined) updates.branchId = args.branchId;
      if (args.isActive !== undefined) updates.isActive = args.isActive;

      await ctx.db.patch(args.departmentId, updates);

      return { success: true };
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },
});

// Delete a department
export const deleteDepartment = mutation({
  args: {
    userId: v.id("users"),
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const department = await ctx.db.get(args.departmentId);
      if (!department) {
        throw new Error("Department not found");
      }

      // Validate user has access to this company (requires manager role or higher to delete)
      await validateCompanyResourceAccess(ctx, args.userId, department.companyId, "manager");

      // Check if there are any users assigned to this department
      // Note: This depends on your userCompanies schema having a department field
      const userCompanies = await ctx.db
        .query("userCompanies")
        .withIndex("by_company", (q) => q.eq("companyId", department.companyId))
        .filter((q) => q.eq(q.field("department"), department.title))
        .collect();

      if (userCompanies.length > 0) {
        throw new Error(`Cannot delete department. It has ${userCompanies.length} user(s) assigned to it. Please reassign the users first.`);
      }

      await ctx.db.delete(args.departmentId);

      return { success: true };
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  },
});

// Toggle department active status
export const toggleDepartmentStatus = mutation({
  args: {
    userId: v.id("users"),
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const department = await ctx.db.get(args.departmentId);
      if (!department) {
        throw new Error("Department not found");
      }

      // Validate user has access to this company (requires member role or higher)
      await validateCompanyResourceAccess(ctx, args.userId, department.companyId, "member");

      const now = Date.now();
      await ctx.db.patch(args.departmentId, {
        isActive: !department.isActive,
        updatedAt: now,
      });

      return { success: true, isActive: !department.isActive };
    } catch (error) {
      console.error('Error toggling department status:', error);
      throw error;
    }
  },
});
