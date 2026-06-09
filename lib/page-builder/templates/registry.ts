import { z } from 'zod';
import type { SectionTemplate, SectionType } from '@/types/page-builder';
import {
  Sparkles,
  LayoutGrid,
  MessageSquare,
  CreditCard,
  Minimize2,
  Clock,
  Menu,
  Info,
  Users,
  Mail,
  Car,
  Star,
  Images,
  Wrench,
  Package,
  Calendar,
  Home,
} from 'lucide-react';

// ============================================================================
// Zod Schemas for Section Content
// ============================================================================

const heroContentSchema = z.object({
  headline: z.string().min(1, 'Headline is required'),
  headlineFontFamily: z.string().optional(),
  headlineFontSize: z.string().optional(),
  headlineFontWeight: z.string().optional(),
  headlineColor: z.string().optional(),
  headlineTextAlign: z.enum(['left', 'center', 'right']).optional(),
  subheadline: z.string().max(700, 'Subheadline must be 700 characters or less').optional(),
  subheadlineFontFamily: z.string().optional(),
  subheadlineFontSize: z.string().optional(),
  subheadlineFontWeight: z.string().optional(),
  subheadlineColor: z.string().optional(),
  subheadlineTextAlign: z.enum(['left', 'center', 'right']).optional(),
  contentAlign: z.enum(['left', 'center', 'right']).optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  textColor: z.string().optional(),
});

const heroSlideSchema = z.object({
  headline: z.string().min(1, 'Headline is required'),
  subheadline: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  ctaTarget: z.enum(['url', 'form']).optional(),
  ctaFormId: z.string().optional(),
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundType: z.enum(['color', 'image']).optional(),
  textColor: z.string().optional(),
});

const heroSliderContentSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  ctaTarget: z.enum(['url', 'form']).optional(),
  ctaFormId: z.string().optional(),
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  textColor: z.string().optional(),
  slides: z.array(heroSlideSchema).min(1, 'At least one slide is required'),
  autoplay: z.boolean().optional(),
  autoplayDelay: z.number().optional(),
  showArrows: z.boolean().optional(),
  showDots: z.boolean().optional(),
  showSlideNumbers: z.boolean().optional(),
  showScrollIndicator: z.boolean().optional(),
});

const heroVehicleShowcaseContentSchema = z.object({
  headline: z.string().min(1, 'Headline is required'),
  subheadline: z.string().optional(),
  tagline: z.string().optional(),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  ctaType: z.enum(['url', 'page', 'form']).optional(),
  ctaFormId: z.string().optional(),
  secondaryCtaText: z.string().optional(),
  secondaryCtaLink: z.string().optional(),
  secondaryCtaType: z.enum(['url', 'page', 'form']).optional(),
  showPrimaryCta: z.boolean().optional(),
  showSecondaryCta: z.boolean().optional(),
  vehicleImage: z.string().optional(),
  vehicleName: z.string().optional(),
  vehiclePrice: z.string().optional(),
  vehicleYear: z.string().optional(),
  priceLabel: z.string().optional(),
  showPriceTag: z.boolean().optional(),
  showVehicleBadge: z.boolean().optional(),
  rating: z.number().optional(),
  reviewCount: z.string().optional(),
  showReviews: z.boolean().optional(),
  showSpecs: z.boolean().optional(),
  showQuickStats: z.boolean().optional(),
  specs: z.array(z.object({
    id: z.string(),
    label: z.string(),
    value: z.string(),
  })).optional(),
  stats: z.array(z.object({
    id: z.string(),
    value: z.string(),
    label: z.string(),
  })).optional(),
  badges: z.array(z.object({
    icon: z.string(),
    text: z.string(),
  })).optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
});

const navbarLinkSchema = z.object({
  label: z.string().min(1, 'Link label is required'),
  type: z.enum(['url', 'page']),
  url: z.string().optional(),
  pageId: z.string().optional(),
  sectionId: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === 'url') {
      return data.url !== undefined && data.url !== '';
    }
    return data.pageId !== undefined && data.pageId !== '';
  },
  {
    message: 'URL is required for type "url", pageId is required for type "page"',
  }
);

const navbarContentSchema = z.object({
  logoType: z.enum(['text', 'image']).optional(),
  logo: z.string().optional(),
  brandName: z.string().optional(),
  links: z.array(navbarLinkSchema).min(1, 'At least one link is required'),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  showCart: z.boolean().optional(),
  cartLink: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  linkHoverColor: z.string().optional(),
  accentColor: z.string().optional(),
  sticky: z.boolean().optional(),
}).refine(
  (data) => {
    // If logoType is 'text', brandName is optional (can be empty for no logo)
    // If logoType is 'image' or not specified, no validation needed for brandName
    return true;
  }
);

const aboutContentSchema = z.object({
  headline: z.string().min(1, 'Headline is required'),
  subheadline: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  showStats: z.boolean().optional(),
  stats: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  showTeam: z.boolean().optional(),
  teamMembers: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    image: z.string().optional(),
  })).optional(),
});

const footerContentSchema = z.object({
  // Logo options
  logoType: z.enum(['text', 'image']).optional(),
  logo: z.string().optional(),
  companyName: z.string().optional(),

  // Company info
  company: z.object({
    name: z.string().min(1, 'Company name is required'),
    description: z.string().optional(),
  }).optional(),

  // Contact info
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),

  // Business hours
  businessHours: z.object({
    enabled: z.boolean().optional(),
    showHours: z.boolean().optional(),
    title: z.string().optional(),
    days: z.array(z.object({
      day: z.string(),
      hours: z.string(),
      isOpen: z.boolean(),
    })).optional(),
  }).optional(),

  // Navigation links
  links: z.array(z.object({
    title: z.string().min(1, 'Link group title is required'),
    items: z.array(z.object({
      label: z.string().min(1, 'Link label is required'),
      href: z.string().min(1, 'Link href is required'),
    })).min(1, 'At least one link is required'),
  })).optional(),

  // Social links
  socialLinks: z.array(z.object({
    platform: z.string().min(1, 'Platform is required'),
    href: z.string().min(1, 'Social link href is required'),
  })).optional(),

  // Copyright
  copyright: z.string().optional(),

  // Styling
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
});

const contactContentSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  description: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    href: z.string(),
  })).optional(),
  showForm: z.boolean().optional(),
  formFields: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'email', 'textarea', 'select']),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
  })).optional(),
  submitButtonText: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  layout: z.enum(['split', 'centered', 'full']).optional(),
  showMap: z.boolean().optional(),
  mapEmbedCode: z.string().optional(),
});

const featureLinkSchema = z.object({
  type: z.enum(['url', 'page', 'form']),
  url: z.string().optional(),
  pageId: z.string().optional(),
  sectionId: z.string().optional(),
  formId: z.string().optional(),
});

const featuresContentSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  badgeText: z.string().optional(),
  showBadge: z.boolean().optional(),
  features: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Feature title is required'),
    description: z.string().min(1, 'Feature description is required'),
    icon: z.string().optional(),
    iconType: z.enum(['emoji', 'solid']).optional(),
    solidIcon: z.string().optional(),
    solidIconColor: z.string().optional(),
    imageUrl: z.string().optional(),
    contentAlignment: z.enum(['left', 'center', 'right']).optional(),
    link: featureLinkSchema.optional(),
  })).min(1, 'At least one feature is required'),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  iconStyle: z.enum(['gradient', 'solid', 'outline', 'minimal']).optional(),
  iconSize: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  gridLayout: z.enum(['grid-2', 'grid-3', 'grid-4']).optional(),
  cardStyle: z.enum(['elevated', 'outlined', 'minimal']).optional(),
  showCardHover: z.boolean().optional(),
  contentAlignment: z.enum(['left', 'center', 'right']).optional(),
  autoRotate: z.boolean().optional(),
  rotationDelay: z.number().optional(),
});

const testimonialsContentSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  testimonials: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    role: z.string().optional(),
    company: z.string().optional(),
    content: z.string().min(1, 'Testimonial content is required'),
    avatar: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
  })).min(1, 'At least one testimonial is required'),
});

const pricingCTASchema = z.object({
  type: z.enum(['url', 'page', 'form']),
  url: z.string().optional(),
  pageId: z.string().optional(),
  sectionId: z.string().optional(),
  formId: z.string().optional(),
});

const pricingFeatureSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Feature text is required'),
  included: z.boolean(),
});

const pricingCardSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Card title is required'),
  description: z.string().optional(),
  price: z.string(),
  period: z.string().optional(),
  iconType: z.enum(['emoji', 'solid']).optional(),
  icon: z.string().optional(),
  solidIcon: z.string().optional(),
  solidIconColor: z.string().optional(),
  features: z.array(pricingFeatureSchema),
  ctaText: z.string().optional(),
  cta: pricingCTASchema.optional(),
  highlighted: z.boolean().optional(),
  badgeText: z.string().optional(),
});

const pricingContentSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  badgeText: z.string().optional(),
  showBadge: z.boolean().optional(),
  cards: z.array(pricingCardSchema).min(1, 'At least one pricing card is required'),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  cardBackgroundColor: z.string().optional(),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]).optional(),
  footnoteText: z.string().optional(),
  showFootnote: z.boolean().optional(),
});

// ============================================================================
// Default Content Values
// ============================================================================

const heroBasicDefaultContent = {
  headline: 'Welcome to Our Website',
  subheadline: 'Build beautiful pages with our easy-to-use page builder',
  ctaText: 'Get Started',
  ctaLink: '#',
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
};

const heroModernDefaultContent = {
  headline: 'Create Something Amazing',
  subheadline: 'Transform your ideas into stunning web experiences',
  ctaText: 'Start Building',
  ctaLink: '#',
  backgroundColor: '#6366f1',
  backgroundImage: '',
  textColor: '#ffffff',
};

const heroSliderDefaultContent = {
  headline: 'Welcome to Our Website',
  subheadline: 'Build beautiful pages with our easy-to-use page builder',
  ctaText: 'Get Started',
  ctaLink: '#',
  ctaTarget: 'url' as const,
  backgroundColor: '#6366f1',
  backgroundImage: '',
  textColor: '#ffffff',
  slides: [
    {
      headline: 'Create Something Amazing',
      subheadline: 'Transform your ideas into stunning web experiences',
      ctaText: 'Start Building',
      ctaLink: '#',
      ctaTarget: 'url' as const,
      backgroundColor: '#6366f1',
      backgroundImage: '',
      backgroundType: 'color' as 'color' | 'image',
      textColor: '#ffffff',
    },
    {
      headline: 'Grow Your Business',
      subheadline: 'Reach more customers with powerful tools and features',
      ctaText: 'Learn More',
      ctaLink: '#',
      ctaTarget: 'url' as const,
      backgroundColor: '#10b981',
      backgroundImage: '',
      backgroundType: 'color' as 'color' | 'image',
      textColor: '#ffffff',
    },
    {
      headline: 'Join Thousands of Users',
      subheadline: 'See why businesses choose our platform for success',
      ctaText: 'Get Started Free',
      ctaLink: '#',
      ctaTarget: 'url' as const,
      backgroundColor: '#f59e0b',
      backgroundImage: '',
      backgroundType: 'color' as 'color' | 'image',
      textColor: '#ffffff',
    },
  ],
  autoplay: true,
  autoplayDelay: 5,
  showArrows: true,
  showDots: true,
  showSlideNumbers: true,
  showScrollIndicator: true,
};

const heroVehicleShowcaseDefaultContent = {
  headline: 'Find Your Perfect Vehicle',
  subheadline: 'Discover our exceptional collection of quality vehicles at competitive prices. Experience hassle-free car buying with our expert team.',
  tagline: 'Featured Vehicle',
  subtitle: 'Premium Quality • Best Value',
  ctaText: 'Browse Inventory',
  ctaLink: '/inventory',
  ctaType: 'url' as const,
  secondaryCtaText: 'Schedule Test Drive',
  secondaryCtaLink: '#contact',
  secondaryCtaType: 'url' as const,
  showPrimaryCta: true,
  showSecondaryCta: true,
  vehicleImage: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
  vehicleName: '2024 Premium Sedan',
  vehiclePrice: '$45,990',
  vehicleYear: '2024',
  priceLabel: 'Starting at',
  showPriceTag: true,
  showVehicleBadge: true,
  rating: 4.9,
  reviewCount: '500+',
  showReviews: true,
  showSpecs: true,
  showQuickStats: true,
  specs: [
    { id: 'spec1', label: 'Engine', value: '1.6L' },
    { id: 'spec2', label: 'Mileage', value: '45,000 km' },
    { id: 'spec3', label: 'Transmission', value: 'Automatic' },
    { id: 'spec4', label: 'Fuel', value: 'Petrol' },
  ],
  stats: [
    { id: 'stat1', value: '200+', label: 'Vehicles in Stock' },
    { id: 'stat2', value: '15+', label: 'Years Experience' },
    { id: 'stat3', value: '98%', label: 'Happy Customers' },
  ],
  badges: [
    { icon: 'shield', text: 'Certified Dealer' },
    { icon: 'award', text: 'Best Price Guarantee' },
    { icon: 'check', text: '150-Point Inspection' },
  ],
  accentColor: '#dc2626',
  backgroundColor: '#0a0a0a',
};

const navbarBasicDefaultContent = {
  logoType: 'text' as const,
  logo: '',
  brandName: 'Brand',
  links: [
    { label: 'Home', type: 'url' as const, url: '/' },
    { label: 'About', type: 'url' as const, url: '/about' },
    { label: 'Services', type: 'url' as const, url: '/services' },
    { label: 'Contact', type: 'url' as const, url: '/contact' },
  ],
  ctaText: 'Get Started',
  ctaLink: '#',
  showCart: false,
  cartLink: '',
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  linkHoverColor: '#4f46e5',
  sticky: true,
};

const navbarModernDefaultContent = {
  logoType: 'text' as const,
  logo: '',
  brandName: 'Brand',
  links: [
    { label: 'Home', type: 'url' as const, url: '/' },
    { label: 'Features', type: 'url' as const, url: '/features' },
    { label: 'Pricing', type: 'url' as const, url: '/pricing' },
    { label: 'About', type: 'url' as const, url: '/about' },
  ],
  ctaText: 'Start Free Trial',
  ctaLink: '#',
  showCart: false,
  cartLink: '',
  backgroundColor: '#0f172a',
  textColor: '#ffffff',
  linkHoverColor: '#6366f1',
  accentColor: '#6366f1',
  sticky: true,
};

