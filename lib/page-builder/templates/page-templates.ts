import type { PageSection } from '@/types/page-builder';

/**
 * Page Template - A complete landing page configuration
 */
export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'dealership' | 'business' | 'portfolio' | 'ecommerce' | 'landing' | 'accommodation';
  previewImage?: string;
  sections: PageSection[];
  isAvailable: boolean;
  tags?: string[];
}

/**
 * Generate a unique section ID
 */
function generateSectionId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Vehicle Dealership Landing Page Template
 * A professional, modern landing page for vehicle dealerships with light theme
 */
export const vehicleDealershipTemplate: PageTemplate = {
  id: 'vehicle-dealership-premium',
  name: 'Premium Vehicle Dealership',
  description: 'A modern, professional landing page designed for vehicle dealerships. Features a stunning hero with vehicle showcase, inventory display, trust indicators, and comprehensive contact section.',
  category: 'dealership',
  isAvailable: true,
  tags: ['automotive', 'cars', 'dealership', 'vehicles', 'showroom'],
  previewImage: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
  sections: [
    // ========================================
    // NAVIGATION
    // ========================================
    {
      id: generateSectionId('navbar'),
      type: 'navbar',
      templateId: 'navbar-modern',
      order: 1,
      content: {
        logoType: 'text',
        brandName: 'Premier Auto',
        links: [
          { label: 'Home', type: 'url', url: '#section-hero' },
          { label: 'About', type: 'url', url: '#section-about' },
          { label: 'Vehicles', type: 'url', url: '#section-inventory' },
          { label: 'Contact', type: 'url', url: '#section-contact' },
        ],
        ctaText: 'Get Directions',
        ctaLink: '#section-contact',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        linkHoverColor: '#dc2626',
        accentColor: '#dc2626',
        linksAlignment: 'center',
        linkFontSize: 14,
        logoTextSize: 20,
      },
      settings: {
        backgroundColor: '#ffffff',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // HERO - VEHICLE SHOWCASE (Dark Theme, No Card)
    // ========================================
    {
      id: 'hero',
      type: 'hero',
      templateId: 'hero-vehicle-showcase',
      order: 2,
      content: {
        headline: 'Find Your Perfect Vehicle',
        subheadline: 'Discover our exceptional collection of quality vehicles at competitive prices',
        ctaText: 'Browse Inventory',
        ctaLink: '/inventory',
        ctaType: 'url',
        secondaryCtaText: 'Schedule Test Drive',
        secondaryCtaLink: '#contact',
        secondaryCtaType: 'url',
        vehicleImage: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
        vehicleName: '2024 Premium Sedan',
        vehiclePrice: '$45,990',
        vehicleYear: '2024',
        priceLabel: 'Starting at',
        rating: 4.9,
        reviewCount: '500+',
        showReviews: true,
        showPriceTag: true,
        showVehicleBadge: true,
        showPrimaryCta: true,
        showSecondaryCta: true,
        showQuickStats: true,
        showSpecs: true,
        tagline: 'Featured Vehicle',
        subtitle: 'Premium Quality • Best Value',
        accentColor: '#dc2626',
        backgroundColor: '#0a0a0a',
        specs: [
          { id: 'spec1', label: 'Engine', value: '1.6L' },
          { id: 'spec2', label: 'Mileage', value: '45,000 km' },
          { id: 'spec3', label: 'Transmission', value: 'Automatic' },
          { id: 'spec4', label: 'Fuel', value: 'Petrol' },
        ],
        stats: [
          { id: 'stat1', value: '200+', label: 'Vehicles in Stock', iconType: 'none', emoji: '', solidIcon: 'car', solidIconColor: '#dc2626' },
          { id: 'stat2', value: '15+', label: 'Years Experience', iconType: 'none', emoji: '', solidIcon: 'calendar', solidIconColor: '#dc2626' },
          { id: 'stat3', value: '98%', label: 'Happy Customers', iconType: 'none', emoji: '', solidIcon: 'heart', solidIconColor: '#dc2626' },
        ],
        badges: [
          { icon: 'shield', text: 'Certified Dealer' },
          { icon: 'award', text: 'Best Price Guarantee' },
          { icon: 'check', text: '150-Point Inspection' },
        ],
      },
      settings: {
        backgroundColor: '#0a0a0a',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // LOGO TICKER - BRANDS
    // ========================================
    {
      id: generateSectionId('logo-ticker'),
      type: 'logo-ticker',
      templateId: 'logo-ticker-scroll',
      order: 3,
      content: {
        title: 'Trusted Brands We Carry',
        logos: [
          { id: 'brand-toyota', name: 'Toyota', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/60879ce3-9c28-4637-867f-ff259d162e00/public' },
          { id: 'brand-bmw', name: 'BMW', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/dbd19459-9e49-4d55-f743-d05917199b00/public' },
          { id: 'brand-ford', name: 'Ford', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/ea9b4d48-df71-417f-20ab-e93700251000/public' },
          { id: 'brand-honda', name: 'Honda', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/c3df0d54-6285-4e35-7055-cace59107000/public' },
          { id: 'brand-hyundai', name: 'Hyundai', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/e1916e9e-dfd0-406b-6b8f-929365645d00/public' },
          { id: 'brand-isuzu', name: 'Isuzu', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/21480cab-e514-484d-c2c6-cf60df79ed00/public' },
          { id: 'brand-mercedes', name: 'Mercedes-Benz', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/f35614b2-66b9-4045-3fc4-afcd1de92700/public' },
          { id: 'brand-opel', name: 'Opel', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/bcdfac76-37da-4cb8-6864-8340d5246700/public' },
          { id: 'brand-renault', name: 'Renault', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/c71f3450-914a-4451-6403-1e354a903200/public' },
          { id: 'brand-suzuki', name: 'Suzuki', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/548264b5-6ff9-47c0-040c-04d91c88f200/public' },
          { id: 'brand-volkswagen', name: 'Volkswagen', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/2a1ba2b8-2faa-43cc-51f8-78596fb6df00/public' },
          { id: 'brand-changan', name: 'Changan', imageUrl: 'https://imagedelivery.net/huS1a_7XdaECOyY8RfXJEg/1bcbf643-67b5-4181-5d22-07e2f2c1f400/public' },
        ],
        direction: 'left',
        speed: 'slow',
        logoSpacing: 64,
        logoWidth: 120,
        logoHeight: 40,
        pauseOnHover: true,
        backgroundColor: '#f8fafc',
        grayscale: false,
        grayscaleOnHover: false,
        opacity: 1,
      },
      settings: {
        backgroundColor: '#f8fafc',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // VEHICLE SHOWCASE
    // ========================================
    {
      id: 'inventory',
      type: 'listings-showcase',
      templateId: 'listings-showcase-modern',
      order: 5,
      content: {
        headline: 'Featured Vehicles',
        subheadline: 'Explore our handpicked selection of quality vehicles',
        description: 'Every vehicle undergoes a comprehensive 150-point inspection.',
        itemsPerPage: 6,
        showLoadMore: true,
        loadMoreText: 'View All Inventory',
        showSort: true,
        showFilter: true,
        defaultSort: 'newest',
        showStatus: true,
        showPrice: true,
        showMileage: true,
        showYear: true,
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        accentColor: '#dc2626',
        cardStyle: 'modern',
        layout: 'grid-3',
        viewDetailsText: 'View Details',
        viewDetailsTarget: 'url',
        showNavbarOnDetails: true,
        showFooterOnDetails: true,
        inquiryButtonText: 'Inquire Now',
        inquiryTarget: 'form',
        // Don't show any vehicles by default - user must manually select
        showOnlySelected: true,
        selectedVehicleIds: [],
      },
      settings: {
        backgroundColor: '#ffffff',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // ABOUT SECTION
    // ========================================
    {
      id: 'about',
      type: 'about',
      templateId: 'about-modern',
      order: 4,
      content: {
        headline: 'Your Trusted Automotive Partner',
        subheadline: 'Why Choose Premier Auto',
        description: 'For over 15 years, Premier Auto has been helping families and individuals find their perfect vehicle. Our commitment to quality, transparency, and customer satisfaction sets us apart.\n\nWe believe buying a car should be exciting, not stressful. That\'s why we offer no-haggle pricing, comprehensive vehicle histories, and a dedicated team to guide you every step of the way.',
        imagePosition: 'right',
        imageSize: 'large',
        ctaText: 'Learn More About Us',
        ctaLink: '#',
        ctaTarget: 'url',
        backgroundColor: '#f8fafc',
        textColor: '#1f2937',
        ctaButtonBg: '#dc2626',
        ctaButtonTextColor: '#ffffff',
        showStats: true,
        stats: [
          { id: 'stat1', value: '2,500+', label: 'Vehicles Sold', iconType: 'solid', solidIcon: 'car', solidIconColor: '#dc2626' },
          { id: 'stat2', value: '15+', label: 'Years in Business', iconType: 'solid', solidIcon: 'award', solidIconColor: '#dc2626' },
          { id: 'stat3', value: '98%', label: 'Customer Satisfaction', iconType: 'solid', solidIcon: 'heart', solidIconColor: '#dc2626' },
          { id: 'stat4', value: '500+', label: '5-Star Reviews', iconType: 'solid', solidIcon: 'star', solidIconColor: '#dc2626' },
        ],
      },
      settings: {
        backgroundColor: '#f8fafc',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 700,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // CONTACT SECTION
    // ========================================
    {
      id: 'contact',
      type: 'contact',
      templateId: 'contact-modern',
      order: 5,
      content: {
        headline: 'Get in Touch',
        subheadline: 'Ready to find your next vehicle?',
        description: 'Visit our showroom or send us a message. Our friendly team is here to help.',
        email: 'sales@premierauto.com',
        phone: '(555) 123-4567',
        address: '123 Auto Boulevard\nCity, State 12345',
        socialLinks: [
          { platform: 'Facebook', href: 'https://facebook.com/premierauto' },
          { platform: 'Instagram', href: 'https://instagram.com/premierauto' },
          { platform: 'YouTube', href: 'https://youtube.com/premierauto' },
        ],
        showForm: true,
        formFields: [
          { id: 'name', name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
          { id: 'email', name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
          { id: 'phone', name: 'phone', label: 'Phone', type: 'tel', required: false, placeholder: '(Optional)' },
          {
            id: 'interest',
            name: 'interest',
            label: 'I\'m interested in',
            type: 'select',
            required: false,
            options: ['Buying a vehicle', 'Selling my vehicle', 'Financing options', 'Service inquiry', 'General question']
          },
          { id: 'message', name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Tell us what you\'re looking for...' },
        ],
        submitButtonText: 'Send Message',
        successMessage: 'Thank you! Our team will contact you within 24 hours.',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        accentColor: '#dc2626',
        layout: 'centered',
        showMap: false,
      },
      settings: {
        backgroundColor: '#ffffff',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // FOOTER
    // ========================================
    {
      id: generateSectionId('footer'),
      type: 'footer',
      templateId: 'footer-modern',
      order: 6,
      content: {
        logoType: 'text',
        companyName: 'Premier Auto',
        company: {
          name: 'Premier Auto Sales',
          description: 'Your trusted destination for quality vehicles. Experience the difference of working with a dealer who cares.',
        },
        email: 'sales@premierauto.com',
        phone: '(555) 123-4567',
        address: '123 Auto Boulevard, City, State 12345',
        businessHours: {
          enabled: true,
          showHours: true,
          title: 'Showroom Hours',
          days: [
            { day: 'Monday - Friday', hours: '9:00 AM - 7:00 PM', isOpen: true },
            { day: 'Saturday', hours: '10:00 AM - 6:00 PM', isOpen: true },
            { day: 'Sunday', hours: '12:00 PM - 5:00 PM', isOpen: true },
          ],
          showPublicHolidays: true,
          publicHolidaysIsOpen: false,
          publicHolidaysHours: 'Closed',
        },
        links: [
          {
            title: 'Quick Links',
            items: [
              { label: 'Inventory', type: 'url', url: '#inventory' },
              { label: 'About Us', type: 'url', url: '#about' },
              { label: 'Services', type: 'url', url: '#services' },
              { label: 'Contact', type: 'url', url: '#contact' },
            ],
          },
          {
            title: 'Services',
            items: [
              { label: 'Financing', type: 'url', url: '#' },
              { label: 'Trade-In', type: 'url', url: '#' },
              { label: 'Warranty', type: 'url', url: '#' },
              { label: 'Service Center', type: 'url', url: '#' },
            ],
          },
        ],
        socialLinks: [
          { platform: 'Facebook', href: 'https://facebook.com/premierauto' },
          { platform: 'Instagram', href: 'https://instagram.com/premierauto' },
          { platform: 'YouTube', href: 'https://youtube.com/premierauto' },
        ],
        copyright: '© 2024 Premier Auto Sales. All rights reserved.',
        backgroundColor: '#1f2937',
        textColor: '#e5e7eb',
        accentColor: '#dc2626',
      },
      settings: {
        backgroundColor: '#1f2937',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
};

/**
 * Professional Tutoring Center Landing Page Template
 * A sophisticated, premium landing page for tutoring and educational centers
 */
export const tutoringCenterTemplate: PageTemplate = {
  id: 'tutoring-center-premium',
  name: 'Elite Tutoring Center',
  description: 'A sophisticated, professional landing page designed for premium tutoring centers and educational institutions. Features elegant design, course showcases, success stories, and comprehensive enrollment options.',
  category: 'business',
  isAvailable: true,
  tags: ['education', 'tutoring', 'learning', 'academic', 'premium'],
  previewImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  sections: [
    // ========================================
    // NAVIGATION
    // ========================================
    {
      id: generateSectionId('navbar'),
      type: 'navbar',
      templateId: 'navbar-modern',
      order: 1,
      content: {
        logoType: 'text',
        brandName: 'BrightMinds Academy',
        links: [
          { label: 'Home', type: 'url', url: '#section-hero' },
          { label: 'Programs', type: 'url', url: '#section-features' },
          { label: 'About', type: 'url', url: '#section-about' },
          { label: 'Pricing', type: 'url', url: '#section-pricing' },
          { label: 'Contact', type: 'url', url: '#section-contact' },
        ],
        ctaText: 'Enroll Now',
        ctaLink: '#section-contact',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        linkHoverColor: '#7c3aed',
        accentColor: '#7c3aed',
        linksAlignment: 'center',
        linkFontSize: 14,
        logoTextSize: 20,
      },
      settings: {
        backgroundColor: '#ffffff',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // HERO - MODERN EDUCATION FOCUSED
    // ========================================
    {
      id: 'hero',
      type: 'hero',
      templateId: 'hero-modern',
      order: 2,
      content: {
        headline: 'Unlock Your\nChild\'s Potential',
        subheadline: 'World-class tutoring programs designed to inspire excellence and foster a lifelong love of learning',
        ctaText: 'Start Learning Today',
        ctaLink: '#section-contact',
        ctaType: 'url',
        colorMode: 'light',
        backgroundColor: '#f8fafc',
        textColor: '#1f2937',
        showWelcomeTag: true,
        showScrollIndicator: true,
        showStatsCard: true,
        showTrustIndicators: true,
        statsCardTitle: 'Active Students',
        statsCardValue: '2,500+',
        stats: [
          { id: 'stat1', value: '98%', label: 'Grade Improvement', iconType: 'solid', solidIcon: 'trending-up', solidIconColor: '#7c3aed' },
          { id: 'stat2', value: '50+', label: 'Expert Tutors', iconType: 'solid', solidIcon: 'users', solidIconColor: '#7c3aed' },
          { id: 'stat3', value: '15+', label: 'Years Excellence', iconType: 'solid', solidIcon: 'award', solidIconColor: '#7c3aed' },
          { id: 'stat4', value: '4.9★', label: 'Parent Rating', iconType: 'solid', solidIcon: 'star', solidIconColor: '#7c3aed' },
        ],
        trustIndicators: [
          { id: 'trust1', icon: 'award', label: 'Accredited Programs' },
          { id: 'trust2', icon: 'shield', label: 'Certified Educators' },
          { id: 'trust3', icon: 'check', label: 'Proven Results' },
        ],
        customerTrustText: 'Join 2,500+ successful students',
      },
      settings: {
        backgroundColor: '#f8fafc',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // FEATURES - PROGRAMS OFFERED
    // ========================================
    {
      id: 'features',
      type: 'features',
      templateId: 'features-modern',
      order: 4,
      content: {
        title: 'Our Programs',
        subtitle: 'Comprehensive academic programs tailored to every student\'s unique learning journey',
        badgeText: 'Excellence in Education',
        showBadge: true,
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        accentColor: '#7c3aed',
        iconStyle: 'gradient',
        iconSize: 40,
        autoRotate: true,
        rotationDelay: 5,
        features: [
          {
            id: 'feat-1',
            title: 'Mathematics Mastery',
            description: 'From foundational arithmetic to advanced calculus, our expert tutors build strong mathematical foundations and problem-solving skills that last a lifetime.',
            iconType: 'solid',
            solidIcon: 'calculator',
            solidIconColor: '#7c3aed',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-2',
            title: 'English & Language Arts',
            description: 'Develop exceptional reading comprehension, writing proficiency, and critical thinking skills through our comprehensive language programs.',
            iconType: 'solid',
            solidIcon: 'book-open',
            solidIconColor: '#7c3aed',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-3',
            title: 'Science Exploration',
            description: 'Hands-on experiments and in-depth study of biology, chemistry, and physics that ignite curiosity and scientific thinking.',
            iconType: 'solid',
            solidIcon: 'flask-conical',
            solidIconColor: '#7c3aed',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-4',
            title: 'Test Preparation',
            description: 'SAT, ACT, and standardized test preparation with proven strategies and personalized study plans for maximum score improvement.',
            iconType: 'solid',
            solidIcon: 'clipboard-check',
            solidIconColor: '#7c3aed',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-5',
            title: 'Study Skills & Time Management',
            description: 'Essential organizational and study techniques that empower students to excel academically and manage their workload effectively.',
            iconType: 'solid',
            solidIcon: 'target',
            solidIconColor: '#7c3aed',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-6',
            title: 'College Admissions Counseling',
            description: 'Expert guidance through the college application process, from essay writing to interview preparation and beyond.',
            iconType: 'solid',
            solidIcon: 'graduation-cap',
            solidIconColor: '#7c3aed',
            link: { type: 'url', url: '#section-contact' },
          },
        ],
      },
      settings: {
        backgroundColor: '#0f172a',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // ABOUT SECTION
    // ========================================
    {
      id: 'about',
      type: 'about',
      templateId: 'about-modern',
      order: 5,
      content: {
        headline: 'Shaping Tomorrow\'s Leaders',
        subheadline: 'Why Families Choose BrightMinds',
        description: 'For over 15 years, BrightMinds Academy has been the trusted partner in academic excellence for families who demand the best. Our distinguished faculty, personalized approach, and proven methodology have helped thousands of students achieve their full potential.\n\nWe believe every student possesses unique talents waiting to be discovered. Our mission is to nurture these gifts through individualized attention, innovative teaching methods, and an unwavering commitment to each student\'s success.',
        imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80',
        imageAlt: 'Students learning in a modern classroom',
        imagePosition: 'right',
        imageSize: 'large',
        ctaText: 'Discover Our Approach',
        ctaLink: '#section-contact',
        ctaTarget: 'url',
        backgroundColor: '#f8fafc',
        textColor: '#1e293b',
        ctaButtonBg: '#7c3aed',
        ctaButtonTextColor: '#ffffff',
        accentColor: '#7c3aed',
        showStats: true,
        showFeaturePills: true,
        featurePills: [
          { id: 'pill-1', text: 'Personalized Learning', iconType: 'solid', solidIcon: 'user', solidIconColor: '#7c3aed' },
          { id: 'pill-2', text: 'Expert Faculty', iconType: 'solid', solidIcon: 'award', solidIconColor: '#7c3aed' },
          { id: 'pill-3', text: 'Small Class Sizes', iconType: 'solid', solidIcon: 'users', solidIconColor: '#7c3aed' },
          { id: 'pill-4', text: 'Progress Tracking', iconType: 'solid', solidIcon: 'chart-line', solidIconColor: '#7c3aed' },
        ],
        stats: [
          { id: 'stat1', value: '15,000+', label: 'Students Tutored', iconType: 'solid', solidIcon: 'graduation-cap', solidIconColor: '#7c3aed' },
          { id: 'stat2', value: '98%', label: 'Grade Improvement', iconType: 'solid', solidIcon: 'trending-up', solidIconColor: '#7c3aed' },
          { id: 'stat3', value: '50+', label: 'Expert Educators', iconType: 'solid', solidIcon: 'users', solidIconColor: '#7c3aed' },
          { id: 'stat4', value: '95%', label: 'College Acceptance', iconType: 'solid', solidIcon: 'trophy', solidIconColor: '#7c3aed' },
        ],
        showFloatingBadge: true,
        floatingBadgeValue: '15+',
        floatingBadgeLabel: 'Years of Excellence',
      },
      settings: {
        backgroundColor: '#f8fafc',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 700,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // TESTIMONIALS
    // ========================================
    {
      id: 'testimonials',
      type: 'testimonials',
      templateId: 'testimonials-modern',
      order: 6,
      content: {
        title: 'Success Stories',
        subtitle: 'Hear from families who have experienced the BrightMinds difference',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        accentColor: '#7c3aed',
        testimonials: [
          {
            id: 'test-1',
            name: 'Sarah Mitchell',
            role: 'Parent',
            company: 'High School Junior Parent',
            content: 'The transformation in my daughter\'s confidence and grades has been remarkable. The tutors at BrightMinds don\'t just teach subjects—they inspire a genuine love for learning. Her math scores improved by 40% in just one semester.',
            rating: 5,
            avatar: '',
          },
          {
            id: 'test-2',
            name: 'David Chen',
            role: 'Student',
            company: 'Accepted to MIT',
            content: 'BrightMinds prepared me not just for standardized tests, but for academic success in college. The personalized attention and rigorous curriculum gave me the skills and confidence to excel. I couldn\'t have done it without them.',
            rating: 5,
            avatar: '',
          },
          {
            id: 'test-3',
            name: 'Dr. Amanda Foster',
            role: 'Parent & Educator',
            company: 'Middle School Parent',
            content: 'As an educator myself, I\'m incredibly particular about who teaches my children. BrightMinds exceeded all my expectations. Their approach is research-based, their tutors are exceptional, and the results speak for themselves.',
            rating: 5,
            avatar: '',
          },
          {
            id: 'test-4',
            name: 'Michael Rodriguez',
            role: 'Parent',
            company: 'Elementary School Parent',
            content: 'My son was struggling with reading, and within months at BrightMinds, he went from avoiding books to reading above grade level. The patience and expertise of his tutor made all the difference.',
            rating: 5,
            avatar: '',
          },
        ],
      },
      settings: {
        backgroundColor: '#0f172a',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // PRICING SECTION
    // ========================================
    {
      id: 'pricing',
      type: 'pricing',
      templateId: 'pricing-modern',
      order: 7,
      content: {
        headline: 'Investment in Excellence',
        subheadline: 'Flexible programs designed to fit your family\'s needs and schedule',
        badgeText: 'Transparent Pricing',
        showBadge: true,
        backgroundColor: '#f8fafc',
        textColor: '#1f293b',
        accentColor: '#7c3aed',
        cardBackgroundColor: '#ffffff',
        columns: 3,
        showFootnote: true,
        footnoteText: 'All packages include progress reports, parent consultations, and access to our online learning resources. Custom programs available upon request.',
        cards: [
          {
            id: 'card-1',
            title: 'Foundation',
            description: 'Perfect for students needing consistent support',
            iconType: 'solid',
            solidIcon: 'book-open',
            solidIconColor: '#7c3aed',
            price: '$299',
            period: '/month',
            features: [
              { id: 'f1', text: '4 one-hour sessions/month', included: true },
              { id: 'f2', text: 'One subject focus', included: true },
              { id: 'f3', text: 'Progress tracking', included: true },
              { id: 'f4', text: 'Parent consultations', included: true },
              { id: 'f5', text: 'Online resources access', included: true },
              { id: 'f6', text: 'Homework support', included: false },
              { id: 'f7', text: 'Priority scheduling', included: false },
            ],
            highlighted: false,
            ctaText: 'Get Started',
            cta: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'card-2',
            title: 'Accelerator',
            description: 'Most popular for comprehensive learning',
            iconType: 'solid',
            solidIcon: 'rocket',
            solidIconColor: '#7c3aed',
            price: '$549',
            period: '/month',
            badgeText: 'Most Popular',
            features: [
              { id: 'f1', text: '8 one-hour sessions/month', included: true },
              { id: 'f2', text: 'Two subject focus', included: true },
              { id: 'f3', text: 'Progress tracking', included: true },
              { id: 'f4', text: 'Bi-weekly parent consultations', included: true },
              { id: 'f5', text: 'Full online resources access', included: true },
              { id: 'f6', text: 'Homework support', included: true },
              { id: 'f7', text: 'Priority scheduling', included: false },
            ],
            highlighted: true,
            ctaText: 'Enroll Now',
            cta: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'card-3',
            title: 'Elite',
            description: 'Comprehensive support for ambitious students',
            iconType: 'solid',
            solidIcon: 'crown',
            solidIconColor: '#7c3aed',
            price: '$899',
            period: '/month',
            features: [
              { id: 'f1', text: 'Unlimited sessions', included: true },
              { id: 'f2', text: 'All subjects included', included: true },
              { id: 'f3', text: 'Advanced progress analytics', included: true },
              { id: 'f4', text: 'Weekly parent consultations', included: true },
              { id: 'f5', text: 'Premium resources access', included: true },
              { id: 'f6', text: '24/7 homework support', included: true },
              { id: 'f7', text: 'Priority scheduling', included: true },
            ],
            highlighted: false,
            ctaText: 'Go Elite',
            cta: { type: 'url', url: '#section-contact' },
          },
        ],
      },
      settings: {
        backgroundColor: '#f8fafc',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // CONTACT SECTION
    // ========================================
    {
      id: 'contact',
      type: 'contact',
      templateId: 'contact-modern',
      order: 8,
      content: {
        headline: 'Begin Your Journey',
        subheadline: 'Ready to unlock your child\'s potential?',
        description: 'Schedule a complimentary consultation to discuss your child\'s academic goals and discover how BrightMinds can help.',
        email: 'admissions@brightminds.edu',
        phone: '(555) 234-5678',
        address: '500 Academic Way, Suite 200\nEducation City, ST 12345',
        socialLinks: [
          { platform: 'Facebook', href: 'https://facebook.com/brightmindsacademy' },
          { platform: 'Instagram', href: 'https://instagram.com/brightmindsacademy' },
          { platform: 'LinkedIn', href: 'https://linkedin.com/company/brightmindsacademy' },
        ],
        showForm: true,
        formFields: [
          { id: 'name', name: 'name', label: 'Parent/Guardian Name', type: 'text', required: true, placeholder: 'Your full name' },
          { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
          { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '(555) 123-4567' },
          {
            id: 'student-grade',
            name: 'studentGrade',
            label: 'Student\'s Grade Level',
            type: 'select',
            required: true,
            options: ['Elementary (K-5)', 'Middle School (6-8)', 'High School (9-12)', 'College Prep', 'Other']
          },
          {
            id: 'subjects',
            name: 'subjects',
            label: 'Subjects of Interest',
            type: 'select',
            required: false,
            options: ['Mathematics', 'English/Language Arts', 'Science', 'Test Preparation (SAT/ACT)', 'Study Skills', 'Multiple Subjects']
          },
          { id: 'message', name: 'message', label: 'Additional Information', type: 'textarea', required: false, placeholder: 'Tell us about your child\'s academic goals and any specific needs...' },
        ],
        submitButtonText: 'Schedule Consultation',
        successMessage: 'Thank you! Our admissions team will contact you within 24 hours to schedule your complimentary consultation.',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        accentColor: '#7c3aed',
        layout: 'centered',
        showMap: false,
      },
      settings: {
        backgroundColor: '#ffffff',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // FOOTER
    // ========================================
    {
      id: generateSectionId('footer'),
      type: 'footer',
      templateId: 'footer-modern',
      order: 9,
      content: {
        logoType: 'text',
        companyName: 'BrightMinds Academy',
        company: {
          name: 'BrightMinds Academy',
          description: 'Empowering students to achieve academic excellence through personalized tutoring and innovative learning approaches since 2009.',
        },
        email: 'admissions@brightminds.edu',
        phone: '(555) 234-5678',
        address: '500 Academic Way, Suite 200, Education City, ST 12345',
        businessHours: {
          enabled: true,
          showHours: true,
          title: 'Learning Center Hours',
          days: [
            { day: 'Monday - Thursday', hours: '3:00 PM - 9:00 PM', isOpen: true },
            { day: 'Friday', hours: '3:00 PM - 7:00 PM', isOpen: true },
            { day: 'Saturday', hours: '9:00 AM - 5:00 PM', isOpen: true },
            { day: 'Sunday', hours: 'Closed', isOpen: false },
          ],
          showPublicHolidays: true,
          publicHolidaysIsOpen: false,
          publicHolidaysHours: 'Closed',
        },
        links: [
          {
            title: 'Programs',
            items: [
              { label: 'Mathematics', type: 'url', url: '#' },
              { label: 'English & Language Arts', type: 'url', url: '#' },
              { label: 'Science', type: 'url', url: '#' },
              { label: 'Test Preparation', type: 'url', url: '#' },
            ],
          },
          {
            title: 'Resources',
            items: [
              { label: 'About Us', type: 'url', url: '#section-about' },
              { label: 'Success Stories', type: 'url', url: '#testimonials' },
              { label: 'Parent Portal', type: 'url', url: '#' },
              { label: 'Contact', type: 'url', url: '#section-contact' },
            ],
          },
        ],
        socialLinks: [
          { platform: 'Facebook', href: 'https://facebook.com/brightmindsacademy' },
          { platform: 'Instagram', href: 'https://instagram.com/brightmindsacademy' },
          { platform: 'LinkedIn', href: 'https://linkedin.com/company/brightmindsacademy' },
        ],
        copyright: '© 2024 BrightMinds Academy. All rights reserved.',
        backgroundColor: '#1f2937',
        textColor: '#e5e7eb',
        accentColor: '#7c3aed',
      },
      settings: {
        backgroundColor: '#1f2937',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
};

/**
 * Professional Garden & Landscaping Service Landing Page Template
 * A fresh, nature-inspired landing page for garden services and landscaping companies
 */
export const gardenServiceTemplate: PageTemplate = {
  id: 'garden-service-premium',
  name: 'GreenScape Garden Services',
  description: 'A professional, nature-inspired landing page for garden services, landscaping companies, and lawn care businesses. Features service showcases, before/after gallery, seasonal packages, and easy booking.',
  category: 'business',
  isAvailable: true,
  tags: ['gardening', 'landscaping', 'lawn care', 'outdoor', 'services'],
  previewImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
  sections: [
    // ========================================
    // NAVIGATION
    // ========================================
    {
      id: generateSectionId('navbar'),
      type: 'navbar',
      templateId: 'navbar-modern',
      order: 1,
      content: {
        logoType: 'text',
        brandName: 'GreenScape',
        links: [
          { label: 'Home', type: 'url', url: '#section-hero' },
          { label: 'Services', type: 'url', url: '#section-features' },
          { label: 'About', type: 'url', url: '#section-about' },
          { label: 'Pricing', type: 'url', url: '#section-pricing' },
          { label: 'Contact', type: 'url', url: '#section-contact' },
        ],
        ctaText: 'Get Free Quote',
        ctaLink: '#section-contact',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        linkHoverColor: '#16a34a',
        accentColor: '#16a34a',
        linksAlignment: 'center',
        linkFontSize: 14,
        logoTextSize: 20,
      },
      settings: {
        backgroundColor: '#ffffff',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // HERO - GARDEN SERVICE FOCUSED
    // ========================================
    {
      id: 'hero',
      type: 'hero',
      templateId: 'hero-modern',
      order: 2,
      content: {
        headline: 'Transform Your\nOutdoor Space',
        subheadline: 'Professional garden design, landscaping, and lawn care services that bring your outdoor vision to life',
        ctaText: 'Get Free Quote',
        ctaLink: '#section-contact',
        ctaType: 'url',
        colorMode: 'light',
        backgroundColor: '#f0fdf4',
        textColor: '#1f2937',
        showWelcomeTag: true,
        showScrollIndicator: true,
        showStatsCard: true,
        showTrustIndicators: true,
        statsCardTitle: 'Gardens Transformed',
        statsCardValue: '5,000+',
        stats: [
          { id: 'stat1', value: '15+', label: 'Years Experience', iconType: 'solid', solidIcon: 'award', solidIconColor: '#16a34a' },
          { id: 'stat2', value: '5,000+', label: 'Happy Clients', iconType: 'solid', solidIcon: 'heart', solidIconColor: '#16a34a' },
          { id: 'stat3', value: '100%', label: 'Satisfaction Rate', iconType: 'solid', solidIcon: 'check-circle', solidIconColor: '#16a34a' },
          { id: 'stat4', value: '4.9★', label: 'Customer Rating', iconType: 'solid', solidIcon: 'star', solidIconColor: '#16a34a' },
        ],
        trustIndicators: [
          { id: 'trust1', icon: 'shield', label: 'Fully Insured' },
          { id: 'trust2', icon: 'award', label: 'Certified Experts' },
          { id: 'trust3', icon: 'check', label: 'Free Estimates' },
        ],
        customerTrustText: 'Trusted by 5,000+ homeowners',
      },
      settings: {
        backgroundColor: '#f0fdf4',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // FEATURES - SERVICES OFFERED
    // ========================================
    {
      id: 'features',
      type: 'features',
      templateId: 'features-modern',
      order: 4,
      content: {
        title: 'Our Services',
        subtitle: 'Comprehensive garden and landscaping solutions tailored to your needs',
        badgeText: 'Professional Services',
        showBadge: true,
        backgroundColor: '#14532d',
        textColor: '#ffffff',
        accentColor: '#22c55e',
        iconStyle: 'gradient',
        iconSize: 40,
        autoRotate: true,
        rotationDelay: 5,
        features: [
          {
            id: 'feat-1',
            title: 'Lawn Care & Maintenance',
            description: 'Regular mowing, edging, fertilization, and weed control to keep your lawn healthy and beautiful all year round.',
            iconType: 'solid',
            solidIcon: 'sun',
            solidIconColor: '#22c55e',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-2',
            title: 'Garden Design & Installation',
            description: 'Custom garden designs with seasonal flowers, native plants, and sustainable landscaping that thrives in your climate.',
            iconType: 'solid',
            solidIcon: 'flower',
            solidIconColor: '#22c55e',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-3',
            title: 'Tree Services',
            description: 'Professional tree trimming, pruning, removal, and planting services by certified arborists.',
            iconType: 'solid',
            solidIcon: 'tree-pine',
            solidIconColor: '#22c55e',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-4',
            title: 'Hardscaping',
            description: 'Patios, walkways, retaining walls, and outdoor living spaces that complement your landscape.',
            iconType: 'solid',
            solidIcon: 'home',
            solidIconColor: '#22c55e',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-5',
            title: 'Irrigation Systems',
            description: 'Efficient sprinkler installation, repair, and smart irrigation solutions to save water and money.',
            iconType: 'solid',
            solidIcon: 'droplets',
            solidIconColor: '#22c55e',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-6',
            title: 'Seasonal Clean-Up',
            description: 'Spring and fall clean-up services including leaf removal, bed preparation, and seasonal plantings.',
            iconType: 'solid',
            solidIcon: 'calendar',
            solidIconColor: '#22c55e',
            link: { type: 'url', url: '#section-contact' },
          },
        ],
      },
      settings: {
        backgroundColor: '#14532d',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // ABOUT SECTION
    // ========================================
    {
      id: 'about',
      type: 'about',
      templateId: 'about-modern',
      order: 5,
      content: {
        headline: 'Cultivating Beautiful Spaces Since 2009',
        subheadline: 'Why Choose GreenScape',
        description: 'At GreenScape, we believe every outdoor space has the potential to be extraordinary. With over 15 years of experience transforming gardens across the region, our team of certified horticulturists and landscape designers brings passion and expertise to every project.\n\nWe take pride in our sustainable approach, using eco-friendly practices and native plants whenever possible. Our commitment to quality craftsmanship and customer satisfaction has made us the region\'s most trusted garden service provider.',
        imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80',
        imageAlt: 'Professional landscapers at work',
        imagePosition: 'right',
        imageSize: 'large',
        ctaText: 'Meet Our Team',
        ctaLink: '#section-contact',
        ctaTarget: 'url',
        backgroundColor: '#f0fdf4',
        textColor: '#1e293b',
        ctaButtonBg: '#16a34a',
        ctaButtonTextColor: '#ffffff',
        accentColor: '#16a34a',
        showStats: true,
        showFeaturePills: true,
        featurePills: [
          { id: 'pill-1', text: 'Eco-Friendly', iconType: 'solid', solidIcon: 'leaf', solidIconColor: '#16a34a' },
          { id: 'pill-2', text: 'Fully Insured', iconType: 'solid', solidIcon: 'shield', solidIconColor: '#16a34a' },
          { id: 'pill-3', text: 'Free Estimates', iconType: 'solid', solidIcon: 'file-text', solidIconColor: '#16a34a' },
          { id: 'pill-4', text: 'Satisfaction Guaranteed', iconType: 'solid', solidIcon: 'check-circle', solidIconColor: '#16a34a' },
        ],
        stats: [
          { id: 'stat1', value: '5,000+', label: 'Projects Completed', iconType: 'solid', solidIcon: 'home', solidIconColor: '#16a34a' },
          { id: 'stat2', value: '15+', label: 'Years Experience', iconType: 'solid', solidIcon: 'calendar', solidIconColor: '#16a34a' },
          { id: 'stat3', value: '25+', label: 'Expert Gardeners', iconType: 'solid', solidIcon: 'users', solidIconColor: '#16a34a' },
          { id: 'stat4', value: '100%', label: 'Satisfaction Rate', iconType: 'solid', solidIcon: 'heart', solidIconColor: '#16a34a' },
        ],
        showFloatingBadge: true,
        floatingBadgeValue: '15+',
        floatingBadgeLabel: 'Years of Excellence',
      },
      settings: {
        backgroundColor: '#f0fdf4',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 700,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // TESTIMONIALS
    // ========================================
    {
      id: 'testimonials',
      type: 'testimonials',
      templateId: 'testimonials-modern',
      order: 6,
      content: {
        title: 'What Our Clients Say',
        subtitle: 'Hear from homeowners who transformed their outdoor spaces with GreenScape',
        backgroundColor: '#14532d',
        textColor: '#ffffff',
        accentColor: '#22c55e',
        testimonials: [
          {
            id: 'test-1',
            name: 'Jennifer Martinez',
            role: 'Homeowner',
            company: 'Residential Client',
            content: 'GreenScape completely transformed our backyard! The team was professional, creative, and exceeded all our expectations. Our garden is now the envy of the neighborhood.',
            rating: 5,
            avatar: '',
          },
          {
            id: 'test-2',
            name: 'Robert Thompson',
            role: 'Property Manager',
            company: 'Sunrise Properties',
            content: 'We\'ve been using GreenScape for all our commercial properties for 5 years. Their reliability and attention to detail is unmatched. Highly recommend!',
            rating: 5,
            avatar: '',
          },
          {
            id: 'test-3',
            name: 'Sarah Chen',
            role: 'Homeowner',
            company: 'Residential Client',
            content: 'The irrigation system they installed has saved us so much water and money. Plus, our lawn has never looked better. The team really knows their stuff!',
            rating: 5,
            avatar: '',
          },
          {
            id: 'test-4',
            name: 'Michael Davis',
            role: 'Business Owner',
            company: 'Davis Consulting',
            content: 'From design to execution, GreenScape delivered exceptional results. Our office landscaping makes a great first impression on clients every day.',
            rating: 5,
            avatar: '',
          },
        ],
      },
      settings: {
        backgroundColor: '#14532d',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // PRICING SECTION
    // ========================================
    {
      id: 'pricing',
      type: 'pricing',
      templateId: 'pricing-modern',
      order: 7,
      content: {
        headline: 'Service Packages',
        subheadline: 'Flexible plans designed to keep your outdoor space beautiful year-round',
        badgeText: 'Transparent Pricing',
        showBadge: true,
        backgroundColor: '#f0fdf4',
        textColor: '#1f293b',
        accentColor: '#16a34a',
        cardBackgroundColor: '#ffffff',
        columns: 3,
        showFootnote: true,
        footnoteText: 'All packages include free consultations and satisfaction guarantee. Custom packages available for commercial properties.',
        cards: [
          {
            id: 'card-1',
            title: 'Essential Care',
            description: 'Perfect for maintaining a beautiful lawn',
            iconType: 'solid',
            solidIcon: 'sun',
            solidIconColor: '#16a34a',
            price: '$149',
            period: '/month',
            features: [
              { id: 'f1', text: 'Weekly lawn mowing', included: true },
              { id: 'f2', text: 'Edging & trimming', included: true },
              { id: 'f3', text: 'Seasonal fertilization', included: true },
              { id: 'f4', text: 'Weed control', included: true },
              { id: 'f5', text: 'Basic cleanup', included: true },
              { id: 'f6', text: 'Garden bed maintenance', included: false },
              { id: 'f7', text: 'Priority scheduling', included: false },
            ],
            highlighted: false,
            ctaText: 'Get Started',
            cta: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'card-2',
            title: 'Complete Garden',
            description: 'Our most popular comprehensive package',
            iconType: 'solid',
            solidIcon: 'flower',
            solidIconColor: '#16a34a',
            price: '$299',
            period: '/month',
            badgeText: 'Most Popular',
            features: [
              { id: 'f1', text: 'Weekly lawn mowing', included: true },
              { id: 'f2', text: 'Edging & trimming', included: true },
              { id: 'f3', text: 'Seasonal fertilization', included: true },
              { id: 'f4', text: 'Weed & pest control', included: true },
              { id: 'f5', text: 'Full seasonal cleanup', included: true },
              { id: 'f6', text: 'Garden bed maintenance', included: true },
              { id: 'f7', text: 'Priority scheduling', included: false },
            ],
            highlighted: true,
            ctaText: 'Get Started',
            cta: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'card-3',
            title: 'Premium Estate',
            description: 'Complete care for larger properties',
            iconType: 'solid',
            solidIcon: 'crown',
            solidIconColor: '#16a34a',
            price: '$549',
            period: '/month',
            features: [
              { id: 'f1', text: 'Bi-weekly lawn mowing', included: true },
              { id: 'f2', text: 'Full landscape maintenance', included: true },
              { id: 'f3', text: 'Tree & shrub care', included: true },
              { id: 'f4', text: 'Irrigation management', included: true },
              { id: 'f5', text: 'Seasonal plantings', included: true },
              { id: 'f6', text: 'Dedicated account manager', included: true },
              { id: 'f7', text: 'Priority scheduling', included: true },
            ],
            highlighted: false,
            ctaText: 'Contact Us',
            cta: { type: 'url', url: '#section-contact' },
          },
        ],
      },
      settings: {
        backgroundColor: '#f0fdf4',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // CONTACT SECTION
    // ========================================
    {
      id: 'contact',
      type: 'contact',
      templateId: 'contact-modern',
      order: 8,
      content: {
        headline: 'Get Your Free Quote',
        subheadline: 'Ready to transform your outdoor space?',
        description: 'Contact us today for a free consultation and estimate. Our team is ready to bring your garden vision to life.',
        email: 'info@greenscape.com',
        phone: '(555) 345-6789',
        address: '123 Garden Way\nGreenville, ST 12345',
        socialLinks: [
          { platform: 'Facebook', href: 'https://facebook.com/greenscape' },
          { platform: 'Instagram', href: 'https://instagram.com/greenscape' },
          { platform: 'Pinterest', href: 'https://pinterest.com/greenscape' },
        ],
        showForm: true,
        formFields: [
          { id: 'name', name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
          { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
          { id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '(555) 123-4567' },
          {
            id: 'property-type',
            name: 'propertyType',
            label: 'Property Type',
            type: 'select',
            required: true,
            options: ['Residential Home', 'Commercial Property', 'HOA Community', 'Estate/Large Property', 'Other']
          },
          {
            id: 'service',
            name: 'service',
            label: 'Service Interested In',
            type: 'select',
            required: false,
            options: ['Lawn Care', 'Garden Design', 'Tree Services', 'Hardscaping', 'Irrigation', 'Full Service Package', 'Other']
          },
          { id: 'message', name: 'message', label: 'Tell Us About Your Project', type: 'textarea', required: false, placeholder: 'Describe your outdoor space and what you\'re looking for...' },
        ],
        submitButtonText: 'Request Free Quote',
        successMessage: 'Thank you! We\'ll contact you within 24 hours to schedule your free consultation.',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        accentColor: '#16a34a',
        layout: 'centered',
        showMap: false,
      },
      settings: {
        backgroundColor: '#ffffff',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // FOOTER
    // ========================================
    {
      id: generateSectionId('footer'),
      type: 'footer',
      templateId: 'footer-modern',
      order: 9,
      content: {
        logoType: 'text',
        companyName: 'GreenScape',
        company: {
          name: 'GreenScape Garden Services',
          description: 'Your trusted partner for professional garden design, landscaping, and lawn care. We bring nature\'s beauty to your doorstep.',
        },
        email: 'info@greenscape.com',
        phone: '(555) 345-6789',
        address: '123 Garden Way, Greenville, ST 12345',
        businessHours: {
          enabled: true,
          showHours: true,
          title: 'Service Hours',
          days: [
            { day: 'Monday - Friday', hours: '7:00 AM - 6:00 PM', isOpen: true },
            { day: 'Saturday', hours: '8:00 AM - 4:00 PM', isOpen: true },
            { day: 'Sunday', hours: 'Closed', isOpen: false },
          ],
          showPublicHolidays: true,
          publicHolidaysIsOpen: false,
          publicHolidaysHours: 'Closed',
        },
        links: [
          {
            title: 'Services',
            items: [
              { label: 'Lawn Care', type: 'url', url: '#section-features' },
              { label: 'Garden Design', type: 'url', url: '#section-features' },
              { label: 'Tree Services', type: 'url', url: '#section-features' },
              { label: 'Hardscaping', type: 'url', url: '#section-features' },
            ],
          },
          {
            title: 'Company',
            items: [
              { label: 'About Us', type: 'url', url: '#section-about' },
              { label: 'Pricing', type: 'url', url: '#section-pricing' },
              { label: 'Testimonials', type: 'url', url: '#testimonials' },
              { label: 'Contact', type: 'url', url: '#section-contact' },
            ],
          },
        ],
        socialLinks: [
          { platform: 'Facebook', href: 'https://facebook.com/greenscape' },
          { platform: 'Instagram', href: 'https://instagram.com/greenscape' },
          { platform: 'Pinterest', href: 'https://pinterest.com/greenscape' },
        ],
        copyright: '© 2024 GreenScape Garden Services. All rights reserved.',
        backgroundColor: '#14532d',
        textColor: '#e5e7eb',
        accentColor: '#22c55e',
      },
      settings: {
        backgroundColor: '#14532d',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
};

/**
 * Luxury Holiday Accommodation Landing Page Template
 * An upmarket, professional landing page for holiday accommodation, luxury lodges, boutique hotels, and premium stays
 */
export const luxuryAccommodationTemplate: PageTemplate = {
  id: 'luxury-accommodation-premium',
  name: 'Luxury Holiday Accommodation',
  description: 'An upmarket, professional landing page for holiday accommodation, luxury lodges, boutique hotels, and premium stays. Features stunning hero, property showcase, amenities, guest testimonials, and seamless booking.',
  category: 'accommodation',
  isAvailable: true,
  tags: ['accommodation', 'holiday', 'lodge', 'hotel', 'luxury', 'boutique', 'travel', 'booking'],
  previewImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  sections: [
    // ========================================
    // NAVIGATION
    // ========================================
    {
      id: generateSectionId('navbar'),
      type: 'navbar',
      templateId: 'navbar-modern',
      order: 1,
      content: {
        logoType: 'text',
        brandName: 'The Grand Retreat',
        links: [
          { label: 'Home', type: 'url', url: '#section-hero' },
          { label: 'Accommodation', type: 'url', url: '#section-inventory' },
          { label: 'Amenities', type: 'url', url: '#section-features' },
          { label: 'Gallery', type: 'url', url: '#section-about' },
          { label: 'Reviews', type: 'url', url: '#testimonials' },
          { label: 'Contact', type: 'url', url: '#section-contact' },
        ],
        ctaText: 'Book Now',
        ctaLink: '#section-contact',
        backgroundColor: '#1a1a2e',
        textColor: '#f5f0e8',
        linkHoverColor: '#c9a96e',
        accentColor: '#c9a96e',
        linksAlignment: 'center',
        linkFontSize: 14,
        logoTextSize: 20,
      },
      settings: {
        backgroundColor: '#1a1a2e',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // HERO - LUXURY ACCOMMODATION FOCUSED
    // ========================================
    {
      id: 'hero',
      type: 'hero',
      templateId: 'hero-modern',
      order: 2,
      content: {
        headline: 'Experience\nUnforgettable Luxury',
        subheadline: 'Indulge in world-class accommodation where every detail is crafted for your comfort. From stunning suites to breathtaking views, your perfect escape awaits.',
        ctaText: 'Check Availability',
        ctaLink: '#section-contact',
        ctaType: 'url',
        secondaryCtaText: 'Virtual Tour',
        secondaryCtaLink: '#section-about',
        secondaryCtaType: 'url',
        colorMode: 'dark',
        backgroundColor: '#1a1a2e',
        textColor: '#f5f0e8',
        showWelcomeTag: true,
        showScrollIndicator: true,
        showStatsCard: false,
        showTrustIndicators: true,
        stats: [
          { id: 'stat1', value: '5-Star', label: 'Rating', iconType: 'solid', solidIcon: 'star', solidIconColor: '#c9a96e' },
          { id: 'stat2', value: '12+', label: 'Years', iconType: 'solid', solidIcon: 'calendar', solidIconColor: '#c9a96e' },
          { id: 'stat3', value: '5000+', label: 'Guests', iconType: 'solid', solidIcon: 'users', solidIconColor: '#c9a96e' },
          { id: 'stat4', value: '98%', label: 'Return Rate', iconType: 'solid', solidIcon: 'heart', solidIconColor: '#c9a96e' },
        ],
        trustIndicators: [
          { id: 'trust1', icon: 'award', label: 'Award-Winning' },
          { id: 'trust2', icon: 'shield', label: 'Safe & Secure' },
          { id: 'trust3', icon: 'check', label: 'Best Rate Guarantee' },
        ],
        customerTrustText: 'Trusted by 5000+ discerning travellers',
      },
      settings: {
        backgroundColor: '#1a1a2e',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // LISTINGS SHOWCASE - ROOMS & SUITES
    // ========================================
    {
      id: 'inventory',
      type: 'listings-showcase',
      templateId: 'listings-showcase-modern',
      order: 3,
      content: {
        headline: 'Rooms & Suites',
        subheadline: 'Explore our collection of exquisitely appointed accommodations',
        description: 'Every room is a sanctuary of comfort and elegance.',
        itemsPerPage: 6,
        showLoadMore: true,
        loadMoreText: 'View All Rooms',
        showSort: true,
        showFilter: true,
        defaultSort: 'newest',
        showStatus: true,
        showPrice: true,
        showMileage: false,
        showYear: false,
        backgroundColor: '#f5f0e8',
        textColor: '#1a1a2e',
        accentColor: '#c9a96e',
        cardStyle: 'modern',
        layout: 'grid-3',
        viewDetailsText: 'View Details',
        viewDetailsTarget: 'url',
        showNavbarOnDetails: true,
        showFooterOnDetails: true,
        inquiryButtonText: 'Reserve Now',
        inquiryTarget: 'form',
        showOnlySelected: true,
        selectedVehicleIds: [],
      },
      settings: {
        backgroundColor: '#f5f0e8',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // FEATURES - CURATED EXPERIENCES
    // ========================================
    {
      id: 'features',
      type: 'features',
      templateId: 'features-modern',
      order: 4,
      content: {
        title: 'Curated Experiences',
        subtitle: 'Exceptional amenities and services designed to make your stay truly memorable',
        badgeText: 'Premium Amenities',
        showBadge: true,
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
        accentColor: '#c9a96e',
        iconStyle: 'gradient',
        iconSize: 40,
        autoRotate: true,
        rotationDelay: 5,
        features: [
          {
            id: 'feat-1',
            title: 'Infinity Pool & Spa',
            description: 'Unwind in our breathtaking infinity pool overlooking the landscape, followed by rejuvenating treatments at our world-class spa.',
            iconType: 'solid',
            solidIcon: 'waves',
            solidIconColor: '#c9a96e',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-2',
            title: 'Fine Dining',
            description: 'Savour exquisite cuisine crafted by our award-winning chefs, featuring locally sourced ingredients and an extensive wine collection.',
            iconType: 'solid',
            solidIcon: 'utensils',
            solidIconColor: '#c9a96e',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-3',
            title: 'Private Safari Excursions',
            description: 'Embark on exclusive guided safari adventures through pristine wilderness areas with expert naturalists.',
            iconType: 'solid',
            solidIcon: 'binoculars',
            solidIconColor: '#c9a96e',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-4',
            title: 'Wellness & Fitness',
            description: 'Maintain your wellness routine in our state-of-the-art fitness centre or find inner peace with sunrise yoga sessions.',
            iconType: 'solid',
            solidIcon: 'heart-pulse',
            solidIconColor: '#c9a96e',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-5',
            title: 'Concierge Service',
            description: 'Our dedicated concierge team is available around the clock to arrange exclusive experiences, reservations, and personalised itineraries.',
            iconType: 'solid',
            solidIcon: 'bell-ring',
            solidIconColor: '#c9a96e',
            link: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'feat-6',
            title: 'Airport Transfers',
            description: 'Enjoy complimentary luxury airport transfers in our fleet of premium vehicles, ensuring a seamless arrival and departure.',
            iconType: 'solid',
            solidIcon: 'car',
            solidIconColor: '#c9a96e',
            link: { type: 'url', url: '#section-contact' },
          },
        ],
      },
      settings: {
        backgroundColor: '#1a1a2e',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // ABOUT SECTION
    // ========================================
    {
      id: 'about',
      type: 'about',
      templateId: 'about-modern',
      order: 5,
      content: {
        headline: 'A Legacy of\nExceptional Hospitality',
        subheadline: 'Why Guests Choose The Grand Retreat',
        description: 'For over a decade, The Grand Retreat has been the sanctuary of choice for discerning travellers seeking unparalleled luxury and authentic hospitality. Our commitment to excellence, attention to detail, and warm personalised service creates experiences that linger long after checkout.\n\nNestled in a breathtaking location, our property seamlessly blends timeless elegance with modern sophistication. Every suite, every meal, and every interaction is designed to exceed your expectations and create treasured memories.',
        imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
        imageAlt: 'Luxury suite with panoramic views',
        imagePosition: 'right',
        imageSize: 'large',
        ctaText: 'Discover Our Story',
        ctaLink: '#section-contact',
        ctaTarget: 'url',
        backgroundColor: '#f5f0e8',
        textColor: '#1a1a2e',
        ctaButtonBg: '#c9a96e',
        ctaButtonTextColor: '#1a1a2e',
        accentColor: '#c9a96e',
        showStats: true,
        showFeaturePills: true,
        featurePills: [
          { id: 'pill-1', text: 'Award-Winning', iconType: 'solid', solidIcon: 'award', solidIconColor: '#c9a96e' },
          { id: 'pill-2', text: 'Eco-Conscious', iconType: 'solid', solidIcon: 'leaf', solidIconColor: '#c9a96e' },
          { id: 'pill-3', text: 'Personalised Service', iconType: 'solid', solidIcon: 'user', solidIconColor: '#c9a96e' },
          { id: 'pill-4', text: 'Exclusive Location', iconType: 'solid', solidIcon: 'map-pin', solidIconColor: '#c9a96e' },
        ],
        stats: [
          { id: 'stat1', value: '12+', label: 'Years Experience', iconType: 'solid', solidIcon: 'calendar', solidIconColor: '#c9a96e' },
          { id: 'stat2', value: '5000+', label: 'Happy Guests', iconType: 'solid', solidIcon: 'users', solidIconColor: '#c9a96e' },
          { id: 'stat3', value: '50+', label: 'Luxury Suites', iconType: 'solid', solidIcon: 'bed', solidIconColor: '#c9a96e' },
          { id: 'stat4', value: '4.9', label: 'Guest Rating', iconType: 'solid', solidIcon: 'star', solidIconColor: '#c9a96e' },
        ],
        showFloatingBadge: true,
        floatingBadgeValue: '12+',
        floatingBadgeLabel: 'Years of Excellence',
      },
      settings: {
        backgroundColor: '#f5f0e8',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 700,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // TESTIMONIALS
    // ========================================
    {
      id: 'testimonials',
      type: 'testimonials',
      templateId: 'testimonials-modern',
      order: 6,
      content: {
        title: 'Guest Experiences',
        subtitle: 'Hear from travellers who have experienced the magic of The Grand Retreat',
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
        accentColor: '#c9a96e',
        testimonials: [
          {
            id: 'test-1',
            name: 'Emma & James Whitfield',
            role: 'Honeymooners',
            company: 'London, United Kingdom',
            content: 'Our honeymoon at The Grand Retreat was nothing short of magical. From the moment we arrived, every detail was perfect. The suite was breathtaking, the dining exquisite, and the spa treatments heavenly. We\'ve already booked our anniversary return.',
            rating: 5,
            avatar: '',
          },
          {
            id: 'test-2',
            name: 'The Nakamura Family',
            role: 'Family Vacation',
            company: 'Tokyo, Japan',
            content: 'Travelling with three children can be challenging, but The Grand Retreat made it effortless. The kids\' programme was fantastic, the family suite spacious and beautiful, and the staff went above and beyond to make our little ones feel special.',
            rating: 5,
            avatar: '',
          },
          {
            id: 'test-3',
            name: 'Sofia Bergström',
            role: 'Solo Traveller',
            company: 'Stockholm, Sweden',
            content: 'As a solo traveller, I felt completely at home. The concierge arranged a private safari that was the highlight of my year. The attention to detail and genuine warmth of the staff made this the most memorable trip of my life.',
            rating: 5,
            avatar: '',
          },
          {
            id: 'test-4',
            name: 'Robert & Diana Crawford',
            role: '25th Anniversary',
            company: 'Sydney, Australia',
            content: 'We chose The Grand Retreat for our silver anniversary and it exceeded every expectation. The private dining experience under the stars was pure magic. This is luxury hospitality at its finest — we\'ll be back for our 30th.',
            rating: 5,
            avatar: '',
          },
        ],
      },
      settings: {
        backgroundColor: '#1a1a2e',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // PRICING SECTION
    // ========================================
    {
      id: 'pricing',
      type: 'pricing',
      templateId: 'pricing-modern',
      order: 7,
      content: {
        headline: 'Accommodation Packages',
        subheadline: 'Choose the perfect suite for your dream getaway',
        badgeText: 'Best Value',
        showBadge: true,
        backgroundColor: '#f5f0e8',
        textColor: '#1a1a2e',
        accentColor: '#c9a96e',
        cardBackgroundColor: '#ffffff',
        columns: 3,
        showFootnote: true,
        footnoteText: 'All packages include complimentary breakfast, airport transfers, Wi-Fi, and access to spa and fitness facilities. Rates are per night and subject to seasonal availability.',
        cards: [
          {
            id: 'card-1',
            title: 'Classic Suite',
            description: 'Elegant comfort with stunning views',
            iconType: 'solid',
            solidIcon: 'bed',
            solidIconColor: '#c9a96e',
            price: '$350',
            period: '/night',
            features: [
              { id: 'f1', text: 'King-size luxury suite', included: true },
              { id: 'f2', text: 'Complimentary breakfast', included: true },
              { id: 'f3', text: 'Airport transfers', included: true },
              { id: 'f4', text: 'Wi-Fi access', included: true },
              { id: 'f5', text: 'Spa access', included: true },
              { id: 'f6', text: 'Private concierge', included: false },
              { id: 'f7', text: 'Safari excursion', included: false },
            ],
            highlighted: false,
            ctaText: 'Book Now',
            cta: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'card-2',
            title: 'Premium Villa',
            description: 'Private luxury with personal service',
            iconType: 'solid',
            solidIcon: 'home',
            solidIconColor: '#c9a96e',
            price: '$650',
            period: '/night',
            badgeText: 'Most Popular',
            features: [
              { id: 'f1', text: 'Private villa with pool', included: true },
              { id: 'f2', text: 'Gourmet breakfast & dinner', included: true },
              { id: 'f3', text: 'Private airport transfers', included: true },
              { id: 'f4', text: 'High-speed Wi-Fi', included: true },
              { id: 'f5', text: 'Full spa package', included: true },
              { id: 'f6', text: 'Dedicated concierge', included: true },
              { id: 'f7', text: 'Safari excursion', included: false },
            ],
            highlighted: true,
            ctaText: 'Book Now',
            cta: { type: 'url', url: '#section-contact' },
          },
          {
            id: 'card-3',
            title: 'Presidential Suite',
            description: 'The ultimate luxury experience',
            iconType: 'solid',
            solidIcon: 'crown',
            solidIconColor: '#c9a96e',
            price: '$1,200',
            period: '/night',
            features: [
              { id: 'f1', text: 'Expansive presidential suite', included: true },
              { id: 'f2', text: 'Full board fine dining', included: true },
              { id: 'f3', text: 'Luxury vehicle transfers', included: true },
              { id: 'f4', text: 'Complimentary mini-bar', included: true },
              { id: 'f5', text: 'Private spa & wellness', included: true },
              { id: 'f6', text: '24/7 personal concierge', included: true },
              { id: 'f7', text: 'Private safari experience', included: true },
            ],
            highlighted: false,
            ctaText: 'Book Now',
            cta: { type: 'url', url: '#section-contact' },
          },
        ],
      },
      settings: {
        backgroundColor: '#f5f0e8',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // CONTACT SECTION
    // ========================================
    {
      id: 'contact',
      type: 'contact',
      templateId: 'contact-modern',
      order: 8,
      content: {
        headline: 'Reserve Your Stay',
        subheadline: 'Ready to experience the pinnacle of luxury?',
        description: 'Contact us to check availability or customise your perfect getaway. Our reservations team is available to assist you.',
        email: 'reservations@thegrandretreat.com',
        phone: '+1 (555) 789-0123',
        address: '1 Grand Retreat Drive\nLuxury Bay, Paradise Island 00000',
        socialLinks: [
          { platform: 'Facebook', href: 'https://facebook.com/thegrandretreat' },
          { platform: 'Instagram', href: 'https://instagram.com/thegrandretreat' },
          { platform: 'Twitter', href: 'https://twitter.com/thegrandretreat' },
        ],
        showForm: true,
        formFields: [
          { id: 'name', name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name' },
          { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
          { id: 'checkin', name: 'checkin', label: 'Check-in Date', type: 'date', required: true, placeholder: '' },
          { id: 'checkout', name: 'checkout', label: 'Check-out Date', type: 'date', required: true, placeholder: '' },
          {
            id: 'room-type',
            name: 'roomType',
            label: 'Room Type',
            type: 'select',
            required: true,
            options: ['Classic Suite', 'Premium Villa', 'Presidential Suite', 'Not Sure Yet']
          },
          { id: 'message', name: 'message', label: 'Special Requests', type: 'textarea', required: false, placeholder: 'Tell us about any special requirements or preferences...' },
        ],
        submitButtonText: 'Request Reservation',
        successMessage: 'Thank you! Our reservations team will confirm your booking within 24 hours.',
        backgroundColor: '#1a1a2e',
        textColor: '#f5f0e8',
        accentColor: '#c9a96e',
        layout: 'centered',
        showMap: false,
      },
      settings: {
        backgroundColor: '#1a1a2e',
        animation: {
          enabled: true,
          type: 'fade',
          direction: 'up',
          speed: 'normal',
          duration: 600,
          delay: 100,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // ========================================
    // FOOTER
    // ========================================
    {
      id: generateSectionId('footer'),
      type: 'footer',
      templateId: 'footer-modern',
      order: 9,
      content: {
        logoType: 'text',
        companyName: 'The Grand Retreat',
        company: {
          name: 'The Grand Retreat',
          description: 'An exclusive luxury retreat offering world-class accommodation, exceptional dining, and unforgettable experiences in a breathtaking setting.',
        },
        email: 'reservations@thegrandretreat.com',
        phone: '+1 (555) 789-0123',
        address: '1 Grand Retreat Drive, Luxury Bay, Paradise Island 00000',
        businessHours: {
          enabled: true,
          showHours: true,
          title: 'Front Desk Hours',
          days: [
            { day: 'Monday - Sunday', hours: '24 Hours', isOpen: true },
          ],
          showPublicHolidays: true,
          publicHolidaysIsOpen: true,
          publicHolidaysHours: '24 Hours',
        },
        links: [
          {
            title: 'Accommodation',
            items: [
              { label: 'Classic Suite', type: 'url', url: '#section-inventory' },
              { label: 'Premium Villa', type: 'url', url: '#section-inventory' },
              { label: 'Presidential Suite', type: 'url', url: '#section-inventory' },
              { label: 'Special Offers', type: 'url', url: '#' },
            ],
          },
          {
            title: 'Amenities',
            items: [
              { label: 'Spa & Wellness', type: 'url', url: '#section-features' },
              { label: 'Fine Dining', type: 'url', url: '#section-features' },
              { label: 'Safari Excursions', type: 'url', url: '#section-features' },
              { label: 'Concierge', type: 'url', url: '#section-features' },
            ],
          },
          {
            title: 'Experiences',
            items: [
              { label: 'Gallery', type: 'url', url: '#section-about' },
              { label: 'Guest Reviews', type: 'url', url: '#testimonials' },
              { label: 'Our Story', type: 'url', url: '#section-about' },
              { label: 'Contact', type: 'url', url: '#section-contact' },
            ],
          },
        ],
        socialLinks: [
          { platform: 'Facebook', href: 'https://facebook.com/thegrandretreat' },
          { platform: 'Instagram', href: 'https://instagram.com/thegrandretreat' },
          { platform: 'Twitter', href: 'https://twitter.com/thegrandretreat' },
        ],
        copyright: '© 2025 The Grand Retreat. All rights reserved.',
        backgroundColor: '#1a1a2e',
        textColor: '#f5f0e8',
        accentColor: '#c9a96e',
      },
      settings: {
        backgroundColor: '#1a1a2e',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
};

/**
 * All available page templates
 */
export const PAGE_TEMPLATES: PageTemplate[] = [
  vehicleDealershipTemplate,
  tutoringCenterTemplate,
  gardenServiceTemplate,
  luxuryAccommodationTemplate,
];

/**
 * Get all available page templates
 */
export function getPageTemplates(): PageTemplate[] {
  return PAGE_TEMPLATES.filter(t => t.isAvailable);
}

/**
 * Get page templates by category
 */
export function getPageTemplatesByCategory(category: PageTemplate['category']): PageTemplate[] {
  return PAGE_TEMPLATES.filter(t => t.isAvailable && t.category === category);
}

/**
 * Get a page template by ID
 */
export function getPageTemplateById(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find(t => t.id === id);
}

/**
 * Apply a page template to create new sections with fresh IDs
 */
export function applyPageTemplate(templateId: string): PageSection[] | null {
  const template = getPageTemplateById(templateId);
  if (!template) return null;

  // Generate fresh IDs for all sections and update timestamps
  const now = Date.now();
  return template.sections.map((section, index) => ({
    ...section,
    id: generateSectionId(section.type),
    order: index + 1,
    createdAt: now,
    updatedAt: now,
  }));
}
