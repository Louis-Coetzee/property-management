'use client';

// NOTE: All links within [domain] routes should NOT include ${domain} in hrefs
// Next.js App Router automatically handles the domain segment

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../AuthProvider';
import Link from 'next/link';
import {
  Building2,
  ChevronRight,
  UserCircle as UserGroupIcon,
  PhoneCall,
  KanbanSquare,
  Wrench,
  Receipt,
  FileSpreadsheet,
  CreditCard,
  GitBranch,
  Network,
  Users as PeopleIcon,
  MessageSquare,
  Globe,
  FolderOpen,
  Users,
  ShoppingCart,
  Calendar,
  Truck,
  Briefcase,
} from 'lucide-react';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';
import { hasCardAccess } from '@/lib/card-permissions';
import type { CardPermissionsMap } from '@/lib/card-permissions';

interface CardData {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  hoverBorder: string;
  hoverShadow: string;
}

function NavCard({ title, description, icon: Icon, href, gradient, hoverBorder, hoverShadow }: CardData) {
  return (
    <Link href={href} className="group">
      <div className={`py-4 px-4 bg-white rounded-xl border border-slate-200 ${hoverBorder} ${hoverShadow} transition-all duration-200 h-full`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${gradient} flex items-center justify-center flex-shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
            <p className="text-xs text-slate-500 truncate">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CompanyManagePage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const enabledApps = company?.enabledApps || {};
  const isBusinessToolsEnabled = enabledApps.businessTools?.enabled || false;
  const isWebsitesEnabled = enabledApps.websites?.enabled || false;
  const isOnlineStoreEnabled = enabledApps.onlineStore?.enabled || false;
  const isBookingsAppEnabled = enabledApps.bookingsApp?.enabled || false;

  const cardPermissions: CardPermissionsMap = (company as any)?.cardPermissions || {};
  const userRole = (company as any)?.userRole || 'member';
  const hasFullAccess = userRole === 'admin' || userRole === 'owner';

  const canAccessCard = (cardKey: string): boolean => {
    if (hasFullAccess) return true;
    return hasCardAccess(cardPermissions, cardKey, 'read');
  };

  const allCards: CardData[] = [
    ...(canAccessCard('team') ? [{
      id: 'team',
      category: 'organization',
      title: 'Team',
      description: 'Team member management',
      icon: Users,
      href: `/companies/${companyId}/crm/team`,
      gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
      hoverBorder: 'hover:border-indigo-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-indigo-500/20',
    }] : []),
    ...([{
      id: 'analytics',
      category: 'organization',
      title: 'Analytics',
      description: 'Business insights and reports',
      icon: Network,
      href: `/companies/${companyId}/crm/analytics`,
      gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
      hoverBorder: 'hover:border-cyan-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-cyan-500/20',
    }]),
    ...([{
      id: 'social',
      category: 'marketing',
      title: 'Social Media',
      description: 'Manage social media accounts',
      icon: MessageSquare,
      href: `/companies/${companyId}/crm/social`,
      gradient: 'bg-gradient-to-br from-pink-500 to-pink-700',
      hoverBorder: 'hover:border-pink-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-pink-500/20',
    }]),
    ...(canAccessCard('departments') ? [{
      id: 'departments',
      category: 'organization',
      title: 'Departments',
      description: 'Organize team into groups',
      icon: GitBranch,
      href: `/companies/${companyId}/crm/departments`,
      gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
      hoverBorder: 'hover:border-violet-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-violet-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('products') ? [{
      id: 'products',
      category: 'crm',
      title: 'Products',
      description: 'Product catalog management',
      icon: ShoppingCart,
      href: `/companies/${companyId}/crm/products`,
      gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
      hoverBorder: 'hover:border-orange-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-orange-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('services') ? [{
      id: 'services',
      category: 'crm',
      title: 'Services',
      description: 'Service offerings',
      icon: Wrench,
      href: `/companies/${companyId}/crm/services`,
      gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
      hoverBorder: 'hover:border-cyan-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-cyan-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('clients') ? [{
      id: 'clients',
      category: 'crm',
      title: 'Clients',
      description: 'Manage client relationships',
      icon: UserGroupIcon,
      href: `/companies/${companyId}/crm/clients`,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
      hoverBorder: 'hover:border-blue-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-blue-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('leads') ? [{
      id: 'leads',
      category: 'crm',
      title: 'Leads',
      description: 'Track leads and conversions',
      icon: PhoneCall,
      href: `/companies/${companyId}/crm/leads`,
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      hoverBorder: 'hover:border-emerald-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-emerald-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('pipeline') ? [{
      id: 'pipeline',
      category: 'crm',
      title: 'Pipeline',
      description: 'Sales pipeline management',
      icon: KanbanSquare,
      href: `/companies/${companyId}/crm/pipeline`,
      gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
      hoverBorder: 'hover:border-indigo-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-indigo-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('quotes') ? [{
      id: 'quotes',
      category: 'crm',
      title: 'Quotes',
      description: 'Price quote management',
      icon: Receipt,
      href: `/companies/${companyId}/crm/quotes`,
      gradient: 'bg-gradient-to-br from-rose-500 to-rose-700',
      hoverBorder: 'hover:border-rose-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-rose-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('invoices') ? [{
      id: 'invoices',
      category: 'crm',
      title: 'Invoices',
      description: 'Invoice generation and tracking',
      icon: FileSpreadsheet,
      href: `/companies/${companyId}/crm/invoices`,
      gradient: 'bg-gradient-to-br from-pink-500 to-pink-700',
      hoverBorder: 'hover:border-pink-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-pink-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('payments') ? [{
      id: 'transactions',
      category: 'crm',
      title: 'Transactions',
      description: 'Track payments, balances, and financial activity',
      icon: CreditCard,
      href: `/companies/${companyId}/crm/transactions`,
      gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
      hoverBorder: 'hover:border-teal-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-teal-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('suppliers') ? [{
      id: 'suppliers',
      category: 'crm',
      title: 'Suppliers',
      description: 'Manage suppliers and vendors',
      icon: Truck,
      href: `/companies/${companyId}/crm/suppliers`,
      gradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
      hoverBorder: 'hover:border-amber-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-amber-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('messaging') ? [{
      id: 'messaging',
      category: 'crm',
      title: 'Messaging',
      description: 'Send and manage messages',
      icon: MessageSquare,
      href: `/companies/${companyId}/crm/messaging`,
      gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
      hoverBorder: 'hover:border-cyan-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-cyan-500/20',
    }] : []),
    ...(isBusinessToolsEnabled && canAccessCard('fileManager') ? [{
      id: 'fileManager',
      category: 'crm',
      title: 'File Manager',
      description: 'Manage and share files',
      icon: FolderOpen,
      href: `/file-manager`,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
      hoverBorder: 'hover:border-blue-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-blue-500/20',
    }] : []),
    ...(isOnlineStoreEnabled && canAccessCard('orders') ? [{
      id: 'orders',
      category: 'store',
      title: 'Orders',
      description: 'Order management',
      icon: Receipt,
      href: `/companies/${companyId}/store/orders`,
      gradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
      hoverBorder: 'hover:border-amber-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-amber-500/20',
    }] : []),
    ...(isOnlineStoreEnabled && canAccessCard('products') ? [{
      id: 'store-products',
      category: 'store',
      title: 'Products',
      description: 'Store product management',
      icon: ShoppingCart,
      href: `/companies/${companyId}/store/products`,
      gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
      hoverBorder: 'hover:border-orange-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-orange-500/20',
    }] : []),
    ...(isOnlineStoreEnabled && canAccessCard('shipping') ? [{
      id: 'shipping',
      category: 'store',
      title: 'Shipping',
      description: 'Delivery settings and rates',
      icon: Truck,
      href: `/companies/${companyId}/store/shipping`,
      gradient: 'bg-gradient-to-br from-rose-500 to-rose-700',
      hoverBorder: 'hover:border-rose-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-rose-500/20',
    }] : []),
    ...(isBookingsAppEnabled && canAccessCard('appointments') ? [{
      id: 'appointments',
      category: 'bookings',
      title: 'Appointments',
      description: 'Booking appointments',
      icon: Calendar,
      href: `/companies/${companyId}/bookings/appointments`,
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
      hoverBorder: 'hover:border-purple-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-purple-500/20',
    }] : []),
    ...(isBookingsAppEnabled && canAccessCard('consultants') ? [{
      id: 'consultants',
      category: 'bookings',
      title: 'Consultants',
      description: 'Manage staff and consultants',
      icon: PeopleIcon,
      href: `/companies/${companyId}/crm/consultants`,
      gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
      hoverBorder: 'hover:border-violet-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-violet-500/20',
    }] : []),
    ...(isWebsitesEnabled && canAccessCard('websites') ? [{
      id: 'websites',
      category: 'marketing',
      title: 'Websites',
      description: 'Company website management',
      icon: Globe,
      href: `/companies/${companyId}/websites`,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
      hoverBorder: 'hover:border-blue-300',
      hoverShadow: 'hover:shadow-lg hover:shadow-blue-500/20',
    }] : []),
  ];

  const filterTags = [
    { id: 'all', label: 'All' },
    { id: 'organization', label: 'Organization' },
    ...(isBusinessToolsEnabled ? [{ id: 'crm', label: 'CRM' }] : []),
    ...(isOnlineStoreEnabled ? [{ id: 'store', label: 'Online store' }] : []),
    ...(isBookingsAppEnabled ? [{ id: 'bookings', label: 'Booking system' }] : []),
    ...(true ? [{ id: 'marketing', label: 'Marketing' }] : []),
  ];

  const filteredCards = allCards.filter(card => {
    const matchesFilter = activeFilter === 'all' || card.category === activeFilter;
    const matchesSearch = searchQuery === '' || 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h2>
          <p className="text-gray-600">The requested company could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 text-sm overflow-x-auto">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              Companies
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap">{company.name}</span>
          </div>

          <div className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${company.enabled ? 'bg-[#00072e] shadow-lg shadow-[#00072e]/20' : 'bg-slate-200'}`}>
                    <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white shadow-sm" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#00072e] tracking-tight truncate">
                    {company.name}
                  </h1>
                  <p className="text-sm text-slate-600 hidden sm:block">
                    Manage your business operations
                  </p>
                </div>
              </div>
              <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
            </div>
          </div>

          {/* Search */}
          <div className="pb-3">
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Filter Tags */}
          <div className="border-t border-slate-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mb-px py-3">
              {filterTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setActiveFilter(tag.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                    activeFilter === tag.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tag.label}
                  {tag.id !== 'all' && (
                    <span className="ml-2 text-xs opacity-70">
                      ({allCards.filter(c => c.category === tag.id).length})
                    </span>
                  )}
                  {tag.id === 'all' && (
                    <span className="ml-2 text-xs opacity-70">({allCards.length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCards.map((card) => (
              <NavCard key={card.id} {...card} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">No apps available in this category.</p>
          </div>
        )}
      </div>

      {isSideSheetOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setIsSideSheetOpen(false)}
        />
      )}

      <NavigationSideSheet
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        companyId={companyId}
        companyName={company?.name || ''}
      />
    </div>
  );
}