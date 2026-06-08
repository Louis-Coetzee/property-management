import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== FOLDER QUERIES ====================

// Get all folders for a company
export const getFoldersByCompany = query({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query("mediaFolders")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return folders;
  },
});

// Get root folders (no parent) for a company
export const getRootFolders = query({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query("mediaFolders")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    // Filter for root folders (no parentId)
    return folders.filter((folder) => !folder.parentId);
  },
});

// Get folders by parent
export const getFoldersByParent = query({
  args: {
    companyId: v.id("companies"),
    parentId: v.id("mediaFolders"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query("mediaFolders")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();

    // Filter by company
    return folders.filter((folder) => folder.companyId === args.companyId);
  },
});

// Get folder by ID with contents
export const getFolderWithContents = query({
  args: {
    folderId: v.id("mediaFolders"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      return null;
    }

    // Get subfolders
    const subfolders = await ctx.db
      .query("mediaFolders")
      .withIndex("by_parent", (q) => q.eq("parentId", args.folderId))
      .collect();

    // Get files in this folder
    const files = await ctx.db
      .query("mediaLibrary")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .collect();

    return {
      folder,
      subfolders,
      files,
    };
  },
});

// Get folder path (breadcrumb trail)
export const getFolderPath = query({
  args: {
    folderId: v.id("mediaFolders"),
  },
  handler: async (ctx, args) => {
    const path = [];
    let currentFolder = await ctx.db.get(args.folderId);

    while (currentFolder) {
      path.unshift({
        id: currentFolder._id,
        name: currentFolder.name,
        parentId: currentFolder.parentId,
      });

      if (currentFolder.parentId) {
        currentFolder = await ctx.db.get(currentFolder.parentId);
      } else {
        break;
      }
    }

    return path;
  },
});

// ==================== FILE QUERIES ====================

// Get files for a company (with optional folder filter)
export const getFilesByCompany = query({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    folderId: v.optional(v.id("mediaFolders")),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let files = await ctx.db
      .query("mediaLibrary")
      .collect();

    // Filter by company
    files = files.filter((file) => file.companyId === args.companyId);

    // Filter by folder if specified
    if (args.folderId) {
      files = files.filter((file) => file.folderId === args.folderId);
    } else {
      // Get root files (no folder)
      files = files.filter((file) => !file.folderId);
    }

    // Filter by file type if specified
    if (args.fileType) {
      files = files.filter((file) => file.fileType === args.fileType);
    }

    return files;
  },
});

// Get file by ID
export const getFileById = query({
  args: {
    fileId: v.id("mediaLibrary"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fileId);
  },
});

// Get folder by ID
export const getFolderById = query({
  args: {
    folderId: v.id("mediaFolders"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.folderId);
  },
});

// Search files by name
export const searchFiles = query({
  args: {
    companyId: v.id("companies"),
    searchQuery: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("mediaLibrary")
      .collect();

    return files.filter(
      (file) =>
        file.companyId === args.companyId &&
        file.filename.toLowerCase().includes(args.searchQuery.toLowerCase())
    );
  },
});

// Get storage statistics for a company
export const getStorageStats = query({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("mediaLibrary")
      .collect();

    const companyFiles = files.filter((file) => file.companyId === args.companyId);

    const totalFiles = companyFiles.length;
    const totalSize = companyFiles.reduce((sum, file) => sum + file.fileSize, 0);
    const folders = await ctx.db
      .query("mediaFolders")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    // Count by file type
    const fileTypeCounts = companyFiles.reduce((acc, file) => {
      acc[file.fileType] = (acc[file.fileType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFiles,
      totalSize,
      totalFolders: folders.length,
      fileTypeCounts,
    };
  },
});

// ==================== FOLDER MUTATIONS ====================

// Create a new folder
export const createFolder = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("mediaFolders")),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Build path
    let path = "/" + args.name.toLowerCase().replace(/\s+/g, "-");
    let level = 0;

    if (args.parentId) {
      const parentFolder = await ctx.db.get(args.parentId);
      if (parentFolder) {
        path = parentFolder.path + "/" + args.name.toLowerCase().replace(/\s+/g, "-");
        level = parentFolder.level + 1;
      }
    }

    const folderId = await ctx.db.insert("mediaFolders", {
      companyId: args.companyId,
      name: args.name,
      description: args.description,
      parentId: args.parentId,
      color: args.color,
      icon: args.icon,
      path,
      level,
      itemCount: 0,
      totalSize: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: args.userId,
    });

    return { folderId, message: "Folder created successfully" };
  },
});

// Update folder
export const updateFolder = mutation({
  args: {
    folderId: v.id("mediaFolders"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.folderId, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.color !== undefined && { color: args.color }),
      ...(args.icon !== undefined && { icon: args.icon }),
      updatedAt: now,
    });

    return { message: "Folder updated successfully" };
  },
});

