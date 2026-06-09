'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Users, BedDouble, Bath, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { LoginModal } from '@/components/ui/login-modal';
import { cn } from '@/lib/utils';
import { Id } from '@/convex/_generated/dataModel';
import { getOptimizedImageProps } from '@/lib/cloudflare-images';

interface Owner {
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

interface Location {
  country: string;
  province: string;
  city: string;
  suburb?: string;
  address: string;
  buildingName?: string;
  locationId?: string;
  postalCode?: string;
  streetAddress?: string;
  unitNumber?: string;
}

interface Listing {
  _id: Id<'listings'>;
  _creationTime: number;
  title: string;
  description: string;
  shortDescription?: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  location: Location;
  pricePerNight: number;
  currency: string;
  cleaningFee?: number | null;
  securityDeposit?: number | null;
  amenities: string[];
  images: string[];
  featuredImage?: string | null;
  availableFrom: string;
  availableTo: string;
  minimumStay: number;
  maximumStay?: number | null;
  contactEmail?: string;
  contactPhone?: string;
  houseRules?: string;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  isVerified: boolean;
  isFeatured: boolean;
  views: number | null;
  inquiries: number | null;
  ownerId: Id<'users'>;
  createdAt: string;
  updatedAt: string;
  owner?: Owner | null;
}

interface ListingCardProps {
  listing: Listing;
  isAuthenticated?: boolean;
  isSaved?: boolean;
  onSaveToggle?: (listingId: Id<'listings'>, isSaved: boolean) => void;
  variant?: 'default' | 'compact';
  showOwner?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  isAuthenticated = false,
  isSaved = false,
  onSaveToggle,
  variant = 'default',
  showOwner = true,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const images =
    listing.images && listing.images.length > 0
      ? listing.images
      : [listing.featuredImage || '/placeholder-property.jpg'];

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'ZAR') return `R${price.toLocaleString()}`;
    return `${currency} ${price.toLocaleString()}`;
  };

  const formatLocation = (location: Location) => {
    const parts: string[] = [];
    if (location.suburb) parts.push(location.suburb);
    parts.push(location.city);
    return parts.join(', ');
  };

  const capitalizePropertyType = (type: string) =>
    type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    if (onSaveToggle) onSaveToggle(listing._id, !isSaved);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(i => (i === 0 ? images.length - 1 : i - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(i => (i === images.length - 1 ? 0 : i + 1));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        .lc-root {
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .lc-serif {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }

        /* Card shell */
        .listing-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e7e5e4;
          border-radius: 14px 14px 0 0;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .listing-card:hover {
          border-color: #a8a29e;
          box-shadow: 0 8px 32px rgba(0,0,0,0.10);
        }

        /* Image area */
        .lc-image-wrap {
          position: relative;
          overflow: hidden;
          aspect-ratio: 4 / 3;
          background: #e7e5e4;
          flex-shrink: 0;
        }
        .lc-image-wrap img {
          transition: transform 0.6s ease;
        }
        .listing-card:hover .lc-image-wrap img {
          transform: scale(1.05);
        }

        /* Gradient – bottom only, subtle */
        .lc-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.52) 0%, transparent 55%);
          pointer-events: none;
        }

        /* Featured badge */
        .lc-featured {
          position: absolute;
          top: 12px; left: 12px;
          background: #16911c;
          color: white;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 4px 10px;
        }

        /* Property type badge */
        .lc-type {
          position: absolute;
          top: 12px;
          background: rgba(255,255,255,0.92);
          color: #292524;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 10px;
          backdrop-filter: blur(4px);
        }

        /* Save button */
        .lc-save {
          position: absolute;
          top: 10px; right: 10px;
          width: 34px; height: 34px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(4px);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          z-index: 10;
        }
        .lc-save:hover { background: white; }
        .lc-save.saved { background: #fee2e2; }
        .lc-save .lc-heart { transition: transform 0.2s; }
        .lc-save:hover .lc-heart { transform: scale(1.15); }

        /* Image nav */
        .lc-nav {
          position: absolute;
          top: 50%; transform: translateY(-50%);
          width: 30px; height: 30px;
          background: rgba(255,255,255,0.9);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, background 0.2s;
          z-index: 10;
        }
        .listing-card:hover .lc-nav { opacity: 1; }
        .lc-nav:hover { background: white; }
        .lc-nav-prev { left: 10px; }
        .lc-nav-next { right: 10px; }

        /* Dot indicators */
        .lc-dots {
          position: absolute;
          bottom: 10px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 4px;
          z-index: 10;
        }
        .lc-dot {
          width: 5px; height: 5px;
          background: rgba(255,255,255,0.5);
          border: none; cursor: pointer;
          padding: 0;
          transition: background 0.2s, width 0.2s;
        }
        .lc-dot.active {
          background: white;
          width: 16px;
        }

        /* Price bar at bottom of image */
        .lc-price-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 12px 14px 10px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          pointer-events: none;
        }
        .lc-price-value {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.55rem;
          font-weight: 500;
          color: white;
          line-height: 1;
        }
        .lc-price-unit {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.75);
          margin-left: 3px;
          font-weight: 300;
        }

        /* Body */
        .lc-body {
          padding: 16px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
        }

        /* Title */
        .lc-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.2rem;
          font-weight: 500;
          color: #1c1917;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 6px;
          transition: color 0.2s;
        }
        .listing-card:hover .lc-title { color: #16911c; }

        /* Location */
        .lc-location {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.8rem;
          color: #78716c;
          margin-bottom: 12px;
        }
        .lc-location span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Stats row */
        .lc-stats {
          display: flex;
          align-items: center;
          gap: 0;
          border-top: 1px solid #f5f5f4;
          border-bottom: 1px solid #f5f5f4;
          margin-bottom: 12px;
        }
        .lc-stat {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 0;
          font-size: 0.78rem;
          color: #57534e;
        }
        .lc-stat + .lc-stat {
          border-left: 1px solid #f5f5f4;
          padding-left: 10px;
        }
        .lc-stat-num {
          font-weight: 600;
          color: #292524;
          font-size: 0.85rem;
        }

        /* CTA */
        .lc-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #16911c;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          margin: 0 -16px -14px;
          width: calc(100% + 32px);
          border-radius: 0;
        }
        .lc-cta:hover { background: #0d6b11; }
        .lc-cta-arrow {
          transition: transform 0.2s;
        }
        .listing-card:hover .lc-cta-arrow { transform: translate(2px, -2px); }

        /* Owner strip */
        .lc-owner {
          display: flex; align-items: center; gap: 8px;
          padding-top: 10px;
          border-top: 1px solid #f5f5f4;
          margin-top: 10px;
        }
        .lc-owner-avatar {
          width: 28px; height: 28px;
          background: #292524;
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-family: 'Cormorant Garamond', serif;
          letter-spacing: 0.02em;
        }
        .lc-owner-name {
          font-size: 0.78rem;
          font-weight: 500;
          color: #44403c;
        }
        .lc-owner-role {
          font-size: 0.7rem;
          color: #a8a29e;
        }
      `}</style>

      <Link href={`/listings/${listing._id}`} className="block lc-root">
        <div
          className="listing-card"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* ── Image ── */}
          <div className="lc-image-wrap">
            <Image
              {...getOptimizedImageProps(images[currentImageIndex], listing.title, 'public')}
              fill
              className="object-cover"
            />

            {/* Bottom gradient */}
            <div className="lc-gradient" />

            {/* Featured */}
            {listing.isFeatured && (
              <div className="lc-featured">Featured</div>
            )}

            {/* Property type – offset right if featured */}
            <div
              className="lc-type"
              style={{ left: listing.isFeatured ? 'calc(12px + 76px + 8px)' : 12 }}
            >
              {capitalizePropertyType(listing.propertyType)}
            </div>

            {/* Save */}
            <button
              className={cn('lc-save', isSaved && 'saved')}
              onClick={handleSaveToggle}
              aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
            >
              <Heart
                className="lc-heart"
                style={{
                  width: 16, height: 16,
                  fill: isSaved ? '#dc2626' : 'none',
                  color: isSaved ? '#dc2626' : '#57534e',
                  strokeWidth: 1.5,
                }}
              />
            </button>

            {/* Image nav */}
            {images.length > 1 && (
              <>
                <button className="lc-nav lc-nav-prev" onClick={handlePrevImage} aria-label="Previous image">
                  <ChevronLeft style={{ width: 14, height: 14, color: '#292524' }} />
                </button>
                <button className="lc-nav lc-nav-next" onClick={handleNextImage} aria-label="Next image">
                  <ChevronRight style={{ width: 14, height: 14, color: '#292524' }} />
                </button>

                {/* Dots */}
                <div className="lc-dots">
                  {images.slice(0, 6).map((_, i) => (
                    <button
                      key={i}
                      className={cn('lc-dot', i === currentImageIndex && 'active')}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(i); }}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Price overlay */}
            <div className="lc-price-bar">
              <div>
                <span className="lc-price-value">
                  {formatPrice(listing.pricePerNight, listing.currency)}
                </span>
                <span className="lc-price-unit">/night</span>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="lc-body">
            <div className="lc-title">{listing.title}</div>

            <div className="lc-location">
              <MapPin style={{ width: 12, height: 12, color: '#16911c', flexShrink: 0 }} />
              <span>{formatLocation(listing.location)}</span>
            </div>

            {/* Stats */}
            <div className="lc-stats">
              <div className="lc-stat">
                <Users style={{ width: 13, height: 13, color: '#16911c' }} />
                <span className="lc-stat-num">{listing.maxGuests}</span>
                <span>guests</span>
              </div>
              <div className="lc-stat">
                <BedDouble style={{ width: 13, height: 13, color: '#16911c' }} />
                <span className="lc-stat-num">{listing.bedrooms}</span>
                <span>{listing.bedrooms === 1 ? 'bed' : 'beds'}</span>
              </div>
              <div className="lc-stat">
                <Bath style={{ width: 13, height: 13, color: '#16911c' }} />
                <span className="lc-stat-num">{listing.bathrooms}</span>
                <span>{listing.bathrooms === 1 ? 'bath' : 'baths'}</span>
              </div>
            </div>

            {/* Owner */}
            {showOwner && listing.owner && (
              <div className="lc-owner">
                <div className="lc-owner-avatar">
                  {listing.owner.firstName.charAt(0)}{listing.owner.lastName.charAt(0)}
                </div>
                <div>
                  <div className="lc-owner-name">
                    {listing.owner.firstName} {listing.owner.lastName}
                  </div>
                  <div className="lc-owner-role">Property Owner</div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="lc-cta">
              <span>View Property</span>
              <ArrowUpRight className="lc-cta-arrow" style={{ width: 15, height: 15 }} />
            </div>
          </div>
        </div>
      </Link>

      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        title="Login to Save Listings"
        description="Please log in or create an account to save listings to your favourites and access them anytime."
      />
    </>
  );
};

export default ListingCard;
