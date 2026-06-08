'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { PageSection, AnimationSettings, PointerSettings } from '@/types/page-builder';
import { scrollToStoredSection } from '@/lib/page-builder/utils/scroll';
import { getAnimationVariants, getAnimationTransition } from '@/lib/page-builder/hooks/useScrollAnimation';
import { CustomCursorWrapper } from './CustomCursor';

// Dynamic imports for code splitting
const HeroBasic = dynamic(
  () => import('./sections/HeroBasic').then((mod) => ({ default: mod.HeroBasic })),
  { loading: () => <SectionLoading /> }
);

const HeroModern = dynamic(
  () => import('./sections/HeroModern').then((mod) => ({ default: mod.HeroModern })),
  { loading: () => <SectionLoading /> }
);

const HeroSlider = dynamic(
  () => import('./sections/HeroSlider').then((mod) => ({ default: mod.HeroSlider })),
  { loading: () => <SectionLoading /> }
);

const HeroDealership = dynamic(
  () => import('./sections/HeroDealership').then((mod) => ({ default: mod.HeroDealership })),
  { loading: () => <SectionLoading /> }
);

const HeroVehicleShowcase = dynamic(
  () => import('./sections/HeroVehicleShowcase').then((mod) => ({ default: mod.HeroVehicleShowcase })),
  { loading: () => <SectionLoading /> }
);

const NavbarBasic = dynamic(
  () => import('./sections/NavbarBasic').then((mod) => ({ default: mod.NavbarBasic })),
  { loading: () => <SectionLoading /> }
);

const NavbarModern = dynamic(
  () => import('./sections/NavbarModern').then((mod) => ({ default: mod.NavbarModern })),
  { loading: () => <SectionLoading /> }
);

const AboutClassic = dynamic(
  () => import('./sections/AboutClassic').then((mod) => ({ default: mod.AboutClassic })),
  { loading: () => <SectionLoading /> }
);

const AboutModern = dynamic(
  () => import('./sections/AboutModern').then((mod) => ({ default: mod.AboutModern })),
  { loading: () => <SectionLoading /> }
);

const FooterBasic = dynamic(
  () => import('./sections/FooterBasic').then((mod) => ({ default: mod.FooterBasic })),
  { loading: () => <SectionLoading /> }
);

const FooterModern = dynamic(
  () => import('./sections/FooterModern').then((mod) => ({ default: mod.FooterModern })),
  { loading: () => <SectionLoading /> }
);

const ContactBasic = dynamic(
  () => import('./sections/ContactBasic').then((mod) => ({ default: mod.ContactBasic })),
  { loading: () => <SectionLoading /> }
);

const ContactModern = dynamic(
  () => import('./sections/ContactModern').then((mod) => ({ default: mod.ContactModern })),
  { loading: () => <SectionLoading /> }
);

const ComingSoonSection = dynamic(
  () => import('./sections/ComingSoonSection').then((mod) => ({ default: mod.ComingSoonSection })),
  { loading: () => <SectionLoading /> }
);

const FeaturesBasic = dynamic(
  () => import('./sections/FeaturesBasic').then((mod) => ({ default: mod.FeaturesBasic })),
  { loading: () => <SectionLoading /> }
);

const FeaturesModern = dynamic(
  () => import('./sections/FeaturesModern').then((mod) => ({ default: mod.FeaturesModern })),
  { loading: () => <SectionLoading /> }
);

const TestimonialsClassic = dynamic(
  () => import('./sections/TestimonialsClassic').then((mod) => ({ default: mod.TestimonialsClassic })),
  { loading: () => <SectionLoading /> }
);

const TestimonialsModern = dynamic(
  () => import('./sections/TestimonialsModern').then((mod) => ({ default: mod.TestimonialsModern })),
  { loading: () => <SectionLoading /> }
);

const ListingsShowcaseModern = dynamic(
  () => import('./sections/ListingsShowcase').then((mod) => ({ default: mod.ListingsShowcaseRenderer })),
  { loading: () => <SectionLoading /> }
);

const ProductShowcaseModern = dynamic(
  () => import('./sections/ProductShowcase').then((mod) => ({ default: mod.default })),
  { loading: () => <SectionLoading /> }
);

