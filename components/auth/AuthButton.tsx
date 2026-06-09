import { ButtonHTMLAttributes, forwardRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuthBranding } from '@/components/auth/AuthBrandingContext';
import { isPlatformDomain } from '@/lib/domain';

const REFRESH_TECH_PRIMARY = '#10304f';
const REFRESH_TECH_SECONDARY = '#308a29';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  primaryColor?: string;
}

function darkenColor(color: string, amount: number) {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ children, variant = 'primary', isLoading = false, primaryColor, className = '', disabled, ...props }, ref) => {
    const params = useParams();
    const domain = params.domain as string;
    const isRefreshTechDomain = !domain || isPlatformDomain(domain);
    
    const baseStyles = 'w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ease-out relative overflow-hidden';
    
    const branding = useAuthBranding();
    const brandingColor = branding.primaryColor || REFRESH_TECH_SECONDARY;
    
    // Use #10304f for refreshcrm domains, otherwise use dynamic branding
    const buttonColor = isRefreshTechDomain ? REFRESH_TECH_PRIMARY : (primaryColor || brandingColor);
    const gradientColor = darkenColor(buttonColor, -15);

    const variants = {
      primary: 'text-white',
      secondary: 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg shadow-slate-500/30 hover:from-slate-800 hover:to-slate-900 active:scale-[0.98]',
      outline: 'bg-transparent border-2 border-slate-300 text-slate-700 hover:border-slate-800 hover:bg-slate-50 active:scale-[0.98]',
    };

    const customVariantStyles = {
      primary: { 
        background: `linear-gradient(to right, ${buttonColor}, ${gradientColor})`,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
        style={variant === 'primary' ? customVariantStyles.primary : undefined}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

AuthButton.displayName = 'AuthButton';
