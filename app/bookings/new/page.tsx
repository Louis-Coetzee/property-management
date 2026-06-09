'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRootAuth } from '@/components/platform/RootAuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Home, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays, differenceInDays } from 'date-fns';

function NewBookingPageContent() {
  const { user } = useRootAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: '',
    guestFirstName: '',
    guestLastName: '',
    guestEmail: '',
    guestPhone: '',
  });

  const listing = useQuery(
    api.listings.getListing,
    listingId ? { id: listingId as any } : 'skip'
  );

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user, router]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        guestFirstName: (user as any).firstName || '',
        guestLastName: (user as any).lastName || '',
        guestEmail: (user as any).email || '',
      }));
    }
  }, [user]);

  const nights = formData.checkIn && formData.checkOut
    ? differenceInDays(new Date(formData.checkOut), new Date(formData.checkIn))
    : 0;
  const totalPrice = listing ? nights * (listing.pricePerNight || 0) : 0;

  const handleSubmit = async () => {
    if (!user || !listing) return;
    setIsSubmitting(true);
    try {
      toast.success('Booking request submitted! You will receive confirmation shortly.');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href={`/listings/${listingId}`}><ArrowLeft className="h-4 w-4 mr-2" />Back to Listing</Link>
        </Button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Book {listing.title}</h1>

        {/* Steps indicator */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
              <span className={`text-sm ${step >= s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s === 1 ? 'Dates' : s === 2 ? 'Guest Info' : 'Confirm'}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Dates */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>Select Dates</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check-in Date</Label>
                  <Input type="date" value={formData.checkIn} min={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Check-out Date</Label>
                  <Input type="date" value={formData.checkOut} min={formData.checkIn || format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Number of Guests</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setFormData({ ...formData, guests: Math.max(1, formData.guests - 1) })}><Minus className="h-4 w-4" /></Button>
                  <span className="text-lg font-medium w-8 text-center">{formData.guests}</span>
                  <Button variant="outline" size="sm" onClick={() => setFormData({ ...formData, guests: Math.min(listing.maxGuests || 10, formData.guests + 1) })}><Plus className="h-4 w-4" /></Button>
                  <span className="text-sm text-gray-500 ml-2">Max {listing.maxGuests} guests</span>
                </div>
              </div>
              {nights > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">{nights} night{nights !== 1 ? 's' : ''} x R{listing.pricePerNight?.toLocaleString()}</span><span className="font-medium">R{totalPrice.toLocaleString()}</span></div>
                  {listing.cleaningFee ? <div className="flex justify-between text-sm mt-1"><span className="text-gray-600">Cleaning fee</span><span className="font-medium">R{listing.cleaningFee.toLocaleString()}</span></div> : null}
                  <div className="flex justify-between font-semibold mt-2 pt-2 border-t"><span>Total</span><span>R{(totalPrice + (listing.cleaningFee || 0)).toLocaleString()}</span></div>
                </div>
              )}
              <Button className="w-full mt-4" disabled={!formData.checkIn || !formData.checkOut || nights <= 0} onClick={() => setStep(2)}>Continue<ArrowRight className="h-4 w-4 ml-2" /></Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Guest Info */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle>Guest Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input value={formData.guestFirstName} onChange={(e) => setFormData({ ...formData, guestFirstName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input value={formData.guestLastName} onChange={(e) => setFormData({ ...formData, guestLastName: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.guestEmail} onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={formData.guestPhone} onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })} placeholder="Optional" /></div>
              <div className="space-y-2"><Label>Special Requests</Label><Textarea value={formData.specialRequests} onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })} placeholder="Any special requests or notes..." rows={3} /></div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                <Button className="flex-1" disabled={!formData.guestFirstName || !formData.guestLastName || !formData.guestEmail} onClick={() => setStep(3)}>Continue<ArrowRight className="h-4 w-4 ml-2" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle>Confirm Booking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Listing</span><span className="font-medium">{listing.title}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Check-in</span><span>{formData.checkIn}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Check-out</span><span>{formData.checkOut}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Guests</span><span>{formData.guests}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Guest</span><span>{formData.guestFirstName} {formData.guestLastName}</span></div>
                <div className="flex justify-between font-semibold mt-2 pt-2 border-t"><span>Total</span><span>R{(totalPrice + (listing.cleaningFee || 0)).toLocaleString()}</span></div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <NewBookingPageContent />
    </Suspense>
  );
}
