'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import {
  Shield,
  Users,
  Building2,
  LayoutDashboard,
  LogOut,
  PhoneCall,
  KanbanSquare,
  Activity,
  Wrench,
  Settings,
  Receipt,
  FileSpreadsheet,
  CreditCard,
  GitBranch,
  Network,
  MessageSquare,
  FolderOpen,
  Globe,
} from 'lucide-react';

// Color variant configuration (same as NavigationSideSheet)
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
}

interface AdminNavigationSideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  companyId: string;
  companyName: string;
}

export function AdminNavigationSideSheet({ isOpen, onClose, domain, companyId, companyName }: AdminNavigationSideSheetProps) {
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

  const navItems: NavItem[] = [
    // CRM
    {
      id: 'clients',
      title: 'Clients',
      description: 'Manage client relationships, contacts, and account information.',
      icon: Users,
      link: `/companies/${companyId}/crm/clients`,
      color: 'blue',
      category: 'CRM',
    },
    {
      id: 'leads',
      title: 'Leads',
      description: 'Track and manage customer leads, inquiries, and conversions.',
      icon: PhoneCall,
      link: `/companies/${companyId}/crm/leads`,
      color: 'emerald',
      category: 'CRM',
    },
    {
      id: 'pipeline',
      title: 'Pipeline',
      description: 'Visualize and manage your sales pipeline and deal stages.',
      icon: KanbanSquare,
      link: `/companies/${companyId}/crm/pipeline`,
      color: 'indigo',
      category: 'CRM',
    },
    {
      id: 'activities',
      title: 'Activities',
      description: 'Track all activities, calls, meetings, and interactions.',
      icon: Activity,
      link: `/companies/${companyId}/crm/activities`,
      color: 'violet',
      category: 'CRM',
    },
    // Inventory
    {
      id: 'vehicles',
      title: 'Vehicles',
      description: 'Create and manage your vehicle inventory and catalog.',
      icon: Building2,
      link: `/companies/${companyId}/crm/listings`,
      color: 'orange',
      category: 'Inventory',
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'Manage parts inventory, suppliers, and stock levels.',
      icon: Wrench,
      link: `/companies/${companyId}/crm/parts`,
      color: 'amber',
      category: 'Inventory',
    },
    // Services
    {
      id: 'services',
      title: 'Services',
      description: 'Manage service offerings, scheduling, and appointments.',
      icon: Settings,
      link: `/companies/${companyId}/crm/services`,
      color: 'cyan',
      category: 'Services',
    },
    // Sales
    {
      id: 'quotes',
      title: 'Quotes',
      description: 'Create and manage price quotes for potential customers.',
      icon: Receipt,
      link: `/companies/${companyId}/crm/quotes`,
      color: 'rose',
      category: 'Sales',
    },
    {
      id: 'invoices',
      title: 'Invoices',
      description: 'Generate and track invoices for your customers.',
      icon: FileSpreadsheet,
      link: `/companies/${companyId}/crm/invoices`,
      color: 'pink',
      category: 'Sales',
    },
    {
      id: 'transactions',
      title: 'Transactions',
      description: 'Track payments, balances, and financial activity.',
      icon: CreditCard,
      link: `/companies/${companyId}/crm/transactions`,
      color: 'teal',
      category: 'Sales',
    },
    // Organization
    {
      id: 'branches',
      title: 'Branches',
      description: 'Manage and organize your company branches, locations, and facilities.',
      icon: GitBranch,
      link: `/companies/${companyId}/crm/branches`,
      color: 'slate',
      category: 'Organization',
    },
    {
      id: 'departments',
      title: 'Departments',
      description: 'Manage organizational departments and assign them to branches.',
      icon: Network,
      link: `/companies/${companyId}/crm/departments`,
      color: 'violet',
      category: 'Organization',
    },
    {
      id: 'team',
      title: 'Team Members',
      description: 'Manage your team structure, departments, and organizational hierarchy.',
      icon: Users,
      link: `/companies/${companyId}/crm/team`,
      color: 'blue',
      category: 'Organization',
    },
    // Communication
    {
      id: 'messaging',
      title: 'Messaging',
      description: 'Instant messaging and real-time communication with your team.',
      icon: MessageSquare,
      link: `/companies/${companyId}/crm/messaging`,
      color: 'emerald',
      category: 'Communication',
    },
    {
      id: 'file-manager',
      title: 'File Manager',
      description: 'Manage files, folders, and media library.',
      icon: FolderOpen,
      link: '/file-manager',
      color: 'blue',
      category: 'Communication',
    },
    // Digital / Marketing
    {
      id: 'websites',
      title: 'Websites',
      description: 'Manage and monitor all your company websites from one place.',
      icon: Globe,
      link: `/companies/${companyId}/crm/websites`,
      color: 'indigo',
      category: 'Digital / Marketing',
    },
  ];

  // Group items by category
  const categories = Array.from(new Set(navItems.map(item => item.category)));

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Sheet */}
      <div
        className={`fixed top-0 left-0 h-full w-[360px] sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 py-5 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{companyName}</h2>
                <p className="text-xs text-slate-300">Navigation Menu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-4 py-6">
          {categories.map((category) => (
            <div key={category} className="mb-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                {category}
              </h3>
              <div className="space-y-1">
                {navItems
                  .filter(item => item.category === category)
                  .map((item) => {
                    const Icon = item.icon;
                    const config = colorConfigs[item.color];
                    return (
                      <Link
                        key={item.id}
                        href={`/${domain}${item.link}`}
                        onClick={onClose}
                        className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all ${config.hoverBg} group`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg} shadow-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-slate-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 flex-shrink-0 mt-1" />
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-4 py-4">
          <Link
            href={`/${domain}/dashboard`}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 transition-all group"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-slate-700">Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </>
  );
}

interface AdminNavigationMenuButtonProps {
  onClick: () => void;
}

export function AdminNavigationMenuButton({ onClick }: AdminNavigationMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
      title="Open menu"
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
