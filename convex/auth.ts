import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Generate secure random token
function generateSecureToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Helper mutation to create user (called from action)
export const createUser = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    contactNumber: v.string(),
    passwordHash: v.string(),
    emailVerificationToken: v.string(),
    domain: v.string(),
    requirePasswordChange: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const emailVerificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    if (existingUser) {
      // User exists - check if they already have access to this domain
      const currentApps = existingUser.apps || {};
      
      if (currentApps[args.domain]) {
        throw new Error("You already have an account on this domain. Please login instead.");
      }

      // For existing users trying to register on a new domain, we need password verification
      // This will be handled by a separate action that verifies password first
      console.log('🔥 Throwing EXISTING_USER error for:', existingUser.email, 'with ID:', existingUser._id);
      const errorMessage = `EXISTING_USER:${existingUser._id}`;
      console.log('🔥 Error message being thrown:', errorMessage);
      throw new Error(errorMessage);
    }

    // Create new user
    const defaultApps = {
      [args.domain]: {
        hasAccess: true,
        role: "user",
        grantedAt: Date.now(),
      },
    };

    // Create user
    const userId = await ctx.db.insert("users", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      contactNumber: args.contactNumber,
      passwordHash: args.passwordHash,
      isEmailVerified: false,
      emailVerificationToken: args.emailVerificationToken,
      emailVerificationTokenExpiry,
      requirePasswordChange: args.requirePasswordChange || false,
      apps: defaultApps,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      registeredFromDomain: args.domain,
    });

    // Log email verification
    await ctx.db.insert("emailVerificationLogs", {
      email: args.email,
      token: args.emailVerificationToken,
      sentAt: Date.now(),
      isUsed: false,
      domain: args.domain,
    });

    return {
      userId,
      emailVerificationToken: args.emailVerificationToken,
      message: "User registered successfully. Please verify your email.",
    };
  },
});

// Helper query to get user by email (called from action)
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user;
  },
});

// Get user by ID
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

// Query to get all users who have access to a specific domain
export const getUsersByDomain = query({
  args: {
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('🔍 [getUsersByDomain] Fetching users for domain:', args.domain);
    
    // Fetch all users
    const allUsers = await ctx.db.query("users").collect();
    
    // Filter users who have access to the domain
    const usersWithAccess = allUsers.filter(user => {
      const domainAccess = user.apps?.[args.domain];
      return domainAccess && domainAccess.hasAccess === true;
    });
    
    console.log(`📊 [getUsersByDomain] Found ${usersWithAccess.length} users with access to ${args.domain}`);
    
    return usersWithAccess;
  },
});

// Debug query to list all users
export const getAllUsersDebug = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(user => ({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    }));
  },
});

// Get users by company ID
export const getByCompanyId = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Get all userCompanies entries for this company
    const userCompanies = await ctx.db
      .query("userCompanies")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    if (userCompanies.length === 0) {
      return [];
    }

    // Get all active users for this company
    const userIds = userCompanies
      .filter((uc) => uc.isActive)
      .map((uc) => uc.userId);

    // Fetch the actual user details
    const users = await Promise.all(
      userIds.map((userId) => ctx.db.get(userId))
    );

    // Filter out any null values and return only active users
    return users.filter((user) => user !== null);
  },
});

// Get all sessions (for authentication purposes)
export const getAllSessions = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    return sessions;
  },
});

// Helper mutation to create session (called from action)
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionToken = generateSecureToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert("sessions", {
      userId: args.userId,
      token: sessionToken,
      expiresAt,
      createdAt: Date.now(),
      domain: args.domain,
    });

    return { sessionToken };
  },
});

// Verify email
export const verifyEmail = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by verification token
    const user = await ctx.db
      .query("users")
      .withIndex("by_emailVerificationToken", (q) =>
        q.eq("emailVerificationToken", args.token)
      )
      .first();

    if (!user) {
      throw new Error("Invalid or expired verification link. Please request a new verification email.");
    }

    // Check if token is expired
    if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < Date.now()) {
      throw new Error("This verification link has expired. Please request a new verification email to continue.");
    }

    // Update user
    await ctx.db.patch(user._id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationTokenExpiry: undefined,
      updatedAt: Date.now(),
    });

    // Mark verification log as used
    const verificationLog = await ctx.db
      .query("emailVerificationLogs")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (verificationLog) {
      await ctx.db.patch(verificationLog._id, {
        isUsed: true,
      });
    }

    return { message: "Email verified successfully" };
  },
});

