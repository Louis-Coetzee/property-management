'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/[domain]/AuthProvider';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, X, LayoutDashboard, User, LogOut, Shield, Package, Calendar, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface NavbarProps {
  domain?: string;
}

const REFRESH_TECH_PRIMARY = '#308a29';
const REFRESH_TECH_SECONDARY = '#6e6e6e';

export function Navbar({ domain }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const currentDomain = domain || (params.domain as string);

  // Check if this is refresh tech domain
  const isRefreshTech = currentDomain === 'refreshcrm' || currentDomain === 'refreshcrm.vercel.app' || currentDomain === 'refresh-tech';

  // Fetch website for branding (only for non-refresh tech domains)
  const website = useQuery(
    api.websites.getWebsiteByDomainPublic,
    currentDomain && !isRefreshTech ? { domain: currentDomain } : 'skip'
  ) as any;

  // Get branding colors
  const primaryColor = isRefreshTech ? REFRESH_TECH_PRIMARY : (website?.branding?.primaryColor || REFRESH_TECH_PRIMARY);
  const secondaryColor = isRefreshTech ? REFRESH_TECH_SECONDARY : (website?.branding?.secondaryColor || REFRESH_TECH_SECONDARY);
  const logoUrl = website?.branding?.logoUrl;
  const logoType = website?.branding?.logoType;
  const logoText = website?.branding?.logoText;
  const brandName = website?.branding?.logoText || website?.name;

  // Check if we're on an auth page
  const isAuthPage = pathname?.includes('/auth/');

  // Check if we're on dashboard page
  const isDashboardPage = pathname?.includes('/dashboard');

  // Check if it's a user-facing dashboard (not Refresh Tech admin dashboard)
  const isUserDashboard = isDashboardPage && !isRefreshTech;

  // Menu items - Dashboard only shown when NOT on auth pages
  const menuItems = isAuthPage ? [] : [
    ...(user ? [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
  ];

  const authenticatedMenuItems = [
    { href: '/profile', label: 'Profile', icon: User },
    ...(isUserDashboard ? [
      { href: '/dashboard/orders', label: 'My Orders', icon: Package },
      { href: '/dashboard/bookings', label: 'My Bookings', icon: Calendar },
      { href: '/dashboard/favourites', label: 'Favourites', icon: Heart },
    ] : []),
  ];

  const adminMenuItems = user?.userType === 'admin' || user?.userType === 'administrator' ? [
    { href: '/admin', label: 'Admin', icon: Shield },
  ] : [];

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Logo component based on domain
  const LogoComponent = () => {
    if (isRefreshTech) {
      return (
        <span className="text-2xl font-bold">
          <span className="text-green-600">Refresh</span> <span className="text-gray-500">Tech</span>
        </span>
      );
    }
    
    // Show logo image if logoType is "image" and logoUrl exists
    if (logoType === 'image' && logoUrl) {
      return (
        <Image 
          src={logoUrl} 
          alt={brandName || 'Brand Logo'} 
          width={120} 
          height={40}
          className="object-contain"
          style={{ height: 'auto', maxHeight: '40px' }}
        />
      );
    }
    
    // Show text logo if logoText exists
    if (logoText) {
      return (
        <span className="text-2xl font-bold" style={{ color: website?.branding?.logoTextColor || primaryColor }}>
          {logoText}
        </span>
      );
    }
    
    // Fallback to brand name
    return (
      <span className="text-2xl font-bold" style={{ color: primaryColor }}>
        {brandName || 'Brand'}
      </span>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 mb-[10px]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <LogoComponent />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-100 hover:text-blue-900 transition-all duration-200"
              >
                <span>{item.label}</span>
              </Link>
            ))}
            {user && authenticatedMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-100 hover:text-blue-900 transition-all duration-200"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            {user && adminMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 hover:text-amber-900 transition-all duration-200"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200 text-sm font-medium text-slate-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                <Link href="/auth/register" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: primaryColor }}>
                  Register
                </Link>
                <span className="text-slate-400">|</span>
                <Link href="/auth/login" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: primaryColor }}>
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  className="h-10 w-10 text-slate-600 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>

              <SheetContent side="left" className="w-80 max-w-sm p-0">
                <div className="flex flex-col h-full px-4 py-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <LogoComponent />
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="h-10 w-10 text-slate-600 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex-1 overflow-y-auto">
                    <div className="space-y-1">
                      {menuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                            pathname === item.href
                              ? 'bg-gray-100 text-slate-900'
                              : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      ))}
                      {user && authenticatedMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                            pathname === item.href
                              ? 'bg-gray-100 text-slate-900'
                              : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      ))}
                      {user && adminMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                            pathname === item.href
                              ? 'bg-amber-50 text-amber-900'
                              : 'text-amber-700 hover:bg-amber-50 hover:text-amber-900'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </nav>

                  {/* Footer */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    {user ? (
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        Logout
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <Link
                          href="/auth/login"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50 hover:text-slate-900 transition-colors"
                        >
                          Login
                        </Link>
                        <Link
                          href="/auth/register"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50 hover:text-slate-900 transition-colors"
                        >
                          Register
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}