'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Wallet, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentGateway {
  enabled: boolean;
  testMode: boolean;
  merchantId?: string;
  merchantKey?: string;
  passphrase?: string;
  testClientId?: string;
  testClientSecret?: string;
  liveClientId?: string;
  liveClientSecret?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  orderId: string;
  orderNumber: string;
  companyId: string;
  companyPaymentSettings?: {
    payfast?: PaymentGateway;
    paypal?: PaymentGateway;
  };
  onPaymentSuccess: (paymentId: string) => void;
  accentColor?: string;
  currencySymbol?: string;
  symbolPosition?: 'before' | 'after';
}

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  orderId,
  orderNumber,
  companyId,
  companyPaymentSettings,
  onPaymentSuccess,
  accentColor = '#7c3aed',
  currencySymbol = 'R',
  symbolPosition = 'before',
}: PaymentModalProps) {
  const router = useRouter();
  const [selectedGateway, setSelectedGateway] = useState<'payfast' | 'paypal' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payfastEnabled = companyPaymentSettings?.payfast?.enabled ?? false;
  const paypalEnabled = companyPaymentSettings?.paypal?.enabled ?? false;

  const handlePayment = async () => {
    if (!selectedGateway) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (selectedGateway === 'payfast') {
        await processPayFastPayment();
      } else if (selectedGateway === 'paypal') {
        await processPayPalPayment();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const processPayFastPayment = async () => {
    const payfastSettings = companyPaymentSettings?.payfast;
    const isTestMode = payfastSettings?.testMode ?? true;

    let merchantId: string;
    let merchantKey: string;

    if (isTestMode) {
      merchantId = '10000100';
      merchantKey = '46f0cd694581a';
    } else {
      merchantId = payfastSettings?.merchantId || '';
      merchantKey = payfastSettings?.merchantKey || '';

      if (!merchantId || !merchantKey) {
        throw new Error('PayFast live credentials not configured');
      }
    }

    const paymentData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${window.location.origin}/checkout/success?orderId=${orderId}&orderNumber=${orderNumber}&payment=complete`,
      cancel_url: `${window.location.origin}/checkout?orderId=${orderId}&payment=cancelled`,
      notify_url: `${window.location.origin}/api/payfast/notify`,
      m_payment_id: orderNumber,
      amount: total.toFixed(2),
      item_name: `Order ${orderNumber}`,
      item_description: `Payment for Order ${orderNumber}`,
      custom_str1: orderId,
    };

    // Create payment record first
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        orderNumber,
        gateway: 'payfast',
        amount: total,
        status: 'pending',
        testMode: isTestMode,
      }),
    });

    const paymentResult = await response.json();

    if (!response.ok) {
      throw new Error(paymentResult.error || 'Failed to create payment record');
    }

    // For test mode, go through payment gateway with test credentials
    if (isTestMode) {
      // Use PayFast test credentials and sandbox
      const testMerchantId = payfastSettings?.merchantId || '10000100';
      const testMerchantKey = payfastSettings?.merchantKey || '46f0cd694581a';
      
      // Create form for PayFast sandbox redirect
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://sandbox.payfast.co.za/eng/process';
      
      const paymentData = {
        merchant_id: testMerchantId,
        merchant_key: testMerchantKey,
        return_url: `${window.location.origin}/checkout/success?orderId=${orderId}&orderNumber=${orderNumber}&payment=complete`,
        cancel_url: `${window.location.origin}/checkout?orderId=${orderId}&payment=cancelled`,
        notify_url: `${window.location.origin}/api/payfast/notify`,
        m_payment_id: orderNumber,
        amount: total.toFixed(2),
        item_name: `Order ${orderNumber}`,
        item_description: `Payment for Order ${orderNumber}`,
        custom_str1: orderId,
      };
      
      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
      return;
    }

    // For live mode, redirect to PayFast
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.payfast.co.za/eng/process';

    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.name = key;
      input.value = value as string;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const processPayPalPayment = async () => {
    const paypalSettings = companyPaymentSettings?.paypal;
    const isTestMode = paypalSettings?.testMode ?? true;

    let clientId: string;
    let clientSecret: string;

    if (isTestMode) {
      clientId = paypalSettings?.testClientId || '';
      clientSecret = paypalSettings?.testClientSecret || '';
    } else {
      clientId = paypalSettings?.liveClientId || '';
      clientSecret = paypalSettings?.liveClientSecret || '';

      if (!clientId || !clientSecret) {
        throw new Error('PayPal live credentials not configured');
      }
    }

    // Create payment record
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        orderNumber,
        gateway: 'paypal',
        amount: total,
        status: 'pending',
        testMode: isTestMode,
      }),
    });

    const paymentResult = await response.json();

    if (!response.ok) {
      throw new Error(paymentResult.error || 'Failed to create payment record');
    }

    // For test mode, go through PayPal sandbox
    if (isTestMode) {
      const paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${orderNumber}`;
      window.location.href = paypalUrl;
      return;
    }

    // For live mode, redirect to PayPal
    const paypalUrl = `https://www.paypal.com/checkoutnow?token=${orderNumber}`;
    window.location.href = paypalUrl;
  };

  const handleCancel = () => {
    router.push(`/checkout?orderId=${orderId}&payment=cancelled`);
  };

  if (!payfastEnabled && !paypalEnabled) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Options</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-600">
              No payment methods are configured for this store.
              Please contact the store administrator.
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Generate gradient colors based on accent
  const getGradientColors = () => {
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lighterR = Math.min(255, r + 40);
    const lighterG = Math.min(255, g + 40);
    const lighterB = Math.min(255, b + 40);
    return {
      from: `#${hex}`,
      to: `rgb(${lighterR}, ${lighterG}, ${lighterB})`
    };
  };

  const gradientColors = getGradientColors();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <DialogTitle className="sr-only">Complete Payment</DialogTitle>
        <div 
          className="relative p-6 text-center"
          style={{ background: `linear-gradient(to bottom right, ${gradientColors.from}, ${gradientColors.to})` }}
        >
          <button
            onClick={handleCancel}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          
          <CreditCard className="h-10 w-10 text-white mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">Complete Payment</h2>
          <p className="text-white/80 text-sm mt-1">
            Order #{orderNumber} • {symbolPosition === 'before' ? `${currencySymbol}${total.toFixed(2)}` : `${total.toFixed(2)}${currencySymbol}`}
          </p>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">Select payment method:</p>

          <div className="space-y-3">
            {payfastEnabled && (
              <button
                onClick={() => setSelectedGateway('payfast')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedGateway === 'payfast'
                    ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                style={{
                  '--accent': accentColor,
                  '--accent-light': `${accentColor}15`
                } as any}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Wallet className="h-5 w-5" style={{ color: accentColor }} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">PayFast</p>
                    <p className="text-xs text-slate-500">
                      {companyPaymentSettings?.payfast?.testMode ? 'Test Mode (Sandbox)' : 'Secure payment'}
                    </p>
                  </div>
                  {selectedGateway === 'payfast' && (
                    <CheckCircle className="h-5 w-5 ml-auto" style={{ color: accentColor }} />
                  )}
                </div>
              </button>
            )}

            {paypalEnabled && (
              <button
                onClick={() => setSelectedGateway('paypal')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedGateway === 'paypal'
                    ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                style={{
                  '--accent': accentColor,
                  '--accent-light': `${accentColor}15`
                } as any}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#003087">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">PayPal</p>
                    <p className="text-xs text-slate-500">
                      {companyPaymentSettings?.paypal?.testMode ? 'Test Mode (Sandbox)' : 'Pay securely with PayPal'}
                    </p>
                  </div>
                  {selectedGateway === 'paypal' && (
                    <CheckCircle className="h-5 w-5 ml-auto" style={{ color: accentColor }} />
                  )}
                </div>
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              onClick={handlePayment}
              disabled={!selectedGateway || isProcessing}
              className="w-full font-semibold py-3"
              style={{ 
                background: `linear-gradient(to right, ${accentColor}, ${accentColor}dd)`,
                color: 'white'
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${symbolPosition === 'before' ? `${currencySymbol}${total.toFixed(2)}` : `${total.toFixed(2)}${currencySymbol}`}`
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-center text-slate-500 mt-4">
            By proceeding, you agree to the terms and conditions
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}