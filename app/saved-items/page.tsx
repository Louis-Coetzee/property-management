'use client';

import { useState } from 'react';
import { useRootAuth } from '@/components/platform/RootAuthProvider';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import ListingCard from '@/components/listing-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Heart, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';
import { Loader2 } from 'lucide-react';

export default function SavedItemsPage() {
  const { user, loading: authLoading } = useRootAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [confirmUnsave, setConfirmUnsave] = useState<string | null>(null);

  const savedListings = useQuery(
    api.listings.getSavedListings,
    user ? { userId: user._id } : 'skip'
  );

  const unsaveListing = useMutation(api.listings.unsaveListing);

  const handleUnsaveListing = async (listingId: string) => {
    if (!user) return;

    try {
      await unsaveListing({
        listingId: listingId as Id<'listings'>,
        userId: user._id,
      });
      toast.success('Listing removed from saved listings');
      setConfirmUnsave(null);
    } catch (error) {
      toast.error('Failed to remove listing from saved listings');
    }
  };

  const sortedListings = savedListings
    ?.filter(listing =>
      searchTerm === '' ||
      listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location?.province?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.pricePerNight || 0) - (b.pricePerNight || 0);
        case 'price-high':
          return (b.pricePerNight || 0) - (a.pricePerNight || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'newest':
        default:
          return new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime();
      }
    }) || [];

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <PlatformNavbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
        <PlatformFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50">
        <PlatformNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="h-6 w-6 text-[#16911c]" />
            <h1 className="text-2xl font-bold text-stone-900">Saved Listings</h1>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-full mb-4">
              <Heart className="h-7 w-7 text-stone-400" />
            </div>
            <h2 className="text-lg font-medium text-stone-900 mb-2">Sign in to view saved listings</h2>
            <p className="text-sm text-stone-500 mb-6 max-w-md mx-auto">
              Create an account or sign in to save your favourite listings and access them anytime.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/auth/login" className="px-6 py-2.5 border border-stone-200 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="px-6 py-2.5 bg-[#16911c] text-white rounded-lg text-sm font-medium hover:bg-[#0d6b11] transition-colors">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
        <PlatformFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">Saved Listings</h1>
          </div>
          <p className="text-gray-600">
            Your favorite listings saved for later viewing ({savedListings?.length || 0} saved)
          </p>
        </div>

        {savedListings && savedListings.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Saved Listings Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start browsing properties and save your favorites to see them here.
            </p>
            <Link href="/listings">
              <Button className="bg-green-600 hover:bg-green-700 text-white">Browse Listings</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search saved listings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>

                  {(searchTerm || sortBy !== 'newest') && (
                    <Button variant="outline" onClick={clearFilters}>
                      <Filter className="h-4 w-4 mr-2" />Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {sortedListings.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No Results Found</h2>
                <p className="text-gray-600 mb-8">Try adjusting your filters to see more properties.</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedListings.map((listing) => (
                  <div key={listing._id} className="relative">
                    <ListingCard
                      listing={listing}
                      showOwner={false}
                      isAuthenticated={true}
                      isSaved={true}
                      onSaveToggle={(listingId, newSavedState) => {
                        if (!newSavedState) {
                          setConfirmUnsave(listingId);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmUnsave} onOpenChange={() => setConfirmUnsave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Saved Listings</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this listing from your saved listings?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmUnsave && handleUnsaveListing(confirmUnsave)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlatformFooter />
    </div>
  );
}
