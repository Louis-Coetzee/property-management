'use client';

import type { ContactSectionContent, ContactFormField } from '@/types/page-builder';
import { Mail, Phone, MapPin, Send, Facebook, Twitter, Linkedin, Instagram, Github, Youtube, Sparkles, ArrowRight, CheckCircle, AlertCircle, Link } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import toast from 'react-hot-toast';

interface ContactModernProps {
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

export function ContactModern({ content, settings, currentPageSlug, websiteId, sectionId }: ContactModernProps) {
  const {
    headline = "Let's Start a Conversation",
    subheadline = 'Connect With Us',
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
    backgroundColor = '#f8fafc',
    textColor = '#1e293b',
    accentColor = '#6366f1',
    layout = 'centered',
  } = content;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '3rem';
  const paddingBottom = padding.bottom ?? '6rem';

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
        sectionId: sectionId || 'contact-modern',
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

  const isLight = backgroundColor.startsWith('#f') || backgroundColor.startsWith('#fff') || backgroundColor.startsWith('rgb(255');

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor, paddingTop, paddingBottom, color: textColor }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Dot Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${textColor} 1px, transparent 0)`,
            backgroundSize: '32px 32px',
            opacity: 0.1
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)',
              color: accentColor,
              border: `1px solid ${accentColor}20`,
            }}
          >
            <Sparkles className="h-4 w-4" />
            <span>Get in Touch</span>
          </div>

          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
            style={{ color: textColor }}
          >
            {headline}
          </h2>

          {subheadline && (
            <p
              className="text-xl sm:text-2xl mb-6 max-w-2xl mx-auto"
              style={{ color: textColor, opacity: 0.7 }}
            >
              {subheadline}
            </p>
          )}

          {description && (
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: textColor, opacity: 0.6 }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Main Content - Centered Layout */}
        <div className="max-w-4xl mx-auto">
          {/* Contact Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Email Card */}
            <a
              href={`mailto:${email}`}
              className="group p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{
                backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <Mail className="h-6 w-6" style={{ color: accentColor }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: textColor }}>Email</h3>
              <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>{email}</p>
            </a>

            {/* Phone Card */}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="group p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{
                  backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <Phone className="h-6 w-6" style={{ color: accentColor }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: textColor }}>Phone</h3>
                <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>{phone}</p>
              </a>
            )}

            {/* Address Card */}
            {address && (
              <div
                className="group p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{
                  backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <MapPin className="h-6 w-6" style={{ color: accentColor }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: textColor }}>Address</h3>
                <p className="text-sm whitespace-pre-line" style={{ color: textColor, opacity: 0.6 }}>{address}</p>
              </div>
            )}
          </div>

          {/* Contact Form */}
          {showForm && formFields.length > 0 && (
            <div
              className="p-8 sm:p-12 rounded-3xl relative overflow-hidden"
              style={{
                backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {/* Form Accent */}
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: accentColor }}
              />

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
                <div className="grid sm:grid-cols-2 gap-6">
                  {formFields.map((field) => (
                    <div key={field.id || field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <label
                        className="block text-sm font-semibold mb-3"
                        style={{ color: textColor }}
                      >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          required={field.required}
                          placeholder={field.placeholder}
                          rows={5}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          disabled={submitStatus === 'success'}
                          className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none disabled:opacity-50"
                          style={{
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                            borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                            color: textColor,
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
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                            borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                            color: textColor,
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
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                            borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                            color: textColor,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || submitStatus === 'success'}
                  className="group w-full px-8 py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl flex items-center justify-center gap-2"
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
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="mt-12 text-center">
              <p
                className="text-sm font-semibold mb-4 uppercase tracking-wider"
                style={{ color: textColor, opacity: 0.6 }}
              >
                Or connect with us on social media
              </p>
              <div className="flex items-center justify-center gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = SOCIAL_ICONS[social.platform.toLowerCase()] || Mail;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                      style={{
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
                        color: textColor,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = accentColor;
                        e.currentTarget.style.borderColor = accentColor;
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isLight ? '#ffffff' : 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = textColor;
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
    </section>
  );
}
