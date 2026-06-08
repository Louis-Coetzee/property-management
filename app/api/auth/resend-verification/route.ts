import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-http";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 
         request.headers.get('cf-connecting-ip') || 
         'unknown';
}

export async function POST(request: NextRequest) {
  const convex = getConvexClient();
  try {
    const body = await request.json();
    const { email, domain } = body;

    if (!email || !domain) {
      return addCorsHeaders(NextResponse.json(
        { error: "Email and domain are required" },
        { status: 400 }
      ), request);
    }

    const clientIp = getClientIp(request);

    // Check rate limit for verification emails (3 per hour max)
    const rateLimitCheck = await convex.query(api.auth.checkVerificationRateLimit, {
      ipAddress: clientIp,
      email,
    });

    if (!rateLimitCheck.allowed) {
      return addCorsHeaders(NextResponse.json(
        { 
          message: "If your account exists and is not verified, a verification email has been sent.",
          cooldownUntil: rateLimitCheck.cooldownUntil
        },
        { status: 200 }
      ), request);
    }

    const result = await convex.mutation(api.auth.resendEmailVerification, {
      email,
      domain,
    });

    await convex.mutation(api.auth.recordVerificationRequest, {
      ipAddress: clientIp,
      email,
      domain,
    });

    // Return generic message to prevent email enumeration
    return addCorsHeaders(NextResponse.json({
      message: "If your account exists and is not verified, a verification email has been sent."
    }), request);
  } catch (error: unknown) {
    // Return generic message on error to prevent enumeration
    return addCorsHeaders(NextResponse.json(
      { message: "If your account exists and is not verified, a verification email has been sent." },
      { status: 200 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}