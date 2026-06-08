'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { X, Mail, User, Phone, CheckCircle2, AlertCircle, Loader2, Info, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface VehicleInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleData: {
    name: string;
    make?: string;
    model?: string;
    year?: number;
    reference?: string;
    vin?: string;
    condition?: 'new' | 'used';
    price?: number;
    image?: string;
  };
  sourcePage?: string;
  websiteId?: string;
  // Email settings
  recipients?: string[];
  sendThankYouEmail?: boolean;
  thankYouEmailSubject?: string;
  thankYouEmailMessage?: string;
  successMessage?: string;
}

// Console logging utility
const logInquiry = (level: 'info' | 'success' | 'error', message: string, data?: any) => {
  const prefix = '[VehicleInquiry]';
  const style = {
    info: 'color: #6366f1; font-weight: bold',
    success: 'color: #10b981; font-weight: bold',
    error: 'color: #ef4444; font-weight: bold',
  };

  console.log(`%c${prefix} ${message.toUpperCase()}`, style[level], data || '');
};

export function VehicleInquiryModal({
  isOpen,
  onClose,
  vehicleData,
  sourcePage,
  websiteId,
  recipients = [],
  sendThankYouEmail = false,
  thankYouEmailSubject = 'Thank you for your inquiry!',
  thankYouEmailMessage = 'We have received your vehicle inquiry and will get back to you shortly.',
  successMessage = 'Thank you for your inquiry! We\'ll get back to you soon.',
}: VehicleInquiryModalProps) {
  // Fetch EasyQuotes configuration for the website (public query)
  const easyQuotesConfig = useQuery(
    api.forms.getEasyQuotesConfigForWebsitePublic,
    websiteId ? { websiteId: websiteId as any } : "skip"
  );

  // Fetch website to get company ID for currency settings (public query)
  const website = useQuery(
    api.websites.getWebsiteByIdPublic,
    websiteId ? { websiteId: websiteId as any } : "skip"
  );

  // Fetch company data for currency settings (public query)
  const company = useQuery(
    api.companies.getByCompanyIdPublic,
    website ? { companyId: website.companyId } : 'skip'
  );

  // Vehicle inquiry mutation
  const submitVehicleInquiry = useMutation(api.forms.submitVehicleInquiry);

  // Helper function to format price with company currency
  const formatPrice = (price: number): string => {
    const currencySymbol = company?.currency?.customSymbol || company?.currency?.symbol || '$';
    const symbolPosition = company?.currency?.symbolPosition || 'before';
    const formattedPrice = Number(price).toLocaleString();

    if (symbolPosition === 'after') {
      return `${formattedPrice}${currencySymbol}`;
    }
    return `${currencySymbol}${formattedPrice}`;
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    emailAddress: '',
    title: '',
    comments: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean | null;
    submissionId?: string;
    message?: string;
    error?: string;
  }>({ success: null });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        contactNumber: '',
        emailAddress: '',
        title: '',
        comments: `I'm interested in the ${vehicleData.name}`,
      });
      setSubmitStatus('idle');
      setErrorMessage('');
      setSubmissionResult({ success: null });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, vehicleData.name]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = (): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.contactNumber.trim()) {
      errors.contactNumber = 'Contact number is required';
    } else {
      // Validate South African phone number format
      const phoneRegex = /^(\+27|27)?0[6-8][0-9]{8}$/;
      if (!phoneRegex.test(formData.contactNumber.replace(/\s/g, ''))) {
        errors.contactNumber = 'Please enter a valid South African phone number';
      }
    }
    if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      errors.emailAddress = 'Please enter a valid email address';
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
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    // Show sending toast
    const sendingToast = toast.loading('Submitting your inquiry...');

    try {
      // Prepare form data
      const submissionData = [
        { fieldId: 'firstName', fieldLabel: 'First Name', value: formData.firstName },
        { fieldId: 'lastName', fieldLabel: 'Last Name', value: formData.lastName },
        { fieldId: 'contactNumber', fieldLabel: 'Contact Number', value: formData.contactNumber },
        { fieldId: 'email', fieldLabel: 'Email', value: formData.emailAddress },
        { fieldId: 'title', fieldLabel: 'Title', value: formData.title },
        { fieldId: 'comments', fieldLabel: 'Comments', value: formData.comments },
      ];

      // Determine email recipients
      const emailRecipients = recipients.length > 0 ? recipients :
        (website?.contactEmail ? [website.contactEmail] : []);

      if (emailRecipients.length === 0) {
        logInquiry('error', 'No email recipients configured');
        toast.dismiss(sendingToast);
        toast.error('Inquiry form not configured. Please contact the site administrator.');
        setSubmitStatus('error');
        setErrorMessage('No recipients configured for this form.');
        setIsSubmitting(false);
        return;
      }

      logInquiry('info', 'Submitting vehicle inquiry...', {
        websiteId,
        recipients: emailRecipients,
        vehicle: vehicleData.name,
      });

      // Submit via Convex mutation (sends emails through Resend)
      const result = await submitVehicleInquiry({
        websiteId: websiteId as any,
        pageSlug: sourcePage,
        formData: submissionData,
        vehicleData: {
          name: vehicleData.name,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          reference: vehicleData.reference,
          condition: vehicleData.condition,
          price: vehicleData.price,
          image: vehicleData.image,
        },
        recipients: emailRecipients,
        sendThankYouEmail,
        thankYouEmailSubject,
        thankYouEmailMessage,
        successMessage,
      });

      logInquiry('success', 'Inquiry submitted successfully!', {
        submissionId: result.submissionId,
      });

      // Dismiss sending toast and show success
      toast.dismiss(sendingToast);
      toast.success('Inquiry submitted successfully!', {
        icon: '🚗',
        duration: 4000,
      });

      setSubmissionResult({
        success: true,
        submissionId: result.submissionId,
        message: result.message,
      });
      setSubmitStatus('success');

      // Also submit to EasyQuotes if enabled (for external CRM integration)
      const isEasyQuotesEnabled = easyQuotesConfig?.enabled ?? false;
      if (isEasyQuotesEnabled) {
        logInquiry('info', 'EasyQuotes enabled, submitting to external CRM...', {
          mode: easyQuotesConfig?.mode,
        });

        try {
          const easyQuotesResponse = await fetch('/api/easyquotes/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              formData: submissionData,
              websiteId: websiteId || 'unknown',
              formId: 'vehicle-inquiry',
              mode: easyQuotesConfig?.mode ?? 'test',
              vehicleData: {
                make: vehicleData.make,
                model: vehicleData.model,
                year: vehicleData.year,
                reference: vehicleData.reference,
                condition: vehicleData.condition,
              },
              externalLeadId: `VI-${vehicleData.reference || 'unknown'}-${Date.now()}`,
            }),
          });

          const easyQuotesResult = await easyQuotesResponse.json();
          if (easyQuotesResult.success) {
            logInquiry('success', 'Also submitted to EasyQuotes!', { subId: easyQuotesResult.subId });
          } else {
            logInquiry('error', 'EasyQuotes submission failed (non-blocking)', { error: easyQuotesResult.error });
          }
        } catch (eqError) {
          logInquiry('error', 'EasyQuotes submission failed (non-blocking)', { error: eqError });
        }
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 4000);

    } catch (error) {
      logInquiry('error', 'Error submitting inquiry', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Dismiss sending toast and show error
      toast.dismiss(sendingToast);
      toast.error('Failed to submit inquiry. Please try again.');

      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldValue = (field: string) => {
    const validation = validateForm();
    return {
      value: formData[field as keyof typeof formData],
      error: validation.errors[field],
    };
  };

  return (
    <div
      className="fixed inset-0 z-[10002] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Vehicle Inquiry</h2>
              <p className="text-sm text-slate-300">Get in touch about this vehicle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Vehicle Info Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {vehicleData.image && (
              <img
                src={vehicleData.image}
                alt={vehicleData.name}
                className="w-16 h-12 object-cover rounded-lg border border-slate-200"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{vehicleData.name}</p>
              <p className="text-sm text-slate-600">
                {vehicleData.year && `${vehicleData.year} `}
                {vehicleData.make} {vehicleData.model}
                {vehicleData.price && ` • ${formatPrice(vehicleData.price)}`}
              </p>
            </div>
            {vehicleData.reference && (
              <span className="px-2 py-1 text-xs font-medium bg-slate-200 text-slate-700 rounded">
                {vehicleData.reference}
              </span>
            )}
          </div>
        </div>

        {/* EasyQuotes Status Bar */}
        {easyQuotesConfig?.enabled && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">
                EasySystems Integration Active
              </span>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-200 text-blue-800">
              {easyQuotesConfig.mode?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {submitStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Inquiry Submitted Successfully!
              </h3>
              <p className="text-slate-600 mb-4">
                {successMessage}
              </p>
              {submissionResult.submissionId && (
                <div className="px-4 py-2 bg-slate-100 rounded-lg">
                  <p className="text-xs text-slate-600">Reference ID</p>
                  <p className="text-sm font-semibold text-slate-900">#{submissionResult.submissionId.slice(-8).toUpperCase()}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row 1: Title and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Title
                  </label>
                  <select
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="MR">Mr.</option>
                    <option value="MRS">Mrs.</option>
                    <option value="MS">Ms.</option>
                    <option value="DR">Dr.</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.emailAddress}
                    onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                    placeholder="your@email.com"
                    className={cn(
                      'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                      getFieldValue('emailAddress').error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-slate-900'
                    )}
                  />
                  {getFieldValue('emailAddress').error && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {getFieldValue('emailAddress').error}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: First Name and Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    className={cn(
                      'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                      getFieldValue('firstName').error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-slate-900'
                    )}
                  />
                  {getFieldValue('firstName').error && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {getFieldValue('firstName').error}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    className={cn(
                      'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                      getFieldValue('lastName').error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-slate-900'
                    )}
                  />
                  {getFieldValue('lastName').error && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {getFieldValue('lastName').error}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Contact Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  placeholder="072 123 4567"
                  className={cn(
                    'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                    getFieldValue('contactNumber').error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-slate-900'
                  )}
                />
                {getFieldValue('contactNumber').error && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {getFieldValue('contactNumber').error}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">South African format (e.g., 072 123 4567)</p>
              </div>

              {/* Row 4: Comments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => handleInputChange('comments', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                  placeholder="I'm interested in this vehicle. Please contact me with more information."
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-slate-900 to-slate-800"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Inquiry...
                  </span>
                ) : (
                  'Send Inquiry'
                )}
              </button>

              {/* Privacy Notice */}
              <p className="text-xs text-slate-500 text-center">
                Your information is secure and will only be used to respond to your inquiry.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
