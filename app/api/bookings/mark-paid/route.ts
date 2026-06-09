import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    const { bookingNumber } = await request.json();

    if (!bookingNumber) {
      return NextResponse.json({ error: 'Booking number is required' }, { status: 400 });
    }

    console.log('[MARK-PAID] Processing booking:', bookingNumber);

    // Find the inquiry by booking number
    const inquiry = await fetchQuery(api.accommodationInquiries.findInquiryByBookingNumber, {
      bookingNumber
    } as any);

    if (!inquiry) {
      console.error('[MARK-PAID] Inquiry not found for booking:', bookingNumber);
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    console.log('[MARK-PAID] Found inquiry:', inquiry._id, 'current status:', inquiry.status);

    // Update the inquiry status to payment-received
    await fetchMutation(api.accommodationInquiries.updateInquiryStatus, {
      inquiryId: inquiry._id,
      status: 'payment-received'
    } as any);

    console.log('[MARK-PAID] Successfully marked as payment-received');

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
