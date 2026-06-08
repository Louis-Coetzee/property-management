'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, ChevronRight, Sparkles, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { smoothScrollToSection, navigateToPageWithSection, navigateToPage } from '@/lib/page-builder/utils/scroll';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';

// Sublink with hover image effect - fade transition
function SublinkWithHover({ sublink, textColor }: { sublink: any; textColor: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-flex items-center min-h-[20px] transition-all duration-200 cursor-pointer overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={cn(
          "text-sm font-medium transition-all duration-300",
          isHovered && "opacity-0 scale-95"
        )}
        style={{ color: textColor }}
      >
        {sublink.label}
      </span>
      <img
        src={sublink.hoverImageUrl}
        alt={sublink.label}
        className={cn(
          "absolute h-5 w-auto object-contain transition-all duration-300",
          isHovered
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95"
        )}
      />
    </div>
  );
}

interface NavbarModernProps {
  content: {
    logoType?: 'text' | 'image';
    logo?: string;
    brandName?: string;
    links: Array<{
      label: string;
      type?: 'url' | 'page' | 'form';
      url?: string;
      pageId?: string;
      sectionId?: string;
      formId?: string;
      // Legacy support
      href?: string;
      // Image support
      useImage?: boolean;
      imageUrl?: string;
      hoverToImage?: boolean;
      hoverImageUrl?: string;
      // Submenu support
      hasSubmenu?: boolean;
      submenu?: Array<{
        label: string;
        type?: 'url' | 'page' | 'form';
        url?: string;
        pageId?: string;
        sectionId?: string;
        formId?: string;
        description?: string;
        // Image support
        useImage?: boolean;
        imageUrl?: string;
        hoverToImage?: boolean;
        hoverImageUrl?: string;
      }>;
    }>;
    ctaText?: string;
    ctaType?: 'url' | 'page' | 'form';
    ctaLink?: string;
    ctaPageId?: string;
    ctaSectionId?: string;
    ctaFormId?: string;
    backgroundColor?: string;
    textColor?: string;
    linkHoverColor?: string;
    accentColor?: string;
    sticky?: boolean;
    // Layout settings
    linksAlignment?: 'left' | 'center' | 'right';
    // Size settings
    linkFontSize?: number;
    logoTextSize?: number;
    logoImageHeight?: number;
    // Cart settings
    showCart?: boolean;
    cartLink?: string;
  };
  settings?: {
    sticky?: boolean;
  };
  currentPageSlug?: string;
  homePageSlug?: string;
  websiteId?: string;
  templateId?: string;
  sectionId?: string;
}

// Desktop NavLink with Dropdown Support
interface NavLinkProps {
  link: any;
  index: number;
  textColor: string;
  linkHoverColor: string;
  accentColor: string;
  linkFontSize: number;
  handleLinkClick: (link: any, e: React.MouseEvent<HTMLAnchorElement>) => void;
  handleSubmenuClick: (link: any, sublink: any, e: React.MouseEvent<HTMLAnchorElement>) => void;
}

