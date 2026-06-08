import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== QUERIES ====================

// Get all users (admin only)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(user => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
      userType: user.userType,
      apps: user.apps,
      userAccess: user.userAccess,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      registeredFromDomain: user.registeredFromDomain,
    }));
  },
});

// Get all companies (admin only)
export const getAllCompanies = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    return companies.map(company => ({
      _id: company._id,
      name: company.name,
      description: company.description,
      enabled: company.enabled,
      currency: company.currency,
      enabledApps: company.enabledApps,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    }));
  },
});

// Get user by ID (admin only)
export const getUserByIdAdmin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
      userType: user.userType,
      apps: user.apps,
      userAccess: user.userAccess,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      registeredFromDomain: user.registeredFromDomain,
    };
  },
});

// Get all domains for admin
export const getAllDomains = query({
  args: {},
  handler: async (ctx) => {
    const websites = await ctx.db.query("websites").collect();
    const domains = new Set<string>();
    websites.forEach(website => {
      website.domains?.forEach(domain => domains.add(domain));
    });
    return Array.from(domains);
  },
});

// Get all websites for sitemap generation
export const listAllWebsites = query({
  args: {},
  handler: async (ctx) => {
    const websites = await ctx.db.query("websites").collect();
    return websites.map(website => ({
      _id: website._id,
      domains: website.domains || [],
      updatedAt: website.updatedAt,
    }));
  },
});

// ==================== MUTATIONS ====================

// Create user (admin only)
export const createUserAdmin = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    contactNumber: v.string(),
    passwordHash: v.string(),
    userType: v.optional(v.string()),
    registeredFromDomain: v.string(),
    isEmailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      contactNumber: args.contactNumber,
      passwordHash: args.passwordHash,
      isEmailVerified: args.isEmailVerified ?? false,
      apps: {},
      userType: args.userType || "user",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      registeredFromDomain: args.registeredFromDomain,
    });

    return { userId, message: "User created successfully" };
  },
});

// Update user (admin only)
export const updateUserAdmin = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    userType: v.optional(v.string()),
    isEmailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const { userId, ...updateData } = args;

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", updateData.email!))
        .first();

      if (existingUser && existingUser._id !== args.userId) {
        throw new Error("Email already in use");
      }
    }

    await ctx.db.patch(args.userId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return { message: "User updated successfully" };
  },
});

// Update user password (admin only)
export const updateUserPasswordAdmin = mutation({
  args: {
    userId: v.id("users"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
      updatedAt: Date.now(),
    });

    // Delete all sessions for this user (force re-login)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { message: "Password updated successfully" };
  },
});

// Delete user (admin only)
export const deleteUserAdmin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete all sessions for this user
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete the user
    await ctx.db.delete(args.userId);

    return { message: "User deleted successfully" };
  },
});

// Assign company/domain access to user
export const assignCompanyAccess = mutation({
  args: {
    userId: v.id("users"),
    domain: v.string(),
    role: v.string(),
    hasAccess: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentApps = user.apps || {};

    await ctx.db.patch(args.userId, {
      apps: {
        ...currentApps,
        [args.domain]: {
          hasAccess: args.hasAccess,
          role: args.role,
          grantedAt: Date.now(),
        },
      },
      updatedAt: Date.now(),
    });

    return { message: "Company access updated successfully" };
  },
});

// Remove company/domain access from user
export const removeCompanyAccess = mutation({
  args: {
    userId: v.id("users"),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentApps = user.apps || {};
    const { [args.domain]: removed, ...remainingApps } = currentApps;

    await ctx.db.patch(args.userId, {
      apps: remainingApps,
      updatedAt: Date.now(),
    });

    return { message: "Company access removed successfully" };
  },
});

// Update user access for specific website
export const updateUserWebsiteAccess = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.string(),
    appName: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentUserAccess = user.userAccess || {};
    const websiteAccess = currentUserAccess[args.websiteId] || {};

    await ctx.db.patch(args.userId, {
      userAccess: {
        ...currentUserAccess,
        [args.websiteId]: {
          ...websiteAccess,
          [args.appName]: args.role,
        },
      },
      updatedAt: Date.now(),
    });

    return { message: "Website access updated successfully" };
  },
});

// Remove user website access
export const removeUserWebsiteAccess = mutation({
  args: {
    userId: v.id("users"),
    websiteId: v.string(),
    appName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentUserAccess = user.userAccess || {};
    const websiteAccess = currentUserAccess[args.websiteId] || {};
    const { [args.appName]: removed, ...remainingAppAccess } = websiteAccess;

    await ctx.db.patch(args.userId, {
      userAccess: {
        ...currentUserAccess,
        [args.websiteId]: remainingAppAccess,
      },
      updatedAt: Date.now(),
    });

    return { message: "Website access removed successfully" };
  },
});

