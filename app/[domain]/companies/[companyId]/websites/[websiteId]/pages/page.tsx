'use client';

// NOTE: All links within [domain] routes should NOT include ${domain} in hrefs
// Next.js App Router automatically handles the domain segment
// WRONG: href={`/${domain}/companies/${id}/websites`}
// RIGHT: href={`/companies/${id}/websites`}

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '../../../../../AuthProvider';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Home,
  ChevronRight,
  Palette,
  Copy} from 'lucide-react';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';

function hasPageBuilderSections(page: any): boolean {
  if (page?.contentType !== 'pageBuilder' || !page?.content) return false;
  try {
    const parsedContent = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
    return Array.isArray(parsedContent?.sections) && parsedContent.sections.length > 0;
  } catch {
    return false;
  }
}


interface FormData {
  name: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  isPublished: boolean;
}

export default function WebsitePagesPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const websiteId = params.websiteId as string;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    title: '',
    description: '',
    content: '',
    isPublished: true});

  // Queries
  const website = useQuery(api.websites.getWebsiteById, { userId: user?.id as any,
    websiteId: websiteId as any });
  const company = useQuery(api.companies.getByCompanyId, { userId: user?.id as any,
    companyId: companyId as any });
  const pages = useQuery(api.pages.getPagesByWebsite, { userId: user?.id as any,
    websiteId: websiteId as any });

  // Combined loading state
  const isDataLoading = website === undefined || pages === undefined;

  // Mutations
  const createPage = useMutation(api.pages.createPage);
  const updatePage = useMutation(api.pages.updatePage);
  const deletePage = useMutation(api.pages.deletePage);
  const togglePagePublish = useMutation(api.pages.togglePagePublish);
  const setHomePage = useMutation(api.pages.setHomePage);
  const generateSlug = useQuery(api.pages.generateSlug,
    (websiteId && user?.id && formData.name) ? { userId: user.id as any, websiteId: websiteId as any, name: formData.name } : 'skip'
  );

  // Filter pages by search
  const filteredPages = pages ? pages.filter(page => {
    const matchesSearch = page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  }) : [];

  // Generate slug from name
  useEffect(() => {
    if (formData.name && showCreateModal && !selectedPage) {
      setIsGeneratingSlug(true);
    }
  }, [formData.name, showCreateModal]);

  useEffect(() => {
    if (isGeneratingSlug && generateSlug && !selectedPage) {
      setFormData(prev => ({ ...prev, slug: generateSlug }));
      setIsGeneratingSlug(false);
    }
  }, [generateSlug, isGeneratingSlug, selectedPage]);

  // Handlers
  const handleCreatePage = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Please provide a name and slug for your page');
      return;
    }

    setIsSubmitting(true);

    try {
      await createPage({
        userId: user?.id as any,
        websiteId: websiteId as any,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        content: formData.content || undefined,
        contentType: 'pageBuilder', // Default to pageBuilder for new pages
        isPublished: formData.isPublished
      });

      setShowCreateModal(false);
      resetForm();
      toast.success('Page created successfully!');
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create page');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePage = async () => {
    if (!selectedPage || !formData.name.trim() || !formData.slug.trim()) {
      toast.error('Please provide a name and slug for your page');
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePage({
        userId: user?.id as any,
        pageId: selectedPage._id,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        content: formData.content || undefined,
        // Preserve existing contentType, only update if explicitly provided
        contentType: selectedPage.contentType || 'pageBuilder',
        isPublished: formData.isPublished});

      setShowEditModal(false);
      setSelectedPage(null);
      resetForm();
      toast.success('Page updated successfully!');
    } catch (error) {
      console.error('Error updating page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update page');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (page: any) => {
    setSelectedPage(page);
    setShowDeleteModal(true);
  };

  const handleDeletePage = async () => {
    if (!selectedPage) return;

    setIsSubmitting(true);

    try {
      await deletePage({
        userId: user?.id as any,
        pageId: selectedPage._id});

      setShowDeleteModal(false);
      setSelectedPage(null);
      toast.success('Page deleted successfully!');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete page');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (pageId: string) => {
    try {
      await togglePagePublish({
        userId: user?.id as any,
        pageId: pageId as any});
    } catch (error) {
      console.error('Error toggling page publish status:', error);
      toast.error('Failed to update page status');
    }
  };

  const handleSetHomePage = async (page: any) => {
    try {
      await setHomePage({
        userId: user?.id as any,
        pageId: page._id});
      toast.success(`${page.name} is now the home page`);
    } catch (error) {
      console.error('Error setting home page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set home page');
    }
  };

  const handleCopyClick = (page: any) => {
    setSelectedPage(page);
    setFormData({
      name: `${page.name} (Copy)`,
      slug: `${page.slug}-copy`,
      title: page.title || '',
      description: page.description || '',
      content: page.content || '',
      isPublished: false, // Default to unpublished for copies
    });
    setShowCopyModal(true);
  };

  const handleCopyPage = async () => {
    if (!selectedPage || !formData.name.trim() || !formData.slug.trim()) {
      toast.error('Please provide a name and slug for your page');
      return;
    }

    // Check if slug already exists
    const slugExists = pages?.some(p => p.slug === formData.slug.trim() && p._id !== selectedPage._id);
    if (slugExists) {
      setSlugError('This slug is already in use. Please choose a different one.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createPage({
        userId: user?.id as any,
        websiteId: websiteId as any,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || selectedPage.description || undefined,
        content: selectedPage.content || undefined,
        contentType: selectedPage.contentType || 'richtext',
        isPublished: formData.isPublished
      });

      setShowCopyModal(false);
      setSelectedPage(null);
      resetForm();
      toast.success('Page copied successfully!');
    } catch (error) {
      console.error('Error copying page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to copy page');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (page: any) => {
    setSelectedPage(page);
    setFormData({
      name: page.name,
      slug: page.slug,
      title: page.title || '',
      description: page.description || '',
      content: page.content || '',
      isPublished: page.isPublished});
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      title: '',
      description: '',
      content: '',
      isPublished: true});
    setSlugError(null);
  };

  // Generate page URL
  const getPageUrl = (slug: string) => {
    const domain = website?.domains?.[0];
    if (!domain) return '#';
    return `https://${domain}/${slug}`;
  };

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
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
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
            <span className="text-slate-700">{website?.name}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Pages</span>
          </div>

          {/* Title Section */}
          <div className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/companies/${companyId}/websites`}
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pages</h1>
                  <p className="text-slate-600 mt-1">
                    {website?.name || 'Manage your pages'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">New Page</span>
                  <span className="sm:hidden text-sm">Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isDataLoading && (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          </div>
        )}

        {/* Search Bar and Pages Grid */}
        {!isDataLoading && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Pages Grid */}
            {filteredPages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPages.map((page) => (
              <div
                key={page._id}
                className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                  page.isPublished
                    ? 'border-slate-200/80 hover:border-slate-300'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Gradient Header Bar */}
                <div className={`h-1.5 rounded-t-2xl ${page.isPublished ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800' : 'bg-slate-300'}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                        page.isPublished
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-900/20'
                          : 'bg-slate-200'
                      }`}>
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{page.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            page.isPublished
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${page.isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {page.isPublished ? 'Active' : 'Draft'}
                          </span>
                          {page.isHomePage && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              <Home className="h-3 w-3" />
                              Home
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Toggle Switch and Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(page._id)}
                        className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                          page.isPublished ? 'bg-slate-800' : 'bg-slate-300'
                        }`}
                        title={page.isPublished ? 'Unpublish page' : 'Publish page'}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                          page.isPublished ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                      {!page.isHomePage && (
                        <button
                          onClick={() => handleDeleteClick(page)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          title="Delete page"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slug */}
                  <div className="mb-4">
                    <a
                      href={getPageUrl(page.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-600 transition-colors font-medium"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      /{page.slug}
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/companies/${companyId}/websites/${websiteId}/pages/${page._id}/${hasPageBuilderSections(page) ? 'canvas' : 'design'}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-[#010236] hover:border-[#010236] hover:bg-slate-50 rounded-lg transition-all duration-200"
                    >
                      <Palette className="h-3.5 w-3.5" />
                      {hasPageBuilderSections(page) ? 'Design' : 'Start'}
                    </Link>
                    {!page.isHomePage ? (
                      <button
                        onClick={() => handleSetHomePage(page)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-[#010236] hover:border-[#010236] hover:bg-slate-50 rounded-lg transition-all duration-200"
                      >
                        <Home className="h-3.5 w-3.5" />
                        Set Home
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <Home className="h-3.5 w-3.5" />
                        Home Page
                      </div>
                    )}
                    <button
                      onClick={() => handleCopyClick(page)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                    <button
                      onClick={() => openEditModal(page)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-[#010236] hover:border-[#010236] hover:bg-slate-50 rounded-lg transition-all duration-200"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No pages found' : 'No pages yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first page'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-4 w-4" />
                Create Page
              </button>
            )}
          </div>
        )}
        </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">New Page</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Page Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., About Us"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                      setFormData({ ...formData, slug });
                      setSlugError(null);
                    }}
                    placeholder="about-us"
                    maxLength={100}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 font-mono"
                  />
                </div>
                {slugError && (
                  <p className="text-xs text-red-600 mt-1.5">{slugError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description for search engines"
                  rows={2}
                  maxLength={160}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Publish Page</label>
                  <p className="text-xs text-slate-500 mt-0.5">Make this page publicly accessible</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    formData.isPublished ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                    formData.isPublished ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePage}
                  disabled={!formData.name.trim() || !formData.slug.trim() || isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Create Page'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Edit2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Page</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPage(null);
                  resetForm();
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Page Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., About Us"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                      setFormData({ ...formData, slug });
                      setSlugError(null);
                    }}
                    placeholder="about-us"
                    maxLength={100}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 font-mono"
                  />
                </div>
                {slugError && (
                  <p className="text-xs text-red-600 mt-1.5">{slugError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description for search engines"
                  rows={2}
                  maxLength={160}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Publish Page</label>
                  <p className="text-xs text-slate-500 mt-0.5">Make this page publicly accessible</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    formData.isPublished ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                    formData.isPublished ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPage(null);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePage}
                  disabled={!formData.name.trim() || !formData.slug.trim() || isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Update Page'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Page Modal */}
      {showCopyModal && selectedPage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Copy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Copy Page</h3>
                  <p className="text-xs text-slate-600">Create a duplicate of "{selectedPage.name}"</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCopyModal(false);
                  setSelectedPage(null);
                  resetForm();
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 leading-relaxed">
                  Enter a unique name and slug for the new page. The content from the original page will be copied.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  New Page Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., About Us (Copy)"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  New Slug <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                      setFormData({ ...formData, slug });
                      setSlugError(null);
                    }}
                    placeholder="about-us-copy"
                    maxLength={100}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 font-mono"
                  />
                </div>
                {slugError && (
                  <p className="text-xs text-red-600 mt-1.5">{slugError}</p>
                )}
                <p className="text-xs text-slate-500 mt-1.5">
                  The URL will be: /{formData.slug || 'your-slug'}
                </p>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Publish Page</label>
                  <p className="text-xs text-slate-500 mt-0.5">Make this page publicly accessible</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    formData.isPublished ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                    formData.isPublished ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCopyModal(false);
                    setSelectedPage(null);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyPage}
                  disabled={!formData.name.trim() || !formData.slug.trim() || isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-200"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Copying...
                    </span>
                  ) : (
                    'Create Copy'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPage && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete Page</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPage(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Confirm Deletion</p>
                  <p className="text-sm text-slate-600">
                    Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedPage.name}</span>?
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 leading-relaxed">
                  This action cannot be undone. The page will be permanently removed from your website.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPage(null);
                  }}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePage}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-200"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    'Delete Page'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Side Sheet */}
      <NavigationSideSheet
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        companyId={companyId}
        companyName={company?.name || ''}
        enabledApps={company?.enabledApps}
      />
    </div>
  );
}
