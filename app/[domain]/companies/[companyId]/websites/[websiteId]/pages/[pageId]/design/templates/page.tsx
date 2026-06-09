'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  ChevronRight,
  Car,
  Building2,
  Briefcase,
  ShoppingCart,
  Rocket,
  Check,
  X,
  Palette,
  Sun,
  Moon,
  Bed,
} from 'lucide-react';
import Link from 'next/link';
import { getPageTemplates, type PageTemplate, applyPageTemplate } from '@/lib/page-builder/templates/page-templates';
import type { PageSection } from '@/types/page-builder';

// Category icons
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dealership: Car,
  business: Building2,
  portfolio: Briefcase,
  ecommerce: ShoppingCart,
  landing: Rocket,
  accommodation: Bed,
};

// Category colors
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  dealership: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  business: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  portfolio: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  ecommerce: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  landing: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  accommodation: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

// Pre-defined color themes
const COLOR_THEMES = [
  {
    id: 'red',
    name: 'Bold Red',
    primary: '#dc2626',
    secondary: '#ef4444',
    preview: 'bg-gradient-to-br from-red-500 to-red-700',
  },
  {
    id: 'blue',
    name: 'Professional Blue',
    primary: '#2563eb',
    secondary: '#3b82f6',
    preview: 'bg-gradient-to-br from-blue-500 to-blue-700',
  },
  {
    id: 'green',
    name: 'Modern Green',
    primary: '#059669',
    secondary: '#10b981',
    preview: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
  },
  {
    id: 'purple',
    name: 'Elegant Purple',
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    preview: 'bg-gradient-to-br from-purple-500 to-purple-700',
  },
  {
    id: 'orange',
    name: 'Warm Orange',
    primary: '#ea580c',
    secondary: '#f97316',
    preview: 'bg-gradient-to-br from-orange-500 to-orange-700',
  },
];

interface ColorTheme {
  primary: string;
  secondary: string;
  darkMode?: boolean;
}

interface TemplateCardProps {
  template: PageTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const colors = CATEGORY_COLORS[template.category] || CATEGORY_COLORS.landing;