const ServiceShowcaseModern = dynamic(
  () => import('./sections/ServiceShowcase').then((mod) => ({ default: mod.default })),
  { loading: () => <SectionLoading /> }
);

const LogoTickerScroll = dynamic(
  () => import('./sections/LogoTickerScroll').then((mod) => ({ default: mod.LogoTickerScroll })),
  { loading: () => <SectionLoading /> }
);

const LogoTickerGrid = dynamic(
  () => import('./sections/LogoTickerGrid').then((mod) => ({ default: mod.LogoTickerGrid })),
  { loading: () => <SectionLoading /> }
);

const PricingBasic = dynamic(
  () => import('./sections/PricingBasic').then((mod) => ({ default: mod.PricingBasic })),
  { loading: () => <SectionLoading /> }
);

const PricingModern = dynamic(
  () => import('./sections/PricingModern').then((mod) => ({ default: mod.PricingModern })),
  { loading: () => <SectionLoading /> }
);

const AISectionRenderer = dynamic(
  () => import('./sections/AISectionRenderer').then((mod) => ({ default: mod.AISectionRenderer })),
  { 
    loading: () => <div className="min-h-[400px] bg-slate-50" />,
    ssr: false 
  }
);

const CustomCodeRenderer = dynamic(
  () => import('./sections/CustomCodeRenderer').then((mod) => ({ default: mod.CustomCodeRenderer })),
  { 
    loading: () => <div className="min-h-[400px] bg-slate-50" />,
    ssr: false 
  }
);

const BookingSystemSection = dynamic(
  () => import('./sections/BookingSystemSection').then((mod) => ({ default: mod.BookingSystemSection })),
  { 
    loading: () => <div className="min-h-[400px] bg-slate-50" />,
    ssr: false 
  }
);

interface PageRendererProps {
  sections: PageSection[];
  currentPageSlug?: string;
  websiteId?: string;
  companyId?: string;
  pointerSettings?: PointerSettings | null;
  homePageSlug?: string;
}

/**
 * Maps template IDs to their renderer components
 */
const TEMPLATE_COMPONENTS = {
  'hero-basic': HeroBasic,
  'hero-modern': HeroModern,
  'hero-slider': HeroSlider,
  'hero-dealership': HeroDealership,
  'hero-vehicle-showcase': HeroVehicleShowcase,
  'navbar-basic': NavbarBasic,
  'navbar-modern': NavbarModern,
  'about-classic': AboutClassic,
  'about-modern': AboutModern,
  'footer-basic': FooterBasic,
  'footer-modern': FooterModern,
  'contact-basic': ContactBasic,
  'contact-modern': ContactModern,
  'features-basic': FeaturesBasic,
  'features-modern': FeaturesModern,
  'testimonials-classic': TestimonialsClassic,
  'testimonials-modern': TestimonialsModern,
  'listings-showcase-modern': ListingsShowcaseModern,
  'listings-showcase-premium': ListingsShowcaseModern,
  'product-showcase-modern': ProductShowcaseModern,
  'service-showcase-modern': ServiceShowcaseModern,
  'service-showcase-premium': ServiceShowcaseModern,
  'logo-ticker-scroll': LogoTickerScroll,
  'logo-ticker-grid': LogoTickerGrid,
  'pricing-basic': PricingBasic,
  'pricing-modern': PricingModern,
  'ai-generated-custom': AISectionRenderer,
  'custom-code-custom': CustomCodeRenderer,
  'booking-system': BookingSystemSection,
  'booking-system-default': BookingSystemSection,
} as const;

/**
 * Maps section types to their coming-soon component
 */
const COMING_SOON_COMPONENTS = {
  cta: ComingSoonSection,
  'coming-soon': ComingSoonSection,
} as const;

interface PageRendererComponentProps extends PageRendererProps {
  websiteId?: string;
  companyId?: string;
}

