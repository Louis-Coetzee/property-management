'use client';

import type { TestimonialsSectionContent } from '@/types/page-builder';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TestimonialsModernProps {
  content: TestimonialsSectionContent;
  settings?: {
    backgroundColor?: string;
    padding?: {
      top?: string;
      bottom?: string;
    };
    fullWidth?: boolean;
  };
}

export function TestimonialsModern({ content, settings }: TestimonialsModernProps) {
  const {
    title = 'Trusted by Industry Leaders',
    subtitle = '',
    testimonials = [],
    accentColor: providedAccentColor,
    textColor: providedTextColor,
  } = content;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '6rem';
  const paddingBottom = padding.bottom ?? '6rem';

  const backgroundColor = content.backgroundColor ?? settings?.backgroundColor ?? '#0f172a';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const getContrastColor = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#1a1a1a' : '#ffffff';
  };

  // Use provided text color or derive from background contrast
  const headingColor = providedTextColor || getContrastColor(backgroundColor);
  const paragraphColor = headingColor;
  const isDarkBg = getContrastColor(backgroundColor) === '#ffffff';

  // Use provided accent color or default to indigo
  const accentColor = providedAccentColor || '#6366f1';

  // Helper to lighten/darken a color
  const adjustColor = (hex: string, percent: number) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);

    const adjust = (value: number) => {
      const adjusted = value + (255 * percent / 100);
      return Math.min(255, Math.max(0, Math.round(adjusted)));
    };

    const toHex = (value: number) => value.toString(16).padStart(2, '0');
    return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
  };

  // Create gradient from accent color
  const lighterAccent = adjustColor(accentColor, 20);
  const accentGradient = `linear-gradient(135deg, ${accentColor} 0%, ${lighterAccent} 100%)`;

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length, currentIndex]);

  const handlePrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className="w-5 h-5"
        style={{
          fill: i < rating ? '#fbbf24' : 'none',
          color: i < rating ? '#fbbf24' : (isDarkBg ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'),
        }}
      />
    ));
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
      }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${lighterAccent} 0%, transparent 70%)`,
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${isDarkBg ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          {title && (
            <h2
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
              style={{
                color: headingColor,
                background: accentGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              className="text-xl sm:text-2xl leading-relaxed max-w-2xl mx-auto"
              style={{ color: paragraphColor, opacity: 0.7 }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Testimonials Carousel */}
        {testimonials.length > 0 ? (
          <div className="max-w-5xl mx-auto">
            {/* Main testimonial card */}
            <div
              className="relative p-10 sm:p-14 lg:p-16 rounded-3xl transition-all duration-500"
              style={{
                backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
              }}
            >
              {/* Large quote icon */}
              <div
                className="absolute top-10 right-10 w-16 h-16 rounded-2xl flex items-center justify-center opacity-10"
                style={{ backgroundColor: headingColor }}
              >
                <Quote className="w-8 h-8" style={{ color: headingColor === '#ffffff' ? '#000000' : '#ffffff' }} />
              </div>

              {/* Content */}
              <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                {/* Rating */}
                {currentTestimonial.rating && (
                  <div className="flex items-center justify-center gap-1.5 mb-8">
                    {renderStars(currentTestimonial.rating)}
                  </div>
                )}

                {/* Quote */}
                <blockquote
                  className="text-2xl sm:text-3xl lg:text-4xl font-medium leading-relaxed text-center mb-12"
                  style={{
                    color: headingColor,
                    opacity: 0.95,
                  }}
                >
                  "{currentTestimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  {/* Avatar */}
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                      boxShadow: `0 0 0 4px ${isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
                    }}
                  >
                    {currentTestimonial.avatar ? (
                      <img
                        src={currentTestimonial.avatar}
                        alt={currentTestimonial.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-2xl font-bold"
                        style={{ color: paragraphColor, opacity: 0.6 }}
                      >
                        {currentTestimonial.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="text-center sm:text-left">
                    <p
                      className="text-xl font-bold mb-1"
                      style={{ color: headingColor }}
                    >
                      {currentTestimonial.name}
                    </p>
                    {(currentTestimonial.role || currentTestimonial.company) && (
                      <p
                        className="text-base"
                        style={{ color: paragraphColor, opacity: 0.65 }}
                      >
                        {[currentTestimonial.role, currentTestimonial.company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              {testimonials.length > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button
                    onClick={handlePrevious}
                    disabled={isAnimating}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                    style={{
                      backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      border: `1px solid ${isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" style={{ color: headingColor }} />
                  </button>

                  {/* Dots indicator */}
                  <div className="flex items-center gap-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (isAnimating) return;
                          setIsAnimating(true);
                          setCurrentIndex(index);
                          setTimeout(() => setIsAnimating(false), 500);
                        }}
                        disabled={isAnimating}
                        className="h-2 rounded-full transition-all duration-300 disabled:cursor-not-allowed"
                        style={{
                          width: index === currentIndex ? '32px' : '12px',
                          backgroundColor: index === currentIndex ? accentColor : (isDarkBg ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'),
                        }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={isAnimating}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                    style={{
                      backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      border: `1px solid ${isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
                    }}
                  >
                    <ChevronRight className="w-5 h-5" style={{ color: headingColor }} />
                  </button>
                </div>
              )}
            </div>

            {/* Logos / Additional trust indicators */}
            <div className="mt-16 text-center">
              <p
                className="text-sm font-semibold uppercase tracking-wider mb-8"
                style={{ color: paragraphColor, opacity: 0.5 }}
              >
                Trusted by innovative companies worldwide
              </p>
              <div
                className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-40"
                style={{ color: headingColor }}
              >
                {/* Simplified company logo placeholders */}
                {['Google', 'Microsoft', 'Amazon', 'Stripe', 'Shopify'].map((company) => (
                  <div
                    key={company}
                    className="text-lg font-bold transition-all duration-300 hover:opacity-60 hover:scale-105"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="text-center p-16 rounded-3xl max-w-2xl mx-auto"
            style={{
              backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px dashed ${isDarkBg ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}
          >
            <Quote className="w-16 h-16 mx-auto mb-6" style={{ color: paragraphColor, opacity: 0.2 }} />
            <p className="text-xl" style={{ color: paragraphColor, opacity: 0.5 }}>
              No testimonials added yet. Add testimonials to showcase customer feedback.
            </p>
          </div>
        )}
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${backgroundColor} 0%, transparent 100%)`,
        }}
      />
    </section>
  );
}
