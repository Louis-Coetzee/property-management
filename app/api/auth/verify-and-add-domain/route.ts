import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-http";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function POST(request: NextRequest) {
  const convex = getConvexClient();
  try {
    const body = await request.json();
    const { email, password, domain } = body;

    if (!email || !password || !domain) {
      return addCorsHeaders(NextResponse.json(
        { error: "Email, password, and domain are required" },
        { status: 400 }
      ), request);
    }

    // Call the Convex action to verify password and add domain access
    const result = await convex.action(api.authActions.verifyAndAddDomainAction, {
      email,
      password,
      domain,
    });

    if (!result.success) {
      return addCorsHeaders(NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      ), request);
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      userId: result.userId,
      message: result.message,
    }), request);
  } catch (error: unknown) {
    console.error('Error verifying user and adding domain:', error);
    return addCorsHeaders(NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Verification failed" 
      },
      { status: 500 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}


