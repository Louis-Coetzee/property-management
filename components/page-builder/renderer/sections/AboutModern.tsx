'use client';

import { useState } from 'react';
import type { AboutSectionContent, AboutFeaturePill, AboutStat } from '@/types/page-builder';
import { ArrowRight, Award, Target } from 'lucide-react';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';
import { useRouter, usePathname } from 'next/navigation';
import { smoothScrollToSection, navigateToPageWithSection, navigateToPage } from '@/lib/page-builder/utils/scroll';
import { getSolidIconComponent } from '@/lib/page-builder/icons/solid-icons';

interface AboutModernProps {
  content: AboutSectionContent;
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

export function AboutModern({ content, settings, currentPageSlug, homePageSlug }: AboutModernProps) {
  const {
    headline = '',
    subheadline = '',
    description = '',
    imageUrl = '',
    imageAlt = '',
    imagePosition = 'left',
    imageSize = 'medium',
    ctaText = '',
    ctaLink = '#',
    ctaType = 'url',
    ctaTarget = 'url',
    ctaPageId,
    ctaSectionId,
    ctaFormId,
    ctaEnabled = true,
    backgroundColor = '#f8fafc',
    textColor = '#1e293b',
    ctaButtonBg,
    ctaButtonTextColor,
    accentColor = '#dc2626',
    showFeaturePills = true,
    featurePills = [],
    showStats = true,
    stats = [],
    showFloatingBadge = true,
    floatingBadgeValue = '15+',
    floatingBadgeLabel = 'Years Experience',
  } = content;

  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch the form when formId is set (public query)
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '3rem';
  const paddingBottom = padding.bottom ?? '3rem';

  const sectionStyle: React.CSSProperties = {
    backgroundColor,
    paddingTop,
    paddingBottom,
  };

  const getContrastColor = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#1a1a1a' : '#ffffff';
  };

  const isLight = backgroundColor.startsWith('#f') || backgroundColor.startsWith('#fff') || backgroundColor.startsWith('rgb(255');
  const headingColor = textColor;
  const paragraphColor = textColor;
  const buttonBg = ctaButtonBg || '#1a1a1a';
  const buttonText = ctaButtonTextColor || '#ffffff';

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

  // Image size configurations (responsive)
  const imageSizeConfig = {
    xs: {
      containerWidth: 'lg:w-1/4',
      imageMaxWidth: '16rem', // 256px
    },
    small: {
      containerWidth: 'lg:w-1/3',
      imageMaxWidth: '20rem', // 320px
    },
    medium: {
      containerWidth: 'lg:w-2/5',
      imageMaxWidth: '24rem', // 384px
    },
    large: {
      containerWidth: 'lg:w-1/2',
      imageMaxWidth: '28rem', // 448px
    },
    full: {
      containerWidth: 'lg:w-full',
      imageMaxWidth: '100%',
    },
  };

  const imageConfig = imageSizeConfig[imageSize];
  const isFullSize = imageSize === 'full';

  // Content width classes based on image size
  const contentWidth = imageUrl && !isFullSize
    ? (imageSize === 'xs' ? 'lg:w-3/4' : imageSize === 'small' ? 'lg:w-2/3' : imageSize === 'medium' ? 'lg:w-3/5' : 'lg:w-1/2')
    : 'lg:w-full';

