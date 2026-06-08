'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Settings, Type, Image as ImageIcon, Palette, Link2, ChevronDown, ChevronUp, Trash2, Play, Timer, Navigation, Circle, Maximize2, Eye, EyeOff, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { PageSection, HeroSlide, SectionSettings } from '@/types/page-builder';
import { getTemplateById } from '@/lib/page-builder/templates';
import { NavbarLinkEditor } from './NavbarLinkEditor';
import { NavbarLogoEditor } from './NavbarLogoEditor';
import { NavbarCTAEditor } from './NavbarCTAEditor';
import { NavbarCartEditor } from './NavbarCartEditor';
import { HeroCTAEditor } from './HeroCTAEditor';
import { ImagePicker } from './ImagePicker';
import { ListingsShowcaseEditor } from './sections/ListingsShowcaseEditor';
import { HeroSliderEditor } from './sections/HeroSliderEditor';
import { FeaturesEditor } from './sections/FeaturesEditor';
import { FooterEditor } from './sections/FooterEditor';
import { AnimationSettingsEditor } from './sections/AnimationSettingsEditor';
import { LogoTickerEditor } from './sections/LogoTickerEditor';
import { PricingSectionEditor } from './sections/PricingSectionEditor';
import { BookingSectionEditor } from './sections/BookingSectionEditor';
import { ContactEditor } from './sections/ContactEditor';
import { HeroModernEditor } from './sections/HeroModernEditor';
import { HeroDealershipEditor } from './sections/HeroDealershipEditor';
import { AboutEditor } from './sections/AboutEditor';
import { HeroVehicleShowcaseEditor } from './sections/HeroVehicleShowcaseEditor';
import { AISectionEditor } from './sections/AISectionEditor';
import { CustomCodeEditor } from './sections/CustomCodeEditor';
import { ProductShowcaseEditor } from './sections/ProductShowcaseEditor';

interface SortableNavbarLinkProps {
  link: any;
  index: number;
  websiteId: string;
  userId?: string;
  onUpdate: (index: number, link: any) => void;
  onRemove: (index: number) => void;
}

