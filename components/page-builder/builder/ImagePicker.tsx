'use client';

import { useState } from 'react';
import { ImageIcon, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import MediaLibraryModal from '@/components/media-library-modal';

interface ImagePickerProps {
  imageUrl?: string;
  imageAlt?: string;
  onChange: (url: string) => void;
  onAltChange?: (alt: string) => void;
  userId?: string;
  label?: string;
  showAltField?: boolean;
}

export function ImagePicker({
  imageUrl = '',
  imageAlt = '',
  onChange,
  onAltChange,
  userId,
  label = 'Image',
  showAltField = true,
}: ImagePickerProps) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [urlInput, setUrlInput] = useState(imageUrl);

  const handleSelectImage = (url: string) => {
    onChange(url);
    setUrlInput(url);
  };

  const handleRemoveImage = () => {
    onChange('');
    setUrlInput('');
  };

  const handleUrlBlur = () => {
    onChange(urlInput);
  };

  return (
    <div className="space-y-4">
      {/* Image URL/Media Library Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          {label}
        </label>

        {imageUrl ? (
          // Image preview
          <div className="relative group">
            <div className="flex items-start gap-4 p-3 border border-slate-200 rounded-xl bg-slate-50">
              <img
                src={imageUrl}
                alt={imageAlt || 'Preview'}
                className="h-20 w-20 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2" /%3E%3Ccircle cx="8.5" cy="8.5" r="1.5" /%3E%3Cpolyline points="21 15 16 10 5 21" /%3E%3C/svg%3E';
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  Current image
                </p>
                <p className="text-xs text-slate-500 truncate">{imageUrl}</p>
                {imageAlt && (
                  <p className="text-xs text-slate-400 mt-1">
                    Alt: {imageAlt}
                  </p>
                )}
              </div>
              <button
                onClick={handleRemoveImage}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          // Image selection options
          <div className="space-y-3">
            {/* Media Library Button */}
            {userId && (
              <button
                onClick={() => setShowMediaLibrary(true)}
                className="w-full px-4 py-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2"
              >
                <Upload className="h-6 w-6 text-slate-400" />
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
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="Or paste image URL..."
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Alt Text Field */}
      {showAltField && onAltChange && (
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Alt Text
          </label>
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="Describe the image for accessibility"
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            maxLength={200}
          />
          <p className="text-xs text-slate-500 mt-1">
            Helps with SEO and screen readers
          </p>
        </div>
      )}

      {/* Media Library Modal */}
      {userId && (
        <MediaLibraryModal
          userId={userId}
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelectImage={handleSelectImage}
          contextName={`About ${label}`}
          allowMultiSelect={false}
        />
      )}
    </div>
  );
}
