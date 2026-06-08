import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Time slot type
const timeSlotSchema = v.object({
  startTime: v.string(),
  endTime: v.string(),
  enabled: v.boolean(),
});

// Weekly availability schema
const weeklyAvailabilitySchema = v.object({
  monday: v.optional(v.array(timeSlotSchema)),
  tuesday: v.optional(v.array(timeSlotSchema)),
  wednesday: v.optional(v.array(timeSlotSchema)),
  thursday: v.optional(v.array(timeSlotSchema)),
  friday: v.optional(v.array(timeSlotSchema)),
  saturday: v.optional(v.array(timeSlotSchema)),
  sunday: v.optional(v.array(timeSlotSchema)),
});

// Exclusion schema
const exclusionSchema = v.object({
  date: v.string(),
  isFullDay: v.boolean(),
  startTime: v.optional(v.string()),
  endTime: v.optional(v.string()),
  reason: v.optional(v.string()),
});

// Get availability for a specific user in a company
export const getByUserAndCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const availability = await ctx.db
      .query("userAvailability")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .first();

    return availability;
  },
});

// Get availability by ID
export const getById = query({
  args: {
    availabilityId: v.id("userAvailability"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.availabilityId);
  },
});

// Create or update availability (upsert)
export const upsertAvailability = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    weeklyAvailability: weeklyAvailabilitySchema,
    exclusions: v.optional(v.array(exclusionSchema)),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if availability already exists
    const existing = await ctx.db
      .query("userAvailability")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        weeklyAvailability: args.weeklyAvailability,
        exclusions: args.exclusions,
        timezone: args.timezone,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new
      const id = await ctx.db.insert("userAvailability", {
        userId: args.userId,
        companyId: args.companyId,
        weeklyAvailability: args.weeklyAvailability,
        exclusions: args.exclusions,
        timezone: args.timezone,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

// Update weekly availability for a specific day
export const updateDayAvailability = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    day: v.union(
      v.literal("monday"),
      v.literal("tuesday"),
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday"),
      v.literal("sunday")
    ),
    slots: v.optional(v.array(timeSlotSchema)),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("userAvailability")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .first();

    if (!existing) {
      throw new Error("Availability not found. Please create availability first.");
    }

    const updatedWeekly = { ...existing.weeklyAvailability };
    // @ts-ignore - dynamic key
    updatedWeekly[args.day] = args.slots;

    await ctx.db.patch(existing._id, {
      weeklyAvailability: updatedWeekly,
      updatedAt: now,
    });

    return existing._id;
  },
});

// Add exclusion
export const addExclusion = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    exclusion: exclusionSchema,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("userAvailability")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .first();

    if (!existing) {
      throw new Error("Availability not found. Please create availability first.");
    }

    const currentExclusions = existing.exclusions || [];
    await ctx.db.patch(existing._id, {
      exclusions: [...currentExclusions, args.exclusion],
      updatedAt: now,
    });

    return existing._id;
  },
});

// Update exclusion
export const updateExclusion = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    exclusionIndex: v.number(),
    exclusion: exclusionSchema,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("userAvailability")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .first();

    if (!existing || !existing.exclusions) {
      throw new Error("Availability or exclusion not found.");
    }

    if (args.exclusionIndex < 0 || args.exclusionIndex >= existing.exclusions.length) {
      throw new Error("Invalid exclusion index.");
    }

    const updatedExclusions = [...existing.exclusions];
    updatedExclusions[args.exclusionIndex] = args.exclusion;

    await ctx.db.patch(existing._id, {
      exclusions: updatedExclusions,
      updatedAt: now,
    });

    return existing._id;
  },
});

// Remove exclusion
export const removeExclusion = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    exclusionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("userAvailability")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .first();

    if (!existing || !existing.exclusions) {
      throw new Error("Availability or exclusion not found.");
    }

    if (args.exclusionIndex < 0 || args.exclusionIndex >= existing.exclusions.length) {
      throw new Error("Invalid exclusion index.");
    }

    const updatedExclusions = existing.exclusions.filter((_, i) => i !== args.exclusionIndex);

    await ctx.db.patch(existing._id, {
      exclusions: updatedExclusions.length > 0 ? updatedExclusions : undefined,
      updatedAt: now,
    });

    return existing._id;
  },
});

// Delete all availability for a user in a company
export const deleteAvailability = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userAvailability")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", args.companyId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return true;
  },
});
