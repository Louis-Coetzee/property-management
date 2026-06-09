'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/[domain]/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MultiMediaPicker } from '@/components/ui/multi-media-picker';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  Home,
  MapPin,
  Banknote,
  Camera,
  Calendar as CalendarIcon,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Coffee,
  Tv,
  AirVent,
  Waves,
  Trees,
  Dumbbell,
  Shield,
  X,
  Plus,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Check,
  Lock,
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon2,
} from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { GeoapifyLocationAutocomplete } from '@/components/ui/geoapify-location-autocomplete';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const PROPERTY_TYPES = [
  { value: 'house', label: 'House', icon: Home },
  { value: 'apartment', label: 'Apartment', icon: Home },
  { value: 'villa', label: 'Villa', icon: Home },
  { value: 'cottage', label: 'Cottage', icon: Home },
  { value: 'cabin', label: 'Cabin', icon: Trees },
  { value: 'studio', label: 'Studio', icon: Home },
  { value: 'townhouse', label: 'Townhouse', icon: Home },
  { value: 'hotel', label: 'Hotel', icon: Home },
  { value: 'lodge', label: 'Lodge', icon: Home },
  { value: 'campsite', label: 'Camp Site', icon: Trees },
];

const COMMON_AMENITIES = [
  { id: 'wifi', label: 'Free WiFi', icon: Wifi },
  { id: 'parking', label: 'Free Parking', icon: Car },
  { id: 'kitchen', label: 'Kitchen', icon: Coffee },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'ac', label: 'Air Conditioning', icon: AirVent },
  { id: 'pool', label: 'Swimming Pool', icon: Waves },
  { id: 'gym', label: 'Gym/Fitness Center', icon: Dumbbell },
  { id: 'security', label: '24/7 Security', icon: Shield },
];

const listingFormSchema = z.object({
  title: z.string().min(10, 'Please enter a descriptive title with at least 10 characters'),
  description: z.string().min(50, 'Please provide a detailed description with at least 50 characters'),
  shortDescription: z.string().min(10, 'Please enter a short description with at least 10 characters'),
  propertyType: z.string().min(1, 'Please select a property type'),
  bedrooms: z.number().min(1, 'Please enter at least 1 bedroom'),
  bathrooms: z.number().min(1, 'Please enter at least 1 bathroom'),
  maxGuests: z.number().min(1, 'Please enter at least 1 guest capacity'),
  location: z.object({
    locationId: z.string().optional(),
    displayText: z.string().optional(),
    buildingName: z.string().optional(),
    unitNumber: z.string().optional(),
    postalCode: z.string().optional(),
    streetAddress: z.string().min(1, 'Please enter the street address'),
    country: z.string().min(1, 'Please enter the country'),
    province: z.string().min(1, 'Please enter the province'),
    city: z.string().min(1, 'Please enter the city'),
    suburb: z.string().min(1, 'Please enter the suburb'),
    address: z.string().min(1, 'Please enter the full address'),
  }).passthrough(),
  pricePerNight: z.number().min(1, 'Please set a price of at least R1 per night'),
  currency: z.string().min(1, 'Please select a currency'),
  cleaningFee: z.number().nullable().optional(),
  securityDeposit: z.number().nullable().optional(),
  amenities: z.array(z.string()),
  images: z.array(z.string()).min(1, 'Please upload at least one high-quality photo'),
  featuredImage: z.string().nullable(),
  coverImageIndex: z.number().min(0, 'Please select a cover image'),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  minimumStay: z.number().optional(),
  maximumStay: z.number().nullable().optional(),
  contactEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  houseRules: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  customAmenity: z.string().optional(),
  ownerId: z.string().optional(),
  status: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  paymentDetails: z.object({
    enabled: z.boolean().optional(),
    bankingDetails: z.object({
      bankName: z.string().optional(),
      accountHolder: z.string().optional(),
      accountNumber: z.string().optional(),
      branchCode: z.string().optional(),
      accountType: z.string().optional(),
      swiftCode: z.string().optional(),
    }).optional(),
    paymentMethods: z.array(z.string()).optional(),
    depositRequirements: z.object({
      bookingDeposit: z.number().nullable().optional(),
      damageDepositAmount: z.number().nullable().optional(),
      keyDepositAmount: z.number().nullable().optional(),
    }).optional(),
    paymentTerms: z.object({
      fullPaymentDue: z.string().optional(),
      depositDue: z.string().optional(),
      refundPolicy: z.string().optional(),
      lateCancellationFee: z.number().nullable().optional(),
      noShowFee: z.number().nullable().optional(),
      paymentSecuredOnly: z.boolean().optional(),
    }).optional(),
    additionalFees: z.array(z.any()).optional(),
    paymentInstructions: z.string().optional(),
    paymentReference: z.string().optional(),
  }).optional(),
}).passthrough();

