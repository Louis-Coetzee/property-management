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
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Entity type for domain management
export type DomainEntityType = 'website' | 'calendar' | 'store' | 'business' | 'courseSite' | 'propertySite' | 'scheduler' | 'vehicleDealershipSite';

export interface MultiDomainsSettings {
  subDomains: string[];
  customDomains: string[];
}

interface MultiDomainsSettingsTabProps {
  entityId: string;
  entityType: DomainEntityType;
  onSave?: () => void;
  primaryDomain?: string; // The owner domain for display (e.g., "livewebapp.site")
  requestingUserId: string;
  currentPrimaryDomain?: string; // The current primary domain set on the website
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

interface DomainDnsConfig {
  verified: boolean;
  aRecord?: string;
  cnameRecord?: string;
  nameServers?: string[];
  misconfigured: boolean;
  serviceType?: string;
}

const SUBDOMAIN_BASE = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';

export default function MultiDomainsSettingsTab({
  entityId,
  entityType,
  onSave,
  primaryDomain = SUBDOMAIN_BASE,
  requestingUserId,
  currentPrimaryDomain,
}: MultiDomainsSettingsTabProps) {
  // State
  const [isAddingCustomDomain, setIsAddingCustomDomain] = useState(false);
  const [newCustomDomain, setNewCustomDomain] = useState('');
  const [customDomainValidation, setCustomDomainValidation] = useState<DomainValidationState>(defaultValidationState);
  const [removingDomain, setRemovingDomain] = useState<string | null>(null);
  const [addingDomain, setAddingDomain] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<Record<string, DnsStatus>>({});
  const [dnsConfigs, setDnsConfigs] = useState<Record<string, DomainDnsConfig>>({});
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const [selectedPrimaryDomain, setSelectedPrimaryDomain] = useState(currentPrimaryDomain || '');

  // Mutations
  const updateWebsiteMutation = useMutation(api.websites.updateWebsite);
  const addCustomDomainMutation = useMutation(api.domainManagement.addCustomDomain);
  const removeCustomDomainMutation = useMutation(api.domainManagement.removeCustomDomain);

  // Convex queries
  const entityDomains = useQuery(api.domainManagement.getEntityDomains, {
    entityId: entityId as any,
    entityType,
  });

  // Update local state when prop changes
  useEffect(() => {
    if (currentPrimaryDomain) {
      setSelectedPrimaryDomain(currentPrimaryDomain);
    }
  }, [currentPrimaryDomain]);

  // Auto-set primary domain if only one domain exists and none is selected
  useEffect(() => {
    if (!entityDomains) return;
    
    const { customDomains = [], subDomains = [] } = entityDomains;
    const allDomains = [...subDomains, ...customDomains];
    
    // If there's only one domain and no primary domain is set, set it as primary
    if (allDomains.length === 1 && !selectedPrimaryDomain && allDomains[0]) {
      const singleDomain = allDomains[0];
      updateWebsiteMutation({
        websiteId: entityId as any,
        userId: requestingUserId as any,
        primaryDomain: singleDomain,
      }).then(() => {
        setSelectedPrimaryDomain(singleDomain);
        onSave?.();
        toast.success(`Primary domain automatically set to ${singleDomain}`);
      }).catch(console.error);
    }
  }, [entityDomains, selectedPrimaryDomain, entityId, requestingUserId, updateWebsiteMutation, onSave]);

  // Deletion confirmation modal state
  const [showDeleteCustomDomainModal, setShowDeleteCustomDomainModal] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<{ type: 'custom'; value: string } | null>(null);

  // Fetch DNS configuration for all custom domains when they change
  useEffect(() => {
    const { customDomains = [] } = entityDomains || {};
    if (customDomains.length > 0) {
      customDomains.forEach(domain => {
        // Only fetch if we haven't already fetched or if it was never checked
        if (!dnsConfigs[domain]) {
          handleCheckDns(domain);
        }
      });
    }
    // Only run when customDomains change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityDomains?.customDomains]);

  // Add custom domain handler
  const handleAddCustomDomain = async () => {
    if (!newCustomDomain) return;

    setAddingDomain(true);

    try {
      // First, validate the domain availability
      const validationResponse = await fetch('/api/validate-custom-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customDomain: newCustomDomain,
          excludeEntityId: entityId,
          excludeEntityType: entityType,
        }),
      });

      const validationResult = await validationResponse.json();

      if (!validationResult.available) {
        setCustomDomainValidation({
          checking: false,
          checked: true,
          available: false,
          message: validationResult.message || 'Domain is not available',
        });
        return;
      }

      // Domain is available, proceed to add to Vercel
      const vercelResponse = await fetch('/api/vercel/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newCustomDomain,
          addWwwRedirect: true,
        }),
      });

      const vercelResult = await vercelResponse.json();

      if (!vercelResult.success) {
        throw new Error(vercelResult.error || 'Failed to add domain to Vercel');
      }

      // Then add to database
      await addCustomDomainMutation({
        entityId: entityId as any,
        entityType,
        customDomain: newCustomDomain,
        requestingUserId: requestingUserId as any,
      });

      toast.success(`Custom domain "${newCustomDomain}" added successfully! Please configure your DNS.`);
      setNewCustomDomain('');
      setCustomDomainValidation(defaultValidationState);
      setIsAddingCustomDomain(false);
      onSave?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add custom domain';
      toast.error(errorMessage);
    } finally {
      setAddingDomain(false);
    }
  };

  // Remove custom domain handler
  const handleRemoveCustomDomain = async (customDomain: string) => {
    setRemovingDomain(`custom-${customDomain}`);
    try {
      // Remove both root domain and www subdomain from Vercel
      const vercelResponse = await fetch('/api/vercel/domains/remove-both', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: customDomain }),
      });

      const vercelResult = await vercelResponse.json();

      if (!vercelResult.success) {
        console.warn('Failed to remove domain from Vercel:', vercelResult.error);
        // Continue anyway - domain might not exist on Vercel
      } else {
        console.log('Domain removal results:', vercelResult.results);
      }

      // Remove from database
      await removeCustomDomainMutation({
        entityId: entityId as any,
        entityType,
        customDomain,
        requestingUserId: requestingUserId as any,
      });

      toast.success(`Custom domain "${customDomain}" removed successfully!`);
      setShowDeleteCustomDomainModal(false);
      setDomainToDelete(null);
      onSave?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove custom domain';
      toast.error(errorMessage);
    } finally {
      setRemovingDomain(null);
    }
  };

  // Open delete custom domain modal
  const openDeleteCustomDomainModal = (customDomain: string) => {
    setDomainToDelete({ type: 'custom', value: customDomain });
    setShowDeleteCustomDomainModal(true);
  };

  // Check DNS status for a domain
  const handleCheckDns = async (domain: string) => {
    setIsRefreshing(domain);
    setDnsStatus(prev => ({ ...prev, [domain]: 'checking' }));

    try {
      const response = await fetch(`/api/vercel/domains?domain=${encodeURIComponent(domain)}`);
      const result = await response.json();

      console.log(`[DNS Check] Result for ${domain}:`, result);

      if (result) {
        // Determine DNS status based on Vercel's response
        let finalStatus: DnsStatus = 'pending';

        // Check if we got valid data from Vercel
        // Vercel returns domain info if it's properly configured
        // Key indicators: verified, or having a proper response
        const isVerified = result.verified === true;
        const isMisconfigured = result.misconfigured === true;
        
        // If Vercel returns a nameServers array or has SSL certs, it's configured
        const hasNameServers = result.nameServers && result.nameServers.length > 0;
        const hasApexName = result.apexName || result.serviceType;

        // Valid if: not misconfigured AND (verified OR has nameservers OR has apex config)
        if (isMisconfigured) {
          finalStatus = 'invalid';
        } else if (isVerified || hasNameServers || hasApexName) {
          // Domain is properly configured if Vercel returns any of these
          finalStatus = 'valid';
        } else {
          // If we got a response but none of the above, it's still pending
          finalStatus = 'pending';
        }

        setDnsStatus(prev => ({ ...prev, [domain]: finalStatus }));

        // Store DNS configuration
        setDnsConfigs(prev => ({
          ...prev,
          [domain]: {
            verified: result.verified || false,
            misconfigured: result.misconfigured || false,
            aRecord: result.apexName || '76.76.21.21',
            cnameRecord: result.crtName || 'cname.vercel-dns.com',
            nameServers: result.nameServers,
            serviceType: result.serviceType,
          },
        }));

        if (finalStatus === 'valid') {
          toast.success('DNS configuration is valid!');
        } else if (finalStatus === 'invalid') {
          toast.error('DNS configuration is invalid. Please check your DNS settings.');
        } else {
          toast('DNS check completed. If domain is working, this status may update shortly.', {
            icon: '⚠️',
            style: {
              background: '#fff7ed',
              color: '#c2410c',
            },
          });
        }
      } else {
        setDnsStatus(prev => ({ ...prev, [domain]: 'unknown' }));
      }
    } catch (error) {
      console.error(`[DNS Check] Error for ${domain}:`, error);
      setDnsStatus(prev => ({ ...prev, [domain]: 'unknown' }));
      toast.error('Failed to check DNS status.');
    } finally {
      setIsRefreshing(null);
    }
  };

  // Loading state
  if (entityDomains === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const { customDomains = [], subDomains = [] } = entityDomains || {};
  
  // Combine all domains for primary domain selection
  const allDomains = [...subDomains, ...customDomains];

  // Handle setting primary domain
  const handleSetPrimaryDomain = async (domain: string) => {
    try {
      await updateWebsiteMutation({
        websiteId: entityId as any,
        userId: requestingUserId as any,
        primaryDomain: domain,
      });
      setSelectedPrimaryDomain(domain);
      toast.success(`Primary domain set to ${domain}`);
      onSave?.();
    } catch (error) {
      toast.error('Failed to set primary domain');
    }
  };

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

      {/* Custom Domains Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Custom Domains</h3>
            <p className="text-sm text-slate-500 mt-0.5">Connect your own domain names</p>
          </div>
          {!isAddingCustomDomain && (
            <button
              onClick={() => setIsAddingCustomDomain(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 group"
              >
                <div className="flex-1">
                  <a
                    href={`https://${domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium text-blue-900 hover:text-blue-700 flex items-center gap-1"
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
                    <span className="text-slate-500 flex items-center gap-1 text-sm">
                      <Globe className="w-4 h-4" />
                      DNS Unknown
                    </span>
                  )}

                  <button
                    onClick={() => handleCheckDns(domain)}
                    disabled={isRefreshing === domain}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Check DNS status"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing === domain ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => openDeleteCustomDomainModal(domain)}
                    disabled={removingDomain === `custom-${domain}`}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove custom domain"
                  >
                    {removingDomain === `custom-${domain}` ? (
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
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newCustomDomain}
                      onChange={(e) => {
                        setNewCustomDomain(e.target.value.toLowerCase());
                        setCustomDomainValidation(defaultValidationState);
                      }}
                      placeholder="mydomain.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddCustomDomain}
                  disabled={!newCustomDomain || addingDomain}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingDomain ? (
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
            </div>
          )}
        </div>
      </div>

      {/* DNS Configuration Notice - Show if any custom domains exist */}
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
              const config = dnsConfigs[domain];
              const status = dnsStatus[domain];

              // Determine status based on explicit DNS check results
              // Valid: status === 'valid' (only set after explicit Vercel check confirms DNS is configured)
              // Invalid: status === 'invalid' (only set after explicit check shows misconfiguration)
              // Pending: No check done yet (status is undefined), or check returned pending state
              // Checking: Check is in progress
              const isValid = status === 'valid';
              const isInvalid = status === 'invalid';
              const isPending = !status || (status !== 'checking' && status !== 'valid' && status !== 'invalid' && status !== 'unknown');
              const wasChecked = status && status !== 'checking';

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

      {/* Empty state message */}
      {!isAddingCustomDomain && customDomains.length === 0 && (
        <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
          <Globe className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No custom domains configured</h3>
          <p className="text-sm text-slate-500 mb-4">
            Connect your own domain to give your site a professional, branded URL.
          </p>
          <button
            onClick={() => setIsAddingCustomDomain(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Add Custom Domain
          </button>
        </div>
      )}

      {/* Delete Custom Domain Confirmation Modal */}
      {showDeleteCustomDomainModal && domainToDelete?.type === 'custom' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-red-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete Custom Domain</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteCustomDomainModal(false);
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
                  This will remove the custom domain from your site and Vercel. Your site will still be accessible via your subdomain.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowDeleteCustomDomainModal(false);
                  setDomainToDelete(null);
                }}
                disabled={removingDomain === `custom-${domainToDelete.value}`}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveCustomDomain(domainToDelete.value)}
                disabled={removingDomain === `custom-${domainToDelete.value}`}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-200"
              >
                {removingDomain === `custom-${domainToDelete.value}` ? (
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
