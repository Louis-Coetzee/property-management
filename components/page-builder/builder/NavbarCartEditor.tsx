'use client';

import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarCartEditorProps {
  showCart: boolean;
  cartLink?: string;
  onChange: (showCart: boolean, cartLink?: string) => void;
}

export function NavbarCartEditor({ showCart, cartLink, onChange }: NavbarCartEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-violet-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Shopping Cart Icon</h4>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showCart}
            onChange={(e) => onChange(e.target.checked, cartLink)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
        </label>
      </div>

      {showCart && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cart Page Link
          </label>
          <input
            type="text"
            value={cartLink || ''}
            onChange={(e) => onChange(showCart, e.target.value)}
            placeholder="/checkout"
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">
            Enter the URL path to your checkout page (e.g., /checkout)
          </p>
        </div>
      )}
    </div>
  );
}