const aboutClassicDefaultContent = {
  headline: 'About Us',
  subheadline: 'Our Story',
  description: 'We are a team of passionate professionals dedicated to delivering exceptional products and services. With years of experience in the industry, we have helped countless clients achieve their goals.',
  imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop',
  imageAlt: 'Our team collaborating',
  imagePosition: 'left' as const,
  imageSize: 'medium' as const,
  ctaText: 'Learn More',
  ctaLink: '#',
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  showTeam: false,
  teamMembers: [],
};

const aboutModernDefaultContent = {
  headline: 'Who We Are',
  subheadline: 'Building the Future, Together',
  description: 'We are on a mission to transform the way businesses operate. Our innovative solutions combine cutting-edge technology with human-centered design to create lasting impact.',
  imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=800&fit=crop',
  imageAlt: 'Our modern office',
  imagePosition: 'right' as const,
  imageSize: 'medium' as const,
  ctaText: 'Get in Touch',
  ctaLink: '#',
  backgroundColor: '#f8fafc',
  textColor: '#1e293b',
  showStats: true,
  stats: [
    { id: 'stat1', value: '500+', label: 'Clients Served', iconType: 'solid', solidIcon: 'users', solidIconColor: '#dc2626' },
    { id: 'stat2', value: '98%', label: 'Satisfaction Rate', iconType: 'solid', solidIcon: 'heart', solidIconColor: '#dc2626' },
    { id: 'stat3', value: '15+', label: 'Years Experience', iconType: 'solid', solidIcon: 'award', solidIconColor: '#dc2626' },
    { id: 'stat4', value: '50+', label: 'Team Members', iconType: 'solid', solidIcon: 'briefcase', solidIconColor: '#dc2626' },
  ],
};

