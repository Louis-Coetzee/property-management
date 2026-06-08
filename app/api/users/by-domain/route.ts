import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, handleCorsOptions } from '@/lib/cors';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex-http';

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  const convex = getConvexClient();
  console.log('🚀 [By Domain API] POST endpoint hit');
  console.log('🚀 [By Domain API] Request URL:', request.url);
  console.log('🚀 [By Domain API] CONVEX_URL available:', !!process.env.CONVEX_URL);
  
  try {
    const body = await request.text();
    console.log('🚀 [By Domain API] Raw body:', body.substring(0, 200));
    
    const parsedBody = JSON.parse(body);
    const { domain } = parsedBody;
    
    console.log('🔍 [By Domain API] Request for domain:', domain);

    if (!domain) {
      const response = NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // Fetch all users who have access to this domain
    console.log('🔍 [By Domain API] Fetching users for domain:', domain);
    
    const users = await convex.query(api.auth.getUsersByDomain, {
      domain,
    });

    if (!users) {
      console.log('⚠️ [By Domain API] No users found for domain:', domain);
      const response = NextResponse.json({ users: [] }, { status: 200 });
      return addCorsHeaders(response, request);
    }

    console.log('✅ [By Domain API] Found', users.length, 'users for domain:', domain);

    // Transform the data to the expected format
    const formattedUsers = users.map(user => {
      const domainAccess = user.apps?.[domain];
      
      return {
        id: user._id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: domainAccess?.role || 'user',
        access: domainAccess?.hasAccess || false,
        emailVerified: user.isEmailVerified || false,
        createdAt: user.createdAt || user._creationTime,
        lastLoginAt: null, // lastLoginAt not tracked in schema
      };
    });

    console.log('✅ [By Domain API] Returning', formattedUsers.length, 'formatted users');

    const response = NextResponse.json({ users: formattedUsers }, { status: 200 });
    return addCorsHeaders(response, request);

  } catch (error) {
    console.error('❌ [By Domain API] Error:', error);
    const response = NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}

