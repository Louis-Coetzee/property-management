import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  validateUserCompanyAccess,
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";
// Vehicle status enum values
const VehicleStatus = {
  draft: "draft",
  available: "available",
  reserved: "reserved",
  sold: "sold",
};

// Vehicle condition enum values
const VehicleCondition = {
  new: "new",
  used: "used",
  certified: "certified",
};

// Vehicle type enum values
const VehicleType = {
  sedan: "sedan",
  suv: "suv",
  truck: "truck",
  coupe: "coupe",
  convertible: "convertible",
  hatchback: "hatchback",
  wagon: "wagon",
  van: "van",
  motorcycle: "motorcycle",
  atv: "atv",
  rv: "rv",
  trailer: "trailer",
  other: "other",
};

// Get all vehicles for a company
export const getVehiclesByCompany = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      return vehicles;
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      throw error;
    }
  },
});

// Get unique vehicle types for a company
export const getVehicleTypesByCompany = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      // Extract unique vehicle types
      const vehicleTypesMap = new Map<string, { name: string; count: number }>();
      vehicles.forEach((vehicle) => {
        const type = vehicle.vehicleType || "other";
        const existing = vehicleTypesMap.get(type);
        if (existing) {
          existing.count++;
        } else {
          vehicleTypesMap.set(type, { name: type, count: 1 });
        }
      });

      return Array.from(vehicleTypesMap.values()).sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
      throw error;
    }
  },
});

// Get unique vehicle conditions for a website
export const getVehicleConditionsByWebsite = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      // First, get the website to find its company
      const website = await ctx.db.get(args.websiteId);
      if (!website || !website.companyId) {
        return [];
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      // Get all vehicles for that company
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      // Extract unique conditions with counts
      const conditionsMap = new Map<string, {
        name: string;
        count: number;
        label: string;
      }>();
      vehicles.forEach((vehicle) => {
        const condition = vehicle.condition || "unknown";
        const existing = conditionsMap.get(condition);
        if (existing) {
          existing.count++;
        } else {
          // Create a user-friendly label (new, pre-owned, certified)
          const label =
            condition === "new"
              ? "New"
              : condition === "used"
                ? "Pre-Owned"
                : condition === "certified"
                  ? "Certified Pre-Owned"
                  : condition.charAt(0).toUpperCase() + condition.slice(1);
          conditionsMap.set(condition, { name: condition, count: 1, label });
        }
      });

      // Sort by count and return
      return Array.from(conditionsMap.values())
        .sort((a, b) => b.count - a.count)
        .map((item) => ({ name: item.name, count: item.count, label: item.label }));
    } catch (error) {
      console.error("Error fetching vehicle conditions by website:", error);
      throw error;
    }
  },
});

// Get unique brands for a website
export const getBrandsByWebsite = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      // First, get the website to find its company
      const website = await ctx.db.get(args.websiteId);
      if (!website || !website.companyId) {
        return [];
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      // Get all vehicles for that company
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      // Extract unique brands
      const brandsMap = new Map<string, { name: string; count: number }>();
      vehicles.forEach((vehicle) => {
        // Use the brand field if available, otherwise use make
        const brand = vehicle.brand || vehicle.make || "Unknown";
        const existing = brandsMap.get(brand);
        if (existing) {
          existing.count++;
        } else {
          brandsMap.set(brand, { name: brand, count: 1 });
        }
      });

      return Array.from(brandsMap.values()).sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("Error fetching brands by website:", error);
      throw error;
    }
  },
});

// Get all vehicles for a website
export const getVehiclesByWebsite = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      // First, get the website to find its company
      const website = await ctx.db.get(args.websiteId);
      if (!website || !website.companyId) {
        return [];
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      // Then get all vehicles for that company
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      return vehicles;
    } catch (error) {
      console.error("Error fetching vehicles by website:", error);
      throw error;
    }
  },
});

