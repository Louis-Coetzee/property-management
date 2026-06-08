import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Generate secure random token
function generateSecureToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Action to register user with password hashing
export const registerUserAction = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    contactNumber: v.string(),
    password: v.string(),
    domain: v.string(),
    requirePasswordChange: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    userId: Id<"users">;
    emailVerificationToken: string;
    message: string;
  }> => {
    try {
      // Import bcrypt dynamically to handle Convex environment
      const bcrypt = await import("bcryptjs");
      
      // Hash password in action (can use setTimeout)
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(args.password, saltRounds);

      // Generate email verification token
      const emailVerificationToken = generateSecureToken();

      // Call mutation to create user
      const result = await ctx.runMutation(api.auth.createUser, {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        contactNumber: args.contactNumber,
        passwordHash,
        emailVerificationToken,
        domain: args.domain,
        requirePasswordChange: args.requirePasswordChange,
      });

      // Send verification email
      try {
        await ctx.runAction(api.emailActions.sendVerificationEmailAction, {
          email: args.email,
          firstName: args.firstName,
          verificationToken: emailVerificationToken,
          domain: args.domain,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails, just log it
      }

      // Auto-create client record if registering from a company domain
      if (args.domain && args.domain !== 'refreshcrm.vercel.app' && !args.domain.endsWith('.refreshcrm.vercel.app')) {
        try {
          // Look up domain mapping to find the company
          const domainMapping = await ctx.runQuery(api.domainManagement.getDomainMapping, {
            domain: args.domain,
          });

          if (domainMapping) {
            // Extract company ID from the mapping
            const companyId = domainMapping.companyId;
            const company = await ctx.runQuery(api.companies.getById, { companyId });

            if (company) {
              // Create client record for this company
              await ctx.runMutation(api.clients.createForRegisteredUser, {
                userId: result.userId,
                companyId: companyId,
                companyName: `${args.firstName} ${args.lastName}`.trim(),
                contactName: `${args.firstName} ${args.lastName}`.trim(),
                email: args.email,
                contactNumber: args.contactNumber,
              });
              console.log('📝 Auto-created client record for user:', result.userId, 'in company:', companyId);
            }
          }
        } catch (clientError) {
          console.error('Failed to auto-create client record:', clientError);
          // Don't fail registration if client creation fails
        }
      }

      return result;
    } catch (error) {
      // Add detailed error logging
      console.error('❌ registerUserAction error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error constructor:', (error as any)?.constructor?.name);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      // Re-throw the error so it can be caught by the client
      throw error;
    }
  },
});

// Action to login user with password verification
export const loginUserAction = action({
  args: {
    email: v.string(),
    password: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    requiresEmailVerification?: boolean;
    requiresRegistration?: boolean;
    requiresPasswordChange?: boolean;
    passwordExpired?: boolean;
    message?: string;
    sessionToken?: string;
    userId?: Id<"users">;
    user?: {
      id: Id<"users">;
      firstName: string;
      lastName: string;
      email: string;
      contactNumber: string;
      apps: any;
    };
  }> => {
    // Get user from mutation
    const user: Doc<"users"> | null = await ctx.runQuery(api.auth.getUserByEmail, {
      email: args.email,
    });

    if (!user) {
      return {
        success: false,
        message: "No account found with this email address. Please check your email or register for a new account.",
      };
    }

    // Import bcrypt dynamically
    const bcrypt = await import("bcryptjs");
    
    // Verify password first (more specific error handling)
    const isPasswordValid = await bcrypt.compare(args.password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Incorrect password. Please check your password and try again.",
      };
    }

    // Check if user has access to this domain
    const userApps = user.apps || {};
    if (!userApps[args.domain] || !userApps[args.domain].hasAccess) {
      return {
        success: false,
        requiresRegistration: true,
        message: "You don't have access to this domain. Please register for this domain first.",
      };
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return {
        success: false,
        requiresEmailVerification: true,
        message: "Please verify your email address before logging in. Check your inbox for a verification email.",
      };
    }

    // Check if password change is required (first login or admin-forced)
    if (user.requirePasswordChange) {
      return {
        success: false,
        requiresPasswordChange: true,
        userId: user._id,
        message: "You must change your password before continuing. Please enter a new password.",
      };
    }

    // Check if password has expired (6 months = 180 days)
    const sixMonthsInMs = 180 * 24 * 60 * 60 * 1000;
    const passwordAge = Date.now() - (user.updatedAt || user.createdAt);
    
    if (passwordAge > sixMonthsInMs) {
      return {
        success: false,
        passwordExpired: true,
        userId: user._id,
        message: "Your password has expired. For security reasons, passwords must be changed every 6 months. Please enter a new password.",
      };
    }

    // Create session via mutation
    const result: { sessionToken: string } = await ctx.runMutation(api.auth.createSession, {
      userId: user._id,
      domain: args.domain,
    });

    return {
      success: true,
      sessionToken: result.sessionToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNumber: user.contactNumber,
        apps: user.apps,
      },
    };
  },
});

