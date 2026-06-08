'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';
import {
  MessageSquare,
  Building2,
  Loader2,
} from 'lucide-react';

export default function SocialMediaPage() {
  const params = useParams();
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const companyId = params.companyId as string;

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  Social Media
                </h1>
              </div>
            </div>
            <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-10 w-10 text-pink-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Coming Soon
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            We're working on bringing you social media management tools. 
            Soon you'll be able to connect and manage all your social media accounts in one place.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-full">
            <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-pink-700">Stay tuned for updates</span>
          </div>
        </div>
      </div>

      {isSideSheetOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setIsSideSheetOpen(false)}
        />
      )}

      <NavigationSideSheet
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        companyId={companyId}
        companyName={company?.name || ''}
      />
    </div>
  );
}