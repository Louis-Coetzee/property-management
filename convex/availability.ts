import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get availability for a listing within a date range
export const getListingAvailability = query({
  args: {
    listingId: v.id("listings"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const availability = await ctx.db
      .query("listingAvailability")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    return availability;
  },
});

// Get all availability for a listing (for management)
export const getAllListingAvailability = query({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const availability = await ctx.db
      .query("listingAvailability")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .collect();

    return availability;
  },
});

// Set availability for specific dates
export const setAvailability = mutation({
  args: {
    listingId: v.id("listings"),
    dates: v.array(v.string()),
    status: v.union(
      v.literal("available"),
      v.literal("booked"),
      v.literal("blocked")
    ),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (listing.ownerId !== args.userId) {
      throw new Error("Not authorized to manage this listing's availability");
    }

    const now = new Date().toISOString();

    if (args.status === "available") {
      for (const date of args.dates) {
        const existing = await ctx.db
          .query("listingAvailability")
          .withIndex("by_listing_and_date", (q) =>
            q.eq("listingId", args.listingId).eq("date", date)
          )
          .first();

        if (existing) {
          await ctx.db.delete(existing._id);
        }
      }
      return { success: true, message: "Availability cleared successfully" };
    }

    for (const date of args.dates) {
      const existing = await ctx.db
        .query("listingAvailability")
        .withIndex("by_listing_and_date", (q) =>
          q.eq("listingId", args.listingId).eq("date", date)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          status: args.status,
          notes: args.notes,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("listingAvailability", {
          listingId: args.listingId,
          date,
          status: args.status,
          notes: args.notes,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { success: true, message: "Availability updated successfully" };
  },
});

// Bulk set availability for a date range
export const setAvailabilityRange = mutation({
  args: {
    listingId: v.id("listings"),
    startDate: v.string(),
    endDate: v.string(),
    status: v.union(
      v.literal("available"),
      v.literal("booked"),
      v.literal("blocked")
    ),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (listing.ownerId !== args.userId) {
      throw new Error("Not authorized to manage this listing's availability");
    }

    const dates: string[] = [];
    const start = new Date(args.startDate);
    const end = new Date(args.endDate);

    const formatDateToLocalYYYYMMDD = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(formatDateToLocalYYYYMMDD(new Date(d)));
    }

    const now = new Date().toISOString();

    if (args.status === "available") {
      for (const date of dates) {
        const existing = await ctx.db
          .query("listingAvailability")
          .withIndex("by_listing_and_date", (q) =>
            q.eq("listingId", args.listingId).eq("date", date)
          )
          .first();

        if (existing) {
          await ctx.db.delete(existing._id);
        }
      }
      return { success: true, message: "Availability cleared for date range" };
    }

    for (const date of dates) {
      const existing = await ctx.db
        .query("listingAvailability")
        .withIndex("by_listing_and_date", (q) =>
          q.eq("listingId", args.listingId).eq("date", date)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          status: args.status,
          notes: args.notes,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("listingAvailability", {
          listingId: args.listingId,
          date,
          status: args.status,
          notes: args.notes,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { success: true, message: "Availability updated for date range" };
  },
});

// Delete availability for specific dates
export const deleteAvailability = mutation({
  args: {
    listingId: v.id("listings"),
    dates: v.array(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (listing.ownerId !== args.userId) {
      throw new Error("Not authorized to manage this listing's availability");
    }

    for (const date of args.dates) {
      const existing = await ctx.db
        .query("listingAvailability")
        .withIndex("by_listing_and_date", (q) =>
          q.eq("listingId", args.listingId).eq("date", date)
        )
        .first();

      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }

    return { success: true, message: "Availability deleted successfully" };
  },
});

// Check if a date range is available for booking
export const checkAvailability = query({
  args: {
    listingId: v.id("listings"),
    checkIn: v.string(),
    checkOut: v.string(),
  },
  handler: async (ctx, args) => {
    const availability = await ctx.db
      .query("listingAvailability")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.checkIn),
          q.lt(q.field("date"), args.checkOut)
        )
      )
      .collect();

    if (availability.length === 0) {
      return { available: true, message: "All dates are available" };
    }

    const unavailableDates = availability.filter(
      (a) => a.status === "booked" || a.status === "blocked"
    );

    if (unavailableDates.length > 0) {
      return {
        available: false,
        message: "Some dates are not available",
        unavailableDates: unavailableDates.map((a) => a.date),
      };
    }

    return { available: true, message: "All dates are available" };
  },
});
