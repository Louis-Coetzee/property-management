'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Check, Loader2,
  User, CreditCard, Wallet, Phone, Mail, Edit2, Sparkles, ArrowRight, Star,
  Filter, SortAsc, X
} from 'lucide-react';
import { useAuth } from '@/app/[domain]/AuthProvider';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Service {
  _id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  popular?: boolean;
  category?: string;
}

interface Consultant {
  _id: string;
  userName: string;
  isActive: boolean;
  availability?: {
    monday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    tuesday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    wednesday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    thursday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    friday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    saturday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    sunday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
  };
  exclusions?: { date: string; startTime?: string; endTime?: string }[];
}

interface BookingSystemContent {
  title?: string;
  subtitle?: string;
  allowConsultantSelection?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
}

interface BookingSystemSectionProps {
  content: BookingSystemContent;
  settings?: any;
  companyId?: string;
}

export function BookingSystemSection({ content, settings, companyId }: BookingSystemSectionProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [step, setStep] = useState<string>('selection');
  const [selectedPayment, setSelectedPayment] = useState<'payfast' | 'paypal' | 'cash' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  const timeSlotsRef = useRef<HTMLDivElement>(null);
  const reviewButtonRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const isLoggedIn = !!user;

  const createBooking = useMutation(api.bookings.create);
  const updatePayment = useMutation(api.bookings.updatePayment);

  const company = useQuery(
    api.companies.getByCompanyIdPublic,
    companyId ? { companyId: companyId as Id<'companies'> } : 'skip',
  ) as any;

  const paymentSettingsQuery = useQuery(
    api.bookingPaymentSettings.getBookingPaymentSettingsPublic,
    companyId ? { companyId: companyId as Id<'companies'> } : 'skip',
  ) as any;

  const paymentSettings = paymentSettingsQuery || {};

  const currencySymbol = company?.currency?.customSymbol || company?.currency?.symbol || 'R';
  const symbolPosition = company?.currency?.symbolPosition || 'before';
  const accentColor = company?.branding?.primaryColor || '#6366f1';
  const accent = (alpha: number) =>
    `${accentColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

  const allowConsultantSelection = content?.allowConsultantSelection !== false;
  const showFilters = content?.showFilters !== false;
  const showSort = content?.showSort !== false;

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'duration' | 'popular'>('price-asc');

  const defaultConsultant = useQuery(
    api.consultants.getDefaultByCompany,
    companyId ? { companyId: companyId as Id<'companies'> } : 'skip',
  );

  const formatPrice = (price: number) => {
    const formatted = `${currencySymbol}${price.toFixed(2)}`;
    return symbolPosition === 'after' ? `${formatted} ${currencySymbol}` : formatted;
  };

  const services = useQuery(
    api.services.listActiveForCompany,
    companyId ? { companyId: companyId as Id<'companies'> } : 'skip',
  );

  const consultantServices = useQuery(
    api.consultants.listServicesByCompany,
    companyId ? { companyId: companyId as Id<'companies'> } : 'skip',
  );

  const allConsultants = useQuery(
    api.consultants.listActiveByCompany,
    companyId ? { companyId: companyId as Id<'companies'> } : 'skip',
  );

  const consultantServiceMappings = useQuery(
    api.consultants.listAllServiceMappings,
    companyId ? { companyId: companyId as Id<'companies'> } : 'skip',
  );
  
  const getConsultantsForService = (serviceId: string) => {
    if (!consultantServiceMappings || !allConsultants) return [];
    const consultantIds = consultantServiceMappings
      .filter((m: any) => m.serviceId === serviceId)
      .map((m: any) => m.consultantId);
    return allConsultants.filter((c: any) => consultantIds.includes(c._id));
  };
  
  const availableServices: Service[] = consultantServices || [];
  
  // Filter services by category (before sorting)
  const filteredServices = filterCategory === 'all' 
    ? availableServices 
    : availableServices.filter((s: Service) => s.category === filterCategory);
  
  // Sort services
  const sortedServices = [...filteredServices].sort((a: Service, b: Service) => {
    switch (sortBy) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'duration': return (a.duration || 0) - (b.duration || 0);
      case 'popular': return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
      default: return 0;
    }
  });
  
  // Get unique categories from currently displayed services only
  const categories: string[] = sortedServices.length > 0 
    ? ['all', ...new Set(sortedServices.map((s: Service) => s.category).filter((c): c is string => Boolean(c)))]
    : ['all'];
  
  const availableConsultants = selectedService 
    ? getConsultantsForService(selectedService._id).filter((c: any) => c.isActive)
    : [];
  const consultants: Consultant[] = availableConsultants;
  
  const getActiveConsultant = (): Consultant | null => {
    if (selectedConsultant) return selectedConsultant;
    if (defaultConsultant) {
      const defaultInList = consultants.find((c: any) => c._id === defaultConsultant._id);
      if (defaultInList) return defaultInList as Consultant;
    }
    if (consultants.length > 0) return consultants[0] as Consultant;
    return null;
  };
  
  const activeConsultant = getActiveConsultant();
  
  useEffect(() => {
    if (consultants.length === 0) return;
    if (!allowConsultantSelection || !selectedConsultant) {
      if (defaultConsultant) {
        const defaultInList = consultants.find((c: any) => c._id === defaultConsultant._id);
        if (defaultInList) {
          setSelectedConsultant(defaultInList);
          return;
        }
      }
      setSelectedConsultant(consultants[0]);
    }
  }, [allowConsultantSelection, consultants, defaultConsultant, selectedService]);
  
  const hasAvailableTimes = (date: Date) => {
    if (!activeConsultant) return false;
    const availability = getConsultantAvailability(activeConsultant, date);
    return availability && availability.length > 0;
  };

  useEffect(() => {
    if (isLoggedIn && step === 'auth') {
      setStep('summary' as string);
    }
  }, [isLoggedIn, step]);

  const handleServiceSelect = (service: Service) => {
    if (isLoggedIn) {
      setSelectedService(service);
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedConsultant(null);
    } else {
      setSelectedService(service);
      setStep('auth' as string);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getConsultantAvailability = (consultant: Consultant, date: Date) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayAvailability = consultant.availability?.[dayName as keyof typeof consultant.availability];
    const dateStr = date.toISOString().split('T')[0];
    const exclusion = consultant.exclusions?.find(e => e.date === dateStr);
    if (exclusion && exclusion.startTime && exclusion.endTime) {
      return [{ startTime: exclusion.startTime, endTime: exclusion.endTime }];
    }
    if (!dayAvailability?.enabled || !dayAvailability.slots?.length) return null;
    return dayAvailability.slots;
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (!activeConsultant) return true;
    const hasTimes = hasAvailableTimes(date);
    return !hasTimes;
  };

  const getAvailableTimes = () => {
    if (!selectedDate || !activeConsultant) return [];
    const availability = getConsultantAvailability(activeConsultant, selectedDate);
    if (!availability) return [];
    return availability.map(slot => slot.startTime);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const days = getDaysInMonth(currentMonth);

  const payfastEnabled = paymentSettings?.payfast?.enabled ?? false;
  const paypalEnabled = paymentSettings?.paypal?.enabled ?? false;
  const allowCashPayment = paymentSettings?.allowCashPayment ?? true;
  const hasOnlinePayment = payfastEnabled || paypalEnabled;

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !user) return;
    if (!hasOnlinePayment || selectedPayment === 'cash') {
      try {
        setIsProcessing(true);
        const result = await createBooking({
          companyId: companyId as Id<'companies'>,
          userId: user.id as Id<'users'>,
          customerName: `${user.firstName} ${user.lastName}`,
          customerEmail: user.email,
          customerPhone: user.contactNumber || '',
          serviceName: selectedService.name,
          servicePrice: selectedService.price,
          serviceDuration: selectedService.duration,
          consultantId: selectedConsultant?._id as Id<'consultants'>,
          consultantName: selectedConsultant?.userName,
          bookingDate: selectedDate.toISOString().split('T')[0],
          bookingTime: selectedTime,
        });
        setConfirmedBooking({
          _id: result.bookingId,
          serviceName: selectedService.name,
          servicePrice: selectedService.price,
          serviceDuration: selectedService.duration,
          bookingDate: selectedDate.toISOString().split('T')[0],
          bookingTime: selectedTime,
          consultantName: selectedConsultant?.userName,
          customerName: `${user.firstName} ${user.lastName}`,
        });
        setBookingConfirmed(true);
        setStep('confirmation');
        return;
      } catch (error) {
        console.error('Error creating booking:', error);
        alert('Failed to create booking. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
    
    setStep('payment');
  };

  const processPayment = async () => {
    if (!selectedPayment || !selectedService || !selectedDate || !selectedTime || !user) return;
    try {
      setIsProcessing(true);
      const result = await createBooking({
        companyId: companyId as Id<'companies'>,
        userId: user.id as Id<'users'>,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        customerPhone: user.contactNumber || '',
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        consultantId: selectedConsultant?._id as Id<'consultants'>,
        consultantName: selectedConsultant?.userName,
        bookingDate: selectedDate.toISOString().split('T')[0],
        bookingTime: selectedTime,
      });
      const bookingId = result.bookingId;
      
      if (selectedPayment === 'cash') {
        await updatePayment({ bookingId, paymentStatus: 'paid', paymentMethod: 'cash' });
        setConfirmedBooking({
          _id: bookingId,
          serviceName: selectedService.name,
          servicePrice: selectedService.price,
          serviceDuration: selectedService.duration,
          bookingDate: selectedDate.toISOString().split('T')[0],
          bookingTime: selectedTime,
          consultantName: selectedConsultant?.userName,
          customerName: `${user.firstName} ${user.lastName}`,
        });
        setBookingConfirmed(true);
        setStep('confirmation');
        return;
      }
      
      const payfastSettings = paymentSettings?.payfast;
      const paypalSettings = paymentSettings?.paypal;
      const isPayfastTestMode = payfastSettings?.testMode ?? true;
      const isPaypalTestMode = paypalSettings?.testMode ?? true;
      const bookingNumber = `BK${Date.now()}`;
      
      // Build PayFast form directly without API call
      if (selectedPayment === 'payfast') {
        const merchantId = isPayfastTestMode ? (payfastSettings?.merchantId || '10000100') : payfastSettings?.merchantId || '';
        const merchantKey = isPayfastTestMode ? (payfastSettings?.merchantKey || '46f0cd694581a') : payfastSettings?.merchantKey || '';
        
        if (!isPayfastTestMode && (!merchantId || !merchantKey)) {
          throw new Error('PayFast live credentials not configured');
        }
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = isPayfastTestMode ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process';
        
        const paymentData = {
          merchant_id: merchantId,
          merchant_key: merchantKey,
          return_url: `${window.location.origin}/bookings/success?bookingId=${bookingId}&payment=complete`,
          cancel_url: `${window.location.origin}/bookings?bookingId=${bookingId}&payment=cancelled`,
          notify_url: `${window.location.origin}/api/payfast/notify`,
          m_payment_id: bookingNumber,
          amount: selectedService.price.toFixed(2),
          item_name: `Booking: ${selectedService.name}`,
          item_description: `Booking for ${selectedService.name} on ${selectedDate.toLocaleDateString()}`,
          custom_str1: bookingId,
        };
        
        Object.entries(paymentData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        return;
      }
      if (selectedPayment === 'paypal') {
        // For PayPal, redirect to PayPal without creating a payment record first
        // The booking was already created above, just redirect to PayPal
        const paypalUrl = isPaypalTestMode 
          ? `https://www.sandbox.paypal.com/checkoutnow?token=${bookingNumber}`
          : `https://www.paypal.com/checkoutnow?token=${bookingNumber}`;
        
        // Open PayPal in popup or redirect
        window.location.href = paypalUrl;
        return;
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetBooking = () => {
    setSelectedService(null);
    setSelectedConsultant(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep('selection');
    setBookingConfirmed(false);
    setConfirmedBooking(null);
    setSelectedPayment(null);
    setFilterCategory('all');
    setSortBy('price-asc');
  };

  // ─── Layout components ────────────────────────────────────────────────────────
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm', className)}>
      {children}
    </div>
  );
  const CardHead = ({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) => (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div className="flex items-center gap-2">{left}</div>
      {right}
    </div>
  );
  const CardIcon = ({ icon }: { icon: React.ReactNode }) => (
    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
      {icon}
    </div>
  );
  const CardTitle = ({ children }: { children: React.ReactNode }) => (
    <span className="text-sm font-semibold text-slate-900">{children}</span>
  );
  const CardBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={cn('px-5 py-4', className)}>{children}</div>
  );
  const PrimaryButton = ({ children, onClick, disabled, className = '' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2',
        disabled ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'text-white shadow-lg hover:shadow-xl active:scale-[0.98]',
        className,
      )}
      style={{ backgroundColor: disabled ? undefined : accentColor }}
    >
      {children}
    </button>
  );
  const SummaryRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div className="flex justify-between items-center py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
  const CheckCircle = () => (
    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
      <Check className="w-3.5 h-3.5 text-white" />
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  if (step === 'selection') {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {content?.title && (
          <div className="text-center pb-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5" style={{ backgroundColor: accent(0.1) }}>
              <Calendar className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{content.title}</h2>
            {content?.subtitle && (
              <p className="text-slate-500 text-base mt-2.5 max-w-xl mx-auto leading-relaxed">{content.subtitle}</p>
            )}
            <div className="h-0.5 w-10 rounded-full mx-auto mt-5" style={{ backgroundColor: accent(0.4) }} />
          </div>
        )}

        {/* Filters and Sort */}
        {(showFilters || showSort) && sortedServices.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {showFilters && categories.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-slate-400" />
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
                      filterCategory === cat
                        ? 'text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    )}
                    style={filterCategory === cat ? { backgroundColor: accentColor } : {}}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            )}
            {showSort && (
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="duration">Duration</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Service cards */}
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-4">Select a Service</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedServices.length > 0 ? (
              sortedServices.map((service: Service) => {
                const isSelected = selectedService?._id === service._id;
                return (
                  <button
                    key={service._id}
                    onClick={() => handleServiceSelect(service)}
                    className={cn(
                      'svc-card relative text-left rounded-2xl border-2 p-6 bg-white transition-all duration-200',
                      isSelected ? '' : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
                    )}
                    style={{
                      borderColor: isSelected ? accentColor : 'border-slate-200',
                      boxShadow: isSelected ? `0 0 0 1px ${accentColor}, 0 8px 30px -8px ${accent(0.3)}` : undefined,
                    }}
                  >
                    {service.popular && (
                      <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-white rounded-full" style={{ backgroundColor: accentColor }}>
                        <Star className="w-2.5 h-2.5" fill="currentColor" /> Popular
                      </span>
                    )}
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{service.description}</p>
                      )}
                      <div className="flex items-end justify-between pt-3 mt-1 border-t border-slate-100">
                        <span className="text-xl font-bold" style={{ color: accentColor }}>{formatPrice(service.price)}</span>
                        {service.duration && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />{service.duration} min
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute -bottom-px left-1/2 -translate-x-1/2 translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                  <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No services match your filter</p>
                <button onClick={() => setFilterCategory('all')} className="mt-2 text-sm font-medium" style={{ color: accentColor }}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Consultant */}
        {selectedService && allowConsultantSelection && consultants.length > 0 && (
          <Card className="mt-6">
            <CardHead left={<><CardIcon icon={<User className="w-4 h-4" />} /><CardTitle>{defaultConsultant ? defaultConsultant.userName : 'Consultant'}</CardTitle></>} />
            <CardBody>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setSelectedConsultant(null)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-center transition-all',
                    !selectedConsultant ? '' : 'border-slate-200 hover:border-slate-300',
                  )}
                  style={{ borderColor: !selectedConsultant ? accentColor : undefined, backgroundColor: !selectedConsultant ? accent(0.08) : undefined }}
                >
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: accent(0.12) }}>
                    <User className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Any</span>
                </button>
                {consultants.map((consultant: Consultant) => (
                  <button
                    key={consultant._id}
                    onClick={() => { setSelectedConsultant(consultant); setSelectedDate(null); setSelectedTime(null); }}
                    className={cn(
                      'p-4 rounded-xl border-2 text-center transition-all',
                      selectedConsultant?._id === consultant._id ? '' : 'border-slate-200 hover:border-slate-300',
                    )}
                    style={{ borderColor: selectedConsultant?._id === consultant._id ? accentColor : undefined, backgroundColor: selectedConsultant?._id === consultant._id ? accent(0.08) : undefined }}
                  >
                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: accent(0.12) }}>
                      <User className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{consultant.userName}</span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Date */}
        {selectedService && (
          <Card className="mt-6">
            <CardHead left={<><CardIcon icon={<Calendar className="w-4 h-4" />} /><CardTitle>Select Date</CardTitle></>} />
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-sm font-bold text-slate-900">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayLabels.map(day => <div key={day} className="text-[10px] font-semibold text-slate-400 text-center py-1 uppercase">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => (
                  <button
                    key={i}
                    disabled={!day || isDateDisabled(day)}
                    onClick={() => { if (day && !isDateDisabled(day)) { setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)); setSelectedTime(null); setTimeout(() => timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }}}
                    className={cn(
                      'aspect-square rounded-xl text-sm font-medium transition-all flex items-center justify-center',
                      !day ? 'invisible' : selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth() ? 'text-white shadow-md' : isDateDisabled(day) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:shadow-md cursor-pointer text-slate-700 hover:border-2',
                    )}
                    style={selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth() ? { backgroundColor: accentColor } : {}}
                  >{day}</button>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Time */}
        {selectedDate && (
          <div ref={timeSlotsRef} className="Card mt-6">
            <Card>
              <CardHead left={<><CardIcon icon={<Clock className="w-4 h-4" />} /><CardTitle>Select Time</CardTitle></>} />
              <CardBody>
                {activeConsultant ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                    {getAvailableTimes().map(time => (
                      <button
                        key={time}
                        onClick={() => { setSelectedTime(time); setTimeout(() => reviewButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }}
                        className={cn('py-2.5 px-3 rounded-xl text-sm font-semibold transition-all', selectedTime === time ? 'text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:shadow-md')}
                        style={selectedTime === time ? { backgroundColor: accentColor } : {}}
                      >{formatTime(time)}</button>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-500">Select a consultant to see available times</p>}
                {getAvailableTimes().length === 0 && activeConsultant && (
                  <div className="text-center py-6">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No available times for this date</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* CTA */}
        {selectedService && selectedDate && selectedTime && (
          <div ref={reviewButtonRef} className="flex justify-center mt-6">
            <PrimaryButton onClick={() => setStep(isLoggedIn ? 'summary' : 'auth')}>
              {isLoggedIn ? 'Review Booking' : 'Continue to Booking'} <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>
        )}
      </div>
    );
  }

  if (step === 'auth') {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHead left={<><CardIcon icon={<User className="w-4 h-4" />} /><CardTitle>Sign In Required</CardTitle></>} />
          <CardBody className="text-center">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-600 mb-6">Sign in or create an account to complete your booking.</p>
            <div className="space-y-3">
              <Link href="/auth/login" className="block w-full py-3 text-center font-semibold text-white rounded-xl transition-all" style={{ backgroundColor: accentColor }}>
                Sign In
              </Link>
              <Link href="/auth/register" className="block w-full py-3 text-center font-semibold border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all">
                Create Account
              </Link>
            </div>
            <button onClick={() => setStep('selection')} className="mt-4 text-sm text-slate-500 hover:text-slate-700">Back</button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (step === 'summary') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <CardHead left={<><CardIcon icon={<User className="w-4 h-4" />} /><CardTitle>Your Information</CardTitle></>} />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-500">Name</p><p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p></div></div>
              <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-500">Email</p><p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p></div></div>
              <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-500">Phone</p><p className="text-sm font-medium text-slate-900">{user?.contactNumber || '—'}</p></div></div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHead left={<><CardIcon icon={<Calendar className="w-4 h-4" />} /><CardTitle>Booking Summary</CardTitle></>} />
          <CardBody className="py-1">
            <SummaryRow label="Service" value={selectedService?.name || ''} />
            <SummaryRow label="Date & Time" value={`${selectedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${selectedTime && formatTime(selectedTime)}`} />
            {selectedConsultant && <SummaryRow label="Consultant" value={selectedConsultant.userName} />}
            {selectedService?.duration && <SummaryRow label="Duration" value={`${selectedService.duration} minutes`} />}
            <div className="flex justify-between items-center py-4 mt-1 border-t-2 border-slate-100">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-xl font-bold" style={{ color: accentColor }}>{formatPrice(selectedService?.price || 0)}</span>
            </div>
          </CardBody>
        </Card>

        {(hasOnlinePayment || allowCashPayment) && (
          <Card>
            <CardHead left={<><CardIcon icon={<CreditCard className="w-4 h-4" />} /><CardTitle>Payment Method</CardTitle></>} />
            <CardBody>
              {payfastEnabled && (
                <button onClick={() => setSelectedPayment('payfast')} className={cn('pay-opt w-full p-4 rounded-xl border-2 flex items-center gap-4 text-left', selectedPayment === 'payfast' ? '' : 'border-slate-200 hover:border-slate-300')} style={{ borderColor: selectedPayment === 'payfast' ? accentColor : undefined, backgroundColor: selectedPayment === 'payfast' ? accent(0.04) : 'white' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent(0.1) }}><CreditCard className="w-5 h-5" style={{ color: accentColor }} /></div>
                  <div className="flex-1"><p className="text-sm font-semibold text-slate-900">Pay Online</p><p className="text-xs text-slate-400 mt-0.5">Secure payment via PayFast</p></div>
                  {selectedPayment === 'payfast' && <CheckCircle />}
                </button>
              )}
              {paypalEnabled && (
                <button onClick={() => setSelectedPayment('paypal')} className={cn('pay-opt w-full p-4 rounded-xl border-2 flex items-center gap-4 text-left', selectedPayment === 'paypal' ? '' : 'border-slate-200 hover:border-slate-300')} style={{ borderColor: selectedPayment === 'paypal' ? accentColor : undefined, backgroundColor: selectedPayment === 'paypal' ? accent(0.04) : 'white' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent(0.1) }}><Wallet className="w-5 h-5" style={{ color: accentColor }} /></div>
                  <div className="flex-1"><p className="text-sm font-semibold text-slate-900">PayPal</p><p className="text-xs text-slate-400 mt-0.5">Pay with your PayPal account</p></div>
                  {selectedPayment === 'paypal' && <CheckCircle />}
                </button>
              )}
              {allowCashPayment && (
                <button onClick={() => setSelectedPayment('cash')} className={cn('pay-opt w-full p-4 rounded-xl border-2 flex items-center gap-4 text-left', selectedPayment === 'cash' ? '' : 'border-slate-200 hover:border-slate-300')} style={{ borderColor: selectedPayment === 'cash' ? accentColor : undefined, backgroundColor: selectedPayment === 'cash' ? accent(0.04) : 'white' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent(0.1) }}><Wallet className="w-5 h-5" style={{ color: accentColor }} /></div>
                  <div className="flex-1"><p className="text-sm font-semibold text-slate-900">Pay at Venue</p><p className="text-xs text-slate-400 mt-0.5">Settle payment upon arrival</p></div>
                  {selectedPayment === 'cash' && <CheckCircle />}
                </button>
              )}
            </CardBody>
          </Card>
        )}

        <PrimaryButton onClick={selectedPayment === 'cash' ? handleConfirmBooking : processPayment} disabled={!selectedPayment || isProcessing}>
          {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : selectedPayment === 'cash' ? 'Confirm Booking' : <>Confirm & Pay {formatPrice(selectedService?.price || 0)}</>}
        </PrimaryButton>
        <button onClick={() => setStep('selection')} className="w-full text-center text-sm text-slate-500 hover:text-slate-700 py-2">Back</button>
      </div>
    );
  }

  if (step === 'confirmation') {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardBody className="text-center py-10">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#10b98115' }}>
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
            <p className="text-slate-600 mb-6">Your appointment has been scheduled.</p>
            <div className="bg-slate-50 rounded-xl p-5 mb-6 text-left">
              <SummaryRow label="Service" value={confirmedBooking?.serviceName} />
              <SummaryRow label="Date & Time" value={`${confirmedBooking?.bookingDate && new Date(confirmedBooking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${confirmedBooking?.bookingTime && formatTime(confirmedBooking.bookingTime)}`} />
              {confirmedBooking?.consultantName && <SummaryRow label="Consultant" value={confirmedBooking.consultantName} />}
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-200">
                <span className="text-slate-500">Total</span>
                <span className="text-xl font-bold text-emerald-600">{formatPrice(confirmedBooking?.servicePrice || 0)}</span>
              </div>
            </div>
            <button onClick={resetBooking} className="px-6 py-3 text-white font-semibold rounded-xl transition-all" style={{ backgroundColor: accentColor }}>
              Book Another
            </button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return null;
}