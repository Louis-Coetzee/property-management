import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all groups for a company
export const getGroupsByCompany = query({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("messageGroups")
      .withIndex("by_company_active", (q) =>
        q.eq("companyId", args.companyId).eq("isActive", true)
      )
      .collect();

    // Only return groups where the user is a member
    return groups.filter((group) =>
      group.memberIds.includes(args.userId)
    );
  },
});

// Get group by ID
export const getGroupById = query({
  args: {
    groupId: v.id("messageGroups"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});

// Create a new group
export const createGroup = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    description: v.optional(v.string()),
    memberIds: v.array(v.id("users")),
    createdById: v.id("users"),
    avatarEmoji: v.optional(v.string()),
    avatarColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Ensure creator is in the member list
    const uniqueMembers = Array.from(
      new Set([args.createdById, ...args.memberIds])
    );

    const groupId = await ctx.db.insert("messageGroups", {
      companyId: args.companyId,
      name: args.name,
      description: args.description,
      createdById: args.createdById,
      memberIds: uniqueMembers,
      avatarEmoji: args.avatarEmoji,
      avatarColor: args.avatarColor,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { groupId, message: "Group created successfully" };
  },
});

// Update group
export const updateGroup = mutation({
  args: {
    groupId: v.id("messageGroups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    avatarEmoji: v.optional(v.string()),
    avatarColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.groupId, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.avatarEmoji !== undefined && { avatarEmoji: args.avatarEmoji }),
      ...(args.avatarColor !== undefined && { avatarColor: args.avatarColor }),
      updatedAt: now,
    });

    return { message: "Group updated successfully" };
  },
});

// Add members to group
export const addGroupMembers = mutation({
  args: {
    groupId: v.id("messageGroups"),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const now = Date.now();

    // Merge existing members with new ones, removing duplicates
    const uniqueMembers = Array.from(
      new Set([...group.memberIds, ...args.memberIds])
    );

    await ctx.db.patch(args.groupId, {
      memberIds: uniqueMembers,
      updatedAt: now,
    });

    return { message: "Members added successfully" };
  },
});

// Remove member from group
export const removeGroupMember = mutation({
  args: {
    groupId: v.id("messageGroups"),
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Don't allow removing the last member
    if (group.memberIds.length <= 1) {
      throw new Error("Cannot remove the last member");
    }

    const now = Date.now();

    const updatedMembers = group.memberIds.filter((id) => id !== args.memberId);

    await ctx.db.patch(args.groupId, {
      memberIds: updatedMembers,
      updatedAt: now,
    });

    return { message: "Member removed successfully" };
  },
});

// Delete group (soft delete)
export const deleteGroup = mutation({
  args: {
    groupId: v.id("messageGroups"),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.groupId, {
      isActive: false,
      updatedAt: now,
    });

    return { message: "Group deleted successfully" };
  },
});

// Leave group
export const leaveGroup = mutation({
  args: {
    groupId: v.id("messageGroups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Don't allow leaving if you're the last member
    if (group.memberIds.length <= 1) {
      throw new Error("Cannot leave group with only one member");
    }

    const now = Date.now();

    const updatedMembers = group.memberIds.filter((id) => id !== args.userId);

    await ctx.db.patch(args.groupId, {
      memberIds: updatedMembers,
      updatedAt: now,
    });

    return { message: "Left group successfully" };
  },
});
