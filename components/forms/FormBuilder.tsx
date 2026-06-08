'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Plus, X, GripVertical, Mail, Trash2, Eye, EyeOff, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import type { Form, FormField, FormFieldType } from '@/types/forms';
import { convertConvexForm } from '@/lib/forms';

interface FormBuilderProps {
  websiteId: string;
  userId: string;
  formId?: string;
  onSave?: (formId: string) => void;
  onCancel?: () => void;
}

// Professional color presets for form theming
const COLOR_PRESETS = [
  { name: 'Indigo', value: '#6366f1', class: 'from-indigo-500 to-indigo-600' },
  { name: 'Purple', value: '#9333ea', class: 'from-purple-500 to-purple-600' },
  { name: 'Blue', value: '#3b82f6', class: 'from-blue-500 to-blue-600' },
  { name: 'Cyan', value: '#06b6d4', class: 'from-cyan-500 to-cyan-600' },
  { name: 'Teal', value: '#14b8a6', class: 'from-teal-500 to-teal-600' },
  { name: 'Green', value: '#22c55e', class: 'from-green-500 to-green-600' },
  { name: 'Emerald', value: '#10b981', class: 'from-emerald-500 to-emerald-600' },
  { name: 'Rose', value: '#f43f5e', class: 'from-rose-500 to-rose-600' },
  { name: 'Pink', value: '#ec4899', class: 'from-pink-500 to-pink-600' },
  { name: 'Orange', value: '#f97316', class: 'from-orange-500 to-orange-600' },
  { name: 'Amber', value: '#f59e0b', class: 'from-amber-500 to-amber-600' },
  { name: 'Slate', value: '#64748b', class: 'from-slate-500 to-slate-600' },
];

const FIELD_TYPES: Array<{ value: FormFieldType; label: string; icon: string; needsOptions: boolean }> = [
  { value: 'text', label: 'Text', icon: 'T', needsOptions: false },
  { value: 'textarea', label: 'Text Area', icon: '¶', needsOptions: false },
  { value: 'email', label: 'Email', icon: '@', needsOptions: false },
  { value: 'number', label: 'Number', icon: '#', needsOptions: false },
  { value: 'tel', label: 'Phone', icon: '📞', needsOptions: false },
  { value: 'url', label: 'URL', icon: '🔗', needsOptions: false },
  { value: 'date', label: 'Date', icon: '📅', needsOptions: false },
  { value: 'time', label: 'Time', icon: '🕐', needsOptions: false },
  { value: 'datetime-local', label: 'Date & Time', icon: '📆', needsOptions: false },
  { value: 'radio', label: 'Radio', icon: '⦿', needsOptions: true },
  { value: 'checkbox', label: 'Checkbox', icon: '☑', needsOptions: true },
  { value: 'select', label: 'Dropdown', icon: '▼', needsOptions: true },
  { value: 'multiselect', label: 'Multi-select', icon: '☰', needsOptions: true },
  { value: 'file', label: 'File Upload', icon: '📎', needsOptions: false },
  { value: 'email_confirmation', label: 'Email Confirmation', icon: '✉', needsOptions: false },
];

