'use strict';

import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthenticatedUser } from "./security";

export const list = query({
  args: {
    userId: v.id("users"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const notes = await ctx.db
      .query("clientNotes")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return notes.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: {
    userId: v.id("users"),
    noteId: v.id("clientNotes"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const note = await ctx.db.get(args.noteId);
    return note;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    clientId: v.id("clients"),
    title: v.string(),
    note: v.string(),
    noteDate: v.string(),
    noteTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const noteId = await ctx.db.insert("clientNotes", {
      companyId: args.companyId,
      clientId: args.clientId,
      title: args.title,
      note: args.note,
      noteDate: args.noteDate,
      noteTime: args.noteTime,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, noteId };
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    noteId: v.id("clientNotes"),
    title: v.string(),
    note: v.string(),
    noteDate: v.string(),
    noteTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const existing = await ctx.db.get(args.noteId);
    if (!existing) {
      throw new Error("Note not found");
    }

    await ctx.db.patch(args.noteId, {
      title: args.title,
      note: args.note,
      noteDate: args.noteDate,
      noteTime: args.noteTime,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    noteId: v.id("clientNotes"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const existing = await ctx.db.get(args.noteId);
    if (!existing) {
      throw new Error("Note not found");
    }

    await ctx.db.delete(args.noteId);

    return { success: true };
  },
});