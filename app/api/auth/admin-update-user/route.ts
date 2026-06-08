import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, handleCorsOptions } from '@/lib/cors';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { Id } from '@/convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Admin Update User] Request started');
    
    const body = await request.json();
    const { targetUserId, firstName, lastName, contactNumber } = body;

    console.log('📋 [Admin Update User] Request body:', {
      targetUserId,
      firstName,
      lastName,
      contactNumber,
    });

    // Validate required fields
    if (!targetUserId) {
      console.error('❌ [Admin Update User] Missing target user ID');
      const response = NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // Get session from cookie to verify admin user
    const sessionCookie = request.cookies.get('session');
    console.log('🔐 [Admin Update User] Session cookie found:', !!sessionCookie);
    
    if (!sessionCookie) {
      console.error('❌ [Admin Update User] No session cookie found');
      const response = NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
      return addCorsHeaders(response, request);
    }

    // Verify session and get admin user ID
    console.log('🔍 [Admin Update User] Verifying session...');
    const sessionData = await convex.query(api.auth.verifySession, {
      sessionToken: sessionCookie.value,
    });

    console.log('🔍 [Admin Update User] Session data:', {
      hasUserId: !!sessionData?.userId,
      userId: sessionData?.userId,
    });

    if (!sessionData?.userId) {
      console.error('❌ [Admin Update User] Invalid session - no user ID');
      const response = NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
      return addCorsHeaders(response, request);
    }

    // Get admin user to check permissions
    console.log('👤 [Admin Update User] Getting admin user data...');
    const adminUser = await convex.query(api.auth.getUserById, {
      userId: sessionData.userId,
    });

    console.log('👤 [Admin Update User] Admin user found:', {
      hasUser: !!adminUser,
      email: adminUser?.email,
      hasApps: !!adminUser?.apps,
      apps: adminUser?.apps ? Object.keys(adminUser.apps) : [],
    });

    if (!adminUser) {
      console.error('❌ [Admin Update User] Admin user not found in database');
      const response = NextResponse.json(
        { error: 'Admin user not found' },
        { status: 403 }
      );
      return addCorsHeaders(response, request);
    }

    // Check if admin user has admin privileges on any domain
    console.log('🔒 [Admin Update User] Checking admin permissions...');
    const hasAdminRole = adminUser.apps && Object.values(adminUser.apps).some(
      (app) => app && typeof app === 'object' && 'role' in app && 
      (app.role === 'admin' || app.role === 'owner')
    );

    console.log('🔒 [Admin Update User] Admin role check result:', hasAdminRole);
    if (adminUser.apps) {
      console.log('🔒 [Admin Update User] User roles per domain:', 
        Object.entries(adminUser.apps).map(([domain, app]) => ({
          domain,
          role: app && typeof app === 'object' && 'role' in app ? app.role : 'unknown'
        }))
      );
    }

    if (!hasAdminRole) {
      console.error('❌ [Admin Update User] Insufficient permissions - no admin role found');
      const response = NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      );
      return addCorsHeaders(response, request);
    }

    // Verify target user exists
    console.log('🎯 [Admin Update User] Verifying target user exists...');
    console.log('🎯 [Admin Update User] Target user ID received:', targetUserId);
    console.log('🎯 [Admin Update User] Target user ID type:', typeof targetUserId);
    console.log('🎯 [Admin Update User] Target user ID length:', targetUserId?.length);
    
    const targetUser = await convex.query(api.auth.getUserById, {
      userId: targetUserId as Id<"users">,
    });

    console.log('🎯 [Admin Update User] Target user found:', {
      hasUser: !!targetUser,
      email: targetUser?.email,
      firstName: targetUser?.firstName,
      lastName: targetUser?.lastName,
    });

    if (!targetUser) {
      console.error('❌ [Admin Update User] Target user not found in database');
      const response = NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, request);
    }

    // Update target user profile
    console.log('💾 [Admin Update User] Executing update mutation...');
    const updateData = {
      userId: targetUserId as Id<"users">,
      firstName: firstName || targetUser.firstName,
      lastName: lastName || targetUser.lastName,
      contactNumber: contactNumber || targetUser.contactNumber,
    };
    console.log('💾 [Admin Update User] Update data:', updateData);

    await convex.mutation(api.auth.updateUserProfile, updateData);

    console.log('✅ [Admin Update User] User profile updated successfully');

    const responseData = {
      message: 'User profile updated successfully',
      updatedUser: {
        userId: targetUserId,
        firstName: firstName || targetUser.firstName,
        lastName: lastName || targetUser.lastName,
        contactNumber: contactNumber || targetUser.contactNumber,
      }
    };

    console.log('📤 [Admin Update User] Sending success response:', responseData);

    const response = NextResponse.json(responseData, { status: 200 });
    return addCorsHeaders(response, request);

  } catch (error) {
    console.error('❌ [Admin Update User] Error occurred:', error);
    console.error('❌ [Admin Update User] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    const errorMessage = error instanceof Error ? error.message : 'Failed to update user profile';
    console.error('📤 [Admin Update User] Sending error response:', errorMessage);

    const response = NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}