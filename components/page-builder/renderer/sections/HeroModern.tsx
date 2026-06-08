'use client';

import type { HeroSectionContent } from '@/types/page-builder';
import { ArrowRight, ChevronDown, Shield, Award, Clock, Star, Check, Heart } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';
import { navigateToPageWithSection, navigateToPage } from '@/lib/page-builder/utils/scroll';

interface HeroModernProps {
  content: HeroSectionContent;
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
  homePageSlug?: string;
}

export function HeroModern({ content, settings, currentPageSlug, homePageSlug }: HeroModernProps) {
  const {
    headline = '',
    subheadline = '',
    ctaText = '',
    ctaLink = '/',
    ctaType = 'url',
    ctaPageId,
    ctaSectionId,
    ctaFormId,
    ctaBackgroundColor,
    ctaTextColor,
    colorMode = 'dark',
    backgroundColor = colorMode === 'light' ? '#ffffff' : '#0a0a0a',
    backgroundImage = '',
    backgroundType = 'color',
    textColor = colorMode === 'light' ? '#1a1a1a' : '#ffffff',
    showWelcomeTag = false,
    showScrollIndicator = true,
    showStatsCard = true,
    showTrustIndicators = true,
    statsCardTitle,
    statsCardValue,
    stats = [],
    showCustomerAvatars = true,
    customerTrustText,
    trustIndicators = [],
    // New font/size properties
    headlineFontFamily,
    headlineFontSize,
    headlineFontWeight,
    headlineColor,
    headlineTextAlign,
    subheadlineFontFamily,
    subheadlineFontSize,
    subheadlineFontWeight,
    subheadlineColor,
    subheadlineTextAlign,
  } = content;

  // Font family helper
  const getFontFamily = (fontFamily?: string): string => {
    const fontMap: Record<string, string> = {
      'Inter': 'Inter, sans-serif',
      'Playfair Display': 'Playfair Display, serif',
      'Poppins': 'Poppins, sans-serif',
      'Montserrat': 'Montserrat, sans-serif',
      'Roboto': 'Roboto, sans-serif',
      'Open Sans': 'Open Sans, sans-serif',
      'Lato': 'Lato, sans-serif',
      'Raleway': 'Raleway, sans-serif',
      'Nunito': 'Nunito, sans-serif',
      'Work Sans': 'Work Sans, sans-serif',
      'Quicksand': 'Quicksand, sans-serif',
      'Merriweather': 'Merriweather, serif',
      'Lora': 'Lora, serif',
      'PT Serif': 'PT Serif, serif',
      'Crimson Text': 'Crimson Text, serif',
      'Libre Baskerville': 'Libre Baskerville, serif',
      'Josefin Sans': 'Josefin Sans, sans-serif',
      'Oswald': 'Oswald, sans-serif',
      'Bebas Neue': 'Bebas Neue, sans-serif',
      'Anton': 'Anton, sans-serif',
      'Righteous': 'Righteous, cursive',
      'Abril Fatface': 'Abril Fatface, cursive',
      'Dancing Script': 'Dancing Script, cursive',
      'Pacifico': 'Pacifico, cursive',
      'Caveat': 'Caveat, cursive',
    };
    return fontFamily && fontMap[fontFamily] ? fontMap[fontFamily] : 'inherit';
  };

  const router = useRouter();
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch the form when formId is set
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '0';
  const paddingBottom = padding.bottom ?? '0';

  // Determine if dark mode based on colorMode setting or background brightness
  const isDark = colorMode === 'dark' || (colorMode === undefined && (() => {
    const getBrightness = (hex: string) => {
      const color = hex.replace('#', '');
      const r = parseInt(color.substr(0, 2), 16);
      const g = parseInt(color.substr(2, 2), 16);
      const b = parseInt(color.substr(4, 2), 16);
      return (r * 299 + g * 587 + b * 114) / 1000;
    };
    return getBrightness(backgroundColor) < 128;
  })());

  // Color utilities
  const adjustColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  };

  // Handle CTA click
  const handleCTAClick = (e: React.MouseEvent) => {
    const targetCtaType = ctaType || 'url';

    if (targetCtaType === 'form' && ctaFormId) {
      e.preventDefault();
      setOpenFormId(ctaFormId);
      return;
    }

    if (targetCtaType === 'page') {
      e.preventDefault();
      const pageSlug = ctaLink || '/';
      const sectionId = ctaSectionId;

      if (!sectionId) {
        navigateToPage(pageSlug, homePageSlug);
        return;
      }

      navigateToPageWithSection(pageSlug, sectionId, homePageSlug);
      return;
    }
  };

  // Default trust indicators if not configured
  const displayTrustIndicators = trustIndicators.length > 0 ? trustIndicators : [
    { id: 'default-1', icon: 'shield' as const, label: 'Verified Dealer' },
    { id: 'default-2', icon: 'award' as const, label: 'Award Winning' },
    { id: 'default-3', icon: 'clock' as const, label: 'Since 2010' },
  ];

  // Icon mapping for trust indicators
  const getTrustIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      shield: Shield,
      award: Award,
      clock: Clock,
      star: Star,
      check: Check,
      heart: Heart,
    };
    return iconMap[iconName] || Shield;
  };

  // Default stats if not configured
  const displayStats = stats.length > 0 ? stats : [
    { id: 'default-s1', value: '98%', label: 'Customer Satisfaction' },
    { id: 'default-s2', value: '500+', label: 'Happy Customers' },
    { id: 'default-s3', value: '15+', label: 'Years Experience' },
    { id: 'default-s4', value: '24/7', label: 'Support Available' },
  ];

  return (
    <>
      <section
        ref={sectionRef}
        className="relative min-h-[90vh] sm:min-h-[95vh] flex items-center overflow-hidden"
        style={{ paddingTop, paddingBottom }}
      >
        {/* Background Layer */}
        <div className="absolute inset-0">
          {/* Background Image with Parallax */}
          {backgroundImage && (
            <div
              className="absolute inset-0 transition-transform duration-100"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 30%',
                transform: `translateY(${scrollY * 0.15}px)`,
              }}
            />
          )}

          {/* Background Color or Overlay */}
          {backgroundImage ? (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${backgroundColor}EE 0%, ${adjustColor(backgroundColor, -20)}DD 50%, ${backgroundColor}F5 100%)`,
              }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundColor }}
            />
          )}

          {/* Premium Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Subtle Gradient Shine */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(ellipse 80% 50% at 20% 40%, ${adjustColor(backgroundColor, 30)} 0%, transparent 50%)`,
            }}
          />

          {/* Bottom Fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-48"
            style={{
              background: `linear-gradient(to top, ${adjustColor(backgroundColor, 5)} 0%, transparent 100%)`,
            }}
          />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-20">
          <div className="flex flex-col items-center justify-center min-h-[600px] md:min-h-[700px]">
            {/* Welcome Badge */}
            {showWelcomeTag && (
              <div className="mb-6 animate-fade-in">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold tracking-wide"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: textColor,
                  }}
                >
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
                  <span className="uppercase">Premium</span>
                </div>
              </div>
            )}

            {/* Main Headline - only render if exists */}
            {headline && (
              <h1
                className="mb-6 tracking-tight text-center max-w-4xl"
                style={{
                  color: headlineColor || textColor,
                  fontSize: headlineFontSize || '3rem',
                  fontWeight: headlineFontWeight || 'bold',
                  textAlign: headlineTextAlign || 'center',
                  fontFamily: getFontFamily(headlineFontFamily),
                }}
              >
                {headline.split('\n').map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </h1>
            )}

            {/* Subheadline - only render if exists */}
            {subheadline && (
              <p
                className="mb-8 leading-relaxed text-center max-w-2xl"
                style={{
                  color: subheadlineColor || textColor,
                  fontSize: subheadlineFontSize || '1.25rem',
                  fontWeight: subheadlineFontWeight || 'normal',
                  textAlign: subheadlineTextAlign || 'center',
                  fontFamily: getFontFamily(subheadlineFontFamily),
                  opacity: isDark ? 0.75 : 0.8,
                }}
              >
                {subheadline}
              </p>
            )}

            {/* CTA Button */}
            {ctaText && (
              <button
                onClick={handleCTAClick}
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg mb-12"
                style={{
                  backgroundColor: ctaBackgroundColor || (isDark ? '#ffffff' : '#1a1a1a'),
                  color: ctaTextColor || (isDark ? '#0a0a0a' : '#ffffff'),
                }}
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {/* Stats Section */}
            {showStatsCard && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 w-full max-w-4xl">
                {displayStats.slice(0, 4).map((stat, index) => (
                  <div
                    key={stat.id}
                    className="flex flex-col items-center text-center p-4 rounded-xl"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    }}
                  >
                    <p className="text-2xl md:text-3xl font-bold mb-1" style={{ color: textColor }}>
                      {stat.value}
                    </p>
                    <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Trust Indicators */}
            {showTrustIndicators && displayTrustIndicators.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                {displayTrustIndicators.map((indicator) => {
                  const Icon = getTrustIcon(indicator.icon);
                  return (
                    <div
                      key={indicator.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      }}
                    >
                      <span style={{ color: ctaBackgroundColor || '#22c55e' }}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="text-sm font-medium" style={{ color: textColor }}>
                        {indicator.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Customer Avatars */}
            {showCustomerAvatars && (
              <div className="flex flex-col items-center mb-8">
                <div className="flex -space-x-3 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                        color: textColor,
                        boxShadow: `0 0 0 2px ${backgroundColor}`,
                      }}
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
                  {customerTrustText || '500+ happy customers'}
                </p>
              </div>
            )}

            {/* Scroll Indicator */}
            {showScrollIndicator && (
              <div
                className="flex flex-col items-center cursor-pointer group mt-8"
                onClick={() => {
                  const nextSection = sectionRef.current?.nextElementSibling;
                  if (nextSection) {
                    nextSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span
                  className="text-sm font-medium tracking-widest uppercase mb-2 group-hover:opacity-80"
                  style={{ color: textColor, opacity: 0.5 }}
                >
                  Scroll
                </span>
                <ChevronDown className="w-6 h-6 animate-bounce" style={{ color: textColor }} />
              </div>
            )}
          </div>
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
