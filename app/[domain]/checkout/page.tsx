'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuthGuard, useAuth } from '@/app/[domain]/AuthProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CartDrawer from '@/components/cart/CartDrawer';
import PaymentModal from '@/components/checkout/PaymentModal';
import { NavbarModern } from '@/components/page-builder/renderer/sections/NavbarModern';
import { NavbarBasic } from '@/components/page-builder/renderer/sections/NavbarBasic';
import { FooterBasic } from '@/components/page-builder/renderer/sections/FooterBasic';
import { FooterModern } from '@/components/page-builder/renderer/sections/FooterModern';
import { GeoapifyLocationAutocomplete } from '@/components/ui/geoapify-location-autocomplete';
import { parsePageContent } from '@/lib/page-builder/hooks/usePageContent';
import { 
  ChevronLeft, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  Check,
  Package,
  ArrowRight,
  Loader2,
  Wallet,
  User,
  X,
  LogIn,
  UserPlus
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ShippingOption {
  _id: string;
  name: string;
  description?: string;
  price: number;
  shippingType?: string;
  bobgoServiceCode?: string;
  pickupAddress?: string;
  pickupPostalCode?: string;
  pickupCity?: string;
  pickupProvince?: string;
  pickupCountry?: string;
}

function CheckoutContent() {
  const params = useParams();
  const domain = params.domain as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('productId');
  
  const { items, subtotal, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  
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
  const currencySymbol = company?.currency?.customSymbol || company?.currency?.symbol || 'R';
  const symbolPosition = company?.currency?.symbolPosition || 'before';
  
  // Get logged in user - use useAuth directly to avoid automatic redirect
  const { user: authUser, isLoading: authLoading } = useAuth();
  
  // Debug auth state
  useEffect(() => {
    console.log('[CHECKOUT] Auth state:', { authUser, authLoading });
  }, [authUser, authLoading]);
  
  const homePage = useQuery(
    api.pages.getHomePagePublic,
    website ? { websiteId: website._id } : 'skip'
  );
  
  const navbarSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'navbar') || []
    : [];
  const firstNavbarSection = navbarSections.length > 0 ? navbarSections[0] : null;
  const navbarHeight = firstNavbarSection?.templateId === 'navbar-modern' ? '80px' : '64px';
  const isNavbarSticky = firstNavbarSection?.content?.sticky !== false;
  
  // Extract footer sections from home page
  const footerSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'footer') || []
    : [];
  const footerSection = footerSections.length > 0 ? footerSections[0] : null;
  
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Show auth modal when user is not authenticated and not loading
  useEffect(() => {
    if (!authLoading && !authUser && items.length > 0) {
      setShowAuthModal(true);
    }
  }, [authUser, authLoading, items.length]);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingName: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: '',
  });
  
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    suburb: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
  } | null>(null);
  
  const handleLocationChange = (location: {
    address: string;
    suburb: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
  }) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      shippingAddress: location.address || '',
      shippingCity: location.city || '',
      shippingState: location.province || '',
      shippingZipCode: location.postalCode || '',
      shippingCountry: location.country || 'South Africa',
    }));
  };
  
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  
  // BobGo shipping calculation
  const [bobgoCalculatedPrice, setBobgoCalculatedPrice] = useState<number | null>(null);
  const [isCalculatingBobgo, setIsCalculatingBobgo] = useState(false);
  const [bobgoError, setBobgoError] = useState<string | null>(null);
  
  const cartCompanyId = items.length > 0 && items[0].companyId ? items[0].companyId : '';
  const finalCompanyId = domainCompanyId || cartCompanyId;
  
  const singleProduct = useQuery(
    api.products.getProductByIdPublic, 
    productId ? { productId } : 'skip'
  );
  
  const shippingOptions = useQuery(
    api.orders.getShippingOptionsPublic,
    finalCompanyId ? { companyId: finalCompanyId } : 'skip'
  );
  
  // Debug shipping options
  useEffect(() => {
    console.log('[CHECKOUT] Shipping options:', shippingOptions);
    if (shippingOptions && shippingOptions.length > 0) {
      const firstOpt = shippingOptions[0] as any;
      console.log('[CHECKOUT] First shipping option:', firstOpt);
      console.log('[CHECKOUT] First option shippingType:', firstOpt?.shippingType);
      console.log('[CHECKOUT] Has bobgo:', shippingOptions.some((o: any) => o.shippingType === 'bobgo'));
    }
  }, [shippingOptions]);
  
  const companyPaymentSettings = useQuery(
    api.companies.getCompanyPaymentSettingsPublic,
    finalCompanyId ? { companyId: finalCompanyId } : 'skip'
  );
  
  const createOrder = useMutation(api.orders.createOrder);
  
  // Calculate shipping cost - use BobGo calculated price if available
  const shippingCost = selectedShipping?.shippingType === 'bobgo' && bobgoCalculatedPrice !== null
    ? bobgoCalculatedPrice
    : selectedShipping?.price || 0;
    
  const taxRate = 0.15;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;

  // Function to calculate BobGo shipping rates
  const calculateBobgoRates = async () => {
    console.log('[CHECKOUT] calculateBobgoRates called');
    console.log('[CHECKOUT] selectedShipping:', selectedShipping);
    console.log('[CHECKOUT] formData:', formData);
    console.log('[CHECKOUT] items:', items);
    
    if (selectedShipping?.shippingType !== 'bobgo') {
      console.log('[CHECKOUT] Not BobGo shipping type, skipping');
      setBobgoCalculatedPrice(null);
      setBobgoError(null);
      return;
    }

    // Check if we have shipping address
    if (!formData.shippingAddress || !formData.shippingZipCode || !formData.shippingCity) {
      console.log('[CHECKOUT] Missing shipping address fields');
      setBobgoError('Please enter shipping address to calculate rates');
      return;
    }

    setIsCalculatingBobgo(true);
    setBobgoError(null);

    try {
      // Get product info for dimensions/weight
      const itemsWithDimensions = items.map(item => ({
        weight: item.specifications?.weight || 0.5,
        length: item.specifications?.dimensions?.length || 20,
        width: item.specifications?.dimensions?.width || 15,
        height: item.specifications?.dimensions?.height || 10,
      }));

      console.log('[CHECKOUT] Sending request to /api/bobgo/rates');
      console.log('[CHECKOUT] Request payload:', {
        shippingOptionId: selectedShipping._id,
        destinationAddress: formData.shippingAddress,
        destinationPostalCode: formData.shippingZipCode,
        destinationCity: formData.shippingCity,
        destinationProvince: formData.shippingState || '',
        destinationCountry: formData.shippingCountry || 'ZA',
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        items: itemsWithDimensions,
      });

      const response = await fetch('/api/bobgo/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingOptionId: selectedShipping._id,
          destinationAddress: formData.shippingAddress,
          destinationPostalCode: formData.shippingZipCode,
          destinationCity: formData.shippingCity,
          destinationProvince: formData.shippingState || '',
          destinationCountry: formData.shippingCountry || 'ZA',
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          items: itemsWithDimensions,
        }),
      });

      const data = await response.json();
      console.log('[CHECKOUT] API Response status:', response.status);
      console.log('[CHECKOUT] API Response:', JSON.stringify(data, null, 2));

      if (data.success) {
        // Extract price from ratesData.provider_rate_requests
        const ratesData = data.ratesData;
        let price = 0;
        
        if (ratesData?.provider_rate_requests) {
          for (const provider of ratesData.provider_rate_requests) {
            if (provider.status === 'success' && provider.responses?.length > 0) {
              for (const response of provider.responses) {
                if (response.status === 'success' && response.rate_amount > 0) {
                  price = response.rate_amount;
                  console.log('[CHECKOUT] Found price:', price, 'from', provider.provider_name);
                  break;
                }
              }
            }
            if (price > 0) break;
          }
        }
        
        if (price > 0) {
          console.log('[CHECKOUT] SUCCESS - Got price:', price);
          setBobgoCalculatedPrice(price);
        } else {
          console.log('[CHECKOUT] FAILED - No price found, falling back to manual price:', selectedShipping.price);
          setBobgoCalculatedPrice(selectedShipping.price);
        }
      } else {
        console.log('[CHECKOUT] FAILED - API error:', data.error || 'Unknown');
        setBobgoCalculatedPrice(selectedShipping.price);
        if (data.error) {
          setBobgoError(data.error);
        }
      }
    } catch (error) {
      console.error('[CHECKOUT] Error calculating BobGo rates:', error);
      setBobgoError('Failed to calculate shipping rates');
      // Fallback to manual price
      setBobgoCalculatedPrice(selectedShipping.price);
    } finally {
      setIsCalculatingBobgo(false);
    }
  };

  // Trigger BobGo rate calculation when shipping option changes to BobGo type
  useEffect(() => {
    console.log('[CHECKOUT] BobGo trigger effect:', { 
      shippingType: selectedShipping?.shippingType, 
      hasAddress: !!formData.shippingAddress,
      selectedId: selectedShipping?._id
    });
    
    if (selectedShipping?.shippingType === 'bobgo' && formData.shippingAddress) {
      console.log('[CHECKOUT] Calling calculateBobgoRates');
      calculateBobgoRates();
    } else {
      setBobgoCalculatedPrice(null);
      setBobgoError(null);
    }
  }, [selectedShipping?._id, selectedShipping?.shippingType, formData.shippingAddress]);

  // Prefill contact info from logged in user
  useEffect(() => {
    if (authUser) {
      const fullName = `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim();
      setFormData(prev => ({
        ...prev,
        customerName: prev.customerName || fullName,
        customerEmail: prev.customerEmail || authUser.email || '',
        customerPhone: prev.customerPhone || authUser.contactNumber || '',
      }));
    }
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerEmail || !formData.shippingAddress || !selectedShipping) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Check if any online payment gateway is enabled
    const isOnlinePayment = companyPaymentSettings?.payfast?.enabled || companyPaymentSettings?.paypal?.enabled;
    
    setIsLoading(true);
    try {
      const orderItems = items.map(item => ({
        productId: item.productId,
        productName: item.name,
        productImage: item.image,
        productPrice: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));
      
      const result = await createOrder({
        companyId: finalCompanyId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || undefined,
        shippingName: formData.shippingName || undefined,
        shippingAddress: formData.shippingAddress || undefined,
        shippingCity: formData.shippingCity || undefined,
        shippingState: formData.shippingState || undefined,
        shippingZipCode: formData.shippingZipCode || undefined,
        shippingCountry: formData.shippingCountry || undefined,
        shippingOptionId: selectedShipping._id,
        shippingMethodName: selectedShipping.name,
        shippingPrice: selectedShipping.price,
        items: orderItems,
        subtotal,
        taxAmount,
        total,
        paymentMethod: isOnlinePayment ? 'online' : 'cash',
      });
      
      setCreatedOrderId(result.orderId);
      setCreatedOrderNumber(result.orderNumber);
      
      if (isOnlinePayment) {
        // Immediately open payment modal
        setShowPaymentModal(true);
      } else {
        // For cash on delivery, go directly to success
        clearCart();
        router.push(`/checkout/success?orderId=${result.orderId}&orderNumber=${result.orderNumber}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePaymentSuccess = (_paymentId: string) => {
    clearCart();
    router.push(`/checkout/success?orderId=${createdOrderId}&orderNumber=${createdOrderNumber}`);
  };
  
  if (items.length === 0 && !productId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center gap-4">
        <ShoppingBag className="h-16 w-16 text-slate-300" />
        <h1 className="text-2xl font-bold text-slate-700">Your cart is empty</h1>
        <p className="text-slate-500">Add some products to your cart to checkout.</p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  // Show auth modal for unauthenticated users - don't render page content
  if (!authLoading && !authUser && items.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Navbar(s) */}
        {navbarSections.map((section: any, index: number) => (
          section.templateId === 'navbar-modern' ? (
            <NavbarModern
              key={section.id || index}
              content={section.content as any}
              settings={section.settings as any}
              currentPageSlug="/checkout"
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
              currentPageSlug="/checkout"
              websiteId={website?._id as any}
              templateId={section.templateId as any}
              sectionId={section.id as any}
              homePageSlug={homePage?.slug as any}
            />
          ) : null
        ))}
        
        {/* Auth Modal */}
        <Dialog open={true} onOpenChange={(open) => {
          if (!open) {
            router.push('/');
          }
        }}>
          <DialogContent className="max-w-md mx-auto p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 text-center">
                Login Required
              </DialogTitle>
            </DialogHeader>
            
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-violet-600" />
              </div>
              <p className="text-slate-600 mb-2">
                Please register or login to proceed to checkout.
              </p>
              <p className="text-sm text-slate-500">
                Your cart items will be saved while you complete this step.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 mt-4">
              <Button
                onClick={() => {
                  localStorage.setItem('checkoutRedirect', window.location.pathname);
                  router.push('/auth/login');
                }}
                className="w-full py-3 flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem('checkoutRedirect', window.location.pathname);
                  router.push('/auth/register');
                }}
                className="w-full py-3 flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Register
              </Button>
            </div>
            
            <button
              onClick={() => router.push('/')}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-3"
            >
              Continue Shopping
            </button>
          </DialogContent>
        </Dialog>
        
        {footerSection && (
          <>
            {footerSection.templateId === 'footer-modern' ? (
              <FooterModern
                content={footerSection.content as any}
                settings={footerSection.settings as any}
                currentPageSlug="/checkout"
              />
            ) : (
              <FooterBasic
                content={footerSection.content as any}
                settings={footerSection.settings as any}
                currentPageSlug="/checkout"
              />
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navbar(s) - render all navbar sections from home page */}
      {navbarSections.map((section: any, index: number) => (
        section.templateId === 'navbar-modern' ? (
          <NavbarModern
            key={section.id || index}
            content={section.content as any}
            settings={section.settings as any}
            currentPageSlug="/checkout"
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
            currentPageSlug="/checkout"
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
            currentPageSlug="/checkout"
            websiteId={website?._id as any}
            templateId={section.templateId as any}
            sectionId={section.id as any}
            homePageSlug={homePage?.slug as any}
          />
        )
      ))}
      
      {!firstNavbarSection && (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Back to Shop</span>
              </Link>
              
              <h1 className="text-xl font-bold text-slate-900">Checkout</h1>
              
              <div className="w-20"></div>
            </div>
          </div>
        </header>
      )}
      
      <div className="container mx-auto px-4 py-8" style={isNavbarSticky && firstNavbarSection ? { marginTop: navbarHeight } : {}}>
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </h2>
              
              {authUser ? (
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Full Name</p>
                      <p className="text-slate-900 font-medium">{formData.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Email</p>
                      <p className="text-slate-900 font-medium">{formData.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Phone</p>
                      <p className="text-slate-900 font-medium">{formData.customerPhone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <Link 
                      href={`/profile`}
                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      Update your profile information
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Shipping Address */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Search Address *</label>
                  <GeoapifyLocationAutocomplete
                    value={selectedLocation || undefined}
                    onChange={handleLocationChange}
                    placeholder="Search for an address in South Africa (suburb, street, city)..."
                    required
                  />
                </div>
                {selectedLocation && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Street Address</p>
                        <p className="text-slate-900">{selectedLocation.address || formData.shippingAddress || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Suburb</p>
                        <p className="text-slate-900">{selectedLocation.suburb || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">City</p>
                        <p className="text-slate-900">{selectedLocation.city || formData.shippingCity || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Province</p>
                        <p className="text-slate-900">{selectedLocation.province || formData.shippingState || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Postal Code</p>
                        <p className="text-slate-900">{selectedLocation.postalCode || formData.shippingZipCode || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Country</p>
                        <p className="text-slate-900">{selectedLocation.country || formData.shippingCountry || 'South Africa'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Shipping Method */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Shipping Method</h2>
              <div className="space-y-3">
                {shippingOptions?.map((option: ShippingOption) => (
                  <label
                    key={option._id}
                    className="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all"
                    style={{
                      borderColor: selectedShipping?._id === option._id ? accentColor : '#e2e8f0',
                      backgroundColor: selectedShipping?._id === option._id ? `${accentColor}10` : 'transparent'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        value={option._id}
                        checked={selectedShipping?._id === option._id}
                        onChange={() => setSelectedShipping(option)}
                        className="w-4 h-4"
                        style={{ accentColor }}
                      />
                      <div>
                        <p className="font-medium text-slate-900">{option.name}</p>
                        {option.description && <p className="text-sm text-slate-500">{option.description}</p>}
                        {option.shippingType === 'bobgo' && (
                          <p className="text-xs text-orange-600 mt-1">Dynamic rate calculation</p>
                        )}
                      </div>
                    </div>
                    {option.shippingType === 'bobgo' ? (
                      <div className="text-right">
                        {isCalculatingBobgo ? (
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Calculating...
                          </span>
                        ) : bobgoCalculatedPrice !== null && selectedShipping?._id === option._id ? (
                          <span className="font-semibold text-slate-900">{formatPrice(bobgoCalculatedPrice)}</span>
                        ) : (
                          <span className="text-sm text-slate-500">Calculated at checkout</span>
                        )}
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-900">{formatPrice(option.price)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-lg"
              style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}dd)` }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {companyPaymentSettings?.payfast?.enabled || companyPaymentSettings?.paypal?.enabled ? (
                    <>Proceed to Payment - {formatPrice(total)}</>
                  ) : (
                    <>Place Order - {formatPrice(total)}</>
                  )}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-slate-300" />
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-sm text-slate-500">{formatPrice(item.price)} x {item.quantity}</p>
                    </div>
                    <p className="font-medium text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="text-slate-900">{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax</span>
                  <span className="text-slate-900">{formatPrice(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span style={{ color: accentColor }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* Auth Modal for unverified users */}
      <Dialog open={showAuthModal && !authUser && items.length > 0} onOpenChange={(open) => {
        if (!open && !authUser) {
          // If closing and still not logged in, redirect to home
          router.push('/');
        }
      }}>
        <DialogContent className="max-w-md mx-auto p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 text-center">
              Login Required
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-violet-600" />
            </div>
            <p className="text-slate-600 mb-2">
              Please register or login to proceed to checkout.
            </p>
            <p className="text-sm text-slate-500">
              Your cart items will be saved while you complete this step.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() => {
                // Save current URL for redirect after login
                localStorage.setItem('checkoutRedirect', window.location.pathname);
                router.push('/auth/login');
              }}
              className="w-full py-3 flex items-center justify-center gap-2"
              style={{ backgroundColor: accentColor }}
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Save current URL for redirect after registration
                localStorage.setItem('checkoutRedirect', window.location.pathname);
                router.push('/auth/register');
              }}
              className="w-full py-3 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Register
            </Button>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-3"
          >
            Continue Shopping
          </button>
        </DialogContent>
      </Dialog>
      
      <CartDrawer accentColor={accentColor} />
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          if (!createdOrderId) {
            router.push('/checkout');
          }
        }}
        total={total}
        orderId={createdOrderId || ''}
        orderNumber={createdOrderNumber || ''}
        companyId={finalCompanyId}
        companyPaymentSettings={companyPaymentSettings as any}
        onPaymentSuccess={handlePaymentSuccess}
        accentColor={accentColor}
        currencySymbol={currencySymbol}
        symbolPosition={symbolPosition as 'before' | 'after'}
      />

      {footerSection && (
        <>
          {footerSection.templateId === 'footer-modern' ? (
            <FooterModern
              content={footerSection.content as any}
              settings={footerSection.settings as any}
              currentPageSlug="/checkout"
            />
          ) : (
            <FooterBasic
              content={footerSection.content as any}
              settings={footerSection.settings as any}
              currentPageSlug="/checkout"
            />
          )}
        </>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
