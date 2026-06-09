import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Get listings by company
export const getListingsByCompany = query({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    return listings;
  },
});

// Get active listings by company (for website builder showcase)
export const getActiveListingsByCompany = query({
  args: {
    companyId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 12;
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    const activeListings = listings.filter(l => l.status === "active");
    return activeListings.slice(0, limit);
  },
});

// Create a new listing (company-scoped)
export const createListing = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    propertyType: v.string(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    maxGuests: v.number(),
    location: v.object({
      country: v.string(),
      province: v.string(),
      city: v.string(),
      suburb: v.optional(v.string()),
      address: v.string(),
      buildingName: v.optional(v.string()),
      locationId: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      streetAddress: v.optional(v.string()),
      unitNumber: v.optional(v.string()),
    }),
    pricePerNight: v.number(),
    currency: v.string(),
    cleaningFee: v.union(v.number(), v.null()),
    securityDeposit: v.union(v.number(), v.null()),
    amenities: v.array(v.string()),
    images: v.array(v.string()),
    featuredImage: v.union(v.string(), v.null()),
    availableFrom: v.string(),
    availableTo: v.string(),
    minimumStay: v.number(),
    maximumStay: v.union(v.number(), v.null()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    houseRules: v.optional(v.string()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    cancellationPolicy: v.optional(v.string()),
    companyId: v.string(),
    ownerId: v.id("users"),
    isFeatured: v.optional(v.boolean()),
    paymentDetails: v.optional(v.object({
      enabled: v.optional(v.boolean()),
      bankingDetails: v.optional(v.object({
        bankName: v.optional(v.string()),
        accountHolder: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
        branchCode: v.optional(v.string()),
        accountType: v.optional(v.string()),
        swiftCode: v.optional(v.string()),
      })),
      paymentMethods: v.optional(v.array(v.string())),
      depositRequirements: v.optional(v.object({
        bookingDeposit: v.optional(v.union(v.number(), v.null())),
        damageDepositAmount: v.optional(v.union(v.number(), v.null())),
        keyDepositAmount: v.optional(v.union(v.number(), v.null())),
      })),
      paymentTerms: v.optional(v.object({
        fullPaymentDue: v.optional(v.string()),
        depositDue: v.optional(v.string()),
        refundPolicy: v.optional(v.string()),
        lateCancellationFee: v.optional(v.union(v.number(), v.null())),
        noShowFee: v.optional(v.union(v.number(), v.null())),
        paymentSecuredOnly: v.optional(v.boolean()),
      })),
      additionalFees: v.optional(v.array(v.object({
        name: v.string(),
        amount: v.number(),
        type: v.union(v.literal("percentage"), v.literal("fixed")),
        mandatory: v.boolean(),
        description: v.optional(v.string()),
      }))),
      paymentInstructions: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const listingId = await ctx.db.insert("listings", {
      title: args.title,
      description: args.description,
      shortDescription: args.shortDescription,
      propertyType: args.propertyType,
      bedrooms: args.bedrooms,
      bathrooms: args.bathrooms,
      maxGuests: args.maxGuests,
      location: args.location,
      pricePerNight: args.pricePerNight,
      currency: args.currency,
      cleaningFee: args.cleaningFee,
      securityDeposit: args.securityDeposit,
      amenities: args.amenities,
      images: args.images,
      featuredImage: args.featuredImage,
      availableFrom: args.availableFrom,
      availableTo: args.availableTo,
      minimumStay: args.minimumStay,
      maximumStay: args.maximumStay,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      houseRules: args.houseRules,
      checkInTime: args.checkInTime,
      checkOutTime: args.checkOutTime,
      cancellationPolicy: args.cancellationPolicy,
      companyId: args.companyId,
      ownerId: args.ownerId,
      createdBy: args.ownerId,
      status: "active",
      isVerified: false,
      isFeatured: args.isFeatured || false,
      notificationsEnabled: true,
      views: null,
      inquiries: null,
      contactViews: null,
      paymentDetails: args.paymentDetails,
      createdAt: now,
      updatedAt: now,
    });

    return listingId;
  },
});

// Update a listing (company-scoped)
export const updateListing = mutation({
  args: {
    id: v.id("listings"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    maxGuests: v.optional(v.number()),
    location: v.optional(v.object({
      country: v.string(),
      province: v.string(),
      city: v.string(),
      suburb: v.optional(v.string()),
      address: v.string(),
      buildingName: v.optional(v.string()),
      locationId: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      streetAddress: v.optional(v.string()),
      unitNumber: v.optional(v.string()),
    })),
    pricePerNight: v.optional(v.number()),
    currency: v.optional(v.string()),
    cleaningFee: v.optional(v.union(v.number(), v.null())),
    securityDeposit: v.optional(v.union(v.number(), v.null())),
    amenities: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.union(v.string(), v.null())),
    availableFrom: v.optional(v.string()),
    availableTo: v.optional(v.string()),
    minimumStay: v.optional(v.number()),
    maximumStay: v.optional(v.union(v.number(), v.null())),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    houseRules: v.optional(v.string()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    cancellationPolicy: v.optional(v.string()),
    companyId: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    paymentDetails: v.optional(v.object({
      enabled: v.optional(v.boolean()),
      bankingDetails: v.optional(v.object({
        bankName: v.optional(v.string()),
        accountHolder: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
        branchCode: v.optional(v.string()),
        accountType: v.optional(v.string()),
        swiftCode: v.optional(v.string()),
      })),
      paymentMethods: v.optional(v.array(v.string())),
      depositRequirements: v.optional(v.object({
        bookingDeposit: v.optional(v.union(v.number(), v.null())),
        damageDepositAmount: v.optional(v.union(v.number(), v.null())),
        keyDepositAmount: v.optional(v.union(v.number(), v.null())),
      })),
      paymentTerms: v.optional(v.object({
        fullPaymentDue: v.optional(v.string()),
        depositDue: v.optional(v.string()),
        refundPolicy: v.optional(v.string()),
        lateCancellationFee: v.optional(v.union(v.number(), v.null())),
        noShowFee: v.optional(v.union(v.number(), v.null())),
        paymentSecuredOnly: v.optional(v.boolean()),
      })),
      additionalFees: v.optional(v.array(v.object({
        name: v.string(),
        amount: v.number(),
        type: v.union(v.literal("percentage"), v.literal("fixed")),
        mandatory: v.boolean(),
        description: v.optional(v.string()),
      }))),
      paymentInstructions: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;

    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(id, {
      ...updates,
      updatedBy: userId,
      updatedAt: now,
    });

    return id;
  },
});

// Delete a listing (company-scoped)
export const deleteListing = mutation({
  args: {
    id: v.id("listings"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Update listing status (active/inactive) - used by API routes
export const updateListingStatus = mutation({
  args: {
    id: v.id("listings"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status === "active" ? "active" : "inactive",
    });

    return args.id;
  },
});
