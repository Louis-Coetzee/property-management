import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  validateUserCompanyAccess,
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";

/**
 * Message management system with full authentication and authorization
 *
 * All operations:
 * - Require authenticated user
 * - Validate user belongs to the specified company
 * - Use authUser.tokenIdentifier for user identification
 * - Enforce ownership for edit/delete operations
 */

// List messages for a group or direct message
export const list = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    groupId: v.optional(v.id("messageGroups")),
    recipientId: v.optional(v.id("users")),
    isDirect: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access
    const { authUser } = await validateCompanyResourceAccess(ctx, args.userId, args.companyId);
    const currentUserId = authUser.userId as any;

    try {
      // Query messages by company
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      // Filter out deleted messages and by isDirect
      let filtered = messages.filter((m) => !m.deletedAt && m.isDirect === args.isDirect);

      // Filter by group or recipient
      if (args.isDirect && args.recipientId) {
        // For DMs, verify the authenticated user is part of the conversation
        // Only show messages where sender or recipient is the current user
        filtered = filtered.filter((m) =>
          (m.senderId === currentUserId || m.recipientId === currentUserId) &&
          (m.senderId === args.recipientId || m.recipientId === args.recipientId)
        );
      } else if (!args.isDirect && args.groupId) {
        filtered = filtered.filter((m) => m.groupId === args.groupId);
      }

      // Sort by creation time
      filtered.sort((a, b) => a.createdAt - b.createdAt);

      // Mark messages as delivered and read for the current user (recipient)
      // This is a read-only query, so we can't mutate. The frontend will call markAsDelivered/markAsRead mutations.

      // Enrich with sender names and calculate read/delivered status for display
      const enriched = await Promise.all(
        filtered.map(async (message) => {
          const sender = await ctx.db.get(message.senderId);

          // For display purposes - check if this user has read the message
          const readBy = message.readBy || [];
          const deliveredTo = message.deliveredTo || [];

          // Check if current user (as recipient) has read this message
          const hasReadByCurrentUser = readBy.includes(currentUserId);

          // Check if current user (as recipient) has received this message
          const hasDeliveredToCurrentUser = deliveredTo.includes(currentUserId);

          return {
            ...message,
            senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown User",
            // Additional computed fields for UI
            _hasReadByCurrentUser: hasReadByCurrentUser,
            _hasDeliveredToCurrentUser: hasDeliveredToCurrentUser,
          };
        })
      );

      return enriched;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  },
});

// Get recent messages for a user
export const getRecent = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access
    const { authUser } = await validateCompanyResourceAccess(ctx, args.userId, args.companyId);
    const currentUserId = authUser.tokenIdentifier;

    try {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      // Filter out deleted messages and those involving this user
      const userMessages = messages.filter((m) =>
        !m.deletedAt && (m.senderId === currentUserId || m.recipientId === currentUserId)
      );

      // Get last 50 messages sorted by time
      userMessages.sort((a, b) => b.createdAt - a.createdAt);

      return userMessages.slice(0, 50);
    } catch (error) {
      console.error("Error fetching recent messages:", error);
      throw error;
    }
  },
});

// Send a message
export const send = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    content: v.string(),
    messageType: v.optional(v.string()),
    isDirect: v.boolean(),
    recipientId: v.optional(v.id("users")),
    groupId: v.optional(v.id("messageGroups")),
    replyTo: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access (must be a member to send messages)
    const { authUser } = await validateCompanyResourceAccess(ctx, args.userId, args.companyId);
    const currentUserId = authUser.userId as any; // Use userId instead of tokenIdentifier

    try {
      const now = Date.now();
      const messageId = await ctx.db.insert("messages", {
        companyId: args.companyId,
        senderId: currentUserId,
        content: args.content,
        messageType: args.messageType || "text",
        isDirect: args.isDirect,
        recipientId: args.recipientId,
        groupId: args.groupId,
        replyTo: args.replyTo,
        isRead: false,
        readBy: [currentUserId],
        isDelivered: false,
        deliveredTo: [], // Empty initially - will be populated when recipient receives it
        createdAt: now,
      });

      return messageId;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },
});