const footerBasicDefaultContent = {
  logoType: 'text' as const,
  logo: '',
  companyName: 'Your Company',
  company: {
    name: 'Your Company',
    description: 'Building exceptional digital experiences for businesses worldwide.',
  },
  email: 'hello@example.com',
  phone: '+1 (555) 123-4567',
  address: 'San Francisco, CA',
  businessHours: {
    enabled: false,
    showHours: false,
    title: 'Business Hours',
    days: [
      { day: 'Monday', hours: '9:00 AM - 6:00 PM', isOpen: true },
      { day: 'Tuesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
      { day: 'Wednesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
      { day: 'Thursday', hours: '9:00 AM - 6:00 PM', isOpen: true },
      { day: 'Friday', hours: '9:00 AM - 6:00 PM', isOpen: true },
      { day: 'Saturday', hours: '10:00 AM - 4:00 PM', isOpen: true },
      { day: 'Sunday', hours: 'Closed', isOpen: false },
    ],
    showPublicHolidays: false,
    publicHolidaysIsOpen: false,
    publicHolidaysHours: '',
    showHolidays: false,
    holidaysTitle: 'Holiday Hours',
    holidays: [
      { name: "New Year's Day", date: 'Jan 1', hours: 'Closed', isOpen: false },
      { name: 'Memorial Day', date: 'Last Mon in May', hours: 'Closed', isOpen: false },
      { name: 'Independence Day', date: 'July 4', hours: 'Closed', isOpen: false },
      { name: 'Labor Day', date: 'First Mon in Sep', hours: 'Closed', isOpen: false },
      { name: 'Thanksgiving', date: 'Fourth Thu in Nov', hours: 'Closed', isOpen: false },
      { name: 'Christmas Eve', date: 'Dec 24', hours: '9:00 AM - 2:00 PM', isOpen: true },
      { name: 'Christmas', date: 'Dec 25', hours: 'Closed', isOpen: false },
    ],
  },
  links: [
    {
      title: 'Product',
      items: [
        { label: 'Features', type: 'url' as const, url: '/features' },
        { label: 'Pricing', type: 'url' as const, url: '/pricing' },
        { label: 'Integrations', type: 'url' as const, url: '/integrations' },
      ],
    },
    {
      title: 'Company',
      items: [
        { label: 'About', type: 'url' as const, url: '/about' },
        { label: 'Blog', type: 'url' as const, url: '/blog' },
        { label: 'Careers', type: 'url' as const, url: '/careers' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center', type: 'url' as const, url: '/help' },
        { label: 'Contact', type: 'url' as const, url: '/contact' },
        { label: 'Status', type: 'url' as const, url: '/status' },
      ],
    },
  ],
  socialLinks: [
    { platform: 'twitter', href: 'https://twitter.com' },
    { platform: 'linkedin', href: 'https://linkedin.com' },
    { platform: 'github', href: 'https://github.com' },
  ],
  copyright: '© 2024 Your Company. All rights reserved.',
  backgroundColor: '#0f172a',
  textColor: '#ffffff',
  accentColor: '#6366f1',
};

const footerModernDefaultContent = {
  logoType: 'text' as const,
  logo: '',
  companyName: 'Your Company',
  company: {
    name: 'Your Company',
    description: 'Transform your business with our innovative platform. Join thousands of satisfied customers worldwide.',
  },
  email: 'hello@example.com',
  phone: '+1 (555) 123-4567',
  address: 'San Francisco, CA',
  businessHours: {
    enabled: false,
    showHours: false,
    title: 'Business Hours',
    days: [
      { day: 'Monday', hours: '9:00 AM - 6:00 PM', isOpen: true },
      { day: 'Tuesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
      { day: 'Wednesday', hours: '9:00 AM - 6:00 PM', isOpen: true },
      { day: 'Thursday', hours: '9:00 AM - 6:00 PM', isOpen: true },
      { day: 'Friday', hours: '9:00 AM - 6:00 PM', isOpen: true },
      { day: 'Saturday', hours: '10:00 AM - 4:00 PM', isOpen: true },
      { day: 'Sunday', hours: 'Closed', isOpen: false },
    ],
    showPublicHolidays: false,
    publicHolidaysIsOpen: false,
    publicHolidaysHours: '',
    showHolidays: false,
    holidaysTitle: 'Holiday Hours',
    holidays: [
      { name: "New Year's Day", date: 'Jan 1', hours: 'Closed', isOpen: false },
      { name: 'Memorial Day', date: 'Last Mon in May', hours: 'Closed', isOpen: false },
      { name: 'Independence Day', date: 'July 4', hours: 'Closed', isOpen: false },
      { name: 'Labor Day', date: 'First Mon in Sep', hours: 'Closed', isOpen: false },
      { name: 'Thanksgiving', date: 'Fourth Thu in Nov', hours: 'Closed', isOpen: false },
      { name: 'Christmas Eve', date: 'Dec 24', hours: '9:00 AM - 2:00 PM', isOpen: true },
      { name: 'Christmas', date: 'Dec 25', hours: 'Closed', isOpen: false },
    ],
  },
  links: [
    {
      title: 'Explore',
      items: [
        { label: 'Features', type: 'url' as const, url: '/features' },
        { label: 'Pricing', type: 'url' as const, url: '/pricing' },
        { label: 'Showcase', type: 'url' as const, url: '/showcase' },
      ],
    },
    {
      title: 'Resources',
      items: [
        { label: 'Documentation', type: 'url' as const, url: '/docs' },
        { label: 'API Reference', type: 'url' as const, url: '/api' },
        { label: 'Community', type: 'url' as const, url: '/community' },
      ],
    },
  ],
  socialLinks: [
    { platform: 'twitter', href: 'https://twitter.com' },
    { platform: 'linkedin', href: 'https://linkedin.com' },
    { platform: 'instagram', href: 'https://instagram.com' },
  ],
  copyright: '© 2024 Your Company. All rights reserved.',
  backgroundColor: '#1a1a1a',
  textColor: '#ffffff',
  accentColor: '#6366f1',
};

const contactBasicDefaultContent = {
  headline: 'Get in Touch',
  subheadline: 'We\'d Love to Hear From You',
  description: 'Have a question or want to work together? Fill out the form below and we\'ll get back to you within 24 hours.',
  email: 'hello@example.com',
  phone: '+1 (555) 123-4567',
  address: '123 Business St, San Francisco, CA 94102',
  socialLinks: [
    { platform: 'twitter', href: 'https://twitter.com' },
    { platform: 'linkedin', href: 'https://linkedin.com' },
  ],
  showForm: true,
  formFields: [
    { name: 'name', label: 'Name', type: 'text' as const, required: true, placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email' as const, required: true, placeholder: 'john@example.com' },
    { name: 'subject', label: 'Subject', type: 'text' as const, required: false, placeholder: 'How can we help?' },
    { name: 'message', label: 'Message', type: 'textarea' as const, required: true, placeholder: 'Tell us more about your project...' },
  ],
  submitButtonText: 'Send Message',
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  accentColor: '#6366f1',
  layout: 'split' as const,
  showMap: false,
};

const contactModernDefaultContent = {
  headline: 'Let\'s Start a Conversation',
  subheadline: 'Connect With Us',
  description: 'Ready to transform your business? Our team is here to help you achieve your goals.',
  email: 'hello@example.com',
  phone: '+1 (555) 123-4567',
  address: '123 Business St, San Francisco, CA 94102',
  socialLinks: [
    { platform: 'twitter', href: 'https://twitter.com' },
    { platform: 'linkedin', href: 'https://linkedin.com' },
    { platform: 'instagram', href: 'https://instagram.com' },
    { platform: 'github', href: 'https://github.com' },
  ],
  showForm: true,
  formFields: [
    { name: 'name', label: 'Full Name', type: 'text' as const, required: true, placeholder: 'Enter your name' },
    { name: 'email', label: 'Email Address', type: 'email' as const, required: true, placeholder: 'Enter your email' },
    { name: 'company', label: 'Company', type: 'text' as const, required: false, placeholder: 'Your company name' },
    { name: 'message', label: 'Your Message', type: 'textarea' as const, required: true, placeholder: 'How can we help you today?' },
  ],
  submitButtonText: 'Send Message',
  backgroundColor: '#f8fafc',
  textColor: '#1e293b',
  accentColor: '#6366f1',
  layout: 'centered' as const,
  showMap: false,
};

const comingSoonDefaultContent = {
  title: 'Coming Soon',
  description: 'This section type will be available soon',
};

const featuresBasicDefaultContent = {
  title: 'Our Features',
  subtitle: 'Everything you need to succeed',
  iconSize: 'lg',
  features: [
    {
      id: '1',
      title: 'Easy to Use',
      description: 'Intuitive interface designed for everyone. Get started in minutes with our streamlined onboarding process.',
      icon: '✓',
      iconType: 'emoji',
      link: { type: 'url', url: '' },
    },
    {
      id: '2',
      title: 'Powerful Analytics',
      description: 'Gain deep insights into your performance with our comprehensive analytics dashboard and reporting tools.',
      icon: '📊',
      iconType: 'emoji',
      link: { type: 'url', url: '' },
    },
    {
      id: '3',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime. Your data is always safe and accessible when you need it.',
      icon: '🔒',
      iconType: 'emoji',
      link: { type: 'url', url: '' },
    },
    {
      id: '4',
      title: '24/7 Support',
      description: 'Our dedicated support team is available around the clock to help you with any questions or issues.',
      icon: '💬',
      iconType: 'emoji',
      link: { type: 'url', url: '' },
    },
    {
      id: '5',
      title: 'Customizable',
      description: 'Tailor the platform to your specific needs with extensive customization options and integrations.',
      icon: '⚙️',
      iconType: 'emoji',
      link: { type: 'url', url: '' },
    },
    {
      id: '6',
      title: 'Lightning Fast',
      description: 'Optimized for speed and performance. Enjoy a seamless experience with blazing-fast load times.',
      icon: '⚡',
      iconType: 'emoji',
      link: { type: 'url', url: '' },
    },
  ],
};

const featuresModernDefaultContent = {
  title: 'Powerful Features',
  subtitle: 'Built for scale, designed for growth',
  badgeText: 'Why Choose Us',
  showBadge: true,
  iconSize: 'lg',
  autoRotate: true,
  rotationDelay: 4,
  features: [
    {
      id: '1',
      title: 'Advanced Automation',
      description: 'Streamline your workflow with intelligent automation. Save time and reduce manual effort with smart workflows and triggers.',
      icon: 'zap',
      iconType: 'solid',
      solidIcon: 'zap',
      solidIconColor: '#6366f1',
      link: { type: 'url', url: '' },
    },
    {
      id: '2',
      title: 'Enterprise Security',
      description: 'Bank-level encryption, SOC 2 compliance, and advanced threat protection keep your data safe and secure.',
      icon: 'shield',
      iconType: 'solid',
      solidIcon: 'shield',
      solidIconColor: '#6366f1',
      link: { type: 'url', url: '' },
    },
    {
      id: '3',
      title: 'Scale Without Limits',
      description: 'Built to handle millions of users. Our infrastructure scales automatically as your business grows.',
      icon: 'rocket',
      iconType: 'solid',
      solidIcon: 'rocket',
      solidIconColor: '#6366f1',
      link: { type: 'url', url: '' },
    },
    {
      id: '4',
      title: 'AI-Powered Insights',
      description: 'Machine learning algorithms analyze your data and provide actionable insights to drive better decisions.',
      icon: 'sparkles',
      iconType: 'solid',
      solidIcon: 'sparkles',
      solidIconColor: '#6366f1',
      link: { type: 'url', url: '' },
    },
  ],
};

const testimonialsClassicDefaultContent = {
  title: 'What Our Clients Say',
  subtitle: 'Trusted by thousands of businesses worldwide',
  testimonials: [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'CEO',
      company: 'TechCorp Inc.',
      content: 'This platform has completely transformed how we operate. The efficiency gains have been incredible, and our team loves using it every day.',
      rating: 5,
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Marketing Director',
      company: 'Growth Labs',
      content: 'We\'ve seen a 300% increase in productivity since implementing this solution. The ROI has been phenomenal and the support team is exceptional.',
      rating: 5,
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      role: 'Founder',
      company: 'Startup Ventures',
      content: 'The ease of use is unmatched. We were able to onboard our entire team in less than a day. Highly recommended for any growing business.',
      rating: 5,
    },
    {
      id: '4',
      name: 'David Thompson',
      role: 'CTO',
      company: 'Digital Solutions',
      content: 'Outstanding features and reliability. The platform handles everything we throw at it without breaking a sweat. A true game-changer.',
      rating: 5,
    },
    {
      id: '5',
      name: 'Jessica Williams',
      role: 'Operations Manager',
      company: 'Global Enterprises',
      content: 'The automation features alone have saved us countless hours. This is exactly what we needed to scale our operations efficiently.',
      rating: 5,
    },
    {
      id: '6',
      name: 'Robert Martinez',
      role: 'VP of Sales',
      company: 'Sales Force Pro',
      content: 'Our conversion rates have skyrocketed since we started using this platform. The insights and analytics are incredibly valuable.',
      rating: 5,
    },
  ],
};

const testimonialsModernDefaultContent = {
  title: 'Trusted by Industry Leaders',
  subtitle: 'See what our customers have to say about their experience',
  testimonials: [
    {
      id: '1',
      name: 'Amanda Foster',
      role: 'Chief Technology Officer',
      company: 'Innovation Labs',
      content: 'This platform has revolutionized our entire workflow. The attention to detail and user experience is simply unmatched in the industry. We\'ve been able to scale from 10 to 10,000 users seamlessly.',
      rating: 5,
    },
    {
      id: '2',
      name: 'Christopher Lee',
      role: 'Founder & CEO',
      company: 'Elevate Ventures',
      content: 'After trying dozens of solutions, we finally found one that delivers on every promise. The customer support is extraordinary and the continuous improvements show they truly care.',
      rating: 5,
    },
    {
      id: '3',
      name: 'Michelle Park',
      role: 'Director of Operations',
      company: 'Streamline Inc.',
      content: 'Implementation was a breeze and the results were immediate. We\'ve cut our operational costs by 40% while dramatically improving our output quality. Absolute game-changer.',
      rating: 5,
    },
  ],
};

// ============================================================================
// Listings Showcase Section Content
// ============================================================================

const listingsShowcaseContentSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  description: z.string().optional(),
  filterBy: z.object({
    companyIds: z.array(z.string()).optional(),
    brandIds: z.array(z.string()).optional(),
    conditionIds: z.array(z.string()).optional(),
  }).optional(),
  itemsPerPage: z.number().min(1).max(20).optional(),
  showLoadMore: z.boolean().optional(),
  loadMoreText: z.string().optional(),
  showStatus: z.boolean().optional(),
  showPrice: z.boolean().optional(),
  showMileage: z.boolean().optional(),
  showYear: z.boolean().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  cardStyle: z.enum(['modern', 'premium']).optional(),
  layout: z.enum(['grid-3', 'grid-4', 'carousel']).optional(),
  viewDetailsText: z.string().optional(),
  viewDetailsTarget: z.enum(['url', 'form']).optional(),
  viewDetailsFormId: z.string().optional(),
});

const listingsShowcaseModernDefaultContent = {
  headline: 'Featured Vehicles',
  subheadline: 'Discover Our Premium Selection',
  description: 'Browse our curated collection of quality vehicles, each inspected and ready for your next adventure.',
  filterBy: {
    companyIds: [],
    brandIds: [],
    conditionIds: [],
  },
  itemsPerPage: 6,
  showLoadMore: true,
  loadMoreText: 'Show More Vehicles',
  showStatus: true,
  showPrice: true,
  showMileage: true,
  showYear: true,
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  accentColor: '#6366f1',
  cardStyle: 'modern',
  layout: 'grid-3',
  viewDetailsText: 'View Details',
  viewDetailsTarget: 'url' as const,
};

const listingsShowcasePremiumDefaultContent = {
  headline: 'Exclusive Collection',
  subheadline: 'Premium Vehicles for Discerning Drivers',
  description: 'Experience our hand-picked selection of premium vehicles, combining luxury, performance, and exceptional value.',
  filterBy: {
    companyIds: [],
    brandIds: [],
    conditionIds: [],
  },
  itemsPerPage: 6,
  showLoadMore: true,
  loadMoreText: 'Discover More',
  showStatus: true,
  showPrice: true,
  showMileage: true,
  showYear: true,
  backgroundColor: '#f8fafc',
  textColor: '#1e293b',
  accentColor: '#0f172a',
  cardStyle: 'premium',
  layout: 'grid-3',
  viewDetailsText: 'Explore This Vehicle',
  viewDetailsTarget: 'url' as const,
};

// ============================================================================
// Logo Ticker Section Content
// ============================================================================

const logoItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  link: z.string().optional(),
});

