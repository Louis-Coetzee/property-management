'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Type,
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Star,
  Settings,
  Palette,
  Link2,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImagePicker } from '../ImagePicker';
import { HeroCTAEditor } from '../HeroCTAEditor';
import { SOLID_ICON_CATEGORIES, getSolidIconComponent, ICON_COLOR_PRESETS } from '@/lib/page-builder/icons/solid-icons';

interface HeroVehicleShowcaseEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
  userId?: string;
  websiteId?: string;
}

const DEFAULT_STATS = [
  { id: 'stat1', value: '200+', label: 'Vehicles in Stock', iconType: 'none', emoji: '', solidIcon: 'car', solidIconColor: '#dc2626' },
  { id: 'stat2', value: '15+', label: 'Years Experience', iconType: 'none', emoji: '', solidIcon: 'calendar', solidIconColor: '#dc2626' },
  { id: 'stat3', value: '98%', label: 'Happy Customers', iconType: 'none', emoji: '', solidIcon: 'heart', solidIconColor: '#dc2626' },
];

const DEFAULT_SPECS = [
  { id: 'spec1', label: 'Engine', value: '1.6L' },
  { id: 'spec2', label: 'Mileage', value: '45,000 km' },
  { id: 'spec3', label: 'Transmission', value: 'Automatic' },
  { id: 'spec4', label: 'Fuel', value: 'Petrol' },
];

const DEFAULT_BADGES = [
  { icon: 'shield', text: 'Certified Dealer' },
  { icon: 'award', text: 'Best Price Guarantee' },
  { icon: 'check', text: '150-Point Inspection' },
];

const BADGE_ICONS = [
  { value: 'shield', label: 'Shield' },
  { value: 'award', label: 'Award' },
  { value: 'check', label: 'Check' },
  { value: 'star', label: 'Star' },
];

const ICON_TYPE_OPTIONS = [
  { value: 'none', label: 'No Icon' },
  { value: 'emoji', label: 'Emoji' },
  { value: 'solid', label: 'Icon' },
];

const EMOJI_OPTIONS = [
  { value: '🚗', label: 'Car' },
  { value: '🚙', label: 'SUV' },
  { value: '⭐', label: 'Star' },
  { value: '🏆', label: 'Trophy' },
  { value: '✅', label: 'Check' },
  { value: '💯', label: '100' },
  { value: '📈', label: 'Chart Up' },
  { value: '🎯', label: 'Target' },
  { value: '💎', label: 'Diamond' },
  { value: '🔥', label: 'Fire' },
  { value: '👍', label: 'Thumbs Up' },
  { value: '❤️', label: 'Heart' },
];

