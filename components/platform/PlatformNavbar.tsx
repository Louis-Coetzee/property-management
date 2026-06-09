'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { useRootAuth } from '@/components/platform/RootAuthProvider';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const PlatformNavbar = () => {
  const { user, loading } = useRootAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('sessionToken');
      document.cookie = 'sessionToken=; path=/; max-age=0';
      toast.success('You have been logged out successfully.');
      router.push('/');
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  const navItems = user ? [
    { href: '/', label: 'Browse' },
    { href: '/advertise', label: 'Advertise' },
    { href: '/contact', label: 'Contact' },
  ] : [
    { href: '/', label: 'Browse' },
    { href: '/advertise', label: 'Advertise' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-stone-200/60">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .sans { font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>
      <nav className="sans container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="group flex items-center gap-1">
            <span className="serif text-2xl font-bold text-stone-700">Find</span>
            <span className="serif text-2xl font-bold text-[#0d6b11]">Accommodation</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors duration-200 relative",
                  isActiveLink(item.href)
                    ? 'text-[#16911c]'
                    : 'text-stone-500 hover:text-[#0a1a12]'
                )}
              >
                {item.label}
                {isActiveLink(item.href) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#16911c]" />
                )}
              </Link>
            ))}

            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium transition-colors duration-200 relative",
                    isActiveLink('/dashboard')
                      ? 'text-[#16911c]'
                      : 'text-stone-500 hover:text-[#0a1a12]'
                  )}
                >
                  Dashboard
                  {isActiveLink('/dashboard') && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#16911c]" />
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-stone-400 hover:text-red-500 transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            )}

            {!user && !loading && (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-stone-200">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-stone-500 hover:text-[#0a1a12] transition-colors px-3 py-1.5"
                >
                  Login
                </Link>
                <Link href="/auth/register">
                  <button className="bg-[#16911c] hover:bg-[#0d6b11] text-white text-sm font-medium px-4 py-1.5 transition-colors">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 text-stone-600 hover:text-stone-900 transition-colors"
            >
              {isOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white">
          <nav className="flex flex-col gap-0.5 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors rounded-lg",
                  isActiveLink(item.href)
                    ? 'text-[#16911c] bg-[#16911c]/5'
                    : 'text-stone-600 hover:text-[#0a1a12] hover:bg-stone-50'
                )}
              >
                {item.label}
              </Link>
            ))}

            {user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-colors rounded-lg",
                    isActiveLink('/dashboard')
                      ? 'text-[#16911c] bg-[#16911c]/5'
                      : 'text-stone-600 hover:text-[#0a1a12] hover:bg-stone-50'
                  )}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="px-4 py-3 text-sm font-medium text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg text-left"
                >
                  Logout
                </button>
              </>
            )}

            {!user && !loading && (
              <div className="mt-4 pt-4 border-t border-stone-100 px-2 space-y-3">
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-medium text-stone-700 border border-stone-200 hover:bg-stone-50 transition-colors rounded-lg"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-medium text-white bg-[#16911c] hover:bg-[#0d6b11] transition-colors rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default PlatformNavbar;
