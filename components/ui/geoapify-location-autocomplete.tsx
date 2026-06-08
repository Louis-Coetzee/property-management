"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeoapifyFeature {
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  suburb?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  county?: string;
  street?: string;
  housenumber?: string;
  name?: string;
  district?: string;
  result_type?: string;
}

interface LocationData {
  address: string;
  suburb: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

interface GeoapifyLocationAutocompleteProps {
  value?: Partial<LocationData>;
  onChange: (location: LocationData) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export function GeoapifyLocationAutocomplete({
  value,
  onChange,
  placeholder = "Search for a location in South Africa...",
  className,
  disabled = false,
  required = false,
  label,
}: GeoapifyLocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getFullProvinceName = useCallback((abbr: string): string => {
    const provinceMap: { [key: string]: string } = {
      'NL': 'KwaZulu-Natal',
      'KZN': 'KwaZulu-Natal',
      'WC': 'Western Cape',
      'GP': 'Gauteng',
      'EC': 'Eastern Cape',
      'NC': 'Northern Cape',
      'FS': 'Free State',
      'MP': 'Mpumalanga',
      'LP': 'Limpopo',
      'NW': 'North West'
    };
    return provinceMap[abbr] || abbr;
  }, []);

  const formatLocationDisplay = useCallback((feature: GeoapifyFeature): string => {
    const parts: string[] = [];
    
    if (feature.street) {
      const street = feature.housenumber 
        ? `${feature.housenumber} ${feature.street}`
        : feature.street;
      parts.push(street);
    }
    
    const suburb = feature.suburb || feature.district || feature.name || '';
    const city = feature.city || '';
    const rawProvince = feature.state || '';
    const province = rawProvince.length <= 3 ? getFullProvinceName(rawProvince) : rawProvince;
    
    if (suburb) parts.push(suburb);
    if (city) parts.push(city);
    if (province) parts.push(province);
    
    return parts.join(', ');
  }, [getFullProvinceName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedValue.length < 2) {
        setSuggestions([]);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);

      try {
        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

        if (!apiKey) {
          console.error('Geoapify API key is not configured');
          setSuggestions([]);
          setIsLoading(false);
          return;
        }

        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          debouncedValue
        )}&filter=countrycode:za&limit=20&lang=en&format=json&apiKey=${apiKey}`;

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();

        const validResults = (data.results || []).filter((result: GeoapifyFeature) => {
          if (!result) return false;

          const excludeKeywords = [
            'municipality',
            'local municipality',
            'district municipality',
            'metropolitan municipality',
            'airport',
            'international airport',
            'station',
            'hospital',
            'school',
            'university',
            'college',
            'mall',
            'shopping',
            'centre',
            'center',
            'park',
            'reserve',
            'nature',
            'ward',
            'b&b',
            'hotel',
            'lodge',
            'guest house',
            'parking',
            'primary',
            'secondary',
            'high school'
          ];

          const nameToCheck = (result.name || '').toLowerCase();
          const formattedToCheck = (result.formatted || '').toLowerCase();

          const isExcluded = excludeKeywords.some(keyword =>
            nameToCheck.includes(keyword) || formattedToCheck.includes(keyword)
          );

          if (isExcluded) return false;

          return true;
        });

        setSuggestions(validResults);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching Geoapify suggestions:', error);
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedValue]);

  useEffect(() => {
    if (value?.address) {
      setInputValue(value.address);
    } else if (value?.suburb && value?.city) {
      const displayText = `${value.suburb}, ${value.city}${value.province ? `, ${value.province}` : ""}`;
      setInputValue(displayText);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleLocationSelect = useCallback((feature: GeoapifyFeature) => {
    if (!feature) return;

    const suburb = feature.suburb || feature.district || feature.county || feature.city || feature.name || "";
    const city = feature.city || feature.county || "";
    const rawProvince = feature.state || "";
    const province = rawProvince.length <= 3 ? getFullProvinceName(rawProvince) : rawProvince;
    const country = feature.country || "South Africa";
    const streetAddress = feature.street
      ? `${feature.housenumber || ""} ${feature.street}`.trim()
      : feature.address_line1 || "";
    const postalCode = feature.postcode || "";
    
    const fullAddress = formatLocationDisplay(feature);
    setInputValue(fullAddress);
    setOpen(false);

    onChange({
      address: fullAddress,
      suburb,
      city,
      province,
      country,
      postalCode,
    });
  }, [onChange, getFullProvinceName, formatLocationDisplay]);

  const handleClear = useCallback(() => {
    setInputValue("");
    setOpen(false);
    setSuggestions([]);
    onChange({
      address: "",
      suburb: "",
      city: "",
      province: "",
      country: "South Africa",
      postalCode: "",
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (newValue.length >= 2) {
      setOpen(true);
    } else {
      setOpen(false);
      setSuggestions([]);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-900"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          )}
          {inputValue && !isLoading && (
            <button
              type="button"
              className="h-6 w-6 p-0 hover:bg-slate-100 rounded flex items-center justify-center"
              onClick={handleClear}
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <MapPin className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-auto"
        >
          {debouncedValue.length < 2 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <div className="text-slate-700 mb-1">Start typing to search</div>
              <div className="text-xs text-slate-500">
                Enter at least 2 characters to find locations in South Africa
              </div>
            </div>
          ) : isLoading ? (
            <div className="py-6 text-center text-sm text-slate-500">
              <Loader2 className="h-8 w-8 mx-auto mb-2 text-slate-400 animate-spin" />
              <div className="text-slate-700">Searching...</div>
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              {suggestions.map((feature, index) => (
                <div
                  key={index}
                  className="cursor-pointer flex items-start gap-2 py-3 px-4 hover:bg-slate-50 border-b last:border-b-0"
                  onClick={() => handleLocationSelect(feature)}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-900 truncate">
                      {formatLocationDisplay(feature)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-sm">
              <div className="text-slate-500 mb-2">No locations found</div>
              <div className="text-xs text-slate-400 mb-2">
                Try typing a different address or suburb
              </div>
              <div className="text-xs text-slate-400">
                Only locations in South Africa are shown
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}