// Resend email verification
export const resendEmailVerification = mutation({
  args: {
    email: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email is already verified");
    }

    // Generate new verification token
    const emailVerificationToken = generateSecureToken();
    const emailVerificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Update user
    await ctx.db.patch(user._id, {
      emailVerificationToken,
      emailVerificationTokenExpiry,
      updatedAt: Date.now(),
    });

    // Log email verification
    await ctx.db.insert("emailVerificationLogs", {
      email: args.email,
      token: emailVerificationToken,
      sentAt: Date.now(),
      isUsed: false,
      domain: args.domain,
    });

    // Schedule email sending action
    await ctx.scheduler.runAfter(0, api.emailActions.sendVerificationEmailAction, {
      email: args.email,
      firstName: user.firstName,
      verificationToken: emailVerificationToken,
      domain: args.domain,
    });

    return {
      emailVerificationToken,
      message: "Verification email sent successfully",
    };
  },
});

// Get user by session token
export const getUserBySession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Find session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    // Get user
    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      profileImage: user.profileImage,
      apps: user.apps,
      isEmailVerified: user.isEmailVerified,
      userType: user.userType,
    };
  },
});

// Logout user
export const logoutUser = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Find and delete session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { message: "Logged out successfully" };
  },
});

// Request password reset
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      // Don't reveal if user exists or not
      return { message: "If the email exists, a password reset link will be sent" };
    }

    // Generate password reset token
    const passwordResetToken = generateSecureToken();
    const passwordResetTokenExpiry = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    // Update user
    await ctx.db.patch(user._id, {
      passwordResetToken,
      passwordResetTokenExpiry,
      updatedAt: Date.now(),
    });

    // Log password reset
    await ctx.db.insert("passwordResetLogs", {
      email: args.email,
      token: passwordResetToken,
      sentAt: Date.now(),
      isUsed: false,
      domain: args.domain,
    });

    // Schedule password reset email
    await ctx.scheduler.runAfter(0, api.emailActions.sendPasswordResetEmailAction, {
      email: args.email,
      firstName: user.firstName,
      resetToken: passwordResetToken,
      domain: args.domain,
    });

    return {
      passwordResetToken,
      message: "If the email exists, a password reset link will be sent",
    };
  },
});

// Helper mutation to update password (called from action)
export const updatePassword = mutation({
  args: {
    token: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by reset token
    const user = await ctx.db
      .query("users")
      .withIndex("by_passwordResetToken", (q) =>
        q.eq("passwordResetToken", args.token)
      )
      .first();

    if (!user) {
      throw new Error("Invalid reset token");
    }

    // Check if token is expired
    if (user.passwordResetTokenExpiry && user.passwordResetTokenExpiry < Date.now()) {
      throw new Error("Reset token has expired");
    }

    // Update user
    await ctx.db.patch(user._id, {
      passwordHash: args.passwordHash,
      passwordResetToken: undefined,
      passwordResetTokenExpiry: undefined,
      updatedAt: Date.now(),
    });

    // Mark reset log as used
    const resetLog = await ctx.db
      .query("passwordResetLogs")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (resetLog) {
      await ctx.db.patch(resetLog._id, {
        isUsed: true,
      });
    }

    // Delete all existing sessions for this user
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { message: "Password reset successfully" };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    contactNumber: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user to verify it exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user profile
    await ctx.db.patch(args.userId, {
      firstName: args.firstName,
      lastName: args.lastName,
      contactNumber: args.contactNumber,
      profileImage: args.profileImage,
      updatedAt: Date.now(),
    });

    return { message: "Profile updated successfully" };
  },
});

// Alias for updateProfile for API compatibility
export const updateUserProfile = updateProfile;

