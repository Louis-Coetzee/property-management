'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Plus, X, Tag, Edit2, Trash2 } from 'lucide-react';

interface MediaCategoryManagerProps {
  userId: string;
  selectedCategories?: string[];
  onCategoryChange?: (categories: string[]) => void;
}

export default function MediaCategoryManager({
  userId,
  selectedCategories = [],
  onCategoryChange
}: MediaCategoryManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    isDeleting: boolean;
    categoryIds: Id<"mediaCategories">[];
    categoryNames: string[];
  }>({
    isOpen: false,
    isDeleting: false,
    categoryIds: [],
    categoryNames: []
  });

  // Query for user's categories
  const categories = useQuery(api.media.getMediaCategories, { userId: userId as Id<"users"> }) || [];

  // Mutations
  const createCategory = useMutation(api.media.createMediaCategory);
  const updateCategory = useMutation(api.media.updateMediaCategory);
  const deleteCategory = useMutation(api.media.deleteMediaCategory);
  const deleteMultipleCategories = useMutation(api.media.deleteMultipleMediaCategories);

  // Handle creating a new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      await createCategory({
        userId: userId as Id<"users">,
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      });

      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCreateForm(false);

      // Refresh categories
      if (onCategoryChange) {
        onCategoryChange([...selectedCategories, newCategoryName.trim()]);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle updating a category
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;

    setIsUpdating(true);
    try {
      await updateCategory({
        categoryId: editingCategory as Id<"mediaCategories">,
        name: editCategoryName.trim(),
        description: editCategoryDescription.trim() || undefined,
        requestingUserId: userId as Id<"users">,
      });

      setEditingCategory(null);
      setEditCategoryName('');
      setEditCategoryDescription('');

      // Refresh categories
      if (onCategoryChange) {
        onCategoryChange([...selectedCategories, editCategoryName.trim()]);
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if a category is selected
  const isCategorySelected = (categoryName: string) => {
    return selectedCategories.includes(categoryName);
  };

  // Toggle category selection
  const toggleCategory = (categoryName: string) => {
    if (!onCategoryChange) return;

    if (isCategorySelected(categoryName)) {
      onCategoryChange(selectedCategories.filter(c => c !== categoryName));
    } else {
      onCategoryChange([...selectedCategories, categoryName]);
    }
  };

  // Handle delete button click for selected categories
  const handleDeleteSelectedClick = () => {
    if (selectedCategories.length === 0) return;

    // Find category IDs for selected category names
    const selectedCategoryIds = categories
      .filter(cat => selectedCategories.includes(cat.name))
      .map(cat => cat._id);

    setDeleteModal({
      isOpen: true,
      isDeleting: false,
      categoryIds: selectedCategoryIds,
      categoryNames: [...selectedCategories]
    });
  };

  // Handle delete button click for a single category
  const handleDeleteCategoryClick = (categoryId: Id<"mediaCategories">, categoryName: string) => {
    setDeleteModal({
      isOpen: true,
      isDeleting: false,
      categoryIds: [categoryId],
      categoryNames: [categoryName]
    });
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (deleteModal.categoryIds.length === 0) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      if (deleteModal.categoryIds.length === 1) {
        await deleteCategory({
          categoryId: deleteModal.categoryIds[0],
          requestingUserId: userId as Id<"users">
        });
      } else {
        await deleteMultipleCategories({
          categoryIds: deleteModal.categoryIds,
          requestingUserId: userId as Id<"users">
        });
      }

      // Clear selected categories
      if (onCategoryChange) {
        const remainingCategories = selectedCategories.filter(
          cat => !deleteModal.categoryNames.includes(cat)
        );
        onCategoryChange(remainingCategories);
      }

      // Close modal
      setDeleteModal({
        isOpen: false,
        isDeleting: false,
        categoryIds: [],
        categoryNames: []
      });
    } catch (error) {
      console.error('Failed to delete categories:', error);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({
        isOpen: false,
        isDeleting: false,
        categoryIds: [],
        categoryNames: []
      });
    }
  };

  if (categories === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <div className="h-8 w-8 animate-spin text-blue-600" />
        <span className="text-sm text-gray-600 font-medium">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          <p className="text-xs text-gray-500">Organize your media files</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-3 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="h-4 w-4" />
            New Category
          </button>
        </div>
        <div className="flex items-center gap-3">
          {selectedCategories.length > 0 && (
            <>
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                {selectedCategories.length} selected
              </span>
              <button
                onClick={handleDeleteSelectedClick}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 pr-1">
          {categories.map((category) => (
            <div
              key={category._id}
              className={`relative group p-3 rounded-lg border transition-all cursor-pointer overflow-hidden ${
                isCategorySelected(category.name)
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-200 hover:border-blue-400'
              }`}
              onClick={() => toggleCategory(category.name)}
            >
              {/* Selected Badge */}
              {isCategorySelected(category.name) && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="w-2.5 h-2.5 accent-blue-600 pointer-events-none"
                    />
                  </div>
                </div>
              )}

              {!isCategorySelected(category.name) && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-sm group-hover:border-blue-400 transition-colors flex-shrink-0" />
                </div>
              )}

              {/* Category Content */}
              <div className="pr-6">
                {/* Category Name */}
                <h4 className={`text-sm font-medium truncate ${
                  isCategorySelected(category.name)
                    ? 'text-blue-700'
                    : 'text-gray-900'
                }`}>
                  {category.name}
                </h4>

                {/* Description */}
                {category.description && (
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5" title={category.description}>
                    {category.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-gray-100/60">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(category._id);
                      setEditCategoryName(category.name);
                      setEditCategoryDescription(category.description || '');
                    }}
                    className="text-xs text-gray-500 hover:text-blue-600 transition-colors p-0.5"
                    title="Edit category"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategoryClick(category._id, category.name);
                    }}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors p-0.5"
                    title="Delete category"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
            <Tag className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
          <p className="text-sm text-gray-500 text-center max-w-xs">
            Create your first category to organize your media files.
          </p>
        </div>
      )}

      {/* Create Category Form */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">New Category</h3>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Product Photos"
                  maxLength={50}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newCategoryName.length}/50 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Brief description of this category"
                  rows={3}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  disabled={isCreating}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || isCreating}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                >
                  {isCreating ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Form */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Edit2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Category</h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="Category name"
                  maxLength={50}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isUpdating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editCategoryName.length}/50 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={editCategoryDescription}
                  onChange={(e) => setEditCategoryDescription(e.target.value)}
                  placeholder="Brief description of this category"
                  rows={3}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCategory}
                  disabled={!editCategoryName.trim() || isUpdating}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                >
                  {isUpdating ? 'Updating...' : 'Update Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete Categories</h3>
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
                      Are you sure you want to delete {deleteModal.categoryIds.length} categor{deleteModal.categoryIds.length > 1 ? 'ies' : 'y'}?
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800 leading-relaxed">
                    This action cannot be undone. The categories will be permanently removed from your library.
                    {deleteModal.categoryIds.length > 1 && ' Any media items using only these categories will be updated.'}
                  </p>
                </div>

                {deleteModal.categoryNames.length > 0 && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs font-semibold text-gray-900 mb-2">
                      {deleteModal.categoryIds.length} categor{deleteModal.categoryIds.length > 1 ? 'ies' : 'y'} to be deleted:
                    </p>
                    <ul className="space-y-1">
                      {deleteModal.categoryNames.map((name) => (
                        <li key={name} className="text-xs text-gray-700 flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full" />
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
                {deleteModal.isDeleting ? 'Deleting...' : `Delete ${deleteModal.categoryIds.length > 1 ? 'All' : 'Category'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
