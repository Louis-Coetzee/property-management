'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X, TrendingUp, MapPin } from 'lucide-react';
import { LoginModal } from '@/components/ui/login-modal';
import { useRootAuth } from '@/components/platform/RootAuthProvider';
import { useRouter } from 'next/navigation';

interface SearchAlertBannerProps {
  searchParams: {
    location?: string;
    listingTypes?: string[];
    priceMin?: number;
    priceMax?: number;
    maxGuests?: number;
  };
  resultsCount: number;
  onDismiss: () => void;
  showBanner?: boolean;
}

export function SearchAlertBanner({
  searchParams,
  resultsCount = 0,
  onDismiss,
  showBanner = false
}: SearchAlertBannerProps) {
  const { user } = useRootAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!showBanner) {
      setIsVisible(false);
      return;
    }

    const dismissed = sessionStorage.getItem('alertBannerDismissed');

    if (!dismissed) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [showBanner]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('alertBannerDismissed', 'true');
    onDismiss?.();
  };

  const handleCreateAlert = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const params = new URLSearchParams();
    if (searchParams?.location) params.set('location', searchParams.location);
    if (searchParams?.priceMin) params.set('priceMin', searchParams.priceMin.toString());
    if (searchParams?.priceMax) params.set('priceMax', searchParams.priceMax.toString());
    if (searchParams?.listingTypes) params.set('listingTypes', searchParams.listingTypes.join(','));
    if (searchParams?.maxGuests) params.set('maxGuests', searchParams.maxGuests.toString());

    router.push(`/alerts/create?${params.toString()}`);
  };

  const createAlertMessage = (): string => {
    const parts: string[] = [];

    if (searchParams.location) {
      parts.push(`in ${searchParams.location}`);
    }

    if (searchParams.listingTypes && searchParams.listingTypes.length > 0) {
      if (searchParams.listingTypes.length === 1) {
        parts.push(`for ${searchParams.listingTypes[0]}s`);
      } else {
        parts.push(`for ${searchParams.listingTypes.join(', ')} properties`);
      }
    }

    if (searchParams.priceMin && searchParams.priceMax) {
      parts.push(`priced R${searchParams.priceMin.toLocaleString()}-R${searchParams.priceMax.toLocaleString()}`);
    } else if (searchParams.priceMin) {
      parts.push(`from R${searchParams.priceMin.toLocaleString()}`);
    } else if (searchParams.priceMax) {
      parts.push(`up to R${searchParams.priceMax.toLocaleString()}`);
    }

    if (searchParams.maxGuests && searchParams.maxGuests > 1) {
      parts.push(`for ${searchParams.maxGuests}+ guests`);
    }

    if (parts.length === 0) {
      return `Showing ${resultsCount} listings`;
    }

    return `Found ${resultsCount} ${resultsCount === 1 ? 'listing' : 'listings'} ${parts.join(', ')}`;
  };

  const alertMessage = createAlertMessage();

  return (
    <>
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Get Alerts for New Listings
                  </h3>
                  <p className="text-sm text-gray-600">
                    Never miss your perfect accommodation
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-600">{alertMessage}</span>
                </div>

                {searchParams?.location && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{searchParams.location}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCreateAlert}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {user ? 'Create Alert for This Search' : 'Login to Create Alert'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Maybe Later
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        action="general"
        title="Login to Create Alerts"
        description="Please log in or create an account to set up search alerts and never miss your perfect listing."
      />
    </>
  );
}
