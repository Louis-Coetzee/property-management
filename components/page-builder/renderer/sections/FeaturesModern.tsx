'use client';

import type { FeaturesSectionContent, FeatureContentAlignment, FeatureIconSize } from '@/types/page-builder';
import { Zap, Shield, Rocket, Sparkles, ArrowRight, ExternalLink, FileText, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getSolidIconComponent } from '@/lib/page-builder/icons/solid-icons';

interface FeaturesModernProps {
  content: FeaturesSectionContent;
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
}

// Helper function to get href from feature link
function getFeatureLinkHref(feature: { link?: { type: string; url?: string; pageId?: string; sectionId?: string; formId?: string } }, currentPageSlug?: string): string | null {
  if (!feature.link) return null;

  switch (feature.link.type) {
    case 'url':
      return feature.link.url || null;
    case 'page':
      if (feature.link.pageId) {
        const path = feature.link.sectionId
          ? `/${currentPageSlug || ''}#section-${feature.link.sectionId}`
          : `/${currentPageSlug || ''}`;
        return path;
      }
      return null;
    case 'form':
      return feature.link.formId ? `#form-${feature.link.formId}` : null;
    default:
      return null;
  }
}

export function FeaturesModern({ content, settings, currentPageSlug, websiteId }: FeaturesModernProps) {
  const {
    title = 'Powerful Features',
    subtitle = '',
    badgeText = 'Why Choose Us',
    showBadge = true,
    features = [],
    backgroundColor: contentBgColor,
    textColor,
    accentColor: contentAccentColor,
    iconStyle = 'gradient',
    iconSize = 40, // Default to 40px
    autoRotate = true,
    rotationDelay = 4,
  } = content;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '6rem';
  const paddingBottom = padding.bottom ?? '6rem';

  const backgroundColor = contentBgColor || settings?.backgroundColor || '#0f172a';
  const [activeFeature, setActiveFeature] = useState(0);

  const getContrastColor = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#1a1a1a' : '#ffffff';
  };

  const headingColor = textColor || getContrastColor(backgroundColor);
  const paragraphColor = headingColor;
  const isDarkBg = getContrastColor(backgroundColor) === '#ffffff';
  const accentColor = contentAccentColor || '#6366f1';

  // Helper to adjust color brightness
  const adjustBrightness = (hex: string, percent: number) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const adjust = (n: number) => Math.max(0, Math.min(255, n + (n * percent) / 100));
    return `#${adjust(r).toString(16).padStart(2, '0')}${adjust(g).toString(16).padStart(2, '0')}${adjust(b).toString(16).padStart(2, '0')}`;
  };

  const accentGradient = `linear-gradient(135deg, ${accentColor} 0%, ${adjustBrightness(accentColor, -15)} 50%, ${adjustBrightness(accentColor, -30)} 100%)`;

  // Helper to convert hex to rgb values
  const hexToRgb = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    return `${r}, ${g}, ${b}`;
  };

  // Auto-rotate active feature
  useEffect(() => {
    if (!autoRotate || features.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, rotationDelay * 1000);
    return () => clearInterval(interval);
  }, [features.length, autoRotate, rotationDelay]);

  // Get icon background style
  const getIconStyle = (isActive: boolean) => {
    switch (iconStyle) {
      case 'solid':
        return { backgroundColor: accentColor };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: `2px solid ${accentColor}`,
        };
      case 'minimal':
        return {
          backgroundColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        };
      case 'gradient':
      default:
        return isActive ? { background: accentGradient } : { backgroundColor: isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' };
    }
  };

  // Icon mapping - now uses the solid icon system
  const getIconComponent = (feature: typeof features[0]) => {
    if (feature.iconType === 'solid') {
      return getSolidIconComponent(feature.solidIcon || 'sparkles') || Sparkles;
    }
    // For emoji icons, we still return a fallback lucide icon for the list view
    // The actual emoji is rendered separately
    return Sparkles;
  };

  // Get the icon color for a feature
  const getIconColor = (feature: typeof features[0]) => {
    if (feature.iconType === 'solid') {
      return feature.solidIconColor || accentColor;
    }
    return accentColor;
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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{
            background: `radial-gradient(circle, #a855f7 0%, transparent 70%)`,
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, ${isDarkBg ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px), linear-gradient(to bottom, ${isDarkBg ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          {/* Badge */}
          {showBadge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)', border: `1px solid ${isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}` }}>
              <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
              <span className="text-sm font-medium" style={{ color: paragraphColor, opacity: 0.9 }}>{badgeText}</span>
            </div>
          )}

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

        {/* Features Showcase */}
        {features.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Feature List */}
            <div className="space-y-4">
              {features.map((feature, index) => {
                const IconComponent = getIconComponent(feature);
                const iconColor = getIconColor(feature);
                const isActive = activeFeature === index;

                // Calculate list container size based on icon size
                const listContainerSize = iconSize + 24; // 12px padding on each side

                return (
                  <button
                    key={feature.id || index}
                    onClick={() => setActiveFeature(index)}
                    className="w-full text-left group relative p-6 rounded-2xl transition-all duration-500"
                    style={{
                      backgroundColor: isActive
                        ? (isDarkBg ? `rgba(${hexToRgb(accentColor)}, 0.15)` : `rgba(${hexToRgb(accentColor)}, 0.08)`)
                        : (isDarkBg ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                      border: isActive
                        ? `1px solid ${accentColor}`
                        : `1px solid ${isDarkBg ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <div className="flex items-start gap-5">
                      {/* Icon */}
                      <div
                        className="flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-300"
                        style={{
                          ...getIconStyle(isActive),
                          width: listContainerSize,
                          height: listContainerSize,
                        }}
                      >
                        {feature.iconType === 'solid' ? (
                          <IconComponent
                            className="transition-colors duration-300"
                            style={{ color: isActive ? '#ffffff' : iconColor, width: iconSize, height: iconSize }}
                          />
                        ) : feature.icon ? (
                          <span style={{ fontSize: iconSize, lineHeight: 1 }}>{feature.icon}</span>
                        ) : (
                          <IconComponent
                            className="transition-colors duration-300"
                            style={{ color: isActive ? '#ffffff' : (paragraphColor + '80'), width: iconSize, height: iconSize }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-bold mb-1.5 transition-colors duration-300"
                          style={{ color: headingColor }}
                        >
                          {feature.title}
                        </h3>
                        <p
                          className="text-sm leading-relaxed line-clamp-2"
                          style={{ color: paragraphColor, opacity: 0.7 }}
                        >
                          {feature.description}
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <ArrowRight
                        className="flex-shrink-0 w-5 h-5 transition-all duration-300"
                        style={{
                          color: accentColor,
                          opacity: isActive ? 1 : 0,
                          transform: isActive ? 'translateX(0)' : 'translateX(-8px)',
                        }}
                      />
                    </div>

                    {/* Progress bar */}
                    <div
                      className="absolute bottom-0 left-0 h-0.5 transition-all duration-500 rounded-full"
                      style={{
                        width: isActive ? '100%' : '0%',
                        background: accentGradient,
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Active Feature Display */}
            <div className="relative">
              {/* Background glow */}
              <div
                className="absolute inset-0 rounded-3xl opacity-30 blur-3xl"
                style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
              />

              {/* Content card */}
              {(() => {
                const activeFeat = features[activeFeature];
                const href = activeFeat ? getFeatureLinkHref(activeFeat, currentPageSlug) : null;
                const CardWrapper = href ? 'a' : 'div';
                const cardProps = href ? {
                  href,
                  target: activeFeat?.link?.type === 'url' && (activeFeat?.link?.url?.startsWith('http') || activeFeat?.link?.url?.startsWith('//')) ? '_blank' as const : undefined,
                  rel: activeFeat?.link?.type === 'url' && (activeFeat?.link?.url?.startsWith('http') || activeFeat?.link?.url?.startsWith('//')) ? 'noopener noreferrer' : undefined,
                } : {};

                // Calculate display card container and icon sizes based on iconSize
                const displayContainerSize = iconSize + 48; // Larger container for display
                const displayIconSize = iconSize * 1.5; // Slightly larger icon for display card

                return (
                  <CardWrapper
                    {...cardProps}
                    className={cn(
                      "relative block p-10 lg:p-12 rounded-3xl transition-all duration-500",
                      (() => {
                        const alignment: FeatureContentAlignment = activeFeat?.contentAlignment || content.contentAlignment || 'center';
                        return {
                          left: 'text-left items-start',
                          center: 'text-center items-center',
                          right: 'text-right items-end',
                        }[alignment];
                      })()
                    )}
                    style={{
                      backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "rounded-2xl flex items-center justify-center mb-8 transition-all duration-500",
                        (() => {
                          const alignment: FeatureContentAlignment = activeFeat?.contentAlignment || content.contentAlignment || 'center';
                          return {
                            left: 'mr-auto',
                            center: 'mx-auto',
                            right: 'ml-auto',
                          }[alignment];
                        })()
                      )}
                      style={{
                        ...getIconStyle(true),
                        width: displayContainerSize,
                        height: displayContainerSize,
                      }}
                    >
                      {activeFeat?.iconType === 'solid' ? (
                        (() => {
                          const IconComponent = getIconComponent(activeFeat);
                          return <IconComponent style={{ color: '#ffffff', width: displayIconSize, height: displayIconSize }} />;
                        })()
                      ) : activeFeat?.icon ? (
                        <span style={{ fontSize: displayIconSize, lineHeight: 1 }}>{activeFeat.icon}</span>
                      ) : (
                        <Sparkles style={{ color: '#ffffff', width: displayIconSize, height: displayIconSize }} />
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className="text-3xl sm:text-4xl font-bold mb-6 leading-tight transition-all duration-300 w-full"
                      style={{ color: headingColor }}
                    >
                      {activeFeat?.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-lg leading-relaxed transition-all duration-300 w-full"
                      style={{ color: paragraphColor, opacity: 0.75 }}
                    >
                      {activeFeat?.description}
                    </p>

                    {/* Link indicator / Decorative element */}
                    {(href || !activeFeat?.link) && (
                      <div
                        className={cn(
                          "mt-8 flex items-center gap-3",
                          (() => {
                            const alignment: FeatureContentAlignment = activeFeat?.contentAlignment || content.contentAlignment || 'center';
                            return {
                              left: 'justify-start',
                              center: 'justify-center',
                              right: 'justify-end',
                            }[alignment];
                          })()
                        )}
                        style={{ color: accentColor }}
                      >
                        <span className="text-sm font-semibold">{href ? 'Learn more' : 'Feature details'}</span>
                        {href && (activeFeat?.link?.type === 'url' && (activeFeat?.link?.url?.startsWith('http') || activeFeat?.link?.url?.startsWith('//')) ? (
                          <ExternalLink className="w-4 h-4" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        ))}
                      </div>
                    )}
                  </CardWrapper>
                );
              })()}
            </div>
          </div>
        ) : (
          <div
            className="text-center p-16 rounded-3xl"
            style={{
              backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px dashed ${isDarkBg ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: paragraphColor, opacity: 0.3 }} />
            <p style={{ color: paragraphColor, opacity: 0.5 }}>
              No features added yet. Add features to showcase your offerings.
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
