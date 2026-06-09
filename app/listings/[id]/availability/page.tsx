'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/app/[domain]/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';

function formatDateToLocalYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AvailabilityManagementPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as Id<'listings'>;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'available' | 'booked' | 'blocked'>('available');
  const [notes, setNotes] = useState('');

  const listing = useQuery(api.listings.getListing, { id: listingId });
  const availability = useQuery(
    api.availability.getAllListingAvailability,
    listingId ? { listingId } : 'skip'
  );
  const setAvailability = useMutation(api.availability.setAvailability);
  const deleteAvailability = useMutation(api.availability.deleteAvailability);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (listing && user && listing.ownerId !== (user as any).id) {
      toast.error('You do not have permission to manage this listing.');
      router.push('/listings');
    }
  }, [listing, user, router]);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDateStatus = (date: Date) => {
    const dateStr = formatDateToLocalYYYYMMDD(date);
    const availabilityForDate = availability?.find((a: any) => a.date === dateStr);
    return availabilityForDate?.status || 'available';
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateToLocalYYYYMMDD(date);
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const handleSetAvailability = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date to update.');
      return;
    }
    if (!user) return;

    try {
      await setAvailability({
        listingId,
        dates: selectedDates,
        status: selectedStatus,
        notes: notes || undefined,
        userId: (user as any).id,
      });
      toast.success(`Availability updated for ${selectedDates.length} date(s).`);
      setSelectedDates([]);
      setNotes('');
    } catch (error) {
      toast.error('Failed to update availability. Please try again.');
    }
  };

  const handleClearSelection = () => {
    setSelectedDates([]);
    setNotes('');
  };

  const getDayClassName = (date: Date, isSelected: boolean) => {
    const status = getDateStatus(date);
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    const baseClass = 'h-14 flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer border ';

    if (isPast) return baseClass + 'bg-white text-gray-300 cursor-not-allowed border-gray-200';
    if (isSelected) return baseClass + 'bg-blue-500 text-white border-blue-600';

    switch (status) {
      case 'available': return baseClass + 'bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-500';
      case 'booked': return baseClass + 'bg-white text-red-700 hover:bg-red-50 border-red-500';
      case 'blocked': return baseClass + 'bg-white text-slate-700 hover:bg-slate-50 border-slate-500';
      default: return baseClass + 'bg-white text-gray-800 hover:bg-gray-50 border-gray-300';
    }
  };

  const renderCalendar = (monthOffset: number) => {
    const displayMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
    const monthName = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay();
    const days: React.ReactNode[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-14"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
      const dateStr = formatDateToLocalYYYYMMDD(date);
      const isSelected = selectedDates.includes(dateStr);
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

      days.push(
        <div
          key={day}
          className={getDayClassName(date, isSelected)}
          onClick={() => !isPast && handleDateClick(date)}
        >
          <div className="relative">
            {day}
            {isSelected && <Check className="h-3 w-3 absolute -top-1 -right-1" />}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{monthName}</h3>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>
    );
  };

  if (listing === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h1>
        <Button asChild>
          <Link href="/listings"><ArrowLeft className="h-4 w-4 mr-2" />Back to Listings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/listings"><ArrowLeft className="h-4 w-4 mr-2" />Back to My Listings</Link>
          </Button>
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
              <p className="text-gray-600 mt-1">{listing.title}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>Select dates to update their availability status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg flex-wrap">
                  <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-white border border-emerald-500"></div><span className="text-sm text-gray-700 font-medium">Available</span></div>
                  <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-white border border-red-500"></div><span className="text-sm text-gray-700 font-medium">Booked</span></div>
                  <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-white border border-slate-500"></div><span className="text-sm text-gray-700 font-medium">Blocked</span></div>
                  <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-blue-500 border border-blue-600"></div><span className="text-sm text-gray-700 font-medium">Selected</span></div>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <Button variant="outline" size="sm" onClick={handlePreviousMonth} disabled={currentMonth <= new Date()}>
                    <ChevronLeft className="h-4 w-4 mr-1" />Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    Next<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {renderCalendar(0)}
                  {renderCalendar(1)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Update Availability</CardTitle>
                <CardDescription>{selectedDates.length} date(s) selected</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available"><div className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-600" />Available</div></SelectItem>
                      <SelectItem value="booked"><div className="flex items-center"><X className="h-4 w-4 mr-2 text-red-600" />Booked</div></SelectItem>
                      <SelectItem value="blocked"><div className="flex items-center"><Lock className="h-4 w-4 mr-2 text-gray-600" />Blocked</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea placeholder="Add any notes about these dates..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button className="w-full" onClick={handleSetAvailability} disabled={selectedDates.length === 0}>
                    <Save className="h-4 w-4 mr-2" />Save Changes
                  </Button>
                  <Button className="w-full" variant="outline" onClick={handleClearSelection} disabled={selectedDates.length === 0}>
                    <Trash2 className="h-4 w-4 mr-2" />Clear Selection
                  </Button>
                </div>
                <Separator />
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Quick Tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>Click dates to select/deselect</li>
                    <li>Select multiple dates at once</li>
                    <li>Past dates cannot be modified</li>
                    <li>Set to "Blocked" to prevent bookings</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