  return (
    <div
      onClick={onSelect}
      className={`
        relative group cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden
        ${isSelected
          ? 'border-indigo-500 ring-4 ring-indigo-500/20 shadow-xl shadow-indigo-500/10'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
        }
      `}
    >
      {/* Preview Image Area */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {template.previewImage ? (
          <img
            src={template.previewImage}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className={`
                w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3
                ${colors.bg}
              `}>
                {(() => {
                  const Icon = CATEGORY_ICONS[template.category] || Sparkles;
                  return <Icon className={`w-8 h-8 ${colors.text}`} />;
                })()}
              </div>
              <p className="text-sm text-slate-500">Preview Coming Soon</p>
            </div>
          </div>
        )}

        {/* Selected Badge */}
        {isSelected && (
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`
            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
            ${colors.bg} ${colors.text} ${colors.border} border
          `}>
            {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{template.name}</h3>
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{template.description}</p>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {template.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Color Theme Modal Component
interface ColorThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: PageTemplate | null;
  onApply: (theme: ColorTheme) => void;
  isApplying: boolean;
}

function ColorThemeModal({ isOpen, onClose, template, onApply, isApplying }: ColorThemeModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('red');
  const [customTheme, setCustomTheme] = useState<ColorTheme>({
    primary: '#dc2626',
    secondary: '#ef4444',
  });
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  if (!isOpen || !template) return null;

  const currentTheme = useCustomColors
    ? customTheme
    : COLOR_THEMES.find(t => t.id === selectedTheme) || COLOR_THEMES[0];

  const handleApply = () => {
    onApply({ ...currentTheme, darkMode });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center py-8 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-4 flex flex-col max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-emerald-100 bg-emerald-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Palette className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-emerald-800">Choose Your Theme</h2>
              <p className="text-sm text-emerald-600">Customize colors for {template.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dark/Light Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-slate-200" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-slate-900">Theme Mode</p>
                <p className="text-sm text-slate-600">{darkMode ? 'Dark mode - Sleek dark backgrounds' : 'Light mode - Clean bright backgrounds'}</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`
                relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200
                ${darkMode ? 'bg-slate-800' : 'bg-slate-300'}
              `}
            >
              <span
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200
                  ${darkMode ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Pre-selected Color Themes */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Color Themes
            </label>
            <div className="grid grid-cols-5 gap-3">
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedTheme(theme.id);
                    setUseCustomColors(false);
                  }}
                  className={`
                    relative group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200
                    ${!useCustomColors && selectedTheme === theme.id
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-xl ${theme.preview} shadow-lg`} />
                  <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                    {theme.name}
                  </span>
                  {!useCustomColors && selectedTheme === theme.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Custom Colors</p>
              <p className="text-sm text-slate-600">Use your own brand colors</p>
            </div>
            <button
              onClick={() => setUseCustomColors(!useCustomColors)}
              className={`
                relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200
                ${useCustomColors ? 'bg-emerald-600' : 'bg-slate-300'}
              `}
            >
              <span
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200
                  ${useCustomColors ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Custom Color Pickers */}
          {useCustomColors && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Primary</label>
                <div className="relative">
                  <input
                    type="color"
                    value={customTheme.primary}
                    onChange={(e) => setCustomTheme({ ...customTheme, primary: e.target.value })}
                    className="w-full h-12 rounded-xl cursor-pointer border-2 border-slate-200 hover:border-slate-300 transition-colors"
                  />
                  <div
                    className="absolute bottom-1 left-1 right-1 text-center text-xs font-mono text-white/80 pointer-events-none drop-shadow"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {customTheme.primary}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Secondary</label>
                <div className="relative">
                  <input
                    type="color"
                    value={customTheme.secondary}
                    onChange={(e) => setCustomTheme({ ...customTheme, secondary: e.target.value })}
                    className="w-full h-12 rounded-xl cursor-pointer border-2 border-slate-200 hover:border-slate-300 transition-colors"
                  />
                  <div
                    className="absolute bottom-1 left-1 right-1 text-center text-xs font-mono text-white/80 pointer-events-none drop-shadow"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {customTheme.secondary}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isApplying}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying...
              </span>
            ) : (
              'Use This Template'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Helper function to generate a light background color from primary color
function getLightBackgroundColor(primaryColor: string): string {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) return '#fef2f2'; // Default to light red

  // Create a very light version (95% white, 5% color)
  const r = Math.round(rgb.r * 0.1 + 255 * 0.9);
  const g = Math.round(rgb.g * 0.1 + 255 * 0.9);
  const b = Math.round(rgb.b * 0.1 + 255 * 0.9);

  return `rgb(${r}, ${g}, ${b})`;
}

// Dark and light mode color palettes
const LIGHT_MODE = {
  navbarBg: '#ffffff',
  navbarText: '#1f2937',
  heroBg: '#f8fafc', // Light background for light theme
  heroText: '#1f2937',
  logoTickerBg: '#ffffff',
  listingsBg: '#ffffff',
  listingsText: '#1f2937',
  aboutBg: '#f8fafc',
  aboutText: '#1e293b',
  contactBg: '#ffffff',
  contactText: '#1f2937',
  footerBg: '#f8fafc', // Light background for light theme
  footerText: '#1f2937',
};

const DARK_MODE = {
  navbarBg: '#ffffff', // Navbar stays light in dark mode
  navbarText: '#1f2937',
  heroBg: '#0a0a0a', // Dark hero
  heroText: '#ffffff',
  logoTickerBg: '#ffffff', // Light background
  listingsBg: '#ffffff', // Light background
  listingsText: '#1f2937',
  aboutBg: '#0f172a', // Dark about
  aboutText: '#f1f5f9',
  contactBg: '#ffffff', // Light background
  contactText: '#1f2937',
  footerBg: '#0f172a', // Dark footer
  footerText: '#e5e7eb',
};

// Helper function to apply color theme to sections
function applyColorThemeToSections(sections: PageSection[], theme: ColorTheme): PageSection[] {
  const mode = theme.darkMode ? DARK_MODE : LIGHT_MODE;

  return sections.map(section => {
    const updatedSection = { ...section };

    // Apply colors based on section type
    switch (section.type) {
      case 'navbar':
        updatedSection.content = {
          ...section.content,
          linkHoverColor: theme.primary,
          accentColor: theme.primary,
          backgroundColor: mode.navbarBg,
          textColor: mode.navbarText,
        };
        if (updatedSection.settings) {
          updatedSection.settings.backgroundColor = mode.navbarBg;
        }
        break;

      case 'hero':
        updatedSection.content = {
          ...section.content,
          accentColor: theme.primary,
          backgroundColor: mode.heroBg,
          textColor: mode.heroText,
        };
        if (section.content.stats) {
          updatedSection.content.stats = section.content.stats.map((stat: any) => ({
            ...stat,
            solidIconColor: theme.primary,
          }));
        }
        if (section.content.badges) {
          updatedSection.content.badges = section.content.badges.map((badge: any) => ({
            ...badge,
            iconColor: theme.primary,
          }));
        }
        if (updatedSection.settings) {
          updatedSection.settings.backgroundColor = mode.heroBg;
        }
        break;

      case 'logo-ticker':
        updatedSection.content = {
          ...section.content,
          backgroundColor: mode.logoTickerBg,
        };
        if (updatedSection.settings) {
          updatedSection.settings.backgroundColor = mode.logoTickerBg;
        }
        break;

      case 'listings-showcase':
        updatedSection.content = {
          ...section.content,
          accentColor: theme.primary,
          backgroundColor: mode.listingsBg,
          textColor: mode.listingsText,
        };
        if (updatedSection.settings) {
          updatedSection.settings.backgroundColor = mode.listingsBg;
        }
        break;

      case 'about':
        updatedSection.content = {
          ...section.content,
          ctaButtonBg: theme.primary,
          accentColor: theme.primary,
          backgroundColor: mode.aboutBg,
          textColor: mode.aboutText,
        };
        if (section.content.stats) {
          updatedSection.content.stats = section.content.stats.map((stat: any) => ({
            ...stat,
            solidIconColor: theme.primary,
          }));
        }
        if (section.content.featurePills) {
          updatedSection.content.featurePills = section.content.featurePills.map((pill: any) => ({
            ...pill,
            solidIconColor: theme.primary,
          }));
        }
        if (updatedSection.settings) {
          updatedSection.settings.backgroundColor = mode.aboutBg;
        }
        break;

      case 'contact':
        updatedSection.content = {
          ...section.content,
          accentColor: theme.primary,
          backgroundColor: mode.contactBg,
          textColor: mode.contactText,
        };
        if (updatedSection.settings) {
          updatedSection.settings.backgroundColor = mode.contactBg;
        }
        break;

      case 'footer':
        updatedSection.content = {
          ...section.content,
          accentColor: theme.primary,
          backgroundColor: mode.footerBg,
          textColor: mode.footerText,
        };
        if (updatedSection.settings) {
          updatedSection.settings.backgroundColor = mode.footerBg;
        }
        break;

      case 'features':
        updatedSection.content = {
          ...section.content,
          accentColor: theme.primary,
          backgroundColor: theme.darkMode ? '#0f172a' : '#f8fafc',
          textColor: theme.darkMode ? '#ffffff' : '#1f2937',
        };
        if (section.content.features) {
          updatedSection.content.features = section.content.features.map((feature: any) => ({
            ...feature,
            solidIconColor: theme.primary,
          }));
        }
        if (updatedSection.settings) {
          updatedSection.settings.backgroundColor = theme.darkMode ? '#0f172a' : '#f8fafc';
        }
        break;

      case 'testimonials':
        updatedSection.content = {
          ...section.content,
          accentColor: theme.primary,
          backgroundColor: theme.darkMode ? '#0f172a' : '#f8fafc',
          textColor: theme.darkMode ? '#ffffff' : '#1f2937',
        };
        if (updatedSection.settings) {
          updatedSection.settings.backgroundColor = theme.darkMode ? '#0f172a' : '#f8fafc';
        }
        break;

      case 'pricing':
        updatedSection.content = {
          ...section.content,
          accentColor: theme.primary,
          backgroundColor: theme.darkMode ? '#0f172a' : '#f8fafc',
          textColor: theme.darkMode ? '#ffffff' : '#1f2937',
          cardBackgroundColor: '#ffffff',
        };
        if (section.content.cards) {
          updatedSection.content.cards = section.content.cards.map((card: any) => ({
            ...card,
            solidIconColor: theme.primary,
          }));
        }
        if (updatedSection.settings) {
          updatedSection.settings.backgroundColor = theme.darkMode ? '#0f172a' : '#f8fafc';
        }
        break;

      default:
        // For other section types, just apply accent color if it exists
        if (updatedSection.content) {
          updatedSection.content = {
            ...section.content,
            accentColor: theme.primary,
          };
        }
    }

    return updatedSection;
  });
}

export default function TemplatesPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  const companyId = params.companyId as string;
  const websiteId = params.websiteId as string;

  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | null>(null);
  const [showColorModal, setShowColorModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Query page data - only fetch when user is available
  const page = useQuery(
    api.pages.getPageById,
    user ? { userId: user.id as any, pageId: pageId as any } : "skip"
  );
  const website = useQuery(
    api.websites.getWebsiteById,
    user ? { userId: user.id as any, websiteId: websiteId as any } : "skip"
  );
  const company = useQuery(
    api.companies.getByCompanyId,
    user ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const initializePageBuilder = useMutation(api.pages.initializePageBuilder);
  const updatePage = useMutation(api.pages.updatePage);

  // Get available templates
  const templates = getPageTemplates();

  const handleTemplateSelect = (template: PageTemplate) => {
    setSelectedTemplate(template);
    setShowColorModal(true);
  };

  const handleApplyTemplate = async (theme: ColorTheme) => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    setIsApplying(true);

    try {
      // First initialize the page builder
      await initializePageBuilder({
        userId: user?.id as any,
        pageId: pageId as any,
      });

      // Get the template sections
      const sections = applyPageTemplate(selectedTemplate.id);
      if (!sections) {
        throw new Error('Failed to apply template');
      }

      // Apply the color theme to all sections
      const themedSections = applyColorThemeToSections(sections, theme);

      // Create the page content
      const pageContent = {
        sections: themedSections,
        version: '1.0' as const,
        lastModified: Date.now(),
      };

      // Save to the page
      await updatePage({
        userId: user?.id as any,
        pageId: pageId as any,
        content: JSON.stringify(pageContent),
        contentType: 'pageBuilder',
      });

      toast.success('Template applied successfully!');
      setShowColorModal(false);
      router.push(`/companies/${companyId}/websites/${websiteId}/pages/${pageId}/canvas`);
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading || (!page && page !== undefined)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Page Not Found</h2>
          <p className="text-slate-600">The page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 text-sm">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors">
              Companies
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors">
              {company?.name}
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/websites`} className="text-slate-500 hover:text-slate-700 transition-colors">
              Websites
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700">{website?.name || 'Website'}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/websites/${websiteId}/pages`} className="text-slate-500 hover:text-slate-700 transition-colors">
              Pages
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/websites/${websiteId}/pages/${pageId}/design`} className="text-slate-500 hover:text-slate-700 transition-colors">
              Design
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Templates</span>
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${companyId}/websites/${websiteId}/pages/${pageId}/design`}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Choose a Template</h1>
              <p className="text-sm text-slate-600">{page.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Banner */}
        <div className="mb-10 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Professional Templates</h3>
              <p className="text-sm text-slate-600">
                Our templates are designed by professionals and optimized for conversions.
                Click on a template to customize colors and apply it to your page.
              </p>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate?.id === template.id}
              onSelect={() => handleTemplateSelect(template)}
            />
          ))}
        </div>

        {/* Coming Soon Templates */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">More Templates Coming Soon</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Business Professional', 'Creative Portfolio', 'E-Commerce Store'].map((name) => (
              <div
                key={name}
                className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">{name}</h3>
                <p className="text-sm text-slate-500">Coming soon</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Color Theme Modal */}
      <ColorThemeModal
        isOpen={showColorModal}
        onClose={() => setShowColorModal(false)}
        template={selectedTemplate}
        onApply={handleApplyTemplate}
        isApplying={isApplying}
      />
    </div>
  );
}
