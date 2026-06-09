'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, LogOut, LayoutDashboard, Heart } from 'lucide-react';
import { getPlatformDomain } from '@/lib/domain';

export default function PlatformNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const platformDomain = getPlatformDomain();

  const navLinks = [
    { href: '/listings', label: 'Browse Listings' },
    { href: '/advertise', label: 'Advertise' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#16911c] flex items-center justify-center">
              <span className="text-white font-bold text-sm">FA</span>
            </div>
            <span className="font-semibold text-stone-900 text-lg hidden sm:block">
              Find Accommodation
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-[#16911c]'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={`/auth/login`}
              className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              href={`/auth/register`}
              className="text-sm font-medium bg-[#16911c] text-white px-4 py-2 hover:bg-[#0d6b11] transition-colors"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-stone-600 hover:text-stone-900"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block text-sm font-medium py-2 ${
                  pathname === link.href
                    ? 'text-[#16911c]'
                    : 'text-stone-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-stone-200 space-y-2">
              <Link
                href={`/auth/login`}
                onClick={() => setIsOpen(false)}
                className="block text-sm font-medium text-stone-600 py-2"
              >
                Log In
              </Link>
              <Link
                href={`/auth/register`}
                onClick={() => setIsOpen(false)}
                className="block text-sm font-medium bg-[#16911c] text-white px-4 py-2.5 text-center"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
