'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PageRenderer } from '@/components/page-builder/renderer/PageRenderer';
import { parsePageContent } from '@/lib/page-builder/hooks/usePageContent';
import { Loader2, ArrowRight, Check, Zap, Globe, Users, BarChart3, ShoppingCart, Calendar, MessageSquare, Shield, CreditCard, Building2, Menu, X, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/app/[domain]/AuthProvider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { isPlatformDomain } from '@/lib/domain';
import { AccommodationLandingPage } from '@/components/AccommodationLandingPage';

const features = [
  {
    icon: Users,
    title: 'CRM & Lead Management',
    description: 'Track leads, manage customer relationships, and convert more sales with powerful CRM tools.',
    gradient: 'from-blue-500 to-blue-700',
    iconBg: 'bg-blue-500',
  },
  {
    icon: ShoppingCart,
    title: 'Online Store',
    description: 'Build a beautiful online store with product management, orders, and secure payments.',
    gradient: 'from-emerald-500 to-emerald-700',
    iconBg: 'bg-emerald-500',
  },
  {
    icon: Globe,
    title: 'Website Builder',
    description: 'Create stunning websites with our drag-and-drop builder. No coding required.',
    gradient: 'from-violet-500 to-violet-700',
    iconBg: 'bg-violet-500',
  },
  {
    icon: Calendar,
    title: 'Booking System',
    description: 'Let customers book appointments online. Manage schedules and availability effortlessly.',
    gradient: 'from-amber-500 to-amber-700',
    iconBg: 'bg-amber-500',
  },
  {
    icon: MessageSquare,
    title: 'Messaging & Communication',
    description: 'Stay connected with customers through integrated messaging and real-time chat.',
    gradient: 'from-cyan-500 to-cyan-700',
    iconBg: 'bg-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Make data-driven decisions with comprehensive analytics and custom reports.',
    gradient: 'from-rose-500 to-rose-700',
    iconBg: 'bg-rose-500',
  },
  {
    icon: CreditCard,
    title: 'Invoicing & Payments',
    description: 'Generate professional invoices and accept payments online with ease.',
    gradient: 'from-teal-500 to-teal-700',
    iconBg: 'bg-teal-500',
  },
  {
    icon: Shield,
    title: 'Team Management',
    description: 'Manage team members, set permissions, and organize your organization structure.',
    gradient: 'from-indigo-500 to-indigo-700',
    iconBg: 'bg-indigo-500',
  },
];

function ProfessionalLandingPage({ domain }: { domain: string }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href={`/${domain}`} className="flex-shrink-0 flex items-center gap-2 group">
                <span className="text-2xl font-bold"><span className="text-green-600">Refresh</span> <span className="text-gray-500">Tech</span></span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href={`/auth/register`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-100 hover:text-blue-900 transition-all duration-200"
              >
                Get Started
              </Link>
              <Link
                href={`/auth/login`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-100 hover:text-blue-900 transition-all duration-200"
              >
                Sign In
              </Link>
              {user && (
                <Link
                  href={`/dashboard`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 transition-all duration-200"
                >
                  Dashboard
                </Link>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200 text-sm font-medium text-slate-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className="h-10 w-10 text-slate-600 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 max-w-sm p-0">
                  <div className="flex flex-col h-full px-4 py-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold"><span className="text-green-600">Refresh</span> <span className="text-gray-500">Tech</span></span>
                      </div>
                    </div>
                    <nav className="flex-1 space-y-1">
                      <Link
                        href={`/auth/register`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-all duration-200"
                      >
                        Get Started
                      </Link>
                      <Link
                        href={`/auth/login`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-all duration-200"
                      >
                        <User className="h-5 w-5" />
                        <span>Sign In</span>
                      </Link>
                      {user && (
                        <Link
                          href={`/dashboard`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-50 transition-all duration-200"
                        >
                          Dashboard
                        </Link>
                      )}
                    </nav>
                    {user && (
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 w-full"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)`
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm font-medium mb-8">
              <Zap className="h-4 w-4 text-amber-400" />
              All-in-One Business Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Run Your Business
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                All in One Place
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              The complete solution for small to medium businesses. Manage customers, build websites, process payments, and grow your business — all from a single platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/auth/register`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={`/auth/login`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful tools designed to help you manage every aspect of your business from one centralized dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-6 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-300 bg-white relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${feature.iconBg} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className={`inline-flex p-3 rounded-xl ${feature.gradient} mb-5 shadow-lg relative`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            Join thousands of businesses already growing with our all-in-one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/auth/register`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold"><span className="text-green-500">Refresh</span> <span className="text-white">Tech</span></span>
            </div>
            <div className="flex items-center gap-6 text-slate-400 text-sm">
              <Link href={`/${domain}/privacy`} className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href={`/${domain}/terms`} className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <p className="text-slate-500 text-sm">
              © 2025 RefreshTech. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DomainPage() {
  const params = useParams();
  const domain = params.domain as string;

  // Always query for app and website data at the top level
  const app = useQuery(api.apps.getAppByDomain, { domain });
  const directWebsite = useQuery(api.websites.getWebsiteByDomainPublic, { domain });
  const website = app?.type === 'website' ? directWebsite : directWebsite;
  
  const homePage = useQuery(
    api.pages.getHomePagePublic, 
    website && website._id ? { websiteId: website._id } : 'skip'
  );

  // Loading states
  const homePageLoading = website && homePage === undefined;
  if (app === undefined || directWebsite === undefined || homePageLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // No app or website found - show landing page
  if (!app && !directWebsite) {
    return isPlatformDomain(domain)
      ? <AccommodationLandingPage domain={domain} />
      : <ProfessionalLandingPage domain={domain} />;
  }

  // If we have a direct website, render it regardless of app
  if (directWebsite) {
    // Check if home page is a static site (duplicated site)
    if (homePage && homePage.contentType === 'staticSite') {
      try {
        const staticContent = homePage.content ? JSON.parse(homePage.content) : null;
        const htmlContent = staticContent?.htmlContent;

        if (htmlContent) {
          return (
            <iframe
              srcDoc={htmlContent}
              className="w-full h-screen border-0"
              title={homePage.name || 'Static Site'}
              style={{ minHeight: '100vh' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          );
        } else {
          console.error('Static site content missing htmlContent:', staticContent);
          return (
            <div className="min-h-screen bg-white flex items-center justify-center">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Static Site Error</h2>
                <p className="text-gray-600 mb-4">
                  The static site content was not saved properly. Please try duplicating the site again.
                </p>
              </div>
            </div>
          );
        }
      } catch (e) {
        console.error('Error parsing static site content:', e);
      }
    }

    // Check if website has a page builder home page
    if (homePage && homePage.contentType === 'pageBuilder') {
      const pageContent = parsePageContent(homePage.content);
      const sections = pageContent?.sections ?? [];
      const pointerSettings = pageContent?.pointerSettings ?? null;

      return (
        <div className="w-full">
          {/* SEO Meta Tags */}
          {homePage.title && (
            <title>{homePage.title}</title>
          )}
          {homePage.description && (
            <meta name="description" content={homePage.description} />
          )}
          {/* Open Graph for social sharing */}
          <meta property="og:title" content={homePage.title || directWebsite.name} />
          <meta property="og:description" content={homePage.description || directWebsite.description} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={`https://${directWebsite.primaryDomain || domain}`} />
          {directWebsite.branding?.faviconUrl && (
            <meta property="og:image" content={directWebsite.branding.faviconUrl} />
          )}
          {/* Canonical URL - use primary domain if set */}
          <link rel="canonical" href={`https://${directWebsite.primaryDomain || domain}`} />
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={homePage.title || directWebsite.name} />
          <meta name="twitter:description" content={homePage.description || directWebsite.description} />

          <PageRenderer
            sections={sections}
            currentPageSlug="/"
            websiteId={directWebsite._id}
            companyId={directWebsite.companyId}
            pointerSettings={pointerSettings}
            homePageSlug={homePage?.slug}
          />
        </div>
      );
    }

    // Default website rendering
    return (
      <div className="min-h-screen bg-white">
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
              {directWebsite.name}
            </h2>
            {directWebsite.description && (
              <p className="text-xl text-gray-600">
                {directWebsite.description}
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Render based on app type (for when there's app but no direct website)
  if (!app) {
    return isPlatformDomain(domain)
      ? <AccommodationLandingPage domain={domain} />
      : <ProfessionalLandingPage domain={domain} />;
  }

  switch (app.type) {
    case 'website':
      // Check if home page is a static site (duplicated site)
      if (homePage && homePage.contentType === 'staticSite') {
        try {
          const staticContent = homePage.content ? JSON.parse(homePage.content) : null;
          const htmlContent = staticContent?.htmlContent;

          if (htmlContent) {
            // Render the static site HTML via iframe srcdoc
            return (
              <iframe
                srcDoc={htmlContent}
                className="w-full h-screen border-0"
                title={homePage.name || 'Static Site'}
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
                </div>
              </div>
            );
          }
        } catch (e) {
          console.error('Error parsing static site content:', e);
        }
      }

      // Check if website has a page builder home page
      if (homePage && homePage.contentType === 'pageBuilder') {
        const pageContent = parsePageContent(homePage.content);
        const sections = pageContent?.sections ?? [];
        const pointerSettings = pageContent?.pointerSettings ?? null;

        return (
          <div className="w-full">
            {/* Page metadata */}
            {homePage.title && (
              <title>{homePage.title}</title>
            )}
            {homePage.description && (
              <meta name="description" content={homePage.description} />
            )}

            <PageRenderer
              sections={sections}
              currentPageSlug="/"
              websiteId={website?._id}
              pointerSettings={pointerSettings}
              homePageSlug={homePage?.slug}
            />
          </div>
        );
      }

      // Default website rendering
      return (
        <div className="min-h-screen bg-white">
          {/* Header with domain name */}
          <header className="border-b border-gray-200">
            <div className="container mx-auto px-4 py-6">
              <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {domain}
              </h1>
            </div>
          </header>

          {/* Main content */}
          <main className="container mx-auto px-4 py-12">
            {website ? (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  {website.name}
                </h2>
                {website.description && (
                  <p className="text-xl text-gray-600">
                    {website.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
          </main>
        </div>
      );

    default:
      // Unknown app type
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
              {domain}
            </h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              App Type: {app!.type}
            </h2>
            <p className="text-gray-600">
              This app type is not yet supported.
            </p>
          </div>
        </div>
      );
  }
}
