'use client';

import { useState, useMemo } from 'react';
import {
  Type,
  Image as ImageIcon,
  X,
  Plus,
  Settings,
  Mail,
  Phone,
  MapPin,
  Clock,
  Link2,
  Share2,
  Palette,
  Upload,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
} from 'lucide-react';
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
import MediaLibraryModal from '@/components/media-library-modal';
import { FooterLinkEditor } from '@/components/page-builder/builder/FooterLinkEditor';
import type { FooterSectionContent, FooterLogoType, FooterLink } from '@/types/page-builder';

interface FooterEditorProps {
  content: FooterSectionContent;
  onChange: (content: FooterSectionContent) => void;
  userId?: string;
  websiteId?: string;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DEFAULT_DAYS = DAYS_OF_WEEK.map((day) => ({
  day,
  hours: '9:00 AM - 5:00 PM',
  isOpen: day !== 'Sunday',
}));

const DEFAULT_HOLIDAYS = [
  { name: "New Year's Day", date: 'Jan 1', hours: 'Closed', isOpen: false },
  { name: 'Memorial Day', date: 'Last Mon in May', hours: 'Closed', isOpen: false },
  { name: 'Independence Day', date: 'July 4', hours: 'Closed', isOpen: false },
  { name: 'Labor Day', date: 'First Mon in Sep', hours: 'Closed', isOpen: false },
  { name: 'Thanksgiving', date: 'Fourth Thu in Nov', hours: 'Closed', isOpen: false },
  { name: 'Christmas', date: 'Dec 25', hours: 'Closed', isOpen: false },
];

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'github', label: 'GitHub' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
];

interface SortableFooterLinkItemProps {
  link: FooterLink;
  index: number;
  websiteId: string;
  userId?: string;
  onUpdate: (index: number, link: FooterLink) => void;
  onRemove: (index: number) => void;
}