type FormValues = z.infer<typeof listingFormSchema>;

// Step definitions
const getSteps = (isAdmin: boolean) => [
  { id: 'basic', title: 'Basic Info', icon: Home, description: 'Tell us about your listing' },
  { id: 'details', title: 'Details', icon: Banknote, description: 'Pricing & amenities' },
  { id: 'photos', title: 'Photos', icon: Camera, description: 'Upload images' },
  { id: 'policies', title: 'Policies', icon: CalendarIcon, description: 'House rules & policies' },
  { id: 'availability', title: 'Availability', icon: CalendarIcon2, description: 'Manage calendar' },
  ...(isAdmin
    ? [{ id: 'payment', title: 'Payment', icon: CreditCard, description: 'Payment configuration' }]
    : []),
];

interface EditListingFormProps {
  listingId: string;
  className?: string;
}

export default function EditListingForm({ listingId, className = '' }: EditListingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const updateListing = useMutation(api.listings.updateListing);

  // Fetch listing data
  const listing = useQuery(api.listings.getListing, { id: listingId as Id<"listings"> });
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAmenity, setCustomAmenity] = useState('');

  // Get steps based on user role
  const STEPS = getSteps(user?.role === 'admin');

  const form = useForm<FormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      title: '',
      description: '',
      shortDescription: '',
      propertyType: '',
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 1,
      location: {
        country: '',
        province: '',
        city: '',
        suburb: '',
        address: '',
      },
      pricePerNight: undefined,
      currency: 'ZAR',
      cleaningFee: null,
      securityDeposit: null,
      amenities: [],
      images: [],
      featuredImage: null,
      coverImageIndex: 0,
      availableFrom: '',
      availableTo: '',
      minimumStay: undefined,
      maximumStay: null,
      contactEmail: '',
      contactPhone: '',
      houseRules: '',
      checkInTime: '',
      checkOutTime: '',
      cancellationPolicy: '',
      paymentDetails: {
        enabled: false,
        bankingDetails: {
          bankName: '',
          accountHolder: '',
          accountNumber: '',
          branchCode: '',
          accountType: '',
          swiftCode: '',
        },
        paymentMethods: [],
        depositRequirements: {
          bookingDeposit: null,
          damageDepositAmount: null,
          keyDepositAmount: null,
        },
        paymentTerms: {
          fullPaymentDue: '',
          depositDue: '',
          refundPolicy: '',
          lateCancellationFee: null,
          noShowFee: null,
          paymentSecuredOnly: false,
        },
        additionalFees: [],
        paymentInstructions: '',
      },
      customAmenity: '',
      status: 'active',
      isFeatured: false,
      isActive: true,
    },
    mode: 'all',
  });

  // Watch payment details enabled status
  const paymentDetailsEnabled = form.watch('paymentDetails.enabled');

  // Populate form with listing data when available
  useEffect(() => {
    if (listing) {
      // Check ownership
      if (user?.id !== listing.ownerId) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to edit this listing.',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }

      // Reset form with listing data
      form.reset({
        title: listing.title || '',
        description: listing.description || '',
        shortDescription: listing.shortDescription || '',
        propertyType: listing.propertyType || '',
        bedrooms: listing.bedrooms || 1,
        bathrooms: listing.bathrooms || 1,
        maxGuests: listing.maxGuests || 1,
        location: {
          country: listing.location?.country || '',
          province: listing.location?.province || '',
          city: listing.location?.city || '',
          suburb: listing.location?.suburb || '',
          address: listing.location?.address || '',
          streetAddress: listing.location?.streetAddress || '',
          buildingName: listing.location?.buildingName || '',
          unitNumber: listing.location?.unitNumber || '',
          postalCode: listing.location?.postalCode || '',
        },
        pricePerNight: listing.pricePerNight || undefined,
        currency: listing.currency || 'ZAR',
        cleaningFee: listing.cleaningFee || null,
        securityDeposit: listing.securityDeposit || null,
        amenities: listing.amenities || [],
        images: listing.images || [],
        featuredImage: listing.featuredImage || null,
        coverImageIndex: 0,
        availableFrom: listing.availableFrom || '',
        availableTo: listing.availableTo || '',
        minimumStay: listing.minimumStay || undefined,
        maximumStay: listing.maximumStay || null,
        contactEmail: listing.contactEmail || '',
        contactPhone: listing.contactPhone || '',
        houseRules: listing.houseRules || '',
        checkInTime: listing.checkInTime || '',
        checkOutTime: listing.checkOutTime || '',
        cancellationPolicy: listing.cancellationPolicy || '',
        paymentDetails: listing.paymentDetails || {
          enabled: false,
          bankingDetails: {
            bankName: '',
            accountHolder: '',
            accountNumber: '',
            branchCode: '',
            accountType: '',
            swiftCode: '',
          },
          paymentMethods: [],
          depositRequirements: {
            bookingDeposit: null,
            damageDepositAmount: null,
            keyDepositAmount: null,
          },
          paymentTerms: {
            fullPaymentDue: '',
            depositDue: '',
            refundPolicy: '',
            lateCancellationFee: null,
            noShowFee: null,
            paymentSecuredOnly: false,
          },
          additionalFees: [],
          paymentInstructions: '',
        },
        customAmenity: '',
        status: listing.status || 'active',
        isFeatured: listing.isFeatured || false,
        isActive: listing.status === 'active',
      });
    }
  }, [listing, user, form, router, toast]);

  // Step validation
  const validateCurrentStep = async (): Promise<boolean> => {
    const stepFields = {
      0: ['title', 'description', 'shortDescription', 'propertyType', 'bedrooms', 'bathrooms', 'maxGuests', 'location', 'currency'],
      1: ['pricePerNight', 'amenities'],
      2: ['images', 'coverImageIndex'],
      3: [],
      4: [], // Availability step
      5: [], // Payment step (admin only)
    };

    const fieldsToValidate = stepFields[currentStep as keyof typeof stepFields] || [];

    // Trigger validation for specific fields
    const result = await form.trigger(fieldsToValidate as any);

    if (!result) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the current step before proceeding.',
        variant: 'destructive',
      });
      return false;
    }

    // Additional validations
    if (currentStep === 0) {
      const location = form.getValues('location');
      if (!location.suburb || !location.city) {
        toast({
          title: 'Location Required',
          description: 'Please select a location using the search above.',
          variant: 'destructive',
        });
        return false;
      }
    }

    if (currentStep === 2) {
      const images = form.getValues('images');
      if (!images || images.length === 0) {
        toast({
          title: 'Photos Required',
          description: 'Please upload at least one photo.',
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      router.push('/listings');
    }
  };

  const handleNestedFieldUpdate = (parent: string, field: string, value: string | number | boolean) => {
    try {
      const currentValue = form.getValues(parent as string) as Record<string, any>;
      if (typeof currentValue === 'object' && currentValue !== null) {
        form.setValue(parent, {
          ...currentValue,
          [field]: value
        });
      }
    } catch (error) {
      console.error('Error updating nested field:', error);
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    const currentAmenities = form.getValues('amenities');
    form.setValue('amenities',
      currentAmenities.includes(amenityId)
        ? currentAmenities.filter(id => id !== amenityId)
        : [...currentAmenities, amenityId]
    );
  };

  const addCustomAmenity = () => {
    const customAmenity = form.getValues('customAmenity');
    if (customAmenity && typeof customAmenity === 'string' && customAmenity.trim()) {
      const currentAmenities = form.getValues('amenities');
      if (!currentAmenities.includes(customAmenity.trim())) {
        form.setValue('amenities', [...currentAmenities, customAmenity.trim()]);
        form.setValue('customAmenity', '');
      }
    }
  };

  const removeAmenity = (amenity: string) => {
    const currentAmenities = form.getValues('amenities');
    form.setValue('amenities', currentAmenities.filter(a => a !== amenity));
  };

  const handleLocationSelect = (location: any) => {
    form.setValue('location', {
      ...form.getValues('location'),
      suburb: location.suburb,
      city: location.city,
      province: location.province,
      country: location.country || 'South Africa',
      address: location.formattedAddress || `${location.suburb}, ${location.city}, ${location.province}`,
      streetAddress: location.streetAddress || form.getValues('location').streetAddress || '',
      postalCode: location.postalCode || form.getValues('location').postalCode || '',
    });
  };

  const handleImagesChange = (images: string[]) => {
    form.setValue('images', images, { shouldValidate: true, shouldDirty: true });
    form.setValue('featuredImage', images.length > 0 ? images[form.getValues('coverImageIndex')] || images[0] : null);
    form.trigger('images');
  };

  const handleCoverImageChange = (index: number) => {
    form.setValue('coverImageIndex', index, { shouldValidate: true, shouldDirty: true });
    form.setValue('featuredImage', form.getValues('images')[index] || null);
    form.trigger(['coverImageIndex', 'featuredImage']);
  };

  const onSubmit = async (data: FormValues) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update a listing',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const validation = await form.trigger();
      if (!validation) {
        toast({
          title: 'Validation Error',
          description: 'Please fix the errors in the form before submitting.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const listingData = {
        id: listingId as Id<"listings">,
        userId: user.id as Id<"users">,
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        propertyType: data.propertyType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        maxGuests: data.maxGuests,
        location: {
          province: data.location.province || 'Unknown',
          city: data.location.city || 'Unknown',
          suburb: data.location.suburb || 'Unknown',
          address: data.location.streetAddress || data.location.address || 'Unknown',
          country: data.location.country || 'South Africa',
          streetAddress: data.location.streetAddress || data.location.address || 'Unknown',
          buildingName: data.location.buildingName,
          unitNumber: data.location.unitNumber,
          postalCode: data.location.postalCode,
        },
        pricePerNight: data.pricePerNight,
        currency: data.currency,
        cleaningFee: data.cleaningFee || null,
        securityDeposit: data.securityDeposit || null,
        amenities: data.amenities,
        images: data.images,
        featuredImage: data.featuredImage,
        availableFrom: data.availableFrom || new Date().toISOString().split('T')[0],
        availableTo: data.availableTo || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        minimumStay: data.minimumStay || 1,
        maximumStay: data.maximumStay ?? 365,
        contactEmail: data.contactEmail || user?.email || '',
        contactPhone: data.contactPhone || '',
        houseRules: data.houseRules || '',
        checkInTime: data.checkInTime || '',
        checkOutTime: data.checkOutTime || '',
        cancellationPolicy: data.cancellationPolicy || 'Flexible',
        paymentDetails: data.paymentDetails,
        isFeatured: data.isFeatured || false,
        status: data.isActive ? 'active' : 'inactive',
      };

      await updateListing(listingData);

      toast({
        title: 'Success!',
        description: 'Your listing has been updated successfully.',
        variant: 'default',
      });

      router.push('/listings');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update listing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Tell us about your listing and what makes it special
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Cozy Beach House with Ocean View"
                        {...field}
                        className="text-gray-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label htmlFor="location-search">Location (Suburb) *</Label>
                <GeoapifyLocationAutocomplete
                  value={{
                    suburb: form.getValues('location.suburb'),
                    city: form.getValues('location.city'),
                    province: form.getValues('location.province'),
                    country: form.getValues('location.country'),
                  }}
                  onChange={handleLocationSelect}
                  placeholder="Search for a location in South Africa..."
                />
                {form.formState.errors.location?.suburb && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.location.suburb.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buildingName">Building Name</Label>
                  <Input
                    id="buildingName"
                    {...form.register('location.buildingName')}
                    className="text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="unitNumber">Unit Number</Label>
                  <Input
                    id="unitNumber"
                    {...form.register('location.unitNumber')}
                    className="text-gray-900"
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="location.streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 123 Main Street"
                        {...field}
                        className="text-gray-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  {...form.register('location.postalCode')}
                  className="text-gray-900"
                  placeholder="e.g., 2196"
                />
              </div>

              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief summary (visible in listings)"
                        {...field}
                        maxLength={120}
                        className="text-gray-900"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      {field.value?.length || 0}/120 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your listing in detail..."
                        {...field}
                        rows={6}
                        className="text-gray-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing Type *</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {PROPERTY_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <Button
                            key={type.value}
                            type="button"
                            variant="outline"
                            size="sm"
                            className={`h-auto p-3 flex flex-col items-center bg-white border-2 transition-all duration-200 ${
                              field.value === type.value
                                ? 'border-green-600 bg-green-600 text-white'
                                : 'border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-600'
                            }`}
                            onClick={() => {
                              field.onChange(type.value);
                            }}
                          >
                            <Icon className={`h-4 w-4 mb-1 ${field.value === type.value ? 'text-white' : 'text-gray-500'}`} />
                            <span className="text-xs text-center">{type.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Bed className="h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            className="text-gray-900"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Bath className="h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            className="text-gray-900"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Guests</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            className="text-gray-900"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Banknote className="h-5 w-5 mr-2" />
                Pricing & Amenities
              </CardTitle>
              <CardDescription>
                Set your pricing and highlight what your listing offers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="pricePerNight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Night (R) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Enter price per night"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimumStay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stay (Nights)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Minimum nights"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maximumStay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Stay (Nights)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {COMMON_AMENITIES.map((amenity) => {
                    const Icon = amenity.icon;
                    const amenities = form.watch('amenities');
                    return (
                      <Button
                        key={amenity.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-auto p-3 flex flex-col items-center bg-white border-2 transition-all duration-200 ${
                          amenities.includes(amenity.id)
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-600'
                        }`}
                        onClick={() => {
                          const currentAmenities = form.getValues('amenities');
                          const newAmenities = currentAmenities.includes(amenity.id)
                            ? currentAmenities.filter(id => id !== amenity.id)
                            : [...currentAmenities, amenity.id];
                          form.setValue('amenities', newAmenities, { shouldValidate: true });
                        }}
                      >
                        <Icon className={`h-4 w-4 mb-1 ${amenities.includes(amenity.id) ? 'text-white' : 'text-gray-500'}`} />
                        <span className="text-xs text-center">{amenity.label}</span>
                      </Button>
                    );
                  })}
                </div>

                {/* Custom amenities */}
                <div className="mt-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add custom amenity..."
                      {...form.register('customAmenity')}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                      className="text-gray-900"
                    />
                    <Button type="button" onClick={addCustomAmenity} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Display selected amenities */}
                {form.getValues('amenities').length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.getValues('amenities').map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                        {COMMON_AMENITIES.find(a => a.id === amenity)?.label || amenity}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeAmenity(amenity)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Featured and Active Toggles */}
              <div className={`grid gap-6 mt-6 ${user?.role === 'admin' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                {/* Featured Listing - Admin Only */}
                {user?.role === 'admin' && (
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured Listing</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Mark this listing as featured to highlight it to visitors
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Listing</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable or disable this listing for public viewing
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Listing Photos
              </CardTitle>
              <CardDescription>
                Upload high-quality photos to showcase your listing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <MultiMediaPicker
                      value={field.value}
                      onChange={(images) => {
                        field.onChange(images);
                        handleImagesChange(images);
                      }}
                      coverImageIndex={form.watch('coverImageIndex')}
                      onCoverImageChange={handleCoverImageChange}
                      maxImages={20}
                      label="Listing Photos *"
                      required
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-sm text-gray-500 mt-2">
                Upload up to 20 photos. You can drag to reorder and click the crown icon to set any image as the cover photo.
              </p>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Booking Policies
              </CardTitle>
              <CardDescription>
                Set your check-in/out times, and house rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkInTime">Check-in Time</Label>
                  <Input
                    id="checkInTime"
                    type="time"
                    {...form.register('checkInTime')}
                    className="text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="checkOutTime">Check-out Time</Label>
                  <Input
                    id="checkOutTime"
                    type="time"
                    {...form.register('checkOutTime')}
                    className="text-gray-900"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                          className="text-gray-900"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+27 11 123 4567"
                          {...field}
                          className="text-gray-900"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="houseRules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House Rules</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., No smoking, No pets, Quiet hours 10pm-7am"
                        {...field}
                        rows={4}
                        className="text-gray-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cancellationPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cancellation Policy</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cancellation policy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Strict">Strict - No refunds</SelectItem>
                          <SelectItem value="Moderate">Moderate - 50% refund up to 7 days</SelectItem>
                          <SelectItem value="Flexible">Flexible - Full refund up to 24 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon2 className="h-5 w-5 mr-2" />
                Manage Availability
              </CardTitle>
              <CardDescription>
                Manage your listing's availability calendar. Set specific dates as available, booked, or blocked.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <CalendarIcon2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-base font-semibold text-blue-900">Availability Calendar Management</p>
                    <p className="text-sm text-blue-700 mt-2">
                      Manage your listing's availability to control when guests can book. You can set specific dates as:
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                      <li><strong>Available</strong> - Guests can book these dates</li>
                      <li><strong>Booked</strong> - Dates with confirmed bookings</li>
                      <li><strong>Blocked</strong> - Prevent bookings (maintenance, personal use, etc.)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/listings/${listingId}/availability`}
                  className="flex-1"
                >
                  <Button className="w-full" size="lg" type="button">
                    <CalendarIcon2 className="h-4 w-4 mr-2" />
                    Open Availability Calendar
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-900">Available</p>
                  </div>
                  <p className="text-xs text-emerald-700">Guests can book these dates</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-semibold text-red-900">Booked</p>
                  </div>
                  <p className="text-xs text-red-700">Dates with confirmed bookings</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-900">Blocked</p>
                  </div>
                  <p className="text-xs text-slate-700">Prevent bookings on these dates</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Quick Tips</p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>• Click on dates to select them</li>
                      <li>• Select multiple dates at once for bulk updates</li>
                      <li>• Add notes to dates (e.g., "Reserved for John")</li>
                      <li>• Past dates cannot be modified</li>
                      <li>• View 2 months at a time for easy planning</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Configure payment details for this listing. These details will be sent to guests when bookings are confirmed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Payment Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg border gap-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Custom Payment Details</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, guests will receive these payment details instead of the site defaults
                  </p>
                </div>
                <Switch
                  checked={paymentDetailsEnabled}
                  onCheckedChange={(checked) => handleNestedFieldUpdate('paymentDetails', 'enabled', checked)}
                />
              </div>

              {/* Warning Message */}
              {paymentDetailsEnabled && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Important Notice</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Listing payment details will override the site defaults and will be sent to guests when bookings are confirmed. Make sure all banking information is accurate.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details Form - Only show when enabled */}
              {paymentDetailsEnabled && (
                <>
                  {/* Bank Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Banking Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paymentDetails.bankingDetails.bankName">Bank Name *</Label>
                        <Input
                          id="paymentDetails.bankingDetails.bankName"
                          placeholder="e.g., Standard Bank"
                          value={form.getValues('paymentDetails.bankingDetails.bankName') || ''}
                          onChange={(e) => handleNestedFieldUpdate('paymentDetails.bankingDetails', 'bankName', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentDetails.bankingDetails.accountHolder">Account Holder *</Label>
                        <Input
                          id="paymentDetails.bankingDetails.accountHolder"
                          placeholder="Account holder name"
                          value={form.getValues('paymentDetails.bankingDetails.accountHolder') || ''}
                          onChange={(e) => handleNestedFieldUpdate('paymentDetails.bankingDetails', 'accountHolder', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentDetails.bankingDetails.accountNumber">Account Number *</Label>
                        <Input
                          id="paymentDetails.bankingDetails.accountNumber"
                          placeholder="1234567890"
                          value={form.getValues('paymentDetails.bankingDetails.accountNumber') || ''}
                          onChange={(e) => handleNestedFieldUpdate('paymentDetails.bankingDetails', 'accountNumber', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentDetails.bankingDetails.branchCode">Branch Code *</Label>
                        <Input
                          id="paymentDetails.bankingDetails.branchCode"
                          placeholder="e.g., 051001"
                          value={form.getValues('paymentDetails.bankingDetails.branchCode') || ''}
                          onChange={(e) => handleNestedFieldUpdate('paymentDetails.bankingDetails', 'branchCode', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentDetails.bankingDetails.accountType">Account Type</Label>
                        <select
                          id="paymentDetails.bankingDetails.accountType"
                          value={form.getValues('paymentDetails.bankingDetails.accountType') || 'current'}
                          onChange={(e) => handleNestedFieldUpdate('paymentDetails.bankingDetails', 'accountType', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="current">Current Account</option>
                          <option value="savings">Savings Account</option>
                          <option value="business">Business Account</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentDetails.bankingDetails.swiftCode">SWIFT Code (International)</Label>
                        <Input
                          id="paymentDetails.bankingDetails.swiftCode"
                          placeholder="e.g., SBZAZAJJ"
                          value={form.getValues('paymentDetails.bankingDetails.swiftCode') || ''}
                          onChange={(e) => handleNestedFieldUpdate('paymentDetails.bankingDetails', 'swiftCode', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentDetails.paymentReference">Payment Reference Format</Label>
                    <Input
                      id="paymentDetails.paymentReference"
                      placeholder="Booking Reference: [BOOKING_CODE]"
                      value={form.getValues('paymentDetails.paymentReference') || ''}
                      onChange={(e) => handleNestedFieldUpdate('paymentDetails', 'paymentReference', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Use [BOOKING_CODE] as a placeholder that will be replaced with the actual booking code
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentDetails.paymentInstructions">Additional Payment Instructions</Label>
                    <Textarea
                      id="paymentDetails.paymentInstructions"
                      placeholder="Please use your booking code as the payment reference and send proof of payment..."
                      value={form.getValues('paymentDetails.paymentInstructions') || ''}
                      onChange={(e) => handleNestedFieldUpdate('paymentDetails', 'paymentInstructions', e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-gray-500">
                      These instructions will be included in booking confirmation emails sent to guests
                    </p>
                  </div>
                </>
              )}

              {!paymentDetailsEnabled && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Using Site Default Payment Details</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Guests will receive the payment details configured in site settings. Enable custom payment details above to override this.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (listing === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (listing === null) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Listing not found.</p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Edit Listing</h1>
        <p className="text-gray-600">
          Update your listing information.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Progress Steps */}
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step.id} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center flex-shrink-0 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          if (index < currentStep) {
                            setCurrentStep(index);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={cn(
                          "w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-200 mx-auto",
                          isCompleted && "bg-green-600 text-white cursor-pointer hover:bg-green-700",
                          isCurrent && "bg-green-600 text-white ring-4 ring-green-100",
                          !isCompleted && !isCurrent && "bg-gray-200 text-gray-500"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                        ) : (
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                        )}
                      </button>
                      <div className="hidden sm:flex mt-2 text-center">
                        <p className={cn(
                          "text-[10px] sm:text-xs font-medium whitespace-nowrap",
                          isCurrent ? "text-green-600" : isCompleted ? "text-gray-900" : "text-gray-500"
                        )}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        "flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 md:mx-4 rounded transition-all duration-200 min-w-[8px] sm:min-w-[16px]",
                        index < currentStep ? "bg-green-600" : "bg-gray-200"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Mobile step numbers */}
            <div className="flex justify-between mt-2 sm:hidden px-1">
              {STEPS.map((step, index) => (
                <p key={step.id} className={cn(
                  "text-[10px] font-medium text-center",
                  index === currentStep ? "text-green-600" : index < currentStep ? "text-gray-900" : "text-gray-400"
                )}>
                  {index + 1}
                </p>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 p-4 bg-white rounded-lg border">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className="flex-1 sm:flex-none text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Updating...' : 'Update Listing'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
