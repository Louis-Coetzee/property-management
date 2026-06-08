import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all media for a user (alias for API compatibility)
export const getUserMedia = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const allMedia = await ctx.db.query("mediaLibrary").collect();
      
      const userMedia = allMedia.filter(item => {
        if (item.userIds && item.userIds.includes(args.userId)) {
          return true;
        }
        return false;
      });

      return userMedia.map(item => ({
        ...item,
        sharedWith: item.userIds.length,
        isShared: item.userIds.length > 1,
        canEdit: item.createdBy === args.userId || (item.permissions?.canEdit?.includes(args.userId) ?? false),
        canDelete: item.createdBy === args.userId || (item.permissions?.canDelete?.includes(args.userId) ?? false),
      }));
    } catch (error) {
      console.error('Error fetching user media:', error);
      throw error;
    }
  },
});

// Get user categories (alias for API compatibility)
export const getUserCategories = query({
  args: { 
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.userId);
      if (!user) {
        throw new Error(`User with ID ${args.userId} not found`);
      }
      
      const allCategories = await ctx.db.query("mediaCategories").collect();
      const categories = allCategories.filter(category => 
        category.userIds && category.userIds.includes(args.userId)
      );
        
      return categories;
    } catch (error) {
      console.error('Error in getUserCategories query:', error);
      throw error;
    }
  },
});

// Get all media for a user
export const getByUser = query({
  args: {
    userId: v.id("users"),
    refreshKey: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Get all media items where user has access
      const allMedia = await ctx.db.query("mediaLibrary").collect();
      
      const userMedia = allMedia.filter(item => {
        // Check userIds array (current format)
        if (item.userIds && item.userIds.includes(args.userId)) {
          return true;
        }
        return false;
      });

      return userMedia.map(item => ({
        ...item,
        sharedWith: item.userIds.length,
        isShared: item.userIds.length > 1,
        canEdit: item.createdBy === args.userId || (item.permissions?.canEdit?.includes(args.userId) ?? false),
        canDelete: item.createdBy === args.userId || (item.permissions?.canDelete?.includes(args.userId) ?? false),
      }));
    } catch (error) {
      console.error('Error fetching user media:', error);
      throw error;
    }
  },
});

// Get images only for a user
export const getImagesByUser = query({
  args: {
    userId: v.id("users"),
    refreshKey: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const allMedia = await ctx.db.query("mediaLibrary").collect();
      
      const userMedia = allMedia.filter(item => {
        if (item.userIds && item.userIds.includes(args.userId)) {
          // Only return items that are images or have no storageType (backward compatibility)
          return !item.storageType || item.storageType === "image";
        }
        return false;
      });

      return userMedia.map(item => ({
        ...item,
        sharedWith: item.userIds.length,
        isShared: item.userIds.length > 1,
        canEdit: item.createdBy === args.userId || (item.permissions?.canEdit?.includes(args.userId) ?? false),
        canDelete: item.createdBy === args.userId || (item.permissions?.canDelete?.includes(args.userId) ?? false),
      }));
    } catch (error) {
      console.error('Error fetching user images:', error);
      throw error;
    }
  },
});

// Get documents only for a user
export const getDocumentsByUser = query({
  args: {
    userId: v.id("users"),
    refreshKey: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const allMedia = await ctx.db.query("mediaLibrary").collect();
      
      const userMedia = allMedia.filter(item => {
        if (item.userIds && item.userIds.includes(args.userId)) {
          return item.storageType === "document";
        }
        return false;
      });

      return userMedia.map(item => ({
        ...item,
        sharedWith: item.userIds.length,
        isShared: item.userIds.length > 1,
        canEdit: item.createdBy === args.userId || (item.permissions?.canEdit?.includes(args.userId) ?? false),
        canDelete: item.createdBy === args.userId || (item.permissions?.canDelete?.includes(args.userId) ?? false),
      }));
    } catch (error) {
      console.error('Error fetching user documents:', error);
      throw error;
    }
  },
});

