'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Package, ArrowRight, MapPin, Calendar, Users, Home, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
const convex = new ConvexHttpClient(convexUrl);

export default function BookingPaymentSuccessPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(true);
  const [bookingCode, setBookingCode] = useState('');
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const processBooking = async () => {
      try {
        const pendingBookingData = sessionStorage.getItem('pendingBooking');

        if (!pendingBookingData) {
          setError('No pending booking found');
          setProcessing(false);
          return;
        }

        const bookingData = JSON.parse(pendingBookingData);

        const result = await convex.mutation(api.accommodationBookings.createBooking, {
          listingId: bookingData.listingId,
          userId: bookingData.userId,
          firstName: bookingData.firstName,
          lastName: bookingData.lastName,
          email: bookingData.email,
          phone: bookingData.phone,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          numberOfGuests: bookingData.numberOfGuests,
          numberOfNights: bookingData.numberOfNights,
          pricePerNight: bookingData.pricePerNight,
          totalAmount: bookingData.totalAmount,
          cleaningFee: bookingData.cleaningFee || 0,
          securityDeposit: bookingData.securityDeposit || 0,
          specialRequests: bookingData.specialRequests,
          status: "confirmed",
          paymentStatus: "paid",
        });

        setBookingCode(result.bookingCode);
        setBookingDetails(bookingData);

        sessionStorage.removeItem('pendingBooking');
        setProcessing(false);
      } catch (error) {
        console.error('Booking creation error:', error);
        setError('Failed to process booking');
        setProcessing(false);
      }
    };

    processBooking();
  }, []);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Processing your booking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>
            <Home className="h-4 w-4 mr-2" />Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <PlatformNavbar />
      <div className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-xl text-gray-600">Thank you for your booking</p>
          </div>

          <Card className="mb-6 border-2 border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Your Booking Reference</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-bold text-green-700">{bookingCode}</p>
                <Badge className="bg-green-600 text-white">Confirmed</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                <Mail className="h-4 w-4 inline mr-1" />
                A confirmation email has been sent to <strong>{bookingDetails?.email}</strong>
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{bookingDetails?.listingTitle}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Check-in</p>
                      <p className="text-gray-600">{bookingDetails?.checkInDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Check-out</p>
                      <p className="text-gray-600">{bookingDetails?.checkOutDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Guests</p>
                      <p className="text-gray-600">{bookingDetails?.numberOfGuests}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Nights</p>
                      <p className="text-gray-600">{bookingDetails?.numberOfNights}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Guest Information</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {bookingDetails?.firstName} {bookingDetails?.lastName}</p>
                  <p><strong>Email:</strong> {bookingDetails?.email}</p>
                  <p><strong>Phone:</strong> {bookingDetails?.phone}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Accommodation ({bookingDetails?.numberOfNights} nights)</span>
                    <span>R{(bookingDetails?.pricePerNight * bookingDetails?.numberOfNights).toFixed(2)}</span>
                  </div>
                  {bookingDetails?.cleaningFee > 0 && (
                    <div className="flex justify-between">
                      <span>Cleaning fee</span>
                      <span>R{bookingDetails.cleaningFee.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Paid</span>
                    <span className="text-green-600">R{bookingDetails?.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href={`/bookings/${bookingCode}`} className="w-full">
              <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                <Package className="h-4 w-4 mr-2" />View Booking Details
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full" size="lg">
                <Home className="h-4 w-4 mr-2" />Back to Home
              </Button>
            </Link>
          </div>

          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Mail className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-2">What's Next?</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Check your email for the full booking confirmation</li>
                    <li>The property owner has been notified of your booking</li>
                    <li>You can view your booking details anytime in your dashboard</li>
                    <li>Contact the property owner if you have any questions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <PlatformFooter />
    </div>
  );
}
