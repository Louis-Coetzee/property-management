'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Type,
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Star,
  Shield,
  Award,
  Check,
  Settings,
  Link2,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImagePicker } from '../ImagePicker';

interface HeroDealershipEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
  userId?: string;
  websiteId?: string;
}

const BADGE_ICONS = [
  { value: 'shield', label: 'Shield', Icon: Shield },
  { value: 'award', label: 'Award', Icon: Award },
  { value: 'check', label: 'Check', Icon: Check },
  { value: 'star', label: 'Star', Icon: Star },
];

const DEFAULT_STATS = [
  { id: 'stat1', value: '200+', label: 'Vehicles in Stock' },
  { id: 'stat2', value: '15+', label: 'Years Experience' },
  { id: 'stat3', value: '98%', label: 'Happy Customers' },
];

const DEFAULT_BADGES = [
  { icon: 'shield', text: 'Certified Dealer' },
  { icon: 'award', text: 'Best Price Guarantee' },
  { icon: 'check', text: '150-Point Inspection' },
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

export function HeroDealershipEditor({
  content,
  onChange,
  userId,
  websiteId,
}: HeroDealershipEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['vehicle', 'content']));

  const stats = useMemo(() => content.stats || DEFAULT_STATS, [content.stats]);
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
  const updateStat = useCallback((statId: string, updates: Partial<{ value: string; label: string }>) => {
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
    };
    updateContent({ stats: [...stats, newStat] });
  }, [stats, updateContent]);

  const removeStat = useCallback((statId: string) => {
    const newStats = stats.filter((stat: any) => stat.id !== statId);
    updateContent({ stats: newStats });
  }, [stats, updateContent]);

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
            label="Vehicle Image"
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Subheadline</label>
            <textarea
              value={content.subheadline || ''}
              onChange={(e) => updateContent({ subheadline: e.target.value })}
              placeholder="Discover our exceptional collection of quality vehicles"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Button Text</label>
                  <input
                    type="text"
                    value={content.ctaText || ''}
                    onChange={(e) => updateContent({ ctaText: e.target.value })}
                    placeholder="Browse Inventory"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Button Link</label>
                  <input
                    type="text"
                    value={content.ctaLink || ''}
                    onChange={(e) => updateContent({ ctaLink: e.target.value })}
                    placeholder="#inventory"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Button Text</label>
                  <input
                    type="text"
                    value={content.secondaryCtaText || ''}
                    onChange={(e) => updateContent({ secondaryCtaText: e.target.value })}
                    placeholder="Schedule Test Drive"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Button Link</label>
                  <input
                    type="text"
                    value={content.secondaryCtaLink || ''}
                    onChange={(e) => updateContent({ secondaryCtaLink: e.target.value })}
                    placeholder="#contact"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Toggle */}
          <Toggle
            label="Show Quick Stats"
            description="Display statistics below buttons"
            enabled={content.showQuickStats !== false}
            onChange={(value) => updateContent({ showQuickStats: value })}
          />
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

      {/* Stats Section */}
      <SectionWrapper
        id="stats"
        title="Quick Stats"
        icon={Settings}
        isExpanded={expandedSections.has('stats')}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Statistics</label>
            <button
              onClick={addStat}
              disabled={stats.length >= 4}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>
          <div className="space-y-3">
            {stats.map((stat: any) => (
              <div key={stat.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Value</label>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => updateStat(stat.id, { value: e.target.value })}
                        placeholder="200+"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Label</label>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => updateStat(stat.id, { label: e.target.value })}
                        placeholder="Vehicles in Stock"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeStat(stat.id)}
                    disabled={stats.length <= 1}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Max 4 stats recommended for best display</p>
        </div>
      </SectionWrapper>

      {/* Trust Badges Section */}
      <SectionWrapper
        id="badges"
        title="Trust Badges"
        icon={Shield}
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
          <p className="text-xs text-slate-500">Max 5 badges recommended for best display</p>
        </div>
      </SectionWrapper>
    </div>
  );
}
