'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '../../../../../../AuthProvider';
import {
  Clock,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowLeft,
  User,
} from 'lucide-react';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';
import toast from 'react-hot-toast';

// Types
interface TimeSlot {
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface Exclusion {
  date: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const DEFAULT_SLOT: TimeSlot = {
  startTime: '09:00',
  endTime: '17:00',
  enabled: true,
};

// Generate time options in 15-minute intervals
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

export default function AvailabilityPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const userId = params.userId as string;

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddExclusionModal, setShowAddExclusionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'weekly' | 'exclusions'>('weekly');

  // Weekly availability state
  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<DayOfWeek, DayAvailability>>({
    monday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
    tuesday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
    wednesday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
    thursday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
    friday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] },
  });

  // Exclusions state
  const [exclusions, setExclusions] = useState<Exclusion[]>([]);
  const [newExclusion, setNewExclusion] = useState<Exclusion>({
    date: new Date().toISOString().split('T')[0],
    isFullDay: true,
    startTime: '09:00',
    endTime: '17:00',
    reason: '',
  });

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Query user data
  const teamMember = useQuery(
    api.teamMembers.getByUserId,
    userId ? { userId: userId as Id<"users">, companyId: companyId as Id<"companies"> } : "skip"
  );

  // Query existing availability
  const existingAvailability = useQuery(
    api.userAvailability.getByUserAndCompany,
    userId && companyId ? { userId: userId as Id<"users">, companyId: companyId as Id<"companies"> } : "skip"
  );

  // Mutations
  const upsertAvailability = useMutation(api.userAvailability.upsertAvailability);
  const addExclusion = useMutation(api.userAvailability.addExclusion);
  const removeExclusion = useMutation(api.userAvailability.removeExclusion);

  // Load existing availability into state
  useEffect(() => {
    if (existingAvailability) {
      const weekly = { ...weeklyAvailability };

      if (existingAvailability.weeklyAvailability) {
        DAYS.forEach(day => {
          const slots = existingAvailability.weeklyAvailability?.[day.key];
          if (slots && slots.length > 0) {
            weekly[day.key] = {
              enabled: slots.some(s => s.enabled),
              slots: slots,
            };
          }
        });
      }

      setWeeklyAvailability(weekly);

      if (existingAvailability.exclusions) {
        setExclusions(existingAvailability.exclusions);
      }
    }
  }, [existingAvailability]);

  // Handle day toggle
  const toggleDay = (day: DayOfWeek) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: !prev[day].enabled && prev[day].slots.length === 0
          ? [{ ...DEFAULT_SLOT }]
          : prev[day].slots,
      },
    }));
  };

  // Add time slot to a day
  const addTimeSlot = (day: DayOfWeek) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { ...DEFAULT_SLOT }],
      },
    }));
  };

  // Remove time slot from a day
  const removeTimeSlot = (day: DayOfWeek, index: number) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index),
      },
    }));
  };

  // Update time slot
  const updateTimeSlot = (day: DayOfWeek, index: number, field: 'startTime' | 'endTime', value: string) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  // Save weekly availability
  const handleSaveWeekly = async () => {
    setIsSaving(true);
    try {
      const weeklyData: Record<string, TimeSlot[]> = {};

      DAYS.forEach(day => {
        if (weeklyAvailability[day.key].enabled && weeklyAvailability[day.key].slots.length > 0) {
          weeklyData[day.key] = weeklyAvailability[day.key].slots.map(slot => ({
            ...slot,
            enabled: true,
          }));
        }
      });

      await upsertAvailability({
        userId: userId as Id<"users">,
        companyId: companyId as Id<"companies">,
        weeklyAvailability: weeklyData as any,
        exclusions: exclusions.length > 0 ? exclusions : undefined,
      });

      toast.success('Availability saved successfully');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setIsSaving(false);
    }
  };

  // Add exclusion
  const handleAddExclusion = async () => {
    setIsSaving(true);
    try {
      await addExclusion({
        userId: userId as Id<"users">,
        companyId: companyId as Id<"companies">,
        exclusion: newExclusion,
      });

      setExclusions(prev => [...prev, newExclusion]);
      setShowAddExclusionModal(false);
      setNewExclusion({
        date: new Date().toISOString().split('T')[0],
        isFullDay: true,
        startTime: '09:00',
        endTime: '17:00',
        reason: '',
      });

      toast.success('Exclusion added successfully');
    } catch (error) {
      console.error('Error adding exclusion:', error);
      toast.error('Failed to add exclusion');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove exclusion
  const handleRemoveExclusion = async (index: number) => {
    try {
      await removeExclusion({
        userId: userId as Id<"users">,
        companyId: companyId as Id<"companies">,
        exclusionIndex: index,
      });

      setExclusions(prev => prev.filter((_, i) => i !== index));
      toast.success('Exclusion removed');
    } catch (error) {
      console.error('Error removing exclusion:', error);
      toast.error('Failed to remove exclusion');
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm overflow-x-auto">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">Companies</a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">{company.name}</a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">CRM</a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/crm/team`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">Team</a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap">Availability</span>
          </div>

          {/* Title Section */}
          <div className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Manage Availability
                  </h1>
                  <p className="text-slate-600 text-sm">
                    {teamMember?.userName || 'Team Member'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-1.5 mb-6 inline-flex w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'weekly'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="h-4 w-4 inline-block mr-2" />
            Weekly Schedule
          </button>
          <button
            onClick={() => setActiveTab('exclusions')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'exclusions'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="h-4 w-4 inline-block mr-2" />
            Exclusions
            {exclusions.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                {exclusions.length}
              </span>
            )}
          </button>
        </div>

        {/* Weekly Schedule Tab */}
        {activeTab === 'weekly' && (
          <div className="space-y-4">
            {DAYS.map(day => (
              <div
                key={day.key}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleDay(day.key)}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                        weeklyAvailability[day.key].enabled ? 'bg-slate-900' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                        weeklyAvailability[day.key].enabled ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                    <span className={`font-semibold ${weeklyAvailability[day.key].enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                      {day.label}
                    </span>
                  </div>

                  {weeklyAvailability[day.key].enabled && (
                    <button
                      onClick={() => addTimeSlot(day.key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Add Slot
                    </button>
                  )}
                </div>

                {/* Time Slots */}
                {weeklyAvailability[day.key].enabled && (
                  <div className="p-5">
                    {weeklyAvailability[day.key].slots.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No time slots configured. Click "Add Slot" to add availability.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {weeklyAvailability[day.key].slots.map((slot, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-xl"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
                                <select
                                  value={slot.startTime}
                                  onChange={(e) => updateTimeSlot(day.key, index, 'startTime', e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                >
                                  {TIME_OPTIONS.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                              </div>
                              <span className="text-slate-400 mt-5">—</span>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
                                <select
                                  value={slot.endTime}
                                  onChange={(e) => updateTimeSlot(day.key, index, 'endTime', e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                >
                                  {TIME_OPTIONS.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <button
                              onClick={() => removeTimeSlot(day.key, index)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all sm:mt-5"
                              title="Remove slot"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!weeklyAvailability[day.key].enabled && (
                  <div className="px-5 py-4 text-sm text-slate-500">
                    Unavailable
                  </div>
                )}
              </div>
            ))}

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveWeekly}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Save Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Exclusions Tab */}
        {activeTab === 'exclusions' && (
          <div className="space-y-4">
            {/* Add Exclusion Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddExclusionModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-4 w-4" />
                Add Exclusion
              </button>
            </div>

            {/* Exclusions List */}
            {exclusions.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {exclusions.map((exclusion, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        exclusion.isFullDay
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {exclusion.isFullDay ? (
                          <Calendar className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{formatDate(exclusion.date)}</p>
                        <p className="text-sm text-slate-600">
                          {exclusion.isFullDay
                            ? 'Full day unavailable'
                            : `${exclusion.startTime} — ${exclusion.endTime}`}
                        </p>
                        {exclusion.reason && (
                          <p className="text-xs text-slate-500 mt-1">{exclusion.reason}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExclusion(index)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No exclusions</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Add exclusion dates for vacations, holidays, or other times when this team member is unavailable.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Exclusion Modal */}
      {showAddExclusionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Add Exclusion</h3>
              </div>
              <button
                onClick={() => setShowAddExclusionModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newExclusion.date}
                  onChange={(e) => setNewExclusion({ ...newExclusion, date: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Full Day</label>
                  <p className="text-xs text-slate-500 mt-0.5">Unavailable for the entire day</p>
                </div>
                <button
                  onClick={() => setNewExclusion({ ...newExclusion, isFullDay: !newExclusion.isFullDay })}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                    newExclusion.isFullDay ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                    newExclusion.isFullDay ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {!newExclusion.isFullDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Start Time</label>
                    <select
                      value={newExclusion.startTime || '09:00'}
                      onChange={(e) => setNewExclusion({ ...newExclusion, startTime: e.target.value })}
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    >
                      {TIME_OPTIONS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">End Time</label>
                    <select
                      value={newExclusion.endTime || '17:00'}
                      onChange={(e) => setNewExclusion({ ...newExclusion, endTime: e.target.value })}
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    >
                      {TIME_OPTIONS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Reason <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newExclusion.reason || ''}
                  onChange={(e) => setNewExclusion({ ...newExclusion, reason: e.target.value })}
                  placeholder="e.g., Vacation, Sick leave, Meeting"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddExclusionModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExclusion}
                  disabled={!newExclusion.date || isSaving}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  {isSaving ? 'Adding...' : 'Add Exclusion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Side Sheet */}
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
