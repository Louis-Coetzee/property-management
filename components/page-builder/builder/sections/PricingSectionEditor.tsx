'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, Settings, Type, Palette, Sparkles, GripVertical, X, Check, ExternalLink, FileText, Hash, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingSectionContent, PricingCard, PricingFeature, PricingCTA, PricingIconType } from '@/types/page-builder';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SOLID_ICON_CATEGORIES, getSolidIconComponent, ICON_COLOR_PRESETS } from '@/lib/page-builder/icons/solid-icons';
import type { PageSection } from '@/types/page-builder';

interface PricingSectionEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
  websiteId?: string;
  userId?: string;
  templateId: string;
}

const DEFAULT_CARD: PricingCard = {
  id: `card-${Date.now()}`,
  title: 'New Plan',
  description: 'Plan description',
  price: '$99',
  period: '/month',
  iconType: 'emoji',
  icon: '⭐',
  solidIcon: 'star',
  solidIconColor: '#f59e0b',
  features: [],
  ctaText: 'Get Started',
  cta: { type: 'url', url: '#' },
  highlighted: false,
};

const DEFAULT_FEATURE: PricingFeature = {
  id: `feature-${Date.now()}`,
  text: 'Feature',
  included: true,
};

// Emoji options for pricing
const EMOJI_OPTIONS = [
  { value: '⭐', label: 'Star' },
  { value: '🚀', label: 'Rocket' },
  { value: '💎', label: 'Diamond' },
  { value: '👑', label: 'Crown' },
  { value: '🔥', label: 'Fire' },
  { value: '⚡', label: 'Lightning' },
  { value: '✨', label: 'Sparkles' },
  { value: '🎯', label: 'Target' },
  { value: '🏆', label: 'Trophy' },
  { value: '💼', label: 'Briefcase' },
  { value: '🏢', label: 'Building' },
  { value: '🌟', label: 'Glowing Star' },
  { value: '💫', label: 'Dizzy' },
  { value: '🎉', label: 'Party' },
  { value: '✅', label: 'Check' },
  { value: '💚', label: 'Green Heart' },
  { value: '💜', label: 'Purple Heart' },
  { value: '💙', label: 'Blue Heart' },
];

const COLUMNS_OPTIONS = [
  { value: 1, label: '1 Column' },
  { value: 2, label: '2 Columns' },
  { value: 3, label: '3 Columns' },
  { value: 4, label: '4 Columns' },
  { value: 5, label: '5 Columns' },
  { value: 6, label: '6 Columns' },
];

