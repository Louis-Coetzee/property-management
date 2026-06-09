import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    const { bookingNumber } = await request.json();

    if (!bookingNumber) {
      return NextResponse.json({ error: 'Booking number is required' }, { status: 400 });
    }

    const inquiry = await fetchMutation(api.accommodationBookings.findBookingByCode, {
      bookingCode: bookingNumber
    } as any);

    if (!inquiry) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await fetchMutation(api.accommodationBookings.updateBookingStatus, {
      bookingId: inquiry._id,
      status: 'confirmed',
    } as any);

    return NextResponse.json({
      success: true,
      message: 'Booking marked as paid',
      inquiryId: inquiry._id
    });

  } catch (error) {
    console.error('[MARK-PAID] Error marking booking as paid:', error);
    return NextResponse.json({
      error: 'Failed to mark booking as paid',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
