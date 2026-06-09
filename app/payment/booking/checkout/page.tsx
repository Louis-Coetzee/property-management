'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';

const TEST_MERCHANT_ID = '10023443';
const TEST_MERCHANT_KEY = 'e7p6jesdyy1tg';
const TEST_PAYGATE_ID = '10011072130';
const TEST_ENCRYPTION_KEY = 'secret';

export default function BookingPaymentCheckoutPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paygateData, setPaygateData] = useState<any>(null);
  const [selectedGateway, setSelectedGateway] = useState<'payfast' | 'paygate'>('payfast');

  useEffect(() => {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (!pendingBooking) {
      router.push('/');
      return;
    }
    const bookingDataParsed = JSON.parse(pendingBooking);
    setBookingData(bookingDataParsed);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!loading && bookingData) {
      const timer = setTimeout(() => {
        if (formRef.current) {
          formRef.current.submit();
        } else if (selectedGateway === 'paygate' && paygateData?.payRequestId) {
          window.location.href = paygateData.redirectUrl;
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, bookingData, selectedGateway, paygateData]);

  if (loading || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Preparing payment...</p>
        </div>
      </div>
    );
  }

  const payfastMerchantId = TEST_MERCHANT_ID;
  const payfastMerchantKey = TEST_MERCHANT_KEY;
  const payfastUrl = 'https://sandbox.payfast.co.za/eng/process';
  const paygateUrl = 'https://secure.paygate.co.za/payweb3/process.trans';

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const returnUrl = `${baseUrl}/payment/booking/success`;
  const cancelUrl = `${baseUrl}/payment/booking/cancel`;
  const bookingRef = `BKG-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <PlatformNavbar />
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h1>
            <p className="text-gray-600">Redirecting to {selectedGateway === 'payfast' ? 'PayFast' : 'Paygate'} payment gateway...</p>
            <div className="mt-4 inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
              Test Mode - No real charges will be made
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{bookingData.listingTitle}</h2>
              <p className="text-sm text-gray-600">{bookingData.checkInDate} to {bookingData.checkOutDate}</p>
              <p className="text-sm text-gray-600">
                {bookingData.numberOfGuests} guest{bookingData.numberOfGuests !== 1 ? 's' : ''} - {bookingData.numberOfNights} night{bookingData.numberOfNights !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Total Amount</span>
              <span className="text-3xl font-bold text-green-600">R{bookingData.totalAmount.toFixed(2)}</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">R{bookingData.pricePerNight.toFixed(2)} x {bookingData.numberOfNights} nights</span>
                <span className="font-medium">R{(bookingData.pricePerNight * bookingData.numberOfNights).toFixed(2)}</span>
              </div>
              {bookingData.cleaningFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cleaning fee</span>
                  <span className="font-medium">R{bookingData.cleaningFee.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <Lock className="h-4 w-4 mr-2" />
                <span>Secure payment powered by {selectedGateway === 'payfast' ? 'PayFast' : 'Paygate'}</span>
              </div>
            </div>
          </div>

          <form ref={formRef} action={payfastUrl} method="post" style={{ display: 'none' }}>
            <input type="hidden" name="amount" value={bookingData.totalAmount.toFixed(2)} />
            <input type="hidden" name="item_name" value={`Booking - ${bookingData.listingTitle}`} />
            <input type="hidden" name="item_description" value={`${bookingData.numberOfNights} night booking from ${bookingData.checkInDate} to ${bookingData.checkOutDate}`} />
            <input type="hidden" name="merchant_id" value={payfastMerchantId} />
            <input type="hidden" name="merchant_key" value={payfastMerchantKey} />
            <input type="hidden" name="return_url" value={returnUrl} />
            <input type="hidden" name="cancel_url" value={cancelUrl} />
            <input type="hidden" name="name_first" value={bookingData.firstName} />
            <input type="hidden" name="name_last" value={bookingData.lastName} />
            <input type="hidden" name="email_address" value={bookingData.email} />
            <input type="hidden" name="cell_number" value={bookingData.phone?.replace(/\s/g, '') || ''} />
            <input type="hidden" name="email_confirmation" value="1" />
            <input type="hidden" name="custom_str1" value={bookingData.listingId} />
            <input type="hidden" name="custom_str2" value={bookingData.userId} />
            <input type="hidden" name="custom_str3" value={bookingRef} />
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">If you are not redirected automatically...</p>
            <button
              onClick={() => formRef.current?.submit()}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Continue to Payment
            </button>
            <div className="mt-4">
              <Link href={`/bookings/new?listingId=${bookingData.listingId}`} className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />Back to Booking
              </Link>
            </div>
          </div>
        </div>
      </div>
      <PlatformFooter />
    </div>
  );
}