function SortableFooterLinkItem({ link, index, websiteId, userId, onUpdate, onRemove }: SortableFooterLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `footer-link-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'shadow-xl rounded-lg' : ''}>
      <div className="flex items-center gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
        <span className="text-xs text-slate-500 font-medium">Drag to reorder</span>
      </div>
      <FooterLinkEditor
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

export function FooterEditor({ content, onChange, userId, websiteId }: FooterEditorProps) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    logo: true,
    company: true,
    contact: true,
    businessHours: false,
    links: true,
    social: false,
    copyright: false,
    styling: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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

  const handleFooterLinksDragEnd = (groupIndex: number) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const links = [...(content.links || [])];
    if (!links[groupIndex]) return;

    const items = links[groupIndex].items || [];
    const oldIndex = items.findIndex((_, i) => `footer-link-${i}` === active.id);
    const newIndex = items.findIndex((_, i) => `footer-link-${i}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      links[groupIndex] = {
        ...links[groupIndex],
        items: arrayMove(items, oldIndex, newIndex),
      };
      onChange({ ...content, links });
    }
  };

  const updateField = (field: keyof FooterSectionContent, value: any) => {
    onChange({ ...content, [field]: value });
  };

  const updateNestedField = (parent: keyof FooterSectionContent, field: string, value: any) => {
    onChange({
      ...content,
      [parent]: {
        ...(content[parent] as Record<string, any>),
        [field]: value,
      },
    });
  };

  // Logo handlers
  const handleLogoTypeChange = (type: FooterLogoType) => {
    const updates: Partial<FooterSectionContent> = { logoType: type };
    if (type === 'text') {
      updates.logo = '';
    }
    onChange({ ...content, ...updates });
  };

  const handleSelectLogo = (url: string) => {
    onChange({ ...content, logo: url, logoType: 'image' });
  };

  const handleRemoveLogo = () => {
    onChange({ ...content, logo: '' });
  };

  // Business hours handlers
  const updateBusinessHours = (updates: Partial<FooterSectionContent['businessHours']>) => {
    onChange({
      ...content,
      businessHours: {
        ...content.businessHours,
        ...updates,
      },
    });
  };

  // Get the current days array, initializing if needed
  const currentDays = useMemo(() => {
    if (content.businessHours?.days && content.businessHours.days.length > 0) {
      return content.businessHours.days;
    }
    return DEFAULT_DAYS;
  }, [content.businessHours?.days]);

  // Get the current holidays array, initializing if needed
  const currentHolidays = useMemo(() => {
    if (content.businessHours?.holidays && content.businessHours.holidays.length > 0) {
      return content.businessHours.holidays;
    }
    return DEFAULT_HOLIDAYS;
  }, [content.businessHours?.holidays]);

  // Initialize business hours with default values when enabled
  const handleEnableBusinessHours = (enabled: boolean) => {
    if (enabled && !content.businessHours?.days) {
      updateBusinessHours({
        enabled: true,
        title: 'Business Hours',
        days: DEFAULT_DAYS,
        showHolidays: false,
        holidaysTitle: 'Holiday Hours',
        holidays: DEFAULT_HOLIDAYS,
      });
    } else {
      updateBusinessHours({ enabled });
    }
  };

  const updateDayHours = (index: number, field: 'hours' | 'isOpen', value: string | boolean) => {
    const days = [...currentDays];
    if (days[index]) {
      days[index] = { ...days[index], [field]: value };
      updateBusinessHours({ days });
    }
  };

  // Holiday handlers
  const handleEnableHolidays = (showHolidays: boolean) => {
    if (showHolidays && !content.businessHours?.holidays) {
      updateBusinessHours({
        showHolidays: true,
        holidaysTitle: 'Holiday Hours',
        holidays: DEFAULT_HOLIDAYS,
      });
    } else {
      updateBusinessHours({ showHolidays });
    }
  };

  const updateHoliday = (index: number, field: 'name' | 'date' | 'hours' | 'isOpen', value: string | boolean) => {
    const holidays = [...currentHolidays];
    if (holidays[index]) {
      holidays[index] = { ...holidays[index], [field]: value };
      updateBusinessHours({ holidays });
    }
  };

  const addHoliday = () => {
    const holidays = [...currentHolidays, { name: 'New Holiday', date: '', hours: 'Closed', isOpen: false }];
    updateBusinessHours({ holidays });
  };

  const removeHoliday = (index: number) => {
    const holidays = currentHolidays.filter((_, i) => i !== index);
    updateBusinessHours({ holidays });
  };

  // Links handlers
  const addLinkGroup = () => {
    const links = [...(content.links || []), { title: '', items: [] }];
    updateField('links', links);
  };

  const updateLinkGroup = (index: number, title: string) => {
    const links = [...(content.links || [])];
    links[index] = { ...links[index], title };
    updateField('links', links);
  };

  const removeLinkGroup = (index: number) => {
    const links = (content.links || []).filter((_, i) => i !== index);
    updateField('links', links);
  };

  const addLinkItem = (groupIndex: number) => {
    const links = [...(content.links || [])];
    if (links[groupIndex]) {
      const newLink: FooterLink = {
        label: '',
        type: 'url',
        url: '',
      };
      links[groupIndex] = {
        ...links[groupIndex],
        items: [...links[groupIndex].items, newLink],
      };
      updateField('links', links);
    }
  };

  const updateLinkItem = (groupIndex: number, itemIndex: number, updatedLink: FooterLink) => {
    const links = [...(content.links || [])];
    if (links[groupIndex]?.items[itemIndex]) {
      links[groupIndex].items[itemIndex] = updatedLink;
      updateField('links', links);
    }
  };

  const removeLinkItem = (groupIndex: number, itemIndex: number) => {
    const links = [...(content.links || [])];
    if (links[groupIndex]) {
      links[groupIndex] = {
        ...links[groupIndex],
        items: links[groupIndex].items.filter((_, i) => i !== itemIndex),
      };
      updateField('links', links);
    }
  };

  // Social links handlers
  const addSocialLink = () => {
    const socialLinks = [...(content.socialLinks || []), { platform: 'facebook', href: '' }];
    updateField('socialLinks', socialLinks);
  };

  const updateSocialLink = (index: number, field: 'platform' | 'href', value: string) => {
    const socialLinks = [...(content.socialLinks || [])];
    socialLinks[index] = { ...socialLinks[index], [field]: value };
    updateField('socialLinks', socialLinks);
  };

  const removeSocialLink = (index: number) => {
    const socialLinks = (content.socialLinks || []).filter((_, i) => i !== index);
    updateField('socialLinks', socialLinks);
  };

  const isImageType = content.logoType === 'image';

  return (
    <div className="space-y-4">
      {/* Logo Section */}
      <div className="bg-slate-50 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('logo')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Logo</h4>
          </div>
          {expandedSections.logo ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {expandedSections.logo && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
            {/* Logo Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Logo Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLogoTypeChange('text')}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center justify-center gap-2',
                    !isImageType
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  )}
                >
                  <Type className="h-4 w-4" />
                  Text
                </button>
                <button
                  onClick={() => handleLogoTypeChange('image')}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center justify-center gap-2',
                    isImageType
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  )}
                >
                  <ImageIcon className="h-4 w-4" />
                  Image
                </button>
              </div>
            </div>

            {/* Text Logo - Company Name */}
            {!isImageType && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={content.companyName || content.company?.name || ''}
                  onChange={(e) => {
                    const newName = e.target.value;
                    onChange({
                      ...content,
                      companyName: newName,
                      company: { ...content.company, name: newName },
                    });
                  }}
                  placeholder="Your Company"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  maxLength={50}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {(content.companyName || content.company?.name || '').length}/50 characters
                </p>
              </div>
            )}

            {/* Image Logo */}
            {isImageType && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Logo Image
                </label>
                {content.logo ? (
                  <div className="relative group">
                    <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl bg-white">
                      <img
                        src={content.logo}
                        alt="Logo preview"
                        className="h-12 w-auto max-w-[200px] object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          Current logo
                        </p>
                        <p className="text-xs text-slate-500 truncate">{content.logo}</p>
                      </div>
                      <button
                        onClick={handleRemoveLogo}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove logo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMediaLibrary(true)}
                    className="w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      Select Logo Image
                    </span>
                    <span className="text-xs text-slate-500">
                      Upload or choose from media library
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Company Info Section */}
      <div className="bg-slate-50 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('company')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Settings className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Company Info</h4>
          </div>
          {expandedSections.company ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {expandedSections.company && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={content.company?.name || ''}
                onChange={(e) => {
                  const newName = e.target.value;
                  onChange({
                    ...content,
                    companyName: newName,
                    company: { ...content.company, name: newName },
                  });
                }}
                placeholder="Your Company"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={content.company?.description || ''}
                onChange={(e) => updateNestedField('company', 'description', e.target.value)}
                placeholder="Building exceptional digital experiences..."
                rows={2}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={200}
              />
              <p className="text-xs text-slate-500 mt-1">
                {(content.company?.description || '').length}/200 characters
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Contact Info Section */}
      <div className="bg-slate-50 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('contact')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Mail className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Contact Info</h4>
          </div>
          {expandedSections.contact ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {expandedSections.contact && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email
              </label>
              <input
                type="email"
                value={content.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="hello@example.com"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone
              </label>
              <input
                type="tel"
                value={content.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Address
              </label>
              <input
                type="text"
                value={content.address || ''}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Business Hours Section */}
      <div className="bg-slate-50 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('businessHours')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Business Hours</h4>
            <span className="text-xs text-slate-500 font-normal">(Optional)</span>
          </div>
          {expandedSections.businessHours ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {expandedSections.businessHours && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
            {/* Enable toggle */}
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-900">
                  Show Business Hours
                </label>
                <p className="text-xs text-slate-500">Display your operating hours in the footer</p>
              </div>
              <button
                onClick={() => handleEnableBusinessHours(!content.businessHours?.enabled)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  content.businessHours?.enabled ? 'bg-indigo-600' : 'bg-slate-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    content.businessHours?.enabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {content.businessHours?.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={content.businessHours?.title || 'Business Hours'}
                    onChange={(e) => updateBusinessHours({ title: e.target.value })}
                    placeholder="Business Hours"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Daily Hours
                  </label>
                  {currentDays.map((dayInfo, index) => (
                    <div
                      key={dayInfo.day}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-white rounded-lg border border-slate-200"
                    >
                      <div className="w-24 flex-shrink-0">
                        <span className="text-sm font-medium text-slate-700">{dayInfo.day}</span>
                      </div>
                      <button
                        onClick={() => updateDayHours(index, 'isOpen', !dayInfo.isOpen)}
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                          dayInfo.isOpen
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {dayInfo.isOpen ? 'Open' : 'Closed'}
                      </button>
                      {dayInfo.isOpen ? (
                        <input
                          type="text"
                          value={dayInfo.hours}
                          onChange={(e) => updateDayHours(index, 'hours', e.target.value)}
                          placeholder="9:00 AM - 5:00 PM"
                          className="flex-1 min-w-[150px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <span className="flex-1 text-sm text-slate-400 italic">Closed</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Public Holidays */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Show Public Holidays
                      </label>
                      <p className="text-xs text-slate-500">Display general public holiday hours</p>
                    </div>
                    <button
                      onClick={() => updateBusinessHours({ showPublicHolidays: !content.businessHours?.showPublicHolidays })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        content.businessHours?.showPublicHolidays ? 'bg-indigo-600' : 'bg-slate-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          content.businessHours?.showPublicHolidays ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {content.businessHours?.showPublicHolidays && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <div className="w-28 flex-shrink-0">
                          <span className="text-sm font-medium text-slate-700">Public Holidays</span>
                        </div>
                        <button
                          onClick={() => updateBusinessHours({ publicHolidaysIsOpen: !content.businessHours?.publicHolidaysIsOpen })}
                          className={cn(
                            'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                            content.businessHours?.publicHolidaysIsOpen
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {content.businessHours?.publicHolidaysIsOpen ? 'Open' : 'Closed'}
                        </button>
                        {content.businessHours?.publicHolidaysIsOpen ? (
                          <input
                            type="text"
                            value={content.businessHours?.publicHolidaysHours || ''}
                            onChange={(e) => updateBusinessHours({ publicHolidaysHours: e.target.value })}
                            placeholder="10:00 AM - 4:00 PM"
                            className="flex-1 min-w-[150px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="flex-1 text-sm text-slate-400 italic">Closed</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Specific Holiday Hours */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Show Specific Holiday Hours
                      </label>
                      <p className="text-xs text-slate-500">Display hours for specific holidays with dates</p>
                    </div>
                    <button
                      onClick={() => handleEnableHolidays(!content.businessHours?.showHolidays)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        content.businessHours?.showHolidays ? 'bg-indigo-600' : 'bg-slate-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          content.businessHours?.showHolidays ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {content.businessHours?.showHolidays && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Holiday Section Title
                        </label>
                        <input
                          type="text"
                          value={content.businessHours?.holidaysTitle || 'Holiday Hours'}
                          onChange={(e) => updateBusinessHours({ holidaysTitle: e.target.value })}
                          placeholder="Holiday Hours"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Holiday Hours
                        </label>
                        {currentHolidays.map((holiday, index) => (
                          <div
                            key={index}
                            className="p-3 bg-white rounded-lg border border-slate-200 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-500">Holiday {index + 1}</span>
                              <button
                                onClick={() => removeHoliday(index)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={holiday.name}
                                onChange={(e) => updateHoliday(index, 'name', e.target.value)}
                                placeholder="Holiday Name"
                                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <input
                                type="text"
                                value={holiday.date}
                                onChange={(e) => updateHoliday(index, 'date', e.target.value)}
                                placeholder="Date (e.g., Dec 25)"
                                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => updateHoliday(index, 'isOpen', !holiday.isOpen)}
                                className={cn(
                                  'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                                  holiday.isOpen
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                )}
                              >
                                {holiday.isOpen ? 'Open' : 'Closed'}
                              </button>
                              {holiday.isOpen ? (
                                <input
                                  type="text"
                                  value={holiday.hours}
                                  onChange={(e) => updateHoliday(index, 'hours', e.target.value)}
                                  placeholder="10:00 AM - 2:00 PM"
                                  className="flex-1 min-w-[150px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              ) : (
                                <span className="flex-1 text-sm text-slate-400 italic">Closed</span>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={addHoliday}
                          className="w-full py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Holiday
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links Section */}
      <div className="bg-slate-50 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('links')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Link2 className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Navigation Links</h4>
          </div>
          {expandedSections.links ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {expandedSections.links && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
            {(content.links || []).map((group, groupIndex) => (
              <div key={groupIndex} className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={group.title}
                    onChange={(e) => updateLinkGroup(groupIndex, e.target.value)}
                    placeholder="Group Title (e.g., Quick Links, Company)"
                    className="flex-1 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => removeLinkGroup(groupIndex)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove group"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleFooterLinksDragEnd(groupIndex)}
                >
                  <SortableContext
                    items={group.items.map((_, i) => `footer-link-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {group.items.map((item, itemIndex) => (
                        <SortableFooterLinkItem
                          key={itemIndex}
                          link={item}
                          index={itemIndex}
                          websiteId={websiteId || ''}
                          userId={userId}
                          onUpdate={(idx, updatedLink) => updateLinkItem(groupIndex, idx, updatedLink)}
                          onRemove={(idx) => removeLinkItem(groupIndex, idx)}
                        />
                      ))}
                      <button
                        onClick={() => addLinkItem(groupIndex)}
                        className="w-full py-1.5 text-xs text-slate-600 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Link
                      </button>
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ))}

            <button
              onClick={addLinkGroup}
              className="w-full py-2.5 text-sm text-slate-600 border border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Link Group
            </button>
          </div>
        )}
      </div>

      {/* Social Links Section */}
      <div className="bg-slate-50 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('social')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Social Links</h4>
          </div>
          {expandedSections.social ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {expandedSections.social && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
            {(content.socialLinks || []).map((social, index) => (
              <div key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <select
                  value={social.platform}
                  onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                  className="w-full sm:w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={social.href}
                  onChange={(e) => updateSocialLink(index, 'href', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 min-w-[150px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => removeSocialLink(index)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              onClick={addSocialLink}
              className="w-full py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Social Link
            </button>
          </div>
        )}
      </div>

      {/* Copyright Section */}
      <div className="bg-slate-50 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('copyright')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Type className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Copyright</h4>
          </div>
          {expandedSections.copyright ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {expandedSections.copyright && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Copyright Text
            </label>
            <input
              type="text"
              value={content.copyright || ''}
              onChange={(e) => updateField('copyright', e.target.value)}
              placeholder="© 2024 Your Company. All rights reserved."
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Styling Section */}
      <div className="bg-slate-50 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('styling')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Palette className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Colors & Styling</h4>
          </div>
          {expandedSections.styling ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {expandedSections.styling && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={content.backgroundColor || '#0f172a'}
                    onChange={(e) => updateField('backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={content.backgroundColor || '#0f172a'}
                    onChange={(e) => updateField('backgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={content.textColor || '#ffffff'}
                    onChange={(e) => updateField('textColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={content.textColor || '#ffffff'}
                    onChange={(e) => updateField('textColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={content.accentColor || '#6366f1'}
                    onChange={(e) => updateField('accentColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={content.accentColor || '#6366f1'}
                    onChange={(e) => updateField('accentColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Library Modal */}
      {userId && (
        <MediaLibraryModal
          userId={userId}
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelectImage={handleSelectLogo}
          contextName="Footer Logo"
          allowMultiSelect={false}
        />
      )}
    </div>
  );
}
