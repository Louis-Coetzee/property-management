'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus, Image as ImageIcon, Settings, Type, Palette, Move, GripVertical, ArrowLeft, ArrowRight, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogoTickerSectionContent, LogoItem, LogoTickerSpeed } from '@/types/page-builder';
import MediaLibraryModal from '@/components/media-library-modal';

interface LogoTickerEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
  userId?: string;
  templateId: string;
}

const DEFAULT_LOGO: LogoItem = {
  id: `logo-${Date.now()}`,
  name: 'Partner Logo',
  imageUrl: '',
};

const SPEED_OPTIONS: { value: LogoTickerSpeed; label: string; description: string }[] = [
  { value: 'slow', label: 'Slow', description: '40s' },
  { value: 'normal', label: 'Normal', description: '25s' },
  { value: 'fast', label: 'Fast', description: '15s' },
  { value: 'very-fast', label: 'Very Fast', description: '8s' },
];

export function LogoTickerEditor({ content, onChange, userId, templateId }: LogoTickerEditorProps) {
  const logos: LogoItem[] = content.logos?.length ? content.logos : [DEFAULT_LOGO];
  const [expandedLogos, setExpandedLogos] = useState<Set<number>>(new Set([0]));
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [activeLogoIndex, setActiveLogoIndex] = useState<number | null>(null);

  const updateContent = (updates: Partial<LogoTickerSectionContent>) => {
    onChange({ ...content, ...updates });
  };

  const updateLogo = (index: number, updates: Partial<LogoItem>) => {
    const newLogos = [...logos];
    newLogos[index] = { ...newLogos[index], ...updates };
    updateContent({ logos: newLogos });
  };

  const addLogo = () => {
    const newLogo: LogoItem = {
      ...DEFAULT_LOGO,
      id: `logo-${Date.now()}`,
    };
    const newLogos = [...logos, newLogo];
    updateContent({ logos: newLogos });
    setExpandedLogos(new Set([...expandedLogos, logos.length]));
  };

  const removeLogo = (index: number) => {
    if (logos.length <= 1) return;
    const newLogos = logos.filter((_, i) => i !== index);
    updateContent({ logos: newLogos });

    const newExpanded = new Set<number>();
    expandedLogos.forEach(i => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedLogos(newExpanded);
  };

  const moveLogo = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= logos.length) return;
    const newLogos = [...logos];
    const [removed] = newLogos.splice(fromIndex, 1);
    newLogos.splice(toIndex, 0, removed);
    updateContent({ logos: newLogos });

    const newExpanded = new Set<number>();
    expandedLogos.forEach(i => {
      if (i === fromIndex) newExpanded.add(toIndex);
      else if (fromIndex < toIndex && i > fromIndex && i <= toIndex) newExpanded.add(i - 1);
      else if (fromIndex > toIndex && i >= toIndex && i < fromIndex) newExpanded.add(i + 1);
      else newExpanded.add(i);
    });
    setExpandedLogos(newExpanded);
  };

  const toggleLogo = (index: number) => {
    const newExpanded = new Set(expandedLogos);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogos(newExpanded);
  };

  const handleSelectImage = (url: string) => {
    if (activeLogoIndex !== null) {
      updateLogo(activeLogoIndex, { imageUrl: url });
    }
    setShowMediaLibrary(false);
    setActiveLogoIndex(null);
  };

  const isScrollTemplate = templateId === 'logo-ticker-scroll';

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Type className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Section Title</h4>
        </div>
        <input
          type="text"
          value={content.title || ''}
          onChange={(e) => updateContent({ title: e.target.value })}
          placeholder="Trusted by Leading Brands"
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          maxLength={60}
        />
      </div>

      {/* Animation Settings (Scroll Template Only) */}
      {isScrollTemplate && (
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Settings className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Animation Settings</h4>
          </div>

          <div className="space-y-4">
            {/* Direction */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Scroll Direction</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateContent({ direction: 'left' })}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                    (content.direction || 'left') === 'left'
                      ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                      : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Left
                </button>
                <button
                  onClick={() => updateContent({ direction: 'right' })}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                    content.direction === 'right'
                      ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                      : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <ArrowRight className="h-4 w-4" />
                  Right
                </button>
              </div>
            </div>

            {/* Speed */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Scroll Speed</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SPEED_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateContent({ speed: option.value })}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-lg transition-all text-center",
                      (content.speed || 'normal') === option.value
                        ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                        : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div>{option.label}</div>
                    <div className="text-xs text-slate-500">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Spacing */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Logo Spacing: {content.logoSpacing || 48}px
              </label>
              <input
                type="range"
                min="16"
                max="100"
                value={content.logoSpacing || 48}
                onChange={(e) => updateContent({ logoSpacing: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Tight</span>
                <span>Wide</span>
              </div>
            </div>

            {/* Logo Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo Width: {content.logoWidth || 120}px
                </label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={content.logoWidth || 120}
                  onChange={(e) => updateContent({ logoWidth: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo Height: {content.logoHeight || 60}px
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={content.logoHeight || 60}
                  onChange={(e) => updateContent({ logoHeight: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Pause on Hover */}
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
              <div>
                <label className="text-sm font-medium text-slate-900">Pause on Hover</label>
                <p className="text-xs text-slate-500">Stop animation when mouse hovers</p>
              </div>
              <button
                onClick={() => updateContent({ pauseOnHover: content.pauseOnHover !== false })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  (content.pauseOnHover !== false) ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    (content.pauseOnHover !== false) ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styling Options */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Palette className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Styling</h4>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content.backgroundColor || '#f8fafc'}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.backgroundColor || '#f8fafc'}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Logo Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content.logoBackground || '#ffffff'}
                  onChange={(e) => updateContent({ logoBackground: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.logoBackground || '#ffffff'}
                  onChange={(e) => updateContent({ logoBackground: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo Border Radius: {content.logoBorderRadius || 12}px
            </label>
            <input
              type="range"
              min="0"
              max="32"
              value={content.logoBorderRadius || 12}
              onChange={(e) => updateContent({ logoBorderRadius: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Square</span>
              <span>Rounded</span>
            </div>
          </div>

          {/* Effects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
              <div>
                <label className="text-sm font-medium text-slate-900">Grayscale</label>
                <p className="text-xs text-slate-500">Make logos black & white</p>
              </div>
              <button
                onClick={() => updateContent({ grayscale: content.grayscale === true ? false : true })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  content.grayscale === true ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    content.grayscale === true ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
              <div>
                <label className="text-sm font-medium text-slate-900">Color on Hover</label>
                <p className="text-xs text-slate-500">Show color when hovering (only works with Grayscale ON)</p>
              </div>
              <button
                onClick={() => updateContent({ grayscaleOnHover: content.grayscaleOnHover === true ? false : true })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  content.grayscaleOnHover === true ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    content.grayscaleOnHover === true ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo Opacity: {Math.round((content.opacity || 0.8) * 100)}%
            </label>
            <input
              type="range"
              min="30"
              max="100"
              value={Math.round((content.opacity || 0.8) * 100)}
              onChange={(e) => updateContent({ opacity: parseInt(e.target.value) / 100 })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Logos List */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Logos ({logos.length})</h4>
          </div>
          <button
            onClick={addLogo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Logo
          </button>
        </div>

        <div className="space-y-3">
          {logos.map((logo, index) => (
            <div
              key={logo.id || index}
              className={cn(
                "border rounded-xl transition-all",
                expandedLogos.has(index)
                  ? "border-indigo-200 bg-white"
                  : "border-slate-200 bg-white"
              )}
            >
              {/* Logo Header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => toggleLogo(index)}
              >
                <div className="flex flex-col gap-0.5 text-slate-400">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Logo Preview */}
                <div
                  className="w-14 h-10 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center bg-slate-50"
                >
                  {logo.imageUrl ? (
                    <img
                      src={logo.imageUrl}
                      alt={logo.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-slate-300" />
                  )}
                </div>

                {/* Logo Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {logo.name || 'Untitled Logo'}
                  </p>
                </div>

                {/* Move & Delete Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLogo(index, index - 1);
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
                      moveLogo(index, index + 1);
                    }}
                    disabled={index === logos.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLogo(index);
                    }}
                    disabled={logos.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Delete logo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="ml-1">
                    {expandedLogos.has(index) ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Logo Content (Expanded) */}
              {expandedLogos.has(index) && (
                <div className="border-t border-slate-100 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={logo.name || ''}
                        onChange={(e) => updateLogo(index, { name: e.target.value })}
                        placeholder="Company Name"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Link (Optional)</label>
                      <input
                        type="text"
                        value={logo.link || ''}
                        onChange={(e) => updateLogo(index, { link: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Logo Image */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Logo Image</label>
                    {logo.imageUrl ? (
                      <div className="relative group">
                        <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                          <img
                            src={logo.imageUrl}
                            alt={logo.name}
                            className="h-16 w-24 object-contain rounded-lg bg-white p-2"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">Logo Image</p>
                            <p className="text-xs text-slate-500 truncate">{logo.imageUrl}</p>
                          </div>
                          <button
                            onClick={() => updateLogo(index, { imageUrl: '' })}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setActiveLogoIndex(index);
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
                              setActiveLogoIndex(index);
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
                          value={logo.imageUrl || ''}
                          onChange={(e) => updateLogo(index, { imageUrl: e.target.value })}
                          placeholder="Or paste image URL..."
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
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

      {/* Media Library Modal */}
      {userId && (
        <MediaLibraryModal
          userId={userId}
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelectImage={handleSelectImage}
          contextName="Logo Image"
          allowMultiSelect={false}
        />
      )}
    </div>
  );
}