// Delete folder
export const deleteFolder = mutation({
  args: {
    folderId: v.id("mediaFolders"),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    // Check if folder has contents
    const subfolders = await ctx.db
      .query("mediaFolders")
      .withIndex("by_parent", (q) => q.eq("parentId", args.folderId))
      .collect();

    const files = await ctx.db
      .query("mediaLibrary")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .collect();

    if (subfolders.length > 0 || files.length > 0) {
      throw new Error("Cannot delete folder with contents. Please empty the folder first.");
    }

    await ctx.db.delete(args.folderId);

    return { message: "Folder deleted successfully" };
  },
});

// Move folder to new parent
export const moveFolder = mutation({
  args: {
    folderId: v.id("mediaFolders"),
    newParentId: v.optional(v.id("mediaFolders")),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    // Prevent moving folder into itself
    if (args.folderId === args.newParentId) {
      throw new Error("Cannot move folder into itself");
    }

    let newPath = "/" + folder.name.toLowerCase().replace(/\s+/g, "-");
    let newLevel = 0;

    if (args.newParentId) {
      const newParent = await ctx.db.get(args.newParentId);
      if (newParent) {
        newPath = newParent.path + "/" + folder.name.toLowerCase().replace(/\s+/g, "-");
        newLevel = newParent.level + 1;
      }
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.folderId, {
      parentId: args.newParentId,
      path: newPath,
      level: newLevel,
      updatedAt: now,
    });

    return { message: "Folder moved successfully" };
  },
});

// Share folder
export const shareFolder = mutation({
  args: {
    folderId: v.id("mediaFolders"),
    userIds: v.array(v.id("users")),
    permission: v.string(), // "view", "comment", "edit"
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    const now = Date.now();
    const shareToken = Math.random().toString(36) + Date.now().toString(36);

    const sharedWith = args.userIds.map((userId) => ({
      userId,
      permission: args.permission,
      sharedAt: now,
    }));

    await ctx.db.patch(args.folderId, {
      isShared: true,
      shareToken,
      shareExpiresAt: args.expiresAt,
      sharedWith,
    });

    return { shareToken, message: "Folder shared successfully" };
  },
});

// ==================== FILE MUTATIONS ====================

// Create/add file (save URL only)
export const createFile = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    url: v.string(),
    filename: v.string(),
    originalFilename: v.optional(v.string()),
    fileType: v.string(),
    fileSize: v.number(),
    storageType: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    duration: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    folderId: v.optional(v.id("mediaFolders")),
    alt: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const fileId = await ctx.db.insert("mediaLibrary", {
      userIds: [args.userId],
      companyId: args.companyId,
      folderId: args.folderId,
      url: args.url,
      filename: args.filename,
      originalFilename: args.originalFilename,
      fileType: args.fileType,
      fileSize: args.fileSize,
      storageType: args.storageType,
      mimeType: args.mimeType,
      width: args.width,
      height: args.height,
      duration: args.duration,
      thumbnailUrl: args.thumbnailUrl,
      createdAt: now,
      updatedAt: now,
      settings: {
        alt: args.alt,
        title: args.title,
        description: args.description,
        tags: args.tags,
      },
      createdBy: args.userId,
    });

    // Update folder item count if in a folder
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (folder) {
        await ctx.db.patch(args.folderId, {
          itemCount: (folder.itemCount || 0) + 1,
          totalSize: (folder.totalSize || 0) + args.fileSize,
        });
      }
    }

    return { fileId, message: "File added successfully" };
  },
});

// Update file
export const updateFile = mutation({
  args: {
    fileId: v.id("mediaLibrary"),
    filename: v.optional(v.string()),
    alt: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    folderId: v.optional(v.id("mediaFolders")),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    const now = new Date().toISOString();

    // Handle folder move
    if (args.folderId !== undefined && args.folderId !== file.folderId) {
      // Remove from old folder
      if (file.folderId) {
        const oldFolder = await ctx.db.get(file.folderId);
        if (oldFolder) {
          await ctx.db.patch(file.folderId, {
            itemCount: Math.max(0, (oldFolder.itemCount || 0) - 1),
            totalSize: Math.max(0, (oldFolder.totalSize || 0) - file.fileSize),
          });
        }
      }

      // Add to new folder
      if (args.folderId) {
        const newFolder = await ctx.db.get(args.folderId);
        if (newFolder) {
          await ctx.db.patch(args.folderId, {
            itemCount: (newFolder.itemCount || 0) + 1,
            totalSize: (newFolder.totalSize || 0) + file.fileSize,
          });
        }
      }
    }

    await ctx.db.patch(args.fileId, {
      ...(args.filename !== undefined && { filename: args.filename }),
      ...(args.folderId !== undefined && { folderId: args.folderId }),
      settings: {
        alt: args.alt,
        title: args.title,
        description: args.description,
        tags: args.tags,
      },
      updatedAt: now,
    });

    return { message: "File updated successfully" };
  },
});

