'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isDeleting: boolean;
  usageLocations?: Array<{
    table: string;
    id: string;
    field: string;
    title?: string;
    description?: string;
  }>;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isDeleting,
  usageLocations = []
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const hasUsageLocations = usageLocations && usageLocations.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-900">Delete Image</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {hasUsageLocations ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Image Currently in Use
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    This image is currently being used in the following locations:
                  </p>
                </div>
              </div>

              <div className="space-y-2 ml-8">
                {usageLocations.map((usage, index) => (
                  <div key={index} className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <div className="text-sm">
                      <div className="font-medium text-amber-900">
                        {usage.title || usage.id}
                      </div>
                      <div className="text-amber-700">
                        {usage.description} ({usage.table}.{usage.field})
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 ml-8">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> Deleting this image will break these references. 
                  Are you sure you want to proceed?
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Confirm Deletion
                  </p>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete <strong>{itemName}</strong>?
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  This action cannot be undone. The image will be permanently removed from both 
                  the database and Cloudflare storage.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`px-3 py-1 text-sm text-white rounded disabled:opacity-50 ${
              hasUsageLocations
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isDeleting ? 'Deleting...' : hasUsageLocations ? 'Force Delete' : 'Delete Image'}
          </button>
        </div>
      </div>
    </div>
  );
}