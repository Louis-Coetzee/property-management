import type { z } from 'zod';

// ============================================================================
// Core Page Builder Types
// ============================================================================

export interface PointerSettings {
  enabled: boolean;
  type: 'default' | 'circle' | 'dot' | 'arrow' | 'car' | 'steering' | 'key' | 'pin' | 'custom';
  size: number;
  color: string;
  borderColor: string;
  trailEnabled: boolean;
  trailLength: number;
  trailColor: string;
  hoverScale: number;
  clickEffect: boolean;
}

export interface PageContent {
  sections: PageSection[];
  version: '1.0';
  lastModified: number;
  pointerSettings?: PointerSettings;
}

export interface PageSection {
  id: string;
  type: SectionType;
  templateId: string;
  order: number;
  content: Record<string, any>;
  settings?: SectionSettings;
  createdAt: number;
  updatedAt: number;
}

export type SectionType =
  | 'navbar'
  | 'hero'
  | 'about'
  | 'contact'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'footer'
  | 'coming-soon'
  | 'listings-showcase'
  | 'product-showcase'
  | 'service-showcase'
  | 'logo-ticker'
  | 'ai-generated'
  | 'custom-code'
  | 'booking-system';

// ============================================================================
// Animation Types
// ============================================================================

export type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'flip' | 'blur' | 'bounce';
export type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'none';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type AnimationEasing = 'ease' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring';

export interface AnimationSettings {
  enabled?: boolean;
  type?: AnimationType;
  direction?: AnimationDirection;
  speed?: AnimationSpeed;
  delay?: number; // in milliseconds (0-2000)
  duration?: number; // in milliseconds (200-2000)
  easing?: AnimationEasing;
  distance?: number; // pixels for slide animations (10-200)
  stagger?: boolean; // stagger child elements
  staggerDelay?: number; // delay between staggered children (0-500ms)
}

export interface SectionSettings {
  backgroundColor?: string;
  padding?: {
    top?: string;
    bottom?: string;
  };
  fullWidth?: boolean;
  animation?: AnimationSettings;
}

// ============================================================================
// Template Registry Types
// ============================================================================

export interface SectionTemplate {
  id: string;
  type: SectionType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'marketing' | 'content' | 'conversion' | 'navigation';
  isAvailable: boolean;
  previewImage?: string;
  defaultContent: Record<string, any>;
  schema: z.ZodObject<any>;
}

export type SectionCategory = SectionTemplate['category'];

// ============================================================================
// Navbar Section Content Types
// ============================================================================

export type NavbarLinkType = 'url' | 'page' | 'form';
export type NavbarLogoType = 'text' | 'image';

export interface NavbarSubLink {
  label: string;
  type: NavbarLinkType;
  // For type: 'url'
  url?: string;
  // For type: 'page'
  pageId?: string;
  sectionId?: string;
  // For type: 'form'
  formId?: string;
  // Optional description for submenu items
  description?: string;
  // Image support
  useImage?: boolean;
  imageUrl?: string;
  hoverToImage?: boolean;
  hoverImageUrl?: string;
}

export interface NavbarLink {
  label: string;
  type: NavbarLinkType;
  // For type: 'url'
  url?: string;
  // For type: 'page'
  pageId?: string;
  sectionId?: string;
  // For type: 'form'
  formId?: string;
  // Image support
  useImage?: boolean;
  imageUrl?: string;
  hoverToImage?: boolean;
  hoverImageUrl?: string;
  // Submenu support
  hasSubmenu?: boolean;
  submenu?: NavbarSubLink[];
}

