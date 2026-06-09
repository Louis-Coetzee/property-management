import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function generateBookingCode(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BKG-${timestamp}${random}`;
}

// Create accommodation booking
export const createBooking = mutation({
  args: {
    listingId: v.id("listings"),
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    checkInDate: v.string(),
    checkOutDate: v.string(),
    numberOfGuests: v.number(),
    numberOfNights: v.number(),
    pricePerNight: v.number(),
    totalAmount: v.number(),
    cleaningFee: v.optional(v.number()),
    securityDeposit: v.optional(v.number()),
    specialRequests: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("confirmed")),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid")),
    payfastPaymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const bookingCode = generateBookingCode();

    const bookingId = await ctx.db.insert("accommodationBookings", {
      bookingCode,
      listingId: args.listingId,
      userId: args.userId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      checkInDate: args.checkInDate,
      checkOutDate: args.checkOutDate,
      numberOfGuests: args.numberOfGuests,
      numberOfNights: args.numberOfNights,
      pricePerNight: args.pricePerNight,
      totalAmount: args.totalAmount,
      cleaningFee: args.cleaningFee,
      securityDeposit: args.securityDeposit,
      specialRequests: args.specialRequests,
      status: args.status,
      paymentStatus: args.paymentStatus,
      payfastPaymentId: args.payfastPaymentId,
      createdAt: now,
      updatedAt: now,
      confirmedAt: args.status === "confirmed" ? now : undefined,
    });

    // Mark dates as booked in availability table
    if (args.status === "confirmed" || args.paymentStatus === "paid") {
      const checkIn = new Date(args.checkInDate);
      const checkOut = new Date(args.checkOutDate);
      const nowIso = new Date(now).toISOString();

      for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split("T")[0];

        const existing = await ctx.db
          .query("listingAvailability")
          .withIndex("by_listing_and_date", (q) =>
            q.eq("listingId", args.listingId).eq("date", dateStr)
          )
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            status: "booked",
            notes: `Booking: ${bookingCode}`,
            updatedAt: nowIso,
          });
        } else {
          await ctx.db.insert("listingAvailability", {
            listingId: args.listingId,
            date: dateStr,
            status: "booked",
            notes: `Booking: ${bookingCode}`,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
      }
    }

    return { bookingId, bookingCode };
  },
});

// Get booking by booking code
export const getBookingByCode = query({
  args: { bookingCode: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("accommodationBookings")
      .withIndex("by_booking_code", (q) => q.eq("bookingCode", args.bookingCode))
      .first();

    if (!booking) {
      return null;
    }

    const listing = await ctx.db.get(booking.listingId);
    const user = await ctx.db.get(booking.userId);

    return {
      ...booking,
      listing,
      user,
    };
  },
});

// Get user's accommodation bookings
export const getUserBookings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("accommodationBookings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const listing = await ctx.db.get(booking.listingId);
        return { ...booking, listing };
      })
    );

    return enrichedBookings;
  },
});

// Get listing's accommodation bookings
export const getListingBookings = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("accommodationBookings")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .order("desc")
      .collect();

    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const user = await ctx.db.get(booking.userId);
        return { ...booking, user };
      })
    );

    return enrichedBookings;
  },
});

// Update booking status
export const updateBookingStatus = mutation({
  args: {
    bookingId: v.id("accommodationBookings"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    paymentStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    )),
    payfastPaymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const booking = await ctx.db.get(args.bookingId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    const updateData: any = {
      status: args.status,
      updatedAt: now,
    };

    if (args.paymentStatus) {
      updateData.paymentStatus = args.paymentStatus;
    }

    if (args.payfastPaymentId) {
      updateData.payfastPaymentId = args.payfastPaymentId;
    }

    if (args.status === "confirmed" && !booking.confirmedAt) {
      updateData.confirmedAt = now;
    }

    if (args.status === "cancelled" && !booking.cancelledAt) {
      updateData.cancelledAt = now;
    }

    await ctx.db.patch(args.bookingId, updateData);

    return { success: true };
  },
});

// Cancel booking
export const cancelBooking = mutation({
  args: {
    bookingCode: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("accommodationBookings")
      .withIndex("by_booking_code", (q) => q.eq("bookingCode", args.bookingCode))
      .first();

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.userId !== args.userId) {
      throw new Error("Not authorized to cancel this booking");
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new Error(`Cannot cancel a ${booking.status} booking`);
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    await ctx.db.patch(booking._id, {
      status: "cancelled",
      cancelledAt: now,
      updatedAt: now,
    });

    // Free up the dates in availability
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);

    for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split("T")[0];

      const availability = await ctx.db
        .query("listingAvailability")
        .withIndex("by_listing_and_date", (q) =>
          q.eq("listingId", booking.listingId).eq("date", dateStr)
        )
        .first();

      if (availability && availability.notes === `Booking: ${args.bookingCode}`) {
        await ctx.db.patch(availability._id, {
          status: "available",
          notes: undefined,
          updatedAt: nowIso,
        });
      }
    }

    return { success: true };
  },
});