// Verify session and return user info
export const verifySession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Find session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    return {
      userId: session.userId,
      domain: session.domain,
    };
  },
});

// Change password with current password verification
export const changePassword = mutation({
  args: {
    userId: v.id("users"),
    currentPasswordHash: v.string(),
    newPasswordHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user to verify current password
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    if (user.passwordHash !== args.currentPasswordHash) {
      throw new Error("Current password is incorrect");
    }

    // Update password and clear requirePasswordChange flag
    await ctx.db.patch(args.userId, {
      passwordHash: args.newPasswordHash,
      requirePasswordChange: false, // Clear the flag after password change
      updatedAt: Date.now(),
    });

    // Delete all existing sessions for this user (force re-login)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { message: "Password changed successfully" };
  },
});

// Add domain access to existing user after password verification
export const addDomainToExistingUser = mutation({
  args: {
    userId: v.id("users"),
    domain: v.string(),
    emailVerificationToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user to verify it exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentApps = user.apps || {};
    
    // Check if user already has access to this domain
    if (currentApps[args.domain]) {
      throw new Error("You already have access to this domain. Please login instead.");
    }

    // Add new domain access
    const updatedApps = {
      ...currentApps,
      [args.domain]: {
        hasAccess: true,
        role: "user",
        grantedAt: Date.now(),
      },
    };

    // Don't require re-verification if user has already verified their email
    // Only generate verification token if user hasn't verified yet
    const baseUpdateData = {
      apps: updatedApps,
      updatedAt: Date.now(),
    };

    if (!user.isEmailVerified) {
      // User hasn't verified email yet - add verification requirements
      const emailVerificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await ctx.db.patch(args.userId, {
        ...baseUpdateData,
        emailVerificationToken: args.emailVerificationToken,
        emailVerificationTokenExpiry,
      });

      // Log email verification for new domain only if verification is needed
      await ctx.db.insert("emailVerificationLogs", {
        email: user.email,
        token: args.emailVerificationToken,
        sentAt: Date.now(),
        isUsed: false,
        domain: args.domain,
      });
    } else {
      // User already verified - just update apps without verification requirements
      await ctx.db.patch(args.userId, baseUpdateData);
    }

    return {
      userId: args.userId,
      emailVerificationToken: user.isEmailVerified ? "" : args.emailVerificationToken,
      message: user.isEmailVerified 
        ? "Domain access added successfully. You can now login to this domain."
        : "Domain access added successfully. Please verify your email to activate access.",
    };
  },
});