export function PageRenderer({ sections, currentPageSlug, websiteId, companyId, pointerSettings, homePageSlug }: PageRendererProps) {
  // Handle smooth scroll to stored section after page load
  useEffect(() => {
    scrollToStoredSection();
  }, []);

  if (sections.length === 0) {
    return <EmptyState />;
  }

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // Check if the first section is a sticky navbar
  const firstNavbar = sortedSections.find(s => s.type === 'navbar');
  const hasStickyNavbar = firstNavbar && (firstNavbar.content as any)?.sticky !== false;

  // Get navbar height based on template (64px for basic, 80px for modern)
  const navbarHeight = firstNavbar?.templateId === 'navbar-modern' ? '80px' : '64px';

  return (
    <div className="w-full relative" style={{ isolation: 'isolate' }}>
      {/* Custom Cursor */}
      <CustomCursorWrapper pointerSettings={pointerSettings} />

      {/* Add spacer for sticky navbar to prevent content from being hidden */}
      {hasStickyNavbar && <div style={{ height: navbarHeight }} aria-hidden="true" />}

      {sortedSections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          currentPageSlug={currentPageSlug}
          websiteId={websiteId}
          companyId={companyId}
          homePageSlug={homePageSlug}
        />
      ))}
    </div>
  );
}

interface SectionRendererProps {
  section: PageSection;
  currentPageSlug?: string;
  websiteId?: string;
  companyId?: string;
  homePageSlug?: string;
}

function SectionRenderer({ section, currentPageSlug, websiteId, companyId, homePageSlug }: SectionRendererProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const Component = TEMPLATE_COMPONENTS[section.templateId as keyof typeof TEMPLATE_COMPONENTS];
  const animation = section.settings?.animation;
  const animationEnabled = animation?.enabled ?? false;

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    if (!animationEnabled || hasAnimated) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          setHasAnimated(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [animationEnabled, hasAnimated]);

  // Add section ID for smooth scrolling
  // Skip for navbar since it's fixed/sticky
  const sectionId = section.type === 'navbar' ? undefined : `section-${section.id}`;

  // Get animation variants and transition
  const variants = animationEnabled ? getAnimationVariants(animation) : undefined;
  const transition = animationEnabled ? getAnimationTransition(animation) : undefined;

  // For navbars, skip animation wrapper
  if (section.type === 'navbar') {
    if (Component) {
      return (
        <Component
          content={section.content as any}
          settings={section.settings}
          currentPageSlug={currentPageSlug}
          websiteId={websiteId}
          templateId={section.templateId}
          sectionId={section.id}
          homePageSlug={homePageSlug}
        />
      );
    }
    return null;
  }

  // Wrap content with animation if enabled
  const renderContent = () => {
    if (Component) {
      return (
        <Component
          content={section.content as any}
          settings={section.settings}
          currentPageSlug={currentPageSlug}
          websiteId={websiteId}
          companyId={companyId}
          templateId={section.templateId}
          sectionId={section.id}
          homePageSlug={homePageSlug}
          increaseTextSize={section.type === 'footer'}
        />
      );
    }

    // Check if this is a known section type but not implemented yet
    const ComingSoonComponent =
      COMING_SOON_COMPONENTS[section.type as keyof typeof COMING_SOON_COMPONENTS];

    if (ComingSoonComponent) {
      return <ComingSoonComponent type={section.type} />;
    }

    // Unknown section type
    return (
      <section className="py-16 px-4 bg-red-50 border-y border-red-200">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-800">
            Unknown section type: <strong>{section.type}</strong> (template: {section.templateId})
          </p>
        </div>
      </section>
    );
  };

  // If animations are disabled, just render the content
  if (!animationEnabled) {
    return (
      <div id={sectionId} ref={ref}>
        {renderContent()}
      </div>
    );
  }

  // Render with animation wrapper
  return (
    <motion.div
      id={sectionId}
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={transition}
    >
      {renderContent()}
    </motion.div>
  );
}

function SectionLoading() {
  return (
    <section className="py-20 px-4 bg-slate-50 animate-pulse">
      <div className="w-full max-w-7xl mx-auto">
        <div className="h-8 bg-slate-200 rounded w-3/4 max-w-2xl mb-4" />
        <div className="h-4 bg-slate-200 rounded w-1/2 max-w-xl mb-6" />
        <div className="h-12 bg-slate-200 rounded w-32" />
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center px-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">No Content Yet</h2>
        <p className="text-slate-600">This page doesn't have any sections yet.</p>
      </div>
    </div>
  );
}
