'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, X, Trash2, GripVertical, Crown } from 'lucide-react';
import MediaLibraryModal from '@/components/media-library-modal';
import { Id } from '@/convex/_generated/dataModel';
import { useRootAuth } from '@/components/platform/RootAuthProvider';
import { cn } from '@/lib/utils';
import { getOptimizedImageProps } from '@/lib/cloudflare-images';

interface MultiMediaPickerProps {
  id?: string;
  name?: string;
  label?: string;
  value: string[]; // Array of URLs
  onChange: (value: string[]) => void;
  coverImageIndex?: number;
  onCoverImageChange?: (index: number) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  maxImages?: number;
}

export function MultiMediaPicker({
  id,
  name,
  label,
  value = [],
  onChange,
  coverImageIndex = 0,
  onCoverImageChange,
  placeholder = "Select images from media library",
  required = false,
  className = '',
  disabled = false,
  maxImages = 10
}: MultiMediaPickerProps) {
  const { user } = useRootAuth();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  const handleSelectFromLibrary = (urls: string[]) => {
    // Merge with existing images, avoiding duplicates
    const newImages = [...new Set([...value, ...urls])];
    // Limit to maxImages
    const limitedImages = newImages.slice(0, maxImages);
    onChange(limitedImages);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newImages = value.filter((_, index) => index !== indexToRemove);
    onChange(newImages);
    
    // Adjust cover image index if needed
    if (onCoverImageChange) {
      if (indexToRemove === coverImageIndex) {
        // If cover image was removed, set first image as cover
        onCoverImageChange(0);
      } else if (indexToRemove < coverImageIndex) {
        // If removed image was before cover image, adjust index
        onCoverImageChange(coverImageIndex - 1);
      }
    }
  };

  const handleClearAll = () => {
    onChange([]);
    if (onCoverImageChange) {
      onCoverImageChange(0);
    }
  };

  const handleSetCoverImage = (index: number) => {
    if (onCoverImageChange) {
      onCoverImageChange(index);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the entire component
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDraggedOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDraggedOverIndex(null);
      return;
    }

    const newImages = [...value];
    const draggedImage = newImages[draggedIndex];
    
    // Remove dragged item
    newImages.splice(draggedIndex, 1);
    
    // Insert at new position
    const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newImages.splice(adjustedDropIndex, 0, draggedImage);
    
    onChange(newImages);

    // Adjust cover image index if needed
    if (onCoverImageChange) {
      if (draggedIndex === coverImageIndex) {
        // Cover image was moved
        onCoverImageChange(adjustedDropIndex);
      } else if (draggedIndex < coverImageIndex && adjustedDropIndex >= coverImageIndex) {
        // Item moved from before cover to after cover
        onCoverImageChange(coverImageIndex - 1);
      } else if (draggedIndex > coverImageIndex && adjustedDropIndex <= coverImageIndex) {
        // Item moved from after cover to before cover
        onCoverImageChange(coverImageIndex + 1);
      }
    }

    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  return (
    <div className="space-y-3">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {value.length > 0 && (
            <span className="text-xs text-gray-500 ml-2">
              ({value.length}/{maxImages})
            </span>
          )}
        </Label>
      )}
      
      <div className="flex gap-2">
        {user && (
          <MediaLibraryModal
            userId={user.id as Id<"users">}
            onSelectImage={(url) => handleSelectFromLibrary([url])}
            onSelectMultipleImages={(_mediaIds, urls) => handleSelectFromLibrary(urls.filter(u => u && u.startsWith('http')))}
            selectedImages={value}
            allowMultiSelect={true}
            maxImages={maxImages}
            currentImageCount={value.length}
            contextName={label || "Listing"}
          >
            <Button
              type="button"
              variant="outline"
              disabled={disabled || value.length >= maxImages}
              className="flex items-center gap-2"
            >
              <ImagePlus className="h-4 w-4" />
              {value.length === 0 ? 'Add Images' : 'Add More Images'}
            </Button>
          </MediaLibraryModal>
        )}
        
        {value.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Cover image info */}
      {value.length > 0 && onCoverImageChange && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <Crown className="h-4 w-4 text-blue-600" />
          <span>
            <strong>Cover Image:</strong> {value[coverImageIndex] ? `Image ${coverImageIndex + 1}` : 'First image'}
          </span>
          <span className="text-xs text-gray-500">
            (Click the crown icon on any image to set it as cover)
          </span>
        </div>
      )}

      {/* Image list with previews and drag/drop */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600 mb-2">
            <GripVertical className="h-4 w-4 inline mr-1" />
            Drag images to reorder them
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {value.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  "relative group border-2 rounded-lg overflow-hidden bg-gray-900 cursor-move transition-all duration-200 aspect-[7/2]",
                  draggedIndex === index && "opacity-50 scale-95",
                  draggedOverIndex === index && draggedIndex !== index && "border-blue-400",
                  index === coverImageIndex && onCoverImageChange && "border-blue-500 ring-2 ring-blue-200",
                  !disabled && "hover:border-gray-300"
                )}
              >
                {/* Cover image - fills entire card */}
                <img
                  {...getOptimizedImageProps(imageUrl, `Image ${index + 1}`, 'public')}
                  className="absolute inset-0 w-full h-full object-cover"
                  alt={`Image ${index + 1}`}
                />

                {/* Dark gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                {/* Cover image badge */}
                {index === coverImageIndex && onCoverImageChange && (
                  <Badge className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Cover
                  </Badge>
                )}

                {/* Drag handle */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 text-white p-1 rounded backdrop-blur-sm">
                    <GripVertical className="h-4 w-4" />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Set as cover button */}
                  {onCoverImageChange && index !== coverImageIndex && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetCoverImage(index)}
                      disabled={disabled}
                      className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                      title="Set as cover image"
                    >
                      <Crown className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  
                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveImage(index)}
                    disabled={disabled}
                    className="h-7 w-7 p-0"
                    title="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {value.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
          <ImagePlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">{placeholder}</p>
          <p className="text-xs text-gray-400 mt-2">
            You can drag and drop to reorder images after adding them
          </p>
        </div>
      )}
    </div>
  );
} 