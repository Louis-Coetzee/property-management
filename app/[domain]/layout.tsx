import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConvexProvider } from './ConvexProvider';
import { AuthProvider } from './AuthProvider';
import { DomainLayoutWrapper } from './DomainLayoutWrapper';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { isPlatformDomain } from '@/lib/domain';
import { redirect } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default async function DomainLayout({
  children,
  params}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  const isDefaultDomain = isPlatformDomain(domain);

  if (isDefaultDomain) {
    return (
      <>
        <link rel="icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {children}
      </>
    );
  }

  let faviconUrl: string | null = null;
  let websiteName = domain;

  try {
    const website = await fetchQuery(api.websites.getWebsiteByDomainPublic, { domain });
    
    if (website) {
      faviconUrl = website.branding?.faviconUrl || null;
      websiteName = website.name;
    }
  } catch (error) {
    console.error('Error fetching website for favicon:', error);
  }

  return (
    <>
      {faviconUrl && (
        <>
          <link rel="icon" type="image/png" href={faviconUrl} />
          <link rel="apple-touch-icon" href={faviconUrl} />
        </>
      )}
      {!faviconUrl && (
        <>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        </>
      )}

      <ConvexProvider>
        <AuthProvider domain={domain}>
          <DomainLayoutWrapper domain={domain} interClassName={inter.className}>
            {children}
          </DomainLayoutWrapper>
        </AuthProvider>
      </ConvexProvider>
    </>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;

  const isDefaultDomain = isPlatformDomain(domain);

  let websiteName = domain;
  let websiteDescription = `Website for ${domain}`;
  let faviconUrl: string | null = null;

  try {
    // Get website by domain (checks domainMappings first, then websites.domains)
    const website = await fetchQuery(api.websites.getWebsiteByDomainPublic, { domain });
    
    if (website) {
      websiteName = website.name;
      websiteDescription = website.description || websiteDescription;
      faviconUrl = website.branding?.faviconUrl || null;
    }
  } catch (error) {
    console.error('Error fetching website for metadata:', error);
  }

  // Use default favicon for the main domain unless website has custom favicon
  if (isDefaultDomain && !faviconUrl) {
    faviconUrl = '/favicon.svg';
  }

  return {
    title: websiteName,
    description: websiteDescription,
    openGraph: {
      title: websiteName,
      description: websiteDescription,
      type: 'website',
      url: `https://${domain}`,
      images: faviconUrl ? [{ url: faviconUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: websiteName,
      description: websiteDescription,
      images: faviconUrl ? [faviconUrl] : [],
    },
    alternates: {
      canonical: `https://${domain}`,
    },
    icons: {
      icon: faviconUrl || '/favicon.ico',
      apple: faviconUrl || '/apple-touch-icon.png'}};
}
