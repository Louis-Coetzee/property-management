'use client';

import { useState } from 'react';
import { Type, Image as ImageIcon, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import MediaLibraryModal from '@/components/media-library-modal';

interface NavbarLogoEditorProps {
  logoType?: 'text' | 'image';
  logo?: string;
  brandName?: string;
  onChange: (updates: { logoType?: 'text' | 'image'; logo?: string; brandName?: string }) => void;
  userId?: string;
}

export function NavbarLogoEditor({
  logoType = 'text',
  logo = '',
  brandName = '',
  onChange,
  userId,
}: NavbarLogoEditorProps) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const handleLogoTypeChange = (type: 'text' | 'image') => {
    // When switching to text, clear the logo image
    // When switching to image, set the logoType (logo will be set by image selection)
    const updates: { logoType?: 'text' | 'image'; logo?: string } = { logoType: type };
    if (type === 'text') {
      updates.logo = '';
    }
    onChange(updates);
  };

  const handleSelectImage = (url: string) => {
    // When image is selected, also set logoType to 'image'
    onChange({ logo: url, logoType: 'image' });
  };

  const handleRemoveLogo = () => {
    // When logo is removed, keep logoType as 'image' but clear the URL
    onChange({ logo: '' });
  };

  const isImageType = logoType === 'image';

  return (
    <div className="space-y-4">
      {/* Logo Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Logo Type
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleLogoTypeChange('text')}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center justify-center gap-2',
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
              'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center justify-center gap-2',
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

      {/* Text Logo - Brand Name */}
      {!isImageType && (
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Brand Name <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={brandName || ''}
            onChange={(e) => onChange({ brandName: e.target.value })}
            placeholder="Leave empty for no logo text"
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            maxLength={50}
          />
          <p className="text-xs text-slate-500 mt-1">
            {brandName?.length || 0}/50 • Leave empty to display no logo
          </p>
        </div>
      )}

      {/* Image Logo */}
      {isImageType && (
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Logo Image
          </label>

          {logo ? (
            // Logo preview
            <div className="relative group">
              <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl bg-slate-50">
                <img
                  src={logo}
                  alt="Logo preview"
                  className="h-12 w-auto object-contain"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    Current logo
                  </p>
                  <p className="text-xs text-slate-500 truncate">{logo}</p>
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
            // Upload button
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

      {/* Media Library Modal */}
      {userId && (
        <MediaLibraryModal
          userId={userId}
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelectImage={handleSelectImage}
          contextName="Navbar Logo"
          allowMultiSelect={false}
        />
      )}
    </div>
  );
}
