'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import CartDrawer from '@/components/cart/CartDrawer';
import { NavbarModern } from '@/components/page-builder/renderer/sections/NavbarModern';
import { NavbarBasic } from '@/components/page-builder/renderer/sections/NavbarBasic';
import { FooterBasic } from '@/components/page-builder/renderer/sections/FooterBasic';
import { FooterModern } from '@/components/page-builder/renderer/sections/FooterModern';
import { parsePageContent } from '@/lib/page-builder/hooks/usePageContent';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Minus,
  Plus,
  ShoppingCart,
  Share2,
  Heart,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Star,
  Package,
  Tag,
  Palette,
  Box,
  Ruler,
  Award,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

/* ── helpers ─────────────────────────────────────── */
function adjustColor(color: string, amount: number) {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
    hex.replace('#', '').padEnd(6, '0')
  );
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '124, 58, 237';
}

/* ── status helpers ───────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  available: 'In Stock',
  out_of_stock: 'Out of Stock',
  low_stock: 'Low Stock',
  discontinued: 'Discontinued',
};
const STATUS_STYLE: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  out_of_stock: 'bg-red-50 text-red-500 border-red-200',
  low_stock: 'bg-amber-50 text-amber-600 border-amber-200',
  discontinued: 'bg-slate-100 text-slate-500 border-slate-200',
};

/* ══════════════════════════════════════════════════ */
export default function ProductDetailsPage() {
  const params = useParams();
  let productId = params.productId as string;
  if (productId.startsWith('products_')) productId = productId.replace('products_', '');

  const { addItem } = useCart();
  const { formatPrice, currencyInfo } = useCurrency();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    console.log('=== Product Page DEBUG ===');
    console.log('URL productId (raw):', params.productId);
    console.log('Normalized productId:', productId);
    console.log('==========================');
  }, [params.productId, productId]);

  const product = useQuery(api.products.getProductByIdPublic, { productId });
  const company = useQuery(api.products.getCompanyByProductIdPublic, { productId });
  const companyId = company?._id || '';
  
  // Fetch shipping options to check for free shipping
  const shippingOptions = useQuery(
    api.orders.getShippingOptionsPublic,
    companyId ? { companyId } : 'skip'
  ) as any[];
  
  // Find free shipping threshold from active shipping options
  const freeShippingOption = shippingOptions?.find((s: any) => s.isFree && s.freeShippingThreshold);
  const freeShippingThreshold = freeShippingOption?.freeShippingThreshold;
  const freeShippingMethodName = freeShippingOption?.name || 'shipping';

  // Fetch website for navbar
  const domain = (params as any).domain as string;
  const website = useQuery(
    api.websites.getWebsiteByDomainPublic,
    domain ? { domain } : 'skip'
  ) as any;
  
  const homePage = useQuery(
    api.pages.getHomePagePublic,
    website ? { websiteId: website._id } : 'skip'
  );
  
  const navbarSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'navbar') || []
    : [];
  const firstNavbarSection = navbarSections.length > 0 ? navbarSections[0] : null;
  
  // Extract footer sections from home page
  const footerSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'footer') || []
    : [];
  const footerSection = footerSections.length > 0 ? footerSections[0] : null;
  
  const accentColor = website?.branding?.primaryColor || '#219c94';

  console.log('[ProductPage] navbarSections:', navbarSections.length);
  console.log('[ProductPage] firstNavbarSection:', firstNavbarSection ? { templateId: firstNavbarSection.templateId, hasContent: !!firstNavbarSection.content } : null);
  console.log('[ProductPage] homePage:', homePage ? { contentType: homePage.contentType } : null);

  useEffect(() => { console.log('Product query result:', product); }, [product]);

  const isLoading = product === undefined;
  const productAny = product as any;

  const images =
    productAny?.images?.length > 0
      ? productAny.images
      : productAny?.featuredImage
      ? [productAny.featuredImage]
      : [];

  const currentPrice = productAny?.discountedPrice || productAny?.price || 0;
  const hasDiscount =
    productAny?.discountedPrice && productAny?.discountedPrice < productAny?.price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - productAny.discountedPrice / productAny.price) * 100)
    : 0;

  // Accent from company or website branding
  const accent = (company as any)?.branding?.primaryColor || website?.branding?.primaryColor || '#219c94';
  const accentRgb = hexToRgb(accent);

  const handleAddToCart = () => {
    const normalizedProductId = productId.startsWith('products_')
      ? productId
      : `products_${productId}`;
    addItem(
      {
        productId: normalizedProductId,
        companyId: (company as any)?._id || '',
        name: productAny.name,
        price: currentPrice,
        image: images[0],
      },
      quantity
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{ borderColor: `rgba(${accentRgb},0.2)`, borderTopColor: accent }}
        />
      </div>
    );
  }

  /* ── Not Found ── */
  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-5 px-4">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: `rgba(${accentRgb},0.08)` }}
        >
          <Package className="h-9 w-9 text-slate-300" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2" style={{ letterSpacing: '-0.02em' }}>
            Product Not Found
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            This product may have been removed or is no longer available.
          </p>
        </div>
        <Link
          href="/"
          className="px-8 py-3.5 rounded-2xl text-sm font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${adjustColor(accent, 24)})`,
            boxShadow: `0 4px 16px rgba(${accentRgb},0.3)`,
          }}
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#f8f8f6]">

      {/* ── Navbar (from website builder) ── */}
      {navbarSections.map((section: any, index: number) => (
        section.templateId === 'navbar-modern' ? (
          <NavbarModern
            key={section.id || index}
            content={section.content as any}
            settings={section.settings as any}
            currentPageSlug={`/products/${productId}`}
            websiteId={website?._id as any}
            templateId={section.templateId as any}
            sectionId={section.id as any}
            homePageSlug={homePage?.slug as any}
          />
        ) : section.templateId === 'navbar-basic' ? (
          <NavbarBasic
            key={section.id || index}
            content={section.content as any}
            settings={section.settings as any}
            currentPageSlug={`/products/${productId}`}
            websiteId={website?._id as any}
            templateId={section.templateId as any}
            sectionId={section.id as any}
            homePageSlug={homePage?.slug as any}
          />
        ) : (
          <NavbarModern
            key={section.id || index}
            content={section.content as any}
            settings={section.settings as any}
            currentPageSlug={`/products/${productId}`}
            websiteId={website?._id as any}
            templateId={section.templateId as any}
            sectionId={section.id as any}
            homePageSlug={homePage?.slug as any}
          />
        )
      ))}
      
      {!firstNavbarSection && (
        /* ── Fallback Header ── */
        <header
          className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-100"
          style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Back */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors group"
            >
              <ChevronLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                strokeWidth={2.5}
            />
            <span className="hidden sm:inline">Back to Shop</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {/* Brand */}
          {company && (
            <div className="flex items-center gap-2.5">
              {(company as any).branding?.logoUrl ? (
                <Image
                  src={(company as any).branding.logoUrl}
                  alt={(company as any).name}
                  width={28}
                  height={28}
                  className="rounded-lg object-contain"
                />
              ) : null}
              <span className="font-semibold text-slate-800 text-sm">
                {(company as any).name}
              </span>
            </div>
          )}

          {/* Cart icon */}
          <Link
            href="/checkout"
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <ShoppingCart className="h-4 w-4 text-slate-600" strokeWidth={2} />
          </Link>
        </div>
      </header>
      )}

      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1">
        <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href="/" className="hover:text-slate-700 transition-colors">Shop</Link>
          {productAny.category && (
            <>
              <span>/</span>
              <span className="text-slate-500">{productAny.category}</span>
            </>
          )}
          <span>/</span>
          <span className="text-slate-700 line-clamp-1 max-w-[180px]">{productAny.name}</span>
        </nav>
      </div>

      {/* ── Main Grid ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 xl:gap-14">

          {/* ════════════════════════════════
              LEFT — Image Gallery
          ════════════════════════════════ */}
          <div className="flex flex-col gap-4">

            {/* Main image */}
            <div
              className={cn(
                'relative w-full rounded-3xl overflow-hidden bg-white cursor-zoom-in select-none',
                'aspect-square sm:aspect-[4/3] lg:aspect-square'
              )}
              style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage]}
                  alt={productAny.name}
                  fill
                  className="object-cover"
                  style={{
                    transform: isZoomed ? 'scale(1.55)' : 'scale(1)',
                    transition: 'transform 0.6s cubic-bezier(.22,1,.36,1)',
                  }}
                  priority
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `rgba(${accentRgb},0.04)` }}
                >
                  <Package className="h-20 w-20 text-slate-200" strokeWidth={1} />
                </div>
              )}

              {/* Overlay badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <span className="px-3 py-1 bg-red-500 text-white text-[11px] font-bold rounded-full uppercase tracking-widest shadow">
                    -{discountPercentage}%
                  </span>
                )}
              </div>

              {productAny.status && (
                <div className="absolute top-4 right-4">
                  {productAny.status === 'discontinued' && (
                    <span
                      className={cn(
                        'px-3 py-1 text-[11px] font-semibold rounded-full uppercase tracking-widest border backdrop-blur-sm',
                        STATUS_STYLE[productAny.status] || STATUS_STYLE.available
                      )}
                    >
                      {STATUS_LABEL[productAny.status] || productAny.status}
                    </span>
                  )}
                </div>
              )}

              {/* Zoom hint */}
              <div className="absolute bottom-4 right-4 bg-black/20 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                {isZoomed ? 'Click to zoom out' : 'Click to zoom'}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200"
                    style={{
                      borderColor: selectedImage === idx ? accent : 'transparent',
                      boxShadow:
                        selectedImage === idx
                          ? `0 0 0 3px rgba(${accentRgb},0.15)`
                          : '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description below images */}
            {productAny.description && (
              <div>
                <p className="text-sm text-slate-600 leading-relaxed">{productAny.description}</p>
              </div>
            )}


          </div>

          {/* ════════════════════════════════
              RIGHT — Product Info
          ════════════════════════════════ */}
          <div className="flex flex-col gap-7">

            {/* Brand + title + meta */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                {productAny.brand && (
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: accent }}
                  >
                    {productAny.brand}
                  </span>
                )}
                {productAny.category && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                    <Tag className="h-3 w-3" strokeWidth={2} />
                    {productAny.category}
                  </span>
                )}
              </div>

              <h1
                className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-slate-900 leading-tight mb-2"
                style={{ letterSpacing: '-0.025em' }}
              >
                {productAny.name}
              </h1>

              {productAny.sku && (
                <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                  SKU: {productAny.sku}
                </p>
              )}
            </div>

            {/* Price + rating */}
            <div
              className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-100"
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  Price
                </p>
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: accent, letterSpacing: '-0.03em' }}
                  >
                    {formatPrice(currentPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-base text-slate-400 line-through font-medium">
                      {formatPrice(productAny.price)}
                    </span>
                  )}
                </div>
              </div>

              {productAny.purchaseCount !== undefined && productAny.purchaseCount > 0 && (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn('h-4 w-4', s <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200')}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {productAny.purchaseCount} purchases
                  </span>
                </div>
              )}
            </div>

            {/* Stock - only show if > 0 */}
            {productAny.stockQuantity !== undefined && productAny.stockQuantity > 0 && (
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    productAny.stockQuantity > 5
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  )}
                />
                <span className="text-sm font-medium text-slate-600">
                  {productAny.stockQuantity > 5
                    ? `${productAny.stockQuantity} units in stock`
                    : `Only ${productAny.stockQuantity} left — order soon`}
                </span>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Quantity</span>
                <div
                  className="flex items-center gap-1 bg-white rounded-2xl p-1 border border-slate-100"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                  <span className="w-10 text-center text-base font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(productAny.stockQuantity || 99, quantity + 1))
                    }
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                    disabled={quantity >= (productAny.stockQuantity || 99)}
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Add to Cart + wishlist/share */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    (productAny.stockQuantity !== undefined && productAny.stockQuantity <= 0) ||
                    productAny.status === 'discontinued'
                  }
                  className="flex-1 flex items-center justify-center gap-2.5 text-white font-semibold rounded-2xl py-4 text-sm transition-all duration-300 disabled:opacity-40"
                  style={{
                    background: justAdded
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : `linear-gradient(135deg, ${accent}, ${adjustColor(accent, 24)})`,
                    boxShadow: justAdded
                      ? '0 6px 20px rgba(16,185,129,0.35)'
                      : `0 6px 20px rgba(${accentRgb},0.38)`,
                    letterSpacing: '0.01em',
                  }}
                >
                  {justAdded ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" strokeWidth={2} />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  onClick={() => setWishlisted(!wishlisted)}
                  className="w-13 h-13 flex items-center justify-center rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors p-4"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <Heart
                    className="h-5 w-5 transition-colors"
                    style={{
                      fill: wishlisted ? accent : 'none',
                      color: wishlisted ? accent : '#94a3b8',
                    }}
                    strokeWidth={2}
                  />
                </button>

                <button
                  className="w-13 h-13 flex items-center justify-center rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors p-4"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <Share2 className="h-5 w-5 text-slate-400" strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Trust strip — mobile (below CTA) - ONLY show Secure Payment and Free Shipping if enabled */}
            <div className="grid grid-cols-2 gap-2.5 lg:hidden">
              {[
                freeShippingThreshold ? { icon: Truck, title: 'Free Shipping', sub: `Over ${currencyInfo.symbol}${freeShippingThreshold} via ${freeShippingMethodName}` } : null,
                { icon: Shield, title: 'Secure Payment', sub: '' },
              ].filter(Boolean).map((item: any) => (
                <div
                  key={item.title}
                  className="flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-100"
                >
                  <item.icon className="h-4 w-4" style={{ color: accent }} strokeWidth={1.8} />
                  <p className="text-[10px] font-semibold text-slate-700 leading-tight">{item.title}</p>
                  {item.sub && <p className="text-[10px] text-slate-400">{item.sub}</p>}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background:
                  'linear-gradient(to right, transparent, rgba(0,0,0,0.07), transparent)',
              }}
            />

            {/* Features / tags */}
            {productAny.features && productAny.features.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Key Features
                </p>
                <div className="flex flex-wrap gap-2">
                  {productAny.features.map((feature: string, idx: number) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border"
                      style={{
                        background: `rgba(${accentRgb},0.07)`,
                        color: adjustColor(accent, -10),
                        borderColor: `rgba(${accentRgb},0.2)`,
                      }}
                    >
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications - show only if showSpecifications is not false */}
            {(productAny.showSpecifications !== false) && productAny.specifications && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Specifications
                </p>
                <div
                  className="rounded-2xl overflow-hidden border border-slate-100 bg-white"
                  style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                >
                  {[
                    productAny.specifications.weight && {
                      icon: Package,
                      label: 'Weight',
                      value: `${productAny.specifications.weight} kg`,
                    },
                    productAny.specifications.dimensions && {
                      icon: Ruler,
                      label: 'Dimensions',
                      value: `${productAny.specifications.dimensions.length} × ${productAny.specifications.dimensions.width} × ${productAny.specifications.dimensions.height} ${productAny.specifications.dimensions.unit || 'cm'}`,
                    },
                    productAny.specifications.color && {
                      icon: Palette,
                      label: 'Colour',
                      value: productAny.specifications.color,
                      swatch: productAny.specifications.color,
                    },
                    productAny.specifications.material && {
                      icon: Box,
                      label: 'Material',
                      value: productAny.specifications.material,
                    },
                    productAny.specifications.size && {
                      icon: Ruler,
                      label: 'Size',
                      value: productAny.specifications.size,
                    },
                  ]
                    .filter(Boolean)
                    .map((spec: any, idx, arr) => (
                      <div
                        key={spec.label}
                        className={cn(
                          'flex items-center justify-between px-5 py-3.5 text-sm',
                          idx < arr.length - 1 ? 'border-b border-slate-50' : ''
                        )}
                      >
                        <span className="flex items-center gap-2.5 text-slate-500 font-medium">
                          <spec.icon className="h-4 w-4" strokeWidth={1.8} />
                          {spec.label}
                        </span>
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                          {spec.swatch && (
                            <span
                              className="w-4 h-4 rounded-full border border-slate-200 inline-block"
                              style={{ backgroundColor: spec.swatch }}
                            />
                          )}
                          {spec.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

          </div>
          {/* end right col */}
        </div>
      </main>

      {footerSection && (
        <>
          {footerSection.templateId === 'footer-modern' ? (
            <FooterModern
              content={footerSection.content as any}
              settings={footerSection.settings as any}
              currentPageSlug={`/products/${productId}`}
            />
          ) : (
            <FooterBasic
              content={footerSection.content as any}
              settings={footerSection.settings as any}
              currentPageSlug={`/products/${productId}`}
            />
          )}
        </>
      )}

      <CartDrawer accentColor={accent} />
    </div>
  );
}
