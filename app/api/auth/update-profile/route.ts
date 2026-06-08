import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, handleCorsOptions } from '@/lib/cors';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, contactNumber } = body;

    // Get session from cookie
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      const response = NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
      return addCorsHeaders(response, request);
    }

    // Verify session and get user ID
    const sessionData = await convex.query(api.auth.verifySession, {
      sessionToken: sessionCookie.value,
    });

    if (!sessionData?.userId) {
      const response = NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
      return addCorsHeaders(response, request);
    }

    // Update user profile
    await convex.mutation(api.auth.updateUserProfile, {
      userId: sessionData.userId,
      firstName,
      lastName,
      contactNumber,
    });

    const response = NextResponse.json(
      { message: 'Profile updated successfully' },
      { status: 200 }
    );
    return addCorsHeaders(response, request);

  } catch (error) {
    console.error('Profile update error:', error);
    const response = NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}