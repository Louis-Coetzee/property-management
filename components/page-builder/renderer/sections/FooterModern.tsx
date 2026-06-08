'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { FooterSectionContent, FooterLink } from '@/types/page-builder';
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Github,
  Youtube,
  ArrowUpRight,
  Link,
  Clock,
  Mail,
  Phone,
  MapPinned,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { smoothScrollToSection, navigateToPageWithSection, navigateToPage } from '@/lib/page-builder/utils/scroll';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';

interface FooterModernProps {
  content: FooterSectionContent;
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
  homePageSlug?: string;
}

// Helper function to get href from FooterLink
function getFooterLinkHref(link: FooterLink): string {
  switch (link.type) {
    case 'url':
      return link.url || '#';
    case 'page':
      return link.url || '/';
    case 'form':
      return '#';
    default:
      return '#';
  }
}

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  github: Github,
  youtube: Youtube,
  tiktok: Link,
};

// Collapsible section component for mobile
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  accentColor,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <h4
          className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2"
          style={{ color: accentColor }}
        >
          <span className="w-6 h-0.5 rounded-full" style={{ backgroundColor: accentColor }} />
          {title}
        </h4>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: accentColor }}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}
      >
        {children}
      </div>
    </div>
  );
}

export function FooterModern({ content, settings, currentPageSlug, websiteId, homePageSlug }: FooterModernProps) {
  const {
    logoType = 'text',
    logo = '',
    companyName,
    company,
    email = '',
    phone = '',
    address = '',
    businessHours,
    links = [],
    socialLinks = [],
    copyright = '© 2024 Your Company. All rights reserved.',
    backgroundColor = '#1a1a1a',
    textColor = '#ffffff',
    accentColor = '#dc2626',
  } = content;

  const displayName = companyName || company?.name || 'Your Company';
  const companyDescription = company?.description || '';

  const isLight = backgroundColor.startsWith('#f') || backgroundColor.startsWith('#fff') || backgroundColor.startsWith('rgb(255');

  const router = useRouter();
  const pathname = usePathname();
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState('');

  // Fetch the form when formId is set
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  // Handle link click with smooth scroll
  const handleLinkClick = (link: FooterLink, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (link.type === 'url') {
      return;
    }

    if (link.type === 'form') {
      e.preventDefault();
      if (link.formId) {
        setOpenFormId(link.formId);
      }
      return;
    }

    if (link.type === 'page') {
      e.preventDefault();

      const pageSlug = link.url || '/';
      const sectionId = link.sectionId;

      if (!sectionId) {
        navigateToPage(pageSlug, homePageSlug);
        return;
      }

      const currentPagePath = pathname || window.location.pathname;
      const targetPagePath = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;

      // Normalize paths for comparison using the actual homePageSlug from the database
      const normalizePath = (path: string) => {
        const segments = path.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1] || '';
        if (lastSegment === '' || (homePageSlug && lastSegment === homePageSlug)) {
          return '/';
        }
        return `/${lastSegment}`;
      };

      const currentNormalized = normalizePath(currentPagePath);
      const targetNormalized = normalizePath(targetPagePath);

      if (currentNormalized === targetNormalized) {
        // Same page - just scroll to section
        const element = document.getElementById(`section-${sectionId}`) || document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        navigateToPageWithSection(pageSlug, sectionId, homePageSlug);
      }
    }
  };

  // Determine logo rendering
  const shouldShowImageLogo = logoType === 'image' && logo;
  const shouldShowTextLogo = logoType === 'text' || !shouldShowImageLogo;

  // Check if we have business hours to display
  const hasBusinessHours = businessHours?.enabled && businessHours.days && businessHours.days.length > 0;
  const hasPublicHolidays = businessHours?.enabled && businessHours?.showPublicHolidays;

  // Handle newsletter signup
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', emailValue);
    setEmailValue('');
  };

  return (
    <footer
      className="relative overflow-hidden"
      style={{ backgroundColor, color: textColor }}
    >
      {/* Gradient Top Border */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${accentColor} 0%, ${adjustColor(accentColor, 30)} 50%, ${accentColor} 100%)`
        }}
      />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${textColor} 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Main Grid - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">

          {/* Column 1: Brand & Contact */}
          <div className="lg:col-span-4">
            {/* Logo */}
            {shouldShowImageLogo ? (
              <img
                src={logo}
                alt={displayName}
                className="h-10 sm:h-12 mb-5 object-contain"
              />
            ) : shouldShowTextLogo && displayName ? (
              <h3
                className="text-2xl sm:text-3xl font-bold mb-5"
                style={{
                  background: `linear-gradient(135deg, ${textColor} 0%, ${accentColor} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {displayName}
              </h3>
            ) : null}

            {companyDescription && (
              <p
                className="text-sm leading-relaxed mb-6 max-w-sm"
                style={{ color: textColor, opacity: 0.7 }}
              >
                {companyDescription}
              </p>
            )}

            {/* Contact Info */}
            <div className="space-y-4">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <Mail className="h-5 w-5" style={{ color: accentColor }} />
                  </div>
                  <span className="text-sm group-hover:underline" style={{ color: textColor, opacity: 0.8 }}>{email}</span>
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-3 group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <Phone className="h-5 w-5" style={{ color: accentColor }} />
                  </div>
                  <span className="text-sm group-hover:underline" style={{ color: textColor, opacity: 0.8 }}>{phone}</span>
                </a>
              )}
              {address && (
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <MapPinned className="h-5 w-5" style={{ color: accentColor }} />
                  </div>
                  <span className="text-sm whitespace-pre-line" style={{ color: textColor, opacity: 0.8 }}>{address}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 mt-6">
                {socialLinks.map((social, index) => {
                  const Icon = SOCIAL_ICONS[social.platform.toLowerCase()] || Link;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                      style={{
                        backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = accentColor;
                        e.currentTarget.style.borderColor = accentColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: textColor, opacity: 0.7 }} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Links (2 sub-columns) */}
          <div className="lg:col-span-4">
            {/* Desktop Grid - 2 columns */}
            <div className="hidden lg:grid grid-cols-2 gap-8">
              {links.slice(0, 2).map((linkGroup, groupIndex) => (
                <div key={groupIndex}>
                  <h4
                    className="text-sm font-semibold uppercase tracking-wider mb-5 flex items-center gap-2"
                    style={{ color: accentColor }}
                  >
                    <span className="w-6 h-0.5 rounded-full" style={{ backgroundColor: accentColor }} />
                    {linkGroup.title}
                  </h4>
                  <ul className="space-y-3">
                    {linkGroup.items.map((link, linkIndex) => {
                      const href = getFooterLinkHref(link);
                      const linkType = link.type || 'url';

                      return (
                        <li key={linkIndex}>
                          <a
                            href={href}
                            onClick={(e) => handleLinkClick(link, e)}
                            className="group flex items-center gap-2 text-sm transition-all duration-200 cursor-pointer"
                            style={{ color: textColor, opacity: 0.75 }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0.75';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <span>{link.label}</span>
                            {linkType === 'url' && (link.url?.startsWith('http') || link.url?.startsWith('//')) ? (
                              <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: accentColor }} />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: accentColor }} />
                            )}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Mobile: Collapsible Link Groups */}
            <div className="lg:hidden space-y-1">
              {links.slice(0, 2).map((linkGroup, groupIndex) => (
                <CollapsibleSection key={groupIndex} title={linkGroup.title} accentColor={accentColor}>
                  <ul className="space-y-3 pl-8">
                    {linkGroup.items.map((link, linkIndex) => {
                      const href = getFooterLinkHref(link);

                      return (
                        <li key={linkIndex}>
                          <a
                            href={href}
                            onClick={(e) => handleLinkClick(link, e)}
                            className="flex items-center gap-2 text-sm"
                            style={{ color: textColor, opacity: 0.8 }}
                          >
                            <span>{link.label}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: accentColor, opacity: 0.6 }} />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </CollapsibleSection>
              ))}
            </div>
          </div>

          {/* Column 3: Showroom Hours */}
          <div className="lg:col-span-4">
            {/* Desktop */}
            <div className="hidden lg:block">
              {hasBusinessHours && (
                <div
                  className="p-6 rounded-2xl"
                  style={{
                    backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}15` }}
                    >
                      <Clock className="h-5 w-5" style={{ color: accentColor }} />
                    </div>
                    <h4 className="text-base font-semibold" style={{ color: textColor }}>
                      {businessHours.title || 'Showroom Hours'}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {businessHours.days?.map((dayInfo, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span style={{ color: textColor, opacity: 0.7 }}>{dayInfo.day}</span>
                        <span
                          className="font-medium px-2.5 py-1 rounded-lg text-xs"
                          style={{
                            color: dayInfo.isOpen ? '#16a34a' : '#dc2626',
                            backgroundColor: dayInfo.isOpen ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                          }}
                        >
                          {dayInfo.isOpen ? dayInfo.hours : 'Closed'}
                        </span>
                      </div>
                    ))}

                    {/* Public Holidays */}
                    {hasPublicHolidays && (
                      <div className="pt-3 mt-3 border-t" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium" style={{ color: textColor, opacity: 0.8 }}>Public Holidays</span>
                          <span
                            className="font-medium px-2.5 py-1 rounded-lg text-xs"
                            style={{
                              color: businessHours.publicHolidaysIsOpen ? '#16a34a' : '#dc2626',
                              backgroundColor: businessHours.publicHolidaysIsOpen ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                            }}
                          >
                            {businessHours.publicHolidaysIsOpen ? (businessHours.publicHolidaysHours || 'Open') : 'Closed'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: Collapsible Hours */}
            <div className="lg:hidden">
              {hasBusinessHours && (
                <CollapsibleSection title={businessHours.title || 'Showroom Hours'} accentColor={accentColor}>
                  <div className="space-y-2 pl-8">
                    {businessHours.days?.map((dayInfo, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span style={{ color: textColor, opacity: 0.6 }}>{dayInfo.day}</span>
                        <span
                          className="font-medium"
                          style={{ color: dayInfo.isOpen ? '#16a34a' : '#dc2626' }}
                        >
                          {dayInfo.isOpen ? dayInfo.hours : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="pt-8 border-t flex flex-col items-center justify-center gap-4"
          style={{ borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }}
        >
          {/* Copyright */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm" style={{ color: textColor, opacity: 0.6 }}>
            <span>{copyright}</span>
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div
          className="h-px mt-8 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
            opacity: 0.2
          }}
        />
      </div>

      {/* Form Modal */}
      {openForm && (
        <FormModal
          form={openForm}
          isOpen={!!openFormId}
          onClose={() => setOpenFormId(null)}
          sourcePage={currentPageSlug}
        />
      )}
    </footer>
  );
}

/**
 * Helper function to adjust color brightness
 */
function adjustColor(hex: string, amount: number): string {
  const color = hex.replace('#', '');
  const num = parseInt(color, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
