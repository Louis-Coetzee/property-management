'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthGuard } from '../../../../AuthProvider';
import {
  Calendar,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Clock,
  User,
  Mail,
  Phone,
  DollarSign,
  Check,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  companyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration?: number;
  consultantName?: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  paymentStatus: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

interface Service {
  _id: string;
  name: string;
  price: number;
  duration?: number;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  no_show: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'No Show' },
};

const paymentStatusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Paid' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
  refunded: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Refunded' },
};

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

const paymentStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

export default function AppointmentsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Client autocomplete
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Multi-step form
  const [formStep, setFormStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  // Get consultants
  const consultants = useQuery(
    api.consultants.listByCompany,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const getAvailableTimes = (consultantId: string, date: string) => {
    const consultant = consultants?.find((c) => c._id === consultantId) as any;
    
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const dayAvailability = consultant?.availability?.[dayOfWeek];
    
    if (!dayAvailability?.enabled) {
      const times: string[] = [];
      for (let h = 9; h < 17; h++) {
        times.push(`${h.toString().padStart(2, '0')}:00`);
        times.push(`${h.toString().padStart(2, '0')}:30`);
      }
      return times;
    }
    
    const times: string[] = [];
    const startHour = parseInt(dayAvailability.startTime?.split(':')[0]) || 9;
    const endHour = parseInt(dayAvailability.endTime?.split(':')[0]) || 17;
    
    for (let h = startHour; h < endHour; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`);
      times.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return times;
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedConsultant?._id) {
      setAvailableTimes(getAvailableTimes(selectedConsultant._id, date));
    }
    setSelectedTime('');
  };

  const handleConsultantChange = (consultant: any) => {
    setSelectedConsultant(consultant);
    if (selectedDate) {
      setAvailableTimes(getAvailableTimes(consultant._id, selectedDate));
    }
    setSelectedTime('');
  };

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceName: '',
    servicePrice: '',
    serviceDuration: '',
    consultantName: '',
    bookingDate: '',
    bookingTime: '',
    status: 'pending',
    paymentStatus: 'pending',
    notes: '',
  });

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const bookings = useQuery(
    api.bookings.listByCompany,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const services = useQuery(
    api.services.getServicesByCompany,
    companyId ? { companyId: companyId as any } : "skip"
  );

  const clients = useQuery(
    api.clients.getClientsByCompany,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const createBooking = useMutation(api.bookings.create);
  const updateBooking = useMutation(api.bookings.updateBooking);
  const updateStatus = useMutation(api.bookings.updateStatus);
  const deleteBooking = useMutation(api.bookings.deleteBooking);

  const filteredBookings = bookings?.filter((booking: Booking) => {
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerPhone.includes(searchQuery) ||
      booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = booking.bookingDate === today;
    } else if (dateFilter === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = booking.bookingDate >= today;
    } else if (dateFilter === 'past') {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = booking.bookingDate < today;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }) || [];

  const filteredClients = useMemo(() => {
    if (!clients || !clientSearch) return [];
    const search = clientSearch.toLowerCase();
    return (clients as any[]).filter(c => 
      c.contactName.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.companyName?.toLowerCase().includes(search) ||
      c.contactNumber?.includes(search)
    ).slice(0, 8);
  }, [clients, clientSearch]);

  const selectClient = (client: any) => {
    setFormData({
      ...formData,
      customerName: client.contactName || '',
      customerEmail: client.email || '',
      customerPhone: client.contactNumber || '',
    });
    setClientSearch('');
    setShowClientDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await createBooking({
        userId: user.id as any,
        companyId: companyId as any,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        serviceName: selectedService?.name || formData.serviceName,
        servicePrice: selectedService?.price || Number(formData.servicePrice) || 0,
        serviceDuration: selectedService?.duration || (formData.serviceDuration ? Number(formData.serviceDuration) : undefined),
        consultantName: selectedConsultant?.name || formData.consultantName || undefined,
        bookingDate: selectedDate,
        bookingTime: selectedTime,
        notes: formData.notes || undefined,
      });

      setSuccessMessage(`Appointment for ${formData.customerName} has been created successfully!`);
      setShowSuccessModal(true);
      setShowModal(false);
      setFormStep(1);
      resetForm();
      setSelectedService(null);
      setSelectedConsultant(null);
      setSelectedDate('');
      setSelectedTime('');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error(error.message || 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBooking) return;

    setIsSubmitting(true);
    try {
      await updateBooking({
        userId: user.id as any,
        bookingId: selectedBooking._id as any,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        serviceName: formData.serviceName,
        servicePrice: Number(formData.servicePrice) || undefined,
        serviceDuration: formData.serviceDuration ? Number(formData.serviceDuration) : undefined,
        consultantName: formData.consultantName || undefined,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes || undefined,
      });

      setSuccessMessage(`Appointment for ${formData.customerName} has been updated successfully!`);
      setShowSuccessModal(true);
      setEditingBooking(null);
      setSelectedBooking(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast.error(error.message || 'Failed to update appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedBooking) return;

    setIsSubmitting(true);
    try {
      await deleteBooking({
        userId: user.id as any,
        bookingId: selectedBooking._id as any,
      });

      setSuccessMessage(`Appointment for ${selectedBooking.customerName} has been deleted.`);
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      setSelectedBooking(null);
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast.error(error.message || 'Failed to delete appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setFormData({
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      serviceName: booking.serviceName,
      servicePrice: booking.servicePrice.toString(),
      serviceDuration: booking.serviceDuration?.toString() || '',
      consultantName: booking.consultantName || '',
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      notes: booking.notes || '',
    });
    setEditingBooking(booking);
  };

  const openDeleteModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      serviceName: '',
      servicePrice: '',
      serviceDuration: '',
      consultantName: '',
      bookingDate: '',
      bookingTime: '',
      status: 'pending',
      paymentStatus: 'pending',
      notes: '',
    });
  };

  const handleServiceSelect = (service: Service) => {
    setFormData(prev => ({
      ...prev,
      serviceName: service.name,
      servicePrice: service.price.toString(),
      serviceDuration: service.duration?.toString() || '',
    }));
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Link
              href={`/companies/${companyId}/manage`}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Appointments</h1>
              <p className="text-sm text-slate-500">Manage booking appointments</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Appointment</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="all">All Status</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No appointments found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking: Booking) => {
              const status = statusColors[booking.status] || statusColors.pending;
              const payment = paymentStatusColors[booking.paymentStatus] || paymentStatusColors.pending;
              
              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${payment.bg} ${payment.text}`}>
                          {payment.label}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-slate-900 text-lg">{booking.customerName}</h3>
                      
                      <div className="mt-2 space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="truncate">{booking.customerEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{booking.customerPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                          {booking.servicePrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500">{booking.serviceName}</div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        <span>{booking.bookingDate}</span>
                        <Clock className="h-4 w-4 ml-1" />
                        <span>{booking.bookingTime}</span>
                      </div>

                      {booking.consultantName && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <User className="h-4 w-4" />
                          <span>{booking.consultantName}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(booking)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(booking)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500">{booking.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-16">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">New Appointment</h3>
                <p className="text-sm text-slate-500">Step {formStep} of 5</p>
              </div>
              <button
                onClick={() => { setShowModal(false); setFormStep(1); resetForm(); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-3 bg-slate-50">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      step <= formStep ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Step 1: Service Selection - like website flow */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select a Service *</label>
                    {services && services.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                        {(services as Service[]).map((service) => (
                          <button
                            key={service._id}
                            type="button"
                            onClick={() => {
                              setSelectedService(service);
                              setFormData({ ...formData, serviceName: service.name, servicePrice: service.price?.toString() || '', serviceDuration: service.duration?.toString() || '60' });
                            }}
                            className={`p-4 border-2 rounded-xl text-left transition-all ${
                              selectedService?._id === service._id 
                                ? 'border-slate-900 bg-slate-50' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <p className="font-medium text-slate-900">{service.name}</p>
                            <p className="text-sm text-slate-500">${service.price?.toFixed(2)} • {service.duration} min</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-slate-500 mb-4">No services available.</p>
                        <Link
                          href={`/companies/${companyId}/crm/services`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800"
                        >
                          <Plus className="h-4 w-4" />
                          Add Services
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedService) setFormStep(2);
                        else toast.error('Please select a service');
                      }}
                      className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              

              {/* Step 2: Consultant Selection (filtered by selected service) */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Consultant/Staff *</label>
                    {consultants && consultants.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(consultants as any[]).filter((c: any) => c.isActive).map((consultant) => (
                          <button
                            key={consultant._id}
                            type="button"
                            onClick={() => {
                              handleConsultantChange(consultant);
                            }}
                            className={`p-4 border-2 rounded-xl text-left transition-all ${
                              selectedConsultant?._id === consultant._id 
                                ? 'border-slate-900 bg-slate-50' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <p className="font-medium text-slate-900">{consultant.userName}</p>
                            <p className="text-sm text-slate-500">{consultant.role || 'Staff member'}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No consultants available.</p>
                    )}
                  </div>
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={() => setFormStep(1)} className="px-4 py-2 text-slate-600">Back</button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedConsultant) setFormStep(3);
                        else toast.error('Please select a consultant');
                      }}
                      className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Date & Time Selection */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Date *</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Time *</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableTimes.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              selectedTime === time
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={() => setFormStep(2)} className="px-4 py-2 text-slate-600">Back</button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDate && selectedTime) setFormStep(4);
                        else toast.error('Please select date and time');
                      }}
                      className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

{/* Step 4: Client Selection (replacing auth step from website) */}
              {formStep === 4 && (
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Client *</label>
                    <input
                      type="text"
                      placeholder="Search clients by name, email, phone..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                    {showClientDropdown && filteredClients.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredClients.map((client) => (
                          <button
                            key={client._id}
                            type="button"
                            onClick={() => selectClient(client)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                          >
                            <p className="font-medium text-slate-900">{client.contactName}</p>
                            <p className="text-sm text-slate-500">{client.email || client.contactNumber}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <Link 
                      href={`/${params.domain}/companies/${companyId}/crm/clients/new`}
                      target="_blank"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add New Client
                    </Link>
                  </div>
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={() => setFormStep(4)} className="px-4 py-2 text-slate-600">Back</button>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.customerName) setFormStep(5);
                        else toast.error('Please select a client');
                      }}
                      className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Summary & Confirm */}
              {formStep === 5 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Client:</span>
                      <span className="font-medium text-slate-900">{formData.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span className="font-medium text-slate-900">{formData.customerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Phone:</span>
                      <span className="font-medium text-slate-900">{formData.customerPhone}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-slate-600">Service:</span>
                      <span className="font-medium text-slate-900">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Consultant:</span>
                      <span className="font-medium text-slate-900">{selectedConsultant?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date & Time:</span>
                      <span className="font-medium text-slate-900">{selectedDate} at {selectedTime}</span>
                    </div>
                    {selectedService?.duration && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Duration:</span>
                        <span className="font-medium text-slate-900">{selectedService.duration} minutes</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium text-slate-900">Total:</span>
                      <span className="font-bold text-slate-900">${selectedService?.price?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
                      placeholder="Any special requests or notes..."
                    />
                  </div>
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={() => setFormStep(4)} className="px-4 py-2 text-slate-600">Back</button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Appointment'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBooking && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Edit Appointment</h3>
              <button
                onClick={() => { setEditingBooking(null); setSelectedBooking(null); resetForm(); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.serviceName}
                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={formData.servicePrice}
                    onChange={(e) => setFormData({ ...formData, servicePrice: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    {paymentStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Consultant</label>
                <input
                  type="text"
                  value={formData.consultantName}
                  onChange={(e) => setFormData({ ...formData, consultantName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Consultant name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.bookingDate}
                    onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.bookingTime}
                    onChange={(e) => setFormData({ ...formData, bookingTime: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditingBooking(null); setSelectedBooking(null); resetForm(); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete Appointment</h3>
              </div>
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedBooking(null); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete the appointment for <span className="font-semibold">{selectedBooking.customerName}</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedBooking(null); }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
</div>
        )}

      {/* Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Success!</h3>
            <p className="text-slate-600 mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}