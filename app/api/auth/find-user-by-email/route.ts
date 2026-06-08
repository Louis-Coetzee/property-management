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
    const { email } = await request.json();
    
    console.log('🔍 [Find User By Email] Request for email:', email);

    if (!email) {
      const response = NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // Find user by email
    const user = await convex.query(api.auth.getUserByEmail, {
      email: email.toLowerCase().trim(),
    });

    console.log('🔍 [Find User By Email] User found:', {
      hasUser: !!user,
      email: user?.email,
      userId: user?._id,
    });

    if (!user) {
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, request);
    }

    console.log('✅ [Find User By Email] Returning user ID for:', user.email);

    const response = NextResponse.json({ 
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }, { status: 200 });
    return addCorsHeaders(response, request);

  } catch (error) {
    console.error('❌ [Find User By Email] Error occurred:', error);
    const response = NextResponse.json(
      { error: 'Failed to find user by email' },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}