'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, Image as ImageIcon, Settings, Type, Palette, Grid3X3, Sparkles, Move, GripVertical, X, Check, AlignLeft, AlignCenter, AlignRight, Link, ExternalLink, FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeaturesSectionContent, FeatureGridLayout, FeatureIconStyle, FeatureIconType, FeatureContentAlignment, FeatureLinkType, FeatureIconSize } from '@/types/page-builder';
import MediaLibraryModal from '@/components/media-library-modal';
import { SOLID_ICON_CATEGORIES, getSolidIconComponent, ICON_COLOR_PRESETS } from '@/lib/page-builder/icons/solid-icons';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface FeaturesEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
  userId?: string;
  templateId: string;
}

const DEFAULT_FEATURE = {
  id: `feature-${Date.now()}`,
  title: 'New Feature',
  description: 'Describe your feature here',
  icon: '✨',
  iconType: 'emoji' as FeatureIconType,
  solidIcon: 'sparkles',
  solidIconColor: '#6366f1',
  link: {
    type: 'url' as FeatureLinkType,
    url: '',
  },
};

// Expanded emoji options with categories
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
      { value: '📊', label: 'Chart' },
      { value: '🔒', label: 'Lock' },
      { value: '🎯', label: 'Target' },
      { value: '⭐', label: 'Star' },
      { value: '💎', label: 'Diamond' },
      { value: '🔥', label: 'Fire' },
      { value: '📱', label: 'Mobile' },
      { value: '💻', label: 'Computer' },
      { value: '🌐', label: 'Globe' },
      { value: '📧', label: 'Email' },
      { value: '🔔', label: 'Bell' },
      { value: '✅', label: 'Check' },
      { value: '⚙️', label: 'Settings' },
      { value: '🤝', label: 'Handshake' },
      { value: '💬', label: 'Chat' },
    ],
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    icons: [
      { value: '🚗', label: 'Car' },
      { value: '🚙', label: 'SUV' },
      { value: '🚕', label: 'Taxi' },
      { value: '🚌', label: 'Bus' },
      { value: '🚎', label: 'Trolley' },
      { value: '🏎️', label: 'Racing' },
      { value: '🚓', label: 'Police' },
      { value: '🚑', label: 'Ambulance' },
      { value: '🚒', label: 'Fire Truck' },
      { value: '🚐', label: 'Minibus' },
      { value: '🚚', label: 'Truck' },
      { value: '🚛', label: 'Lorry' },
      { value: '🏍️', label: 'Motorcycle' },
      { value: '🛵', label: 'Scooter' },
      { value: '🚲', label: 'Bicycle' },
      { value: '✈️', label: 'Airplane' },
      { value: '🚁', label: 'Helicopter' },
      { value: '🚀', label: 'Rocket' },
      { value: '🛸', label: 'UFO' },
      { value: '⛵', label: 'Sailboat' },
      { value: '🚤', label: 'Speedboat' },
      { value: '🛳️', label: 'Cruise' },
      { value: '🚂', label: 'Train' },
      { value: '🚄', label: 'Bullet Train' },
    ],
  },
  {
    id: 'animals',
    label: 'Animals',
    icons: [
      { value: '🐕', label: 'Dog' },
      { value: '🐩', label: 'Poodle' },
      { value: '🐈', label: 'Cat' },
      { value: '🐈‍⬛', label: 'Black Cat' },
      { value: '🐦', label: 'Bird' },
      { value: '🐔', label: 'Chicken' },
      { value: '🦆', label: 'Duck' },
      { value: '🦅', label: 'Eagle' },
      { value: '🦉', label: 'Owl' },
      { value: '🦇', label: 'Bat' },
      { value: '🐺', label: 'Wolf' },
      { value: '🦊', label: 'Fox' },
      { value: '🐻', label: 'Bear' },
      { value: '🐼', label: 'Panda' },
      { value: '🐨', label: 'Koala' },
      { value: '🦁', label: 'Lion' },
      { value: '🐯', label: 'Tiger' },
      { value: '🐘', label: 'Elephant' },
      { value: '🦒', label: 'Giraffe' },
      { value: '🦓', label: 'Zebra' },
      { value: '🐴', label: 'Horse' },
      { value: '🦄', label: 'Unicorn' },
      { value: '🐄', label: 'Cow' },
      { value: '🐷', label: 'Pig' },
      { value: '🐑', label: 'Sheep' },
      { value: '🐰', label: 'Rabbit' },
      { value: '🐭', label: 'Mouse' },
      { value: '🐹', label: 'Hamster' },
      { value: '🐟', label: 'Fish' },
      { value: '🐠', label: 'Tropical Fish' },
      { value: '🐡', label: 'Blowfish' },
      { value: '🦈', label: 'Shark' },
      { value: '🐬', label: 'Dolphin' },
      { value: '🐋', label: 'Whale' },
      { value: '🐙', label: 'Octopus' },
      { value: '🦀', label: 'Crab' },
      { value: '🦞', label: 'Lobster' },
      { value: '🦐', label: 'Shrimp' },
      { value: '🐢', label: 'Turtle' },
      { value: '🦎', label: 'Lizard' },
      { value: '🐍', label: 'Snake' },
      { value: '🐲', label: 'Dragon' },
      { value: '🦋', label: 'Butterfly' },
      { value: '🐌', label: 'Snail' },
      { value: '🐛', label: 'Bug' },
      { value: '🐝', label: 'Bee' },
      { value: '🦟', label: 'Mosquito' },
    ],
  },
  {
    id: 'nature',
    label: 'Nature',
    icons: [
      { value: '🌸', label: 'Cherry Blossom' },
      { value: '💮', label: 'Flower' },
      { value: '🌺', label: 'Hibiscus' },
      { value: '🌻', label: 'Sunflower' },
      { value: '🌼', label: 'Blossom' },
      { value: '🌷', label: 'Tulip' },
      { value: '🌹', label: 'Rose' },
      { value: '🥀', label: 'Wilted Flower' },
      { value: '🌱', label: 'Seedling' },
      { value: '🌲', label: 'Pine Tree' },
      { value: '🌳', label: 'Tree' },
      { value: '🌴', label: 'Palm Tree' },
      { value: '🌵', label: 'Cactus' },
      { value: '🌾', label: 'Rice' },
      { value: '🌿', label: 'Herb' },
      { value: '☘️', label: 'Shamrock' },
      { value: '🍀', label: 'Four Leaf' },
      { value: '🍁', label: 'Maple Leaf' },
      { value: '🍂', label: 'Fallen Leaf' },
      { value: '🍃', label: 'Leaves' },
      { value: '☀️', label: 'Sun' },
      { value: '🌙', label: 'Moon' },
      { value: '⭐', label: 'Star' },
      { value: '🌟', label: 'Glowing Star' },
      { value: '☁️', label: 'Cloud' },
      { value: '⛈️', label: 'Storm' },
      { value: '🌈', label: 'Rainbow' },
      { value: '❄️', label: 'Snowflake' },
      { value: '🔥', label: 'Fire' },
      { value: '💧', label: 'Droplet' },
      { value: '🌊', label: 'Wave' },
      { value: '🏔️', label: 'Mountain' },
      { value: '⛰️', label: 'Mountain Snow' },
      { value: '🌋', label: 'Volcano' },
      { value: '🌍', label: 'Earth' },
    ],
  },
];

