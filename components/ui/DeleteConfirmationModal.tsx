'use client';

import React from 'react';
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  itemSubtitle?: string;
  description?: string;
  isDeleting: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  itemName,
  itemSubtitle,
  description,
  isDeleting,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const isWarning = variant === 'warning';
  const accentColor = isWarning ? 'amber' : 'red';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 sm:px-6 pt-6 pb-2">
          <div
            className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-${accentColor}-100`}
          >
            <AlertTriangle className={`h-6 w-6 text-${accentColor}-600`} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 text-center">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-500 text-center">
            {description || 'This action cannot be undone. Please review the details below before proceeding.'}
          </p>
        </div>

        <div className={`mx-5 sm:mx-6 my-4 rounded-xl border p-4 bg-${accentColor}-50 border-${accentColor}-200`}>
          <p className={`text-sm font-semibold text-${accentColor}-900`}>
            {itemName}
          </p>
          {itemSubtitle && (
            <p className={`text-xs mt-0.5 text-${accentColor}-700`}>
              {itemSubtitle}
            </p>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${
              isWarning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
