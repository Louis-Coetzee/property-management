import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  validateUserCompanyAccess,
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";

/**
 * User-Company relationship management with authentication
 * This replaces the old teamMembers table with userCompanies many-to-many pattern
 */

// List all user-company relationships for a company
export const listByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // ✅ Validate company access
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    const userCompanies = await ctx.db
      .query("userCompanies")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Enrich with user information
    const enriched = await Promise.all(
      userCompanies.map(async (uc) => {
        const user = await ctx.db.get(uc.userId);
        return {
          _id: uc._id,
          userId: uc.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          userFirstName: user?.firstName || "",
          userLastName: user?.lastName || "",
          userEmail: user?.email || "",
          userContactNumber: user?.contactNumber || "",
          userImage: user?.profileImage,
          role: uc.role,
          department: uc.department,
          position: uc.position,
          isActive: uc.isActive,
          invitedAt: uc.invitedAt,
          createdAt: uc.createdAt,
          cardPermissions: uc.cardPermissions || {},
        };
      })
    );

    return enriched;
  },
});

// Search team members by company for autocomplete
export const searchTeamMembers = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);
    
    const query = args.searchQuery.toLowerCase();
    
    const userCompanies = await ctx.db
      .query("userCompanies")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Enrich with user info and filter
    const enriched = await Promise.all(
      userCompanies.map(async (uc) => {
        const user = await ctx.db.get(uc.userId);
        const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
        return {
          _id: uc._id,
          userId: uc.userId,
          name: fullName,
          email: user?.email || '',
          role: uc.role,
          department: uc.department,
        };
      })
    );
    
    return enriched.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query) ||
      m.department?.toLowerCase().includes(query)
    ).slice(0, 10);
  },
});

// Get a user-company relationship by ID
export const getById = query({
  args: {
    userId: v.id("users"),
    userCompanyId: v.id("userCompanies"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const userCompany = await ctx.db.get(args.userCompanyId);
    if (!userCompany) {
      return null;
    }

    // ✅ Verify the authenticated user is part of this company
    await validateCompanyResourceAccess(ctx, args.userId, userCompany.companyId);

    // Only return if it belongs to the authenticated user or they're an admin/owner
    if (userCompany.userId !== authUser.tokenIdentifier) {
      await validateCompanyResourceAccess(
        ctx,
        args.userId,
        userCompany.companyId,
        "admin"
      );
    }

    const user = await ctx.db.get(userCompany.userId);
    return {
      ...userCompany,
      userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      userEmail: user?.email || "",
      userImage: user?.profileImage,
    };
  },
});

// Get a user-company relationship by user ID and company
export const getByUserAndCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    // ✅ Verify the authenticated user is requesting their own data
    if (authUser.tokenIdentifier !== args.userId) {
      throw new Error("FORBIDDEN: Cannot access other users' data");
    }

    const userCompany = await ctx.db
      .query("userCompanies")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .unique();

    return userCompany || null;
  },
});

// Add a user to a company (member role)
export const add = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    role: v.optional(v.string()),
    invitedBy: v.id("users"),
    cardPermissions: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    // ✅ Authenticate
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    // ✅ Verify the inviter has permission (admin or owner) to add members
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      args.companyId,
      "admin"
    );

    // Check if the user to be added exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("NOT_FOUND: User not found");
    }

    const now = Date.now();

    // Check if user is already a member of this company
    const existing = await ctx.db
      .query("userCompanies")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .unique();

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        await ctx.db.patch(existing._id, {
          isActive: true,
          updatedAt: now,
          ...(args.cardPermissions !== undefined && { cardPermissions: args.cardPermissions }),
        });
      }
      return existing._id;
    }

    // Add new user-company relationship
    const userCompanyId = await ctx.db.insert("userCompanies", {
      userId: args.userId,
      companyId: args.companyId,
      role: args.role || "member",
      department: args.department,
      position: args.position,
      isActive: true,
      invitedBy: args.invitedBy,
      invitedAt: now,
      createdAt: now,
      updatedAt: now,
      cardPermissions: args.cardPermissions,
    });

    return userCompanyId;
  },
});

function generateSecureToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const inviteMemberMutation = mutation({
  args: {
    inviterUserId: v.id("users"),
    companyId: v.id("companies"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    contactNumber: v.string(),
    passwordHash: v.string(),
    plainPassword: v.string(),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    role: v.optional(v.string()),
    cardPermissions: v.optional(v.record(v.string(), v.string())),
    sendWelcomeEmail: v.boolean(),
    requireEmailVerification: v.boolean(),
    requirePasswordChange: v.boolean(),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.inviterUserId);

    await validateCompanyResourceAccess(
      ctx,
      args.inviterUserId,
      args.companyId,
      "admin"
    );

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    let targetUserId: Id<"users">;
    let userCreated = false;
    let emailVerificationToken: string | undefined;

    if (existingUser) {
      const existingMember = await ctx.db
        .query("userCompanies")
        .withIndex("by_user_company", (q) =>
          q.eq("userId", existingUser._id).eq("companyId", args.companyId)
        )
        .first();

      if (existingMember) {
        if (!existingMember.isActive) {
          await ctx.db.patch(existingMember._id, {
            isActive: true,
            updatedAt: Date.now(),
            ...(args.cardPermissions !== undefined && { cardPermissions: args.cardPermissions }),
          });
        }
        throw new Error("EXISTING_MEMBER: This user is already a member of this company.");
      }

      targetUserId = existingUser._id;
    } else {
      const isEmailVerified = !args.requireEmailVerification;
      emailVerificationToken = generateSecureToken();

      const company = await ctx.db.get(args.companyId) as any;
      const companyDomain = company?.subdomain || company?.customDomain || 'crm';
      const companyApps = {
        [companyDomain]: {
          hasAccess: true,
          role: args.role || "member",
          grantedAt: Date.now(),
        },
      };

      targetUserId = await ctx.db.insert("users", {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email.toLowerCase(),
        contactNumber: args.contactNumber,
        passwordHash: args.passwordHash,
        isEmailVerified,
        emailVerificationToken: isEmailVerified ? undefined : emailVerificationToken,
        emailVerificationTokenExpiry: isEmailVerified ? undefined : Date.now() + 24 * 60 * 60 * 1000,
        requirePasswordChange: args.requirePasswordChange,
        apps: companyApps,
        userType: "team",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        registeredFromDomain: companyDomain,
      });
      userCreated = true;
    }

    const existingMemberCheck = await ctx.db
      .query("userCompanies")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", targetUserId).eq("companyId", args.companyId)
      )
      .unique();

    if (existingMemberCheck) {
      throw new Error("EXISTING_MEMBER: This user is already a member of this company.");
    }

    const now = Date.now();
    const userCompanyId = await ctx.db.insert("userCompanies", {
      userId: targetUserId,
      companyId: args.companyId,
      role: args.role || "member",
      department: args.department,
      position: args.position,
      isActive: true,
      invitedBy: args.inviterUserId,
      invitedAt: now,
      createdAt: now,
      updatedAt: now,
      cardPermissions: args.cardPermissions,
    });

    return { userCompanyId, userCreated, emailVerificationToken };
  },
});