const logoTickerContentSchema = z.object({
  title: z.string().optional(),
  logos: z.array(logoItemSchema).min(1, 'At least one logo is required'),
  direction: z.enum(['left', 'right']).optional(),
  speed: z.enum(['slow', 'normal', 'fast', 'very-fast']).optional(),
  logoSpacing: z.number().min(0).max(100).optional(),
  logoWidth: z.number().min(40).max(300).optional(),
  logoHeight: z.number().min(20).max(150).optional(),
  pauseOnHover: z.boolean().optional(),
  backgroundColor: z.string().optional(),
  logoBackground: z.string().optional(),
  logoBorderRadius: z.number().min(0).max(50).optional(),
  grayscale: z.boolean().optional(),
  grayscaleOnHover: z.boolean().optional(),
  opacity: z.number().min(0.1).max(1).optional(),
});

const logoTickerScrollDefaultContent = {
  title: 'Trusted by Leading Brands',
  logos: [
    { id: '1', name: 'TechCorp', imageUrl: 'https://via.placeholder.com/120x60/6366f1/ffffff?text=TechCorp' },
    { id: '2', name: 'InnovateCo', imageUrl: 'https://via.placeholder.com/120x60/8b5cf6/ffffff?text=InnovateCo' },
    { id: '3', name: 'GlobalTech', imageUrl: 'https://via.placeholder.com/120x60/ec4899/ffffff?text=GlobalTech' },
    { id: '4', name: 'DataFlow', imageUrl: 'https://via.placeholder.com/120x60/f59e0b/ffffff?text=DataFlow' },
    { id: '5', name: 'CloudBase', imageUrl: 'https://via.placeholder.com/120x60/22c55e/ffffff?text=CloudBase' },
    { id: '6', name: 'NexGen', imageUrl: 'https://via.placeholder.com/120x60/0ea5e9/ffffff?text=NexGen' },
  ],
  direction: 'left' as const,
  speed: 'normal' as const,
  logoSpacing: 48,
  logoWidth: 120,
  logoHeight: 60,
  pauseOnHover: true,
  backgroundColor: '#f8fafc',
  logoBackground: '#ffffff',
  logoBorderRadius: 12,
  grayscale: true,
  grayscaleOnHover: false,
  opacity: 0.8,
};

const logoTickerGridDefaultContent = {
  title: 'Our Partners & Clients',
  logos: [
    { id: '1', name: 'TechCorp', imageUrl: 'https://via.placeholder.com/100x100/6366f1/ffffff?text=TC' },
    { id: '2', name: 'InnovateCo', imageUrl: 'https://via.placeholder.com/100x100/8b5cf6/ffffff?text=IC' },
    { id: '3', name: 'GlobalTech', imageUrl: 'https://via.placeholder.com/100x100/ec4899/ffffff?text=GT' },
    { id: '4', name: 'DataFlow', imageUrl: 'https://via.placeholder.com/100x100/f59e0b/ffffff?text=DF' },
    { id: '5', name: 'CloudBase', imageUrl: 'https://via.placeholder.com/100x100/22c55e/ffffff?text=CB' },
    { id: '6', name: 'NexGen', imageUrl: 'https://via.placeholder.com/100x100/0ea5e9/ffffff?text=NG' },
    { id: '7', name: 'ProLink', imageUrl: 'https://via.placeholder.com/100x100/ef4444/ffffff?text=PL' },
    { id: '8', name: 'SynergyLabs', imageUrl: 'https://via.placeholder.com/100x100/14b8a6/ffffff?text=SL' },
    { id: '9', name: 'VertexAI', imageUrl: 'https://via.placeholder.com/100x100/3b82f6/ffffff?text=VA' },
    { id: '10', name: 'QuantumOps', imageUrl: 'https://via.placeholder.com/100x100/a855f7/ffffff?text=QO' },
    { id: '11', name: 'MetaStream', imageUrl: 'https://via.placeholder.com/100x100/f97316/ffffff?text=MS' },
    { id: '12', name: 'HyperNet', imageUrl: 'https://via.placeholder.com/100x100/84cc16/ffffff?text=HN' },
  ],
  backgroundColor: '#ffffff',
  logoBackground: '#f8fafc',
  logoBorderRadius: 16,
  grayscale: true,
  grayscaleOnHover: false,
  opacity: 0.9,
};