// Get all active/available vehicles for a website (for public showcase)
export const getActiveVehiclesByWebsite = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      // First, get the website to find its company
      const website = await ctx.db.get(args.websiteId);
      if (!website || !website.companyId) {
        console.log("[getActiveVehiclesByWebsite] No website or companyId");
        return [];
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      // Then get all active and available vehicles for that company
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      console.log(
        `[getActiveVehiclesByWebsite] Website: ${website.name}, Company: ${website.companyId}, Total vehicles: ${vehicles.length}`
      );

      // Filter for active and available vehicles
      const activeVehicles = vehicles.filter(
        (v) => v.isActive && v.status === "available"
      );
      console.log(
        `[getActiveVehiclesByWebsite] Active/Available vehicles: ${activeVehicles.length}`
      );

      return activeVehicles;
    } catch (error) {
      console.error("Error fetching active vehicles by website:", error);
      throw error;
    }
  },
});

// Public query to get all vehicles for a website without authentication
export const getVehiclesByWebsitePublic = query({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      // First, get the website to find its company
      const website = await ctx.db.get(args.websiteId);
      if (!website || !website.companyId) {
        return [];
      }

      // Then get all vehicles for that company
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      // Only return active vehicles
      return vehicles.filter(v => v.isActive);
    } catch (error) {
      console.error("Error fetching vehicles by website (public):", error);
      throw error;
    }
  },
});

// Public query to get active/available vehicles for a website without authentication
export const getActiveVehiclesByWebsitePublic = query({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      // First, get the website to find its company
      const website = await ctx.db.get(args.websiteId);
      if (!website || !website.companyId) {
        return [];
      }

      // Then get all active and available vehicles for that company
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      // Filter for active and available vehicles
      return vehicles.filter(v => v.isActive && v.status === "available");
    } catch (error) {
      console.error("Error fetching active vehicles by website (public):", error);
      throw error;
    }
  },
});

// Debug query: Get ALL vehicles for a website (including inactive) for debugging
export const getAllVehiclesByWebsiteForDebug = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      console.log("[DEBUG] Getting all vehicles for website:", args.websiteId);

      // First, get the website to find its company
      const website = await ctx.db.get(args.websiteId);
      console.log(
        "[DEBUG] Website found:",
        website
          ? { id: website._id, name: website.name, companyId: website.companyId }
          : null
      );

      if (!website || !website.companyId) {
        return {
          website: null,
          companyId: null,
          totalVehicles: 0,
          vehicles: [],
          message: "No website or companyId found",
        };
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      // Get ALL vehicles for that company (no filtering)
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      console.log("[DEBUG] Found vehicles for company:", vehicles.length);

      return {
        website: website.name,
        companyId: website.companyId,
        totalVehicles: vehicles.length,
        vehicles: vehicles.map((v) => ({
          id: v._id,
          make: v.make,
          model: v.model,
          isActive: v.isActive,
          status: v.status,
          condition: v.condition,
        })),
        message:
          vehicles.length === 0
            ? "No vehicles found for this company"
            : `Found ${vehicles.length} total vehicles`,
      };
    } catch (error) {
      console.error("Error in debug query:", error);
      throw error;
    }
  },
});

// TEMPORARY DEBUG: Get ALL vehicles for a website, bypassing ALL filters
// This is a debug query to show all vehicles regardless of status, company, etc.
export const getAllVehiclesBypassFilters = query({
  args: {
        userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      console.log("[BYPASS] Getting ALL vehicles (bypassing all filters)");

      // Get the website to find its company
      const website = await ctx.db.get(args.websiteId);
      console.log(
        "[BYPASS] Website:",
        website
          ? { id: website._id, name: website.name, companyId: website.companyId }
          : null
      );

      if (!website || !website.companyId) {
        console.log("[BYPASS] No website/companyId found");
        return [];
      }

      // Validate user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      // Get ALL vehicles - no filtering at all
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      console.log(
        `[BYPASS] Found ${vehicles.length} vehicles for company ${website.companyId}`
      );

      // Log each vehicle with full details
      vehicles.forEach((v, i) => {
        console.log(`[BYPASS] Vehicle ${i + 1}:`, {
          id: v._id,
          make: v.make,
          model: v.model,
          year: v.year,
          companyId: v.companyId,
          isActive: v.isActive,
          status: v.status,
          condition: v.condition,
          brand: v.brand,
        });
      });

      // Return ALL vehicles with no filtering
      return vehicles;
    } catch (error) {
      console.error("[BYPASS] Error:", error);
      throw error;
    }
  },
});

