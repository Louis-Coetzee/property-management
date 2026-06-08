import { NextRequest, NextResponse } from 'next/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { checkCustomDomainAvailability as checkVercelDomainAvailability } from '@/lib/vercel-api';

const SUBDOMAIN_BASE = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';

async function validateSubdomain(subdomain: string, excludeWebsiteId?: string) {
  // Check subdomain format first
  const formatValidation = await fetchQuery(api.domainValidation.validateSubdomainFormat, {
    subdomain,
  });

  if (!formatValidation.valid) {
    return {
      available: false,
      message: formatValidation.message,
    };
  }

  // Check subdomain availability in both the new domainMappings table and the old websites table for backward compatibility

  // First check the new domain management system
  const domainMappingCheck = await fetchQuery(api.domainManagement.checkSubdomainAvailability, {
    subdomain,
    ...(excludeWebsiteId && { excludeEntityId: excludeWebsiteId as any }),
  });

  if (!domainMappingCheck.available) {
    return domainMappingCheck;
  }

  // Also check the old websites table for backward compatibility
  const legacyCheck = await fetchQuery(api.domainValidation.checkSubdomainAvailability, {
    subdomain,
    ...(excludeWebsiteId && { excludeWebsiteId: excludeWebsiteId as any }),
  });

  if (!legacyCheck.available) {
    return legacyCheck;
  }

  // Check subdomain availability on Vercel
  // Construct full subdomain (e.g., "test.livewebapp.site")
  const fullSubdomain = `${subdomain.toLowerCase()}.${SUBDOMAIN_BASE}`;

  const vercelCheck = await checkVercelDomainAvailability(fullSubdomain, {
    keepIfAvailable: false, // Don't keep the domain after validation
  });

  if (!vercelCheck.available) {
    return {
      available: false,
      message: 'This subdomain is not available. Please choose another.',
    };
  }

  return {
    available: true,
    message: 'Subdomain is available',
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subdomain = searchParams.get('subdomain');
    const excludeWebsiteId = searchParams.get('excludeWebsiteId');

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const result = await validateSubdomain(subdomain, excludeWebsiteId || undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating subdomain:', error);
    return NextResponse.json(
      { error: 'Failed to validate subdomain', available: false, message: 'Validation error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subdomain, excludeWebsiteId } = body;

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const result = await validateSubdomain(subdomain, excludeWebsiteId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating subdomain:', error);
    return NextResponse.json(
      { error: 'Failed to validate subdomain', available: false, message: 'Validation error occurred' },
      { status: 500 }
    );
  }
}