// ============================================================================
// Service Showcase Section Content
// ============================================================================

const serviceShowcaseContentSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  description: z.string().optional(),
  filterBy: z.object({
    companyIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
  }).optional(),
  itemsPerPage: z.number().min(1).max(24).optional(),
  showLoadMore: z.boolean().optional(),
  loadMoreText: z.string().optional(),
  showPrice: z.boolean().optional(),
  showDuration: z.boolean().optional(),
  showCategory: z.boolean().optional(),
  showSort: z.boolean().optional(),
  showFilter: z.boolean().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  cardStyle: z.enum(['modern', 'premium']).optional(),
  layout: z.enum(['grid-3', 'grid-4', 'carousel']).optional(),
  viewDetailsText: z.string().optional(),
  viewDetailsTarget: z.enum(['url', 'form']).optional(),
  viewDetailsFormId: z.string().optional(),
});

const serviceShowcaseModernDefaultContent = {
  headline: 'Our Services',
  subheadline: 'Professional Services for Your Needs',
  description: 'Browse our range of professional services designed to meet your needs.',
  filterBy: {
    companyIds: [],
    categoryIds: [],
  },
  itemsPerPage: 8,
  showLoadMore: true,
  loadMoreText: 'Load More Services',
  showPrice: true,
  showDuration: true,
  showCategory: true,
  showSort: true,
  showFilter: true,
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  accentColor: '#3b82f6',
  cardStyle: 'modern' as const,
  layout: 'grid-3' as const,
  viewDetailsText: 'Book Now',
  viewDetailsTarget: 'url' as const,
};

const serviceShowcasePremiumDefaultContent = {
  headline: 'Premium Services',
  subheadline: 'Excellence in Every Detail',
  description: 'Experience our premium collection of services crafted with expertise.',
  filterBy: {
    companyIds: [],
    categoryIds: [],
  },
  itemsPerPage: 8,
  showLoadMore: true,
  loadMoreText: 'Discover More',
  showPrice: true,
  showDuration: true,
  showCategory: true,
  showSort: true,
  showFilter: true,
  backgroundColor: '#f8fafc',
  textColor: '#1e293b',
  accentColor: '#0f172a',
  cardStyle: 'premium' as const,
  layout: 'grid-3' as const,
  viewDetailsText: 'Learn More',
  viewDetailsTarget: 'url' as const,
};

// ============================================================================
// Product Showcase Section Content
// ============================================================================

const productShowcaseContentSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  description: z.string().optional(),
  filterBy: z.object({
    companyIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
  }).optional(),
  itemsPerPage: z.number().min(1).max(24).optional(),
  showLoadMore: z.boolean().optional(),
  loadMoreText: z.string().optional(),
  showPrice: z.boolean().optional(),
  showStock: z.boolean().optional(),
  showCategory: z.boolean().optional(),
  showSort: z.boolean().optional(),
  showFilter: z.boolean().optional(),
  showDiscount: z.boolean().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  cardStyle: z.enum(['modern', 'premium']).optional(),
  layout: z.enum(['grid-3', 'grid-4', 'carousel']).optional(),
  columns: z.number().min(2).max(4).optional(),
  cardSize: z.enum(['small', 'medium', 'large']).optional(),
  cardSpacing: z.enum(['compact', 'normal', 'spacious']).optional(),
  viewDetailsText: z.string().optional(),
  viewDetailsTarget: z.enum(['url', 'form']).optional(),
  viewDetailsFormId: z.string().optional(),
});

const productShowcaseModernDefaultContent = {
  headline: 'Our Products',
  subheadline: 'Quality Products for Every Need',
  description: 'Explore our curated collection of high-quality products.',
  filterBy: {
    companyIds: [],
    categoryIds: [],
  },
  itemsPerPage: 8,
  showLoadMore: true,
  loadMoreText: 'Load More Products',
  showPrice: true,
  showStock: true,
  showCategory: true,
  showSort: true,
  showFilter: true,
  showDiscount: true,
  showAddToCart: true,
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  accentColor: '#8b5cf6',
  cardStyle: 'modern' as const,
  layout: 'grid-3' as const,
  columns: 3 as const,
  cardSize: 'medium' as const,
  cardSpacing: 'normal' as const,
  viewDetailsText: 'View Product',
  viewDetailsTarget: 'url' as const,
};

const productShowcasePremiumDefaultContent = {
  headline: 'Premium Collection',
  subheadline: 'Excellence in Every Product',
  description: 'Discover our exclusive range of premium products.',
  filterBy: {
    companyIds: [],
    categoryIds: [],
  },
  itemsPerPage: 8,
  showLoadMore: true,
  loadMoreText: 'Discover More',
  showPrice: true,
  showStock: true,
  showCategory: true,
  showSort: true,
  showFilter: true,
  showDiscount: true,
  showAddToCart: true,
  backgroundColor: '#f8fafc',
  textColor: '#1e293b',
  accentColor: '#7c3aed',
  cardStyle: 'premium' as const,
  layout: 'grid-4' as const,
  columns: 4 as const,
  cardSize: 'medium' as const,
  cardSpacing: 'normal' as const,
  viewDetailsText: 'Shop Now',
  viewDetailsTarget: 'url' as const,
};

// ============================================================================
// Pricing Section Content
// ============================================================================

const pricingBasicDefaultContent = {
  headline: 'Simple, Transparent Pricing',
  subheadline: 'Choose the plan that works best for you',
  badgeText: 'Pricing',
  showBadge: true,
  cards: [
    {
      id: '1',
      title: 'Starter',
      description: 'Perfect for getting started',
      price: '$19',
      period: '/month',
      iconType: 'emoji' as const,
      icon: '🚀',
      features: [
        { id: 'f1', text: 'Up to 5 projects', included: true },
        { id: 'f2', text: 'Basic analytics', included: true },
        { id: 'f3', text: 'Email support', included: true },
        { id: 'f4', text: 'Priority support', included: false },
        { id: 'f5', text: 'Custom integrations', included: false },
      ],
      ctaText: 'Get Started',
      cta: { type: 'url' as const, url: '#' },
      highlighted: false,
    },
    {
      id: '2',
      title: 'Professional',
      description: 'Best for growing businesses',
      price: '$49',
      period: '/month',
      iconType: 'emoji' as const,
      icon: '⭐',
      features: [
        { id: 'f1', text: 'Unlimited projects', included: true },
        { id: 'f2', text: 'Advanced analytics', included: true },
        { id: 'f3', text: 'Priority support', included: true },
        { id: 'f4', text: 'API access', included: true },
        { id: 'f5', text: 'Custom integrations', included: false },
      ],
      ctaText: 'Get Started',
      cta: { type: 'url' as const, url: '#' },
      highlighted: true,
      badgeText: 'Most Popular',
    },
    {
      id: '3',
      title: 'Enterprise',
      description: 'For large organizations',
      price: '$99',
      period: '/month',
      iconType: 'emoji' as const,
      icon: '🏢',
      features: [
        { id: 'f1', text: 'Unlimited everything', included: true },
        { id: 'f2', text: 'Custom analytics', included: true },
        { id: 'f3', text: 'Dedicated support', included: true },
        { id: 'f4', text: 'Full API access', included: true },
        { id: 'f5', text: 'Custom integrations', included: true },
      ],
      ctaText: 'Contact Sales',
      cta: { type: 'url' as const, url: '#' },
      highlighted: false,
    },
  ],
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  accentColor: '#6366f1',
  cardBackgroundColor: '#ffffff',
  columns: 3 as const,
  footnoteText: 'All plans include a 14-day free trial. No credit card required.',
  showFootnote: true,
};

