'use client';

import type { ContactSectionContent, ContactFormField } from '@/types/page-builder';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Facebook, Twitter, Linkedin, Instagram, Github, Youtube, Link } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import toast from 'react-hot-toast';

interface ContactBasicProps {
  content: ContactSectionContent;
  settings?: {
    backgroundColor?: string;
    padding?: {
      top?: string;
      bottom?: string;
    };
    fullWidth?: boolean;
  };
  currentPageSlug?: string;
  websiteId?: string;
  sectionId?: string;
}

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  github: Github,
  youtube: Youtube,
  tiktok: Link, // TikTok uses Link icon as fallback
};

const DEFAULT_FORM_FIELDS: ContactFormField[] = [
  { id: 'name', name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
  { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'john@example.com' },
  { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '+1 (555) 123-4567' },
  { id: 'message', name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'How can we help you?' },
];

export function ContactBasic({ content, settings, currentPageSlug, websiteId, sectionId }: ContactBasicProps) {
  const {
    headline = 'Get in Touch',
    subheadline = "We'd Love to Hear From You",
    description = '',
    email = 'hello@example.com',
    phone = '',
    address = '',
    socialLinks = [],
    showForm = true,
    formFields = DEFAULT_FORM_FIELDS,
    submitButtonText = 'Send Message',
    successMessage = "Thank you for your message! We'll get back to you soon.",
    recipients = [],
    sendThankYouEmail = false,
    thankYouEmailSubject = 'Thank you for contacting us!',
    thankYouEmailMessage = 'We have received your message and will get back to you shortly.',
    backgroundColor = '#ffffff',
    textColor = '#1a1a1a',
    accentColor = '#6366f1',
    layout = 'split',
  } = content;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '5rem';
  const paddingBottom = padding.bottom ?? '5rem';

  const sectionStyle: React.CSSProperties = {
    backgroundColor,
    paddingTop,
    paddingBottom,
  };

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const submitContactForm = useMutation(api.forms.submitContactForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Validate required fields
      const missingFields = formFields.filter(field => {
        if (!field.required) return false;
        const value = formData[field.name];
        return !value || value.trim() === '';
      });

      if (missingFields.length > 0) {
        setSubmitStatus('error');
        setErrorMessage(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Prepare form data for submission
      const submissionData = formFields.map(field => ({
        fieldId: field.id || field.name,
        fieldLabel: field.label,
        value: formData[field.name] || '',
      }));

      // Get client info
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

      // Use recipients from content or fallback to the contact email
      const emailRecipients = recipients.length > 0 ? recipients : (email ? [email] : []);

      if (emailRecipients.length === 0) {
        setSubmitStatus('error');
        setErrorMessage('No recipients configured for this form. Please contact the site administrator.');
        toast.error('Form not configured properly');
        setIsSubmitting(false);
        return;
      }

      // Show sending toast
      const sendingToast = toast.loading('Sending your message...');

      // Submit the form
      await submitContactForm({
        websiteId: websiteId as Id<"websites">,
        pageSlug: currentPageSlug,
        sectionId: sectionId || 'contact-basic',
        formData: submissionData,
        recipients: emailRecipients,
        sendThankYouEmail,
        thankYouEmailSubject,
        thankYouEmailMessage,
        successMessage,
        userAgent,
      });

      // Dismiss sending toast and show success
      toast.dismiss(sendingToast);
      toast.success('Message sent successfully!', {
        icon: '✉️',
        duration: 4000,
      });

      setSubmitStatus('success');
      setFormData({}); // Clear form on success
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContrastColor = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#1a1a1a' : '#ffffff';
  };

  const headingColor = textColor;
  const paragraphColor = textColor;
  const isLight = backgroundColor.startsWith('#f') || backgroundColor.startsWith('#fff') || backgroundColor.startsWith('rgb(255');

  return (
    <section style={sectionStyle} className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          {subheadline && (
            <p
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: accentColor }}
            >
              {subheadline}
            </p>
          )}
          <h2
            className="text-4xl sm:text-5xl font-bold mb-6"
            style={{ color: headingColor }}
          >
            {headline}
          </h2>
          {description && (
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: paragraphColor, opacity: 0.8 }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Content */}
        <div className={`grid lg:grid-cols-${layout === 'split' ? '2' : '1'} gap-12 items-start`}>
          {/* Contact Info */}
          <div className={`${layout === 'split' ? '' : 'max-w-2xl mx-auto'}`}>
            <div className="space-y-8">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}
                >
                  <Mail className="h-5 w-5" style={{ color: accentColor }} />
                </div>
                <div>
                  <h3
                    className="font-semibold mb-1"
                    style={{ color: headingColor }}
                  >
                    Email
                  </h3>
                  <a
                    href={`mailto:${email}`}
                    className="hover:underline transition-colors"
                    style={{ color: paragraphColor, opacity: 0.8 }}
                  >
                    {email}
                  </a>
                </div>
              </div>

              {/* Phone */}
              {phone && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}
                  >
                    <Phone className="h-5 w-5" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1"
                      style={{ color: headingColor }}
                    >
                      Phone
                    </h3>
                    <a
                      href={`tel:${phone}`}
                      className="hover:underline transition-colors"
                      style={{ color: paragraphColor, opacity: 0.8 }}
                    >
                      {phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Address */}
              {address && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}
                  >
                    <MapPin className="h-5 w-5" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1"
                      style={{ color: headingColor }}
                    >
                      Address
                    </h3>
                    <p
                      className="whitespace-pre-line"
                      style={{ color: paragraphColor, opacity: 0.8 }}
                    >
                      {address}
                    </p>
                  </div>
                </div>
              )}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="pt-4">
                  <h3
                    className="font-semibold mb-4"
                    style={{ color: headingColor }}
                  >
                    Follow Us
                  </h3>
                  <div className="flex items-center gap-3">
                    {socialLinks.map((social, index) => {
                      const Icon = SOCIAL_ICONS[social.platform.toLowerCase()] || Mail;
                      return (
                        <a
                          key={index}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                          style={{
                            backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
                            color: headingColor,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = accentColor;
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.color = headingColor;
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Form */}
          {showForm && formFields.length > 0 && (
            <div>
              {/* Success Message */}
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-medium">Message Sent!</p>
                    <p className="text-green-700 text-sm">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">Error</p>
                    <p className="text-red-700 text-sm">{errorMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {formFields.map((field) => (
                  <div key={field.id || field.name}>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: headingColor }}
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        required={field.required}
                        placeholder={field.placeholder}
                        rows={4}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        disabled={submitStatus === 'success'}
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none disabled:opacity-50"
                        style={{
                          backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                          color: headingColor,
                        }}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        disabled={submitStatus === 'success'}
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                          color: headingColor,
                        }}
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        disabled={submitStatus === 'success'}
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                          color: headingColor,
                        }}
                      />
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={isSubmitting || submitStatus === 'success'}
                  className="w-full px-8 py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg flex items-center justify-center gap-2"
                  style={{ backgroundColor: accentColor, color: '#ffffff' }}
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : submitStatus === 'success' ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Message Sent
                    </>
                  ) : (
                    <>
                      {submitButtonText}
                      <Send className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
