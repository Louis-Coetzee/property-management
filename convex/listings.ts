import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

// Get all listings with filtering and sorting
export const getListings = query({
  args: {
    searchTerm: v.optional(v.string()),
    location: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    bedrooms: v.optional(v.number()),
    maxGuests: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"), 
      v.literal("price_low"),
      v.literal("price_high"),
      v.literal("featured")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("listings");
    
    let listings = await query.collect();
    
    listings = listings.filter(listing => listing.status === "active");
    
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      listings = listings.filter(listing => 
        listing.title.toLowerCase().includes(searchLower) ||
        listing.description.toLowerCase().includes(searchLower) ||
        listing.location.city.toLowerCase().includes(searchLower) ||
        listing.location.country.toLowerCase().includes(searchLower) ||
        listing.location.province.toLowerCase().includes(searchLower) ||
        (listing.location.suburb && listing.location.suburb.toLowerCase().includes(searchLower)) ||
        listing.location.address.toLowerCase().includes(searchLower)
      );
    }
    
    if (args.location) {
      const locationLower = args.location.toLowerCase();
      listings = listings.filter(listing =>
        listing.location.city.toLowerCase().includes(locationLower) ||
        listing.location.country.toLowerCase().includes(locationLower) ||
        listing.location.province.toLowerCase().includes(locationLower) ||
        (listing.location.suburb && listing.location.suburb.toLowerCase().includes(locationLower)) ||
        listing.location.address.toLowerCase().includes(locationLower)
      );
    }
    
    if (args.propertyType && args.propertyType !== "all") {
      listings = listings.filter(listing => listing.propertyType === args.propertyType);
    }
    
    if (args.minPrice !== undefined) {
      listings = listings.filter(listing => listing.pricePerNight >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      listings = listings.filter(listing => listing.pricePerNight <= args.maxPrice!);
    }
    
    if (args.bedrooms !== undefined) {
      listings = listings.filter(listing => listing.bedrooms >= args.bedrooms!);
    }
    
    if (args.maxGuests !== undefined) {
      listings = listings.filter(listing => listing.maxGuests >= args.maxGuests!);
    }
    
    switch (args.sortBy) {
      case "newest":
        listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        listings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "price_low":
        listings.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case "price_high":
        listings.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case "featured":
        listings.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      default:
        listings.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
    
    const offset = args.offset || 0;
    const limit = args.limit || 12;
    const paginatedListings = listings.slice(offset, offset + limit);
    
    const listingsWithOwners = await Promise.all(
      paginatedListings.map(async (listing) => {
        const owner = await ctx.db.get(listing.ownerId);
        return {
          ...listing,
          owner: owner ? {
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
            profileImage: owner.profileImage
          } : null
        };
      })
    );
    
    return {
      listings: listingsWithOwners,
      total: listings.length,
      hasMore: offset + limit < listings.length
    };
  },
});

// Get a single listing by ID
export const getListing = query({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) return null;
    
    const owner = await ctx.db.get(listing.ownerId);
    
    return {
      ...listing,
      owner: owner ? {
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        profileImage: owner.profileImage,
        contactNumber: owner.contactNumber
      } : null
    };
  },
});

// Get a single listing by ID (alias for alert system)
export const getListingById = query({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) return null;
    
    const owner = await ctx.db.get(listing.ownerId);
    
    return {
      ...listing,
      owner: owner ? {
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        profileImage: owner.profileImage,
        contactNumber: owner.contactNumber
      } : null
    };
  },
});

// Increment view count for a listing
export const incrementViews = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) return;
    
    await ctx.db.patch(args.id, {
      views: (listing.views || 0) + 1
    });
  },
});

// Get listings by owner
export const getMyListings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();
    
    return listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
});

