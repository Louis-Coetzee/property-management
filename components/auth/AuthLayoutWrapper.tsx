'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthBrandingProvider } from '@/components/auth/AuthBrandingContext';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isPlatformDomain } from '@/lib/domain';

interface AuthLayoutWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackToLogin?: boolean;
}

function darkenColor(color: string, amount: number) {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const DEFAULT_PRIMARY = '#10304f';
const DEFAULT_SECONDARY = '#308a29';

function AuthLoadingState({ title, subtitle, showBackToLogin }: { title: string; subtitle?: string; showBackToLogin?: boolean }) {
  return (
    <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 mt-4 sm:my-0 sm:min-h-screen relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-slate-100/50" />
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 sm:px-8 py-5 sm:py-6 text-center bg-slate-800">
            <div className="h-8 w-32 bg-slate-600 rounded animate-pulse mx-auto mb-2" />
            <div className="h-4 w-24 bg-slate-500 rounded animate-pulse mx-auto" />
          </div>
          <div className="px-6 sm:px-8 py-6 sm:py-8 space-y-4">
            <div className="h-4 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
            <div className="h-10 bg-slate-100 rounded animate-pulse mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthLayoutWrapper({ 
  children, 
  title, 
  subtitle, 
  showBackToLogin = false 
}: AuthLayoutWrapperProps) {
  const params = useParams();
  const domain = params.domain as string;
  const [isReady, setIsReady] = useState(false);
  
  const isRefreshTech = !domain || isPlatformDomain(domain);
  
  const website = useQuery(
    api.websites.getWebsiteByDomainPublic,
    domain && !isRefreshTech ? { domain } : 'skip'
  ) as any;
  
  const primaryColor = (isRefreshTech ? DEFAULT_PRIMARY : (website?.branding?.primaryColor || DEFAULT_PRIMARY));
  const secondaryColor = (isRefreshTech ? DEFAULT_SECONDARY : (website?.branding?.secondaryColor || DEFAULT_SECONDARY));
  const logoUrl = website?.branding?.logoUrl;
  const logoType = website?.branding?.logoType;
  const logoText = website?.branding?.logoText;
  const brandName = website?.branding?.logoText || website?.name;
  
  // Show loading state until colors are loaded
  useEffect(() => {
    if (website !== undefined || isRefreshTech) {
      const timer = setTimeout(() => setIsReady(true), 150);
      return () => clearTimeout(timer);
    }
  }, [website, isRefreshTech]);

  // Set CSS variables on document
  useEffect(() => {
    document.documentElement.style.setProperty('--auth-primary', primaryColor);
    document.documentElement.style.setProperty('--auth-primary-dark', darkenColor(primaryColor, -15));
    document.documentElement.style.setProperty('--auth-secondary', secondaryColor);
  }, [primaryColor, secondaryColor]);
  
  const wrapperStyle = {
    '--auth-primary': primaryColor,
    '--auth-primary-dark': darkenColor(primaryColor, -15),
    '--auth-secondary': secondaryColor,
  } as React.CSSProperties;
  
// Show loading state while fetching branding
  const hasBranding = website?.branding?.primaryColor;
  
  // While website is loading or if branding isn't available yet, show loading state
  if (!isRefreshTech && (!isReady || website === undefined)) {
    return <AuthLoadingState title={title} subtitle={subtitle} showBackToLogin={showBackToLogin} />;
  }
  
  // If branding is still not available after website loaded, show loading
  if (!isRefreshTech && website && !hasBranding) {
    return <AuthLoadingState title={title} subtitle={subtitle} showBackToLogin={showBackToLogin} />;
  }

  if (isRefreshTech || !website) {
    return (
      <AuthBrandingProvider primaryColor={primaryColor} secondaryColor={secondaryColor}>
        <div style={wrapperStyle}>
          <AuthLayout
            title={title}
            subtitle={subtitle}
            showBackToLogin={showBackToLogin}
            isRefreshTech={true}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          >
            {children}
          </AuthLayout>
        </div>
      </AuthBrandingProvider>
    );
  }
  
  return (
    <AuthBrandingProvider primaryColor={primaryColor} secondaryColor={secondaryColor}>
      <div style={wrapperStyle}>
        <AuthLayout
          title={title}
          subtitle={subtitle}
          showBackToLogin={showBackToLogin}
          logo={logoType === 'image' ? logoUrl : undefined}
          brandName={logoText || brandName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          isRefreshTech={false}
        >
          {children}
        </AuthLayout>
      </div>
    </AuthBrandingProvider>
  );
}