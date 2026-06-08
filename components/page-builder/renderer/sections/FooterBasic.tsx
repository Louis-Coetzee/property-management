'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { FooterSectionContent, FooterLink } from '@/types/page-builder';
import { Mail, MapPin, Phone, Facebook, Twitter, Linkedin, Instagram, Github, Youtube, Link, Clock, Calendar, ExternalLink, FileText, MessageSquare } from 'lucide-react';
import { smoothScrollToSection, navigateToPageWithSection, navigateToPage } from '@/lib/page-builder/utils/scroll';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';

interface FooterBasicProps {
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
  increaseTextSize?: boolean;
  homePageSlug?: string;
}

// Helper function to get href from FooterLink
function getFooterLinkHref(link: FooterLink): string {
  switch (link.type) {
    case 'url':
      return link.url || '#';
    case 'page':
      // Use the page slug stored in link.url
      return link.url || '/';
    case 'form':
      return '#'; // Forms are handled by click handler
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

export function FooterBasic({ content, settings, currentPageSlug, websiteId, increaseTextSize, homePageSlug }: FooterBasicProps) {
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
    backgroundColor = '#0f172a',
    textColor = '#ffffff',
    accentColor = '#6366f1',
  } = content;

  const displayName = companyName || company?.name || 'Your Company';
  const companyDescription = company?.description || '';

  const isLight = backgroundColor.startsWith('#f') || backgroundColor.startsWith('#fff') || backgroundColor.startsWith('rgb(255');

  const headingColor = textColor;
  const paragraphColor = textColor;

  const router = useRouter();
  const pathname = usePathname();
  const [openFormId, setOpenFormId] = useState<string | null>(null);

  // Fetch the form when formId is set (public query)
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  // Handle link click with smooth scroll
  const handleLinkClick = (link: FooterLink, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (link.type === 'url') {
      // URL link - use default behavior
      return;
    }

    if (link.type === 'form') {
      // Form link - open form modal
      e.preventDefault();
      if (link.formId) {
        setOpenFormId(link.formId);
      }
      return;
    }

    if (link.type === 'page') {
      // Page link
      e.preventDefault();

      const pageSlug = link.url || '/';
      const sectionId = link.sectionId;

      if (!sectionId) {
        // No section - navigate to page
        navigateToPage(pageSlug, homePageSlug);
        return;
      }

      // Check if we're on the same page
      const currentPagePath = pathname || window.location.pathname;
      const targetPagePath = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;

      if (currentPagePath === targetPagePath) {
        // Same page - smooth scroll to section
        smoothScrollToSection(sectionId);
      } else {
        // Different page - navigate and scroll
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
  const hasHolidays = businessHours?.enabled && businessHours?.showHolidays && businessHours.holidays && businessHours.holidays.length > 0;

  // Render navigation links component
  const renderNavigationLinks = (linkGroups: typeof links, isVertical = false) => (
    linkGroups.map((linkGroup, groupIndex) => (
      <div key={groupIndex} className={groupIndex > 0 ? (isVertical ? 'mt-6' : '') : ''}>
        <h4
          className={`${increaseTextSize ? 'text-base' : 'text-sm'} font-semibold uppercase tracking-wider mb-4`}
          style={{ color: headingColor }}
        >
          {linkGroup.title}
        </h4>
        <ul className="space-y-2">
          {linkGroup.items.map((link, linkIndex) => {
            const href = getFooterLinkHref(link);
            const linkType = link.type || 'url';

            return (
              <li key={linkIndex}>
                <a
                  href={href}
                  onClick={(e) => handleLinkClick(link, e)}
                  className={`group flex items-center gap-2 ${increaseTextSize ? 'text-base' : 'text-sm'} transition-all duration-200 cursor-pointer`}
                  style={{ color: paragraphColor, opacity: 0.8 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                    e.currentTarget.style.color = paragraphColor;
                  }}
                >
                  {/* Image or Text Label */}
                  {link.useImage && link.imageUrl ? (
                    <img
                      src={link.imageUrl}
                      alt={link.label}
                      className="h-5 w-auto object-contain"
                    />
                  ) : link.hoverToImage && link.hoverImageUrl ? (
                    <span className="relative inline-flex items-center gap-2">
                      <span className="group-hover:opacity-0 transition-opacity duration-200">
                        {link.label}
                      </span>
                      <img
                        src={link.hoverImageUrl}
                        alt={link.label}
                        className="absolute inset-0 h-5 w-auto object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                    </span>
                  ) : (
                    <span>{link.label}</span>
                  )}

                  {/* Link Type Icon */}
                  {linkType === 'url' && (link.url?.startsWith('http') || link.url?.startsWith('//')) && (
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  {linkType === 'page' && (
                    <FileText className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  {linkType === 'form' && (
                    <MessageSquare className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    ))
  );

  return (
    <footer
      className="relative"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {hasBusinessHours ? (
          /* Layout when business hours are enabled: Links below logo in left column */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Left Column - Company Info + Navigation Links */}
            <div className="lg:col-span-5">
              {/* Logo */}
              {shouldShowImageLogo ? (
                <img
                  src={logo}
                  alt={displayName}
                  className="h-10 mb-5 object-contain"
                />
              ) : shouldShowTextLogo && displayName ? (
                <h3 className="text-xl sm:text-2xl font-bold mb-5" style={{ color: headingColor }}>
                  {displayName}
                </h3>
              ) : null}

              {companyDescription && (
                <p
                  className={`${increaseTextSize ? 'text-base' : 'text-sm'} leading-relaxed mb-8`}
                  style={{ color: paragraphColor, opacity: 0.8 }}
                >
                  {companyDescription}
                </p>
              )}

              {/* Navigation Links - Below logo when business hours enabled */}
              {links.length > 0 && (
                <div
                  className="pt-6 mb-6"
                  style={{ borderTopColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', borderTopWidth: 1 }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-6">
                    {renderNavigationLinks(links, true)}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Contact & Business Hours */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Info */}
                <div>
                  <h4
                    className={`${increaseTextSize ? 'text-base' : 'text-sm'} font-semibold uppercase tracking-wider mb-4`}
                    style={{ color: headingColor }}
                  >
                    Contact Us
                  </h4>
                  <div className="space-y-3">
                    {email && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}
                        >
                          <Mail className="h-4 w-4" style={{ color: accentColor }} />
                        </div>
                        <a
                          href={`mailto:${email}`}
                          className={`${increaseTextSize ? 'text-base' : 'text-sm'} hover:underline break-all`}
                          style={{ color: paragraphColor, opacity: 0.9 }}
                        >
                          {email}
                        </a>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}
                        >
                          <Phone className="h-4 w-4" style={{ color: accentColor }} />
                        </div>
                        <a
                          href={`tel:${phone.replace(/\D/g, '')}`}
                          className={`${increaseTextSize ? 'text-base' : 'text-sm'} hover:underline`}
                          style={{ color: paragraphColor, opacity: 0.9 }}
                        >
                          {phone}
                        </a>
                      </div>
                    )}
                    {address && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}
                        >
                          <MapPin className="h-4 w-4" style={{ color: accentColor }} />
                        </div>
                        <span
                          className={`${increaseTextSize ? 'text-base' : 'text-sm'}`}
                          style={{ color: paragraphColor, opacity: 0.9 }}
                        >
                          {address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Business Hours */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4" style={{ color: accentColor }} />
                    <h4 className={`${increaseTextSize ? 'text-base' : 'text-sm'} font-semibold uppercase tracking-wider`} style={{ color: headingColor }}>
                      {businessHours.title || 'Business Hours'}
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {businessHours.days?.map((dayInfo, index) => (
                      <div key={index} className={`flex items-center justify-between ${increaseTextSize ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
                        <span style={{ color: paragraphColor, opacity: 0.7 }}>{dayInfo.day}</span>
                        <span
                          style={{
                            color: dayInfo.isOpen ? paragraphColor : (isLight ? '#ef4444' : '#f87171'),
                            opacity: dayInfo.isOpen ? 0.9 : 1
                          }}
                        >
                          {dayInfo.isOpen ? dayInfo.hours : 'Closed'}
                        </span>
                      </div>
                    ))}

                    {/* Public Holidays */}
                    {hasPublicHolidays && (
                      <div className={`flex items-center justify-between ${increaseTextSize ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'} pt-2 mt-2`} style={{ borderTopColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', borderTopWidth: 1 }}>
                        <span className="font-medium" style={{ color: paragraphColor, opacity: 0.9 }}>Public Holidays</span>
                        <span
                          className="font-medium"
                          style={{
                            color: businessHours.publicHolidaysIsOpen ? (isLight ? '#16a34a' : '#4ade80') : (isLight ? '#ef4444' : '#f87171'),
                          }}
                        >
                          {businessHours.publicHolidaysIsOpen ? (businessHours.publicHolidaysHours || 'Open') : 'Closed'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Specific Holiday Hours */}
                  {hasHolidays && (
                    <div className="mt-4 pt-4" style={{ borderTopColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', borderTopWidth: 1 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4" style={{ color: accentColor }} />
                        <h4 className={`${increaseTextSize ? 'text-base' : 'text-sm'} font-semibold`} style={{ color: headingColor }}>
                          {businessHours.holidaysTitle || 'Holiday Hours'}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {businessHours.holidays?.map((holiday, index) => (
                          <div key={index} className={`${increaseTextSize ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium" style={{ color: paragraphColor, opacity: 0.9 }}>{holiday.name}</span>
                              <span
                                className="font-medium"
                                style={{
                                  color: holiday.isOpen ? (isLight ? '#16a34a' : '#4ade80') : (isLight ? '#ef4444' : '#f87171'),
                                }}
                              >
                                {holiday.isOpen ? holiday.hours : 'Closed'}
                              </span>
                            </div>
                            {holiday.date && (
                              <div className={`${increaseTextSize ? 'text-sm' : 'text-xs'} mt-0.5`} style={{ color: paragraphColor, opacity: 0.6 }}>
                                {holiday.date}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Original layout when business hours are NOT enabled */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Left Column - Company Info (4 cols on desktop) */}
            <div className="lg:col-span-4">
              {/* Logo */}
              {shouldShowImageLogo ? (
                <img
                  src={logo}
                  alt={displayName}
                  className="h-10 mb-5 object-contain"
                />
              ) : shouldShowTextLogo && displayName ? (
                <h3 className="text-xl sm:text-2xl font-bold mb-5" style={{ color: headingColor }}>
                  {displayName}
                </h3>
              ) : null}

              {companyDescription && (
                <p
                  className={`${increaseTextSize ? 'text-base' : 'text-sm'} leading-relaxed mb-6`}
                  style={{ color: paragraphColor, opacity: 0.8 }}
                >
                  {companyDescription}
                </p>
              )}
            </div>

            {/* Right Column - Contact & Links (8 cols on desktop) */}
            <div className="lg:col-span-8">
              {/* Contact & Links Row - Side by side on desktop */}
              <div className={`grid grid-cols-1 ${links.length > 0 ? 'md:grid-cols-2' : ''} gap-8`}>
                {/* Contact Info */}
                <div>
                  <h4
                    className={`${increaseTextSize ? 'text-base' : 'text-sm'} font-semibold uppercase tracking-wider mb-4`}
                    style={{ color: headingColor }}
                  >
                    Contact Us
                  </h4>
                  <div className="space-y-3">
                    {email && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}
                        >
                          <Mail className="h-4 w-4" style={{ color: accentColor }} />
                        </div>
                        <a
                          href={`mailto:${email}`}
                          className={`${increaseTextSize ? 'text-base' : 'text-sm'} hover:underline break-all`}
                          style={{ color: paragraphColor, opacity: 0.9 }}
                        >
                          {email}
                        </a>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}
                        >
                          <Phone className="h-4 w-4" style={{ color: accentColor }} />
                        </div>
                        <a
                          href={`tel:${phone.replace(/\D/g, '')}`}
                          className={`${increaseTextSize ? 'text-base' : 'text-sm'} hover:underline`}
                          style={{ color: paragraphColor, opacity: 0.9 }}
                        >
                          {phone}
                        </a>
                      </div>
                    )}
                    {address && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}
                        >
                          <MapPin className="h-4 w-4" style={{ color: accentColor }} />
                        </div>
                        <span
                          className={`${increaseTextSize ? 'text-base' : 'text-sm'}`}
                          style={{ color: paragraphColor, opacity: 0.9 }}
                        >
                          {address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Links - Show in same row if business hours NOT enabled */}
                {links.length > 0 && (
                  <div>
                    {renderNavigationLinks(links, true)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div
          className="mt-12 md:mt-16 pt-6 md:pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}
        >
          <p
            className={`${increaseTextSize ? 'text-base' : 'text-sm'} text-center sm:text-left`}
            style={{ color: paragraphColor, opacity: 0.7 }}
          >
            {copyright}
          </p>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => {
                const Icon = SOCIAL_ICONS[social.platform.toLowerCase()] || Link;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{
                      backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
                      color: headingColor,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = accentColor;
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.color = headingColor;
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
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
