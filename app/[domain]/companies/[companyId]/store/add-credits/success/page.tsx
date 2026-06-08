'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { 
  ArrowLeft, 
  CheckCircle,
  Loader2,
  CreditCard,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AddCreditsSuccessPage() {
  const { isLoading, user } = useAuthGuard();
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params.companyId as string;
  const domain = params.domain as string;

  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'cancelled'>('success');
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'payfast' | null>(null);
  const processedRef = useRef(false);

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id && companyId ? { userId: user.id as Id<"users">, companyId: companyId as Id<"companies"> } : 'skip'
  );

  const companyCredit = useQuery(
    api.companies.getCompanyCredit,
    company?._id ? { companyId: company._id } : 'skip'
  );

  const addCreditMutation = useMutation(api.companies.addCompanyCredit);
  const updateCreditPaymentStatusMutation = useMutation(api.companies.updateCreditPaymentStatus);

  useEffect(() => {
    if (processedRef.current) return;
    
    const processReturn = async () => {
      processedRef.current = true;
      
      const success = searchParams.get('success');
      const cancelled = searchParams.get('cancelled');
      const token = searchParams.get('token');
      const transaction = searchParams.get('transaction');
      
      console.log('[SUCCESS PAGE] Processing return:', { success, cancelled, token, transaction, companyId: company?._id });
      
      if (cancelled === 'true') {
        setStatus('cancelled');
        setIsProcessing(false);
        return;
      }

      if (success === 'true') {
        if (token && company?._id) {
          setPaymentMethod('paypal');
          try {
            console.log('[SUCCESS PAGE] Capturing PayPal payment, companyId:', company._id);
            
            const response = await fetch('/api/paypal/add-credits-capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                orderId: token,
                companyId: company._id 
              }),
            });

            const data = await response.json();
            console.log('[SUCCESS PAGE] PayPal capture response:', data);
            
            if (data.success) {
              setStatus('success');
              toast.success('Payment successful! Credits have been added to your account.');
            } else {
              setStatus('error');
              toast.error(data.error || 'Failed to process payment');
            }
          } catch (error) {
            console.error('Error capturing PayPal payment:', error);
            setStatus('error');
            toast.error('Failed to process payment');
          }
        } else if (transaction && company?._id) {
          setPaymentMethod('payfast');
          
          try {
            console.log('[SUCCESS PAGE] Processing PayFast payment, companyId:', company._id, 'transaction:', transaction);
            
            const response = await fetch('/api/payfast/add-credits-success', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transactionId: transaction,
                companyId: company._id,
              }),
            });

            const data = await response.json();
            
            if (data.success) {
              setStatus('success');
              toast.success('Payment successful! Credits have been added to your account.');
            } else {
              setStatus('error');
              toast.error(data.error || 'Failed to process payment');
            }
          } catch (error) {
            console.error('Error processing PayFast payment:', error);
            setStatus('error');
            toast.error('Failed to process payment');
          }
        } else {
          setStatus('error');
        }
      } else {
        setStatus('error');
      }
      
      setIsProcessing(false);
    };

    if (!isLoading && company) {
      processReturn();
    }
  }, [searchParams, isLoading, company]);

  const formatPrice = (price: number) => {
    const currencySymbol = company?.currency?.symbol || 'R';
    const currencyCode = company?.currency?.code || 'USD';
    const position = company?.currency?.symbolPosition || 'before';
    
    if (position === 'after') {
      return `${price.toFixed(2)}${currencySymbol}`;
    }
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  if (isLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  const getPaymentMethodName = () => {
    if (paymentMethod === 'paypal') return 'PayPal';
    if (paymentMethod === 'payfast') return 'PayFast';
    return 'payment';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/companies/${companyId}/store/add-credits`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Payment Status</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-md mx-auto">
        {status === 'success' && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-2">
              Your credits have been added to your account via {getPaymentMethodName()}.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Thank you for your payment.
            </p>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-900">Current Balance</span>
              </div>
              <p className="text-3xl font-bold text-emerald-900">
                {formatPrice(companyCredit?.balance || 0)}
              </p>
            </div>

            <div className="flex gap-3 flex-nowrap">
              <Link
                href={`/companies/${companyId}/store/orders`}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors whitespace-nowrap"
              >
                View Orders
              </Link>
              <Link
                href={`/companies/${companyId}/store/add-credits`}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Add More Credits
              </Link>
            </div>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
            <p className="text-gray-600 mb-6">
              Your payment was cancelled. No credits have been added to your account.
            </p>

            <div className="flex gap-3 flex-nowrap">
              <Link
                href={`/companies/${companyId}/store/add-credits`}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors whitespace-nowrap"
              >
                Try Again
              </Link>
              <Link
                href={`/companies/${companyId}/store/orders`}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                View Orders
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-2">
              There was an issue processing your payment.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please try again or contact support if the problem persists.
            </p>

            <div className="flex gap-3 flex-nowrap">
              <Link
                href={`/companies/${companyId}/store/add-credits`}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors whitespace-nowrap"
              >
                Try Again
              </Link>
              <Link
                href={`/companies/${companyId}/store/orders`}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                View Orders
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}