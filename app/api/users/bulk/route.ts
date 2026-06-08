import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, handleCorsOptions } from '@/lib/cors';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { Id } from '@/convex/_generated/dataModel';

// Force ensure Convex client is properly initialized
const convexUrl = process.env.CONVEX_URL;
if (!convexUrl) {
  throw new Error('CONVEX_URL environment variable is not set');
}
const convex = new ConvexHttpClient(convexUrl);

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  console.log('🚀 [Bulk User Data] POST endpoint hit');
  console.log('🚀 [Bulk User Data] Request URL:', request.url);
  console.log('🚀 [Bulk User Data] Request method:', request.method);
  console.log('🚀 [Bulk User Data] CONVEX_URL available:', !!process.env.CONVEX_URL);
  
  try {
    const body = await request.text();
    console.log('🚀 [Bulk User Data] Raw body:', body.substring(0, 200));
    
    const parsedBody = JSON.parse(body);
    const { userIds } = parsedBody;
    
    console.log('🔍 [Bulk User Data] Request for userIds:', userIds);
    console.log('🔍 [Bulk User Data] UserIds type:', typeof userIds);
    console.log('🔍 [Bulk User Data] UserIds is array:', Array.isArray(userIds));

    if (!userIds || !Array.isArray(userIds)) {
      const response = NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    if (userIds.length === 0) {
      const response = NextResponse.json({ userDataMap: {} }, { status: 200 });
      return addCorsHeaders(response, request);
    }

    // Fetch user data for all userIds in parallel
    console.log('🔍 [Bulk User Data] Fetching user data for', userIds.length, 'users');
    
    const userDataPromises = userIds.map(async (userId: string) => {
      try {
        console.log('🔍 [Bulk User Data] Fetching data for userId:', userId);
        
        const user = await convex.query(api.auth.getUserById, {
          userId: userId as Id<"users">,
        });

        if (user) {
          const userData = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            contactNumber: user.contactNumber,
          };
          console.log('✅ [Bulk User Data] Found user data for:', userId);
          return { userId, userData };
        } else {
          console.warn('❌ [Bulk User Data] User not found for:', userId);
          return { userId, userData: null };
        }
      } catch (error) {
        console.error(`❌ [Bulk User Data] Error fetching user data for ${userId}:`, error);
        return { userId, userData: null };
      }
    });

    const results = await Promise.all(userDataPromises);
    
    // Convert to object for easier lookup
    const userDataMap = results.reduce((acc, { userId, userData }) => {
      acc[userId] = userData ? { userData } : null;
      return acc;
    }, {} as Record<string, unknown>);

    console.log('✅ [Bulk User Data] Successfully fetched user data for', 
      Object.keys(userDataMap).filter(id => userDataMap[id] !== null).length, 
      'out of', userIds.length, 'users');

    const response = NextResponse.json({ userDataMap }, { status: 200 });
    return addCorsHeaders(response, request);

  } catch (error) {
    console.error('❌ [Bulk User Data] Error occurred:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch bulk user data' },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}
