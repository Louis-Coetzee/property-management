import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Try to get session token from Authorization header first, then cookie
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : request.cookies.get("session")?.value;

    console.log('Logout - Auth header:', authHeader ? 'Present' : 'Not present');
    console.log('Logout - Cookie:', request.cookies.get("session")?.value ? 'Present' : 'Not present');

    if (sessionToken) {
      await convex.mutation(api.auth.logoutUser, { sessionToken });
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    
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
  } catch (error: unknown) {
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Logout failed" },
      { status: 400 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}