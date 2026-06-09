'use client';

import { use } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';
import Link from 'next/link';
import { MapPin, Users, BedDouble, Bath, Home, DollarSign, Star, ArrowLeft, Check, Clock, Shield, Phone, Mail, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const listing = useQuery(api.listings.getListing, { id: id as Id<'listings'> });
  const [showBookingModal, setShowBookingModal] = useState(false);

  if (listing === undefined) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16911c]"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-stone-50">
        <PlatformNavbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Home className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Listing Not Found</h1>
          <p className="text-stone-500 mb-6">This listing may have been removed or is no longer available.</p>
          <Link href="/listings" className="text-[#16911c] hover:text-[#0d6b11] font-medium">
            &larr; Browse all listings
          </Link>
        </div>
        <PlatformFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <PlatformNavbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/listings" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#16911c] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="h-72 md:h-96 bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center relative">
                {listing.featuredImage || (listing.images && listing.images.length > 0) ? (
                  <img
                    src={listing.featuredImage || (listing.images ? listing.images[0] : '')}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Home className="h-16 w-16 text-stone-300" />
                )}
                {listing.isFeatured && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                    <Star className="h-3 w-3" /> Featured
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900 mb-1">{listing.title}</h1>
                  <div className="flex items-center gap-1 text-sm text-stone-500">
                    <MapPin className="h-4 w-4" />
                    {listing.location.address}, {listing.location.city}, {listing.location.province}, {listing.location.country}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  listing.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {listing.status}
                </div>
              </div>

              <div className="flex items-center gap-6 py-4 border-y border-stone-100 mb-6">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <BedDouble className="h-4 w-4 text-stone-400" />
                  {listing.bedrooms} Bedroom{listing.bedrooms !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Bath className="h-4 w-4 text-stone-400" />
                  {listing.bathrooms} Bathroom{listing.bathrooms !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Users className="h-4 w-4 text-stone-400" />
                  Up to {listing.maxGuests} Guest{listing.maxGuests !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-stone-900 mb-3">About this property</h2>
                <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>

              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-stone-900 mb-3">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {listing.amenities.map((amenity: string) => (
                      <div key={amenity} className="flex items-center gap-2 text-sm text-stone-600">
                        <Check className="h-4 w-4 text-[#16911c]" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {listing.houseRules && (
                <div>
                  <h2 className="text-lg font-semibold text-stone-900 mb-3">House Rules</h2>
                  <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{listing.houseRules}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price card */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 sticky top-24">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-[#16911c]">R {listing.pricePerNight}</span>
                <span className="text-stone-500 text-sm">/ night</span>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Check-in</span>
                  <span className="font-medium text-stone-900">{listing.checkInTime || '14:00'}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Check-out</span>
                  <span className="font-medium text-stone-900">{listing.checkOutTime || '11:00'}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Min stay</span>
                  <span className="font-medium text-stone-900">{listing.minimumStay} night{listing.minimumStay !== 1 ? 's' : ''}</span>
                </div>
                {listing.cleaningFee && listing.cleaningFee > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Cleaning fee</span>
                    <span className="font-medium text-stone-900">R {listing.cleaningFee}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full bg-[#16911c] hover:bg-[#0d6b11] text-white font-medium py-3 rounded-lg transition-colors"
              >
                Request to Book
              </button>

              <p className="text-xs text-stone-400 text-center mt-3">
                You won&apos;t be charged yet
              </p>
            </div>

            {/* Host info */}
            {listing.owner && (
              <div className="bg-white rounded-xl border border-stone-200 p-6">
                <h3 className="font-semibold text-stone-900 mb-3">Hosted by</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#16911c]/10 flex items-center justify-center">
                    <span className="text-[#16911c] font-medium text-sm">
                      {listing.owner.firstName[0]}{listing.owner.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-stone-900 text-sm">{listing.owner.firstName} {listing.owner.lastName}</div>
                  </div>
                </div>
                {listing.contactPhone && (
                  <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
                    <Phone className="h-4 w-4 text-stone-400" />
                    {listing.contactPhone}
                  </div>
                )}
                {listing.contactEmail && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Mail className="h-4 w-4 text-stone-400" />
                    {listing.contactEmail}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Request to Book</h2>
            <p className="text-sm text-stone-500 mb-6">
              To book this property, please sign in or create an account. You&apos;ll be able to select dates and submit your booking request.
            </p>
            <div className="flex gap-3">
              <Link href="/auth/login" className="flex-1 text-center py-2.5 border border-stone-200 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="flex-1 text-center py-2.5 bg-[#16911c] text-white rounded-lg text-sm font-medium hover:bg-[#0d6b11] transition-colors">
                Sign Up
              </Link>
            </div>
            <button
              onClick={() => setShowBookingModal(false)}
              className="w-full mt-3 text-sm text-stone-500 hover:text-stone-700 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <PlatformFooter />
    </div>
  );
}
