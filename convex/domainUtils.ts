const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || 'refreshcrm.vercel.app';

export function getPlatformDomain(): string {
  return PLATFORM_DOMAIN;
}

export function isNotPlatformDomain(domain?: string | null): boolean {
  if (!domain) return false;
  return domain !== PLATFORM_DOMAIN && !domain.endsWith(`.${PLATFORM_DOMAIN}`);
}

export function stripPlatformDomain(domain: string): string {
  return domain
    .replace(`.${PLATFORM_DOMAIN}`, '')
    .replace('.vercel.app', '');
}
