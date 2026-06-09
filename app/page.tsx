'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useRootAuth } from '@/components/platform/RootAuthProvider';
import { ComingSoon } from '@/components/coming-soon';
import { MaintenanceMode } from '@/components/maintenance-mode';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ListingCard from '@/components/listing-card';
import {
  Search,
  SlidersHorizontal,
  Calendar,
  Users,
  Building,
  ChevronDown,
  Loader2,
  X,
  ArrowRight,
  MapPin,
  Check,
  Home,
  Building2,
  Castle,
  Hotel,
  Tent,
  Mountain,
  Warehouse,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';
import { SearchAlertBanner } from '@/components/search-alert-banner';
import { MultiLocationAutocomplete } from '@/components/ui/multi-location-autocomplete';
import { Footer } from '@/components/footer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar-client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 12;
const LOAD_MORE_COUNT = 8;

const propertyTypeIcons: Record<string, any> = {
  'house': Home,
  'apartment': Building2,
  'guest suite': Hotel,
  'villa': Castle,
  'townhouse': Building,
  'cottage': Home,
  'studio': Warehouse,
  'hotel': Hotel,
  'lodge': Mountain,
  'camp site': Tent,
  'other': Landmark,
};

const propertyTypes = [
  'House', 'Apartment', 'Guest Suite', 'Villa', 'Townhouse',
  'Cottage', 'Studio', 'Hotel', 'Lodge', 'Camp Site', 'Other',
];

export default function HomePage() {
  const { user } = useRootAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const siteModeStatus = useQuery(api.sites.getSiteModeStatus);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<Array<{
    city: string; suburb?: string; province: string; displayName: string;
  }>>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(
    propertyTypes.map(t => t.toLowerCase())
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minGuests, setMinGuests] = useState(1);
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [minBathrooms, setMinBathrooms] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAlertBanner, setShowAlertBanner] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(undefined);
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(undefined);
  const [checkInPopoverOpen, setCheckInPopoverOpen] = useState(false);
  const [checkOutPopoverOpen, setCheckOutPopoverOpen] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);
  const [maxGuests, setMaxGuests] = useState<number>(1);

  const availableAmenities = [
    'wifi', 'parking', 'kitchen', 'tv', 'ac', 'pool', 'gym',
    'security', 'laundry', 'pet-friendly', 'balcony',
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('findaccommodation_filters');
      if (saved) {
        const f = JSON.parse(saved);
        if (f.selectedLocations?.length) setSelectedLocations(f.selectedLocations);
        if (f.selectedPropertyTypes?.length) setSelectedPropertyTypes(f.selectedPropertyTypes);
        if (f.priceRange) setPriceRange(f.priceRange);
        if (f.minGuests) setMinGuests(f.minGuests);
        if (f.minBedrooms) setMinBedrooms(f.minBedrooms);
        if (f.minBathrooms) setMinBathrooms(f.minBathrooms);
        if (f.selectedAmenities) setSelectedAmenities(f.selectedAmenities);
        if (f.sortBy) setSortBy(f.sortBy);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('findaccommodation_filters', JSON.stringify({
        selectedLocations, selectedPropertyTypes, priceRange,
        minGuests, minBedrooms, minBathrooms, selectedAmenities, sortBy,
      }));
    } catch {}
  }, [selectedLocations, selectedPropertyTypes, priceRange, minGuests, minBedrooms, minBathrooms, selectedAmenities, sortBy]);

  const allListingsData = useQuery(api.listings.getListings, {});
  const savedListings = useQuery(api.listings.getSavedListings, user?.id ? { userId: user.id as Id<"users"> } : 'skip');
  const saveListing = useMutation(api.listings.saveListing);
  const unsaveListing = useMutation(api.listings.unsaveListing);

  const handleSaveToggle = async (listingId: Id<"listings">, newSavedState: boolean) => {
    if (!user?.id) return;
    try {
      if (newSavedState) {
        await saveListing({ userId: user.id as Id<"users">, listingId });
        toast.success('Saved to favourites');
      } else {
        await unsaveListing({ userId: user.id as Id<"users">, listingId });
        toast.success('Removed from saved listings');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const allListings = allListingsData?.listings || [];

  const filteredListings = useMemo(() => {
    if (!allListings?.length) return [];
    const active = allListings.filter(l => l.status === 'active');
    const filtered = active.filter(listing => {
      const matchesLocation = !selectedLocations.length || selectedLocations.some(sel => {
        const sub = listing.location.suburb?.toLowerCase() || '';
        const city = listing.location.city?.toLowerCase() || '';
        const prov = listing.location.province?.toLowerCase() || '';
        if (sel.suburb?.toLowerCase()) return sub === sel.suburb.toLowerCase();
        if (sel.city?.toLowerCase() && city === sel.city.toLowerCase()) return true;
        if (sel.province?.toLowerCase() && sel.province.toLowerCase() !== 'unknown' && prov === sel.province.toLowerCase()) return false;
        return false;
      });
      const matchesType = !selectedPropertyTypes.length ||
        selectedPropertyTypes.some(t => listing.propertyType.toLowerCase() === t);
      const matchesPrice = listing.pricePerNight >= priceRange[0] && listing.pricePerNight <= priceRange[1];
      const matchesGuests = listing.maxGuests >= maxGuests;
      const matchesBedrooms = listing.bedrooms >= minBedrooms;
      const matchesBathrooms = listing.bathrooms >= minBathrooms;
      const matchesAmenities = !selectedAmenities.length ||
        selectedAmenities.every(a => listing.amenities?.includes(a));
      const matchesDates = (() => {
        if (!checkInDate || !checkOutDate) return true;
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000);
        if (nights < (listing.minimumStay || 1)) return false;
        if (listing.maximumStay && nights > listing.maximumStay) return false;
        const from = new Date(listing.availableFrom);
        const to = new Date(listing.availableTo);
        if (checkInDate > to || checkOutDate < from) return false;
        return true;
      })();
      return matchesLocation && matchesType && matchesPrice && matchesGuests && matchesBedrooms && matchesBathrooms && matchesAmenities && matchesDates;
    });

    const featured = (a: any, b: any) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    switch (sortBy) {
      case 'price-low': return filtered.sort((a, b) => featured(a, b) || a.pricePerNight - b.pricePerNight);
      case 'price-high': return filtered.sort((a, b) => featured(a, b) || b.pricePerNight - a.pricePerNight);
      case 'rating': return filtered.sort((a, b) => featured(a, b) || (b.views || 0) - (a.views || 0));
      case 'guests': return filtered.sort((a, b) => featured(a, b) || b.maxGuests - a.maxGuests);
      default: return filtered.sort((a, b) => featured(a, b) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [allListings, selectedLocations, selectedPropertyTypes, priceRange, minGuests, minBedrooms, minBathrooms, selectedAmenities, sortBy, checkInDate, checkOutDate, maxGuests]);

  const visibleListings = filteredListings?.slice(0, visibleCount) || [];
  const hasMore = filteredListings && filteredListings.length > visibleCount;

  const loadMore = () => setVisibleCount(p => p + LOAD_MORE_COUNT);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLocations([]);
    setSelectedPropertyTypes(propertyTypes.map(t => t.toLowerCase()));
    setPriceRange([0, 1000]);
    setMinGuests(1);
    setMinBedrooms(0);
    setMinBathrooms(0);
    setSelectedAmenities([]);
    setSortBy('newest');
    setVisibleCount(ITEMS_PER_PAGE);
    setCheckInDate(undefined);
    setCheckOutDate(undefined);
    try { localStorage.removeItem('findaccommodation_filters'); } catch {}
  };

  const handleSearch = () => {
    setIsLoading(true);
    setHasSearched(true);
    setShowAlertBanner(true);
    setVisibleCount(ITEMS_PER_PAGE);
    setTimeout(() => setIsLoading(false), 500);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Most Popular' },
    { value: 'guests', label: 'Guest Capacity' },
  ];

  if (siteModeStatus?.maintenanceEnabled && user?.role !== 'admin') {
    return <MaintenanceMode message={siteModeStatus.maintenanceMessage} />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .sans  { font-family: 'DM Sans', system-ui, sans-serif; }

        .search-panel input::placeholder,
        .search-panel [data-placeholder] { color: #78716c; }

        .search-input {
          height: 42px;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 0;
          color: #1c1917;
          font-size: 0.85rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input:focus {
          border-color: #16911c;
          box-shadow: 0 0 0 2px rgba(22,145,28,0.12);
          outline: none;
        }
        .search-input:hover { border-color: rgba(22,145,28,0.4); }

        .search-btn-primary {
          height: 42px;
          background: #16911c;
          color: #fff;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.03em;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: background 0.2s, transform 0.15s;
          width: 100%;
        }
        .search-btn-primary:hover { background: #0d6b11; }
        .search-btn-primary:active { transform: scale(0.99); }

        .search-btn-ghost {
          height: 42px;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85);
          font-size: 0.8rem;
          letter-spacing: 0.02em;
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: background 0.2s, border-color 0.2s;
          width: 100%;
          backdrop-filter: blur(4px);
        }
        .search-btn-ghost:hover { background: rgba(255,255,255,0.16); border-color: rgba(255,255,255,0.4); }

        .listing-section { background: #fafaf9; }

        .sort-select {
          height: 40px;
          border: 1px solid #e7e5e4;
          background: white;
          color: #44403c;
          font-size: 0.875rem;
          padding: 0 36px 0 12px;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }
        .sort-select:focus { border-color: #16911c; }

        .load-more-btn {
          height: 44px;
          padding: 0 32px;
          border: 1px solid #d6d3d1;
          background: white;
          color: #44403c;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          letter-spacing: 0.02em;
        }
        .load-more-btn:hover { border-color: #16911c; color: #16911c; background: #f0fdf4; }

        .tag-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px;
          background: white;
          border: 1px solid #e7e5e4;
          font-size: 0.75rem;
          color: #57534e;
        }
        .tag-chip button { color: #a8a29e; cursor: pointer; }
        .tag-chip button:hover { color: #44403c; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease both; }
        .fade-up-1 { animation-delay: 0.08s; }
        .fade-up-2 { animation-delay: 0.18s; }
        .fade-up-3 { animation-delay: 0.28s; }
      `}</style>

      <div className="min-h-screen bg-stone-50 sans">

        <main>
          {/* Hero with Search */}
          <div className="relative overflow-hidden" style={{ minHeight: 480 }}>
            <div className="absolute inset-0 z-0" style={{
              background: 'linear-gradient(135deg, #0d2017 0%, #112e1d 25%, #174026 50%, #102f1f 75%, #0b1e12 100%)',
            }} />

            <div className="absolute inset-0 z-[1] opacity-[0.04]" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }} />

            <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full z-[2] opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(22,145,28,0.4) 0%, transparent 70%)' }} />
            <div className="pointer-events-none absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full z-[2] opacity-15"
              style={{ background: 'radial-gradient(circle, rgba(22,145,28,0.3) 0%, transparent 70%)' }} />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full z-[2] opacity-[0.07] blur-3xl"
              style={{ background: 'radial-gradient(ellipse, #16911c 0%, transparent 70%)' }} />

            <div className="absolute top-0 left-0 right-0 h-[2px] z-[3]" style={{
              background: 'linear-gradient(90deg, transparent, rgba(22,145,28,0.5), transparent)',
            }} />

            <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 py-10 md:py-14">
              <div className="w-full max-w-3xl mx-auto">

                <div className="fade-up fade-up-1 flex items-center gap-3 mb-4 justify-center md:justify-start">
                  <div className="h-px w-8 bg-[#16911c]" />
                  <span className="text-[#16911c] text-xs font-medium tracking-[0.2em] uppercase">
                    South Africa&apos;s Premier Holiday Platform
                  </span>
                </div>

                <h1
                  className="fade-up fade-up-2 serif text-center md:text-left text-white leading-[1.1] mb-5"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300 }}
                >
                  Find Your Next<br />
                  <em style={{ fontWeight: 600, fontStyle: 'normal', color: '#16911c' }}>Holiday Accommodation.</em>
                </h1>

                <p className="fade-up fade-up-2 text-white/60 text-sm md:text-base font-light leading-relaxed max-w-lg mb-6 text-center md:text-left">
                  List your South African holiday accommodation and reach thousands
                  of travellers — with zero upfront cost, and commission only when you earn.
                </p>

                <div className="fade-up fade-up-3 search-panel w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-px mb-px">
                    <div className="relative">
                      <MultiLocationAutocomplete
                        value={selectedLocations}
                        onChange={setSelectedLocations}
                        placeholder="Where are you going?"
                        className="w-full"
                        maxTags={5}
                        showTags={false}
                        inputClassName="search-input pl-11"
                      />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none z-10"
                        style={{ width: 16, height: 16 }} />
                    </div>

                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none z-10"
                        style={{ width: 16, height: 16 }} />
                      <button
                        type="button"
                        onClick={() => setShowPropertyTypeModal(true)}
                        className="search-input pl-10 w-full text-left cursor-pointer"
                        style={{ height: 42, background: 'rgba(255,255,255,0.96)', borderRadius: 0 }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-stone-600" style={{ fontSize: '0.85rem' }}>
                            {selectedPropertyTypes.length === propertyTypes.length
                              ? 'All Property Types'
                              : selectedPropertyTypes.length === 0
                                ? 'Property type'
                                : `${selectedPropertyTypes.length} type${selectedPropertyTypes.length !== 1 ? 's' : ''} selected`}
                          </span>
                          <ChevronDown className="h-4 w-4 text-stone-400" />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-px mb-px">
                    <Popover open={checkInPopoverOpen} onOpenChange={setCheckInPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button className="search-input flex items-center gap-2 px-3 text-left w-full">
                          <Calendar className="h-4 w-4 text-stone-400 flex-shrink-0" />
                          <span className={checkInDate ? 'text-stone-900' : 'text-stone-500'} style={{ fontSize: '0.9rem' }}>
                            {checkInDate ? format(checkInDate, 'dd MMM yyyy') : 'Check-in date'}
                          </span>
                        </button>
                      </PopoverTrigger>
                      {mounted && (
                        <PopoverContent className="w-auto p-0 shadow-xl border border-stone-200" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={checkInDate}
                            onSelect={(d) => { setCheckInDate(d); setCheckInPopoverOpen(false); }}
                            disabled={{ before: new Date() }}
                          />
                        </PopoverContent>
                      )}
                    </Popover>

                    <Popover open={checkOutPopoverOpen} onOpenChange={setCheckOutPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button className="search-input flex items-center gap-2 px-3 text-left w-full">
                          <Calendar className="h-4 w-4 text-stone-400 flex-shrink-0" />
                          <span className={checkOutDate ? 'text-stone-900' : 'text-stone-500'} style={{ fontSize: '0.9rem' }}>
                            {checkOutDate ? format(checkOutDate, 'dd MMM yyyy') : 'Check-out date'}
                          </span>
                        </button>
                      </PopoverTrigger>
                      {mounted && (
                        <PopoverContent className="w-auto p-0 shadow-xl border border-stone-200" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={checkOutDate}
                            onSelect={(d) => { setCheckOutDate(d); setCheckOutPopoverOpen(false); }}
                            disabled={(d) => d < new Date(new Date().setHours(0,0,0,0)) || !!(checkInDate && d <= checkInDate)}
                          />
                        </PopoverContent>
                      )}
                    </Popover>

                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none z-10" />
                      <Select value={maxGuests.toString()} onValueChange={(v) => setMaxGuests(parseInt(v))}>
                        <SelectTrigger className="search-input pl-10 w-full rounded-none border-0 shadow-none"
                          style={{ height: 42, background: 'rgba(255,255,255,0.96)', borderRadius: 0 }}>
                          <SelectValue placeholder="Number of guests" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-stone-200 shadow-xl">
                          {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <SelectItem key={n} value={n.toString()}>
                              {n === 10 ? 'More than 10' : `${n} Guest${n !== 1 ? 's' : ''}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-px">
                    <button className="search-btn-ghost" onClick={() => setShowAdvancedSearch(true)}>
                      <SlidersHorizontal className="h-4 w-4" />
                      More Filters
                    </button>
                    <button className="search-btn-ghost" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                      Clear Filters
                    </button>
                    <button className="search-btn-primary" onClick={handleSearch}>
                      {isLoading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Search className="h-4 w-4" />
                      }
                      Search Properties
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Listings Section */}
          {siteModeStatus?.comingSoonEnabled ? (
            <ComingSoon message={siteModeStatus.comingSoonMessage} />
          ) : (
            <div className="listing-section">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {selectedLocations.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {selectedLocations.map((loc, i) => (
                      <span key={i} className="tag-chip">
                        <MapPin className="h-3 w-3 text-[#16911c]" />
                        {loc.displayName}
                        <button onClick={() => setSelectedLocations(selectedLocations.filter((_, j) => j !== i))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-stone-200 pb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-px w-6 bg-[#16911c]" />
                      <span className="text-[#16911c] text-xs font-medium tracking-[0.18em] uppercase">
                        Available Properties
                      </span>
                    </div>
                    <h2 className="serif text-3xl md:text-4xl font-light text-stone-900">
                      {selectedLocations.length > 0
                        ? <><em className="font-semibold not-italic">{selectedLocations.map(l => l.displayName).join(', ')}</em></>
                        : <>All <em className="font-semibold not-italic">Listings</em></>
                      }
                    </h2>
                    {selectedLocations.length > 0 && (
                      <p className="text-stone-500 text-sm mt-1">
                        {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} found
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-stone-500 text-sm hidden sm:block">Sort by</span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="sort-select"
                      >
                        {sortOptions.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {allListingsData === undefined ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="flex items-center gap-3 text-stone-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading properties...</span>
                    </div>
                  </div>
                ) : filteredListings.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {visibleListings.map(listing => (
                        <ListingCard
                          key={listing._id}
                          listing={{ ...listing, views: listing.views || 0, inquiries: listing.inquiries || 0 }}
                          showOwner={false}
                          isAuthenticated={!!user}
                          isSaved={savedListings?.some((s: any) => s._id === listing._id) || false}
                          onSaveToggle={handleSaveToggle}
                        />
                      ))}
                    </div>

                    {hasMore && (
                      <div className="text-center mt-14">
                        <button className="load-more-btn" onClick={loadMore}>
                          Load More Properties
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-24">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 mb-6">
                      <Building className="h-7 w-7 text-stone-400" />
                    </div>
                    <h3 className="serif text-2xl font-light text-stone-900 mb-2">
                      No properties found
                    </h3>
                    <p className="text-stone-500 text-sm mb-8">
                      Try adjusting your search criteria
                    </p>
                    <button className="load-more-btn" onClick={clearFilters}>
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Property Type Modal */}
        <Dialog open={showPropertyTypeModal} onOpenChange={setShowPropertyTypeModal}>
          <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-stone-100">
              <DialogTitle className="serif text-xl font-light text-stone-900">
                Select <em className="font-semibold not-italic text-[#16911c]">Property Type</em>
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 py-4">
              <button
                onClick={() => setSelectedPropertyTypes(
                  selectedPropertyTypes.length === propertyTypes.length ? [] : propertyTypes.map(t => t.toLowerCase())
                )}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-50 transition-colors mb-2"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  selectedPropertyTypes.length === propertyTypes.length
                    ? 'bg-[#16911c] border-[#16911c]'
                    : 'border-stone-300'
                }`}>
                  {selectedPropertyTypes.length === propertyTypes.length && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-stone-700">
                  {selectedPropertyTypes.length === propertyTypes.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {propertyTypes.map(type => {
                  const isSelected = selectedPropertyTypes.includes(type.toLowerCase());
                  const Icon = propertyTypeIcons[type.toLowerCase()] || Building;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedPropertyTypes(
                        isSelected
                          ? selectedPropertyTypes.filter(t => t !== type.toLowerCase())
                          : [...selectedPropertyTypes, type.toLowerCase()]
                      )}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-lg transition-all text-left ${
                        isSelected
                          ? 'border border-[#16911c] bg-white'
                          : 'border border-transparent bg-white'
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-[#16911c]' : 'text-stone-400'}`} />
                      <span className={`text-sm ${isSelected ? 'text-[#16911c] font-medium' : 'text-stone-600'}`}>
                        {type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex gap-3">
              <button
                onClick={() => setShowPropertyTypeModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 border border-stone-300 hover:border-stone-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPropertyTypeModal(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#16911c] hover:bg-[#0d6b11] transition-colors"
              >
                Apply
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Advanced Search Modal */}
        <Dialog open={showAdvancedSearch} onOpenChange={setShowAdvancedSearch}>
          <DialogContent className="max-w-lg border border-stone-200 shadow-2xl rounded-none p-0 overflow-hidden">
            <DialogHeader className="px-8 py-6 border-b border-stone-100">
              <DialogTitle className="serif text-2xl font-light text-stone-900">
                Advanced <em className="font-semibold not-italic">Filters</em>
              </DialogTitle>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[60vh] px-8 py-6 space-y-8">
              <div>
                <label className="block text-xs font-medium text-stone-500 tracking-widest uppercase mb-3">
                  Price Range per Night
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0] || ''}
                    onChange={e => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="search-input flex-1 px-3"
                    style={{ height: 44, border: '1px solid #e7e5e4', background: 'white', borderRadius: 0 }}
                  />
                  <span className="text-stone-400 text-sm">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1] || ''}
                    onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                    className="search-input flex-1 px-3"
                    style={{ height: 44, border: '1px solid #e7e5e4', background: 'white', borderRadius: 0 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-500 tracking-widest uppercase mb-3">
                    Min Bedrooms
                  </label>
                  <Select value={minBedrooms.toString()} onValueChange={v => setMinBedrooms(parseInt(v))}>
                    <SelectTrigger style={{ height: 44, borderRadius: 0, border: '1px solid #e7e5e4' }}>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-stone-200 shadow-xl">
                      <SelectItem value="0">Any</SelectItem>
                      {[1,2,3,4,5,6].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} Bedroom{n !== 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-500 tracking-widest uppercase mb-3">
                    Min Bathrooms
                  </label>
                  <Select value={minBathrooms.toString()} onValueChange={v => setMinBathrooms(parseInt(v))}>
                    <SelectTrigger style={{ height: 44, borderRadius: 0, border: '1px solid #e7e5e4' }}>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-stone-200 shadow-xl">
                      <SelectItem value="0">Any</SelectItem>
                      {[1,2,3,4,5].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} Bathroom{n !== 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-stone-500 tracking-widest uppercase mb-3">
                  Amenities
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {availableAmenities.map(a => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(a)}
                        onChange={e => setSelectedAmenities(
                          e.target.checked ? [...selectedAmenities, a] : selectedAmenities.filter(x => x !== a)
                        )}
                        className="accent-[#16911c]"
                      />
                      <span className="text-sm text-stone-600 capitalize">{a.replace(/-/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-stone-100 flex gap-3">
              <button
                onClick={() => { clearFilters(); setShowAdvancedSearch(false); }}
                className="flex-1 load-more-btn"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowAdvancedSearch(false)}
                className="flex-1 search-btn-primary"
                style={{ height: 48 }}
              >
                Apply Filters
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search Alert Banner */}
        {hasSearched && showAlertBanner && (
          <SearchAlertBanner
            searchParams={{
              location: selectedLocations.length > 0
                ? selectedLocations.map(l => l.displayName).join(', ')
                : searchTerm,
              priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
              priceMax: priceRange[1] < 1000 ? priceRange[1] : undefined,
              maxGuests: maxGuests > 1 ? maxGuests : undefined,
              listingTypes: selectedPropertyTypes.length > 0 ? selectedPropertyTypes : undefined,
            }}
            resultsCount={filteredListings.length}
            showBanner={true}
            onDismiss={() => setShowAlertBanner(false)}
          />
        )}

        {/* List Your Property CTA */}
        <section className="bg-stone-50 border-t border-stone-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center gap-3 mb-4 justify-center">
                <div className="h-px w-8 bg-[#16911c]" />
                <span className="text-[#16911c] text-xs font-medium tracking-[0.2em] uppercase">
                  For Property Owners
                </span>
                <div className="h-px w-8 bg-[#16911c]" />
              </div>
              <h2 className="serif text-3xl md:text-4xl font-light text-stone-900 mb-3">
                List Your <em className="font-semibold not-italic text-[#16911c]">Property</em>
              </h2>
              <p className="text-stone-500 text-sm mb-8 max-w-md mx-auto">
                No setup costs. Commission fee applicable on successful bookings.
              </p>
              <Link href="/advertise">
                <button className="bg-[#16911c] hover:bg-[#0d6b11] text-white text-sm font-semibold px-8 py-3 transition-colors tracking-wide">
                  Advertise With Us
                </button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />

        <div className="sans bg-white border-t border-stone-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-stone-500">
                &copy; {new Date().getFullYear()} <span className="serif font-semibold text-stone-600">Find</span>
                <span className="serif font-bold text-[#16911c] ml-1">Accommodation</span>. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <Link href="/terms" className="text-stone-500 hover:text-[#16911c] transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="text-stone-500 hover:text-[#16911c] transition-colors">
                  Privacy
                </Link>
                <Link href="/contact" className="text-stone-500 hover:text-[#16911c] transition-colors">
                  Help
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
