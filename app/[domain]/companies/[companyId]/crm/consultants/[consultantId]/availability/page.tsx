'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import {
  Clock,
  Plus,
  Trash2,
  X,
  ChevronRight,
  Loader2,
  Calendar,
} from 'lucide-react';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';
import toast from 'react-hot-toast';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

interface Exclusion {
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

interface Consultant {
  _id: string;
  userCompanyId: string;
  userId: string;
  userName: string;
  userEmail: string;
  availability?: {
    monday?: DayAvailability;
    tuesday?: DayAvailability;
    wednesday?: DayAvailability;
    thursday?: DayAvailability;
    friday?: DayAvailability;
    saturday?: DayAvailability;
    sunday?: DayAvailability;
  };
  exclusions?: Exclusion[];
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

export default function ConsultantAvailabilityPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const consultantId = params.consultantId as string;

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const consultantData = useQuery(api.consultants.getById, {
    userId: user?.id as any,
    consultantId: consultantId as Id<'consultants'>,
  });

  const updateConsultant = useMutation(api.consultants.updateAvailability);

  const [activeTab, setActiveTab] = useState<'weekly' | 'exclusions'>('weekly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, DayAvailability>>({
    monday: { enabled: false, slots: [] },
    tuesday: { enabled: false, slots: [] },
    wednesday: { enabled: false, slots: [] },
    thursday: { enabled: false, slots: [] },
    friday: { enabled: false, slots: [] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] },
  });

  const [exclusions, setExclusions] = useState<Exclusion[]>([]);

  useEffect(() => {
    if (consultantData) {
      const consultant = consultantData as unknown as Consultant;
      if (consultant.availability) {
        setWeeklyAvailability({
          monday: consultant.availability.monday || { enabled: false, slots: [] },
          tuesday: consultant.availability.tuesday || { enabled: false, slots: [] },
          wednesday: consultant.availability.wednesday || { enabled: false, slots: [] },
          thursday: consultant.availability.thursday || { enabled: false, slots: [] },
          friday: consultant.availability.friday || { enabled: false, slots: [] },
          saturday: consultant.availability.saturday || { enabled: false, slots: [] },
          sunday: consultant.availability.sunday || { enabled: false, slots: [] },
        });
      }
      if (consultant.exclusions) {
        setExclusions(consultant.exclusions);
      }
    }
  }, [consultantData]);

  const handleToggleDay = (day: string) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleAddSlot = (day: string) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...(prev[day].slots || []), { startTime: '09:00', endTime: '17:00' }],
      },
    }));
  };

  const handleUpdateSlot = (day: string, index: number, field: 'startTime' | 'endTime', value: string) => {
    setWeeklyAvailability(prev => {
      const updatedSlots = [...(prev[day].slots || [])];
      updatedSlots[index] = { ...updatedSlots[index], [field]: value };
      return {
        ...prev,
        [day]: {
          ...prev[day],
          slots: updatedSlots,
        },
      };
    });
  };

  const handleRemoveSlot = (day: string, index: number) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: (prev[day].slots || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleAddExclusion = () => {
    setExclusions(prev => [
      ...prev,
      { date: '', startTime: '', endTime: '', reason: '' },
    ]);
  };

  const handleUpdateExclusion = (index: number, field: keyof Exclusion, value: string) => {
    setExclusions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveExclusion = (index: number) => {
    setExclusions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateConsultant({
        userId: user?.id as Id<'users'>,
        consultantId: consultantId as Id<'consultants'>,
        availability: weeklyAvailability,
        exclusions: exclusions.filter(e => e.date),
      });
      toast.success('Availability saved successfully');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !consultantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const consultant = consultantData as unknown as Consultant;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors">
              Companies
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors">
              {company?.name || 'Company'}
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/crm/consultants`} className="text-slate-500 hover:text-slate-700 transition-colors">
              Consultants
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">{consultant.userName}</span>
          </div>

          {/* Title */}
          <div className="pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Availability</h1>
                  <p className="text-slate-600 mt-1">Manage {consultant.userName}'s availability</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'weekly'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-4 w-4 inline-block mr-2" />
              Weekly Schedule
            </button>
            <button
              onClick={() => setActiveTab('exclusions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'exclusions'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-4 w-4 inline-block mr-2" />
              Exclusion Dates
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'weekly' && (
          <div className="space-y-4">
            {DAYS.map((day) => (
              <div key={day.key} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleDay(day.key)}
                      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                        weeklyAvailability[day.key]?.enabled ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                        weeklyAvailability[day.key]?.enabled ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>
                    <span className="font-medium text-slate-900">{day.label}</span>
                  </div>
                  {weeklyAvailability[day.key]?.enabled && (
                    <button
                      onClick={() => handleAddSlot(day.key)}
                      className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Time Slot
                    </button>
                  )}
                </div>

                {weeklyAvailability[day.key]?.enabled && (
                  <div className="space-y-2">
                    {(weeklyAvailability[day.key].slots || []).map((slot, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <label className="text-xs text-slate-500">Start</label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleUpdateSlot(day.key, index, 'startTime', e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <label className="text-xs text-slate-500">End</label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleUpdateSlot(day.key, index, 'endTime', e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveSlot(day.key, index)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {(weeklyAvailability[day.key].slots || []).length === 0 && (
                      <p className="text-sm text-slate-500">No time slots added. Click "Add Time Slot" to add.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'exclusions' && (
          <div className="space-y-4">
            <button
              onClick={handleAddExclusion}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Exclusion Date
            </button>

            {exclusions.map((exclusion, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-900">Exclusion {index + 1}</h3>
                  <button
                    onClick={() => handleRemoveExclusion(index)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={exclusion.date}
                      onChange={(e) => handleUpdateExclusion(index, 'date', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={exclusion.startTime || ''}
                      onChange={(e) => handleUpdateExclusion(index, 'startTime', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={exclusion.endTime || ''}
                      onChange={(e) => handleUpdateExclusion(index, 'endTime', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                    <input
                      type="text"
                      value={exclusion.reason || ''}
                      onChange={(e) => handleUpdateExclusion(index, 'reason', e.target.value)}
                      placeholder="e.g., Holiday, Meeting"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            {exclusions.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Exclusion Dates</h3>
                <p className="text-slate-600">Click "Add Exclusion Date" to block specific dates.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <NavigationSideSheet
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        companyId={companyId}
        companyName={company?.name || ''}
        enabledApps={company?.enabledApps}
      />
    </div>
  );
}