// Flatten all emoji options for backward compatibility
const ICON_OPTIONS = EMOJI_CATEGORIES.flatMap((cat) => cat.icons);

// Icon type options
const ICON_TYPE_OPTIONS: { value: FeatureIconType; label: string; description: string }[] = [
  { value: 'emoji', label: 'Emoji', description: 'Colorful emoji icons' },
  { value: 'solid', label: 'Solid', description: 'Professional vector icons' },
];

const ALIGNMENT_OPTIONS: { value: FeatureContentAlignment; label: string; icon: typeof AlignLeft }[] = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
];

const ICON_STYLE_OPTIONS: { value: FeatureIconStyle; label: string; description: string }[] = [
  { value: 'gradient', label: 'Gradient', description: 'Colorful gradient background' },
  { value: 'solid', label: 'Solid', description: 'Solid accent color' },
  { value: 'outline', label: 'Outline', description: 'Outlined style' },
  { value: 'minimal', label: 'Minimal', description: 'Clean minimal look' },
];

const GRID_LAYOUT_OPTIONS: { value: FeatureGridLayout; label: string; columns: number }[] = [
  { value: 'grid-2', label: '2 Columns', columns: 2 },
  { value: 'grid-3', label: '3 Columns', columns: 3 },
  { value: 'grid-4', label: '4 Columns', columns: 4 },
];

