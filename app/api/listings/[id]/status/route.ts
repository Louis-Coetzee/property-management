import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { convexHttpClient } from '@/lib/convex-http';
import { Id } from '@/convex/_generated/dataModel';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be "active" or "inactive"' },
        { status: 400 }
      );
    }

    const listingId = params.id;

    await convexHttpClient.mutation(api.faListings.updateListingStatus, {
      id: listingId as Id<'listings'>,
      status: status as 'active' | 'inactive',
    });

    return NextResponse.json({
      success: true,
      message: `Listing ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
    });

  } catch (error) {
    console.error('[LISTINGS_STATUS] Error updating status:', error);
    let errorMessage = 'Failed to update listing status';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
