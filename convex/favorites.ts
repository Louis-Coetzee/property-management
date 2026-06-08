import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./security";

// Add a product to user's favorites
export const addFavorite = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_product", q => 
        q.eq("userId", args.userId).eq("productId", args.productId)
      )
      .first();
    
    if (existing) {
      return { success: true, message: "Already in favorites" };
    }
    
    await ctx.db.insert("favorites", {
      userId: args.userId,
      productId: args.productId,
      companyId: args.companyId,
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Remove a product from user's favorites
export const removeFavorite = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_product", q => 
        q.eq("userId", args.userId).eq("productId", args.productId)
      )
      .first();
    
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    
    return { success: true };
  },
});

// Get user's favorites (public - requires auth)
export const getUserFavorites = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
    
    // Get product details
    const productIds = favorites.map(f => f.productId);
    const products = await Promise.all(
      productIds.map(id => ctx.db.get(id))
    );
    
    return favorites.map((fav, idx) => ({
      ...fav,
      product: products[idx],
    }));
  },
});

// Check if product is favorited by user (public - requires auth)
export const isProductFavorited = query({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_product", q => 
        q.eq("userId", args.userId).eq("productId", args.productId)
      )
      .first();
    
    return !!existing;
  },
});

// Get favorites count for a product
export const getFavoritesCount = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_product", q => q.eq("productId", args.productId))
      .collect();
    
    return favorites.length;
  },
});