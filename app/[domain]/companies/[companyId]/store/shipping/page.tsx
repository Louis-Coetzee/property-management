'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { 
  Package, 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2,
  Truck,
  Clock,
  Check,
  X,
  Loader2,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { GeoapifyLocationAutocomplete } from '@/components/ui/geoapify-location-autocomplete';
import router from 'next/router';

type ShippingFormData = {
  name: string;
  description?: string;
  price: number;
  estimatedDays?: string;
  isFree: boolean;
  freeShippingThreshold?: number;
  shippingType?: string;
  bobgoServiceCode?: string;
  pickupAddress?: string;
  pickupPostalCode?: string;
  pickupCity?: string;
  pickupProvince?: string;
  pickupCountry?: string;
};

interface ShippingOption {
  _id: string;
  companyId: string;
  name: string;
  description?: string;
  price: number;
  estimatedDays?: string;
  isFree: boolean;
  freeShippingThreshold?: number;
  isActive: boolean;
  sortOrder?: number;
  // BobGo shipping
  shippingType?: string;
  bobgoServiceCode?: string;
  pickupAddress?: string;
  pickupPostalCode?: string;
  pickupCity?: string;
  pickupProvince?: string;
  pickupCountry?: string;
  createdAt: number;
  updatedAt: number;
}

