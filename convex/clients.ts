import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import {
  validateUserCompanyAccess,
} from "./security";
import { api } from "./_generated/api";
import { getPlatformDomain } from './domainUtils';

// Helper function to validate access to a company resource
async function validateCompanyResourceAccess(ctx: any, userId: string, companyId: string) {
  await validateUserCompanyAccess(ctx as any, userId, companyId);
}

// Get all clients for a company
export const getClientsByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    await validateUserCompanyAccess(ctx, args.userId, args.companyId);
 
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
 
    return clients;
  },
});

// Search clients by company for autocomplete
export const searchClientsByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    await validateUserCompanyAccess(ctx, args.userId, args.companyId);
    
    const query = args.searchQuery.toLowerCase();
    
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Filter by search query
    return clients.filter(c => 
      c.companyName.toLowerCase().includes(query) ||
      c.contactName?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    ).slice(0, 10);
  },
});

// Get a client by ID
export const getClientById = query({
  args: {
    userId: v.id("users"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);

    if (!client) {
      return null;
    }

    // Validate user has access to the client's company
    await validateCompanyResourceAccess(ctx, args.userId, client.companyId);

    return client;
  },
});

// Create a new client
export const createClient = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    companyName: v.string(),
    contactName: v.string(),
    email: v.string(),
    contactNumber: v.string(),
    address: v.optional(v.string()),
    industry: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate user has access to this company
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const now = Date.now();

      const clientId = await ctx.db.insert("clients", {
        companyId: args.companyId,
        companyName: args.companyName,
        contactName: args.contactName,
        email: args.email,
        contactNumber: args.contactNumber,
        address: args.address || undefined,
        industry: args.industry || undefined,
        status: args.status || "prospect",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return clientId;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },
});

// Update a client
export const updateClient = mutation({
  args: {
    userId: v.id("users"),
    clientId: v.id("clients"),
    companyName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    email: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    industry: v.optional(v.string()),
    status: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);

    if (!client) {
      throw new Error("NOT_FOUND: Client not found");
    }

    // Validate user has access to the client's company
    await validateCompanyResourceAccess(ctx, args.userId, client.companyId);

    // If email is being changed, validate it
    const newEmail = args.email?.toLowerCase();
    const currentEmail = client.email.toLowerCase();
    
    if (newEmail && newEmail !== currentEmail) {
      // Check if user with this email already exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", newEmail))
        .first();

      if (existingUser) {
        throw new Error("EXISTING_USER: A user account with this email already exists. Please use a different email address.");
      }

      // Check if another client in this company already has this email
      const allClients = await ctx.db
        .query("clients")
        .withIndex("by_company", (q) => q.eq("companyId", client.companyId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      
      const existingClient = allClients.find(
        (c) => c.email.toLowerCase() === newEmail && c._id !== args.clientId
      );

      if (existingClient) {
        throw new Error("DUPLICATE_CLIENT: A client with this email already exists in this company. Each client must have a unique email address.");
      }
    }

    const now = Date.now();

    const updateData: any = {
      updatedAt: now,
    };

    if (args.companyName !== undefined) updateData.companyName = args.companyName;
    if (args.contactName !== undefined) updateData.contactName = args.contactName;
    if (args.email !== undefined) updateData.email = args.email.toLowerCase();
    if (args.contactNumber !== undefined) updateData.contactNumber = args.contactNumber;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.industry !== undefined) updateData.industry = args.industry;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;

    await ctx.db.patch(args.clientId, updateData);

    return { success: true };
  },
});

// Delete a client (soft delete)
export const deleteClient = mutation({
  args: {
    userId: v.id("users"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);

    if (!client) {
      throw new Error("NOT_FOUND: Client not found");
    }

    // Validate user has access to the client's company
    await validateCompanyResourceAccess(ctx, args.userId, client.companyId);

    // Hard delete - permanently remove from database
    await ctx.db.delete(args.clientId);

    return { success: true };
  },
});

