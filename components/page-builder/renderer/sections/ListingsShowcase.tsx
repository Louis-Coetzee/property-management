'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, Car as CarIcon, Calendar, Gauge, Fuel, Users, Check, X, ArrowRight, Heart, Share2, Star, ArrowUpDown, Filter, ChevronDown, Link2, MessageCircle, Mail, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '../../../../app/[domain]/AuthProvider';
import Image from 'next/image';
import Link from 'next/link';

interface ListingsShowcaseProps {
  content: {
    headline?: string;
    subheadline?: string;
    description?: string;
    filterBy?: {
      companyIds?: string[];
      brandIds?: string[];
      conditionIds?: string[];
    };
    itemsPerPage?: number;
    showLoadMore?: boolean;
    loadMoreText?: string;
    showStatus?: boolean;
    showPrice?: boolean;
    showMileage?: boolean;
    showYear?: boolean;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    cardStyle?: 'modern' | 'premium';
    layout?: 'grid-3' | 'grid-4' | 'carousel';
    viewDetailsText?: string;
    viewDetailsTarget?: 'url' | 'form';
    viewDetailsFormId?: string;
    showNavbarOnDetails?: boolean;
    showFooterOnDetails?: boolean;
    // Sort and Filter settings
    showSort?: boolean;
    showFilter?: boolean;
    defaultSort?: string;
    // Inquiry button settings
    inquiryTarget?: 'url' | 'page' | 'form';
    inquiryUrl?: string;
    inquiryPageId?: string;
    inquirySectionId?: string;
    inquiryFormId?: string;
    inquiryButtonText?: string;
    // Manual vehicle selection
    showOnlySelected?: boolean;
    selectedVehicleIds?: string[];
  };
  settings?: {
    backgroundColor?: string;
    padding?: {
      top?: string;
      bottom?: string;
    };
    fullWidth?: boolean;
  };
  templateId: string;
  websiteId?: string;
}

// Sort options configuration
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'mileage-low', label: 'Mileage: Low to High' },
  { value: 'mileage-high', label: 'Mileage: High to Low' },
  { value: 'year-new', label: 'Year: Newest' },
  { value: 'year-old', label: 'Year: Oldest' },
  { value: 'make-asc', label: 'Make: A-Z' },
  { value: 'make-desc', label: 'Make: Z-A' },
];

// Status badge component
function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Available' },
    reserved: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Reserved' },
    sold: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Sold' },
    pending: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Pending' },
  };

  const style = statusStyles[status] || statusStyles.pending;
  const sizeStyles = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', style.bg, style.text, sizeStyles)}>
      {style.label}
    </span>
  );
}