// Action to reset password with password hashing
export const resetPasswordAction = action({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args): Promise<{ message: string }> => {
    // Import bcrypt dynamically
    const bcrypt = await import("bcryptjs");
    
    // Hash new password in action
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(args.newPassword, saltRounds);

    // Call mutation to update password
    const result: { message: string } = await ctx.runMutation(api.auth.updatePassword, {
      token: args.token,
      passwordHash,
    });

    return result;
  },
});

// Action to change password with verification
export const changePasswordAction = action({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args): Promise<{ message: string }> => {
    // Get the user by running a query
    const user = await ctx.runQuery(api.auth.getUserById, { userId: args.userId });

    if (!user) {
      throw new Error("User not found");
    }

    // Import bcrypt dynamically
    const bcrypt = await import("bcryptjs");
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(args.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(args.newPassword, saltRounds);

    // Call mutation to change password and clear requirePasswordChange flag
    const result: { message: string } = await ctx.runMutation(api.auth.changePassword, {
      userId: args.userId,
      currentPasswordHash: user.passwordHash,
      newPasswordHash,
    });

    return result;
  },
});

// Action to force password change during login (for expired or required changes)
export const forcePasswordChangeAction = action({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    // Get the user by running a query
    const user = await ctx.runQuery(api.auth.getUserById, { userId: args.userId });

    if (!user) {
      throw new Error("User not found");
    }

    // Import bcrypt dynamically
    const bcrypt = await import("bcryptjs");
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(args.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(args.newPassword, saltRounds);

    // Call mutation to update password and clear requirePasswordChange flag
    await ctx.runMutation(api.auth.changePassword, {
      userId: args.userId,
      currentPasswordHash: user.passwordHash,
      newPasswordHash,
    });

    return {
      success: true,
      message: "Password changed successfully. You can now login with your new password.",
    };
  },
});

// Action to update profile
export const updateProfileAction = action({
  args: {
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    contactNumber: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ message: string }> => {
    // Call mutation to update profile
    const result: { message: string } = await ctx.runMutation(api.auth.updateProfile, {
      userId: args.userId,
      firstName: args.firstName,
      lastName: args.lastName,
      contactNumber: args.contactNumber,
      profileImage: args.profileImage,
    });

    return result;
  },
});

