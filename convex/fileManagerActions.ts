import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Action to share file with optional email notification
export const shareFileWithNotificationAction = action({
  args: {
    fileId: v.id("mediaLibrary"),
    userIds: v.array(v.id("users")),
    permission: v.string(),
    expiresAt: v.optional(v.number()),
    sendEmailNotification: v.boolean(),
    shareMessage: v.optional(v.string()),
    domain: v.string(),
    sharerName: v.string(),
    sharerEmail: v.string(),
  },
  handler: async (ctx, args): Promise<{ shareToken: string; message: string }> => {
    // First, share the file via mutation
    const shareResult = await ctx.runMutation(api.fileManager.shareFile, {
      fileId: args.fileId,
      userIds: args.userIds,
      permission: args.permission,
      expiresAt: args.expiresAt,
    });

    // If email notification is requested, send emails to each user
    if (args.sendEmailNotification) {
      // Get file details
      const file = await ctx.runQuery(api.fileManager.getFileById, {
        fileId: args.fileId,
      });

      if (!file) {
        throw new Error("File not found");
      }

      // Use the domain from which the share was initiated for the access URL
      // This ensures the email button links to the correct domain
      const shareDomain = args.domain.includes('.') ? args.domain : `${args.domain}.vercel.app`;
      const accessUrl = `https://${shareDomain}/file-manager?shared=${shareResult.shareToken}`;

      // Send emails to each user
      for (const userId of args.userIds) {
        const user = await ctx.runQuery(api.auth.getUserById, {
          userId,
        });

        if (user) {
          await ctx.runAction(api.emailActions.sendFileShareEmailAction, {
            recipientEmail: user.email,
            recipientName: `${user.firstName} ${user.lastName}`,
            sharerName: args.sharerName,
            sharerEmail: args.sharerEmail,
            itemType: 'file',
            itemName: file.filename,
            permission: args.permission,
            domain: shareDomain,
            accessUrl,
            message: args.shareMessage,
            companyId: file.companyId,
          });
        }
      }
    }

    return {
      shareToken: shareResult.shareToken,
      message: args.sendEmailNotification
        ? "File shared successfully. Email notifications sent."
        : "File shared successfully",
    };
  },
});

// Action to share folder with optional email notification
export const shareFolderWithNotificationAction = action({
  args: {
    folderId: v.id("mediaFolders"),
    userIds: v.array(v.id("users")),
    permission: v.string(),
    expiresAt: v.optional(v.number()),
    sendEmailNotification: v.boolean(),
    shareMessage: v.optional(v.string()),
    domain: v.string(),
    sharerName: v.string(),
    sharerEmail: v.string(),
  },
  handler: async (ctx, args): Promise<{ shareToken: string; message: string }> => {
    // First, share the folder via mutation
    const shareResult = await ctx.runMutation(api.fileManager.shareFolder, {
      folderId: args.folderId,
      userIds: args.userIds,
      permission: args.permission,
      expiresAt: args.expiresAt,
    });

    // If email notification is requested, send emails to each user
    if (args.sendEmailNotification) {
      // Get folder details - need to use query instead of db.get in action
      const folder = await ctx.runQuery(api.fileManager.getFolderById, {
        folderId: args.folderId,
      });

      if (!folder) {
        throw new Error("Folder not found");
      }

      // Use the domain from which the share was initiated for the access URL
      // This ensures the email button links to the correct domain
      const shareDomain = args.domain.includes('.') ? args.domain : `${args.domain}.vercel.app`;
      const accessUrl = `https://${shareDomain}/file-manager?shared=${shareResult.shareToken}`;

      // Send emails to each user
      for (const userId of args.userIds) {
        const user = await ctx.runQuery(api.auth.getUserById, {
          userId,
        });

        if (user) {
          await ctx.runAction(api.emailActions.sendFileShareEmailAction, {
            recipientEmail: user.email,
            recipientName: `${user.firstName} ${user.lastName}`,
            sharerName: args.sharerName,
            sharerEmail: args.sharerEmail,
            itemType: 'folder',
            itemName: folder.name,
            permission: args.permission,
            domain: shareDomain,
            accessUrl,
            message: args.shareMessage,
            companyId: folder.companyId,
          });
        }
      }
    }

    return {
      shareToken: shareResult.shareToken,
      message: args.sendEmailNotification
        ? "Folder shared successfully. Email notifications sent."
        : "Folder shared successfully",
    };
  },
});
