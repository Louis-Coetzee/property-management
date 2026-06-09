import { ConvexError, v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const appUrl = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN 
  ? `https://${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN}` 
  : 'https://refreshcrm.vercel.app';

// Check new listing against all active alerts and send notifications
export const checkNewListingAgainstAlerts = action({
  args: {
    newListingId: v.id("listings"),
  },
  handler: async (ctx, args): Promise<{ processed: number; emailsSent?: number; listingTitle?: string; error?: string }> => {
    try {
      const listing = await ctx.runQuery(api.listings.getListingById, {
        id: args.newListingId,
      });

      if (!listing) {
        return { processed: 0 };
      }

      if (listing.status !== 'active') {
        return { processed: 0 };
      }

      const allActiveAlerts = await ctx.runQuery(api.alerts.getAllActiveAlerts);
      
      if (allActiveAlerts.length === 0) {
        return { processed: 0 };
      }

      let emailsSent = 0;
      const promises: Promise<any>[] = [];

      for (const alert of allActiveAlerts) {
        const matches = checkListingMatchesAlert(listing, alert);

        if (matches) {
          const promise = ctx.runAction(api.alerts.sendAlertNotifications, {
            alertId: alert._id,
            newListingId: args.newListingId,
          });
          promises.push(promise);
        }
      }

      const results = await Promise.allSettled(promises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          emailsSent++;
        }
      });

      return { 
        processed: allActiveAlerts.length, 
        emailsSent,
        listingTitle: listing.title 
      };
    } catch (error) {
      console.error('Error checking new listing against alerts:', error);
      return { processed: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
});

// Helper function to check if a listing matches alert criteria
function checkListingMatchesAlert(listing: any, alert: any): boolean {
  if (listing.status !== 'active') {
    return false;
  }
  
  if (alert.location && alert.location.trim()) {
    const alertParts = alert.location.toLowerCase().split(',').map((part: string) => part.trim()).filter((part: string) => part.length > 0);
    
    const allPartsMatch = alertParts.every((part: string) => {
      return (
        (listing.location.suburb?.toLowerCase().includes(part)) ||
        (listing.location.city?.toLowerCase().includes(part)) ||
        (listing.location.province?.toLowerCase().includes(part)) ||
        (listing.location.country?.toLowerCase().includes(part))
      );
    });
    
    if (!allPartsMatch) {
      return false;
    }
  }

  if (alert.priceMin && listing.pricePerNight < alert.priceMin) {
    return false;
  }
  if (alert.priceMax && listing.pricePerNight > alert.priceMax) {
    return false;
  }

  if (alert.listingTypes && alert.listingTypes.length > 0) {
    if (!alert.listingTypes.includes(listing.propertyType)) {
      return false;
    }
  }

  if (alert.maxGuests && listing.maxGuests < alert.maxGuests) {
    return false;
  }

  if (alert.facilities && alert.facilities.length > 0) {
    const listingAmenities = listing.amenities || [];
    const hasRequiredFacility = alert.facilities.some((facility: string) => 
      listingAmenities.includes(facility)
    );
    if (!hasRequiredFacility) {
      return false;
    }
  }

  return true;
}

// Create a new alert
export const createAlert = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    location: v.string(),
    priceMin: v.optional(v.number()),
    priceMax: v.optional(v.number()),
    listingTypes: v.optional(v.array(v.string())),
    maxGuests: v.optional(v.number()),
    facilities: v.optional(v.array(v.string())),
    frequency: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    const alertId = await ctx.db.insert("alerts", {
      userId: args.userId,
      name: args.name,
      location: args.location,
      priceMin: args.priceMin,
      priceMax: args.priceMax,
      listingTypes: args.listingTypes,
      maxGuests: args.maxGuests,
      facilities: args.facilities,
      isActive: true,
      frequency: args.frequency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return alertId;
  },
});

// Get user's alerts
export const getUserAlerts = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return alerts;
  },
});

// Get active alerts for a user
export const getActiveUserAlerts = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .order("desc")
      .collect();

    return alerts;
  },
});

