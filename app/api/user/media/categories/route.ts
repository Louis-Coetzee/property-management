import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

// Helper function to get user from session token
async function getUserFromToken(token: string) {
  try {
    const user = await convex.query(api.auth.getUserBySession, { sessionToken: token });
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

// Helper function to extract session token from request
function getSessionToken(request: NextRequest): string | undefined {
  // Try cookies first
  let sessionToken = request.cookies.get("sessionToken")?.value ||
                     request.cookies.get("session")?.value ||
                     request.cookies.get("session_token")?.value;

  // If no cookie found, try headers
  if (!sessionToken) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      sessionToken = authHeader.substring(7);
    } else {
      sessionToken = request.headers.get("x-session-token") || undefined;
    }
  }

  return sessionToken;
}

// GET - Fetch all categories for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const sessionToken = getSessionToken(request);

    if (!sessionToken) {
      return addCorsHeaders(NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ), request);
    }

    const user = await getUserFromToken(sessionToken);

    if (!user) {
      return addCorsHeaders(NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      ), request);
    }

    // Fetch user's categories from Convex
    const categories = await convex.query(api.media.getMediaCategories, { userId: user.id });

    return addCorsHeaders(NextResponse.json({
      success: true,
      categories: categories,
    }), request);
  } catch (error: unknown) {
    console.error("Error fetching media categories:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch categories";
    return addCorsHeaders(NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    ), request);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = getSessionToken(request);

    if (!sessionToken) {
      return addCorsHeaders(NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ), request);
    }

    const user = await getUserFromToken(sessionToken);

    if (!user) {
      return addCorsHeaders(NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      ), request);
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return addCorsHeaders(NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      ), request);
    }

    // Create category in Convex
    const categoryId = await convex.mutation(api.media.createMediaCategory, {
      userId: user.id,
      name: name.trim(),
      description: description?.trim(),
    });

    return addCorsHeaders(NextResponse.json({
      success: true,
      categoryId,
      message: "Category created successfully",
    }), request);
  } catch (error: unknown) {
    console.error("Error creating media category:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create category";
    return addCorsHeaders(NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}