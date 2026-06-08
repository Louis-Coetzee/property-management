'use client';

import { useState } from 'react';
import { Package, Settings, Grid, Sparkles, ChevronDown, Check, Building2, Award, Tag, ArrowUpDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface ProductShowcaseEditorProps {
  content: any;
  onChange: (content: any) => void;
  websiteId?: string;
  userId?: string;
}

export function ProductShowcaseEditor({ content, onChange, websiteId, userId }: ProductShowcaseEditorProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Fetch filter options
  const companies = useQuery(
    api.companies.getCompaniesByWebsite,
    (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip'
  );

  // Fetch products to get categories and brands
  const products = useQuery(
    api.products.getProductsByWebsite,
    (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip'
  );

  // Extract unique categories and brands from products
  const categories = products
    ? [...new Set(products.map((p: any) => p.category).filter(Boolean))].sort()
    : [];

  const brands = products
    ? [...new Set(products.map((p: any) => p.brand).filter(Boolean))].sort()
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700">
            <Package className="h-5 w-5 text-white" />
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
            placeholder="Featured Products"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
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
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
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
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
          />
        </div>
      </div>

      {/* Filter Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Filter Settings</h3>
            <p className="text-sm text-slate-500">Select which products to display</p>
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
                    className="inline-flex items-center gap-1 px-3 py-1 bg-violet-600 text-white text-sm rounded-lg"
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
                      className="ml-1 hover:text-violet-200"
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
              className="w-full px-4 py-2.5 text-left text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all flex items-center justify-between bg-white"
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
                      {isSelected && <Check className="h-4 w-4 text-violet-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Brand Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Filter by Brands
          </label>
          <p className="text-xs text-slate-500 mb-2">Select brands to include in the showcase</p>

          {/* Selected Brands Display */}
          <div className="mb-2">
            {brands.length > 0 && content.filterBy?.brandIds && content.filterBy.brandIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {content.filterBy.brandIds.map((brand: string) => (
                  <span
                    key={brand}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-violet-600 text-white text-sm rounded-lg"
                  >
                    <Award className="h-3 w-3" />
                    {brand}
                    <button
                      onClick={() => updateContent({
                        filterBy: {
                          ...content.filterBy,
                          brandIds: content.filterBy.brandIds.filter((id: string) => id !== brand),
                        },
                      })}
                      className="ml-1 hover:text-violet-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No brands selected - showing all</p>
            )}
          </div>

          {/* Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'brands' ? null : 'brands')}
              className="w-full px-4 py-2.5 text-left text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all flex items-center justify-between bg-white"
            >
              <span>{openDropdown === 'brands' ? 'Close...' : 'Select brands...'}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', openDropdown === 'brands' && 'rotate-180')} />
            </button>

            {openDropdown === 'brands' && brands.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {brands.map((brand: string) => {
                  const isSelected = content.filterBy?.brandIds?.includes(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => updateContent({
                        filterBy: {
                          ...content.filterBy,
                          brandIds: toggleArrayItem(content.filterBy?.brandIds || [], brand),
                        },
                      })}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm">{brand}</span>
                      {isSelected && <Check className="h-4 w-4 text-violet-600" />}
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

        {/* Columns Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Number of Columns
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateContent({ columns: option.value })}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                  (content.columns || 3) === option.value
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Size */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Card Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateContent({ cardSize: option.value })}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                  (content.cardSize || 'medium') === option.value
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Spacing */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Card Spacing
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Normal' },
              { value: 'spacious', label: 'Spacious' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateContent({ cardSpacing: option.value })}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                  (content.cardSpacing || 'normal') === option.value
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
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
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
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
            Products per Page
          </label>
          <input
            type="number"
            value={content.itemsPerPage || 8}
            onChange={(e) => updateContent({ itemsPerPage: parseInt(e.target.value) || 8 })}
            min={4}
            max={24}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Show/Hide Options */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Show/Hide Elements
          </label>
          <div className="space-y-2">
            {[
              { key: 'showStatus', label: 'Show Status Badge' },
              { key: 'showPrice', label: 'Show Price' },
              { key: 'showStock', label: 'Show Stock Info' },
              { key: 'showLoadMore', label: 'Show Load More Button' },
              { key: 'showSearch', label: 'Show Search Input' },
              { key: 'showSort', label: 'Show Sort Dropdown' },
              { key: 'showFilter', label: 'Show Category Filter' },
              { key: 'showAddToCart', label: 'Show Add to Cart Button' },
            ].map((option) => (
              <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content[option.key] === true}
                  onChange={(e) => {
                    updateContent({ [option.key]: e.target.checked });
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-slate-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Filter Display Options */}
        {content.showFilter && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Category Filter Display</h3>
                <p className="text-sm text-slate-500">Choose how to display category filter</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Display Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateContent({ categoryFilterStyle: 'dropdown' })}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    (content.categoryFilterStyle || 'dropdown') === 'dropdown'
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
                  }`}
                >
                  Dropdown
                </button>
                <button
                  type="button"
                  onClick={() => updateContent({ categoryFilterStyle: 'tags' })}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    content.categoryFilterStyle === 'tags'
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
                  }`}
                >
                  Tags
                </button>
              </div>
            </div>
          </div>
        )}

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
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
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
            placeholder="Load More Products"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
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
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
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
              value={content.accentColor || '#7c3aed'}
              onChange={(e) => updateContent({ accentColor: e.target.value })}
              className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={content.accentColor || '#7c3aed'}
              onChange={(e) => updateContent({ accentColor: e.target.value })}
              placeholder="#7c3aed"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
