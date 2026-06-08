'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Type,
  Palette,
  Link2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Settings,
  Eye,
  EyeOff,
  ExternalLink,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Shield,
  Award,
  Clock,
  Star,
  Check,
  Heart,
  ToggleLeft,
  ToggleRight,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeroSectionContent } from '@/types/page-builder';

interface HeroModernEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
  userId?: string;
  websiteId?: string;
  forms?: Array<{ _id: string; name: string; fields: any[] }>;
  pages?: Array<{ _id: string; title: string; slug: string; sections?: any[] }>;
}

const TRUST_ICONS = [
  { value: 'shield', label: 'Shield', Icon: Shield },
  { value: 'award', label: 'Award', Icon: Award },
  { value: 'clock', label: 'Clock', Icon: Clock },
  { value: 'star', label: 'Star', Icon: Star },
  { value: 'check', label: 'Check', Icon: Check },
  { value: 'heart', label: 'Heart', Icon: Heart },
];

const DEFAULT_STATS = [
  { id: 'stat1', value: '98%', label: 'Customer Satisfaction' },
  { id: 'stat2', value: '500+', label: 'Happy Customers' },
  { id: 'stat3', value: '15+', label: 'Years Experience' },
  { id: 'stat4', value: '24/7', label: 'Support Available' },
];

const DEFAULT_TRUST_INDICATORS = [
  { id: 'trust1', icon: 'shield' as const, label: 'Verified Dealer' },
  { id: 'trust2', icon: 'award' as const, label: 'Award Winning' },
  { id: 'trust3', icon: 'clock' as const, label: 'Since 2010' },
];

// SectionWrapper - defined outside to prevent re-renders
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
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Icon className="h-4 w-4 text-indigo-600" />
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

// Toggle - defined outside to prevent re-renders
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
          <ToggleRight className="h-4 w-4 text-indigo-600" />
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
          enabled ? 'bg-indigo-600' : 'bg-slate-200'
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

