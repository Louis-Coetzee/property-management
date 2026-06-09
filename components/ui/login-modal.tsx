'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, ShoppingCart, Heart, CreditCard } from 'lucide-react';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: 'cart' | 'wishlist' | 'general' | 'booking';
  title?: string;
  description?: string;
  redirectUrl?: string;
}

export function LoginModal({
  open,
  onOpenChange,
  action = 'general',
  title,
  description,
  redirectUrl
}: LoginModalProps) {
  const params = useParams();
  const domain = params?.domain as string;

  React.useEffect(() => {
    if (open && redirectUrl) {
      sessionStorage.setItem('authRedirectUrl', redirectUrl);
    }
  }, [open, redirectUrl]);

  const getIcon = () => {
    switch (action) {
      case 'cart':
        return <ShoppingCart className="h-10 w-10 text-blue-500 mx-auto" />;
      case 'wishlist':
        return <Heart className="h-10 w-10 text-[#16911c] mx-auto" />;
      case 'booking':
        return <CreditCard className="h-10 w-10 text-[#16911c] mx-auto" />;
      default:
        return <User className="h-10 w-10 text-stone-400 mx-auto" />;
    }
  };

  const getDefaultTitle = () => {
    switch (action) {
      case 'cart':
        return 'Login to Add to Cart';
      case 'wishlist':
        return 'Login to Save Items';
      case 'booking':
        return 'Please login to book';
      default:
        return 'Login Required';
    }
  };

  const getDefaultDescription = () => {
    switch (action) {
      case 'cart':
        return 'Please log in or create an account to add items to your cart and complete your purchase.';
      case 'wishlist':
        return 'Please log in or create an account to save items to your favourites.';
      case 'booking':
        return 'Please register or login in order to place a booking.';
      default:
        return 'Please log in or create an account to continue.';
    }
  };

  const loginUrl = domain ? `/${domain}/auth/login` : '/auth/login';
  const registerUrl = domain ? `/${domain}/auth/register` : '/auth/register';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-stone-200 p-0" style={{ borderRadius: 0 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
          .lm-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
          .lm-sans { font-family: 'DM Sans', system-ui, sans-serif; }
        `}</style>

        <div className="p-8 text-center lm-sans">
          <div className="mb-5">
            {getIcon()}
          </div>

          <DialogHeader className="text-center">
            <DialogTitle className="lm-serif text-2xl font-bold text-stone-900 mb-2">
              {title || getDefaultTitle()}
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-500 leading-relaxed">
              {description || getDefaultDescription()}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-3">
            <Link
              href={loginUrl}
              onClick={() => onOpenChange(false)}
              className="block w-full py-3 px-4 text-sm font-semibold text-center text-white bg-[#16911c] hover:bg-[#0d6b11] transition-colors"
            >
              Log In
            </Link>
            <Link
              href={registerUrl}
              onClick={() => onOpenChange(false)}
              className="block w-full py-3 px-4 text-sm font-medium text-center text-stone-700 border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              Create a Profile
            </Link>
            <button
              onClick={() => onOpenChange(false)}
              className="block w-full py-3 px-4 text-sm text-stone-400 hover:text-stone-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
