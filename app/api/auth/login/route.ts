import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

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
  try {
    const body = await request.json();
    const { email, password, domain } = body;

    if (!email || !password || !domain) {
      return addCorsHeaders(NextResponse.json(
        { error: "Email, password, and domain are required" },
        { status: 400 }
      ), request);
    }

    const clientIp = getClientIp(request);
    
    const rateLimitCheck = await convex.query(api.auth.checkLoginRateLimit, {
      ipAddress: clientIp,
      email,
    });

    if (!rateLimitCheck.allowed) {
      if ('locked' in rateLimitCheck && rateLimitCheck.locked) {
        return addCorsHeaders(NextResponse.json(
          { 
            error: "Too many failed login attempts. Please try again later.",
            lockedUntil: rateLimitCheck.lockedUntil
          },
          { status: 429 }
        ), request);
      }
    }

    const result = await convex.action(api.authActions.loginUserAction, {
      email,
      password,
      domain,
    });

    console.log('🔍 Login API: Convex action result:', {
      success: result.success,
      hasSessionToken: !!result.sessionToken,
      sessionTokenLength: result.sessionToken?.length,
      hasUser: !!result.user
    });

    if (result.success && result.sessionToken) {
      await convex.mutation(api.auth.clearLoginRateLimit, {
        ipAddress: clientIp,
        email,
      });

      const response = NextResponse.json({
        success: true,
        user: result.user,
        message: "Login successful",
        sessionToken: result.sessionToken
      });

      const isProduction = process.env.NODE_ENV === 'production';
      const origin = request.headers.get('origin');
      const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');
      
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction && !isLocalhost,
        sameSite: (isProduction && !isLocalhost) ? "none" as const : "lax" as const,
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      };

      response.cookies.set("session", result.sessionToken, cookieOptions);

      const sameSiteValue = (isProduction && !isLocalhost) ? 'None' : 'Lax';
      const secureFlag = (isProduction && !isLocalhost) ? '; Secure' : '';
      const cookieValue = `session=${result.sessionToken}; Path=/; HttpOnly${secureFlag}; SameSite=${sameSiteValue}; Max-Age=${7 * 24 * 60 * 60}`;
      response.headers.set('Set-Cookie', cookieValue);

      return addCorsHeaders(response, request);
    }

    if (result.success === false) {
      await convex.mutation(api.auth.recordFailedLoginAttempt, {
        ipAddress: clientIp,
        email,
        domain,
      });

      const updatedRateLimit = await convex.query(api.auth.checkLoginRateLimit, {
        ipAddress: clientIp,
        email,
      });

      if (!updatedRateLimit.allowed && 'locked' in updatedRateLimit && updatedRateLimit.locked) {
        return addCorsHeaders(NextResponse.json(
          { 
            error: "Too many failed login attempts. Account is temporarily locked for 15 minutes.",
            lockedUntil: updatedRateLimit.lockedUntil,
            remainingAttempts: 0
          },
          { status: 429 }
        ), request);
      }

      return addCorsHeaders(NextResponse.json({
        ...result,
        remainingAttempts: 'remainingAttempts' in updatedRateLimit ? updatedRateLimit.remainingAttempts : 0,
        warning: 'warning' in updatedRateLimit ? updatedRateLimit.warning : undefined
      }), request);
    }

    return addCorsHeaders(NextResponse.json(result), request);
  } catch (error: unknown) {
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 400 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}