// Get a media item by URL for a specific user (to prevent duplicates)
export const getByUrl = query({
  args: { 
    userId: v.id("users"),
    url: v.string()
  },
  handler: async (ctx, args) => {
    try {
      console.log(`Checking for existing media item with URL for user ID: ${args.userId}`);
      
      // Verify user exists first
      const user = await ctx.db.get(args.userId);
      if (!user) {
        console.error(`User with ID ${args.userId} not found when checking media URL`);
        throw new Error(`User with ID ${args.userId} not found`);
      }
      
      // Find media items accessible to this user with the given URL
      const allMedia = await ctx.db
        .query("mediaLibrary")
        .filter((q) => q.eq(q.field("url"), args.url))
        .collect();
        
      // Filter to only include items where user has access
      const existingMedia = allMedia.find(item => 
        item.userIds && item.userIds.includes(args.userId)
      );
        
      if (existingMedia) {
        console.log(`Found existing media item with URL: ${existingMedia._id}`);
      } else {
        console.log(`No existing media item found with this URL for user`);
      }
      
      return existingMedia || null;
    } catch (error) {
      console.error('Error in getByUrl query:', error);
      throw error;
    }
  },
});

// Add a new media item to the library
export const add = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    url: v.string(),
    filename: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageType: v.optional(v.string()), // "image" or "document"
    altText: v.optional(v.string()), // Alt text for accessibility
    categories: v.optional(v.array(v.string())),
    additionalUserIds: v.optional(v.array(v.id("users"))), // Additional users to share with
  },
  handler: async (ctx, args) => {
    try {
      console.log(`Adding media item for user ID: ${args.userId}`);
      console.log(`Media details: ${args.filename}, ${args.fileType}, ${Math.round(args.fileSize / 1024)} KB`);
      console.log(`Media URL: ${args.url.substring(0, 30)}...`);
      if (args.categories && args.categories.length > 0) {
        console.log(`Categories: ${args.categories.join(', ')}`);
      }
      
      const timestamp = new Date().toISOString();

      // Verify user exists
      const user = await ctx.db.get(args.userId);
      if (!user) {
        console.error(`User with ID ${args.userId} not found`);
        throw new Error(`User with ID ${args.userId} not found`);
      }

      // Create userIds array - always include the creator
      const userIds = [args.userId];
      if (args.additionalUserIds) {
        // Verify additional users exist and add them
        for (const additionalUserId of args.additionalUserIds) {
          const additionalUser = await ctx.db.get(additionalUserId);
          if (additionalUser && !userIds.includes(additionalUserId)) {
            userIds.push(additionalUserId);
          }
        }
      }

      // Create the media item with new schema
      const mediaId = await ctx.db.insert("mediaLibrary", {
        userIds: userIds,
        url: args.url,
        filename: args.filename,
        fileType: args.fileType,
        fileSize: args.fileSize,
        storageType: args.storageType || "image", // Default to image for backward compatibility
        categories: args.categories,
        settings: args.altText ? { alt: args.altText } : undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: args.userId,
        companyId: args.companyId,
      });
      
      console.log(`Successfully added media item with ID: ${mediaId} for ${userIds.length} user(s)`);
      return mediaId;
    } catch (error) {
      console.error('Error adding media item:', error);
      throw error;
    }
  },
});

