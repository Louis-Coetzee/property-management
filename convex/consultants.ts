import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  validateCompanyResourceAccess,
  getAuthenticatedUser,
} from "./security";

/**
 * Consultants management
 * Consultants are team members assigned as external consultants for a specific company
 */

// List all consultants for a company (including deactivated)
export const listByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "read");

    const consultants = await ctx.db
      .query("consultants")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const enriched = await Promise.all(
      consultants.map(async (c) => {
        const userCompany = await ctx.db.get(c.userCompanyId);
        const user = await ctx.db.get(c.userId);
        return {
          _id: c._id,
          userCompanyId: c.userCompanyId,
          userId: c.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          userFirstName: user?.firstName || "",
          userLastName: user?.lastName || "",
          userEmail: user?.email || "",
          userContactNumber: user?.contactNumber || "",
          userImage: user?.profileImage,
          role: c.role,
          description: c.description,
          hourlyRate: c.hourlyRate,
          isActive: c.isActive,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        };
      })
    );

    return enriched;
  },
});

// Get consultant by ID
export const getById = query({
  args: {
    userId: v.id("users"),
    consultantId: v.id("consultants"),
  },
  handler: async (ctx, args) => {
    const consultant = await ctx.db.get(args.consultantId);
    if (!consultant) {
      return null;
    }

    await validateCompanyResourceAccess(ctx, args.userId, consultant.companyId, "read");

    const userCompany = await ctx.db.get(consultant.userCompanyId);
    const user = await ctx.db.get(consultant.userId);
    return {
      _id: consultant._id,
      userCompanyId: consultant.userCompanyId,
      userId: consultant.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      userFirstName: user?.firstName || "",
      userLastName: user?.lastName || "",
      userEmail: user?.email || "",
      userContactNumber: user?.contactNumber || "",
      userImage: user?.profileImage,
      role: consultant.role,
      description: consultant.description,
      hourlyRate: consultant.hourlyRate,
      isActive: consultant.isActive,
      availability: consultant.availability,
      exclusions: consultant.exclusions,
      createdAt: consultant.createdAt,
      updatedAt: consultant.updatedAt,
    };
  },
});

// List active consultants for a company (public - no auth required)
export const listActiveByCompany = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const consultants = await ctx.db
      .query("consultants")
      .withIndex("by_company_active", (q) => 
        q.eq("companyId", args.companyId).eq("isActive", true)
      )
      .collect();

    const enriched = await Promise.all(
      consultants.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return {
          _id: c._id,
          userCompanyId: c.userCompanyId,
          userId: c.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          userEmail: user?.email || "",
          userContactNumber: user?.contactNumber || "",
          role: c.role,
          isActive: c.isActive,
          isDefault: c.isDefault || false,
          availability: c.availability,
          exclusions: c.exclusions,
        };
      })
    );

    return enriched;
  },
});

// List all services assigned to any active consultant for a company
export const listServicesByCompany = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const activeConsultants = await ctx.db
      .query("consultants")
      .withIndex("by_company_active", (q) => 
        q.eq("companyId", args.companyId).eq("isActive", true)
      )
      .collect();

    const consultantIds = activeConsultants.map(c => c._id);
    const serviceIdsSet = new Set<string>();

    for (const consultantId of consultantIds) {
      const consultantServices = await ctx.db
        .query("consultantServices")
        .withIndex("by_consultant_active", (q) => 
          q.eq("consultantId", consultantId).eq("isActive", true)
        )
        .collect();
      
      consultantServices.forEach(cs => serviceIdsSet.add(cs.serviceId));
    }

const services = [];
      for (const serviceId of serviceIdsSet) {
        const service = await ctx.db.get(serviceId as Id<"services">);
        if (service && service.isActive) {
          services.push({
            _id: service._id,
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            category: service.category || '',
            popular: (service as any).popular || false,
          });
        }
      }

    return services;
  },
});

// Search team members who can be added as consultants (not already consultants for this company)
export const searchAvailableTeamMembers = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "read");

    const userCompanies = await ctx.db
      .query("userCompanies")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const existingConsultantUserCompanyIds = new Set(
      (
        await ctx.db
          .query("consultants")
          .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect()
      ).map((c) => c.userCompanyId)
    );

    let availableMembers = userCompanies.filter(
      (uc) => !existingConsultantUserCompanyIds.has(uc._id)
    );

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      availableMembers = await Promise.all(
        availableMembers
          .filter(async (uc) => {
            const user = await ctx.db.get(uc.userId);
            if (!user) return false;
            const name = `${user.firstName} ${user.lastName}`.toLowerCase();
            const email = user.email.toLowerCase();
            return name.includes(query) || email.includes(query);
          })
      );
    }

    const enriched = await Promise.all(
      availableMembers.map(async (uc) => {
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
        };
      })
    );

    return enriched;
  },
});

