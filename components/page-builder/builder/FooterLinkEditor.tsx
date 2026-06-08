'use client';

import { useState } from 'react';
import { X, ChevronDown, ExternalLink, FileText, Hash, MessageSquare, Image as ImageIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FooterLink, PageSection } from '@/types/page-builder';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import MediaLibraryModal from '@/components/media-library-modal';

interface FooterLinkEditorProps {
  link: FooterLink;
  index: number;
  websiteId: string;
  userId?: string;
  onUpdate: (index: number, link: FooterLink) => void;
  onRemove: (index: number) => void;
}

export function FooterLinkEditor({ link, index, websiteId, userId, onUpdate, onRemove }: FooterLinkEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showFormDropdown, setShowFormDropdown] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaType, setMediaType] = useState<'main' | 'hover'>('main');

  // Fetch all pages for this website
  const pages = useQuery(api.pages.getPagesByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');

  // Fetch all forms for this website
  const formsResult = useQuery(api.forms.getFormsByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');
  const forms = formsResult;

  // Get sections for selected page
  const selectedPage = pages?.find(p => p._id === link.pageId);
  const pageContent = selectedPage?.content ? JSON.parse(selectedPage.content) : null;
  const sections = pageContent?.sections || [];

  const linkType = link.type || 'url';
  const isUrlType = linkType === 'url';
  const isFormType = link.type === 'form';

  const handleTypeChange = (type: 'url' | 'page' | 'form') => {
    onUpdate(index, {
      ...link,
      type,
      url: type === 'url' ? (link.url || '') : undefined,
      pageId: type === 'page' ? (link.pageId || undefined) : undefined,
      sectionId: type === 'page' ? (link.sectionId || undefined) : undefined,
      formId: type === 'form' ? (link.formId || undefined) : undefined,
    });
    setShowPageDropdown(false);
    setShowSectionDropdown(false);
    setShowFormDropdown(false);
  };

  const handleUrlChange = (url: string) => {
    onUpdate(index, { ...link, url });
  };

  const handleFormSelect = (formId: string) => {
    onUpdate(index, {
      ...link,
      formId,
    });
    setShowFormDropdown(false);
  };

  const handlePageSelect = (pageId: string) => {
    // Find the selected page to get its slug
    const selectedPage = pages?.find(p => p._id === pageId);
    const pageSlug = selectedPage?.slug || '/';

    onUpdate(index, {
      ...link,
      pageId,
      url: pageSlug, // Set the page slug for navigation
      sectionId: undefined,
    });
    setShowPageDropdown(false);
    setShowSectionDropdown(false);
  };

  const handleSectionSelect = (sectionId: string) => {
    onUpdate(index, { ...link, sectionId });
    setShowSectionDropdown(false);
  };

  const clearSection = () => {
    onUpdate(index, { ...link, sectionId: undefined });
  };

  const handleMediaLibrarySelect = (urls: string[]) => {
    if (urls.length > 0) {
      if (mediaType === 'main') {
        onUpdate(index, { ...link, imageUrl: urls[0] });
      } else {
        onUpdate(index, { ...link, hoverImageUrl: urls[0] });
      }
    }
    setShowMediaLibrary(false);
  };

  const getSelectedPageName = () => {
    if (!link.pageId) return 'Select a page';
    const page = pages?.find(p => p._id === link.pageId);
    return page?.name || 'Select a page';
  };

  const getSelectedSectionName = () => {
    if (!link.sectionId) return 'All sections';
    const section = sections.find((s: PageSection) => s.id === link.sectionId);
    if (!section) return 'All sections';
    const template = section.type.charAt(0).toUpperCase() + section.type.slice(1);
    return `${template} Section`;
  };

  return (
    <div className={cn(
      "border border-slate-200 rounded-xl",
      isOpen && "z-10"
    )}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          {link.useImage && link.imageUrl ? (
            <img src={link.imageUrl} alt="" className="h-4 w-4 object-contain" />
          ) : link.hoverToImage && link.hoverImageUrl ? (
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-slate-900">
                {link.label || `Link ${index + 1}`}
              </span>
              <Sparkles className="h-3 w-3 text-purple-500" />
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-900">
              {link.label || `Link ${index + 1}`}
            </span>
          )}
          {isUrlType ? (
            <ExternalLink className="h-3 w-3 text-slate-400" />
          ) : isFormType ? (
            <MessageSquare className="h-3 w-3 text-slate-400" />
          ) : (
            <FileText className="h-3 w-3 text-slate-400" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-slate-400 transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className={cn(
          "p-3 space-y-3 bg-white border-t border-slate-200 rounded-b-xl",
          (showPageDropdown || showSectionDropdown) && "relative z-20"
        )}>
          {/* Link Label */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Link Label
            </label>
            <input
              type="text"
              value={link.label}
              onChange={(e) => onUpdate(index, { ...link, label: e.target.value })}
              placeholder="About Us"
              className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>

          {/* Link Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Link Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleTypeChange('url')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all',
                  isUrlType
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                )}
              >
                <ExternalLink className="h-3 w-3 inline mr-1" />
                URL
              </button>
              <button
                onClick={() => handleTypeChange('page')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all',
                  linkType === 'page'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                )}
              >
                <FileText className="h-3 w-3 inline mr-1" />
                Page
              </button>
              <button
                onClick={() => handleTypeChange('form')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all',
                  isFormType
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                )}
              >
                <MessageSquare className="h-3 w-3 inline mr-1" />
                Form
              </button>
            </div>
          </div>

          {/* URL Input (for URL type) */}
          {isUrlType && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                URL
              </label>
              <input
                type="text"
                value={link.url || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com or /about"
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-mono"
              />
            </div>
          )}

          {/* Page Selection (for Page type) */}
          {linkType === 'page' && (
            <>
              <div className="relative">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Page
                </label>
                <button
                  onClick={() => {
                    setShowPageDropdown(!showPageDropdown);
                    setShowSectionDropdown(false);
                  }}
                  className="w-full px-2.5 py-1.5 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between"
                >
                  <span className={cn(!link.pageId && 'text-slate-400')}>
                    {getSelectedPageName()}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {/* Page Dropdown */}
                {showPageDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                    {pages && pages.length > 0 ? (
                      pages.map((page) => (
                        <button
                          key={page._id}
                          onClick={() => handlePageSelect(page._id)}
                          className={cn(
                            'w-full px-2.5 py-1.5 text-sm text-left hover:bg-slate-50 transition-colors',
                            link.pageId === page._id && 'bg-slate-100 font-medium'
                          )}
                        >
                          {page.name}
                          {page.isHomePage && (
                            <span className="ml-2 text-xs text-slate-500">(Home)</span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-2.5 py-1.5 text-sm text-slate-500">
                        No pages available
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section Selection (only when page is selected) */}
              {link.pageId && sections.length > 0 && (
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Section <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowSectionDropdown(!showSectionDropdown);
                        setShowPageDropdown(false);
                      }}
                      className="flex-1 px-2.5 py-1.5 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between"
                    >
                      <span className={cn(!link.sectionId && 'text-slate-400')}>
                        {getSelectedSectionName()}
                      </span>
                      <Hash className="h-3 w-3 text-slate-400" />
                    </button>
                    {link.sectionId && (
                      <button
                        onClick={clearSection}
                        className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Section Dropdown */}
                  {showSectionDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                      <button
                        onClick={() => handleSectionSelect('')}
                        className={cn(
                          'w-full px-2.5 py-1.5 text-sm text-left hover:bg-slate-50 transition-colors border-b border-slate-100',
                          !link.sectionId && 'bg-slate-100 font-medium'
                        )}
                      >
                        All sections (page top)
                      </button>
                      {sections.map((section: PageSection) => (
                        <button
                          key={section.id}
                          onClick={() => handleSectionSelect(section.id)}
                          className={cn(
                            'w-full px-2.5 py-1.5 text-sm text-left hover:bg-slate-50 transition-colors',
                            link.sectionId === section.id && 'bg-slate-100 font-medium'
                          )}
                        >
                          {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {link.pageId && sections.length === 0 && (
                <p className="text-xs text-slate-500">
                  This page has no sections yet.
                </p>
              )}
            </>
          )}

          {/* Form Selection (for Form type) */}
          {isFormType && (
            <div className="relative">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Form
              </label>
              <button
                onClick={() => setShowFormDropdown(!showFormDropdown)}
                className="w-full px-2.5 py-1.5 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between"
              >
                <span className={cn(!link.formId && 'text-slate-400')}>
                  {link.formId ? forms?.find(f => f._id === link.formId)?.name || 'Select a form' : 'Select a form'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Form Dropdown */}
              {showFormDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                  {forms && forms.length > 0 ? (
                    forms.map((form) => (
                      <button
                        key={form._id}
                        onClick={() => handleFormSelect(form._id)}
                        className={cn(
                          'w-full px-2.5 py-1.5 text-sm text-left hover:bg-slate-50 transition-colors flex items-center justify-between',
                          link.formId === form._id && 'bg-slate-100 font-medium'
                        )}
                      >
                        <span>{form.name}</span>
                        <span className="text-xs text-slate-500">{form.fields.length} fields</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-2.5 py-1.5 text-sm text-slate-500">
                      No forms available
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Image Options Divider */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-700">Image Options</span>
            </div>

            {/* Use Image Instead of Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-600">Use image instead of text</label>
                <button
                  onClick={() => onUpdate(index, { ...link, useImage: !link.useImage })}
                  className={cn(
                    'relative w-9 h-4.5 rounded-full transition-all duration-200',
                    link.useImage ? 'bg-slate-900' : 'bg-slate-300'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-200',
                    link.useImage ? 'right-0.5' : 'left-0.5'
                  )} />
                </button>
              </div>

              {/* Main Image Selection */}
              {link.useImage && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Select Image
                  </label>
                  <div className="flex gap-2">
                    {link.imageUrl && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                        <img src={link.imageUrl} alt="" className="w-full h-full object-contain bg-slate-50" />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setMediaType('main');
                        setShowMediaLibrary(true);
                      }}
                      className="flex-1 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-1"
                    >
                      <ImageIcon className="h-3 w-3 text-slate-400" />
                      {link.imageUrl ? 'Change' : 'Select'}
                    </button>
                    {link.imageUrl && (
                      <button
                        onClick={() => onUpdate(index, { ...link, imageUrl: undefined })}
                        className="px-2 py-1.5 text-xs text-red-600 hover:text-red-700 border border-slate-200 rounded-lg hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Hover to Image Option */}
              {!link.useImage && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-600">Hover to show image</label>
                    <button
                      onClick={() => onUpdate(index, { ...link, hoverToImage: !link.hoverToImage })}
                      className={cn(
                        'relative w-9 h-4.5 rounded-full transition-all duration-200',
                        link.hoverToImage ? 'bg-slate-900' : 'bg-slate-300'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-200',
                        link.hoverToImage ? 'right-0.5' : 'left-0.5'
                      )} />
                    </button>
                  </div>

                  {/* Hover Image Selection */}
                  {link.hoverToImage && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Select Hover Image
                      </label>
                      <div className="flex gap-2">
                        {link.hoverImageUrl && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                            <img src={link.hoverImageUrl} alt="" className="w-full h-full object-contain bg-slate-50" />
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setMediaType('hover');
                            setShowMediaLibrary(true);
                          }}
                          className="flex-1 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-1"
                        >
                          <Sparkles className="h-3 w-3 text-purple-400" />
                          {link.hoverImageUrl ? 'Change' : 'Select'}
                        </button>
                        {link.hoverImageUrl && (
                          <button
                            onClick={() => onUpdate(index, { ...link, hoverImageUrl: undefined })}
                            className="px-2 py-1.5 text-xs text-red-600 hover:text-red-700 border border-slate-200 rounded-lg hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibraryModal
          userId={websiteId}
          onSelectImage={(url) => {
            handleMediaLibrarySelect([url]);
          }}
          allowMultiSelect={false}
          maxImages={1}
          currentImageCount={0}
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
        />
      )}
    </div>
  );
}
