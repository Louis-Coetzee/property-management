'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Image as ImageIcon,
  Settings,
  Type,
  Palette,
  Sparkles,
  X,
  Check,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AboutSectionContent, AboutFeaturePill, AboutStat, AboutIconType } from '@/types/page-builder';
import { ImagePicker } from '../ImagePicker';
import { SOLID_ICON_CATEGORIES, getSolidIconComponent, ICON_COLOR_PRESETS } from '@/lib/page-builder/icons/solid-icons';

interface AboutEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
  userId?: string;
  websiteId?: string;
  templateId: string;
}

// Emoji options for feature pills and stats
const EMOJI_CATEGORIES = [
  {
    id: 'general',
    label: 'General',
    icons: [
      { value: '✨', label: 'Sparkles' },
      { value: '⚡', label: 'Lightning' },
      { value: '🚀', label: 'Rocket' },
      { value: '🛡️', label: 'Shield' },
      { value: '💡', label: 'Lightbulb' },
      { value: '⭐', label: 'Star' },
      { value: '💎', label: 'Diamond' },
      { value: '🔥', label: 'Fire' },
      { value: '✅', label: 'Check' },
      { value: '🎯', label: 'Target' },
      { value: '🏆', label: 'Trophy' },
      { value: '🤝', label: 'Handshake' },
      { value: '💪', label: 'Strong' },
      { value: '🌟', label: 'Glowing Star' },
      { value: '❤️', label: 'Heart' },
      { value: '👍', label: 'Thumbs Up' },
    ],
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    icons: [
      { value: '🚗', label: 'Car' },
      { value: '🚙', label: 'SUV' },
      { value: '🏎️', label: 'Racing' },
      { value: '🚚', label: 'Truck' },
      { value: '🏍️', label: 'Motorcycle' },
      { value: '🛠️', label: 'Tools' },
      { value: '🔧', label: 'Wrench' },
      { value: '⛽', label: 'Fuel' },
    ],
  },
];

const DEFAULT_FEATURE_PILLS: AboutFeaturePill[] = [
  { id: 'pill1', text: 'Innovation', iconType: 'solid', solidIcon: 'zap', solidIconColor: '#dc2626' },
  { id: 'pill2', text: 'Quality', iconType: 'solid', solidIcon: 'award', solidIconColor: '#dc2626' },
  { id: 'pill3', text: 'Trust', iconType: 'solid', solidIcon: 'shield', solidIconColor: '#dc2626' },
];

