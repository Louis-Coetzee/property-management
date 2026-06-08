'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../AuthProvider';
import { ArrowLeft, ChevronRight, Settings, Palette, Plug, Globe, Banknote } from 'lucide-react';
import Link from 'next/link';
import CompanyDomainsSettingsTab from '@/components/settings/CompanyDomainsSettingsTab';
import CompanyGeneralSettingsTab from '@/components/settings/CompanyGeneralSettingsTab';
import CompanyBrandingSettingsTab from '@/components/settings/CompanyBrandingSettingsTab';
import CompanyIntegrationsSettingsTab from '@/components/settings/CompanyIntegrationsSettingsTab';
import CompanyBankingSettingsTab from '@/components/settings/CompanyBankingSettingsTab';

type TabValue = 'general' | 'branding' | 'integrations' | 'domains' | 'banking';

export default function CompanySettingsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  const [activeTab, setActiveTab] = useState<TabValue>('general');

  const company = useQuery(api.companies.getByCompanyId, {
    userId: user?.id as any,
    companyId: companyId as any
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!isAuthenticated || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'general' as TabValue, label: 'General', icon: <Settings className="h-4 w-4" /> },
    { id: 'branding' as TabValue, label: 'Branding', icon: <Palette className="h-4 w-4" /> },
    { id: 'banking' as TabValue, label: 'Banking', icon: <Banknote className="h-4 w-4" /> },
    { id: 'integrations' as TabValue, label: 'Integrations', icon: <Plug className="h-4 w-4" /> },
    { id: 'domains' as TabValue, label: 'Domains', icon: <Globe className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 text-sm">
            <Link href="/companies" className="text-slate-500 hover:text-slate-700">Companies</Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700">{company?.name}</Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Settings</span>
          </div>

          <div className="py-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Company Settings</h1>
                <p className="text-slate-600 mt-1">{company.name}</p>
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
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {activeTab === 'general' && (
              <CompanyGeneralSettingsTab companyId={companyId} userId={user?.id || ''} company={company} />
            )}

            {activeTab === 'branding' && (
              <CompanyBrandingSettingsTab companyId={companyId} userId={user?.id || ''} company={company} />
            )}

            {activeTab === 'integrations' && (
              <CompanyIntegrationsSettingsTab companyId={companyId} userId={user?.id || ''} company={company} />
            )}

            {activeTab === 'domains' && (
              <CompanyDomainsSettingsTab companyId={companyId} requestingUserId={user?.id || ''} currentSubdomain={company?.subdomain} />
            )}

            {activeTab === 'banking' && (
              <CompanyBankingSettingsTab companyId={companyId} userId={user?.id || ''} company={company} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
