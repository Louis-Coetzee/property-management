'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  User,
  X,
  Search,
  ChevronRight,
  Loader2,
  Building,
  DollarSign,
  Clock,
  Wrench,
  XCircle,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';
import toast from 'react-hot-toast';

interface Consultant {
  _id: string;
  userCompanyId: string;
  userId: string;
  userName: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userContactNumber: string;
  userImage?: string;
  role?: string;
  description?: string;
  hourlyRate?: number;
  isActive: boolean;
  isDefault?: boolean;
  availability?: {
    monday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    tuesday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    wednesday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    thursday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    friday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    saturday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
    sunday?: { enabled: boolean; slots?: { startTime: string; endTime: string }[] };
  };
  exclusions?: { date: string; startTime?: string; endTime?: string; reason?: string }[];
  createdAt?: number;
  updatedAt?: number;
}

interface TeamMember {
  _id: string;
  userId: string;
  userName: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userContactNumber: string;
  userImage?: string;
  role?: string;
  department?: string;
}

export default function CRMConsultantsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const consultantsData = useQuery(api.consultants.listByCompany, {
    userId: user?.id as any,
    companyId: companyId as Id<'companies'>});

  const addConsultant = useMutation(api.consultants.add);
  const updateConsultant = useMutation(api.consultants.update);
  const removeConsultant = useMutation(api.consultants.remove);
  const toggleConsultantActive = useMutation(api.consultants.toggleActive);
  const setDefaultConsultant = useMutation(api.consultants.setDefault);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  const [teamMemberSearch, setTeamMemberSearch] = useState('');
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);
  const [consultantRole, setConsultantRole] = useState('');
  const [consultantDescription, setConsultantDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  const availableTeamMembers = useQuery(api.consultants.searchAvailableTeamMembers, {
    userId: user?.id as any,
    companyId: companyId as Id<'companies'>,
    searchQuery: teamMemberSearch || undefined,
  });

  const consultants: Consultant[] = consultantsData || [];

  const filteredConsultants = consultants.filter(c =>
    c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.role && c.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddConsultant = async () => {
    if (!selectedTeamMember) {
      toast.error('Please select a team member');
      return;
    }

    setIsSubmitting(true);

    try {
      await addConsultant({
        userId: user?.id as Id<'users'>,
        companyId: companyId as Id<'companies'>,
        userCompanyId: selectedTeamMember._id as Id<'userCompanies'>,
        role: consultantRole || undefined,
        description: consultantDescription || undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      });

      setShowAddModal(false);
      resetForm();
      toast.success('Consultant added successfully!');
    } catch (error: any) {
      console.error('Error adding consultant:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      if (errorMessage.includes('already a consultant')) {
        toast.error('This team member is already a consultant');
      } else if (errorMessage.includes('FORBIDDEN')) {
        toast.error('You do not have permission to add consultants');
      } else {
        toast.error(`Failed to add consultant: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditConsultant = async () => {
    if (!selectedConsultant) return;

    setIsSubmitting(true);

    try {
      await updateConsultant({
        userId: user?.id as Id<'users'>,
        consultantId: selectedConsultant._id as Id<'consultants'>,
        role: consultantRole || undefined,
        description: consultantDescription || undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      });

      setShowEditModal(false);
      setSelectedConsultant(null);
      resetForm();
      toast.success('Consultant updated successfully');
    } catch (error) {
      console.error('Error updating consultant:', error);
      toast.error('Failed to update consultant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConsultant = async () => {
    if (!selectedConsultant) return;

    setIsSubmitting(true);

    try {
      await removeConsultant({
        userId: user?.id as Id<'users'>,
        consultantId: selectedConsultant._id as Id<'consultants'>});
      setShowDeleteModal(false);
      setSelectedConsultant(null);
      toast.success('Consultant removed successfully');
    } catch (error) {
      console.error('Error removing consultant:', error);
      toast.error('Failed to remove consultant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setConsultantRole(consultant.role || '');
    setConsultantDescription(consultant.description || '');
    setHourlyRate(consultant.hourlyRate?.toString() || '');
    setShowEditModal(true);
  };

  const openDeleteModal = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setShowDeleteModal(true);
  };

  const handleToggleActive = async (consultantId: string) => {
    try {
      await toggleConsultantActive({
        userId: user?.id as Id<'users'>,
        consultantId: consultantId as Id<'consultants'>,
      });
      toast.success('Consultant status updated');
    } catch (error) {
      console.error('Error toggling consultant status:', error);
      toast.error('Failed to update consultant status');
    }
  };

  const handleSetDefault = async (consultantId: string) => {
    try {
      await setDefaultConsultant({
        userId: user?.id as Id<'users'>,
        consultantId: consultantId as Id<'consultants'>,
      });
      toast.success('Default consultant updated');
    } catch (error) {
      console.error('Error setting default consultant:', error);
      toast.error('Failed to set default consultant');
    }
  };

  const resetForm = () => {
    setSelectedTeamMember(null);
    setTeamMemberSearch('');
    setConsultantRole('');
    setConsultantDescription('');
    setHourlyRate('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading consultants...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

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
              {company.name}
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 transition-colors">
              CRM
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Consultants</span>
          </div>

          {/* Title */}
          <div className="pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Consultants</h1>
                  <p className="text-slate-600 mt-1">Manage external consultants for your company</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-3 sm:py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Add Consultant</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Consultants List */}
        {filteredConsultants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredConsultants.map((consultant) => (
              <div
                key={consultant._id}
                className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl flex flex-col ${
                  consultant.isActive
                    ? 'border-slate-200/80 hover:border-slate-300'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Gradient Header Bar */}
                <div className={`h-1.5 rounded-t-2xl ${consultant.isActive ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500' : 'bg-slate-300'}`} />

                <div className="p-4 flex flex-col flex-1">
                  {/* Header: Avatar + Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      consultant.isActive
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-200'
                    }`}>
                      <User className={`h-5 w-5 ${consultant.isActive ? 'text-white' : 'text-slate-500'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {consultant.userName}
                      </h3>
                      {consultant.role && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 mt-1">
                          {consultant.role}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-1.5 mb-3 flex-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{consultant.userEmail}</span>
                    </div>
                    {consultant.userContactNumber && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{consultant.userContactNumber}</span>
                      </div>
                    )}
                    {consultant.description && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-500 pt-1">
                        <Building className="h-3 w-3 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="truncate">{consultant.description}</span>
                      </div>
                    )}
                    {consultant.hourlyRate && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <DollarSign className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span>{consultant.hourlyRate}/hr</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/companies/${companyId}/crm/consultants/${consultant._id}/availability`}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                      >
                        <Clock className="h-3 w-3" />
                        <span className="hidden sm:inline">Availability</span>
                      </Link>
                      <Link
                        href={`/companies/${companyId}/crm/consultants/${consultant._id}/services`}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                      >
                        <Wrench className="h-3 w-3" />
                        <span className="hidden sm:inline">Services</span>
                      </Link>
                      {consultant.isActive && (
                        <button
                          onClick={() => handleSetDefault(consultant._id)}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                            consultant.isDefault 
                              ? 'text-amber-600 bg-amber-50' 
                              : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title={consultant.isDefault ? 'This is the default consultant' : 'Set as default consultant'}
                        >
                          <Star className={`h-3 w-3 ${consultant.isDefault ? 'fill-amber-500 text-amber-500' : ''}`} />
                          <span className="hidden sm:inline">{consultant.isDefault ? 'Default' : 'Set'}</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleActive(consultant._id)}
                        className={`relative w-8 h-5 rounded-full transition-all duration-200 ${
                          consultant.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={consultant.isActive ? 'Deactivate consultant' : 'Activate consultant'}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
                          consultant.isActive ? 'right-0.5' : 'left-0.5'
                        }`} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(consultant)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove consultant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No consultants found' : 'No consultants yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Get started by adding team members as consultants'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-3 sm:py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Add First Consultant</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Consultant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Add Consultant</h3>
                    <p className="text-sm text-slate-500">Search and select a team member</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Team Member Search */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Search Team Members
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={teamMemberSearch}
                  onChange={(e) => setTeamMemberSearch(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Team Members List */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Available Team Members <span className="text-red-500">*</span>
                </label>
                
                {availableTeamMembers && availableTeamMembers.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                    {availableTeamMembers.map((member) => (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => setSelectedTeamMember(member as TeamMember)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                          selectedTeamMember?._id === member._id ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{member.userName}</p>
                          <p className="text-xs text-slate-500 truncate">{member.userEmail}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500">
                    No team members available to add as consultants
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 sm:px-3 sm:py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddConsultant}
                  disabled={isSubmitting || !selectedTeamMember}
                  className="px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Adding...' : 'Add Consultant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Consultant Modal */}
      {showEditModal && selectedConsultant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Edit2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Edit Consultant</h3>
                    <p className="text-sm text-slate-500">Update consultant details</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedConsultant(null);
                    resetForm();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Selected Consultant Info (read-only) */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm font-medium text-slate-900">{selectedConsultant.userName}</p>
                <p className="text-sm text-slate-500">{selectedConsultant.userEmail}</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Consultant Role
                </label>
                <input
                  type="text"
                  placeholder="e.g., Financial Advisor, Technical Expert"
                  value={consultantRole}
                  onChange={(e) => setConsultantRole(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of the consultant's role..."
                  value={consultantDescription}
                  onChange={(e) => setConsultantDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  placeholder="e.g., 150"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedConsultant(null);
                    resetForm();
                  }}
                  className="px-4 py-2.5 sm:px-3 sm:py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditConsultant}
                  disabled={isSubmitting}
                  className="px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Updating...' : 'Update Consultant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedConsultant && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6">
              {/* Warning Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Remove Consultant</h3>
              <p className="text-slate-600 text-center mb-6">
                Are you sure you want to remove <span className="font-semibold text-slate-900">{selectedConsultant.userName}</span> as a consultant?
              </p>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <p className="text-sm text-red-800 leading-relaxed">
                  This action cannot be undone. The consultant will be permanently removed from the system.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedConsultant(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConsultant}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Removing...' : 'Remove'}
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