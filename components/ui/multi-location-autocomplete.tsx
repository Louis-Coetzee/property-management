"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface LocationTag {
  city: string;
  suburb?: string;
  province: string;
  displayName: string;
}

interface MultiLocationAutocompleteProps {
  value: LocationTag[];
  onChange: (locations: LocationTag[]) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  maxTags?: number;
  showTags?: boolean;
}

export function MultiLocationAutocomplete({
  value,
  onChange,
  placeholder = "Search locations...",
  className,
  inputClassName,
  disabled = false,
  maxTags = 5,
  showTags = true,
}: MultiLocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activeLocations = useQuery(api.listings.getActiveListingLocations);

  const filteredLocations = activeLocations?.filter((location) => {
    if (!inputValue) return true;

    const searchLower = inputValue.toLowerCase();
    const displayLower = location.displayName.toLowerCase();
    const cityLower = location.city.toLowerCase();
    const suburbLower = location.suburb?.toLowerCase() || "";

    const isAlreadySelected = value.some(
      (tag) =>
        tag.city === location.city &&
        tag.suburb === location.suburb &&
        tag.province === location.province
    );

    if (isAlreadySelected) return false;

    return (
      displayLower.includes(searchLower) ||
      cityLower.includes(searchLower) ||
      suburbLower.includes(searchLower)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 10);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open]);

  const handleLocationSelect = (location: {
    city: string;
    suburb?: string;
    province: string;
    displayName: string;
  }) => {
    if (value.length >= maxTags) {
      return;
    }

    const isAlreadySelected = value.some(
      (tag) =>
        tag.city === location.city &&
        tag.suburb === location.suburb &&
        tag.province === location.province
    );

    if (isAlreadySelected) {
      setInputValue("");
      setOpen(false);
      toast(`"${location.displayName}" has already been added to search filters`, {
        duration: 3000,
        icon: '⚠️',
        style: {
          background: '#fff7ed',
          color: '#c2410c',
          border: '1px solid #f97316',
          fontWeight: '500',
        },
      });
      return;
    }

    const newTag: LocationTag = {
      city: location.city,
      suburb: location.suburb,
      province: location.province,
      displayName: location.displayName,
    };

    onChange([...value, newTag]);
    setInputValue("");
    setOpen(false);

    toast.success(`Added "${location.displayName}" to search filters`, {
      duration: 2000,
    });

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleRemoveTag = (indexToRemove: number) => {
    const removedTag = value[indexToRemove];
    onChange(value.filter((_, index) => index !== indexToRemove));

    toast(`Removed "${removedTag.displayName}" from search filters`, {
      duration: 2000,
      icon: '🗑️',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue.length >= 1) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (inputValue.length >= 1 || filteredLocations?.length) {
      setOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const canAddMore = value.length < maxTags;

  return (
    <div className={cn("w-full", className)}>
      {showTags && value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 flex items-center gap-2"
            >
              <MapPin className="h-3 w-3" />
              <span className="text-sm font-medium">{tag.displayName}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(index)}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {canAddMore && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                placeholder={
                  value.length === 0
                    ? placeholder
                    : `Add another location (${maxTags - value.length} remaining)...`
                }
                disabled={disabled}
                className={cn("pl-10 pr-10 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 h-12", inputClassName)}
                autoComplete="off"
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </PopoverTrigger>

          <PopoverContent
            ref={popoverRef}
            className="w-full p-0"
            align="start"
            style={{ width: "var(--radix-popover-trigger-width)" }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="max-h-60 overflow-auto">
              {!activeLocations ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <div className="text-gray-700">Loading locations...</div>
                </div>
              ) : filteredLocations && filteredLocations.length > 0 ? (
                <div>
                  {filteredLocations.slice(0, 10).map((location, index) => (
                    <div
                      key={index}
                      className="cursor-pointer flex items-center justify-between gap-2 py-3 px-4 hover:bg-green-50 border-b border-gray-100 last:border-0 transition-colors"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <MapPin className="h-4 w-4 shrink-0 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {location.displayName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {location.count} {location.count === 1 ? "listing" : "listings"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-sm">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <div className="text-gray-500 mb-1">No locations found</div>
                  <div className="text-xs text-gray-400">
                    {inputValue
                      ? "Try a different search term"
                      : "Type to search for locations with active listings"}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {!canAddMore && (
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <span>Maximum {maxTags} locations selected. Remove a location to add another.</span>
        </div>
      )}
    </div>
  );
}

export function LocationTagsDisplay({
  locations,
  onRemove,
  disabled = false,
}: {
  locations: LocationTag[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  if (locations.length === 0) return null;

  const handleRemove = (index: number) => {
    const removedTag = locations[index];
    onRemove(index);
    toast(`Removed "${removedTag.displayName}" from search filters`, {
      duration: 2000,
      icon: '🗑️',
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {locations.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 flex items-center gap-1.5 text-xs"
        >
          <MapPin className="h-3 w-3" />
          <span className="font-medium">{tag.displayName}</span>
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
