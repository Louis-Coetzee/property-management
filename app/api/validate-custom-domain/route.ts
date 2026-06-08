import { NextRequest, NextResponse } from 'next/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { checkCustomDomainAvailability as checkVercelDomainAvailability } from '@/lib/vercel-api';

async function validateCustomDomain(customDomain: string, excludeWebsiteId?: string) {
  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(customDomain)) {
    return {
      available: false,
      message: 'Invalid domain format. Please enter a valid domain name.',
    };
  }

  try {
    // First check the new domain management system
    const domainMappingCheck = await fetchQuery(api.domainManagement.checkCustomDomainAvailability, {
      customDomain,
      ...(excludeWebsiteId && { excludeEntityId: excludeWebsiteId as any }),
    });

    if (!domainMappingCheck.available) {
      return domainMappingCheck;
    }
  } catch (err) {
    console.error('Error in domainMappingCheck:', err);
  }

  try {
    // Also check the old websites table for backward compatibility
    const legacyCheck = await fetchQuery(api.domainValidation.checkCustomDomainAvailability, {
      customDomain,
      ...(excludeWebsiteId && { excludeWebsiteId: excludeWebsiteId as any }),
    });

    if (!legacyCheck.available) {
      return legacyCheck;
    }
  } catch (err) {
    console.error('Error in legacyCheck:', err);
  }

  // Check availability on Vercel
  try {
    const vercelCheck = await checkVercelDomainAvailability(customDomain, {
      keepIfAvailable: false,
    });

    if (!vercelCheck.available) {
      return {
        available: false,
        message: 'This domain is already in use on Vercel. Please choose another.',
      };
    }
  } catch (err) {
    console.error('Error in vercelCheck:', err);
  }

  return {
    available: true,
    message: 'Domain is available',
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customDomain = searchParams.get('customDomain');
    const excludeWebsiteId = searchParams.get('excludeWebsiteId');

    if (!customDomain) {
      return NextResponse.json(
        { error: 'Custom domain is required' },
        { status: 400 }
      );
    }

    const result = await validateCustomDomain(customDomain, excludeWebsiteId || undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating custom domain:', error);
    return NextResponse.json(
      { error: 'Failed to validate custom domain', available: false, message: 'Validation error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customDomain, excludeWebsiteId } = body;

    if (!customDomain) {
      return NextResponse.json(
        { error: 'Custom domain is required' },
        { status: 400 }
      );
    }

    const result = await validateCustomDomain(customDomain, excludeWebsiteId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating custom domain:', error);
    return NextResponse.json(
      { error: 'Failed to validate custom domain', available: false, message: 'Validation error occurred' },
      { status: 500 }
    );
  }
}
