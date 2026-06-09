'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import Link from 'next/link';
import {
  Home,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Users,
  BedDouble,
  Bath,
  DollarSign,
  ChevronRight,
  Building2,
  Search,
  Eye,
  Star,
  X,
  Images,
} from 'lucide-react';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';
import { MultiMediaPicker } from '@/components/ui/multi-media-picker';

const propertyTypes = [
  'House', 'Apartment', 'Guest Suite', 'Villa', 'Townhouse',
  'Cottage', 'Studio', 'Hotel', 'Lodge', 'Camp Site', 'Other',
];

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

interface ListingFormData {
  title: string;
  description: string;
  shortDescription: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  locationCountry: string;
  locationProvince: string;
  locationCity: string;
  locationSuburb: string;
  locationAddress: string;
  pricePerNight: number;
  currency: string;
  cleaningFee: string;
  securityDeposit: string;
  amenities: string;
  images: string[];
  featuredImage: string | null;
  coverImageIndex: number;
  availableFrom: string;
  availableTo: string;
  minimumStay: number;
  maximumStay: string;
  contactEmail: string;
  contactPhone: string;
  houseRules: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
}

const defaultFormData: ListingFormData = {
  title: '',
  description: '',
  shortDescription: '',
  propertyType: 'House',
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  locationCountry: 'South Africa',
  locationProvince: '',
  locationCity: '',
  locationSuburb: '',
  locationAddress: '',
  pricePerNight: 0,
  currency: 'ZAR',
  cleaningFee: '',
  securityDeposit: '',
  amenities: '',
  images: [],
  featuredImage: null,
  coverImageIndex: 0,
  availableFrom: new Date().toISOString().split('T')[0],
  availableTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  minimumStay: 1,
  maximumStay: '',
  contactEmail: '',
  contactPhone: '',
  houseRules: '',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  cancellationPolicy: '',
};

