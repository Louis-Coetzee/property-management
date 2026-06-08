import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, ChevronRight, Package, Heart, Share2, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

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

function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700',
    out_of_stock: 'bg-red-100 text-red-700',
    low_stock: 'bg-amber-100 text-amber-700',
    discontinued: 'bg-slate-100 text-slate-700',
  };
  const labels: Record<string, string> = {
    available: 'In Stock',
    out_of_stock: 'Out of Stock',
    low_stock: 'Low Stock',
    discontinued: 'Discontinued',
  };
  return (
    <span className={cn('px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', statusStyles[status] || statusStyles.available)}>
      {labels[status] || status}
    </span>
  );
}

export function PremiumCard({ product, accentColor, showStatus, showPrice, showStock, viewDetailsText, formatPrice, cardSizeClasses, showAddToCart, companyId }: ProductCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();
  const size = cardSizeClasses || { container: 'p-5', title: 'text-lg font-semibold', image: 'aspect-[4/3]', button: 'py-2.5 text-sm px-5', specs: 'gap-2 text-xs' };

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

  return (
    <>
      <div 
        className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-md hover:shadow-2xl hover:border-violet-200 transition-all duration-500 ease-out"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-purple-50/30 pointer-events-none" />

        <div className={cn("relative overflow-hidden", size.image)}>
          {product.featuredImage || (product.images && product.images.length > 0) ? (
            <img
              src={product.featuredImage || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                <Package className="h-10 w-10 text-slate-300" />
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {showStatus && product.status && product.status === 'discontinued' && (
              <StatusBadge status={product.status} />
            )}
            {product.discountedPrice && product.discountedPrice < product.price && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                Sale
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShareModal(true); }}
              className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            >
              <Share2 className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            >
              <Heart className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>

        <div className={cn(size.container, "relative")}>
          {(showPrice || showStock) && (
            <div className="flex items-center justify-between mb-2">
              {showPrice && (
                <div className="flex items-center gap-2">
                  {product.discountedPrice && product.discountedPrice < product.price ? (
                    <>
                      <span className="text-xl font-bold" style={{ color: accentColor || '#7c3aed' }}>
                        {formatPrice ? formatPrice(product.discountedPrice) : `R${product.discountedPrice.toFixed(2)}`}
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice ? formatPrice(product.price) : `R${product.price.toFixed(2)}`}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold" style={{ color: accentColor || '#7c3aed' }}>
                      {formatPrice ? formatPrice(product.price) : `R${product.price.toFixed(2)}`}
                    </span>
                  )}
                </div>
              )}
              {showStock && product.stockQuantity !== undefined && product.stockQuantity > 0 && (
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full font-medium",
                  product.stockQuantity <= 5 ? "bg-amber-100 text-amber-700" :
                  "bg-emerald-100 text-emerald-700"
                )}>
                  {product.stockQuantity} in stock
                </span>
              )}
            </div>
          )}

          <h3 className={cn("font-semibold text-slate-900 mb-1 line-clamp-2", size.title)}>
            {product.name}
          </h3>

          {product.description && (
            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{product.description}</p>
          )}

          {product.rating && (
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn("h-4 w-4", star <= product.rating ? "text-amber-400 fill-amber-400" : "text-slate-300")}
                />
              ))}
              <span className="text-xs text-slate-500 ml-1">({product.reviewCount || 0})</span>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Link
              href={`/products/${product._id.replace('products_', '')}`}
              className="flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition-all duration-300 w-full"
              style={{ background: `linear-gradient(to right, ${accentColor || '#7c3aed'}, ${adjustColor(accentColor || '#7c3aed', 20)})` }}
            >
              {viewDetailsText || 'View Details'}
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            {showAddToCart === true && (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || (product.stockQuantity !== undefined && product.stockQuantity <= 0)}
                className="flex-1 flex items-center justify-center gap-2 w-full py-3"
                style={{ 
                  background: `linear-gradient(to right, ${accentColor || '#7c3aed'}, ${adjustColor(accentColor || '#7c3aed', 20)})`,
                  color: 'white'
                }}
              >
                {isAddingToCart ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">Share {product.name}</h3>
            <div className="flex gap-3 justify-center">
              <button className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center">
                <span className="sr-only">Facebook</span>
              </button>
              <button className="w-12 h-12 bg-sky-500 text-white rounded-full flex items-center justify-center">
                <span className="sr-only">Twitter</span>
              </button>
              <button className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                <span className="sr-only">WhatsApp</span>
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="mt-4 w-full py-2 text-slate-600">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
