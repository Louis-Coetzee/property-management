'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, Wrench, DollarSign, Clock, Check, X, ArrowRight, Heart, Share2, Star, ArrowUpDown, Filter, ChevronDown, Link2, MessageCircle, Mail, Copy, Tag, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '../../../../app/[domain]/AuthProvider';
import Image from 'next/image';
import Link from 'next/link';

interface ServiceShowcaseProps {
  content: {
    headline?: string;
    subheadline?: string;
    description?: string;
    filterBy?: {
      companyIds?: string[];
      categoryIds?: string[];
    };
    itemsPerPage?: number;
    showLoadMore?: boolean;
    loadMoreText?: string;
    showPrice?: boolean;
    showDuration?: boolean;
    showCategory?: boolean;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    cardStyle?: 'modern' | 'premium';
    layout?: 'grid-3' | 'grid-4' | 'carousel';
    viewDetailsText?: string;
    viewDetailsTarget?: 'url' | 'form';
    viewDetailsFormId?: string;
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
    // Manual service selection
    showOnlySelected?: boolean;
    selectedServiceIds?: string[];
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
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
  { value: 'duration-low', label: 'Duration: Short to Long' },
  { value: 'duration-high', label: 'Duration: Long to Short' },
];

// Duration badge component
function DurationBadge({ duration }: { duration?: number }) {
  if (!duration) return null;

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  const displayText = hours > 0
    ? minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    : `${minutes}m`;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
      <Clock className="h-3 w-3" />
      {displayText}
    </span>
  );
}

// Modern Card Template
function ModernCard({ service, accentColor, showPrice, showDuration, showCategory, viewDetailsText, formatPrice }: any) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-slate-300">
        {/* Header with Icon */}
        <div className="relative p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Category Badge */}
          {showCategory && service.category && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/90 text-slate-700">
                <Tag className="h-3 w-3" />
                {service.category}
              </span>
            </div>
          )}

          {/* Duration Badge */}
          {showDuration && service.duration && (
            <div className="absolute top-3 right-12">
              <DurationBadge duration={service.duration} />
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

          {/* Service Icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Wrench className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Title */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>

          {/* Price & Duration */}
          <div className="flex items-center justify-between">
            {showPrice && service.price !== undefined && (
              <div className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg">
                <p className="text-sm font-bold text-white">
                  {formatPrice(service.price)}
                </p>
              </div>
            )}
            {showDuration && service.duration && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(service.duration / 60)}h {service.duration % 60}m</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 group-hover:shadow-lg"
          >
            {viewDetailsText || 'Book Now'}
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        service={service}
        formatPrice={formatPrice}
      />
    </>
  );
}

// Premium Card Template
function PremiumCard({ service, accentColor, showPrice, showDuration, showCategory, viewDetailsText, formatPrice }: any) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <div className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-slate-300 transition-all duration-500 shadow-sm hover:shadow-2xl">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50 opacity-50 pointer-events-none" />

        {/* Top Section */}
        <div className="relative p-8 bg-gradient-to-br from-blue-500 to-indigo-600">
          {/* Category Badge */}
          {showCategory && service.category && (
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium bg-white/20 text-white backdrop-blur-sm">
                <Tag className="h-3 w-3" />
                {service.category}
              </span>
            </div>
          )}

          {/* Duration Badge */}
          {showDuration && service.duration && (
            <div className="absolute top-4 right-4">
              <DurationBadge duration={service.duration} />
            </div>
          )}

          {/* Service Icon */}
          <div className="w-20 h-20 mx-auto mt-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Wrench className="h-10 w-10 text-white" />
          </div>

          {/* Service Name */}
          <h3 className="text-xl font-bold text-white text-center mt-6 line-clamp-2">
            {service.name}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6 relative">
          {/* Description */}
          {service.description && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-3">
              {service.description}
            </p>
          )}

          {/* Price & Duration */}
          <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-xl">
            {showPrice && service.price !== undefined && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Starting from</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(service.price)}
                </p>
              </div>
            )}
            {showDuration && service.duration && (
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Duration</p>
                <div className="flex items-center gap-1 text-slate-700 font-semibold">
                  <Clock className="h-4 w-4" />
                  <span>{Math.floor(service.duration / 60)}h {service.duration % 60}m</span>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 group-hover:shadow-lg"
          >
            {viewDetailsText || 'Book Now'}
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        service={service}
        formatPrice={formatPrice}
      />
    </>
  );
}

