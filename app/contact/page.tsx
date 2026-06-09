'use client';

import { useState } from 'react';
import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';
import { Mail, Phone, MapPin, MessageCircle, Send, Users, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          siteName: 'Find Accommodation',
          inquiryType: 'General',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .sans { font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>
      <PlatformNavbar />

      <div className="sans container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-8 bg-[#16911c]" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#16911c]">Get in Touch</span>
            <span className="h-px w-8 bg-[#16911c]" />
          </div>
          <h1 className="serif text-4xl md:text-5xl font-bold text-stone-900 mb-4">
            Contact <em className="text-[#16911c] not-italic">Us</em>
          </h1>
          <p className="text-lg text-stone-500 max-w-xl mx-auto">
            Have questions about our platform? Need help with your listing? We&apos;re here to help!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 border border-stone-200">
              <h3 className="serif text-xl font-semibold text-stone-900 mb-5 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#16911c]" />
                Contact
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5"><Mail className="h-4 w-4 text-stone-400" /></div>
                  <div>
                    <div className="text-sm font-medium text-stone-700">Email</div>
                    <div className="text-sm text-stone-500">info@findaccommodation.co.za</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5"><Phone className="h-4 w-4 text-stone-400" /></div>
                  <div>
                    <div className="text-sm font-medium text-stone-700">Phone</div>
                    <div className="text-sm text-stone-500">068 900 6679</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5"><MessageSquare className="h-4 w-4 text-[#16911c]" /></div>
                  <div>
                    <div className="text-sm font-medium text-stone-700">WhatsApp</div>
                    <a href="https://wa.me/27689006679" target="_blank" rel="noopener noreferrer" className="text-sm text-[#16911c] hover:text-[#0d6b11] transition-colors">
                      068 900 6679
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5"><MapPin className="h-4 w-4 text-stone-400" /></div>
                  <div>
                    <div className="text-sm font-medium text-stone-700">Address</div>
                    <div className="text-sm text-stone-500">South Africa, Richards Bay</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 border border-stone-200">
              <h3 className="serif text-xl font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#16911c]" />
                Advertise with Us
              </h3>
              <p className="text-sm text-stone-500">
                Contact us to advertise your holiday / short term accommodation on the Find Accommodation platform.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-8 border border-stone-200">
              <h2 className="serif text-2xl font-semibold text-stone-900 mb-1">Send us a Message</h2>
              <p className="text-sm text-stone-500 mb-6">Fill out the form below and we&apos;ll get back to you as soon as possible.</p>

              {success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                  Thank you! Your message has been sent successfully.
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="text-sm font-medium text-stone-700 mb-1.5 block">Full Name *</label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="w-full h-11 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#16911c] focus:ring-1 focus:ring-[#16911c]/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-medium text-stone-700 mb-1.5 block">Email Address *</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="w-full h-11 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#16911c] focus:ring-1 focus:ring-[#16911c]/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="text-sm font-medium text-stone-700 mb-1.5 block">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="087 123 4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full h-11 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#16911c] focus:ring-1 focus:ring-[#16911c]/20"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="text-sm font-medium text-stone-700 mb-1.5 block">Subject *</label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="Brief description of your inquiry"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    className="w-full h-11 px-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#16911c] focus:ring-1 focus:ring-[#16911c]/20"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="text-sm font-medium text-stone-700 mb-1.5 block">Message *</label>
                  <textarea
                    id="message"
                    placeholder="Please provide details about your inquiry..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#16911c] focus:ring-1 focus:ring-[#16911c]/20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-[#16911c] hover:bg-[#0d6b11] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <PlatformFooter />
    </div>
  );
}