// CTA Editor - defined outside to prevent re-renders
function CTAEditor({
  label,
  text,
  type,
  link,
  pageId,
  sectionId,
  formId,
  backgroundColor,
  textColor: btnTextColor,
  onTextChange,
  onTypeChange,
  onLinkChange,
  onPageChange,
  onSectionChange,
  onFormChange,
  onBgColorChange,
  onTextColorChange,
  currentDropdown,
  setCurrentDropdown,
  pages,
  forms,
}: {
  label: string;
  text: string;
  type: 'url' | 'page' | 'form';
  link: string;
  pageId?: string;
  sectionId?: string;
  formId?: string;
  backgroundColor?: string;
  textColor?: string;
  onTextChange: (value: string) => void;
  onTypeChange: (value: 'url' | 'page' | 'form') => void;
  onLinkChange: (value: string) => void;
  onPageChange: (pageId: string, sectionId?: string) => void;
  onSectionChange: (sectionId: string) => void;
  onFormChange: (formId: string) => void;
  onBgColorChange?: (color: string) => void;
  onTextColorChange?: (color: string) => void;
  currentDropdown: string | null;
  setCurrentDropdown: (value: string | null) => void;
  pages: Array<{ _id: string; title: string; slug: string; sections?: any[] }>;
  forms: Array<{ _id: string; name: string; fields: any[] }>;
  dropdownId: string;
}) {
  const selectedPage = pages.find(p => p._id === pageId);

  return (
    <div className="space-y-3">
      {/* CTA Text */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">{label} Text</label>
        <input
          type="text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Get Started"
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* CTA Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Link Type</label>
        <div className="flex gap-2">
          {[
            { value: 'url', label: 'URL', icon: ExternalLink },
            { value: 'page', label: 'Page', icon: FileText },
            { value: 'form', label: 'Form', icon: MessageSquare },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => onTypeChange(option.value as 'url' | 'page' | 'form')}
                className={cn(
                  'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5',
                  type === option.value
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200'
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* URL Input */}
      {type === 'url' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">URL</label>
          <input
            type="text"
            value={link}
            onChange={(e) => onLinkChange(e.target.value)}
            placeholder="https://example.com or /page"
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Page Selection */}
      {type === 'page' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Page</label>
            <div className="relative">
              <button
                onClick={() => setCurrentDropdown(currentDropdown === 'page' ? null : 'page')}
                className="w-full px-4 py-2.5 text-sm text-left bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
              >
                <span className={cn(!pageId && 'text-slate-400')}>
                  {selectedPage?.title || 'Select a page'}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {currentDropdown === 'page' && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {pages.map((page) => (
                    <button
                      key={page._id}
                      onClick={() => {
                        onPageChange(page._id);
                        setCurrentDropdown(null);
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors',
                        pageId === page._id && 'bg-indigo-50 text-indigo-700'
                      )}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section Selection */}
          {selectedPage?.sections && selectedPage.sections.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Scroll to Section (Optional)
              </label>
              <div className="relative">
                <button
                  onClick={() => setCurrentDropdown(currentDropdown === 'section' ? null : 'section')}
                  className="w-full px-4 py-2.5 text-sm text-left bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
                >
                  <span className={cn(!sectionId && 'text-slate-400')}>
                    {sectionId ? `Section: ${sectionId}` : 'Select a section'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                {currentDropdown === 'section' && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    <button
                      onClick={() => {
                        onSectionChange('');
                        setCurrentDropdown(null);
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors',
                        !sectionId && 'bg-indigo-50 text-indigo-700'
                      )}
                    >
                      No section (page only)
                    </button>
                    {selectedPage.sections.map((section: any) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          onSectionChange(section.id);
                          setCurrentDropdown(null);
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors',
                          sectionId === section.id && 'bg-indigo-50 text-indigo-700'
                        )}
                      >
                        {section.type} - {section.id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Selection */}
      {type === 'form' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Form</label>
          <div className="relative">
            <button
              onClick={() => setCurrentDropdown(currentDropdown === 'form' ? null : 'form')}
              className="w-full px-4 py-2.5 text-sm text-left bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
            >
              <span className={cn(!formId && 'text-slate-400')}>
                {formId ? forms.find(f => f._id === formId)?.name || 'Select a form' : 'Select a form'}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {currentDropdown === 'form' && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {forms.length > 0 ? (
                  forms.map((form) => (
                    <button
                      key={form._id}
                      onClick={() => {
                        onFormChange(form._id);
                        setCurrentDropdown(null);
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors flex items-center justify-between',
                        formId === form._id && 'bg-indigo-50 text-indigo-700'
                      )}
                    >
                      <span>{form.name}</span>
                      <span className="text-xs text-slate-400">{form.fields?.length || 0} fields</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2.5 text-sm text-slate-500">No forms available</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Button Colors */}
      {onBgColorChange && onTextColorChange && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Button BG</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor || '#ffffff'}
                onChange={(e) => onBgColorChange(e.target.value)}
                className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={backgroundColor || '#ffffff'}
                onChange={(e) => onBgColorChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Button Text</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={btnTextColor || '#0a0a0a'}
                onChange={(e) => onTextColorChange(e.target.value)}
                className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={btnTextColor || '#0a0a0a'}
                onChange={(e) => onTextColorChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HeroModernEditor({
  content,
  onChange,
  userId,
  websiteId,
  forms = [],
  pages = [],
}: HeroModernEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['content']));
  const [primaryCtaDropdown, setPrimaryCtaDropdown] = useState<string | null>(null);
  const [secondaryCtaDropdown, setSecondaryCtaDropdown] = useState<string | null>(null);

  const stats = useMemo(() => content.stats || DEFAULT_STATS, [content.stats]);
  const trustIndicators = useMemo(() => content.trustIndicators || DEFAULT_TRUST_INDICATORS, [content.trustIndicators]);

  const updateContent = useCallback((updates: Partial<HeroSectionContent>) => {
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

  // Trust indicators management
  const updateTrustIndicator = useCallback((id: string, updates: Partial<{ icon: string; label: string }>) => {
    const newIndicators = trustIndicators.map((indicator: any) =>
      indicator.id === id ? { ...indicator, ...updates } : indicator
    );
    updateContent({ trustIndicators: newIndicators });
  }, [trustIndicators, updateContent]);

  const addTrustIndicator = useCallback(() => {
    const newIndicator = {
      id: `trust_${Date.now()}`,
      icon: 'star',
      label: 'New Badge',
    };
    updateContent({ trustIndicators: [...trustIndicators, newIndicator] });
  }, [trustIndicators, updateContent]);

  const removeTrustIndicator = useCallback((id: string) => {
    const newIndicators = trustIndicators.filter((indicator: any) => indicator.id !== id);
    updateContent({ trustIndicators: newIndicators });
  }, [trustIndicators, updateContent]);

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
            <textarea
              value={content.headline || ''}
              onChange={(e) => updateContent({ headline: e.target.value })}
              placeholder="Find Your Perfect Vehicle"
              rows={2}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subheadline</label>
            <textarea
              value={content.subheadline || ''}
              onChange={(e) => updateContent({ subheadline: e.target.value })}
              placeholder="Discover our premium selection of quality vehicles"
              rows={2}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Primary CTA */}
      <SectionWrapper
        id="primary-cta"
        title="Primary CTA Button"
        icon={Link2}
        isExpanded={expandedSections.has('primary-cta')}
        onToggle={toggleSection}
      >
        <CTAEditor
          label="Primary CTA"
          text={content.ctaText || ''}
          type={content.ctaType || 'url'}
          link={content.ctaLink || ''}
          pageId={content.ctaPageId}
          sectionId={content.ctaSectionId}
          formId={content.ctaFormId}
          backgroundColor={content.ctaBackgroundColor}
          textColor={content.ctaTextColor}
          onTextChange={(value) => updateContent({ ctaText: value })}
          onTypeChange={(value) => updateContent({ ctaType: value })}
          onLinkChange={(value) => updateContent({ ctaLink: value })}
          onPageChange={(pageId, sectionId) => updateContent({ ctaPageId: pageId, ctaSectionId: sectionId })}
          onSectionChange={(sectionId) => updateContent({ ctaSectionId: sectionId })}
          onFormChange={(formId) => updateContent({ ctaFormId: formId })}
          onBgColorChange={(color) => updateContent({ ctaBackgroundColor: color })}
          onTextColorChange={(color) => updateContent({ ctaTextColor: color })}
          currentDropdown={primaryCtaDropdown}
          setCurrentDropdown={setPrimaryCtaDropdown}
          pages={pages}
          forms={forms}
          dropdownId="primary"
        />
      </SectionWrapper>

      {/* Secondary CTA */}
      <SectionWrapper
        id="secondary-cta"
        title="Secondary CTA Button"
        icon={Link2}
        isExpanded={expandedSections.has('secondary-cta')}
        onToggle={toggleSection}
      >
        <Toggle
          label="Show Secondary CTA"
          enabled={content.showSecondaryCta !== false}
          onChange={(value) => updateContent({ showSecondaryCta: value })}
        />

        {content.showSecondaryCta !== false && (
          <CTAEditor
            label="Secondary CTA"
            text={content.secondaryCtaText || ''}
            type={content.secondaryCtaType || 'url'}
            link={content.secondaryCtaLink || ''}
            pageId={content.secondaryCtaPageId}
            sectionId={content.secondaryCtaSectionId}
            formId={content.secondaryCtaFormId}
            onTextChange={(value) => updateContent({ secondaryCtaText: value })}
            onTypeChange={(value) => updateContent({ secondaryCtaType: value })}
            onLinkChange={(value) => updateContent({ secondaryCtaLink: value })}
            onPageChange={(pageId, sectionId) => updateContent({ secondaryCtaPageId: pageId, secondaryCtaSectionId: sectionId })}
            onSectionChange={(sectionId) => updateContent({ secondaryCtaSectionId: sectionId })}
            onFormChange={(formId) => updateContent({ secondaryCtaFormId: formId })}
            currentDropdown={secondaryCtaDropdown}
            setCurrentDropdown={setSecondaryCtaDropdown}
            pages={pages}
            forms={forms}
            dropdownId="secondary"
          />
        )}
      </SectionWrapper>

      {/* Stats Card */}
      <SectionWrapper
        id="stats"
        title="Stats Card"
        icon={Settings}
        isExpanded={expandedSections.has('stats')}
        onToggle={toggleSection}
      >
        <Toggle
          label="Show Stats Card"
          description="Display inventory and statistics card"
          enabled={content.showStatsCard !== false}
          onChange={(value) => updateContent({ showStatsCard: value })}
        />

        {content.showStatsCard !== false && (
          <div className="space-y-4">
            {/* Card Header */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Card Title</label>
                <input
                  type="text"
                  value={content.statsCardTitle || ''}
                  onChange={(e) => updateContent({ statsCardTitle: e.target.value })}
                  placeholder="Current Inventory"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Card Value</label>
                <input
                  type="text"
                  value={content.statsCardValue || ''}
                  onChange={(e) => updateContent({ statsCardValue: e.target.value })}
                  placeholder="150+ Vehicles"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Stats List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Statistics Grid</label>
                <button
                  onClick={addStat}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {stats.map((stat: any) => (
                  <div key={stat.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <div className="text-slate-400 cursor-grab">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => updateStat(stat.id, { value: e.target.value })}
                      placeholder="98%"
                      className="w-20 px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(stat.id, { label: e.target.value })}
                      placeholder="Customer Satisfaction"
                      className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => removeStat(stat.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Avatars */}
            <Toggle
              label="Show Customer Avatars"
              enabled={content.showCustomerAvatars !== false}
              onChange={(value) => updateContent({ showCustomerAvatars: value })}
            />

            {content.showCustomerAvatars !== false && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Trust Text</label>
                <input
                  type="text"
                  value={content.customerTrustText || ''}
                  onChange={(e) => updateContent({ customerTrustText: e.target.value })}
                  placeholder="Trusted by 500+ customers"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        )}
      </SectionWrapper>

      {/* Trust Indicators */}
      <SectionWrapper
        id="trust"
        title="Trust Indicators"
        icon={Shield}
        isExpanded={expandedSections.has('trust')}
        onToggle={toggleSection}
      >
        <Toggle
          label="Show Trust Indicators"
          description="Badges below the CTA buttons"
          enabled={content.showTrustIndicators !== false}
          onChange={(value) => updateContent({ showTrustIndicators: value })}
        />

        {content.showTrustIndicators !== false && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Badge Items</label>
              <button
                onClick={addTrustIndicator}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {trustIndicators.map((indicator: any) => (
                <div key={indicator.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                  <select
                    value={indicator.icon}
                    onChange={(e) => updateTrustIndicator(indicator.id, { icon: e.target.value })}
                    className="px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TRUST_ICONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={indicator.label}
                    onChange={(e) => updateTrustIndicator(indicator.id, { label: e.target.value })}
                    placeholder="Badge Label"
                    className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => removeTrustIndicator(indicator.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionWrapper>

      {/* Display Options */}
      <SectionWrapper
        id="display"
        title="Display Options"
        icon={Eye}
        isExpanded={expandedSections.has('display')}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <Toggle
            label="Welcome Tag"
            description="Premium badge at top"
            enabled={content.showWelcomeTag === true}
            onChange={(value) => updateContent({ showWelcomeTag: value })}
          />
          <Toggle
            label="Scroll Indicator"
            description="Scroll button at bottom"
            enabled={content.showScrollIndicator !== false}
            onChange={(value) => updateContent({ showScrollIndicator: value })}
          />
        </div>
      </SectionWrapper>

      {/* Styling */}
      <SectionWrapper
        id="styling"
        title="Styling"
        icon={Palette}
        isExpanded={expandedSections.has('styling')}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          {/* Color Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateContent({
                    colorMode: 'dark',
                    backgroundColor: '#0a0a0a',
                    textColor: '#ffffff',
                    ctaBackgroundColor: '#ffffff',
                    ctaTextColor: '#0a0a0a',
                  });
                }}
                className={cn(
                  'flex-1 px-3 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2',
                  (content.colorMode === 'dark' || !content.colorMode)
                    ? 'bg-slate-900 text-white border-2 border-slate-900'
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
                )}
              >
                <Moon className="h-4 w-4" />
                Dark Mode
              </button>
              <button
                onClick={() => {
                  updateContent({
                    colorMode: 'light',
                    backgroundColor: '#ffffff',
                    textColor: '#1a1a1a',
                    ctaBackgroundColor: '#1a1a1a',
                    ctaTextColor: '#ffffff',
                  });
                }}
                className={cn(
                  'flex-1 px-3 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2',
                  content.colorMode === 'light'
                    ? 'bg-white text-slate-900 border-2 border-indigo-500'
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
                )}
              >
                <Sun className="h-4 w-4" />
                Light Mode
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Background Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateContent({ backgroundType: 'color', backgroundImage: '' })}
                className={cn(
                  'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                  content.backgroundType !== 'image'
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200'
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
                )}
              >
                Solid Color
              </button>
              <button
                onClick={() => updateContent({ backgroundType: 'image' })}
                className={cn(
                  'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                  content.backgroundType === 'image'
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200'
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
                )}
              >
                Background Image
              </button>
            </div>
          </div>

          {/* Color Picker */}
          {content.backgroundType !== 'image' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={content.backgroundColor || '#0a0a0a'}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  className="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.backgroundColor || '#0a0a0a'}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="#0a0a0a"
                />
              </div>
            </div>
          )}

          {/* Image Picker */}
          {content.backgroundType === 'image' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Background Image URL</label>
              <input
                type="text"
                value={content.backgroundImage || ''}
                onChange={(e) => updateContent({ backgroundImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {content.backgroundImage && (
                <div className="mt-2 relative">
                  <img
                    src={content.backgroundImage}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => updateContent({ backgroundImage: '' })}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Text Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={content.textColor || '#ffffff'}
                onChange={(e) => updateContent({ textColor: e.target.value })}
                className="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer"
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
      </SectionWrapper>
    </div>
  );
}
