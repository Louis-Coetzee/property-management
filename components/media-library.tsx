'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Loader2, Search as SearchIcon, Image as ImageIcon, Check, RefreshCw, Trash2, Plus, CheckSquare, Square, Tag, FileText, File, Download, X, Filter, CloudUpload, Upload } from 'lucide-react';
import MediaCategoryManager from './media-category-manager';
import ConfirmationModal from './confirmation-modal';
import { cn } from '@/lib/utils';

interface MediaLibraryProps {
  userId: string;
  onSelectImage: (url: string) => void;
  selectedImages?: string[];
  allowMultiSelect?: boolean;
  onMultiSelect?: (mediaIds: Id<"mediaLibrary">[], urls: string[]) => void;
  maxImages?: number;
  currentImageCount?: number;
  contextName?: string;
  defaultTab?: 'images' | 'documents';
}

// Helper function to get file extension icon
function getFileIcon(filename: string, fileType: string) {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

  if (fileType.startsWith('image/')) {
    return <ImageIcon className="h-8 w-8 text-blue-500" />;
  }

  switch (extension) {
    case '.pdf':
      return <FileText className="h-8 w-8 text-red-500" />;
    case '.doc':
    case '.docx':
      return <FileText className="h-8 w-8 text-blue-600" />;
    case '.xls':
    case '.xlsx':
      return <FileText className="h-8 w-8 text-green-600" />;
    case '.ppt':
    case '.pptx':
      return <FileText className="h-8 w-8 text-orange-600" />;
    case '.txt':
      return <FileText className="h-8 w-8 text-gray-600" />;
    case '.zip':
    case '.rar':
    case '.7z':
      return <File className="h-8 w-8 text-purple-600" />;
    default:
      return <File className="h-8 w-8 text-gray-500" />;
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function MediaLibrary({
  userId,
  onSelectImage,
  selectedImages = [],
  allowMultiSelect = false,
  onMultiSelect,
  maxImages = 10,
  currentImageCount = 0,
  contextName = "Profile",
  defaultTab = 'images'
}: MediaLibraryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [multiSelectedItems, setMultiSelectedItems] = useState<Id<"mediaLibrary">[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [assigningCategories, setAssigningCategories] = useState(false);
  const [categoriesToAssign, setCategoriesToAssign] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'images' | 'documents' | 'upload' | 'categories'>(defaultTab);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedUploadCategories, setSelectedUploadCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    mediaId: Id<"mediaLibrary"> | null;
    mediaIds: Id<"mediaLibrary">[];
    filename: string;
    isDeleting: boolean;
    isBulkDelete: boolean;
    usageLocations?: Array<{
      table: string;
      id: string;
      field: string;
      title?: string;
      description?: string;
    }>;
  }>({
    isOpen: false,
    mediaId: null,
    mediaIds: [],
    filename: '',
    isDeleting: false,
    isBulkDelete: false,
    usageLocations: []
  });

  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    details: string[];
    actions?: Array<{label: string; onClick: () => void}>;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    details: [],
    actions: []
  });

  // Query for user's media items based on active tab
  const mediaItems = useQuery(
    activeTab === 'images' ? api.media.getImagesByUser : api.media.getDocumentsByUser,
    { userId: userId as Id<"users">, refreshKey }
  );

  // Query for user's categories
  const userCategories = useQuery(api.media.getMediaCategories, { userId: userId as Id<"users"> }) || [];

  // Function to force a refresh of the media library
  const forceRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  // Set up initial load and refresh events
  useEffect(() => {
    forceRefresh();

    const handleMediaUpload = () => {
      forceRefresh();
    };

    document.addEventListener('media-upload-completed', handleMediaUpload);

    return () => {
      document.removeEventListener('media-upload-completed', handleMediaUpload);
    };
  }, [userId, forceRefresh]);

  // Clear multi-select when allowMultiSelect changes
  useEffect(() => {
    if (!allowMultiSelect) {
      setMultiSelectedItems([]);
    }
  }, [allowMultiSelect]);

  // Clear selection when switching tabs
  useEffect(() => {
    setMultiSelectedItems([]);
    setSelectedCategories([]);
  }, [activeTab]);

  // Mutations
  const applyMultipleCategories = useMutation(api.media.applyCategoriesToMultipleItems);

  // Check if we can add more images to the current context
  const canAddMoreImages = (selectedCount: number) => {
    if (!allowMultiSelect || !onMultiSelect) return false;
    const remainingSlots = maxImages - currentImageCount;
    return remainingSlots >= selectedCount;
  };

  // Extract all categories from media items and user-defined categories
  const allCategories = React.useMemo(() => {
    const categories = new Set<string>();

    // Add user-defined categories first
    if (userCategories && userCategories.length > 0) {
      userCategories.forEach(cat => {
        const trimmed = cat.name?.trim();
        if (trimmed) {
          categories.add(trimmed);
        }
      });
    }

    // Also add categories from existing media items
    if (mediaItems) {
      mediaItems.forEach(item => {
        if (item.categories && item.categories.length > 0) {
          item.categories.forEach(category => {
            // Trim whitespace and add to Set for deduplication
            const trimmed = category.trim();
            if (trimmed) {
              categories.add(trimmed);
            }
          });
        }
      });
    }

    return Array.from(categories).sort();
  }, [mediaItems, userCategories]);

  // Filter media items based on search query and selected categories
  const filteredMedia = React.useMemo(() => {
    if (!mediaItems) return [];

    return mediaItems.filter(item => {
      const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 ||
        (item.categories && selectedCategories.every(cat => item.categories?.includes?.(cat) || false));

      return matchesSearch && matchesCategory;
    });
  }, [mediaItems, searchQuery, selectedCategories]);

  // Check if an image is selected
  const isSelected = (url: string) => {
    return selectedImages.includes(url);
  };

  // Check if an item is multi-selected
  const isMultiSelected = (id: Id<"mediaLibrary">) => {
    return multiSelectedItems.includes(id);
  };

  // Toggle multi-selection for an item
  const toggleMultiSelect = (id: Id<"mediaLibrary">) => {
    if (isMultiSelected(id)) {
      setMultiSelectedItems(prev => prev.filter(itemId => itemId !== id));
    } else {
      setMultiSelectedItems(prev => [...prev, id]);
    }
  };

  // Handle selecting all items
  const handleSelectAll = () => {
    if (filteredMedia.length === multiSelectedItems.length) {
      setMultiSelectedItems([]);
    } else {
      setMultiSelectedItems(filteredMedia.map(item => item._id));
    }
  };

  // Apply multi-selected items
  const applyMultiSelection = () => {
    if (!onMultiSelect || multiSelectedItems.length === 0) return;

    if (!canAddMoreImages(multiSelectedItems.length)) {
      const remainingSlots = maxImages - currentImageCount;
      console.error(`Can only add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''} to ${contextName}`);
      return;
    }

    const urls = multiSelectedItems
      .map(id => mediaItems?.find(item => item._id === id)?.url)
      .filter(Boolean) as string[];

    onMultiSelect(multiSelectedItems, urls);
    setMultiSelectedItems([]);

    console.log(`Added ${urls.length} image${urls.length > 1 ? 's' : ''} to ${contextName}`);
  };

  // Handle image/document selection
  const handleMediaItemSelect = (url: string, mediaId: Id<"mediaLibrary">) => {
    if (allowMultiSelect) {
      // Toggle selection in multi-select mode
      toggleMultiSelect(mediaId);
    } else {
      // Single select mode - select and close
      onSelectImage(url);
    }
  };

  // Handle delete button click - open confirmation modal
  const handleDeleteClick = (mediaId: Id<"mediaLibrary">, filename: string) => {
    setDeleteModal({
      isOpen: true,
      mediaId,
      mediaIds: [],
      filename,
      isDeleting: false,
      isBulkDelete: false,
      usageLocations: []
    });
  };

  // Handle bulk delete button click
  const handleBulkDeleteClick = () => {
    if (multiSelectedItems.length === 0) return;

    setDeleteModal({
      isOpen: true,
      mediaId: null,
      mediaIds: [...multiSelectedItems],
      filename: `${multiSelectedItems.length} selected item${multiSelectedItems.length > 1 ? 's' : ''}`,
      isDeleting: false,
      isBulkDelete: true,
      usageLocations: []
    });
  };

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (deleteModal.isBulkDelete) {
      if (deleteModal.mediaIds.length === 0) {
        console.error('❌ No media IDs found for bulk deletion');
        return;
      }
      await handleBulkDelete();
    } else {
      if (!deleteModal.mediaId) {
        console.error('❌ No media ID found for deletion');
        return;
      }
      await handleSingleDelete();
    }
  };

  // Handle single image deletion
  const handleSingleDelete = async () => {
    console.log('🗑️ Starting single deletion for media ID:', deleteModal.mediaId);
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mediaId: deleteModal.mediaId,
          forceDelete: false
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.usageLocations) {
          setDeleteModal({
            isOpen: false,
            mediaId: null,
            mediaIds: [],
            filename: '',
            isDeleting: false,
            isBulkDelete: false,
            usageLocations: []
          });

          const usageDetails = result.usageLocations.map((usage: { description: string; title?: string; id: string }) =>
            `${usage.description}: ${usage.title || usage.id}`
          );

          setResultModal({
            isOpen: true,
            type: 'error',
            title: 'Cannot Delete Item',
            message: 'This item is currently being used in the application and cannot be deleted.',
            details: usageDetails
          });
          return;
        }
        throw new Error(result.error || 'Failed to delete item');
      }

      setDeleteModal({
        isOpen: false,
        mediaId: null,
        mediaIds: [],
        filename: '',
        isDeleting: false,
        isBulkDelete: false,
        usageLocations: []
      });

      forceRefresh();

    } catch (error: unknown) {
      console.error('❌ Failed to delete item:', error);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Deletion Failed',
        message: `Failed to delete item: ${errorMessage}`,
        details: []
      });
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    console.log('🗑️ Starting bulk deletion for media IDs:', deleteModal.mediaIds);
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < deleteModal.mediaIds.length; i++) {
        const mediaId = deleteModal.mediaIds[i];
        try {
          const response = await fetch('/api/delete-image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ mediaId })
          });

          const result = await response.json();

          if (!response.ok) {
            if (result.usageLocations) {
              const usageInfo = result.usageLocations.map((usage: { description: string; title?: string; id: string }) =>
                `${usage.description}: ${usage.title || usage.id}`
              ).join(', ');
              throw new Error(`In use (${usageInfo})`);
            }
            throw new Error(result.error || `Failed to delete (${response.status})`);
          }

          successCount++;

          if (i < deleteModal.mediaIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          errorCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Item ${i + 1}: ${errorMsg}`);
        }
      }

      if (successCount > 0 && errorCount === 0) {
        setResultModal({
          isOpen: true,
          type: 'success',
          title: 'Deletion Successful',
          message: `Successfully deleted ${successCount} item${successCount > 1 ? 's' : ''}.`,
          details: []
        });
      } else if (successCount > 0 && errorCount > 0) {
        setResultModal({
          isOpen: true,
          type: 'info',
          title: 'Partial Success',
          message: `${successCount} item${successCount > 1 ? 's' : ''} deleted successfully, but ${errorCount} failed.`,
          details: errors
        });
      } else {
        setResultModal({
          isOpen: true,
          type: 'error',
          title: 'Deletion Failed',
          message: 'Failed to delete all selected items.',
          details: errors
        });
      }

      setMultiSelectedItems([]);
      setDeleteModal({
        isOpen: false,
        mediaId: null,
        mediaIds: [],
        filename: '',
        isDeleting: false,
        isBulkDelete: false,
        usageLocations: []
      });

      forceRefresh();

    } catch (error: unknown) {
      console.error('❌ Bulk delete failed:', error);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Bulk Deletion Failed',
        message: `Bulk delete operation failed: ${errorMessage}`,
        details: []
      });
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({
        isOpen: false,
        mediaId: null,
        mediaIds: [],
        filename: '',
        isDeleting: false,
        isBulkDelete: false,
        usageLocations: []
      });
    }
  };

  // Handle file input change
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(true);

    try {
      // Upload each file individually
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        // Add selected categories as JSON
        formData.append('categories', JSON.stringify(selectedUploadCategories));

        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${files[i].name}`);
        }
      }

      // Show success message
      const uploadedImages: string[] = [];
      const uploadedDocuments: string[] = [];

      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          uploadedImages.push(file.name);
        } else {
          uploadedDocuments.push(file.name);
        }
      });

      const actions: Array<{label: string; onClick: () => void}> = [];

      if (uploadedImages.length > 0) {
        actions.push({
          label: 'View Images',
          onClick: () => {
            setActiveTab('images');
            setResultModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      }

      if (uploadedDocuments.length > 0) {
        actions.push({
          label: 'View Documents',
          onClick: () => {
            setActiveTab('documents');
            setResultModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      }

      setResultModal({
        isOpen: true,
        type: 'success',
        title: 'Upload Complete',
        message: `${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`,
        details: Array.from(files).map(f => f.name),
        actions
      });

      // Dispatch event to notify media library
      document.dispatchEvent(new CustomEvent('media-upload-completed'));

      forceRefresh();

      // Clear selected categories after upload
      setSelectedUploadCategories([]);
    } catch (error) {
      console.error('Upload failed:', error);
      // Show error message
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'An error occurred during upload',
        details: []
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await handleFileSelect(files);
    }
  };

  // Handle click to browse
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  // Handle category assignment to selected items
  const handleAssignCategories = async () => {
    if (multiSelectedItems.length === 0 || categoriesToAssign.length === 0) return;

    setAssigningCategories(true);
    try {
      await applyMultipleCategories({
        mediaIds: multiSelectedItems,
        categoryNames: categoriesToAssign,
        operation: "add",
        requestingUserId: userId as Id<"users">,
      });

      console.log(`Assigned ${categoriesToAssign.length} categories to ${multiSelectedItems.length} items`);
      forceRefresh();
      setCategoriesToAssign([]);
      setShowCategoryManager(false);
    } catch (error) {
      console.error('Failed to assign categories:', error);
    } finally {
      setAssigningCategories(false);
    }
  };

  if (!mediaItems) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="text-sm text-gray-600 font-medium">Loading media library...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6" ref={containerRef}>
      {/* Header - Tabs */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab('images')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
              "max-[600px]:gap-1 max-[600px]:px-2 max-[600px]:py-1.5 max-[600px]:text-xs",
              activeTab === 'images'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            )}
          >
            <ImageIcon className="h-4 w-4 max-[600px]:h-3 max-[600px]:w-3" />
            <span>Images</span>
            {mediaItems.filter(m => m.fileType.startsWith('image/')).length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">{mediaItems.filter(m => m.fileType.startsWith('image/')).length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
              "max-[600px]:gap-1 max-[600px]:px-2 max-[600px]:py-1.5 max-[600px]:text-xs",
              activeTab === 'documents'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            )}
          >
            <FileText className="h-4 w-4 max-[600px]:h-3 max-[600px]:w-3" />
            <span>Documents</span>
            {mediaItems.filter(m => !m.fileType.startsWith('image/')).length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">{mediaItems.filter(m => !m.fileType.startsWith('image/')).length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
              "max-[600px]:gap-1 max-[600px]:px-2 max-[600px]:py-1.5 max-[600px]:text-xs",
              activeTab === 'upload'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            )}
          >
            <CloudUpload className="h-4 w-4 max-[600px]:h-3 max-[600px]:w-3" />
            <span>Upload</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
              "max-[600px]:gap-1 max-[600px]:px-2 max-[600px]:py-1.5 max-[600px]:text-xs",
              activeTab === 'categories'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            )}
          >
            <Tag className="h-4 w-4 max-[600px]:h-3 max-[600px]:w-3" />
            <span>Categories</span>
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="space-y-3">
        {activeTab !== 'upload' && (
          <>
            {/* Search Bar */}
            <div className="relative">
          <input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>
          </>
        )}

        {/* Category Assignment - Only on Upload tab */}
        {activeTab === 'upload' && allCategories.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">
                  Assign Categories {selectedUploadCategories.length > 0 && `(${selectedUploadCategories.length})`}
                </h4>
              </div>
              <button
                onClick={() => setSelectedUploadCategories([])}
                className="text-xs text-orange-500 hover:text-orange-600 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    if (selectedUploadCategories.includes(category)) {
                      setSelectedUploadCategories(prev => prev.filter(c => c !== category));
                    } else {
                      setSelectedUploadCategories(prev => [...prev, category]);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                    selectedUploadCategories.includes(category)
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            {selectedUploadCategories.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Select categories to assign to your uploads (optional)
              </p>
            )}
          </div>
        )}

        {/* Action Buttons Row - Hide on Upload tab */}
        {activeTab !== 'upload' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select All/Deselect All - Only on Categories tab */}
            {activeTab === 'categories' && userCategories.length > 0 && (
              <>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    title="Deselect all categories"
                  >
                    Deselect All
                  </button>
                )}
                <button
                  onClick={() => setSelectedCategories(userCategories.map(c => c.name))}
                  className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  title="Select all categories"
                >
                  Select All
                </button>
              </>
            )}

            {/* Media Select All/Deselect All - Only on Images and Documents tabs */}
            {(activeTab === 'images' || activeTab === 'documents') && filteredMedia.length > 0 && (
              <>
                {multiSelectedItems.length > 0 && (
                  <button
                    onClick={() => setMultiSelectedItems([])}
                    className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    title="Deselect all items"
                  >
                    Deselect All
                  </button>
                )}
                <button
                  onClick={() => setMultiSelectedItems(filteredMedia.map(item => item._id))}
                  className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  title="Select all items"
                >
                  Select All
                </button>
              </>
            )}

            {/* Refresh Button */}
            <button
              onClick={forceRefresh}
              disabled={isRefreshing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
                "bg-green-600 text-white hover:bg-green-700",
                isRefreshing && "opacity-70 cursor-wait"
              )}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Selection Actions - Desktop */}
          {multiSelectedItems.length > 0 && (
            <>
              <span className="hidden sm:inline px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg">
                {multiSelectedItems.length} selected
              </span>

              {multiSelectedItems.length > 0 && (
                <>
                  {/* Apply button for multi-select contexts */}
                  {allowMultiSelect && onMultiSelect && (
                    <button
                      onClick={applyMultiSelection}
                      disabled={!canAddMoreImages(multiSelectedItems.length)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
                        canAddMoreImages(multiSelectedItems.length)
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      )}
                      title={
                        canAddMoreImages(multiSelectedItems.length)
                          ? `Add ${multiSelectedItems.length} items to ${contextName}`
                          : `Can only add ${maxImages - currentImageCount} more`
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Add to {contextName}</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  )}

                  {/* Apply button for regular select mode */}
                  {!allowMultiSelect && (
                    <button
                      onClick={() => {
                        const firstSelectedId = multiSelectedItems[0];
                        const firstSelectedItem = mediaItems?.find(item => item._id === firstSelectedId);
                        if (firstSelectedItem) onSelectImage(firstSelectedItem.url);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg shadow-md shadow-blue-200 hover:bg-blue-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Apply</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowCategoryManager(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg shadow-md shadow-green-200 hover:bg-green-700"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Categories</span>
                  </button>

                  <button
                    onClick={handleBulkDeleteClick}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg shadow-md shadow-red-200 hover:bg-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </>
          )}
          </div>
        )}

        {/* Mobile Selection Actions - Hide on Upload tab */}
        {activeTab !== 'upload' && multiSelectedItems.length > 0 && (
          <div className="lg:hidden flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-xs font-semibold text-blue-900">
              {multiSelectedItems.length} selected
            </span>
            <div className="flex-1" />
            {multiSelectedItems.length > 0 && (
              <>
                {allowMultiSelect && onMultiSelect && (
                  <button
                    onClick={applyMultiSelection}
                    disabled={!canAddMoreImages(multiSelectedItems.length)}
                    className={cn(
                      "px-3 py-2 text-xs font-semibold rounded-lg",
                      canAddMoreImages(multiSelectedItems.length)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    Add All
                  </button>
                )}
                {!allowMultiSelect && (
                  <button
                    onClick={() => {
                      const firstSelectedId = multiSelectedItems[0];
                      const firstSelectedItem = mediaItems?.find(item => item._id === firstSelectedId);
                      if (firstSelectedItem) onSelectImage(firstSelectedItem.url);
                    }}
                    className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg"
                  >
                    Apply
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Tags - Only for Images and Documents tabs */}
      {allCategories.length > 0 && (activeTab === 'images' || activeTab === 'documents') && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 font-medium">Filter by:</span>
          {allCategories.map(category => (
            <button
              key={category}
              onClick={() => {
                if (selectedCategories.includes(category)) {
                  setSelectedCategories(prev => prev.filter(c => c !== category));
                } else {
                  setSelectedCategories(prev => [...prev, category]);
                }
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                selectedCategories.includes(category)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {category}
            </button>
          ))}
          {selectedCategories.length > 0 && (
            <button
              onClick={() => setSelectedCategories([])}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Upload Tab Content - Upload media */}
      {activeTab === 'upload' && (
        <div className="w-full max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* Upload Dropzone */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            className={cn(
              "flex flex-col items-center justify-center py-16 px-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200",
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            )}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {uploadingFiles ? (
              <>
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4 rounded-full">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Uploading...</h3>
                <p className="text-sm text-gray-600 text-center">
                  Please wait while your files are being uploaded.
                </p>
                {selectedUploadCategories.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2 text-center">
                    Will be assigned to: {selectedUploadCategories.join(', ')}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className={cn(
                  "w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4 rounded-full transition-all duration-200",
                  isDragging && "scale-110"
                )}>
                  <CloudUpload className={cn("h-10 w-10 text-blue-600", isDragging && "animate-bounce")} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragging ? 'Drop files here' : 'Upload Media'}
                </h3>
                <p className="text-sm text-gray-600 max-w-md text-center">
                  {isDragging
                    ? 'Release to upload your files'
                    : 'Drag and drop files here or click to browse and upload your media files.'}
                </p>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Supports: Images, PDFs, Documents, Archives
                </p>
                {selectedUploadCategories.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                    <Tag className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">
                    Will assign to: {selectedUploadCategories.length > 1 ? selectedUploadCategories.slice(0, 2).join(', ') + (selectedUploadCategories.length > 2 ? ` +${selectedUploadCategories.length - 2}` : '') : selectedUploadCategories[0]}
                  </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab Content - Manage categories */}
      {activeTab === 'categories' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <MediaCategoryManager
              userId={userId}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
            />
          </div>
        </>
      )}

      {/* Media Grid - Only for Images and Documents tabs */}
      {(activeTab === 'images' || activeTab === 'documents') && (
        <>
          {filteredMedia.length > 0 ? (
            <div className="max-h-[50vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
            {filteredMedia.map((item) => (
              <div
                key={item._id}
                className={cn(
                  "group relative bg-white rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                  "border border-gray-200 hover:border-blue-300 hover:shadow-md",
                  isSelected(item.url) && "ring-2 ring-blue-500 ring-offset-1",
                  isMultiSelected(item._id) && "ring-2 ring-green-500 ring-offset-1"
                )}
                onClick={() => handleMediaItemSelect(item.url, item._id)}
              >
                {/* Media Content */}
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative">
                  {activeTab === 'images' ? (
                    <img
                      src={item.url}
                      alt={item.settings?.alt || item.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJMMTEgMTRMMTUgMTBNMjEgMTJDMjEgMTYuOTcwNiAxNi45NzA2IDIxIDEyIDIxQzcuMDI5NDQgMjEgMyAxNi45NzA2IDMgMTJDMyA3LjAyOTQ0IDcuMDI5NDQgMyAxMiAzQzE2Ljk3MDYgMyAyMSA3LjAyOTQ0IDIxIDEyWiIgc3Ryb2tlPSIjOTMzNTZCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                      }}
                    />
                  ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3">
                    <div className="flex flex-col items-center justify-center">
                      {getFileIcon(item.filename, item.fileType)}
                      <div className="text-xs font-medium text-center mt-2 text-gray-700 line-clamp-2 max-w-full break-words">
                        {item.filename}
                      </div>
                    </div>

                    <a
                      href={item.url}
                      download={item.filename}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-2 right-2 p-2 bg-white rounded-lg shadow-sm text-blue-600 hover:text-blue-700 hover:shadow-md transition-all"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                )}

                {/* Selection Checkbox */}
                {isMultiSelected(item._id) ? (
                  <div className="absolute top-2 left-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-md border-2 border-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-2 left-2">
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-md flex-shrink-0" />
                  </div>
                )}

                {/* Selected Badge */}
                {isSelected(item.url) && (
                  <div className="absolute top-2 right-2">
                    <div className="p-1.5 bg-blue-600 rounded-lg shadow-sm">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(item._id, item.filename);
                    }}
                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-red-600 hover:text-red-700 hover:shadow-md transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Info Section */}
              <div className="p-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-900 truncate" title={item.filename}>
                  {item.filename}
                </p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500">
                    {formatFileSize(item.fileSize)}
                  </p>
                  {item.categories && item.categories.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      {Array.from(new Set(item.categories)).slice(0, 2).map(category => (
                        <span key={category} className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {category}
                        </span>
                      ))}
                      {item.categories.length > 2 && (
                        <span className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          +{item.categories.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
            {activeTab === 'images' ? (
              <ImageIcon className="h-8 w-8 text-gray-400" />
            ) : (
              <FileText className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeTab} found
          </h3>
          <button
            onClick={() => setActiveTab('upload')}
            className="flex items-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-xl transition-colors shadow-lg"
          >
            <Upload className="h-5 w-5" />
            Upload {activeTab === 'images' ? 'Images' : 'Documents'}
          </button>
        </div>
      )}
      </>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-200">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Assign Categories</h3>
              </div>
              <button
                onClick={() => {
                  setShowCategoryManager(false);
                  setCategoriesToAssign([]);
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 max-h-[50vh]">
              <p className="text-sm text-gray-600 mb-3">
                Select categories to assign to <span className="font-semibold text-gray-900">{multiSelectedItems.length}</span> selected item{multiSelectedItems.length > 1 ? 's' : ''}:
              </p>
              <MediaCategoryManager
                userId={userId}
                selectedCategories={categoriesToAssign}
                onCategoryChange={setCategoriesToAssign}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{categoriesToAssign.length}</span> categories selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCategoryManager(false);
                    setCategoriesToAssign([]);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignCategories}
                  disabled={categoriesToAssign.length === 0 || assigningCategories}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-200"
                >
                  {assigningCategories ? 'Assigning...' : 'Assign Categories'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete {activeTab === 'images' ? 'Item' : 'Document'}</h3>
              </div>
              <button
                onClick={closeDeleteModal}
                disabled={deleteModal.isDeleting}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Confirm Deletion
                    </p>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteModal.filename}</span>?
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800 leading-relaxed">
                    This action cannot be undone. The item will be permanently removed from both the database and cloud storage.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={closeDeleteModal}
                disabled={deleteModal.isDeleting}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteModal.isDeleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-200"
              >
                {deleteModal.isDeleting ? 'Deleting...' : `Delete ${activeTab === 'images' ? 'Item' : 'Document'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal for operation feedback */}
      <ConfirmationModal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
        title={resultModal.title}
        message={resultModal.message}
        type={resultModal.type}
        details={resultModal.details}
        actions={resultModal.actions}
      />
    </div>
  );
}
