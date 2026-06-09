'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { MultiMediaPicker } from '@/components/ui/multi-media-picker';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  Home,
  MapPin,
  Users,
  BedDouble,
  Bath,
  DollarSign,
  Images,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';

const propertyTypes = [
  'House', 'Apartment', 'Villa', 'Cottage', 'Cabin', 'Studio',
  'Townhouse', 'Hotel', 'Lodge', 'Camp Site', 'Other',
];

export default function NewListingPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const { isAuthenticated, isLoading, user } = useAuthGuard();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  const createListing = useMutation(api.faListings.createListing);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('House');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [maxGuests, setMaxGuests] = useState(2);
  const [pricePerNight, setPricePerNight] = useState(0);
  const [currency] = useState('ZAR');
  const [cleaningFee, setCleaningFee] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [amenities, setAmenities] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [locationProvince, setLocationProvince] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().split('T')[0]);
  const [availableTo, setAvailableTo] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [minimumStay, setMinimumStay] = useState(1);
  const [maximumStay, setMaximumStay] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [houseRules, setHouseRules] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
    setFeaturedImage(newImages.length > 0 ? newImages[coverImageIndex] || newImages[0] : null);
  };

  const handleCoverImageChange = (index: number) => {
    setCoverImageIndex(index);
    setFeaturedImage(images[index] || null);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!title || !description) {
      toast.error('Please fill in title and description');
      return;
    }
    if (images.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    setIsSubmitting(true);
    try {
      const amenitiesArray = amenities.split(',').map(a => a.trim()).filter(a => a.length > 0);

      const newListingId = await createListing({
        title,
        description,
        shortDescription: description.substring(0, 100),
        propertyType,
        bedrooms,
        bathrooms,
        maxGuests,
        location: {
          country: 'South Africa',
          province: locationProvince || 'Unknown',
          city: locationCity || 'Unknown',
          address: locationAddress || 'Unknown',
        },
        pricePerNight,
        currency,
        cleaningFee: cleaningFee ? parseFloat(cleaningFee) : null,
        securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
        amenities: amenitiesArray,
        images,
        featuredImage,
        availableFrom,
        availableTo,
        minimumStay,
        maximumStay: maximumStay ? parseInt(maximumStay) : null,
        contactEmail: contactEmail || user.email || '',
        contactPhone,
        houseRules,
        checkInTime,
        checkOutTime,
        companyId,
        ownerId: user.id as Id<'users'>,
      });

      toast.success('Listing created successfully!');
      setTimeout(() => {
        router.push(`/companies/${companyId}/listings`);
      }, 1000);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 text-sm overflow-x-auto">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <Link href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              Company
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <Link href={`/companies/${companyId}/listings`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              Listings
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap">New Listing</span>
          </div>

          <div className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#00072e] tracking-tight">
                    Add New Listing
                  </h1>
                  <p className="text-sm text-slate-600 hidden sm:block">
                    Create a new property listing
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Photos Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Images className="h-5 w-5 text-emerald-600" />
            Listing Photos *
          </h2>
          <MultiMediaPicker
            value={images}
            onChange={handleImagesChange}
            coverImageIndex={coverImageIndex}
            onCoverImageChange={handleCoverImageChange}
            maxImages={20}
            label="Listing Photos"
            required
          />
          {images.length === 0 && (
            <p className="text-sm text-red-500 mt-2">Please upload at least one photo</p>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Home className="h-5 w-5 text-emerald-600" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. Beachfront Villa with Ocean View"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Describe your property..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Property Type *</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price per Night (ZAR) *</label>
                <input
                  type="number"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bedrooms *</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bathrooms *</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Guests *</label>
                <input
                  type="number"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Location
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Province *</label>
              <input
                type="text"
                value={locationProvince}
                onChange={(e) => setLocationProvince(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. Western Cape"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. Cape Town"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Street address"
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Amenities</h2>
          <input
            type="text"
            value={amenities}
            onChange={(e) => setAmenities(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="wifi, parking, pool, kitchen (comma separated)"
          />
        </div>

        {/* Availability */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Availability</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Available From *</label>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Available To *</label>
              <input
                type="date"
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stay (nights)</label>
              <input
                type="number"
                value={minimumStay}
                onChange={(e) => setMinimumStay(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Stay (nights, optional)</label>
              <input
                type="number"
                value={maximumStay}
                onChange={(e) => setMaximumStay(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="0"
                placeholder="No max"
              />
            </div>
          </div>
        </div>

        {/* Contact & Policies */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact & Policies</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="contact@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="+27..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Check-in Time</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Check-out Time</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cleaning Fee (ZAR)</label>
                <input
                  type="number"
                  value={cleaningFee}
                  onChange={(e) => setCleaningFee(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Security Deposit (ZAR)</label>
                <input
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">House Rules</label>
              <textarea
                value={houseRules}
                onChange={(e) => setHouseRules(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Any house rules..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !description || images.length === 0}
            className="px-6 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Creating...
              </>
            ) : (
              'Create Listing'
            )}
          </button>
        </div>
      </div>

      {/* Navigation Side Sheet */}
      {isSideSheetOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setIsSideSheetOpen(false)}
        />
      )}
      <NavigationSideSheet
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        companyId={companyId}
        companyName=""
      />
    </div>
  );
}