// Get vehicles by status
export const getVehiclesByStatus = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company_status", (q) =>
          q.eq("companyId", args.companyId).eq("status", args.status)
        )
        .collect();

      return vehicles;
    } catch (error) {
      console.error("Error fetching vehicles by status:", error);
      throw error;
    }
  },
});

// Get vehicles by branch
export const getVehiclesByBranch = query({
  args: {
    userId: v.id("users"),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      if (!args.branchId) {
        return [];
      }

      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
        .collect();

      // Filter by companies the user has access to
      const userCompanies = await ctx.db
        .query("userCompanies")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      const accessibleCompanyIds = new Set(
        userCompanies.map((uc) => uc.companyId)
      );

      return vehicles.filter((v) => accessibleCompanyIds.has(v.companyId));
    } catch (error) {
      console.error("Error fetching vehicles by branch:", error);
      throw error;
    }
  },
});

// Get vehicles by assigned salesperson
export const getVehiclesBySalesperson = query({
  args: {
    salespersonId: v.id("users"),
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      // Filter vehicles where the salesperson is assigned
      return vehicles.filter((v) =>
        v.assignedSalespersonIds?.includes(args.salespersonId)
      );
    } catch (error) {
      console.error("Error fetching vehicles by salesperson:", error);
      throw error;
    }
  },
});

// Get a vehicle by ID
export const getVehicleById = query({
  args: {
        userId: v.id("users"),
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const vehicle = await ctx.db.get(args.vehicleId);
      if (!vehicle) {
        return null;
      }

      // Validate user has access to the vehicle's company
      await validateCompanyResourceAccess(ctx, args.userId, vehicle.companyId);

      return vehicle;
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      throw error;
    }
  },
});

// Get a vehicle by string ID (for URL params that are strings)
// This handles both formats: "vehicles_abc123" and "abc123"
export const getVehicleByIdString = query({
  args: {
    userId: v.id("users"),
    vehicleId: v.string(),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      // Normalize the ID - add vehicles_ prefix if not present
      const normalizedId = args.vehicleId.startsWith("vehicles_")
        ? args.vehicleId
        : `vehicles_${args.vehicleId}`;

      // Try to get the vehicle - if ID format is invalid, this will return null
      try {
        const vehicle = await ctx.db.get(normalizedId as any) as any;
        if (!vehicle) {
          return null;
        }

        // Validate user has access to the vehicle's company
        await validateCompanyResourceAccess(ctx, args.userId, vehicle.companyId);

        return vehicle;
      } catch {
        // If the ID is invalid format, return null
        return null;
      }
    } catch (error) {
      console.error("Error fetching vehicle by string ID:", error);
      throw error;
    }
  },
});

// Search vehicles by reference
export const searchByReference = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_reference", (q) => q.eq("reference", args.reference))
        .collect();

      // Filter by company
      return vehicles.filter((v) => v.companyId === args.companyId);
    } catch (error) {
      console.error("Error searching vehicles by reference:", error);
      throw error;
    }
  },
});

// Search vehicles by VIN
export const searchByVIN = query({
  args: {
    userId: v.id("users"),
    vin: v.string(),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const vehicle = await ctx.db
        .query("vehicles")
        .withIndex("by_vin", (q) => q.eq("vin", args.vin))
        .unique();

      if (!vehicle) {
        return null;
      }

      // Validate user has access to the vehicle's company
      await validateCompanyResourceAccess(ctx, args.userId, vehicle.companyId);

      return vehicle;
    } catch (error) {
      console.error("Error searching vehicle by VIN:", error);
      throw error;
    }
  },
});

