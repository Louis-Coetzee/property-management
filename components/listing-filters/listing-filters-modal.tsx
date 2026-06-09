'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, Bed, Bath } from 'lucide-react';

interface ListingFiltersModalProps {
  children?: React.ReactNode;
  onApply: (filters: {
    minPrice: number;
    maxPrice: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
  }) => void;
  initialFilters: {
    minPrice: number;
    maxPrice: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
  };
}

export function ListingFiltersModal({ children, onApply, initialFilters }: ListingFiltersModalProps) {
  const [open, setOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);
  const [bedrooms, setBedrooms] = useState(initialFilters.bedrooms);
  const [bathrooms, setBathrooms] = useState(initialFilters.bathrooms);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialFilters.amenities);

  const amenities = [
    'wifi',
    'parking',
    'kitchen',
    'tv',
    'ac',
    'pool',
    'gym',
    'security',
    'laundry',
    'pet-friendly',
    'balcony'
  ];

  const handleApply = () => {
    onApply({
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      amenities: selectedAmenities,
    });
    setOpen(false);
  };

  const formatPrice = (value: number) => {
    return `R${value.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Listings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Price Range */}
          <div className="space-y-4">
            <Label>Price Range (per night)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="number"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  min={minPrice}
                />
              </div>
            </div>
            <Slider
              min={0}
              max={10000}
              step={100}
              value={[minPrice, maxPrice]}
              onValueChange={([min, max]: number[]) => {
                setMinPrice(min);
                setMaxPrice(max);
              }}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatPrice(minPrice)}</span>
              <span>{formatPrice(maxPrice)}</span>
            </div>
          </div>

          {/* Rooms */}
          <div className="grid grid-cols-2 gap-4">
            {/* Bedrooms */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bed className="h-4 w-4" />
                Bedrooms
              </Label>
              <Select
                value={bedrooms.toString()}
                onValueChange={(value: string) => setBedrooms(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}+ {num === 1 ? 'bedroom' : 'bedrooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bath className="h-4 w-4" />
                Bathrooms
              </Label>
              <Select
                value={bathrooms.toString()}
                onValueChange={(value: string) => setBathrooms(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}+ {num === 1 ? 'bathroom' : 'bathrooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-4">
              {amenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={selectedAmenities.includes(amenity)}
                    onCheckedChange={(checked: boolean | 'indeterminate') => {
                      if (checked) {
                        setSelectedAmenities([...selectedAmenities, amenity]);
                      } else {
                        setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
                      }
                    }}
                  />
                  <label
                    htmlFor={amenity}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                  >
                    {amenity.replace('-', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setMinPrice(0);
              setMaxPrice(10000);
              setBedrooms(0);
              setBathrooms(0);
              setSelectedAmenities([]);
            }}
          >
            Clear All
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 