'use client';

import { useState } from 'react';
import {
  Type,
  Palette,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Settings,
  Bell,
  MessageSquare,
  Link2,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContactSectionContent, ContactFormField } from '@/types/page-builder';

interface ContactEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
  userId?: string;
  websiteId?: string;
}

const DEFAULT_FORM_FIELDS: ContactFormField[] = [
  { id: 'name', name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
  { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'john@example.com' },
  { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '+1 (555) 123-4567' },
  { id: 'message', name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'How can we help you?' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
];

export function ContactEditor({ content, onChange }: ContactEditorProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set(['name', 'email']));
  const [newRecipient, setNewRecipient] = useState('');

  const formFields: ContactFormField[] = content.formFields?.length ? content.formFields : DEFAULT_FORM_FIELDS;

  const updateContent = (updates: Partial<ContactSectionContent>) => {
    onChange({ ...content, ...updates });
  };

  const updateField = (fieldId: string, updates: Partial<ContactFormField>) => {
    const newFields = formFields.map((field) =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    updateContent({ formFields: newFields });
  };

  const addField = () => {
    const newField: ContactFormField = {
      id: `field_${Date.now()}`,
      name: `field_${formFields.length + 1}`,
      label: 'New Field',
      type: 'text',
      required: false,
      placeholder: '',
    };
    updateContent({ formFields: [...formFields, newField] });
    setExpandedFields(new Set([...expandedFields, newField.id]));
  };

  const removeField = (fieldId: string) => {
    const newFields = formFields.filter((field) => field.id !== fieldId);
    updateContent({ formFields: newFields });
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const index = formFields.findIndex((f) => f.id === fieldId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formFields.length - 1) return;

    const newFields = [...formFields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    updateContent({ formFields: newFields });
  };

  const toggleField = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  const addRecipient = () => {
    if (!newRecipient || !newRecipient.includes('@')) return;
    const currentRecipients = content.recipients || [];
    if (currentRecipients.includes(newRecipient)) return;
    updateContent({ recipients: [...currentRecipients, newRecipient] });
    setNewRecipient('');
  };

  const removeRecipient = (email: string) => {
    const newRecipients = (content.recipients || []).filter((r: string) => r !== email);
    updateContent({ recipients: newRecipients });
  };

  const addSocialLink = () => {
    const currentLinks = content.socialLinks || [];
    updateContent({
      socialLinks: [...currentLinks, { platform: 'facebook', href: '' }],
    });
  };

  const updateSocialLink = (index: number, updates: Partial<{ platform: string; href: string }>) => {
    const newLinks = [...(content.socialLinks || [])];
    newLinks[index] = { ...newLinks[index], ...updates };
    updateContent({ socialLinks: newLinks });
  };

  const removeSocialLink = (index: number) => {
    const newLinks = (content.socialLinks || []).filter((_: any, i: number) => i !== index);
    updateContent({ socialLinks: newLinks });
  };

  return (
    <div className="space-y-6">
      {/* Content Section */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Type className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Content</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Headline</label>
            <input
              type="text"
              value={content.headline || ''}
              onChange={(e) => updateContent({ headline: e.target.value })}
              placeholder="Get in Touch"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Subheadline</label>
            <input
              type="text"
              value={content.subheadline || ''}
              onChange={(e) => updateContent({ subheadline: e.target.value })}
              placeholder="We'd love to hear from you"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={content.description || ''}
              onChange={(e) => updateContent({ description: e.target.value })}
              placeholder="Have a question or want to learn more? Reach out to us."
              rows={2}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Mail className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Contact Information</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Mail className="h-3.5 w-3.5 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={content.email || ''}
              onChange={(e) => updateContent({ email: e.target.value })}
              placeholder="hello@example.com"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Phone className="h-3.5 w-3.5 inline mr-1" />
              Phone
            </label>
            <input
              type="tel"
              value={content.phone || ''}
              onChange={(e) => updateContent({ phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MapPin className="h-3.5 w-3.5 inline mr-1" />
              Address
            </label>
            <input
              type="text"
              value={content.address || ''}
              onChange={(e) => updateContent({ address: e.target.value })}
              placeholder="123 Business St, City, State 12345"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-700">Social Links</label>
            <button
              onClick={addSocialLink}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {(content.socialLinks || []).map((link: { platform: string; href: string }, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={link.platform}
                  onChange={(e) => updateSocialLink(index, { platform: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="github">GitHub</option>
                  <option value="tiktok">TikTok</option>
                </select>
                <input
                  type="url"
                  value={link.href}
                  onChange={(e) => updateSocialLink(index, { href: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => removeSocialLink(index)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Settings */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Settings className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Form Settings</h4>
        </div>

        {/* Show Form Toggle */}
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-500" />
            <div>
              <label className="text-sm font-medium text-slate-900">Show Contact Form</label>
              <p className="text-xs text-slate-500">Display the contact form on the page</p>
            </div>
          </div>
          <button
            onClick={() => updateContent({ showForm: content.showForm === false ? true : false })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              content.showForm !== false ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                content.showForm !== false ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {content.showForm !== false && (
          <>
            {/* Submit Button Text */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Submit Button Text</label>
              <input
                type="text"
                value={content.submitButtonText || ''}
                onChange={(e) => updateContent({ submitButtonText: e.target.value })}
                placeholder="Send Message"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Success Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Success Message</label>
              <textarea
                value={content.successMessage || ''}
                onChange={(e) => updateContent({ successMessage: e.target.value })}
                placeholder="Thank you for your message! We'll get back to you soon."
                rows={2}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Email Recipients */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <label className="text-sm font-medium text-slate-900">Email Recipients</label>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Email addresses that will receive form submissions
              </p>

              {/* Recipient List */}
              <div className="space-y-2 mb-3">
                {(content.recipients || []).map((email: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="flex-1 text-sm text-slate-700">{email}</span>
                    <button
                      onClick={() => removeRecipient(email)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Recipient */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                  placeholder="recipient@example.com"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addRecipient}
                  disabled={!newRecipient || !newRecipient.includes('@')}
                  className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Thank You Email */}
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-500" />
                  <label className="text-sm font-medium text-slate-900">Thank You Email</label>
                </div>
                <button
                  onClick={() => updateContent({ sendThankYouEmail: content.sendThankYouEmail ? false : true })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    content.sendThankYouEmail ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      content.sendThankYouEmail ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Send a confirmation email to the person who submitted the form
              </p>

              {content.sendThankYouEmail && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Subject</label>
                    <input
                      type="text"
                      value={content.thankYouEmailSubject || ''}
                      onChange={(e) => updateContent({ thankYouEmailSubject: e.target.value })}
                      placeholder="Thank you for contacting us!"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Message</label>
                    <textarea
                      value={content.thankYouEmailMessage || ''}
                      onChange={(e) => updateContent({ thankYouEmailMessage: e.target.value })}
                      placeholder="We've received your message and will get back to you shortly."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Form Fields */}
      {content.showForm !== false && (
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Type className="h-4 w-4 text-indigo-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Form Fields ({formFields.length})</h4>
            </div>
            <button
              onClick={addField}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Field
            </button>
          </div>

          <div className="space-y-2">
            {formFields.map((field) => (
              <div
                key={field.id}
                className={cn(
                  "border rounded-xl transition-all",
                  expandedFields.has(field.id)
                    ? "border-indigo-200 bg-white"
                    : "border-slate-200 bg-white"
                )}
              >
                {/* Field Header */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => toggleField(field.id)}
                >
                  <div className="text-slate-400 cursor-grab">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{field.label}</p>
                      {field.required && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {FIELD_TYPES.find((t) => t.value === field.type)?.label} • {field.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveField(field.id, 'up');
                      }}
                      disabled={formFields.findIndex((f) => f.id === field.id) === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveField(field.id, 'down');
                      }}
                      disabled={formFields.findIndex((f) => f.id === field.id) === formFields.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(field.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="ml-1">
                      {expandedFields.has(field.id) ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Field Content */}
                {expandedFields.has(field.id) && (
                  <div className="border-t border-slate-100 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Label</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Field Name</label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Field Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value as ContactFormField['type'] })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {FIELD_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Placeholder</label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Options for select type */}
                    {field.type === 'select' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Options (one per line)
                        </label>
                        <textarea
                          value={field.options?.join('\n') || ''}
                          onChange={(e) =>
                            updateField(field.id, {
                              options: e.target.value.split('\n').filter((o) => o.trim()),
                            })
                          }
                          rows={3}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                    )}

                    {/* Required Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {field.required ? (
                          <Eye className="h-4 w-4 text-red-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        )}
                        <div>
                          <label className="text-sm font-medium text-slate-900">Required Field</label>
                          <p className="text-xs text-slate-500">
                            {field.required ? 'User must fill this field' : 'This field is optional'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateField(field.id, { required: !field.required })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          field.required ? 'bg-red-500' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            field.required ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Styling Section */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Palette className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Styling</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={content.backgroundColor || '#ffffff'}
                onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={content.backgroundColor || '#ffffff'}
                onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={content.textColor || '#1a1a1a'}
                onChange={(e) => updateContent({ textColor: e.target.value })}
                className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={content.textColor || '#1a1a1a'}
                onChange={(e) => updateContent({ textColor: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={content.accentColor || '#6366f1'}
                onChange={(e) => updateContent({ accentColor: e.target.value })}
                className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={content.accentColor || '#6366f1'}
                onChange={(e) => updateContent({ accentColor: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">Layout</label>
          <div className="flex gap-2">
            {([
              { value: 'split', label: 'Split' },
              { value: 'centered', label: 'Centered' },
              { value: 'full', label: 'Full Width' },
            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => updateContent({ layout: option.value })}
                className={cn(
                  'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                  (content.layout || 'split') === option.value
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200'
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
