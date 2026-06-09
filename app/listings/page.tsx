'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';
import Link from 'next/link';
import { MapPin, Users, BedDouble, Bath, Search, Home, DollarSign, Star, SlidersHorizontal, X } from 'lucide-react';

const propertyTypes = ['All', 'House', 'Apartment', 'Guest Suite', 'Villa', 'Townhouse', 'Cottage', 'Studio', 'Hotel', 'Lodge'];

export default function ListingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyType, setPropertyType] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const listings = useQuery(api.listings.getListings, {
    searchTerm: searchTerm || undefined,
    propertyType: propertyType !== 'All' ? propertyType : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    sortBy: 'featured',
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <PlatformNavbar />

      {/* Hero */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">
              Find Your Perfect <span className="text-[#16911c]">Stay</span>
            </h1>
            <p className="text-stone-500 text-lg">
              Browse holiday accommodation across South Africa
            </p>
          </div>

          {/* Search */}
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by location, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#16911c] focus:ring-1 focus:ring-[#16911c]/20"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-white border border-stone-200 rounded-lg space-y-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-2 block">Property Type</label>
                  <div className="flex flex-wrap gap-2">
                    {propertyTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setPropertyType(type)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                          propertyType === type
                            ? 'bg-[#16911c] text-white border-[#16911c]'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Min Price</label>
                    <input
                      type="number"
                      placeholder="R 0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#16911c]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Max Price</label>
                    <input
                      type="number"
                      placeholder="R 9999"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#16911c]"
                    />
                  </div>
                </div>
                {(propertyType !== 'All' || minPrice || maxPrice || searchTerm) && (
                  <button
                    onClick={() => { setPropertyType('All'); setMinPrice(''); setMaxPrice(''); setSearchTerm(''); }}
                    className="text-sm text-[#16911c] hover:text-[#0d6b11] font-medium flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {listings === undefined ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16911c] mx-auto"></div>
            <p className="mt-4 text-stone-500">Loading listings...</p>
          </div>
        ) : listings.listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-full mb-4">
              <Home className="h-7 w-7 text-stone-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-900 mb-2">No listings found</h3>
            <p className="text-sm text-stone-500">
              {searchTerm || propertyType !== 'All' || minPrice || maxPrice
                ? 'Try adjusting your search filters.'
                : 'Check back soon for new listings!'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-6">{listings.total} listing{listings.total !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.listings.map((listing: any) => (
                <Link key={listing._id} href={`/listings/${listing._id}`}>
                  <div className="bg-white rounded-xl border border-stone-200 hover:border-[#16911c]/30 hover:shadow-lg hover:shadow-[#16911c]/5 transition-all duration-200 overflow-hidden cursor-pointer group">
                    <div className="h-48 bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center relative overflow-hidden">
                      {listing.featuredImage || (listing.images && listing.images.length > 0) ? (
                        <img
                          src={listing.featuredImage || listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Home className="h-12 w-12 text-stone-300" />
                      )}
                      {listing.isFeatured && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Star className="h-3 w-3" /> Featured
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-stone-900 text-sm truncate mb-1 group-hover:text-[#16911c] transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-stone-500 mb-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{listing.location.city}, {listing.location.province}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-600 mb-3">
                        <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{listing.bedrooms}</span>
                        <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{listing.bathrooms}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{listing.maxGuests}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <div className="flex items-center gap-1 text-sm font-bold text-[#16911c]">
                          <DollarSign className="h-4 w-4" />
                          {listing.pricePerNight}
                          <span className="text-xs font-normal text-stone-500">/night</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <PlatformFooter />
    </div>
  );
}