const DEFAULT_STATS: AboutStat[] = [
  { id: 'stat1', value: '2,500+', label: 'Vehicles Sold', iconType: 'solid', solidIcon: 'car', solidIconColor: '#dc2626' },
  { id: 'stat2', value: '15+', label: 'Years in Business', iconType: 'solid', solidIcon: 'award', solidIconColor: '#dc2626' },
  { id: 'stat3', value: '98%', label: 'Customer Satisfaction', iconType: 'solid', solidIcon: 'heart', solidIconColor: '#dc2626' },
  { id: 'stat4', value: '500+', label: '5-Star Reviews', iconType: 'solid', solidIcon: 'star', solidIconColor: '#dc2626' },
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

// Section wrapper
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

// Solid Icon Picker
interface SolidIconPickerProps {
  value: string;
  color: string;
  onChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}

function SolidIconPicker({ value, color, onChange, onColorChange }: SolidIconPickerProps) {
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

  const SelectedIcon = getSolidIconComponent(value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white"
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
          {value ? (SOLID_ICON_CATEGORIES.flatMap((c) => c.icons).find((i) => i.value === value)?.label || value) : 'Select icon...'}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <label className="block text-xs font-medium text-slate-600 mb-2">Icon Color</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onColorChange(preset.value)}
                  className={cn(
                    'w-6 h-6 rounded-lg transition-all border-2',
                    color === preset.value ? 'border-slate-400 scale-110' : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: preset.value }}
                  title={preset.label}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border border-slate-200"
              />
            </div>
          </div>

          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="p-2">
            {filteredCategories.map((category) => (
              <div key={category.id} className="mb-2">
                <p className="text-xs font-medium text-slate-500 px-2 py-1">{category.label}</p>
                <div className="grid grid-cols-4 gap-1">
                  {category.icons.map((icon) => {
                    const IconComponent = getSolidIconComponent(icon.value);
                    return (
                      <button
                        key={icon.value}
                        onClick={() => {
                          onChange(icon.value);
                          setIsOpen(false);
                        }}
                        className={cn(
                          'p-2 rounded-lg flex flex-col items-center gap-1 transition-colors',
                          value === icon.value ? 'bg-red-100 text-red-600' : 'hover:bg-slate-100'
                        )}
                        title={icon.label}
                      >
                        {IconComponent && <IconComponent className="w-5 h-5" style={{ color: value === icon.value ? color : undefined }} />}
                        <span className="text-[10px] truncate w-full text-center">{icon.label}</span>
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

// Emoji Picker
interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

function EmojiPicker({ value, onChange }: EmojiPickerProps) {
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
        className="w-full flex items-center gap-3 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white"
      >
        <span className="text-2xl">{value || '😀'}</span>
        <span className="flex-1 text-left text-slate-700">{value || 'Select emoji...'}</span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {EMOJI_CATEGORIES.map((category) => (
            <div key={category.id} className="p-2 border-b border-slate-100 last:border-0">
              <p className="text-xs font-medium text-slate-500 px-2 py-1">{category.label}</p>
              <div className="grid grid-cols-8 gap-1">
                {category.icons.map((icon) => (
                  <button
                    key={icon.value}
                    onClick={() => {
                      onChange(icon.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'p-2 rounded-lg text-xl transition-colors',
                      value === icon.value ? 'bg-red-100' : 'hover:bg-slate-100'
                    )}
                    title={icon.label}
                  >
                    {icon.value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Icon Type Selector with Picker
interface IconSelectorProps {
  iconType: AboutIconType;
  emojiIcon?: string;
  solidIcon?: string;
  solidIconColor?: string;
  onTypeChange: (type: AboutIconType) => void;
  onEmojiChange: (emoji: string) => void;
  onSolidChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}

function IconSelector({
  iconType,
  emojiIcon,
  solidIcon,
  solidIconColor,
  onTypeChange,
  onEmojiChange,
  onSolidChange,
  onColorChange,
}: IconSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => onTypeChange('emoji')}
          className={cn(
            'flex-1 px-3 py-2 text-sm rounded-lg border transition-colors',
            iconType === 'emoji'
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          )}
        >
          Emoji
        </button>
        <button
          onClick={() => onTypeChange('solid')}
          className={cn(
            'flex-1 px-3 py-2 text-sm rounded-lg border transition-colors',
            iconType === 'solid'
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          )}
        >
          Solid Icon
        </button>
      </div>

      {iconType === 'emoji' ? (
        <EmojiPicker value={emojiIcon || ''} onChange={onEmojiChange} />
      ) : (
        <SolidIconPicker
          value={solidIcon || ''}
          color={solidIconColor || '#dc2626'}
          onChange={onSolidChange}
          onColorChange={onColorChange}
        />
      )}
    </div>
  );
}

export function AboutEditor({ content, onChange, userId, websiteId, templateId }: AboutEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['content', 'features']));

  // Ensure feature pills always have unique IDs (for backward compatibility)
  const featurePills = (content.featurePills || DEFAULT_FEATURE_PILLS).map((pill: AboutFeaturePill, index: number) => ({
    ...pill,
    id: pill.id || `pill_${index}`,
  }));
  // Ensure stats always have unique IDs (for backward compatibility)
  const stats = (content.stats || DEFAULT_STATS).map((stat: AboutStat, index: number) => ({
    ...stat,
    id: stat.id || `stat_${index}`,
  }));

  const updateContent = (updates: Record<string, any>) => {
    onChange({ ...content, ...updates });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return newExpanded;
    });
  };

  // Feature Pills management
  const updateFeaturePill = (pillId: string, updates: Partial<AboutFeaturePill>) => {
    const newPills = featurePills.map((pill: AboutFeaturePill) =>
      pill.id === pillId ? { ...pill, ...updates } : pill
    );
    updateContent({ featurePills: newPills });
  };

  const addFeaturePill = () => {
    const newPill: AboutFeaturePill = {
      id: `pill_${Date.now()}`,
      text: 'New Feature',
      iconType: 'solid',
      solidIcon: 'star',
      solidIconColor: content.accentColor || '#dc2626',
    };
    updateContent({ featurePills: [...featurePills, newPill] });
  };

  const removeFeaturePill = (pillId: string) => {
    const newPills = featurePills.filter((pill: AboutFeaturePill) => pill.id !== pillId);
    updateContent({ featurePills: newPills });
  };

  // Stats management
  const updateStat = (statId: string, updates: Partial<AboutStat>) => {
    const newStats = stats.map((stat: AboutStat) =>
      stat.id === statId ? { ...stat, ...updates } : stat
    );
    updateContent({ stats: newStats });
  };

  const addStat = () => {
    const newStat: AboutStat = {
      id: `stat_${Date.now()}`,
      value: '100',
      label: 'New Stat',
      iconType: 'solid',
      solidIcon: 'chart',
      solidIconColor: content.accentColor || '#dc2626',
    };
    updateContent({ stats: [...stats, newStat] });
  };

  const removeStat = (statId: string) => {
    const newStats = stats.filter((stat: AboutStat) => stat.id !== statId);
    updateContent({ stats: newStats });
  };

  return (
    <div className="space-y-4">
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
              placeholder="Why Choose Us"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subheadline / Badge</label>
            <input
              type="text"
              value={content.subheadline || ''}
              onChange={(e) => updateContent({ subheadline: e.target.value })}
              placeholder="Your Trusted Partner"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={content.description || ''}
              onChange={(e) => updateContent({ description: e.target.value })}
              placeholder="Tell your story..."
              rows={4}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Image Section */}
      <SectionWrapper
        id="image"
        title="Image"
        icon={ImageIcon}
        isExpanded={expandedSections.has('image')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <ImagePicker
            imageUrl={content.imageUrl || ''}
            imageAlt={content.imageAlt || ''}
            onChange={(url) => updateContent({ imageUrl: url })}
            onAltChange={(alt) => updateContent({ imageAlt: alt })}
            userId={userId}
            label="Section Image"
            showAltField={true}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
              <select
                value={content.imagePosition || 'left'}
                onChange={(e) => updateContent({ imagePosition: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
              <select
                value={content.imageSize || 'medium'}
                onChange={(e) => updateContent({ imageSize: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="xs">Extra Small</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="full">Full Width</option>
              </select>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Feature Pills Section */}
      <SectionWrapper
        id="features"
        title="Feature Pills"
        icon={Sparkles}
        isExpanded={expandedSections.has('features')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <Toggle
            label="Show Feature Pills"
            description="Display feature badges (e.g., Innovation, Quality, Trust)"
            enabled={content.showFeaturePills !== false}
            onChange={(value) => updateContent({ showFeaturePills: value })}
          />

          {content.showFeaturePills !== false && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Pills</label>
                <button
                  onClick={addFeaturePill}
                  disabled={featurePills.length >= 6}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>

              {featurePills.map((pill: AboutFeaturePill) => (
                <div key={pill.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pill.text}
                      onChange={(e) => updateFeaturePill(pill.id, { text: e.target.value })}
                      placeholder="Feature name"
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      onClick={() => removeFeaturePill(pill.id)}
                      disabled={featurePills.length <= 1}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <IconSelector
                    iconType={pill.iconType || 'solid'}
                    emojiIcon={pill.icon}
                    solidIcon={pill.solidIcon}
                    solidIconColor={pill.solidIconColor}
                    onTypeChange={(type) => updateFeaturePill(pill.id, { iconType: type })}
                    onEmojiChange={(emoji) => updateFeaturePill(pill.id, { icon: emoji })}
                    onSolidChange={(icon) => updateFeaturePill(pill.id, { solidIcon: icon })}
                    onColorChange={(color) => updateFeaturePill(pill.id, { solidIconColor: color })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionWrapper>

      {/* Stats Section */}
      <SectionWrapper
        id="stats"
        title="Statistics"
        icon={Settings}
        isExpanded={expandedSections.has('stats')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <Toggle
            label="Show Statistics"
            description="Display stats grid with icons"
            enabled={content.showStats !== false}
            onChange={(value) => updateContent({ showStats: value })}
          />

          {content.showStats !== false && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Stats</label>
                <button
                  onClick={addStat}
                  disabled={stats.length >= 6}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>

              {stats.map((stat: AboutStat) => (
                <div key={stat.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => updateStat(stat.id, { value: e.target.value })}
                      placeholder="2,500+"
                      className="w-24 px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(stat.id, { label: e.target.value })}
                      placeholder="Label"
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      onClick={() => removeStat(stat.id)}
                      disabled={stats.length <= 1}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <IconSelector
                    iconType={stat.iconType || 'solid'}
                    emojiIcon={stat.icon}
                    solidIcon={stat.solidIcon}
                    solidIconColor={stat.solidIconColor}
                    onTypeChange={(type) => updateStat(stat.id, { iconType: type })}
                    onEmojiChange={(emoji) => updateStat(stat.id, { icon: emoji })}
                    onSolidChange={(icon) => updateStat(stat.id, { solidIcon: icon })}
                    onColorChange={(color) => updateStat(stat.id, { solidIconColor: color })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionWrapper>

      {/* CTA Section */}
      <SectionWrapper
        id="cta"
        title="Call to Action"
        icon={Settings}
        isExpanded={expandedSections.has('cta')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <Toggle
            label="Show CTA Button"
            enabled={content.ctaEnabled !== false}
            onChange={(value) => updateContent({ ctaEnabled: value })}
          />

          {content.ctaEnabled !== false && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Button Text</label>
                  <input
                    type="text"
                    value={content.ctaText || ''}
                    onChange={(e) => updateContent({ ctaText: e.target.value })}
                    placeholder="Learn More"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Link</label>
                  <input
                    type="text"
                    value={content.ctaLink || ''}
                    onChange={(e) => updateContent({ ctaLink: e.target.value })}
                    placeholder="/about"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Button Background</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={content.ctaButtonBg || '#1a1a1a'}
                      onChange={(e) => updateContent({ ctaButtonBg: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={content.ctaButtonBg || '#1a1a1a'}
                      onChange={(e) => updateContent({ ctaButtonBg: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Button Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={content.ctaButtonTextColor || '#ffffff'}
                      onChange={(e) => updateContent({ ctaButtonTextColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={content.ctaButtonTextColor || '#ffffff'}
                      onChange={(e) => updateContent({ ctaButtonTextColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SectionWrapper>

      {/* Floating Badge Section */}
      <SectionWrapper
        id="badge"
        title="Floating Badge"
        icon={Sparkles}
        isExpanded={expandedSections.has('badge')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <Toggle
            label="Show Floating Badge"
            description="Display badge on image"
            enabled={content.showFloatingBadge !== false}
            onChange={(value) => updateContent({ showFloatingBadge: value })}
          />

          {content.showFloatingBadge !== false && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Value</label>
                <input
                  type="text"
                  value={content.floatingBadgeValue || ''}
                  onChange={(e) => updateContent({ floatingBadgeValue: e.target.value })}
                  placeholder="15+"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Label</label>
                <input
                  type="text"
                  value={content.floatingBadgeLabel || ''}
                  onChange={(e) => updateContent({ floatingBadgeLabel: e.target.value })}
                  placeholder="Years Experience"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}
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
                value={content.backgroundColor || '#f8fafc'}
                onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
              />
              <input
                type="text"
                value={content.backgroundColor || '#f8fafc'}
                onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={content.textColor || '#1e293b'}
                onChange={(e) => updateContent({ textColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
              />
              <input
                type="text"
                value={content.textColor || '#1e293b'}
                onChange={(e) => updateContent({ textColor: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color (Icons & Highlights)</label>
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
