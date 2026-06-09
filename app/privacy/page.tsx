'use client';

import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <PlatformNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-8">Privacy Policy</h1>
        <div className="bg-white rounded-xl border border-stone-200 p-8 prose prose-stone max-w-none">
          <p className="text-stone-500 text-sm mb-6">Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">1. Information We Collect</h2>
          <p className="text-stone-600 leading-relaxed">
            We collect information you provide directly, including your name, email address, phone number, and payment information when you create an account, make a booking, or list a property. We also collect usage data such as IP address, browser type, and pages visited.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">2. How We Use Your Information</h2>
          <p className="text-stone-600 leading-relaxed">
            We use your information to provide and improve our services, process bookings and payments, send notifications about bookings and inquiries, communicate with you about your account, and ensure the security of our Platform.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">3. Information Sharing</h2>
          <p className="text-stone-600 leading-relaxed">
            We share your information with property owners when you make a booking inquiry, with payment processors to handle transactions, and with service providers who assist in operating the Platform. We do not sell your personal information to third parties.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">4. Data Security</h2>
          <p className="text-stone-600 leading-relaxed">
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">5. Cookies</h2>
          <p className="text-stone-600 leading-relaxed">
            We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage patterns. You can control cookie settings through your browser preferences.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">6. Your Rights</h2>
          <p className="text-stone-600 leading-relaxed">
            You have the right to access, correct, or delete your personal information. You can update your profile information through your account settings or contact us directly for assistance.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">7. Data Retention</h2>
          <p className="text-stone-600 leading-relaxed">
            We retain your information for as long as your account is active or as needed to provide services. We may retain certain information as required by law or for legitimate business purposes.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">8. Children&apos;s Privacy</h2>
          <p className="text-stone-600 leading-relaxed">
            The Platform is not intended for children under 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">9. Changes to This Policy</h2>
          <p className="text-stone-600 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">10. Contact Us</h2>
          <p className="text-stone-600 leading-relaxed">
            If you have questions about this Privacy Policy, please contact us at info@findaccommodation.co.za or call 068 900 6679.
          </p>
        </div>
      </div>
      <PlatformFooter />
    </div>
  );
}
