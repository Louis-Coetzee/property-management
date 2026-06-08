'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, Package, DollarSign, Box, Ruler, Palette, Check, X, ArrowRight, Heart, Share2, Star, ArrowUpDown, Filter, ChevronDown, Link2, MessageCircle, Mail, Copy, Tag, ShoppingCart, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '../../../../app/[domain]/AuthProvider';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import LoginRequiredModal from '@/components/cart/LoginRequiredModal';
import { ModernCard } from '@/components/products/ModernProductCard';
import { PremiumCard } from '@/components/products/PremiumProductCard';

interface ProductShowcaseProps {
  content: {
    headline?: string;
    subheadline?: string;
    description?: string;
    filterBy?: {
      companyIds?: string[];
      categoryIds?: string[];
      brandIds?: string[];
    };
    itemsPerPage?: number;
    showLoadMore?: boolean;
    loadMoreText?: string;
    showStatus?: boolean;
    showPrice?: boolean;
    showStock?: boolean;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    cardStyle?: 'modern' | 'premium';
    layout?: 'grid-3' | 'grid-4' | 'carousel';
    columns?: 2 | 3 | 4;
    cardSize?: 'small' | 'medium' | 'large';
    cardSpacing?: 'compact' | 'normal' | 'spacious';
    viewDetailsText?: string;
    viewDetailsTarget?: 'url' | 'form';
    viewDetailsFormId?: string;
    showNavbarOnDetails?: boolean;
    showFooterOnDetails?: boolean;
    showSearch?: boolean;
    showSort?: boolean;
    showFilter?: boolean;
    categoryFilterStyle?: 'dropdown' | 'tags';
    defaultSort?: string;
    inquiryTarget?: 'url' | 'page' | 'form';
    inquiryUrl?: string;
    inquiryPageId?: string;
    inquirySectionId?: string;
    inquiryFormId?: string;
    inquiryButtonText?: string;
    showOnlySelected?: boolean;
    selectedProductIds?: string[];
    showAddToCart?: boolean;
  };
  settings?: {
    backgroundColor?: string;
    padding?: {
      top?: string;
      bottom?: string;
    };
    fullWidth?: boolean;
  };
  templateId: string;
  websiteId?: string;
  companyId?: string;
}

// Sort options configuration
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
];

// Status badge component
function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Available' },
    out_of_stock: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Out of Stock' },
    discontinued: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Discontinued' },
    draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
  };

  const style = statusStyles[status] || statusStyles.draft;
  const sizeStyles = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', style.bg, style.text, sizeStyles)}>
      {style.label}
    </span>
  );
}

// Stock badge component
function StockBadge({ quantity, lowThreshold = 5 }: { quantity: number; lowThreshold?: number }) {
  const isLow = quantity <= lowThreshold;
  const isOut = quantity === 0;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium',
      isOut ? 'bg-red-100 text-red-700' :
      isLow ? 'bg-amber-100 text-amber-700' :
      'bg-emerald-100 text-emerald-700'
    )}>
      <Box className="h-3 w-3" />
      {isOut ? 'Out of Stock' : `${quantity} in stock`}
    </span>
  );
}



