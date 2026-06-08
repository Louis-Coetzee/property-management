import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showBackToLogin?: boolean;
  logo?: string;
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isRefreshTech?: boolean;
}

const REFRESH_TECH_PRIMARY = '#308a29';
const REFRESH_TECH_SECONDARY = '#6e6e6e';

export function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  showBackToLogin = false,
  logo,
  brandName,
  primaryColor,
  secondaryColor,
  isRefreshTech = false
}: AuthLayoutProps) {
  // Use provided colors or CSS variables with fallback to Refresh Tech defaults
  const accentColor = primaryColor || 'var(--auth-primary, #308a29)';
  const textColor = secondaryColor || 'var(--auth-secondary, #6e6e6e)';
  
  // Header gradient based on branding
  const headerStyle = isRefreshTech 
    ? { background: 'linear-gradient(to right, #1a303d, #1a303d)' }
    : primaryColor 
      ? { background: `linear-gradient(to right, ${accentColor}, ${adjustColor(accentColor, -20)})` }
      : { background: 'linear-gradient(to right, #1a303d, #1a303d)' };

  function adjustColor(color: string, amount: number) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  return (
    <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 mt-4 sm:my-0 sm:min-h-screen relative overflow-hidden bg-white">
      {/* Subtle white background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-slate-100/50"></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Header - Title Only */}
          <div className="px-6 sm:px-8 py-5 sm:py-6 text-center" style={headerStyle}>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">{title}</h1>
            {subtitle && <p className="text-white/80 text-xs sm:text-sm">{subtitle}</p>}
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            {children}
          </div>

          {/* Footer */}
          {showBackToLogin && (
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
              <p className="text-center text-sm" style={{ color: textColor }}>
                Remember your password?{' '}
                <Link href="/auth/login" className="font-semibold hover:opacity-80 transition-colors" style={{ color: accentColor }}>
                  Back to Login
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Bottom links */}
        {!showBackToLogin && (
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: textColor }}>
              Protected by enterprise-grade encryption
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