const pricingModernDefaultContent = {
  headline: 'Choose Your Plan',
  subheadline: 'Unlock the full potential of your business',
  badgeText: 'Pricing Plans',
  showBadge: true,
  cards: [
    {
      id: '1',
      title: 'Basic',
      description: 'For individuals and small teams',
      price: '$29',
      period: '/month',
      iconType: 'solid' as const,
      solidIcon: 'zap',
      solidIconColor: '#22c55e',
      features: [
        { id: 'f1', text: '5 Team members', included: true },
        { id: 'f2', text: '10GB Storage', included: true },
        { id: 'f3', text: 'Basic reports', included: true },
        { id: 'f4', text: 'Email support', included: true },
        { id: 'f5', text: 'Custom domain', included: false },
        { id: 'f6', text: 'Advanced security', included: false },
      ],
      ctaText: 'Start Free Trial',
      cta: { type: 'url' as const, url: '#' },
      highlighted: false,
    },
    {
      id: '2',
      title: 'Pro',
      description: 'For growing businesses',
      price: '$79',
      period: '/month',
      iconType: 'solid' as const,
      solidIcon: 'star',
      solidIconColor: '#f59e0b',
      features: [
        { id: 'f1', text: '25 Team members', included: true },
        { id: 'f2', text: '100GB Storage', included: true },
        { id: 'f3', text: 'Advanced reports', included: true },
        { id: 'f4', text: 'Priority support', included: true },
        { id: 'f5', text: 'Custom domain', included: true },
        { id: 'f6', text: 'Advanced security', included: false },
      ],
      ctaText: 'Get Pro',
      cta: { type: 'url' as const, url: '#' },
      highlighted: true,
      badgeText: 'Best Value',
    },
    {
      id: '3',
      title: 'Enterprise',
      description: 'For large organizations',
      price: '$199',
      period: '/month',
      iconType: 'solid' as const,
      solidIcon: 'building',
      solidIconColor: '#8b5cf6',
      features: [
        { id: 'f1', text: 'Unlimited members', included: true },
        { id: 'f2', text: 'Unlimited storage', included: true },
        { id: 'f3', text: 'Custom reports', included: true },
        { id: 'f4', text: '24/7 support', included: true },
        { id: 'f5', text: 'Custom domain', included: true },
        { id: 'f6', text: 'Advanced security', included: true },
      ],
      ctaText: 'Contact Us',
      cta: { type: 'url' as const, url: '#' },
      highlighted: false,
    },
  ],
  backgroundColor: '#0f172a',
  textColor: '#ffffff',
  accentColor: '#6366f1',
  cardBackgroundColor: '#1e293b',
  columns: 3 as const,
  footnoteText: 'Cancel anytime. No questions asked.',
  showFootnote: true,
};

// ============================================================================
// Section Template Definitions
// ============================================================================