// Share Modal Component
function ShareModal({
  isOpen,
  onClose,
  product
}: {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/products/${product._id.replace('products_', '')}`
    : `/products/${product._id.replace('products_', '')}`;

  const shareText = `Check out ${product.name}!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${productUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Check out ${product.name}`);
    const body = encodeURIComponent(`${shareText}\n\nView the product here: ${productUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Share Product</h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1 truncate">{product.name}</p>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
              {copied ? (
                <Check className="h-5 w-5 text-white" />
              ) : (
                <Copy className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-slate-900">{copied ? 'Link Copied!' : 'Copy Link'}</p>
              <p className="text-xs text-slate-500">Copy the product link to clipboard</p>
            </div>
          </button>

          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-slate-900">WhatsApp</p>
              <p className="text-xs text-slate-500">Share via WhatsApp message</p>
            </div>
          </button>

          <button
            onClick={handleEmail}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-slate-900">Email</p>
              <p className="text-xs text-slate-500">Share via email</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductShowcase({
  content,
  settings,
  templateId,
  websiteId,
  companyId,
}: ProductShowcaseProps) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalAction, setLoginModalAction] = useState<'cart' | 'favorite'>('cart');
  
  const handleAddToCartClick = () => {
    if (!user) {
      setLoginModalAction('cart');
      setShowLoginModal(true);
      return true;
    }
    return false;
  };
  
  const handleFavoriteClick = () => {
    if (!user) {
      setLoginModalAction('favorite');
      setShowLoginModal(true);
      return true;
    }
    return false;
  };

  function adjustColor(color: string, amount: number) {
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  const formatPrice = (price: number) => {
    return `R${price.toFixed(2)}`;
  };
  
  const [visibleCount, setVisibleCount] = useState(content.itemsPerPage || 8);
  const [sortBy, setSortBy] = useState(content.defaultSort || 'newest');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products
  const products = useQuery(
    api.products.getActiveProductsByWebsitePublic,
    websiteId ? { websiteId: websiteId as any } : 'skip'
  );

  // Get unique categories
  const categories = useMemo(() => {
    if (!products) return [];
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categories) p.categories.forEach(c => cats.add(c));
    });
    return Array.from(cats).sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    // Show all active products (don't filter by status)
    let filtered = products.filter(p => p.isActive);

    // Apply search filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.categories?.some(c => c.toLowerCase().includes(query)) ||
        p.sku?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.categories?.includes(filterCategory));
    }

    // Apply selected products filter if enabled
    if (content.showOnlySelected && content.selectedProductIds?.length) {
      filtered = filtered.filter(p => content.selectedProductIds!.includes(p._id));
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return filtered;
  }, [products, sortBy, filterCategory, searchQuery, content.showOnlySelected, content.selectedProductIds]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = filteredProducts.length > visibleCount;

  // Get grid columns based on settings
  const getGridCols = () => {
    const cols = content.columns || 3;
    switch (cols) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  // Get card spacing
  const getCardSpacing = () => {
    switch (content.cardSpacing) {
      case 'compact':
        return 'gap-3';
      case 'spacious':
        return 'gap-8';
      default:
        return 'gap-5';
    }
  };

  // Get card size classes
  const getCardSizeClasses = () => {
    switch (content.cardSize) {
      case 'small':
        return {
          container: 'p-3',
          title: 'text-sm font-semibold',
          image: 'aspect-[4/3]',
          button: 'py-1.5 text-xs px-3',
          specs: 'gap-1 text-[10px]',
        };
      case 'large':
        return {
          container: 'p-5',
          title: 'text-xl font-bold',
          image: 'aspect-square',
          button: 'py-3 text-base px-5',
          specs: 'gap-2 text-sm',
        };
      default:
        return {
          container: 'p-4',
          title: 'text-base font-semibold',
          image: 'aspect-[4/3]',
          button: 'py-2 text-sm px-4',
          specs: 'gap-1.5 text-xs',
        };
    }
  };

  const cardSizeClasses = getCardSizeClasses();
  const CardComponent = content.cardStyle === 'premium' ? PremiumCard : ModernCard;

  return (
    <section
      className={cn(
        'py-12 sm:py-16 lg:py-20',
        settings?.fullWidth ? '' : 'container mx-auto px-4 sm:px-6 lg:px-8'
      )}
      style={{
        backgroundColor: content.backgroundColor || settings?.backgroundColor || 'transparent',
        color: content.textColor,
        paddingTop: settings?.padding?.top,
        paddingBottom: settings?.padding?.bottom,
      }}
    >
      {/* Header */}
      <div className="text-center mb-10">
        {content.headline && (
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            {content.headline}
          </h2>
        )}
        {content.subheadline && (
          <p className="text-lg text-slate-600 mb-2">
            {content.subheadline}
          </p>
        )}
        {content.description && (
          <p className="text-slate-500 max-w-2xl mx-auto">
            {content.description}
          </p>
        )}
      </div>

      {/* Sort and Filter Bar */}
      {(content.showSearch || content.showSort || content.showFilter) && (
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Search Input */}
          {content.showSearch && (
            <div className="relative flex-1 min-w-[180px] max-w-[280px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 placeholder:text-slate-400 shadow-sm transition-all"
              />
            </div>
          )}

          {/* Sort and Filter Group */}
          <div className="flex items-center gap-3">
            {/* Sort */}
            {content.showSort && (
              <div className="relative group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm cursor-pointer transition-all hover:border-slate-300"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-slate-600" />
              </div>
            )}

            {/* Category Filter */}
            {content.showFilter && categories.length > 0 && (
              <>
                {(content.categoryFilterStyle || 'dropdown') === 'dropdown' ? (
                  <div className="relative group">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm cursor-pointer transition-all hover:border-slate-300"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-slate-600" />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setFilterCategory('all')}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                        filterCategory === 'all'
                          ? 'text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      style={filterCategory === 'all' ? { backgroundColor: content.accentColor || '#7c3aed' } : {}}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                          filterCategory === cat
                            ? 'text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        style={filterCategory === cat ? { backgroundColor: content.accentColor || '#7c3aed' } : {}}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products === undefined ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
        </div>
      ) : visibleProducts.length > 0 ? (
        <div className={cn('grid', getCardSpacing(), getGridCols())}>
          {visibleProducts.map((product) => (
              <CardComponent
                key={product._id}
                product={product}
                accentColor={content.accentColor}
                showStatus={false}
                showPrice={content.showPrice}
                showStock={content.showStock}
                showAddToCart={content.showAddToCart}
                companyId={companyId}
                viewDetailsText={content.viewDetailsText}
                formatPrice={formatPrice}
                cardSizeClasses={cardSizeClasses}
              />
            ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No products found</h3>
          <p className="text-slate-500">Check back later for new products.</p>
        </div>
      )}

      {/* Load More Button */}
      {content.showLoadMore && hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={() => setVisibleCount(prev => prev + (content.itemsPerPage || 8))}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl hover:opacity-90 transition-colors"
            style={{ background: `linear-gradient(to right, ${content.accentColor || '#219c94'}, ${adjustColor(content.accentColor || '#219c94', 20)})` }}
          >
            {content.loadMoreText || 'Load More Products'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
