'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { LogoTickerSectionContent } from '@/types/page-builder';

interface LogoTickerGridProps {
  content: LogoTickerSectionContent;
  settings?: {
    backgroundColor?: string;
    padding?: {
      top?: string;
      bottom?: string;
    };
    fullWidth?: boolean;
  };
}

export function LogoTickerGrid({ content, settings }: LogoTickerGridProps) {
  const {
    title,
    logos = [],
    backgroundColor = '#ffffff',
    logoBackground = '#f8fafc',
    logoBorderRadius = 16,
    grayscale = false,
    grayscaleOnHover = false,
    opacity = 1,
  } = content;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '3rem';
  const paddingBottom = padding.bottom ?? '3rem';

  // Track hovered index for 3D rotation effect
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate random positions for a scattered look
  const getLogoStyle = (index: number) => {
    // Use deterministic "random" values based on index for SSR consistency
    const seed = index * 137.5;
    const rotateX = Math.sin(seed) * 15;
    const rotateY = Math.cos(seed) * 15;
    const scale = 0.95 + (Math.abs(Math.sin(seed * 2)) * 0.1);

    return {
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    };
  };

  const getHoverStyle = (isHovered: boolean, index: number) => {
    if (!isHovered) return getLogoStyle(index);

    return {
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.15)',
      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      zIndex: 10,
    };
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        {title && (
          <div className="text-center mb-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              {title}
            </h2>
            <p className="text-sm text-slate-500">Hover over logos to interact</p>
          </div>
        )}

        {/* Logo Grid */}
        <div className="relative" style={{ perspective: '1000px' }}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
            {logos.map((logo, index) => {
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={logo.id || index}
                  className="relative group"
                  style={{ perspective: '1000px' }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {logo.link ? (
                    <a
                      href={logo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "block w-full aspect-square flex items-center justify-center",
                        "shadow-lg hover:shadow-2xl",
                        grayscale && !isHovered && "grayscale",
                        grayscaleOnHover && isHovered && "grayscale-0"
                      )}
                      style={{
                        ...getHoverStyle(isHovered, index),
                        backgroundColor: logoBackground,
                        borderRadius: logoBorderRadius,
                        opacity: isHovered ? 1 : opacity,
                      }}
                    >
                      <img
                        src={logo.imageUrl}
                        alt={logo.name}
                        className="max-w-[70%] max-h-[70%] object-contain"
                        style={{
                          filter: grayscale && !isHovered ? 'grayscale(100%)' : 'grayscale(0%)',
                          transition: 'filter 0.3s ease',
                        }}
                      />
                      {/* Tooltip */}
                      <div
                        className={cn(
                          "absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full",
                          "px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg",
                          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                          "whitespace-nowrap pointer-events-none shadow-lg",
                          "before:content-[''] before:absolute before:-top-1 before:left-1/2 before:-translate-x-1/2",
                          "before:border-4 before:border-transparent before:border-b-slate-900"
                        )}
                      >
                        {logo.name}
                      </div>
                    </a>
                  ) : (
                    <div
                      className={cn(
                        "block w-full aspect-square flex items-center justify-center cursor-pointer",
                        "shadow-lg hover:shadow-2xl"
                      )}
                      style={{
                        ...getHoverStyle(isHovered, index),
                        backgroundColor: logoBackground,
                        borderRadius: logoBorderRadius,
                        opacity: isHovered ? 1 : opacity,
                      }}
                    >
                      <img
                        src={logo.imageUrl}
                        alt={logo.name}
                        className="max-w-[70%] max-h-[70%] object-contain"
                        style={{
                          filter: grayscale && !isHovered ? 'grayscale(100%)' : 'grayscale(0%)',
                          transition: 'filter 0.3s ease',
                        }}
                      />
                      {/* Tooltip */}
                      <div
                        className={cn(
                          "absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full",
                          "px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg",
                          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                          "whitespace-nowrap pointer-events-none shadow-lg z-20",
                          "before:content-[''] before:absolute before:-top-1 before:left-1/2 before:-translate-x-1/2",
                          "before:border-4 before:border-transparent before:border-b-slate-900"
                        )}
                      >
                        {logo.name}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtle gradient fade on edges */}
        <div
          className="absolute inset-y-0 left-0 w-12 pointer-events-none"
          style={{
            background: `linear-gradient(to right, ${backgroundColor}, transparent)`,
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-12 pointer-events-none"
          style={{
            background: `linear-gradient(to left, ${backgroundColor}, transparent)`,
          }}
        />
      </div>
    </section>
  );
}