// Delete a media item from the library
export const remove = mutation({
  args: { 
    mediaId: v.id("mediaLibrary"),
    requestingUserId: v.id("users"),
    forceDelete: v.optional(v.boolean()) // Allow force deletion for admin use
  },
  handler: async (ctx, args) => {
    try {
      // Check if media item exists
      const media = await ctx.db.get(args.mediaId);
      if (!media) {
        throw new Error(`Media item with ID ${args.mediaId} not found`);
      }

      // Check if user has delete permission
      const canDelete = media.permissions?.canDelete?.includes(args.requestingUserId) || 
                       media.createdBy === args.requestingUserId;
      
      if (!canDelete) {
        throw new Error(`User does not have permission to delete this media item`);
      }

      // Check if image is being used elsewhere (unless force delete)
      if (!args.forceDelete) {
        // Check for usage in users table for profile images
        const usageResults: Array<{
          table: string;
          id: string;
          field: string;
          title?: string;
          description?: string;
        }> = [];
        
        // Check users table for profile images
        const usersWithImage = await ctx.db.query("users").collect();
        for (const user of usersWithImage) {
          if (user.profileImage === media.url) {
            usageResults.push({
              table: "users",
              id: user._id,
              field: "profileImage",
              title: `${user.firstName} ${user.lastName}`,
              description: "Profile image"
            });
          }
        }

        // If image is in use, return detailed usage information
        if (usageResults.length > 0) {
          return {
            success: false,
            canDelete: false,
            reason: "Image is currently in use",
            usageLocations: usageResults,
            mediaItem: {
              id: media._id,
              filename: media.filename,
              url: media.url,
              cloudflareImageId: extractImageIdFromUrl(media.url)
            }
          };
        }
      }

      // Handle deletion based on storage type
      let cloudflareImageId = null;
      if (!media.storageType || media.storageType === "image") {
        // Extract Cloudflare image ID for deletion
        cloudflareImageId = extractImageIdFromUrl(media.url);
      }

      // Delete the media item from database first
      await ctx.db.delete(args.mediaId);
      console.log(`Successfully deleted media item with ID: ${args.mediaId}`);
      
      return { 
        success: true, 
        canDelete: true,
        cloudflareImageId: cloudflareImageId,
        storageType: media.storageType || "image",
        mediaItem: {
          id: media._id,
          filename: media.filename,
          url: media.url
        }
      };
    } catch (error) {
      console.error('Error removing media item:', error);
      throw error;
    }
  },
});

