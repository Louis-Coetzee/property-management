'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Edit2, 
  Trash2,
  Loader2,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  X,
  Truck,
  FileText,
  CreditCard,
  AlertCircle,
  Check
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import router from 'next/router';

interface OrderItem {
  _id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  productPrice: number;
  quantity: number;
  total: number;
  createdAt: number;
}

interface Order {
  _id: string;
  companyId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  shippingCountry?: string;
  shippingMethodName?: string;
  shippingPrice?: number;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod?: string;
  paymentStatus: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  items?: OrderItem[];
  bobgoOrderId?: number;
  bobgoShipmentId?: number;
  bobgoRateId?: number;
  waybillUrl?: string;
  shippingCost?: number;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
];

export default function OrdersPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingName: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: '',
    notes: '',
    status: '',
    paymentStatus: '',
  });

  const orders = useQuery(
    api.orders.getOrdersByCompanyInternal,
    companyId ? { companyId } : 'skip'
  );

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

  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(500);
  const [selectedPayment, setSelectedPayment] = useState<'payfast' | 'paypal' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const payfastEnabled = (adminSettings?.payfast?.enabled) ?? false;
  const paypalEnabled = (adminSettings?.paypal?.enabled) ?? false;
  const payfastTestMode = (adminSettings?.payfast?.testMode) ?? true;
  const paypalTestMode = (adminSettings?.paypal?.testMode) ?? true;

  const quickAmounts = [100, 250, 500, 1000, 2500];

  const handlePayFastPayment = async () => {
    if (!user?.id || !creditAmount || creditAmount < 50 || !company?._id) return;
    
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/payfast/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company._id,
          amount: creditAmount,
          userId: user.id,
        }),
      });

