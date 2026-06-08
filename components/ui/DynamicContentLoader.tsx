'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface DynamicContentLoaderProps {
  isLoading: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  minLoadingTime?: number;
}

export function DynamicContentLoader({
  isLoading,
  children,
  fallback,
  minLoadingTime = 300
}: DynamicContentLoaderProps) {
  const [showContent, setShowContent] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowContent(true);
        setShowLoader(false);
      }, minLoadingTime);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setShowLoader(true);
    }
  }, [isLoading, minLoadingTime]);

  if (showLoader) {
    return fallback || <ProfessionalLoader />;
  }

  if (!showContent) {
    return fallback || <ProfessionalLoader />;
  }

  return <>{children}</>;
}

export function ProfessionalLoader() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
      </div>
    </div>
  );
}

interface PageLoaderProps {
  isLoading: boolean;
  children: ReactNode;
}

export function PageLoader({ isLoading, children }: PageLoaderProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading]);

  if (!showContent || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface AuthPageLoaderProps {
  isLoading: boolean;
  children: ReactNode;
}

export function AuthPageLoader({ isLoading, children }: AuthPageLoaderProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading]);

  if (!showContent || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="h-48 bg-slate-100 animate-pulse" />
            <div className="p-8 space-y-4">
              <div className="h-4 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
              <div className="h-10 bg-slate-100 rounded animate-pulse mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}