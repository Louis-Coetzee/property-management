'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, X } from 'lucide-react';
import MediaLibraryModal from '@/components/media-library-modal';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/app/context/AuthContext';

export interface MediaPickerProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  userId?: Id<"users">;
}

export function MediaPicker({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "Enter image URL or select from media library",
  required = false,
  className = '',
  disabled = false,
  showPreview = true,
  userId
}: MediaPickerProps) {
  const { user } = useAuth();

  const handleSelectFromLibrary = (url: string) => {
    onChange(url);
  };

  const handleClearValue = () => {
    onChange('');
  };

  // Show preview when there's a value and showPreview is enabled
  const shouldShowPreview = showPreview && value && value.startsWith('http');

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id={id}
            name={name}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={className}
          />
        </div>
        
        <div className="flex gap-1">
          {user && (
            <MediaLibraryModal
              userId={userId || user.id as Id<"users">}
              onSelectImage={handleSelectFromLibrary}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                className="shrink-0"
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
            </MediaLibraryModal>
          )}
          
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearValue}
              disabled={disabled}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Image preview */}
      {shouldShowPreview && (
        <div className="mt-2">
          <div className="relative inline-block">
            <img
              src={value}
              alt="Preview"
              className="max-w-32 max-h-32 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 