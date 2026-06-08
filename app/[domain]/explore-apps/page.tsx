'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Building2,
  Globe,
  Wrench,
  Car,
  Check,
  Sparkles,
  DollarSign,
  X,
  CreditCard,
  Shield,
  ShoppingBag,
  Calendar,
  Home,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Globe,
  Car,
  ShoppingBag,
  Calendar,
  Home,
};

const gradientMap: Record<string, string> = {
  businessTools: 'from-blue-500 to-blue-600',
  websites: 'from-purple-500 to-purple-600',
  vehicleDealership: 'from-emerald-500 to-emerald-600',
  onlineStore: 'from-orange-500 to-orange-600',
  bookingsApp: 'from-cyan-500 to-cyan-600',
  realEstate: 'from-teal-500 to-teal-600',
};

const defaultApps = [
  {
    appKey: 'businessTools',
    name: 'Business Tools',
    description: 'Essential tools for daily operations including messaging, tasks, and file sharing',
    icon: 'Wrench',
    features: [
      'Team messaging & collaboration',
      'Task management',
      'File storage & sharing',
      'Team calendar',
    ],
    monthlyPrice: 99,
    currency: 'ZAR',
  },
  {
    appKey: 'websites',
    name: 'Websites',
    description: 'Create and manage professional websites with drag-and-drop builder',
    icon: 'Globe',
    features: [
      'Drag-and-drop page builder',
      'Custom domains',
      'SEO optimization',
      'Lead capture forms',
    ],
    monthlyPrice: 199,
    currency: 'ZAR',
  },
  {
    appKey: 'onlineStore',
    name: 'Online Store',
    description: 'Sell products and services online with complete e-commerce solution',
    icon: 'ShoppingBag',
    features: [
      'Product catalog management',
      'Shopping cart & checkout',
      'Multiple payment gateways',
      'Inventory tracking',
    ],
    monthlyPrice: 249,
    currency: 'ZAR',
  },
  {
    appKey: 'bookingsApp',
    name: 'Booking System',
    description: 'Manage appointments and bookings with calendar integration',
    icon: 'Calendar',
    features: [
      'Online appointment scheduling',
      'Calendar synchronization',
      'Automated reminders',
      'Service & staff management',
    ],
    monthlyPrice: 199,
    currency: 'ZAR',
  },
  {
    appKey: 'vehicleDealership',
    name: 'Vehicle Dealership',
    description: 'Complete vehicle inventory management with online listings',
    icon: 'Car',
    features: [
      'Vehicle inventory management',
      'Online listings showcase',
      'Lead management',
      'Multi-branch support',
    ],
    monthlyPrice: 299,
    currency: 'ZAR',
  },
  {
    appKey: 'realEstate',
    name: 'Real Estate',
    description: 'Property listings and management with advanced search',
    icon: 'Home',
    features: [
      'Property listings management',
      'Advanced search & filtering',
      'Image galleries',
      'Lead capture forms',
    ],
    monthlyPrice: 299,
    currency: 'ZAR',
  },
];

const currencyOptions = [
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
];

const exchangeRates: Record<string, number> = {
  ZAR: 1,
  USD: 0.054,
  EUR: 0.049,
  GBP: 0.042,
};