// Generate secure random token
function generateSecureToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Generate random password
function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Create client with user account - action hashes password, mutation does DB work
export const createClientWithUser = action({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    contactNumber: v.string(),
    companyName: v.string(),
    password: v.string(),
    address: v.optional(v.string()),
    sendWelcomeEmail: v.boolean(),
    requireEmailVerification: v.boolean(),
    requirePasswordChange: v.boolean(),
  },
  handler: async (ctx: any, args: any): Promise<{ clientId: any; userId: any; success: boolean; password: string }> => {
    const bcrypt = await import("bcryptjs");
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(args.password, saltRounds);

    const result = await ctx.runMutation(api.clients.createClientWithUserMutation, {
      userId: args.userId,
      companyId: args.companyId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      contactNumber: args.contactNumber,
      companyName: args.companyName,
      passwordHash,
      plainPassword: args.password,
      address: args.address,
      sendWelcomeEmail: args.sendWelcomeEmail,
      requireEmailVerification: args.requireEmailVerification,
      requirePasswordChange: args.requirePasswordChange,
    });

    return result;
  },
});

export const createClientWithUserMutation = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    contactNumber: v.string(),
    companyName: v.string(),
    passwordHash: v.string(),
    plainPassword: v.string(),
    address: v.optional(v.string()),
    sendWelcomeEmail: v.boolean(),
    requireEmailVerification: v.boolean(),
    requirePasswordChange: v.boolean(),
  },
  handler: async (ctx: any, args: any): Promise<{ clientId: any; userId: any; success: boolean; password: string }> => {
    const company = await ctx.db.get(args.companyId) as any;
    if (!company) {
      throw new Error("Company not found");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existingUser) {
      throw new Error("EXISTING_USER: A user account with this email already exists. Please use a different email address.");
    }

    const allClients = await ctx.db
      .query("clients")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();
    
    const existingClient = allClients.find(
      (c: any) => c.email.toLowerCase() === args.email.toLowerCase()
    );

    if (existingClient) {
      throw new Error("DUPLICATE_CLIENT: A client with this email already exists in this company");
    }

    const isEmailVerified = !args.requireEmailVerification;
    const emailVerificationToken = generateSecureToken();
    const emailVerificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
      
    const companyDomain = (company as any).subdomain || (company as any).customDomain || 'crm';
    const companyApps = {
      [companyDomain]: {
        hasAccess: true,
        role: "client",
        grantedAt: Date.now(),
      },
    };
    
    const userId = await ctx.db.insert("users", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email.toLowerCase(),
      contactNumber: args.contactNumber,
      passwordHash: args.passwordHash,
      isEmailVerified: isEmailVerified,
      emailVerificationToken: isEmailVerified ? undefined : emailVerificationToken,
      emailVerificationTokenExpiry: isEmailVerified ? undefined : emailVerificationTokenExpiry,
      requirePasswordChange: args.requirePasswordChange,
      apps: companyApps,
      userType: "client",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      registeredFromDomain: companyDomain,
    });
  
    const now = Date.now();
    const clientId = await ctx.db.insert("clients", {
      companyId: args.companyId,
      userId: userId,
      companyName: args.companyName,
      contactName: `${args.firstName} ${args.lastName}`.trim(),
      email: args.email.toLowerCase(),
      contactNumber: args.contactNumber,
      address: args.address || undefined,
      status: "active",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    if (args.sendWelcomeEmail) {
      try {
        const domain = (company as any).subdomain || (company as any).customDomain || getPlatformDomain();
        const primaryColor = company.branding?.primaryColor || '#308a29';
        
        const welcomeContent = `
          <h2 style="color: #333; margin-top: 0;">Hello ${args.firstName}!</h2>
          <p>Welcome to ${company.name}!</p>
          <p>Your client account has been created. You can now access our client portal to:</p>
          <ul>
            <li>View your account details</li>
            <li>Access our services</li>
            <li>Manage your profile</li>
          </ul>
          <p><strong>Your login credentials:</strong></p>
          <p>Email: ${args.email}</p>
          <p>Password: ${args.plainPassword}</p>
          <p>Login URL: https://${domain}/auth/login</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The ${company.name} Team</p>
        `;

        const html = generateCompanyBrandedEmail(welcomeContent, primaryColor, company.name, company.branding);
        
        await ctx.scheduler.runAfter(0, api.emailActions.sendClientEmailAction, {
          to: [args.email],
          subject: `Welcome to ${company.name}!`,
          html: html,
        });
      } catch (emailError) {
        console.error('📧 [CLIENT CREATE] Failed to schedule welcome email:', emailError);
      }
    }

    if (args.requireEmailVerification) {
      try {
        const domain = (company as any).subdomain || (company as any).customDomain || getPlatformDomain();
        const primaryColor = company.branding?.primaryColor || '#308a29';
        const verificationUrl = `https://${domain}/auth/verify-email?token=${emailVerificationToken}`;
        
        const verifyContent = `
          <h2 style="color: #333; margin-top: 0;">Hello ${args.firstName}!</h2>
          <p>Thank you for registering with ${company.name}. To complete your registration and access the client portal, please verify your email address.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: ${primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 14px;">
            ${verificationUrl}
          </p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Important:</strong> This verification link will expire in 24 hours.</p>
          </div>
          <p>If you didn't create an account with ${company.name}, please ignore this email.</p>
          <p>Best regards,<br>The ${company.name} Team</p>
        `;

        const html = generateCompanyBrandedEmail(verifyContent, primaryColor, company.name, company.branding);
        
        await ctx.scheduler.runAfter(0, api.emailActions.sendClientEmailAction, {
          to: [args.email],
          subject: `Verify your email for ${company.name}`,
          html: html,
        });
      } catch (emailError) {
        console.error('📧 [CLIENT CREATE] Failed to schedule verification email:', emailError);
      }
    }

    return { clientId, userId, success: true, password: args.plainPassword };
  },
});