const sectionTemplates: SectionTemplate[] = [
  // Hero Templates
  {
    id: 'hero-basic',
    type: 'hero',
    name: 'Basic Hero',
    description: 'Clean and simple hero section with left-aligned content',
    icon: Sparkles,
    category: 'marketing',
    isAvailable: true,
    defaultContent: heroBasicDefaultContent,
    schema: heroContentSchema,
  },
  {
    id: 'hero-modern',
    type: 'hero',
    name: 'Modern Hero',
    description: 'Eye-catching hero with gradient background and centered content',
    icon: Sparkles,
    category: 'marketing',
    isAvailable: true,
    defaultContent: heroModernDefaultContent,
    schema: heroContentSchema,
  },
  {
    id: 'hero-slider',
    type: 'hero',
    name: 'Hero Slider',
    description: 'Dynamic hero with auto-rotating slides, color or image backgrounds, and optional CTAs',
    icon: Sparkles,
    category: 'marketing',
    isAvailable: true,
    defaultContent: heroSliderDefaultContent,
    schema: heroSliderContentSchema,
  },
  {
    id: 'hero-vehicle-showcase',
    type: 'hero',
    name: 'Vehicle Showcase',
    description: 'Dark themed hero with large vehicle image, specs, ratings, and floating price tag',
    icon: Car,
    category: 'marketing',
    isAvailable: true,
    defaultContent: heroVehicleShowcaseDefaultContent,
    schema: heroVehicleShowcaseContentSchema,
  },

  // Navbar Templates
  {
    id: 'navbar-basic',
    type: 'navbar',
    name: 'Basic Navbar',
    description: 'Clean navigation bar with logo, links, and call-to-action',
    icon: Menu,
    category: 'navigation',
    isAvailable: true,
    defaultContent: navbarBasicDefaultContent,
    schema: navbarContentSchema,
  },
  {
    id: 'navbar-modern',
    type: 'navbar',
    name: 'Modern Navbar',
    description: 'Sleek centered navigation with transparent-to-solid scroll effect',
    icon: Menu,
    category: 'navigation',
    isAvailable: true,
    defaultContent: navbarModernDefaultContent,
    schema: navbarContentSchema,
  },

  // About Templates
  {
    id: 'about-classic',
    type: 'about',
    name: 'Classic About',
    description: 'Professional about section with image, story, and optional team members',
    icon: Info,
    category: 'content',
    isAvailable: true,
    defaultContent: aboutClassicDefaultContent,
    schema: aboutContentSchema,
  },
  {
    id: 'about-modern',
    type: 'about',
    name: 'Modern About',
    description: 'Contemporary about section with statistics grid and visual highlights',
    icon: Users,
    category: 'content',
    isAvailable: true,
    defaultContent: aboutModernDefaultContent,
    schema: aboutContentSchema,
  },

  // Features Templates
  {
    id: 'features-basic',
    type: 'features',
    name: 'Features Grid',
    description: 'Clean grid layout showcasing your product features with icons and descriptions',
    icon: LayoutGrid,
    category: 'marketing',
    isAvailable: true,
    defaultContent: featuresBasicDefaultContent,
    schema: featuresContentSchema,
  },
  {
    id: 'features-modern',
    type: 'features',
    name: 'Features Showcase',
    description: 'Interactive feature showcase with highlighted detail panel and smooth animations',
    icon: LayoutGrid,
    category: 'marketing',
    isAvailable: true,
    defaultContent: featuresModernDefaultContent,
    schema: featuresContentSchema,
  },

  // Testimonials Templates
  {
    id: 'testimonials-classic',
    type: 'testimonials',
    name: 'Testimonials Grid',
    description: 'Classic card-based grid layout featuring customer reviews with ratings',
    icon: MessageSquare,
    category: 'conversion',
    isAvailable: true,
    defaultContent: testimonialsClassicDefaultContent,
    schema: testimonialsContentSchema,
  },
  {
    id: 'testimonials-modern',
    type: 'testimonials',
    description: 'Modern carousel-style testimonials with smooth transitions and prominent display',
    name: 'Testimonials Carousel',
    icon: MessageSquare,
    category: 'conversion',
    isAvailable: true,
    defaultContent: testimonialsModernDefaultContent,
    schema: testimonialsContentSchema,
  },

  // Pricing Templates
  {
    id: 'pricing-basic',
    type: 'pricing',
    name: 'Pricing Cards',
    description: 'Clean, modern pricing cards with customizable features',
    icon: CreditCard,
    category: 'conversion',
    isAvailable: true,
    defaultContent: pricingBasicDefaultContent,
    schema: pricingContentSchema,
  },
  {
    id: 'pricing-modern',
    type: 'pricing',
    name: 'Premium Pricing',
    description: 'Dark gradient background with glassmorphism effects',
    icon: CreditCard,
    category: 'conversion',
    isAvailable: true,
    defaultContent: pricingModernDefaultContent,
    schema: pricingContentSchema,
  },

  // Footer (Coming Soon)
  {
    id: 'footer-1',
    type: 'footer',
    name: 'Footer',
    description: 'Add a professional footer with links and social media',
    icon: Minimize2,
    category: 'navigation',
    isAvailable: false,
    defaultContent: comingSoonDefaultContent,
    schema: z.object({}),
  },

  // Footer Templates
  {
    id: 'footer-basic',
    type: 'footer',
    name: 'Basic Footer',
    description: 'Professional footer with company info, navigation links, and social media',
    icon: Minimize2,
    category: 'navigation',
    isAvailable: true,
    defaultContent: footerBasicDefaultContent,
    schema: footerContentSchema,
  },
  {
    id: 'footer-modern',
    type: 'footer',
    name: 'Modern Footer',
    description: 'Contemporary footer with gradient accents and optimized layout',
    icon: Minimize2,
    category: 'navigation',
    isAvailable: true,
    defaultContent: footerModernDefaultContent,
    schema: footerContentSchema,
  },

  // Contact Templates
  {
    id: 'contact-basic',
    type: 'contact',
    name: 'Contact Form',
    description: 'Professional contact section with form and contact information',
    icon: Mail,
    category: 'content',
    isAvailable: true,
    defaultContent: contactBasicDefaultContent,
    schema: contactContentSchema,
  },
  {
    id: 'contact-modern',
    type: 'contact',
    name: 'Modern Contact',
    description: 'Stylish centered contact layout with enhanced visual design',
    icon: MessageSquare,
    category: 'content',
    isAvailable: true,
    defaultContent: contactModernDefaultContent,
    schema: contactContentSchema,
  },

  // Listings Showcase Templates
  {
    id: 'listings-showcase-modern',
    type: 'listings-showcase',
    name: 'Modern Listings',
    description: 'Clean, professional vehicle showcase with image-focused cards and hover effects',
    icon: Car,
    category: 'marketing',
    isAvailable: true,
    defaultContent: listingsShowcaseModernDefaultContent,
    schema: listingsShowcaseContentSchema,
  },
  {
    id: 'listings-showcase-premium',
    type: 'listings-showcase',
    name: 'Premium Listings',
    description: 'Upscale luxury vehicle display with gradient overlays and premium styling',
    icon: Star,
    category: 'marketing',
    isAvailable: true,
    defaultContent: listingsShowcasePremiumDefaultContent,
    schema: listingsShowcaseContentSchema,
  },

  // Logo Ticker Templates
  {
    id: 'logo-ticker-scroll',
    type: 'logo-ticker',
    name: 'Infinite Scroll',
    description: 'Continuous horizontal scrolling logos with customizable speed and direction',
    icon: Images,
    category: 'marketing',
    isAvailable: true,
    defaultContent: logoTickerScrollDefaultContent,
    schema: logoTickerContentSchema,
  },
  {
    id: 'logo-ticker-grid',
    type: 'logo-ticker',
    name: 'Interactive Grid',
    description: 'Static grid of logos that rotate with 3D effect on hover',
    icon: Images,
    category: 'marketing',
    isAvailable: true,
    defaultContent: logoTickerGridDefaultContent,
    schema: logoTickerContentSchema,
  },

  // Service Showcase Templates
  {
    id: 'service-showcase-modern',
    type: 'service-showcase',
    name: 'Modern Services',
    description: 'Clean, professional service showcase with image-focused cards and hover effects',
    icon: Wrench,
    category: 'marketing',
    isAvailable: true,
    defaultContent: serviceShowcaseModernDefaultContent,
    schema: serviceShowcaseContentSchema,
  },
  {
    id: 'service-showcase-premium',
    type: 'service-showcase',
    name: 'Premium Services',
    description: 'Upscale luxury service display with gradient overlays and premium styling',
    icon: Star,
    category: 'marketing',
    isAvailable: true,
    defaultContent: serviceShowcasePremiumDefaultContent,
    schema: serviceShowcaseContentSchema,
  },

  // Product Showcase Templates
  {
    id: 'product-showcase-modern',
    type: 'product-showcase',
    name: 'Modern Products',
    description: 'Clean, professional product showcase with image-focused cards and hover effects',
    icon: Package,
    category: 'marketing',
    isAvailable: true,
    defaultContent: productShowcaseModernDefaultContent,
    schema: productShowcaseContentSchema,
  },

  // Booking System Templates
  {
    id: 'booking-system-default',
    type: 'booking-system',
    name: 'Service Booking',
    description: 'Interactive booking system for services with calendar and time selection',
    icon: Calendar,
    category: 'marketing',
    isAvailable: true,
    defaultContent: {
      title: 'Book a Service',
      subtitle: 'Select a service and choose your preferred date and time',
      primaryColor: '#f59e0b',
    },
    schema: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      primaryColor: z.string().optional(),
    }),
  },
];

// ============================================================================
// Registry Functions
// ============================================================================

/**
 * Get all available section templates
 */
export function getAllTemplates(): SectionTemplate[] {
  return sectionTemplates;
}

/**
 * Get templates by section type
 */
export function getTemplatesByType(type: SectionType): SectionTemplate[] {
  return sectionTemplates.filter((template) => template.type === type);
}

/**
 * Get a single template by ID
 */
export function getTemplateById(id: string): SectionTemplate | undefined {
  return sectionTemplates.find((template) => template.id === id);
}

/**
 * Get all available section types (for category selection)
 */
export function getSectionTypes(): Array<{
  type: SectionType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isAvailable: boolean;
  templateCount: number;
}> {
  const typeMap = new Map<
    SectionType,
    {
      type: SectionType;
      name: string;
      description: string;
      icon: React.ComponentType<{ className?: string }>;
      isAvailable: boolean;
      templateCount: number;
    }
  >();

  for (const template of sectionTemplates) {
    const existing = typeMap.get(template.type);
    if (existing) {
      existing.templateCount++;
      if (template.isAvailable) {
        existing.isAvailable = true;
      }
    } else {
      typeMap.set(template.type, {
        type: template.type,
        name: template.type.charAt(0).toUpperCase() + template.type.slice(1),
        description: template.description,
        icon: template.icon,
        isAvailable: template.isAvailable,
        templateCount: 1,
      });
    }
  }

  return Array.from(typeMap.values());
}

/**
 * Check if a section type has any available templates
 */
export function isSectionTypeAvailable(type: SectionType): boolean {
  return getTemplatesByType(type).some((t) => t.isAvailable);
}

export default sectionTemplates;
