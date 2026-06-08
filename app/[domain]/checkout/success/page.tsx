'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { NavbarModern } from '@/components/page-builder/renderer/sections/NavbarModern';
import { NavbarBasic } from '@/components/page-builder/renderer/sections/NavbarBasic';
import { FooterBasic } from '@/components/page-builder/renderer/sections/FooterBasic';
import { FooterModern } from '@/components/page-builder/renderer/sections/FooterModern';
import { parsePageContent } from '@/lib/page-builder/hooks/usePageContent';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  Mail, 
  ArrowRight,
  Copy,
  Facebook,
  Twitter,
  MessageCircle,
  Loader2,
  MapPin,
  CreditCard,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function SuccessContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const domain = params.domain as string;
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const paymentStatus = searchParams.get('payment');
  
  const [copied, setCopied] = useState(false);
  
  const website = useQuery(
    api.websites.getWebsiteByDomainPublic,
    domain ? { domain } : 'skip'
  ) as any;
  const domainCompanyId = website?.companyId || '';
  
  // Fetch company for branding colors (only if we have a valid companyId)
  const company = useQuery(
    api.companies.getByCompanyIdPublic,
    domainCompanyId && domainCompanyId.length > 0 ? { companyId: domainCompanyId } : 'skip'
  ) as any;
  
  const accentColor = company?.branding?.primaryColor || website?.branding?.primaryColor || '#219c94';
  
  // Fetch home page to get navbar sections
  const homePage = useQuery(
    api.pages.getHomePagePublic,
    website ? { websiteId: website._id } : 'skip'
  );
  
  // Extract navbar sections from home page
  const navbarSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'navbar') || []
    : [];
  
  // Get the first navbar to determine height/sticky settings (for backward compatibility)
  const firstNavbarSection = navbarSections.length > 0 ? navbarSections[0] : null;
  const navbarHeight = firstNavbarSection?.templateId === 'navbar-modern' ? '80px' : '64px';
  const isNavbarSticky = firstNavbarSection?.content?.sticky !== false;
  
  // Extract footer sections from home page
  const footerSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'footer') || []
    : [];
  const footerSection = footerSections.length > 0 ? footerSections[0] : null;
  
  const order = useQuery(
    api.orders.getOrderByIdPublic,
    orderId ? { orderId: orderId as any } : 'skip'
  ) as any;
  
  const handleCopyOrderNumber = async () => {
    if (orderNumber || order?.orderNumber) {
      await navigator.clipboard.writeText(orderNumber || order?.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatPrice = (price: number) => {
    return `R${price.toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const primaryColor = accentColor;
  const displayCompanyName = website?.name || order?.companyName || 'Our Store';

  const displayOrderNumber = orderNumber || order?.orderNumber;
  const orderItems = order?.items || [];

  const isLoading = !order && orderId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navbar(s) - render all navbar sections from home page */}
      {navbarSections.map((section: any, index: number) => (
        section.templateId === 'navbar-modern' ? (
          <NavbarModern
            key={section.id || index}
            content={section.content as any}
            settings={section.settings as any}
            currentPageSlug="/checkout/success"
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
            currentPageSlug="/checkout/success"
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
            currentPageSlug="/checkout/success"
            websiteId={website?._id as any}
            templateId={section.templateId as any}
            sectionId={section.id as any}
            homePageSlug={homePage?.slug as any}
          />
        )
      ))}
      
      {/* Success Content with proper spacing after navbar */}
      <div className="container mx-auto px-4 py-16" style={isNavbarSticky && firstNavbarSection ? { marginTop: navbarHeight } : {}}>
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div 
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center animate-pulse"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle2 className="h-12 w-12" style={{ color: primaryColor }} />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-lg text-slate-600">
              Thank you for your purchase{order?.customerName ? `, ${order.customerName}` : ''}. We&apos;re preparing your order.
            </p>
          </div>
          
          {/* Order Details Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
            <div 
              className="px-6 py-4"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}
            >
              <h2 className="text-white font-semibold">Order Details</h2>
            </div>
            
            {isLoading ? (
              <div className="p-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: primaryColor }} />
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {displayOrderNumber && (
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600">Order Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{displayOrderNumber}</span>
                      <button
                        onClick={handleCopyOrderNumber}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {order?.createdAt && (
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600">Order Date</span>
                    <span className="font-medium text-slate-900">{formatDate(order.createdAt)}</span>
                  </div>
                )}

                {order?.paymentMethod && (
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600">Payment Method</span>
                    <span className="font-medium text-slate-900 capitalize">
                      {order.paymentMethod === 'online' ? 'Online Payment' : order.paymentMethod}
                    </span>
                  </div>
                )}

                {order?.paymentStatus && (
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600">Payment Status</span>
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium capitalize"
                      style={{ 
                        backgroundColor: order.paymentStatus === 'paid' ? '#dcfce7' : order.paymentStatus === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: order.paymentStatus === 'paid' ? '#166534' : order.paymentStatus === 'pending' ? '#92400e' : '#991b1b'
                      }}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 py-3">
                  <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                  <span className="text-slate-600">
                    Confirmation email sent to {order?.customerEmail || 'your email address'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Order Items</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {orderItems.map((item: any, index: number) => (
                  <div key={index} className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.productImage ? (
                        <Image 
                          src={item.productImage} 
                          alt={item.productName} 
                          width={64} 
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{item.productName}</p>
                      <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-900">{formatPrice(item.total)}</p>
                  </div>
                ))}
              </div>
              {order && (
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="text-slate-900">{formatPrice(order.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Shipping</span>
                      <span className="text-slate-900">{formatPrice(order.shippingPrice || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax</span>
                      <span className="text-slate-900">{formatPrice(order.taxAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
                      <span>Total</span>
                      <span style={{ color: primaryColor }}>{formatPrice(order.total || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shipping Address */}
          {order?.shippingAddress && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                  Shipping Address
                </h3>
              </div>
              <div className="p-6">
                <p className="text-slate-600">
                  {order.shippingAddress}
                  {order.shippingCity && `, ${order.shippingCity}`}
                  {order.shippingState && `, ${order.shippingState}`}
                  {order.shippingZipCode && ` ${order.shippingZipCode}`}
                  {order.shippingCountry && `, ${order.shippingCountry}`}
                </p>
                {order.shippingMethodName && (
                  <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {order.shippingMethodName}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Order Steps */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 text-center">
              <div 
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Package className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Order Placed</h3>
              <p className="text-sm text-slate-500">Your order has been received</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 text-center">
              <div 
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Truck className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Processing</h3>
              <p className="text-sm text-slate-500">We&apos;re preparing your items</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Delivered</h3>
              <p className="text-sm text-slate-500">Expected within 3-5 days</p>
            </div>
          </div>
          
          {/* Share Section */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <p className="text-center text-slate-600 mb-4">Share your purchase with friends</p>
            <div className="flex items-center justify-center gap-3">
              <button className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                <Facebook className="h-5 w-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              className="flex-1 h-12 rounded-xl"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}
            >
              <Link href="/">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {footerSection && (
        <>
          {footerSection.templateId === 'footer-modern' ? (
            <FooterModern
              content={footerSection.content as any}
              settings={footerSection.settings as any}
              currentPageSlug="/checkout/success"
            />
          ) : (
            <FooterBasic
              content={footerSection.content as any}
              settings={footerSection.settings as any}
              currentPageSlug="/checkout/success"
            />
          )}
        </>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