const data = await response.json();
       
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
    
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/paypal/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company._id,
          amount: creditAmount,
          currency: company?.currency?.code || 'ZAR',
        }),
      });

      const data = await response.json();
      
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

  const updateOrder = useMutation(api.orders.updateOrder);
  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);
  const updatePaymentStatus = useMutation(api.orders.updatePaymentStatus);
  const deleteOrder = useMutation(api.orders.deleteOrder);
  const addCreditPaymentMutation = useMutation(api.companies.createCreditPayment);

  const formatPrice = (price: number) => {
    const currencySymbol = company?.currency?.symbol || 'R';
    const currencyCode = company?.currency?.code || 'USD';
    const position = company?.currency?.symbolPosition || 'before';
    
    if (position === 'after') {
      return `${price.toFixed(2)}${currencySymbol}`;
    }
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option ? (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
        {option.label}
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const option = PAYMENT_STATUS_OPTIONS.find(o => o.value === paymentStatus);
    return option ? (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
        {option.label}
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {paymentStatus}
      </span>
    );
  };

  const openEditModal = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone || '',
      shippingName: order.shippingName || '',
      shippingAddress: order.shippingAddress || '',
      shippingCity: order.shippingCity || '',
      shippingState: order.shippingState || '',
      shippingZipCode: order.shippingZipCode || '',
      shippingCountry: order.shippingCountry || '',
      notes: order.notes || '',
      status: order.status,
      paymentStatus: order.paymentStatus,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const openViewModal = (order: Order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleEditOrder = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);

    try {
      await updateOrder({
        orderId: selectedOrder._id as Id<'orders'>,
        customerName: editForm.customerName,
        customerEmail: editForm.customerEmail,
        customerPhone: editForm.customerPhone || undefined,
        shippingName: editForm.shippingName || undefined,
        shippingAddress: editForm.shippingAddress || undefined,
        shippingCity: editForm.shippingCity || undefined,
        shippingState: editForm.shippingState || undefined,
        shippingZipCode: editForm.shippingZipCode || undefined,
        shippingCountry: editForm.shippingCountry || undefined,
        notes: editForm.notes || undefined,
      });

      if (editForm.status !== selectedOrder.status) {
        await updateOrderStatus({
          userId: user?.id as Id<'users'>,
          orderId: selectedOrder._id as Id<'orders'>,
          status: editForm.status,
        });
      }

      if (editForm.paymentStatus !== selectedOrder.paymentStatus) {
        await updatePaymentStatus({
          userId: user?.id as Id<'users'>,
          orderId: selectedOrder._id as Id<'orders'>,
          paymentStatus: editForm.paymentStatus,
        });
      }

      setShowEditModal(false);
      setSelectedOrder(null);
      toast.success('Order updated successfully!');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);

    try {
      await deleteOrder({
        orderId: selectedOrder._id as Id<'orders'>,
      });

      setShowDeleteModal(false);
      setSelectedOrder(null);
      toast.success('Order deleted successfully!');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessShipping = async () => {
    if (!selectedOrder) return;
    
    const shippingCost = selectedOrder.shippingCost || selectedOrder.shippingPrice || 0;
    const currentCredit = companyCredit?.balance || 0;
    
    if (currentCredit < shippingCost) {
      toast.error(`Insufficient credit. You need ${formatPrice(shippingCost)} but have ${formatPrice(currentCredit)}`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Call API to process shipping via BobGo
      const response = await fetch('/api/bobgo/process-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          orderNumber: selectedOrder.orderNumber,
          shippingAddress: selectedOrder.shippingAddress || '',
          shippingCity: selectedOrder.shippingCity || '',
          shippingState: selectedOrder.shippingState || '',
          shippingZipCode: selectedOrder.shippingZipCode || '',
          shippingCountry: selectedOrder.shippingCountry || 'South Africa',
          customerName: selectedOrder.customerName,
          customerEmail: selectedOrder.customerEmail,
          customerPhone: selectedOrder.customerPhone || '+27812345678',
          companyId: companyId,
          deductCredit: true,
          creditAmount: shippingCost,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Shipping processed successfully!');
        // Update order status
        await updateOrderStatus({
          userId: user?.id as any,
          orderId: selectedOrder._id as any,
          status: 'shipped',
        });
        setShowShippingModal(false);
      } else {
        toast.error(data.error || 'Failed to process shipping');
      }
    } catch (error) {
      console.error('Error processing shipping:', error);
      toast.error('Failed to process shipping');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openShippingModal = (order: Order) => {
    setSelectedOrder(order);
    setShowShippingModal(true);
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
              <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-500">Manage customer orders</p>
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
            <div className="text-sm text-gray-500">
              {orders?.length || 0} order{orders?.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {orders === undefined ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <ShoppingCart className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-500">Orders will appear here when customers make purchases</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openViewModal(order)}
                          className="font-medium text-violet-600 hover:text-violet-800"
                        >
                          {order.orderNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getPaymentBadge(order.paymentStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{formatPrice(order.total)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Download Waybill - show for orders that have been shipped with waybill */}
                          {order.waybillUrl && (
                            <a
                              href={order.waybillUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download Waybill"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          )}
                          {/* Only show shipping button if order has shipping info and status is not shipped */}
                          {order.shippingAddress && order.status !== 'shipped' && (
                            <button
                              onClick={() => openShippingModal(order)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                              title="Process Shipping"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openViewModal(order)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(order)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(order)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 pb-10">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-semibold">Order Details</h3>
                <p className="text-sm text-gray-500">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Status & Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Order Status</label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Payment Status</label>
                  <div className="mt-1">{getPaymentBadge(selectedOrder.paymentStatus)}</div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                  <User className="h-3 w-3" /> Customer Information
                </label>
                <div className="mt-2 bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-3 w-3" />
                    {selectedOrder.customerEmail}
                  </div>
                  {selectedOrder.customerPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      {selectedOrder.customerPhone}
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Info */}
              {selectedOrder.shippingAddress && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Shipping Address
                  </label>
                  <div className="mt-2 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedOrder.shippingName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.shippingAddress}</p>
                    <p className="text-sm text-gray-600">
                      {[selectedOrder.shippingCity, selectedOrder.shippingState, selectedOrder.shippingZipCode].filter(Boolean).join(', ')}
                    </p>
                    {selectedOrder.shippingCountry && (
                      <p className="text-sm text-gray-600">{selectedOrder.shippingCountry}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Order Items</label>
                  <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Product</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Price</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Qty</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item) => (
                          <tr key={item._id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatPrice(item.productPrice)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatPrice(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Tax</span>
                  <span>{formatPrice(selectedOrder.taxAmount)}</span>
                </div>
                {selectedOrder.shippingPrice !== undefined && selectedOrder.shippingPrice > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Shipping</span>
                    <span>{formatPrice(selectedOrder.shippingPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Notes</label>
                  <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedOrder.notes}</p>
                </div>
)}
            </div>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showAddCreditsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isProcessingPayment && setShowAddCreditsModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            {isProcessingPayment ? (
              <div className="p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Redirecting to Payment</h3>
                <p className="text-gray-600">Please wait while we redirect you to the payment gateway...</p>
              </div>
            ) : (
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
                    disabled={!selectedPayment || creditAmount < 50}
                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Add {formatPrice(creditAmount)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Shipping Modal */}
      {showShippingModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowShippingModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Process Shipping</h3>
                <button
                  onClick={() => setShowShippingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">Order #{selectedOrder.orderNumber}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customerName}</p>
                {selectedOrder.shippingAddress && (
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedOrder.shippingAddress}, {selectedOrder.shippingCity}, {selectedOrder.shippingZipCode}
                  </p>
                )}
                {selectedOrder.shippingMethodName && (
                  <p className="text-sm text-gray-500 mt-1">Method: {selectedOrder.shippingMethodName}</p>
                )}
              </div>

              {/* Shipping Cost */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Shipping Cost:</span>
                  <span className="text-lg font-bold text-emerald-900">
                    {formatPrice(selectedOrder.shippingCost ?? selectedOrder.shippingPrice ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-emerald-700">Current Balance:</span>
                  <span className="text-lg font-bold text-emerald-900">
                    {formatPrice(companyCredit?.balance || 0)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowShippingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessShipping}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4" />
                      Process Shipping
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