function SortableNavbarLink({ link, index, websiteId, userId, onUpdate, onRemove }: SortableNavbarLinkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `navbar-link-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'shadow-xl rounded-xl' : ''}>
      <div className="flex items-center gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
        <span className="text-xs text-slate-500 font-medium">Drag to reorder</span>
      </div>
      <NavbarLinkEditor
        link={link}
        index={index}
        websiteId={websiteId}
        userId={userId}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
    </div>
  );
}

interface EditSectionPanelProps {
  section: PageSection;
  onClose: () => void;
  onSave: (sectionId: string, content: Record<string, any>, settings?: SectionSettings) => void;
  websiteId?: string;
  userId?: string;
}

export function EditSectionPanel({ section, onClose, onSave, websiteId, userId }: EditSectionPanelProps) {
  const [content, setContent] = useState(section.content);
  const [settings, setSettings] = useState<SectionSettings>(section.settings || {});
  const [isSaving, setIsSaving] = useState(false);

  const template = getTemplateById(section.templateId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleNavbarLinksDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const links = (content as any).links || [];
    const oldIndex = links.findIndex((_: any, i: number) => `navbar-link-${i}` === active.id);
    const newIndex = links.findIndex((_: any, i: number) => `navbar-link-${i}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newLinks = arrayMove(links, oldIndex, newIndex);
      handleChange('links', newLinks);
    }
  };

  const handleChange = (field: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (newSettings: SectionSettings) => {
    setSettings(newSettings);
  };

  const handleSave = () => {
    console.log('[EditSectionPanel] handleSave - section.id:', section.id);
    console.log('[EditSectionPanel] handleSave - content.ctaText:', content.ctaText);
    console.log('[EditSectionPanel] handleSave - content keys:', Object.keys(content));
    setIsSaving(true);
    onSave(section.id, content, settings);
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-full sm:w-[520px] md:w-[640px] lg:w-[840px] xl:w-[960px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-slate-50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Edit Section</h3>
            <p className="text-sm text-slate-600">{template?.name || section.type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-5">
          <div className="space-y-6">
            {/* Navbar Section Fields */}
            {section.type === 'navbar' && (
              <div className="space-y-6">
                {/* Logo Section */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">Logo & Branding</h4>
                  </div>
                  <NavbarLogoEditor
                    logoType={(content as any).logoType || 'text'}
                    logo={(content as any).logo || ''}
                    brandName={(content as any).brandName || ''}
                    onChange={(updates) => {
                      const newContent = { ...content };
                      Object.assign(newContent, updates);
                      setContent(newContent);
                    }}
                    userId={userId}
                  />
                </div>

                {/* Navigation Links */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Link2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">Navigation Links <span className="text-red-500">*</span></h4>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleNavbarLinksDragEnd}
                  >
                    <SortableContext
                      items={((content as any).links || []).map((_: any, i: number) => `navbar-link-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {((content as any).links || []).map((link: any, index: number) => (
                          <SortableNavbarLink
                            key={index}
                            link={link}
                            index={index}
                            websiteId={websiteId || ''}
                            userId={userId}
                            onUpdate={(index, updatedLink) => {
                              const newLinks = [...((content as any).links || [])];
                              newLinks[index] = updatedLink;
                              handleChange('links', newLinks);
                            }}
                            onRemove={(index) => {
                              const newLinks = (content as any).links?.filter((_: any, i: number) => i !== index) || [];
                              handleChange('links', newLinks);
                            }}
                          />
                        ))}
                        <button
                          onClick={() => {
                            const newLinks = [
                              ...((content as any).links || []),
                              { label: '', type: 'url' as const, url: '' },
                            ];
                            handleChange('links', newLinks);
                          }}
                          className="w-full py-2.5 text-sm text-slate-600 border border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Link
                        </button>
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>

                {/* Colors Grid */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Palette className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">Colors & Styling</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={(content as any).backgroundColor || '#ffffff'}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                          className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(content as any).backgroundColor || '#ffffff'}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={(content as any).textColor || '#1a1a1a'}
                          onChange={(e) => handleChange('textColor', e.target.value)}
                          className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(content as any).textColor || '#1a1a1a'}
                          onChange={(e) => handleChange('textColor', e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          placeholder="#1a1a1a"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Link Hover Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={(content as any).linkHoverColor || '#4f46e5'}
                          onChange={(e) => handleChange('linkHoverColor', e.target.value)}
                          className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(content as any).linkHoverColor || '#4f46e5'}
                          onChange={(e) => handleChange('linkHoverColor', e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          placeholder="#4f46e5"
                        />
                      </div>
                    </div>

                    {section.templateId === 'navbar-modern' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={(content as any).accentColor || '#6366f1'}
                            onChange={(e) => handleChange('accentColor', e.target.value)}
                            className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={(content as any).accentColor || '#6366f1'}
                            onChange={(e) => handleChange('accentColor', e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                            placeholder="#6366f1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA Section */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Type className="h-4 w-4 text-indigo-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">Call-to-Action Button</h4>
                    </div>
                    {(content as any).ctaText && (
                      <button
                        onClick={() => {
                          const newContent = { ...content };
                          delete newContent.ctaText;
                          delete newContent.ctaType;
                          delete newContent.ctaLink;
                          delete newContent.ctaPageId;
                          delete newContent.ctaSectionId;
                          delete newContent.ctaFormId;
                          setContent(newContent);
                        }}
                        className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                      >
                        Remove CTA
                      </button>
                    )}
                    {!(content as any).ctaText && (
                      <button
                        onClick={() => {
                          const newContent = { ...content };
                          newContent.ctaText = 'Get Started';
                          newContent.ctaType = 'url';
                          newContent.ctaLink = '#';
                          setContent(newContent);
                        }}
                        className="px-3 py-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 rounded-lg transition-colors"
                      >
                        Add CTA
                      </button>
                    )}
                  </div>
                  {(content as any).ctaText && (
                    <NavbarCTAEditor
                      cta={{
                        ctaText: (content as any).ctaText,
                        ctaType: (content as any).ctaType,
                        ctaLink: (content as any).ctaLink,
                        ctaPageId: (content as any).ctaPageId,
                        ctaSectionId: (content as any).ctaSectionId,
                        ctaFormId: (content as any).ctaFormId,
                      }}
                      websiteId={websiteId || ''}
                      userId={userId}
                      onChange={(cta) => {
                        const newContent = { ...content };
                        if (cta.ctaText !== undefined) newContent.ctaText = cta.ctaText;
                        if (cta.ctaType !== undefined) newContent.ctaType = cta.ctaType;
                        if (cta.ctaLink !== undefined) newContent.ctaLink = cta.ctaLink;
                        if (cta.ctaPageId !== undefined) newContent.ctaPageId = cta.ctaPageId;
                        if (cta.ctaSectionId !== undefined) newContent.ctaSectionId = cta.ctaSectionId;
                        if (cta.ctaFormId !== undefined) newContent.ctaFormId = cta.ctaFormId;
                        setContent(newContent);
                      }}
                      onRemove={() => {
                        const newContent = { ...content };
                        delete newContent.ctaText;
                        delete newContent.ctaType;
                        delete newContent.ctaLink;
                        delete newContent.ctaPageId;
                        delete newContent.ctaSectionId;
                        delete newContent.ctaFormId;
                        console.log('[NavbarCTAEditor] onRemove - deleted cta keys, newContent:', newContent);
                        console.log('[NavbarCTAEditor] onRemove - ctaText in newContent:', 'ctaText' in newContent);
                        setContent(newContent);
                      }}
                    />
                  )}
                </div>

                {/* Cart Icon Settings */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                  <NavbarCartEditor
                    showCart={(content as any).showCart || false}
                    cartLink={(content as any).cartLink}
                    onChange={(showCart, cartLink) => {
                      const newContent = { ...content };
                      newContent.showCart = showCart;
                      if (showCart) {
                        newContent.cartLink = cartLink;
                      } else {
                        newContent.cartLink = '';
                      }
                      setContent(newContent);
                    }}
                  />
                </div>

                {/* Size Settings */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Maximize2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">Size Settings</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Link Font Size */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Link Font Size
                      </label>
                      <select
                        value={(content as any).linkFontSize || 14}
                        onChange={(e) => handleChange('linkFontSize', parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                      >
                        {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((size) => (
                          <option key={size} value={size}>{size}px</option>
                        ))}
                      </select>
                    </div>

                    {/* Logo Text Size */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Logo Text Size
                      </label>
                      <select
                        value={(content as any).logoTextSize || 18}
                        onChange={(e) => handleChange('logoTextSize', parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                      >
                        {[12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 34, 36].map((size) => (
                          <option key={size} value={size}>{size}px</option>
                        ))}
                      </select>
                    </div>

                    {/* Logo Image Height */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Logo Image Height
                      </label>
                      <select
                        value={(content as any).logoImageHeight || 32}
                        onChange={(e) => handleChange('logoImageHeight', parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                      >
                        {[16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 44, 48, 52, 56, 60, 64, 72, 80].map((size) => (
                          <option key={size} value={size}>{size}px</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Settings className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">Settings</h4>
                  </div>
                  <div className="space-y-4">
                    {/* Links Alignment */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Links Alignment</label>
                      <p className="text-xs text-slate-500 mb-3">Position of navigation links in the navbar</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'left', label: 'Left', icon: '┣━━' },
                          { value: 'center', label: 'Center', icon: '┃ ┃' },
                          { value: 'right', label: 'Right', icon: '━━┫' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleChange('linksAlignment', option.value)}
                            className={cn(
                              'flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 transition-all',
                              ((content as any).linksAlignment || 'left') === option.value
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                            )}
                          >
                            <span className="text-lg font-mono">{option.icon}</span>
                            <span className="text-xs font-medium">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sticky Navigation */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <div>
                        <label className="block text-sm font-medium text-slate-900">Sticky Navigation</label>
                        <p className="text-xs text-slate-500 mt-0.5">Navbar stays visible at the top when scrolling</p>
                      </div>
                      <button
                        onClick={() => handleChange('sticky', !((content as any).sticky ?? true))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          ((content as any).sticky ?? true) ? 'bg-slate-900' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            ((content as any).sticky ?? true) ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hero Section Fields */}
            {section.type === 'hero' && section.templateId !== 'hero-slider' && (
              <div className="space-y-6">
                {/* Content Section */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Type className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">Content</h4>
                  </div>
                  <div className="space-y-4">
                    {/* Headline - Optional */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Headline</label>
                      <input
                        type="text"
                        value={(content as any).headline || ''}
                        onChange={(e) => handleChange('headline', e.target.value)}
                        placeholder="Enter your headline (optional)"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        maxLength={100}
                      />
                      <p className="text-xs text-slate-500 mt-1">{(content as any).headline?.length || 0}/100</p>
                    </div>

                    {/* Headline Styling */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Font Family</label>
                        <select
                          value={(content as any).headlineFontFamily || 'Inter'}
                          onChange={(e) => handleChange('headlineFontFamily', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Montserrat">Montserrat</option>
                          <option value="Raleway">Raleway</option>
                          <option value="Nunito">Nunito</option>
                          <option value="Work Sans">Work Sans</option>
                          <option value="Quicksand">Quicksand</option>
                          <option value="Playfair Display">Playfair Display</option>
                          <option value="Merriweather">Merriweather</option>
                          <option value="Lora">Lora</option>
                          <option value="PT Serif">PT Serif</option>
                          <option value="Crimson Text">Crimson Text</option>
                          <option value="Libre Baskerville">Libre Baskerville</option>
                          <option value="Josefin Sans">Josefin Sans</option>
                          <option value="Oswald">Oswald</option>
                          <option value="Bebas Neue">Bebas Neue</option>
                          <option value="Anton">Anton</option>
                          <option value="Righteous">Righteous</option>
                          <option value="Abril Fatface">Abril Fatface</option>
                          <option value="Dancing Script">Dancing Script</option>
                          <option value="Pacifico">Pacifico</option>
                          <option value="Caveat">Caveat</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Font Size</label>
                        <select
                          value={(content as any).headlineFontSize || ''}
                          onChange={(e) => handleChange('headlineFontSize', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Font Weight</label>
                        <select
                          value={(content as any).headlineFontWeight || 'bold'}
                          onChange={(e) => handleChange('headlineFontWeight', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="semibold">Semibold</option>
                          <option value="bold">Bold</option>
                          <option value="extrabold">Extra Bold</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Text Color</label>
                        <input
                          type="color"
                          value={(content as any).headlineColor || '#000000'}
                          onChange={(e) => handleChange('headlineColor', e.target.value)}
                          className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Text Align</label>
                        <select
                          value={(content as any).headlineTextAlign || 'left'}
                          onChange={(e) => handleChange('headlineTextAlign', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>

                    {/* Subheadline - Optional */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Subheadline</label>
                      <textarea
                        value={(content as any).subheadline || ''}
                        onChange={(e) => handleChange('subheadline', e.target.value)}
                        placeholder="Enter a subheadline (optional)"
                        rows={3}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        maxLength={700}
                      />
                      <p className="text-xs text-slate-500 mt-1">{(content as any).subheadline?.length || 0}/700</p>
                    </div>

                    {/* Subheadline Styling */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Font Family</label>
                        <select
                          value={(content as any).subheadlineFontFamily || 'Inter'}
                          onChange={(e) => handleChange('subheadlineFontFamily', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Montserrat">Montserrat</option>
                          <option value="Raleway">Raleway</option>
                          <option value="Nunito">Nunito</option>
                          <option value="Work Sans">Work Sans</option>
                          <option value="Quicksand">Quicksand</option>
                          <option value="Playfair Display">Playfair Display</option>
                          <option value="Merriweather">Merriweather</option>
                          <option value="Lora">Lora</option>
                          <option value="PT Serif">PT Serif</option>
                          <option value="Crimson Text">Crimson Text</option>
                          <option value="Libre Baskerville">Libre Baskerville</option>
                          <option value="Josefin Sans">Josefin Sans</option>
                          <option value="Oswald">Oswald</option>
                          <option value="Bebas Neue">Bebas Neue</option>
                          <option value="Anton">Anton</option>
                          <option value="Righteous">Righteous</option>
                          <option value="Abril Fatface">Abril Fatface</option>
                          <option value="Dancing Script">Dancing Script</option>
                          <option value="Pacifico">Pacifico</option>
                          <option value="Caveat">Caveat</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Font Size</label>
                        <select
                          value={(content as any).subheadlineFontSize || ''}
                          onChange={(e) => handleChange('subheadlineFontSize', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Default (1.25rem)</option>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Font Weight</label>
                        <select
                          value={(content as any).subheadlineFontWeight || 'normal'}
                          onChange={(e) => handleChange('subheadlineFontWeight', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="semibold">Semibold</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Text Color</label>
                        <input
                          type="color"
                          value={(content as any).subheadlineColor || '#000000'}
                          onChange={(e) => handleChange('subheadlineColor', e.target.value)}
                          className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Text Align</label>
                        <select
                          value={(content as any).subheadlineTextAlign || 'left'}
                          onChange={(e) => handleChange('subheadlineTextAlign', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Alignment */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <AlignLeft className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">Content Alignment</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('contentAlign', 'left')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        (content as any).contentAlign === 'left' || !(content as any).contentAlign
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <AlignLeft className="h-5 w-5 mx-auto mb-1 text-slate-600" />
                      <div className="text-xs font-medium text-slate-700">Left</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('contentAlign', 'center')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        (content as any).contentAlign === 'center'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <AlignCenter className="h-5 w-5 mx-auto mb-1 text-slate-600" />
                      <div className="text-xs font-medium text-slate-700">Center</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('contentAlign', 'right')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        (content as any).contentAlign === 'right'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <AlignRight className="h-5 w-5 mx-auto mb-1 text-slate-600" />
                      <div className="text-xs font-medium text-slate-700">Right</div>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Align heading, subheadline, and CTA on the page</p>
                </div>

                {/* CTA Section - Modern Hero uses HeroCTAEditor */}
                {/* Skip CTA section for hero-vehicle-showcase as it has its own CTA editor */}
                {section.templateId === 'hero-vehicle-showcase' ? null : section.templateId === 'hero-modern' ? (
                  <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Link2 className="h-4 w-4 text-indigo-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">Call-to-Action Button</h4>
                      </div>
                      {/* Enable/Disable CTA Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Show CTA</span>
                        <button
                          onClick={() => handleChange('ctaEnabled', (content as any).ctaEnabled === false ? true : false)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            (content as any).ctaEnabled !== false ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              (content as any).ctaEnabled !== false ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    {(content as any).ctaEnabled !== false && (
                      <HeroCTAEditor
                        cta={{
                          ctaText: (content as any).ctaText,
                          ctaType: (content as any).ctaType,
                          ctaLink: (content as any).ctaLink,
                          ctaPageId: (content as any).ctaPageId,
                          ctaSectionId: (content as any).ctaSectionId,
                          ctaFormId: (content as any).ctaFormId,
                          ctaBackgroundColor: (content as any).ctaBackgroundColor,
                          ctaTextColor: (content as any).ctaTextColor,
                        }}
                        websiteId={websiteId || ''}
                        userId={userId}
                        onChange={(cta) => {
                          const newContent = { ...content };
                          if (cta.ctaText !== undefined) newContent.ctaText = cta.ctaText;
                          if (cta.ctaType !== undefined) newContent.ctaType = cta.ctaType;
                          if (cta.ctaLink !== undefined) newContent.ctaLink = cta.ctaLink;
                          if (cta.ctaPageId !== undefined) newContent.ctaPageId = cta.ctaPageId;
                          if (cta.ctaSectionId !== undefined) newContent.ctaSectionId = cta.ctaSectionId;
                          if (cta.ctaFormId !== undefined) newContent.ctaFormId = cta.ctaFormId;
                          if (cta.ctaBackgroundColor !== undefined) newContent.ctaBackgroundColor = cta.ctaBackgroundColor;
                          if (cta.ctaTextColor !== undefined) newContent.ctaTextColor = cta.ctaTextColor;
                          setContent(newContent);
                        }}
                        onRemove={() => {
                          const newContent = { ...content };
                          delete newContent.ctaText;
                          delete newContent.ctaType;
                          delete newContent.ctaLink;
                          delete newContent.ctaPageId;
                          delete newContent.ctaSectionId;
                          delete newContent.ctaFormId;
                          delete newContent.ctaBackgroundColor;
                          delete newContent.ctaTextColor;
                          setContent(newContent);
                        }}
                      />
                    )}
                  </div>
                ) : (
                  /* CTA Section - All hero templates use HeroCTAEditor */
                  <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Link2 className="h-4 w-4 text-indigo-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">Call-to-Action Button</h4>
                      </div>
                      {/* Enable/Disable CTA Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Show CTA</span>
                        <button
                          onClick={() => handleChange('ctaEnabled', (content as any).ctaEnabled === false ? true : false)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            (content as any).ctaEnabled !== false ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              (content as any).ctaEnabled !== false ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    {(content as any).ctaEnabled !== false && (
                      <HeroCTAEditor
                        cta={{
                          ctaText: (content as any).ctaText,
                          ctaType: (content as any).ctaType,
                          ctaLink: (content as any).ctaLink,
                          ctaPageId: (content as any).ctaPageId,
                          ctaSectionId: (content as any).ctaSectionId,
                          ctaFormId: (content as any).ctaFormId,
                          ctaBackgroundColor: (content as any).ctaBackgroundColor,
                          ctaTextColor: (content as any).ctaTextColor,
                        }}
                        websiteId={websiteId || ''}
                        userId={userId}
                        onChange={(cta) => {
                          const newContent = { ...content };
                          if (cta.ctaText !== undefined) newContent.ctaText = cta.ctaText;
                          if (cta.ctaType !== undefined) newContent.ctaType = cta.ctaType;
                          if (cta.ctaLink !== undefined) newContent.ctaLink = cta.ctaLink;
                          if (cta.ctaPageId !== undefined) newContent.ctaPageId = cta.ctaPageId;
                          if (cta.ctaSectionId !== undefined) newContent.ctaSectionId = cta.ctaSectionId;
                          if (cta.ctaFormId !== undefined) newContent.ctaFormId = cta.ctaFormId;
                          if (cta.ctaBackgroundColor !== undefined) newContent.ctaBackgroundColor = cta.ctaBackgroundColor;
                          if (cta.ctaTextColor !== undefined) newContent.ctaTextColor = cta.ctaTextColor;
                          setContent(newContent);
                        }}
                        onRemove={() => {
                          const newContent = { ...content };
                          delete newContent.ctaText;
                          delete newContent.ctaType;
                          delete newContent.ctaLink;
                          delete newContent.ctaPageId;
                          delete newContent.ctaSectionId;
                          delete newContent.ctaFormId;
                          delete newContent.ctaBackgroundColor;
                          delete newContent.ctaTextColor;
                          setContent(newContent);
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Colors Grid */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Palette className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">Colors</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={(content as any).backgroundColor || '#6366f1'}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                          className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(content as any).backgroundColor || '#6366f1'}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          placeholder="#6366f1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={(content as any).textColor || '#ffffff'}
                          onChange={(e) => handleChange('textColor', e.target.value)}
                          className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(content as any).textColor || '#ffffff'}
                          onChange={(e) => handleChange('textColor', e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Image */}
                <ImagePicker
                  imageUrl={(content as any).backgroundImage || ''}
                  onChange={(url) => {
                    handleChange('backgroundImage', url);
                    handleChange('backgroundType', url ? 'image' : 'color');
                  }}
                  userId={userId}
                  label="Background Image"
                  showAltField={false}
                />

                {/* Modern Hero - Use dedicated editor */}
                {section.templateId === 'hero-modern' && (
                  <HeroModernEditor
                    content={content}
                    onChange={(newContent) => setContent(newContent)}
                    userId={userId}
                    websiteId={websiteId}
                  />
                )}

                {/* Dealership Hero - Use dedicated editor */}
                {section.templateId === 'hero-dealership' && (
                  <HeroDealershipEditor
                    content={content}
                    onChange={(newContent) => setContent(newContent)}
                    userId={userId}
                    websiteId={websiteId}
                  />
                )}

                {/* Vehicle Showcase Hero - Dark theme, full vehicle image */}
                {section.templateId === 'hero-vehicle-showcase' && (
                  <HeroVehicleShowcaseEditor
                    content={content}
                    onChange={(newContent) => setContent(newContent)}
                    userId={userId}
                    websiteId={websiteId}
                  />
                )}
              </div>
            )}

            {/* Hero Slider Section Fields */}
            {section.type === 'hero' && section.templateId === 'hero-slider' && (
              <HeroSliderEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
                userId={userId}
                websiteId={websiteId}
              />
            )}

            {/* About Section Fields */}
            {section.type === 'about' && (
              <AboutEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
                userId={userId}
                websiteId={websiteId}
                templateId={section.templateId}
              />
            )}

            {/* Footer Section */}
            {section.type === 'footer' && (
              <FooterEditor
                content={content as any}
                onChange={(newContent) => setContent(newContent)}
                userId={userId}
                websiteId={websiteId}
              />
            )}

            {/* Contact Section */}
            {section.type === 'contact' && (
              <ContactEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
                userId={userId}
                websiteId={websiteId}
              />
            )}

            {/* Listings Showcase Section */}
            {section.type === 'listings-showcase' && (
              <ListingsShowcaseEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
                websiteId={websiteId || ''}
                userId={userId}
              />
            )}

            {/* Features Section Fields */}
            {section.type === 'features' && (
              <FeaturesEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
                userId={userId}
                templateId={section.templateId}
                websiteId={websiteId}
              />
            )}

            {/* Logo Ticker Section Fields */}
            {section.type === 'logo-ticker' && (
              <LogoTickerEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
                userId={userId}
                templateId={section.templateId}
              />
            )}

            {/* Pricing Section Fields */}
            {section.type === 'pricing' && (
              <PricingSectionEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
                websiteId={websiteId}
                userId={userId}
                templateId={section.templateId}
              />
            )}

            {/* AI-Generated Section Fields */}
            {section.type === 'ai-generated' && (
              <AISectionEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
              />
            )}

            {/* Custom Code Section Fields */}
            {section.type === 'custom-code' && (
              <CustomCodeEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
                onSaveAndClose={handleSave}
              />
            )}

            {/* Product Showcase Section Fields */}
            {section.type === 'product-showcase' && (
              <ProductShowcaseEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
                websiteId={websiteId}
                userId={userId}
              />
            )}

            {/* Booking System Section Fields */}
            {((section.type as string) === 'booking-system' || (section.type as string) === 'booking-system-default') && (
              <BookingSectionEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
              />
            )}

            {/* Animation Settings - Available for all section types */}
            <AnimationSettingsEditor
              settings={settings.animation}
              onChange={(animationSettings) => handleSettingsChange({ ...settings, animation: animationSettings })}
            />

            {/* Coming soon for other section types */}
            {section.type !== 'hero' && section.type !== 'navbar' && section.type !== 'about' && section.type !== 'footer' && section.type !== 'contact' && section.type !== 'listings-showcase' && section.type !== 'features' && section.type !== 'logo-ticker' && section.type !== 'pricing' && section.type !== 'ai-generated' && section.type !== 'custom-code' && section.type !== 'booking-system' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Coming Soon</h3>
                <p className="text-sm text-slate-600">Editing for this section type is not yet available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !(
              section.type === 'navbar' ?
                ((content as any).logoType === 'image' && (content as any).logo) ||
                ((content as any).links && (content as any).links.length > 0)
              :
              section.type === 'footer' ?
                ((content as any).logoType === 'image' && (content as any).logo) ||
                (content as any).companyName ||
                (content as any).company?.name
              :
              section.type === 'contact' ? true :
              section.type === 'listings-showcase' ? true :
              section.type === 'logo-ticker' ? ((content as any).logos && (content as any).logos.length > 0) :
              section.type === 'ai-generated' ? true :
              section.type === 'custom-code' ? true :
              (section.type === 'about' || section.type === 'hero') ? (content as any).headline :
              true
            )}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
