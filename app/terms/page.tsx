'use client';

import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <PlatformNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-8">Terms of Service</h1>
        <div className="bg-white rounded-xl border border-stone-200 p-8 prose prose-stone max-w-none">
          <p className="text-stone-500 text-sm mb-6">Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">1. Acceptance of Terms</h2>
          <p className="text-stone-600 leading-relaxed">
            By accessing and using Find Accommodation (&quot;the Platform&quot;), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">2. Description of Service</h2>
          <p className="text-stone-600 leading-relaxed">
            Find Accommodation is an online platform that connects property owners/listers with guests seeking short-term holiday accommodation in South Africa. The Platform facilitates the discovery and inquiry process for accommodation bookings.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">3. User Accounts</h2>
          <p className="text-stone-600 leading-relaxed">
            To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate and complete information when registering.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">4. Listing Properties</h2>
          <p className="text-stone-600 leading-relaxed">
            Property owners may list their properties on the Platform. All listings must contain accurate and truthful information. Find Accommodation reserves the right to remove listings that violate our policies or contain misleading information.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">5. Commission and Fees</h2>
          <p className="text-stone-600 leading-relaxed">
            Find Accommodation charges a 12% commission on confirmed bookings. There are no setup fees, monthly subscriptions, or hidden charges. Commission is deducted from the booking amount before payout to the property owner.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">6. Bookings and Payments</h2>
          <p className="text-stone-600 leading-relaxed">
            Bookings made through the Platform are subject to availability and confirmation by the property owner. Payment processing is handled through secure third-party payment gateways. Find Accommodation is not liable for payment processing issues.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">7. Cancellation Policy</h2>
          <p className="text-stone-600 leading-relaxed">
            Cancellation policies are set by individual property owners. Guests should review the cancellation policy before making a booking. Find Accommodation is not responsible for refund disputes between hosts and guests.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">8. Limitation of Liability</h2>
          <p className="text-stone-600 leading-relaxed">
            Find Accommodation acts as an intermediary platform and is not a party to agreements between hosts and guests. We are not liable for any damages, losses, or disputes arising from accommodations booked through the Platform.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">9. Privacy</h2>
          <p className="text-stone-600 leading-relaxed">
            Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">10. Changes to Terms</h2>
          <p className="text-stone-600 leading-relaxed">
            Find Accommodation reserves the right to modify these Terms at any time. Changes will be effective upon posting. Continued use of the Platform constitutes acceptance of modified Terms.
          </p>

          <h2 className="text-xl font-semibold text-stone-900 mt-6 mb-3">11. Contact</h2>
          <p className="text-stone-600 leading-relaxed">
            For questions about these Terms, please contact us at info@findaccommodation.co.za or call 068 900 6679.
          </p>
        </div>
      </div>
      <PlatformFooter />
    </div>
  );
}
