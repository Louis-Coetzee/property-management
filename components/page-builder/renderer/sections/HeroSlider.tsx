'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';
import { useRouter, usePathname } from 'next/navigation';
import { smoothScrollToSection, navigateToPageWithSection, navigateToPage } from '@/lib/page-builder/utils/scroll';
import type { HeroSectionContent, HeroSlide, HeroTransitionEffect } from '@/types/page-builder';

interface HeroSliderProps {
  content: HeroSectionContent;
  settings?: {
    backgroundColor?: string;
    padding?: {
      top?: string;
      bottom?: string;
    };
    fullWidth?: boolean;
  };
  currentPageSlug?: string;
  homePageSlug?: string;
}

// Helper function to adjust color brightness
function adjustBrightness(hex: string, percent: number) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}

// Helper function to get brightness of a color
function getBrightness(hex: string) {
  const color = hex.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * HeroSingle - Renders a single hero section when slider is disabled
 */
function HeroSingle({ content, settings, currentPageSlug, homePageSlug }: HeroSliderProps) {
  const {
    headline = 'Welcome to Our Website',
    subheadline = 'Build beautiful pages with our easy-to-use page builder',
    ctaText = 'Get Started',
    ctaLink = '#',
    ctaType = 'url',
    ctaTarget = 'url',
    ctaPageId,
    ctaSectionId,
    ctaFormId,
    ctaBackgroundColor,
    ctaTextColor,
    ctaEnabled = true,
    backgroundColor = '#6366f1',
    backgroundImage = '',
    backgroundType = 'color',
    textColor = '#ffffff',
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
    };
    return fontFamily && fontMap[fontFamily] ? fontMap[fontFamily] : 'inherit';
  };

  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch the form when formId is set (public query)
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '0';
  const paddingBottom = padding.bottom ?? '0';

  const isDarkBackground = backgroundType === 'color' ?
    getBrightness(backgroundColor || '#000000') < 128 : true;

  // Determine actual CTA type
  const actualCtaType = ctaType || (ctaTarget === 'form' ? 'form' : 'url');

  // Handle CTA click
  const handleCtaClick = (e: React.MouseEvent) => {
    if (actualCtaType === 'form' && ctaFormId) {
      e.preventDefault();
      setOpenFormId(ctaFormId);
      return;
    }

    if (actualCtaType === 'page') {
      e.preventDefault();
      const pageSlug = ctaLink || '/';

      if (ctaSectionId) {
        const currentPagePath = pathname || window.location.pathname;
        const targetPagePath = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;

        if (currentPagePath === targetPagePath) {
          smoothScrollToSection(ctaSectionId);
        } else {
          navigateToPageWithSection(pageSlug, ctaSectionId, homePageSlug);
        }
      } else {
        navigateToPage(pageSlug, homePageSlug);
      }
    }
  };

  // Get CTA href
  const getCtaHref = () => {
    if (actualCtaType === 'url') return ctaLink || '#';
    if (actualCtaType === 'page') {
      const pageSlug = ctaLink || '/';
      return ctaSectionId ? `${pageSlug}#section-${ctaSectionId}` : pageSlug;
    }
    return '#';
  };

  // Button colors
  const buttonBg = ctaBackgroundColor || (isDarkBackground ? '#ffffff' : '#1a1a1a');
  const buttonText = ctaTextColor || (isDarkBackground ? '#1a1a1a' : '#ffffff');

  return (
    <>
      <section
        className="relative min-h-[80vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden"
        style={{ paddingTop, paddingBottom }}
      >
        {/* Background Image */}
        {backgroundType === 'image' && backgroundImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        )}

        {/* Gradient overlay for color backgrounds */}
        {backgroundType === 'color' && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${backgroundColor} 0%, ${adjustBrightness(backgroundColor || '#6366f1', -20)} 100%)`,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Headline - only render if exists */}
            {headline && (
              <h1
                className="mb-6 tracking-tight"
                style={{
                  color: headlineColor || textColor,
                  fontSize: headlineFontSize || '3rem',
                  fontWeight: headlineFontWeight || 'bold',
                  textAlign: headlineTextAlign || 'center',
                  fontFamily: getFontFamily(headlineFontFamily),
                }}
              >
                {headline}
              </h1>
            )}
            {/* Subheadline - only render if exists */}
            {subheadline && (
              <p
                className="mb-10 leading-relaxed max-w-3xl mx-auto"
                style={{
                  color: subheadlineColor || textColor,
                  fontSize: subheadlineFontSize || '1.25rem',
                  fontWeight: subheadlineFontWeight || 'normal',
                  textAlign: subheadlineTextAlign || 'center',
                  fontFamily: getFontFamily(subheadlineFontFamily),
                  opacity: 0.9,
                }}
              >
                {subheadline}
              </p>
            )}
            {ctaText && ctaEnabled !== false && (
              <a
                href={getCtaHref()}
                onClick={handleCtaClick}
                className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 font-semibold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 group"
                style={{
                  backgroundColor: buttonBg,
                  color: buttonText,
                }}
              >
                {ctaText}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <div
            className="w-6 h-10 rounded-full border-2 flex items-start justify-center p-2"
            style={{ borderColor: textColor, opacity: 0.5 }}
          >
            <div
              className="w-1 h-2 rounded-full"
              style={{ backgroundColor: textColor }}
            />
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

export function HeroSlider({ content, settings, currentPageSlug, homePageSlug }: HeroSliderProps) {
  // Check if slider is enabled
  const sliderEnabled = content.sliderEnabled !== false;

  // Extract slider settings or use defaults
  const slides = content.slides?.length ? content.slides : [{
    headline: content.headline || 'Welcome to Our Website',
    subheadline: content.subheadline || 'Build beautiful pages with our easy-to-use page builder',
    ctaText: content.ctaText || 'Get Started',
    ctaLink: content.ctaLink || '#',
    ctaType: content.ctaType || 'url',
    ctaTarget: content.ctaTarget || 'url' as const,
    ctaPageId: content.ctaPageId,
    ctaSectionId: content.ctaSectionId,
    ctaFormId: content.ctaFormId,
    ctaBackgroundColor: content.ctaBackgroundColor,
    ctaTextColor: content.ctaTextColor,
    ctaEnabled: content.ctaEnabled,
    backgroundColor: content.backgroundColor || '#6366f1',
    backgroundImage: content.backgroundImage || '',
    backgroundType: (content.backgroundImage ? 'image' : 'color') as 'color' | 'image',
    textColor: content.textColor || '#ffffff',
  }];

  const autoplay = content.autoplay !== false;
  const autoplayDelay = content.autoplayDelay || 5;
  const showArrows = content.showArrows !== false;
  const showDots = content.showDots !== false;
  const showSlideNumbers = content.showSlideNumbers !== false;
  const showScrollIndicator = content.showScrollIndicator !== false;
  const transitionEffect: HeroTransitionEffect = content.transitionEffect || 'fade';

  // If slider is disabled, render single hero section
  if (!sliderEnabled) {
    return (
      <HeroSingle
        content={content}
        settings={settings}
        currentPageSlug={currentPageSlug}
        homePageSlug={homePageSlug}
      />
    );
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [puzzlePieces, setPuzzlePieces] = useState<number[]>([]);
  const prevIndexRef = useRef(0);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch the form when formId is set (public query)
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '0';
  const paddingBottom = padding.bottom ?? '0';

  // Auto-play functionality
  useEffect(() => {
    if (!autoplay || isPaused || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoplayDelay * 1000);

    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isPaused, slides.length]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, slides.length]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (swipeDistance > minSwipeDistance) {
      goToNext();
    } else if (swipeDistance < -minSwipeDistance) {
      goToPrevious();
    }
  };

  // Puzzle effect initialization
  useEffect(() => {
    // Create 12 puzzle pieces (4x3 grid)
    setPuzzlePieces(Array.from({ length: 12 }, (_, i) => i));
  }, []);

  // Track previous index for slide direction
  useEffect(() => {
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Get transition classes based on effect type
  const getTransitionClasses = (isActive: boolean, isPrev: boolean, isNext: boolean, index: number) => {
    const baseClasses = 'absolute inset-0 transition-all ease-in-out';
    const duration = 'duration-700';

    switch (transitionEffect) {
      case 'slide':
        return cn(
          baseClasses,
          duration,
          isActive
            ? 'opacity-100 translate-x-0 z-10'
            : isPrev
            ? 'opacity-0 -translate-x-full z-5'
            : 'opacity-0 translate-x-full z-5'
        );

      case 'zoom':
        return cn(
          baseClasses,
          duration,
          isActive
            ? 'opacity-100 scale-100 z-10'
            : 'opacity-0 scale-110 z-5'
        );

      case 'flip':
        return cn(
          baseClasses,
          duration,
          isActive
            ? 'opacity-100 rotate-y-0 z-10'
            : 'opacity-0 rotate-y-90 z-5'
        );

      case 'puzzle':
        return cn(
          baseClasses,
          isActive ? 'z-10' : 'z-5'
        );

      case 'fade':
      default:
        return cn(
          baseClasses,
          duration,
          isActive
            ? 'opacity-100 z-10'
            : 'opacity-0 z-5'
        );
    }
  };

  // Get puzzle piece animation delay
  const getPuzzleDelay = (pieceIndex: number) => {
    const row = Math.floor(pieceIndex / 4);
    const col = pieceIndex % 4;
    return (row * 50) + (col * 50);
  };

  const currentSlide = slides[currentIndex];
  const isDarkBackground = currentSlide.backgroundType === 'color' ?
    getBrightness(currentSlide.backgroundColor || '#000000') < 128 : true;

  // Handle CTA click for slides
  const handleCtaClick = (slide: HeroSlide, e: React.MouseEvent) => {
    const actualCtaType = slide.ctaType || (slide.ctaTarget === 'form' ? 'form' : 'url');

    if (actualCtaType === 'form' && slide.ctaFormId) {
      e.preventDefault();
      setOpenFormId(slide.ctaFormId);
      return;
    }

    if (actualCtaType === 'page') {
      e.preventDefault();
      const pageSlug = slide.ctaLink || '/';

      if (slide.ctaSectionId) {
        const currentPagePath = pathname || window.location.pathname;
        const targetPagePath = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;

        if (currentPagePath === targetPagePath) {
          smoothScrollToSection(slide.ctaSectionId);
        } else {
          navigateToPageWithSection(pageSlug, slide.ctaSectionId, homePageSlug);
        }
      } else {
        navigateToPage(pageSlug, homePageSlug);
      }
    }
  };

  // Get CTA href for slides
  const getCtaHref = (slide: HeroSlide) => {
    const actualCtaType = slide.ctaType || (slide.ctaTarget === 'form' ? 'form' : 'url');
    if (actualCtaType === 'url') return slide.ctaLink || '#';
    if (actualCtaType === 'page') {
      const pageSlug = slide.ctaLink || '/';
      return slide.ctaSectionId ? `${pageSlug}#section-${slide.ctaSectionId}` : pageSlug;
    }
    return '#';
  };

  // Render CTA button for slides
  const renderCtaButton = (slide: HeroSlide, isDark: boolean) => {
    if (!slide.ctaText || slide.ctaEnabled === false) return null;

    const buttonBg = slide.ctaBackgroundColor || (isDark ? '#ffffff' : '#1a1a1a');
    const buttonText = slide.ctaTextColor || (isDark ? '#1a1a1a' : '#ffffff');

    return (
      <a
        href={getCtaHref(slide)}
        onClick={(e) => handleCtaClick(slide, e)}
        className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 font-semibold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 group"
        style={{
          backgroundColor: buttonBg,
          color: buttonText,
        }}
      >
        {slide.ctaText}
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </a>
    );
  };

  return (
    <>
      <section
        className="relative min-h-[80vh] sm:min-h-[85vh] overflow-hidden"
        style={{ paddingTop, paddingBottom }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Container */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => {
            const isActive = index === currentIndex;
            const isPrev = index === (currentIndex - 1 + slides.length) % slides.length;
            const isNext = index === (currentIndex + 1) % slides.length;
            const isDark = slide.backgroundType === 'color' ?
              getBrightness(slide.backgroundColor || '#000000') < 128 : true;

            // For puzzle effect, render differently
            if (transitionEffect === 'puzzle') {
              return (
                <div
                  key={index}
                  className={cn(
                    'absolute inset-0 grid grid-cols-4 grid-rows-3 gap-0.5',
                    isActive ? 'z-10' : 'z-0 pointer-events-none'
                  )}
                >
                  {puzzlePieces.map((piece) => {
                    const row = Math.floor(piece / 4);
                    const col = piece % 4;
                    const delay = getPuzzleDelay(piece);
                    const isVisible = isActive;

                    return (
                      <div
                        key={piece}
                        className={cn(
                          'transition-all ease-out overflow-hidden',
                          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        )}
                        style={{
                          transitionDelay: `${delay}ms`,
                          transitionDuration: '400ms',
                          backgroundColor: slide.backgroundType === 'color' ? slide.backgroundColor : '#000',
                        }}
                      >
                        {/* Background Image Piece */}
                        {slide.backgroundType === 'image' && slide.backgroundImage && (
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `url(${slide.backgroundImage})`,
                              backgroundSize: '400% 300%',
                              backgroundPosition: `${col * 33.33}% ${row * 50}%`,
                              transformOrigin: `${col * 33.33}% ${row * 50}%`,
                            }}
                          />
                        )}
                        {/* Dark overlay for image */}
                        {slide.backgroundType === 'image' && (
                          <div className="absolute inset-0 bg-black/50" />
                        )}
                      </div>
                    );
                  })}

                  {/* Content overlay for puzzle - only on active slide */}
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-4xl mx-auto text-center">
                          {showSlideNumbers && slides.length > 1 && (
                            <div className="flex justify-center mb-6">
                              <span
                                className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm"
                                style={{
                                  backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.15)'
                                    : 'rgba(0, 0, 0, 0.1)',
                                  color: slide.textColor,
                                  border: `1px solid ${isDark
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : 'rgba(0, 0, 0, 0.15)'}`,
                                }}
                              >
                                {index + 1} / {slides.length}
                              </span>
                            </div>
                          )}
                          <h1
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight"
                            style={{ color: slide.textColor }}
                          >
                            {slide.headline}
                          </h1>
                          {slide.subheadline && (
                            <p
                              className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-10 leading-relaxed max-w-3xl mx-auto"
                              style={{ color: slide.textColor, opacity: 0.9 }}
                            >
                              {slide.subheadline}
                            </p>
                          )}
                          {renderCtaButton(slide, isDark)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Standard transition effects
            return (
              <div
                key={index}
                className={getTransitionClasses(isActive, isPrev, isNext, index)}
                style={{
                  backgroundColor: slide.backgroundType === 'color' ? slide.backgroundColor : '#000',
                  perspective: transitionEffect === 'flip' ? '1000px' : undefined,
                  backfaceVisibility: transitionEffect === 'flip' ? 'hidden' : undefined,
                }}
              >
                {/* Background Image */}
                {slide.backgroundType === 'image' && slide.backgroundImage && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${slide.backgroundImage})` }}
                    />
                    <div className="absolute inset-0 bg-black/50" />
                  </>
                )}

                {/* Gradient overlay for color backgrounds */}
                {slide.backgroundType === 'color' && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${slide.backgroundColor} 0%, ${adjustBrightness(slide.backgroundColor || '#6366f1', -20)} 100%)`,
                    }}
                  />
                )}

                {/* Slide Content */}
                <div className="relative z-10 h-full flex items-center justify-center">
                  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={cn(
                      'transition-all duration-700 delay-100',
                      isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    )}>
                      <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        {showSlideNumbers && slides.length > 1 && (
                          <div className="flex justify-center mb-6">
                            <span
                              className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm"
                              style={{
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.15)'
                                  : 'rgba(0, 0, 0, 0.1)',
                                color: slide.textColor,
                                border: `1px solid ${isDark
                                  ? 'rgba(255, 255, 255, 0.2)'
                                  : 'rgba(0, 0, 0, 0.15)'}`,
                              }}
                            >
                              {index + 1} / {slides.length}
                            </span>
                          </div>
                        )}

                        {/* Headline */}
                        <h1
                          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight"
                          style={{ color: slide.textColor }}
                        >
                          {slide.headline}
                        </h1>

                        {/* Subheadline */}
                        {slide.subheadline && (
                          <p
                            className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-10 leading-relaxed max-w-3xl mx-auto"
                            style={{ color: slide.textColor, opacity: 0.9 }}
                          >
                            {slide.subheadline}
                          </p>
                        )}

                        {/* CTA Button */}
                        {renderCtaButton(slide, isDark)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        {showArrows && slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={cn(
                'absolute left-4 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-20',
                'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center',
                'transition-all duration-300 hover:scale-110',
                'backdrop-blur-sm'
              )}
              style={{
                backgroundColor: isDarkBackground ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                border: `1px solid ${isDarkBackground ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
              }}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" style={{ color: currentSlide.textColor }} />
            </button>

            <button
              onClick={goToNext}
              className={cn(
                'absolute right-4 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-20',
                'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center',
                'transition-all duration-300 hover:scale-110',
                'backdrop-blur-sm'
              )}
              style={{
                backgroundColor: isDarkBackground ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                border: `1px solid ${isDarkBackground ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
              }}
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" style={{ color: currentSlide.textColor }} />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {showDots && slides.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'rounded-full transition-all duration-300',
                  index === currentIndex ? 'w-8 sm:w-10 h-2 sm:h-2.5' : 'w-2 sm:w-2.5 h-2 sm:h-2.5'
                )}
                style={{
                  backgroundColor: index === currentIndex
                    ? (currentSlide.textColor || '#ffffff')
                    : (isDarkBackground ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)'),
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
            <div
              className="w-6 h-10 rounded-full border-2 flex items-start justify-center p-2"
              style={{ borderColor: currentSlide.textColor, opacity: 0.5 }}
            >
              <div
                className="w-1 h-2 rounded-full"
                style={{ backgroundColor: currentSlide.textColor }}
              />
            </div>
          </div>
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
