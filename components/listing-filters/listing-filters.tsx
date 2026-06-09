'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  MapPin, 
  Home, 
  Users, 
  Bed, 
  DollarSign,
  Filter,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface FilterState {
  searchTerm: string;
  location: string;
  propertyType: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  maxGuests: number;
  sortBy: string;
}

interface ListingFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  resultsCount?: number;
  isLoading?: boolean;
  className?: string;
}

const PROPERTY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'studio', label: 'Studio' },
  { value: 'townhouse', label: 'Townhouse' },

];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured First' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

export default function ListingFilters({ 
  onFiltersChange, 
  resultsCount = 0, 
  isLoading = false,
  className = '' 
}: ListingFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    location: '',
    propertyType: '',
    minPrice: 0,
    maxPrice: 1000,
    bedrooms: 0,
    maxGuests: 1,
    sortBy: 'newest'
  });

  const [priceRange, setPriceRange] = useState<number[]>([0, 1000]);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Update active filters count
  useEffect(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.location) count++;
    if (filters.propertyType) count++;
    if (filters.minPrice > 0) count++;
    if (filters.maxPrice < 1000) count++;
    if (filters.bedrooms > 0) count++;
    if (filters.maxGuests > 1) count++;
    if (filters.sortBy !== 'newest') count++;
    setActiveFiltersCount(count);
  }, [filters]);

  // Handle input changes
  const handleInputChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));

    // Notify parent component
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    const defaultFilters = {
      searchTerm: '',
      location: '',
      propertyType: '',
      minPrice: 0,
      maxPrice: 1000,
      bedrooms: 0,
      maxGuests: 1,
      sortBy: 'newest'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values);
    setFilters(prev => ({ 
      ...prev, 
      minPrice: values[0], 
      maxPrice: values[1] 
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            placeholder="Search by title, location, or description..."
            value={filters.searchTerm}
            onChange={(e) => handleInputChange('searchTerm', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-medium">Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="location"
            placeholder="City, province, or country..."
            value={filters.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <Label htmlFor="propertyType" className="text-sm font-medium">Property Type</Label>
        <Select
          value={filters.propertyType}
          onValueChange={(value: string) => handleInputChange('propertyType', value)}
        >
          <SelectTrigger id="propertyType">
            <SelectValue placeholder="All property types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All property types</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="cottage">Cottage</SelectItem>
            <SelectItem value="cabin">Cabin</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="townhouse">Townhouse</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Price Range</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleInputChange('minPrice', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleInputChange('maxPrice', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <Label htmlFor="bedrooms" className="text-sm font-medium">Bedrooms</Label>
        <Input
          id="bedrooms"
          type="number"
          value={filters.bedrooms}
          onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
          min={0}
          className="w-full"
        />
      </div>

      {/* Max Guests */}
      <div className="space-y-2">
        <Label htmlFor="maxGuests" className="text-sm font-medium">Minimum Guests</Label>
        <Input
          id="maxGuests"
          type="number"
          value={filters.maxGuests}
          onChange={(e) => handleInputChange('maxGuests', parseInt(e.target.value) || 1)}
          min={1}
          className="w-full"
        />
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label htmlFor="sortBy" className="text-sm font-medium">Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value: string) => handleInputChange('sortBy', value)}
        >
          <SelectTrigger id="sortBy">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full"
        onClick={clearAllFilters}
      >
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className={className}>
      {/* Mobile Filters */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FiltersContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters */}
      <Card className="hidden lg:block">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filters
            </div>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FiltersContent />
        </CardContent>
      </Card>

      {/* Results Count */}
      {resultsCount > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          {resultsCount} {resultsCount === 1 ? 'listing' : 'listings'} found
        </div>
      )}
    </div>
  );
} 