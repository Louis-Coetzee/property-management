'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, X, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'cart' | 'favorite';
}

export default function LoginRequiredModal({ isOpen, onClose, action }: LoginRequiredModalProps) {
  const router = useRouter();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <div className="relative bg-gradient-to-br from-violet-600 to-purple-700 p-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {action === 'cart' ? 'Add to Cart' : 'Save to Favorites'}
          </h2>
          <p className="text-white/80">
            {action === 'cart' 
              ? 'Please log in to add items to your cart and checkout.'
              : 'Please log in to save your favorite products.'
            }
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-center mb-6">
            <p className="text-slate-600">
              Create an account or log in to:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li className="flex items-center justify-center gap-2">
                <ShoppingCart className="h-4 w-4 text-violet-600" />
                Save items to your cart
              </li>
              <li className="flex items-center justify-center gap-2">
                <Heart className="h-4 w-4 text-violet-600" />
                Keep track of your favorite products
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button 
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-3"
              onClick={() => {
                onClose();
                router.push('/auth/login');
              }}
            >
              Log In
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-2 border-violet-600 text-violet-600 hover:bg-violet-50 font-semibold py-3"
              onClick={() => {
                onClose();
                router.push('/auth/register');
              }}
            >
              Create Account
            </Button>
          </div>
          
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button 
              onClick={() => {
                onClose();
                router.push('/auth/login');
              }}
              className="text-violet-600 hover:underline font-medium"
            >
              Log in here
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}