// Create a new vehicle
export const createVehicle = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    // Core fields
    name: v.string(),
    description: v.optional(v.string()),
    reference: v.string(),
    vin: v.optional(v.string()),

    // Classification
    vehicleType: v.optional(v.string()),
    brand: v.optional(v.string()),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    condition: v.optional(v.string()),

    // Pricing
    price: v.number(),
    discountedPrice: v.optional(v.number()),
    cost: v.optional(v.number()),

    // Inventory
    status: v.optional(v.string()),
    isActive: v.optional(v.boolean()),

    // Relationships
    branchId: v.optional(v.id("branches")),
    assignedSalespersonIds: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
    leadIds: v.optional(v.array(v.id("leads"))),

    // Media
    images: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    documentUrls: v.optional(v.array(v.string())),

    // Specifications
    specifications: v.optional(
      v.object({
        engine: v.optional(v.string()),
        transmission: v.optional(v.string()),
        fuelType: v.optional(v.string()),
        drivetrain: v.optional(v.string()),
        mileage: v.optional(v.number()),
        exteriorColor: v.optional(v.string()),
        interiorColor: v.optional(v.string()),
        doors: v.optional(v.number()),
        cylinders: v.optional(v.number()),
        horsepower: v.optional(v.number()),
      })
    ),

    // Extensions
    extraSpecifications: v.optional(v.record(v.string(), v.any())),
    features: v.optional(v.array(v.string())),

    // Analytics
    viewsCount: v.optional(v.number()),
    leadCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authentication - user must be member of the company
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      args.companyId,
      "member"
    );

    try {
      const now = Date.now();

      // Helper function to sanitize specifications by removing NaN values from optional number fields
      const sanitizeSpecifications = (specs: any) => {
        if (!specs) return undefined;
        const sanitized: any = {};
        for (const [key, value] of Object.entries(specs)) {
          // Keep the value if it's not a number, or if it's a valid number (not NaN)
          if (typeof value !== "number" || !isNaN(value as number)) {
            sanitized[key] = value;
          }
        }
        return Object.keys(sanitized).length > 0 ? sanitized : undefined;
      };

      // Helper function to check if a number is valid (not NaN)
      const isValidNumber = (value: any): boolean => {
        return typeof value === "number" && !isNaN(value);
      };

      // Check if VIN already exists (only if VIN is provided)
      if (args.vin && args.vin.trim() !== "") {
        const existingVehicle = await ctx.db
          .query("vehicles")
          .withIndex("by_vin", (q) => q.eq("vin", args.vin))
          .unique();

        if (existingVehicle) {
          throw new Error("A vehicle with this VIN already exists");
        }
      }

      // Check if reference already exists for this company
      const existingReference = await ctx.db
        .query("vehicles")
        .withIndex("by_reference", (q) => q.eq("reference", args.reference))
        .collect();

      const refExistsForCompany = existingReference.some(
        (v) => v.companyId === args.companyId
      );
      if (refExistsForCompany) {
        throw new Error(
          "A vehicle with this reference already exists in your company"
        );
      }

      const sanitizedSpecs = sanitizeSpecifications(args.specifications);

      const vehicleId = await ctx.db.insert("vehicles", {
        // Core
        name: args.name,
        description: args.description || undefined,
        reference: args.reference,
        vin: args.vin || undefined,

        // Classification
        vehicleType: args.vehicleType || "sedan",
        brand: args.brand || undefined,
        make: args.make,
        model: args.model,
        year: args.year,
        condition: args.condition || "used",

        // Pricing
        price: args.price,
        discountedPrice: isValidNumber(args.discountedPrice)
          ? args.discountedPrice
          : undefined,
        cost: isValidNumber(args.cost) ? args.cost : undefined,

        // Inventory
        status: args.status || "draft",
        isActive: args.isActive !== undefined ? args.isActive : true,

        // Relationships
        companyId: args.companyId,
        branchId: args.branchId,
        assignedSalespersonIds: args.assignedSalespersonIds || [],
        tags: args.tags || [],
        leadIds: args.leadIds || [],

        // Media
        images: args.images || [],
        featuredImage: args.featuredImage || undefined,
        documentUrls: args.documentUrls || [],

        // Specifications
        specifications: sanitizedSpecs || {},

        // Extensions
        extraSpecifications: args.extraSpecifications || {},
        features: args.features || [],

        // Analytics
        viewsCount: isValidNumber(args.viewsCount) ? args.viewsCount : 0,
        leadCount: isValidNumber(args.leadCount) ? args.leadCount : 0,

        // Metadata
        schemaVersion: "1.0",
        createdAt: now,
        updatedAt: now,
      });

      return vehicleId;
    } catch (error) {
      console.error("Error creating vehicle:", error);
      throw error;
    }
  },
});

