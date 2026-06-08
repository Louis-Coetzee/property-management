import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  validateCompanyResourceAccess,
  getAuthenticatedUser,
} from "./security";

/**
 * Bookings management
 * Bookings are customer appointment bookings
 */

// Create a new booking (public - for authenticated users)
export const create = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.optional(v.id("users")),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    serviceId: v.optional(v.id("services")),
    consultantServiceId: v.optional(v.id("consultantServices")),
    serviceName: v.string(),
    servicePrice: v.number(),
    serviceDuration: v.optional(v.number()),
    consultantId: v.optional(v.id("consultants")),
    consultantName: v.optional(v.string()),
    bookingDate: v.string(),
    bookingTime: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const bookingId = await ctx.db.insert("bookings", {
      companyId: args.companyId,
      userId: args.userId,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      serviceId: args.serviceId,
      consultantServiceId: args.consultantServiceId,
      serviceName: args.serviceName,
      servicePrice: args.servicePrice,
      serviceDuration: args.serviceDuration,
      consultantId: args.consultantId,
      consultantName: args.consultantName,
      bookingDate: args.bookingDate,
      bookingTime: args.bookingTime,
      status: "pending",
      paymentStatus: "pending",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return { bookingId };
  },
});

// Update booking after payment
export const updatePayment = mutation({
  args: {
    bookingId: v.id("bookings"),
    paymentStatus: v.string(),
    paymentMethod: v.string(),
    paymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await ctx.db.patch(args.bookingId, {
      paymentStatus: args.paymentStatus,
      paymentMethod: args.paymentMethod,
      paymentId: args.paymentId,
      status: args.paymentStatus === "paid" ? "confirmed" : "pending",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update booking status
export const updateStatus = mutation({
  args: {
    userId: v.id("users"),
    bookingId: v.id("bookings"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, booking.companyId, "write");

    await ctx.db.patch(args.bookingId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// List bookings for a company
export const listByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId, "read");

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    return bookings;
  },
});

// List bookings by user
export const listByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return bookings;
  },
});

// Get bookings by date for a company (public for consultants)
export const listByDate = query({
  args: {
    companyId: v.id("companies"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Skip validation - this is public data for availability checking
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_company_date", (q) => 
        q.eq("companyId", args.companyId).eq("bookingDate", args.date)
      )
      .collect();

    return bookings;
  },
});

// Get single booking by ID
export const getById = query({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    return booking;
  },
});

// Delete/cancel a booking
export const cancel = mutation({
  args: {
    userId: v.id("users"),
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, booking.companyId, "write");

    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update a booking (admin/manual)
export const updateBooking = mutation({
  args: {
    userId: v.id("users"),
    bookingId: v.id("bookings"),
    customerName: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    serviceName: v.optional(v.string()),
    servicePrice: v.optional(v.number()),
    serviceDuration: v.optional(v.number()),
    consultantName: v.optional(v.string()),
    bookingDate: v.optional(v.string()),
    bookingTime: v.optional(v.string()),
    status: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, booking.companyId, "write");

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.customerName !== undefined) updateData.customerName = args.customerName;
    if (args.customerEmail !== undefined) updateData.customerEmail = args.customerEmail;
    if (args.customerPhone !== undefined) updateData.customerPhone = args.customerPhone;
    if (args.serviceName !== undefined) updateData.serviceName = args.serviceName;
    if (args.servicePrice !== undefined) updateData.servicePrice = args.servicePrice;
    if (args.serviceDuration !== undefined) updateData.serviceDuration = args.serviceDuration;
    if (args.consultantName !== undefined) updateData.consultantName = args.consultantName;
    if (args.bookingDate !== undefined) updateData.bookingDate = args.bookingDate;
    if (args.bookingTime !== undefined) updateData.bookingTime = args.bookingTime;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.paymentStatus !== undefined) updateData.paymentStatus = args.paymentStatus;
    if (args.notes !== undefined) updateData.notes = args.notes;

    await ctx.db.patch(args.bookingId, updateData);

    return { success: true };
  },
});

// Delete a booking permanently
export const deleteBooking = mutation({
  args: {
    userId: v.id("users"),
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, booking.companyId, "write");

    await ctx.db.delete(args.bookingId);

    return { success: true };
  },
});