'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Navbar } from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import CartDrawer from '@/components/cart/CartDrawer';

interface DomainLayoutWrapperProps {
  domain: string;
  interClassName: string;
  children: React.ReactNode;
}

export function DomainLayoutWrapper({ domain, interClassName, children }: DomainLayoutWrapperProps) {
  const pathname = usePathname();

  // Fetch website to get accent color
  const website = useQuery(
    api.websites.getWebsiteByDomainPublic,
    domain ? { domain } : 'skip'
  ) as any;
  const accentColor = website?.branding?.primaryColor || '#219c94';

  // Check if current path is an auth page
  const isAuthPage = pathname?.includes('/auth/');

  // Check if current path is a public front-end page (page builder rendered page)
  // These pages should NOT have the app navbar as they may have their own navbar
  const isPublicPage = pathname &&
    !pathname.includes('/companies/') &&
    !pathname.includes('/auth/') &&
    !pathname.includes('/dashboard') &&
    !pathname.includes('/profile') &&
    !pathname.includes('/settings') &&
    !pathname.includes('/media-library') &&
    !pathname.includes('/file-manager') &&
    !pathname.includes('/privacy') &&
    !pathname.includes('/terms') &&
    !pathname.includes('/admin/') &&
    (pathname === '/' || pathname.startsWith('/products') || pathname.startsWith('/checkout') || pathname.startsWith('/cart'));

  // NOTE: When adding links in this app, paths are relative to the [domain] segment
  // Use href="/companies" NOT href={`/${domain}/companies`} to avoid double domains

  // Public front-end pages get no navbar and no padding (full-width rendering)
  if (isPublicPage) {
    return (
      <div className={`${interClassName} min-h-screen`}>
        {children}
        <CartDrawer accentColor={accentColor} />
      </div>
    );
  }

  // Auth pages and non-auth pages both get navbar, only styling differs
  return (
    <div className={`${interClassName} min-h-screen`}>
      <Navbar domain={domain} />
      <main className={isAuthPage ? '' : 'px-4 sm:px-6 lg:px-8'}>
        {children}
      </main>
      <CartDrawer accentColor={accentColor} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '12px 16px'},
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff'}},
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'}}}}
      />
    </div>
  );
}