const CARD_STYLE_OPTIONS: { value: 'elevated' | 'outlined' | 'minimal'; label: string; description: string }[] = [
  { value: 'elevated', label: 'Elevated', description: 'Shadow-based cards' },
  { value: 'outlined', label: 'Outlined', description: 'Border-based cards' },
  { value: 'minimal', label: 'Minimal', description: 'Clean without borders' },
];

const LINK_TYPE_OPTIONS: { value: FeatureLinkType; label: string; icon: typeof Link; description: string }[] = [
  { value: 'url', label: 'URL', icon: ExternalLink, description: 'External or internal link' },
  { value: 'page', label: 'Page & Section', icon: FileText, description: 'Link to a page section' },
  { value: 'form', label: 'Form', icon: MessageSquare, description: 'Scroll to a form' },
];

// Icon size options in pixels (8-60px)
const ICON_SIZE_OPTIONS: number[] = [
  8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60
];

// Solid Icon Picker Component
interface SolidIconPickerProps {
  value: string;
  color: string;
  onChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}

function SolidIconPicker({ value, color, onChange, onColorChange }: SolidIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter icons based on search and category
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
      {/* Trigger Button */}
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

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* Color Picker Section */}
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
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-6 h-6 rounded-full border-2 border-slate-200 cursor-pointer appearance-none bg-transparent"
                  title="Custom color"
                />
              </div>
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

          {/* Category Tabs */}
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

          {/* Icons Grid */}
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

// Emoji Icon Picker Component
interface EmojiIconPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

function EmojiIconPicker({ value, onChange }: EmojiIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('general');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">{value || '✨'}</span>
        </div>
        <span className="flex-1 text-left text-slate-700">
          {value ? (ICON_OPTIONS.find((i) => i.value === value)?.label || value) : 'Select emoji...'}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* Category Tabs */}
          <div className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto">
            {EMOJI_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                  activeCategory === category.id ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="max-h-64 overflow-y-auto p-2">
            <div className="grid grid-cols-8 gap-1">
              {currentCategory.icons.map((iconOption) => {
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
                      "p-2 rounded-lg transition-all text-xl relative",
                      isSelected
                        ? "bg-indigo-100 ring-2 ring-indigo-500"
                        : "hover:bg-slate-100"
                    )}
                    title={iconOption.label}
                  >
                    {iconOption.value}
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
        </div>
      )}
    </div>
  );
}

