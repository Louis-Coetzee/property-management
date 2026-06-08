'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Plus, FileText, Edit, Trash2, Copy, Mail, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { toast } from 'react-hot-toast';
import type { Form } from '@/types/forms';
import { useRouter } from 'next/navigation';

interface FormsListProps {
  websiteId: string;
  companyId: string;
  domain: string;
  userId: string;
  onFormSelect?: (formId: string) => void;
}

export function FormsList({ websiteId, companyId, domain, userId, onFormSelect }: FormsListProps) {
  const router = useRouter();
  const formsResult = useQuery(api.forms.getFormsByWebsite, { userId: userId as any, websiteId: websiteId as any });
  const forms = formsResult;
  const deleteFormMutation = useMutation(api.forms.deleteForm);
  const duplicateFormMutation = useMutation(api.forms.duplicateForm);

  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteForm = async () => {
    if (!formToDelete) return;

    try {
      await deleteFormMutation({
        userId: userId as any,
        formId: formToDelete._id as any,
      });
      toast.success('Form deleted successfully');
      setShowDeleteModal(false);
      setFormToDelete(null);
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete form');
    }
  };

  const handleDuplicateForm = async (formId: string) => {
    try {
      await duplicateFormMutation({
        userId: userId as any,
        formId: formId as any,
      });
      toast.success('Form duplicated successfully');
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate form');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Forms</h2>
          <p className="text-sm text-slate-600 mt-1">
            {forms?.length || 0} {forms?.length === 1 ? 'form' : 'forms'}
          </p>
        </div>
        <button
          onClick={() => router.push(`/${domain}/companies/${companyId}/websites/${websiteId}/forms/new`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium shadow-lg shadow-slate-900/20"
        >
          <Plus className="h-4 w-4" />
          Create Form
        </button>
      </div>

      {/* Forms Grid */}
      {forms && forms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <FormCard
              key={form._id}
              form={form as Form}
              onSelect={() => onFormSelect?.(form._id)}
              onEdit={() => router.push(`/${domain}/companies/${companyId}/websites/${websiteId}/forms/${form._id}`)}
              onDelete={() => {
                setFormToDelete(form as Form);
                setShowDeleteModal(true);
              }}
              onDuplicate={() => handleDuplicateForm(form._id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onCreateNew={() => router.push(`/${domain}/companies/${companyId}/websites/${websiteId}/forms/new`)} />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Form"
        message={`Are you sure you want to delete "${formToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Form"
        cancelText="Cancel"
        type="error"
        onConfirm={handleDeleteForm}
        onClose={() => {
          setShowDeleteModal(false);
          setFormToDelete(null);
        }}
      />
    </div>
  );
}

interface FormCardProps {
  form: Form;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

function FormCard({ form, onSelect, onEdit, onDelete, onDuplicate }: FormCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const fieldCount = form.fields.length;
  const recipientCount = form.recipients.length;

  return (
    <div className="group bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-lg transition-all duration-200">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{form.name}</h3>
              {form.description && (
                <p className="text-sm text-slate-600 mt-0.5 line-clamp-1">{form.description}</p>
              )}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50">
                <button
                  onClick={() => {
                    onEdit?.();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Form
                </button>
                <button
                  onClick={() => {
                    onDuplicate?.();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    onDelete?.();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span>{fieldCount} {fieldCount === 1 ? 'field' : 'fields'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            <span>{recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'}</span>
          </div>
        </div>

        <button
          onClick={onSelect}
          className="mt-4 w-full px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
        >
          View Submissions
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <FileText className="h-10 w-10 text-indigo-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">No forms yet</h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        Create forms to collect information from your website visitors. You can add multiple fields and send submissions to multiple recipients.
      </p>
      <button
        onClick={onCreateNew}
        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
      >
        <Plus className="h-5 w-5" />
        Create Your First Form
      </button>
    </div>
  );
}
