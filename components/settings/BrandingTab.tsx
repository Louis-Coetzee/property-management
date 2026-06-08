'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Upload, X, Palette, Image as ImageIcon, Check, Loader2, Type } from 'lucide-react';
import MediaLibraryModal from '@/components/media-library-modal';
import { toast } from 'react-hot-toast';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#6366f1', // indigo
];

interface BrandingTabProps {
  website: {
    _id: Id<"websites">;
    name?: string;
    branding?: {
      primaryColor?: string;
      logoUrl?: string;
      faviconUrl?: string;
      logoType?: 'image' | 'text' | string;
      logoText?: string;
      logoTextColor?: string;
    } | Record<string, any>;
  };
  userId: string;
}

export function BrandingTab({ website, userId }: BrandingTabProps) {
  const [primaryColor, setPrimaryColor] = useState(website.branding?.primaryColor || PRESET_COLORS[0]);
  const [logoUrl, setLogoUrl] = useState(website.branding?.logoUrl || '');
  const [faviconUrl, setFaviconUrl] = useState(website.branding?.faviconUrl || '');
  const [logoType, setLogoType] = useState<'image' | 'text'>((website.branding?.logoType === 'text' ? 'text' : 'image'));
  const [logoText, setLogoText] = useState(website.branding?.logoText || website.name || '');
  const [logoTextColor, setLogoTextColor] = useState(website.branding?.logoTextColor || '#1e293b');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [faviconModalOpen, setFaviconModalOpen] = useState(false);

  const updateBranding = useMutation(api.websites.updateWebsiteBranding);

  // Update local state when website branding changes
  useEffect(() => {
    if (website.branding) {
      setPrimaryColor(website.branding.primaryColor || PRESET_COLORS[0]);
      setLogoUrl(website.branding.logoUrl || '');
      setFaviconUrl(website.branding.faviconUrl || '');
      setLogoType(website.branding.logoType === 'text' ? 'text' : 'image');
      setLogoText(website.branding.logoText || website.name || '');
      setLogoTextColor(website.branding.logoTextColor || '#1e293b');
    }
  }, [website.branding, website.name]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateBranding({
        userId: userId as any,
        websiteId: website._id,
        branding: {
          primaryColor,
          logoUrl: logoType === 'image' ? (logoUrl || undefined) : undefined,
          faviconUrl: faviconUrl || undefined,
          logoType,
          logoText: logoType === 'text' ? logoText : undefined,
          logoTextColor: logoType === 'text' ? logoTextColor : undefined,
        },
      });

      setSaveSuccess(true);
      toast.success('Branding settings saved successfully!', {
        duration: 3000,
        position: 'top-right',
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save branding settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save branding settings. Please try again.', {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    const currentLogoType = website.branding?.logoType === 'text' ? 'text' : 'image';
    return (
      primaryColor !== website.branding?.primaryColor ||
      logoUrl !== (website.branding?.logoUrl || '') ||
      faviconUrl !== (website.branding?.faviconUrl || '') ||
      logoType !== currentLogoType ||
      logoText !== (website.branding?.logoText || website.name || '') ||
      logoTextColor !== (website.branding?.logoTextColor || '#1e293b')
    );
  };

  return (
    <div className="space-y-8">
      {/* Primary Color Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-slate-700" />
          Primary Color
        </h3>
        <p className="text-slate-600 text-sm mb-4">
          Choose a primary color for your website. This color will be used for buttons, links, and accents.
        </p>

        {/* Color Picker */}
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-16 h-16 rounded-xl cursor-pointer border-2 border-slate-200"
          />
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm"
              placeholder="#4F46E5"
            />
          </div>
          <div className="w-16 h-16 rounded-xl border-2 border-slate-200" style={{ backgroundColor: primaryColor }} />
        </div>
      </div>

      {/* Site Logo Section */}
      <div className="border-t border-slate-200 pt-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-slate-700" />
          Site Logo
        </h3>
        <p className="text-slate-600 text-sm mb-4">
          Choose how your logo appears on your website and in all email communications.
        </p>

        {/* Logo Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Logo Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => setLogoType('image')}
              className={`flex-1 max-w-[200px] p-4 rounded-xl border-2 transition-all duration-200 ${
                logoType === 'image'
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className={`h-8 w-8 ${logoType === 'image' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`font-medium ${logoType === 'image' ? 'text-indigo-700' : 'text-slate-600'}`}>
                  Image Logo
                </span>
              </div>
            </button>
            <button
              onClick={() => setLogoType('text')}
              className={`flex-1 max-w-[200px] p-4 rounded-xl border-2 transition-all duration-200 ${
                logoType === 'text'
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Type className={`h-8 w-8 ${logoType === 'text' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`font-medium ${logoType === 'text' ? 'text-indigo-700' : 'text-slate-600'}`}>
                  Text Logo
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Image Logo Option */}
        {logoType === 'image' && (
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">
              Upload a logo image. Recommended size: 200x60px. PNG, JPG, or SVG format.
            </p>
            {logoUrl ? (
              <div className="relative inline-block">
                <div className="border-2 border-slate-200 rounded-xl p-4 bg-white">
                  <img
                    src={logoUrl}
                    alt="Site logo"
                    className="h-24 w-auto object-contain"
                  />
                </div>
                <button
                  onClick={() => setLogoUrl('')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                  aria-label="Remove logo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLogoModalOpen(true)}
                className="flex items-center gap-3 px-6 py-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                  <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">
                    Upload Logo
                  </p>
                  <p className="text-sm text-slate-500">Click to select from media library</p>
                </div>
              </button>
            )}
            {logoUrl && (
              <button
                onClick={() => setLogoModalOpen(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Change logo
              </button>
            )}
          </div>
        )}

        {/* Text Logo Option */}
        {logoType === 'text' && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-600 text-sm">
              Enter the text you want to use as your logo and choose its color.
            </p>

            {/* Logo Text Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Logo Text</label>
              <input
                type="text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                placeholder="Your Company Name"
                maxLength={50}
              />
              <p className="text-xs text-slate-500 mt-1">{logoText.length}/50 characters</p>
            </div>

            {/* Logo Text Color */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
              <div className="flex flex-wrap items-center gap-4">
                <input
                  type="color"
                  value={logoTextColor}
                  onChange={(e) => setLogoTextColor(e.target.value)}
                  className="w-16 h-12 rounded-lg cursor-pointer border-2 border-slate-200"
                />
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={logoTextColor}
                    onChange={(e) => setLogoTextColor(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm"
                    placeholder="#1E293B"
                  />
                </div>
                <div className="w-16 h-12 rounded-lg border-2 border-slate-200" style={{ backgroundColor: logoTextColor }} />
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
              <div className="border-2 border-slate-200 rounded-xl p-6 bg-white">
                <div
                  className="text-2xl font-bold text-center"
                  style={{ color: logoTextColor }}
                >
                  {logoText || 'Your Logo Text'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Site Favicon Section */}
      <div className="border-t border-slate-200 pt-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-slate-700" />
          Site Favicon
        </h3>
        <p className="text-slate-600 text-sm mb-4">
          Upload a favicon for your website. Recommended size: 32x32px or 64x64px. PNG or ICO format.
        </p>

        {faviconUrl ? (
          <div className="relative inline-block">
            <div className="border-2 border-slate-200 rounded-xl p-3 bg-white">
              <img
                src={faviconUrl}
                alt="Site favicon"
                className="h-16 w-16 object-contain"
              />
            </div>
            <button
              onClick={() => setFaviconUrl('')}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
              aria-label="Remove favicon"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setFaviconModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
              <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">
                Upload Favicon
              </p>
              <p className="text-sm text-slate-500">Click to select from media library</p>
            </div>
          </button>
        )}

        {faviconUrl && (
          <button
            onClick={() => setFaviconModalOpen(true)}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Change favicon
          </button>
        )}
      </div>

      {/* Save Button */}
      <div className="border-t border-slate-200 pt-8 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges() || isSaving}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
            hasChanges() && !isSaving
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>
        {!hasChanges() && !isSaving && (
          <span className="text-sm text-slate-500">No changes to save</span>
        )}
      </div>

      {/* Media Library Modals */}
      <MediaLibraryModal
        userId={userId}
        onSelectImage={(url) => setLogoUrl(url)}
        open={logoModalOpen}
        onOpenChange={setLogoModalOpen}
      />

      <MediaLibraryModal
        userId={userId}
        onSelectImage={(url) => setFaviconUrl(url)}
        open={faviconModalOpen}
        onOpenChange={setFaviconModalOpen}
      />
    </div>
  );
}
