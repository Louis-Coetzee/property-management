'use client';

import React, { useState } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { X } from 'lucide-react';
import MediaLibrary from '@/components/media-library';

interface MediaLibraryModalProps {
  userId: string;
  onSelectImage: (url: string) => void;
  onSelectMultipleImages?: (mediaIds: Id<"mediaLibrary">[], urls: string[]) => void;
  selectedImages?: string[];
  allowMultiSelect?: boolean;
  maxImages?: number;
  currentImageCount?: number;
  contextName?: string;
  defaultTab?: 'images' | 'documents';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export default function MediaLibraryModal({
  userId,
  onSelectImage,
  onSelectMultipleImages,
  selectedImages = [],
  allowMultiSelect = false,
  maxImages = 10,
  currentImageCount = 0,
  contextName = "Profile",
  defaultTab = 'images',
  open: controlledOpen,
  onOpenChange,
  children
}: MediaLibraryModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <>
      {/* Trigger - clicking children opens the modal */}
      {children && (
        <div onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
          {children}
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Media Library</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Media Library Content */}
            <div className="flex-1 overflow-y-auto">
              <MediaLibrary
                userId={userId}
                onSelectImage={(url) => {
                  onSelectImage(url);
                  if (!allowMultiSelect) {
                    setOpen(false);
                  }
                }}
                onMultiSelect={onSelectMultipleImages}
                selectedImages={selectedImages}
                allowMultiSelect={allowMultiSelect}
                maxImages={maxImages}
                currentImageCount={currentImageCount}
                contextName={contextName}
                defaultTab={defaultTab}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
