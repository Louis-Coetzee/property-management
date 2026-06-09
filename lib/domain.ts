const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'refreshcrm.vercel.app';
const PLATFORM_DOMAIN_SHORT = 'refreshcrm';

export function isPlatformDomain(domain?: string | null): boolean {
  if (!domain) return false;
  return (
    domain === PLATFORM_DOMAIN_SHORT ||
    domain === PLATFORM_DOMAIN ||
    domain === 'refresh-tech' ||
    domain.includes(PLATFORM_DOMAIN)
  );
}

export function getPlatformDomain(): string {
  return PLATFORM_DOMAIN;
}

export function stripPlatformDomain(domain: string): string {
  return domain
    .replace(`.${PLATFORM_DOMAIN}`, '')
    .replace('.vercel.app', '');
}

export function isNotPlatformDomain(domain?: string | null): boolean {
  if (!domain) return false;
  return domain !== PLATFORM_DOMAIN && !domain.endsWith(`.${PLATFORM_DOMAIN}`);
}