// Change password with expiry support (for password change flows)
export const changePasswordWithExpiry = mutation({
  args: {
    userId: v.id("users"),
    newPasswordHash: v.string(),
    passwordExpiresAt: v.optional(v.number()),
    requirePasswordChange: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update password with expiry settings
    await ctx.db.patch(args.userId, {
      passwordHash: args.newPasswordHash,
      passwordExpiresAt: args.passwordExpiresAt,
      requirePasswordChange: args.requirePasswordChange ?? false,
      updatedAt: Date.now(),
    });

    // Delete all existing sessions for this user (force re-login)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Check login rate limit
export const checkLoginRateLimit = query({
  args: {
    ipAddress: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("loginRateLimit")
      .withIndex("by_ip_email", (q) => 
        q.eq("ipAddress", args.ipAddress).eq("email", args.email)
      )
      .first();

    if (!existing) {
      return { allowed: true, remainingAttempts: 5 };
    }

    // Check if locked
    if (existing.lockedUntil && existing.lockedUntil > Date.now()) {
      return { 
        allowed: false, 
        locked: true,
        lockedUntil: existing.lockedUntil,
        message: "Too many failed attempts. Account is temporarily locked."
      };
    }

    const remaining = 5 - existing.attempts;
    const warning = remaining <= 1 && remaining > 0 
      ? "One more failed attempt will lock your account for 15 minutes." 
      : undefined;
    return { allowed: true, remainingAttempts: Math.max(0, remaining), warning };
  },
});

// Record failed login attempt
export const recordFailedLoginAttempt = mutation({
  args: {
    ipAddress: v.string(),
    email: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("loginRateLimit")
      .withIndex("by_ip_email", (q) => 
        q.eq("ipAddress", args.ipAddress).eq("email", args.email)
      )
      .first();

    const now = Date.now();

    if (existing) {
      const newAttempts = existing.attempts + 1;
      let lockedUntil: number | undefined;
      
      // Lock after 5 failed attempts for 15 minutes
      if (newAttempts >= 5) {
        lockedUntil = now + 15 * 60 * 1000;
        
        // Log security event
        await ctx.db.insert("securityEvents", {
          eventType: "account_locked",
          email: args.email,
          ipAddress: args.ipAddress,
          domain: args.domain,
          details: `Account locked after ${newAttempts} failed login attempts`,
          timestamp: now,
        });
      }

      await ctx.db.patch(existing._id, {
        attempts: newAttempts,
        lastAttemptAt: now,
        lockedUntil,
      });

      // Also log failed login attempt
      await ctx.db.insert("securityEvents", {
        eventType: "login_failed",
        email: args.email,
        ipAddress: args.ipAddress,
        domain: args.domain,
        details: `Failed attempt ${newAttempts}/5`,
        timestamp: now,
      });

      return { attempts: newAttempts, locked: newAttempts >= 5, lockedUntil };
    } else {
      await ctx.db.insert("loginRateLimit", {
        ipAddress: args.ipAddress,
        email: args.email,
        attempts: 1,
        lastAttemptAt: now,
        domain: args.domain,
      });

      await ctx.db.insert("securityEvents", {
        eventType: "login_failed",
        email: args.email,
        ipAddress: args.ipAddress,
        domain: args.domain,
        details: "Failed attempt 1/5",
        timestamp: now,
      });

      return { attempts: 1, locked: false };
    }
  },
});

// Clear login rate limit on successful login
export const clearLoginRateLimit = mutation({
  args: {
    ipAddress: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("loginRateLimit")
      .withIndex("by_ip_email", (q) => 
        q.eq("ipAddress", args.ipAddress).eq("email", args.email)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

// Check password reset rate limit
export const checkPasswordResetRateLimit = query({
  args: {
    ipAddress: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("passwordResetRateLimit")
      .withIndex("by_ip_email", (q) => 
        q.eq("ipAddress", args.ipAddress).eq("email", args.email)
      )
      .first();

    const now = Date.now();

    if (!existing) {
      return { allowed: true, remainingRequests: 3 };
    }

    // Check cooldown
    if (existing.cooldownUntil && existing.cooldownUntil > Date.now()) {
      return {
        allowed: false,
        cooldown: true,
        cooldownUntil: existing.cooldownUntil,
        message: "Please wait before requesting another password reset."
      };
    }

    const remaining = 3 - existing.requests;
    return { allowed: true, remainingRequests: Math.max(0, remaining) };
  },
});

// Record password reset request
export const recordPasswordResetRequest = mutation({
  args: {
    ipAddress: v.string(),
    email: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("passwordResetRateLimit")
      .withIndex("by_ip_email", (q) => 
        q.eq("ipAddress", args.ipAddress).eq("email", args.email)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Reset if last request was more than 1 hour ago
      if (now - existing.lastRequestAt > 60 * 60 * 1000) {
        await ctx.db.patch(existing._id, {
          requests: 1,
          lastRequestAt: now,
          cooldownUntil: undefined,
        });
        
        await ctx.db.insert("securityEvents", {
          eventType: "password_reset_requested",
          email: args.email,
          ipAddress: args.ipAddress,
          domain: args.domain,
          details: "Request 1/3 (window reset)",
          timestamp: now,
        });

        return { requests: 1, cooldown: false };
      }

      const newRequests = existing.requests + 1;
      let cooldownUntil: number | undefined;

      // Apply cooldown after 3 requests per hour
      if (newRequests >= 3) {
        cooldownUntil = now + 60 * 60 * 1000; // 1 hour cooldown
        
        await ctx.db.insert("securityEvents", {
          eventType: "rate_limit_exceeded",
          email: args.email,
          ipAddress: args.ipAddress,
          domain: args.domain,
          details: "Password reset rate limit exceeded",
          timestamp: now,
        });
      }

      await ctx.db.patch(existing._id, {
        requests: newRequests,
        lastRequestAt: now,
        cooldownUntil,
      });

      await ctx.db.insert("securityEvents", {
        eventType: "password_reset_requested",
        email: args.email,
        ipAddress: args.ipAddress,
        domain: args.domain,
        details: `Request ${newRequests}/3`,
        timestamp: now,
      });

      return { requests: newRequests, cooldown: newRequests >= 3, cooldownUntil };
    } else {
      await ctx.db.insert("passwordResetRateLimit", {
        ipAddress: args.ipAddress,
        email: args.email,
        requests: 1,
        lastRequestAt: now,
        domain: args.domain,
      });

      await ctx.db.insert("securityEvents", {
        eventType: "password_reset_requested",
        email: args.email,
        ipAddress: args.ipAddress,
        domain: args.domain,
        details: "Request 1/3",
        timestamp: now,
      });

      return { requests: 1, cooldown: false };
    }
  },
});

// Check verification email rate limit
export const checkVerificationRateLimit = query({
  args: {
    ipAddress: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("verificationRateLimit")
      .withIndex("by_ip_email", (q) => 
        q.eq("ipAddress", args.ipAddress).eq("email", args.email)
      )
      .first();

    const now = Date.now();

    if (!existing) {
      return { allowed: true, remainingRequests: 3 };
    }

    if (existing.cooldownUntil && existing.cooldownUntil > Date.now()) {
      return {
        allowed: false,
        cooldown: true,
        cooldownUntil: existing.cooldownUntil,
        message: "Please wait before requesting another verification email."
      };
    }

    const remaining = 3 - existing.requests;
    return { allowed: true, remainingRequests: Math.max(0, remaining) };
  },
});

// Record verification email request
export const recordVerificationRequest = mutation({
  args: {
    ipAddress: v.string(),
    email: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("verificationRateLimit")
      .withIndex("by_ip_email", (q) => 
        q.eq("ipAddress", args.ipAddress).eq("email", args.email)
      )
      .first();

    const now = Date.now();

    if (existing) {
      if (now - existing.lastRequestAt > 60 * 60 * 1000) {
        await ctx.db.patch(existing._id, {
          requests: 1,
          lastRequestAt: now,
          cooldownUntil: undefined,
        });

        await ctx.db.insert("securityEvents", {
          eventType: "verification_resent",
          email: args.email,
          ipAddress: args.ipAddress,
          domain: args.domain,
          details: "Request 1/3 (window reset)",
          timestamp: now,
        });

        return { requests: 1, cooldown: false };
      }

      const newRequests = existing.requests + 1;
      let cooldownUntil: number | undefined;

      if (newRequests >= 3) {
        cooldownUntil = now + 60 * 60 * 1000;

        await ctx.db.insert("securityEvents", {
          eventType: "rate_limit_exceeded",
          email: args.email,
          ipAddress: args.ipAddress,
          domain: args.domain,
          details: "Verification email rate limit exceeded",
          timestamp: now,
        });
      }

      await ctx.db.patch(existing._id, {
        requests: newRequests,
        lastRequestAt: now,
        cooldownUntil,
      });

      await ctx.db.insert("securityEvents", {
        eventType: "verification_resent",
        email: args.email,
        ipAddress: args.ipAddress,
        domain: args.domain,
        details: `Request ${newRequests}/3`,
        timestamp: now,
      });

      return { requests: newRequests, cooldown: newRequests >= 3, cooldownUntil };
    } else {
      await ctx.db.insert("verificationRateLimit", {
        ipAddress: args.ipAddress,
        email: args.email,
        requests: 1,
        lastRequestAt: now,
        domain: args.domain,
      });

      await ctx.db.insert("securityEvents", {
        eventType: "verification_resent",
        email: args.email,
        ipAddress: args.ipAddress,
        domain: args.domain,
        details: "Request 1/3",
        timestamp: now,
      });

      return { requests: 1, cooldown: false };
    }
  },
});