export default function ExploreAppsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const searchParams = useSearchParams();

  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('ZAR');
  const [selectedGateway, setSelectedGateway] = useState<'payfast' | 'paypal'>('payfast');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for success/cancel from payment return
  const paymentSuccess = searchParams.get('payment_success');
  const paymentCancelled = searchParams.get('payment_cancelled');

  // Queries
  const companies = useQuery(
    api.companies.getCompaniesByUser,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const adminSettings = useQuery(
    api.adminSettings.getMyAdminSettings,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const appConfigs = useQuery(api.appConfigs.getPublicAppConfigs);

  // Show success/cancel toasts
  useEffect(() => {
    if (paymentSuccess === 'true') {
      toast.success('Payment successful! Your app is now enabled.');
    }
    if (paymentCancelled === 'true') {
      toast.error('Payment was cancelled. Please try again.');
    }
  }, [paymentSuccess, paymentCancelled]);

  const defaultCompany = companies?.[0];

  // Merge default apps with app configs
  const apps = defaultApps.map((defaultApp) => {
    const config = appConfigs?.find((c) => c.appKey === defaultApp.appKey);
    if (config?.pricing?.enabled) {
      return {
        ...defaultApp,
        monthlyPrice: config.pricing.monthlyPrice,
        currency: config.pricing.currency || 'ZAR',
      };
    }
    return defaultApp;
  });

  // Check which apps are enabled for the default company
  const enabledApps = defaultCompany?.enabledApps || {};

  // Check which payment gateways are enabled
  const payfastEnabled = adminSettings?.payfast?.enabled ?? false;
  const paypalEnabled = adminSettings?.paypal?.enabled ?? false;

  // PayFast only supports ZAR
  const canUsePayFast = selectedCurrency === 'ZAR' && payfastEnabled;
  const canUsePayPal = paypalEnabled;

  const convertPrice = (price: number, fromCurrency: string, toCurrency: string) => {
    const inZar = price / (exchangeRates[fromCurrency] || 1);
    return inZar * (exchangeRates[toCurrency] || 1);
  };

  const handleEnableApp = (app: any) => {
    if (!defaultCompany) {
      toast.error('Please create a company first');
      return;
    }

    setSelectedApp(app);
    setShowPaymentModal(true);

    // Auto-select gateway
    if (canUsePayFast) {
      setSelectedGateway('payfast');
    } else if (canUsePayPal) {
      setSelectedGateway('paypal');
    }
  };

  const handlePayment = async () => {
    if (!user || !defaultCompany || !selectedApp) return;

    if (!canUsePayFast && !canUsePayPal) {
      toast.error('No payment gateway available for the selected currency');
      return;
    }

    setIsProcessing(true);

    try {
      const amount = convertPrice(
        selectedApp.monthlyPrice,
        selectedApp.currency,
        selectedCurrency
      );

      if (selectedGateway === 'payfast') {
        // PayFast only supports ZAR
        if (selectedCurrency !== 'ZAR') {
          toast.error('PayFast only supports South African Rand (ZAR). Please select ZAR or use PayPal.');
          setIsProcessing(false);
          return;
        }

        const paymentGateway = adminSettings?.payfast;
        const isTestMode = paymentGateway?.testMode !== false;

        // Use appropriate credentials based on mode
        let merchantId: string;
        let merchantKey: string;

        if (isTestMode) {
          merchantId = '10000100';
          merchantKey = '46f0cd694581a';
        } else {
          merchantId = paymentGateway?.merchantId || '';
          merchantKey = paymentGateway?.merchantKey || '';

          if (!merchantId || !merchantKey) {
            toast.error('PayFast live credentials are not configured.');
            setIsProcessing(false);
            return;
          }
        }

        const payfastUrl = isTestMode
          ? 'https://sandbox.payfast.co.za/eng/process'
          : 'https://www.payfast.co.za/eng/process';

        // Create form and submit to PayFast
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payfastUrl;

        const params = {
          merchant_id: merchantId,
          merchant_key: merchantKey,
          return_url: `${window.location.origin}/dashboard/app-success?app=${selectedApp.appKey}&gateway=payfast&currency=ZAR&company=${defaultCompany._id}`,
          cancel_url: `${window.location.origin}/explore-apps`,
          notify_url: `${window.location.origin}/api/payfast/notify-app`,
          name_first: user.firstName || '',
          email_address: user.email || '',
          m_payment_id: `${user.id}_${selectedApp.appKey}_${defaultCompany._id}_${Date.now()}`,
          amount: amount.toFixed(2),
          item_name: `${selectedApp.name} - Monthly Subscription`,
          item_description: `Enable access to ${selectedApp.name}`,
        };

        Object.entries(params).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else if (selectedGateway === 'paypal') {
        const paymentGateway = adminSettings?.paypal;
        const isTestMode = paymentGateway?.testMode !== false;

        // Get credentials based on mode
        let clientId: string;
        let clientSecret: string;

        if (isTestMode) {
          clientId = paymentGateway?.testClientId || '';
          clientSecret = paymentGateway?.testClientSecret || '';
        } else {
          clientId = paymentGateway?.liveClientId || '';
          clientSecret = paymentGateway?.liveClientSecret || '';
        }

        if (!clientId || !clientSecret) {
          const modeText = isTestMode ? 'test' : 'live';
          toast.error(`PayPal ${modeText} credentials are not configured.`);
          setIsProcessing(false);
          return;
        }

        // Create subscription via API route
        const response = await fetch('/api/paypal/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: selectedApp.appKey,
            amount: Math.round(amount * 100) / 100,
            currency: selectedCurrency,
            userId: user.id,
            companyId: defaultCompany._id,
            testMode: isTestMode,
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create PayPal subscription');
        }

        if (data.subscriptionId && data.approvalUrl) {
          window.location.href = data.approvalUrl;
        } else {
          throw new Error('No approval URL received from PayPal');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  // Loading states
  if (isLoading || (!user && user !== null)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Explore Apps</span>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Explore Apps</h1>
                    <p className="text-sm text-slate-600">Enable powerful apps for your business</p>
                  </div>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="relative">
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Banner */}
        <div className="mb-10 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Secure Payments</h3>
              <p className="text-sm text-slate-600 max-w-2xl">
                All payments are processed securely through PayFast or PayPal. Choose your preferred payment method and currency.
              </p>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => {
            const Icon = iconMap[app.icon] || Wrench;
            const gradient = gradientMap[app.appKey] || 'from-slate-500 to-slate-600';
            const appState = enabledApps[app.appKey as keyof typeof enabledApps];
            const isEnabled = appState?.enabled ?? false;
            const displayPrice = convertPrice(app.monthlyPrice, app.currency, selectedCurrency);
            const currencyInfo = currencyOptions.find((c) => c.code === selectedCurrency);

            return (
              <div
                key={app.appKey}
                className={`relative bg-white rounded-3xl shadow-lg border-2 transition-all duration-300 overflow-hidden ${
                  isEnabled
                    ? 'border-emerald-200 shadow-emerald-100'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                {/* Gradient accent */}
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />

                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${isEnabled ? gradient : 'bg-slate-100'} shadow-lg`}>
                        <Icon className={`h-7 w-7 ${isEnabled ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{app.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                            isEnabled
                              ? 'bg-emerald-100 text-emerald-700 font-medium'
                              : 'bg-slate-100 text-slate-600 font-medium'
                          }`}
                        >
                          {isEnabled && <Check className="h-3 w-3" />}
                          {isEnabled ? 'Enabled' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-6">{app.description}</p>

                  {/* Pricing */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900">
                        {currencyInfo?.symbol}{displayPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-slate-500">/month</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 mb-6">
                    {app.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isEnabled ? 'bg-emerald-100' : 'bg-slate-100'
                          }`}
                        >
                          {isEnabled ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          )}
                        </div>
                        <span className={`text-sm ${isEnabled ? 'text-slate-700' : 'text-slate-500'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  {isEnabled ? (
                    <div className="flex items-center justify-center gap-2 py-3 px-6 bg-emerald-50 text-emerald-700 rounded-xl font-medium">
                      <Check className="h-5 w-5" />
                      Enabled
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEnableApp(app)}
                      className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-200"
                    >
                      Enable App
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Enable {selectedApp.name}</h3>
                  <p className="text-sm text-slate-600">Choose your payment method</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedApp(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">Currency</label>
                <div className="grid grid-cols-2 gap-3">
                  {currencyOptions.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => setSelectedCurrency(currency.code)}
                      disabled={currency.code !== 'ZAR' && !paypalEnabled}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedCurrency === currency.code
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      } ${currency.code !== 'ZAR' && !paypalEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-lg mr-2">{currency.flag}</span>
                      <span className="font-medium">{currency.code}</span>
                    </button>
                  ))}
                </div>
                {selectedCurrency !== 'ZAR' && !paypalEnabled && (
                  <p className="text-xs text-amber-600 mt-2">
                    PayPal required for non-ZAR currencies
                  </p>
                )}
              </div>

              {/* Payment Gateway Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">Payment Method</label>
                <div className="space-y-3">
                  {payfastEnabled && selectedCurrency === 'ZAR' && (
                    <button
                      onClick={() => setSelectedGateway('payfast')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedGateway === 'payfast'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">PayFast</p>
                          <p className="text-xs text-slate-500">Secure South African payment gateway</p>
                        </div>
                        {adminSettings?.payfast?.testMode && (
                          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                            Test Mode
                          </span>
                        )}
                      </div>
                    </button>
                  )}

                  {paypalEnabled && (
                    <button
                      onClick={() => setSelectedGateway('paypal')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedGateway === 'paypal'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">PayPal</p>
                          <p className="text-xs text-slate-500">Pay with PayPal or credit card</p>
                        </div>
                        {adminSettings?.paypal?.testMode && (
                          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                            Sandbox
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                </div>

                {!canUsePayFast && !canUsePayPal && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-700">
                      No payment gateway available for the selected currency. Please contact support.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3">Order Summary</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600">{selectedApp.name}</span>
                  <span className="font-semibold text-slate-900">
                    {currencyOptions.find((c) => c.code === selectedCurrency)?.symbol}
                    {convertPrice(selectedApp.monthlyPrice, selectedApp.currency, selectedCurrency).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Billing cycle</span>
                  <span>Monthly</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedApp(null);
                  }}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing || (!canUsePayFast && !canUsePayPal)}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-200"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
