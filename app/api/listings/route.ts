import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { convexHttpClient } from '@/lib/convex-http';
import { Id } from '@/convex/_generated/dataModel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      companyId,
      title,
      description,
      propertyType,
      location,
      pricePerNight,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities,
      images,
      isActive = false
    } = body;

    if (!userId || !companyId || !title || !description || !propertyType || !location || !pricePerNight) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    let userData;
    try {
      userData = await convexHttpClient.query(api.auth.getUserById, {
        userId: userId as Id<"users">
      });
      if (!userData) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const listingData = {
      title,
      description,
      shortDescription: description.substring(0, 150) + '...',
      propertyType,
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseFloat(bathrooms) || 1,
      maxGuests: parseInt(maxGuests) || 2,
      location: {
        country: location.country || 'South Africa',
        province: location.province || location.city || 'Unknown',
        city: location.city || location.suburb || 'Unknown',
        suburb: location.suburb || '',
        address: location.address || `${location.suburb || location.city || 'Unknown'}, ${location.province || location.city || 'Unknown'}`,
        buildingName: location.buildingName || undefined,
        locationId: location.locationId || undefined,
        postalCode: location.postalCode || undefined,
        streetAddress: location.streetAddress || undefined,
        unitNumber: location.unitNumber || undefined,
      },
      pricePerNight: parseFloat(pricePerNight),
      currency: 'ZAR',
      cleaningFee: null,
      securityDeposit: null,
      amenities: amenities || [],
      images: images || [],
      featuredImage: images && images.length > 0 ? images[0] : null,
      availableFrom: new Date().toISOString().split('T')[0],
      availableTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minimumStay: 1,
      maximumStay: null,
      contactEmail: userData.email,
      contactPhone: userData.contactNumber || undefined,
      houseRules: undefined,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Moderate',
      companyId: companyId,
      isFeatured: false,
      ownerId: userId as Id<"users">,
    };

    const listingId = await convexHttpClient.mutation(api.faListings.createListing, listingData);

    return NextResponse.json({
      success: true,
      message: 'Listing created successfully',
      listingId,
    });

  } catch (error) {
    console.error('[LISTINGS] Error creating listing:', error);
    let errorMessage = 'Failed to create listing';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
