'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Image as ImageIcon, Type, Upload, X, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaLibraryModal from '@/components/media-library-modal';

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#6366f1', '#1e293b', '#0f172a',
];

interface CompanyBrandingSettingsTabProps {
  companyId: string;
  userId: string;
  company: any;
}

export default function CompanyBrandingSettingsTab({ companyId, userId, company }: CompanyBrandingSettingsTabProps) {
  const [primaryColor, setPrimaryColor] = useState(PRESET_COLORS[0]);
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [logoType, setLogoType] = useState<'image' | 'text'>('image');
  const [logoText, setLogoText] = useState('');
  const [logoTextColor, setLogoTextColor] = useState('#1e293b');
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [faviconModalOpen, setFaviconModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateBranding = useMutation(api.companies.updateCompanyBranding);

  useEffect(() => {
    if (company?.branding) {
      setPrimaryColor(company.branding.primaryColor || PRESET_COLORS[0]);
      setLogoUrl(company.branding.logoUrl || '');
      setFaviconUrl(company.branding.faviconUrl || '');
      setLogoType(company.branding.logoType === 'text' ? 'text' : 'image');
      setLogoText(company.branding.logoText || company.name || '');
      setLogoTextColor(company.branding.logoTextColor || '#1e293b');
    }
  }, [company]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const brandingData = {
        primaryColor,
        logoUrl: logoType === 'image' ? (logoUrl || undefined) : undefined,
        faviconUrl: faviconUrl || undefined,
        logoType,
        logoText: logoType === 'text' ? logoText : undefined,
        logoTextColor: logoType === 'text' ? logoTextColor : undefined,
      };
      await updateBranding({
        userId: userId as any,
        companyId: companyId as any,
        branding: brandingData,
      });
      setSaveSuccess(true);
      toast.success('Branding saved!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Branding Settings</h2>
        <p className="text-slate-600 text-sm">Customize your company's visual identity.</p>
      </div>

      <div className="border-t border-slate-200 pt-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-violet-600" />
            Primary Color
          </h3>
          <p className="text-slate-600 text-xs mb-3">Choose a primary color.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setPrimaryColor(color)}
                className={`w-8 h-8 rounded-lg border-2 ${primaryColor === color ? 'border-violet-600 ring-2 ring-violet-200' : 'border-slate-200'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-200"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm"
            />
            <div className="w-12 h-12 rounded-lg border-2 border-slate-200" style={{ backgroundColor: primaryColor }} />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-violet-600" />
            Company Logo
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Logo Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setLogoType('image')}
                className={`flex-1 max-w-[160px] p-3 rounded-xl border-2 ${logoType === 'image' ? 'border-violet-500 bg-violet-50' : 'border-slate-200'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon className={`h-6 w-6 ${logoType === 'image' ? 'text-violet-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium">Image Logo</span>
                </div>
              </button>
              <button
                onClick={() => setLogoType('text')}
                className={`flex-1 max-w-[160px] p-3 rounded-xl border-2 ${logoType === 'text' ? 'border-violet-500 bg-violet-50' : 'border-slate-200'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Type className={`h-6 w-6 ${logoType === 'text' ? 'text-violet-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium">Text Logo</span>
                </div>
              </button>
            </div>
          </div>

          {logoType === 'image' && (
            <div className="space-y-3">
              <p className="text-slate-600 text-xs">Recommended size: 200x60px.</p>
              {logoUrl ? (
                <div className="relative inline-block">
                  <div className="border-2 border-slate-200 rounded-xl p-3 bg-white">
                    <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                  </div>
                  <button
                    onClick={() => setLogoUrl('')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLogoModalOpen(true)}
                  className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-violet-500 hover:bg-violet-50/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Upload Logo</p>
                    <p className="text-xs text-slate-500">Click to select</p>
                  </div>
                </button>
              )}
            </div>
          )}

          {logoType === 'text' && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo Text</label>
                <input
                  type="text"
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Text Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={logoTextColor}
                    onChange={(e) => setLogoTextColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
                  />
                  <input
                    type="text"
                    value={logoTextColor}
                    onChange={(e) => setLogoTextColor(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preview</label>
                <div className="border-2 border-slate-200 rounded-lg p-4 bg-white">
                  <div className="text-xl font-bold text-center" style={{ color: logoTextColor }}>
                    {logoText || 'Your Logo Text'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-violet-600" />
            Favicon
          </h3>
          <p className="text-slate-600 text-xs mb-3">Recommended: 32x32px.</p>
          {faviconUrl ? (
            <div className="relative inline-block">
              <div className="border-2 border-slate-200 rounded-xl p-2 bg-white">
                <img src={faviconUrl} alt="Favicon" className="h-12 w-12 object-contain" />
              </div>
              <button onClick={() => setFaviconUrl('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setFaviconModalOpen(true)}
              className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-violet-500"
            >
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="text-sm">Upload Favicon</span>
            </button>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50"
        >
          {saveSuccess ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Changes'}</>}
        </button>
      </div>

      <MediaLibraryModal
        userId={userId}
        onSelectImage={(url) => { setLogoUrl(url); setLogoModalOpen(false); }}
        open={logoModalOpen}
        onOpenChange={setLogoModalOpen}
      />
      <MediaLibraryModal
        userId={userId}
        onSelectImage={(url) => { setFaviconUrl(url); setFaviconModalOpen(false); }}
        open={faviconModalOpen}
        onOpenChange={setFaviconModalOpen}
      />
    </div>
  );
}