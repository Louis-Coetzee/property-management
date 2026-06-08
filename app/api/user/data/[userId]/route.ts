import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-http";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";
import { Id } from "@/convex/_generated/dataModel";

async function getCurrentUser(request: NextRequest, convex: ReturnType<typeof getConvexClient>) {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) return null;
  
  const sessionData = await convex.query(api.auth.verifySession, {
    sessionToken: sessionCookie.value,
  });
  
  if (!sessionData?.userId) return null;
  
  const user = await convex.query(api.auth.getUserById, {
    userId: sessionData.userId as Id<"users">,
  });
  
  return user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const convex = getConvexClient();
    const { userId } = await params;

    if (!userId) {
      return addCorsHeaders(
        NextResponse.json(
          { error: "User ID is required" },
          { status: 400 }
        ),
        request
      );
    }

    const currentUser = await getCurrentUser(request, convex);
    
    if (!currentUser) {
      return addCorsHeaders(
        NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        ),
        request
      );
    }

    const isAdmin = currentUser.apps && Object.values(currentUser.apps).some(
      (app) => app && typeof app === 'object' && 'role' in app && 
      (app.role === 'admin' || app.role === 'owner')
    );

    if (currentUser._id !== userId && !isAdmin) {
      return addCorsHeaders(
        NextResponse.json(
          { error: "You do not have permission to access this user data" },
          { status: 403 }
        ),
        request
      );
    }

    const user = await convex.query(api.auth.getUserById, {
      userId: userId as Id<"users">,
    });

    if (!user) {
      return addCorsHeaders(
        NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        ),
        request
      );
    }

    const userData = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      isEmailVerified: user.isEmailVerified,
      apps: user.apps,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return addCorsHeaders(NextResponse.json(userData), request);
  } catch (error: unknown) {
    console.error("[Get User Data] Error:", error);
    return addCorsHeaders(
      NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Failed to get user data",
        },
        { status: 500 }
      ),
      request
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}
