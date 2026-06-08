import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Import users from migration data
export const importUsers = mutation({
  args: {
    users: v.array(
      v.object({
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        contactNumber: v.string(),
        passwordHash: v.string(),
        profileImage: v.optional(v.string()),
        isEmailVerified: v.boolean(),
        emailVerificationToken: v.optional(v.string()),
        emailVerificationTokenExpiry: v.optional(v.number()),
        passwordResetToken: v.optional(v.string()),
        passwordResetTokenExpiry: v.optional(v.number()),
        passwordExpiresAt: v.optional(v.number()),
        requirePasswordChange: v.optional(v.boolean()),
        apps: v.record(
          v.string(),
          v.object({
            hasAccess: v.boolean(),
            role: v.string(),
            grantedAt: v.number(),
            emailVerified: v.optional(v.boolean()),
            termsAcceptedAt: v.optional(v.number()),
            termsVersion: v.optional(v.string()),
          })
        ),
        createdAt: v.number(),
        updatedAt: v.number(),
        registeredFromDomain: v.string(),
      })
    ),
    skipExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const userData of args.users) {
      try {
        // Check if user already exists by email
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", userData.email))
          .first();

        if (existingUser) {
          if (args.skipExisting) {
            results.skipped++;
            continue;
          } else {
            results.errors.push(`User ${userData.email} already exists`);
            continue;
          }
        }

        // Create user with migrated data - preserve original domain
        await ctx.db.insert("users", {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          contactNumber: userData.contactNumber,
          passwordHash: userData.passwordHash, // bcrypt hash - will work!
          profileImage: userData.profileImage,
          isEmailVerified: userData.isEmailVerified,
          emailVerificationToken: userData.emailVerificationToken,
          emailVerificationTokenExpiry: userData.emailVerificationTokenExpiry,
          passwordResetToken: userData.passwordResetToken,
          passwordResetTokenExpiry: userData.passwordResetTokenExpiry,
          passwordExpiresAt: userData.passwordExpiresAt,
          requirePasswordChange: userData.requirePasswordChange,
          apps: userData.apps, // Keep original apps/domains
          userAccess: {}, // New field - default empty
          userType: "user", // New field - default to "user"
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          registeredFromDomain: userData.registeredFromDomain, // Keep original domain
        });

        results.imported++;
      } catch (error) {
        results.errors.push(`Failed to import ${userData.email}: ${error}`);
      }
    }

    return results;
  },
});
