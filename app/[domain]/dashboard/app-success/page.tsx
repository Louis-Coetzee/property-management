'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const appNames: Record<string, string> = {
  businessTools: 'Business Tools',
  websites: 'Websites',
  vehicleDealership: 'Vehicle Dealership',
  onlineStore: 'Online Store',
  bookingsApp: 'Booking System',
  realEstate: 'Real Estate',
};

const currencyInfo: Record<string, { symbol: string; flag: string }> = {
  ZAR: { symbol: 'R', flag: '🇿🇦' },
  USD: { symbol: '$', flag: '🇺🇸' },
  EUR: { symbol: '€', flag: '🇪🇺' },
  GBP: { symbol: '£', flag: '🇬🇧' },
  AUD: { symbol: 'A$', flag: '🇦🇺' },
  CAD: { symbol: 'C$', flag: '🇨🇦' },
};

export default function AppSuccessPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const searchParams = useSearchParams();

  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const appId = searchParams.get('app') || '';
  const gateway = searchParams.get('gateway') || 'payfast';
  const currency = searchParams.get('currency') || 'ZAR';
  const companyId = searchParams.get('company') || '';

  const appName = appNames[appId] || 'Application';
  const enableApp = useMutation(api.adminSettings.enableAppAccess);

  useEffect(() => {
    if (!user?.id || !appId || !companyId || !processing) return;

    const enableAccess = async () => {
      try {
        // Get currency info for price display
        const currInfo = currencyInfo[currency] || { symbol: 'R', flag: '🇿🇦' };

        // Calculate amount based on app (simplified - in real app, fetch from pricing)
        const appPrices: Record<string, number> = {
          businessTools: 99,
          websites: 199,
          vehicleDealership: 299,
        };
        const amount = appPrices[appId] || 99;

        await enableApp({
          userId: user.id as any,
          companyId: companyId as any,
          appKey: appId,
          paymentProvider: gateway,
          amount,
          currency,
          billingCycle: 'monthly',
        });

        // Short delay before showing success
        setTimeout(() => setProcessing(false), 1500);
      } catch (err) {
        console.error('Failed to enable app:', err);
        setError(err instanceof Error ? err.message : 'Failed to enable app');
        setProcessing(false);
      }
    };

    enableAccess();
  }, [user?.id, appId, companyId, processing, enableApp, gateway, currency]);

  // Loading state
  if (isLoading || processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-slate-700">Processing your payment...</p>
          <p className="text-sm text-slate-500 mt-2">Please wait while we enable your app</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center border border-slate-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Return to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  const currInfo = currencyInfo[currency] || { symbol: 'R', flag: '🇿🇦' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-10 text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-emerald-100">Your subscription is now active</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* App Details */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{appName}</h2>
                <p className="text-sm text-slate-500">App is now enabled</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Method</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {gateway === 'paypal' ? 'PayPal' : 'PayFast'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Currency</span>
                <span className="font-semibold text-slate-900">
                  {currInfo.flag} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-slate-900 mb-2">What&apos;s Next?</h3>
            <p className="text-sm text-slate-600">
              Your {appName} app is now enabled and ready to use. Return to your dashboard to start
              exploring all the features.
            </p>
          </div>

          {/* Action Button */}
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-200"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
