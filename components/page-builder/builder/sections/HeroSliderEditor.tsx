'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Trash2, Plus, Play, Timer, Navigation, Circle, Image as ImageIcon, Settings, Type, Link2, Palette, Move, GripVertical, ExternalLink, MessageSquare, Hash, Mouse, Layers, Sparkles, Maximize, RotateCw, Grid3X3, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeroSlide, HeroTransitionEffect } from '@/types/page-builder';
import MediaLibraryModal from '@/components/media-library-modal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface HeroSliderEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
  userId?: string;
  websiteId?: string;
}

const DEFAULT_SLIDE: HeroSlide = {
  headline: 'Welcome to Our Website',
  subheadline: 'Create beautiful pages with our easy-to-use page builder',
  ctaText: 'Get Started',
  ctaLink: '#',
  ctaTarget: 'url',
  backgroundColor: '#6366f1',
  backgroundType: 'color',
  textColor: '#ffffff',
};

// Transition effect options
const TRANSITION_OPTIONS: { value: HeroTransitionEffect; label: string; description: string; icon: typeof Layers }[] = [
  { value: 'fade', label: 'Fade', description: 'Smooth fade in/out', icon: Layers },
  { value: 'slide', label: 'Slide', description: 'Horizontal slide', icon: ChevronRight },
  { value: 'zoom', label: 'Zoom', description: 'Scale zoom effect', icon: Maximize },
  { value: 'flip', label: 'Flip', description: '3D flip rotation', icon: RotateCw },
  { value: 'puzzle', label: 'Puzzle', description: 'Animated puzzle pieces', icon: Grid3X3 },
];