// Create a new listing
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
    isFeatured: v.optional(v.boolean()),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const listingId = await ctx.db.insert("listings", {
      ...args,
      status: "active",
      isVerified: false,
      isFeatured: args.isFeatured || false,
      notificationsEnabled: true,
      views: null,
      inquiries: null,
      contactViews: null,
      createdAt: now,
      updatedAt: now,
    });

    ctx.scheduler.runAfter(0, api.alerts.checkNewListingAgainstAlerts, {
      newListingId: listingId,
    });
    
    return listingId;
  },
});

// Update a listing
export const updateListing = mutation({
  args: {
    id: v.id('listings'),
    userId: v.id('users'),
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
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("pending"),
      v.literal("suspended")
    )),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    houseRules: v.optional(v.string()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    cancellationPolicy: v.optional(v.string()),
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
    isVerified: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;
    
    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }
    if (listing.ownerId !== userId) {
      throw new Error("Not authorized to update this listing");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now
    });

    const updatedListing = await ctx.db.get(id);
    
    if (updatedListing && updatedListing.status === 'active') {
      ctx.scheduler.runAfter(0, api.alerts.checkNewListingAgainstAlerts, {
        newListingId: id,
      });
    }

    return id;
  },
});

// Delete a listing
export const deleteListing = mutation({
  args: { 
    id: v.id('listings'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.ownerId !== args.userId) {
      throw new Error('Not authorized to delete this listing');
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Get featured listings for homepage
export const getFeaturedListings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 6;
    
    const listings = await ctx.db
      .query("listings")
      .filter((q) => q.and(
        q.eq(q.field("status"), "active"),
        q.eq(q.field("isFeatured"), true)
      ))
      .take(100);
    
    const listingsWithOwners: Array<typeof listings[0] & { owner: { firstName: string; lastName: string; email: string; profileImage?: string } }> = [];
    for (const listing of listings) {
      const owner = await ctx.db.get(listing.ownerId);
      if (owner) {
        listingsWithOwners.push({
          ...listing,
          owner: {
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
            profileImage: owner.profileImage
          }
        });
        
        if (listingsWithOwners.length >= limit) {
          break;
        }
      }
    }
    
    return listingsWithOwners;
  },
});

// Get listing statistics
export const getListingStats = query({
  args: {},
  handler: async (ctx) => {
    const allListings = await ctx.db.query("listings").collect();
    
    const stats = {
      total: allListings.length,
      active: allListings.filter(l => l.status === "active").length,
      featured: allListings.filter(l => l.isFeatured).length,
      verified: allListings.filter(l => l.isVerified).length,
      byPropertyType: {} as Record<string, number>,
      byCountry: {} as Record<string, number>,
      averagePrice: 0,
    };
    
    allListings.forEach(listing => {
      stats.byPropertyType[listing.propertyType] = (stats.byPropertyType[listing.propertyType] || 0) + 1;
      stats.byCountry[listing.location.country] = (stats.byCountry[listing.location.country] || 0) + 1;
    });
    
    if (allListings.length > 0) {
      const totalPrice = allListings.reduce((sum, listing) => sum + listing.pricePerNight, 0);
      stats.averagePrice = Math.round(totalPrice / allListings.length);
    }
    
    return stats;
  },
});

// Increment contact views for a listing
export const incrementContactViews = internalMutation({
  args: { 
    id: v.id("listings") 
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    await ctx.db.patch(args.id, {
      contactViews: (listing.contactViews || 0) + 1,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Increment contact form submissions for a listing
export const incrementContactFormSubmissions = internalMutation({
  args: { 
    id: v.id("listings") 
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    await ctx.db.patch(args.id, {
      updatedAt: new Date().toISOString(),
    });
  },
});

// Increment page views for a listing
export const incrementPageViews = internalMutation({
  args: { 
    id: v.id("listings") 
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    await ctx.db.patch(args.id, {
      updatedAt: new Date().toISOString(),
    });
  },
});

// Saved Listings functionality
export const saveListing = mutation({
  args: {
    userId: v.id("users"),
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("savedItems")
      .withIndex("by_user_and_listing", (q) => 
        q.eq("userId", args.userId).eq("listingId", args.listingId)
      )
      .first();

    if (existing) {
      return { success: false, message: "Listing already saved" };
    }

    const now = new Date().toISOString();
    await ctx.db.insert("savedItems", {
      userId: args.userId,
      listingId: args.listingId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, message: "Listing saved successfully" };
  },
});

export const unsaveListing = mutation({
  args: {
    userId: v.id("users"),
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const savedItem = await ctx.db
      .query("savedItems")
      .withIndex("by_user_and_listing", (q) => 
        q.eq("userId", args.userId).eq("listingId", args.listingId)
      )
      .first();

    if (!savedItem) {
      return { success: false, message: "Listing not found in saved listings" };
    }

    await ctx.db.delete(savedItem._id);
    return { success: true, message: "Listing removed from saved listings" };
  },
});

export const getSavedListings = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const savedItems = await ctx.db
      .query("savedItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const listings = await Promise.all(
      savedItems.map(async (savedItem) => {
        const listing = await ctx.db.get(savedItem.listingId);
        if (!listing) return null;
        
        const owner = await ctx.db.get(listing.ownerId);
        
        return {
          ...listing,
          savedAt: savedItem.createdAt,
          owner: owner ? {
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
            profileImage: owner.profileImage
          } : null
        };
      })
    );

    return listings.filter(listing => listing !== null);
  },
});

export const isListingSaved = query({
  args: {
    userId: v.id("users"),
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const savedItem = await ctx.db
      .query("savedItems")
      .withIndex("by_user_and_listing", (q) => 
        q.eq("userId", args.userId).eq("listingId", args.listingId)
      )
      .first();

    return !!savedItem;
  },
});

// Get user's listings
export const getUserListings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    return listings;
  },
}); 

export const assignListing = mutation({
  args: {
    listingId: v.id("listings"),
    newOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { listingId, newOwnerId } = args;

    const listing = await ctx.db.get(listingId);
    if (!listing) {
      throw new ConvexError("Listing not found");
    }

    const newOwner = await ctx.db.get(newOwnerId);
    if (!newOwner) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(listingId, {
      ownerId: newOwnerId,
    });

    return { success: true };
  },
});

// Update listing status only
export const updateListingStatus = mutation({
  args: {
    id: v.id('listings'),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("pending"),
      v.literal("suspended")
    ),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
    });

    if (args.status === 'active') {
      ctx.scheduler.runAfter(0, api.alerts.checkNewListingAgainstAlerts, {
        newListingId: args.id,
      });
    }

    return args.id;
  },
});