// Update an alert
export const updateAlert = mutation({
  args: {
    alertId: v.id("alerts"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    priceMin: v.optional(v.number()),
    priceMax: v.optional(v.number()),
    listingTypes: v.optional(v.array(v.string())),
    maxGuests: v.optional(v.number()),
    facilities: v.optional(v.array(v.string())),
    frequency: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { alertId, userId, ...updates } = args;

    const alert = await ctx.db.get(alertId);
    if (!alert) {
      throw new ConvexError("Alert not found");
    }

    if (alert.userId !== userId) {
      throw new ConvexError("Unauthorized: You don't own this alert");
    }

    await ctx.db.patch(alertId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(alertId);
  },
});

// Delete an alert
export const deleteAlert = mutation({
  args: {
    alertId: v.id("alerts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { alertId, userId } = args;

    const alert = await ctx.db.get(alertId);
    if (!alert) {
      throw new ConvexError("Alert not found");
    }

    if (alert.userId !== userId) {
      throw new ConvexError("Unauthorized: You don't own this alert");
    }

    await ctx.db.delete(alertId);

    return { success: true };
  },
});

// Toggle alert active status
export const toggleAlert = mutation({
  args: { 
    alertId: v.id("alerts"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const { alertId, userId } = args;
    
    const alert = await ctx.db.get(alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    if (alert.userId !== userId) {
      throw new Error("Not authorized to modify this alert");
    }
    
    await ctx.db.patch(alertId, {
      isActive: !alert.isActive,
    });
    
    return alert;
  },
});

// Find matching listings for an alert
export const findMatchingListings = query({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new ConvexError("Alert not found");
    }

    let listings = await ctx.db.query("listings").collect();

    if (alert.location) {
      listings = listings.filter(listing => 
        listing.location?.city?.toLowerCase().includes(alert.location.toLowerCase()) ||
        listing.location?.province?.toLowerCase().includes(alert.location.toLowerCase()) ||
        listing.location?.country?.toLowerCase().includes(alert.location.toLowerCase())
      );
    }

    if (alert.priceMin !== undefined) {
      listings = listings.filter(listing => listing.pricePerNight >= alert.priceMin!);
    }
    if (alert.priceMax !== undefined) {
      listings = listings.filter(listing => listing.pricePerNight <= alert.priceMax!);
    }

    if (alert.listingTypes && alert.listingTypes.length > 0) {
      listings = listings.filter(listing => 
        alert.listingTypes!.includes(listing.propertyType)
      );
    }

    if (alert.maxGuests !== undefined) {
      listings = listings.filter(listing => 
        listing.maxGuests >= alert.maxGuests!
      );
    }

    if (alert.facilities && alert.facilities.length > 0) {
      listings = listings.filter(listing => {
        if (!listing.amenities || listing.amenities.length === 0) return false;
        return alert.facilities!.every(facility => 
          listing.amenities!.some(amenity => 
            amenity.toLowerCase().includes(facility.toLowerCase())
          )
        );
      });
    }

    const listingsWithOwners = await Promise.all(
      listings.map(async (listing) => {
        const owner = listing.ownerId ? await ctx.db.get(listing.ownerId) : null;
        return {
          ...listing,
          owner: owner ? {
            _id: owner._id,
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
            profileImage: owner.profileImage,
          } : null,
        };
      })
    );

    return listingsWithOwners;
  },
});

// Send alert notifications (action for email sending)
export const sendAlertNotifications = action({
  args: {
    alertId: v.id("alerts"),
    newListingId: v.id("listings"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; emailSent?: boolean; error?: string }> => {
    try {
      const alert = await ctx.runQuery(api.alerts.getAlert, {
        alertId: args.alertId,
      });

      if (!alert) {
        throw new Error("Alert not found");
      }

      // Get user via query (actions can't use ctx.db directly)
      const user = await ctx.runQuery(api.admin.getUserByIdAdmin, {
        userId: alert.userId,
      });

      if (!user) {
        throw new Error("User not found");
      }

      const listing = await ctx.runQuery(api.listings.getListingById, {
        id: args.newListingId,
      });

      if (!listing) {
        throw new Error("Listing not found");
      }

      const emailData = {
        userEmail: user.email,
        userName: user.firstName || user.email,
        alertName: alert.name,
        listing: {
          id: listing._id,
          title: listing.title,
          description: listing.description,
          pricePerNight: listing.pricePerNight,
          currency: listing.currency || 'ZAR',
          location: listing.location,
          propertyType: listing.propertyType,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          maxGuests: listing.maxGuests,
          coverImage: listing.featuredImage,
          featuredImage: listing.featuredImage,
        },
      };
      
      const apiUrl = `${appUrl}/api/send-alert-email`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Action-Alert-System',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${response.statusText} - ${errorText}`);
      }

      return { success: true, emailSent: true };
    } catch (error) {
      console.error('Error sending alert notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
});

// Get all active alerts
export const getAllActiveAlerts = query({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    return alerts;
  },
});

// Get a single alert by ID
export const getAlert = query({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    return alert;
  },
});

// Get alert statistics
export const getAlertStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeAlerts = alerts.filter(alert => alert.isActive);
    const inactiveAlerts = alerts.filter(alert => !alert.isActive);

    return {
      total: alerts.length,
      active: activeAlerts.length,
      inactive: inactiveAlerts.length,
    };
  },
});

// Manual trigger for testing alerts against existing listings
export const manualTriggerAlertsForListing = action({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args): Promise<{ processed: number; emailsSent?: number; listingTitle?: string; error?: string }> => {
    const result = await ctx.runAction(api.alerts.checkNewListingAgainstAlerts, {
      newListingId: args.listingId,
    });
    
    return result;
  },
});