// Solid Icon Picker Component
function SolidIconPicker({ value, color, onChange, onColorChange }: { value: string; color: string; onChange: (icon: string) => void; onColorChange: (color: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = SOLID_ICON_CATEGORIES.map((category) => ({
    ...category,
    icons: category.icons.filter(
      (icon) =>
        icon.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        icon.value.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.icons.length > 0);

  const SelectedIcon = getSolidIconComponent(value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '20' }}
        >
          {SelectedIcon ? (
            <SelectedIcon className="w-5 h-5" style={{ color }} />
          ) : (
            <Sparkles className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <span className="flex-1 text-left text-slate-700 truncate">
          {value ? (SOLID_ICON_CATEGORIES.flatMap(c => c.icons).find(i => i.value === value)?.label || value) : 'Select icon...'}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <label className="block text-xs font-medium text-slate-600 mb-2">Icon Color</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onColorChange(preset.value)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all",
                    color === preset.value ? "border-slate-800 scale-110" : "border-slate-200 hover:border-slate-400"
                  )}
                  style={{ backgroundColor: preset.value }}
                  title={preset.label}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-6 h-6 rounded-full border-2 border-slate-200 cursor-pointer appearance-none bg-transparent"
                title="Custom color"
              />
            </div>
          </div>

          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search icons..."
                className="w-full pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                activeCategory === 'all' ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              All
            </button>
            {SOLID_ICON_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                  activeCategory === category.id ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {category.label.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {(activeCategory === 'all' ? filteredCategories : filteredCategories.filter(c => c.id === activeCategory)).map((category) => (
              <div key={category.id} className="mb-3 last:mb-0">
                {activeCategory === 'all' && (
                  <div className="text-xs font-medium text-slate-500 px-1 py-1 sticky top-0 bg-white">
                    {category.label}
                  </div>
                )}
                <div className="grid grid-cols-6 gap-1">
                  {category.icons.map((iconOption) => {
                    const IconComponent = iconOption.icon;
                    const isSelected = value === iconOption.value;
                    return (
                      <button
                        key={iconOption.value}
                        type="button"
                        onClick={() => {
                          onChange(iconOption.value);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-all relative group",
                          isSelected
                            ? "bg-indigo-100 ring-2 ring-indigo-500"
                            : "hover:bg-slate-100"
                        )}
                        title={iconOption.label}
                      >
                        <IconComponent
                          className="w-5 h-5 mx-auto"
                          style={{ color: isSelected ? color : '#64748b' }}
                        />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Emoji Picker Component
function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">{value || '⭐'}</span>
        </div>
        <span className="flex-1 text-left text-slate-700">
          {value ? (EMOJI_OPTIONS.find(i => i.value === value)?.label || value) : 'Select emoji...'}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden p-2">
          <div className="grid grid-cols-6 gap-1">
            {EMOJI_OPTIONS.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "p-2 rounded-lg transition-all text-xl relative",
                    isSelected
                      ? "bg-indigo-100 ring-2 ring-indigo-500"
                      : "hover:bg-slate-100"
                  )}
                  title={option.label}
                >
                  {option.value}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// CTA Editor Component
function CTAEditor({
  cta,
  onChange,
  pages,
  forms,
}: {
  cta: PricingCTA;
  onChange: (cta: PricingCTA) => void;
  pages: any[];
  forms: any[];
}) {
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showFormDropdown, setShowFormDropdown] = useState(false);

  const selectedPage = pages?.find(p => p._id === cta.pageId);
  const pageContent = selectedPage?.content ? JSON.parse(selectedPage.content) : null;
  const sections = pageContent?.sections || [];

  const handleTypeChange = (type: 'url' | 'page' | 'form') => {
    onChange({
      type,
      url: type === 'url' ? (cta.url || '') : undefined,
      pageId: type === 'page' ? (cta.pageId || undefined) : undefined,
      sectionId: type === 'page' ? (cta.sectionId || undefined) : undefined,
      formId: type === 'form' ? (cta.formId || undefined) : undefined,
    });
    setShowPageDropdown(false);
    setShowSectionDropdown(false);
    setShowFormDropdown(false);
  };

  const handlePageSelect = (pageId: string) => {
    onChange({ ...cta, pageId, sectionId: undefined });
    setShowPageDropdown(false);
    setShowSectionDropdown(false);
  };

  const handleSectionSelect = (sectionId: string) => {
    onChange({ ...cta, sectionId });
    setShowSectionDropdown(false);
  };

  const handleFormSelect = (formId: string) => {
    onChange({ ...cta, formId });
    setShowFormDropdown(false);
  };

  const getSelectedPageName = () => {
    if (!cta.pageId) return 'Select a page';
    const page = pages?.find(p => p._id === cta.pageId);
    return page?.name || 'Select a page';
  };

  const getSelectedSectionName = () => {
    if (!cta.sectionId) return 'All sections';
    const section = sections.find((s: PageSection) => s.id === cta.sectionId);
    if (!section) return 'All sections';
    const template = section.type.charAt(0).toUpperCase() + section.type.slice(1);
    return `${template} Section`;
  };

  return (
    <div className="space-y-3">
      {/* Link Type */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">CTA Type</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTypeChange('url')}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
              cta.type === 'url'
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
              cta.type === 'page'
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
              cta.type === 'form'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />
            Form
          </button>
        </div>
      </div>

      {/* URL Input */}
      {cta.type === 'url' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">URL</label>
          <input
            type="text"
            value={cta.url || ''}
            onChange={(e) => onChange({ ...cta, url: e.target.value })}
            placeholder="https://example.com or /pricing"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>
      )}

      {/* Page Selection */}
      {cta.type === 'page' && (
        <>
          <div className="relative">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Select Page</label>
            <button
              onClick={() => {
                setShowPageDropdown(!showPageDropdown);
                setShowSectionDropdown(false);
              }}
              className="w-full px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
            >
              <span className={cn(!cta.pageId && 'text-slate-400')}>
                {getSelectedPageName()}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {showPageDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {pages && pages.length > 0 ? (
                  pages.map((page) => (
                    <button
                      key={page._id}
                      onClick={() => handlePageSelect(page._id)}
                      className={cn(
                        'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
                        cta.pageId === page._id && 'bg-slate-100 font-medium'
                      )}
                    >
                      {page.name}
                      {page.isHomePage && (
                        <span className="ml-2 text-xs text-slate-500">(Home)</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-500">No pages available</div>
                )}
              </div>
            )}
          </div>

          {/* Section Selection */}
          {cta.pageId && sections.length > 0 && (
            <div className="relative">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Section <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSectionDropdown(!showSectionDropdown);
                    setShowPageDropdown(false);
                  }}
                  className="flex-1 px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
                >
                  <span className={cn(!cta.sectionId && 'text-slate-400')}>
                    {getSelectedSectionName()}
                  </span>
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {cta.sectionId && (
                  <button
                    onClick={() => onChange({ ...cta, sectionId: undefined })}
                    className="px-2 py-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Clear
                  </button>
                )}
              </div>

              {showSectionDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <button
                    onClick={() => handleSectionSelect('')}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors border-b border-slate-100',
                      !cta.sectionId && 'bg-slate-100 font-medium'
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
                        cta.sectionId === section.id && 'bg-slate-100 font-medium'
                      )}
                    >
                      {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Form Selection */}
      {cta.type === 'form' && (
        <div className="relative">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Select Form</label>
          <button
            onClick={() => setShowFormDropdown(!showFormDropdown)}
            className="w-full px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
          >
            <span className={cn(!cta.formId && 'text-slate-400')}>
              {cta.formId ? forms?.find(f => f._id === cta.formId)?.name || 'Select a form' : 'Select a form'}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {showFormDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {forms && forms.length > 0 ? (
                forms.map((form) => (
                  <button
                    key={form._id}
                    onClick={() => handleFormSelect(form._id)}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors flex items-center justify-between',
                      cta.formId === form._id && 'bg-slate-100 font-medium'
                    )}
                  >
                    <span>{form.name}</span>
                    <span className="text-xs text-slate-500">{form.fields?.length || 0} fields</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500">No forms available</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PricingSectionEditor({ content, onChange, websiteId, userId, templateId }: PricingSectionEditorProps) {
  const cards = content.cards || [];
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));

  // Fetch pages and forms
  const pages = useQuery(api.pages.getPagesByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');
  const forms = useQuery(api.forms.getFormsByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');

  const updateContent = (updates: Partial<PricingSectionContent>) => {
    onChange({ ...content, ...updates });
  };

  const updateCard = (index: number, updates: Partial<PricingCard>) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], ...updates };
    updateContent({ cards: newCards });
  };

  const addCard = () => {
    if (cards.length >= 6) return;
    const newCard: PricingCard = {
      ...DEFAULT_CARD,
      id: `card-${Date.now()}`,
    };
    const newCards = [...cards, newCard];
    updateContent({ cards: newCards });
    setExpandedCards(new Set([...expandedCards, cards.length]));
  };

  const removeCard = (index: number) => {
    if (cards.length <= 1) return;
    const newCards = cards.filter((_: PricingCard, i: number) => i !== index);
    updateContent({ cards: newCards });

    const newExpanded = new Set<number>();
    expandedCards.forEach(i => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedCards(newExpanded);
  };

  const moveCard = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= cards.length) return;
    const newCards = [...cards];
    const [removed] = newCards.splice(fromIndex, 1);
    newCards.splice(toIndex, 0, removed);
    updateContent({ cards: newCards });

    const newExpanded = new Set<number>();
    expandedCards.forEach(i => {
      if (i === fromIndex) newExpanded.add(toIndex);
      else if (fromIndex < toIndex && i > fromIndex && i <= toIndex) newExpanded.add(i - 1);
      else if (fromIndex > toIndex && i >= toIndex && i < fromIndex) newExpanded.add(i + 1);
      else newExpanded.add(i);
    });
    setExpandedCards(newExpanded);
  };

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const addFeature = (cardIndex: number) => {
    const card = cards[cardIndex];
    const newFeature: PricingFeature = {
      ...DEFAULT_FEATURE,
      id: `feature-${Date.now()}`,
    };
    updateCard(cardIndex, { features: [...(card.features || []), newFeature] });
  };

  const updateFeature = (cardIndex: number, featureIndex: number, updates: Partial<PricingFeature>) => {
    const card = cards[cardIndex];
    const newFeatures = [...card.features];
    newFeatures[featureIndex] = { ...newFeatures[featureIndex], ...updates };
    updateCard(cardIndex, { features: newFeatures });
  };

  const removeFeature = (cardIndex: number, featureIndex: number) => {
    const card = cards[cardIndex];
    const newFeatures = card.features.filter((_: PricingFeature, i: number) => i !== featureIndex);
    updateCard(cardIndex, { features: newFeatures });
  };

  const isModern = templateId === 'pricing-modern';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Type className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Header</h4>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Headline</label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => updateContent({ headline: e.target.value })}
                placeholder="Simple, Transparent Pricing"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={100}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Subheadline</label>
              <textarea
                value={content.subheadline || ''}
                onChange={(e) => updateContent({ subheadline: e.target.value })}
                placeholder="Choose the plan that works best for you"
                rows={2}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={200}
              />
            </div>
          </div>

          {/* Badge */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-medium text-slate-900">Show Badge</label>
                <p className="text-xs text-slate-500">Display a badge above the headline</p>
              </div>
              <button
                onClick={() => updateContent({ showBadge: !content.showBadge })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  content.showBadge ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    content.showBadge ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {content.showBadge && (
              <input
                type="text"
                value={content.badgeText || ''}
                onChange={(e) => updateContent({ badgeText: e.target.value })}
                placeholder="Pricing"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={30}
              />
            )}
          </div>
        </div>
      </div>

      {/* Styling Options */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Palette className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Styling</h4>
        </div>
        <div className="space-y-4">
          {/* Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content.backgroundColor || (isModern ? '#0f172a' : '#ffffff')}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.backgroundColor || (isModern ? '#0f172a' : '#ffffff')}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content.textColor || (isModern ? '#ffffff' : '#1a1a1a')}
                  onChange={(e) => updateContent({ textColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.textColor || (isModern ? '#ffffff' : '#1a1a1a')}
                  onChange={(e) => updateContent({ textColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content.accentColor || '#6366f1'}
                  onChange={(e) => updateContent({ accentColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.accentColor || '#6366f1'}
                  onChange={(e) => updateContent({ accentColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Card Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content.cardBackgroundColor || (isModern ? '#1e293b' : '#ffffff')}
                  onChange={(e) => updateContent({ cardBackgroundColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.cardBackgroundColor || (isModern ? '#1e293b' : '#ffffff')}
                  onChange={(e) => updateContent({ cardBackgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Columns */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Grid Columns</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {COLUMNS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateContent({ columns: option.value as 1 | 2 | 3 | 4 | 5 | 6 })}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-center",
                    (content.columns || 3) === option.value
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="text-xs font-medium text-slate-700">{option.value}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Pricing Cards ({cards.length}/6)</h4>
          </div>
          <button
            onClick={addCard}
            disabled={cards.length >= 6}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Card
          </button>
        </div>

        <div className="space-y-3">
          {cards.map((card: PricingCard, index: number) => (
            <div
              key={card.id || index}
              className={cn(
                "border rounded-xl transition-all",
                expandedCards.has(index)
                  ? "border-indigo-200 bg-white"
                  : "border-slate-200 bg-white"
              )}
            >
              {/* Card Header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => toggleCard(index)}
              >
                <div className="flex flex-col gap-0.5 text-slate-400">
                  <GripVertical className="h-4 w-4" />
                </div>

                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: card.iconType === 'solid'
                      ? (card.solidIconColor || '#f59e0b') + '20'
                      : undefined,
                    background: card.iconType !== 'solid'
                      ? 'linear-gradient(to bottom right, #f59e0b, #ea580c)'
                      : undefined,
                  }}
                >
                  {card.iconType === 'solid' ? (
                    (() => {
                      const IconComponent = getSolidIconComponent(card.solidIcon || 'star');
                      return IconComponent ? (
                        <IconComponent
                          className="w-5 h-5"
                          style={{ color: card.solidIconColor || '#f59e0b' }}
                        />
                      ) : (
                        <Sparkles className="w-5 h-5" style={{ color: card.solidIconColor || '#f59e0b' }} />
                      );
                    })()
                  ) : (
                    <span className="text-xl">{card.icon || '⭐'}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {card.title || 'Untitled Plan'}
                    </p>
                    {card.highlighted && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {card.price}{card.period} • {card.features?.length || 0} features
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCard(index, index - 1);
                    }}
                    disabled={index === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCard(index, index + 1);
                    }}
                    disabled={index === cards.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCard(index);
                    }}
                    disabled={cards.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Delete card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="ml-1">
                    {expandedCards.has(index) ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Card Content (Expanded) */}
              {expandedCards.has(index) && (
                <div className="border-t border-slate-100 p-4 space-y-4">
                  {/* Title & Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={card.title || ''}
                        onChange={(e) => updateCard(index, { title: e.target.value })}
                        placeholder="Professional"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        maxLength={30}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={card.description || ''}
                        onChange={(e) => updateCard(index, { description: e.target.value })}
                        placeholder="Best for growing businesses"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        maxLength={60}
                      />
                    </div>
                  </div>

                  {/* Price & Period */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Price</label>
                      <input
                        type="text"
                        value={card.price || ''}
                        onChange={(e) => updateCard(index, { price: e.target.value })}
                        placeholder="$49"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Period</label>
                      <input
                        type="text"
                        value={card.period || ''}
                        onChange={(e) => updateCard(index, { period: e.target.value })}
                        placeholder="/month"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        maxLength={20}
                      />
                    </div>
                  </div>

                  {/* Icon Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Icon Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateCard(index, { iconType: 'emoji' })}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-left",
                          (card.iconType || 'emoji') === 'emoji'
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">⭐</span>
                          <span className="text-sm font-medium text-slate-700">Emoji</span>
                        </div>
                        <p className="text-xs text-slate-500">Colorful emoji icons</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCard(index, { iconType: 'solid' })}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-left",
                          card.iconType === 'solid'
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm font-medium text-slate-700">Solid</span>
                        </div>
                        <p className="text-xs text-slate-500">Professional vector icons</p>
                      </button>
                    </div>
                  </div>

                  {/* Icon Picker */}
                  {(card.iconType || 'emoji') === 'emoji' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Emoji Icon</label>
                      <EmojiPicker
                        value={card.icon || '⭐'}
                        onChange={(emoji) => updateCard(index, { icon: emoji })}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Solid Icon</label>
                      <SolidIconPicker
                        value={card.solidIcon || 'star'}
                        color={card.solidIconColor || '#f59e0b'}
                        onChange={(icon) => updateCard(index, { solidIcon: icon })}
                        onColorChange={(color) => updateCard(index, { solidIconColor: color })}
                      />
                    </div>
                  )}

                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">Features</label>
                      <button
                        onClick={() => addFeature(index)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(card.features || []).map((feature: PricingFeature, fIndex: number) => (
                        <div key={feature.id || fIndex} className="flex items-center gap-2">
                          <button
                            onClick={() => updateFeature(index, fIndex, { included: !feature.included })}
                            className={cn(
                              "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                              feature.included
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-slate-300 text-slate-300"
                            )}
                          >
                            {feature.included && <Check className="h-3 w-3" />}
                          </button>
                          <input
                            type="text"
                            value={feature.text || ''}
                            onChange={(e) => updateFeature(index, fIndex, { text: e.target.value })}
                            placeholder="Feature text"
                            className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => removeFeature(index, fIndex)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {(card.features || []).length === 0 && (
                        <p className="text-xs text-slate-500 py-2">No features added yet. Click "Add" to add features.</p>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">CTA Text</label>
                    <input
                      type="text"
                      value={card.ctaText || ''}
                      onChange={(e) => updateCard(index, { ctaText: e.target.value })}
                      placeholder="Get Started"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                      maxLength={30}
                    />
                    <CTAEditor
                      cta={card.cta || { type: 'url', url: '#' }}
                      onChange={(cta) => updateCard(index, { cta })}
                      pages={pages || []}
                      forms={forms || []}
                    />
                  </div>

                  {/* Highlighted & Badge */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-900">Highlight Card</label>
                        <p className="text-xs text-slate-500">Make this card stand out</p>
                      </div>
                      <button
                        onClick={() => updateCard(index, { highlighted: !card.highlighted })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          card.highlighted ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            card.highlighted ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {card.highlighted && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Badge Text</label>
                        <input
                          type="text"
                          value={card.badgeText || ''}
                          onChange={(e) => updateCard(index, { badgeText: e.target.value })}
                          placeholder="Most Popular"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          maxLength={20}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footnote */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Settings className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Footnote</h4>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-900">Show Footnote</label>
              <p className="text-xs text-slate-500">Display text below the pricing cards</p>
            </div>
            <button
              onClick={() => updateContent({ showFootnote: !content.showFootnote })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                content.showFootnote ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  content.showFootnote ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {content.showFootnote && (
            <input
              type="text"
              value={content.footnoteText || ''}
              onChange={(e) => updateContent({ footnoteText: e.target.value })}
              placeholder="All plans include a 14-day free trial. No credit card required."
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={200}
            />
          )}
        </div>
      </div>
    </div>
  );
}
