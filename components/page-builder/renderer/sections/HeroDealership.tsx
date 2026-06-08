'use client';

import { useState } from 'react';
import type { HeroSectionContent } from '@/types/page-builder';
import { ArrowRight, Play, Star, Shield, Award, CheckCircle } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';
import { smoothScrollToSection, navigateToPageWithSection, navigateToPage } from '@/lib/page-builder/utils/scroll';

interface HeroDealershipProps {
  content: HeroSectionContent & {
    vehicleImage?: string;
    vehicleName?: string;
    vehiclePrice?: string;
    vehicleYear?: string;
    priceLabel?: string;
    rating?: number;
    reviewCount?: string;
    showReviews?: boolean;
    showPriceTag?: boolean;
    showVehicleBadge?: boolean;
    showPrimaryCta?: boolean;
    showSecondaryCta?: boolean;
    showQuickStats?: boolean;
    stats?: Array<{
      id: string;
      value: string;
      label: string;
    }>;
    badges?: Array<{
      icon: string;
      text: string;
    }>;
  };
  settings?: {
    backgroundColor?: string;
    padding?: {
      top?: string;
      bottom?: string;
    };
    fullWidth?: boolean;
    animation?: {
      enabled?: boolean;
      type?: string;
      duration?: number;
      delay?: number;
    };
  };
  currentPageSlug?: string;
  websiteId?: string;
  templateId?: string;
  sectionId?: string;
  homePageSlug?: string;
}

const DEFAULT_STATS = [
  { id: 'stat1', value: '200+', label: 'Vehicles in Stock' },
  { id: 'stat2', value: '15+', label: 'Years Experience' },
  { id: 'stat3', value: '98%', label: 'Happy Customers' },
];

const DEFAULT_BADGES = [
  { icon: 'shield', text: 'Certified Dealer' },
  { icon: 'award', text: 'Best Price Guarantee' },
  { icon: 'check', text: '150-Point Inspection' },
];

