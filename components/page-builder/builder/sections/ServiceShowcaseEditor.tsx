'use client';

import { useState } from 'react';
import { Wrench, Settings, Grid, Sparkles, ChevronDown, Check, Building2, Tag, ArrowUpDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface ServiceShowcaseEditorProps {
  content: any;
  onChange: (content: any) => void;
  websiteId: string;
  userId?: string;
}

export function ServiceShowcaseEditor({ content, onChange, websiteId, userId }: ServiceShowcaseEditorProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Fetch filter options
  const companies = useQuery(
    api.companies.getCompaniesByWebsite,
    (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip'
  );

  // Fetch services to get categories
  const services = useQuery(
    api.services.getServicesByWebsite,
    (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip'
  );

  // Extract unique categories from services
  const categories = services
    ? [...new Set(services.map((s: any) => s.category).filter(Boolean))].sort()
    : [];

  const updateContent = (updates: any) => {
    onChange({ ...content, ...updates });
  };

  const toggleArrayItem = (array: string[] = [], item: string) => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700">
            <Wrench className="h-5 w-5 text-white" />
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
            placeholder="Our Services"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            placeholder="Professional Services for Your Needs"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            placeholder="Browse our range of professional services..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>
      </div>

      {/* Filter Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Filter Settings</h3>
            <p className="text-sm text-slate-500">Select which services to display</p>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Filter by Categories
          </label>
          <p className="text-xs text-slate-500 mb-2">Select categories to include in the showcase</p>

          {/* Selected Categories Display */}
          <div className="mb-2">
            {categories.length > 0 && content.filterBy?.categoryIds && content.filterBy.categoryIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {content.filterBy.categoryIds.map((category: string) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                  >
                    <Tag className="h-3 w-3" />
                    {category}
                    <button
                      onClick={() => updateContent({
                        filterBy: {
                          ...content.filterBy,
                          categoryIds: content.filterBy.categoryIds.filter((id: string) => id !== category),
                        },
                      })}
                      className="ml-1 hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No categories selected - showing all</p>
            )}
          </div>

          {/* Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'categories' ? null : 'categories')}
              className="w-full px-4 py-2.5 text-left text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all flex items-center justify-between bg-white"
            >
              <span>{openDropdown === 'categories' ? 'Close...' : 'Select categories...'}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', openDropdown === 'categories' && 'rotate-180')} />
            </button>

            {openDropdown === 'categories' && categories.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {categories.map((category: string) => {
                  const isSelected = content.filterBy?.categoryIds?.includes(category);
                  return (
                    <button
                      key={category}
                      onClick={() => updateContent({
                        filterBy: {
                          ...content.filterBy,
                          categoryIds: toggleArrayItem(content.filterBy?.categoryIds || [], category),
                        },
                      })}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm">{category}</span>
                      {isSelected && <Check className="h-4 w-4 text-blue-600" />}
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <Grid className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Display Settings</h3>
            <p className="text-sm text-slate-500">Configure layout and appearance</p>
          </div>
        </div>

        {/* Layout Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Layout Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'grid-3', label: '3 Columns' },
              { value: 'grid-4', label: '4 Columns' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateContent({ layout: option.value })}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                  content.layout === option.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Style */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Card Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'modern', label: 'Modern' },
              { value: 'premium', label: 'Premium' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateContent({ cardStyle: option.value })}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                  content.cardStyle === option.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Items Per Page */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Services per Page
          </label>
          <input
            type="number"
            value={content.itemsPerPage || 8}
            onChange={(e) => updateContent({ itemsPerPage: parseInt(e.target.value) || 8 })}
            min={4}
            max={24}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Show/Hide Options */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Show/Hide Elements
          </label>
          <div className="space-y-2">
            {[
              { key: 'showPrice', label: 'Show Price' },
              { key: 'showDuration', label: 'Show Duration' },
              { key: 'showCategory', label: 'Show Category Badge' },
              { key: 'showLoadMore', label: 'Show Load More Button' },
              { key: 'showSort', label: 'Show Sort Dropdown' },
              { key: 'showFilter', label: 'Show Category Filter' },
            ].map((option) => (
              <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content[option.key] !== false}
                  onChange={(e) => updateContent({ [option.key]: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* View Details Text */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            CTA Button Text
          </label>
          <input
            type="text"
            value={content.viewDetailsText || ''}
            onChange={(e) => updateContent({ viewDetailsText: e.target.value })}
            placeholder="Book Now"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Load More Text */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Load More Button Text
          </label>
          <input
            type="text"
            value={content.loadMoreText || ''}
            onChange={(e) => updateContent({ loadMoreText: e.target.value })}
            placeholder="Load More Services"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Styling Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Styling</h3>
            <p className="text-sm text-slate-500">Customize colors</p>
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Background Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={content.backgroundColor || '#ffffff'}
              onChange={(e) => updateContent({ backgroundColor: e.target.value })}
              className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={content.backgroundColor || '#ffffff'}
              onChange={(e) => updateContent({ backgroundColor: e.target.value })}
              placeholder="#ffffff"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Accent Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={content.accentColor || '#3b82f6'}
              onChange={(e) => updateContent({ accentColor: e.target.value })}
              className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={content.accentColor || '#3b82f6'}
              onChange={(e) => updateContent({ accentColor: e.target.value })}
              placeholder="#3b82f6"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
