'use client';

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCart } from '@/context/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X, ShoppingBag, ArrowRight, AlertTriangle, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface CartDrawerProps {
  accentColor?: string;
}

function adjustColor(color: string, amount: number) {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace('#', '').padEnd(6, '0'));
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '124, 58, 237';
}

export default function CartDrawer({ accentColor: propAccentColor }: CartDrawerProps) {
  const params = useParams();
  const domain = params.domain as string;
  const { items, removeItem, updateQuantity, subtotal, totalItems, isOpen, setIsOpen } = useCart();
  const { formatPrice } = useCurrency();

  const website = useQuery(
    api.websites.getWebsiteByDomainPublic,
    domain ? { domain } : 'skip'
  ) as any;
  const websiteAccentColor = website?.branding?.primaryColor || '#7c3aed';
  const accentColor = propAccentColor || websiteAccentColor;
  const accentRgb = hexToRgb(accentColor);

  const productStockData = useQuery(
    api.products.getProductsByIdsPublic,
    items.length > 0 ? { productIds: items.map(i => i.productId) } : 'skip'
  );

  const stockMap = useMemo(() => {
    if (!productStockData) return {};
    const map: Record<string, number> = {};
    productStockData.forEach((p: any) => {
      map[p._id] = p.stockQuantity ?? 0;
    });
    return map;
  }, [productStockData]);

  const getMaxQuantity = (productId: string) => {
    const stock = stockMap[productId];
    if (stock === undefined || stock === null) return 99;
    return Math.max(1, Math.min(stock, 99));
  };

  const isOutOfStock = (productId: string) => {
    const stock = stockMap[productId];
    return stock !== undefined && stock <= 0;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[26rem] flex flex-col p-0 border-l border-slate-100"
        style={{ boxShadow: '-24px 0 80px rgba(0,0,0,0.12)' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-6 border-b border-slate-100">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-0.5"
              style={{ color: accentColor }}
            >
              Your Selection
            </p>
            <h2 className="text-[1.15rem] font-semibold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              Shopping Cart
              {totalItems > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </span>
              )}
            </h2>
          </div>
     
        </div>

        {/* ── Empty State ── */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-7">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: `rgba(${accentRgb}, 0.08)` }}
            >
              <Package
                className="h-9 w-9"
                style={{ color: accentColor }}
                strokeWidth={1.5}
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800 text-base mb-1" style={{ letterSpacing: '-0.01em' }}>
                Your cart is empty
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Discover our collection and add something you'll love.
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-2 px-7 py-3 rounded-2xl text-sm font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${adjustColor(accentColor, 24)})`,
                boxShadow: `0 4px 16px rgba(${accentRgb}, 0.35)`,
              }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* ── Cart Items ── */}
            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4" style={{ scrollbarWidth: 'thin' }}>
              {items.map((item, idx) => (
                <div
                  key={item.productId}
                  className="group relative flex gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors duration-200"
                >
                  {/* Image */}
                  <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-white shadow-sm">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `rgba(${accentRgb}, 0.06)` }}
                      >
                        <ShoppingBag
                          className="h-6 w-6"
                          style={{ color: accentColor, opacity: 0.4 }}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4
                        className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 pr-1"
                        style={{ letterSpacing: '-0.01em' }}
                      >
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-white hover:bg-red-50 flex items-center justify-center shadow-sm transition-colors"
                      >
                        <X className="h-3 w-3 text-slate-400 hover:text-red-400" strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Price */}
                    <p
                      className="text-sm font-bold mb-2.5"
                      style={{ color: accentColor, letterSpacing: '-0.01em' }}
                    >
                      {formatPrice(item.price)}
                    </p>

                    {/* Out of stock warning */}
                    {isOutOfStock(item.productId) && (
                      <div className="flex items-center gap-1.5 text-red-500 text-[11px] font-medium mb-2">
                        <AlertTriangle className="h-3 w-3" strokeWidth={2} />
                        Out of stock
                      </div>
                    )}

                    {/* Qty + Line total */}
                    <div className="flex items-center justify-between">
                      {/* Stepper */}
                      <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                        >
                          <Minus className="h-3 w-3" strokeWidth={2.5} />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= getMaxQuantity(item.productId)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                        >
                          <Plus className="h-3 w-3" strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Line total */}
                      <p className="text-sm font-bold text-slate-800" style={{ letterSpacing: '-0.01em' }}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Low stock nudge */}
                    {stockMap[item.productId] !== undefined &&
                      stockMap[item.productId] <= 5 &&
                      stockMap[item.productId] > 0 && (
                        <p className="text-[11px] text-amber-500 font-medium mt-2">
                          Only {stockMap[item.productId]} left — order soon
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <div className="px-7 pt-5 pb-7 border-t border-slate-100 space-y-5">
              {/* Order summary */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-medium">Subtotal</span>
                  <span className="font-semibold text-slate-700">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-medium">Shipping</span>
                  <span className="text-slate-400 italic text-xs">Calculated at checkout</span>
                </div>

                {/* Divider */}
                <div
                  className="pt-2 mt-1"
                  style={{
                    borderTop: '1px solid',
                    borderImage: 'linear-gradient(to right, transparent, rgba(0,0,0,0.08), transparent) 1',
                  }}
                />

                <div className="flex items-baseline justify-between">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-widest text-slate-400"
                  >
                    Order Total
                  </span>
                  <span
                    className="text-2xl font-bold text-slate-900"
                    style={{ letterSpacing: '-0.03em' }}
                  >
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-2.5">
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2.5 text-white font-semibold rounded-2xl py-4 text-sm transition-opacity hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${adjustColor(accentColor, 24)})`,
                    boxShadow: `0 6px 20px rgba(${accentRgb}, 0.38)`,
                    letterSpacing: '0.01em',
                  }}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                  style={{ letterSpacing: '0.01em' }}
                >
                  Continue Shopping
                </button>
              </div>

              {/* Trust note */}
              <p className="text-center text-[11px] text-slate-300 font-medium tracking-wide">
                Secure checkout · Free returns · 24/7 support
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
