import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    // Try multiple ways to get session token
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

    if (!sessionToken) {
      return addCorsHeaders(NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ), request);
    }

    const user = await convex.query(api.auth.getUserBySession, { sessionToken });

    if (!user) {
      return addCorsHeaders(NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      ), request);
    }

    const media = await convex.query(api.media.getUserMedia, { userId: user.id });
    const categories = await convex.query(api.media.getUserCategories, { userId: user.id });

    return addCorsHeaders(NextResponse.json({ 
      success: true,
      media: media || [],
      categories: categories || [],
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: user.profileImage
      }
    }), request);
  } catch (error: unknown) {
    console.error("Error fetching user media:", error);
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch media" },
      { status: 500 }
    ), request);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try multiple ways to get session token
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

    if (!sessionToken) {
      return addCorsHeaders(NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ), request);
    }

    const user = await convex.query(api.auth.getUserBySession, { sessionToken });

    if (!user) {
      return addCorsHeaders(NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      ), request);
    }

    const body = await request.json();
    const { url, filename, fileType, fileSize, categories } = body;

    if (!url || !filename || !fileType) {
      return addCorsHeaders(NextResponse.json(
        { error: "Missing required fields: url, filename, fileType" },
        { status: 400 }
      ), request);
    }

    // Get user's companies to associate the media with a company
    const userCompanies = await convex.query(api.companies.getCompaniesByUser, { userId: user.id as Id<"users"> });
    if (!userCompanies || userCompanies.length === 0) {
      return addCorsHeaders(NextResponse.json(
        { error: "User must belong to a company to upload media" },
        { status: 400 }
      ), request);
    }
    const firstCompany = userCompanies[0];
    if (!firstCompany) {
      return addCorsHeaders(NextResponse.json(
        { error: "No valid company found" },
        { status: 400 }
      ), request);
    }
    const companyId = firstCompany._id;

    // Create media record in Convex
    const mediaId = await convex.mutation(api.media.add, {
      userId: user.id,
      companyId,
      url,
      filename,
      fileType,
      fileSize: fileSize || 0,
      categories: categories || [],
    });

    return addCorsHeaders(NextResponse.json({
      success: true,
      mediaId,
      message: "Media uploaded successfully",
    }), request);
  } catch (error: unknown) {
    console.error("Error creating media record:", error);
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create media record" },
      { status: 500 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}