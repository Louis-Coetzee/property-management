import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, ChevronRight, Package, Share2, ArrowUpRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface ProductCardProps {
  product: any;
  accentColor?: string;
  showStatus?: boolean;
  showPrice?: boolean;
  showStock?: boolean;
  viewDetailsText?: string;
  formatPrice?: (price: number) => string;
  cardSizeClasses?: {
    container?: string;
    title?: string;
    image?: string;
    button?: string;
    specs?: string;
  };
  showAddToCart?: boolean;
  companyId?: string;
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
    : '33, 156, 148';
}

function StatusBadge({ status }: { status: string }) {
  // Don't show status badge for valid stock statuses
  if (status === 'available' || status === 'low_stock') {
    return null;
  }
  
  const statusStyles: Record<string, string> = {
    available: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    out_of_stock: 'bg-red-50 text-red-500 border border-red-200',
    low_stock: 'bg-amber-50 text-amber-600 border border-amber-200',
    discontinued: 'bg-slate-100 text-slate-500 border border-slate-200',
  };
  const labels: Record<string, string> = {
    available: 'In Stock',
    out_of_stock: 'Out of Stock',
    low_stock: 'Low Stock',
    discontinued: 'Discontinued',
  };
  return (
    <span className={cn(
      'px-3 py-1 text-[10px] font-semibold rounded-full uppercase tracking-widest backdrop-blur-md',
      statusStyles[status] || statusStyles.available
    )}>
      {labels[status] || status}
    </span>
  );
}

function StockBadge({ quantity, lowThreshold = 5 }: { quantity: number; lowThreshold?: number }) {
  // If quantity is undefined or not a valid number, don't show stock badge
  if (quantity === undefined || quantity === null || isNaN(quantity)) {
    return null;
  }
  
  const isLow = quantity <= lowThreshold;
  const isOut = quantity <= 0;
  
  // Don't show "Out of Stock" if we don't have stock info
  if (quantity <= 0) {
    return null;
  }
  
  return (
    <span className={cn(
      'text-[10px] px-3 py-1 rounded-full font-semibold uppercase tracking-widest',
      isOut
        ? 'text-red-500'
        : isLow
        ? 'text-amber-600'
        : 'text-emerald-600'
    )}>
      {isOut ? 'Out of Stock' : `${quantity} in stock`}
    </span>
  );
}