export function HeroDealership({ content, settings, currentPageSlug, websiteId, homePageSlug }: HeroDealershipProps) {
  const {
    headline = 'Find Your Perfect Vehicle',
    subheadline = 'Discover our exceptional collection of quality vehicles at competitive prices',
    // Primary CTA
    ctaText = 'Browse Inventory',
    ctaLink = '/inventory',
    ctaType = 'url',
    ctaPageId,
    ctaSectionId,
    ctaFormId,
    ctaBackgroundColor,
    ctaTextColor,
    ctaEnabled = true,
    // Secondary CTA
    secondaryCtaText = 'Schedule Test Drive',
    secondaryCtaLink = '#contact',
    secondaryCtaType = 'url',
    secondaryCtaPageId,
    secondaryCtaSectionId,
    secondaryCtaFormId,
    secondaryCtaBackgroundColor,
    secondaryCtaTextColor,
    secondaryCtaEnabled = true,
    // Styling
    backgroundColor = '#ffffff',
    // Vehicle content
    vehicleImage = 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
    vehicleName = '2024 Premium Sedan',
    vehiclePrice = '$45,990',
    vehicleYear = '2024',
    priceLabel = 'Starting at',
    rating = 4.9,
    reviewCount = '500+',
    showReviews = true,
    showPriceTag = true,
    showVehicleBadge = true,
    showPrimaryCta = true,
    showSecondaryCta = true,
    showQuickStats = true,
    stats = DEFAULT_STATS,
    badges = DEFAULT_BADGES,
  } = content;

  const router = useRouter();
  const pathname = usePathname();
  const [openFormId, setOpenFormId] = useState<string | null>(null);

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '0';
  const paddingBottom = padding.bottom ?? '0';

  // Fetch the form when formId is set
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  // Handle CTA click
  const handleCTAClick = (e: React.MouseEvent, type?: string, formId?: string, link?: string, pageId?: string, sectionId?: string) => {
    const targetCtaType = type || 'url';

    if (targetCtaType === 'form' && formId) {
      e.preventDefault();
      setOpenFormId(formId);
      return;
    }

    if (targetCtaType === 'page') {
      e.preventDefault();
      const pageSlug = link || '/';

      if (sectionId) {
        const currentPagePath = pathname || window.location.pathname;
        const targetPagePath = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;

        if (currentPagePath === targetPagePath) {
          smoothScrollToSection(sectionId);
        } else {
          navigateToPageWithSection(pageSlug, sectionId, homePageSlug);
        }
      } else {
        navigateToPage(pageSlug, homePageSlug);
      }
    }
  };

  // Get CTA href
  const getCtaHref = (type?: string, link?: string, sectionId?: string) => {
    const targetCtaType = type || 'url';
    if (targetCtaType === 'url') return link || '#';
    if (targetCtaType === 'page') {
      const pageSlug = link || '/';
      return sectionId ? `${pageSlug}#section-${sectionId}` : pageSlug;
    }
    return '#';
  };

  // Icon mapping for badges
  const getBadgeIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      shield: Shield,
      award: Award,
      check: CheckCircle,
      star: Star,
    };
    return iconMap[iconName] || Shield;
  };

  // Render stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className="w-4 h-4"
        style={{
          fill: i < Math.floor(rating) ? '#f59e0b' : 'none',
          color: i < Math.floor(rating) ? '#f59e0b' : '#d1d5db',
        }}
      />
    ));
  };

  // Default button colors
  const primaryButtonBg = ctaBackgroundColor || '#dc2626';
  const primaryButtonText = ctaTextColor || '#ffffff';
  const secondaryButtonBg = secondaryCtaBackgroundColor || '#ffffff';
  const secondaryButtonText = secondaryCtaTextColor || '#374151';

  return (
    <>
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor, paddingTop, paddingBottom }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M0 0h1v1H0V0zm20 20h1v1h-1v-1z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          {/* Gradient overlay */}
          <div
            className="absolute top-0 right-0 w-1/2 h-full"
            style={{
              background: `linear-gradient(135deg, transparent 0%, rgba(220, 38, 38, 0.03) 50%, rgba(239, 68, 68, 0.05) 100%)`,
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          {/* Main Hero Content */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Vehicle Image */}
            <div className="relative order-2 lg:order-1">
              {/* Main Vehicle Image */}
              <div className="relative">
                {/* Background decorative shape */}
                <div className="absolute -inset-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl -rotate-3" />

                {/* Image container */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={vehicleImage}
                    alt={vehicleName}
                    className="w-full h-auto object-cover aspect-[4/3]"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>

                {/* Floating Price Tag */}
                {showPriceTag && (
                  <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{priceLabel}</p>
                    <p className="text-2xl font-bold text-gray-900">{vehiclePrice}</p>
                    <p className="text-xs text-gray-400 mt-1">{vehicleYear} Model</p>
                  </div>
                )}

                {/* Vehicle Name Badge */}
                {showVehicleBadge && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <p className="text-sm font-semibold text-gray-900">{vehicleName}</p>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              {badges && badges.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-8">
                  {badges.map((badge, index) => {
                    const Icon = getBadgeIcon(badge.icon);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-100"
                      >
                        <Icon className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-700">{badge.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column - Content */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              {/* Rating Badge */}
              {showReviews && (
                <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-2 mb-6">
                  <div className="flex items-center gap-1">
                    {renderStars(rating)}
                  </div>
                  <span className="text-sm font-semibold text-amber-700">{rating}</span>
                  <span className="text-sm text-amber-600">({reviewCount} Reviews)</span>
                </div>
              )}

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {headline}
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                {subheadline}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-10">
                {/* Primary CTA */}
                {showPrimaryCta && ctaEnabled !== false && ctaText && (
                  <a
                    href={getCtaHref(ctaType, ctaLink, ctaSectionId)}
                    onClick={(e) => handleCTAClick(e, ctaType, ctaFormId, ctaLink, ctaPageId, ctaSectionId)}
                    className="group inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                    style={{
                      backgroundColor: primaryButtonBg,
                      color: primaryButtonText,
                      boxShadow: `0 10px 25px -5px ${primaryButtonBg}40`,
                    }}
                  >
                    {ctaText}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}

                {/* Secondary CTA */}
                {showSecondaryCta && secondaryCtaEnabled !== false && secondaryCtaText && (
                  <a
                    href={getCtaHref(secondaryCtaType, secondaryCtaLink, secondaryCtaSectionId)}
                    onClick={(e) => handleCTAClick(e, secondaryCtaType, secondaryCtaFormId, secondaryCtaLink, secondaryCtaPageId, secondaryCtaSectionId)}
                    className="group inline-flex items-center gap-2 px-6 py-4 font-semibold rounded-xl border-2 transition-all duration-300"
                    style={{
                      backgroundColor: secondaryButtonBg,
                      color: secondaryButtonText,
                      borderColor: '#e5e7eb',
                    }}
                  >
                    <Play className="w-5 h-5" style={{ color: primaryButtonBg }} />
                    {secondaryCtaText}
                  </a>
                )}
              </div>

              {/* Quick Stats */}
              {showQuickStats && stats && stats.length > 0 && (
                <div className={`grid gap-6 pt-8 border-t border-gray-100 ${
                  stats.length === 2 ? 'grid-cols-2' :
                  stats.length === 3 ? 'grid-cols-3' :
                  stats.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
                  'grid-cols-3'
                }`}>
                  {stats.map((stat) => (
                    <div key={stat.id} className="text-center lg:text-left">
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0 60V30C240 10 480 0 720 10C960 20 1200 40 1440 30V60H0Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </section>

      {/* Form Modal */}
      {openForm && (
        <FormModal
          form={openForm}
          isOpen={!!openFormId}
          onClose={() => setOpenFormId(null)}
          sourcePage={currentPageSlug}
        />
      )}
    </>
  );
}
