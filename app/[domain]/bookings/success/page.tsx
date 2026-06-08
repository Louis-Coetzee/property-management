'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NavbarModern } from '@/components/page-builder/renderer/sections/NavbarModern';
import { NavbarBasic } from '@/components/page-builder/renderer/sections/NavbarBasic';
import { FooterBasic } from '@/components/page-builder/renderer/sections/FooterBasic';
import { FooterModern } from '@/components/page-builder/renderer/sections/FooterModern';
import { parsePageContent } from '@/lib/page-builder/hooks/usePageContent';
import { CheckCircle2, Calendar, Clock, User, Phone, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const domain = params.domain as string;
  const bookingId = searchParams.get('bookingId');
  const paymentStatus = searchParams.get('payment');
  
  const website = useQuery(
    api.websites.getWebsiteByDomainPublic,
    domain ? { domain } : 'skip'
  ) as any;
  const domainCompanyId = website?.companyId || '';
  
  const company = useQuery(
    api.companies.getByCompanyIdPublic,
    domainCompanyId && domainCompanyId.length > 0 ? { companyId: domainCompanyId } : 'skip'
  ) as any;
  
  const accentColor = company?.branding?.primaryColor || website?.branding?.primaryColor || '#219c94';
  
  // Fetch home page to get navbar sections
  const homePage = useQuery(
    api.pages.getHomePagePublic,
    website ? { websiteId: website._id } : 'skip'
  );
  
  // Extract navbar sections from home page
  const navbarSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'navbar') || []
    : [];
  
  const firstNavbarSection = navbarSections.length > 0 ? navbarSections[0] : null;
  const navbarHeight = firstNavbarSection?.templateId === 'navbar-modern' ? '80px' : '64px';
  const isNavbarSticky = firstNavbarSection?.content?.sticky !== false;
  
  // Extract footer sections from home page
  const footerSections = homePage && homePage.contentType === 'pageBuilder'
    ? parsePageContent(homePage.content)?.sections?.filter((s: any) => s.type === 'footer') || []
    : [];
  const footerSection = footerSections.length > 0 ? footerSections[0] : null;
  
  // Fetch booking
  const booking = useQuery(
    api.bookings.getById,
    bookingId ? { bookingId: bookingId as any } : 'skip'
  ) as any;
  
  const isPaymentComplete = paymentStatus === 'complete';
  
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  if (!website) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col">
      {/* Navbar */}
      {navbarSections.length > 0 && firstNavbarSection?.templateId === 'navbar-modern' ? (
        <div className="fixed top-0 left-0 right-0 z-50" style={{ height: navbarHeight }}>
          <NavbarModern
            content={firstNavbarSection.content as any}
            settings={{ sticky: isNavbarSticky } as any}
            currentPageSlug="success"
            homePageSlug=""
          />
        </div>
      ) : navbarSections.length > 0 && firstNavbarSection ? (
        <div className="fixed top-0 left-0 right-0 z-50" style={{ height: navbarHeight }}>
          <NavbarBasic
            content={firstNavbarSection.content as any}
            settings={{ sticky: isNavbarSticky } as any}
            currentPageSlug="success"
            homePageSlug=""
          />
        </div>
      ) : null}
      
      {/* Main Content */}
      <div className={`flex-1 flex items-center justify-center pt-20 pb-16 px-4 ${navbarSections.length > 0 ? '' : 'py-16'}`}>
        <div className="max-w-lg w-full text-center">
          {/* Success Icon */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isPaymentComplete ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <CheckCircle2 className={`w-12 h-12 ${isPaymentComplete ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isPaymentComplete ? 'Booking Confirmed!' : 'Booking Pending'}
          </h1>
          <p className="text-slate-600 mb-8">
            {isPaymentComplete 
              ? 'Your appointment has been scheduled successfully.'
              : 'Your booking is being processed. You will receive a confirmation email shortly.'}
          </p>
          
          {/* Booking Details */}
          {booking && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Booking Details</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-medium text-slate-900">
                      {booking.bookingDate && new Date(booking.bookingDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Time</p>
                    <p className="font-medium text-slate-900">
                      {booking.bookingTime && formatTime(booking.bookingTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Service</p>
                    <p className="font-medium text-slate-900">{booking.serviceName}</p>
                  </div>
                </div>
                {booking.consultantName && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Consultant</p>
                      <p className="font-medium text-slate-900">{booking.consultantName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{booking.customerEmail}</p>
                  </div>
                </div>
                {booking.customerPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900">{booking.customerPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/${domain}`}
              className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href={`/bookings`}
              className="px-6 py-3 text-slate-900 font-semibold rounded-xl border-2 border-slate-200 hover:border-amber-500 hover:text-amber-600 transition-colors"
            >
              Book Another
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      {footerSection && (
        <div className="fixed bottom-0 left-0 right-0">
          {footerSection.templateId === 'footer-modern' ? (
            <FooterModern content={footerSection.content} settings={{}} />
          ) : (
            <FooterBasic content={footerSection.content} settings={{}} />
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}