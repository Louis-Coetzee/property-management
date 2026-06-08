'use client';

// NOTE: All links within [domain] routes should NOT include ${domain} in hrefs
// Next.js App Router automatically handles the domain segment
// WRONG: href={`/${domain}/companies/${id}/websites`}
// RIGHT: href={`/companies/${id}/websites`}

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../../AuthProvider';
import Link from 'next/link';
import {
  Globe,
  ArrowLeft,
  Loader2,
  Settings,
  Palette,
  Database,
  Network,
  ChevronRight} from 'lucide-react';
import MultiDomainsSettingsTab from '@/components/settings/MultiDomainsSettingsTab';
import { BrandingTab } from '@/components/settings/BrandingTab';
import { IntegrationsTab } from '@/components/settings/IntegrationsTab';
import { toast } from 'react-hot-toast';

const SUBDOMAIN_BASE = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';

type TabType = 'general' | 'domains' | 'branding' | 'integrations';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

function getTabs() {
  return [
    { id: 'general' as TabType, label: 'General', icon: <Settings className="h-4 w-4" /> },
    { id: 'domains' as TabType, label: 'Domains', icon: <Globe className="h-4 w-4" /> },
    { id: 'branding' as TabType, label: 'Branding', icon: <Palette className="h-4 w-4" /> },
    { id: 'integrations' as TabType, label: 'Integrations', icon: <Network className="h-4 w-4" /> },
  ] as Tab[];
}

export default function WebsiteSettingsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;
  const websiteId = params.websiteId as string;

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);

  // Migration mutation
  const migrateFilters = useMutation(api.pages.migrateListingsShowcaseFilters);

  // Query website and company data
  const website = useQuery(api.websites.getWebsiteById, { userId: user?.id as any,
    websiteId: websiteId as any });
  const company = useQuery(api.companies.getByCompanyId, { userId: user?.id as any,
    companyId: companyId as any });

  const TABS = getTabs();

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
            <span className="text-slate-900 font-medium">Settings</span>
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/websites`}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Website Settings</h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  {website?.name || 'Loading...'} {company && `• ${company.name}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Tabs Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <nav className="flex flex-wrap gap-1 p-2" aria-label="Tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex-shrink-0
                    ${
                      activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }
                  `}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">General Settings</h2>
                  <p className="text-slate-600 text-sm">Manage your website's basic information and settings.</p>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  {website ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Website Name
                          </label>
                          <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900">
                            {website.name}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Status
                          </label>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${
                              website.isPublished
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {website.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Description
                        </label>
                        <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 min-h-[80px]">
                          {website.description || 'No description provided'}
                        </div>
                      </div>

                      {/* Migration Section */}
                      <div className="pt-4 border-t border-slate-200">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <Database className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-amber-900 mb-1">
                                Data Migration Required
                              </h4>
                              <p className="text-xs text-amber-700 mb-3">
                                Update page content to use new filter format (brands and conditions instead of branches and vehicle types).
                              </p>
                              <button
                                onClick={async () => {
                                  setMigrating(true);
                                  setMigrationResult(null);
                                  try {
                                    const result = await migrateFilters({ userId: user?.id as any, websiteId: websiteId as any });
                                    setMigrationResult(`Success! Migrated ${result.migratedCount} page(s).`);
                                    toast.success(`Successfully migrated ${result.migratedCount} page(s)!`, {
                                      duration: 4000,
                                      position: 'top-right'});
                                  } catch (error: any) {
                                    setMigrationResult(`Error: ${error.message}`);
                                    toast.error(error.message || 'Migration failed. Please try again.', {
                                      duration: 5000,
                                      position: 'top-right'});
                                  } finally {
                                    setMigrating(false);
                                  }
                                }}
                                disabled={migrating}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                {migrating ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Migrating...
                                  </span>
                                ) : (
                                  'Run Migration'
                                )}
                              </button>
                              {migrationResult && (
                                <p className={`text-xs mt-2 ${migrationResult.startsWith('Success') ? 'text-green-700' : 'text-red-700'}`}>
                                  {migrationResult}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-500">
                          Created: {new Date(website.createdAt).toLocaleDateString()} •
                          Last updated: {new Date(website.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'domains' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Domain Settings</h2>
                  <p className="text-slate-600 text-sm">Configure your website's domains and manage custom domains.</p>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  {website ? (
                    <div className="space-y-8">
                      {/* Primary Domain Section - Read Only */}
                      {website.domains && website.domains.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Globe className="h-5 w-5 text-slate-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Primary Domain</h3>
                          </div>
                          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl p-6 border border-indigo-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-slate-600 mb-1">Your website is accessible at:</p>
                                <a
                                  href={`https://${website.domains[0]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-lg font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-2"
                                >
                                  {website.domains[0]}
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                              <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Active
                              </span>
                            </div>
                            {website.domains.length > 1 && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 mt-4">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {website.domains.length - 1} additional domain{website.domains.length > 2 ? 's' : ''} configured
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Multi-Domain Management Section */}
                      <div>
                        <MultiDomainsSettingsTab
                          entityId={websiteId}
                          entityType="website"
                          primaryDomain={SUBDOMAIN_BASE}
                          requestingUserId={user?.id || ''}
                          currentPrimaryDomain={website?.primaryDomain}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Branding Settings</h2>
                  <p className="text-slate-600 text-sm">Customize your website's appearance and branding.</p>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  {website ? (
                    <BrandingTab
                      website={website}
                      userId={user!.id}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                {website ? (
                  <IntegrationsTab
                    website={website}
                    userId={user!.id}
                  />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