function DesktopNavLink({
  link,
  textColor,
  linkHoverColor,
  accentColor,
  linkFontSize,
  handleLinkClick,
  handleSubmenuClick
}: NavLinkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasSubmenu = link.hasSubmenu && link.submenu && link.submenu.length > 0;

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(true);
    if (hasSubmenu) {
      setIsDropdownOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };

  // If using image instead of text
  if (link.useImage && link.imageUrl) {
    return (
      <a
        href={link.url || '#'}
        onClick={(e) => handleLinkClick(link, e)}
        className="flex items-center justify-center transition-all duration-200 hover:scale-105"
        style={{ color: textColor }}
      >
        <img
          src={link.imageUrl}
          alt={link.label}
          className="h-6 w-auto object-contain"
        />
      </a>
    );
  }

  // If hover to image is enabled
  if (link.hoverToImage && link.hoverImageUrl) {
    return (
      <a
        href={link.url || '#'}
        onClick={(e) => handleLinkClick(link, e)}
        className="relative inline-flex items-center justify-center min-w-[60px] h-8 transition-all duration-200 hover:scale-105 cursor-pointer overflow-hidden"
        style={{ color: textColor }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span
          className={cn(
            "font-medium transition-all duration-300",
            isHovered && "opacity-0 scale-95"
          )}
          style={{ fontSize: linkFontSize }}
        >
          {link.label}
        </span>
        <img
          src={link.hoverImageUrl}
          alt={link.label}
          className={cn(
            "absolute h-6 w-auto object-contain transition-all duration-300",
            isHovered
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95"
          )}
        />
      </a>
    );
  }

  // Link with submenu
  if (hasSubmenu) {
    return (
      <div
        ref={dropdownRef}
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={(e) => {
            if (link.url) {
              handleLinkClick(link, e as any);
            }
          }}
          className={cn(
            "flex items-center gap-1 px-5 py-2 font-medium rounded-full transition-all duration-200 cursor-pointer",
            isHovered && "scale-105"
          )}
          style={{ color: isHovered ? linkHoverColor : textColor, fontSize: linkFontSize }}
        >
          {link.label}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isDropdownOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu - Modern glass style */}
        <div
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200",
            isDropdownOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
          )}
        >
          <div
            className="min-w-[240px] py-2 rounded-2xl shadow-2xl border backdrop-blur-xl"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {link.submenu.map((sublink: any, subIndex: number) => {
              // Render sublink content with image support
              const renderSublinkContent = () => {
                // If using image instead of text
                if (sublink.useImage && sublink.imageUrl) {
                  return (
                    <img
                      src={sublink.imageUrl}
                      alt={sublink.label}
                      className="h-5 w-auto object-contain"
                    />
                  );
                }

                // If hover to image is enabled
                if (sublink.hoverToImage && sublink.hoverImageUrl) {
                  return (
                    <SublinkWithHover
                      sublink={sublink}
                      textColor="rgba(255, 255, 255, 0.85)"
                    />
                  );
                }

                // Default text content
                return (
                  <>
                    <div
                      className="text-sm font-medium transition-colors duration-150 group-hover:text-white"
                      style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                    >
                      {sublink.label}
                    </div>
                    {sublink.description && (
                      <div className="text-xs mt-0.5 opacity-60 truncate" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {sublink.description}
                      </div>
                    )}
                  </>
                );
              };

              return (
                <a
                  key={subIndex}
                  href={sublink.type === 'url' ? sublink.url : sublink.url || '#'}
                  onClick={(e) => handleSubmenuClick(link, sublink, e)}
                  className="flex items-start gap-3 px-4 py-3 transition-all duration-150 group relative"
                >
                  {/* Hover indicator */}
                  <div
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full transition-all duration-150",
                      "opacity-0 group-hover:opacity-100"
                    )}
                    style={{ backgroundColor: accentColor }}
                  />

                  <div className="flex-1 min-w-0 pl-2">
                    {renderSublinkContent()}
                  </div>
                  <ChevronRight
                    className="h-4 w-4 mt-0.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 flex-shrink-0"
                    style={{ color: accentColor }}
                  />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Default text link
  return (
    <a
      href={link.url || '#'}
      onClick={(e) => handleLinkClick(link, e)}
      className="px-5 py-2 font-medium rounded-full transition-all duration-200 hover:scale-105 cursor-pointer"
      style={{ color: textColor, fontSize: linkFontSize }}
      onMouseEnter={(e) => e.currentTarget.style.color = linkHoverColor}
      onMouseLeave={(e) => e.currentTarget.style.color = textColor}
    >
      {link.label}
    </a>
  );
}

// Mobile Submenu Component - Refined Design
function MobileSubmenu({
  link,
  accentColor,
  handleSubmenuClick,
  onClose
}: {
  link: any;
  accentColor: string;
  handleSubmenuClick: (link: any, sublink: any, e: React.MouseEvent<HTMLAnchorElement>) => void;
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!link.hasSubmenu || !link.submenu || link.submenu.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-6 py-4 transition-all duration-200"
        style={{
          color: isOpen ? accentColor : '#334155',
        }}
      >
        <span className="text-lg font-semibold tracking-wide">{link.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          style={{ color: accentColor }}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pl-6 pr-4 pb-2 space-y-1">
          {link.submenu.map((sublink: any, subIndex: number) => {
            // Render sublink content with image support
            const renderMobileSublinkContent = () => {
              if (sublink.useImage && sublink.imageUrl) {
                return (
                  <img
                    src={sublink.imageUrl}
                    alt={sublink.label}
                    className="h-6 w-auto object-contain"
                  />
                );
              }

              if (sublink.hoverToImage && sublink.hoverImageUrl) {
                return (
                  <div className="flex items-center gap-2">
                    <img
                      src={sublink.hoverImageUrl}
                      alt={sublink.label}
                      className="h-6 w-auto object-contain"
                    />
                    <span className="text-base font-semibold text-slate-700">{sublink.label}</span>
                  </div>
                );
              }

              return (
                <>
                  <div className="text-base font-semibold text-slate-700">{sublink.label}</div>
                  {sublink.description && (
                    <div className="text-xs text-slate-400 mt-0.5 truncate">{sublink.description}</div>
                  )}
                </>
              );
            };

            return (
              <a
                key={subIndex}
                href={sublink.type === 'url' ? sublink.url : sublink.url || '#'}
                onClick={(e) => {
                  handleSubmenuClick(link, sublink, e);
                  onClose();
                }}
                className="flex items-center gap-3 py-3.5 px-4 rounded-lg transition-all duration-150 hover:bg-slate-50"
              >
                <div
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <div className="flex-1 min-w-0">
                  {renderMobileSublinkContent()}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CartIconButton({ cartLink, accentColor }: { cartLink?: string; accentColor: string }) {
  const { totalItems, setIsOpen } = useCart();
  const router = useRouter();

  const handleClick = () => {
    if (cartLink) {
      router.push(cartLink);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-lg transition-all hover:scale-105"
      style={{ color: '#ffffff' }}
      aria-label="Shopping cart"
    >
      <ShoppingBag className="h-5 w-5" />
      {totalItems > 0 && (
        <span 
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </button>
  );
}

export function NavbarModern({ content, settings, currentPageSlug, homePageSlug }: NavbarModernProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  
  const {
    logoType = 'text',
    logo = '',
    brandName = '',
    links = [],
    ctaText = '',
    ctaType = 'url',
    ctaLink = '#',
    ctaPageId,
    ctaSectionId,
    ctaFormId,
    backgroundColor = '#0f172a',
    textColor = '#ffffff',
    linkHoverColor = '#6366f1',
    accentColor = '#6366f1',
    sticky: contentSticky = true,
    linksAlignment = 'center',
    // Size settings
    linkFontSize = 14,
    logoTextSize = 20,
    logoImageHeight = 40,
    // Cart settings
    showCart = false,
    cartLink = '',
  } = content;

  const isImageLogo = logoType === 'image';
  const hasLogo = isImageLogo ? !!logo : !!brandName;

  // Check content.sticky first, then fall back to settings.sticky
  const isSticky = contentSticky ?? settings?.sticky ?? true;

  // Fetch the form when formId is set (public query)
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  // Add scroll effect for navbar background
  useEffect(() => {
    if (!isSticky) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle link click with smooth scroll
  const handleLinkClick = (link: any, e: React.MouseEvent<HTMLAnchorElement>) => {
    // Check if this is a new-style link
    const isNewStyle = link.type !== undefined;

    if (!isNewStyle) {
      // Legacy link - use default behavior
      setIsMobileMenuOpen(false);
      return;
    }

    if (link.type === 'url') {
      // URL link - use default behavior
      setIsMobileMenuOpen(false);
      return;
    }

    if (link.type === 'form') {
      // Form link - open form modal
      e.preventDefault();
      setIsMobileMenuOpen(false);
      if (link.formId) {
        setOpenFormId(link.formId);
      }
      return;
    }

    // Page link
    e.preventDefault();

    const pageSlug = link.url || '/';
    const sectionId = link.sectionId;

    if (!sectionId) {
      // No section - navigate to page
      setIsMobileMenuOpen(false);
      navigateToPage(pageSlug, homePageSlug);
      return;
    }

    // Check if we're on the same page
    const currentPagePath = pathname || window.location.pathname;
    const targetPagePath = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;

    // Normalize paths for comparison using the actual homePageSlug from the database
    const normalizePath = (path: string) => {
      // Extract the last segment of the path
      const segments = path.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1] || '';

      // If this is the home page (path is /, empty, or matches homePageSlug), normalize to /
      if (lastSegment === '' || (homePageSlug && lastSegment === homePageSlug)) {
        return '/';
      }
      return `/${lastSegment}`;
    };

    const currentNormalized = normalizePath(currentPagePath);
    const targetNormalized = normalizePath(targetPagePath);

    if (currentNormalized === targetNormalized) {
      // Same page - smooth scroll to section
      setIsMobileMenuOpen(false);
      const element = document.getElementById(`section-${sectionId}`) || document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Different page - navigate and scroll
      navigateToPageWithSection(pageSlug, sectionId, homePageSlug);
    }
  };

  // Handle submenu link click
  const handleSubmenuClick = (parentLink: any, sublink: any, e: React.MouseEvent<HTMLAnchorElement>) => {
    const isNewStyle = sublink.type !== undefined;

    if (!isNewStyle) {
      setIsMobileMenuOpen(false);
      return;
    }

    if (sublink.type === 'url') {
      setIsMobileMenuOpen(false);
      return;
    }

    if (sublink.type === 'form') {
      e.preventDefault();
      setIsMobileMenuOpen(false);
      if (sublink.formId) {
        setOpenFormId(sublink.formId);
      }
      return;
    }

    // Page link
    e.preventDefault();

    const pageSlug = sublink.url || '/';
    const sectionId = sublink.sectionId;

    if (!sectionId) {
      setIsMobileMenuOpen(false);
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
      setIsMobileMenuOpen(false);
      const element = document.getElementById(`section-${sectionId}`) || document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigateToPageWithSection(pageSlug, sectionId, homePageSlug);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Handle CTA button click
  const handleCTAClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const linkType = ctaType || 'url';

    if (linkType === 'url') {
      // URL link - use default behavior
      setIsMobileMenuOpen(false);
      return;
    }

    if (linkType === 'form') {
      // Form link - open form modal
      e.preventDefault();
      setIsMobileMenuOpen(false);
      if (ctaFormId) {
        setOpenFormId(ctaFormId);
      }
      return;
    }

    // Page link
    e.preventDefault();

    // Get page slug from pages data
    const pageSlug = ctaLink || '/';

    if (!ctaSectionId) {
      // No section - navigate to page
      setIsMobileMenuOpen(false);
      navigateToPage(pageSlug, homePageSlug);
      return;
    }

    // Check if we're on the same page
    const currentPagePath = pathname || window.location.pathname;
    const targetPagePath = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;

    // Normalize paths - treat /, /home, and empty slug as the same (home page)
    const normalizePath = (path: string) => {
      if (path === '/' || path === '/home' || path === '') return '/';
      return path;
    };
    
    const normalizedCurrent = normalizePath(currentPagePath);
    const normalizedTarget = normalizePath(targetPagePath);

    if (normalizedCurrent === normalizedTarget) {
      // Same page - smooth scroll to section
      setIsMobileMenuOpen(false);
      smoothScrollToSection(ctaSectionId);
    } else {
      // Different page - navigate and scroll
      navigateToPageWithSection(pageSlug, ctaSectionId, homePageSlug);
    }
  };

  return (
    <>
      <nav
        className={cn(
          'w-full transition-all duration-300',
          isSticky ? 'fixed top-0 left-0 right-0 z-[9999]' : 'relative',
          isScrolled && 'shadow-lg'
        )}
        style={{
          backgroundColor: isScrolled ? backgroundColor : isSticky ? backgroundColor : `${backgroundColor}00`,
          backdropFilter: (isScrolled || isSticky) ? 'blur(12px)' : undefined,
        }}
      >
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo/Brand */}
            {hasLogo && (
              <div className="flex-shrink-0">
                <a href="/" className="flex items-center gap-3">
                  {isImageLogo ? (
                    // Image logo
                    logo && <img src={logo} alt={brandName || 'Logo'} className="w-auto object-contain" style={{ height: logoImageHeight }} />
                  ) : logo ? (
                    // Legacy: logo URL exists but type is text - show image
                    <img src={logo} alt={brandName || 'Logo'} className="w-auto object-contain" style={{ height: logoImageHeight }} />
                  ) : brandName ? (
                    // Text logo with first-letter icon
                    <div
                      className="rounded-xl flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: accentColor, height: logoTextSize + 12, width: logoTextSize + 12, fontSize: logoTextSize * 0.7 }}
                    >
                      {brandName.charAt(0)}
                    </div>
                  ) : null}
                  {/* Brand name text - only show if not image logo or if brandName exists */}
                  {(!isImageLogo || brandName) && (
                    <span
                      className="font-bold tracking-tight"
                      style={{ color: isScrolled ? textColor : '#000', fontSize: logoTextSize }}
                    >
                      {brandName}
                    </span>
                  )}
                </a>
              </div>
            )}

            {/* Desktop Navigation */}
            <div className={cn(
              "hidden md:flex items-center flex-1 px-12",
              linksAlignment === 'center' && "justify-center",
              linksAlignment === 'right' && "justify-end mr-6",
              linksAlignment === 'left' && "justify-start ml-2"
            )}>
              {links.map((link, index) => (
                <DesktopNavLink
                  key={index}
                  link={link}
                  index={index}
                  textColor={isScrolled ? textColor : '#000'}
                  linkHoverColor={linkHoverColor}
                  accentColor={accentColor}
                  linkFontSize={linkFontSize}
                  handleLinkClick={handleLinkClick}
                  handleSubmenuClick={handleSubmenuClick}
                />
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              {ctaText && ctaText.trim() !== '' && (
                <a
                  href={ctaType === 'url' ? ctaLink : ctaLink || '#'}
                  onClick={handleCTAClick}
                  className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
                  style={{
                    backgroundColor: accentColor,
                    color: '#ffffff',
                  }}
                >
                  {ctaText}
                </a>
              )}
              
              {/* Cart Icon */}
              {showCart && (
                <CartIconButton 
                  cartLink={cartLink}
                  accentColor={accentColor}
                />
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={cn(
                'md:hidden p-2.5 rounded-xl transition-all duration-200',
                isScrolled ? 'bg-white/10' : 'bg-black/5'
              )}
              style={{ color: isScrolled ? textColor : '#000' }}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Side Sheet - Refined Design */}
    <div
      className={cn(
        'fixed inset-0 z-[10001] md:hidden',
        isMobileMenuOpen ? 'block' : 'hidden'
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Sheet Header - Compact */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
          <a
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {isImageLogo ? (
              logo && <img src={logo} alt={brandName || 'Logo'} className="w-auto object-contain" style={{ height: logoImageHeight }} />
            ) : logo ? (
              <img src={logo} alt={brandName || 'Logo'} className="w-auto object-contain" style={{ height: logoImageHeight }} />
            ) : brandName ? (
              <div
                className="rounded-xl flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: accentColor, height: logoTextSize + 12, width: logoTextSize + 12, fontSize: logoTextSize * 0.7 }}
              >
                {brandName.charAt(0)}
              </div>
            ) : null}
            {(!isImageLogo || brandName) && (
              <span className="font-bold text-slate-900 tracking-tight" style={{ fontSize: logoTextSize }}>
                {brandName}
              </span>
            )}
          </a>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sheet Content - Refined Navigation */}
        <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Navigation Links */}
          <nav className="py-2">
            {links.map((link, index) => {
              // Check if link has submenu
              if (link.hasSubmenu && link.submenu && link.submenu.length > 0) {
                return (
                  <MobileSubmenu
                    key={index}
                    link={link}
                    accentColor={accentColor}
                    handleSubmenuClick={handleSubmenuClick}
                    onClose={closeMobileMenu}
                  />
                );
              }

              const isNewStyle = link.type !== undefined;
              const href = isNewStyle
                ? (link.type === 'url' ? link.url : link.url || '/')
                : link.href;

              return (
                <a
                  key={index}
                  href={href || '#'}
                  onClick={(e) => {
                    handleLinkClick(link, e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-6 py-4 border-b border-slate-100 last:border-b-0 transition-all duration-150 hover:bg-slate-50"
                >
                  {/* Mobile navlink with image support */}
                  {link.useImage && link.imageUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={link.imageUrl}
                        alt={link.label}
                        className="h-7 w-auto object-contain"
                      />
                      <span className="text-lg font-medium opacity-0">{link.label}</span>
                    </div>
                  ) : link.hoverToImage && link.hoverImageUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={link.hoverImageUrl}
                        alt={link.label}
                        className="h-7 w-auto object-contain"
                      />
                      <span className="text-lg font-medium text-slate-700">{link.label}</span>
                    </div>
                  ) : (
                    <span className="text-lg font-semibold text-slate-800 tracking-wide">{link.label}</span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Cart Link - Inside Mobile Menu */}
          {showCart && cartLink && (
            <a
              href={cartLink}
              className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 transition-all duration-150 hover:bg-slate-50"
            >
              <ShoppingCart className="h-5 w-5 text-slate-600" />
              <span className="text-lg font-semibold text-slate-800">Shopping Cart</span>
            </a>
          )}

          {/* CTA Section - Compact & Refined */}
          {ctaText && ctaText.trim() !== '' && (
            <div className="px-6 py-4 border-t border-slate-100">
              <a
                href={ctaType === 'url' ? ctaLink : ctaLink || '#'}
                onClick={handleCTAClick}
                className="flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                {ctaText}
              </a>
            </div>
          )}
        </div>

        {/* Sheet Footer - Minimal */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t border-slate-100 bg-white">
          <p className="text-[10px] text-slate-400 text-center tracking-wide">
            © {new Date().getFullYear()} {brandName}
          </p>
        </div>
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
  </>
  );
}