// Get unique locations from active listings for homepage search
export const getActiveListingLocations = query({
  args: {},
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("listings")
      .collect();

    const activeListings = listings.filter(listing => listing.status === "active");

    const uniqueLocationsMap = new Map<string, {
      city: string;
      suburb: string | undefined;
      province: string;
      count: number;
    }>();

    activeListings.forEach(listing => {
      const city = listing.location.city;
      const suburb = listing.location.suburb;
      const province = listing.location.province;

      const locationKey = `${city}|${suburb || ''}|${province}`;

      if (uniqueLocationsMap.has(locationKey)) {
        const existing = uniqueLocationsMap.get(locationKey)!;
        uniqueLocationsMap.set(locationKey, {
          ...existing,
          count: existing.count + 1
        });
      } else {
        uniqueLocationsMap.set(locationKey, {
          city,
          suburb,
          province,
          count: 1
        });
      }
    });

    const uniqueLocations = Array.from(uniqueLocationsMap.values())
      .sort((a, b) => b.count - a.count)
      .map(location => ({
        city: location.city,
        suburb: location.suburb,
        province: location.province,
        displayName: location.suburb
          ? `${location.city}, ${location.suburb}${location.province && location.province !== 'Unknown' ? `, ${location.province}` : ''}`
          : `${location.city}${location.province && location.province !== 'Unknown' ? `, ${location.province}` : ''}`,
        count: location.count
      }));

    return uniqueLocations;
  },
});
