---
name: fix-multimedia-picker
description: Fix multi-image selection and modal closing behavior in the MultiMediaPicker/MediaLibraryModal flow
source: auto-skill
extracted_at: '2026-06-09T18:29:37.780Z'
---

## Problem

When editing a listing, users could not reliably add multiple images:
1. The media library modal did not close after clicking "Add to Listing", making users think nothing happened
2. The "Add to Listing" button showed incorrect capacity limits because `currentImageCount` and `contextName` were not passed through
3. Clicking images in multi-select mode didn't properly toggle checkboxes

## Root cause

The `MultiMediaPicker` → `MediaLibraryModal` → `MediaLibrary` component chain had three gaps:

1. **Modal not closing**: `MediaLibraryModal` passed `onSelectMultipleImages` directly to `MediaLibrary`'s `onMultiSelect` prop, but `MediaLibrary` never closed the modal after applying the selection
2. **Missing props**: `MultiMediaPicker` did not pass `maxImages`, `currentImageCount`, or `contextName` to `MediaLibraryModal`, so `MediaLibrary`'s `canAddMoreImages()` always calculated `remainingSlots = 10 - 0 = 10` regardless of existing images
3. **Click handling**: `MediaLibrary`'s `handleMediaItemSelect` always toggled multi-select, even when `allowMultiSelect` was false, preventing single-click selection from working properly

## Fix

### 1. media-library-modal.tsx — wrap onMultiSelect to close modal

```tsx
const handleMultiSelect = (mediaIds: Id<"mediaLibrary">[], urls: string[]) => {
  if (onSelectMultipleImages) {
    onSelectMultipleImages(mediaIds, urls);
  }
  setOpen(false); // Close modal after selection is applied
};

// Pass wrapper instead of raw prop
<MediaLibrary onMultiSelect={handleMultiSelect} ... />
```

### 2. multi-media-picker.tsx — pass through capacity props

```tsx
<MediaLibraryModal
  ...
  maxImages={maxImages}
  currentImageCount={value.length}
  contextName={label || "Listing"}
>
```

### 3. media-library.tsx — distinguish multi-select vs single-select click behavior

```tsx
const handleMediaItemSelect = (url: string, mediaId: Id<"mediaLibrary">) => {
  if (allowMultiSelect) {
    toggleMultiSelect(mediaId); // Toggle checkbox only
  } else {
    onSelectImage(url); // Single select — applies immediately
  }
};
```

## Component flow

```
MultiMediaPicker (value, onChange)
  └─ MediaLibraryModal (onSelectImage, onSelectMultipleImages, maxImages, currentImageCount, contextName)
      └─ MediaLibrary (onSelectImage, onMultiSelect, allowMultiSelect)
```

When user clicks "Add to Listing" in MediaLibrary:
1. `applyMultiSelection()` calls `onMultiSelect(mediaIds, urls)`
2. `MediaLibraryModal.handleMultiSelect` receives it, calls `onSelectMultipleImages`, then closes modal
3. `MultiMediaPicker.handleSelectFromLibrary` merges new URLs with existing `value` via `[...new Set([...value, ...urls])]`
4. `onChange(mergedImages)` updates parent form state
