'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  X,
  Check,
  RefreshCw,
  ExternalLink,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface CompanyDomainsSettingsTabProps {
  companyId: string;
  requestingUserId: string;
  currentSubdomain?: string;
}

interface DomainValidationState {
  checking: boolean;
  checked: boolean;
  available: boolean | null;
  message: string;
}

const defaultValidationState: DomainValidationState = {
  checking: false,
  checked: false,
  available: null,
  message: '',
};

type DnsStatus = 'checking' | 'valid' | 'invalid' | 'pending' | 'unknown';

const SUBDOMAIN_BASE = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';

export default function CompanyDomainsSettingsTab({
  companyId,
  requestingUserId,
  currentSubdomain,
}: CompanyDomainsSettingsTabProps) {
  // State for adding subdomains
  const [isAddingSubdomain, setIsAddingSubdomain] = useState(false);
  const [newSubdomain, setNewSubdomain] = useState('');
  const [subdomainValidation, setSubdomainValidation] = useState<DomainValidationState>(defaultValidationState);

  // State for adding custom domains
  const [isAddingCustomDomain, setIsAddingCustomDomain] = useState(false);
  const [newCustomDomain, setNewCustomDomain] = useState('');
  const [customDomainValidation, setCustomDomainValidation] = useState<DomainValidationState>(defaultValidationState);

  // DNS status
  const [dnsStatus, setDnsStatus] = useState<Record<string, DnsStatus>>({});
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);

  // Loading states
  const [isAddingSubdomainLoading, setIsAddingSubdomainLoading] = useState(false);
  const [isAddingCustomDomainLoading, setIsAddingCustomDomainLoading] = useState(false);
  const [removingDomain, setRemovingDomain] = useState<string | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<{ type: 'subdomain' | 'custom'; value: string } | null>(null);

  // Primary domain selection
  const [selectedPrimaryDomain, setSelectedPrimaryDomain] = useState(currentSubdomain || '');

  // Query domains
  const domains = useQuery(
    api.domainManagement.getCompanyDomains,
    { companyId: companyId as any }
  );

  // Mutations
  const addCompanyCustomDomain = useMutation(api.domainManagement.addCompanyCustomDomain);
  const removeCompanyCustomDomain = useMutation(api.domainManagement.removeCompanyCustomDomain);
  const updateCompanyPrimaryDomain = useMutation(api.companies.updateCompanyPrimaryDomain);

  // Initialize primary domain from props
  useEffect(() => {
    if (currentSubdomain) {
      setSelectedPrimaryDomain(currentSubdomain);
    }
  }, [currentSubdomain]);

  // Auto-set primary domain when domains are loaded
  useEffect(() => {
    if (!domains) return;
    
    const subDomains = domains.filter((d) => d.domainType === 'subdomain').map((d) => d.domainValue);
    const customDomains = domains.filter((d) => d.domainType === 'custom').map((d) => d.domainValue);
    const allDomains = [...subDomains, ...customDomains];

    // If there's only one domain and no primary is set, set it as primary
    if (allDomains.length === 1 && !selectedPrimaryDomain && allDomains[0]) {
      const singleDomain = allDomains[0];
      updateCompanyPrimaryDomain({
        companyId: companyId as any,
        primaryDomain: singleDomain,
      }).then(() => {
        setSelectedPrimaryDomain(singleDomain);
        toast.success(`Primary domain automatically set to ${singleDomain}`);
      }).catch(console.error);
    }
  }, [domains, selectedPrimaryDomain, companyId, updateCompanyPrimaryDomain]);

  // Process domains
  const subDomains = domains?.filter((d) => d.domainType === 'subdomain').map((d) => d.domainValue) || [];
  const customDomains = domains?.filter((d) => d.domainType === 'custom').map((d) => d.domainValue) || [];

  // Auto-check DNS status for custom domains on load
  useEffect(() => {
    if (!customDomains.length) return;
    
    const checkAllDomains = async () => {
      for (const domain of customDomains) {
        if (!dnsStatus[domain]) {
          await handleCheckDns(domain);
        }
      }
    };
    
    checkAllDomains();
  }, [customDomains.length]);
  const allDomains = [...subDomains, ...customDomains];

  // Validate subdomain format
  const validateSubdomainFormat = (value: string): boolean => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return cleaned.length >= 3 && cleaned.length <= 63 && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(cleaned);
  };

  // Validate custom domain format
  const validateCustomDomainFormat = (value: string): boolean => {
    const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(value.toLowerCase());
  };

  // Check subdomain availability via API
  const checkSubdomainAvailability = async (subdomain: string) => {
    const subdomainBase = SUBDOMAIN_BASE;
    const fullSubdomain = `${subdomain.toLowerCase()}.${subdomainBase}`;

    const response = await fetch(`/api/validate-subdomain?subdomain=${encodeURIComponent(subdomain)}&excludeWebsiteId=${companyId}`);
    const result = await response.json();

    return result;
  };

  // Check custom domain availability via API
  const checkCustomDomainAvailability = async (domain: string) => {
    const response = await fetch(`/api/validate-custom-domain?customDomain=${encodeURIComponent(domain)}&excludeWebsiteId=${companyId}`);
    const result = await response.json();

    return result;
  };

  // Handle subdomain input change
  const handleSubdomainChange = async (value: string) => {
    setNewSubdomain(value);

    if (value.length < 3) {
      setSubdomainValidation(defaultValidationState);
      return;
    }

    if (!validateSubdomainFormat(value)) {
      setSubdomainValidation({
        checking: false,
        checked: true,
        available: false,
        message: 'Subdomain must be 3-63 characters, alphanumeric and hyphens only',
      });
      return;
    }

    setSubdomainValidation({ checking: true, checked: false, available: null, message: 'Checking availability...' });

    try {
      const result = await checkSubdomainAvailability(value);
      setSubdomainValidation({
        checking: false,
        checked: true,
        available: result.available,
        message: result.message || (result.available ? 'Subdomain is available' : 'Subdomain is taken'),
      });
    } catch (error) {
      setSubdomainValidation({
        checking: false,
        checked: true,
        available: null,
        message: 'Error checking availability',
      });
    }
  };

  // Handle custom domain input change
  const handleCustomDomainChange = async (value: string) => {
    setNewCustomDomain(value);

    if (value.length < 5) {
      setCustomDomainValidation(defaultValidationState);
      return;
    }

    if (!validateCustomDomainFormat(value)) {
      setCustomDomainValidation({
        checking: false,
        checked: true,
        available: false,
        message: 'Invalid domain format (e.g., example.com)',
      });
      return;
    }

    setCustomDomainValidation({ checking: true, checked: false, available: null, message: 'Checking availability...' });

    try {
      const result = await checkCustomDomainAvailability(value);
      setCustomDomainValidation({
        checking: false,
        checked: true,
        available: result.available,
        message: result.message || (result.available ? 'Domain is available' : 'Domain is taken'),
      });
    } catch (error) {
      setCustomDomainValidation({
        checking: false,
        checked: true,
        available: null,
        message: 'Error checking availability',
      });
    }
  };

  // Add subdomain
  const handleAddSubdomain = async () => {
    if (!subdomainValidation.available) {
      toast.error('Please enter a valid available subdomain');
      return;
    }

    setIsAddingSubdomainLoading(true);

    try {
      const subdomainValue = newSubdomain.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 63);
      
      const fullSubdomain = `${subdomainValue}.${SUBDOMAIN_BASE}`;

      // Add to Vercel first
      const vercelResponse = await fetch('/api/vercel/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: fullSubdomain,
          addWwwRedirect: true,
        }),
      });

      const vercelResult = await vercelResponse.json();

      if (!vercelResult.success) {
        throw new Error(vercelResult.error || 'Failed to add subdomain to Vercel');
      }

      // Then add to database
      await addCompanyCustomDomain({
        companyId: companyId as any,
        customDomain: fullSubdomain,
        requestingUserId: requestingUserId as any,
        domainType: 'subdomain',
      });

      toast.success(`Subdomain "${fullSubdomain}" added successfully!`);
      setNewSubdomain('');
      setSubdomainValidation(defaultValidationState);
      setIsAddingSubdomain(false);

      // Set as primary if it's the first domain
      if (!selectedPrimaryDomain) {
        setSelectedPrimaryDomain(fullSubdomain);
        await updateCompanyPrimaryDomain({
          companyId: companyId as any,
          primaryDomain: fullSubdomain,
        });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add subdomain');
    } finally {
      setIsAddingSubdomainLoading(false);
    }
  };

  // Add custom domain
  const handleAddCustomDomain = async () => {
    if (!customDomainValidation.available) {
      toast.error('Please enter a valid available domain');
      return;
    }

    setIsAddingCustomDomainLoading(true);

    try {
      const domainValue = newCustomDomain.toLowerCase();

      // Add to Vercel first
      const vercelResponse = await fetch('/api/vercel/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domainValue,
          addWwwRedirect: true,
        }),
      });

      const vercelResult = await vercelResponse.json();

      if (!vercelResult.success) {
        throw new Error(vercelResult.error || 'Failed to add domain to Vercel');
      }

      // Then add to database
      await addCompanyCustomDomain({
        companyId: companyId as any,
        customDomain: domainValue,
        requestingUserId: requestingUserId as any,
      });

      toast.success(`Custom domain "${domainValue}" added successfully! Please configure your DNS.`);
      setNewCustomDomain('');
      setCustomDomainValidation(defaultValidationState);
      setIsAddingCustomDomain(false);

      // Check DNS after adding
      handleCheckDns(domainValue);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add custom domain');
    } finally {
      setIsAddingCustomDomainLoading(false);
    }
  };

  // Remove domain
  const handleRemoveDomain = async () => {
    if (!domainToDelete) return;

    setRemovingDomain(domainToDelete.value);

    try {
      // Remove from Vercel for both custom domains and subdomains
      const vercelResponse = await fetch('/api/vercel/domains/remove-both', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainToDelete.value }),
      });

      const vercelResult = await vercelResponse.json();

      if (!vercelResult.success) {
        console.warn('Failed to remove domain from Vercel:', vercelResult.error);
      }

      // Remove from database
      const domain = domains?.find(d => d.domainValue === domainToDelete.value);
      if (domain) {
        await removeCompanyCustomDomain({
          companyId: companyId as any,
          domainId: domain._id as any,
          requestingUserId: requestingUserId as any,
        });
      }

      toast.success(`Domain "${domainToDelete.value}" removed successfully!`);
      
      // Clear primary domain if it was the removed domain
      if (selectedPrimaryDomain === domainToDelete.value) {
        setSelectedPrimaryDomain('');
      }

      setShowDeleteModal(false);
      setDomainToDelete(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove domain');
    } finally {
      setRemovingDomain(null);
    }
  };

  // Open delete modal
  const openDeleteModal = (type: 'subdomain' | 'custom', value: string) => {
    setDomainToDelete({ type, value });
    setShowDeleteModal(true);
  };

  // Check DNS status
  const handleCheckDns = async (domain: string) => {
    setIsRefreshing(domain);
    setDnsStatus(prev => ({ ...prev, [domain]: 'checking' }));

    try {
      const response = await fetch(`/api/vercel/domains?domain=${encodeURIComponent(domain)}`);
      const result = await response.json();

      if (result) {
        const isVerified = result.verified === true;
        const isMisconfigured = result.misconfigured === true;
        const hasNameServers = result.nameServers && result.nameServers.length > 0;
        const hasApexName = result.apexName || result.serviceType;
        const configuredAt = result.configuredAt;
        const verificationType = result.verificationType;
        const verificationStep = result.verificationStep;

        let finalStatus: DnsStatus = 'pending';
        if (isMisconfigured) {
          finalStatus = 'invalid';
        } else if (verificationType || verificationStep) {
          finalStatus = 'invalid';
        } else if (!configuredAt) {
          finalStatus = 'invalid';
        } else if (isVerified || hasNameServers || hasApexName) {
          finalStatus = 'valid';
        }

        setDnsStatus(prev => ({ ...prev, [domain]: finalStatus }));

        if (finalStatus === 'valid') {
          toast.success('DNS configuration is valid!');
        } else if (finalStatus === 'invalid') {
          toast.error('DNS configuration is invalid. Please check your DNS settings.');
        }
      } else {
        setDnsStatus(prev => ({ ...prev, [domain]: 'unknown' }));
      }
    } catch (error) {
      console.error('Error checking DNS:', error);
      setDnsStatus(prev => ({ ...prev, [domain]: 'unknown' }));
      toast.error('Failed to check DNS status.');
    } finally {
      setIsRefreshing(null);
    }
  };

  // Set primary domain
  const handleSetPrimaryDomain = async (domain: string) => {
    try {
      await updateCompanyPrimaryDomain({
        companyId: companyId as any,
        primaryDomain: domain,
      });
      setSelectedPrimaryDomain(domain);
      toast.success(`Primary domain set to ${domain}`);
    } catch (error) {
      toast.error('Failed to set primary domain');
    }
  };

  if (domains === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Domain Selection */}
      {allDomains.length > 1 && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Primary Domain (SEO)
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Choose the main domain for SEO. Other domains will redirect to this one.
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {allDomains.map((domain) => (
              <button
                key={domain}
                onClick={() => handleSetPrimaryDomain(domain)}
                disabled={selectedPrimaryDomain === domain}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPrimaryDomain === domain
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-emerald-500 hover:text-emerald-600'
                }`}
              >
                {selectedPrimaryDomain === domain && <Check className="w-4 h-4 inline mr-1" />}
                {domain}
              </button>
            ))}
          </div>
          
          {selectedPrimaryDomain && (
            <p className="text-sm text-emerald-700 mt-3 flex items-center gap-1">
              <Check className="w-4 h-4" />
              All other domains will 301 redirect to {selectedPrimaryDomain}
            </p>
          )}
        </div>
      )}

      {/* Subdomains Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Subdomains</h3>
            <p className="text-sm text-slate-500 mt-0.5">Your company's subdomain on {SUBDOMAIN_BASE}</p>
          </div>
          {!isAddingSubdomain && (
            <button
              onClick={() => setIsAddingSubdomain(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Subdomain
            </button>
          )}
        </div>

        <div className="p-6 space-y-3">
          {/* Existing Subdomains */}
          {subDomains.length > 0 ? (
            subDomains.map((subdomain) => (
              <div
                key={subdomain}
                className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100 group"
              >
                <div className="flex-1">
                  <a
                    href={`https://${subdomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium text-emerald-900 hover:text-emerald-700 flex items-center gap-1"
                  >
                    {subdomain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  {/* Primary domain indicator */}
                  {selectedPrimaryDomain === subdomain && (
                    <span className="text-emerald-600 flex items-center gap-1 text-sm">
                      <Check className="w-4 h-4" />
                      Primary
                    </span>
                  )}
                  {selectedPrimaryDomain !== subdomain && (
                    <button
                      onClick={() => handleSetPrimaryDomain(subdomain)}
                      className="text-sm text-slate-500 hover:text-emerald-600 px-2 py-1"
                    >
                      Set as primary
                    </button>
                  )}
                  <button
                    onClick={() => openDeleteModal('subdomain', subdomain)}
                    disabled={removingDomain === subdomain}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove subdomain"
                  >
                    {removingDomain === subdomain ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : null}

          {/* Add Subdomain Form */}
          {isAddingSubdomain && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newSubdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      placeholder="my-company"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      autoFocus
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      .{SUBDOMAIN_BASE}
                    </span>
                  </div>
                </div>

                {subdomainValidation.checked && subdomainValidation.message && (
                  <div className={`text-sm ${subdomainValidation.available ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span>{subdomainValidation.message}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAddSubdomain}
                  disabled={!subdomainValidation.available || isAddingSubdomainLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingSubdomainLoading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Subdomain
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsAddingSubdomain(false);
                    setNewSubdomain('');
                    setSubdomainValidation(defaultValidationState);
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isAddingSubdomain && subDomains.length === 0 && (
            <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 p-6 text-center">
              <Globe className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                No subdomains added yet
              </p>
              <button
                onClick={() => setIsAddingSubdomain(true)}
                className="mt-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                Add your first subdomain
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Domains Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-violet-50 to-slate-50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Custom Domains</h3>
            <p className="text-sm text-slate-500 mt-0.5">Connect your own domain names</p>
          </div>
          {!isAddingCustomDomain && (
            <button
              onClick={() => setIsAddingCustomDomain(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Custom Domain
            </button>
          )}
        </div>

        <div className="p-6 space-y-3">
          {/* Existing Custom Domains */}
          {customDomains.length > 0 ? (
            customDomains.map((domain) => (
              <div
                key={domain}
                className="flex items-center justify-between p-4 bg-violet-50 rounded-lg border border-violet-100 group"
              >
                <div className="flex-1">
                  <a
                    href={`https://${domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium text-violet-900 hover:text-violet-700 flex items-center gap-1"
                  >
                    {domain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  {/* DNS Status */}
                  {dnsStatus[domain] === 'checking' && (
                    <span className="text-blue-600 flex items-center gap-1 text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Checking...
                    </span>
                  )}
                  {dnsStatus[domain] === 'valid' && (
                    <span className="text-emerald-600 flex items-center gap-1 text-sm">
                      <Check className="w-4 h-4" />
                      Configured
                    </span>
                  )}
                  {dnsStatus[domain] === 'pending' && (
                    <span className="text-amber-600 flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4" />
                      Pending
                    </span>
                  )}
                  {!dnsStatus[domain] && (
                    <button
                      onClick={() => handleCheckDns(domain)}
                      className="text-xs text-violet-600 hover:text-violet-700"
                    >
                      Check DNS
                    </button>
                  )}

                  {/* Primary domain indicator */}
                  {selectedPrimaryDomain === domain && (
                    <span className="text-emerald-600 flex items-center gap-1 text-sm">
                      <Check className="w-4 h-4" />
                      Primary
                    </span>
                  )}
                  {selectedPrimaryDomain !== domain && (
                    <button
                      onClick={() => handleSetPrimaryDomain(domain)}
                      className="text-sm text-slate-500 hover:text-emerald-600 px-2 py-1"
                    >
                      Set as primary
                    </button>
                  )}

                  <button
                    onClick={() => handleCheckDns(domain)}
                    disabled={isRefreshing === domain}
                    className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                    title="Check DNS status"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing === domain ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => openDeleteModal('custom', domain)}
                    disabled={removingDomain === domain}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove custom domain"
                  >
                    {removingDomain === domain ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : null}

          {/* Add Custom Domain Form */}
          {isAddingCustomDomain && (
            <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newCustomDomain}
                      onChange={(e) => handleCustomDomainChange(e.target.value)}
                      placeholder="mydomain.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                      autoFocus
                    />
                  </div>
                </div>

                {customDomainValidation.checked && customDomainValidation.message && (
                  <div className={`text-sm ${customDomainValidation.available ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span>{customDomainValidation.message}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAddCustomDomain}
                  disabled={!customDomainValidation.available || isAddingCustomDomainLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingCustomDomainLoading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Domain
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsAddingCustomDomain(false);
                    setNewCustomDomain('');
                    setCustomDomainValidation(defaultValidationState);
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>

              {/* DNS Info for new custom domains */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">DNS Configuration Required</p>
                    <p className="mt-1">After adding your domain, you need to configure DNS records to point to our servers. See below for instructions.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isAddingCustomDomain && customDomains.length === 0 && (
            <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
              <Globe className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No custom domains configured</h3>
              <p className="text-sm text-slate-500 mb-4">
                Connect your own domain to give your company a professional, branded URL.
              </p>
              <button
                onClick={() => setIsAddingCustomDomain(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-medium"
              >
                Add Custom Domain
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DNS Configuration Instructions */}
      {customDomains.length > 0 && (
        <div className={`border rounded-lg overflow-hidden ${customDomains.every(d => dnsStatus[d] === 'valid') ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`px-4 py-3 border-b ${customDomains.every(d => dnsStatus[d] === 'valid') ? 'border-emerald-200 bg-emerald-100' : 'border-amber-200'}`}>
            <div className="flex items-center gap-2">
              <Globe className={`w-5 h-5 ${customDomains.every(d => dnsStatus[d] === 'valid') ? 'text-emerald-600' : 'text-amber-600'}`} />
              <h4 className={`text-sm font-semibold ${customDomains.every(d => dnsStatus[d] === 'valid') ? 'text-emerald-900' : 'text-amber-900'}`}>
                {customDomains.every(d => dnsStatus[d] === 'valid') ? 'DNS Configured' : 'DNS Configuration Required'}
              </h4>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {customDomains.map((domain) => {
              const status = dnsStatus[domain];
              const isValid = status === 'valid';
              const isInvalid = status === 'invalid';
              const isPending = !status || (status !== 'checking' && status !== 'valid' && status !== 'invalid' && status !== 'unknown');

              return (
                <div key={domain} className="bg-white rounded-lg border border-amber-100 overflow-hidden">
                  <div className="px-3 py-2 border-b border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{domain}</span>
                      {isValid && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                          <Check className="w-3 h-3" />
                          Valid Configuration
                        </span>
                      )}
                      {isInvalid && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3" />
                          Invalid Configuration
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3" />
                          Pending Configuration
                        </span>
                      )}
                      {status === 'checking' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Checking...
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCheckDns(domain)}
                      disabled={isRefreshing === domain}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {isRefreshing === domain ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Refreshing...
                        </span>
                      ) : (
                        'Refresh'
                      )}
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-slate-600 mb-2">
                      Add the following DNS records to your domain provider:
                    </p>
                    {/* CNAME Record for www */}
                    <div className="flex items-center gap-3 text-xs bg-slate-50 rounded p-2">
                      <span className="font-medium text-slate-700 w-12">CNAME</span>
                      <span className="text-slate-600 w-8">www</span>
                      <span className="font-mono text-slate-900 flex-1 truncate">→ cname.vercel-dns.com</span>
                    </div>
                    {/* A Record for @ */}
                    <div className="flex items-center gap-3 text-xs bg-slate-50 rounded p-2">
                      <span className="font-medium text-slate-700 w-12">A</span>
                      <span className="text-slate-600 w-8">@</span>
                      <span className="font-mono text-slate-900 flex-1 truncate">→ 216.150.1.1</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 italic">
                      Note: Vercel may provide unique DNS records. Check your domain settings in Vercel for the most accurate records.
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="flex items-start gap-2 text-xs text-amber-700 pt-2">
              <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                DNS propagation typically takes less than 4 hours but may take up to 48 hours.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && domainToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-red-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete Domain</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDomainToDelete(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Confirm Deletion</p>
                  <p className="text-sm text-slate-600">
                    Are you sure you want to delete <span className="font-semibold text-slate-900">{domainToDelete.value}</span>?
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 leading-relaxed">
                  {domainToDelete.type === 'subdomain' 
                    ? 'This will remove the subdomain from your company and Vercel. Your company will still be accessible via other domains.'
                    : 'This will remove the custom domain from your company and Vercel. Your company will still be accessible via your subdomain.'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDomainToDelete(null);
                }}
                disabled={!!removingDomain}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveDomain}
                disabled={!!removingDomain}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-200"
              >
                {removingDomain ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  'Delete Domain'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}