// Helper function to extract Cloudflare image ID from URL
function extractImageIdFromUrl(url: string): string | null {
  try {
    // URL format: https://imagedelivery.net/{account-hash}/{image-id}/{variant}
    const match = url.match(/\/([a-f0-9-]{36})\/[^\/]*$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting image ID from URL:', error);
    return null;
  }
}

// Update categories for a media item
export const updateCategories = mutation({
  args: {
    mediaId: v.id("mediaLibrary"),
    categories: v.array(v.string()),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      // Check if media item exists
      const media = await ctx.db.get(args.mediaId);
      if (!media) {
        throw new Error(`Media item with ID ${args.mediaId} not found`);
      }

      // Check if user has edit permission
      const canEdit = media.permissions?.canEdit?.includes(args.requestingUserId) || 
                     media.createdBy === args.requestingUserId;
      
      if (!canEdit) {
        throw new Error(`User does not have permission to edit this media item`);
      }

      // Update the media item categories
      await ctx.db.patch(args.mediaId, {
        categories: args.categories,
      });
      
      console.log(`Updated categories for media item ${args.mediaId}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating media categories:', error);
      throw error;
    }
  },
});

// Media Categories CRUD Operations

// Get all media categories for a user
export const getMediaCategories = query({
  args: { 
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`Getting media categories for user ID: ${args.userId}`);
      
      // Verify user exists first
      const user = await ctx.db.get(args.userId);
      if (!user) {
        console.error(`User with ID ${args.userId} not found when fetching media categories`);
        throw new Error(`User with ID ${args.userId} not found`);
      }
      
      // Get categories where user is in userIds array
      const allCategories = await ctx.db
        .query("mediaCategories")
        .collect();
        
      // Filter client-side to ensure user is in userIds array
      const categories = allCategories.filter(category => 
        category.userIds && category.userIds.includes(args.userId)
      );
        
      console.log(`Found ${categories.length} media categories for user ID: ${args.userId}`);
      
      return categories;
    } catch (error) {
      console.error('Error in getMediaCategories query:', error);
      throw error;
    }
  },
});

// Create a new media category
export const createMediaCategory = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    additionalUserIds: v.optional(v.array(v.id("users"))), // Additional users to share with
  },
  handler: async (ctx, args) => {
    try {
      console.log(`Creating media category for user ID: ${args.userId}`);
      
      // Verify user exists
      const user = await ctx.db.get(args.userId);
      if (!user) {
        console.error(`User with ID ${args.userId} not found`);
        throw new Error(`User with ID ${args.userId} not found`);
      }

      // Create userIds array - always include the creator
      const userIds = [args.userId];
      if (args.additionalUserIds) {
        // Verify additional users exist and add them
        for (const additionalUserId of args.additionalUserIds) {
          const additionalUser = await ctx.db.get(additionalUserId);
          if (additionalUser && !userIds.includes(additionalUserId)) {
            userIds.push(additionalUserId);
          }
        }
      }

      // Check if category with same name already exists for any of these users
      const allCategories = await ctx.db
        .query("mediaCategories")
        .collect();
        
      const existing = allCategories.find(category => 
        category.name === args.name && 
        category.userIds.some(id => userIds.includes(id))
      );
      
      if (existing) {
        throw new Error(`Category with name '${args.name}' already exists for one of the specified users`);
      }

      const timestamp = new Date().toISOString();
      
      // Create the category
      const categoryId = await ctx.db.insert("mediaCategories", {
        userIds: userIds,
        name: args.name,
        description: args.description,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: args.userId,
        sharedAt: userIds.length > 1 ? timestamp : undefined,
      });
      
      console.log(`Successfully created media category with ID: ${categoryId} for ${userIds.length} user(s)`);
      return categoryId;
    } catch (error) {
      console.error('Error creating media category:', error);
      throw error;
    }
  },
});

// Update a media category
export const updateMediaCategory = mutation({
  args: {
    categoryId: v.id("mediaCategories"),
    name: v.string(),
    description: v.optional(v.string()),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      // Check if category exists
      const category = await ctx.db.get(args.categoryId);
      if (!category) {
        throw new Error(`Category with ID ${args.categoryId} not found`);
      }

      // Check if user has permission to edit
      const canEdit = category.userIds.includes(args.requestingUserId) || 
                     category.createdBy === args.requestingUserId;
      
      if (!canEdit) {
        throw new Error(`User does not have permission to edit this category`);
      }

      // Check if new name conflicts with existing categories (for this user)
      const allCategories = await ctx.db.query("mediaCategories").collect();
      const existingWithSameName = allCategories.find(cat => 
        cat._id !== args.categoryId && 
        cat.name === args.name && 
        cat.userIds.some(id => category.userIds.includes(id))
      );
      
      if (existingWithSameName) {
        throw new Error(`Category with name '${args.name}' already exists`);
      }

      // Update the category
      await ctx.db.patch(args.categoryId, {
        name: args.name,
        description: args.description,
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`Updated category ${args.categoryId} with name: ${args.name}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating media category:', error);
      throw error;
    }
  },
});

// Apply categories to multiple media items
export const applyCategoriesToMultipleItems = mutation({
  args: {
    mediaIds: v.array(v.id("mediaLibrary")),
    categoryNames: v.array(v.string()),
    operation: v.string(), // "add", "remove", or "replace"
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      if (args.mediaIds.length === 0) {
        return { success: true, count: 0 };
      }
      
      let updatedCount = 0;
      
      // Process each media item
      for (const mediaId of args.mediaIds) {
        // Check if media item exists
        const media = await ctx.db.get(mediaId);
        if (!media) {
          console.warn(`Media item with ID ${mediaId} not found, skipping`);
          continue;
        }
        
        // Check if user has edit permission
        const canEdit = media.permissions?.canEdit?.includes(args.requestingUserId) || 
                       media.createdBy === args.requestingUserId;
        
        if (!canEdit) {
          console.warn(`User does not have permission to edit media item ${mediaId}, skipping`);
          continue;
        }
        
        let currentCategories = media.categories || [];
        let newCategories: string[] = [];
        
        if (args.operation === "add") {
          // Add categories without duplicates
          newCategories = [...new Set([...currentCategories, ...args.categoryNames])];
        } else if (args.operation === "remove") {
          // Remove specified categories
          newCategories = currentCategories.filter(cat => !args.categoryNames.includes(cat));
        } else {
          // Replace with new categories
          newCategories = [...args.categoryNames];
        }
        
        // Only update if categories changed
        if (JSON.stringify(currentCategories.sort()) !== JSON.stringify(newCategories.sort())) {
          await ctx.db.patch(mediaId, {
            categories: newCategories,
          });
          updatedCount++;
        }
      }
      
      console.log(`Applied categories to ${updatedCount} media items`);
      return { success: true, count: updatedCount };
    } catch (error) {
      console.error('Error applying categories to multiple items:', error);
      throw error;
    }
  },
});