// Update a vehicle
export const updateVehicle = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    requestingUserId: v.id("users"),

    // Optional update fields
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    reference: v.optional(v.string()),
    vin: v.optional(v.string()),

    // Classification
    vehicleType: v.optional(v.string()),
    brand: v.optional(v.string()),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    condition: v.optional(v.string()),

    // Pricing
    price: v.optional(v.number()),
    discountedPrice: v.optional(v.number()),
    cost: v.optional(v.number()),

    // Inventory
    status: v.optional(v.string()),
    isActive: v.optional(v.boolean()),

    // Relationships
    branchId: v.optional(v.id("branches")),
    assignedSalespersonIds: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
    leadIds: v.optional(v.array(v.id("leads"))),

    // Media
    images: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    documentUrls: v.optional(v.array(v.string())),

    // Specifications
    specifications: v.optional(
      v.object({
        engine: v.optional(v.string()),
        transmission: v.optional(v.string()),
        fuelType: v.optional(v.string()),
        drivetrain: v.optional(v.string()),
        mileage: v.optional(v.number()),
        exteriorColor: v.optional(v.string()),
        interiorColor: v.optional(v.string()),
        doors: v.optional(v.number()),
        cylinders: v.optional(v.number()),
        horsepower: v.optional(v.number()),
      })
    ),

    // Extensions
    extraSpecifications: v.optional(v.record(v.string(), v.any())),
    features: v.optional(v.array(v.string())),

    // Analytics
    viewsCount: v.optional(v.number()),
    leadCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.requestingUserId);

    const vehicle = await ctx.db.get(args.vehicleId);

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Validate user has access to the vehicle's company
    await validateCompanyResourceAccess(
      ctx,
      args.requestingUserId,
      vehicle.companyId,
      "member"
    );

    try {
      // Check if VIN is being changed and if new VIN already exists
      if (args.vin && args.vin !== vehicle.vin) {
        const newVin = args.vin;
        const existingVehicle = await ctx.db
          .query("vehicles")
          .withIndex("by_vin", (q) => q.eq("vin", newVin))
          .unique();

        if (existingVehicle && existingVehicle._id !== args.vehicleId) {
          throw new Error("A vehicle with this VIN already exists");
        }
      }

      // Check if reference is being changed and if new reference already exists
      if (args.reference && args.reference !== vehicle.reference) {
        const newReference = args.reference;
        const existingReference = await ctx.db
          .query("vehicles")
          .withIndex("by_reference", (q) => q.eq("reference", newReference))
          .collect();

        const refExistsForCompany = existingReference.some(
          (v) => v.companyId === vehicle.companyId && v._id !== args.vehicleId
        );

        if (refExistsForCompany) {
          throw new Error(
            "A vehicle with this reference already exists in your company"
          );
        }
      }

      // Helper function to check if a number is valid (not NaN and defined)
      const isValidNumber = (value: any): boolean => {
        return typeof value === "number" && !isNaN(value);
      };

      // Helper function to sanitize specifications by removing NaN values from optional number fields
      const sanitizeSpecifications = (specs: any) => {
        if (!specs) return specs;
        const sanitized: any = {};
        for (const [key, value] of Object.entries(specs)) {
          // Keep the value if it's not a number, or if it's a valid number (not NaN)
          if (typeof value !== "number" || !isNaN(value as number)) {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };

      const now = Date.now();

      // Build the update object, filtering out NaN values for optional number fields
      const updateData: any = {
        ...(args.name !== undefined && { name: args.name }),
        ...(args.description !== undefined && { description: args.description }),
        ...(args.reference !== undefined && { reference: args.reference }),
        ...(args.vin !== undefined && { vin: args.vin }),
        ...(args.vehicleType !== undefined && { vehicleType: args.vehicleType }),
        ...(args.brand !== undefined && { brand: args.brand }),
        ...(args.make !== undefined && { make: args.make }),
        ...(args.model !== undefined && { model: args.model }),
        ...(args.year !== undefined &&
          args.year !== null && { year: args.year }),
        ...(args.condition !== undefined && { condition: args.condition }),
        ...(args.price !== undefined &&
          args.price !== null && { price: args.price }),
        ...(isValidNumber(args.discountedPrice) && {
          discountedPrice: args.discountedPrice,
        }),
        ...(isValidNumber(args.cost) && { cost: args.cost }),
        ...(args.status !== undefined && { status: args.status }),
        ...(args.isActive !== undefined && { isActive: args.isActive }),
        ...(args.branchId !== undefined && { branchId: args.branchId }),
        ...(args.assignedSalespersonIds !== undefined && {
          assignedSalespersonIds: args.assignedSalespersonIds,
        }),
        ...(args.tags !== undefined && { tags: args.tags }),
        ...(args.leadIds !== undefined && { leadIds: args.leadIds }),
        ...(args.images !== undefined && { images: args.images }),
        ...(args.featuredImage !== undefined && {
          featuredImage: args.featuredImage,
        }),
        ...(args.documentUrls !== undefined && {
          documentUrls: args.documentUrls,
        }),
        ...(args.specifications !== undefined && {
          specifications: sanitizeSpecifications(args.specifications),
        }),
        ...(args.extraSpecifications !== undefined && {
          extraSpecifications: args.extraSpecifications,
        }),
        ...(args.features !== undefined && { features: args.features }),
        ...(isValidNumber(args.viewsCount) && { viewsCount: args.viewsCount }),
        ...(isValidNumber(args.leadCount) && { leadCount: args.leadCount }),
        updatedAt: now,
      };

      await ctx.db.patch(args.vehicleId, updateData);

      return { success: true };
    } catch (error) {
      console.error("Error updating vehicle:", error);
      throw error;
    }
  },
});

