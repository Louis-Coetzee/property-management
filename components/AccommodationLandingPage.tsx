'use client';

import { ArrowRight, Check, Zap, Bed, Users, CreditCard, Globe, BarChart3, Calendar, Mail, Settings, Building2, Menu, X, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/app/[domain]/AuthProvider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const features = [
  {
    icon: Bed,
    title: 'Room & Property Management',
    description: 'Manage rooms, rates, and availability across your properties with real-time calendar views.',
    gradient: 'from-blue-500 to-blue-700',
    iconBg: 'bg-blue-500',
  },
  {
    icon: Calendar,
    title: 'Booking Management',
    description: 'Handle guest bookings, check-ins, and check-outs with an intuitive scheduling system.',
    gradient: 'from-emerald-500 to-emerald-700',
    iconBg: 'bg-emerald-500',
  },
  {
    icon: Users,
    title: 'Guest Management',
    description: 'Track guest information, preferences, and booking history to deliver personalized experiences.',
    gradient: 'from-violet-500 to-violet-700',
    iconBg: 'bg-violet-500',
  },
  {
    icon: Globe,
    title: 'Listings & Website Builder',
    description: 'Create beautiful property listings and websites to attract more direct bookings.',
    gradient: 'from-amber-500 to-amber-700',
    iconBg: 'bg-amber-500',
  },
  {
    icon: CreditCard,
    title: 'Payments & Invoicing',
    description: 'Process payments securely and generate professional invoices for every stay.',
    gradient: 'from-cyan-500 to-cyan-700',
    iconBg: 'bg-cyan-500',
  },
  {
    icon: Mail,
    title: 'Email Notifications',
    description: 'Send automated booking confirmations, reminders, and follow-up emails to guests.',
    gradient: 'from-rose-500 to-rose-700',
    iconBg: 'bg-rose-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Track occupancy rates, revenue, and booking trends with comprehensive dashboards.',
    gradient: 'from-teal-500 to-teal-700',
    iconBg: 'bg-teal-500',
  },
  {
    icon: Settings,
    title: 'Team Management',
    description: 'Manage staff access, assign roles, and organize your team across multiple properties.',
    gradient: 'from-indigo-500 to-indigo-700',
    iconBg: 'bg-indigo-500',
  },
];

export function AccommodationLandingPage({ domain }: { domain: string }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href={`/${domain}`} className="flex-shrink-0 flex items-center gap-2 group">
                        <span className="text-2xl font-bold"><span className="text-green-600">Find</span> <span className="text-slate-500">Accommodation</span></span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href={`/auth/register`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-100 hover:text-blue-900 transition-all duration-200"
              >
                Get Started
              </Link>
              <Link
                href={`/auth/login`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-100 hover:text-blue-900 transition-all duration-200"
              >
                Sign In
              </Link>
              {user && (
                <Link
                  href={`/dashboard`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 transition-all duration-200"
                >
                  Dashboard
                </Link>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200 text-sm font-medium text-slate-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
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
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                <span className="text-2xl font-bold"><span className="text-green-600">Find</span> <span className="text-slate-500">Accommodation</span></span>
                      </div>
                    </div>
                    <nav className="flex-1 space-y-1">
                      <Link
                        href={`/auth/register`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-all duration-200"
                      >
                        Get Started
                      </Link>
                      <Link
                        href={`/auth/login`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-all duration-200"
                      >
                        <User className="h-5 w-5" />
                        <span>Sign In</span>
                      </Link>
                      {user && (
                        <Link
                          href={`/dashboard`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-50 transition-all duration-200"
                        >
                          Dashboard
                        </Link>
                      )}
                    </nav>
                    {user && (
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 w-full"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)`
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm font-medium mb-8">
              <Zap className="h-4 w-4 text-amber-400" />
              Accommodation Management Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                Accommodation
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              Discover premium lodges, boutique hotels, and holiday homes. Book your perfect stay or manage your accommodation business — all from one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/auth/register`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={`/auth/login`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful tools designed to help you manage every aspect of your accommodation business from one centralized dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-6 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-300 bg-white relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${feature.iconBg} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className={`inline-flex p-3 rounded-xl ${feature.gradient} mb-5 shadow-lg relative`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            Join thousands of accommodation providers already growing with our all-in-one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/auth/register`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold"><span className="text-green-500">Find</span> <span className="text-white">Accommodation</span></span>
            </div>
            <div className="flex items-center gap-6 text-slate-400 text-sm">
              <Link href={`/${domain}/privacy`} className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href={`/${domain}/terms`} className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <p className="text-slate-500 text-sm">
              &copy; 2025 Find Accommodation. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