export default function CompanyListingsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [formData, setFormData] = useState<ListingFormData>(defaultFormData);

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const listings = useQuery(
    api.faListings.getListingsByCompany,
    companyId ? { companyId } : "skip"
  );

  const createListing = useMutation(api.faListings.createListing);
  const updateListing = useMutation(api.faListings.updateListing);
  const deleteListing = useMutation(api.faListings.deleteListing);

  const filteredListings = (listings || []).filter((listing: any) => {
    const matchesSearch = searchQuery === '' ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setSelectedListing(null);
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      images,
      featuredImage: images.length > 0
        ? images[prev.coverImageIndex] || images[0]
        : null,
    }));
  };

  const handleCoverImageChange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coverImageIndex: index,
      featuredImage: prev.images[index] || null,
    }));
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (listing: any) => {
    setSelectedListing(listing);
    setFormData({
      title: listing.title || '',
      description: listing.description || '',
      shortDescription: listing.shortDescription || '',
      propertyType: listing.propertyType || 'House',
      bedrooms: listing.bedrooms || 1,
      bathrooms: listing.bathrooms || 1,
      maxGuests: listing.maxGuests || 2,
      locationCountry: listing.location?.country || 'South Africa',
      locationProvince: listing.location?.province || '',
      locationCity: listing.location?.city || '',
      locationSuburb: listing.location?.suburb || '',
      locationAddress: listing.location?.address || '',
      pricePerNight: listing.pricePerNight || 0,
      currency: listing.currency || 'ZAR',
      cleaningFee: listing.cleaningFee?.toString() || '',
      securityDeposit: listing.securityDeposit?.toString() || '',
      amenities: (listing.amenities || []).join(', '),
      images: listing.images || [],
      featuredImage: listing.featuredImage || null,
      coverImageIndex: 0,
      availableFrom: listing.availableFrom || new Date().toISOString().split('T')[0],
      availableTo: listing.availableTo || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minimumStay: listing.minimumStay || 1,
      maximumStay: listing.maximumStay?.toString() || '',
      contactEmail: listing.contactEmail || '',
      contactPhone: listing.contactPhone || '',
      houseRules: listing.houseRules || '',
      checkInTime: listing.checkInTime || '14:00',
      checkOutTime: listing.checkOutTime || '11:00',
      cancellationPolicy: listing.cancellationPolicy || '',
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    if (!user?.id) return;
    setIsSubmitting(true);
    try {
      const amenitiesArray = formData.amenities
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const listingData = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        propertyType: formData.propertyType,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        maxGuests: formData.maxGuests,
        location: {
          country: formData.locationCountry,
          province: formData.locationProvince,
          city: formData.locationCity,
          suburb: formData.locationSuburb || undefined,
          address: formData.locationAddress,
        },
        pricePerNight: formData.pricePerNight,
        currency: formData.currency,
        cleaningFee: formData.cleaningFee ? parseFloat(formData.cleaningFee) : null,
        securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : null,
        amenities: amenitiesArray,
        images: formData.images,
        featuredImage: formData.featuredImage,
        availableFrom: formData.availableFrom,
        availableTo: formData.availableTo,
        minimumStay: formData.minimumStay,
        maximumStay: formData.maximumStay ? parseInt(formData.maximumStay) : null,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        houseRules: formData.houseRules || undefined,
        checkInTime: formData.checkInTime || undefined,
        checkOutTime: formData.checkOutTime || undefined,
        cancellationPolicy: formData.cancellationPolicy || undefined,
        companyId,
      };

      if (isEdit && selectedListing) {
        await updateListing({
          id: selectedListing._id,
          userId: user.id as any,
          ...listingData,
        });
      } else {
        await createListing({
          ...listingData,
          ownerId: user.id as any,
        });
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedListing || !user?.id) return;
    setIsSubmitting(true);
    try {
      await deleteListing({
        id: selectedListing._id,
        userId: user.id as any,
      });
      setShowDeleteModal(false);
      setSelectedListing(null);
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
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
              {company?.name || 'Company'}
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap">Listings</span>
          </div>

          <div className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#00072e] tracking-tight truncate">
                    Property Listings
                  </h1>
                  <p className="text-sm text-slate-600 hidden sm:block">
                    Manage accommodation listings for {company?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Listing</span>
                </button>
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="pb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all placeholder:text-slate-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-sm bg-slate-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-700"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredListings.map((listing: any) => (
              <div
                key={listing._id}
                className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 overflow-hidden"
              >
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center relative">
                  {listing.featuredImage || (listing.images && listing.images.length > 0) ? (
                    <img
                      src={listing.featuredImage || listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Home className="h-12 w-12 text-emerald-300" />
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusColors[listing.status] || 'bg-slate-100 text-slate-600'}`}>
                    {listing.status}
                  </div>
                  {listing.isFeatured && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Star className="h-3 w-3 inline mr-0.5" />
                      Featured
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm truncate mb-1">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {listing.location?.city}{listing.location?.province ? `, ${listing.location.province}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" />
                      {listing.bedrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-3 w-3" />
                      {listing.bathrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {listing.maxGuests}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                      <DollarSign className="h-4 w-4" />
                      {listing.pricePerNight}
                      <span className="text-xs font-normal text-slate-500">/night</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(listing)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedListing(listing); setShowDeleteModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Created/Updated info */}
                  <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                    Created {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'N/A'}
                    {listing.updatedBy && (
                      <span> · Updated by user</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Home className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No listings yet</h3>
            <p className="text-sm text-slate-500 mb-6">
              Create your first property listing to get started.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Listing
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {showEditModal ? 'Edit Listing' : 'Add New Listing'}
              </h2>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-4 space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g. Beachfront Villa with Ocean View"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Describe your property..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Property Type *</label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price per Night *</label>
                  <input
                    type="number"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: parseFloat(e.target.value) || 0 })}
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
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bathrooms *</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Guests *</label>
                  <input
                    type="number"
                    value={formData.maxGuests}
                    onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="1"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-medium text-slate-900 mb-3">Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Province *</label>
                    <input
                      type="text"
                      value={formData.locationProvince}
                      onChange={(e) => setFormData({ ...formData, locationProvince: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g. Western Cape"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={formData.locationCity}
                      onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g. Cape Town"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                    <input
                      type="text"
                      value={formData.locationAddress}
                      onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Street address"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amenities (comma separated)</label>
                <input
                  type="text"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="wifi, parking, pool, kitchen"
                />
              </div>

              {/* Photos */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-medium text-slate-900 mb-3">
                  <Images className="h-4 w-4 inline mr-1" />
                  Listing Photos
                </h3>
                <MultiMediaPicker
                  value={formData.images}
                  onChange={handleImagesChange}
                  coverImageIndex={formData.coverImageIndex}
                  onCoverImageChange={handleCoverImageChange}
                  maxImages={20}
                  label="Listing Photos"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Available From *</label>
                  <input
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Available To *</label>
                  <input
                    type="date"
                    value={formData.availableTo}
                    onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Stay */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stay (nights)</label>
                  <input
                    type="number"
                    value={formData.minimumStay}
                    onChange={(e) => setFormData({ ...formData, minimumStay: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Stay (nights, optional)</label>
                  <input
                    type="number"
                    value={formData.maximumStay}
                    onChange={(e) => setFormData({ ...formData, maximumStay: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="0"
                    placeholder="No max"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+27..."
                  />
                </div>
              </div>

              {/* Check-in/out */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check-in Time</label>
                  <input
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check-out Time</label>
                  <input
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Fees */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cleaning Fee</label>
                  <input
                    type="number"
                    value={formData.cleaningFee}
                    onChange={(e) => setFormData({ ...formData, cleaningFee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Security Deposit</label>
                  <input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit(!!showEditModal)}
                disabled={isSubmitting || !formData.title || !formData.description}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : showEditModal ? 'Update Listing' : 'Create Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedListing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Delete Listing</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to delete <strong>{selectedListing.title}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedListing(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        companyName={company?.name || ''}
      />
    </div>
  );
}
