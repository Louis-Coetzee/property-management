'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PrivacyPage() {
  const params = useParams();
  const domain = params.domain as string;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Privacy Policy</h1>
            <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us when you create an account on {domain}:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>Personal information such as your first name, last name, and email address</li>
                <li>Contact information including your phone number</li>
                <li>Account credentials including your password (which is securely encrypted)</li>
                <li>Domain information indicating which application domain you registered from</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect for various purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>To provide, maintain, and improve our services</li>
                <li>To process transactions and send related information</li>
                <li>To send technical notices, updates, security alerts, and support messages</li>
                <li>To verify your email address and secure your account</li>
                <li>To respond to your comments, questions, and customer service requests</li>
                <li>To communicate with you about products, services, and events</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect and defend our rights and property</li>
                <li>To prevent or investigate possible wrongdoing in connection with the service</li>
                <li>To protect the personal safety of users or the public</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-6">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your password is encrypted using industry-standard bcrypt hashing, and we use secure transmission protocols for all sensitive data.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Email Communications</h2>
              <p className="text-gray-700 mb-4">
                We may send you emails for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>Email verification when you create an account</li>
                <li>Password reset requests</li>
                <li>Important account notifications</li>
                <li>Service updates and security alerts</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-6">
                {/* eslint-disable-next-line react/no-unescaped-entities */}
                We use session tokens stored in your browser's local storage to maintain your login session. We do not use tracking cookies for advertising purposes. Essential cookies may be used to ensure the proper functioning of our service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 mb-6">
                We retain your personal information for as long as your account is active or as needed to provide you services. We will delete your personal information when you request account deletion, subject to any legal obligations to retain certain information.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>Access your personal information</li>
                <li>Update or correct your personal information</li>
                <li>Delete your account and personal information</li>
                <li>Withdraw consent for certain processing activities</li>
                <li>Request a copy of your personal information</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-gray-700 mb-6">
                Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 mb-6">
                Your information may be transferred to and processed in countries other than your own. We ensure that such transfers are conducted in accordance with applicable data protection laws and that appropriate safeguards are in place.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Third-Party Services</h2>
              <p className="text-gray-700 mb-6">
                We use third-party services such as Convex for database hosting and Resend for email delivery. These services have their own privacy policies governing their use of your information.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-6">
                {/* eslint-disable-next-line react/no-unescaped-entities */}
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please contact us through the contact information provided on our website or by email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
