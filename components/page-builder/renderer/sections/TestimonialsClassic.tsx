'use client';

import type { TestimonialsSectionContent } from '@/types/page-builder';
import { Star, Quote } from 'lucide-react';
import { useState } from 'react';

interface TestimonialsClassicProps {
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

export function TestimonialsClassic({ content, settings }: TestimonialsClassicProps) {
  const {
    title = 'What Our Clients Say',
    subtitle = '',
    testimonials = [],
  } = content;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '5rem';
  const paddingBottom = padding.bottom ?? '5rem';

  const backgroundColor = settings?.backgroundColor ?? '#f8fafc';

  const getContrastColor = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#1a1a1a' : '#ffffff';
  };

  const headingColor = getContrastColor(backgroundColor);
  const paragraphColor = headingColor;
  const isDarkBg = headingColor === '#ffffff';

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

  return (
    <section
      className="relative"
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
      }}
    >
      {/* Decorative quote marks */}
      <div
        className="absolute top-20 left-10 text-9xl opacity-5 pointer-events-none select-none"
        style={{ color: headingColor, fontFamily: 'Georgia, serif' }}
      >
        &ldquo;
      </div>
      <div
        className="absolute bottom-20 right-10 text-9xl opacity-5 pointer-events-none select-none"
        style={{ color: headingColor, fontFamily: 'Georgia, serif' }}
      >
        &rdquo;
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          {title && (
            <h2
              className="text-4xl sm:text-5xl font-bold mb-6"
              style={{ color: headingColor }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              className="text-xl leading-relaxed"
              style={{ color: paragraphColor, opacity: 0.75 }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Testimonials Grid */}
        {testimonials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id || index}
                className="group relative p-8 rounded-3xl transition-all duration-500 hover:shadow-2xl"
                style={{
                  backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                  border: `1px solid ${isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
                }}
              >
                {/* Quote icon */}
                <div
                  className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{ backgroundColor: headingColor }}
                >
                  <Quote className="w-5 h-5" style={{ color: headingColor === '#ffffff' ? '#000000' : '#ffffff' }} />
                </div>

                {/* Rating */}
                {testimonial.rating && (
                  <div className="flex items-center gap-1 mb-5">
                    {renderStars(testimonial.rating)}
                  </div>
                )}

                {/* Content */}
                <p
                  className="text-lg leading-relaxed mb-8 min-h-[120px]"
                  style={{
                    color: paragraphColor,
                    opacity: 0.9,
                    fontStyle: 'italic',
                  }}
                >
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    {testimonial.avatar ? (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-xl font-bold"
                        style={{ color: paragraphColor, opacity: 0.6 }}
                      >
                        {testimonial.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <p
                      className="font-bold text-base truncate"
                      style={{ color: headingColor }}
                    >
                      {testimonial.name}
                    </p>
                    {(testimonial.role || testimonial.company) && (
                      <p
                        className="text-sm truncate"
                        style={{ color: paragraphColor, opacity: 0.65 }}
                      >
                        {[testimonial.role, testimonial.company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom accent */}
                <div
                  className="absolute bottom-0 left-0 h-1 rounded-b-3xl transition-all duration-500 group-hover:w-full w-0"
                  style={{
                    background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center p-12 rounded-3xl"
            style={{
              backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px dashed ${isDarkBg ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}
          >
            <Quote className="w-12 h-12 mx-auto mb-4" style={{ color: paragraphColor, opacity: 0.3 }} />
            <p style={{ color: paragraphColor, opacity: 0.6 }}>
              No testimonials added yet. Add testimonials to showcase customer feedback.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
