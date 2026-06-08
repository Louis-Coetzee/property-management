import { NextRequest, NextResponse } from 'next/server';
import { removeDomainFromProject } from '@/lib/vercel-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Remove www subdomain first (Vercel requirement)
    const wwwDomain = `www.${domain.replace(/^www\./, '')}`;
    let wwwResult = { success: true };

    try {
      wwwResult = await removeDomainFromProject(wwwDomain);
    } catch (error) {
      console.warn(`Failed to remove www domain ${wwwDomain}:`, error);
      // Continue anyway - www might not exist
    }

    // Remove the main domain
    const mainResult = await removeDomainFromProject(domain);

    return NextResponse.json({
      success: mainResult.success,
      wwwResult,
      mainResult,
    });
  } catch (error) {
    console.error('Error removing domains:', error);
    return NextResponse.json(
      { error: 'Failed to remove domains' },
      { status: 500 }
    );
  }
}
