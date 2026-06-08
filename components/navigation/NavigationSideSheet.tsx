'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import {
  UserCircle as UserGroupIcon,
  PhoneCall,
  KanbanSquare,
  Activity,
  Wrench,
  Receipt,
  FileSpreadsheet,
  CreditCard,
  GitBranch,
  Users as PeopleIcon,
  Globe,
  MessageSquare,
  Network,
  FolderOpen,
  ShoppingCart,
  Calendar,
  Truck,
} from 'lucide-react';

// Color variant configuration
type ColorVariant = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'teal' | 'orange' | 'indigo' | 'pink' | 'slate';

interface ColorConfig {
  iconBg: string;
  hoverBg: string;
}

const colorConfigs: Record<ColorVariant, ColorConfig> = {
  blue: {
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-700',
    hoverBg: 'hover:bg-blue-50',
  },
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    hoverBg: 'hover:bg-emerald-50',
  },
  violet: {
    iconBg: 'bg-gradient-to-br from-violet-500 to-violet-700',
    hoverBg: 'hover:bg-violet-50',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-700',
    hoverBg: 'hover:bg-amber-50',
  },
  rose: {
    iconBg: 'bg-gradient-to-br from-rose-500 to-rose-700',
    hoverBg: 'hover:bg-rose-50',
  },
  cyan: {
    iconBg: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
    hoverBg: 'hover:bg-cyan-50',
  },
  teal: {
    iconBg: 'bg-gradient-to-br from-teal-500 to-teal-700',
    hoverBg: 'hover:bg-teal-50',
  },
  orange: {
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-700',
    hoverBg: 'hover:bg-orange-50',
  },
  indigo: {
    iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
    hoverBg: 'hover:bg-indigo-50',
  },
  pink: {
    iconBg: 'bg-gradient-to-br from-pink-500 to-pink-700',
    hoverBg: 'hover:bg-pink-50',
  },
  slate: {
    iconBg: 'bg-gradient-to-br from-slate-500 to-slate-700',
    hoverBg: 'hover:bg-slate-50',
  },
};

interface NavItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  color: ColorVariant;
  category: string;
  requiredApp?: 'businessTools' | 'websites' | 'vehicleDealership' | 'onlineStore' | 'bookingsApp' | 'realEstate' | null;
}

interface NavigationSideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  enabledApps?: Record<string, { enabled: boolean; enabledAt?: number }>;
}