export default function ShippingPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [pickupLocation, setPickupLocation] = useState<{
    address: string;
    suburb: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
  } | null>(null);

  const handlePickupLocationChange = (location: {
    address: string;
    suburb: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
  }) => {
    setPickupLocation(location);
    setValue('pickupAddress', location.address || '');
    setValue('pickupCity', location.city || '');
    setValue('pickupProvince', location.province || '');
    setValue('pickupPostalCode', location.postalCode || '');
    setValue('pickupCountry', location.country || 'South Africa');
  };

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      estimatedDays: '',
      isFree: false,
      freeShippingThreshold: undefined,
      shippingType: 'manual',
      bobgoServiceCode: '',
      pickupAddress: '',
      pickupPostalCode: '',
      pickupCity: '',
      pickupProvince: '',
      pickupCountry: '',
    }
  });

  const shippingType = watch('shippingType');
  const isFree = watch('isFree');

  const createShippingMutation = useMutation(api.shipping.create);
  const updateShippingMutation = useMutation(api.shipping.update);
  const deleteShippingMutation = useMutation(api.shipping.remove);
  const addCreditPaymentMutation = useMutation(api.companies.createCreditPayment);

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id && companyId ? { userId: user.id as Id<"users">, companyId: companyId as Id<"companies"> } : 'skip'
  );

  const companyCredit = useQuery(
    api.companies.getCompanyCredit,
    company?._id ? { companyId: company._id } : 'skip'
  );

  const adminSettings = useQuery(
    api.adminSettings.getMyAdminSettings,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const [creditAmount, setCreditAmount] = useState<number>(500);
  const [selectedPayment, setSelectedPayment] = useState<'payfast' | 'paypal' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const payfastEnabled = (adminSettings?.payfast?.enabled) ?? false;
  const paypalEnabled = (adminSettings?.paypal?.enabled) ?? false;
  const payfastTestMode = (adminSettings?.payfast?.testMode) ?? true;
  const paypalTestMode = (adminSettings?.paypal?.testMode) ?? true;

const handlePayFastPayment = async () => {
    if (!user?.id || !creditAmount || creditAmount < 50 || !company?._id) return;
    
    console.log('Initiating PayFast payment:', { companyId: company._id, type: typeof company._id });
    
    setIsProcessingPayment(true);
    try {
      console.log('Sending request to /api/payfast/add-credits');
      
      const response = await fetch('/api/payfast/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company._id,
          amount: creditAmount,
          userId: user.id,
        }),
      });

      console.log('PayFast response status:', response.status);
      const data = await response.json();
      console.log('PayFast response data:', data);
      
      if (data.formHtml) {
        // Create payment record first for tracking
        try {
          await addCreditPaymentMutation({
            companyId: company._id,
            amount: creditAmount,
            paymentMethod: 'payfast',
            reference: data.transactionId,
          });
        } catch (e) {
          console.error('Failed to create payment record:', e);
        }
        
        const form = document.createElement('div');
        form.innerHTML = data.formHtml;
        document.body.appendChild(form);
        (form.querySelector('form') as HTMLFormElement).submit();
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error initiating PayFast payment:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!user?.id || !creditAmount || creditAmount < 50 || !company?._id) return;
    
    console.log('Initiating PayPal payment:', { companyId: company._id, type: typeof company._id });
    
    setIsProcessingPayment(true);
    try {
      console.log('Sending request to /api/paypal/add-credits');
      
      const response = await fetch('/api/paypal/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company._id,
          amount: creditAmount,
          currency: company?.currency?.code || 'ZAR',
        }),
      });

      console.log('PayPal response status:', response.status);
      const data = await response.json();
      console.log('PayPal response data:', data);
      
      if (data.approvalUrl) {
        // Create payment record first for tracking
        try {
          await addCreditPaymentMutation({
            companyId: company._id,
            amount: creditAmount,
            paymentMethod: 'paypal',
            reference: data.orderId,
          });
        } catch (e) {
          console.error('Failed to create payment record:', e);
        }
        
        window.location.href = data.approvalUrl;
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error initiating PayPal payment:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const quickAmounts = [100, 250, 500, 1000, 2500];

  const shippingOptions = useQuery(
    api.shipping.listByCompany,
    user?.id ? { userId: user.id as Id<'users'>, companyId: companyId as Id<'companies'> } : 'skip'
  );

  const handleAddShipping = async (data: ShippingFormData) => {
    if (!user?.id) return;
    setIsSubmitting(true);

    try {
      await createShippingMutation({
        userId: user.id as Id<'users'>,
        companyId: companyId as Id<'companies'>,
        name: data.name,
        description: data.description,
        price: data.price,
        estimatedDays: data.estimatedDays,
        isFree: data.isFree,
        freeShippingThreshold: data.freeShippingThreshold,
        shippingType: data.shippingType,
        bobgoServiceCode: data.bobgoServiceCode,
        pickupAddress: data.pickupAddress,
        pickupPostalCode: data.pickupPostalCode,
        pickupCity: data.pickupCity,
        pickupProvince: data.pickupProvince,
        pickupCountry: data.pickupCountry,
      });

      setShowAddModal(false);
      reset();
      toast.success('Shipping option added successfully!');
    } catch (error) {
      console.error('Error adding shipping:', error);
      toast.error('Failed to add shipping option');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditShipping = async (data: ShippingFormData) => {
    if (!user?.id || !selectedShipping) return;
    setIsSubmitting(true);

    try {
      await updateShippingMutation({
        userId: user.id as Id<'users'>,
        shippingId: selectedShipping._id as Id<'shippingOptions'>,
        name: data.name,
        description: data.description,
        price: data.price,
        estimatedDays: data.estimatedDays,
        isFree: data.isFree,
        freeShippingThreshold: data.freeShippingThreshold,
        shippingType: data.shippingType,
        bobgoServiceCode: data.bobgoServiceCode,
        pickupAddress: data.pickupAddress,
        pickupPostalCode: data.pickupPostalCode,
        pickupCity: data.pickupCity,
        pickupProvince: data.pickupProvince,
        pickupCountry: data.pickupCountry,
      });

      setShowEditModal(false);
      setSelectedShipping(null);
      reset();
      toast.success('Shipping option updated successfully!');
    } catch (error) {
      console.error('Error updating shipping:', error);
      toast.error('Failed to update shipping option');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShipping = async () => {
    if (!user?.id || !selectedShipping) return;
    setIsSubmitting(true);

    try {
      await deleteShippingMutation({
        userId: user.id as Id<'users'>,
        shippingId: selectedShipping._id as Id<'shippingOptions'>,
      });

      setShowDeleteModal(false);
      setSelectedShipping(null);
      toast.success('Shipping option deleted successfully!');
    } catch (error) {
      console.error('Error deleting shipping:', error);
      toast.error('Failed to delete shipping option');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (shipping: ShippingOption) => {
    setSelectedShipping(shipping);
    reset(shipping as any);
    
    if (shipping.shippingType === 'bobgo' && shipping.pickupAddress) {
      setPickupLocation({
        address: shipping.pickupAddress || '',
        suburb: '',
        city: shipping.pickupCity || '',
        province: shipping.pickupProvince || '',
        country: shipping.pickupCountry || 'South Africa',
        postalCode: shipping.pickupPostalCode || '',
      });
    } else {
      setPickupLocation(null);
    }
    
    setShowEditModal(true);
  };

  const openDeleteModal = (shipping: ShippingOption) => {
    setSelectedShipping(shipping);
    setShowDeleteModal(true);
  };

  const formatPrice = (price: number) => {
    const currencySymbol = company?.currency?.symbol || 'R';
    const currencyCode = company?.currency?.code || 'USD';
    const position = company?.currency?.symbolPosition || 'before';
    
    if (position === 'after') {
      return `${price.toFixed(2)}${currencySymbol}`;
    }
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/${params.domain}/companies/${companyId}/manage`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Shipping Options</h1>
              <p className="text-sm text-gray-500">Manage your shipping methods</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Credit Display */}
            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-emerald-600 font-medium">Available Credit</p>
                <p className="text-sm font-semibold text-emerald-900">
                  {formatPrice(companyCredit?.balance || 0)}
                </p>
              </div>
              <button
                onClick={() => setShowAddCreditsModal(true)}
                className="ml-2 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
              >
                Add Credits
              </button>
            </div>
            <button
              onClick={() => {
                reset({
                  name: '',
                  description: '',
                  price: 0,
                  estimatedDays: '',
                  isFree: false,
                  freeShippingThreshold: undefined,
                  shippingType: 'manual',
                  bobgoServiceCode: '',
                  pickupAddress: '',
                  pickupPostalCode: '',
                  pickupCity: '',
                  pickupProvince: '',
                  pickupCountry: '',
                });
                setPickupLocation(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Shipping
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {shippingOptions === undefined ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : shippingOptions.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <Truck className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Shipping Options</h2>
            <p className="text-gray-500 mb-6">Add shipping options to offer delivery to your customers</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Shipping Option
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shippingOptions.map((shipping) => (
              <div
                key={shipping._id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <Truck className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{shipping.name}</h3>
                      {shipping.estimatedDays && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {shipping.estimatedDays}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(shipping)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(shipping)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {shipping.description && (
                  <p className="text-sm text-gray-600 mb-4">{shipping.description}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    {shipping.isFree ? (
                      <span className="text-lg font-bold text-emerald-600">Free</span>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(shipping.price)}
                      </span>
                    )}
                  </div>
                  {shipping.freeShippingThreshold && (
                    <span className="text-xs text-gray-500">
                      Free over {formatPrice(shipping.freeShippingThreshold)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 pb-10">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold">Add Shipping Option</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleAddShipping)} className="p-5 space-y-4 pb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g., Standard Shipping"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Optional description"
                />
              </div>

              {/* BobGo Shipping Toggle */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 font-bold">B</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">BobGo Shipping</h4>
                      <p className="text-xs text-gray-500">Calculate shipping rates dynamically</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue('shippingType', shippingType === 'bobgo' ? 'manual' : 'bobgo')}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      shippingType === 'bobgo' ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        shippingType === 'bobgo' ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                <input type="hidden" {...register('shippingType')} value={shippingType} />

                {/* Show pickup fields when BobGo is enabled */}
                {shippingType === 'bobgo' && (
                  <div className="mt-4 pt-4 border-t border-orange-200 space-y-3">
                    <p className="text-xs text-orange-700 font-medium">
                      Pickup Location (required for BobGo rates)
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Search Address</label>
                      <GeoapifyLocationAutocomplete
                        value={pickupLocation || undefined}
                        onChange={handlePickupLocationChange}
                        placeholder="Search for pickup address in South Africa..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">BobGo Service Code</label>
                      <input
                        {...register('bobgoServiceCode')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        placeholder="e.g., ECONOMY, EXPRESS"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Delivery Time
                </label>
                <input
                  {...register('estimatedDays')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g., 3-5 business days"
                />
              </div>

              {shippingType !== 'bobgo' && (
                <>
                  <div className="flex items-center gap-3">
                    <input
                      {...register('isFree')}
                      type="checkbox"
                      id="isFreeAdd"
                      onChange={(e) => setValue('isFree', e.target.checked)}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <label htmlFor="isFreeAdd" className="text-sm text-gray-700">
                      Free shipping
                    </label>
                  </div>

                  {!isFree && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <div className="relative">
                        <input
                          {...register('price', { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="0.00"
                        />
                      </div>
                      {errors.price && (
                        <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Free Shipping Threshold
                </label>
                <div className="relative">
                  <input
                    {...register('freeShippingThreshold', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Optional minimum order amount"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Shipping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedShipping && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 pb-10">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold">Edit Shipping Option</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleEditShipping)} className="p-5 space-y-4 pb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Delivery Time
                </label>
                <input
                  {...register('estimatedDays')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {shippingType !== 'bobgo' && (
                <>
                  <div className="flex items-center gap-3">
                    <input
                      {...register('isFree')}
                      type="checkbox"
                      id="isFreeEdit"
                      onChange={(e) => setValue('isFree', e.target.checked)}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <label htmlFor="isFreeEdit" className="text-sm text-gray-700">
                      Free shipping
                    </label>
                  </div>

                  {!isFree && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <div className="relative">
                  <input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="0.00"
                  />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Free Shipping Threshold
                </label>
                <div className="relative">
                  <input
                    {...register('freeShippingThreshold', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* BobGo Shipping Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Use BobGo Dynamic Shipping
                  </label>
                  <p className="text-xs text-gray-500">Enable real-time shipping rate calculation</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('shippingType', shippingType === 'bobgo' ? 'manual' : 'bobgo')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    shippingType === 'bobgo' ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      shippingType === 'bobgo' ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <input type="hidden" {...register('shippingType')} value={shippingType} />

              {/* Show pickup fields when BobGo is enabled in edit */}
              {shippingType === 'bobgo' && (
                <div className="mt-4 pt-4 border-t border-orange-200 space-y-3">
                  <p className="text-xs text-orange-700 font-medium">
                    Pickup Location (required for BobGo rates)
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Search Address</label>
                    <GeoapifyLocationAutocomplete
                      value={pickupLocation || undefined}
                      onChange={handlePickupLocationChange}
                      placeholder="Search for pickup address in South Africa..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">BobGo Service Code</label>
                    <input
                      {...register('bobgoServiceCode')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      placeholder="e.g., ECONOMY, EXPRESS"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedShipping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Shipping Option
              </h3>
              <p className="text-gray-600">
                Are you sure you want to delete "{selectedShipping.name}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteShipping}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showAddCreditsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddCreditsModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Credits</h3>
                <button
                  onClick={() => setShowAddCreditsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Current Balance */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm text-emerald-700">Current Balance:</span>
                  <span className="text-lg font-bold text-emerald-900">{formatPrice(companyCredit?.balance || 0)}</span>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Amount</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setCreditAmount(amount)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        creditAmount === amount
                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {formatPrice(amount)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {company?.currency?.symbol || 'R'}
                  </span>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    min="50"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Custom amount"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                {!payfastEnabled && !paypalEnabled ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">No payment methods available</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payfastEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedPayment('payfast')}
                        className={`w-full p-3 border-2 rounded-lg flex items-center justify-between transition-colors ${
                          selectedPayment === 'payfast'
                            ? 'border-violet-600 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">PF</span>
                          </div>
                          <span className="font-medium text-gray-900">PayFast</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${payfastTestMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {payfastTestMode ? 'Test' : 'Live'}
                          </span>
                          {selectedPayment === 'payfast' && <Check className="h-4 w-4 text-violet-600" />}
                        </div>
                      </button>
                    )}
                    {paypalEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedPayment('paypal')}
                        className={`w-full p-3 border-2 rounded-lg flex items-center justify-between transition-colors ${
                          selectedPayment === 'paypal'
                            ? 'border-violet-600 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">PP</span>
                          </div>
                          <span className="font-medium text-gray-900">PayPal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${paypalTestMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {paypalTestMode ? 'Test' : 'Live'}
                          </span>
                          {selectedPayment === 'paypal' && <Check className="h-4 w-4 text-violet-600" />}
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to add:</span>
                  <span className="text-xl font-bold text-gray-900">{formatPrice(creditAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddCreditsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedPayment === 'payfast') {
                      handlePayFastPayment();
                    } else if (selectedPayment === 'paypal') {
                      handlePayPalPayment();
                    } else {
                      toast.error('Please select a payment method');
                    }
                  }}
                  disabled={!selectedPayment || creditAmount < 50 || isProcessingPayment}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Add {formatPrice(creditAmount)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
