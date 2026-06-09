'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';

export default function BookingPaymentCancelPage() {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.removeItem('pendingBooking');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PlatformNavbar />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
            <p className="text-gray-600">Your booking payment was cancelled</p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="space-y-4 text-center">
                <p className="text-gray-700">
                  Don't worry! No payment has been processed and your booking has not been confirmed.
                </p>
                <p className="text-gray-600 text-sm">
                  You can try booking again or browse other available properties.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />Try Again
            </Button>
            <Link href="/" className="w-full">
              <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                <Home className="h-4 w-4 mr-2" />Browse Listings
              </Button>
            </Link>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 text-center">
            Need help? <Link href="/contact" className="font-semibold hover:underline">Contact our support team</Link>
          </div>
        </div>
      </div>
      <PlatformFooter />
    </div>
  );
}
