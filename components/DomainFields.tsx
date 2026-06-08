'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const SUBDOMAIN_BASE = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';

interface DomainValidationState {
  checked: boolean;
  available: boolean | null;
  message: string;
  checking: boolean;
}

interface DomainFieldsProps {
  subdomain: string;
  onSubdomainChange: (value: string) => void;
  subdomainValidation: DomainValidationState;
  onSubdomainValidate: (subdomain: string) => void;
  showSubdomain?: boolean;
  subdomainLabel?: string;
  subdomainPlaceholder?: string;
  currentSubdomain?: string; // The original subdomain when editing
  customDomain?: string;
  onCustomDomainChange?: (value: string) => void;
  customDomainValidation?: DomainValidationState;
  onCustomDomainValidate?: (domain: string) => void;
  showCustomDomain?: boolean;
  customDomainLabel?: string;
  customDomainPlaceholder?: string;
  currentCustomDomain?: string;
}

export default function DomainFields({
  subdomain,
  onSubdomainChange,
  subdomainValidation,
  onSubdomainValidate,
  showSubdomain = true,
  subdomainLabel = 'Subdomain',
  subdomainPlaceholder = 'my-site',
  currentSubdomain,
  customDomain = '',
  onCustomDomainChange,
  customDomainValidation,
  onCustomDomainValidate,
  showCustomDomain = false,
  customDomainLabel = 'Custom Domain',
  customDomainPlaceholder = 'example.com',
  currentCustomDomain,
}: DomainFieldsProps) {
  const [localCustomDomain, setLocalCustomDomain] = useState(customDomain);

  // Use refs to store the latest validate functions and values
  // This prevents the useEffect from running when function references change
  const onSubdomainValidateRef = useRef(onSubdomainValidate);
  const onCustomDomainValidateRef = useRef(onCustomDomainValidate);
  const prevSubdomainRef = useRef(subdomain);
  const prevCustomDomainRef = useRef(localCustomDomain);

  // Keep refs in sync with latest functions
  useEffect(() => {
    onSubdomainValidateRef.current = onSubdomainValidate;
  }, [onSubdomainValidate]);

  useEffect(() => {
    onCustomDomainValidateRef.current = onCustomDomainValidate;
  }, [onCustomDomainValidate]);

  // Live validation for subdomain with debouncing - only runs when subdomain actually changes
  useEffect(() => {
    // Skip if subdomain hasn't actually changed (prevents unnecessary re-runs)
    if (subdomain === prevSubdomainRef.current) {
      return;
    }

    prevSubdomainRef.current = subdomain;

    // Skip validation if this is the current subdomain (editing mode)
    if (subdomain && currentSubdomain && subdomain === currentSubdomain) {
      return;
    }

    if (!subdomain || subdomain.trim() === '') {
      return;
    }

    const timer = setTimeout(() => {
      onSubdomainValidateRef.current(subdomain);
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [subdomain, currentSubdomain]);

  // Live validation for custom domain with debouncing - only runs when custom domain actually changes
  useEffect(() => {
    // Skip if custom domain hasn't actually changed (prevents unnecessary re-runs)
    if (localCustomDomain === prevCustomDomainRef.current) {
      return;
    }

    prevCustomDomainRef.current = localCustomDomain;

    // Skip validation if this is the current custom domain (editing mode)
    if (localCustomDomain && currentCustomDomain && localCustomDomain === currentCustomDomain) {
      return;
    }

    if (!localCustomDomain || localCustomDomain.trim() === '') {
      return;
    }

    const timer = setTimeout(() => {
      onCustomDomainValidateRef.current?.(localCustomDomain);
    }, 500);

    return () => clearTimeout(timer);
  }, [localCustomDomain, currentCustomDomain]);

  const handleCustomDomainChange = (value: string) => {
    setLocalCustomDomain(value);
    onCustomDomainChange?.(value);
  };

  return (
    <div className="space-y-5">
      {/* Subdomain Field - Live Validation */}
      {showSubdomain && (
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            {subdomainLabel} <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  onSubdomainChange(value);
                }}
                placeholder={subdomainPlaceholder}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
              />
              <span className="text-slate-600 text-sm font-medium whitespace-nowrap py-3">.{SUBDOMAIN_BASE}</span>

              <div className="flex items-center justify-center w-10">
                {subdomainValidation.checking && (
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                )}
                {subdomainValidation.checked && !subdomainValidation.checking && subdomainValidation.available && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
                {subdomainValidation.checked && !subdomainValidation.checking && !subdomainValidation.available && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
          {subdomainValidation.checked && subdomainValidation.message && (
            <p className={`text-sm mt-2 ${subdomainValidation.available ? 'text-emerald-600' : 'text-red-600'}`}>
              {currentSubdomain && subdomain === currentSubdomain && subdomainValidation.available
                ? `${subdomain}.${SUBDOMAIN_BASE} is the current subdomain`
                : subdomainValidation.message}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Your site will be accessible at <span className="font-medium">{subdomain || 'your-site'}.{SUBDOMAIN_BASE}</span>
          </p>
        </div>
      )}

      {/* Custom Domain Field */}
      {showCustomDomain && onCustomDomainChange && onCustomDomainValidate && (
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            {customDomainLabel}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={localCustomDomain}
                onChange={(e) => {
                  handleCustomDomainChange(e.target.value.toLowerCase());
                }}
                placeholder={customDomainPlaceholder}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
              />

              <div className="flex items-center justify-center w-10">
                {customDomainValidation?.checking && (
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                )}
                {customDomainValidation?.checked && !customDomainValidation.checking && customDomainValidation.available && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
                {customDomainValidation?.checked && !customDomainValidation.checking && !customDomainValidation.available && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
          {customDomainValidation?.checked && customDomainValidation.message && (
            <p className={`text-sm mt-2 ${customDomainValidation.available ? 'text-emerald-600' : 'text-red-600'}`}>
              {currentCustomDomain && localCustomDomain === currentCustomDomain && customDomainValidation.available
                ? `${localCustomDomain} is the current custom domain`
                : customDomainValidation.message}
            </p>
          )}
          {customDomainValidation?.checked && customDomainValidation.available && (
            <p className="text-xs text-slate-500 mt-1">
              After adding, you&apos;ll need to configure DNS records to point to Vercel
            </p>
          )}
        </div>
      )}
    </div>
  );
}