// Verify user email (admin only)
export const verifyUserEmailAdmin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationTokenExpiry: undefined,
      updatedAt: Date.now(),
    });

    return { message: "Email verified successfully" };
  },
});

// Create company (admin only)
export const createCompanyAdmin = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    currency: v.optional(v.object({
      code: v.optional(v.string()),
      symbol: v.optional(v.string()),
      symbolPosition: v.optional(v.string()),
      customSymbol: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      description: args.description,
      enabled: true,
      currency: args.currency,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { companyId, message: "Company created successfully" };
  },
});

// Update company (admin only)
export const updateCompanyAdmin = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    currency: v.optional(v.object({
      code: v.optional(v.string()),
      symbol: v.optional(v.string()),
      symbolPosition: v.optional(v.string()),
      customSymbol: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    const { companyId, ...updateData } = args;

    await ctx.db.patch(args.companyId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return { message: "Company updated successfully" };
  },
});

// Delete company (admin only)
export const deleteCompanyAdmin = mutation({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    // Note: You might want to handle related data (websites, team members, etc.)
    // For now, just delete the company
    await ctx.db.delete(args.companyId);

    return { message: "Company deleted successfully" };
  },
});

// ==================== USER COMPANIES MANAGEMENT ====================

// Get all userCompany entries (admin only)
export const getAllUserCompanies = query({
  args: {},
  handler: async (ctx) => {
    const userCompanies = await ctx.db.query("userCompanies").collect();

    // Fetch related user and company data
    const result = await Promise.all(
      userCompanies.map(async (uc) => {
        const user = await ctx.db.get(uc.userId);
        const company = await ctx.db.get(uc.companyId);
        return {
          _id: uc._id,
          userId: uc.userId,
          companyId: uc.companyId,
          role: uc.role,
          department: uc.department,
          position: uc.position,
          isActive: uc.isActive,
          invitedBy: uc.invitedBy,
          invitedAt: uc.invitedAt,
          createdAt: uc.createdAt,
          updatedAt: uc.updatedAt,
          user: user ? {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          } : null,
          company: company ? {
            _id: company._id,
            name: company.name,
          } : null,
        };
      })
    );

    return result;
  },
});

// Get userCompanies for a specific user (admin only)
export const getUserCompaniesAdmin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userCompanies = await ctx.db
      .query("userCompanies")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Fetch related company data
    const result = await Promise.all(
      userCompanies.map(async (uc) => {
        const company = await ctx.db.get(uc.companyId);
        return {
          _id: uc._id,
          companyId: uc.companyId,
          role: uc.role,
          department: uc.department,
          position: uc.position,
          isActive: uc.isActive,
          createdAt: uc.createdAt,
          company: company ? {
            _id: company._id,
            name: company.name,
          } : null,
        };
      })
    );

    return result;
  },
});

// Assign user to company (admin only) - creates userCompanies entry
export const assignUserToCompany = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    role: v.string(), // owner, admin, manager, supervisor, member
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    invitedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify company exists
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    // Check if userCompany entry already exists
    const existing = await ctx.db
      .query("userCompanies")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, {
        role: args.role,
        department: args.department,
        position: args.position,
        isActive: true,
        updatedAt: now,
      });
    } else {
      // Create new userCompany entry
      await ctx.db.insert("userCompanies", {
        userId: args.userId,
        companyId: args.companyId,
        role: args.role,
        department: args.department,
        position: args.position,
        isActive: true,
        invitedBy: args.invitedBy,
        invitedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { message: "User assigned to company successfully" };
  },
});

// Remove user from company (admin only) - deactivates userCompanies entry
export const removeUserFromCompany = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Find the userCompany entry
    const existing = await ctx.db
      .query("userCompanies")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .first();

    if (!existing) {
      throw new Error("User is not assigned to this company");
    }

    // Deactivate instead of deleting
    await ctx.db.patch(existing._id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { message: "User removed from company successfully" };
  },
});

// Update userCompany role (admin only)
export const updateUserCompanyRole = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    role: v.string(),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the userCompany entry
    const existing = await ctx.db
      .query("userCompanies")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .first();

    if (!existing) {
      throw new Error("User is not assigned to this company");
    }

    // Update the entry
    await ctx.db.patch(existing._id, {
      role: args.role,
      department: args.department,
      position: args.position,
      updatedAt: Date.now(),
    });

    return { message: "User company role updated successfully" };
  },
});
