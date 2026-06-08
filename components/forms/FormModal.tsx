'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, User, Phone, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Form, FormField, FormFieldType } from '@/types/forms';
import { convertConvexForm } from '@/lib/forms';

interface FormModalProps {
  form: Form;
  isOpen: boolean;
  onClose: () => void;
  // Context for tracking where the form was submitted from
  sourcePage?: string;
  vehicleId?: string;
  vehicleName?: string;
  // Vehicle data for EasyQuotes integration
  vehicleData?: {
    make?: string;
    model?: string;
    year?: number;
    reference?: string;
    vin?: string;
    condition?: 'new' | 'used';
  };
}

// Helper function to create a lighter shade of the theme color
const getLighterShade = (hexColor: string, percent: number): string => {
  const num = parseInt(hexColor.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
};

// Helper function to create a darker shade of the theme color
const getDarkerShade = (hexColor: string, percent: number): string => {
  const num = parseInt(hexColor.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 +
    (R > 0 ? R : 0) * 0x10000 +
    (G > 0 ? G : 0) * 0x100 +
    (B > 0 ? B : 0)
  ).toString(16).slice(1);
};

// Console logging utility for EasyQuotes
const logEasyQuotes = (level: 'info' | 'success' | 'error', message: string, data?: any) => {
  const prefix = '[EasyQuotes]';
  const style = {
    info: 'color: #6366f1; font-weight: bold',
    success: 'color: #10b981; font-weight: bold',
    error: 'color: #ef4444; font-weight: bold',
  };

  console.log(`%c${prefix} ${message.toUpperCase()}`, style[level], data || '');
};

export function FormModal({ form, isOpen, onClose, sourcePage, vehicleId, vehicleName, vehicleData }: FormModalProps) {
  const submitForm = useMutation(api.forms.submitForm);

  // Check if EasyQuotes is enabled for this form (skip as this is a public form without auth)
  const easyQuotesConfig = useQuery(api.forms.getEasyQuotesConfigForForm, 'skip');

  // Convert Convex form to our Form type
  const typedForm = convertConvexForm(form);

  // Get theme color or default to indigo
  const themeColor = typedForm.themeColor || '#6366f1';
  const themeColorLight = getLighterShade(themeColor, 15);
  const themeColorDark = getDarkerShade(themeColor, 10);

  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Animation state
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Reset form when modal opens with animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger fade-in animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      setFormData({});
      setSubmitStatus('idle');
      setErrorMessage('');
      // Prevent body scroll without shifting content
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      setIsVisible(false);
      // Wait for fade-out animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, 200);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const validateField = (field: FormField): { valid: boolean; error?: string } => {
    const value = formData[field.id];

    // Required validation
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return { valid: false, error: 'This field is required' };
    }

    // Type-specific validation
    if (value) {
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value as string)) {
            return { valid: false, error: 'Please enter a valid email address' };
          }
          break;

        case 'tel':
          const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
          if (!phoneRegex.test(value as string)) {
            return { valid: false, error: 'Please enter a valid phone number' };
          }
          break;

        case 'url':
          try {
            new URL(value as string);
          } catch {
            return { valid: false, error: 'Please enter a valid URL' };
          }
          break;

        case 'number':
          if (isNaN(Number(value))) {
            return { valid: false, error: 'Please enter a valid number' };
          }
          break;

        default:
          break;
      }

      // Custom validation
      if (field.validation) {
        if (field.validation.min && String(value).length < field.validation.min) {
          return { valid: false, error: `Minimum length is ${field.validation.min}` };
        }
        if (field.validation.max && String(value).length > field.validation.max) {
          return { valid: false, error: `Maximum length is ${field.validation.max}` };
        }
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value as string)) {
            return { valid: false, error: 'Invalid format' };
          }
        }
      }
    }

    return { valid: true };
  };

  const validateForm = (): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    for (const field of typedForm.fields) {
      // Skip email_confirmation fields - they're for configuration only
      if (field.type === 'email_confirmation') {
        continue;
      }

      const validation = validateField(field);
      if (!validation.valid) {
        errors[field.id] = validation.error || 'Invalid value';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.valid) {
      setErrorMessage('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Prepare submission data
      const submissionData = typedForm.fields.map(field => {
        const value = formData[field.id];
        let stringValue = '';
        if (Array.isArray(value)) {
          stringValue = value.join(', ');
        } else if (typeof value === 'string') {
          stringValue = value;
        }
        return {
          fieldId: field.id,
          fieldLabel: field.label,
          value: stringValue,
        };
      });

      await submitForm({
        formId: typedForm._id as any,
        data: submissionData,
        ipAddress: '', // Could be populated by server
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        sourcePage: sourcePage || (typeof window !== 'undefined' ? window.location.pathname : undefined),
        vehicleId: vehicleId as any,
        vehicleName: vehicleName,
      });

      // Submit to EasyQuotes if enabled
      if (easyQuotesConfig?.enabled) {
        logEasyQuotes('info', 'Form has EasyQuotes enabled, submitting lead...', {
          formId: typedForm._id,
          mode: easyQuotesConfig.mode,
        });

        try {
          const easyQuotesResponse = await fetch('/api/easyquotes/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              formData: submissionData,
              websiteId: form.websiteId,
              formId: typedForm._id,
              mode: easyQuotesConfig.mode || 'test',
              vehicleData: vehicleData,
              externalLeadId: `${typedForm._id}-${Date.now()}`,
            }),
          });

          const easyQuotesResult = await easyQuotesResponse.json();

          if (easyQuotesResult.success) {
            logEasyQuotes('success', 'Lead submitted successfully to EasySystems!', {
              subId: easyQuotesResult.subId,
              message: easyQuotesResult.message,
              mode: easyQuotesConfig.mode,
            });
          } else {
            logEasyQuotes('error', 'Failed to submit lead to EasySystems', {
              error: easyQuotesResult.error,
              message: easyQuotesResult.message,
              mode: easyQuotesConfig.mode,
            });
          }
        } catch (easyQuotesError) {
          logEasyQuotes('error', 'Error submitting to EasyQuotes', {
            error: easyQuotesError instanceof Error ? easyQuotesError.message : 'Unknown error',
          });
        }
      } else {
        logEasyQuotes('info', 'EasyQuotes not enabled for this form', {
          formId: typedForm._id,
        });
      }

      setSubmitStatus('success');

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : typedForm.errorMessage || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const validation = validateField(field);
    const showError = !validation.valid && formData[field.id] !== undefined;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            className={cn(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none',
              showError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
            )}
            style={!showError ? {
              '--tw-ring-color': themeColor,
              '--tw-ring-opacity': '0.2'
            } as React.CSSProperties : undefined}
          />
        );

      case 'select':
        return (
          <select
            id={field.id}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={cn(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all',
              showError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
            )}
            style={!showError ? {
              '--tw-ring-color': themeColor,
              '--tw-ring-opacity': '0.2'
            } as React.CSSProperties : undefined}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  id={`${field.id}-${index}`}
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-4 h-4 border-slate-300 focus:ring-2 focus:ring-offset-0"
                  style={{ color: themeColor }}
                />
                <span className="text-slate-700 group-hover:text-slate-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        const checkedOptions = formData[field.id] as string[] || [];
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  id={`${field.id}-${index}`}
                  value={option}
                  checked={checkedOptions.includes(option)}
                  onChange={(e) => {
                    const newOptions = e.target.checked
                      ? [...checkedOptions, option]
                      : checkedOptions.filter(o => o !== option);
                    handleFieldChange(field.id, newOptions);
                  }}
                  className="w-4 h-4 border-slate-300 rounded focus:ring-2 focus:ring-offset-0"
                  style={{ color: themeColor }}
                />
                <span className="text-slate-700 group-hover:text-slate-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            id={field.id}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFieldChange(field.id, file.name);
              }
            }}
            className={cn(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all',
              showError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
            )}
            style={!showError ? {
              '--tw-ring-color': themeColor,
              '--tw-ring-opacity': '0.2'
            } as React.CSSProperties : undefined}
          />
        );

      default:
        return (
          <input
            type={field.type}
            id={field.id}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            className={cn(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all',
              showError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
            )}
            style={!showError ? {
              '--tw-ring-color': themeColor,
              '--tw-ring-opacity': '0.2'
            } as React.CSSProperties : undefined}
          />
        );
    }
  };

  const getFieldIcon = (type: FormFieldType) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-slate-400" />;
      case 'tel':
        return <Phone className="h-5 w-5 text-slate-400" />;
      case 'textarea':
        return <FileText className="h-5 w-5 text-slate-400" />;
      default:
        return <User className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[10002] flex items-center justify-center p-4 overflow-y-auto transition-all duration-200 ease-out",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] mt-4 md:mt-0 overflow-hidden flex flex-col transition-all duration-200 ease-out self-start md:self-auto",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorDark} 100%)`
              }}
            >
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{typedForm.name}</h2>
              {typedForm.description && (
                <p className="text-sm text-slate-600">{typedForm.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {submitStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {typedForm.successMessage || 'Thank you for your submission!'}
              </h3>
              <p className="text-slate-600">We'll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {typedForm.fields.map((field) => {
                // Skip email_confirmation fields - they're for configuration only
                if (field.type === 'email_confirmation') {
                  return null;
                }

                const validation = validateField(field);
                const showError = !validation.valid && formData[field.id] !== undefined;

                return (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {renderField(field)}

                    {showError && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {validation.error}
                      </p>
                    )}
                  </div>
                );
              })}

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorDark} 100%)`,
                  boxShadow: `0 10px 15px -3px ${themeColor}33, 0 4px 6px -2px ${themeColor}33`
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  typedForm.submitButtonText || 'Submit'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            Your information is secure and will only be used to respond to your inquiry.
          </p>
        </div>
      </div>
    </div>
  );
}
