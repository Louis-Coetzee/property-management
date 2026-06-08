import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-http";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function GET(request: NextRequest) {
  const convex = getConvexClient();
  try {
    // Try to get session token from Authorization header first, then cookie
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : request.cookies.get("session")?.value;

    console.log('Session check - Auth header:', authHeader ? 'Present' : 'Not present');
    console.log('Session check - Cookie:', request.cookies.get("session")?.value ? 'Present' : 'Not present');
    console.log('Session check - Using token from:', authHeader ? 'Authorization header' : 'Cookie');

    if (!sessionToken) {
      return addCorsHeaders(NextResponse.json(
        { error: "No session found" },
        { status: 401 }
      ), request);
    }

    const user = await convex.query(api.auth.getUserBySession, { sessionToken });

    if (!user) {
      const response = NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
      
      // Clear cookie with same options as when it was set
      const isProduction = process.env.NODE_ENV === 'production';
      const origin = request.headers.get('origin');
      const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');
      
      response.cookies.set("session", "", {
        httpOnly: true,
        secure: isProduction && !isLocalhost,
        sameSite: (isProduction && !isLocalhost) ? "none" as const : "lax" as const,
        maxAge: 0,
        path: "/",
        // Remove domain restriction
      });

      // Also clear via header
      const sameSiteValue = (isProduction && !isLocalhost) ? 'None' : 'Lax';
      const secureFlag = (isProduction && !isLocalhost) ? '; Secure' : '';
      const cookieValue = `session=; Path=/; HttpOnly${secureFlag}; SameSite=${sameSiteValue}; Max-Age=0`;
      response.headers.set('Set-Cookie', cookieValue);

      return addCorsHeaders(response, request);
    }

    return addCorsHeaders(NextResponse.json({ user }), request);
  } catch (error: unknown) {
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Session validation failed" },
      { status: 500 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}