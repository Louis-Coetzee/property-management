import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get user's saved listings with full listing details
 */
export const getMySavedItems = query({
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
          savedItemId: savedItem._id,
          owner: owner
            ? {
                firstName: owner.firstName,
                lastName: owner.lastName,
                email: owner.email,
                profileImage: owner.profileImage,
              }
            : null,
        };
      })
    );

    return listings.filter((listing) => listing !== null);
  },
});

/**
 * Check if a listing is saved by user
 */
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

/**
 * Toggle saved status - save or unsave a listing
 */
export const toggleSaved = mutation({
  args: {
    userId: v.id("users"),
    listingId: v.string(),
  },
  handler: async (ctx, args) => {
    const listingId = args.listingId as Id<"listings">;

    const existing = await ctx.db
      .query("savedItems")
      .withIndex("by_user_and_listing", (q) =>
        q.eq("userId", args.userId).eq("listingId", listingId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true, isSaved: false, message: "Listing removed from saved" };
    } else {
      const now = new Date().toISOString();
      await ctx.db.insert("savedItems", {
        userId: args.userId,
        listingId: listingId,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, isSaved: true, message: "Listing saved successfully" };
    }
  },
});

/**
 * Save a listing
 */
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

/**
 * Unsave a listing
 */
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
