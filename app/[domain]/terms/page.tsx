'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function TermsPage() {
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
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Terms and Conditions</h1>
            <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-6">
                {/* eslint-disable-next-line react/no-unescaped-entities */}
                By accessing and using this website and its services on the domain "{domain}", you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily download one copy of the materials on {domain} for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial)</li>
                <li>attempt to decompile or reverse engineer any software contained on the website</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for maintaining the confidentiality of your account.
              </p>
              <p className="text-gray-700 mb-6">
                You agree not to disclose your password to any third party and to notify us immediately if you believe your password has been compromised.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Privacy Policy</h2>
              <p className="text-gray-700 mb-6">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Prohibited Uses</h2>
              <p className="text-gray-700 mb-4">
                You may not use our service:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>For any unlawful purpose or to solicit others to unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Service Availability</h2>
              <p className="text-gray-700 mb-6">
                We reserve the right to withdraw or amend our service, and any service or material we provide on the website, in our sole discretion without notice. We do not warrant that our service will be uninterrupted, timely, secure, or error-free.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Disclaimer</h2>
              <p className="text-gray-700 mb-6">
                The information on this website is provided on an &apos;as is&apos; basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions and terms, whether express or implied, statutory or otherwise.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitations</h2>
              <p className="text-gray-700 mb-6">
                In no event shall {domain} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on {domain}, even if {domain} or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Accuracy of Materials</h2>
              <p className="text-gray-700 mb-6">
                The materials appearing on {domain} could include technical, typographical, or photographic errors. {domain} does not warrant that any of the materials on its website are accurate, complete, or current.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Links</h2>
              <p className="text-gray-700 mb-6">
                {domain} has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by {domain} of the site.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modifications</h2>
              <p className="text-gray-700 mb-6">
                {domain} may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700 mb-6">
                These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700">
                If you have any questions about these Terms and Conditions, please contact us through the contact information provided on our website.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
