import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Authentication utilities for Convex queries and mutations
 *
 * SECURITY: All queries and mutations MUST validate:
 * 1. User belongs to the requested company
 * 2. User has required role/permission for the operation
 *
 * NOTE: This project uses custom session-based authentication.
 * The frontend is responsible for passing the correct userId from the session.
 */

/**
 * Role hierarchy for permission checks
 * Higher number = more permissions
 */
export const ROLE_LEVELS: Record<string, number> = {
  owner: 100,
  admin: 80,
  manager: 60,
  supervisor: 40,
  member: 20,
};

/**
 * Validates that a user exists and returns the user record
 * @param ctx - Query/Mutation context
 * @param userId - The user ID to validate
 * @returns The user record
 * @throws Error if user not found
 */
export async function validateUserExists(
  ctx: any,
  userId: string
) {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("NOT_FOUND: User not found");
  }
  return user;
}

/**
 * Validates that a user belongs to a company and returns the userCompany record
 *
 * @param ctx - Query/Mutation context
 * @param userId - The user ID
 * @param companyId - The company ID
 * @param minRole - Minimum required role level (optional)
 * @returns The userCompany record
 * @throws Error if user not found, not in company, or insufficient role
 */
export async function validateUserCompanyAccess(
  ctx: any,
  userId: string,
  companyId: string,
  minRole?: string
) {
  // Verify the user exists
  await validateUserExists(ctx, userId);

  // Check if user belongs to the company
  const userCompany = await ctx.db
    .query("userCompanies")
    .withIndex("by_user_company", (q: any) =>
      q.eq("userId", userId).eq("companyId", companyId)
    )
    .unique();

  if (!userCompany) {
    throw new Error("FORBIDDEN: User does not belong to this company");
  }

  if (!userCompany.isActive) {
    throw new Error("FORBIDDEN: User access to this company has been deactivated");
  }

  // Check role if specified
  if (minRole) {
    const userRoleLevel = ROLE_LEVELS[userCompany.role] ?? 0;
    const requiredRoleLevel = ROLE_LEVELS[minRole] ?? 0;

    if (userRoleLevel < requiredRoleLevel) {
      throw new Error(
        `FORBIDDEN: Insufficient permissions. Required role: ${minRole}, User role: ${userCompany.role}`
      );
    }
  }

  return userCompany;
}

/**
 * Check if a user has a specific role in a company
 */
export async function hasRole(
  ctx: any,
  userId: string,
  companyId: string,
  role: string
): Promise<boolean> {
  const userCompany = await ctx.db
    .query("userCompanies")
    .withIndex("by_user_company", (q: any) =>
      q.eq("userId", userId).eq("companyId", companyId)
    )
    .unique();

  return userCompany?.role === role && userCompany?.isActive === true;
}

/**
 * Check if user is owner or admin of a company
 */
export async function isOwnerOrAdmin(
  ctx: any,
  userId: string,
  companyId: string
): Promise<boolean> {
  const userCompany = await ctx.db
    .query("userCompanies")
    .withIndex("by_user_company", (q: any) =>
      q.eq("userId", userId).eq("companyId", companyId)
    )
    .unique();

  return userCompany?.isActive === true &&
    (userCompany?.role === "owner" || userCompany?.role === "admin");
}

/**
 * Check if user has at least the specified role level
 */
export async function hasMinRole(
  ctx: any,
  userId: string,
  companyId: string,
  minRole: string
): Promise<boolean> {
  const userCompany = await ctx.db
    .query("userCompanies")
    .withIndex("by_user_company", (q: any) =>
      q.eq("userId", userId).eq("companyId", companyId)
    )
    .unique();

  if (!userCompany?.isActive) return false;

  const userRoleLevel = ROLE_LEVELS[userCompany.role] ?? 0;
  const requiredRoleLevel = ROLE_LEVELS[minRole] ?? 0;

  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Get all companies a user has access to
 */
export const getUserCompanies = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userCompanies = await ctx.db
      .query("userCompanies")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId).eq("isActive", true))
      .collect();

    // Fetch full company details for each userCompany
    const companies = await Promise.all(
      userCompanies.map(async (uc) => {
        const company = await ctx.db.get(uc.companyId);
        return company ? { ...company, userRole: uc.role } : null;
      })
    );

    return companies.filter(Boolean);
  },
});

/**
 * Get the authenticated user from the context
 * This works with custom session-based authentication where userId is passed from frontend
 * Note: In custom auth, the userId should be passed as an argument and validated
 * @param ctx - Query/Mutation context
 * @param userId - The user ID (passed from frontend session)
 * @returns Object with tokenIdentifier (userId) and user object
 */
export async function getAuthenticatedUser(ctx: any, userId?: string) {
  if (!userId) {
    throw new Error("UNAUTHORIZED: No userId provided. Please pass userId from your session.");
  }
  // Verify user exists
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("UNAUTHORIZED: Invalid user");
  }
  return {
    tokenIdentifier: userId,
    userId,
    user,
  };
}

/**
 * Check if user is a platform admin
 * @param user - The user object
 * @returns boolean
 */
export function isPlatformAdmin(user: any): boolean {
  return user?.userType === "admin" || user?.userType === "administrator";
}

/**
 * Validates user can access a specific resource owned by a company
 * Use this for resources like websites, pages, forms, etc.
 * @param ctx - Query/Mutation context
 * @param userId - The user ID
 * @param companyId - The company ID
 * @param minRole - Minimum required role level (optional)
 * @returns Object with authUser and userCompany
 */
export async function validateCompanyResourceAccess(
  ctx: any,
  userId: string,
  companyId: string,
  minRole?: string
) {
  // Get authenticated user
  const authUser = await getAuthenticatedUser(ctx, userId);

  // Platform admins bypass company membership checks
  if (isPlatformAdmin(authUser.user)) {
    return { authUser, userCompany: null, isPlatformAdmin: true };
  }

  // Find the user's record in this company
  const userCompany = await ctx.db
    .query("userCompanies")
    .withIndex("by_user_company", (q: any) =>
      q.eq("userId", userId).eq("companyId", companyId)
    )
    .unique();

  if (!userCompany) {
    throw new Error("FORBIDDEN: You do not have access to this company");
  }

  if (!userCompany.isActive) {
    throw new Error("FORBIDDEN: Your access to this company has been deactivated");
  }

  // Check role if specified
  if (minRole) {
    const userRoleLevel = ROLE_LEVELS[userCompany.role] ?? 0;
    const requiredRoleLevel = ROLE_LEVELS[minRole] ?? 0;

    if (userRoleLevel < requiredRoleLevel) {
      throw new Error(
        `FORBIDDEN: Insufficient permissions. Required role: ${minRole}, User role: ${userCompany.role}`
      );
    }
  }

  return { authUser, userCompany, isPlatformAdmin: false };
}
