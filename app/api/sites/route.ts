import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await convex.query(api.auth.validateSession, { token });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      );
    }

    const sites = await convex.query(api.auth.getUserSites, {
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      sites,
    });

  } catch (error) {
    console.error('Get sites error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, domain, isActive } = await request.json();

    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await convex.query(api.auth.validateSession, { token });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!name || !description || !domain) {
      return NextResponse.json(
        { success: false, message: 'Name, description, and domain are required' },
        { status: 400 }
      );
    }

    const result = await convex.mutation(api.auth.createSite, {
      userId: session.user.id,
      name,
      description,
      domain,
      isActive: isActive ?? true,
    });

    return NextResponse.json({
      success: true,
      message: 'Site created successfully',
      siteId: result.siteId,
    });

  } catch (error) {
    console.error('Create site error:', error);

    if (error instanceof Error && error.message.includes('Domain is already taken')) {
      return NextResponse.json(
        { success: false, message: 'Domain is already taken' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