export function NavigationSideSheet({ isOpen, onClose, companyId, companyName, enabledApps = {} }: NavigationSideSheetProps) {
  // Prevent body scroll when side sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Check if an app is enabled
  const isAppEnabled = (appKey: string | null | undefined): boolean => {
    if (!appKey) return true; // No app requirement = always visible
    return enabledApps[appKey]?.enabled || false;
  };

  const allNavItems: NavItem[] = [
    // CRM - Business Tools
    {
      id: 'products',
      title: 'Products',
      description: 'Manage your product catalog and inventory.',
      icon: ShoppingCart,
      link: `/companies/${companyId}/crm/products`,
      color: 'orange',
      category: 'CRM',
      requiredApp: 'businessTools',
    },
    {
      id: 'services',
      title: 'Services',
      description: 'Manage service offerings, scheduling, and appointments.',
      icon: Wrench,
      link: `/companies/${companyId}/crm/services`,
      color: 'cyan',
      category: 'CRM',
      requiredApp: 'businessTools',
    },
    {
      id: 'clients',
      title: 'Clients',
      description: 'Manage client relationships, contacts, and account information.',
      icon: UserGroupIcon,
      link: `/companies/${companyId}/crm/clients`,
      color: 'blue',
      category: 'CRM',
      requiredApp: 'businessTools',
    },
    {
      id: 'leads',
      title: 'Leads',
      description: 'Track and manage customer leads, inquiries, and conversions.',
      icon: PhoneCall,
      link: `/companies/${companyId}/crm/leads`,
      color: 'emerald',
      category: 'CRM',
      requiredApp: 'businessTools',
    },
    {
      id: 'activities',
      title: 'Activities',
      description: 'Track all activities, calls, meetings, and interactions.',
      icon: Activity,
      link: `/companies/${companyId}/crm/activities`,
      color: 'violet',
      category: 'CRM',
      requiredApp: 'businessTools',
    },
    {
      id: 'pipeline',
      title: 'Pipeline',
      description: 'Visualize and manage your sales pipeline and deal stages.',
      icon: KanbanSquare,
      link: `/companies/${companyId}/crm/pipeline`,
      color: 'indigo',
      category: 'CRM',
      requiredApp: 'businessTools',
    },
    {
      id: 'quotes',
      title: 'Quotes',
      description: 'Create and manage price quotes for potential customers.',
      icon: Receipt,
      link: `/companies/${companyId}/crm/quotes`,
      color: 'rose',
      category: 'CRM',
      requiredApp: 'businessTools',
    },
    {
      id: 'invoices',
      title: 'Invoices',
      description: 'Generate and track invoices for your customers.',
      icon: FileSpreadsheet,
      link: `/companies/${companyId}/crm/invoices`,
      color: 'pink',
      category: 'CRM',
      requiredApp: 'businessTools',
    },
    {
      id: 'transactions',
      title: 'Transactions',
      description: 'Track payments, balances, and financial activity.',
      icon: CreditCard,
      link: `/companies/${companyId}/crm/transactions`,
      color: 'teal',
      category: 'CRM',
      requiredApp: 'businessTools',
    },
    // Organization - Always visible (Branches, Departments) + Business Tools items
    {
      id: 'branches',
      title: 'Branches',
      description: 'Manage and organize your company branches, locations, and facilities.',
      icon: GitBranch,
      link: `/companies/${companyId}/crm/branches`,
      color: 'slate',
      category: 'Organization',
      requiredApp: null, // Always visible
    },
    {
      id: 'departments',
      title: 'Departments',
      description: 'Manage organizational departments and assign them to branches.',
      icon: Network,
      link: `/companies/${companyId}/crm/departments`,
      color: 'violet',
      category: 'Organization',
      requiredApp: null, // Always visible
    },
    {
      id: 'team',
      title: 'Team Members',
      description: 'Manage your team structure, departments, and organizational hierarchy.',
      icon: PeopleIcon,
      link: `/companies/${companyId}/crm/team`,
      color: 'indigo',
      category: 'Organization',
      requiredApp: 'businessTools',
    },
    {
      id: 'messaging',
      title: 'Messaging',
      description: 'Instant messaging and real-time communication with your team.',
      icon: MessageSquare,
      link: `/companies/${companyId}/crm/messaging`,
      color: 'emerald',
      category: 'Organization',
      requiredApp: 'businessTools',
    },
    {
      id: 'file-manager',
      title: 'File Manager',
      description: 'Manage files, folders, and media library.',
      icon: FolderOpen,
      link: `/file-manager`,
      color: 'blue',
      category: 'Organization',
      requiredApp: 'businessTools',
    },
    // Online store - Online Store
    {
      id: 'orders',
      title: 'Orders',
      description: 'Manage customer orders and fulfillment.',
      icon: Receipt,
      link: `/companies/${companyId}/store/orders`,
      color: 'blue',
      category: 'Online store',
      requiredApp: 'onlineStore',
    },
    {
      id: 'shipping',
      title: 'Shipping',
      description: 'Manage shipping and delivery.',
      icon: Truck,
      link: `/companies/${companyId}/store/shipping`,
      color: 'emerald',
      category: 'Online store',
      requiredApp: 'onlineStore',
    },
    // Booking system - Bookings App
    {
      id: 'appointments',
      title: 'Appointments',
      description: 'Manage appointment scheduling and bookings.',
      icon: Calendar,
      link: `/companies/${companyId}/bookings/appointments`,
      color: 'cyan',
      category: 'Booking system',
      requiredApp: 'bookingsApp',
    },
    // Marketing - Websites
    {
      id: 'websites',
      title: 'Websites',
      description: 'Manage and monitor all your company websites from one place.',
      icon: Globe,
      link: `/companies/${companyId}/websites`,
      color: 'blue',
      category: 'Marketing',
      requiredApp: 'websites',
    },
  ];

  // Filter nav items based on enabled apps
  const navItems = allNavItems.filter(item => isAppEnabled(item.requiredApp));

  // Get unique categories from filtered items
  const categories = Array.from(new Set(navItems.map(item => item.category)));

  return (
    <>
      {/* Side Sheet Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Side Sheet */}
      <div
        className={`fixed top-0 left-0 h-full w-full md:max-w-[430px] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{companyName}</h2>
                <p className="text-xs text-slate-300">Navigation Menu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {categories.map((category) => (
              <div key={category} className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {navItems
                    .filter(item => item.category === category)
                    .map((item) => {
                      const Icon = item.icon;
                      const colors = colorConfigs[item.color];
                      return (
                        <Link
                          key={item.id}
                          href={item.link}
                          onClick={onClose}
                          className={`group flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 ${colors.hoverBg}`}
                        >
                          <div className={`w-11 h-11 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">{item.description}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer - Hidden on mobile */}
          <div className="hidden md:block border-t border-slate-200 px-6 py-4 bg-slate-50">
            <Link
              href={`/companies/${companyId}/manage`}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 bg-white rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <Building2 className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// Navigation button component
interface NavigationMenuButtonProps {
  onClick: () => void;
}

export function NavigationMenuButton({ onClick }: NavigationMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-3 sm:py-2 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-lg shadow-slate-900/10 border border-slate-200"
    >
      <svg className="h-5 w-5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <span className="hidden sm:inline text-sm">Menu</span>
    </button>
  );
}
