import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, handleCorsOptions } from '@/lib/cors';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import bcrypt from 'bcryptjs';

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword, newPasswordExpiryDate } = body;

    let userId;
    
    // Check if we have email+password authentication (for login flows)
    if (email && currentPassword) {
      console.log('🔍 [Change Password] Using email+password authentication');
      
      // Find user by email
      const user = await convex.query(api.auth.getUserByEmail, { email });
      if (!user) {
        const response = NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
        return addCorsHeaders(response, request);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        const response = NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
        return addCorsHeaders(response, request);
      }

      userId = user._id;
    } else {
      // Fall back to session-based authentication
      console.log('🔍 [Change Password] Using session authentication');
      
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

      // Get user to verify current password
      const user = await convex.query(api.auth.getUserById, {
        userId: sessionData.userId,
      });

      if (!user) {
        const response = NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
        return addCorsHeaders(response, request);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        const response = NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
        return addCorsHeaders(response, request);
      }

      userId = sessionData.userId;
    }

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      const response = NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Calculate password expiry (6 months from now if not provided)
    const expiryDate = newPasswordExpiryDate || new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString();

    // Update password with expiry
    await convex.mutation(api.auth.changePasswordWithExpiry, {
      userId,
      newPasswordHash,
      passwordExpiresAt: new Date(expiryDate).getTime(),
      requirePasswordChange: false, // Clear the flag since they just changed it
    });

    const response = NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );
    return addCorsHeaders(response, request);

  } catch (error) {
    console.error('Password change error:', error);
    const response = NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}