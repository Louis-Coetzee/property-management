'use client';

import { useState } from 'react';
import { X, ChevronDown, ExternalLink, FileText, Hash, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageSection } from '@/types/page-builder';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface CTALink {
  ctaText?: string;
  ctaType?: 'url' | 'page' | 'form';
  ctaLink?: string;
  ctaPageId?: string;
  ctaSectionId?: string;
  ctaFormId?: string;
}

interface NavbarCTAEditorProps {
  cta: CTALink;
  websiteId: string;
  userId?: string;
  onChange: (cta: CTALink) => void;
  onRemove: () => void;
}

export function NavbarCTAEditor({ cta, websiteId, userId, onChange, onRemove }: NavbarCTAEditorProps) {
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showFormDropdown, setShowFormDropdown] = useState(false);

  // Fetch all pages for this website
  const pages = useQuery(api.pages.getPagesByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');

  // Fetch all forms for this website
  const formsResult = useQuery(api.forms.getFormsByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');
  const forms = formsResult;

  // Get sections for selected page
  const selectedPage = pages?.find(p => p._id === cta.ctaPageId);
  const pageContent = selectedPage?.content ? JSON.parse(selectedPage.content) : null;
  const sections = pageContent?.sections || [];

  const linkType = cta.ctaType || 'url';
  const isUrlType = linkType === 'url';
  const isFormType = linkType === 'form';

  const handleTypeChange = (type: 'url' | 'page' | 'form') => {
    onChange({
      ...cta,
      ctaType: type,
      ctaLink: type === 'url' ? (cta.ctaLink || '') : undefined,
      ctaPageId: type === 'page' ? (cta.ctaPageId || undefined) : undefined,
      ctaSectionId: type === 'page' ? (cta.ctaSectionId || undefined) : undefined,
      ctaFormId: type === 'form' ? (cta.ctaFormId || undefined) : undefined,
    });
    setShowPageDropdown(false);
    setShowSectionDropdown(false);
    setShowFormDropdown(false);
  };

  const handleUrlChange = (url: string) => {
    onChange({ ...cta, ctaLink: url });
  };

  const handleFormSelect = (formId: string) => {
    onChange({ ...cta, ctaFormId: formId });
    setShowFormDropdown(false);
  };

  const handlePageSelect = (pageId: string) => {
    // Find the selected page to get its slug
    const selectedPage = pages?.find(p => p._id === pageId);
    const pageSlug = selectedPage?.slug || '/';

    onChange({
      ...cta,
      ctaPageId: pageId,
      ctaLink: pageSlug, // Set the page slug for navigation
      ctaSectionId: undefined,
    });
    setShowPageDropdown(false);
    setShowSectionDropdown(false);
  };

  const handleSectionSelect = (sectionId: string) => {
    onChange({ ...cta, ctaSectionId: sectionId });
    setShowSectionDropdown(false);
  };

  const clearSection = () => {
    onChange({ ...cta, ctaSectionId: undefined });
  };

  const getSelectedPageName = () => {
    if (!cta.ctaPageId) return 'Select a page';
    const page = pages?.find(p => p._id === cta.ctaPageId);
    return page?.name || 'Select a page';
  };

  const getSelectedSectionName = () => {
    if (!cta.ctaSectionId) return 'All sections';
    const section = sections.find((s: PageSection) => s.id === cta.ctaSectionId);
    if (!section) return 'All sections';
    const template = section.type.charAt(0).toUpperCase() + section.type.slice(1);
    return `${template} Section`;
  };

  return (
    <div className="space-y-4">
      {/* CTA Text */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Button Text</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={cta.ctaText || ''}
            onChange={(e) => onChange({ ...cta, ctaText: e.target.value })}
            placeholder="Get Started"
            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            maxLength={30}
          />
          <button
            onClick={onRemove}
            className="px-3 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="Remove CTA Button"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">Leave empty to hide the CTA button</p>
      </div>

      {/* Link Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Link Type</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTypeChange('url')}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
              isUrlType
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            )}
          >
            <ExternalLink className="h-3.5 w-3.5 inline mr-1.5" />
            URL
          </button>
          <button
            onClick={() => handleTypeChange('page')}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
              linkType === 'page'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            )}
          >
            <FileText className="h-3.5 w-3.5 inline mr-1.5" />
            Page
          </button>
          <button
            onClick={() => handleTypeChange('form')}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
              isFormType
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />
            Form
          </button>
        </div>
      </div>

      {/* URL Input (for URL type) */}
      {isUrlType && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">URL</label>
          <input
            type="text"
            value={cta.ctaLink || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com or /about"
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>
      )}

      {/* Page Selection (for Page type) */}
      {linkType === 'page' && (
        <>
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Page</label>
            <button
              onClick={() => {
                setShowPageDropdown(!showPageDropdown);
                setShowSectionDropdown(false);
              }}
              className="w-full px-4 py-2.5 text-sm text-left bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
            >
              <span className={cn(!cta.ctaPageId && 'text-slate-400')}>
                {getSelectedPageName()}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {/* Page Dropdown */}
            {showPageDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {pages && pages.length > 0 ? (
                  pages.map((page) => (
                    <button
                      key={page._id}
                      onClick={() => handlePageSelect(page._id)}
                      className={cn(
                        'w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors',
                        cta.ctaPageId === page._id && 'bg-slate-100 font-medium'
                      )}
                    >
                      {page.name}
                      {page.isHomePage && (
                        <span className="ml-2 text-xs text-slate-500">(Home)</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2.5 text-sm text-slate-500">
                    No pages available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section Selection (only when page is selected) */}
          {cta.ctaPageId && sections.length > 0 && (
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Section <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSectionDropdown(!showSectionDropdown);
                    setShowPageDropdown(false);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm text-left bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
                >
                  <span className={cn(!cta.ctaSectionId && 'text-slate-400')}>
                    {getSelectedSectionName()}
                  </span>
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {cta.ctaSectionId && (
                  <button
                    onClick={clearSection}
                    className="px-3 py-2.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Section Dropdown */}
              {showSectionDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <button
                    onClick={() => handleSectionSelect('')}
                    className={cn(
                      'w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors border-b border-slate-100',
                      !cta.ctaSectionId && 'bg-slate-100 font-medium'
                    )}
                  >
                    All sections (page top)
                  </button>
                  {sections.map((section: PageSection) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionSelect(section.id)}
                      className={cn(
                        'w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors',
                        cta.ctaSectionId === section.id && 'bg-slate-100 font-medium'
                      )}
                    >
                      {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {cta.ctaPageId && sections.length === 0 && (
            <p className="text-xs text-slate-500">
              This page has no sections yet. Add sections in the page builder.
            </p>
          )}
        </>
      )}

      {/* Form Selection (for Form type) */}
      {isFormType && (
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Form</label>
          <button
            onClick={() => setShowFormDropdown(!showFormDropdown)}
            className="w-full px-4 py-2.5 text-sm text-left bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
          >
            <span className={cn(!cta.ctaFormId && 'text-slate-400')}>
              {cta.ctaFormId ? forms?.find(f => f._id === cta.ctaFormId)?.name || 'Select a form' : 'Select a form'}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {/* Form Dropdown */}
          {showFormDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {forms && forms.length > 0 ? (
                forms.map((form) => (
                  <button
                    key={form._id}
                    onClick={() => handleFormSelect(form._id)}
                    className={cn(
                      'w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors flex items-center justify-between',
                      cta.ctaFormId === form._id && 'bg-slate-100 font-medium'
                    )}
                  >
                    <span>{form.name}</span>
                    <span className="text-xs text-slate-500">{form.fields.length} fields</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2.5 text-sm text-slate-500">
                  No forms available. Create a form first.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