// Helper function to generate company branded email template
function generateCompanyBrandedEmail(content: string, primaryColor: string, companyName: string, branding?: { logoUrl?: string; logoType?: string; logoText?: string; logoTextColor?: string }) {
  let logoSection = '';
  if (branding?.logoType === 'image' && branding.logoUrl) {
    logoSection = `<img src="${branding.logoUrl}" alt="${companyName}" style="max-height: 60px; max-width: 200px; object-fit: contain; margin-bottom: 10px;">`;
  } else if (branding?.logoType === 'text' && branding.logoText) {
    logoSection = `<div style="font-size: 28px; font-weight: bold; color: ${branding.logoTextColor || primaryColor}; font-family: Arial, sans-serif; margin: 0;">${branding.logoText}</div>`;
  } else {
    logoSection = `<div style="font-size: 28px; font-weight: bold; color: ${primaryColor}; font-family: Arial, sans-serif; margin: 0;">${companyName}</div>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${companyName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: white; padding: 30px 20px; text-align: center; border-bottom: 4px solid ${primaryColor};">
          ${logoSection}
        </div>
        <div style="padding: 30px;">
          ${content}
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            This email was sent by ${companyName}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Create client record for auto-registered user (from public registration)
export const createForRegisteredUser = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    companyName: v.string(),
    contactName: v.string(),
    email: v.string(),
    contactNumber: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Check if client already exists for this user in this company
      const existing = await ctx.db
        .query("clients")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .filter((q) => q.eq(q.field("email"), args.email.toLowerCase()))
        .first();

      if (existing) {
        // Link userId if not already linked
        if (!existing.userId) {
          await ctx.db.patch(existing._id, {
            userId: args.userId,
            updatedAt: Date.now(),
          });
        }
        return { clientId: existing._id, alreadyExists: true };
      }

      const now = Date.now();
      const clientId = await ctx.db.insert("clients", {
        companyId: args.companyId,
        userId: args.userId,
        companyName: args.companyName,
        contactName: args.contactName,
        email: args.email.toLowerCase(),
        contactNumber: args.contactNumber || '',
        address: args.address,
        status: 'active',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return { clientId, alreadyExists: false };
    } catch (error) {
      console.error('Error creating client for registered user:', error);
      throw error;
    }
  },
});
