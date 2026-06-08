'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { Settings, ArrowLeft, Save, Check, Plug } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function BookingPaymentSettingsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // PayFast state
  const [payfastEnabled, setPayfastEnabled] = useState(false);
  const [payfastTestMode, setPayfastTestMode] = useState(true);
  const [payfastMerchantId, setPayfastMerchantId] = useState('');
  const [payfastMerchantKey, setPayfastMerchantKey] = useState('');
  const [payfastPassphrase, setPayfastPassphrase] = useState('');

  // PayPal state
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [paypalTestMode, setPaypalTestMode] = useState(true);
  const [paypalTestClientId, setPaypalTestClientId] = useState('');
  const [paypalTestClientSecret, setPaypalTestClientSecret] = useState('');
  const [paypalLiveClientId, setPaypalLiveClientId] = useState('');
  const [paypalLiveClientSecret, setPaypalLiveClientSecret] = useState('');

  // General booking payment settings
  const [allowCashPayment, setAllowCashPayment] = useState(true);
  const [requirePrepayment, setRequirePrepayment] = useState(false);

  // Query company data for name
  const company = useQuery(api.companies.getByCompanyId, {
    userId: user?.id as any,
    companyId: companyId as any,
  });

  // Query existing booking payment settings
  const existingSettings = useQuery(api.bookingPaymentSettings.getBookingPaymentSettings, {
    companyId: companyId as any,
  });

  // Mutation
  const updateBookingPaymentSettings = useMutation(api.bookingPaymentSettings.updateBookingPaymentSettings);

  // Load existing settings
  useEffect(() => {
    if (existingSettings) {
      if (existingSettings.payfast) {
        setPayfastEnabled(existingSettings.payfast.enabled || false);
        setPayfastTestMode(existingSettings.payfast.testMode ?? true);
        setPayfastMerchantId(existingSettings.payfast.merchantId || '');
        setPayfastMerchantKey(existingSettings.payfast.merchantKey || '');
        setPayfastPassphrase(existingSettings.payfast.passphrase || '');
      }
      if (existingSettings.paypal) {
        setPaypalEnabled(existingSettings.paypal.enabled || false);
        setPaypalTestMode(existingSettings.paypal.testMode ?? true);
        setPaypalTestClientId(existingSettings.paypal.testClientId || '');
        setPaypalTestClientSecret(existingSettings.paypal.testClientSecret || '');
        setPaypalLiveClientId(existingSettings.paypal.liveClientId || '');
        setPaypalLiveClientSecret(existingSettings.paypal.liveClientSecret || '');
      }
      setAllowCashPayment(existingSettings.allowCashPayment ?? true);
      setRequirePrepayment(existingSettings.requirePrepayment ?? false);
    }
  }, [existingSettings]);

  const handleSavePaymentSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateBookingPaymentSettings({
        companyId: companyId as any,
        payfast: payfastEnabled ? {
          enabled: payfastEnabled,
          testMode: payfastTestMode,
          merchantId: payfastMerchantId,
          merchantKey: payfastMerchantKey,
          passphrase: payfastPassphrase,
        } : undefined,
        paypal: paypalEnabled ? {
          enabled: paypalEnabled,
          testMode: paypalTestMode,
          testClientId: paypalTestClientId,
          testClientSecret: paypalTestClientSecret,
          liveClientId: paypalLiveClientId,
          liveClientSecret: paypalLiveClientSecret,
        } : undefined,
        allowCashPayment,
        requirePrepayment,
      });

      setSaveSuccess(true);
      toast.success('Payment settings saved successfully!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/companies/${companyId}/manage`}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Booking Payment Settings</h1>
                <p className="text-slate-600 mt-1">{company?.name}</p>
              </div>
            </div>
            <button
              onClick={handleSavePaymentSettings}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Plug className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Payment Integrations</h2>
                <p className="text-slate-600 text-sm">Configure payment gateway settings for the booking system.</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* General Booking Payment Settings */}
            <div className="border-b border-slate-200 pb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">General Booking Payment Settings</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Allow Cash Payment</p>
                      <p className="text-xs text-slate-500">Allow customers to pay at the venue</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={allowCashPayment}
                        onChange={(e) => setAllowCashPayment(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </label>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Require Prepayment</p>
                      <p className="text-xs text-slate-500">Require online payment before booking confirmation</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={requirePrepayment}
                        onChange={(e) => setRequirePrepayment(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* PayFast Configuration */}
            <div className="border-b border-slate-200 pb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">PayFast</h3>
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
                <div className="space-y-4 pl-4 border-l-2 border-purple-200">
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

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Merchant ID
                      </label>
                      <input
                        type="text"
                        value={payfastMerchantId}
                        onChange={(e) => setPayfastMerchantId(e.target.value)}
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
                        value={payfastMerchantKey}
                        onChange={(e) => setPayfastMerchantKey(e.target.value)}
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
                      value={payfastPassphrase}
                      onChange={(e) => setPayfastPassphrase(e.target.value)}
                      placeholder="Enter passphrase"
                      className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PayPal Configuration */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">PayPal</h3>
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

              {!paypalEnabled && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Enter your PayPal sandbox credentials below, enable PayPal, then save settings.
                  </p>
                </div>
              )}

              {paypalEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-purple-200">
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

                  <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <h4 className="text-sm font-medium text-slate-900">Test Credentials</h4>
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

                  <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <h4 className="text-sm font-medium text-slate-900">Live Credentials</h4>
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
        </div>
      </div>
    </div>
  );
}