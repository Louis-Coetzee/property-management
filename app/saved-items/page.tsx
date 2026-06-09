'use client';

import { useState, useEffect } from 'react';
import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';
import Link from 'next/link';
import { Heart, Home, MapPin, BedDouble, Bath, Users, DollarSign, Trash2 } from 'lucide-react';

export default function SavedItemsPage() {
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, show a message that user needs to sign in
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <PlatformNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-6 w-6 text-[#16911c]" />
          <h1 className="text-2xl font-bold text-stone-900">Saved Listings</h1>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-full mb-4">
            <Heart className="h-7 w-7 text-stone-400" />
          </div>
          <h2 className="text-lg font-medium text-stone-900 mb-2">Sign in to view saved listings</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-md mx-auto">
            Create an account or sign in to save your favourite listings and access them anytime.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/login" className="px-6 py-2.5 border border-stone-200 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="px-6 py-2.5 bg-[#16911c] text-white rounded-lg text-sm font-medium hover:bg-[#0d6b11] transition-colors">
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>

      <PlatformFooter />
    </div>
  );
}