// Share Modal Component
function ShareModal({
  isOpen,
  onClose,
  vehicle
}: {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const vehicleUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/listings/${vehicle._id}`
    : `/listings/${vehicle._id}`;

  const vehicleTitle = `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim();
  const shareText = `Check out this ${vehicleTitle}!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(vehicleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${vehicleUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Check out this ${vehicleTitle}`);
    const body = encodeURIComponent(`${shareText}\n\nView the vehicle here: ${vehicleUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Share Vehicle</h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1 truncate">{vehicleTitle}</p>
        </div>

        {/* Share Options */}
        <div className="p-4 space-y-2">
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              {copied ? (
                <Check className="h-5 w-5 text-white" />
              ) : (
                <Copy className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-slate-900">{copied ? 'Link Copied!' : 'Copy Link'}</p>
              <p className="text-xs text-slate-500">Copy the vehicle link to clipboard</p>
            </div>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-slate-900">WhatsApp</p>
              <p className="text-xs text-slate-500">Share via WhatsApp message</p>
            </div>
          </button>

          {/* Email */}
          <button
            onClick={handleEmail}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-slate-900">Email</p>
              <p className="text-xs text-slate-500">Share via email</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Modern Card Template
function ModernCard({ vehicle, accentColor, showStatus, showPrice, showMileage, showYear, viewDetailsText, formatPrice }: any) {
  const [showShareModal, setShowShareModal] = useState(false);
  const statusMap: Record<string, string> = { available: 'Available', reserved: 'Reserved', sold: 'Sold', pending: 'Pending' };
  const statusInfo = vehicle.status ? statusMap[vehicle.status.toLowerCase()] : 'Pending';

  return (
    <>
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-slate-300">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {vehicle.featuredImage || (vehicle.images && vehicle.images.length > 0) ? (
            <img
              src={vehicle.featuredImage || vehicle.images[0]}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CarIcon className="h-16 w-16 text-slate-300" />
            </div>
          )}

          {/* Status Badge */}
          {showStatus && vehicle.status && (
            <div className="absolute top-3 left-3">
              <StatusBadge status={vehicle.status} />
            </div>
          )}

          {/* Share Button */}
          <div className="absolute top-3 right-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 backdrop-blur-md transition-all duration-200"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Price Overlay */}
        {showPrice && vehicle.price && (
          <div className="absolute bottom-3 left-3">
            <div className="px-3 py-1.5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg">
              <p className="text-sm font-bold text-white">
                {formatPrice(vehicle.price)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 truncate">
            {showYear && vehicle.year && `${vehicle.year} `}{vehicle.make} {vehicle.model}
          </h3>
          {showYear && !vehicle.year && (
            <h3 className="text-lg font-bold text-slate-900 truncate">
              {vehicle.make} {vehicle.model}
            </h3>
          )}
          {vehicle.reference && (
            <p className="text-xs text-slate-500 font-mono mt-1">Ref: {vehicle.reference}</p>
          )}
        </div>

        {/* Specs */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {showMileage && vehicle.specifications?.mileage && (
            <div className="flex items-center gap-1 text-slate-600">
              <Gauge className="h-3 w-3" />
              <span className="truncate">{vehicle.specifications.mileage.toLocaleString()} km</span>
            </div>
          )}
          {vehicle.specifications?.fuelType && (
            <div className="flex items-center gap-1 text-slate-600">
              <Fuel className="h-3 w-3" />
              <span className="truncate">{vehicle.specifications.fuelType}</span>
            </div>
          )}
          {vehicle.specifications?.transmission && (
            <div className="flex items-center gap-1 text-slate-600">
              <Users className="h-3 w-3" />
              <span className="truncate">{vehicle.specifications.transmission}</span>
            </div>
          )}
          {vehicle.condition && (
            <div className="flex items-center gap-1 text-slate-600">
              <Check className="h-3 w-3" />
              <span className="capitalize truncate">{vehicle.condition}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/listings/${vehicle._id}`}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-medium rounded-xl hover:from-slate-800 hover:to-slate-700 transition-all duration-200 group-hover:shadow-lg"
        >
          {viewDetailsText || 'View Details'}
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>

    {/* Share Modal */}
    <ShareModal
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
      vehicle={vehicle}
    />
  </>
  );
}