// Update a user-company relationship and user profile
export const update = mutation({
  args: {
    userId: v.id("users"),
    userCompanyId: v.id("userCompanies"),
    // User profile fields
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    // User-company relationship fields
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    role: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    cardPermissions: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    // ✅ Authenticate
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const userCompany = await ctx.db.get(args.userCompanyId);
    if (!userCompany) {
      throw new Error("NOT_FOUND: User-company relationship not found");
    }

    // ✅ Verify permission (admin or owner) to update member roles
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      userCompany.companyId,
      "admin"
    );

    const now = Date.now();

    // Update user profile fields if provided
    if (args.firstName !== undefined || args.lastName !== undefined || args.contactNumber !== undefined) {
      await ctx.db.patch(userCompany.userId, {
        ...(args.firstName !== undefined && { firstName: args.firstName }),
        ...(args.lastName !== undefined && { lastName: args.lastName }),
        ...(args.contactNumber !== undefined && { contactNumber: args.contactNumber }),
        updatedAt: now,
      });
    }

    // Update user-company relationship fields
    await ctx.db.patch(args.userCompanyId, {
      ...(args.department !== undefined && { department: args.department }),
      ...(args.position !== undefined && { position: args.position }),
      ...(args.role !== undefined && { role: args.role }),
      ...(args.isActive !== undefined && { isActive: args.isActive }),
      ...(args.cardPermissions !== undefined && { cardPermissions: args.cardPermissions }),
      updatedAt: now,
    });

    return { success: true };
  },
});

// Remove a user from a company
export const remove = mutation({
  args: {
    userId: v.id("users"),
    userCompanyId: v.id("userCompanies"),
  },
  handler: async (ctx, args) => {
    // ✅ Authenticate
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const userCompany = await ctx.db.get(args.userCompanyId);
    if (!userCompany) {
      throw new Error("NOT_FOUND: User-company relationship not found");
    }

    // ✅ Verify permission (admin or owner) to remove members
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      userCompany.companyId,
      "admin"
    );

    // Don't allow removing the owner
    const membership = await ctx.db
      .query("userCompanies")
      .withIndex("by_company", (q) => q.eq("companyId", userCompany.companyId))
      .collect();

    const activeOwners = membership.filter(uc => uc.isActive && uc.role === "owner");

    if (activeOwners.length === 1 && activeOwners[0]._id === args.userCompanyId) {
      throw new Error("FORBIDDEN: Cannot remove the last owner of a company");
    }

    // Check if user belongs to any other companies
    const otherCompanies = await ctx.db
      .query("userCompanies")
      .withIndex("by_user", (q) => q.eq("userId", userCompany.userId))
      .filter((q) => q.neq(q.field("_id"), args.userCompanyId))
      .collect();

    // Only delete the user account if they don't belong to any other companies
    if (otherCompanies.length === 0) {
      // Delete user account first (cascade will handle userCompany)
      await ctx.db.delete(userCompany.userId);
    } else {
      // Just remove from this company, keep the user account
      await ctx.db.delete(args.userCompanyId);
    }

    return { success: true, deletedUser: otherCompanies.length === 0 };
  },
});

// Toggle user active status
export const toggleActive = mutation({
  args: {
    userId: v.id("users"),
    userCompanyId: v.id("userCompanies"),
  },
  handler: async (ctx, args) => {
    // ✅ Authenticate
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const userCompany = await ctx.db.get(args.userCompanyId);
    if (!userCompany) {
      throw new Error("NOT_FOUND: User-company relationship not found");
    }

    // ✅ Verify permission (admin or owner) to deactivate members
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      userCompany.companyId,
      "admin"
    );

    // Don't allow deactivating the owner
    if (userCompany.role === "owner") {
      throw new Error("FORBIDDEN: Cannot deactivate the owner of a company");
    }

    const now = Date.now();
    await ctx.db.patch(args.userCompanyId, {
      isActive: !userCompany.isActive,
      updatedAt: now,
    });

    return { success: true, isActive: !userCompany.isActive };
  },
});

// Get a user-company relationship by userId (not the authenticated user)
export const getByUserId = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Get the user-company relationship
    const userCompany = await ctx.db
      .query("userCompanies")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .unique();

    if (!userCompany) {
      return null;
    }

    // Get user info
    const user = await ctx.db.get(args.userId);

    return {
      _id: userCompany._id,
      userId: userCompany.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      userEmail: user?.email || "",
      userImage: user?.profileImage,
      role: userCompany.role,
      department: userCompany.department,
      position: userCompany.position,
      isActive: userCompany.isActive,
    };
  },
});