// Delete a vehicle
export const deleteVehicle = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.requestingUserId);

    const vehicle = await ctx.db.get(args.vehicleId);

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Validate user has access to the vehicle's company (requires admin or higher)
    await validateCompanyResourceAccess(
      ctx,
      args.requestingUserId,
      vehicle.companyId,
      "admin"
    );

    try {
      await ctx.db.delete(args.vehicleId);

      return { success: true };
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      throw error;
    }
  },
});

// Toggle vehicle active status
export const toggleVehicleStatus = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.requestingUserId);

    const vehicle = await ctx.db.get(args.vehicleId);

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Validate user has access to the vehicle's company
    await validateCompanyResourceAccess(
      ctx,
      args.requestingUserId,
      vehicle.companyId,
      "member"
    );

    try {
      const now = Date.now();
      await ctx.db.patch(args.vehicleId, {
        isActive: !vehicle.isActive,
        updatedAt: now,
      });

      return { success: true, isActive: !vehicle.isActive };
    } catch (error) {
      console.error("Error toggling vehicle status:", error);
      throw error;
    }
  },
});

// Update vehicle inventory status
export const updateVehicleStatus = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    status: v.string(),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.requestingUserId);

    const vehicle = await ctx.db.get(args.vehicleId);

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Validate user has access to the vehicle's company
    await validateCompanyResourceAccess(
      ctx,
      args.requestingUserId,
      vehicle.companyId,
      "member"
    );

    try {
      const validStatuses = ["draft", "available", "reserved", "sold"];
      if (!validStatuses.includes(args.status)) {
        throw new Error("Invalid status value");
      }

      const now = Date.now();
      await ctx.db.patch(args.vehicleId, {
        status: args.status,
        updatedAt: now,
      });

      return { success: true, status: args.status };
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      throw error;
    }
  },
});

// Increment view count
export const incrementViewCount = mutation({
  args: {
    userId: v.id("users"),
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, args) => {
    try {
      const authUser = await getAuthenticatedUser(ctx, args.userId);
      const vehicle = await ctx.db.get(args.vehicleId);

      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      const now = Date.now();
      await ctx.db.patch(args.vehicleId, {
        viewsCount: (vehicle.viewsCount || 0) + 1,
        updatedAt: now,
      });

      return { success: true, viewsCount: (vehicle.viewsCount || 0) + 1 };
    } catch (error) {
      console.error("Error incrementing view count:", error);
      throw error;
    }
  },
});