export function FormBuilder({ websiteId, userId, formId, onSave, onCancel }: FormBuilderProps) {
  const isEditing = !!formId;

  const existingFormResult = useQuery(api.forms.getFormById, formId ? { userId: userId as any, formId: formId as any } : 'skip');
  const existingForm = existingFormResult ? convertConvexForm(existingFormResult) : null;

  const createFormMutation = useMutation(api.forms.createForm);
  const updateFormMutation = useMutation(api.forms.updateForm);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [] as FormField[],
    recipients: [] as string[],
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    errorMessage: 'An error occurred. Please try again.',
    themeColor: '#6366f1',
  });

  const [newRecipient, setNewRecipient] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showFieldMenu, setShowFieldMenu] = useState(false);

  // Track if we've already loaded the form data to prevent overwriting user changes
  const hasLoadedForm = useRef(false);

  // Reset the loaded flag when formId changes
  useEffect(() => {
    hasLoadedForm.current = false;
  }, [formId]);

  // Load existing form data - only once when the form is first loaded
  useEffect(() => {
    if (existingForm && !hasLoadedForm.current) {
      hasLoadedForm.current = true;
      setFormData({
        name: existingForm.name,
        description: existingForm.description || '',
        fields: existingForm.fields,
        recipients: existingForm.recipients,
        submitButtonText: existingForm.submitButtonText || 'Submit',
        successMessage: existingForm.successMessage || 'Thank you for your submission!',
        errorMessage: existingForm.errorMessage || 'An error occurred. Please try again.',
        themeColor: existingForm.themeColor || '#6366f1',
      });
    }
  }, [existingForm]);

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: '',
      type,
      required: false,
      options: FIELD_TYPES.find(ft => ft.value === type)?.needsOptions ? [''] : [],
    };

    setFormData({
      ...formData,
      fields: [...formData.fields, newField],
    });
    setShowFieldMenu(false);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormData({
      ...formData,
      fields: formData.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    });
  };

  const removeField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter(field => field.id !== fieldId),
    });
  };

  const addRecipient = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newRecipient.trim()) return;
    if (!emailRegex.test(newRecipient)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (formData.recipients.includes(newRecipient)) {
      toast.error('This email is already added');
      return;
    }

    setFormData({
      ...formData,
      recipients: [...formData.recipients, newRecipient],
    });
    setNewRecipient('');
  };

  const removeRecipient = (email: string) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter(r => r !== email),
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a form name');
      return;
    }

    if (formData.fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    if (formData.recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    // Validate fields
    for (const field of formData.fields) {
      if (!field.label.trim()) {
        toast.error('Please fill in all field labels');
        return;
      }
      if (['radio', 'checkbox', 'select', 'multiselect'].includes(field.type)) {
        if (!field.options || field.options.length === 0 || field.options.every(o => !o.trim())) {
          toast.error(`Please add options for the "${field.label}" field`);
          return;
        }
      }
    }

    setIsSaving(true);

    try {
      if (isEditing && formId) {
        await updateFormMutation({
          userId: userId as any,
          formId: formId as any,
          ...formData,
        });
        toast.success('Form updated successfully');
      } else {
        const newFormId = await createFormMutation({
          userId: userId as any,
          websiteId: websiteId as any,
          ...formData,
        });
        toast.success('Form created successfully');
        onSave?.(newFormId);
        return;
      }

      onSave?.(formId);
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditing ? 'Edit Form' : 'Create New Form'}
        </h1>
        <p className="text-slate-600 mt-1">
          {isEditing ? 'Update your form settings and fields' : 'Create a custom form to collect information'}
        </p>
      </div>

      {/* Form Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Form Settings</h2>

        <div className="space-y-4">
          {/* Form Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Form Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contact Form"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell visitors what this form is for..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Theme Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-slate-500" />
                Theme Color
              </span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Choose the accent color for the form modal and buttons
            </p>

            {/* Color Presets */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mb-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, themeColor: preset.value })}
                  className={cn(
                    'relative w-full aspect-square rounded-lg transition-all duration-200 hover:scale-105',
                    formData.themeColor === preset.value
                      ? 'ring-2 ring-offset-2 ring-slate-900 scale-105 shadow-lg'
                      : 'hover:shadow-md'
                  )}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {formData.themeColor === preset.value && (
                    <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color Picker */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="relative">
                <input
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                />
                <div
                  className="absolute inset-0 rounded pointer-events-none border border-slate-300"
                  style={{ backgroundColor: formData.themeColor }}
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.themeColor}
                  onChange={(e) => {
                    const hexColor = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
                      setFormData({ ...formData, themeColor: hexColor });
                    }
                  }}
                  placeholder="#6366f1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Custom hex color (e.g., #6366f1)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Form Fields</h2>
          <div className="relative">
            <button
              onClick={() => setShowFieldMenu(!showFieldMenu)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>

            {showFieldMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {FIELD_TYPES.map((fieldType) => (
                  <button
                    key={fieldType.value}
                    onClick={() => addField(fieldType.value)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-3"
                  >
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">
                      {fieldType.icon}
                    </span>
                    <span>{fieldType.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {formData.fields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
            <p className="text-slate-500 mb-3">No fields added yet</p>
            <button
              onClick={() => setShowFieldMenu(!showFieldMenu)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Your First Field
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.fields.map((field, index) => (
              <FieldEditor
                key={field.id}
                field={field}
                index={index}
                onUpdate={(updates) => updateField(field.id, updates)}
                onRemove={() => removeField(field.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Email Recipients */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Email Recipients <span className="text-red-500">*</span>
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Form submissions will be sent to these email addresses
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="email"
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
            placeholder="recipient@example.com"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={addRecipient}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {formData.recipients.length > 0 && (
          <div className="space-y-2">
            {formData.recipients.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg group"
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{email}</span>
                </div>
                <button
                  onClick={() => removeRecipient(email)}
                  className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Button & Messages */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Button & Messages</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Submit Button Text
            </label>
            <input
              type="text"
              value={formData.submitButtonText}
              onChange={(e) => setFormData({ ...formData, submitButtonText: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Success Message
            </label>
            <input
              type="text"
              value={formData.successMessage}
              onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Error Message
            </label>
            <input
              type="text"
              value={formData.errorMessage}
              onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : isEditing ? 'Update Form' : 'Create Form'}
        </button>
      </div>
    </div>
  );
}

interface FieldEditorProps {
  field: FormField;
  index: number;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
}

function FieldEditor({ field, index, onUpdate, onRemove }: FieldEditorProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const needsOptions = ['radio', 'checkbox', 'select', 'multiselect'].includes(field.type);
  const isEmailConfirmation = field.type === 'email_confirmation';

  return (
    <div className="border border-slate-200 rounded-lg p-4 group hover:border-slate-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-2 cursor-grab text-slate-400">
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={field.type}
              onChange={(e) => onUpdate({ type: e.target.value as FormFieldType })}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Field label"
              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            <button
              onClick={() => onUpdate({ required: !field.required })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                field.required
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {field.required ? 'Required' : 'Optional'}
            </button>

            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Email Confirmation Configuration */}
          {isEmailConfirmation && (
            <div className="space-y-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Email Confirmation Settings</span>
                <button
                  onClick={() => setShowEmailConfig(!showEmailConfig)}
                  className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1"
                >
                  {showEmailConfig ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showEmailConfig ? 'Hide' : 'Show'}
                </button>
              </div>

              {showEmailConfig && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Title
                    </label>
                    <input
                      type="text"
                      value={field.options?.[0] || ''}
                      onChange={(e) => {
                        const newOptions = [...(field.options || []), ''];
                        newOptions[0] = e.target.value;
                        onUpdate({ options: newOptions.filter(o => o !== '') });
                      }}
                      placeholder="e.g., Thanks for your submission!"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Subtitle
                    </label>
                    <input
                      type="text"
                      value={field.options?.[1] || ''}
                      onChange={(e) => {
                        const newOptions = [...(field.options || []), '', ''];
                        newOptions[1] = e.target.value;
                        onUpdate({ options: newOptions.filter(o => o !== '') });
                      }}
                      placeholder="e.g., We'll get back to you shortly."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Message
                    </label>
                    <textarea
                      value={field.options?.[2] || ''}
                      onChange={(e) => {
                        const newOptions = [...(field.options || []), '', '', ''];
                        newOptions[2] = e.target.value;
                        onUpdate({ options: newOptions.filter(o => o !== '') });
                      }}
                      placeholder="e.g., This is a confirmation that we received your submission."
                      rows={2}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    These settings will be included in the email sent to recipients when this form is submitted.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Placeholder */}
          {!needsOptions && !isEmailConfirmation && (
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Placeholder text (optional)"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          )}

          {/* Options for radio/checkbox/select */}
          {needsOptions && (
            <div>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 mb-2"
              >
                {showOptions ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showOptions ? 'Hide' : 'Show'} options ({field.options?.length || 0})
              </button>

              {showOptions && (
                <div className="space-y-2">
                  {field.options?.map((option, optIndex) => (
                    <div key={optIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(field.options || [])];
                          newOptions[optIndex] = e.target.value;
                          onUpdate({ options: newOptions });
                        }}
                        placeholder={`Option ${optIndex + 1}`}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => {
                          const newOptions = field.options?.filter((_, i) => i !== optIndex);
                          onUpdate({ options: newOptions });
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => onUpdate({ options: [...(field.options || []), ''] })}
                    className="w-full px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-slate-400 hover:text-slate-700 transition-colors"
                  >
                    + Add Option
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
