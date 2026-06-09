'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRootAuth } from '@/components/platform/RootAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Mail,
  Phone,
  Package,
  Home,
  AlertCircle,
  CreditCard,
  CheckCircle,
  Download,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';

function BookingDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useRootAuth();
  const bookingCode = params.bookingCode as string;
  const [isDownloading, setIsDownloading] = useState(false);

  const booking = useQuery(
    api.accommodationBookings.getBookingByCode,
    bookingCode ? { bookingCode } : 'skip'
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/bookings/${bookingCode}`);
    }
  }, [user, authLoading, router, bookingCode]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Booking Confirmation', margin, 20);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reference: ${booking?.bookingCode}`, margin, 28);

      doc.setTextColor(0, 0, 0);
      yPos = 50;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Property Information', margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      if (booking?.listing) {
        doc.text(booking.listing.title, margin, yPos);
        yPos += 6;
        doc.text(`${booking.listing.location?.city || ''}, ${booking.listing.location?.province || ''}`, margin, yPos);
        yPos += 12;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Stay Details', margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Check-in: ${format(parseISO(booking!.checkInDate), 'PPP')}`, margin, yPos);
      yPos += 6;
      doc.text(`Check-out: ${format(parseISO(booking!.checkOutDate), 'PPP')}`, margin, yPos);
      yPos += 6;
      doc.text(`Number of Guests: ${booking?.numberOfGuests}`, margin, yPos);
      yPos += 6;
      doc.text(`Number of Nights: ${booking?.numberOfNights}`, margin, yPos);
      yPos += 12;

      if (booking?.specialRequests) {
        doc.setFont('helvetica', 'bold');
        doc.text('Special Requests:', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(booking.specialRequests, pageWidth - 2 * margin);
        doc.text(splitText, margin, yPos);
        yPos += splitText.length * 6 + 6;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Guest Information', margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${booking?.firstName} ${booking?.lastName}`, margin, yPos);
      yPos += 6;
      doc.text(`Email: ${booking?.email}`, margin, yPos);
      yPos += 6;
      doc.text(`Phone: ${booking?.phone}`, margin, yPos);
      yPos += 12;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Summary', margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Accommodation (${booking?.numberOfNights} nights @ R${booking?.pricePerNight.toFixed(2)})`, margin, yPos);
      doc.text(`R${((booking?.pricePerNight || 0) * (booking?.numberOfNights || 0)).toFixed(2)}`, pageWidth - margin - 30, yPos);
      yPos += 6;

      if (booking && booking.cleaningFee && booking.cleaningFee > 0) {
        doc.text('Cleaning fee', margin, yPos);
        doc.text(`R${booking.cleaningFee.toFixed(2)}`, pageWidth - margin - 30, yPos);
        yPos += 6;
      }

      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
      yPos += 8;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount', margin, yPos);
      doc.setTextColor(16, 185, 129);
      doc.text(`R${booking?.totalAmount.toFixed(2)}`, pageWidth - margin - 30, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Booking Status: ${booking?.status.toUpperCase()}`, margin, yPos);
      yPos += 6;
      doc.text(`Payment Status: ${booking?.paymentStatus.toUpperCase()}`, margin, yPos);
      yPos += 12;

      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('Thank you for choosing Find Accommodation', margin, yPos);
      yPos += 4;
      doc.text(`Generated on ${format(new Date(), 'PPP')}`, margin, yPos);

      doc.save(`Booking-${booking?.bookingCode}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PlatformNavbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">This booking doesn't exist or you don't have access to it</p>
          <Button onClick={() => router.push('/')}>
            <Home className="h-4 w-4 mr-2" />Back to Home
          </Button>
        </div>
        <PlatformFooter />
      </div>
    );
  }

  const hasAccess = user._id === booking.userId || (user as any).role === 'admin' || (user as any).role === 'agent';

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PlatformNavbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view this booking</p>
          <Button onClick={() => router.push('/')}>
            <Home className="h-4 w-4 mr-2" />Back to Home
          </Button>
        </div>
        <PlatformFooter />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-800' },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Payment Pending', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Payment Failed', className: 'bg-red-100 text-red-800' },
      refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800' },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformNavbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-700 font-medium mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />Back to Home
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600 mt-1">Reference: <span className="font-mono font-semibold">{booking.bookingCode}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleDownloadPDF} disabled={isDownloading} className="bg-green-600 hover:bg-green-700">
                {isDownloading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Generating...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" />Download PDF</>
                )}
              </Button>
              <div className="flex gap-2">
                {getStatusBadge(booking.status)}
                {getPaymentStatusBadge(booking.paymentStatus)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />Property Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {booking.listing && (
                  <div className="flex gap-4">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={booking.listing.images?.[0] || '/placeholder-property.jpg'}
                        alt={booking.listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{booking.listing.title}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {booking.listing.location?.city}, {booking.listing.location?.province}
                      </div>
                      <Link href={`/listings/${booking.listingId}`}>
                        <Button variant="outline" size="sm">View Property</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />Stay Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Check-in</p>
                    <p className="font-semibold">{format(parseISO(booking.checkInDate), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Check-out</p>
                    <p className="font-semibold">{format(parseISO(booking.checkOutDate), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Number of Guests</p>
                    <p className="font-semibold flex items-center">
                      <Users className="h-4 w-4 mr-1" />{booking.numberOfGuests}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Number of Nights</p>
                    <p className="font-semibold flex items-center">
                      <Package className="h-4 w-4 mr-1" />{booking.numberOfNights}
                    </p>
                  </div>
                </div>

                {booking.specialRequests && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Special Requests</p>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">{booking.specialRequests}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm"><strong>Name:</strong> {booking.firstName} {booking.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm"><strong>Email:</strong> {booking.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm"><strong>Phone:</strong> {booking.phone}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>R{booking.pricePerNight.toFixed(2)} x {booking.numberOfNights} nights</span>
                  <span>R{(booking.pricePerNight * booking.numberOfNights).toFixed(2)}</span>
                </div>
                {booking.cleaningFee && booking.cleaningFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Cleaning fee</span>
                    <span>R{booking.cleaningFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">R{booking.totalAmount.toFixed(2)}</span>
                </div>
                {booking.paymentStatus === 'paid' && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span>Payment Confirmed</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />Booking Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Booking Created</p>
                  <p className="font-medium">{format(new Date(booking.createdAt), 'PPP p')}</p>
                </div>
                {booking.confirmedAt && (
                  <div>
                    <p className="text-gray-600">Confirmed</p>
                    <p className="font-medium">{format(new Date(booking.confirmedAt), 'PPP p')}</p>
                  </div>
                )}
                {booking.cancelledAt && (
                  <div>
                    <p className="text-gray-600">Cancelled</p>
                    <p className="font-medium">{format(new Date(booking.cancelledAt), 'PPP p')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {booking.status === 'confirmed' && booking.paymentStatus === 'paid' && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 text-sm text-blue-900">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">Need to make changes?</p>
                      <p className="mb-3">Contact the property owner or our support team for assistance with your booking.</p>
                      <Link href="/contact">
                        <Button size="sm" variant="outline" className="bg-white">Contact Support</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <PlatformFooter />
    </div>
  );
}

export default function BookingDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <BookingDetailsContent />
    </Suspense>
  );
}
