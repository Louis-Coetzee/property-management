import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Query to search locations by text (for autocomplete)
export const searchLocations = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { searchTerm, limit = 20 }) => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const results = await ctx.db
      .query("location")
      .withSearchIndex("search_locations", (q) =>
        q.search("searchText", searchTerm).eq("isActive", true)
      )
      .take(limit);

    return results.map((location) => ({
      _id: location._id,
      suburb: location.suburb,
      city: location.city,
      district: location.district,
      province: location.province,
      country: location.country,
      searchText: location.searchText,
    }));
  },
});

// Query to get all provinces (for dropdown)
export const getProvinces = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db
      .query("location")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const provinces = [...new Set(
      locations
        .map((l) => l.province)
        .filter((p) => p && p.trim() !== "")
    )].sort();

    return provinces;
  },
});

// Query to get cities by province
export const getCitiesByProvince = query({
  args: {
    province: v.string(),
  },
  handler: async (ctx, { province }) => {
    const locations = await ctx.db
      .query("location")
      .withIndex("by_province", (q) => q.eq("province", province))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const cities = [...new Set(
      locations.map((l) => l.city)
    )].sort();

    return cities;
  },
});

// Query to get suburbs by province and city
export const getSuburbsByProvinceAndCity = query({
  args: {
    province: v.optional(v.string()),
    city: v.string(),
  },
  handler: async (ctx, { province, city }) => {
    let locations;
    
    if (province) {
      locations = await ctx.db
        .query("location")
        .withIndex("by_province", (q) => q.eq("province", province))
        .filter((q) => 
          q.and(
            q.eq(q.field("city"), city),
            q.eq(q.field("isActive"), true)
          )
        )
        .collect();
    } else {
      locations = await ctx.db
        .query("location")
        .withIndex("by_city", (q) => q.eq("city", city))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    const suburbs = [...new Set(
      locations.map((l) => l.suburb?.trim()).filter(Boolean)
    )].sort();

    return suburbs;
  },
});

// Query to get a specific location by ID
export const getLocationById = query({
  args: {
    locationId: v.id("location"),
  },
  handler: async (ctx, { locationId }) => {
    return await ctx.db.get(locationId);
  },
});

// Mutation to update location data
export const updateLocation = mutation({
  args: {
    locationId: v.id("location"),
    suburb: v.optional(v.string()),
    city: v.optional(v.string()),
    province: v.optional(v.string()),
    country: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { locationId, ...updates }) => {
    const existing = await ctx.db.get(locationId);
    if (!existing) {
      throw new Error("Location not found");
    }

    const updatedData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.suburb || updates.city || updates.province) {
      const suburb = updates.suburb || existing.suburb;
      const city = updates.city || existing.city;
      const province = updates.province || existing.province;
      
      updatedData.searchText = `${suburb} ${city}${province ? ` ${province}` : ""}`.toLowerCase();
    }

    await ctx.db.patch(locationId, updatedData);
    return { success: true };
  },
});

// Query to get location statistics
export const getLocationStats = query({
  args: {},
  handler: async (ctx) => {
    const allLocations = await ctx.db.query("location").collect();
    const activeLocations = allLocations.filter(l => l.isActive);
    
    const provinces = [...new Set(
      activeLocations.map(l => l.province).filter(Boolean)
    )].sort();
    
    const cities = [...new Set(
      activeLocations.map(l => l.city)
    )].sort();
    
    const suburbs = [...new Set(
      activeLocations.map(l => l.suburb)
    )].sort();

    return {
      total: allLocations.length,
      active: activeLocations.length,
      inactive: allLocations.length - activeLocations.length,
      provinceCount: provinces.length,
      cityCount: cities.length,
      suburbCount: suburbs.length,
      provinces: provinces.slice(0, 20),
      sampleCities: cities.slice(0, 50),
      sampleSuburbs: suburbs.slice(0, 100),
    };
  },
});

// Clear all locations (admin function for import script)
export const clearAllLocations = mutation({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("location").collect();
    
    for (const location of locations) {
      await ctx.db.delete(location._id);
    }

    return { deleted: locations.length };
  },
});

// Get all locations for a specific city
export const getLocationsByCity = query({
  args: { 
    city: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("location")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(limit);
  },
});

// Get all locations for a specific province
export const getLocationsByProvince = query({
  args: { 
    province: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    return await ctx.db
      .query("location")
      .withIndex("by_province", (q) => q.eq("province", args.province))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(limit);
  },
});

// Delete all locations (admin function for testing)
export const deleteAllLocations = mutation({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("location").collect();
    
    for (const location of locations) {
      await ctx.db.delete(location._id);
    }

    return { deleted: locations.length };
  },
}); 