export interface NavbarSectionContent {
  logoType?: NavbarLogoType;
  logo?: string;
  brandName?: string;
  links: Array<NavbarLink>;
  // CTA with full type support
  ctaText?: string;
  ctaLink?: string;
  ctaType?: 'url' | 'page' | 'form';
  ctaPageId?: string;
  ctaSectionId?: string;
  ctaFormId?: string;
  ctaEnabled?: boolean;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  backgroundColor?: string;
  textColor?: string;
  linkHoverColor?: string;
  accentColor?: string;
  // Layout settings
  linksAlignment?: 'left' | 'center' | 'right'; // Alignment of navigation links
  // Size settings
  linkFontSize?: number; // Font size for navlinks in pixels (10-24)
  logoTextSize?: number; // Font size for logo text in pixels (12-36)
  logoImageHeight?: number; // Height for logo image in pixels (16-80)
}

// ============================================================================
// Hero Section Content Types
// ============================================================================

export interface HeroSlide {
  headline?: string;
  headlineFontFamily?: HeroFontFamily;
  headlineFontSize?: string;
  subheadline?: string;
  subheadlineFontFamily?: HeroFontFamily;
  subheadlineFontSize?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaType?: 'url' | 'page' | 'form';
  ctaTarget?: 'url' | 'form'; // Deprecated - use ctaType
  ctaPageId?: string;
  ctaSectionId?: string;
  ctaFormId?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  ctaEnabled?: boolean;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundType?: 'color' | 'image';
  textColor?: string;
}

// Hero slider transition effects
export type HeroTransitionEffect = 'fade' | 'slide' | 'zoom' | 'flip' | 'puzzle';

export type HeroColorMode = 'dark' | 'light';

