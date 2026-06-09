'use client';

import { useState } from 'react';
import { useAuthGuard, useAuth } from '@/app/[domain]/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Building2,
  Users,
  Shield,
  ChevronRight,
  Grid3X3,
  Plug,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';

const adminCards = [
  {
    title: 'Companies',
    description: 'Manage all companies in the database',
    icon: Building2,
    href: '/admin/companies',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'},
  {
    title: 'Users',
    description: 'Manage all users, roles, and permissions',
    icon: Users,
    href: '/admin/users',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200'},
  {
    title: 'Manage Apps',
    description: 'Configure app pricing and payment settings',
    icon: Grid3X3,
    href: '/admin/apps',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200'},
  {
    title: 'Integrations',
    description: 'Configure third-party integrations like BobGo, payment gateways',
    icon: Plug,
    href: '/admin/integrations',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
  },
  {
    title: 'Site Settings',
    description: 'Manage Find Accommodation site mode, payments, and notifications',
    icon: Settings,
    href: '/admin/site-settings',
    color: 'from-slate-500 to-slate-600',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
  },
];

export default function AdminPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const { domain } = useAuth();
  const router = useRouter();
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  // Get user's companies for navigation
  const companies = useQuery(api.companies.getCompaniesByUser, {
    userId: user?.id as any,
  });
  const defaultCompany = companies?.[0];

  useEffect(() => {
    if (!isLoading && (!user || (user.userType !== 'admin' && user.userType !== 'administrator'))) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || (user.userType !== 'admin' && user.userType !== 'administrator')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm">
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Admin Panel</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                {/* Admin Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20">
                  <Shield className="h-7 w-7 text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Admin Panel
                  </h1>
                  <p className="text-slate-600 text-base">
                    Manage your platform
                  </p>
                </div>
              </div>

              {/* Menu Button */}
              {defaultCompany && <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Welcome back, {user.firstName}
          </h2>
          <p className="text-slate-600 text-base">
            Select an option below to manage your platform
          </p>
        </div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group relative bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 text-base">{card.title}</h4>
                    <p className="text-sm text-slate-500 truncate">{card.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Navigation Side Sheet */}
      {defaultCompany && (
        <NavigationSideSheet
          isOpen={isSideSheetOpen}
          onClose={() => setIsSideSheetOpen(false)}
          companyId={defaultCompany._id}
          companyName={defaultCompany.name}
        />
      )}
    </div>
  );
}
