'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter as useNextRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Building2,
  Globe,
  Wrench,
  Car,
  Check,
  Sparkles,
  DollarSign,
  ShoppingBag,
  Calendar,
  Home,
  X,
  CreditCard,
  Shield,
} from 'lucide-react';

// Currency configuration
const currencyOptions = [
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 0.055 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.051 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.044 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rate: 0.085 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', rate: 0.075 },
];

interface AppCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  appKey: string;
  enabled: boolean;
  enabledAt?: number;
  onRequestEnable: (appKey: string, app: any) => void;
  onDisable: (appKey: string) => void;
  isLoading: boolean;
  gradient: string;
  features: string[];
  pricing?: {
    monthlyPrice: number;
    yearlyPrice?: number;
    currency?: string;
    enabled: boolean;
  } | null;
  displayPrice?: string;
  currencyInfo?: typeof currencyOptions[0];
  comingSoon?: boolean;
}

function AppCard({
  title,
  description,
  icon: Icon,
  appKey,
  enabled,
  enabledAt,
  onRequestEnable,
  onDisable,
  isLoading,
  gradient,
  features,
  pricing,
  displayPrice,
  currencyInfo,
  comingSoon,
}: AppCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);

  const handleEnable = () => {
    if (comingSoon) return;
    onRequestEnable(appKey, { title, description, gradient, features, pricing });
  };

  const handleDisable = () => {
    if (comingSoon) return;
    onDisable(appKey);
  };

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-md border transition-all duration-300 overflow-hidden group ${
        enabled
          ? 'border-emerald-200 shadow-emerald-50'
          : 'border-slate-200 hover:border-slate-300'
      } ${comingSoon ? 'opacity-75' : ''}`}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Gradient accent */}
      <div className={`h-1.5 ${gradient}`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${gradient} shadow-sm`}
            >
              <Icon
                className="h-5 w-5 text-white"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                {comingSoon && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                    Soon
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            enabled
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {/* Pricing Display - Always show */}
        <div className="mb-3 p-2.5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3 w-3 text-emerald-600" />
            <span className="text-xs font-medium text-slate-700">Pricing</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">
              {displayPrice || 'Free'}
            </span>
            <span className="text-xs text-slate-500">/month</span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-1.5">
          {features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  enabled ? 'bg-emerald-100' : 'bg-slate-100'
                }`}
              >
                {enabled ? (
                  <Check className="h-2.5 w-2.5 text-emerald-600" />
                ) : (
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                )}
              </div>
              <span className={`text-xs ${enabled ? 'text-slate-600' : 'text-slate-500'}`}>
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Status footer */}
        {enabled && enabledAt && (
          <div className="mt-3 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Enabled {new Date(enabledAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      {showOverlay && !comingSoon && !isLoading && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center transition-all duration-200 z-10">
          <div className="flex flex-col gap-2">
            {enabled ? (
              <button
                onClick={handleDisable}
                className="px-6 py-2.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-colors shadow-lg"
              >
                Disable App
              </button>
            ) : (
              <button
                onClick={handleEnable}
                className="px-6 py-2.5 bg-emerald-500/90 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm transition-colors shadow-lg"
              >
                Enable App
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}

export default function CompanyAppsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  const [togglingApp, setTogglingApp] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('ZAR');
  const [selectedGateway, setSelectedGateway] = useState<'payfast' | 'paypal'>('payfast');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [detectedCurrency, setDetectedCurrency] = useState('ZAR');

  // Queries
  const company = useQuery(
    api.companies.getCompanyWithApps,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : 'skip'
  );

  const appConfigs = useQuery(api.appConfigs.getPublicAppConfigs);

  // Debug: Log appConfigs to see what's being fetched
  useEffect(() => {
    if (appConfigs) {
      console.log('App Configs from DB:', appConfigs);
      console.log('Business Tools pricing:', appConfigs.find((c: any) => c.appKey === 'businessTools')?.pricing);
    }
  }, [appConfigs]);

  const adminSettings = useQuery(
    api.adminSettings.getMyAdminSettings,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  // Mutation
  const toggleApp = useMutation(api.companies.toggleCompanyApp);

  // Detect currency based on IP
  useEffect(() => {
    const detectCurrency = async () => {
      const savedCurrency = localStorage.getItem('selectedCurrency');
      if (savedCurrency && currencyOptions.find(c => c.code === savedCurrency)) {
        setSelectedCurrency(savedCurrency);
        setDetectedCurrency(savedCurrency);
        return;
      }

      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        const countryToCurrency: Record<string, string> = {
          'US': 'USD', 'GB': 'GBP', 'AU': 'AUD', 'CA': 'CAD', 'ZA': 'ZAR',
          'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
        };

        const detected = countryToCurrency[data.country_code] || 'ZAR';
        setDetectedCurrency(detected);
        setSelectedCurrency(detected);
        localStorage.setItem('selectedCurrency', detected);
      } catch (error) {
        console.error('Failed to detect currency:', error);
      }
    };

    detectCurrency();
  }, []);

  // Check which payment gateways are enabled
  const payfastEnabled = (company?.paymentSettings?.payfast?.enabled) ?? adminSettings?.payfast?.enabled ?? false;
  const paypalEnabled = (company?.paymentSettings?.paypal?.enabled) ?? adminSettings?.paypal?.enabled ?? false;

  const currentCurrencyInfo = currencyOptions.find(c => c.code === selectedCurrency) || currencyOptions[0];

  const convertPrice = (priceInZAR: number, fromCurrency: string = 'ZAR') => {
    const fromRate = currencyOptions.find(c => c.code === fromCurrency)?.rate || 1;
    const toRate = currentCurrencyInfo.rate;
    const priceInBase = priceInZAR / fromRate;
    return priceInBase * toRate;
  };

  const formatPrice = (price: number, currencyCode: string) => {
    const currency = currencyOptions.find(c => c.code === currencyCode) || currencyOptions[0];
    return `${currency.symbol}${price.toFixed(2)}`;
  };

  const handleRequestEnable = (appKey: string, app: any) => {
    // Check if app requires payment
    const appPricing = app.pricing;
    const requiresPayment = appPricing?.enabled && appPricing?.monthlyPrice > 0;

    if (requiresPayment) {
      setSelectedApp({ ...app, appKey });
      setShowPaymentModal(true);

      // Auto-select gateway based on currency and availability
      if (selectedCurrency === 'ZAR' && payfastEnabled) {
        setSelectedGateway('payfast');
      } else if (paypalEnabled) {
        setSelectedGateway('paypal');
      } else if (payfastEnabled) {
        setSelectedGateway('payfast');
      }
    } else {
      // Free app - enable directly
      handleToggleApp(appKey, true);
    }
  };

  const handleDisable = (appKey: string) => {
    handleToggleApp(appKey, false);
  };

  const handleToggleApp = async (appKey: string, enabled: boolean) => {
    setTogglingApp(appKey);
    try {
      await toggleApp({
        userId: user?.id as any,
        companyId: companyId as any,
        appKey,
        enabled,
      });
      toast.success(
        enabled
          ? `${getAppTitle(appKey)} enabled successfully`
          : `${getAppTitle(appKey)} disabled`
      );
    } catch (error) {
      console.error('Error toggling app:', error);
      toast.error('Failed to update app status');
    } finally {
      setTogglingApp(null);
    }
  };

  const handlePayment = async () => {
    if (!user || !company || !selectedApp) return;

    const canUsePayFast = selectedCurrency === 'ZAR' && payfastEnabled;
    const canUsePayPal = paypalEnabled;

    if (!canUsePayFast && !canUsePayPal) {
      toast.error('No payment gateway available for the selected currency');
      return;
    }

    setIsProcessing(true);

    try {
      const basePrice = selectedApp.pricing?.monthlyPrice || 0;
      const baseCurrency = selectedApp.pricing?.currency || 'ZAR';
      const amount = convertPrice(basePrice, baseCurrency);

      if (selectedGateway === 'payfast') {
        const companyPayfast = company?.paymentSettings?.payfast;
        const adminPayfast = adminSettings?.payfast;
        const paymentGateway = companyPayfast || adminPayfast;
        const isTestMode = paymentGateway?.testMode !== false;

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

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payfastUrl;

        const params = {
          merchant_id: merchantId,
          merchant_key: merchantKey,
          return_url: `${window.location.origin}/dashboard/app-success?app=${selectedApp.appKey}&gateway=payfast&currency=${selectedCurrency}&company=${companyId}`,
          cancel_url: `${window.location.origin}/companies/${companyId}/apps`,
          notify_url: `${window.location.origin}/api/payfast/notify-app`,
          name_first: user.firstName || '',
          email_address: user.email || '',
          m_payment_id: `${user.id}_${selectedApp.appKey}_${companyId}_${Date.now()}`,
          amount: amount.toFixed(2),
          item_name: `${selectedApp.title} - Monthly Subscription`,
          item_description: `Enable access to ${selectedApp.title}`,
        };

        Object.entries(params).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
      } else if (selectedGateway === 'paypal') {
        const companyPaypal = company?.paymentSettings?.paypal;
        const adminPaypal = adminSettings?.paypal;
        const paymentGateway = companyPaypal || adminPaypal;
        const isTestMode = paymentGateway?.testMode !== false;

        let clientId: string;
        let clientSecret: string;

        if (isTestMode) {
          clientId = paymentGateway?.testClientId?.trim() || '';
          clientSecret = paymentGateway?.testClientSecret?.trim() || '';
        } else {
          clientId = paymentGateway?.liveClientId?.trim() || '';
          clientSecret = paymentGateway?.liveClientSecret?.trim() || '';
        }

        // Debug logging
        console.log('PayPal payment debug:', {
          hasPaymentGateway: !!paymentGateway,
          isTestMode,
          clientIdLength: clientId.length,
          clientSecretLength: clientSecret.length,
          clientIdPreview: clientId ? `${clientId.substring(0, 10)}...` : 'none',
        });

        if (!clientId || !clientSecret) {
          const modeText = isTestMode ? 'test' : 'live';
          toast.error(`PayPal ${modeText} credentials are not configured. Please configure them in Admin Settings.`);
          setIsProcessing(false);
          return;
        }

        // PayPal only supports certain currencies - default to USD if not supported
        const supportedPayPalCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF', 'NZD', 'SGD', 'HKD'];
        const paypalCurrency = supportedPayPalCurrencies.includes(selectedCurrency) ? selectedCurrency : 'USD';

        // Recalculate amount for PayPal currency if different
        const paypalCurrencyInfo = currencyOptions.find(c => c.code === paypalCurrency) || currencyOptions[1]; // Default to USD
        const paypalAmount = selectedCurrency === paypalCurrency
          ? amount
          : convertPrice(selectedApp.pricing?.monthlyPrice || 0, selectedApp.pricing?.currency || 'ZAR') * (paypalCurrencyInfo.rate / currentCurrencyInfo.rate);

        const response = await fetch('/api/paypal/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: selectedApp.appKey,
            amount: Math.round(paypalAmount * 100) / 100,
            currency: paypalCurrency,
            userId: user.id,
            companyId: companyId,
            testMode: isTestMode,
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
            userEmail: user.email,
            userFirstName: user.firstName,
            userLastName: user.lastName,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('PayPal error response:', data);
          throw new Error(data.details ? `${data.error}: ${JSON.stringify(data.details)}` : (data.error || 'Failed to create PayPal subscription'));
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

  const getAppTitle = (appKey: string) => {
    const titles: Record<string, string> = {
      businessTools: 'Business Tools',
      websites: 'Websites',
      vehicleDealership: 'Vehicle Dealership',
      onlineStore: 'Online Store',
      bookingsApp: 'Booking System',
      realEstate: 'Real Estate',
    };
    return titles[appKey] || 'App';
  };

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Wrench,
    Globe,
    Car,
    ShoppingBag,
    Calendar,
    Home,
  };

  const gradientMap: Record<string, string> = {
    businessTools: 'bg-gradient-to-r from-blue-500 to-blue-600',
    websites: 'bg-gradient-to-r from-purple-500 to-purple-600',
    vehicleDealership: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    onlineStore: 'bg-gradient-to-r from-orange-500 to-orange-600',
    bookingsApp: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
    realEstate: 'bg-gradient-to-r from-teal-500 to-teal-600',
  };

  const defaultApps = [
    {
      title: 'Business Tools',
      description: 'Essential tools for daily operations',
      icon: Wrench,
      appKey: 'businessTools',
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      features: [
        'Client management & CRM',
        'Products & services catalog',
        'Quotes & invoices',
        'Payment tracking',
        'Lead management',
        'User roles and departments',
        'Team messaging & collaboration',
        'File storage & sharing',
      ],
      pricing: null,
    },
    {
      title: 'Website Builder',
      description: 'Create and manage professional websites',
      icon: Globe,
      appKey: 'websites',
      gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
      features: [
        'Custom domains',
        'Multiple pages per site',
        'Customizable template',
        'Forms & lead capture',
        'Responsive design',
      ],
      pricing: null,
    },
    {
      title: 'Vehicle Dealership',
      description: 'Complete vehicle inventory management',
      icon: Car,
      appKey: 'vehicleDealership',
      gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      features: [
        'Vehicle inventory management',
        'Online listings showcase',
        'Multi-branch support',
        'Access to all business tools',
        'Access to website builder',
        'Integrations with Auto Trader and Easy Quotes',
      ],
      pricing: null,
    },
    {
      title: 'Online Store',
      description: 'Sell products and services online',
      icon: ShoppingBag,
      appKey: 'onlineStore',
      gradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
      features: [
        'Shopping cart & checkout',
        'Payment gateways',
        'Integrate with business tools',
        'Integrate with website builder',
      ],
      pricing: null,
    },
    {
      title: 'Booking System',
      description: 'Manage appointments and bookings',
      icon: Calendar,
      appKey: 'bookingsApp',
      gradient: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
      features: [
        'Online appointment scheduling',
        'Automated reminders',
        'Service & staff management',
        'Payment gateways',
        'Integrate with business tools',
        'Integrate with website builder',
      ],
      pricing: null,
    },
    {
      title: 'Real Estate',
      description: 'Property listings and management',
      icon: Home,
      appKey: 'realEstate',
      gradient: 'bg-gradient-to-r from-teal-500 to-teal-600',
      features: [
        'Property listings management',
        'Advanced search & filtering',
        'Lead capture forms',
        'Integrate with business tools',
        'Integrate with website builder',
      ],
      pricing: null,
    },
  ];

  // Merge default apps with appConfigs from database
  // Only show apps that are active in the admin configuration
  const apps = defaultApps
    .filter((defaultApp) => {
      // Only show this app if it exists in appConfigs (meaning it's active)
      return appConfigs?.some((c: any) => c.appKey === defaultApp.appKey);
    })
    .map((defaultApp) => {
      const config = appConfigs?.find((c: any) => c.appKey === defaultApp.appKey);
      return {
        ...defaultApp,
        pricing: config?.pricing || defaultApp.pricing,
        features: config?.features || defaultApp.features,
      };
    });

  // Loading states
  if (authLoading || (!company && company !== undefined)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
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

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Company Not Found</h2>
          <p className="text-slate-600">The company you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const enabledApps = company.enabledApps || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 text-sm">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 transition-colors">
              {company.name}
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Apps</span>
          </div>
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
                <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg shadow-slate-900/20">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Manage Apps</h1>
                  <p className="text-sm text-slate-600">{company.name}</p>
                </div>
              </div>
            </div>

            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => setShowCurrencySelector(!showCurrencySelector)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="text-lg">{currentCurrencyInfo.flag}</span>
                <span>{currentCurrencyInfo.code}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {showCurrencySelector && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {currencyOptions.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          setSelectedCurrency(currency.code);
                          localStorage.setItem('selectedCurrency', currency.code);
                          setShowCurrencySelector(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors ${
                          selectedCurrency === currency.code ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <span className="text-lg">{currency.flag}</span>
                        <span className="text-sm font-medium text-left flex-1">{currency.name}</span>
                        <span className="text-xs text-slate-500">{currency.code}</span>
                        {selectedCurrency === currency.code && (
                          <Check className="h-4 w-4 text-emerald-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Apps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => {
            const appState = enabledApps[app.appKey as keyof typeof enabledApps];
            const basePrice = app.pricing?.monthlyPrice || 0;
            const baseCurrency = app.pricing?.currency || 'ZAR';
            const displayPrice = basePrice > 0 ? formatPrice(convertPrice(basePrice, baseCurrency), selectedCurrency) : null;

            return (
              <AppCard
                key={app.appKey}
                title={app.title}
                description={app.description}
                icon={app.icon}
                appKey={app.appKey}
                enabled={appState?.enabled || false}
                enabledAt={appState?.enabledAt}
                onRequestEnable={handleRequestEnable}
                onDisable={handleDisable}
                isLoading={togglingApp === app.appKey}
                gradient={app.gradient}
                features={app.features}
                pricing={app.pricing}
                displayPrice={displayPrice || undefined}
                currencyInfo={currentCurrencyInfo}
              />
            );
          })}
        </div>

        {/* Info Banner */}
        <div className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Enable Apps for Your Company</h3>
              <p className="text-sm text-slate-600 max-w-2xl">
                Enable apps to unlock powerful features for your business. Apps with pricing require a monthly subscription.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center py-8 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-100 bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-800">Enable {selectedApp.title}</h3>
                  <p className="text-sm text-emerald-600">Choose your payment method</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedApp(null);
                }}
                className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 relative">
              {/* Click outside overlay for dropdown */}
              {showCurrencySelector && (
                <div
                  className="absolute inset-0 z-40 cursor-pointer"
                  onClick={() => setShowCurrencySelector(false)}
                />
              )}

              {/* Currency Selection - Dropdown */}
              <div className="relative z-50">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Currency</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCurrencySelector(!showCurrencySelector);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-left hover:border-slate-300 transition-colors focus:outline-none focus:border-emerald-500"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{currentCurrencyInfo.flag}</span>
                      <div>
                        <span className="font-medium text-slate-900">{currentCurrencyInfo.code}</span>
                        <span className="text-sm text-slate-500 ml-2">- {currentCurrencyInfo.name}</span>
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${showCurrencySelector ? 'rotate-180' : ''}`} />
                  </button>

                  {showCurrencySelector && (
                    <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {currencyOptions.map((currency) => {
                        const isDisabled = currency.code !== 'ZAR' && !paypalEnabled;
                        return (
                          <button
                            key={currency.code}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isDisabled) {
                                setSelectedCurrency(currency.code);
                                setShowCurrencySelector(false);
                              }
                            }}
                            disabled={isDisabled}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                              selectedCurrency === currency.code ? 'bg-emerald-50' : ''
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className="text-xl">{currency.flag}</span>
                            <div className="flex-1">
                              <span className="font-medium text-slate-900">{currency.code}</span>
                              <span className="text-sm text-slate-500 ml-2">- {currency.name}</span>
                            </div>
                            {selectedCurrency === currency.code && (
                              <Check className="h-5 w-5 text-emerald-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {selectedCurrency !== 'ZAR' && !paypalEnabled && (
                  <p className="text-xs text-amber-600 mt-2">
                    PayPal required for non-ZAR currencies
                  </p>
                )}
              </div>

              {/* Payment Gateway Selection */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Payment Method</label>
                <div className="space-y-3">
                  {payfastEnabled && selectedCurrency === 'ZAR' && (
                    <button
                      onClick={() => setSelectedGateway('payfast')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                        selectedGateway === 'payfast'
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selectedGateway === 'payfast' && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">PayFast</p>
                            <p className="text-xs text-slate-500">Secure South African payment gateway</p>
                          </div>
                        </div>
                        {adminSettings?.payfast?.testMode && (
                          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                            Test Mode
                          </span>
                        )}
                        {(company?.paymentSettings?.payfast?.testMode) && (
                          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                            Test Mode
                          </span>
                        )}
                      </div>
                    </button>
                  )}

                  {paypalEnabled && (
                    <div>
                      <button
                        onClick={() => setSelectedGateway('paypal')}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                          selectedGateway === 'paypal'
                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {selectedGateway === 'paypal' && (
                              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">PayPal</p>
                              <p className="text-xs text-slate-500">Pay with PayPal or credit card</p>
                            </div>
                          </div>
                          {adminSettings?.paypal?.testMode && (
                            <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                              Sandbox
                            </span>
                          )}
                          {(company?.paymentSettings?.paypal?.testMode) && (
                            <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                              Sandbox
                            </span>
                          )}
                        </div>
                      </button>
                      {!['USD', 'EUR', 'GBP', 'AUD', 'CAD'].includes(selectedCurrency) && selectedGateway === 'paypal' && (
                        <p className="text-xs text-amber-600 mt-2 px-1">
                          PayPal will process payment in USD
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {!payfastEnabled && !paypalEnabled && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-700">
                      No payment gateways are configured. Please contact support.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3">Order Summary</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600">{selectedApp.title}</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(convertPrice(selectedApp.pricing?.monthlyPrice || 0, selectedApp.pricing?.currency || 'ZAR'), selectedCurrency)}
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
                  disabled={isProcessing || (!payfastEnabled && !paypalEnabled) || (selectedCurrency !== 'ZAR' && !paypalEnabled)}
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

      {/* Click outside to close currency selector (header dropdown) */}
      {showCurrencySelector && !showPaymentModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCurrencySelector(false)}
        />
      )}
    </div>
  );
}
