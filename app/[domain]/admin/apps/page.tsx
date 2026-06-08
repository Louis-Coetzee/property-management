'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthGuard, useAuth } from '@/app/[domain]/AuthProvider';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Shield,
  Save,
  RefreshCw,
  Check,
  CreditCard,
  Sparkles,
  Globe,
  Wrench,
  Car,
  ShoppingBag,
  Calendar,
  Home,
  X,
  Plus,
  Download,
  Upload,
} from 'lucide-react';

interface AppPricingForm {
  monthlyPrice: number;
  currency: string;
  enabled: boolean;
}

interface AppConfigForm {
  name: string;
  description: string;
  pricing: AppPricingForm;
  isActive: boolean;
  features: string[];
}

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

// Default apps that should always be shown
const defaultAppsList = [
  {
    appKey: 'businessTools',
    name: 'Business Tools',
    description: 'Essential tools for daily operations',
    icon: 'Wrench',
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
  },
  {
    appKey: 'websites',
    name: 'Website Builder',
    description: 'Create and manage professional websites',
    icon: 'Globe',
    features: [
      'Custom domains',
      'Multiple pages per site',
      'Customizable template',
      'Forms & lead capture',
      'Responsive design',
    ],
  },
  {
    appKey: 'onlineStore',
    name: 'Online Store',
    description: 'Sell products and services online',
    icon: 'ShoppingBag',
    features: [
      'Shopping cart & checkout',
      'Payment gateways',
      'Integrate with business tools',
      'Integrate with website builder',
    ],
  },
  {
    appKey: 'bookingsApp',
    name: 'Booking System',
    description: 'Manage appointments and bookings',
    icon: 'Calendar',
    features: [
      'Online appointment scheduling',
      'Automated reminders',
      'Service & staff management',
      'Payment gateways',
      'Integrate with business tools',
      'Integrate with website builder',
    ],
  },
  {
    appKey: 'vehicleDealership',
    name: 'Vehicle Dealership',
    description: 'Complete vehicle inventory management',
    icon: 'Car',
    features: [
      'Vehicle inventory management',
      'Online listings showcase',
      'Multi-branch support',
      'Access to all business tools',
      'Access to website builder',
      'Integrations with Auto Trader and Easy Quotes',
    ],
  },
  {
    appKey: 'realEstate',
    name: 'Real Estate',
    description: 'Property listings and management',
    icon: 'Home',
    features: [
      'Property listings management',
      'Advanced search & filtering',
      'Lead capture forms',
      'Integrate with business tools',
      'Integrate with website builder',
    ],
  },
];

