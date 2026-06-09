'use client';

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
  Image,
  Wrench,
  Package,
  Wand2,
  Code,
  Calendar,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionType } from '@/types/page-builder';

interface CategoryOption {
  type: SectionType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isAvailable: boolean;
  templateCount: number;
}

const SECTION_CATEGORIES: CategoryOption[] = [
  {
    type: 'ai-generated',
    name: 'Generate with AI',
    description: 'Coming soon',
    icon: Wand2,
    isAvailable: false,
    templateCount: 1,
  },
  {
    type: 'custom-code',
    name: 'Custom Code',
    description: 'Add your own HTML/CSS code',
    icon: Code,
    isAvailable: true,
    templateCount: 1,
  },
  {
    type: 'navbar',
    name: 'Navbar',
    description: 'Navigation bar with mobile menu',
    icon: Menu,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'hero',
    name: 'Hero',
    description: 'Eye-catching header sections',
    icon: Sparkles,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'about',
    name: 'About',
    description: 'Tell your story and build trust',
    icon: Users,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'features',
    name: 'Features',
    description: 'Showcase product features',
    icon: LayoutGrid,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'testimonials',
    name: 'Testimonials',
    description: 'Customer reviews and feedback',
    icon: MessageSquare,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'contact',
    name: 'Contact',
    description: 'Contact forms and information',
    icon: Mail,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'pricing',
    name: 'Pricing',
    description: 'Display pricing plans',
    icon: CreditCard,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'footer',
    name: 'Footer',
    description: 'Site footer with links',
    icon: Minimize2,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'listings-showcase',
    name: 'Listings Showcase',
    description: 'Display vehicle listings with filters',
    icon: Car,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'property-showcase',
    name: 'Property Showcase',
    description: 'Display property listings for your company',
    icon: Home,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'service-showcase',
    name: 'Service Showcase',
    description: 'Display your services with pricing',
    icon: Wrench,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'product-showcase',
    name: 'Product Showcase',
    description: 'Display your products catalog',
    icon: Package,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'logo-ticker',
    name: 'Logo Ticker',
    description: 'Display partner or client logos',
    icon: Image,
    isAvailable: true,
    templateCount: 2,
  },
  {
    type: 'booking-system',
    name: 'Booking System',
    description: 'Service booking with availability',
    icon: Calendar,
    isAvailable: true,
    templateCount: 1,
  },
];

interface CategoryStepProps {
  selectedType: SectionType | null;
  onTypeSelect: (type: SectionType) => void;
}

export function CategoryStep({ selectedType, onTypeSelect }: CategoryStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose a Section Type</h3>
        <p className="text-sm text-slate-600">
          Select the type of section you want to add to your page
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {SECTION_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedType === category.type;
          const isDisabled = !category.isAvailable;

          return (
            <button
              key={category.type}
              onClick={() => category.isAvailable && onTypeSelect(category.type)}
              disabled={isDisabled}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                isSelected && category.isAvailable
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-200'
                  : category.isAvailable
                  ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed',
                isDisabled && 'cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'p-2.5 rounded-lg flex-shrink-0',
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : isDisabled
                      ? 'bg-slate-200 text-slate-400'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">{category.name}</h4>
                    {!category.isAvailable && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                        <Clock className="h-3 w-3" />
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1">
                    {category.description}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {category.templateCount} template{category.templateCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-xs text-slate-600">
          <span className="font-medium">Tip:</span> More section types will be available soon.
          Currently, Navbar, Hero, About, Features, Testimonials, Contact, Pricing, Footer, Listings Showcase, and Logo Ticker sections are fully functional.
        </p>
      </div>
    </div>
  );
}
