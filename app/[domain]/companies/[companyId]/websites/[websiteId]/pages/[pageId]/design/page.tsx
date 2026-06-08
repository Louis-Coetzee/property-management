'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { toast } from 'react-hot-toast';
import { ArrowLeft, FileText, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface DesignOption {
  id: 'blank' | 'template';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
  highlight?: boolean;
}

const DESIGN_OPTIONS: DesignOption[] = [
  {
    id: 'blank',
    title: 'Start from Scratch',
    description: 'Begin with a blank canvas and add sections as you go',
    icon: FileText},
  {
    id: 'template',
    title: 'Use a Template',
    description: 'Choose from professionally designed templates including Vehicle Dealership layouts',
    icon: Sparkles,
    highlight: true},
];

export default function PageDesignPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  const companyId = params.companyId as string;
  const websiteId = params.websiteId as string;

  const [isInitializing, setIsInitializing] = useState(false);

  // Query page data - only fetch when user is available
  const page = useQuery(
    api.pages.getPageById,
    user ? { userId: user.id as any, pageId: pageId as any } : "skip"
  );
  const website = useQuery(
    api.websites.getWebsiteById,
    user ? { userId: user.id as any, websiteId: websiteId as any } : "skip"
  );
  const company = useQuery(
    api.companies.getByCompanyId,
    user ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );
  const initializePageBuilder = useMutation(api.pages.initializePageBuilder);

  const handleSelectOption = async (optionId: string) => {
    if (optionId === 'template') {
      // Navigate to template selection page
      router.push(`/companies/${companyId}/websites/${websiteId}/pages/${pageId}/design/templates`);
      return;
    }

    // Initialize blank canvas
    setIsInitializing(true);

    try {
      await initializePageBuilder({
        userId: user?.id as any,
        pageId: pageId as any});

      toast.success('Page initialized successfully!');
      router.push(`/companies/${companyId}/websites/${websiteId}/pages/${pageId}/canvas`);
    } catch (error) {
      console.error('Error initializing page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initialize page');
    } finally {
      setIsInitializing(false);
    }
  };

  // Check if page already has page builder content with sections
  const hasPageBuilderContent = (() => {
    if (page?.contentType !== 'pageBuilder' || !page?.content) return false;

    try {
      const parsedContent = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
      return Array.isArray(parsedContent?.sections) && parsedContent.sections.length > 0;
    } catch {
      return false;
    }
  })();

  if (isLoading || (!page && page !== undefined)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
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

  if (!page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Page Not Found</h2>
          <p className="text-slate-600">The page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // If page already has page builder content, redirect to canvas
  if (hasPageBuilderContent) {
    router.push(`/companies/${companyId}/websites/${websiteId}/pages/${pageId}/canvas`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
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
            <a href={`/companies/${companyId}/websites/${websiteId}/pages`} className="text-slate-500 hover:text-slate-700 transition-colors">
              Pages
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Design</span>
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="../.."
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Design Your Page</h1>
              <p className="text-sm text-slate-600">{page.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How would you like to start?</h2>
            <p className="text-lg text-slate-600">
              Choose how you want to build your page
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {DESIGN_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isDisabled = isInitializing;

              return (
                <button
                  key={option.id}
                  onClick={() => !isDisabled && handleSelectOption(option.id)}
                  disabled={isDisabled}
                  className={`
                    relative p-8 rounded-3xl border-2 text-left transition-all duration-200 group
                    ${isDisabled
                      ? 'border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed'
                      : option.highlight
                        ? 'border-indigo-300 bg-gradient-to-br from-white to-indigo-50 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100'
                    }
                  `}
                >
                  {option.highlight && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        Recommended
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`
                      p-4 rounded-2xl flex-shrink-0 transition-colors
                      ${isDisabled
                        ? 'bg-slate-200'
                        : option.highlight
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 group-hover:from-indigo-600 group-hover:to-purple-700'
                          : 'bg-gradient-to-br from-indigo-100 to-indigo-50 group-hover:from-indigo-200 group-hover:to-indigo-100'
                      }
                    `}>
                      <Icon className={`
                        h-8 w-8
                        ${isDisabled ? 'text-slate-400' : option.highlight ? 'text-white' : 'text-indigo-600'}
                      `} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">
                          {option.title}
                        </h3>
                      </div>
                      <p className="text-slate-600">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  {!isDisabled && (
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${option.highlight ? 'bg-indigo-600' : 'bg-slate-900'}
                      `}>
                        <ChevronRight className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}

                  {isInitializing && option.id === 'blank' && (
                    <div className="absolute inset-0 bg-white/80 rounded-3xl flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