// Toggle component
function Toggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2">
        {enabled ? (
          <ToggleRight className="h-4 w-4 text-red-600" />
        ) : (
          <ToggleLeft className="h-4 w-4 text-slate-400" />
        )}
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-red-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// Solid Icon Picker Component for Stats
function StatIconPicker({
  iconType,
  emoji,
  solidIcon,
  solidIconColor,
  onChange,
}: {
  iconType: string;
  emoji: string;
  solidIcon: string;
  solidIconColor: string;
  onChange: (updates: { iconType?: string; emoji?: string; solidIcon?: string; solidIconColor?: string }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const SelectedIcon = getSolidIconComponent(solidIcon);

  const renderPreview = () => {
    if (iconType === 'emoji' && emoji) {
      return <span className="text-xl">{emoji}</span>;
    }
    if (iconType === 'solid' && SelectedIcon) {
      return <SelectedIcon className="w-5 h-5" style={{ color: solidIconColor }} />;
    }
    return <Sparkles className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white"
      >
        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-slate-100">
          {renderPreview()}
        </div>
        <span className="flex-1 text-left text-slate-600 text-xs">
          {iconType === 'none' ? 'No icon' : iconType === 'emoji' ? emoji || 'Emoji' : solidIcon || 'Icon'}
        </span>
        <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden w-64">
          {/* Icon Type Selection */}
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Icon Type</label>
            <div className="flex gap-1">
              {ICON_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ iconType: option.value })}
                  className={cn(
                    "flex-1 px-2 py-1 text-xs rounded-md transition-colors",
                    iconType === option.value
                      ? "bg-red-600 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {iconType === 'emoji' && (
            <div className="p-2 border-b border-slate-100">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Select Emoji</label>
              <div className="grid grid-cols-6 gap-1">
                {EMOJI_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ emoji: opt.value })}
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-slate-100 transition-colors",
                      emoji === opt.value && "bg-red-100 ring-1 ring-red-300"
                    )}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {iconType === 'solid' && (
            <>
              {/* Color Picker */}
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Icon Color</label>
                <div className="flex flex-wrap gap-1">
                  {ICON_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => onChange({ solidIconColor: preset.value })}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        solidIconColor === preset.value ? "border-slate-800 scale-110" : "border-slate-200 hover:border-slate-400"
                      )}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    />
                  ))}
                  <input
                    type="color"
                    value={solidIconColor}
                    onChange={(e) => onChange({ solidIconColor: e.target.value })}
                    className="w-5 h-5 rounded-full border-2 border-slate-200 cursor-pointer appearance-none bg-transparent"
                  />
                </div>
              </div>

              {/* Search */}
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search icons..."
                    className="w-full pl-3 pr-6 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Icon Grid */}
              <div className="max-h-48 overflow-y-auto p-2">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="mb-2">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{category.label}</p>
                    <div className="grid grid-cols-4 gap-1">
                      {category.icons.map((icon) => {
                        const IconComponent = icon.icon;
                        return (
                          <button
                            key={icon.value}
                            type="button"
                            onClick={() => onChange({ solidIcon: icon.value })}
                            className={cn(
                              "w-full aspect-square rounded flex flex-col items-center justify-center gap-0.5 hover:bg-slate-100 transition-colors p-1",
                              solidIcon === icon.value && "bg-red-100 ring-1 ring-red-300"
                            )}
                            title={icon.label}
                          >
                            <IconComponent className="w-4 h-4" style={{ color: solidIconColor }} />
                            <span className="text-[8px] text-slate-500 truncate w-full text-center">{icon.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// SectionWrapper component
function SectionWrapper({
  id,
  title,
  icon: Icon,
  children,
  isExpanded,
  onToggle,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="bg-slate-50 rounded-2xl overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Icon className="h-4 w-4 text-red-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {isExpanded && <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">{children}</div>}
    </div>
  );
}

export function HeroVehicleShowcaseEditor({
  content,
  onChange,
  userId,
  websiteId,
}: HeroVehicleShowcaseEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['vehicle', 'content']));

  const stats = useMemo(() => content.stats || DEFAULT_STATS, [content.stats]);
  const specs = useMemo(() => content.specs || DEFAULT_SPECS, [content.specs]);
  const badges = useMemo(() => content.badges || DEFAULT_BADGES, [content.badges]);

  const updateContent = useCallback((updates: Record<string, any>) => {
    onChange({ ...content, ...updates });
  }, [content, onChange]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return newExpanded;
    });
  }, []);

  // Stats management
  const updateStat = useCallback((statId: string, updates: Partial<{
    value: string;
    label: string;
    iconType: string;
    emoji: string;
    solidIcon: string;
    solidIconColor: string;
  }>) => {
    const newStats = stats.map((stat: any) =>
      stat.id === statId ? { ...stat, ...updates } : stat
    );
    updateContent({ stats: newStats });
  }, [stats, updateContent]);

  const addStat = useCallback(() => {
    const newStat = {
      id: `stat_${Date.now()}`,
      value: '100',
      label: 'New Stat',
      iconType: 'none',
      emoji: '',
      solidIcon: 'star',
      solidIconColor: '#dc2626',
    };
    updateContent({ stats: [...stats, newStat] });
  }, [stats, updateContent]);

  const removeStat = useCallback((statId: string) => {
    const newStats = stats.filter((stat: any) => stat.id !== statId);
    updateContent({ stats: newStats });
  }, [stats, updateContent]);

  // Specs management
  const updateSpec = useCallback((specId: string, updates: Partial<{ value: string; label: string }>) => {
    const newSpecs = specs.map((spec: any) =>
      spec.id === specId ? { ...spec, ...updates } : spec
    );
    updateContent({ specs: newSpecs });
  }, [specs, updateContent]);

  const addSpec = useCallback(() => {
    const newSpec = {
      id: `spec_${Date.now()}`,
      label: 'New Spec',
      value: 'Value',
    };
    updateContent({ specs: [...specs, newSpec] });
  }, [specs, updateContent]);

  const removeSpec = useCallback((specId: string) => {
    const newSpecs = specs.filter((spec: any) => spec.id !== specId);
    updateContent({ specs: newSpecs });
  }, [specs, updateContent]);

  // Badges management
  const updateBadge = useCallback((index: number, updates: Partial<{ icon: string; text: string }>) => {
    const newBadges = badges.map((badge: any, i: number) =>
      i === index ? { ...badge, ...updates } : badge
    );
    updateContent({ badges: newBadges });
  }, [badges, updateContent]);

  const addBadge = useCallback(() => {
    const newBadge = {
      icon: 'shield',
      text: 'New Badge',
    };
    updateContent({ badges: [...badges, newBadge] });
  }, [badges, updateContent]);

  const removeBadge = useCallback((index: number) => {
    const newBadges = badges.filter((_: any, i: number) => i !== index);
    updateContent({ badges: newBadges });
  }, [badges, updateContent]);

  return (
    <div className="space-y-4">
      {/* Vehicle Image Section */}
      <SectionWrapper
        id="vehicle"
        title="Vehicle Image"
        icon={ImageIcon}
        isExpanded={expandedSections.has('vehicle')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <ImagePicker
            imageUrl={content.vehicleImage || ''}
            onChange={(url) => updateContent({ vehicleImage: url })}
            userId={userId}
            label="Vehicle Image (PNG with transparent background recommended)"
            showAltField={false}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Name</label>
              <input
                type="text"
                value={content.vehicleName || ''}
                onChange={(e) => updateContent({ vehicleName: e.target.value })}
                placeholder="2024 Premium Sedan"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
              <input
                type="text"
                value={content.vehicleYear || ''}
                onChange={(e) => updateContent({ vehicleYear: e.target.value })}
                placeholder="2024"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Price</label>
              <input
                type="text"
                value={content.vehiclePrice || ''}
                onChange={(e) => updateContent({ vehiclePrice: e.target.value })}
                placeholder="$45,990"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Price Label</label>
              <input
                type="text"
                value={content.priceLabel || ''}
                onChange={(e) => updateContent({ priceLabel: e.target.value })}
                placeholder="Starting at"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <Toggle
            label="Show Price Tag"
            description="Display floating price tag on image"
            enabled={content.showPriceTag !== false}
            onChange={(value) => updateContent({ showPriceTag: value })}
          />

          <Toggle
            label="Show Vehicle Badge"
            description="Display vehicle name badge on image"
            enabled={content.showVehicleBadge !== false}
            onChange={(value) => updateContent({ showVehicleBadge: value })}
          />
        </div>
      </SectionWrapper>

      {/* Content Section */}
      <SectionWrapper
        id="content"
        title="Content"
        icon={Type}
        isExpanded={expandedSections.has('content')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
            <input
              type="text"
              value={content.tagline || ''}
              onChange={(e) => updateContent({ tagline: e.target.value })}
              placeholder="Featured Vehicle"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Headline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={content.headline || ''}
              onChange={(e) => updateContent({ headline: e.target.value })}
              placeholder="Find Your Perfect Vehicle"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
            <input
              type="text"
              value={content.subtitle || ''}
              onChange={(e) => updateContent({ subtitle: e.target.value })}
              placeholder="Premium Quality • Best Value"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subheadline</label>
            <textarea
              value={content.subheadline || ''}
              onChange={(e) => updateContent({ subheadline: e.target.value })}
              placeholder="Discover our exceptional collection..."
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              maxLength={300}
            />
          </div>

          {/* Primary CTA */}
          <div className="space-y-3">
            <Toggle
              label="Show Primary CTA"
              description="Main call-to-action button"
              enabled={content.showPrimaryCta !== false}
              onChange={(value) => updateContent({ showPrimaryCta: value })}
            />

            {content.showPrimaryCta !== false && (
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <HeroCTAEditor
                  cta={{
                    ctaText: content.ctaText || '',
                    ctaType: content.ctaType || 'url',
                    ctaLink: content.ctaLink || '',
                    ctaPageId: content.ctaPageId,
                    ctaSectionId: content.ctaSectionId,
                    ctaFormId: content.ctaFormId,
                  }}
                  websiteId={websiteId || ''}
                  userId={userId}
                  onChange={(cta) => {
                    updateContent({
                      ctaText: cta.ctaText,
                      ctaType: cta.ctaType,
                      ctaLink: cta.ctaLink,
                      ctaPageId: cta.ctaPageId,
                      ctaSectionId: cta.ctaSectionId,
                      ctaFormId: cta.ctaFormId,
                    });
                  }}
                />
              </div>
            )}
          </div>

          {/* Secondary CTA */}
          <div className="space-y-3">
            <Toggle
              label="Show Secondary CTA"
              description="Secondary call-to-action button"
              enabled={content.showSecondaryCta !== false}
              onChange={(value) => updateContent({ showSecondaryCta: value })}
            />

            {content.showSecondaryCta !== false && (
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <HeroCTAEditor
                  cta={{
                    ctaText: content.secondaryCtaText || '',
                    ctaType: content.secondaryCtaType || 'url',
                    ctaLink: content.secondaryCtaLink || '',
                    ctaPageId: content.secondaryCtaPageId,
                    ctaSectionId: content.secondaryCtaSectionId,
                    ctaFormId: content.secondaryCtaFormId,
                  }}
                  websiteId={websiteId || ''}
                  userId={userId}
                  onChange={(cta) => {
                    updateContent({
                      secondaryCtaText: cta.ctaText,
                      secondaryCtaType: cta.ctaType,
                      secondaryCtaLink: cta.ctaLink,
                      secondaryCtaPageId: cta.ctaPageId,
                      secondaryCtaSectionId: cta.ctaSectionId,
                      secondaryCtaFormId: cta.ctaFormId,
                    });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </SectionWrapper>

      {/* Rating Section */}
      <SectionWrapper
        id="rating"
        title="Rating & Reviews"
        icon={Star}
        isExpanded={expandedSections.has('rating')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <Toggle
            label="Show Reviews"
            description="Display rating badge with stars"
            enabled={content.showReviews !== false}
            onChange={(value) => updateContent({ showReviews: value })}
          />

          {content.showReviews !== false && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={content.rating || 4.9}
                  onChange={(e) => updateContent({ rating: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Review Count</label>
                <input
                  type="text"
                  value={content.reviewCount || ''}
                  onChange={(e) => updateContent({ reviewCount: e.target.value })}
                  placeholder="500+"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}
        </div>
      </SectionWrapper>

      {/* Vehicle Specs Section */}
      <SectionWrapper
        id="specs"
        title="Vehicle Specs"
        icon={Settings}
        isExpanded={expandedSections.has('specs')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <Toggle
            label="Show Specs"
            description="Display vehicle specifications grid"
            enabled={content.showSpecs !== false}
            onChange={(value) => updateContent({ showSpecs: value })}
          />

          {content.showSpecs !== false && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Specifications</label>
                <button
                  onClick={addSpec}
                  disabled={specs.length >= 6}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              <div className="space-y-3">
                {specs.map((spec: any) => (
                  <div key={spec.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Spec Label (e.g., Engine, Mileage)</label>
                          <input
                            type="text"
                            value={spec.label}
                            onChange={(e) => updateSpec(spec.id, { label: e.target.value })}
                            placeholder="e.g., Engine"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Spec Value (e.g., 1.6L, 45,000 km)</label>
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => updateSpec(spec.id, { value: e.target.value })}
                            placeholder="e.g., 1.6L"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeSpec(spec.id)}
                        disabled={specs.length <= 1}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionWrapper>

      {/* Quick Stats Section */}
      <SectionWrapper
        id="stats"
        title="Bottom Stats"
        icon={Settings}
        isExpanded={expandedSections.has('stats')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <Toggle
            label="Show Quick Stats"
            description="Display statistics below section"
            enabled={content.showQuickStats !== false}
            onChange={(value) => updateContent({ showQuickStats: value })}
          />

          {content.showQuickStats !== false && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Statistics</label>
                <button
                  onClick={addStat}
                  disabled={stats.length >= 6}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              <div className="space-y-3">
                {stats.map((stat: any) => (
                  <div key={stat.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Value</label>
                          <input
                            type="text"
                            value={stat.value || ''}
                            onChange={(e) => updateStat(stat.id, { value: e.target.value })}
                            placeholder="200+"
                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Label</label>
                          <input
                            type="text"
                            value={stat.label || ''}
                            onChange={(e) => updateStat(stat.id, { label: e.target.value })}
                            placeholder="Vehicles in Stock"
                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeStat(stat.id)}
                        disabled={stats.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Icon (Optional)</label>
                      <StatIconPicker
                        iconType={stat.iconType || 'none'}
                        emoji={stat.emoji || ''}
                        solidIcon={stat.solidIcon || 'star'}
                        solidIconColor={stat.solidIconColor || '#dc2626'}
                        onChange={(updates) => updateStat(stat.id, updates)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionWrapper>

      {/* Trust Badges Section */}
      <SectionWrapper
        id="badges"
        title="Trust Badges"
        icon={Settings}
        isExpanded={expandedSections.has('badges')}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Badges</label>
            <button
              onClick={addBadge}
              disabled={badges.length >= 5}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {badges.map((badge: any, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                <select
                  value={badge.icon}
                  onChange={(e) => updateBadge(index, { icon: e.target.value })}
                  className="px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {BADGE_ICONS.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={badge.text}
                  onChange={(e) => updateBadge(index, { text: e.target.value })}
                  placeholder="Badge Text"
                  className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={() => removeBadge(index)}
                  disabled={badges.length <= 1}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Styling Section */}
      <SectionWrapper
        id="styling"
        title="Colors"
        icon={Palette}
        isExpanded={expandedSections.has('styling')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={content.backgroundColor || '#0a0a0a'}
                onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
              />
              <input
                type="text"
                value={content.backgroundColor || '#0a0a0a'}
                onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={content.accentColor || '#dc2626'}
                onChange={(e) => updateContent({ accentColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
              />
              <input
                type="text"
                value={content.accentColor || '#dc2626'}
                onChange={(e) => updateContent({ accentColor: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
