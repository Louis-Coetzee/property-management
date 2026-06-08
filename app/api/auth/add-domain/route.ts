import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, domain } = body;

    if (!email || !password || !domain) {
      return addCorsHeaders(NextResponse.json(
        { error: "Email, password, and domain are required" },
        { status: 400 }
      ), request);
    }

    const result = await convex.action(api.authActions.addDomainToExistingUserAction, {
      email,
      password,
      domain,
    });

    return addCorsHeaders(NextResponse.json(result), request);
  } catch (error: unknown) {
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Add domain failed" },
      { status: 400 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}