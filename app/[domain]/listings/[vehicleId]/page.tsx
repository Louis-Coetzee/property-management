'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Mail,
  Phone,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Users,
  Tag,
  Loader2,
  MapPin,
  FileText,
  Info} from 'lucide-react';
import { FormModal } from '@/components/forms/FormModal';
import { VehicleInquiryModal } from '@/components/forms/VehicleInquiryModal';
import { convertConvexForm } from '@/lib/forms';
import { parsePageContent } from '@/lib/page-builder/hooks/usePageContent';
import { NavbarBasic } from '@/components/page-builder/renderer/sections/NavbarBasic';
import { NavbarModern } from '@/components/page-builder/renderer/sections/NavbarModern';
import { FooterBasic } from '@/components/page-builder/renderer/sections/FooterBasic';
import { FooterModern } from '@/components/page-builder/renderer/sections/FooterModern';

// Helper function to create a darker shade of the theme color
const getDarkerShade = (hexColor: string, percent: number): string => {
  const num = parseInt(hexColor.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 +
    (R > 0 ? R : 0) * 0x10000 +
    (G > 0 ? G : 0) * 0x100 +
    (B > 0 ? B : 0)
  ).toString(16).slice(1);
};

// Helper function to format price with company currency
const formatPrice = (price: number, company?: any): string => {
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

// Status badge styles
const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Available' },
  reserved: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Reserved' },
  sold: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Sold' },
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
  pending: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pending' }};

// Condition badge styles
const conditionStyles: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'New' },
  used: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Pre-Owned' },
  certified: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Certified Pre-Owned' }};

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const domain = params.domain as string;
  const vehicleId = params.vehicleId as string;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [openFormId, setOpenFormId] = useState<string | null>(null);

  // Fetch website data to get the inquiry form (public)
  const website = useQuery(
    api.websites.getWebsiteByDomainPublic,
    { domain }
  );

  // Fetch company data to get currency settings (public)
  const company = useQuery(
    api.companies.getByCompanyIdPublic,
    website ? { companyId: website.companyId } : "skip"
  );

  // Fetch home page to get navbar sections (public)
  const homePage = useQuery(
    api.pages.getHomePagePublic,
    website ? { websiteId: website._id } : "skip"
  );

  // Fetch all pages for page navigation (public)
  const pages = useQuery(
    api.pages.getPagesByWebsitePublic,
    website ? { websiteId: website._id } : "skip"
  );

  // Fetch vehicle data - the URL only contains the ID without prefix
  // We need to handle both formats: "vehicles_abc123" and "abc123"
  // Get all vehicles for the website and filter by ID (public)
  const allVehicles = useQuery(
    api.vehicles.getVehiclesByWebsitePublic,
    website ? { websiteId: website._id } : "skip"
  );

  // Find the vehicle by matching the ID (with or without prefix)
  const vehicle = allVehicles?.find(v =>
    v._id === vehicleId || v._id === `vehicles_${vehicleId}`
  );

  // Fetch form only if we have a valid formId that's not the special 'none' value
  // Use public version since this is a public page
  const inquiryForm = useQuery(
    api.forms.getFormByIdPublic,
    (openFormId && openFormId !== 'none' && website?.inquiryFormId === openFormId)
      ? { formId: openFormId as any }
      : "skip",
  );

  // Extract navbar sections from home page
  const navbarSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'navbar') || []
    : [];

  // Get the first navbar section for height/sticky settings (for backward compatibility)
  const firstNavbarSection = navbarSections.length > 0 ? navbarSections[0] : null;

  // Determine navbar height for spacer
  const navbarHeight = firstNavbarSection?.templateId === 'navbar-modern' ? '80px' : '64px';
  const isNavbarSticky = firstNavbarSection?.content?.sticky !== false;

  // Extract footer sections from home page
  const footerSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'footer') || []
    : [];

  // Get the first footer section (if any)
  const footerSection = footerSections.length > 0 ? footerSections[0] : null;

  // Extract listings showcase sections from home page to get detail page settings
  const listingsSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'listings-showcase') || []
    : [];

  // Get the first listings showcase section and check its settings
  const listingsSection = listingsSections.length > 0 ? listingsSections[0] : null;
  const listingsContent = listingsSection?.content || {};

  // Check if navbar should be shown on detail pages (default: true if not set)
  const showNavbarOnDetails = listingsContent.showNavbarOnDetails !== false;

  // Check if footer should be shown on detail pages (default: true if not set)
  const showFooterOnDetails = listingsContent.showFooterOnDetails !== false;

  // Inquiry button settings
  const inquiryTarget = listingsContent.inquiryTarget || 'url';
  const inquiryUrl = listingsContent.inquiryUrl || '';
  const inquiryPageId = listingsContent.inquiryPageId;
  const inquirySectionId = listingsContent.inquirySectionId;
  const inquiryFormId = listingsContent.inquiryFormId;
  const inquiryButtonText = listingsContent.inquiryButtonText || 'Inquire Now';

  // Inquiry email settings
  const inquiryRecipients = listingsContent.inquiryRecipients || [];
  const inquirySendThankYouEmail = listingsContent.inquirySendThankYouEmail || false;
  const inquiryThankYouEmailSubject = listingsContent.inquiryThankYouEmailSubject || 'Thank you for your inquiry!';
  const inquiryThankYouEmailMessage = listingsContent.inquiryThankYouEmailMessage || 'We have received your vehicle inquiry and will get back to you shortly.';
  const inquirySuccessMessage = listingsContent.inquirySuccessMessage || 'Thank you for your inquiry! We\'ll get back to you soon.';

  // Fetch the form for inquiry button if target is 'form' and formId is set
  // Pre-fetch the form regardless of openFormId state (use public version)
  const listingsInquiryForm = useQuery(
    api.forms.getFormByIdPublic,
    (inquiryTarget === 'form' && inquiryFormId)
      ? { formId: inquiryFormId as any }
      : "skip",
  );

  // Set featured image as default
  useEffect(() => {
    if (vehicle?.featuredImage && vehicle.images) {
      const featuredIndex = vehicle.images.findIndex(img => img === vehicle.featuredImage);
      if (featuredIndex !== -1) {
        setSelectedImageIndex(featuredIndex);
      }
    }
  }, [vehicle]);

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: vehicle?.name || 'Vehicle Details',
          text: vehicle?.description || '',
          url: window.location.href});
      } catch (error) {
        console.log('Share canceled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Could add a toast notification here
    }
  };

  // Handle image navigation
  const handlePreviousImage = () => {
    if (!vehicle?.images) return;
    setSelectedImageIndex((prev) =>
      prev === 0 ? vehicle.images!.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!vehicle?.images) return;
    setSelectedImageIndex((prev) =>
      prev === vehicle.images!.length - 1 ? 0 : prev + 1
    );
  };

  // Handle inquiry button click - Always use VehicleInquiryModal with EasySystems integration
  const handleInquiryClick = () => {
    // Always open the VehicleInquiryModal with EasySystems integration
    setOpenFormId('none');
  };

  // Get specification icon
  const getSpecIcon = (key: string) => {
    const icons: Record<string, React.ReactNode> = {
      year: <Calendar className="h-4 w-4" />,
      mileage: <Gauge className="h-4 w-4" />,
      fuelType: <Fuel className="h-4 w-4" />,
      transmission: <Settings className="h-4 w-4" />,
      drivetrain: <Settings className="h-4 w-4" />,
      doors: <Users className="h-4 w-4" />,
      cylinders: <Settings className="h-4 w-4" />,
      horsepower: <Tag className="h-4 w-4" />,
      exteriorColor: <div className="h-4 w-4 rounded-full border-2 border-slate-300" />,
      interiorColor: <div className="h-4 w-4 rounded-full border-2 border-slate-300" />,
      engine: <Settings className="h-4 w-4" />,
      vin: <FileText className="h-4 w-4" />,
      reference: <Tag className="h-4 w-4" />};
    return icons[key] || <Info className="h-4 w-4" />;
  };

  // Get specification label
  const getSpecLabel = (key: string) => {
    const labels: Record<string, string> = {
      year: 'Year',
      mileage: 'Mileage',
      fuelType: 'Fuel Type',
      transmission: 'Transmission',
      drivetrain: 'Drivetrain',
      doors: 'Doors',
      cylinders: 'Cylinders',
      horsepower: 'Horsepower',
      exteriorColor: 'Exterior Color',
      interiorColor: 'Interior Color',
      engine: 'Engine',
      vin: 'VIN',
      reference: 'Reference'};
    return labels[key] || key;
  };

  // Format specification value
  const formatSpecValue = (key: string, value: any) => {
    if (value === undefined || value === null || value === '') return null;

    switch (key) {
      case 'mileage':
        return `${Number(value).toLocaleString()} km`;
      case 'price':
      case 'discountedPrice':
      case 'cost':
        return formatPrice(Number(value), company);
      case 'horsepower':
        return `${value} HP`;
      case 'exteriorColor':
      case 'interiorColor':
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-slate-300"
              style={{ backgroundColor: value.toLowerCase() }}
            />
            <span>{value}</span>
          </div>
        );
      default:
        return value;
    }
  };

  // Handle loading state (undefined means loading)
  if (allVehicles === undefined || website === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-900" />
      </div>
    );
  }

  // Handle not found state (vehicle doesn't exist in the website's vehicles)
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <X className="h-10 w-10 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Vehicle Not Found</h1>
            <p className="text-slate-600">
              The vehicle you're looking for doesn't exist or has been removed.
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Vehicle ID: {vehicleId}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const images = vehicle.images || [];
  const specs = vehicle.specifications || {};
  const statusStyle = statusStyles[vehicle.status as keyof typeof statusStyles] || statusStyles.draft;
  const conditionStyle = conditionStyles[vehicle.condition as keyof typeof conditionStyles] || conditionStyles.used;
  const hasDiscount = vehicle.discountedPrice && vehicle.discountedPrice < vehicle.price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Navbar from home page - render all navbar sections if showNavbarOnDetails is true */}
      {showNavbarOnDetails && navbarSections.map((section: any, index: number) => (
        section.templateId === 'navbar-modern' ? (
          <NavbarModern
            key={section.id || index}
            content={section.content as any}
            settings={section.settings as any}
            currentPageSlug={`/listings/${vehicleId}`}
          />
        ) : (
          <NavbarBasic
            key={section.id || index}
            content={section.content as any}
            settings={section.settings as any}
            currentPageSlug={`/listings/${vehicleId}`}
          />
        )
      ))}
      
      {/* Spacer for sticky navbar */}
      {showNavbarOnDetails && navbarSections.length > 0 && isNavbarSticky && (
        <div style={{ height: navbarHeight }} aria-hidden="true" />
      )}

      {/* Fallback header if no navbar configured */}
      {!firstNavbarSection && (
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isFavorited
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white group-hover:border-slate-300 group-hover:bg-slate-50 transition-all duration-200">
                <ArrowLeft className="h-4 w-4" />
              </span>
              <span className="font-medium">Back to Listings</span>
            </button>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${conditionStyle.bg} ${conditionStyle.text}`}>
                {conditionStyle.label}
              </span>
              {vehicle.reference && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                  <Tag className="h-3.5 w-3.5" />
                  {vehicle.reference}
                </span>
              )}
            </div>

            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 shadow-xl">
                  <img
                    src={images[selectedImageIndex]}
                    alt={`${vehicle.name} - Image ${selectedImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviousImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200"
                      >
                        <ChevronLeft className="h-5 w-5 text-slate-900" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200"
                      >
                        <ChevronRight className="h-5 w-5 text-slate-900" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          index === selectedImageIndex
                            ? 'border-slate-900 shadow-lg scale-105'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${vehicle.name} - Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vehicle Title and Price */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  {vehicle.name}
                </h1>
                <p className="text-slate-600 mt-2">
                  {vehicle.year} {vehicle.brand || vehicle.make} {vehicle.model}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {hasDiscount ? (
                  <>
                    <span className="text-3xl sm:text-4xl font-bold text-slate-900">
                      {formatPrice(vehicle.discountedPrice || 0, company)}
                    </span>
                    <span className="text-xl text-slate-400 line-through">
                      {formatPrice(vehicle.price, company)}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                      Save {formatPrice(vehicle.price - (vehicle.discountedPrice || 0), company)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-slate-900">
                    {formatPrice(vehicle.price, company)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {vehicle.description && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-3">Description</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* Specifications */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(specs).map(([key, value]) => {
                  const formattedValue = formatSpecValue(key, value);
                  if (!formattedValue) return null;

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex-shrink-0 p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                        {getSpecIcon(key)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                          {getSpecLabel(key)}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {formattedValue}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicle.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {vehicle.documentUrls && vehicle.documentUrls.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Documents</h2>
                <div className="space-y-2">
                  {vehicle.documentUrls.map((doc, index) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all duration-200"
                    >
                      <FileText className="h-5 w-5 text-slate-700" />
                      <span className="text-sm font-medium text-slate-900">
                        Document {index + 1}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Interested in this vehicle?
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Get in touch with us for more information or to schedule a viewing.
                </p>

                <button
                  onClick={handleInquiryClick}
                  className="w-full px-6 py-4 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
                  style={
                    listingsInquiryForm?.themeColor
                      ? {
                          background: `linear-gradient(135deg, ${listingsInquiryForm.themeColor} 0%, ${getDarkerShade(listingsInquiryForm.themeColor, 10)} 100%)`}
                      : {
                          background: 'linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 100%)'}
                  }
                >
                  <Mail className="h-5 w-5" />
                  {inquiryButtonText}
                </button>

                {website?.contactPhone && (
                  <a
                    href={`tel:${website.contactPhone}`}
                    className="w-full mt-3 px-6 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Phone className="h-5 w-5" />
                    Call Us
                  </a>
                )}

                {website?.contactEmail && (
                  <a
                    href={`mailto:${website.contactEmail}`}
                    className="w-full mt-3 px-6 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Mail className="h-5 w-5" />
                    Email Us
                  </a>
                )}
              </div>

              {/* Location Card */}
              {website?.address && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-slate-700" />
                    Location
                  </h3>
                  <p className="text-sm text-slate-600">
                    {website.address}
                  </p>
                </div>
              )}

              {/* Quick Specs Summary */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Year</span>
                    <span className="text-sm font-semibold text-slate-900">{vehicle.year}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Make</span>
                    <span className="text-sm font-semibold text-slate-900">{vehicle.make}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Model</span>
                    <span className="text-sm font-semibold text-slate-900">{vehicle.model}</span>
                  </div>
                  {specs.mileage && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Mileage</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {Number(specs.mileage).toLocaleString()} km
                      </span>
                    </div>
                  )}
                  {specs.transmission && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Transmission</span>
                      <span className="text-sm font-semibold text-slate-900">{specs.transmission}</span>
                    </div>
                  )}
                  {specs.fuelType && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Fuel Type</span>
                      <span className="text-sm font-semibold text-slate-900">{specs.fuelType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {openFormId && openFormId !== 'none' && listingsInquiryForm && (
        <FormModal
          form={convertConvexForm(listingsInquiryForm)}
          isOpen={!!openFormId}
          onClose={() => setOpenFormId(null)}
          sourcePage={`/listings/${vehicleId}`}
          vehicleId={vehicle._id}
          vehicleName={vehicle.name}
          vehicleData={{
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            reference: vehicle.reference,
            vin: vehicle.vin,
            condition: vehicle.condition as 'new' | 'used'}}
        />
      )}

      {/* Loading state while form is being fetched */}
      {openFormId && openFormId !== 'none' && listingsInquiryForm === undefined && inquiryTarget === 'form' && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-slate-900 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Loading Form...
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Fallback to website's default inquiry form if listings form is not available */}
      {openFormId && openFormId !== 'none' && !listingsInquiryForm && inquiryForm && (
        <FormModal
          form={convertConvexForm(inquiryForm)}
          isOpen={!!openFormId}
          onClose={() => setOpenFormId(null)}
          sourcePage={`/listings/${vehicleId}`}
          vehicleId={vehicle._id}
          vehicleName={vehicle.name}
          vehicleData={{
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            reference: vehicle.reference,
            vin: vehicle.vin,
            condition: vehicle.condition as 'new' | 'used'}}
        />
      )}

      {/* Contact Form Not Available - Use Default Inquiry Modal */}
      {openFormId && openFormId !== 'none' && inquiryTarget === 'form' && listingsInquiryForm === null && (
        <VehicleInquiryModal
          isOpen={true}
          onClose={() => setOpenFormId(null)}
          vehicleData={{
            name: vehicle.name,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            reference: vehicle.reference,
            vin: vehicle.vin,
            condition: vehicle.condition as 'new' | 'used',
            price: vehicle.price,
            image: vehicle.featuredImage || (vehicle.images && vehicle.images[0])}}
          sourcePage={`/listings/${vehicleId}`}
          websiteId={website?._id}
        />
      )}

      {/* Default Vehicle Inquiry Modal - Always available, integrated with EasySystems */}
      {openFormId === 'none' && (
        <VehicleInquiryModal
          isOpen={openFormId === 'none'}
          onClose={() => setOpenFormId(null)}
          vehicleData={{
            name: vehicle.name,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            reference: vehicle.reference,
            vin: vehicle.vin,
            condition: vehicle.condition as 'new' | 'used',
            price: vehicle.price,
            image: vehicle.featuredImage || (vehicle.images && vehicle.images[0])}}
          sourcePage={`/listings/${vehicleId}`}
          websiteId={website?._id}
          recipients={inquiryRecipients}
          sendThankYouEmail={inquirySendThankYouEmail}
          thankYouEmailSubject={inquiryThankYouEmailSubject}
          thankYouEmailMessage={inquiryThankYouEmailMessage}
          successMessage={inquirySuccessMessage}
        />
      )}

      {/* Footer from home page - only show if showFooterOnDetails is true */}
      {footerSection && showFooterOnDetails && (
        <>
          {footerSection.templateId === 'footer-modern' ? (
            <FooterModern
              content={footerSection.content as any}
              settings={footerSection.settings as any}
              currentPageSlug={`/listings/${vehicleId}`}
            />
          ) : (
            <FooterBasic
              content={footerSection.content as any}
              settings={footerSection.settings as any}
              currentPageSlug={`/listings/${vehicleId}`}
            />
          )}
        </>
      )}
    </div>
  );
}