// Premium Card Template
function PremiumCard({ vehicle, accentColor, showStatus, showPrice, showMileage, showYear, viewDetailsText, formatPrice }: any) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-slate-300 transition-all duration-500 shadow-sm hover:shadow-2xl">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-100 opacity-50 pointer-events-none" />

      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {vehicle.featuredImage || (vehicle.images && vehicle.images.length > 0) ? (
          <img
            src={vehicle.featuredImage || vehicle.images[0]}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <CarIcon className="h-20 w-20 text-slate-300" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {showStatus && vehicle.status && (
            <StatusBadge status={vehicle.status} size="md" />
          )}
        </div>

        {/* Price */}
        {showPrice && vehicle.price && (
          <div className="absolute bottom-4 left-4">
            <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-xl">
              <p className="text-xl font-bold text-slate-900">
                {formatPrice(vehicle.price)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 relative">
        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 mb-1">
          {showYear && vehicle.year && `${vehicle.year} `}{vehicle.make} {vehicle.model}
        </h3>

        {/* Reference */}
        {vehicle.reference && (
          <p className="text-sm text-slate-500 font-mono mb-4">Ref: {vehicle.reference}</p>
        )}

        {/* Specs with icons */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {showMileage && vehicle.specifications?.mileage && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <Gauge className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-xs text-slate-600 text-center">{vehicle.specifications.mileage.toLocaleString()} km</span>
            </div>
          )}
          {vehicle.specifications?.fuelType && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <Fuel className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-xs text-slate-600 text-center">{vehicle.specifications.fuelType}</span>
            </div>
          )}
          {vehicle.specifications?.transmission && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-xs text-slate-600 text-center">{vehicle.specifications.transmission}</span>
            </div>
          )}
          {vehicle.condition && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <Star className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-xs text-slate-600 text-center capitalize">{vehicle.condition}</span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          <Link
            href={`/listings/${vehicle._id}`}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-semibold rounded-xl hover:from-slate-800 hover:to-slate-700 transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30"
          >
            {viewDetailsText || 'View Details'}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={() => setShowShareModal(true)}
            className="p-3 rounded-xl border-2 border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all duration-200"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        vehicle={vehicle}
      />
    </div>
  );
}

export function ListingsShowcaseRenderer({ content, settings, templateId, websiteId }: ListingsShowcaseProps) {
  const { user } = useAuth();
  const [visibleCount, setVisibleCount] = useState(content.itemsPerPage || 6);
  const [showDebug, setShowDebug] = useState(false);

  // Sort and Filter state
  const [sortBy, setSortBy] = useState(content.defaultSort || 'newest');
  const [filterBrand, setFilterBrand] = useState<string>('');
  const [filterCondition, setFilterCondition] = useState<string>('');
  const [filterPriceMin, setFilterPriceMin] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  const [showFilters, setShowFilters] = useState(content.showFilter || false);

  // Fetch website to get company ID for currency settings (public query)
  const website = useQuery(
    api.websites.getWebsiteByIdPublic,
    websiteId ? { websiteId: websiteId as any } : 'skip'
  );

  // Fetch company data for currency settings (public query)
  const company = useQuery(
    api.companies.getByCompanyIdPublic,
    website ? { companyId: website.companyId } : 'skip'
  );

  // Helper function to format price with company currency
  const formatPrice = (price: number): string => {
    // Priority: customSymbol > symbol > default based on code > $
    let currencySymbol = '$'; // Default fallback

    if (company?.currency?.customSymbol) {
      currencySymbol = company.currency.customSymbol;
    } else if (company?.currency?.symbol) {
      currencySymbol = company.currency.symbol;
    } else if (company?.currency?.code) {
      // Fallback: derive symbol from currency code
      const symbolMap: Record<string, string> = {
        'ZAR': 'R',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'AUD': 'A$',
        'CAD': 'C$',
        'JPY': '¥',
        'CNY': '¥',
        'INR': '₹',
      };
      currencySymbol = symbolMap[company.currency.code] || '$';
    }

    const symbolPosition = company?.currency?.symbolPosition || 'before';
    const formattedPrice = Number(price).toLocaleString();

    if (symbolPosition === 'after') {
      return `${formattedPrice}${currencySymbol}`;
    }
    return `${currencySymbol}${formattedPrice}`;
  };

  // TEMPORARY DEBUG: When debug mode is on, use bypass query to get ALL vehicles
  // Otherwise use normal query (use public query for non-authenticated, or user query for authenticated)
  const vehiclesByWebsiteAuth = useQuery(api.vehicles.getVehiclesByWebsite,
    (user && websiteId && !showDebug) ? { userId: user.id as any, websiteId: websiteId as any } : 'skip'
  );
  const vehiclesByWebsitePublic = useQuery(api.vehicles.getVehiclesByWebsitePublic,
    (!user && websiteId && !showDebug) ? { websiteId: websiteId as any } : 'skip'
  );
  const vehiclesByWebsiteBypass = useQuery(api.vehicles.getAllVehiclesBypassFilters,
    (showDebug && websiteId && user?.id) ? { userId: user.id as any, websiteId: websiteId as any } : 'skip'
  );
  const vehicles = showDebug ? vehiclesByWebsiteBypass : (user ? vehiclesByWebsiteAuth : vehiclesByWebsitePublic);

  // Debug query: Get all vehicles including inactive ones (only runs when debug is on and no vehicles found)
  const debugInfo = useQuery(
    api.vehicles.getAllVehiclesByWebsiteForDebug,
    (showDebug && vehicles && vehicles.length === 0) ? { userId: user?.id as any, websiteId: websiteId as any } : 'skip'
  );

  // Always log basic debug info
  console.log('🚗 ListingsShowcase Component Render');
  console.log('🌐 Website ID:', websiteId);
  console.log('👤 User logged in:', !!user);
  console.log('📊 Vehicles query state:', vehicles === undefined ? 'Loading...' : vehicles === null ? 'Error' : `${vehicles.length} vehicles`);
  console.log('🎯 Content filters:', content.filterBy);

  // Debug: Log currency information
  console.log('💰 Currency Debug:', {
    websiteLoaded: !!website,
    websiteCompanyId: website?.companyId,
    companyLoaded: !!company,
    companyCurrency: company?.currency,
    currencySymbol: company?.currency?.customSymbol || company?.currency?.symbol || '$ (default)',
  });

  // Log first vehicle details if available
  if (vehicles && vehicles.length > 0) {
    console.log('🚙 First vehicle sample:', {
      id: vehicles[0]._id,
      year: vehicles[0].year,
      make: vehicles[0].make,
      model: vehicles[0].model,
      companyId: vehicles[0].companyId,
      brand: vehicles[0].brand,
      condition: vehicles[0].condition,
      status: vehicles[0].status,
      isActive: vehicles[0].isActive,
    });
  } else if (vehicles && vehicles.length === 0) {
    console.warn('⚠️ No vehicles found for this website!');
    console.log('💡 This means:');
    console.log('  1. No vehicles exist for this website\'s company, OR');
    console.log('  2. Vehicles exist but are not active/available (for public users)');
    console.log('💡 For public users, vehicles must have: isActive=true AND status="available"');
    console.log('💡 Check your Convex dashboard to see if vehicles exist in the "vehicles" table');
  }

  // Filter vehicles based on settings
  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];

    // BYPASS MODE: Show all vehicles without any filtering
    if (showDebug) {
      console.log('🚨 BYPASS MODE: Skipping all filters, showing all', vehicles.length, 'vehicles');
      return vehicles;
    }

    // If showOnlySelected is true, only show vehicles that are in selectedVehicleIds
    if (content.showOnlySelected) {
      const selectedIds = content.selectedVehicleIds || [];
      if (selectedIds.length === 0) {
        // No vehicles selected, return empty array
        return [];
      }
      return vehicles.filter((vehicle: any) => selectedIds.includes(vehicle._id));
    }

    const filters = content.filterBy;

    // Debug: Log all vehicles and filters
    if (showDebug) {
      console.group('🔍 ListingsShowcase Debug');
      console.log('📊 Total vehicles from query:', vehicles.length);
      console.log('🎯 Filters applied:', filters);
      console.log('🌐 Website ID:', websiteId);
      console.log('👤 User logged in:', !!user);
    }

    const result = vehicles.filter((vehicle: any) => {
      let passed = true;
      const reasons: string[] = [];

      // Filter by company IDs
      if (filters?.companyIds && filters.companyIds.length > 0) {
        if (!vehicle.companyId) {
          passed = false;
          reasons.push('❌ No companyId on vehicle');
        } else if (!filters.companyIds.includes(vehicle.companyId)) {
          passed = false;
          reasons.push(`❌ Company mismatch: vehicle (${vehicle.companyId}) not in selected (${filters.companyIds.join(', ')})`);
        } else if (showDebug) {
          reasons.push(`✅ Company match: ${vehicle.companyId}`);
        }
      }

      // Filter by brand IDs (brand names) - case-insensitive comparison
      if (passed && filters?.brandIds && filters.brandIds.length > 0) {
        const vehicleBrand = vehicle.brand || vehicle.make;
        if (!vehicleBrand) {
          passed = false;
          reasons.push('❌ No brand/make on vehicle');
        } else {
          // Case-insensitive comparison - normalize both to lowercase
          const normalizedVehicleBrand = vehicleBrand.toLowerCase();
          const normalizedBrandFilters = filters.brandIds.map((b: string) => b.toLowerCase());
          if (!normalizedBrandFilters.some((filterBrand: string) => filterBrand === normalizedVehicleBrand)) {
            passed = false;
            reasons.push(`❌ Brand mismatch: vehicle (${vehicleBrand}) not in selected (${filters.brandIds.join(', ')})`);
          } else if (showDebug) {
            reasons.push(`✅ Brand match: ${vehicleBrand}`);
          }
        }
      }

      // Filter by condition IDs (condition names: new, used, certified)
      if (passed && filters?.conditionIds && filters.conditionIds.length > 0) {
        if (!vehicle.condition) {
          passed = false;
          reasons.push('❌ No condition on vehicle');
        } else if (!filters.conditionIds.includes(vehicle.condition)) {
          passed = false;
          reasons.push(`❌ Condition mismatch: vehicle (${vehicle.condition}) not in selected (${filters.conditionIds.join(', ')})`);
        } else if (showDebug) {
          reasons.push(`✅ Condition match: ${vehicle.condition}`);
        }
      }

      // User-selected filters (from frontend filter UI)
      if (passed && filterBrand) {
        const vehicleBrand = (vehicle.brand || vehicle.make || '').toLowerCase();
        if (vehicleBrand !== filterBrand.toLowerCase()) {
          passed = false;
        }
      }

      if (passed && filterCondition) {
        if ((vehicle.condition || '').toLowerCase() !== filterCondition.toLowerCase()) {
          passed = false;
        }
      }

      if (passed && filterPriceMin) {
        const minPrice = parseFloat(filterPriceMin);
        if (vehicle.price < minPrice) {
          passed = false;
        }
      }

      if (passed && filterPriceMax) {
        const maxPrice = parseFloat(filterPriceMax);
        if (vehicle.price > maxPrice) {
          passed = false;
        }
      }

      if (showDebug) {
        console.group(`🚗 Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
        console.log('ID:', vehicle._id);
        console.log('Company ID:', vehicle.companyId);
        console.log('Brand/Make:', vehicle.brand || vehicle.make);
        console.log('Condition:', vehicle.condition);
        console.log('Status:', vehicle.status);
        console.log('Active:', vehicle.isActive);
        console.log('Passed filters:', passed);
        if (reasons.length > 0) {
          console.log('Filter reasons:', reasons);
        }
        console.groupEnd();
      }

      return passed;
    });

    if (showDebug) {
      console.log('📈 Filtered vehicles count:', result.length);
      console.groupEnd();
    }

    return result;
  }, [vehicles, content.filterBy, websiteId, user, showDebug, filterBrand, filterCondition, filterPriceMin, filterPriceMax]);

  // Get unique brands and conditions from vehicles for filter dropdowns
  const availableBrands = useMemo(() => {
    if (!vehicles) return [];
    const brands = new Set<string>();
    vehicles.forEach((v: any) => {
      const brand = v.brand || v.make;
      if (brand) brands.add(brand);
    });
    return Array.from(brands).sort();
  }, [vehicles]);

  const availableConditions = useMemo(() => {
    if (!vehicles) return [];
    const conditions = new Set<string>();
    vehicles.forEach((v: any) => {
      if (v.condition) conditions.add(v.condition);
    });
    return Array.from(conditions).sort();
  }, [vehicles]);

  // Sort filtered vehicles
  const sortedVehicles = useMemo(() => {
    if (!filteredVehicles.length) return [];

    const sorted = [...filteredVehicles];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'oldest':
        return sorted.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
      case 'price-low':
        return sorted.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
      case 'price-high':
        return sorted.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
      case 'mileage-low':
        return sorted.sort((a: any, b: any) => (a.specifications?.mileage || 0) - (b.specifications?.mileage || 0));
      case 'mileage-high':
        return sorted.sort((a: any, b: any) => (b.specifications?.mileage || 0) - (a.specifications?.mileage || 0));
      case 'year-new':
        return sorted.sort((a: any, b: any) => (b.year || 0) - (a.year || 0));
      case 'year-old':
        return sorted.sort((a: any, b: any) => (a.year || 0) - (b.year || 0));
      case 'make-asc':
        return sorted.sort((a: any, b: any) => (a.make || '').localeCompare(b.make || ''));
      case 'make-desc':
        return sorted.sort((a: any, b: any) => (b.make || '').localeCompare(a.make || ''));
      default:
        return sorted;
    }
  }, [filteredVehicles, sortBy]);

  // Reset filters
  const resetFilters = () => {
    setFilterBrand('');
    setFilterCondition('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setSortBy(content.defaultSort || 'newest');
    setVisibleCount(content.itemsPerPage || 6);
  };

  // Check if any filters are active
  const hasActiveFilters = filterBrand || filterCondition || filterPriceMin || filterPriceMax;

  // Get display count
  const displayCount = Math.min(visibleCount, sortedVehicles.length);
  const hasMore = displayCount < sortedVehicles.length;

  // Layout classes
  const layoutClasses = {
    'grid-3': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
    'grid-4': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
    'carousel': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
  };

  const gridClass = layoutClasses[content.layout as keyof typeof layoutClasses] || layoutClasses['grid-3'];
  const cardStyle = content.cardStyle || 'modern';

  // Loading state
  if (vehicles === undefined) {
    return (
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: content.backgroundColor || '#ffffff' }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: content.backgroundColor || '#ffffff' }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16 max-w-3xl mx-auto">
          {content.headline && (
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight">
              {content.headline}
            </h2>
          )}
          {content.subheadline && (
            <p className="text-lg sm:text-xl text-slate-600 mb-4">
              {content.subheadline}
            </p>
          )}
          {content.description && (
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
              {content.description}
            </p>
          )}

          {/* Debug Info */}
          {showDebug && vehicles && (
            <div className="mt-6 p-4 bg-slate-100 rounded-lg text-left text-sm">
              <h4 className="font-semibold mb-2">🔍 Debug Information {showDebug && <span className="text-amber-600">(BYPASS MODE - Showing ALL vehicles)</span>}</h4>
              <div className="space-y-1 text-xs font-mono mb-4">
                <p>Website ID: {websiteId || 'Not set'}</p>
                <p>User logged in: {user ? 'Yes' : 'No'}</p>
                <p>Total vehicles from query: <strong>{vehicles.length}</strong></p>
                <p>Filtered vehicles: {filteredVehicles.length}</p>
                {showDebug && <p className="text-amber-600">⚠️ Filters bypassed - showing all vehicles from database</p>}
                {content.filterBy && (
                  <p>Filters: {JSON.stringify(content.filterBy)}</p>
                )}
              </div>

              {/* All Vehicles Details */}
              <div className="mt-4 p-3 bg-white border border-slate-300 rounded-lg">
                <h5 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wide">🚗 All Vehicles in Database</h5>
                <div className="space-y-3">
                  {vehicles.map((vehicle: any, index: number) => (
                    <div key={vehicle._id} className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900">Vehicle {index + 1}</span>
                        <span className="text-xs text-slate-500">ID: {vehicle._id}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                        <div><span className="text-slate-500">Make:</span> <span className="text-slate-900 ml-2">{vehicle.make}</span></div>
                        <div><span className="text-slate-500">Model:</span> <span className="text-slate-900 ml-2">{vehicle.model}</span></div>
                        <div><span className="text-slate-500">Year:</span> <span className="text-slate-900 ml-2">{vehicle.year}</span></div>
                        <div><span className="text-slate-500">Brand:</span> <span className="text-slate-900 ml-2">{vehicle.brand || '-'}</span></div>
                        <div><span className="text-slate-500">Condition:</span> <span className="text-slate-900 ml-2">{vehicle.condition || '-'}</span></div>
                        <div><span className="text-slate-500">Status:</span> <span className="text-slate-900 ml-2">{vehicle.status}</span></div>
                        <div><span className="text-slate-500">Active:</span> <span className="text-slate-900 ml-2">{vehicle.isActive ? 'Yes' : 'No'}</span></div>
                        <div className="col-span-2"><span className="text-slate-500">Company ID:</span> <span className="text-slate-900 ml-2 break-all">{vehicle.companyId}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sort and Filter Controls */}
        {(content.showSort || content.showFilter) && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Results count */}
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{displayCount}</span> of{' '}
                <span className="font-semibold text-slate-900">{sortedVehicles.length}</span> vehicles
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="ml-2 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </p>

              <div className="flex flex-wrap gap-3 items-center">
                {/* Sort Dropdown */}
                {content.showSort && (
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent cursor-pointer"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                )}

                {/* Filter Toggle */}
                {content.showFilter && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all',
                      showFilters || hasActiveFilters
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                        {[filterBrand, filterCondition, filterPriceMin, filterPriceMax].filter(Boolean).length}
                      </span>
                    )}
                    <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Filter Panel */}
            {content.showFilter && showFilters && (
              <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Brand Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Brand</label>
                    <select
                      value={filterBrand}
                      onChange={(e) => setFilterBrand(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    >
                      <option value="">All Brands</option>
                      {availableBrands.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  {/* Condition Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Condition</label>
                    <select
                      value={filterCondition}
                      onChange={(e) => setFilterCondition(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    >
                      <option value="">All Conditions</option>
                      {availableConditions.map((condition) => (
                        <option key={condition} value={condition} className="capitalize">{condition}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Min Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Min Price</label>
                    <input
                      type="number"
                      value={filterPriceMin}
                      onChange={(e) => setFilterPriceMin(e.target.value)}
                      placeholder="No min"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>

                  {/* Price Max Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Max Price</label>
                    <input
                      type="number"
                      value={filterPriceMax}
                      onChange={(e) => setFilterPriceMax(e.target.value)}
                      placeholder="No max"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {sortedVehicles.length > 0 ? (
          <>
            <div className={gridClass}>
              {sortedVehicles.slice(0, displayCount).map((vehicle: any) => (
                <div key={vehicle._id}>
                  {cardStyle === 'premium' ? (
                    <PremiumCard
                      vehicle={vehicle}
                      accentColor={content.accentColor}
                      showStatus={content.showStatus !== false}
                      showPrice={content.showPrice !== false}
                      showMileage={content.showMileage !== false}
                      showYear={content.showYear !== false}
                      viewDetailsText={content.viewDetailsText}
                      formatPrice={formatPrice}
                    />
                  ) : (
                    <ModernCard
                      vehicle={vehicle}
                      accentColor={content.accentColor}
                      showStatus={content.showStatus !== false}
                      showPrice={content.showPrice !== false}
                      showMileage={content.showMileage !== false}
                      showYear={content.showYear !== false}
                      viewDetailsText={content.viewDetailsText}
                      formatPrice={formatPrice}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && content.showLoadMore !== false && (
              <div className="flex justify-center mt-10 sm:mt-12">
                <button
                  onClick={() => setVisibleCount(prev => prev + (content.itemsPerPage || 6))}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-semibold rounded-2xl hover:from-slate-800 hover:to-slate-700 transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 text-sm sm:text-base"
                >
                  {content.loadMoreText || 'Show More'}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-16 sm:py-20">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
              No Listings Available
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mb-4">
              Check back soon for new inventory
            </p>

            {/* Debug Empty State */}
            {showDebug && (
              <div className="max-w-md mx-auto mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <h4 className="font-semibold text-amber-900 mb-3">🔍 Debug: Why no listings?</h4>
                <div className="space-y-2 text-sm text-amber-800">
                  <p>📊 Total vehicles in database: <strong>{vehicles?.length || 0}</strong></p>
                  <p>🔢 After filtering: <strong>{filteredVehicles.length}</strong></p>

                  {debugInfo && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="font-medium text-red-900">🔍 Deep Debug Info:</p>
                      <p className="text-xs text-red-800 mt-1">Website: <strong>{debugInfo.website || 'Unknown'}</strong></p>
                      <p className="text-xs text-red-800">Company ID: <strong>{debugInfo.companyId || 'Unknown'}</strong></p>
                      <p className="text-xs text-red-800">Total vehicles (all statuses): <strong>{debugInfo.totalVehicles}</strong></p>
                      {debugInfo.message && (
                        <p className="text-xs text-red-700 mt-1 italic">{debugInfo.message}</p>
                      )}
                      {debugInfo.vehicles && debugInfo.vehicles.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-red-900">Sample vehicles:</p>
                          {debugInfo.vehicles.slice(0, 3).map((v, i) => (
                            <div key={i} className="text-xs text-red-700 bg-red-100 p-1 mt-1 rounded">
                              {v.make} {v.model} | Active: {v.isActive ? 'Yes' : 'No'} | Status: {v.status}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {content.filterBy && (
                    <div className="mt-3 p-2 bg-amber-100 rounded">
                      <p className="font-medium">Applied filters:</p>
                      <ul className="text-xs mt-1 space-y-1">
                        {content.filterBy.companyIds && content.filterBy.companyIds.length > 0 && (
                          <li>• Companies: {content.filterBy.companyIds.length} selected</li>
                        )}
                        {content.filterBy.brandIds && content.filterBy.brandIds.length > 0 && (
                          <li>• Brands: {content.filterBy.brandIds.join(', ')}</li>
                        )}
                        {content.filterBy.conditionIds && content.filterBy.conditionIds.length > 0 && (
                          <li>• Conditions: {content.filterBy.conditionIds.join(', ')}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {vehicles && vehicles.length > 0 && (
                    <div className="mt-3 p-2 bg-amber-100 rounded">
                      <p className="font-medium">First vehicle in database:</p>
                      <p className="text-xs mt-1">
                        {vehicles[0].year} {vehicles[0].make} {vehicles[0].model}
                      </p>
                      <p className="text-xs">Company: {vehicles[0].companyId}</p>
                      <p className="text-xs">Brand: {vehicles[0].brand || vehicles[0].make}</p>
                      <p className="text-xs">Condition: {vehicles[0].condition || 'not set'}</p>
                      <p className="text-xs">Status: {vehicles[0].status}</p>
                      <p className="text-xs">Active: {vehicles[0].isActive ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  <p className="text-xs mt-3">
                    💡 Open browser console (F12) for detailed debugging
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
