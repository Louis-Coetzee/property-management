'use client';

import type { HeroSectionContent } from '@/types/page-builder';
import { ArrowRight, Play, Star, Shield, Award, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';
import { getSolidIconComponent } from '@/lib/page-builder/icons/solid-icons';
import { navigateToPage, smoothScrollToSection } from '@/lib/page-builder/utils/scroll';

interface HeroVehicleShowcaseProps {
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
    showSpecs?: boolean;
    // Primary CTA
    ctaText?: string;
    ctaLink?: string;
    ctaType?: 'url' | 'page' | 'form';
    ctaPageId?: string;
    ctaSectionId?: string;
    ctaFormId?: string;
    // Secondary CTA
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    secondaryCtaType?: 'url' | 'page' | 'form';
    secondaryCtaPageId?: string;
    secondaryCtaSectionId?: string;
    secondaryCtaFormId?: string;
    specs?: Array<{
      id: string;
      label: string;
      value: string;
    }>;
    stats?: Array<{
      id: string;
      value: string;
      label: string;
    }>;
    badges?: Array<{
      icon: string;
      text: string;
    }>;
    tagline?: string;
    subtitle?: string;
    accentColor?: string;
    textColor?: string;
  };
  settings?: {
    backgroundColor?: string;
    padding?: {
      top?: string;
      bottom?: string;
    };
    fullWidth?: boolean;
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

const DEFAULT_SPECS = [
  { id: 'spec1', label: 'Engine', value: '1.6L' },
  { id: 'spec2', label: 'Mileage', value: '45,000 km' },
  { id: 'spec3', label: 'Transmission', value: 'Automatic' },
  { id: 'spec4', label: 'Fuel', value: 'Petrol' },
];

const DEFAULT_BADGES = [
  { icon: 'shield', text: 'Certified Dealer' },
  { icon: 'award', text: 'Best Price Guarantee' },
  { icon: 'check', text: '150-Point Inspection' },
];

export function HeroVehicleShowcase({ content, settings, currentPageSlug, websiteId, homePageSlug }: HeroVehicleShowcaseProps) {
  const {
    headline = 'Find Your Perfect Vehicle',
    subheadline = 'Discover our exceptional collection of quality vehicles at competitive prices',
    ctaText = 'Browse Inventory',
    ctaLink = '/inventory',
    ctaType = 'url',
    ctaFormId,
    ctaPageId,
    ctaSectionId,
    secondaryCtaText = 'Schedule Test Drive',
    secondaryCtaLink = '#contact',
    secondaryCtaType = 'url',
    secondaryCtaFormId,
    secondaryCtaSectionId,
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
    showSpecs = true,
    specs = DEFAULT_SPECS,
    stats = DEFAULT_STATS,
    badges = DEFAULT_BADGES,
    tagline = 'Featured Vehicle',
    subtitle = 'Premium Quality • Best Value',
    accentColor = '#dc2626',
    backgroundColor = '#0a0a0a',
    textColor,
  } = content;

  const router = useRouter();
  const pathname = usePathname();
  const [openFormId, setOpenFormId] = useState<string | null>(null);

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '0';
  const paddingBottom = padding.bottom ?? '0';

  // Detect if background is light or dark
  const isLightBackground = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  const isLight = isLightBackground(backgroundColor);

  // Dynamic colors based on background
  const headingColor = textColor || (isLight ? '#1f2937' : '#ffffff');
  const subtextColor = isLight ? '#6b7280' : '#9ca3af';
  const mutedColor = isLight ? '#9ca3af' : '#6b7280';
  const cardBg = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)';
  const secondaryButtonBg = isLight ? '#1f2937' : 'rgba(255,255,255,0.1)';
  const secondaryButtonText = isLight ? '#ffffff' : '#ffffff';
  const secondaryButtonBorder = isLight ? '#1f2937' : 'rgba(255,255,255,0.2)';

  // Fetch the form when formId is set
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  // Helper to find section element by ID (handles both with and without section- prefix)
  const findSectionElement = (sectionId: string): HTMLElement | null => {
    // First try with section- prefix (how PageRenderer renders them)
    let element = document.getElementById(`section-${sectionId}`);
    if (element) return element;
    // Then try without prefix
    element = document.getElementById(sectionId);
    return element;
  };

  // Helper to normalize paths for comparison (handles home page variations)
  const normalizePath = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || '';

    // If this is the home page (path is /, empty, or matches common home slugs), normalize to /
    if (lastSegment === '' || lastSegment === 'home') {
      return '/';
    }
    return `/${lastSegment}`;
  };

  // Handle CTA click with smooth scrolling support
  const handleCTAClick = (e: React.MouseEvent, type?: string, formId?: string, link?: string, sectionId?: string) => {
    const targetCtaType = type || 'url';

    if (targetCtaType === 'form' && formId) {
      e.preventDefault();
      setOpenFormId(formId);
      return;
    }

    // Handle page type with section ID (from HeroCTAEditor)
    if (targetCtaType === 'page') {
      e.preventDefault();

      // If we have a section ID, handle same-page scrolling or navigation with section
      if (sectionId) {
        const currentPagePath = pathname || window.location.pathname;
        const targetPagePath = link || '/';

        // Normalize paths for comparison
        const currentNormalized = normalizePath(currentPagePath);
        const targetNormalized = normalizePath(targetPagePath);

        // If we're on the same page, scroll to section
        if (currentNormalized === targetNormalized) {
          const element = findSectionElement(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }

        // Navigate to the page and store section to scroll to
        sessionStorage.setItem('targetSectionId', sectionId);
        navigateToPage(targetPagePath || '/', homePageSlug);
        return;
      }

      // No section ID, just navigate to the page
      navigateToPage(link || '/', homePageSlug);
      return;
    }

    // Handle URL type with section links
    if (targetCtaType === 'url' && link) {
      // Check if it's a pure hash link (same page section)
      if (link.startsWith('#')) {
        e.preventDefault();
        const hashSectionId = link.substring(1);
        const element = findSectionElement(hashSectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      // Check if it's a page + section link (e.g., /page#section or /home#inventory)
      const hashIndex = link.indexOf('#');
      const hasSection = hashIndex !== -1;

      if (hasSection) {
        e.preventDefault();
        const pagePath = link.substring(0, hashIndex);
        const sectionHash = link.substring(hashIndex + 1);

        // Normalize paths for comparison to handle home page variations
        const currentPagePath = pathname || window.location.pathname;
        const targetPagePath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
        const currentNormalized = normalizePath(currentPagePath);
        const targetNormalized = normalizePath(targetPagePath);

        // If we're on the same page, scroll to section
        if (currentNormalized === targetNormalized) {
          const element = findSectionElement(sectionHash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }

        // Navigate to the page and store section to scroll to
        sessionStorage.setItem('targetSectionId', sectionHash);
        navigateToPage(pagePath || '/', homePageSlug);
        return;
      }

      // For URL type without hash, let the default anchor behavior work
      return;
    }
  };

  const getCtaHref = (type?: string, link?: string) => {
    const targetCtaType = type || 'url';
    if (targetCtaType === 'url') return link || '#';
    if (targetCtaType === 'page') return link || '/';
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
        className="w-3.5 h-3.5"
        style={{
          fill: i < Math.floor(rating) ? accentColor : 'none',
          color: i < Math.floor(rating) ? accentColor : (isLight ? '#d1d5db' : '#4b5563'),
        }}
      />
    ));
  };

  return (
    <>
      <section
        className="relative overflow-hidden min-h-[90vh] flex items-center"
        style={{ backgroundColor, paddingTop, paddingBottom }}
      >
        {/* Background Gradient - only show in dark mode for subtle effect */}
        {!isLight && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${accentColor}15 0%, transparent 50%)`,
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-1/2"
              style={{
                background: `linear-gradient(to top, ${accentColor}08 0%, transparent 100%)`,
              }}
            />
          </div>
        )}

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left Column - Vehicle Image */}
            <div className="lg:col-span-7 order-1 lg:order-1 relative flex flex-col items-start gap-4">
              {/* Tagline - moved to left side */}
              {tagline && (
                <div className="inline-flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span
                    className="text-xs font-semibold tracking-[0.2em] uppercase"
                    style={{ color: mutedColor }}
                  >
                    {tagline}
                  </span>
                </div>
              )}

              {/* Decorative Elements - only show in dark mode */}
              {!isLight && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Glow behind vehicle */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] rounded-full blur-3xl"
                    style={{ backgroundColor: `${accentColor}20` }}
                  />
                </div>
              )}

              {/* Vehicle Image Container */}
              <div
                className="relative w-full mt-4"
                style={{
                  clipPath: isLight ? 'none' : 'inset(18% 0 0 0)',
                  marginTop: isLight ? '0' : '-12%',
                  backgroundColor: backgroundColor, // Same as section background for seamless blend
                }}
              >
                {/* Price Badge - left side of vehicle image */}
                {showPriceTag && (
                  <div
                    className="absolute left-0 top-[75%] z-20 rounded-xl shadow-xl px-4 py-2 border"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.1)'
                    }}
                  >
                    <p className="text-lg font-bold" style={{ color: '#1f2937' }}>{vehiclePrice}</p>
                  </div>
                )}

                <img
                  src={vehicleImage}
                  alt={vehicleName}
                  className="w-full h-auto object-contain max-h-[50vh] lg:max-h-[60vh] mx-auto"
                  style={{ filter: isLight ? 'drop-shadow(0 25px 50px rgba(0,0,0,0.15))' : 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))' }}
                />
              </div>

              {/* Vehicle Specs - single row, scrollable on mobile */}
              {showSpecs && specs && specs.length > 0 && (
                <div
                  className="flex items-center w-full backdrop-blur-sm rounded-2xl overflow-hidden border"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                >
                  {specs.map((spec, index) => (
                    <div
                      key={spec.id}
                      className="flex-1 flex flex-col items-center text-center py-2 sm:py-3 px-2 sm:px-4 relative min-w-0"
                    >
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5" style={{ color: mutedColor }}>{spec.label}</p>
                      <p className="text-xs sm:text-sm font-semibold truncate" style={{ color: headingColor }}>{spec.value}</p>
                      {index < specs.length - 1 && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 sm:h-8" style={{ backgroundColor: cardBorder }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-5 order-2 lg:order-2">
              {/* Rating Badge */}
              {showReviews && (
                <div
                  className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full border"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                >
                  <div className="flex items-center gap-1">
                    {renderStars(rating)}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: headingColor }}>{rating}</span>
                  <span className="text-xs" style={{ color: mutedColor }}>({reviewCount} Reviews)</span>
                </div>
              )}

              {/* Main Headline */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-[1.1] tracking-tight"
                style={{ color: headingColor }}
              >
                {headline}
              </h1>

              {/* Subtitle */}
              {subtitle && (
                <p className="text-sm font-medium mb-4 tracking-wide" style={{ color: accentColor }}>
                  {subtitle}
                </p>
              )}

              {/* Subheadline */}
              <p
                className="text-base sm:text-lg mb-8 max-w-md leading-relaxed"
                style={{ color: subtextColor }}
              >
                {subheadline}
              </p>

              {/* CTA Buttons - moved to right side */}
              <div className="flex flex-wrap gap-3 mb-8">
                {showPrimaryCta && (
                  <a
                    href={getCtaHref(ctaType, ctaLink)}
                    onClick={(e) => handleCTAClick(e, ctaType, ctaFormId, ctaLink, ctaSectionId)}
                    className="group inline-flex items-center gap-2 px-6 py-3.5 font-semibold rounded-xl transition-all duration-300 shadow-lg"
                    style={{
                      backgroundColor: accentColor,
                      color: '#ffffff',
                      boxShadow: `0 10px 40px -10px ${accentColor}50`
                    }}
                  >
                    {ctaText}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}

                {showSecondaryCta && (
                  <a
                    href={getCtaHref(secondaryCtaType, secondaryCtaLink)}
                    onClick={(e) => handleCTAClick(e, secondaryCtaType, secondaryCtaFormId, secondaryCtaLink, secondaryCtaSectionId)}
                    className="group inline-flex items-center gap-2 px-6 py-3.5 font-semibold rounded-xl transition-all duration-300 border"
                    style={{
                      backgroundColor: secondaryButtonBg,
                      color: secondaryButtonText,
                      borderColor: secondaryButtonBorder
                    }}
                  >
                    <Play className="w-4 h-4" style={{ color: isLight ? '#ffffff' : accentColor }} />
                    {secondaryCtaText}
                  </a>
                )}
              </div>

              {/* Trust Badges */}
              {badges && badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, index) => {
                    const Icon = getBadgeIcon(badge.icon);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                      >
                        <span style={{ color: accentColor }}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-medium" style={{ color: subtextColor }}>{badge.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Stats Bar */}
          {showQuickStats && stats && stats.length > 0 && (
            <div className="mt-16 pt-8" style={{ borderTop: `1px solid ${cardBorder}` }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
                {stats.map((stat: any) => {
                  // Get icon component if using solid icons
                  const SolidIcon = stat.iconType === 'solid' ? getSolidIconComponent(stat.solidIcon) : null;

                  return (
                    <div key={stat.id} className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-3 mb-1">
                        {/* Icon */}
                        {stat.iconType === 'emoji' && stat.emoji && (
                          <span className="text-2xl">{stat.emoji}</span>
                        )}
                        {stat.iconType === 'solid' && SolidIcon && (
                          <SolidIcon
                            className="w-6 h-6"
                            style={{ color: stat.solidIconColor || accentColor }}
                          />
                        )}
                        {/* Value */}
                        <p
                          className="text-3xl sm:text-4xl font-bold"
                          style={{ color: headingColor, textShadow: isLight ? 'none' : `0 0 30px ${accentColor}30` }}
                        >
                          {stat.value}
                        </p>
                      </div>
                      {/* Label */}
                      <p className="text-sm" style={{ color: mutedColor }}>{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Gradient Fade - only for dark mode */}
        {!isLight && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        )}
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
