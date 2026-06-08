'use client';

import { useState } from 'react';
import type { HeroSectionContent } from '@/types/page-builder';
import { ArrowRight } from 'lucide-react';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';
import { useRouter, usePathname } from 'next/navigation';
import { smoothScrollToSection, navigateToPageWithSection, navigateToPage, scrollToStoredSection } from '@/lib/page-builder/utils/scroll';

interface HeroBasicProps {
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

export function HeroBasic({ content, settings, currentPageSlug, homePageSlug }: HeroBasicProps) {
  const {
    headline = '',
    subheadline = '',
    ctaText = '',
    ctaLink = '#',
    ctaType = 'url',
    ctaTarget = 'url', // Deprecated
    ctaPageId,
    ctaSectionId,
    ctaFormId,
    ctaBackgroundColor,
    ctaTextColor,
    ctaEnabled = true,
    backgroundColor = '#ffffff',
    backgroundImage = '',
    textColor = '#1a1a1a',
    contentAlign = 'left',
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

  const sectionStyle: React.CSSProperties = {
    backgroundColor: backgroundImage ? undefined : backgroundColor,
    paddingTop,
    paddingBottom,
  };

  // Handle scroll to stored section on mount
  useState(() => {
    scrollToStoredSection();
  });

  // Determine actual CTA type (support legacy ctaTarget)
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

  // Determine button colors
  const getBrightness = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  const isDarkBg = backgroundImage ? true : getBrightness(backgroundColor) < 128;
  const buttonBg = ctaBackgroundColor || (isDarkBg ? '#ffffff' : '#1a1a1a');
  const buttonText = ctaTextColor || (isDarkBg ? '#1a1a1a' : '#ffffff');

  return (
    <>
      <section
        className="relative min-h-[60vh] flex items-center"
        style={sectionStyle}
      >
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        {/* Dark overlay for better text readability when background image exists */}
        {backgroundImage && (
          <div className="absolute inset-0 bg-black/40" />
        )}

        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className="max-w-3xl"
              style={{
                marginLeft: contentAlign === 'center' ? 'auto' : contentAlign === 'right' ? 'auto' : undefined,
                marginRight: contentAlign === 'center' ? 'auto' : contentAlign === 'left' ? 'auto' : undefined,
                textAlign: contentAlign,
              }}
            >
              {/* Headline - only render if exists */}
              {headline && (
                <h1
                  className="mb-6"
                  style={{
                    color: content.headlineColor || textColor,
                    fontSize: content.headlineFontSize || '3rem',
                    fontWeight: content.headlineFontWeight || 'bold',
                    textAlign: content.headlineTextAlign || contentAlign,
                    fontFamily: getFontFamily(content.headlineFontFamily),
                  }}
                >
                  {headline}
                </h1>
              )}

              {/* Subheadline - only render if exists */}
              {subheadline && (
                <p
                  className="mb-8 leading-relaxed opacity-90"
                  style={{
                    color: content.subheadlineColor || textColor,
                    fontSize: content.subheadlineFontSize || '1.25rem',
                    fontWeight: content.subheadlineFontWeight || 'normal',
                    textAlign: content.subheadlineTextAlign || contentAlign,
                    fontFamily: getFontFamily(content.subheadlineFontFamily),
                  }}
                >
                  {subheadline}
                </p>
              )}

              {ctaText && ctaEnabled !== false && (
                <a
                  href={getCtaHref()}
                  onClick={handleCtaClick}
                  className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: buttonBg,
                    color: buttonText,
                    textAlign: 'center',
                  }}
                >
                  {ctaText}
                  <ArrowRight className="h-5 w-5" />
                </a>
              )}
            </div>
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