// Add a team member as consultant
export const add = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    userCompanyId: v.id("userCompanies"),
    role: v.optional(v.string()),
    description: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "admin");

    const now = Date.now();

    const existing = await ctx.db
      .query("consultants")
      .withIndex("by_user_company", (q) =>
        q.eq("userCompanyId", args.userCompanyId)
      )
      .unique();

    if (existing) {
      throw new Error("This team member is already a consultant for this company");
    }

    const userCompany = await ctx.db.get(args.userCompanyId);
    if (!userCompany) {
      throw new Error("NOT_FOUND: Team member not found");
    }

    if (userCompany.companyId !== args.companyId) {
      throw new Error("FORBIDDEN: Team member does not belong to this company");
    }

    const consultantId = await ctx.db.insert("consultants", {
      companyId: args.companyId,
      userCompanyId: args.userCompanyId,
      userId: userCompany.userId,
      role: args.role,
      description: args.description,
      hourlyRate: args.hourlyRate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return consultantId;
  },
});

// Update a consultant
export const update = mutation({
  args: {
    userId: v.id("users"),
    consultantId: v.id("consultants"),
    role: v.optional(v.string()),
    description: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const consultant = await ctx.db.get(args.consultantId);
    if (!consultant) {
      throw new Error("NOT_FOUND: Consultant not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, consultant.companyId, "admin");

    const now = Date.now();

    await ctx.db.patch(args.consultantId, {
      role: args.role,
      description: args.description,
      hourlyRate: args.hourlyRate,
      updatedAt: now,
    });

    return args.consultantId;
  },
});

// Delete a consultant (soft delete)
export const remove = mutation({
  args: {
    userId: v.id("users"),
    consultantId: v.id("consultants"),
  },
  handler: async (ctx, args) => {
    const consultant = await ctx.db.get(args.consultantId);
    if (!consultant) {
      throw new Error("NOT_FOUND: Consultant not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, consultant.companyId, "admin");

    await ctx.db.patch(args.consultantId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.consultantId;
  },
});

// Update consultant availability
export const updateAvailability = mutation({
  args: {
    userId: v.id("users"),
    consultantId: v.id("consultants"),
    availability: v.optional(v.any()),
    exclusions: v.optional(v.array(v.object({
      date: v.string(),
      startTime: v.optional(v.string()),
      endTime: v.optional(v.string()),
      reason: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const consultant = await ctx.db.get(args.consultantId);
    if (!consultant) {
      throw new Error("NOT_FOUND: Consultant not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, consultant.companyId, "admin");

    const now = Date.now();

    await ctx.db.patch(args.consultantId, {
      availability: args.availability,
      exclusions: args.exclusions,
      updatedAt: now,
    });

    return args.consultantId;
  },
});

// List services assigned to a consultant
export const listServicesByConsultant = query({
  args: {
    userId: v.id("users"),
    consultantId: v.id("consultants"),
  },
  handler: async (ctx, args) => {
    const consultant = await ctx.db.get(args.consultantId);
    if (!consultant) {
      return [];
    }

    await validateCompanyResourceAccess(ctx, args.userId, consultant.companyId, "read");

    const consultantServices = await ctx.db
      .query("consultantServices")
      .withIndex("by_consultant_active", (q) => 
        q.eq("consultantId", args.consultantId).eq("isActive", true)
      )
      .collect();

    const enriched = await Promise.all(
      consultantServices.map(async (cs) => {
        const service = await ctx.db.get(cs.serviceId);
        return {
          _id: cs._id,
          consultantId: cs.consultantId,
          serviceId: cs.serviceId,
          serviceName: service?.name || "Unknown",
          serviceDescription: service?.description,
          servicePrice: service?.price || 0,
          serviceDuration: service?.duration,
          isActive: cs.isActive,
        };
      })
    );

    return enriched;
  },
});

// List available services for a company (not yet assigned to consultant)
export const listAvailableServices = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    consultantId: v.id("consultants"),
  },
  handler: async (ctx, args) => {
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "read");

    const allServices = await ctx.db
      .query("services")
      .withIndex("by_company_active", (q) => 
        q.eq("companyId", args.companyId).eq("isActive", true)
      )
      .collect();

    const assignedServiceIds = new Set(
      (
        await ctx.db
          .query("consultantServices")
          .withIndex("by_consultant_active", (q) => 
            q.eq("consultantId", args.consultantId).eq("isActive", true)
          )
          .collect()
      ).map((cs) => cs.serviceId)
    );

    return allServices.filter((s) => !assignedServiceIds.has(s._id));
  },
});

// Assign a service to a consultant
export const addService = mutation({
  args: {
    userId: v.id("users"),
    consultantId: v.id("consultants"),
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const consultant = await ctx.db.get(args.consultantId);
    if (!consultant) {
      throw new Error("NOT_FOUND: Consultant not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, consultant.companyId, "admin");

    const service = await ctx.db.get(args.serviceId);
    if (!service) {
      throw new Error("NOT_FOUND: Service not found");
    }

    const existing = await ctx.db
      .query("consultantServices")
      .withIndex("by_consultant", (q) => q.eq("consultantId", args.consultantId))
      .filter((q) => q.eq(q.field("serviceId"), args.serviceId))
      .unique();

    if (existing) {
      if (!existing.isActive) {
        await ctx.db.patch(existing._id, { isActive: true, updatedAt: Date.now() });
        return existing._id;
      }
      throw new Error("Service already assigned to this consultant");
    }

    const now = Date.now();
    const id = await ctx.db.insert("consultantServices", {
      consultantId: args.consultantId,
      serviceId: args.serviceId,
      companyId: consultant.companyId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Remove a service from a consultant
export const removeService = mutation({
  args: {
    userId: v.id("users"),
    consultantServiceId: v.id("consultantServices"),
  },
  handler: async (ctx, args) => {
    const consultantService = await ctx.db.get(args.consultantServiceId);
    if (!consultantService) {
      throw new Error("NOT_FOUND: Consultant service not found");
    }

    const consultant = await ctx.db.get(consultantService.consultantId);
    if (!consultant) {
      throw new Error("NOT_FOUND: Consultant not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, consultant.companyId, "admin");

    await ctx.db.patch(args.consultantServiceId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.consultantServiceId;
  },
});

// Toggle consultant active status
export const toggleActive = mutation({
  args: {
    userId: v.id("users"),
    consultantId: v.id("consultants"),
  },
  handler: async (ctx, args) => {
    const consultant = await ctx.db.get(args.consultantId);
    if (!consultant) {
      throw new Error("NOT_FOUND: Consultant not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, consultant.companyId, "admin");

    await ctx.db.patch(args.consultantId, {
      isActive: !consultant.isActive,
      updatedAt: Date.now(),
    });

    return args.consultantId;
  },
});

// Set consultant as default (clears other defaults first)
export const setDefault = mutation({
  args: {
    userId: v.id("users"),
    consultantId: v.id("consultants"),
  },
  handler: async (ctx, args) => {
    const consultant = await ctx.db.get(args.consultantId);
    if (!consultant) {
      throw new Error("Consultant not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, consultant.companyId, "write");

    // Clear any existing default for this company
    const existingDefaults = await ctx.db
      .query("consultants")
      .withIndex("by_company_default", (q) => 
        q.eq("companyId", consultant.companyId).eq("isDefault", true)
      )
      .collect();

    for (const defaultConsultant of existingDefaults) {
      await ctx.db.patch(defaultConsultant._id, { isDefault: false, updatedAt: Date.now() });
    }

    // Set this consultant as default
    await ctx.db.patch(args.consultantId, { isDefault: true, updatedAt: Date.now() });

    return args.consultantId;
  },
});

// List all consultant service mappings (public - for booking frontend)
export const listAllServiceMappings = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Get all active consultants for company
    const consultants = await ctx.db
      .query("consultants")
      .withIndex("by_company_active", (q) => 
        q.eq("companyId", args.companyId).eq("isActive", true)
      )
      .collect();
    
    const consultantIds = consultants.map(c => c._id);
    
    // Get all consultant services for these consultants
    const mappings = [];
    for (const consultantId of consultantIds) {
      const consultantServices = await ctx.db
        .query("consultantServices")
        .withIndex("by_consultant", (q) => q.eq("consultantId", consultantId))
        .collect();
      
      for (const cs of consultantServices) {
        if (cs.isActive) {
          mappings.push({
            consultantId: cs.consultantId,
            serviceId: cs.serviceId,
          });
        }
      }
    }
    
    return mappings;
  },
});

// Get default consultant for a company (public - for booking frontend)
export const getDefaultByCompany = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const consultant = await ctx.db
      .query("consultants")
      .withIndex("by_company_default", (q) => 
        q.eq("companyId", args.companyId).eq("isDefault", true)
      )
      .first();

    if (!consultant) return null;

    const user = await ctx.db.get(consultant.userId);
    return {
      _id: consultant._id,
      userCompanyId: consultant.userCompanyId,
      userId: consultant.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      userEmail: user?.email || "",
      userContactNumber: user?.contactNumber || "",
      role: consultant.role,
      isActive: consultant.isActive,
      isDefault: true,
      availability: consultant.availability,
      exclusions: consultant.exclusions,
    };
  },
});