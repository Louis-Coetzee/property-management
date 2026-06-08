'use client';

import { useState } from 'react';
import type { AboutSectionContent } from '@/types/page-builder';
import { ArrowRight, Users } from 'lucide-react';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';
import { useRouter, usePathname } from 'next/navigation';
import { smoothScrollToSection, navigateToPageWithSection, navigateToPage } from '@/lib/page-builder/utils/scroll';

interface AboutClassicProps {
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

export function AboutClassic({ content, settings, currentPageSlug, homePageSlug }: AboutClassicProps) {
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
    backgroundColor = '#ffffff',
    textColor = '#1a1a1a',
    ctaButtonBg,
    ctaButtonTextColor,
    showTeam = false,
    teamMembers = [],
  } = content;

  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch the form when formId is set (public query)
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  const padding = settings?.padding ?? {};
  const paddingTop = padding.top ?? '5rem';
  const paddingBottom = padding.bottom ?? '5rem';

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

  const headingColor = textColor;
  const paragraphColor = textColor;

  // Determine actual CTA type
  const actualCtaType = ctaType || (ctaTarget === 'form' ? 'form' : 'url');

  // Determine button colors
  const buttonBg = ctaButtonBg || getContrastColor(backgroundColor);
  const buttonText = ctaButtonTextColor || backgroundColor;

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
      <section className="relative" style={sectionStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main About Content */}
          <div className={`flex flex-col ${isFullSize ? 'gap-8' : (imagePosition === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row')} gap-12 lg:gap-16 ${isFullSize ? '' : 'items-center'}`}>
            {/* Image */}
            {imageUrl && (
              <div className={`relative w-full ${isFullSize ? '' : imageConfig.containerWidth} ${isFullSize ? 'mx-auto' : ''}`}>
                <div
                  className="rounded-2xl overflow-hidden shadow-2xl mx-auto"
                  style={{ maxWidth: imageConfig.imageMaxWidth }}
                >
                  <img
                    src={imageUrl}
                    alt={imageAlt || headline}
                    className="w-full h-auto object-cover"
                    style={{ aspectRatio: isFullSize ? '16/9' : '4/3' }}
                  />
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl -z-10 opacity-20" />
                <div className="absolute -top-6 -left-6 w-24 h-24 border-4 border-indigo-200 rounded-2xl -z-10" />
              </div>
            )}

            {/* Content */}
            <div className={`w-full ${!imageUrl ? 'text-center max-w-3xl mx-auto' : (isFullSize ? 'text-center max-w-3xl mx-auto' : contentWidth)}`}>
              {subheadline && (
                <p className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: headingColor, opacity: 0.7 }}>
                  {subheadline}
                </p>
              )}
              <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: headingColor }}>
                {headline}
              </h2>
              {description && (
                <p
                  className="text-lg leading-relaxed mb-8"
                  style={{ color: paragraphColor, opacity: 0.85 }}
                >
                  {description}
                </p>
              )}
              {ctaText && ctaEnabled !== false && (
                <a
                  href={getCtaHref()}
                  onClick={handleCtaClick}
                  className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{ backgroundColor: buttonBg, color: buttonText }}
                >
                  {ctaText}
                  <ArrowRight className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Team Members Section */}
          {showTeam && teamMembers.length > 0 && (
            <div className="mt-20">
              <div className="text-center mb-12">
                <h3 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: headingColor }}>
                  Meet Our Team
                </h3>
                <p className="text-lg" style={{ color: paragraphColor, opacity: 0.75 }}>
                  The talented people behind our success
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member, index) => (
                  <div key={index} className="text-center">
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 mx-auto shadow-lg bg-slate-100">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: headingColor, opacity: 0.1 }}>
                          <Users className="h-16 w-16" style={{ color: headingColor, opacity: 0.4 }} />
                        </div>
                      )}
                    </div>
                    <h4 className="font-semibold text-lg mb-1" style={{ color: headingColor }}>
                      {member.name}
                    </h4>
                    {member.role && (
                      <p className="text-sm" style={{ color: paragraphColor, opacity: 0.7 }}>
                        {member.role}
                      </p>
                    )}
                  </div>
                ))}
              </div>
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
