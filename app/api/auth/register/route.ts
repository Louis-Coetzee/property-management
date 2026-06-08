import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, contactNumber, password, domain, termsAccepted, isConsultantCreation, requirePasswordChange } = body;

    if (!firstName || !lastName || !email || !contactNumber || !password || !domain) {
      return addCorsHeaders(NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      ), request);
    }

    // Skip terms validation for consultant creation by admin users
    if (!termsAccepted && !isConsultantCreation) {
      return addCorsHeaders(NextResponse.json(
        { error: "You must accept the terms and conditions" },
        { status: 400 }
      ), request);
    }

    const result = await convex.action(api.authActions.registerUserAction, {
      firstName,
      lastName,
      email,
      contactNumber,
      password,
      domain,
      requirePasswordChange: requirePasswordChange || false,
    });

    return addCorsHeaders(NextResponse.json(result), request);
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.startsWith("EXISTING_USER:")) {
      const userId = error.message.split(":")[1];
      return addCorsHeaders(NextResponse.json(
        { 
          error: "EXISTING_USER",
          userId,
          message: "An account with this email already exists. Please login and add this domain to your account."
        },
        { status: 409 }
      ), request);
    }

    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}