// Currency options
const currencyOptions = [
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export default function AdminAppsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const { domain } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'apps' | 'payment'>('apps');
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, AppConfigForm>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment Gateway State - PayFast
  const [payfastEnabled, setPayfastEnabled] = useState(false);
  const [payfastTestMode, setPayfastTestMode] = useState(true);
  const [merchantId, setMerchantId] = useState('');
  const [merchantKey, setMerchantKey] = useState('');
  const [passphrase, setPassphrase] = useState('');

  // Payment Gateway State - PayPal
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [paypalTestMode, setPaypalTestMode] = useState(true);
  const [paypalTestClientId, setPaypalTestClientId] = useState('');
  const [paypalTestClientSecret, setPaypalTestClientSecret] = useState('');
  const [paypalLiveClientId, setPaypalLiveClientId] = useState('');
  const [paypalLiveClientSecret, setPaypalLiveClientSecret] = useState('');

  // Queries
  const appConfigs = useQuery(
    api.appConfigs.getAllAppConfigs,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const adminSettings = useQuery(
    api.adminSettings.getMyAdminSettings,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  // Mutations
  const updateAppConfig = useMutation(api.appConfigs.updateAppConfig);
  const initializeDefaultApps = useMutation(api.appConfigs.initializeDefaultApps);
  const resetAppsToDefaults = useMutation(api.appConfigs.resetAppsToDefaults);
  const upsertSettings = useMutation(api.adminSettings.upsertAdminSettings);
  const importAppConfigs = useMutation(api.appConfigs.importAppConfigs);

  // Merge default apps with database configs
  const mergedApps = defaultAppsList.map((defaultApp) => {
    const dbConfig = appConfigs?.find((c) => c.appKey === defaultApp.appKey);
    return {
      ...defaultApp,
      _id: dbConfig?._id || null,
      isActive: dbConfig?.isActive ?? true,
      isComingSoon: dbConfig?.isComingSoon ?? false,
      pricing: dbConfig?.pricing || {
        monthlyPrice: 0,
        currency: 'ZAR',
        enabled: false,
      },
      gradient: dbConfig?.gradient || gradientMap[defaultApp.appKey] || 'from-slate-500 to-slate-600',
      features: dbConfig?.features || defaultApp.features || [],
    };
  });

  // Initialize forms when mergedApps change
  useEffect(() => {
    const newForms: Record<string, AppConfigForm> = {};
    mergedApps.forEach((app) => {
      const dbConfig = appConfigs?.find((c) => c.appKey === app.appKey);
      newForms[app.appKey] = {
        name: app.name,
        description: app.description || '',
        pricing: {
          monthlyPrice: app.pricing?.monthlyPrice || 0,
          currency: app.pricing?.currency || 'ZAR',
          enabled: app.pricing?.enabled ?? false,
        },
        isActive: app.isActive,
        features: dbConfig?.features || app.features || [],
      };
    });
    setForms(newForms);
  }, [appConfigs]);

  // Load payment settings when available
  useEffect(() => {
    if (adminSettings) {
      // PayFast
      if (adminSettings.payfast) {
        setPayfastEnabled(adminSettings.payfast.enabled);
        setPayfastTestMode(adminSettings.payfast.testMode ?? true);
        setMerchantId(adminSettings.payfast.merchantId || '');
        setMerchantKey(adminSettings.payfast.merchantKey || '');
        setPassphrase(adminSettings.payfast.passphrase || '');
      }

      // PayPal
      if (adminSettings.paypal) {
        setPaypalEnabled(adminSettings.paypal.enabled);
        setPaypalTestMode(adminSettings.paypal.testMode ?? true);
        setPaypalTestClientId(adminSettings.paypal.testClientId || '');
        setPaypalTestClientSecret(adminSettings.paypal.testClientSecret || '');
        setPaypalLiveClientId(adminSettings.paypal.liveClientId || '');
        setPaypalLiveClientSecret(adminSettings.paypal.liveClientSecret || '');
      }
    }
  }, [adminSettings]);

  // Check admin access
  useEffect(() => {
    if (!isLoading && (!user || (user.userType !== 'admin' && user.userType !== 'administrator'))) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleInitializeApps = async () => {
    if (!user) return;

    try {
      const result = await initializeDefaultApps({ userId: user.id as any });
      toast.success(result.message);
    } catch (error) {
      console.error('Error initializing apps:', error);
      toast.error('Failed to initialize apps');
    }
  };

  const handleResetToDefaults = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const result = await resetAppsToDefaults({ userId: user.id as any });
      toast.success(result.message);
    } catch (error) {
      console.error('Error resetting apps:', error);
      toast.error('Failed to reset apps to defaults');
    } finally {
      setIsSaving(false);
    }
  };

  // Export appConfigs data as JSON
  const handleExportAppConfigs = () => {
    if (!appConfigs || appConfigs.length === 0) {
      toast.error('No app configs to export');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalConfigs: appConfigs.length,
      appConfigs: appConfigs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-configs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('App configs exported successfully!');
  };

  // Import appConfigs data from JSON file
  const handleImportAppConfigs = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file type
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      toast.error('Please select a JSON file');
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Support both formats: { appConfigs: [...] } or [...]
      const configs = Array.isArray(data) ? data : (data.appConfigs || data.configs || []);

      if (!Array.isArray(configs) || configs.length === 0) {
        toast.error('No valid app configs found in file');
        setIsImporting(false);
        return;
      }

      // Validate configs have required fields
      const validConfigs = configs.filter((config: any) => config.appKey && config.name);

      if (validConfigs.length === 0) {
        toast.error('No valid app configs found in file. Each config needs appKey and name.');
        setIsImporting(false);
        return;
      }

      const result = await importAppConfigs({
        userId: user?.id as any,
        configs: validConfigs.map((config: any) => ({
          appKey: config.appKey,
          name: config.name,
          description: config.description,
          icon: config.icon,
          gradient: config.gradient,
          pricing: config.pricing,
          features: config.features,
          isActive: config.isActive,
          isComingSoon: config.isComingSoon,
          sortOrder: config.sortOrder,
        })),
      });

      toast.success(result.message);
    } catch (error) {
      console.error('Import error:', error);
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON file format');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to import configs');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveApp = async (appKey: string) => {
    if (!user || !forms[appKey]) return;

    const app = mergedApps.find((a) => a.appKey === appKey);
    console.log('Saving app:', appKey, 'App data:', app, 'Form:', forms[appKey]);

    if (!app?._id) {
      toast.error('App not found in database. Please click "Sync Apps" first.');
      return;
    }

    setIsSaving(true);
    try {
      const form = forms[appKey];
      const pricingData = {
        monthlyPrice: form.pricing.monthlyPrice,
        currency: form.pricing.currency,
        enabled: form.pricing.enabled,
      };
      console.log('Saving pricing:', pricingData);

      await updateAppConfig({
        userId: user.id as any,
        appConfigId: app._id as any,
        name: form.name,
        description: form.description || undefined,
        pricing: pricingData,
        isActive: form.isActive,
        features: form.features.filter(f => f.trim() !== ''),
      });

      toast.success('App configuration saved successfully');
      setEditingApp(null);
    } catch (error) {
      console.error('Error saving app config:', error);
      toast.error('Failed to save app configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    if (!user?.id) {
      toast.error('Please log in to save settings');
      return;
    }

    setIsSaving(true);
    try {
      await upsertSettings({
        userId: user.id as any,
        payfast: {
          enabled: payfastEnabled,
          testMode: payfastTestMode,
          merchantId: merchantId.trim(),
          merchantKey: merchantKey.trim(),
          passphrase: passphrase.trim(),
        },
        paypal: {
          enabled: paypalEnabled,
          testMode: paypalTestMode,
          testClientId: paypalTestClientId.trim(),
          testClientSecret: paypalTestClientSecret.trim(),
          liveClientId: paypalLiveClientId.trim(),
          liveClientSecret: paypalLiveClientSecret.trim(),
        },
      });
      toast.success('Payment settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateForm = (appKey: string, updates: Partial<AppConfigForm>) => {
    setForms((prev) => ({
      ...prev,
      [appKey]: {
        ...prev[appKey],
        ...updates,
      },
    }));
  };

  const updatePricing = (appKey: string, updates: Partial<AppPricingForm>) => {
    setForms((prev) => ({
      ...prev,
      [appKey]: {
        ...prev[appKey],
        pricing: {
          ...prev[appKey].pricing,
          ...updates,
        },
      },
    }));
  };

  const updateFeatures = (appKey: string, features: string[]) => {
    setForms((prev) => ({
      ...prev,
      [appKey]: {
        ...prev[appKey],
        features,
      },
    }));
  };

  const addFeature = (appKey: string) => {
    const currentFeatures = forms[appKey]?.features || [];
    updateFeatures(appKey, [...currentFeatures, '']);
  };

  const removeFeature = (appKey: string, index: number) => {
    const currentFeatures = forms[appKey]?.features || [];
    updateFeatures(appKey, currentFeatures.filter((_, i) => i !== index));
  };

  const updateFeature = (appKey: string, index: number, value: string) => {
    const currentFeatures = forms[appKey]?.features || [];
    const newFeatures = [...currentFeatures];
    newFeatures[index] = value;
    updateFeatures(appKey, newFeatures);
  };

  // Loading states
  if (isLoading || (!user && user !== null)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user || (user.userType !== 'admin' && user.userType !== 'administrator')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 text-sm">
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link
              href="/admin"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Admin Panel
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Manage Apps</span>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Manage Apps</h1>
                  <p className="text-sm text-slate-600">Configure app pricing and payment settings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('apps')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'apps'
                    ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Apps Configuration
                </div>
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'payment'
                    ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Settings
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Apps Tab Content */}
        {activeTab === 'apps' && (
          <>
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">App Configuration</h3>
                  <p className="text-xs text-slate-600">
                    Configure pricing and features for each app. Changes will be reflected on the company apps page.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportAppConfigs}
                    disabled={!appConfigs || appConfigs.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </button>
                  <button
                    onClick={handleImportAppConfigs}
                    disabled={isImporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    Import
                  </button>
                  <button
                    onClick={handleResetToDefaults}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Reset to Defaults
                  </button>
                  <button
                    onClick={handleInitializeApps}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 bg-white hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Sync Apps
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {appConfigs === undefined && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            )}

            {/* Hidden file input for import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Apps Grid - 3 Columns */}
            {appConfigs !== undefined && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mergedApps.map((app) => {
                  const form = forms[app.appKey];
                  if (!form) return null;

                  const Icon = iconMap[app.icon] || Wrench;
                  const isEditing = editingApp === app.appKey;
                  const gradient = app.gradient || 'from-slate-500 to-slate-600';

                  return (
                    <div
                      key={app.appKey}
                      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                        isEditing ? 'border-purple-300 shadow-purple-100' : 'border-slate-200'
                      }`}
                    >
                      {/* App Header */}
                      <div className={`h-1 bg-gradient-to-r ${gradient}`} />

                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-md`}>
                              <Icon className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold text-slate-900">{app.name}</h3>
                                {!form.isActive && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full">
                                    Disabled
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500">{app.appKey}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {!isEditing ? (
                              <button
                                onClick={() => setEditingApp(app.appKey)}
                                className="px-2 py-1 text-[10px] font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors border border-purple-200"
                              >
                                Edit
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingApp(null)}
                                  className="px-2 py-1 text-[10px] font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveApp(app.appKey)}
                                  disabled={isSaving}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors disabled:opacity-50"
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                  ) : (
                                    <Save className="h-2.5 w-2.5" />
                                  )}
                                  Save
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Current Pricing Display */}
                        {!isEditing && (
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="p-2 bg-slate-50 rounded-lg">
                              <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-0.5">
                                Monthly
                              </p>
                              <p className="text-xs font-bold text-slate-900">
                                {form.pricing.currency === 'ZAR' ? 'R' : '$'}
                                {form.pricing.monthlyPrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-lg">
                              <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-0.5">
                                Status
                              </p>
                              <div className="flex items-center gap-1">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    form.pricing.enabled ? 'bg-emerald-500' : 'bg-slate-400'
                                  }`}
                                />
                                <span
                                  className={`text-[10px] font-medium ${
                                    form.pricing.enabled ? 'text-emerald-600' : 'text-slate-600'
                                  }`}
                                >
                                  {form.pricing.enabled ? 'Paid' : 'Free'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Edit Form */}
                        {isEditing && (
                          <div className="space-y-2">
                            {/* Pricing Toggle */}
                            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                              <label className="text-[10px] font-semibold text-slate-900">
                                Enable Pricing
                              </label>
                              <button
                                onClick={() =>
                                  updatePricing(app.appKey, {
                                    enabled: !form.pricing.enabled,
                                  })
                                }
                                className={`relative w-8 h-4 rounded-full transition-all duration-300 ${
                                  form.pricing.enabled ? 'bg-purple-600' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${
                                    form.pricing.enabled ? 'right-0.5' : 'left-0.5'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Currency Selector */}
                            <div className="w-full">
                              <label className="block text-[10px] font-semibold text-slate-900 mb-0.5">
                                Currency
                              </label>
                              <select
                                value={form.pricing.currency}
                                onChange={(e) =>
                                  updatePricing(app.appKey, {
                                    currency: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent bg-white"
                              >
                                {currencyOptions.map((currency) => (
                                  <option key={currency.code} value={currency.code}>
                                    {currency.symbol} - {currency.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Pricing Input */}
                            <div className="w-full">
                              <label className="block text-[10px] font-semibold text-slate-900 mb-0.5">
                                Monthly Price
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.pricing.monthlyPrice}
                                onChange={(e) =>
                                  updatePricing(app.appKey, {
                                    monthlyPrice: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                placeholder="0.00"
                              />
                            </div>

                            {/* Features Editor */}
                            <div className="w-full">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-semibold text-slate-900">
                                  Features
                                </label>
                                <button
                                  onClick={() => addFeature(app.appKey)}
                                  className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                  Add
                                </button>
                              </div>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {(form.features || []).map((feature, index) => (
                                  <div key={index} className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={feature}
                                      onChange={(e) => updateFeature(app.appKey, index, e.target.value)}
                                      className="flex-1 px-2 py-1 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                      placeholder={`Feature ${index + 1}`}
                                    />
                                    <button
                                      onClick={() => removeFeature(app.appKey, index)}
                                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                              <label className="text-[10px] font-semibold text-slate-900">
                                App Active
                              </label>
                              <button
                                onClick={() =>
                                  updateForm(app.appKey, {
                                    isActive: !form.isActive,
                                  })
                                }
                                className={`relative w-8 h-4 rounded-full transition-all duration-300 ${
                                  form.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${
                                    form.isActive ? 'right-0.5' : 'left-0.5'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Features Display (when not editing) */}
                        {!isEditing && form.features && form.features.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <div className="flex flex-wrap gap-0.5">
                              {form.features.slice(0, 2).map((feature, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[9px] rounded"
                                >
                                  <Check className="h-2 w-2 text-emerald-500" />
                                  {feature}
                                </span>
                              ))}
                              {form.features.length > 2 && (
                                <span className="px-1.5 py-0.5 text-[9px] text-slate-500">
                                  +{form.features.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Payment Settings Tab Content */}
        {activeTab === 'payment' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-6">
              {/* PayFast Configuration */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">PayFast</h2>
                    <p className="text-sm text-slate-500">South African payment gateway (ZAR)</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm font-medium text-slate-700">Enable</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={payfastEnabled}
                        onChange={(e) => setPayfastEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </label>
                </div>

                {payfastEnabled && (
                  <div className="space-y-4">
                    {/* Test/Live Mode Toggle */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Test Mode</p>
                          <p className="text-xs text-slate-500">Use PayFast sandbox</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={payfastTestMode}
                            onChange={(e) => setPayfastTestMode(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                      {payfastTestMode && (
                        <p className="mt-3 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                          Test Mode: Using sandbox credentials. No real payments.
                        </p>
                      )}
                    </div>

                    {/* Credentials */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Merchant ID
                        </label>
                        <input
                          type="text"
                          value={merchantId}
                          onChange={(e) => setMerchantId(e.target.value)}
                          placeholder={payfastTestMode ? '10000100' : 'Enter merchant ID'}
                          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Merchant Key
                        </label>
                        <input
                          type="text"
                          value={merchantKey}
                          onChange={(e) => setMerchantKey(e.target.value)}
                          placeholder={payfastTestMode ? '46f0cd694581a' : 'Enter merchant key'}
                          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Passphrase (Optional)
                      </label>
                      <input
                        type="text"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="Enter passphrase"
                        className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PayPal Configuration */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">PayPal</h2>
                    <p className="text-sm text-slate-500">International payment gateway</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm font-medium text-slate-700">Enable</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={paypalEnabled}
                        onChange={(e) => setPaypalEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </label>
                </div>

                {/* Info banner when PayPal is disabled */}
                {!paypalEnabled && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> Enter your PayPal sandbox credentials below, enable PayPal, then save settings.
                    </p>
                  </div>
                )}

                {paypalEnabled && (
                  <div className="space-y-4">
                    {/* Test/Live Mode Toggle */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Test Mode</p>
                          <p className="text-xs text-slate-500">Toggle test/live credentials</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={paypalTestMode}
                            onChange={(e) => setPaypalTestMode(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                    </div>

                    {/* Test Credentials */}
                    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <h3 className="text-sm font-medium text-slate-900">Test Credentials</h3>
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">SANDBOX</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        <a
                          href="https://developer.paypal.com/dashboard/applications/sandbox"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Get sandbox credentials from PayPal Developer Dashboard
                        </a>
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Test Client ID
                          </label>
                          <input
                            type="text"
                            value={paypalTestClientId}
                            onChange={(e) => setPaypalTestClientId(e.target.value)}
                            placeholder="Sandbox client ID"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Test Secret
                          </label>
                          <input
                            type="password"
                            value={paypalTestClientSecret}
                            onChange={(e) => setPaypalTestClientSecret(e.target.value)}
                            placeholder="Sandbox secret"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Credentials */}
                    <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <h3 className="text-sm font-medium text-slate-900">Live Credentials</h3>
                        <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full">PRODUCTION</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        <a
                          href="https://developer.paypal.com/dashboard/applications/live"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline"
                        >
                          PayPal Live Dashboard
                        </a>
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Live Client ID
                          </label>
                          <input
                            type="text"
                            value={paypalLiveClientId}
                            onChange={(e) => setPaypalLiveClientId(e.target.value)}
                            placeholder="Live client ID"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Live Secret
                          </label>
                          <input
                            type="password"
                            value={paypalLiveClientSecret}
                            onChange={(e) => setPaypalLiveClientSecret(e.target.value)}
                            placeholder="Live secret"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-slate-200 p-6 flex justify-end">
              <button
                onClick={handleSavePaymentSettings}
                disabled={isSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-200"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Payment Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
