'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard, useAuth } from '../../../../../AuthProvider';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, Plus, ChevronRight } from 'lucide-react';
import { FormsList } from '@/components/forms/FormsList';

export default function FormsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const { domain } = useAuth();
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const websiteId = params.websiteId as string;

  // Fetch website info
  const website = useQuery(api.websites.getWebsiteById, { userId: user?.id as any,
    websiteId: websiteId as any });
  const company = useQuery(api.companies.getByCompanyId, { userId: user?.id as any,
    companyId: companyId as any });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 text-sm">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors">
              Companies
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors">
              {company?.name}
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/websites`} className="text-slate-500 hover:text-slate-700 transition-colors">
              Websites
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700">{website?.name || 'Website'}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Forms</span>
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Forms</h1>
                <p className="text-slate-600 text-xs sm:text-sm mt-0.5 truncate max-w-[150px] sm:max-w-xs">
                  {website?.name || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <FormsList
          websiteId={websiteId}
          companyId={companyId}
          userId={user!.id}
          domain={domain}
          onFormSelect={(formId) => router.push(`/${domain}/companies/${companyId}/websites/${websiteId}/forms/${formId}`)}
        />
      </div>
    </div>
  );
}
