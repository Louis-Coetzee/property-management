import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  validateUserCompanyAccess,
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";

// Get all companies for a user (via userCompanies many-to-many)
export const getCompaniesByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and authorization
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    // ✅ Verify userId matches authenticated user
    if (authUser.tokenIdentifier !== args.userId) {
      throw new Error("FORBIDDEN: Cannot access other users' data");
    }

    // Get user's company memberships
    const userCompanies = await ctx.db
      .query("userCompanies")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Fetch full company details
    const companies = await Promise.all(
      userCompanies.map(async (uc) => {
        const company = await ctx.db.get(uc.companyId);
        return company ? { ...company, userRole: uc.role } : null;
      })
    );

    return companies.filter(Boolean);
  },
});

// Get companies for a website (gets the company associated with the website)
export const getCompaniesByWebsite = query({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    // Get the website to find its company
    const website = await ctx.db.get(args.websiteId);
    if (!website || !website.companyId) {
      return [];
    }

    // ✅ Verify user has access to this company
    const { userCompany, isPlatformAdmin } = await validateCompanyResourceAccess(
      ctx,
      args.userId,
      website.companyId
    );

    // Return the company with user's role
    const company = await ctx.db.get(website.companyId);
    if (!company) {
      return [];
    }

    return [{ ...company, userRole: userCompany?.role || (isPlatformAdmin ? "admin" : "member") }];
  },
});

// Get all companies (admin view - only for platform admins)
export const getAllCompanies = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Platform-level query - requires special auth
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    // TODO: Add platform admin check
    // For now, return empty to prevent unauthorized access
    return [];
  },
});

// Get a company by ID
export const getByCompanyId = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and verify user has access to this company
    const { userCompany, isPlatformAdmin } = await validateCompanyResourceAccess(
      ctx,
      args.userId,
      args.companyId
    );

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    return {
      ...company,
      userRole: userCompany?.role || (isPlatformAdmin ? "admin" : "member"),
      cardPermissions: userCompany?.cardPermissions || {},
    };
  },
});

// Public query to get a company by ID without authentication
export const getByCompanyIdPublic = query({
  args: {
    companyId: v.string(), // Accept string for flexibility
  },
  handler: async (ctx, args) => {
    try {
      console.log('[getByCompanyIdPublic] Received companyId:', args.companyId, 'Length:', args.companyId?.length);
      
      if (!args.companyId || args.companyId.length === 0) {
        return null;
      }
      
      // Check if it's already a valid Convex ID (starts with "companies_")
      if (args.companyId.startsWith('companies_')) {
        console.log('[getByCompanyIdPublic] Trying as full Convex ID');
        try {
          const company = await ctx.db.get(args.companyId as any);
          if (!company || (company as any).name === undefined) {
            return null;
          }
          console.log('[getByCompanyIdPublic] Found company by full ID:', (company as any).name);
          return {
            _id: (company as any)._id,
            name: (company as any).name,
            description: (company as any).description,
            currency: (company as any).currency,
            branding: (company as any).branding,
            enabled: (company as any).enabled,
          };
        } catch (e) {
          console.error("[Error getting company by full ID:", e);
          return null;
        }
      }
      
      // Try as a potential short ID or other format - try to search
      console.log('[getByCompanyIdPublic] Trying to search by ID');
      // Try querying all companies and finding by ID
      const allCompanies = await ctx.db.query("companies").take(100);
      const found = allCompanies.find(c => (c as any)._id === args.companyId || (c as any)._id === `companies_${args.companyId}`);
      if (found) {
        console.log('[getByCompanyIdPublic] Found company by search:', (found as any).name);
        return {
          _id: (found as any)._id,
          name: (found as any).name,
          description: (found as any).description,
          currency: (found as any).currency,
          branding: (found as any).branding,
          enabled: (found as any).enabled,
        };
      }
      
      console.log('[getByCompanyIdPublic] Company not found');
      return null;
    } catch (error) {
      console.error("Error in getByCompanyIdPublic:", error);
      return null;
    }
  },
});

// Get company by ID without auth (for use in actions)
export const getById = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.companyId);
  },
});

