'use client';

import type { FeaturesSectionContent, FeatureContentAlignment, FeatureIconSize } from '@/types/page-builder';
import { Check, ArrowRight, Sparkles, ExternalLink, FileText, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getSolidIconComponent } from '@/lib/page-builder/icons/solid-icons';

interface FeaturesBasicProps {
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

// Helper to get link type icon
function getLinkTypeIcon(link: { type: string; url?: string }) {
  switch (link.type) {
    case 'url':
      return link.url?.startsWith('http') || link.url?.startsWith('//') ? ExternalLink : ArrowRight;
    case 'page':
      return FileText;
    case 'form':
      return MessageSquare;
    default:
      return ArrowRight;
  }
}

export function FeaturesBasic({ content, settings, currentPageSlug, websiteId }: FeaturesBasicProps) {
  const {
    title = 'Our Features',
    subtitle = '',
    features = [],
    backgroundColor: contentBgColor,
    textColor,
    accentColor,
    iconStyle = 'gradient',
    iconSize = 40, // Default to 40px
    gridLayout = 'grid-3',
    cardStyle = 'elevated',
    showCardHover = true,
  } = content;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '5rem';
  const paddingBottom = padding.bottom ?? '5rem';

  const backgroundColor = contentBgColor || settings?.backgroundColor || '#ffffff';

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
  const primaryAccent = accentColor || '#6366f1';

  // Helper to adjust color brightness
  const adjustBrightness = (hex: string, percent: number) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const adjust = (n: number) => Math.max(0, Math.min(255, n + (n * percent) / 100));
    return `#${adjust(r).toString(16).padStart(2, '0')}${adjust(g).toString(16).padStart(2, '0')}${adjust(b).toString(16).padStart(2, '0')}`;
  };

  // Grid layout classes - with centering for fewer items
  const getGridClasses = () => {
    const baseClasses = {
      'grid-2': 'md:grid-cols-2',
      'grid-3': 'md:grid-cols-2 lg:grid-cols-3',
      'grid-4': 'md:grid-cols-2 lg:grid-cols-4',
    };

    // If fewer features than max columns, add centering
    const maxColumns = {
      'grid-2': 2,
      'grid-3': 3,
      'grid-4': 4,
    };

    const max = maxColumns[gridLayout];
    const needsCentering = features.length < max;

    if (needsCentering) {
      // Use flex with centering for fewer items
      return `flex flex-wrap justify-center gap-8`;
    }

    return `grid gap-8 ${baseClasses[gridLayout]}`;
  };

  // Get card max width for centered layout
  const getCardMaxWidth = () => {
    const maxColumns = {
      'grid-2': 2,
      'grid-3': 3,
      'grid-4': 4,
    };

    const max = maxColumns[gridLayout];
    const needsCentering = features.length < max;

    if (needsCentering) {
      // Calculate width based on how many features we have vs max columns
      // Each card should take up roughly 1/max of the container width
      return `max-w-sm flex-1 min-w-[280px]`;
    }

    return ''; // Let grid handle the sizing
  };

  // Get icon background style
  const getIconStyle = () => {
    switch (iconStyle) {
      case 'solid':
        return { backgroundColor: primaryAccent };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: `2px solid ${primaryAccent}`,
        };
      case 'minimal':
        return {
          backgroundColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        };
      case 'gradient':
      default:
        return {
          background: `linear-gradient(135deg, ${primaryAccent} 0%, ${adjustBrightness(primaryAccent, -20)} 100%)`,
        };
    }
  };

  // Get card style
  const getCardStyle = (isHovered: boolean) => {
    const baseStyle: React.CSSProperties = {
      transform: (showCardHover && isHovered) ? 'translateY(-8px)' : 'translateY(0)',
    };

    switch (cardStyle) {
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          border: `2px solid ${isDarkBg ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
          boxShadow: 'none',
        };
      case 'minimal':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
        };
      case 'elevated':
      default:
        return {
          ...baseStyle,
          backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
          border: `1px solid ${isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
          boxShadow: isHovered ? '0 25px 50px -12px rgba(0,0,0,0.25)' : 'none',
        };
    }
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
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${headingColor} 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

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

        {/* Features Grid */}
        {features.length > 0 ? (
          <div className={getGridClasses()}>
            {features.map((feature, index) => {
              const isHovered = hoveredIndex === index;
              const cardStyleResult = getCardStyle(isHovered);
              const alignment: FeatureContentAlignment = feature.contentAlignment || content.contentAlignment || 'center';
              const href = getFeatureLinkHref(feature, currentPageSlug);
              const LinkIcon = feature.link ? getLinkTypeIcon(feature.link) : ArrowRight;

              // Calculate container size based on icon size (icon + padding)
              const containerSize = iconSize + 32; // 16px padding on each side

              // Get alignment classes
              const alignmentClasses = {
                left: 'text-left items-start',
                center: 'text-center items-center',
                right: 'text-right items-end',
              };

              const iconAlignmentClasses = {
                left: 'mr-auto',
                center: 'mx-auto',
                right: 'ml-auto',
              };

              const CardWrapper = href ? 'a' : 'div';
              const cardProps = href ? {
                href,
                target: feature.link?.type === 'url' && (feature.link.url?.startsWith('http') || feature.link.url?.startsWith('//')) ? '_blank' as const : undefined,
                rel: feature.link?.type === 'url' && (feature.link.url?.startsWith('http') || feature.link.url?.startsWith('//')) ? 'noopener noreferrer' : undefined,
              } : {};

              return (
                <CardWrapper
                  key={feature.id || index}
                  {...cardProps}
                  className={cn(
                    "group relative p-8 rounded-3xl transition-all duration-500 flex flex-col",
                    alignmentClasses[alignment],
                    href && "cursor-pointer",
                    getCardMaxWidth()
                  )}
                  style={cardStyleResult}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110",
                      iconAlignmentClasses[alignment]
                    )}
                    style={{
                      ...getIconStyle(),
                      width: containerSize,
                      height: containerSize,
                    }}
                  >
                  {feature.iconType === 'solid' ? (
                    (() => {
                      const IconComponent = getSolidIconComponent(feature.solidIcon || 'sparkles');
                      const iconColor = feature.solidIconColor || primaryAccent;
                      return IconComponent ? (
                        <IconComponent style={{ color: iconColor, width: iconSize, height: iconSize }} />
                      ) : (
                        <Sparkles style={{ color: iconColor, width: iconSize, height: iconSize }} />
                      );
                    })()
                  ) : feature.icon ? (
                    <span style={{ fontSize: iconSize, lineHeight: 1 }}>{feature.icon}</span>
                  ) : (
                    <Check style={{ color: '#ffffff', width: iconSize, height: iconSize }} />
                  )}
                </div>

                {/* Title */}
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: headingColor }}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p
                  className="leading-relaxed"
                  style={{ color: paragraphColor, opacity: 0.75 }}
                >
                  {feature.description}
                </p>

                {/* Hover indicator */}
                <div
                  className="absolute bottom-6 right-6 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    backgroundColor: headingColor === '#ffffff' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <LinkIcon className="w-4 h-4" style={{ color: headingColor }} />
                </div>
              </CardWrapper>
              );
            })}
          </div>
        ) : (
          <div
            className="text-center p-12 rounded-3xl"
            style={{
              backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px dashed ${isDarkBg ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}
          >
            <p style={{ color: paragraphColor, opacity: 0.6 }}>
              No features added yet. Add features to showcase your offerings.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
