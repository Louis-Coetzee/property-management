import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, contactNumber, password, domain, bio, avatar, createdBy } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !contactNumber || !password || !domain || !createdBy) {
      return addCorsHeaders(NextResponse.json(
        { error: "Missing required fields. Please provide firstName, lastName, email, contactNumber, password, domain, and createdBy" },
        { status: 400 }
      ), request);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return addCorsHeaders(NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      ), request);
    }

    console.log('🔵 [REGISTER-CLIENT] Calling registerClientAction for:', email, 'domain:', domain);

    // Call the registerClientAction which handles both user and client creation
    const result = await convex.action(api.authActions.registerClientAction, {
      firstName,
      lastName,
      email,
      contactNumber,
      password,
      domain,
      bio,
      avatar,
      createdBy,
    });

    console.log('✅ [REGISTER-CLIENT] Client registered successfully:', result);

    return addCorsHeaders(NextResponse.json({
      success: true,
      userId: result.userId,
      clientId: result.clientId,
      message: result.message,
    }), request);

  } catch (error: unknown) {
    console.error('❌ [REGISTER-CLIENT] Error:', error);

    // Handle CLIENT_EXISTS error
    if (error instanceof Error && error.message?.startsWith("CLIENT_EXISTS:")) {
      const errorMessage = error.message.split(":")[1];
      return addCorsHeaders(NextResponse.json(
        {
          error: "CLIENT_EXISTS",
          message: errorMessage || "A client with this email already exists in this domain."
        },
        { status: 409 }
      ), request);
    }

    // Handle duplicate client errors
    if (error instanceof Error && (
      error.message.includes("already exists") ||
      error.message.includes("duplicate")
    )) {
      return addCorsHeaders(NextResponse.json(
        {
          error: "CLIENT_EXISTS",
          message: error.message
        },
        { status: 409 }
      ), request);
    }

    // Generic error handling
    return addCorsHeaders(NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to register client",
        message: "An error occurred while creating the client. Please try again."
      },
      { status: 400 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}