// Query to find company by any ID format (full or short)
export const findCompanyById = query({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.companyId) return null;
    
    // If it's a full Convex ID
    if (args.companyId.startsWith('companies_')) {
      try {
        return await ctx.db.get(args.companyId as any);
      } catch {
        return null;
      }
    }
    
    // For short IDs, query by name (since companies have name indexes)
    // This is a fallback - ideally we'd store short IDs in the DB
    return null;
  },
});

// Public query to get company payment settings (only safe fields)
export const getCompanyPaymentSettingsPublic = query({
  args: {
    companyId: v.string(), // Accept string for flexibility
  },
  handler: async (ctx, args) => {
    try {
      // Try to parse as Id or find by string
      let company;
      try {
        company = await ctx.db.get(args.companyId as any);
      } catch {
        // If that fails, query by string
        const companies = await ctx.db
          .query("companies")
          .withIndex("by_name", (q) => q.eq("name", args.companyId))
          .first();
        company = companies;
      }
      
      if (!company) {
        return null;
      }
      
      const companyAny = company as any;
      if (!companyAny.paymentSettings) {
        return null;
      }

      const settings = companyAny.paymentSettings;
      return {
        payfast: settings.payfast ? {
          enabled: settings.payfast.enabled,
          testMode: settings.payfast.testMode,
          merchantId: settings.payfast.merchantId,
          merchantKey: settings.payfast.merchantKey,
          passphrase: settings.payfast.passphrase,
        } : undefined,
        paypal: settings.paypal ? {
          enabled: settings.paypal.enabled,
          testMode: settings.paypal.testMode,
          testClientId: settings.paypal.testClientId,
          testClientSecret: settings.paypal.testClientSecret,
          liveClientId: settings.paypal.liveClientId,
          liveClientSecret: settings.paypal.liveClientSecret,
        } : undefined,
      };
    } catch (error) {
      console.error("Error in getCompanyPaymentSettingsPublic:", error);
      return null;
    }
  },
});

// Create a new company
export const createCompany = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    subdomain: v.string(), // Required subdomain
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    // Required initial branch for the company
    initialBranch: v.object({
      name: v.string(),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
      country: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const now = Date.now();

    // Validate and format subdomain
    const subdomainBase = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';
    const subdomainValue = args.subdomain.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 63);
    
    const fullSubdomain = `${subdomainValue}.${subdomainBase}`;

    // Check if subdomain is already taken
    const existingDomain = await ctx.db
      .query("domainMappings")
      .withIndex("by_domain_value", (q) => q.eq("domainValue", fullSubdomain))
      .first();

    if (existingDomain) {
      throw new Error("SUBDOMAIN_TAKEN: This subdomain is already in use. Please choose a different one.");
    }

    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      description: args.description || "",
      subdomain: fullSubdomain,
      enabled: args.enabled !== undefined ? args.enabled : true,
      createdAt: now,
      updatedAt: now,
    });

    // ✅ Create domainMapping for the company's subdomain
    await ctx.db.insert("domainMappings", {
      companyId: companyId as any,
      entityId: companyId as any, // Using companyId as entityId for company domains
      entityType: "company",
      domainType: "subdomain",
      domainValue: fullSubdomain,
      status: "active",
      lastChecked: now,
      createdBy: authUser.tokenIdentifier as any,
      createdAt: now,
      updatedAt: now,
    });

    // ✅ Create the default branch for the company
    await ctx.db.insert("branches", {
      companyId: companyId as any,
      name: args.initialBranch.name,
      address: args.initialBranch.address,
      city: args.initialBranch.city,
      state: args.initialBranch.state,
      zipCode: args.initialBranch.zipCode,
      country: args.initialBranch.country,
      phone: args.initialBranch.phone,
      email: args.initialBranch.email,
      isActive: true,
      isDefault: true, // Mark as the default/primary branch
      createdAt: now,
      updatedAt: now,
    });

    // ✅ Create the userCompany link (owner role)
    await ctx.db.insert("userCompanies", {
      userId: authUser.tokenIdentifier as any,
      companyId: companyId as any,
      role: "owner",
      isActive: true,
      invitedBy: authUser.tokenIdentifier as any,
      invitedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return companyId;
  },
});

