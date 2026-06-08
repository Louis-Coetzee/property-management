'use client';

import { useState } from 'react';
import { ChevronDown, ExternalLink, FileText, Hash, MessageSquare, Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { PageSection } from '@/types/page-builder';

interface HeroCTAProps {
  ctaText?: string;
  ctaType?: 'url' | 'page' | 'form';
  ctaLink?: string;
  ctaPageId?: string;
  ctaSectionId?: string;
  ctaFormId?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
}

interface HeroCTAEditorProps {
  cta: HeroCTAProps;
  websiteId: string;
  userId?: string;
  onChange: (cta: HeroCTAProps) => void;
  onRemove?: () => void;
}

export function HeroCTAEditor({ cta, websiteId, userId, onChange, onRemove }: HeroCTAEditorProps) {
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

  const ctaType = cta.ctaType || 'url';

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

  const handleFormSelect = (formId: string) => {
    onChange({ ...cta, ctaFormId: formId });
    setShowFormDropdown(false);
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
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Button Text
        </label>
        <input
          type="text"
          value={cta.ctaText || ''}
          onChange={(e) => onChange({ ...cta, ctaText: e.target.value })}
          placeholder="Get Started"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
        />
      </div>

      {/* CTA Type Selection */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Link Type
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'url' as const, icon: ExternalLink, label: 'URL' },
            { type: 'page' as const, icon: FileText, label: 'Page' },
            { type: 'form' as const, icon: MessageSquare, label: 'Form' },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                ctaType === type
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              )}
            >
              <Icon className="h-3.5 w-3.5 inline mr-1.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* URL Input (for URL type) */}
      {ctaType === 'url' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            URL
          </label>
          <input
            type="text"
            value={cta.ctaLink || ''}
            onChange={(e) => onChange({ ...cta, ctaLink: e.target.value })}
            placeholder="https://example.com or /about"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono"
          />
        </div>
      )}

      {/* Page Selection (for Page type) */}
      {ctaType === 'page' && (
        <>
          <div className="relative">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Select Page
            </label>
            <button
              onClick={() => {
                setShowPageDropdown(!showPageDropdown);
                setShowSectionDropdown(false);
                setShowFormDropdown(false);
              }}
              className="w-full px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between"
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
                        'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
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
                  <div className="px-3 py-2 text-sm text-slate-500">
                    No pages available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section Selection (only when page is selected) */}
          {cta.ctaPageId && sections.length > 0 && (
            <div className="relative">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Section <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSectionDropdown(!showSectionDropdown);
                    setShowPageDropdown(false);
                    setShowFormDropdown(false);
                  }}
                  className="flex-1 px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between"
                >
                  <span className={cn(!cta.ctaSectionId && 'text-slate-400')}>
                    {getSelectedSectionName()}
                  </span>
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {cta.ctaSectionId && (
                  <button
                    onClick={() => onChange({ ...cta, ctaSectionId: undefined })}
                    className="px-2 py-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
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
                      'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors border-b border-slate-100',
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
                        'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
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
      {ctaType === 'form' && (
        <div className="relative">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Select Form
          </label>
          <button
            onClick={() => {
              setShowFormDropdown(!showFormDropdown);
              setShowPageDropdown(false);
              setShowSectionDropdown(false);
            }}
            className="w-full px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between"
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
                      'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors flex items-center justify-between',
                      cta.ctaFormId === form._id && 'bg-slate-100 font-medium'
                    )}
                  >
                    <span>{form.name}</span>
                    <span className="text-xs text-slate-500">{form.fields.length} fields</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500">
                  No forms available. Create a form first.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Button Colors */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-700">Button Colors</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Background
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={cta.ctaBackgroundColor || '#ffffff'}
                onChange={(e) => onChange({ ...cta, ctaBackgroundColor: e.target.value })}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={cta.ctaBackgroundColor || '#ffffff'}
                onChange={(e) => onChange({ ...cta, ctaBackgroundColor: e.target.value })}
                className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded font-mono"
                placeholder="#ffffff"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Text
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={cta.ctaTextColor || '#6366f1'}
                onChange={(e) => onChange({ ...cta, ctaTextColor: e.target.value })}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={cta.ctaTextColor || '#6366f1'}
                onChange={(e) => onChange({ ...cta, ctaTextColor: e.target.value })}
                className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded font-mono"
                placeholder="#6366f1"
              />
            </div>
          </div>
        </div>

        {/* Button Preview */}
        {cta.ctaText && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <label className="block text-xs text-slate-600 mb-2">Preview</label>
            <div className="p-3 bg-slate-100 rounded-lg">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  backgroundColor: cta.ctaBackgroundColor || '#ffffff',
                  color: cta.ctaTextColor || '#6366f1',
                }}
              >
                {cta.ctaText}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Remove CTA Button */}
      {cta.ctaText && onRemove && (
        <button
          onClick={onRemove}
          className="w-full py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Remove CTA Button
        </button>
      )}
    </div>
  );
}
