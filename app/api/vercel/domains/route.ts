import { NextRequest, NextResponse } from 'next/server';
import {
  addDomainToProject,
  addWwwRedirectDomain,
  removeDomainFromProject,
  getDomainInfo,
} from '@/lib/vercel-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const domainInfo = await getDomainInfo(domain);

    if (!domainInfo) {
      return NextResponse.json(
        { error: 'Failed to get domain info' },
        { status: 404 }
      );
    }

    return NextResponse.json(domainInfo);
  } catch (error) {
    console.error('Error getting domain info:', error);
    return NextResponse.json(
      { error: 'Failed to get domain info' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, addWwwRedirect } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    console.log('[POST /api/vercel/domains] Adding domain:', domain);
    console.log('[POST /api/vercel/domains] VERCEL_TOKEN exists:', !!process.env.VERCEL_TOKEN);
    console.log('[POST /api/vercel/domains] VERCEL_PROJECT_ID:', process.env.VERCEL_PROJECT_ID);

    // Check if credentials are configured
    if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) {
      console.error('[POST /api/vercel/domains] Vercel credentials not configured');
      return NextResponse.json(
        { error: 'Vercel credentials not configured. Please set VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables.' },
        { status: 500 }
      );
    }

    // Add the main domain
    const result = await addDomainToProject(domain);

    if (!result) {
      console.error('[POST /api/vercel/domains] Failed to add domain, result is null');
      return NextResponse.json(
        { error: 'Failed to add domain to Vercel. Check server logs for details.' },
        { status: 500 }
      );
    }

    // Optionally add www redirect
    let wwwResult = null;
    if (addWwwRedirect) {
      wwwResult = await addWwwRedirectDomain(domain);
    }

    return NextResponse.json({
      success: true,
      domain: result,
      wwwDomain: wwwResult,
    });
  } catch (error) {
    console.error('[POST /api/vercel/domains] Error adding domain:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add domain' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const result = await removeDomainFromProject(domain);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error removing domain:', error);
    return NextResponse.json(
      { error: 'Failed to remove domain' },
      { status: 500 }
    );
  }
}
