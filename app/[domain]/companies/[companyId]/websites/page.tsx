'use client';

// NOTE: All links within [domain] routes should NOT include ${domain} in hrefs
// Next.js App Router automatically handles the domain segment
// WRONG: href={`/${domain}/companies/${id}/websites`}
// RIGHT: href={`/companies/${id}/websites`}

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '../../../AuthProvider';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Loader2,
  Settings,
  FileText,
  ChevronRight,
  Copy} from 'lucide-react';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';

const SUBDOMAIN_BASE = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';

export default function WebsitesPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '', // Single domain (required)
    isPublished: false});

  const [copyFormData, setCopyFormData] = useState({
    name: '',
    domain: '',
  });

  const [validatingDomain, setValidatingDomain] = useState(false);
  const [domainValidation, setDomainValidation] = useState<{ available: boolean; message: string } | null>(null);
  const [copyDomainValidation, setCopyDomainValidation] = useState<{ available: boolean; message: string } | null>(null);

  // Query company and websites
  const company = useQuery(api.companies.getByCompanyId, { userId: user?.id as any,
    companyId: companyId as any });
  const websites = useQuery(api.websites.getWebsitesByCompany, {
    userId: user?.id as any,
    companyId: companyId as any});

  // Combined loading state
  const isDataLoading = company === undefined || websites === undefined;

  // Mutations
  const createWebsite = useMutation(api.websites.createWebsite);
  const updateWebsite = useMutation(api.websites.updateWebsite);
  const deleteWebsite = useMutation(api.websites.deleteWebsite);
  const toggleWebsitePublish = useMutation(api.websites.toggleWebsitePublish);
  const copyWebsite = useMutation(api.websites.copyWebsite);

  // Filter websites based on search
  const filteredWebsites = websites ? websites.filter(website =>
    website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (website.description && website.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    website.domains?.some((d: string) => d.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  // Validate domain
  const validateDomain = useCallback(async (domain: string) => {
    if (!domain || domain.trim() === '') {
      setDomainValidation(null);
      return;
    }

    setValidatingDomain(true);

    try {
      const response = await fetch('/api/validate-subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: domain.includes('.') ? domain.split('.')[0] : domain,
          excludeEntityId: selectedWebsite?._id,
          excludeEntityType: 'website'})});

      const data = await response.json();
      setDomainValidation({
        available: data.available,
        message: data.message || (data.available ? 'Domain is available' : 'Domain is not available')});
    } catch {
      setDomainValidation({ available: false, message: 'Error validating domain' });
    } finally {
      setValidatingDomain(false);
    }
  }, [selectedWebsite?._id]);

  const handleValidateAndSetDomain = async (domain: string) => {
    if (!domain.trim()) {
      setDomainValidation({ available: false, message: 'Domain is required' });
      return;
    }

    // Determine if this is a subdomain or custom domain
    const isCustomDomain = domain.includes('.');

    setValidatingDomain(true);

    try {
      let isAvailable = false;
      let message = '';

      if (isCustomDomain) {
        // Validate custom domain
        const response = await fetch('/api/validate-custom-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customDomain: domain,
            excludeWebsiteId: selectedWebsite?._id})});
        const data = await response.json();
        isAvailable = data.available;
        message = data.message || (data.available ? 'Domain is available' : 'Domain is not available');
      } else {
        // Validate subdomain
        const subdomain = domain.includes('.') ? domain.split('.')[0] : domain;
        const response = await fetch('/api/validate-subdomain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subdomain: subdomain,
            excludeWebsiteId: selectedWebsite?._id})});
        const data = await response.json();
        isAvailable = data.available;
        message = data.message || (data.available ? 'Subdomain is available' : 'Subdomain is not available');
      }

      setDomainValidation({
        available: isAvailable,
        message: message});

      // If available, set the domain in form data
      if (isAvailable) {
        const domainToSet = isCustomDomain ? domain.toLowerCase() : `${domain.toLowerCase()}.${SUBDOMAIN_BASE}`;
        setFormData({
          ...formData,
          domain: domainToSet});
      }
    } catch {
      setDomainValidation({
        available: false,
        message: 'Error validating domain availability'});
    } finally {
      setValidatingDomain(false);
    }
  };

  const handleRemoveDomain = () => {
    setFormData({
      ...formData,
      domain: ''});
    setDomainValidation(null);
  };

  const handleCreateWebsite = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Please provide a name and description for your website');
      return;
    }

    if (!formData.domain.trim()) {
      alert('Please provide a subdomain for your website');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate domain availability first
      const isCustomDomain = formData.domain.includes('.');
      const subdomain = isCustomDomain ? formData.domain.split('.')[0] : formData.domain;

      const validationResponse = await fetch(
        isCustomDomain ? '/api/validate-custom-domain' : '/api/validate-subdomain',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customDomain: formData.domain,
            subdomain: subdomain,
            excludeWebsiteId: undefined})}
      );

      const validationData = await validationResponse.json();

      if (!validationData.available) {
        setDomainValidation({
          available: false,
          message: validationData.message || 'This domain is not available. Please choose another.'});
        setIsSubmitting(false);
        return;
      }

      // Domain is available, proceed with creation
      // Ensure we have the full domain (subdomain + base) - reuse isCustomDomain from validation
      const fullDomain = isCustomDomain ? formData.domain : `${formData.domain}.${SUBDOMAIN_BASE}`;
      const domains = [fullDomain];

      const websiteId = await createWebsite({
        userId: user?.id as any,
        companyId: companyId as any,
        name: formData.name.trim(),
        description: formData.description.trim(),
        domains,
        isPublished: formData.isPublished
      });

      // Add domain to Vercel (use full domain)
      console.log('Adding domain to Vercel:', fullDomain);
      const vercelResponse = await fetch('/api/vercel/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: fullDomain })});

      if (!vercelResponse.ok) {
        const error = await vercelResponse.json();
        console.error('Failed to add domain to Vercel:', error);
        alert(`Warning: Website created but failed to add domain to Vercel: ${error.error || 'Unknown error'}`);
      }

      // For custom domains, also add www redirect
      if (isCustomDomain && !formData.domain.startsWith('www.')) {
        const wwwDomain = `www.${formData.domain}`;
        console.log('Adding www redirect to Vercel:', wwwDomain);
        await fetch('/api/vercel/domains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: wwwDomain,
            redirect: formData.domain,
            redirectStatusCode: 307})});
      }

      setShowCreateModal(false);
      resetForm();
      toast.success('Website created successfully!');
    } catch (error) {
      console.error('Error creating website:', error);
      alert('Failed to create website. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateWebsite = async () => {
    if (!selectedWebsite || !formData.name.trim() || !formData.description.trim()) {
      alert('Please provide a name and description for your website');
      return;
    }

    if (!formData.domain.trim()) {
      alert('Please provide a subdomain for your website');
      return;
    }

    setIsSubmitting(true);

    try {
      const oldDomains = selectedWebsite.domains || [];
      const subdomainInput = formData.domain;

      // Construct the full domain
      const isCustomDomain = subdomainInput.includes('.');
      const newDomain = isCustomDomain ? subdomainInput : `${subdomainInput}.${SUBDOMAIN_BASE}`;

      // If domain changed, validate it first
      if (newDomain !== oldDomains[0]) {
        const subdomain = isCustomDomain ? newDomain.split('.')[0] : subdomainInput;

        const validationResponse = await fetch(
          isCustomDomain ? '/api/validate-custom-domain' : '/api/validate-subdomain',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customDomain: newDomain,
              subdomain: subdomain,
              excludeWebsiteId: selectedWebsite._id})}
        );

        const validationData = await validationResponse.json();

        if (!validationData.available) {
          setDomainValidation({
            available: false,
            message: validationData.message || 'This domain is not available. Please choose another.'});
          setIsSubmitting(false);
          return;
        }
      }

      // Update website in database
      await updateWebsite({
        userId: user?.id as any,
        websiteId: selectedWebsite._id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        domains: [newDomain],
        isPublished: formData.isPublished});

      // Handle Vercel domains
      // Remove old domains from Vercel (only if different from new domain)
      for (const domain of oldDomains) {
        if (domain !== newDomain) {
          console.log('Removing domain from Vercel:', domain);
          await fetch('/api/vercel/domains/remove-both', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain })});
        }
      }

      // Add new domain to Vercel if it's different from old domain
      if (!oldDomains.includes(newDomain)) {
        console.log('Adding domain to Vercel:', newDomain);
        await fetch('/api/vercel/domains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: newDomain })});

        // For custom domains, also add www redirect
        if (newDomain.includes('.') && !newDomain.startsWith('www.')) {
          const wwwDomain = `www.${newDomain}`;
          await fetch('/api/vercel/domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: wwwDomain,
              redirect: newDomain,
              redirectStatusCode: 307})});
        }
      }

      setShowEditModal(false);
      setSelectedWebsite(null);
      resetForm();
      toast.success('Website updated successfully!');
    } catch (error) {
      console.error('Error updating website:', error);
      alert('Failed to update website. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (website: any) => {
    setSelectedWebsite(website);
    setShowDeleteModal(true);
  };

  const handleCopyClick = (website: any) => {
    setSelectedWebsite(website);
    // Generate default copy name and domain
    const baseName = website.name;
    const copyName = `${baseName} (Copy)`;
    const baseDomain = website.domains?.[0]?.split('.')[0] || 'website';
    const copyDomain = `${baseDomain}-copy`;
    setCopyFormData({
      name: copyName,
      domain: copyDomain,
    });
    setCopyDomainValidation(null);
    setShowCopyModal(true);
  };

  const handleCopyWebsite = async () => {
    if (!selectedWebsite || !copyFormData.name.trim() || !copyFormData.domain.trim()) {
      toast.error('Please provide a name and subdomain for your website');
      return;
    }

    // Validate domain availability first
    const subdomain = copyFormData.domain.includes('.')
      ? copyFormData.domain.split('.')[0]
      : copyFormData.domain;

    const isCustomDomain = copyFormData.domain.includes('.');
    const fullDomain = isCustomDomain
      ? copyFormData.domain.toLowerCase()
      : `${copyFormData.domain.toLowerCase()}.${SUBDOMAIN_BASE}`;

    setIsSubmitting(true);

    try {
      // Validate domain availability
      const validationResponse = await fetch(
        isCustomDomain ? '/api/validate-custom-domain' : '/api/validate-subdomain',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customDomain: fullDomain,
            subdomain: subdomain,
            excludeWebsiteId: undefined,
          }),
        }
      );

      const validationData = await validationResponse.json();

      if (!validationData.available) {
        setCopyDomainValidation({
          available: false,
          message: validationData.message || 'This domain is not available. Please choose another.',
        });
        setIsSubmitting(false);
        return;
      }

      // Copy the website
      const result = await copyWebsite({
        userId: user?.id as any,
        sourceWebsiteId: selectedWebsite._id,
        newName: copyFormData.name.trim(),
        newDomain: fullDomain,
      });

      // Add domain to Vercel
      console.log('Adding copied domain to Vercel:', fullDomain);
      const vercelResponse = await fetch('/api/vercel/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: fullDomain }),
      });

      if (!vercelResponse.ok) {
        const error = await vercelResponse.json();
        console.error('Failed to add domain to Vercel:', error);
        toast.error(`Warning: Website copied but failed to add domain to Vercel: ${error.error || 'Unknown error'}`);
      } else {
        // For custom domains, also add www redirect
        if (isCustomDomain && !fullDomain.startsWith('www.')) {
          const wwwDomain = `www.${fullDomain}`;
          await fetch('/api/vercel/domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: wwwDomain,
              redirect: fullDomain,
              redirectStatusCode: 307,
            }),
          });
        }
        toast.success(`Website copied successfully! ${result.pagesCopied} pages duplicated.`);
      }

      setShowCopyModal(false);
      setSelectedWebsite(null);
      setCopyFormData({ name: '', domain: '' });
      setCopyDomainValidation(null);
    } catch (error) {
      console.error('Error copying website:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to copy website');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWebsite = async () => {
    if (!selectedWebsite) return;

    setIsSubmitting(true);

    try {
      console.log('[handleDeleteWebsite] Starting deletion for website:', selectedWebsite.name);
      console.log('[handleDeleteWebsite] Domains to remove from Vercel:', selectedWebsite.domains);

      const vercelErrors: string[] = [];

      // Remove all domains from Vercel
      for (const domain of selectedWebsite.domains || []) {
        console.log('[handleDeleteWebsite] Removing domain from Vercel:', domain);

        const removeResponse = await fetch('/api/vercel/domains/remove-both', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain })});

        if (!removeResponse.ok) {
          const error = await removeResponse.json();
          console.error('[handleDeleteWebsite] Failed to remove domain from Vercel:', error);
          vercelErrors.push(`${domain}: ${error.error || 'Unknown error'}`);
        } else {
          console.log('[handleDeleteWebsite] Successfully removed domain from Vercel:', domain);
        }
      }

      // Delete website from database
      console.log('[handleDeleteWebsite] Deleting website from database:', selectedWebsite._id);

      await deleteWebsite({
        userId: user?.id as any,
        websiteId: selectedWebsite._id});

      console.log('[handleDeleteWebsite] Successfully deleted website from database');

      // Show success message
      if (vercelErrors.length > 0) {
        alert(`Website deleted successfully, but there were errors removing domains from Vercel:\n${vercelErrors.join('\n')}\n\nYou may need to manually remove these domains from your Vercel project.`);
      }

      setShowDeleteModal(false);
      setSelectedWebsite(null);
    } catch (error) {
      console.error('[handleDeleteWebsite] Error deleting website:', error);
      alert(`Failed to delete website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (websiteId: string) => {
    try {
      await toggleWebsitePublish({
        userId: user?.id as any,
        websiteId: websiteId as any});
    } catch (error) {
      console.error('Error toggling website publish status:', error);
    }
  };

  const openEditModal = (website: any) => {
    setSelectedWebsite(website);
    setFormData({
      name: website.name,
      description: website.description || '',
      domain: (website.domains && website.domains.length > 0) ? website.domains[0] : '',
      isPublished: website.isPublished});
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      domain: '',
      isPublished: false});
    setDomainValidation(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
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
            <span className="text-slate-900 font-medium">Websites</span>
          </div>

          {/* Title Section */}
          <div className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/companies/${companyId}/manage`}
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Websites</h1>
                  <p className="text-slate-600 mt-1">
                    {company?.name || 'Manage your websites'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={handleOpenCreateModal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">New Website</span>
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

        {/* Search Bar and Websites Grid */}
        {!isDataLoading && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search websites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Websites Grid */}
            {filteredWebsites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWebsites.map((website) => (
              <div
                key={website._id}
                className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                  website.isPublished
                    ? 'border-slate-200/80 hover:border-slate-300'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Gradient Header Bar */}
                <div className={`h-1.5 rounded-t-2xl ${website.isPublished ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800' : 'bg-slate-300'}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                        website.isPublished
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-900/20'
                          : 'bg-slate-200'
                      }`}>
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{website.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            website.isPublished
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${website.isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {website.isPublished ? 'Active' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Switch and Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(website._id)}
                        className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                          website.isPublished ? 'bg-slate-800' : 'bg-slate-300'
                        }`}
                        title={website.isPublished ? 'Unpublish website' : 'Publish website'}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                          website.isPublished ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(website)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                        title="Delete website"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {website.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{website.description}</p>
                  )}

                  {/* Domains */}
                  <div className="mb-4">
                    {website.domains && website.domains.length > 0 ? (
                      <div className="space-y-1">
                        {website.domains.map((domain: string) => (
                          <a
                            key={domain}
                            href={`https://${domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-slate-900 hover:text-slate-600 transition-colors font-medium"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {domain}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No domains configured</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/companies/${website.companyId}/websites/${website._id}/pages`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-[#010236] hover:border-[#010236] hover:bg-slate-50 rounded-lg transition-all duration-200"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Pages
                    </Link>
                    <Link
                      href={`/companies/${website.companyId}/websites/${website._id}/settings`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-[#010236] hover:border-[#010236] hover:bg-slate-50 rounded-lg transition-all duration-200"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </Link>
                    <button
                      onClick={() => openEditModal(website)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-[#010236] hover:border-[#010236] hover:bg-slate-50 rounded-lg transition-all duration-200"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleCopyClick(website)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No websites found' : 'No websites yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first website'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-4 w-4" />
                Create Website
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
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">New Website</h3>
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
                  Website Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., My Website"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this website"
                  rows={2}
                  maxLength={500}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Domain Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Subdomain <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.domain.includes('.') ? formData.domain.split('.')[0] : formData.domain}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setFormData({ ...formData, domain: value });
                      setDomainValidation(null);
                    }}
                    placeholder="my-website"
                    className="w-full px-4 py-3 pr-32 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                    .{SUBDOMAIN_BASE}
                  </span>
                </div>
                {domainValidation && (
                  <div className={`flex items-center gap-1.5 text-xs mt-2 ${domainValidation.available ? 'text-emerald-600' : 'text-red-600'}`}>
                    {domainValidation.available ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>{domainValidation.message}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Publish Website</label>
                  <p className="text-xs text-slate-500 mt-0.5">Make this website publicly accessible</p>
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
                  onClick={handleCreateWebsite}
                  disabled={!formData.name.trim() || !formData.description.trim() || isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Create Website'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedWebsite && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Edit2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Website</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedWebsite(null);
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
                  Website Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., My Website"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this website"
                  rows={2}
                  maxLength={500}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Domain Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Subdomain <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.domain.includes('.') ? formData.domain.split('.')[0] : formData.domain}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setFormData({ ...formData, domain: value });
                      setDomainValidation(null);
                    }}
                    placeholder="my-website"
                    className="w-full px-4 py-3 pr-32 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                    .{SUBDOMAIN_BASE}
                  </span>
                </div>
                {domainValidation && (
                  <div className={`flex items-center gap-1.5 text-xs mt-2 ${domainValidation.available ? 'text-emerald-600' : 'text-red-600'}`}>
                    {domainValidation.available ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>{domainValidation.message}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Publish Website</label>
                  <p className="text-xs text-slate-500 mt-0.5">Make this website publicly accessible</p>
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
                    setSelectedWebsite(null);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateWebsite}
                  disabled={!formData.name.trim() || !formData.description.trim() || !formData.domain.trim() || isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Update Website'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedWebsite && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete Website</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedWebsite(null);
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
                    Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedWebsite.name}</span>?
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 leading-relaxed">
                  This action cannot be undone. The website and all its domains will be permanently removed.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedWebsite(null);
                  }}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWebsite}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-200"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    'Delete Website'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Website Modal */}
      {showCopyModal && selectedWebsite && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Copy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Copy Website</h3>
                  <p className="text-xs text-slate-600">Create a duplicate of "{selectedWebsite.name}"</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCopyModal(false);
                  setSelectedWebsite(null);
                  setCopyFormData({ name: '', domain: '' });
                  setCopyDomainValidation(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 leading-relaxed">
                  This will create a complete copy of the website including all pages, settings, and branding. The new website will be unpublished by default.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  New Website Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={copyFormData.name}
                  onChange={(e) => setCopyFormData({ ...copyFormData, name: e.target.value })}
                  placeholder="e.g., My Website (Copy)"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Domain Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  New Subdomain <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={copyFormData.domain.includes('.') ? copyFormData.domain.split('.')[0] : copyFormData.domain}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setCopyFormData({ ...copyFormData, domain: value });
                      setCopyDomainValidation(null);
                    }}
                    placeholder="my-website-copy"
                    className="w-full px-4 py-3 pr-32 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                    .{SUBDOMAIN_BASE}
                  </span>
                </div>
                {copyDomainValidation && (
                  <div className={`flex items-center gap-1.5 text-xs mt-2 ${copyDomainValidation.available ? 'text-emerald-600' : 'text-red-600'}`}>
                    {copyDomainValidation.available ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>{copyDomainValidation.message}</span>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Summary</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-emerald-600" />
                    All pages will be copied
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-emerald-600" />
                    Branding and settings will be copied
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-emerald-600" />
                    New website will be unpublished
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-emerald-600" />
                    Unique subdomain required
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCopyModal(false);
                    setSelectedWebsite(null);
                    setCopyFormData({ name: '', domain: '' });
                    setCopyDomainValidation(null);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyWebsite}
                  disabled={!copyFormData.name.trim() || !copyFormData.domain.trim() || isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-200"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Copying...
                    </span>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 inline mr-1.5" />
                      Copy Website
                    </>
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