export function ModernCard({
  product,
  accentColor,
  showStatus,
  showPrice,
  showStock,
  viewDetailsText,
  formatPrice,
  cardSizeClasses,
  showAddToCart,
  companyId,
}: ProductCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();

  const accent = accentColor || '#219c94';
  const accentRgb = hexToRgb(accent);

  const size = cardSizeClasses || {
    container: 'p-6',
    title: 'text-[1.1rem] font-semibold',
    image: 'aspect-[4/3]',
    button: 'py-3 text-sm px-6',
    specs: 'gap-2 text-xs',
  };

  const accentStyles = {
    '--accent': accent,
    '--accent-rgb': accentRgb,
    '--accent-light': `${accent}18`,
    '--accent-hover': adjustColor(accent, -15),
  } as React.CSSProperties;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);
    try {
      addItem({
        productId: product._id,
        companyId: companyId || '',
        name: product.name,
        price: product.discountedPrice || product.price,
        image: product.featuredImage || product.images?.[0],
      });
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const hasImage = product.featuredImage || (product.images && product.images.length > 0);
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;

  return (
    <>
      <div
        className="group relative bg-white rounded-3xl overflow-hidden flex flex-col"
        style={{
          ...accentStyles,
          boxShadow: isHovered
            ? `0 32px 64px -12px rgba(${accentRgb}, 0.18), 0 8px 24px -4px rgba(0,0,0,0.08)`
            : '0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          border: isHovered
            ? `1px solid rgba(${accentRgb}, 0.22)`
            : '1px solid rgba(0,0,0,0.07)',
          transition: 'box-shadow 0.5s cubic-bezier(.22,1,.36,1), border-color 0.4s ease',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ── Image Region ── */}
        <div className={cn('relative overflow-hidden bg-slate-50', size.image)}>
          {hasImage ? (
            <img
              src={product.featuredImage || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
              style={{
                transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.7s cubic-bezier(.22,1,.36,1)',
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <Package
                className="text-slate-200"
                style={{ width: 56, height: 56 }}
                strokeWidth={1}
              />
            </div>
          )}

          {/* Gradient veil */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent"
            style={{
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />

          {/* Top-left badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {showStatus && product.status && product.status === 'discontinued' && (
              <StatusBadge status={product.status} />
            )}
            {hasDiscount && (
              <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-semibold rounded-full uppercase tracking-widest shadow-md">
                Sale
              </span>
            )}
          </div>

          {/* Share button */}
          <div
            className="absolute top-4 right-4"
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateY(0)' : 'translateY(-6px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            <button
              onClick={(e) => { e.preventDefault(); setShowShareModal(true); }}
              className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white"
              style={{ transition: 'background 0.2s' }}
            >
              <Share2 className="h-[15px] w-[15px] text-slate-500" strokeWidth={1.8} />
            </button>
          </div>

          {/* Bottom overlay CTA */}
          <div
            className="absolute bottom-0 left-0 right-0 p-4"
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.35s ease 0.05s, transform 0.35s ease 0.05s',
            }}
          >
            <Link
              href={`/products/${product._id.replace('products_', '')}`}
              className="w-full flex items-center justify-center gap-2 bg-white/92 backdrop-blur-md text-slate-800 text-sm font-semibold py-3 rounded-2xl shadow-xl hover:bg-white"
              style={{ transition: 'background 0.2s', letterSpacing: '0.01em' }}
            >
              View Details
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>

        {/* ── Content Region ── */}
        <div className={cn('flex flex-col flex-1', size.container)} style={{ gap: 0 }}>

          {/* Price row */}
          {showPrice && (
            <div className="mb-2">
              {hasDiscount ? (
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: accent, letterSpacing: '-0.02em' }}
                  >
                    R{product.discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-slate-400 line-through font-medium">
                    R{product.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: accent, letterSpacing: '-0.02em' }}
                >
                  {formatPrice ? formatPrice(product.price) : `R${product.price.toFixed(2)}`}
                </span>
              )}
            </div>
          )}

          {/* Stock - below price */}
          {showStock && product.stockQuantity !== undefined && (
            <div className="mb-4">
              <StockBadge quantity={product.stockQuantity} />
            </div>
          )}

          {/* Title */}
          <h3
            className={cn('text-slate-900 leading-snug mb-2 line-clamp-2', size.title)}
            style={{ letterSpacing: '-0.01em' }}
          >
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-[0.82rem] text-slate-400 leading-relaxed line-clamp-2 mb-5 font-normal">
              {product.description}
            </p>
          )}

          {/* Divider */}
          <div
            className="mb-5 mt-auto"
            style={{
              height: 1,
              background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.07), transparent)',
            }}
          />

          {/* Action buttons */}
          <div className="flex gap-3">
            {showAddToCart === true ? (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || (product.stockQuantity !== undefined && product.stockQuantity <= 0)}
                className="flex-1 flex items-center justify-center gap-2.5 text-white font-semibold rounded-2xl disabled:opacity-40"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${adjustColor(accent, 24)})`,
                  padding: '0.9rem 1.25rem',
                  fontSize: '0.875rem',
                  letterSpacing: '0.01em',
                  boxShadow: `0 4px 16px rgba(${accentRgb}, 0.35)`,
                  transition: 'opacity 0.2s, box-shadow 0.2s',
                }}
              >
                {isAddingToCart ? (
                  <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" strokeWidth={2} />
                    Add to Cart
                  </>
                )}
              </button>
            ) : (
              <Link
                href={`/products/${product._id.replace('products_', '')}`}
                className="flex-1 flex items-center justify-center gap-2 font-semibold rounded-2xl text-white"
                style={{
                  padding: '0.9rem 1.25rem',
                  fontSize: '0.875rem',
                  letterSpacing: '0.01em',
                  background: `linear-gradient(135deg, ${accent}, ${adjustColor(accent, 24)})`,
                  boxShadow: `0 4px 16px rgba(${accentRgb}, 0.35)`,
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
              >
                <span>{viewDetailsText || 'View Details'}</span>
                <ChevronRight
                  className="h-4 w-4"
                  strokeWidth={2.5}
                  style={{
                    transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                    transition: 'transform 0.25s ease',
                  }}
                />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Share Modal ── */}
      {showShareModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
              Share
            </p>
            <h3 className="font-semibold text-slate-900 text-lg leading-snug mb-6" style={{ letterSpacing: '-0.01em' }}>
              {product.name}
            </h3>
            <div className="flex gap-4 justify-center mb-6">
              {[
                { label: 'Facebook', bg: '#1877F2', icon: 'f' },
                { label: 'X / Twitter', bg: '#0F1419', icon: '𝕏' },
                { label: 'WhatsApp', bg: '#25D366', icon: '✓' },
              ].map(({ label, bg, icon }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg hover:opacity-90 text-base"
                  style={{ background: bg, transition: 'opacity 0.2s' }}
                >
                  {icon}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold"
              style={{ transition: 'background 0.2s' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}
