'use client';

import { useState } from 'react';
import { Car as CarIcon, Settings, Grid, List, Sparkles, ChevronDown, Check, Building2, Award, ExternalLink, FileText, MessageSquare, Hash, Mail, ArrowUpDown, Filter, Plus, Trash2, Bell, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { PageSection } from '@/types/page-builder';

interface ListingsShowcaseEditorProps {
  content: any;
  onChange: (content: any) => void;
  websiteId: string;
  userId?: string; // Optional userId for authenticated queries
}

export function ListingsShowcaseEditor({ content, onChange, websiteId, userId }: ListingsShowcaseEditorProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showFormDropdown, setShowFormDropdown] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  // Fetch filter options from database
  // Only fetch when we have a userId, otherwise skip
  const companies = useQuery(api.companies.getCompaniesByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');
  const brands = useQuery(api.vehicles.getBrandsByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');
  const vehicleConditions = useQuery(api.vehicles.getVehicleConditionsByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');

  // Fetch pages and forms for inquiry button target
  const pages = useQuery(api.pages.getPagesByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');
  const forms = useQuery(api.forms.getFormsByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');

  // Get sections for selected page
  const inquiryPageId = content.inquiryPageId;
  const selectedPage = pages?.find(p => p._id === inquiryPageId);
  const pageContent = selectedPage?.content ? JSON.parse(selectedPage.content) : null;
  const sections = pageContent?.sections || [];

  // Get inquiry target type
  const inquiryTarget = content.inquiryTarget || 'url';

  const updateContent = (updates: any) => {
    onChange({ ...content, ...updates });
  };

  const toggleArrayItem = (array: string[] = [], item: string) => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  // Helper functions for inquiry button target
  const handleInquiryTargetChange = (target: 'url' | 'page' | 'form') => {
    updateContent({
      inquiryTarget: target,
      inquiryUrl: target === 'url' ? (content.inquiryUrl || '') : undefined,
      inquiryPageId: target === 'page' ? (content.inquiryPageId || undefined) : undefined,
      inquirySectionId: target === 'page' ? (content.inquirySectionId || undefined) : undefined,
      inquiryFormId: target === 'form' ? (content.inquiryFormId || undefined) : undefined,
    });
    setShowPageDropdown(false);
    setShowSectionDropdown(false);
    setShowFormDropdown(false);
  };

  const handleInquiryPageSelect = (pageId: string) => {
    updateContent({
      inquiryPageId: pageId,
      inquirySectionId: undefined,
    });
    setShowPageDropdown(false);
    setShowSectionDropdown(false);
  };

  const handleInquirySectionSelect = (sectionId: string) => {
    updateContent({ inquirySectionId: sectionId });
    setShowSectionDropdown(false);
  };

  const clearInquirySection = () => {
    updateContent({ inquirySectionId: undefined });
  };

  const handleInquiryFormSelect = (formId: string) => {
    updateContent({ inquiryFormId: formId });
    setShowFormDropdown(false);
  };

  const getSelectedPageName = () => {
    if (!content.inquiryPageId) return 'Select a page';
    const page = pages?.find(p => p._id === content.inquiryPageId);
    return page?.name || 'Select a page';
  };

  const getSelectedSectionName = () => {
    if (!content.inquirySectionId) return 'All sections';
    const section = sections.find((s: PageSection) => s.id === content.inquirySectionId);
    if (!section) return 'All sections';
    const template = section.type.charAt(0).toUpperCase() + section.type.slice(1);
    return `${template} Section`;
  };

  const getSelectedFormName = () => {
    if (!content.inquiryFormId) return 'Select a form';
    const form = forms?.find(f => f._id === content.inquiryFormId);
    return form?.name || 'Select a form';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900">
            <CarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Content Settings</h3>
            <p className="text-sm text-slate-500">Configure headline and description</p>
          </div>
        </div>

        {/* Headline */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Section Headline
          </label>
          <input
            type="text"
            value={content.headline || ''}
            onChange={(e) => updateContent({ headline: e.target.value })}
            placeholder="Featured Vehicles"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
        </div>

        {/* Subheadline */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Subheadline
          </label>
          <input
            type="text"
            value={content.subheadline || ''}
            onChange={(e) => updateContent({ subheadline: e.target.value })}
            placeholder="Discover Our Premium Selection"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            value={content.description || ''}
            onChange={(e) => updateContent({ description: e.target.value })}
            placeholder="Browse our curated collection..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none"
          />
        </div>
      </div>

      {/* Filter Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Filter Settings</h3>
            <p className="text-sm text-slate-500">Select which vehicles to display</p>
          </div>
        </div>

        {/* Company Filter Dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Filter by Companies
          </label>
          <p className="text-xs text-slate-500 mb-2">Select companies to include in the showcase</p>

          {/* Selected Companies Display */}
          <div className="mb-2">
            {companies && companies.length > 0 && content.filterBy?.companyIds && content.filterBy.companyIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {content.filterBy.companyIds.map((companyId: string) => {
                  const company = companies.find((c: any) => c._id === companyId);
                  return company ? (
                    <span
                      key={companyId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-white text-sm rounded-lg"
                    >
                      <Building2 className="h-3 w-3" />
                      {company.name}
                      <button
                        onClick={() => updateContent({
                          filterBy: {
                            ...content.filterBy,
                            companyIds: content.filterBy.companyIds.filter((id: string) => id !== companyId),
                          },
                        })}
                        className="ml-1 hover:text-slate-300"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No companies selected - showing all</p>
            )}
          </div>

          {/* Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'companies' ? null : 'companies')}
              className="w-full px-4 py-2.5 text-left text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between bg-white"
            >
              <span>{openDropdown === 'companies' ? 'Select less...' : 'Select companies...'}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', openDropdown === 'companies' && 'rotate-180')} />
            </button>

            {/* Dropdown Menu */}
            {openDropdown === 'companies' && companies && companies.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {companies.map((company: any) => {
                  const isSelected = content.filterBy?.companyIds?.includes(company._id);
                  return (
                    <button
                      key={company._id}
                      onClick={() => updateContent({
                        filterBy: {
                          ...content.filterBy,
                          companyIds: toggleArrayItem(content.filterBy?.companyIds, company._id),
                        },
                      })}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm">{company.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-slate-900" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Brand Filter Dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Filter by Brands
          </label>
          <p className="text-xs text-slate-500 mb-2">Select brands to include in the showcase</p>

          {/* Selected Brands Display */}
          <div className="mb-2">
            {brands && brands.length > 0 && content.filterBy?.brandIds && content.filterBy.brandIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {content.filterBy.brandIds.map((brandName: string) => {
                  const brand = brands.find((b: any) => b.name === brandName);
                  return brand ? (
                    <span
                      key={brandName}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-white text-sm rounded-lg"
                    >
                      <Award className="h-3 w-3" />
                      {brand.name}
                      <button
                        onClick={() => updateContent({
                          filterBy: {
                            ...content.filterBy,
                            brandIds: content.filterBy.brandIds.filter((id: string) => id !== brandName),
                          },
                        })}
                        className="ml-1 hover:text-slate-300"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No brands selected - showing all</p>
            )}
          </div>

          {/* Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'brands' ? null : 'brands')}
              className="w-full px-4 py-2.5 text-left text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between bg-white"
            >
              <span>{openDropdown === 'brands' ? 'Select less...' : 'Select brands...'}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', openDropdown === 'brands' && 'rotate-180')} />
            </button>

            {/* Dropdown Menu */}
            {openDropdown === 'brands' && brands && brands.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {brands.map((brand: any) => {
                  const isSelected = content.filterBy?.brandIds?.includes(brand.name);
                  return (
                    <button
                      key={brand.name}
                      onClick={() => updateContent({
                        filterBy: {
                          ...content.filterBy,
                          brandIds: toggleArrayItem(content.filterBy?.brandIds, brand.name),
                        },
                      })}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-slate-600" />
                        <div>
                          <span className="text-sm font-medium">{brand.name}</span>
                          <span className="text-xs text-slate-500 ml-2">({brand.count} vehicles)</span>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-slate-900 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Condition Filter Dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Filter by Condition
          </label>
          <p className="text-xs text-slate-500 mb-2">Select vehicle conditions to include in the showcase</p>

          {/* Selected Conditions Display */}
          <div className="mb-2">
            {vehicleConditions && vehicleConditions.length > 0 && content.filterBy?.conditionIds && content.filterBy.conditionIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {content.filterBy.conditionIds.map((conditionName: string) => {
                  const condition = vehicleConditions.find((c: any) => c.name === conditionName);
                  return condition ? (
                    <span
                      key={conditionName}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-white text-sm rounded-lg"
                    >
                      <CarIcon className="h-3 w-3" />
                      {condition.label}
                      <button
                        onClick={() => updateContent({
                          filterBy: {
                            ...content.filterBy,
                            conditionIds: content.filterBy.conditionIds.filter((id: string) => id !== conditionName),
                          },
                        })}
                        className="ml-1 hover:text-slate-300"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No conditions selected - showing all</p>
            )}
          </div>

          {/* Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'conditions' ? null : 'conditions')}
              className="w-full px-4 py-2.5 text-left text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between bg-white"
            >
              <span>{openDropdown === 'conditions' ? 'Select less...' : 'Select conditions...'}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', openDropdown === 'conditions' && 'rotate-180')} />
            </button>

            {/* Dropdown Menu */}
            {openDropdown === 'conditions' && vehicleConditions && vehicleConditions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {vehicleConditions.map((condition: any) => {
                  const isSelected = content.filterBy?.conditionIds?.includes(condition.name);
                  return (
                    <button
                      key={condition.name}
                      onClick={() => updateContent({
                        filterBy: {
                          ...content.filterBy,
                          conditionIds: toggleArrayItem(content.filterBy?.conditionIds, condition.name),
                        },
                      })}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CarIcon className="h-4 w-4 text-slate-600" />
                        <div>
                          <span className="text-sm font-medium">{condition.label}</span>
                          <span className="text-xs text-slate-500 ml-2">({condition.count} vehicles)</span>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-slate-900 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
            <Grid className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Display Settings</h3>
            <p className="text-sm text-slate-500">Configure how vehicles are displayed</p>
          </div>
        </div>

        {/* Card Style */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Card Style
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateContent({ cardStyle: 'modern' })}
              className={cn(
                'p-3 rounded-lg border-2 transition-all',
                content.cardStyle === 'modern'
                  ? 'border-slate-800 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="text-sm font-medium text-slate-900">Modern</div>
              <div className="text-xs text-slate-500">Clean & focused</div>
            </button>
            <button
              onClick={() => updateContent({ cardStyle: 'premium' })}
              className={cn(
                'p-3 rounded-lg border-2 transition-all',
                content.cardStyle === 'premium'
                  ? 'border-slate-800 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="text-sm font-medium text-slate-900">Premium</div>
              <div className="text-xs text-slate-500">Luxury styling</div>
            </button>
          </div>
        </div>

        {/* Layout */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Grid Layout
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => updateContent({ layout: 'grid-3' })}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-center',
                content.layout === 'grid-3'
                  ? 'border-slate-800 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="text-sm font-medium">3 Columns</div>
            </button>
            <button
              onClick={() => updateContent({ layout: 'grid-4' })}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-center',
                content.layout === 'grid-4'
                  ? 'border-slate-800 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="text-sm font-medium">4 Columns</div>
            </button>
            <button
              onClick={() => updateContent({ layout: 'carousel' })}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-center',
                content.layout === 'carousel'
                  ? 'border-slate-800 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="text-sm font-medium">Carousel</div>
            </button>
          </div>
        </div>

        {/* Items Per Page */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Items Per Page
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={content.itemsPerPage || 6}
            onChange={(e) => updateContent({ itemsPerPage: parseInt(e.target.value) || 6 })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
        </div>

        {/* Show Load More */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-700">Show "Load More" button</span>
          <button
            onClick={() => updateContent({ showLoadMore: !content.showLoadMore })}
            className={cn(
              'relative w-10 h-5 rounded-full transition-all duration-200',
              content.showLoadMore !== false ? 'bg-slate-900' : 'bg-slate-300'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
              content.showLoadMore !== false ? 'right-0.5' : 'left-0.5'
            )} />
          </button>
        </div>

        {/* Show Sort */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-700">Show Sort Options</span>
          </div>
          <button
            onClick={() => updateContent({ showSort: !content.showSort })}
            className={cn(
              'relative w-10 h-5 rounded-full transition-all duration-200',
              content.showSort ? 'bg-slate-900' : 'bg-slate-300'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
              content.showSort ? 'right-0.5' : 'left-0.5'
            )} />
          </button>
        </div>

        {/* Show Filter */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-700">Show Filter Options</span>
          </div>
          <button
            onClick={() => updateContent({ showFilter: !content.showFilter })}
            className={cn(
              'relative w-10 h-5 rounded-full transition-all duration-200',
              content.showFilter ? 'bg-slate-900' : 'bg-slate-300'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
              content.showFilter ? 'right-0.5' : 'left-0.5'
            )} />
          </button>
        </div>

        {/* Default Sort Option */}
        {content.showSort && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Default Sort By
            </label>
            <select
              value={content.defaultSort || 'newest'}
              onChange={(e) => updateContent({ defaultSort: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="mileage-low">Mileage: Low to High</option>
              <option value="mileage-high">Mileage: High to Low</option>
              <option value="year-new">Year: Newest</option>
              <option value="year-old">Year: Oldest</option>
              <option value="make-asc">Make: A-Z</option>
              <option value="make-desc">Make: Z-A</option>
            </select>
          </div>
        )}

        {/* Load More Text */}
        {content.showLoadMore !== false && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Load More Button Text
            </label>
            <input
              type="text"
              value={content.loadMoreText || ''}
              onChange={(e) => updateContent({ loadMoreText: e.target.value })}
              placeholder="Show More"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>
        )}
      </div>

      {/* Card Content Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Card Content</h3>
            <p className="text-sm text-slate-500">Toggle which information to show</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'showStatus', label: 'Status Badge' },
            { key: 'showPrice', label: 'Price' },
            { key: 'showMileage', label: 'Mileage' },
            { key: 'showYear', label: 'Year' },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700">{setting.label}</span>
              <button
                onClick={() => updateContent({ [setting.key]: content[setting.key] === false ? true : false })}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-all duration-200',
                  content[setting.key] !== false ? 'bg-slate-900' : 'bg-slate-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                  content[setting.key] !== false ? 'right-0.5' : 'left-0.5'
                )} />
              </button>
            </div>
          ))}
        </div>

        {/* View Details Text */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            View Details Button Text
          </label>
          <input
            type="text"
            value={content.viewDetailsText || ''}
            onChange={(e) => updateContent({ viewDetailsText: e.target.value })}
            placeholder="View Details"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Detail Page Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600">
            <Grid className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Detail Page Settings</h3>
            <p className="text-sm text-slate-500">Control navbar and footer on listing detail pages</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'showNavbarOnDetails', label: 'Show Navbar on Detail Pages', description: 'Display the site navbar when viewing a vehicle' },
            { key: 'showFooterOnDetails', label: 'Show Footer on Detail Pages', description: 'Display the site footer when viewing a vehicle' },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between py-2">
              <div className="flex-1">
                <span className="text-sm text-slate-700 block">{setting.label}</span>
                <span className="text-xs text-slate-500">{setting.description}</span>
              </div>
              <button
                onClick={() => updateContent({ [setting.key]: content[setting.key] === false ? true : false })}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-all duration-200',
                  content[setting.key] !== false ? 'bg-slate-900' : 'bg-slate-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                  content[setting.key] !== false ? 'right-0.5' : 'left-0.5'
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Inquiry Button Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Inquiry Button Settings</h3>
            <p className="text-sm text-slate-500">Configure the inquiry button on detail pages</p>
          </div>
        </div>

        {/* Button Text */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Button Text
          </label>
          <input
            type="text"
            value={content.inquiryButtonText || 'Inquire Now'}
            onChange={(e) => updateContent({ inquiryButtonText: e.target.value })}
            placeholder="Inquire Now"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
        </div>

        {/* Target Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Button Target
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleInquiryTargetChange('url')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg border transition-all flex-1',
                inquiryTarget === 'url'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              )}
            >
              <ExternalLink className="h-3.5 w-3.5 inline mr-1.5" />
              URL
            </button>
            <button
              onClick={() => handleInquiryTargetChange('page')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg border transition-all flex-1',
                inquiryTarget === 'page'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              )}
            >
              <FileText className="h-3.5 w-3.5 inline mr-1.5" />
              Page
            </button>
            <button
              onClick={() => handleInquiryTargetChange('form')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg border transition-all flex-1',
                inquiryTarget === 'form'
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
        {inquiryTarget === 'url' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              URL
            </label>
            <input
              type="text"
              value={content.inquiryUrl || ''}
              onChange={(e) => updateContent({ inquiryUrl: e.target.value })}
              placeholder="https://example.com or /contact"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-mono"
            />
          </div>
        )}

        {/* Page Selection (for Page type) */}
        {inquiryTarget === 'page' && (
          <>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Select Page
              </label>
              <button
                onClick={() => {
                  setShowPageDropdown(!showPageDropdown);
                  setShowSectionDropdown(false);
                }}
                className="w-full px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between"
              >
                <span className={cn(!content.inquiryPageId && 'text-slate-400')}>
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
                        onClick={() => handleInquiryPageSelect(page._id)}
                        className={cn(
                          'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
                          content.inquiryPageId === page._id && 'bg-slate-100 font-medium'
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
            {content.inquiryPageId && sections.length > 0 && (
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Section <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowSectionDropdown(!showSectionDropdown);
                      setShowPageDropdown(false);
                    }}
                    className="flex-1 px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between"
                  >
                    <span className={cn(!content.inquirySectionId && 'text-slate-400')}>
                      {getSelectedSectionName()}
                    </span>
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  {content.inquirySectionId && (
                    <button
                      onClick={clearInquirySection}
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
                      onClick={() => handleInquirySectionSelect('')}
                      className={cn(
                        'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors border-b border-slate-100',
                        !content.inquirySectionId && 'bg-slate-100 font-medium'
                      )}
                    >
                      All sections (page top)
                    </button>
                    {sections.map((section: PageSection) => (
                      <button
                        key={section.id}
                        onClick={() => handleInquirySectionSelect(section.id)}
                        className={cn(
                          'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
                          content.inquirySectionId === section.id && 'bg-slate-100 font-medium'
                        )}
                      >
                        {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {content.inquiryPageId && sections.length === 0 && (
              <p className="text-xs text-slate-500">
                This page has no sections yet. Add sections in the page builder.
              </p>
            )}
          </>
        )}

        {/* Form Selection (for Form type) */}
        {inquiryTarget === 'form' && (
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Select Form
            </label>
            <button
              onClick={() => setShowFormDropdown(!showFormDropdown)}
              className="w-full px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all flex items-center justify-between"
            >
              <span className={cn(!content.inquiryFormId && 'text-slate-400')}>
                {getSelectedFormName()}
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
                      onClick={() => handleInquiryFormSelect(form._id)}
                      className={cn(
                        'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors flex items-center justify-between',
                        content.inquiryFormId === form._id && 'bg-slate-100 font-medium'
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
      </div>

      {/* Inquiry Email Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
            <Send className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Inquiry Email Settings</h3>
            <p className="text-sm text-slate-500">Configure email notifications for inquiries</p>
          </div>
        </div>

        {/* Email Recipients */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <label className="text-sm font-medium text-slate-900">Email Recipients</label>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Email addresses that will receive vehicle inquiry notifications
          </p>

          {/* Recipient List */}
          <div className="space-y-2 mb-3">
            {(content.inquiryRecipients || []).map((email: string, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span className="flex-1 text-sm text-slate-700">{email}</span>
                <button
                  onClick={() => updateContent({
                    inquiryRecipients: (content.inquiryRecipients || []).filter((_: string, i: number) => i !== index)
                  })}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Recipient */}
          <div className="flex gap-2">
            <input
              type="email"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newRecipient && newRecipient.includes('@')) {
                    const currentRecipients = content.inquiryRecipients || [];
                    if (!currentRecipients.includes(newRecipient)) {
                      updateContent({ inquiryRecipients: [...currentRecipients, newRecipient] });
                      setNewRecipient('');
                    }
                  }
                }
              }}
              placeholder="recipient@example.com"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <button
              onClick={() => {
                if (newRecipient && newRecipient.includes('@')) {
                  const currentRecipients = content.inquiryRecipients || [];
                  if (!currentRecipients.includes(newRecipient)) {
                    updateContent({ inquiryRecipients: [...currentRecipients, newRecipient] });
                    setNewRecipient('');
                  }
                }
              }}
              disabled={!newRecipient || !newRecipient.includes('@')}
              className="px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Success Message */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Success Message
          </label>
          <textarea
            value={content.inquirySuccessMessage || ''}
            onChange={(e) => updateContent({ inquirySuccessMessage: e.target.value })}
            placeholder="Thank you for your inquiry! We'll get back to you soon."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Thank You Email */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium text-slate-900">Send Thank You Email</label>
            </div>
            <button
              onClick={() => updateContent({ inquirySendThankYouEmail: content.inquirySendThankYouEmail ? false : true })}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                content.inquirySendThankYouEmail ? 'bg-slate-900' : 'bg-slate-200'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  content.inquirySendThankYouEmail ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Send a confirmation email to the person who submitted the inquiry
          </p>

          {content.inquirySendThankYouEmail && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={content.inquiryThankYouEmailSubject || ''}
                  onChange={(e) => updateContent({ inquiryThankYouEmailSubject: e.target.value })}
                  placeholder="Thank you for your inquiry!"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Message
                </label>
                <textarea
                  value={content.inquiryThankYouEmailMessage || ''}
                  onChange={(e) => updateContent({ inquiryThankYouEmailMessage: e.target.value })}
                  placeholder="We have received your inquiry and will get back to you shortly."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Style Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Colors & Styling</h3>
            <p className="text-sm text-slate-500">Customize appearance</p>
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Background Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={content.backgroundColor || '#ffffff'}
              onChange={(e) => updateContent({ backgroundColor: e.target.value })}
              className="w-12 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={content.backgroundColor || '#ffffff'}
              onChange={(e) => updateContent({ backgroundColor: e.target.value })}
              placeholder="#ffffff"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-mono"
            />
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Text Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={content.textColor || '#1a1a1a'}
              onChange={(e) => updateContent({ textColor: e.target.value })}
              className="w-12 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={content.textColor || '#1a1a1a'}
              onChange={(e) => updateContent({ textColor: e.target.value })}
              placeholder="#1a1a1a"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-mono"
            />
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={content.accentColor || '#6366f1'}
              onChange={(e) => updateContent({ accentColor: e.target.value })}
              className="w-12 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={content.accentColor || '#6366f1'}
              onChange={(e) => updateContent({ accentColor: e.target.value })}
              placeholder="#6366f1"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
