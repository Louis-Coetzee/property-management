import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-http";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function POST(request: NextRequest) {
  const convex = getConvexClient();
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return addCorsHeaders(NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      ), request);
    }

    const result = await convex.action(api.authActions.resetPasswordAction, {
      token,
      newPassword,
    });

    return addCorsHeaders(NextResponse.json(result), request);
  } catch (error: unknown) {
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Password reset failed" },
      { status: 400 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}