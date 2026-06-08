'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { 
  ArrowLeft, 
  CreditCard, 
  DollarSign, 
  Check,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  Shield,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const creditFormSchema = z.object({
  amount: z.number().min(50, 'Minimum amount is 50'),
});

type CreditFormData = z.infer<typeof creditFormSchema>;

function AddCreditsContent() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params.companyId as string;
  const domain = params.domain as string;

  const [selectedPayment, setSelectedPayment] = useState<'payfast' | 'paypal' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id && companyId ? { userId: user.id as Id<"users">, companyId: companyId as Id<"companies"> } : 'skip'
  );

  const companyCredit = useQuery(
    api.companies.getCompanyCredit,
    company?._id ? { companyId: company._id } : 'skip'
  );

  const adminSettings = useQuery(
    api.adminSettings.getMyAdminSettings,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const addCreditMutation = useMutation(api.companies.addCompanyCredit);
  const addCreditPaymentMutation = useMutation(api.companies.createCreditPayment);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreditFormData>({
    resolver: zodResolver(creditFormSchema),
    defaultValues: {
      amount: 500,
    },
  });

  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');
    
    if (success === 'true') {
      setPaymentStatus('success');
      toast.success('Payment successful! Credits have been added to your account.');
    } else if (cancelled === 'true') {
      setPaymentStatus('cancelled');
      toast.error('Payment was cancelled.');
    }
  }, [searchParams]);

  const amount = watch('amount');

  const formatPrice = (price: number) => {
    const currencySymbol = company?.currency?.symbol || 'R';
    const currencyCode = company?.currency?.code || 'USD';
    const position = company?.currency?.symbolPosition || 'before';
    
    if (position === 'after') {
      return `${price.toFixed(2)}${currencySymbol}`;
    }
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  const handlePayFastPayment = async () => {
    if (!user?.id || !amount || amount < 50 || !company?._id) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/payfast/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company._id,
          amount,
          userId: user.id,
        }),
      });

const data = await response.json();
       
      if (data.formHtml) {
        // Create payment record first for tracking
        try {
          await addCreditPaymentMutation({
            companyId: company._id,
            amount: amount,
            paymentMethod: 'payfast',
            reference: data.transactionId,
          });
        } catch (e) {
          console.error('Failed to create payment record:', e);
        }
        
        const form = document.createElement('div');
        form.innerHTML = data.formHtml;
        document.body.appendChild(form);
        (form.querySelector('form') as HTMLFormElement).submit();
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error initiating PayFast payment:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!user?.id || !amount || amount < 50 || !company?._id) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/paypal/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company._id,
          amount,
          currency: company?.currency?.code || 'ZAR',
        }),
      });

      const data = await response.json();
      
      if (data.approvalUrl) {
        // Create payment record first for tracking
        try {
          await addCreditPaymentMutation({
            companyId: company._id,
            amount: amount,
            paymentMethod: 'paypal',
            reference: data.orderId,
          });
        } catch (e) {
          console.error('Failed to create payment record:', e);
        }
        
        window.location.href = data.approvalUrl;
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error initiating PayPal payment:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [100, 250, 500, 1000, 2500, 5000];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const payfastEnabled = (adminSettings?.payfast?.enabled) ?? false;
  const paypalEnabled = (adminSettings?.paypal?.enabled) ?? false;
  
  const payfastTestMode = (adminSettings?.payfast?.testMode) ?? true;
  const paypalTestMode = (adminSettings?.paypal?.testMode) ?? true;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/${domain}/companies/${companyId}/store/orders`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Add Credits</h1>
            <p className="text-sm text-gray-500">Purchase credits for shipping</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-2xl mx-auto">
        {/* Payment Status Messages */}
        {paymentStatus === 'success' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-emerald-900">Payment Successful!</h2>
                <p className="text-emerald-700">Your credits have been added to your account.</p>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900">Payment Cancelled</h2>
                <p className="text-red-700">Your payment was cancelled. No credits have been added.</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Credit Display */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <CreditCard className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(companyCredit?.balance || 0)}</p>
              </div>
            </div>
            <Link
href={`/companies/${companyId}/store/orders`}
              className="px-4 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            >
              View Orders
            </Link>
          </div>
        </div>

        {/* Currency Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-900">
              Credits will be added in <strong>{company?.currency?.code || 'ZAR'}</strong> ({company?.currency?.symbol || 'R'})
            </p>
          </div>
        </div>

        {/* Amount Selection */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Amount</h2>
          
          {/* Quick Amounts */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setValue('amount', quickAmount)}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  amount === quickAmount
                    ? 'border-violet-600 bg-violet-50 text-violet-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {formatPrice(quickAmount)}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {company?.currency?.symbol || 'R'}
              </span>
              <input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder="Enter amount"
                min="50"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
          
          {!payfastEnabled && !paypalEnabled ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  No payment methods are currently available. Please contact support.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {payfastEnabled && (
                <button
                  type="button"
                  onClick={() => setSelectedPayment('payfast')}
                  disabled={isProcessing}
                  className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-colors ${
                    selectedPayment === 'payfast'
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm">PF</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">PayFast</p>
                      <p className="text-sm text-gray-500">Secure payment via PayFast</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${payfastTestMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {payfastTestMode ? 'Test' : 'Live'}
                    </span>
                    {selectedPayment === 'payfast' && (
                      <Check className="h-5 w-5 text-violet-600" />
                    )}
                  </div>
                </button>
              )}

              {paypalEnabled && (
                <button
                  type="button"
                  onClick={() => setSelectedPayment('paypal')}
                  disabled={isProcessing}
                  className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-colors ${
                    selectedPayment === 'paypal'
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm">PP</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">PayPal</p>
                      <p className="text-sm text-gray-500">Pay securely with PayPal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${paypalTestMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {paypalTestMode ? 'Test' : 'Live'}
                    </span>
                    {selectedPayment === 'paypal' && (
                      <Check className="h-5 w-5 text-violet-600" />
                    )}
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Summary and Pay Button */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Amount to add:</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(amount || 0)}</span>
          </div>
          
          <button
            onClick={() => {
              if (selectedPayment === 'payfast') {
                handlePayFastPayment();
              } else if (selectedPayment === 'paypal') {
                handlePayPalPayment();
              } else {
                toast.error('Please select a payment method');
              }
            }}
            disabled={!selectedPayment || !amount || amount < 50 || isProcessing}
            className="w-full py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Add {formatPrice(amount || 0)} Credits
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddCreditsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    }>
      <AddCreditsContent />
    </Suspense>
  );
}