// Delete a media category
export const deleteMediaCategory = mutation({
  args: {
    categoryId: v.id("mediaCategories"),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      // Check if category exists
      const category = await ctx.db.get(args.categoryId);
      if (!category) {
        throw new Error(`Category with ID ${args.categoryId} not found`);
      }

      // Check if user has permission to delete (must be creator)
      if (category.createdBy !== args.requestingUserId) {
        throw new Error(`User does not have permission to delete this category`);
      }

      // Delete the category
      await ctx.db.delete(args.categoryId);

      // Remove category from all media items that reference it
      const allMedia = await ctx.db.query("mediaLibrary").collect();
      let updatedCount = 0;

      for (const media of allMedia) {
        if (media.categories && media.categories.includes(category.name)) {
          const newCategories = media.categories.filter(cat => cat !== category.name);
          await ctx.db.patch(media._id, { categories: newCategories });
          updatedCount++;
        }
      }

      console.log(`Deleted category ${args.categoryId} and removed it from ${updatedCount} media items`);
      return { success: true, removedFromItems: updatedCount };
    } catch (error) {
      console.error('Error deleting media category:', error);
      throw error;
    }
  },
});

// Delete multiple media categories
export const deleteMultipleMediaCategories = mutation({
  args: {
    categoryIds: v.array(v.id("mediaCategories")),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      if (args.categoryIds.length === 0) {
        return { success: true, count: 0 };
      }

      let deletedCount = 0;
      let totalRemovedFromItems = 0;
      const categoryNamesToRemove: string[] = [];

      // Verify and collect category names
      for (const categoryId of args.categoryIds) {
        const category = await ctx.db.get(categoryId);
        if (!category) {
          console.warn(`Category with ID ${categoryId} not found, skipping`);
          continue;
        }

        // Check if user has permission to delete (must be creator)
        if (category.createdBy !== args.requestingUserId) {
          console.warn(`User does not have permission to delete category ${categoryId}, skipping`);
          continue;
        }

        categoryNamesToRemove.push(category.name);

        // Delete the category
        await ctx.db.delete(categoryId);
        deletedCount++;
      }

      // Remove categories from all media items that reference them
      if (categoryNamesToRemove.length > 0) {
        const allMedia = await ctx.db.query("mediaLibrary").collect();

        for (const media of allMedia) {
          if (media.categories && media.categories.some(cat => categoryNamesToRemove.includes(cat))) {
            const newCategories = media.categories.filter(cat => !categoryNamesToRemove.includes(cat));
            await ctx.db.patch(media._id, { categories: newCategories });
            totalRemovedFromItems++;
          }
        }
      }

      console.log(`Deleted ${deletedCount} categories and removed them from ${totalRemovedFromItems} media items`);
      return { success: true, count: deletedCount, removedFromItems: totalRemovedFromItems };
    } catch (error) {
      console.error('Error deleting multiple media categories:', error);
      throw error;
    }
  },
});