export function FeaturesEditor({ content, onChange, userId, templateId, websiteId }: FeaturesEditorProps & { websiteId?: string }) {
  const features = content.features || [];
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set([0]));
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number | null>(null);

  // Fetch pages and forms for link options
  const pages = useQuery(api.pages.getPagesByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');
  const forms = useQuery(api.forms.getFormsByWebsite, (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip');

  const updateContent = (updates: Partial<FeaturesSectionContent>) => {
    onChange({ ...content, ...updates });
  };

  const updateFeature = (index: number, updates: Record<string, any>) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], ...updates };
    updateContent({ features: newFeatures });
  };

  const addFeature = () => {
    const newFeature = {
      ...DEFAULT_FEATURE,
      id: `feature-${Date.now()}`,
    };
    const newFeatures = [...features, newFeature];
    updateContent({ features: newFeatures });
    setExpandedFeatures(new Set([...expandedFeatures, features.length]));
  };

  const removeFeature = (index: number) => {
    if (features.length <= 1) return;
    const newFeatures = features.filter((_: any, i: number) => i !== index);
    updateContent({ features: newFeatures });

    const newExpanded = new Set<number>();
    expandedFeatures.forEach(i => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedFeatures(newExpanded);
  };

  const moveFeature = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= features.length) return;
    const newFeatures = [...features];
    const [removed] = newFeatures.splice(fromIndex, 1);
    newFeatures.splice(toIndex, 0, removed);
    updateContent({ features: newFeatures });

    const newExpanded = new Set<number>();
    expandedFeatures.forEach(i => {
      if (i === fromIndex) newExpanded.add(toIndex);
      else if (fromIndex < toIndex && i > fromIndex && i <= toIndex) newExpanded.add(i - 1);
      else if (fromIndex > toIndex && i >= toIndex && i < fromIndex) newExpanded.add(i + 1);
      else newExpanded.add(i);
    });
    setExpandedFeatures(newExpanded);
  };

  const toggleFeature = (index: number) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFeatures(newExpanded);
  };

  const handleSelectImage = (url: string) => {
    if (activeFeatureIndex !== null) {
      updateFeature(activeFeatureIndex, { imageUrl: url });
    }
    setShowMediaLibrary(false);
    setActiveFeatureIndex(null);
  };

  const isModern = templateId === 'features-modern';

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
              <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Our Features"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={100}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
              <textarea
                value={content.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                placeholder="Describe what makes your features special"
                rows={2}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={200}
              />
            </div>
          </div>

          {/* Badge (Modern template) */}
          {isModern && (
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="text-sm font-medium text-slate-900">Show Badge</label>
                  <p className="text-xs text-slate-500">Display a badge above the title</p>
                </div>
                <button
                  onClick={() => updateContent({ showBadge: !content.showBadge })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    (content.showBadge !== false) ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      (content.showBadge !== false) ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {content.showBadge !== false && (
                <input
                  type="text"
                  value={content.badgeText || ''}
                  onChange={(e) => updateContent({ badgeText: e.target.value })}
                  placeholder="Why Choose Us"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={30}
                />
              )}
            </div>
          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content.backgroundColor || '#ffffff'}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.backgroundColor || '#ffffff'}
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
                  value={content.textColor || '#1a1a1a'}
                  onChange={(e) => updateContent({ textColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.textColor || '#1a1a1a'}
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
          </div>

          {/* Grid Layout (Basic template) */}
          {!isModern && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Grid Layout</label>
              <div className="grid grid-cols-3 gap-3">
                {GRID_LAYOUT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateContent({ gridLayout: option.value })}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-center",
                      (content.gridLayout || 'grid-3') === option.value
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Grid3X3 className="h-5 w-5 mx-auto mb-1 text-slate-600" />
                    <div className="text-xs font-medium text-slate-700">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Icon Style */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Icon Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ICON_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateContent({ iconStyle: option.value })}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-center",
                    (content.iconStyle || 'gradient') === option.value
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <Sparkles className="h-5 w-5 mx-auto mb-1 text-slate-600" />
                  <div className="text-xs font-medium text-slate-700">{option.label}</div>
                  <div className="text-[10px] text-slate-500">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Icon Size */}
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium text-slate-900">Icon Size</label>
              <span className="text-sm text-slate-600 ml-auto">{content.iconSize || 40}px</span>
            </div>
            <select
              value={content.iconSize || 40}
              onChange={(e) => updateContent({ iconSize: parseInt(e.target.value) })}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {ICON_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Select icon size in pixels (8-60px)</p>
          </div>

          {/* Card Style (Basic template) */}
          {!isModern && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Card Style</label>
              <div className="grid grid-cols-3 gap-3">
                {CARD_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateContent({ cardStyle: option.value })}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-center",
                      (content.cardStyle || 'elevated') === option.value
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="text-xs font-medium text-slate-700">{option.label}</div>
                    <div className="text-[10px] text-slate-500">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Default Content Alignment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Default Content Alignment</label>
            <div className="grid grid-cols-3 gap-3">
              {ALIGNMENT_OPTIONS.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateContent({ contentAlignment: option.value })}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-center",
                      (content.contentAlignment || 'center') === option.value
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <IconComponent className="h-5 w-5 mx-auto mb-1 text-slate-600" />
                    <div className="text-xs font-medium text-slate-700">{option.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">Individual features can override this setting</p>
          </div>

          {/* Show Card Hover Effect (Basic template) */}
          {!isModern && (
            <div className="flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-slate-200">
              <div>
                <label className="text-sm font-medium text-slate-900">Hover Animation</label>
                <p className="text-xs text-slate-500">Animate cards on hover</p>
              </div>
              <button
                onClick={() => updateContent({ showCardHover: content.showCardHover !== false })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  (content.showCardHover !== false) ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    (content.showCardHover !== false) ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Auto-rotate (Modern template) */}
          {isModern && (
            <>
              <div className="flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-medium text-slate-900">Auto-rotate Features</label>
                  <p className="text-xs text-slate-500">Automatically cycle through features</p>
                </div>
                <button
                  onClick={() => updateContent({ autoRotate: content.autoRotate !== false })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    (content.autoRotate !== false) ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      (content.autoRotate !== false) ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {content.autoRotate !== false && (
                <div className="py-3 px-4 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-slate-900">Rotation Delay</label>
                    <span className="text-sm text-slate-600">{content.rotationDelay || 4}s</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={content.rotationDelay || 4}
                    onChange={(e) => updateContent({ rotationDelay: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>2s</span>
                    <span>10s</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Features List */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Features ({features.length})</h4>
          </div>
          <button
            onClick={addFeature}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Feature
          </button>
        </div>

        <div className="space-y-3">
          {features.map((feature: any, index: number) => (
            <div
              key={feature.id || index}
              className={cn(
                "border rounded-xl transition-all overflow-visible",
                expandedFeatures.has(index)
                  ? "border-indigo-200 bg-white z-50 relative"
                  : "border-slate-200 bg-white"
              )}
            >
              {/* Feature Header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => toggleFeature(index)}
              >
                {/* Drag Handle */}
                <div className="flex flex-col gap-0.5 text-slate-400">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Icon Preview */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: feature.iconType === 'solid'
                      ? (feature.solidIconColor || '#6366f1') + '20'
                      : undefined,
                    background: feature.iconType !== 'solid'
                      ? 'linear-gradient(to bottom right, #6366f1, #9333ea)'
                      : undefined,
                  }}
                >
                  {feature.iconType === 'solid' ? (
                    (() => {
                      const IconComponent = getSolidIconComponent(feature.solidIcon || 'sparkles');
                      return IconComponent ? (
                        <IconComponent
                          className="w-5 h-5"
                          style={{ color: feature.solidIconColor || '#6366f1' }}
                        />
                      ) : (
                        <Sparkles className="w-5 h-5" style={{ color: feature.solidIconColor || '#6366f1' }} />
                      );
                    })()
                  ) : (
                    <span className="text-xl">{feature.icon || '✨'}</span>
                  )}
                </div>

                {/* Feature Title */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {feature.title || 'Untitled Feature'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {feature.description || 'No description'}
                  </p>
                </div>

                {/* Move & Delete Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveFeature(index, index - 1);
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
                      moveFeature(index, index + 1);
                    }}
                    disabled={index === features.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFeature(index);
                    }}
                    disabled={features.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Delete feature"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="ml-1">
                    {expandedFeatures.has(index) ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Feature Content (Expanded) */}
              {expandedFeatures.has(index) && (
                <div className="border-t border-slate-100 p-4 space-y-4 relative z-50 bg-white">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={feature.title || ''}
                      onChange={(e) => updateFeature(index, { title: e.target.value })}
                      placeholder="Feature title"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      maxLength={60}
                    />
                  </div>

                  {/* Icon Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Icon Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {ICON_TYPE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateFeature(index, {
                            iconType: option.value,
                            // Set defaults when switching types
                            ...(option.value === 'solid' && !feature.solidIcon ? { solidIcon: 'sparkles', solidIconColor: '#6366f1' } : {}),
                            ...(option.value === 'emoji' && !feature.icon ? { icon: '✨' } : {}),
                          })}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all text-left",
                            (feature.iconType || 'emoji') === option.value
                              ? "border-indigo-600 bg-indigo-50"
                              : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {option.value === 'emoji' ? (
                              <span className="text-lg">😀</span>
                            ) : (
                              <Sparkles className="w-5 h-5 text-indigo-600" />
                            )}
                            <span className="text-sm font-medium text-slate-700">{option.label}</span>
                          </div>
                          <p className="text-xs text-slate-500">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Picker - Emoji or Solid based on type */}
                  {(feature.iconType || 'emoji') === 'emoji' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Emoji Icon</label>
                      <EmojiIconPicker
                        value={feature.icon || '✨'}
                        onChange={(emoji) => updateFeature(index, { icon: emoji })}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Solid Icon</label>
                      <SolidIconPicker
                        value={feature.solidIcon || 'sparkles'}
                        color={feature.solidIconColor || '#6366f1'}
                        onChange={(icon) => updateFeature(index, { solidIcon: icon })}
                        onColorChange={(color) => updateFeature(index, { solidIconColor: color })}
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={feature.description || ''}
                      onChange={(e) => updateFeature(index, { description: e.target.value })}
                      placeholder="Describe this feature..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      maxLength={300}
                    />
                    <p className="text-xs text-slate-500 mt-1">{(feature.description || '').length}/300</p>
                  </div>

                  {/* Content Alignment */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Content Alignment</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ALIGNMENT_OPTIONS.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateFeature(index, { contentAlignment: option.value })}
                            className={cn(
                              "p-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2",
                              (feature.contentAlignment || content.contentAlignment || 'center') === option.value
                                ? "border-indigo-600 bg-indigo-50"
                                : "border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span className="text-xs font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Align icon, title, and description</p>
                  </div>

                  {/* Image (Optional) */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Feature Image (Optional)</label>
                    {feature.imageUrl ? (
                      <div className="relative group">
                        <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                          <img
                            src={feature.imageUrl}
                            alt="Feature preview"
                            className="h-16 w-24 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">Feature Image</p>
                            <p className="text-xs text-slate-500 truncate">{feature.imageUrl}</p>
                          </div>
                          <button
                            onClick={() => updateFeature(index, { imageUrl: '' })}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setActiveFeatureIndex(index);
                            setShowMediaLibrary(true);
                          }}
                          className="absolute inset-0 bg-black/0 hover:bg-black/5 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <span className="px-3 py-1.5 bg-white text-sm font-medium text-slate-700 rounded-lg shadow-sm border">
                            Change Image
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userId && (
                          <button
                            onClick={() => {
                              setActiveFeatureIndex(index);
                              setShowMediaLibrary(true);
                            }}
                            className="w-full px-4 py-5 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-2"
                          >
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">
                              Browse Media Library
                            </span>
                          </button>
                        )}
                        <input
                          type="text"
                          value={feature.imageUrl || ''}
                          onChange={(e) => updateFeature(index, { imageUrl: e.target.value })}
                          placeholder="Or paste image URL..."
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Link Target Options */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Link Target (Optional)</label>

                    {/* Link Type Selector */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {LINK_TYPE_OPTIONS.map((option) => {
                        const IconComponent = option.icon;
                        const currentLinkType = feature.link?.type || 'url';
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateFeature(index, {
                              link: {
                                ...feature.link,
                                type: option.value,
                                // Reset type-specific fields when changing type
                                ...(option.value === 'url' ? { url: feature.link?.url || '', pageId: undefined, sectionId: undefined, formId: undefined } : {}),
                                ...(option.value === 'page' ? { pageId: feature.link?.pageId || '', sectionId: feature.link?.sectionId, url: undefined, formId: undefined } : {}),
                                ...(option.value === 'form' ? { formId: feature.link?.formId || '', url: undefined, pageId: undefined, sectionId: undefined } : {}),
                              }
                            })}
                            className={cn(
                              "p-2.5 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                              currentLinkType === option.value
                                ? "border-indigo-600 bg-indigo-50"
                                : "border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <IconComponent className="w-4 h-4 text-slate-600" />
                            <span className="text-xs font-medium text-slate-700">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* URL Input */}
                    {(feature.link?.type || 'url') === 'url' && (
                      <div className="relative">
                        <input
                          type="text"
                          value={feature.link?.url || ''}
                          onChange={(e) => updateFeature(index, { link: { ...feature.link, type: 'url', url: e.target.value } })}
                          placeholder="https://example.com"
                          className="w-full pl-3 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {/* Page & Section Selector */}
                    {(feature.link?.type || 'url') === 'page' && (
                      <div className="space-y-2">
                        <select
                          value={feature.link?.pageId || ''}
                          onChange={(e) => updateFeature(index, { link: { ...feature.link, type: 'page', pageId: e.target.value, sectionId: e.target.value ? feature.link?.sectionId : undefined } })}
                          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="">Select a page...</option>
                          {pages?.map((page: any) => (
                            <option key={page._id} value={page._id}>
                              {page.title || page.slug || 'Untitled Page'}
                            </option>
                          ))}
                        </select>

                        {feature.link?.pageId && (
                          <select
                            value={feature.link?.sectionId || ''}
                            onChange={(e) => updateFeature(index, { link: { ...feature.link, type: 'page', sectionId: e.target.value || undefined } })}
                            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            <option value="">Link to top of page</option>
                            {(() => {
                              const selectedPage = pages?.find((p: any) => p._id === feature.link?.pageId);
                              const pageContent = selectedPage?.content ? JSON.parse(selectedPage.content) : null;
                              const pageSections = pageContent?.sections || [];
                              return pageSections.map((section: any) => (
                                <option key={section.id} value={section.id}>
                                  {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
                                </option>
                              ));
                            })()}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Form Selector */}
                    {(feature.link?.type || 'url') === 'form' && (
                      <select
                        value={feature.link?.formId || ''}
                        onChange={(e) => updateFeature(index, { link: { ...feature.link, type: 'form', formId: e.target.value } })}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">Select a form...</option>
                        {forms?.map((form: any) => (
                          <option key={form._id} value={form._id}>
                            {form.name || 'Untitled Form'}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Clear link button */}
                    {(feature.link?.url || feature.link?.pageId || feature.link?.formId) && (
                      <button
                        onClick={() => updateFeature(index, { link: { type: 'url', url: '' } })}
                        className="mt-2 text-xs text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear link
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Media Library Modal */}
      {userId && (
        <MediaLibraryModal
          userId={userId}
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelectImage={handleSelectImage}
          contextName="Feature Image"
          allowMultiSelect={false}
        />
      )}
    </div>
  );
}
