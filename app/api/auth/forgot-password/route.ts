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

    const rateLimitCheck = await convex.query(api.auth.checkPasswordResetRateLimit, {
      ipAddress: clientIp,
      email,
    });

    if (!rateLimitCheck.allowed) {
      return addCorsHeaders(NextResponse.json(
        { 
          message: "If the email exists, a password reset link will be sent",
          cooldownUntil: rateLimitCheck.cooldownUntil
        },
        { status: 200 }
      ), request);
    }

    const result = await convex.mutation(api.auth.requestPasswordReset, {
      email,
      domain,
    });

    await convex.mutation(api.auth.recordPasswordResetRequest, {
      ipAddress: clientIp,
      email,
      domain,
    });

    return addCorsHeaders(NextResponse.json({
      message: "If the email exists, a password reset link will be sent"
    }), request);
  } catch (error: unknown) {
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Password reset request failed" },
      { status: 400 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}