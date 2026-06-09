import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

function generateBookingNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FA-${timestamp}-${random}`;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PLATFORM_DOMAIN
    ? `https://${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN}`
    : "http://localhost:3000";
}

// Create a new accommodation inquiry and send notification emails
export const createInquiry = mutation({
  args: {
    listingId: v.id("listings"),
    userId: v.optional(v.id("users")),
    guestName: v.string(),
    guestEmail: v.string(),
    guestPhone: v.optional(v.string()),
    checkInDate: v.string(),
    checkOutDate: v.string(),
    numberOfGuests: v.number(),
    numberOfAdults: v.optional(v.number()),
    numberOfChildren: v.optional(v.number()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new ConvexError("Listing not found");
    }

    let owner: any = null;
    if (listing.ownerId) {
      owner = await ctx.db.get(listing.ownerId);
    }

    const checkInDateObj = new Date(args.checkInDate);
    const checkOutDateObj = new Date(args.checkOutDate);
    const totalNights = Math.ceil(
      (checkOutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    const cleaningFee = listing.cleaningFee || 0;
    const totalAmount = listing.pricePerNight * totalNights + cleaningFee;
    const bookingNumber = generateBookingNumber();

    const inquiryData: any = {
      listingId: args.listingId,
      listingTitle: listing.title,
      bookingNumber,
      hostId: listing.ownerId!,
      guestName: args.guestName,
      guestEmail: args.guestEmail,
      guestPhone: args.guestPhone,
      checkInDate: args.checkInDate,
      checkOutDate: args.checkOutDate,
      numberOfGuests: args.numberOfGuests,
      message: args.message,
      status: "pending",
      totalNights,
      pricePerNight: listing.pricePerNight,
      cleaningFee,
      totalAmount,
      currency: listing.currency || "ZAR",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (args.userId) {
      inquiryData.guestId = args.userId;
    }
    if (args.numberOfAdults !== undefined) {
      inquiryData.numberOfAdults = args.numberOfAdults;
    }
    if (args.numberOfChildren !== undefined) {
      inquiryData.numberOfChildren = args.numberOfChildren;
    }

    const inquiryId = await ctx.db.insert("accommodationInquiries", inquiryData);

    await ctx.db.patch(args.listingId, {
      inquiries: (listing.inquiries || 0) + 1,
      updatedAt: new Date().toISOString(),
    });

    const baseUrl = getBaseUrl();
    const listingImage = listing.featuredImage || (listing.images && listing.images.length > 0 ? listing.images[0] : null);
    const hostName = owner ? `${owner.firstName} ${owner.lastName}` : "Your Host";

    await ctx.scheduler.runAfter(0, api.accommodationInquiries.sendGuestConfirmationEmail, {
      inquiryId,
      listingTitle: listing.title,
      listingImage,
      hostName,
    });

    await ctx.scheduler.runAfter(0, api.accommodationInquiries.sendAdminBookingNotificationEmail, {
      inquiryId,
      listingTitle: listing.title,
      listingImage,
      listingUrl: `${baseUrl}/listings/${args.listingId}`,
    });

    if (owner?.email) {
      await ctx.scheduler.runAfter(0, api.accommodationInquiries.sendOwnerBookingNotificationEmail, {
        inquiryId,
        ownerEmail: owner.email,
        listingTitle: listing.title,
        listingImage,
        listingUrl: `${baseUrl}/listings/${args.listingId}`,
      });
    }

    return inquiryId;
  },
});

// Get a single inquiry by ID
export const getInquiry = query({
  args: {
    inquiryId: v.id("accommodationInquiries"),
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.db.get(args.inquiryId);
    if (!inquiry) {
      throw new ConvexError("Inquiry not found");
    }
    return inquiry;
  },
});

// Find an inquiry by booking number
export const findInquiryByBookingNumber = query({
  args: {
    bookingNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.db
      .query("accommodationInquiries")
      .withIndex("by_bookingNumber", (q) => q.eq("bookingNumber", args.bookingNumber))
      .first();
    return inquiry;
  },
});

// Send confirmation email to guest
export const sendGuestConfirmationEmail = action({
  args: {
    inquiryId: v.id("accommodationInquiries"),
    listingTitle: v.string(),
    listingImage: v.union(v.string(), v.null()),
    hostName: v.string(),
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.runQuery(api.accommodationInquiries.getInquiry, {
      inquiryId: args.inquiryId,
    });

    if (!inquiry) {
      throw new ConvexError("Inquiry not found");
    }

    const baseUrl = getBaseUrl();
    const emailData = {
      to: inquiry.guestEmail,
      subject: `Booking Request Confirmation - ${args.listingTitle}`,
      inquiry,
      listingTitle: args.listingTitle,
      listingImage: args.listingImage,
      hostName: args.hostName,
      isForGuest: true,
    };

    console.log(`📧 [GUEST-EMAIL] Sending confirmation email to: ${inquiry.guestEmail}`);

    const response = await fetch(`${baseUrl}/api/send-inquiry-confirmation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Convex-Inquiry-System'
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [GUEST-EMAIL] Failed to send guest confirmation email:', errorText);
      throw new Error(`Failed to send guest confirmation email: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ [GUEST-EMAIL] Guest confirmation email sent successfully:`, result);

    return { success: true };
  },
});

// Send notification email to host
export const sendHostNotificationEmail = action({
  args: {
    inquiryId: v.id("accommodationInquiries"),
    hostEmail: v.string(),
    hostName: v.string(),
    listingTitle: v.string(),
    listingImage: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.runQuery(api.accommodationInquiries.getInquiry, {
      inquiryId: args.inquiryId,
    });

    if (!inquiry) {
      throw new ConvexError("Inquiry not found");
    }

    const baseUrl = getBaseUrl();
    const emailData = {
      to: args.hostEmail,
      subject: `New Booking Request - ${args.listingTitle}`,
      inquiry,
      listingTitle: args.listingTitle,
      listingImage: args.listingImage,
      hostName: args.hostName,
      isForGuest: false,
    };

    console.log(`📧 [HOST-EMAIL] Sending notification email to: ${args.hostEmail}`);

    const response = await fetch(`${baseUrl}/api/send-inquiry-notification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Convex-Inquiry-System'
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [HOST-EMAIL] Failed to send host notification email:', errorText);
      throw new Error(`Failed to send host notification email: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ [HOST-EMAIL] Host notification email sent successfully:`, result);

    return { success: true };
  },
});

// Send booking notification email to admin
export const sendAdminBookingNotificationEmail = action({
  args: {
    inquiryId: v.id("accommodationInquiries"),
    listingTitle: v.string(),
    listingImage: v.union(v.string(), v.null()),
    listingUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.runQuery(api.accommodationInquiries.getInquiry, {
      inquiryId: args.inquiryId,
    });

    if (!inquiry) {
      throw new ConvexError("Inquiry not found");
    }

    const baseUrl = getBaseUrl();
    const adminEmailsEnv = process.env.ADMIN_EMAIL;
    const adminEmails = adminEmailsEnv ? adminEmailsEnv.split(",").map((e: string) => e.trim()) : [];

    if (adminEmails.length === 0) {
      console.log('⚠️ [ADMIN-BOOKING-EMAIL] No admin emails configured');
      return { success: false, message: 'No admin emails configured' };
    }

    console.log(`📧 [ADMIN-BOOKING-EMAIL] Sending to ${adminEmails.length} admin email(s)`);

    const results: Array<{ email: string; success: boolean; error?: string }> = [];
    for (const adminEmail of adminEmails) {
      const emailData = {
        to: adminEmail,
        inquiry,
        inquiryId: args.inquiryId,
        listingTitle: args.listingTitle,
        listingImage: args.listingImage,
        listingUrl: args.listingUrl,
      };

      try {
        const response = await fetch(`${baseUrl}/api/send-admin-booking-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Convex-Inquiry-System'
          },
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [ADMIN-BOOKING-EMAIL] Failed to send to ${adminEmail}:`, errorText);
          results.push({ email: adminEmail, success: false, error: errorText });
        } else {
          const result = await response.json();
          console.log(`✅ [ADMIN-BOOKING-EMAIL] Sent successfully to ${adminEmail}:`, result);
          results.push({ email: adminEmail, success: true });
        }
      } catch (error) {
        console.error(`❌ [ADMIN-BOOKING-EMAIL] Error sending to ${adminEmail}:`, error);
        results.push({ email: adminEmail, success: false, error: String(error) });
      }
    }

    return { success: true, results };
  },
});

// Send booking notification email to owner
export const sendOwnerBookingNotificationEmail = action({
  args: {
    inquiryId: v.id("accommodationInquiries"),
    ownerEmail: v.string(),
    listingTitle: v.string(),
    listingImage: v.union(v.string(), v.null()),
    listingUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.runQuery(api.accommodationInquiries.getInquiry, {
      inquiryId: args.inquiryId,
    });

    if (!inquiry) {
      throw new ConvexError("Inquiry not found");
    }

    const baseUrl = getBaseUrl();
    const emailData = {
      to: args.ownerEmail,
      inquiry,
      inquiryId: args.inquiryId,
      listingTitle: args.listingTitle,
      listingImage: args.listingImage,
      listingUrl: args.listingUrl,
    };

    console.log(`📧 [OWNER-BOOKING-EMAIL] Sending notification to owner: ${args.ownerEmail}`);

    const response = await fetch(`${baseUrl}/api/send-owner-booking-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Convex-Inquiry-System'
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [OWNER-BOOKING-EMAIL] Failed to send owner notification email:', errorText);
      throw new Error(`Failed to send owner notification email: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ [OWNER-BOOKING-EMAIL] Owner notification email sent successfully:`, result);

    return { success: true };
  },
});

// Get inquiries for a user as a guest
export const getUserInquiries = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("payment-received")
    )),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const allInquiries = await ctx.db.query("accommodationInquiries").collect();
    let userInquiries = allInquiries.filter(inquiry =>
      inquiry.guestId === args.userId ||
      inquiry.guestEmail === user.email
    );

    if (args.status) {
      userInquiries = userInquiries.filter(inquiry => inquiry.status === args.status);
    }

    userInquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const enrichedInquiries = await Promise.all(
      userInquiries.map(async (inquiry) => {
        const listing = await ctx.db.get(inquiry.listingId);
        const host = listing ? await ctx.db.get(listing.ownerId) : null;

        const notes = await ctx.db
          .query("inquiryNotes")
          .withIndex("by_inquiry", (q) => q.eq("inquiryId", inquiry._id))
          .order("desc")
          .collect();

        return {
          ...inquiry,
          listing: listing ? {
            title: listing.title,
            images: listing.images,
            featuredImage: listing.featuredImage,
          } : null,
          host: host ? {
            firstName: host.firstName,
            lastName: host.lastName,
            email: host.email,
            profileImage: host.profileImage,
          } : null,
          notes: notes,
        };
      })
    );

    return enrichedInquiries;
  },
});

// Get all inquiries for agents/admins
export const getAllInquiries = query({
  args: {
    adminUserId: v.id("users"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("payment-received")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.adminUserId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.userType !== 'admin' && user.userType !== 'agent') {
      throw new Error("Insufficient permissions to view all inquiries");
    }

    let dbQuery = ctx.db.query("accommodationInquiries");

    if (args.status) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    const allInquiries = await dbQuery.order("desc").collect();

    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedInquiries = allInquiries.slice(offset, offset + limit);

    const enrichedInquiries = await Promise.all(
      paginatedInquiries.map(async (inquiry) => {
        const guest = inquiry.guestId ? await ctx.db.get(inquiry.guestId) : null;
        const listing = await ctx.db.get(inquiry.listingId);
        const host = listing ? await ctx.db.get(listing.ownerId) : null;

        const notes = await ctx.db
          .query("inquiryNotes")
          .withIndex("by_inquiry", (q) => q.eq("inquiryId", inquiry._id))
          .order("desc")
          .collect();

        return {
          ...inquiry,
          guest: guest ? {
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email,
            profileImage: guest.profileImage,
          } : {
            firstName: inquiry.guestName.split(' ')[0] || '',
            lastName: inquiry.guestName.split(' ').slice(1).join(' ') || '',
            email: inquiry.guestEmail,
            profileImage: null,
          },
          listing: listing ? {
            title: listing.title,
            images: listing.images,
            featuredImage: listing.featuredImage,
          } : null,
          host: host ? {
            firstName: host.firstName,
            lastName: host.lastName,
            email: host.email,
            profileImage: host.profileImage,
          } : null,
          notes: notes,
        };
      })
    );

    return {
      inquiries: enrichedInquiries,
      total: allInquiries.length,
      hasMore: offset + limit < allInquiries.length,
    };
  },
});

// Get inquiries for a host
export const getHostInquiries = query({
  args: {
    hostId: v.id("users"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("payment-received")
    )),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.hostId);
    if (!user) {
      throw new Error("User not found");
    }

    let dbQuery = ctx.db.query("accommodationInquiries").withIndex("by_host", (q) => q.eq("hostId", args.hostId));

    if (args.status) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    const inquiries = await dbQuery.order("desc").collect();

    const enrichedInquiries = await Promise.all(
      inquiries.map(async (inquiry) => {
        const guest = inquiry.guestId ? await ctx.db.get(inquiry.guestId) : null;
        const listing = await ctx.db.get(inquiry.listingId);

        const notes = await ctx.db
          .query("inquiryNotes")
          .withIndex("by_inquiry", (q) => q.eq("inquiryId", inquiry._id))
          .order("desc")
          .collect();

        return {
          ...inquiry,
          guest: guest ? {
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email,
            profileImage: guest.profileImage,
          } : {
            firstName: inquiry.guestName.split(' ')[0] || '',
            lastName: inquiry.guestName.split(' ').slice(1).join(' ') || '',
            email: inquiry.guestEmail,
            profileImage: null,
          },
          listing: listing ? {
            title: listing.title,
            images: listing.images,
          } : null,
          notes: notes,
        };
      })
    );

    return enrichedInquiries;
  },
});

// Update inquiry status
export const updateInquiryStatus = mutation({
  args: {
    inquiryId: v.id("accommodationInquiries"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("payment-received")
    ),
    responseMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const inquiry = await ctx.db.get(args.inquiryId);
    if (!inquiry) {
      throw new Error("Inquiry not found");
    }

    const listing = await ctx.db.get(inquiry.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const isOwner = listing.ownerId === args.userId;
    const isAgentOrAdmin = user.userType === 'agent' || user.userType === 'admin';

    if (!isOwner && !isAgentOrAdmin) {
      throw new Error("Not authorized to update this inquiry");
    }

    await ctx.db.patch(args.inquiryId, {
      status: args.status,
      responseMessage: args.responseMessage,
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await ctx.scheduler.runAfter(0, api.accommodationInquiries.sendStatusChangeEmails, {
      inquiryId: args.inquiryId,
      newStatus: args.status,
      updatedBy: args.userId,
    });

    return args.inquiryId;
  },
});

// Delete an inquiry (admin only)
export const deleteInquiry = mutation({
  args: {
    inquiryId: v.id("accommodationInquiries"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.userType !== 'admin') {
      throw new Error("Only administrators can delete inquiries");
    }

    const inquiry = await ctx.db.get(args.inquiryId);
    if (!inquiry) {
      throw new Error("Inquiry not found");
    }

    const notes = await ctx.db
      .query("inquiryNotes")
      .withIndex("by_inquiry", (q) => q.eq("inquiryId", args.inquiryId))
      .collect();

    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    await ctx.db.delete(args.inquiryId);

    return { success: true };
  },
});

// Add a note to an inquiry
export const addInquiryNote = mutation({
  args: {
    inquiryId: v.id("accommodationInquiries"),
    userId: v.id("users"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.db.get(args.inquiryId);
    if (!inquiry) {
      throw new Error("Inquiry not found");
    }

    if (inquiry.hostId !== args.userId) {
      throw new Error("Not authorized to add notes to this inquiry");
    }

    const noteId = await ctx.db.insert("inquiryNotes", {
      inquiryId: args.inquiryId,
      userId: args.userId,
      note: args.note,
      createdAt: new Date().toISOString(),
    });

    return noteId;
  },
});

// Get notes for an inquiry
export const getInquiryNotes = query({
  args: {
    inquiryId: v.id("accommodationInquiries"),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("inquiryNotes")
      .withIndex("by_inquiry", (q) => q.eq("inquiryId", args.inquiryId))
      .order("desc")
      .collect();

    const enrichedNotes = await Promise.all(
      notes.map(async (note) => {
        const user = await ctx.db.get(note.userId);
        return {
          ...note,
          user: user ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImage: user.profileImage,
          } : null,
        };
      })
    );

    return enrichedNotes;
  },
});

// Get inquiry statistics for host dashboard
export const getInquiryStats = query({
  args: { hostId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.hostId);
    if (!user) {
      throw new Error("User not found");
    }

    const inquiries = await ctx.db
      .query("accommodationInquiries")
      .withIndex("by_host", (q) => q.eq("hostId", args.hostId))
      .collect();

    return {
      total: inquiries.length,
      pending: inquiries.filter(i => i.status === "pending").length,
      approved: inquiries.filter(i => i.status === "approved").length,
      declined: inquiries.filter(i => i.status === "declined").length,
      cancelled: inquiries.filter(i => i.status === "cancelled").length,
      completed: inquiries.filter(i => i.status === "completed").length,
      paymentReceived: inquiries.filter(i => i.status === "payment-received").length,
    };
  },
});

// Get all inquiries for listings owned by a specific user, or ALL if admin
export const getInquiriesForUserListings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    const isAdmin = user.userType === "admin";
    const isAgent = user.userType === "agent";

    let filteredInquiries;

    if (isAdmin || isAgent) {
      const allInquiries = await ctx.db.query("accommodationInquiries").collect();
      filteredInquiries = allInquiries;
    } else {
      const userListings = await ctx.db
        .query("listings")
        .filter((q) => q.eq(q.field("ownerId"), args.userId))
        .collect();

      if (userListings.length === 0) {
        return [];
      }

      const listingIds = userListings.map(l => l._id);
      const allInquiries = await ctx.db.query("accommodationInquiries").collect();
      filteredInquiries = allInquiries.filter(inquiry =>
        listingIds.some(id => id === inquiry.listingId)
      );
    }

    const enrichedInquiries = await Promise.all(
      filteredInquiries.map(async (inquiry) => {
        const listing = await ctx.db.get(inquiry.listingId);
        const listingData: any = listing;

        return {
          ...inquiry,
          listingTitle: listingData?.title || 'Unknown Listing',
          listingImage: listingData?.images?.[0] || null,
        };
      })
    );

    return enrichedInquiries.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Send status change emails
export const sendStatusChangeEmails = action({
  args: {
    inquiryId: v.id("accommodationInquiries"),
    newStatus: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("payment-received")
    ),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.runQuery(api.accommodationInquiries.getInquiry, {
      inquiryId: args.inquiryId,
    });

    if (!inquiry) {
      throw new ConvexError("Inquiry not found");
    }

    const baseUrl = getBaseUrl();
    const emailData = {
      to: inquiry.guestEmail,
      inquiry,
      inquiryId: args.inquiryId,
      newStatus: args.newStatus,
      listingTitle: inquiry.listingTitle,
    };

    console.log(`📧 [STATUS-CHANGE-EMAIL] Sending status change notification to guest: ${inquiry.guestEmail}`);

    try {
      const response = await fetch(`${baseUrl}/api/send-inquiry-status-change-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Inquiry-System'
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [STATUS-CHANGE-EMAIL] Failed to send status change email:', errorText);
        return { success: false, error: errorText };
      }

      const result = await response.json();
      console.log(`✅ [STATUS-CHANGE-EMAIL] Status change email sent successfully:`, result);

      return { success: true };
    } catch (error) {
      console.error('❌ [STATUS-CHANGE-EMAIL] Error sending status change email:', error);
      return { success: false, error: String(error) };
    }
  },
});
