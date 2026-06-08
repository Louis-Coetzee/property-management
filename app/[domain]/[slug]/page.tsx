'use client';

import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PageRenderer } from '@/components/page-builder/renderer/PageRenderer';
import { parsePageContent } from '@/lib/page-builder/hooks/usePageContent';
import { Loader2 } from 'lucide-react';

export default function SlugPagePage() {
  const params = useParams();
  const domain = params.domain as string;
  const slug = params.slug as string;

  // Query the website data directly (like home page does)
  const website = useQuery(api.websites.getWebsiteByDomainPublic, { domain });

  // Query to get page by website and slug (public query)
  const page = useQuery(
    api.pages.getPageBySlugPublic,
    website && slug ? { websiteId: website._id, slug } : 'skip'
  );

  // Query the home page to get its slug for navigation comparison
  const homePage = useQuery(
    api.pages.getHomePagePublic,
    website ? { websiteId: website._id } : 'skip'
  );

  // Loading state - wait for all required data before deciding
  // Only show 404 after we're certain the data doesn't exist
  if (website === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // If we have a website and slug, wait for the page to load
  if (website && slug && page === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // No website found for this domain
  if (!website) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
            {domain}
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Site Found
          </h2>
          <p className="text-gray-600">
            This domain doesn't have a website configured.
          </p>
        </div>
      </div>
    );
  }

  // No page found
  if (!website) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
            {domain}
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Site Found
          </h2>
          <p className="text-gray-600">
            This domain doesn't have a website configured.
          </p>
        </div>
      </div>
    );
  }

  // No page found
  if (!page) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // Check if page is published
  if (!page.isPublished) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Page Unavailable
          </h2>
          <p className="text-gray-600">
            This page is not yet published.
          </p>
        </div>
      </div>
    );
  }

  // Check if page is a static site (duplicated site)
  if (page.contentType === 'staticSite') {
    try {
      const staticContent = page.content ? JSON.parse(page.content) : null;
      const htmlContent = staticContent?.htmlContent;

      if (htmlContent) {
        // Render the static site HTML via iframe srcdoc
        return (
          <iframe
            srcDoc={htmlContent}
            className="w-full h-screen border-0"
            title={page.name || 'Static Site'}
            style={{ minHeight: '100vh' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        );
      } else {
        // htmlContent is missing - show error
        console.error('Static site content missing htmlContent:', staticContent);
        return (
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Static Site Error</h2>
              <p className="text-gray-600 mb-4">
                The static site content was not saved properly. Please try duplicating the site again.
              </p>
              <p className="text-sm text-gray-500">
                Missing HTML content in database record.
              </p>
            </div>
          </div>
        );
      }
    } catch (e) {
      console.error('Error parsing static site content:', e);
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Page</h2>
            <p className="text-gray-600">Failed to parse static site content.</p>
          </div>
        </div>
      );
    }
  }

  // Check if page uses page builder
  const isPageBuilder = page.contentType === 'pageBuilder';

  if (isPageBuilder) {
    // Render using page builder
    const pageContent = parsePageContent(page.content);
    const sections = pageContent?.sections ?? [];
    const pointerSettings = pageContent?.pointerSettings ?? null;

    return (
      <div className="w-full">
        {/* SEO Meta Tags */}
        {page.title && (
          <title>{page.title}</title>
        )}
        {page.description && (
          <meta name="description" content={page.description} />
        )}
        {/* Open Graph for social sharing */}
        <meta property="og:title" content={page.title || website?.name} />
        <meta property="og:description" content={page.description || website?.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://${website?.primaryDomain || domain}/${slug}`} />
        {website?.branding?.faviconUrl && (
          <meta property="og:image" content={website.branding.faviconUrl} />
        )}
        {/* Canonical URL - use primary domain if set */}
        <link rel="canonical" href={`https://${website?.primaryDomain || domain}/${slug}`} />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title || website?.name} />
        <meta name="twitter:description" content={page.description || website?.description} />

        <PageRenderer
          sections={sections}
          currentPageSlug={`/${slug}`}
          websiteId={website?._id}
          companyId={website?.companyId}
          pointerSettings={pointerSettings}
          homePageSlug={homePage?.slug}
        />
      </div>
    );
  }

  // Render default content (for richtext or other content types)
  return (
    <div className="min-h-screen bg-white">
      {/* Page metadata */}
      {page.title && (
        <title>{page.title}</title>
      )}
      {page.description && (
        <meta name="description" content={page.description} />
      )}

      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {domain}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {page.name}
          </h2>
          {page.content && (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