// Share Modal Component
function ShareModal({
  isOpen,
  onClose,
  service,
  formatPrice
}: {
  isOpen: boolean;
  onClose: () => void;
  service: any;
  formatPrice: (price: number) => string;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const serviceUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/services/${service._id}`
    : `/services/${service._id}`;

  const shareText = `Check out ${service.name}!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(serviceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${serviceUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Check out ${service.name}`);
    const body = encodeURIComponent(`${shareText}\n\nView the service here: ${serviceUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Share Service</h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1 truncate">{service.name}</p>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              {copied ? (
                <Check className="h-5 w-5 text-white" />
              ) : (
                <Copy className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-slate-900">{copied ? 'Link Copied!' : 'Copy Link'}</p>
              <p className="text-xs text-slate-500">Copy the service link to clipboard</p>
            </div>
          </button>

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

export default function ServiceShowcase({
  content,
  settings,
  templateId,
  websiteId,
}: ServiceShowcaseProps) {
  const { user } = useAuth();
  const [visibleCount, setVisibleCount] = useState(content.itemsPerPage || 8);
  const [sortBy, setSortBy] = useState(content.defaultSort || 'newest');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch services
  const services = useQuery(
    api.services.getActiveServicesByWebsitePublic,
    websiteId ? { websiteId: websiteId as any } : 'skip'
  );

  // Get unique categories
  const categories = useMemo(() => {
    if (!services) return [];
    const cats = new Set<string>();
    services.forEach(s => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats).sort();
  }, [services]);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    if (!services) return [];

    let filtered = services.filter(s => s.isActive);

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(s => s.category === filterCategory);
    }

    // Apply company filter if specified
    if (content.filterBy?.companyIds?.length) {
      filtered = filtered.filter(s => content.filterBy!.companyIds!.includes(s.companyId));
    }

    // Apply selected services filter if enabled
    if (content.showOnlySelected && content.selectedServiceIds?.length) {
      filtered = filtered.filter(s => content.selectedServiceIds!.includes(s._id));
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'duration-low':
        filtered.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      case 'duration-high':
        filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
    }

    return filtered;
  }, [services, sortBy, filterCategory, content.filterBy, content.showOnlySelected, content.selectedServiceIds]);

  const visibleServices = filteredServices.slice(0, visibleCount);
  const hasMore = filteredServices.length > visibleCount;

  // Format price helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get grid columns
  const getGridCols = () => {
    switch (content.layout) {
      case 'grid-4':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 'carousel':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  const CardComponent = content.cardStyle === 'premium' ? PremiumCard : ModernCard;

  return (
    <section
      className={cn(
        'py-12 sm:py-16 lg:py-20',
        settings?.fullWidth ? '' : 'container mx-auto px-4 sm:px-6 lg:px-8'
      )}
      style={{
        backgroundColor: content.backgroundColor || settings?.backgroundColor || 'transparent',
        color: content.textColor,
        paddingTop: settings?.padding?.top,
        paddingBottom: settings?.padding?.bottom,
      }}
    >
      {/* Header */}
      <div className="text-center mb-10">
        {content.headline && (
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            {content.headline}
          </h2>
        )}
        {content.subheadline && (
          <p className="text-lg text-slate-600 mb-2">
            {content.subheadline}
          </p>
        )}
        {content.description && (
          <p className="text-slate-500 max-w-2xl mx-auto">
            {content.description}
          </p>
        )}
      </div>

      {/* Sort and Filter Bar */}
      {(content.showSort || content.showFilter) && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Sort */}
          {content.showSort && (
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter */}
          {content.showFilter && categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Services Grid */}
      {services === undefined ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : visibleServices.length > 0 ? (
        <div className={cn('grid gap-6', getGridCols())}>
          {visibleServices.map((service) => (
            <CardComponent
              key={service._id}
              service={service}
              accentColor={content.accentColor}
              showPrice={content.showPrice !== false}
              showDuration={content.showDuration !== false}
              showCategory={content.showCategory !== false}
              viewDetailsText={content.viewDetailsText}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Wrench className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No services found</h3>
          <p className="text-slate-500">Check back later for new services.</p>
        </div>
      )}

      {/* Load More Button */}
      {content.showLoadMore && hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={() => setVisibleCount(prev => prev + (content.itemsPerPage || 8))}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            {content.loadMoreText || 'Load More Services'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
