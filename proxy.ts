import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getConvexClient } from '@/lib/convex-http';
import { api } from '@/convex/_generated/api';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || '';

const primaryDomainCache = new Map<string, { domain: string | null; timestamp: number }>();
const CACHE_TTL = 60 * 1000;

function isPlatformDomain(domain: string): boolean {
  if (!PLATFORM_DOMAIN) return false;
  return domain === PLATFORM_DOMAIN || domain === `www.${PLATFORM_DOMAIN}`;
}

async function getPrimaryDomain(domain: string): Promise<string | null> {
  const cached = primaryDomainCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.domain;
  }

  try {
    const convex = getConvexClient();
    const website = await convex.query(api.websites.getWebsiteByDomainPublic, { domain });
    
    let primaryDomain: string | null = null;
    
    if (website?.primaryDomain) {
      primaryDomain = website.primaryDomain;
    } else if (website?.domains && Array.isArray(website.domains)) {
      const PRIMARY_DOMAINS = ['.co.za', '.com', '.org', '.net', '.io', '.co.uk', '.org.za'];
      for (const d of website.domains) {
        if (PRIMARY_DOMAINS.some(pd => d.endsWith(pd))) {
          primaryDomain = d;
          break;
        }
      }
      if (!primaryDomain && website.domains.length > 0) {
        primaryDomain = website.domains[0];
      }
    }

    primaryDomainCache.set(domain, { domain: primaryDomain, timestamp: Date.now() });
    return primaryDomain;
  } catch (error) {
    console.error('Error fetching primary domain:', error);
    return null;
  }
}

function securityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none';");
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  let domain = hostname.split(':')[0].replace(/^www\./, '');

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/favicon.ico') ||
    url.pathname.startsWith('/convex/')
  ) {
    return securityHeaders(NextResponse.next());
  }

  if (isPlatformDomain(domain)) {
    return securityHeaders(NextResponse.next());
  }

  const primaryDomain = await getPrimaryDomain(domain);
  
  if (primaryDomain && domain !== primaryDomain) {
    const newUrl = `https://${primaryDomain}${url.pathname}${url.search}`;
    return securityHeaders(NextResponse.redirect(newUrl, 301));
  }

  if (url.pathname === '/') {
    url.pathname = `/${domain}`;
    return securityHeaders(NextResponse.rewrite(url));
  } else if (!url.pathname.startsWith(`/${domain}/`)) {
    url.pathname = `/${domain}${url.pathname}`;
    return securityHeaders(NextResponse.rewrite(url));
  }

  return securityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|convex).*)',
  ],
};