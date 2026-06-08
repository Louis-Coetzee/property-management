'use client';

import { cn } from '@/lib/utils';
import type { LogoTickerSectionContent } from '@/types/page-builder';

interface LogoTickerScrollProps {
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

export function LogoTickerScroll({ content, settings }: LogoTickerScrollProps) {
  const {
    title,
    logos = [],
    direction = 'left',
    speed = 'normal',
    logoSpacing = 48,
    logoWidth = 120,
    logoHeight = 60,
    pauseOnHover = true,
    backgroundColor = '#f8fafc',
    logoBackground = '#ffffff',
    logoBorderRadius = 12,
    grayscale = false,
    grayscaleOnHover = false,
    opacity = 1,
  } = content;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '2.5rem';
  const paddingBottom = padding.bottom ?? '2.5rem';

  // Calculate animation duration based on speed
  const speedMap: Record<string, number> = {
    slow: 40,
    normal: 25,
    fast: 15,
    'very-fast': 8,
  };

  const duration = speedMap[speed] || 25;
  const animationDirection = direction === 'right' ? 'reverse' : 'normal';

  // Triple the logos for seamless loop
  const tripledLogos = [...logos, ...logos, ...logos];

  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
      }}
    >
      {/* Title */}
      {title && (
        <div className="text-center mb-6 px-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            {title}
          </h2>
        </div>
      )}

      {/* Scrolling Container */}
      <div
        className={cn(
          "flex relative",
          pauseOnHover && "[&_:hover_.scroll-content]:pause-animation"
        )}
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        }}
      >
        <div
          className="flex scroll-content"
          style={{
            animation: `scroll-${direction} ${duration}s linear infinite`,
            animationDirection,
          }}
        >
          {tripledLogos.map((logo, index) => (
            <div
              key={`${logo.id}-${index}`}
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: logoWidth,
                height: logoHeight,
                marginRight: logoSpacing,
              }}
            >
              {logo.link ? (
                <a
                  href={logo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "w-full h-full flex items-center justify-center transition-all duration-300",
                    grayscale && "grayscale",
                    grayscaleOnHover && "hover:grayscale-0"
                  )}
                  style={{
                    backgroundColor: logoBackground,
                    borderRadius: logoBorderRadius,
                    opacity,
                  }}
                >
                  <img
                    src={logo.imageUrl}
                    alt={logo.name}
                    className="max-w-[85%] max-h-[85%] object-contain"
                    style={{
                      filter: grayscale ? 'grayscale(100%)' : 'none',
                      transition: 'filter 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (grayscaleOnHover) {
                        e.currentTarget.style.filter = 'grayscale(0%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (grayscale) {
                        e.currentTarget.style.filter = 'grayscale(100%)';
                      }
                    }}
                  />
                </a>
              ) : (
                <div
                  className={cn(
                    "w-full h-full flex items-center justify-center transition-all duration-300"
                  )}
                  style={{
                    backgroundColor: logoBackground,
                    borderRadius: logoBorderRadius,
                    opacity,
                  }}
                >
                  <img
                    src={logo.imageUrl}
                    alt={logo.name}
                    className="max-w-[85%] max-h-[85%] object-contain"
                    style={{
                      filter: grayscale ? 'grayscale(100%)' : 'none',
                      transition: 'filter 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (grayscaleOnHover) {
                        e.currentTarget.style.filter = 'grayscale(0%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (grayscale) {
                        e.currentTarget.style.filter = 'grayscale(100%)';
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        @keyframes scroll-right {
          0% {
            transform: translateX(-33.33%);
          }
          100% {
            transform: translateX(0);
          }
        }
        .scroll-content:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