  return (
    <>
      <section className="relative overflow-hidden" style={sectionStyle}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${headingColor} 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Badge */}
          {subheadline && (
            <div className="flex justify-center mb-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
                style={{ backgroundColor: accentColor, color: '#ffffff' }}
              >
                <Target className="h-4 w-4" />
                {subheadline}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className={`flex flex-col ${isFullSize ? 'gap-8' : (imagePosition === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row')} gap-12 lg:gap-16 mb-16 ${isFullSize ? '' : 'items-center'}`}>
            {/* Image Side */}
            {imageUrl && (
              <div className={`relative w-full ${isFullSize ? '' : imageConfig.containerWidth} ${isFullSize ? 'mx-auto' : ''}`}>
                <div className="relative" style={{ maxWidth: imageConfig.imageMaxWidth }}>
                  {/* Main Image */}
                  <div className="rounded-3xl overflow-hidden shadow-2xl">
                    <img
                      src={imageUrl}
                      alt={imageAlt || headline}
                      className="w-full h-auto object-cover"
                      style={{ aspectRatio: isFullSize ? '16/9' : '4/3' }}
                    />
                  </div>

                  {/* Floating Badge */}
                  {showFloatingBadge && (
                    <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl shadow-xl p-6 hidden sm:block">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                          <Award className="h-6 w-6" style={{ color: accentColor }} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold" style={{ color: headingColor }}>{floatingBadgeValue}</p>
                          <p className="text-xs" style={{ color: paragraphColor, opacity: 0.7 }}>{floatingBadgeLabel}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.1 }} />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.15 }} />
                </div>
              </div>
            )}

            {/* Content Side */}
            <div className={`w-full ${!imageUrl ? 'text-center max-w-3xl mx-auto' : (isFullSize ? 'text-center max-w-3xl mx-auto' : contentWidth)}`}>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: headingColor }}>
                {headline}
              </h2>

              {description && (
                <p
                  className="text-lg leading-relaxed mb-8"
                  style={{ color: paragraphColor, opacity: 0.8 }}
                >
                  {description}
                </p>
              )}

              {/* Feature Pills */}
              {showFeaturePills && featurePills.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-8 justify-center lg:justify-start">
                  {featurePills.map((pill: AboutFeaturePill) => {
                    const iconColor = pill.solidIconColor || accentColor;
                    const renderIcon = () => {
                      if (pill.iconType === 'emoji' && pill.icon) {
                        return <span className="text-base">{pill.icon}</span>;
                      }
                      if (pill.iconType === 'solid' && pill.solidIcon) {
                        const IconComponent = getSolidIconComponent(pill.solidIcon);
                        if (IconComponent) {
                          return <IconComponent className="h-4 w-4" style={{ color: iconColor }} />;
                        }
                      }
                      return null;
                    };

                    return (
                      <span
                        key={pill.id}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: isLight ? '#ffffff' : `${headingColor}20`,
                          color: headingColor,
                          boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                        }}
                      >
                        {renderIcon()}
                        {pill.text}
                      </span>
                    );
                  })}
                </div>
              )}

              {ctaText && ctaEnabled !== false && (
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <a
                    href={getCtaHref()}
                    onClick={handleCtaClick}
                    className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    style={{ backgroundColor: buttonBg, color: buttonText }}
                  >
                    {ctaText}
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Grid */}
          {showStats && stats.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
              {stats.map((stat: AboutStat, index: number) => {
                const iconColor = stat.solidIconColor || accentColor;
                const renderIcon = () => {
                  if (stat.iconType === 'emoji' && stat.icon) {
                    return <span className="text-2xl">{stat.icon}</span>;
                  }
                  if (stat.iconType === 'solid' && stat.solidIcon) {
                    const IconComponent = getSolidIconComponent(stat.solidIcon);
                    if (IconComponent) {
                      return <IconComponent className="h-6 w-6" style={{ color: iconColor }} />;
                    }
                  }
                  // Default fallback icons
                  const defaultIcons = [Award, Target, Award, Target];
                  const DefaultIcon = defaultIcons[index % defaultIcons.length];
                  return <DefaultIcon className="h-6 w-6" style={{ color: accentColor }} />;
                };

                return (
                  <div
                    key={stat.id || index}
                    className="relative p-6 rounded-2xl transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : `${headingColor}10`,
                      boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${iconColor}15` }}
                      >
                        {renderIcon()}
                      </div>
                      <div>
                        <p className="text-3xl font-bold mb-1" style={{ color: headingColor }}>
                          {stat.value}
                        </p>
                        <p className="text-sm" style={{ color: paragraphColor, opacity: 0.7 }}>
                          {stat.label}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar Decoration */}
                    <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${headingColor}10` }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          backgroundColor: iconColor,
                          width: `${60 + (index * 10)}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
