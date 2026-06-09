'use client';

import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';
import { Mail, Phone, MapPin, Users, Home, Target, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformNavbar />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Find Accommodation</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your trusted partner in finding the perfect short-term accommodation in South Africa
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="flex items-center text-xl font-semibold mb-3">
                <Target className="h-6 w-6 mr-2 text-blue-600" />
                Our Mission
              </h2>
              <p className="text-gray-600">
                To provide a seamless platform that connects travelers with quality short-term accommodation options across South Africa, making it easy to find and book the perfect place to stay.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="flex items-center text-xl font-semibold mb-3">
                <Home className="h-6 w-6 mr-2 text-green-600" />
                What We Offer
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Holiday rentals and vacation homes</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Short-term accommodation options</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Easy booking and inquiry system</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Verified listings and hosts</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="flex items-center text-xl font-semibold mb-3">
                <Users className="h-6 w-6 mr-2 text-purple-600" />
                Why Choose Us
              </h2>
              <ul className="space-y-3 text-gray-600">
                <li>&bull; Comprehensive listings across South Africa</li>
                <li>&bull; User-friendly search and booking system</li>
                <li>&bull; Direct communication with property owners</li>
                <li>&bull; Secure and reliable platform</li>
                <li>&bull; Local expertise and support</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="flex items-center text-xl font-semibold mb-3">
                <Mail className="h-6 w-6 mr-2 text-blue-600" />
                Get in Touch
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-gray-500" />
                  <div><div className="font-medium">Email</div><div className="text-sm text-gray-600">info@findaccommodation.co.za</div></div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-gray-500" />
                  <div><div className="font-medium">Phone</div><div className="text-sm text-gray-600">068 900 6679</div></div>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-3 text-gray-500" />
                  <div><div className="font-medium">Address</div><div className="text-sm text-gray-600">South Africa, Richards Bay</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="bg-[#16911c] text-white rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Ready to Find Your Perfect Stay?</h2>
            <p className="text-green-100 mb-6">Browse our extensive collection of accommodations or list your property with us.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/listings" className="bg-white text-[#16911c] px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Browse Listings
              </Link>
              <Link href="/advertise" className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-400 transition-colors">
                List Your Property
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PlatformFooter />
    </div>
  );
}