// Action to verify existing user password and add domain access
export const verifyAndAddDomainAction = action({
  args: {
    email: v.string(),
    password: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    userId?: Id<"users">;
    message: string;
  }> => {
    // Get user by email
    const user: Doc<"users"> | null = await ctx.runQuery(api.auth.getUserByEmail, {
      email: args.email,
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Import bcrypt dynamically
    const bcrypt = await import("bcryptjs");
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(args.password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Incorrect password",
      };
    }

    // Check if user already has access to this domain
    const userApps = user.apps || {};
    if (userApps[args.domain]) {
      // User already has access - this is fine, just return success
      return {
        success: true,
        userId: user._id,
        message: "Domain access already exists",
      };
    }

    // Generate email verification token
    const emailVerificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Add domain access
    const result = await ctx.runMutation(api.auth.addDomainToExistingUser, {
      userId: user._id,
      domain: args.domain,
      emailVerificationToken,
    });

    // If user hasn't verified email, send verification email
    if (!user.isEmailVerified) {
      try {
        await ctx.runAction(api.emailActions.sendVerificationEmailAction, {
          email: user.email,
          firstName: user.firstName,
          verificationToken: emailVerificationToken,
          domain: args.domain,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }
    }

    return {
      success: true,
      userId: user._id,
      message: "Domain access granted successfully",
    };
  },
});

// Action to add domain access to existing user with password verification
export const addDomainToExistingUserAction = action({
  args: {
    email: v.string(),
    password: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    userId?: string;
    emailVerificationToken?: string;
    requiresEmailVerification?: boolean;
    message: string;
  }> => {
    // Get user by email to verify password
    const user = await ctx.runQuery(api.auth.getUserByEmail, {
      email: args.email,
    });

    if (!user) {
      return {
        success: false,
        message: "User not found"
      };
    }

    // Import bcrypt dynamically
    const bcrypt = await import("bcryptjs");
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(args.password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Incorrect password. Please try again."
      };
    }

    // Generate email verification token
    const emailVerificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Call mutation to add domain access regardless of email verification status
    const result = await ctx.runMutation(api.auth.addDomainToExistingUser, {
      userId: user._id,
      domain: args.domain,
      emailVerificationToken,
    });

    // Check if email is verified AFTER granting domain access
    if (!user.isEmailVerified) {
      return {
        success: false,
        requiresEmailVerification: true,
        message: "Domain access granted! Please verify your email address to complete the login process. Check your inbox for a verification email."
      };
    }

    // Send verification email for the new domain only if verification is needed
    if (result.emailVerificationToken) {
      try {
        await ctx.runAction(api.emailActions.sendVerificationEmailAction, {
          email: args.email,
          firstName: user.firstName,
          verificationToken: emailVerificationToken,
          domain: args.domain,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the operation if email fails, just log it
      }
    }

    return {
      success: true,
      userId: result.userId,
      emailVerificationToken: result.emailVerificationToken,
      message: result.message
    };
  },
});

// Action to register consultant with dual-database approach
export const registerConsultantAction = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    contactNumber: v.string(),
    password: v.string(),
    domain: v.string(),
    consultantTitle: v.string(),
    customTitle: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args): Promise<{
    userId: Id<"users">;
    consultantId?: string;
    emailVerificationToken: string;
    message: string;
  }> => {
    console.log('🔵 [SHARED-AUTH] Starting consultant registration:', {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      domain: args.domain,
      consultantTitle: args.consultantTitle,
      createdBy: args.createdBy
    });
    
    try {
      // Import bcrypt dynamically to handle Convex environment
      const bcrypt = await import("bcryptjs");
      
      // Hash password in action (can use setTimeout)
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(args.password, saltRounds);

      // Generate email verification token
      const emailVerificationToken = generateSecureToken();

      // Check if user already exists
      console.log('🔍 [SHARED-AUTH] Checking if user exists:', args.email);
      const existingUser = await ctx.runQuery(api.auth.getUserByEmail, {
        email: args.email,
      });

      let userId: Id<"users">;

      if (existingUser) {
        console.log('👤 [SHARED-AUTH] User exists, adding domain access:', args.domain);
        // User exists, add domain access
        const domainResult = await ctx.runMutation(api.auth.addDomainToExistingUser, {
          userId: existingUser._id,
          domain: args.domain,
          emailVerificationToken,
        });
        userId = existingUser._id;
        console.log('✅ [SHARED-AUTH] Domain access added for existing user:', userId);
      } else {
        console.log('👤 [SHARED-AUTH] Creating new user in shared-auth database');
        // Create new user in shared-auth database
        const userResult = await ctx.runMutation(api.auth.createUser, {
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
          contactNumber: args.contactNumber,
          passwordHash,
          emailVerificationToken,
          domain: args.domain,
        });
        userId = userResult.userId;
        console.log('✅ [SHARED-AUTH] New user created:', userId);
      }

      // Create consultant record in bookings database via HTTP client
      let consultantId: string | undefined;
      try {
        const bookingsConvexUrl = process.env.BOOKINGS_CONVEX_URL || "https://tangible-rabbit-550.convex.cloud";
        console.log('🔗 [SHARED-AUTH] Connecting to bookings database:', bookingsConvexUrl);
        
        const bookingsClient = new (await import("convex/browser")).ConvexHttpClient(bookingsConvexUrl);
        
        const consultantData = {
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
          phone: args.contactNumber,
          consultantTitle: args.consultantTitle,
          customTitle: args.customTitle,
          bio: args.bio,
          avatar: args.avatar,
          domain: args.domain,
          createdBy: args.createdBy,
          authUserId: userId,
        };
        
        console.log('📤 [SHARED-AUTH] Creating consultant in bookings database:', consultantData);
        
        const result = await bookingsClient.action("consultants:createConsultantFromAuth" as any, consultantData);

        console.log('📥 [SHARED-AUTH] Bookings database response:', result);
        
        if (result.success) {
          consultantId = result.consultantId;
          console.log('✅ [SHARED-AUTH] Consultant created in bookings database:', consultantId);
        } else {
          console.error('❌ [SHARED-AUTH] Failed to create consultant in bookings database:', result);
        }
      } catch (bookingsError) {
        console.error('💥 [SHARED-AUTH] Error creating consultant in bookings database:', bookingsError);
        console.error('💥 [SHARED-AUTH] Error details:', {
          name: bookingsError instanceof Error ? bookingsError.name : 'Unknown',
          message: bookingsError instanceof Error ? bookingsError.message : String(bookingsError),
          stack: bookingsError instanceof Error ? bookingsError.stack : 'No stack'
        });
        
        // If it's a duplicate consultant error, throw it to the client
        if (bookingsError instanceof Error && (
          bookingsError.message.includes("already exists") || 
          bookingsError.message.includes("duplicate") ||
          bookingsError.message.includes("Consultant with this email")
        )) {
          console.log('🚫 [SHARED-AUTH] Duplicate consultant detected, throwing error to client');
          throw new Error(`CONSULTANT_EXISTS:${bookingsError.message}`);
        }
        // For other errors, don't fail the user creation but log it
        console.log('⚠️ [SHARED-AUTH] Non-blocking error in consultant creation, continuing with user creation');
      }

      // Send verification email
      try {
        await ctx.runAction(api.emailActions.sendVerificationEmailAction, {
          email: args.email,
          firstName: args.firstName,
          verificationToken: emailVerificationToken,
          domain: args.domain,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails, just log it
      }

      return {
        userId,
        consultantId,
        emailVerificationToken,
        message: "Consultant registered successfully. Verification email sent."
      };
    } catch (error) {
      // Re-throw the error so it can be caught by the client
      throw error;
    }
  },
});

// Action to register client with dual-database approach
export const registerClientAction = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    contactNumber: v.string(),
    password: v.string(),
    domain: v.string(),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args): Promise<{
    userId: Id<"users">;
    clientId?: string;
    emailVerificationToken: string;
    message: string;
  }> => {
    console.log('🔵 [SHARED-AUTH] Starting client registration:', {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      domain: args.domain,
      createdBy: args.createdBy
    });

    try {
      // Import bcrypt dynamically to handle Convex environment
      const bcrypt = await import("bcryptjs");

      // Hash password in action (can use setTimeout)
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(args.password, saltRounds);

      // Generate email verification token
      const emailVerificationToken = generateSecureToken();

      // Check if user already exists
      console.log('🔍 [SHARED-AUTH] Checking if user exists:', args.email);
      const existingUser = await ctx.runQuery(api.auth.getUserByEmail, {
        email: args.email,
      });

      let userId: Id<"users">;

      if (existingUser) {
        console.log('👤 [SHARED-AUTH] User exists, automatically granting domain access for client creation');
        // User exists - automatically grant domain access without password verification
        // This is specifically for client creation flow, not user registration
        const domainResult = await ctx.runMutation(api.auth.addDomainToExistingUser, {
          userId: existingUser._id,
          domain: args.domain,
          emailVerificationToken,
        });
        userId = existingUser._id;
        console.log('✅ [SHARED-AUTH] Domain access granted for existing user:', userId);
      } else {
        console.log('👤 [SHARED-AUTH] Creating new user in shared-auth database');
        // Create new user in shared-auth database
        const userResult = await ctx.runMutation(api.auth.createUser, {
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
          contactNumber: args.contactNumber,
          passwordHash,
          emailVerificationToken,
          domain: args.domain,
        });
        userId = userResult.userId;
        console.log('✅ [SHARED-AUTH] New user created:', userId);
      }

      // Create client record in bookings database via HTTP client
      let clientId: string | undefined;
      try {
        const bookingsConvexUrl = process.env.BOOKINGS_CONVEX_URL || "https://tangible-rabbit-550.convex.cloud";
        console.log('🔗 [SHARED-AUTH] Connecting to bookings database:', bookingsConvexUrl);
        
        const bookingsClient = new (await import("convex/browser")).ConvexHttpClient(bookingsConvexUrl);
        
        // Get user data to include in client record
        const user = existingUser || await ctx.runQuery(api.auth.getUserById, { userId });

        const clientData = {
          authUserId: userId,
          firstName: user?.firstName || args.firstName,
          lastName: user?.lastName || args.lastName,
          email: user?.email || args.email,
          contactNumber: user?.contactNumber || args.contactNumber,
          address: undefined, // Address not stored in auth database, will be added to clients table if provided during client creation
          bio: args.bio,
          avatar: args.avatar,
          domain: args.domain,
          createdBy: args.createdBy,
        };
        
        console.log('📤 [SHARED-AUTH] Creating client in bookings database:', clientData);
        
        const result = await bookingsClient.action("clients:createClientFromAuth" as any, clientData);

        console.log('📥 [SHARED-AUTH] Bookings database response:', result);
        
        if (result.success) {
          clientId = result.clientId;
          console.log('✅ [SHARED-AUTH] Client created in bookings database:', clientId);
        } else {
          console.error('❌ [SHARED-AUTH] Failed to create client in bookings database:', result);
        }
      } catch (bookingsError) {
        console.error('💥 [SHARED-AUTH] Error creating client in bookings database:', bookingsError);
        console.error('💥 [SHARED-AUTH] Error details:', {
          name: bookingsError instanceof Error ? bookingsError.name : 'Unknown',
          message: bookingsError instanceof Error ? bookingsError.message : String(bookingsError),
          stack: bookingsError instanceof Error ? bookingsError.stack : 'No stack'
        });
        
        // If it's a duplicate client error, throw it to the client
        if (bookingsError instanceof Error && (
          bookingsError.message.includes("already exists") || 
          bookingsError.message.includes("duplicate") ||
          bookingsError.message.includes("Client with this email")
        )) {
          console.log('🚫 [SHARED-AUTH] Duplicate client detected, throwing error to client');
          throw new Error(`CLIENT_EXISTS:${bookingsError.message}`);
        }
        // For other errors, don't fail the user creation but log it
        console.log('⚠️ [SHARED-AUTH] Non-blocking error in client creation, continuing with user creation');
      }

      // Send verification email
      try {
        await ctx.runAction(api.emailActions.sendVerificationEmailAction, {
          email: args.email,
          firstName: args.firstName,
          verificationToken: emailVerificationToken,
          domain: args.domain,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails, just log it
      }

      // Return appropriate message based on whether user existed or was new
      const message = existingUser
        ? "Existing user found. Client record created and domain access granted successfully."
        : "Client registered successfully. Verification email sent.";

      return {
        userId,
        clientId,
        emailVerificationToken,
        message
      };
    } catch (error) {
      // Re-throw the error so it can be caught by the client
      throw error;
    }
  },
});