export function HeroSliderEditor({ content, onChange, userId, websiteId }: HeroSliderEditorProps) {
  const slides: HeroSlide[] = content.slides?.length ? content.slides : [DEFAULT_SLIDE];
  const [expandedSlides, setExpandedSlides] = useState<Set<number>>(new Set([0]));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  const [showFormDropdown, setShowFormDropdown] = useState<number | null>(null);

  // Fetch forms for CTA target selection
  const forms = useQuery(
    api.forms.getFormsByWebsite,
    (websiteId && userId) ? { userId: userId as any, websiteId: websiteId as any } : 'skip'
  );

  const updateContent = (updates: Partial<typeof content>) => {
    onChange({ ...content, ...updates });
  };

  const updateSlide = (index: number, updates: Partial<HeroSlide>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    updateContent({ slides: newSlides });
  };

  const addSlide = () => {
    const newSlide: HeroSlide = {
      ...DEFAULT_SLIDE,
      backgroundColor: getRandomColor(),
    };
    const newSlides = [...slides, newSlide];
    updateContent({ slides: newSlides });
    setExpandedSlides(new Set([...expandedSlides, slides.length]));
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return; // Keep at least one slide
    const newSlides = slides.filter((_, i) => i !== index);
    updateContent({ slides: newSlides });

    // Update expanded slides
    const newExpanded = new Set<number>();
    expandedSlides.forEach(i => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedSlides(newExpanded);
  };

  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= slides.length) return;
    const newSlides = [...slides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);
    updateContent({ slides: newSlides });

    // Update expanded slides
    const newExpanded = new Set<number>();
    expandedSlides.forEach(i => {
      if (i === fromIndex) newExpanded.add(toIndex);
      else if (fromIndex < toIndex && i > fromIndex && i <= toIndex) newExpanded.add(i - 1);
      else if (fromIndex > toIndex && i >= toIndex && i < fromIndex) newExpanded.add(i + 1);
      else newExpanded.add(i);
    });
    setExpandedSlides(newExpanded);
  };

  const toggleSlide = (index: number) => {
    const newExpanded = new Set(expandedSlides);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSlides(newExpanded);
  };

  const handleSelectImage = (url: string) => {
    if (activeSlideIndex !== null) {
      if (activeSlideIndex === -1) {
        // Editing single hero background (slider disabled)
        updateContent({
          backgroundImage: url,
          backgroundType: 'image',
        });
      } else {
        // Editing a slide
        updateSlide(activeSlideIndex, {
          backgroundImage: url,
          backgroundType: 'image',
        });
      }
    }
    setShowMediaLibrary(false);
    setActiveSlideIndex(null);
  };

  const getRandomColor = () => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="space-y-6">
      {/* Slider Toggle */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-5 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              {(content.sliderEnabled !== false) ? (
                <ToggleRight className="h-5 w-5 text-indigo-600" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Slider Mode</h4>
              <p className="text-xs text-slate-500">
                {(content.sliderEnabled !== false)
                  ? 'Multiple slides with transitions'
                  : 'Single static hero section'}
              </p>
            </div>
          </div>
          <button
            onClick={() => updateContent({ sliderEnabled: content.sliderEnabled === false ? true : false })}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              (content.sliderEnabled !== false) ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                (content.sliderEnabled !== false) ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Slider Settings - Only show when slider is enabled */}
      {(content.sliderEnabled !== false) && (
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Settings className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Slider Settings</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Autoplay Toggle */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-slate-500" />
              <div>
                <label className="text-sm font-medium text-slate-900">Auto-play</label>
                <p className="text-xs text-slate-500">Automatically cycle slides</p>
              </div>
            </div>
            <button
              onClick={() => updateContent({ autoplay: !content.autoplay })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                (content.autoplay !== false) ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  (content.autoplay !== false) ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Autoplay Delay */}
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium text-slate-900">Slide Duration</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="2"
                max="15"
                value={content.autoplayDelay || 5}
                onChange={(e) => updateContent({ autoplayDelay: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-sm font-medium text-slate-700 w-12 text-right">
                {content.autoplayDelay || 5}s
              </span>
            </div>
          </div>

          {/* Transition Effect */}
          <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium text-slate-900">Transition Effect</label>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {TRANSITION_OPTIONS.map((option) => {
                const IconComponent = option.icon;
                const isSelected = (content.transitionEffect || 'fade') === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateContent({ transitionEffect: option.value })}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-center",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <IconComponent className={cn("h-5 w-5 mx-auto mb-1", isSelected ? "text-indigo-600" : "text-slate-500")} />
                    <div className="text-xs font-medium text-slate-700">{option.label}</div>
                    <div className="text-[10px] text-slate-500 hidden sm:block">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Show Arrows */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-slate-500" />
              <div>
                <label className="text-sm font-medium text-slate-900">Show Arrows</label>
                <p className="text-xs text-slate-500">Navigation arrows</p>
              </div>
            </div>
            <button
              onClick={() => updateContent({ showArrows: content.showArrows === false })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                (content.showArrows !== false) ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  (content.showArrows !== false) ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Show Dots */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-slate-500" />
              <div>
                <label className="text-sm font-medium text-slate-900">Show Dots</label>
                <p className="text-xs text-slate-500">Slide indicators</p>
              </div>
            </div>
            <button
              onClick={() => updateContent({ showDots: content.showDots === false })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                (content.showDots !== false) ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  (content.showDots !== false) ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Show Slide Numbers */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-slate-500" />
              <div>
                <label className="text-sm font-medium text-slate-900">Slide Numbers</label>
                <p className="text-xs text-slate-500">Show 1/3, 2/3, etc.</p>
              </div>
            </div>
            <button
              onClick={() => updateContent({ showSlideNumbers: content.showSlideNumbers === false })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                (content.showSlideNumbers !== false) ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  (content.showSlideNumbers !== false) ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Show Scroll Indicator */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Mouse className="h-4 w-4 text-slate-500" />
              <div>
                <label className="text-sm font-medium text-slate-900">Scroll Indicator</label>
                <p className="text-xs text-slate-500">Bouncing scroll icon</p>
              </div>
            </div>
            <button
              onClick={() => updateContent({ showScrollIndicator: content.showScrollIndicator === false })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                (content.showScrollIndicator !== false) ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  (content.showScrollIndicator !== false) ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Slides List - Only show when slider is enabled */}
      {(content.sliderEnabled !== false) && (
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Slides ({slides.length})</h4>
          </div>
          <button
            onClick={addSlide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Slide
          </button>
        </div>

        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={cn(
                "border rounded-xl transition-all",
                expandedSlides.has(index)
                  ? "border-indigo-200 bg-white"
                  : "border-slate-200 bg-white"
              )}
            >
              {/* Slide Header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => toggleSlide(index)}
              >
                {/* Drag Handle */}
                <div className="flex flex-col gap-0.5 text-slate-400">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Slide Preview */}
                <div
                  className="w-12 h-8 rounded-md flex-shrink-0 overflow-hidden"
                  style={{
                    backgroundColor: slide.backgroundType === 'image' ? '#1a1a1a' : slide.backgroundColor,
                  }}
                >
                  {slide.backgroundType === 'image' && slide.backgroundImage && (
                    <img
                      src={slide.backgroundImage}
                      alt=""
                      className="w-full h-full object-cover opacity-70"
                    />
                  )}
                </div>

                {/* Slide Title */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    Slide {index + 1}: {slide.headline || 'Untitled'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {slide.backgroundType === 'image' ? 'Background Image' : slide.backgroundColor}
                  </p>
                </div>

                {/* Move & Delete Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSlide(index, index - 1);
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
                      moveSlide(index, index + 1);
                    }}
                    disabled={index === slides.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlide(index);
                    }}
                    disabled={slides.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Delete slide"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="ml-1">
                    {expandedSlides.has(index) ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Slide Content (Expanded) */}
              {expandedSlides.has(index) && (
                <div className="border-t border-slate-100 p-4 space-y-4">
                  {/* Content Section */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Headline
                    </label>
                    <input
                      type="text"
                      value={slide.headline || ''}
                      onChange={(e) => updateSlide(index, { headline: e.target.value })}
                      placeholder="Enter headline (optional)"
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      maxLength={100}
                    />
                  </div>

                  {/* Headline Styling */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Font Family</label>
                      <select
                        value={slide.headlineFontFamily || 'default'}
                        onChange={(e) => updateSlide(index, { headlineFontFamily: e.target.value as any })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="default">Default</option>
                        <option value="Inter">Inter</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Font Size</label>
                      <select
                        value={slide.headlineFontSize || ''}
                        onChange={(e) => updateSlide(index, { headlineFontSize: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="">Default</option>
                        <option value="1.5rem">Small (1.5rem)</option>
                        <option value="2rem">Medium (2rem)</option>
                        <option value="2.5rem">Large (2.5rem)</option>
                        <option value="3rem">XL (3rem)</option>
                        <option value="3.5rem">2XL (3.5rem)</option>
                        <option value="4rem">3XL (4rem)</option>
                        <option value="4.5rem">4XL (4.5rem)</option>
                        <option value="5rem">5XL (5rem)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subheadline</label>
                    <textarea
                      value={slide.subheadline || ''}
                      onChange={(e) => updateSlide(index, { subheadline: e.target.value })}
                      placeholder="Enter subheadline (optional)"
                      rows={2}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      maxLength={700}
                    />
                  </div>

                  {/* Subheadline Styling */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Font Family</label>
                      <select
                        value={slide.subheadlineFontFamily || 'default'}
                        onChange={(e) => updateSlide(index, { subheadlineFontFamily: e.target.value as any })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="default">Default</option>
                        <option value="Inter">Inter</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Font Size</label>
                      <select
                        value={slide.subheadlineFontSize || ''}
                        onChange={(e) => updateSlide(index, { subheadlineFontSize: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="">Default</option>
                        <option value="0.875rem">Small (0.875rem)</option>
                        <option value="1rem">Base (1rem)</option>
                        <option value="1.125rem">Medium (1.125rem)</option>
                        <option value="1.25rem">Large (1.25rem)</option>
                        <option value="1.5rem">XL (1.5rem)</option>
                        <option value="1.75rem">2XL (1.75rem)</option>
                        <option value="2rem">3XL (2rem)</option>
                      </select>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="bg-slate-50 rounded-xl p-3 -mx-1">
                    <label className="block text-sm font-medium text-slate-700 mb-3">Call-to-Action</label>

                    {/* CTA Target Type */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => updateSlide(index, { ctaTarget: 'url' })}
                        className={cn(
                          "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                          (slide.ctaTarget || 'url') === 'url'
                            ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                            : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        URL
                      </button>
                      <button
                        onClick={() => updateSlide(index, { ctaTarget: 'form' })}
                        className={cn(
                          "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                          slide.ctaTarget === 'form'
                            ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                            : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Form
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">CTA Text</label>
                        <input
                          type="text"
                          value={slide.ctaText || ''}
                          onChange={(e) => updateSlide(index, { ctaText: e.target.value })}
                          placeholder="Get Started"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          maxLength={30}
                        />
                      </div>

                      {/* URL Input (for URL target) */}
                      {(slide.ctaTarget || 'url') === 'url' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">CTA Link</label>
                          <input
                            type="text"
                            value={slide.ctaLink || ''}
                            onChange={(e) => updateSlide(index, { ctaLink: e.target.value })}
                            placeholder="#"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}

                      {/* Form Selection (for Form target) */}
                      {slide.ctaTarget === 'form' && (
                        <div className="relative">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Select Form</label>
                          <button
                            onClick={() => setShowFormDropdown(showFormDropdown === index ? null : index)}
                            className="w-full px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
                          >
                            <span className={cn(!slide.ctaFormId && 'text-slate-400')}>
                              {slide.ctaFormId ? forms?.find(f => f._id === slide.ctaFormId)?.name || 'Select a form' : 'Select a form'}
                            </span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </button>

                          {/* Form Dropdown */}
                          {showFormDropdown === index && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {forms && forms.length > 0 ? (
                                forms.map((form) => (
                                  <button
                                    key={form._id}
                                    onClick={() => {
                                      updateSlide(index, { ctaFormId: form._id });
                                      setShowFormDropdown(null);
                                    }}
                                    className={cn(
                                      'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors flex items-center justify-between',
                                      slide.ctaFormId === form._id && 'bg-slate-100 font-medium'
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
                  </div>

                  {/* Background Section */}
                  <div className="border-t border-slate-100 pt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-3">Background</label>

                    {/* Background Type Toggle */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => updateSlide(index, { backgroundType: 'color', backgroundImage: '' })}
                        className={cn(
                          "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                          slide.backgroundType !== 'image'
                            ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                            : "bg-slate-100 text-slate-600 border-2 border-transparent hover:border-slate-200"
                        )}
                      >
                        Solid Color
                      </button>
                      <button
                        onClick={() => updateSlide(index, { backgroundType: 'image' })}
                        className={cn(
                          "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                          slide.backgroundType === 'image'
                            ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                            : "bg-slate-100 text-slate-600 border-2 border-transparent hover:border-slate-200"
                        )}
                      >
                        Background Image
                      </button>
                    </div>

                    {/* Color Picker */}
                    {slide.backgroundType !== 'image' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={slide.backgroundColor || '#6366f1'}
                          onChange={(e) => updateSlide(index, { backgroundColor: e.target.value })}
                          className="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={slide.backgroundColor || '#6366f1'}
                          onChange={(e) => updateSlide(index, { backgroundColor: e.target.value })}
                          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          placeholder="#6366f1"
                        />
                      </div>
                    )}

                    {/* Image Picker */}
                    {slide.backgroundType === 'image' && (
                      <div className="space-y-3">
                        {slide.backgroundImage ? (
                          <div className="relative group">
                            <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                              <img
                                src={slide.backgroundImage}
                                alt="Background preview"
                                className="h-20 w-28 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="112" height="80" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2" /%3E%3Ccircle cx="8.5" cy="8.5" r="1.5" /%3E%3Cpolyline points="21 15 16 10 5 21" /%3E%3C/svg%3E';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900">Background Image</p>
                                <p className="text-xs text-slate-500 truncate">{slide.backgroundImage}</p>
                              </div>
                              <button
                                onClick={() => updateSlide(index, { backgroundImage: '', backgroundType: 'color' })}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove image"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                setActiveSlideIndex(index);
                                setShowMediaLibrary(true);
                              }}
                              className="absolute inset-0 bg-black/0 hover:bg-black/5 rounded-xl transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <span className="px-3 py-1.5 bg-white text-sm font-medium text-slate-700 rounded-lg shadow-sm border">
                                Change Image
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Media Library Button */}
                            {userId && (
                              <button
                                onClick={() => {
                                  setActiveSlideIndex(index);
                                  setShowMediaLibrary(true);
                                }}
                                className="w-full px-4 py-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-2"
                              >
                                <ImageIcon className="h-6 w-6 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">
                                  Browse Media Library
                                </span>
                                <span className="text-xs text-slate-500">
                                  Select an uploaded image
                                </span>
                              </button>
                            )}

                            {/* URL Input */}
                            <div className="relative">
                              <input
                                type="text"
                                value={slide.backgroundImage || ''}
                                onChange={(e) => updateSlide(index, { backgroundImage: e.target.value })}
                                placeholder="Or paste image URL..."
                                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Text Color */}
                  <div className="border-t border-slate-100 pt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={slide.textColor || '#ffffff'}
                        onChange={(e) => updateSlide(index, { textColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={slide.textColor || '#ffffff'}
                        onChange={(e) => updateSlide(index, { textColor: e.target.value })}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Single Hero Content - Only show when slider is disabled */}
      {content.sliderEnabled === false && (
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Type className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Hero Content</h4>
        </div>

        <div className="space-y-4">
          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Headline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={content.headline || ''}
              onChange={(e) => updateContent({ headline: e.target.value })}
              placeholder="Enter headline"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={100}
            />
          </div>

          {/* Subheadline */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subheadline</label>
            <textarea
              value={content.subheadline || ''}
              onChange={(e) => updateContent({ subheadline: e.target.value })}
              placeholder="Enter subheadline"
              rows={2}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              maxLength={700}
            />
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-3">Call-to-Action</label>

            {/* CTA Target Type */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => updateContent({ ctaTarget: 'url' })}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                  (content.ctaTarget || 'url') === 'url'
                    ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                    : "bg-slate-50 text-slate-600 border-2 border-slate-200 hover:border-slate-300"
                )}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                URL
              </button>
              <button
                onClick={() => updateContent({ ctaTarget: 'form' })}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                  content.ctaTarget === 'form'
                    ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                    : "bg-slate-50 text-slate-600 border-2 border-slate-200 hover:border-slate-300"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Form
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">CTA Text</label>
                <input
                  type="text"
                  value={content.ctaText || ''}
                  onChange={(e) => updateContent({ ctaText: e.target.value })}
                  placeholder="Get Started"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={30}
                />
              </div>

              {/* URL Input (for URL target) */}
              {(content.ctaTarget || 'url') === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">CTA Link</label>
                  <input
                    type="text"
                    value={content.ctaLink || ''}
                    onChange={(e) => updateContent({ ctaLink: e.target.value })}
                    placeholder="#"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Form Selection (for Form target) */}
              {content.ctaTarget === 'form' && (
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Form</label>
                  <button
                    onClick={() => setShowFormDropdown(showFormDropdown === 999 ? null : 999)}
                    className="w-full px-3 py-2 text-sm text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
                  >
                    <span className={cn(!content.ctaFormId && 'text-slate-400')}>
                      {content.ctaFormId ? forms?.find(f => f._id === content.ctaFormId)?.name || 'Select a form' : 'Select a form'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  {/* Form Dropdown */}
                  {showFormDropdown === 999 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {forms && forms.length > 0 ? (
                        forms.map((form) => (
                          <button
                            key={form._id}
                            onClick={() => {
                              updateContent({ ctaFormId: form._id });
                              setShowFormDropdown(null);
                            }}
                            className={cn(
                              'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors flex items-center justify-between',
                              content.ctaFormId === form._id && 'bg-slate-100 font-medium'
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
          </div>

          {/* Background Section */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-3">Background</label>

            {/* Background Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => updateContent({ backgroundType: 'color', backgroundImage: '' })}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                  content.backgroundType !== 'image'
                    ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                    : "bg-slate-100 text-slate-600 border-2 border-transparent hover:border-slate-200"
                )}
              >
                Solid Color
              </button>
              <button
                onClick={() => updateContent({ backgroundType: 'image' })}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                  content.backgroundType === 'image'
                    ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                    : "bg-slate-100 text-slate-600 border-2 border-transparent hover:border-slate-200"
                )}
              >
                Background Image
              </button>
            </div>

            {/* Color Picker */}
            {content.backgroundType !== 'image' && (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={content.backgroundColor || '#6366f1'}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  className="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.backgroundColor || '#6366f1'}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="#6366f1"
                />
              </div>
            )}

            {/* Image Picker */}
            {content.backgroundType === 'image' && (
              <div className="space-y-3">
                {content.backgroundImage ? (
                  <div className="relative group">
                    <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl bg-white">
                      <img
                        src={content.backgroundImage}
                        alt="Background preview"
                        className="h-20 w-28 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">Background Image</p>
                        <p className="text-xs text-slate-500 truncate">{content.backgroundImage}</p>
                      </div>
                      <button
                        onClick={() => updateContent({ backgroundImage: '', backgroundType: 'color' })}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setActiveSlideIndex(-1);
                        setShowMediaLibrary(true);
                      }}
                      className="absolute inset-0 bg-black/0 hover:bg-black/5 rounded-xl transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <span className="px-3 py-1.5 bg-white text-sm font-medium text-slate-700 rounded-lg shadow-sm border">
                        Change Image
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Media Library Button */}
                    {userId && (
                      <button
                        onClick={() => {
                          setActiveSlideIndex(-1);
                          setShowMediaLibrary(true);
                        }}
                        className="w-full px-4 py-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <ImageIcon className="h-6 w-6 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          Browse Media Library
                        </span>
                        <span className="text-xs text-slate-500">
                          Select an uploaded image
                        </span>
                      </button>
                    )}

                    {/* URL Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={content.backgroundImage || ''}
                        onChange={(e) => updateContent({ backgroundImage: e.target.value })}
                        placeholder="Or paste image URL..."
                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Text Color */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={content.textColor || '#ffffff'}
                onChange={(e) => updateContent({ textColor: e.target.value })}
                className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={content.textColor || '#ffffff'}
                onChange={(e) => updateContent({ textColor: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Media Library Modal */}
      {userId && (
        <MediaLibraryModal
          userId={userId}
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelectImage={handleSelectImage}
          contextName="Hero Slider Background"
          allowMultiSelect={false}
        />
      )}
    </div>
  );
}