// Delete file
export const deleteFile = mutation({
  args: {
    fileId: v.id("mediaLibrary"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Update folder counts
    if (file.folderId) {
      const folder = await ctx.db.get(file.folderId);
      if (folder) {
        await ctx.db.patch(file.folderId, {
          itemCount: Math.max(0, (folder.itemCount || 0) - 1),
          totalSize: Math.max(0, (folder.totalSize || 0) - file.fileSize),
        });
      }
    }

    await ctx.db.delete(args.fileId);

    return { message: "File deleted successfully" };
  },
});

// Move file to folder
export const moveFile = mutation({
  args: {
    fileId: v.id("mediaLibrary"),
    folderId: v.optional(v.id("mediaFolders")),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    const now = new Date().toISOString();

    // Handle folder move
    if (file.folderId !== args.folderId) {
      // Remove from old folder
      if (file.folderId) {
        const oldFolder = await ctx.db.get(file.folderId);
        if (oldFolder) {
          await ctx.db.patch(file.folderId, {
            itemCount: Math.max(0, (oldFolder.itemCount || 0) - 1),
            totalSize: Math.max(0, (oldFolder.totalSize || 0) - file.fileSize),
          });
        }
      }

      // Add to new folder
      if (args.folderId) {
        const newFolder = await ctx.db.get(args.folderId);
        if (newFolder) {
          await ctx.db.patch(args.folderId, {
            itemCount: (newFolder.itemCount || 0) + 1,
            totalSize: (newFolder.totalSize || 0) + file.fileSize,
          });
        }
      }
    }

    await ctx.db.patch(args.fileId, {
      folderId: args.folderId,
      updatedAt: now,
    });

    return { message: "File moved successfully" };
  },
});

// Share file
export const shareFile = mutation({
  args: {
    fileId: v.id("mediaLibrary"),
    userIds: v.array(v.id("users")),
    permission: v.string(), // "view", "download", "comment", "edit"
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    const now = Date.now();
    const shareToken = Math.random().toString(36) + Date.now().toString(36);

    const sharedWith = args.userIds.map((userId) => ({
      userId,
      permission: args.permission,
      sharedAt: now,
    }));

    await ctx.db.patch(args.fileId, {
      isShared: true,
      shareToken,
      shareExpiresAt: args.expiresAt,
      sharedWith,
    });

    return { shareToken, message: "File shared successfully" };
  },
});

// Batch delete files
export const batchDeleteFiles = mutation({
  args: {
    fileIds: v.array(v.id("mediaLibrary")),
  },
  handler: async (ctx, args) => {
    for (const fileId of args.fileIds) {
      const file = await ctx.db.get(fileId);
      if (!file) continue;

      // Update folder counts
      if (file.folderId) {
        const folder = await ctx.db.get(file.folderId);
        if (folder) {
          await ctx.db.patch(file.folderId, {
            itemCount: Math.max(0, (folder.itemCount || 0) - 1),
            totalSize: Math.max(0, (folder.totalSize || 0) - file.fileSize),
          });
        }
      }

      await ctx.db.delete(fileId);
    }

    return { message: `${args.fileIds.length} file(s) deleted successfully` };
  },
});

// Batch move files
export const batchMoveFiles = mutation({
  args: {
    fileIds: v.array(v.id("mediaLibrary")),
    folderId: v.optional(v.id("mediaFolders")),
  },
  handler: async (ctx, args) => {
    for (const fileId of args.fileIds) {
      const file = await ctx.db.get(fileId);
      if (!file) continue;

      const now = new Date().toISOString();

      // Handle folder move
      if (file.folderId !== args.folderId) {
        // Remove from old folder
        if (file.folderId) {
          const oldFolder = await ctx.db.get(file.folderId);
          if (oldFolder) {
            await ctx.db.patch(file.folderId, {
              itemCount: Math.max(0, (oldFolder.itemCount || 0) - 1),
              totalSize: Math.max(0, (oldFolder.totalSize || 0) - file.fileSize),
            });
          }
        }

        // Add to new folder
        if (args.folderId) {
          const newFolder = await ctx.db.get(args.folderId);
          if (newFolder) {
            await ctx.db.patch(args.folderId, {
              itemCount: (newFolder.itemCount || 0) + 1,
              totalSize: (newFolder.totalSize || 0) + file.fileSize,
            });
          }
        }
      }

      await ctx.db.patch(fileId, {
        folderId: args.folderId,
        updatedAt: now,
      });
    }

    return { message: `${args.fileIds.length} file(s) moved successfully` };
  },
});
