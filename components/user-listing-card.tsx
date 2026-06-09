'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Users, BedDouble, Bath, Eye, MessageCircle, Edit, Trash2, Building, MoreVertical, Phone, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Id } from '@/convex/_generated/dataModel';
import { getOptimizedImageProps } from '@/lib/cloudflare-images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserListingCardProps {
  listing: {
    _id: Id<"listings">;
    title: string;
    shortDescription?: string;
    location: {
      suburb?: string;
      city: string;
      province: string;
    };
    pricePerNight: number;
    currency: string;
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    featuredImage?: string | null;
    images: string[];
    status: string;
    isFeatured?: boolean;
    views?: number | null;
    inquiries?: number | null;
    contactViews?: number | null;
    createdAt: string;
    updatedAt?: string;
  };
  onEdit: (listingId: Id<"listings">) => void;
  onDelete: (listingId: Id<"listings">) => void;
  className?: string;
}

export default function UserListingCard({ 
  listing, 
  onEdit, 
  onDelete, 
  className 
}: UserListingCardProps) {
  const formatPrice = (price: number) => {
    return `R${price.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'inactive':
        return 'bg-gray-500 text-white';
      case 'suspended':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className={cn("group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border border-gray-200 hover:border-green-300 rounded-xl h-full min-h-[500px] flex flex-col", className)}>
      <div className="relative">
        {/* Image */}
        <div className="relative h-48 max-[420px]:h-60 overflow-hidden rounded-t-xl">
          {listing.featuredImage || (listing.images && listing.images.length > 0) ? (
            <Image
              {...getOptimizedImageProps(
                listing.featuredImage || listing.images[0], 
                listing.title,
                'public'
              )}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Building className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Gradient overlay for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10"></div>
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={cn(getStatusColor(listing.status), "shadow-lg font-medium backdrop-blur-sm")}>
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </Badge>
          </div>

          {/* Featured Badge */}
          {listing.isFeatured && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg font-medium backdrop-blur-sm">
                ⭐ Featured
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          {/* Title and Description */}
          <div className="mb-4">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 leading-tight">
              {listing.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {listing.shortDescription}
            </p>
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-green-600" />
            <span className="line-clamp-1 font-medium">
              {listing.location.suburb}, {listing.location.city}
            </span>
          </div>

          {/* Property Details */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md text-sm">
              <BedDouble className="h-4 w-4 mr-1 text-green-600" />
              <span className="font-medium text-gray-700">{listing.bedrooms}</span>
            </div>
            <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md text-sm">
              <Bath className="h-4 w-4 mr-1 text-green-600" />
              <span className="font-medium text-gray-700">{listing.bathrooms}</span>
            </div>
            <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md text-sm">
              <Users className="h-4 w-4 mr-1 text-green-600" />
              <span className="font-medium text-gray-700">{listing.maxGuests}</span>
            </div>
          </div>

          {/* Price and Stats */}
          <div className="flex items-center justify-between mb-4 pt-3 border-t border-gray-100">
            <div>
              <span className="text-xl font-bold text-green-600">
                {formatPrice(listing.pricePerNight)}
              </span>
              <span className="text-sm text-gray-500 ml-1 font-medium">/night</span>
            </div>
            
            {/* Views, Inquiries, and Contact Views Stats */}
            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                <Eye className="h-4 w-4 mr-1 text-green-600" />
                <span className="font-medium">{listing.views || 0}</span>
              </div>
              <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                <MessageCircle className="h-4 w-4 mr-1 text-blue-600" />
                <span className="font-medium">{listing.inquiries || 0}</span>
              </div>
              <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                <Phone className="h-4 w-4 mr-1 text-purple-600" />
                <span className="font-medium">{listing.contactViews || 0}</span>
              </div>
            </div>
          </div>

          {/* Options Dropdown */}
          <div className="flex justify-end mt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 font-medium">
                  <MoreVertical className="h-4 w-4 mr-1" />
                  Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/listings/${listing._id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Listing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(listing._id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Listing
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/listings/${listing._id}/availability`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Availability
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-red-600 hover:text-red-700 cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Listing
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{listing.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDelete(listing._id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </div>
    </Card>
  );
} 