// Update a company
export const updateCompany = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    subdomain: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and authorization (requires admin role)
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "admin");

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.companyId, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.subdomain !== undefined && { subdomain: args.subdomain }),
      ...(args.enabled !== undefined && { enabled: args.enabled }),
      updatedAt: now,
    });

    return { success: true };
  },
});

// Delete a company
export const deleteCompany = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and authorization (requires owner role)
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "owner");

    // Delete associated domain mappings
    const domainMappings = await ctx.db
      .query("domainMappings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    for (const mapping of domainMappings) {
      await ctx.db.delete(mapping._id);
    }

    await ctx.db.delete(args.companyId);

    return { success: true };
  },
});

// Toggle company enabled status
export const toggleCompany = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and authorization (requires admin role)
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "admin");

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.companyId, {
      enabled: !company.enabled,
      updatedAt: now,
    });

    return { success: true, enabled: !company.enabled };
  },
});

// Update company currency settings
export const updateCompanyCurrency = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    currency: v.optional(v.object({
      code: v.optional(v.string()),
      symbol: v.optional(v.string()),
      symbolPosition: v.optional(v.string()),
      customSymbol: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and authorization (requires admin role)
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "admin");

    const now = Date.now();
    await ctx.db.patch(args.companyId, {
      currency: args.currency,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Update company timezone settings
export const updateCompanyTimezone = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and authorization (requires admin role)
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "admin");

    const now = Date.now();
    await ctx.db.patch(args.companyId, {
      timezone: args.timezone,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Update company branding settings
export const updateCompanyBranding = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    branding: v.optional(v.object({
      primaryColor: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      faviconUrl: v.optional(v.string()),
      logoType: v.optional(v.union(v.literal("image"), v.literal("text"))),
      logoText: v.optional(v.string()),
      logoTextColor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and authorization (requires admin role)
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "admin");

    const now = Date.now();
    await ctx.db.patch(args.companyId, {
      branding: args.branding,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Update company banking details (shown on invoices)
export const updateCompanyBanking = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    bankingDetails: v.optional(v.object({
      bankName: v.optional(v.string()),
      branchCode: v.optional(v.string()),
      accountType: v.optional(v.string()),
      accountNumber: v.optional(v.string()),
      accountHolder: v.optional(v.string()),
      swiftCode: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "admin");

    const now = Date.now();
    await ctx.db.patch(args.companyId, {
      bankingDetails: args.bankingDetails,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Update company payment/gateway settings
export const updateCompanyPaymentSettings = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    paymentSettings: v.optional(v.object({
      payfast: v.optional(v.object({
        enabled: v.boolean(),
        testMode: v.boolean(),
        merchantId: v.optional(v.string()),
        merchantKey: v.optional(v.string()),
        passphrase: v.optional(v.string()),
      })),
      paypal: v.optional(v.object({
        enabled: v.boolean(),
        testMode: v.boolean(),
        testClientId: v.optional(v.string()),
        testClientSecret: v.optional(v.string()),
        liveClientId: v.optional(v.string()),
        liveClientSecret: v.optional(v.string()),
      })),
    })),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and authorization (requires admin role)
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "admin");

    const now = Date.now();
    await ctx.db.patch(args.companyId, {
      paymentSettings: args.paymentSettings,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Update company primary domain
export const updateCompanyPrimaryDomain = mutation({
  args: {
    companyId: v.id("companies"),
    primaryDomain: v.string(),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.companyId, {
      primaryDomain: args.primaryDomain,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Toggle app enabled status for a company
export const toggleCompanyApp = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    appKey: v.string(), // "businessTools", "websites", "vehicleDealership"
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and authorization (requires admin role)
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "admin");

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    const now = Date.now();
    const currentEnabledApps = company.enabledApps || {};

    // Update the specific app
    const updatedEnabledApps = {
      ...currentEnabledApps,
      [args.appKey]: {
        enabled: args.enabled,
        enabledAt: args.enabled ? now : undefined,
      },
    };

    await ctx.db.patch(args.companyId, {
      enabledApps: updatedEnabledApps,
      updatedAt: now,
    });

    return { success: true, enabledApps: updatedEnabledApps };
  },
});

// Get company with enabled apps
export const getCompanyWithApps = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // ✅ Validate authentication and verify user has access to this company
    const { userCompany, isPlatformAdmin } = await validateCompanyResourceAccess(
      ctx,
      args.userId,
      args.companyId
    );

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    return { ...company, userRole: userCompany?.role || (isPlatformAdmin ? "admin" : "member") };
  },
});

// Get company credit balance
export const getCompanyCredit = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    return company.credit || { balance: 0, totalSpent: 0, lastUpdated: Date.now() };
  },
});

// Add credit to a company
export const addCompanyCredit = mutation({
  args: {
    companyId: v.id("companies"),
    amount: v.number(),
    paymentMethod: v.string(),
    reference: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("INVALID: Amount must be positive");
    }
    if (args.amount > 100000) {
      throw new Error("INVALID: Amount exceeds maximum limit of 100,000");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    const currentCredit = company.credit || { balance: 0, totalSpent: 0, lastUpdated: Date.now() };
    const newBalance = currentCredit.balance + args.amount;

    await ctx.db.patch(args.companyId, {
      credit: {
        balance: newBalance,
        totalSpent: currentCredit.totalSpent,
        lastUpdated: Date.now(),
      },
      updatedAt: Date.now(),
    });

    await ctx.db.insert("companyCredits", {
      companyId: args.companyId,
      amount: args.amount,
      type: "added",
      paymentMethod: args.paymentMethod,
      reference: args.reference,
      description: args.description,
      balanceAfter: newBalance,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

// Use credit for shipping (deduct from balance)
export const useCompanyCredit = mutation({
  args: {
    companyId: v.id("companies"),
    amount: v.number(),
    orderId: v.id("orders"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("INVALID: Amount must be positive");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    const currentCredit = company.credit || { balance: 0, totalSpent: 0, lastUpdated: Date.now() };

    if (currentCredit.balance < args.amount) {
      throw new Error("INSUFFICIENT_CREDIT: Not enough credit available");
    }

    const newBalance = currentCredit.balance - args.amount;
    const newTotalSpent = currentCredit.totalSpent + args.amount;

    await ctx.db.patch(args.companyId, {
      credit: {
        balance: newBalance,
        totalSpent: newTotalSpent,
        lastUpdated: Date.now(),
      },
      updatedAt: Date.now(),
    });

    await ctx.db.insert("companyCredits", {
      companyId: args.companyId,
      amount: -args.amount,
      type: "used",
      paymentMethod: undefined,
      reference: args.orderId,
      description: args.description,
      balanceAfter: newBalance,
      createdAt: Date.now(),
    });

    return { success: true, newBalance, amountUsed: args.amount };
  },
});

// Get credit transactions for a company
export const getCompanyCreditTransactions = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("companyCredits")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(100);

    return transactions;
  },
});

// Create a pending credit payment record
export const createCreditPayment = mutation({
  args: {
    companyId: v.id("companies"),
    amount: v.number(),
    paymentMethod: v.string(),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("INVALID: Amount must be positive");
    }
    if (args.amount > 100000) {
      throw new Error("INVALID: Amount exceeds maximum limit of 100,000");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("NOT_FOUND: Company not found");
    }

    const paymentRecord = await ctx.db.insert("creditPayments", {
      companyId: args.companyId,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      status: "pending",
      reference: args.reference,
      gatewayOrderId: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, paymentId: paymentRecord };
  },
});

// Update credit payment status (completed, cancelled, failed)
export const updateCreditPaymentStatus = mutation({
  args: {
    paymentId: v.id("creditPayments"),
    status: v.string(),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const validStatuses = ["pending", "completed", "cancelled", "failed"];
    if (!validStatuses.includes(args.status)) {
      throw new Error("INVALID: Invalid status");
    }

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("NOT_FOUND: Payment not found");
    }

    await ctx.db.patch(args.paymentId, {
      status: args.status,
      reference: args.reference || payment.reference,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get credit payment by reference
export const getCreditPaymentByReference = query({
  args: {
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("creditPayments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();

    return payment;
  },
});

// Get all credit payments for a company
export const getCreditPaymentsByCompany = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("creditPayments")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(50);

    return payments;
  },
});