// Mark message as read
export const markAsRead = mutation({
  args: {
    userId: v.id("users"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    const currentUserId = authUser.tokenIdentifier;

    try {
      const message = await ctx.db.get(args.messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      // Verify user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, message.companyId);

      // Only allow marking as read if user is the recipient
      if (message.recipientId !== currentUserId) {
        throw new Error("You can only mark messages addressed to you as read");
      }

      const readBy = message.readBy || [];
      if (!readBy.includes(currentUserId as any)) {
        await ctx.db.patch(args.messageId, {
          isRead: true,
          readBy: [...readBy, currentUserId as any],
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  },
});

// Mark messages as delivered (called when recipient loads/opens the conversation)
export const markAsDelivered = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    recipientId: v.optional(v.id("users")),
    groupId: v.optional(v.id("messageGroups")),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    const currentUserId = authUser.userId as any;

    try {
      // Get messages for this conversation
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      // Filter for relevant messages that are sent by others
      const relevantMessages = messages.filter(
        (m) =>
          !m.deletedAt &&
          m.senderId !== currentUserId &&
          ((args.recipientId && m.isDirect && (m.senderId === args.recipientId || m.recipientId === args.recipientId)) ||
            (args.groupId && !m.isDirect && m.groupId === args.groupId))
      );

      let deliveredCount = 0;
      let readCount = 0;

      // Mark all as delivered and read
      for (const message of relevantMessages) {
        const deliveredTo = message.deliveredTo || [];
        const readBy = message.readBy || [];

        // Update deliveredTo
        if (!deliveredTo.includes(currentUserId)) {
          deliveredCount++;
          await ctx.db.patch(message._id, {
            deliveredTo: [...deliveredTo, currentUserId],
          });
        }

        // Also mark as read (since viewing the conversation implies reading)
        if (!readBy.includes(currentUserId)) {
          readCount++;
          const newReadBy = [...readBy, currentUserId];
          await ctx.db.patch(message._id, {
            isRead: true,
            readBy: newReadBy,
          });
        }
      }

      return { success: true, deliveredCount, readCount };
    } catch (error) {
      console.error("Error marking messages as delivered:", error);
      throw error;
    }
  },
});

// Edit a message
export const edit = mutation({
  args: {
    userId: v.id("users"),
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    const currentUserId = authUser.tokenIdentifier;

    try {
      const message = await ctx.db.get(args.messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      // Verify user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, message.companyId);

      // Only allow editing your own messages
      if (message.senderId !== currentUserId) {
        throw new Error("You can only edit your own messages");
      }

      const now = Date.now();
      await ctx.db.patch(args.messageId, {
        content: args.content,
        editedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  },
});

// Delete a message (soft delete)
export const remove = mutation({
  args: {
    userId: v.id("users"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    const currentUserId = authUser.tokenIdentifier;

    try {
      const message = await ctx.db.get(args.messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      // Verify user has access to this company
      await validateCompanyResourceAccess(ctx, args.userId, message.companyId);

      // Only allow deleting your own messages
      if (message.senderId !== currentUserId) {
        throw new Error("You can only delete your own messages");
      }

      const now = Date.now();
      await ctx.db.patch(args.messageId, {
        deletedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },
});

// Get unread message count
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate company access
    const { authUser } = await validateCompanyResourceAccess(ctx, args.userId, args.companyId);
    const currentUserId = authUser.tokenIdentifier;

    try {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      // Count unread messages where user is recipient
      const unread = messages.filter((m) =>
        !m.deletedAt &&
        m.recipientId === currentUserId &&
        !m.isRead &&
        !(m.readBy || []).includes(currentUserId as any)
      );

      return unread.length;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  },
});