// Add lead to vehicle
export const addLeadToVehicle = mutation({
  args: {
    userId: v.id("users"),
    vehicleId: v.id("vehicles"),
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const vehicle = await ctx.db.get(args.vehicleId);

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Validate user has access to the vehicle's company
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      vehicle.companyId,
      "member"
    );

    try {
      const leadIds = vehicle.leadIds || [];
      if (leadIds.includes(args.leadId)) {
        return {
          success: true,
          message: "Lead already associated with this vehicle",
        };
      }

      const now = Date.now();
      await ctx.db.patch(args.vehicleId, {
        leadIds: [...leadIds, args.leadId],
        leadCount: (vehicle.leadCount || 0) + 1,
        updatedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error("Error adding lead to vehicle:", error);
      throw error;
    }
  },
});

// Remove lead from vehicle
export const removeLeadFromVehicle = mutation({
  args: {
    userId: v.id("users"),
    vehicleId: v.id("vehicles"),
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    const vehicle = await ctx.db.get(args.vehicleId);

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Validate user has access to the vehicle's company
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      vehicle.companyId,
      "member"
    );

    try {
      const leadIds = vehicle.leadIds || [];
      const updatedLeadIds = leadIds.filter((id) => id !== args.leadId);

      const now = Date.now();
      await ctx.db.patch(args.vehicleId, {
        leadIds: updatedLeadIds,
        leadCount: Math.max(0, (vehicle.leadCount || 0) - 1),
        updatedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error("Error removing lead from vehicle:", error);
      throw error;
    }
  },
});

// Bulk update vehicle status
export const bulkUpdateVehicleStatus = mutation({
  args: {
    vehicleIds: v.array(v.id("vehicles")),
    status: v.string(),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx);

    const validStatuses = ["draft", "available", "reserved", "sold"];
    if (!validStatuses.includes(args.status)) {
      throw new Error("Invalid status value");
    }

    const now = Date.now();
    const results = [];

    for (const vehicleId of args.vehicleIds) {
      const vehicle = await ctx.db.get(vehicleId);
      if (vehicle) {
        // Validate user has access to this vehicle's company
        try {
          await validateUserCompanyAccess(
            ctx,
            args.requestingUserId,
            vehicle.companyId,
            "member"
          );

          await ctx.db.patch(vehicleId, {
            status: args.status,
            updatedAt: now,
          });
          results.push({ vehicleId, success: true });
        } catch (error) {
          results.push({
            vehicleId,
            success: false,
            error: "No access to this vehicle",
          });
        }
      } else {
        results.push({ vehicleId, success: false, error: "Vehicle not found" });
      }
    }

    return { success: true, results };
  },
});

// Get vehicle statistics
export const getVehicleStatistics = query({
  args: {
        userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authentication
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const stats = {
        total: vehicles.length,
        byStatus: {
          draft: 0,
          available: 0,
          reserved: 0,
          sold: 0,
        },
        byCondition: {
          new: 0,
          used: 0,
          certified: 0,
        },
        totalValue: 0,
        averagePrice: 0,
        activeCount: 0,
      };

      vehicles.forEach((vehicle) => {
        // By status
        if (stats.byStatus[vehicle.status as keyof typeof stats.byStatus] !== undefined) {
          stats.byStatus[vehicle.status as keyof typeof stats.byStatus]++;
        }

        // By condition
        if (
          stats.byCondition[vehicle.condition as keyof typeof stats.byCondition] !==
          undefined
        ) {
          stats.byCondition[vehicle.condition as keyof typeof stats.byCondition]++;
        }

        // Pricing
        stats.totalValue += vehicle.price;

        // Active count
        if (vehicle.isActive) {
          stats.activeCount++;
        }
      });

      stats.averagePrice = vehicles.length > 0 ? stats.totalValue / vehicles.length : 0;

      return stats;
    } catch (error) {
      console.error("Error fetching vehicle statistics:", error);
      throw error;
    }
  },
});
