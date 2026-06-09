import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      listingId,
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      message,
    } = data;

    if (!listingId || !guestName || !guestEmail || !checkInDate || !checkOutDate || !numberOfGuests) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkOut <= checkIn) {
      return NextResponse.json(
        { success: false, message: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    let inquiryId;
    try {
      inquiryId = await convex.mutation(api.accommodationInquiries.createInquiry, {
        listingId: listingId as Id<"listings">,
        guestName,
        guestEmail,
        guestPhone,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        message,
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to create inquiry', error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry submitted successfully. You will receive a confirmation email shortly.',
      inquiry: {
        _id: inquiryId,
        listingId,
        guestName,
        guestEmail,
        checkInDate,
        checkOutDate,
        numberOfGuests,
      },
    });
  } catch (error) {
    console.error('[INQUIRIES-API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