// Available fonts for hero sections (actual fonts, not families)
export const HERO_FONTS = [
  { value: 'Inter', label: 'Inter', category: 'Sans-serif' },
  { value: 'Roboto', label: 'Roboto', category: 'Sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', category: 'Sans-serif' },
  { value: 'Lato', label: 'Lato', category: 'Sans-serif' },
  { value: 'Poppins', label: 'Poppins', category: 'Sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'Sans-serif' },
  { value: 'Raleway', label: 'Raleway', category: 'Sans-serif' },
  { value: 'Nunito', label: 'Nunito', category: 'Sans-serif' },
  { value: 'Work Sans', label: 'Work Sans', category: 'Sans-serif' },
  { value: 'Quicksand', label: 'Quicksand', category: 'Sans-serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'Serif' },
  { value: 'Merriweather', label: 'Merriweather', category: 'Serif' },
  { value: 'Lora', label: 'Lora', category: 'Serif' },
  { value: 'PT Serif', label: 'PT Serif', category: 'Serif' },
  { value: 'Crimson Text', label: 'Crimson Text', category: 'Serif' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', category: 'Serif' },
  { value: 'Josefin Sans', label: 'Josefin Sans', category: 'Display' },
  { value: 'Oswald', label: 'Oswald', category: 'Display' },
  { value: 'Bebas Neue', label: 'Bebas Neue', category: 'Display' },
  { value: 'Anton', label: 'Anton', category: 'Display' },
  { value: 'Righteous', label: 'Righteous', category: 'Display' },
  { value: 'Abril Fatface', label: 'Abril Fatface', category: 'Display' },
  { value: 'Dancing Script', label: 'Dancing Script', category: 'Script' },
  { value: 'Pacifico', label: 'Pacifico', category: 'Script' },
  { value: 'Caveat', label: 'Caveat', category: 'Script' },
] as const;

export type HeroFont = typeof HERO_FONTS[number]['value'];

export type HeroFontFamily = 'default' | HeroFont;

export interface HeroSectionContent {
  // Headline - now optional
  headline?: string;
  headlineFontFamily?: HeroFontFamily;
  headlineFontSize?: string; // e.g., "3rem", "48px", "clamp(2rem, 5vw, 4rem)"
  headlineFontWeight?: string; // e.g., "700", "bold"
  headlineColor?: string;
  headlineTextAlign?: 'left' | 'center' | 'right';
  
  // Subheadline - now optional
  subheadline?: string;
  subheadlineFontFamily?: HeroFontFamily;
  subheadlineFontSize?: string;
  subheadlineFontWeight?: string;
  subheadlineColor?: string;
  subheadlineTextAlign?: 'left' | 'center' | 'right';
  
  // Content alignment
  contentAlign?: 'left' | 'center' | 'right';
  
  // Primary CTA
  ctaText?: string;
  ctaLink?: string;
  ctaType?: 'url' | 'page' | 'form';
  ctaTarget?: 'url' | 'form'; // Deprecated - use ctaType
  ctaPageId?: string;
  ctaSectionId?: string;
  ctaFormId?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  ctaEnabled?: boolean;
  // Secondary CTA
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  secondaryCtaType?: 'url' | 'page' | 'form';
  secondaryCtaPageId?: string;
  secondaryCtaSectionId?: string;
  secondaryCtaFormId?: string;
  secondaryCtaBackgroundColor?: string;
  secondaryCtaTextColor?: string;
  secondaryCtaEnabled?: boolean;
  // Styling
  colorMode?: HeroColorMode;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundType?: 'color' | 'image';
  textColor?: string;
  // Display options
  showScrollIndicator?: boolean;
  showWelcomeTag?: boolean;
  showStatsCard?: boolean;
  showTrustIndicators?: boolean;
  showSecondaryCta?: boolean;
  // Stats Card Configuration
  statsCardTitle?: string;
  statsCardValue?: string;
  stats?: Array<{
    id: string;
    value: string;
    label: string;
    iconType?: 'none' | 'emoji' | 'solid';
    emoji?: string;
    solidIcon?: string;
    solidIconColor?: string;
  }>;
  showCustomerAvatars?: boolean;
  customerTrustText?: string;
  // Trust Indicators Configuration
  trustIndicators?: Array<{
    id: string;
    icon: 'shield' | 'award' | 'clock' | 'star' | 'check' | 'heart';
    label: string;
  }>;
  // Slider-specific fields
  sliderEnabled?: boolean;
  slides?: HeroSlide[];
  autoplay?: boolean;
  autoplayDelay?: number;
  showArrows?: boolean;
  showDots?: boolean;
  showSlideNumbers?: boolean;
  transitionEffect?: HeroTransitionEffect;
}

// ============================================================================
// About Section Content Types
// ============================================================================

export type AboutIconType = 'emoji' | 'solid';

export interface AboutFeaturePill {
  id: string;
  text: string;
  iconType?: AboutIconType;
  icon?: string; // Emoji icon
  solidIcon?: string; // Solid icon name
  solidIconColor?: string;
}

export interface AboutStat {
  id: string;
  value: string;
  label: string;
  iconType?: AboutIconType;
  icon?: string; // Emoji icon
  solidIcon?: string; // Solid icon name
  solidIconColor?: string;
}

export interface AboutSectionContent {
  headline: string;
  subheadline?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  imagePosition?: 'left' | 'right';
  imageSize?: 'xs' | 'small' | 'medium' | 'large' | 'full';
  // CTA with full type support
  ctaText?: string;
  ctaLink?: string;
  ctaType?: 'url' | 'page' | 'form';
  ctaTarget?: 'url' | 'form'; // Deprecated - use ctaType
  ctaPageId?: string;
  ctaSectionId?: string;
  ctaFormId?: string;
  ctaEnabled?: boolean;
  backgroundColor?: string;
  textColor?: string;
  // CTA Button styling
  ctaButtonBg?: string;
  ctaButtonTextColor?: string;
  // Accent color for icons and highlights
  accentColor?: string;
  // Feature pills (Innovation, Quality, Trust, etc.)
  showFeaturePills?: boolean;
  featurePills?: AboutFeaturePill[];
  // For modern template - stats with icons
  showStats?: boolean;
  stats?: AboutStat[];
  // Bottom CTA bar
  showBottomCta?: boolean;
  bottomCtaHeadline?: string;
  bottomCtaSubtext?: string;
  // Floating badge
  showFloatingBadge?: boolean;
  floatingBadgeValue?: string;
  floatingBadgeLabel?: string;
  // For classic template
  showTeam?: boolean;
  teamMembers?: Array<{
    name: string;
    role?: string;
    image?: string;
  }>;
}

// ============================================================================
// Feature Section Content Types
// ============================================================================

export type FeatureIconStyle = 'gradient' | 'solid' | 'outline' | 'minimal';
export type FeatureGridLayout = 'grid-2' | 'grid-3' | 'grid-4';
export type FeatureIconType = 'emoji' | 'solid';
export type FeatureContentAlignment = 'left' | 'center' | 'right';
export type FeatureLinkType = 'url' | 'page' | 'form';
// Icon size is now in pixels (8-60)
export type FeatureIconSize = number;

export interface FeatureLink {
  type: FeatureLinkType;
  // For type: 'url'
  url?: string;
  // For type: 'page'
  pageId?: string;
  sectionId?: string;
  // For type: 'form'
  formId?: string;
}

export interface FeaturesSectionContent {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  showBadge?: boolean;
  features: Array<{
    id: string;
    title: string;
    description: string;
    icon?: string; // Emoji icon
    iconType?: FeatureIconType; // 'emoji' or 'solid'
    solidIcon?: string; // Solid icon name (lucide icon name)
    solidIconColor?: string; // Custom color for solid icon
    imageUrl?: string;
    contentAlignment?: FeatureContentAlignment; // Per-feature alignment
    // Link target options
    link?: FeatureLink;
  }>;
  // Styling
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  iconStyle?: FeatureIconStyle;
  iconSize?: FeatureIconSize; // Icon size setting
  gridLayout?: FeatureGridLayout;
  cardStyle?: 'elevated' | 'outlined' | 'minimal';
  showCardHover?: boolean;
  contentAlignment?: FeatureContentAlignment; // Default alignment for all features
  // Modern template specific
  autoRotate?: boolean;
  rotationDelay?: number;
}

// ============================================================================
// Testimonials Section Content Types (for future use)
// ============================================================================

export interface TestimonialsSectionContent {
  title?: string;
  subtitle?: string;
  testimonials: Array<{
    id: string;
    name: string;
    role?: string;
    company?: string;
    content: string;
    avatar?: string;
    rating?: number;
  }>;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;
}

// ============================================================================
// Pricing Section Content Types
// ============================================================================

export type PricingCTAType = 'url' | 'page' | 'form';
export type PricingIconType = 'emoji' | 'solid';

export interface PricingCTA {
  type: PricingCTAType;
  url?: string;
  pageId?: string;
  sectionId?: string;
  formId?: string;
}

export interface PricingFeature {
  id: string;
  text: string;
  included: boolean;
}

export interface PricingCard {
  id: string;
  title: string;
  description?: string;
  price: string;
  period?: string;
  iconType?: PricingIconType;
  icon?: string;
  solidIcon?: string;
  solidIconColor?: string;
  features: PricingFeature[];
  ctaText?: string;
  cta?: PricingCTA;
  highlighted?: boolean;
  badgeText?: string;
}

export interface PricingSectionContent {
  headline?: string;
  subheadline?: string;
  badgeText?: string;
  showBadge?: boolean;
  cards: PricingCard[];
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  cardBackgroundColor?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  footnoteText?: string;
  showFootnote?: boolean;
}

// ============================================================================
// Footer Section Content Types
// ============================================================================

export type FooterLogoType = 'text' | 'image';
export type FooterLinkType = 'url' | 'page' | 'form';

export interface FooterLink {
  label: string;
  type: FooterLinkType;
  // For type: 'url'
  url?: string;
  // For type: 'page'
  pageId?: string;
  sectionId?: string;
  // For type: 'form'
  formId?: string;
  // Image support
  useImage?: boolean;
  imageUrl?: string;
  hoverToImage?: boolean;
  hoverImageUrl?: string;
}

export interface FooterLinkGroup {
  title: string;
  items: FooterLink[];
}

export interface BusinessHours {
  enabled?: boolean;
  showHours?: boolean;
  title?: string;
  days?: Array<{
    day: string;
    hours: string;
    isOpen: boolean;
  }>;
  // Public Holidays general setting
  showPublicHolidays?: boolean;
  publicHolidaysIsOpen?: boolean;
  publicHolidaysHours?: string;
  // Specific holidays
  showHolidays?: boolean;
  holidaysTitle?: string;
  holidays?: Array<{
    name: string;
    date: string;
    hours: string;
    isOpen: boolean;
  }>;
}

export interface FooterSectionContent {
  // Logo options
  logoType?: FooterLogoType;
  logo?: string;
  companyName?: string;

  // Company info
  company?: {
    name: string;
    description?: string;
  };

  // Contact info
  email?: string;
  phone?: string;
  address?: string;

  // Business hours
  businessHours?: BusinessHours;

  // Navigation links with advanced options
  links?: FooterLinkGroup[];

  // Social links
  socialLinks?: Array<{
    platform: string;
    href: string;
  }>;

  // Copyright
  copyright?: string;

  // Styling
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

// ============================================================================
// Contact Section Content Types
// ============================================================================

export interface ContactFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ContactSectionContent {
  headline?: string;
  subheadline?: string;
  description?: string;
  // Contact information
  email?: string;
  phone?: string;
  address?: string;
  // Social links
  socialLinks?: Array<{
    platform: string;
    href: string;
  }>;
  // Form settings
  showForm?: boolean;
  formFields?: ContactFormField[];
  submitButtonText?: string;
  successMessage?: string;
  // Email recipients
  recipients?: string[]; // Email addresses that receive form submissions
  // Thank you email settings
  sendThankYouEmail?: boolean; // Send confirmation email to submitter
  thankYouEmailSubject?: string;
  thankYouEmailMessage?: string;
  // Styling
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  // Layout options
  layout?: 'split' | 'centered' | 'full';
  // Show/hide map
  showMap?: boolean;
  mapEmbedCode?: string;
}

// ============================================================================
// Listings Showcase Section Content Types
// ============================================================================

export interface ListingsShowcaseSectionContent {
  headline?: string;
  subheadline?: string;
  description?: string;
  // Filters
  filterBy?: {
    companyIds?: string[];
    brandIds?: string[];
    conditionIds?: string[];
  };
  // Display settings
  itemsPerPage?: number;
  showLoadMore?: boolean;
  loadMoreText?: string;
  showSort?: boolean;
  showFilter?: boolean;
  defaultSort?: string;
  // Card display options
  showStatus?: boolean;
  showPrice?: boolean;
  showMileage?: boolean;
  showYear?: boolean;
  // Styling
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  cardStyle?: 'modern' | 'premium';
  layout?: 'grid-3' | 'grid-4' | 'carousel';
  // CTAs
  viewDetailsText?: string;
  viewDetailsTarget?: 'url' | 'form';
  viewDetailsFormId?: string;
  // Detail page settings
  showNavbarOnDetails?: boolean;
  showFooterOnDetails?: boolean;
  // Inquiry button settings
  inquiryTarget?: 'url' | 'page' | 'form';
  inquiryUrl?: string;
  inquiryPageId?: string;
  inquirySectionId?: string;
  inquiryFormId?: string;
  inquiryButtonText?: string;
  // Inquiry email settings
  inquiryRecipients?: string[];
  inquirySendThankYouEmail?: boolean;
  inquiryThankYouEmailSubject?: string;
  inquiryThankYouEmailMessage?: string;
  inquirySuccessMessage?: string;
}

// ============================================================================
// Product Showcase Section Content Types
// ============================================================================

export interface ProductShowcaseSectionContent {
  headline?: string;
  subheadline?: string;
  description?: string;
  filterBy?: {
    companyIds?: string[];
    categoryIds?: string[];
    brandIds?: string[];
  };
  itemsPerPage?: number;
  showLoadMore?: boolean;
  loadMoreText?: string;
  showSearch?: boolean;
  showSort?: boolean;
  showFilter?: boolean;
  categoryFilterStyle?: 'dropdown' | 'tags';
  defaultSort?: string;
  showStatus?: boolean;
  showPrice?: boolean;
  showStock?: boolean;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  cardStyle?: 'modern' | 'premium';
  layout?: 'grid-3' | 'grid-4' | 'carousel';
  columns?: 2 | 3 | 4;
  cardSize?: 'small' | 'medium' | 'large';
  cardSpacing?: 'compact' | 'normal' | 'spacious';
  viewDetailsText?: string;
  viewDetailsTarget?: 'url' | 'form';
  viewDetailsFormId?: string;
  inquiryTarget?: 'url' | 'page' | 'form';
  inquiryUrl?: string;
  inquiryPageId?: string;
  inquirySectionId?: string;
  inquiryFormId?: string;
  inquiryButtonText?: string;
  showOnlySelected?: boolean;
  selectedProductIds?: string[];
}

// ============================================================================
// Service Showcase Section Content Types
// ============================================================================

export interface ServiceShowcaseSectionContent {
  headline?: string;
  subheadline?: string;
  description?: string;
  // Filters
  filterBy?: {
    companyIds?: string[];
    categoryIds?: string[];
  };
  // Display settings
  itemsPerPage?: number;
  showLoadMore?: boolean;
  loadMoreText?: string;
  showSort?: boolean;
  showFilter?: boolean;
  defaultSort?: string;
  // Card display options
  showPrice?: boolean;
  showDuration?: boolean;
  showCategory?: boolean;
  // Styling
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  cardStyle?: 'modern' | 'premium';
  layout?: 'grid-3' | 'grid-4' | 'carousel';
  // CTAs
  viewDetailsText?: string;
  viewDetailsTarget?: 'url' | 'form';
  viewDetailsFormId?: string;
  // Inquiry button settings
  inquiryTarget?: 'url' | 'page' | 'form';
  inquiryUrl?: string;
  inquiryPageId?: string;
  inquirySectionId?: string;
  inquiryFormId?: string;
  inquiryButtonText?: string;
  // Manual service selection
  showOnlySelected?: boolean;
  selectedServiceIds?: string[];
}

// ============================================================================
// Logo Ticker Section Content Types
// ============================================================================

export interface LogoItem {
  id: string;
  name: string;
  imageUrl: string;
  link?: string;
}

export type LogoTickerDirection = 'left' | 'right';
export type LogoTickerSpeed = 'slow' | 'normal' | 'fast' | 'very-fast';

export interface LogoTickerSectionContent {
  title?: string;
  logos: LogoItem[];
  // Animation settings (for infinite scroll template)
  direction?: LogoTickerDirection;
  speed?: LogoTickerSpeed;
  logoSpacing?: number; // gap between logos in pixels
  logoWidth?: number; // width of each logo container
  logoHeight?: number; // height of each logo
  pauseOnHover?: boolean;
  // Styling
  backgroundColor?: string;
  logoBackground?: string;
  logoBorderRadius?: number;
  grayscale?: boolean;
  grayscaleOnHover?: boolean;
  opacity?: number;
}

// ============================================================================
// AI-Generated Section Content Types
// ============================================================================

export interface AISectionContent {
  prompt: string;
  sectionFileId: string;
  r2Url: string;
  generatedAt: number;
  sectionName: string;
}

// ============================================================================
// Custom Code Section Content Types
// ============================================================================

export interface CustomCodeContent {
  codeFileId: string;
  r2Url: string;
  code: string;
  sectionName: string;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Builder UI Types
// ============================================================================

export interface SectionCategoryOption {
  type: SectionType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isAvailable: boolean;
  comingSoonText?: string;
}

export interface BuilderState {
  sections: PageSection[];
  selectedSectionId: string | null;
  isDirty: boolean;
  isSaving: boolean;
}
