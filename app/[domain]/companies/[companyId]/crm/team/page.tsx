'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import {
  Users as People,
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
  Shield,
  ShieldAlert,
  Building,
  Clock,
  Key,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';
import { CardPermissionSelector, PermissionTags as PermissionTagsComponent } from '@/components/team/CardPermissionSelector';
import { CardPermissionsMap, CARD_PERMISSIONS } from '@/lib/card-permissions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const teamFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  role: z.enum(['admin', 'manager', 'supervisor']),
  cardPermissions: z.record(z.string(), z.string()).optional(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

interface TeamMember {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  role?: string;
  department?: string;
  departments?: { _id: string; title: string }[];
  isActive?: boolean;
  createdAt?: number;
  cardPermissions?: CardPermissionsMap;
}

export default function CRMTeamPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Query team members from Convex
  const teamMembersData = useQuery(api.teamMembers.listByCompany, {
    userId: user?.id as any,
    companyId: companyId as Id<'companies'>});

  // Query departments for company
  const departmentsData = useQuery(api.departments.getDepartmentsByCompany, {
    userId: user?.id as any,
    companyId: companyId as any,
  });

// Mutations
  const inviteMemberAction = useAction(api.teamMemberActions.inviteMemberAction);
  const updateTeamMember = useMutation(api.teamMembers.update);
  const removeTeamMember = useMutation(api.teamMembers.remove);
  const toggleTeamMemberActive = useMutation(api.teamMembers.toggleActive);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<{ _id: string; title: string }[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkDepartmentSearch, setBulkDepartmentSearch] = useState('');
  const [selectedBulkDepartments, setSelectedBulkDepartments] = useState<{ _id: string; title: string }[]>([]);
  const [showBulkDepartmentDropdown, setShowBulkDepartmentDropdown] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Enrich team members with user data
  const teamMembers: TeamMember[] = teamMembersData?.map(m => ({
    _id: m._id,
    userId: m.userId,
    firstName: m.userFirstName || m.userName?.split(' ')[0] || '',
    lastName: m.userLastName || m.userName?.split(' ').slice(1).join(' ') || '',
    email: m.userEmail || '',
    contactNumber: m.userContactNumber || '',
    role: m.role,
    department: m.department,
    isActive: m.isActive,
    createdAt: m.createdAt,
    cardPermissions: (m.cardPermissions || {}) as CardPermissionsMap,
  })) || [];

  // Filter departments for autocomplete
  const filteredDepartments = departmentsData?.filter(d => 
    d.title.toLowerCase().includes(departmentSearchQuery.toLowerCase())
  ) || [];

  // Handle adding department to selected list
  const handleAddDepartment = (dept: { _id: string; title: string }) => {
    if (!selectedDepartments.find(d => d._id === dept._id)) {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
    setDepartmentSearchQuery('');
    setShowDepartmentDropdown(false);
  };

  // Handle removing department from selected list
  const handleRemoveDepartment = (deptId: string) => {
    setSelectedDepartments(selectedDepartments.filter(d => d._id !== deptId));
  };

  // Selection handlers
  const toggleMemberSelection = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const selectAllMembers = () => {
    setSelectedMembers(new Set(teamMembers.map(m => m._id)));
  };

  const deselectAllMembers = () => {
    setSelectedMembers(new Set());
  };

  // Bulk department handlers
  const addBulkDepartment = (dept: { _id: string; title: string }) => {
    if (!selectedBulkDepartments.find(d => d._id === dept._id)) {
      setSelectedBulkDepartments([...selectedBulkDepartments, dept]);
    }
    setBulkDepartmentSearch('');
    setShowBulkDepartmentDropdown(false);
  };

  const removeBulkDepartment = (deptId: string) => {
    setSelectedBulkDepartments(selectedBulkDepartments.filter(d => d._id !== deptId));
  };

  const filteredBulkDepartments = departmentsData?.filter(d => 
    d.title.toLowerCase().includes(bulkDepartmentSearch.toLowerCase())
  ) || [];

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      role: 'supervisor' as const,
      cardPermissions: {},
    },
  });

  // Card permissions state for add/edit modals
  const [currentCardPermissions, setCurrentCardPermissions] = useState<CardPermissionsMap>({});

  // Filter team members based on search
  const filteredMembers = teamMembers.filter(m =>
    m.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = async (data: TeamFormData) => {
    setIsSubmitting(true);

    try {
      if (!user?.id) {
        toast.error('You must be logged in to add team members');
        setIsSubmitting(false);
        return;
      }

      if (!data.contactNumber) {
        toast.error('Contact number is required for new team members');
        setIsSubmitting(false);
        return;
      }

      const result = await inviteMemberAction({
        inviterUserId: user.id as Id<'users'>,
        companyId: companyId as Id<'companies'>,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber,
        role: data.role,
        cardPermissions: currentCardPermissions,
        sendWelcomeEmail: sendWelcomeEmail,
        requireEmailVerification: requireEmailVerification,
        requirePasswordChange: requirePasswordChange,
      });

      const showCredentialsInModal = !sendWelcomeEmail && (requirePasswordChange || requireEmailVerification);
      const passwordInfo = sendWelcomeEmail 
        ? ' Their login credentials have been sent to their email address.' 
        : showCredentialsInModal && result?.password 
          ? ` Their generated password is: ${result.password}` 
          : '';
      const emailStatus = requireEmailVerification 
        ? ' They will need to verify their email to access the portal.' 
        : '';
      const passwordChangeStatus = requirePasswordChange
        ? ' They will be required to change their password upon first login.'
        : '';

      setSuccessMessage(`Team member "${data.firstName} ${data.lastName}" has been added successfully!${passwordInfo}${emailStatus}${passwordChangeStatus}`);
      setShowSuccessModal(true);
      setShowAddModal(false);
      reset();
      setCurrentCardPermissions({});
      setSendWelcomeEmail(false);
      setRequireEmailVerification(false);
      setRequirePasswordChange(false);
    } catch (error: any) {
      console.error('Error creating team member:', error);
      const errorStr = String(error?.message || error?.toString() || '');
      let errorMessage = 'Failed to add team member. Please try again.';
      
      if (errorStr.includes('EXISTING_MEMBER')) {
        errorMessage = 'This user is already a member of this company.';
      } else if (errorStr.includes('FORBIDDEN')) {
        errorMessage = 'You do not have permission to add team members. Admin access required.';
      } else if (errorStr.includes('UNAUTHORIZED')) {
        errorMessage = 'You must be logged in to add team members.';
      } else {
        const match = errorStr.match(/(?:Uncaught Error:\s*)?(.+?)(?:\s+at\s|$)/);
        if (match && match[1]) {
          errorMessage = match[1].trim();
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMember = async (data: TeamFormData) => {
    if (!selectedMember) return;

    setIsSubmitting(true);

    try {
      await updateTeamMember({
        userId: user?.id as Id<'users'>,
        userCompanyId: selectedMember._id as Id<'userCompanies'>,
        // User profile fields
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber,
        // User-company relationship fields
        role: data.role,
        cardPermissions: currentCardPermissions,
      });

      setShowEditModal(false);
      setSelectedMember(null);
      reset();
      setCurrentCardPermissions({});
      toast.success('Team member updated successfully');
    } catch (error: any) {
      console.error('Error updating team member:', error);
      const errorStr = String(error?.message || error?.toString() || '');
      let errorMessage = 'Failed to update team member. Please try again.';
      if (errorStr.includes('NOT_FOUND')) {
        errorMessage = 'Team member not found. They may have been removed.';
      } else if (errorStr.includes('FORBIDDEN')) {
        errorMessage = 'You do not have permission to update team members.';
      } else if (errorStr.includes('UNAUTHORIZED')) {
        errorMessage = 'You must be logged in to update team members.';
      } else {
        const match = errorStr.match(/(?:Uncaught Error:\s*)?(.+?)(?:\s+at\s|$)/);
        if (match && match[1]) {
          errorMessage = match[1].trim();
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    setIsSubmitting(true);

    try {
      await removeTeamMember({
        userId: user?.id as Id<'users'>,
        userCompanyId: selectedMember._id as Id<'userCompanies'>});
      setShowDeleteModal(false);
      setSelectedMember(null);
      toast.success('Team member removed successfully');
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to remove team member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (memberId: string) => {
    try {
      await toggleTeamMemberActive({
        userId: user?.id as Id<'users'>,
        userCompanyId: memberId as Id<'userCompanies'>});
      toast.success('Team member status updated');
    } catch (error) {
      console.error('Error toggling team member status:', error);
      toast.error('Failed to update status');
    }
  };

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setValue('firstName', member.firstName);
    setValue('lastName', member.lastName);
    setValue('email', member.email);
    setValue('contactNumber', member.contactNumber);
    setValue('role', (member.role === 'admin' || member.role === 'manager' || member.role === 'supervisor') ? member.role : 'supervisor');
    setCurrentCardPermissions(member.cardPermissions || {});
    setShowEditModal(true);
  };

  const openDeleteModal = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading team members...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
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
            <span className="text-slate-900 font-medium">Team Members</span>
          </div>

          {/* Title */}
          <div className="pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <People className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Management</h1>
                  <p className="text-slate-600 mt-1">Manage your team structure and departments</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-3 sm:py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Add Member</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>
          {teamMembers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={selectAllMembers}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1"
              >
                Select All
              </button>
              <span className="text-xs text-slate-400">|</span>
              <button
                onClick={deselectAllMembers}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1"
              >
                Deselect All
              </button>
              <span className="text-xs text-slate-400 ml-auto">
                {selectedMembers.size} of {teamMembers.length} selected
              </span>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedMembers.size > 0 && (
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 animate-in slide-in-from-bottom-4">
            <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
              <span className="text-sm font-medium truncate">
                {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkAssignModal(true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold transition-colors"
                >
                  Assign to Department
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Members List */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredMembers.map((member) => (
              <div
                key={member._id}
                className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl flex flex-col ${
                  member.isActive
                    ? 'border-slate-200/80 hover:border-slate-300'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Gradient Header Bar */}
                <div className={`h-1.5 rounded-t-2xl ${member.isActive ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800' : 'bg-slate-300'}`} />

                <div className="p-4 flex flex-col flex-1">
                  {/* Header: Checkbox + Avatar + Name + Status */}
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(member._id)}
                      onChange={() => toggleMemberSelection(member._id)}
                      className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500 flex-shrink-0 mt-1"
                    />
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      member.isActive
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-900/20'
                        : 'bg-slate-200'
                    }`}>
                      <User className={`h-5 w-5 ${member.isActive ? 'text-white' : 'text-slate-500'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {member.firstName} {member.lastName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          member.isActive
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {member.role && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 capitalize">
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-1.5 mb-3 flex-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {/* Card Permissions Tags */}
                    <div className="flex items-start gap-1.5 pt-1">
                      <Key className="h-3 w-3 text-slate-400 flex-shrink-0 mt-0.5" />
                      <PermissionTagsComponent
                        permissions={member.cardPermissions || {}}
                        enabledApps={company?.enabledApps}
                        maxVisible={3}
                      />
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    {/* Toggle Status */}
                    <button
                      onClick={() => handleToggleActive(member._id)}
                      className={`relative w-9 h-5 rounded-full transition-all duration-300 ${
                        member.isActive ? 'bg-slate-800' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                        member.isActive ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/companies/${companyId}/crm/team/${member.userId}/availability`}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                        title="Manage availability"
                      >
                        <Clock className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                        title="Edit member"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(member)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove member"
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
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <People className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No team members found' : 'No team members yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first team member'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-3 sm:py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Add First Member</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Add Team Member</h3>
                    <p className="text-sm text-slate-500">Add a new member to your team</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    reset();
                    setCurrentCardPermissions({});
                    setSendWelcomeEmail(false);
                    setRequireEmailVerification(false);
                    setRequirePasswordChange(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleAddMember)} className="p-6 space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    placeholder="John"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1.5">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    placeholder="Doe"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1.5">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.email.message}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('contactNumber')}
                  type="tel"
                  placeholder="+27 72 123 4567"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.contactNumber && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.contactNumber.message}</p>
                )}
              </div>

              {/* Departments */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Departments
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={departmentSearchQuery}
                    onChange={(e) => {
                      setDepartmentSearchQuery(e.target.value);
                      setShowDepartmentDropdown(true);
                    }}
                    onFocus={() => setShowDepartmentDropdown(true)}
                    placeholder="Search departments..."
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {showDepartmentDropdown && filteredDepartments.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredDepartments.map((dept) => (
                        <button
                          key={dept._id}
                          type="button"
                          onClick={() => handleAddDepartment(dept)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-teal-50 transition-colors"
                        >
                          {dept.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedDepartments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDepartments.map((dept) => (
                      <div
                        key={dept._id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium"
                      >
                        {dept.title}
                        <button
                          type="button"
                          onClick={() => handleRemoveDepartment(dept._id)}
                          className="ml-1 hover:text-teal-900"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-900 bg-white"
                >
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.role.message}</p>
                )}
              </div>

              {/* Account Options */}
              <div className="border-t border-slate-100 pt-5">
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Account Options
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={sendWelcomeEmail}
                      onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900 group-hover:text-teal-700 transition-colors">Send welcome email to team member</span>
                      <p className="text-xs text-slate-500 mt-0.5">They will receive their login credentials via email</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={requireEmailVerification}
                      onChange={(e) => setRequireEmailVerification(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900 group-hover:text-teal-700 transition-colors">Team member must verify their email address to log in</span>
                      <p className="text-xs text-slate-500 mt-0.5">They will receive a verification link via email</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={requirePasswordChange}
                      onChange={(e) => setRequirePasswordChange(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900 group-hover:text-teal-700 transition-colors">Team member needs to change their password upon login</span>
                      <p className="text-xs text-slate-500 mt-0.5">A random password will be generated and they will be prompted to set their own</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card Permissions */}
              <div className="border-t border-slate-100 pt-5">
                <CardPermissionSelector
                  value={currentCardPermissions}
                  onChange={(permissions) => setCurrentCardPermissions(permissions)}
                  enabledApps={company?.enabledApps}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    reset();
                    setCurrentCardPermissions({});
                    setSendWelcomeEmail(false);
                    setRequireEmailVerification(false);
                    setRequirePasswordChange(false);
                  }}
                  className="px-4 py-2.5 sm:px-3 sm:py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Edit2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Edit Team Member</h3>
                    <p className="text-sm text-slate-500">Update team member information</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                    reset();
                    setCurrentCardPermissions({});
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleEditMember)} className="p-6 space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    placeholder="John"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1.5">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    placeholder="Doe"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1.5">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="john@example.com"
                  disabled
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-500 bg-slate-50 placeholder:text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('contactNumber')}
                  type="tel"
                  placeholder="+27 72 123 4567"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.contactNumber && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.contactNumber.message}</p>
                )}
              </div>

              {/* Departments */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Departments
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={departmentSearchQuery}
                    onChange={(e) => {
                      setDepartmentSearchQuery(e.target.value);
                      setShowDepartmentDropdown(true);
                    }}
                    onFocus={() => setShowDepartmentDropdown(true)}
                    placeholder="Search departments..."
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {showDepartmentDropdown && filteredDepartments.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredDepartments.map((dept) => (
                        <button
                          key={dept._id}
                          type="button"
                          onClick={() => handleAddDepartment(dept)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 transition-colors"
                        >
                          {dept.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedDepartments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDepartments.map((dept) => (
                      <div
                        key={dept._id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium"
                      >
                        {dept.title}
                        <button
                          type="button"
                          onClick={() => handleRemoveDepartment(dept._id)}
                          className="ml-1 hover:text-emerald-900"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 bg-white"
                >
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.role.message}</p>
                )}
              </div>

              {/* Card Permissions */}
              <div className="border-t border-slate-100 pt-5">
                <CardPermissionSelector
                  value={currentCardPermissions}
                  onChange={(permissions) => setCurrentCardPermissions(permissions)}
                  enabledApps={company?.enabledApps}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                    reset();
                    setCurrentCardPermissions({});
                  }}
                  className="px-4 py-2.5 sm:px-3 sm:py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Updating...' : 'Update Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6">
              {/* Warning Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Remove Team Member</h3>
              <p className="text-slate-600 text-center mb-6">
                Are you sure you want to remove <span className="font-semibold text-slate-900">{selectedMember.firstName} {selectedMember.lastName}</span> from the team?
              </p>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <p className="text-sm text-red-800 leading-relaxed">
                  This action cannot be undone. The team member will be permanently removed from the system.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedMember(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMember}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Removing...' : 'Remove Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-3">Team Member Added!</h3>
              <p className="text-slate-600 text-center text-sm whitespace-pre-line">{successMessage}</p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setSuccessMessage('');
                  }}
                  className="w-full px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg"
                >
                  Got it
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

      {/* Bulk Assign to Department Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Assign to Departments</h3>
                    <p className="text-sm text-slate-500">Assign {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} to departments</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBulkAssignModal(false);
                    setSelectedBulkDepartments([]);
                    setBulkDepartmentSearch('');
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Departments
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={bulkDepartmentSearch}
                    onChange={(e) => {
                      setBulkDepartmentSearch(e.target.value);
                      setShowBulkDepartmentDropdown(true);
                    }}
                    onFocus={() => setShowBulkDepartmentDropdown(true)}
                    placeholder="Search departments..."
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {showBulkDepartmentDropdown && filteredBulkDepartments.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredBulkDepartments.map((dept) => (
                        <button
                          key={dept._id}
                          type="button"
                          onClick={() => addBulkDepartment(dept)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 transition-colors"
                        >
                          {dept.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedBulkDepartments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedBulkDepartments.map((dept) => (
                      <div
                        key={dept._id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium"
                      >
                        {dept.title}
                        <button
                          type="button"
                          onClick={() => removeBulkDepartment(dept._id)}
                          className="ml-1 hover:text-emerald-900"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkAssignModal(false);
                    setSelectedBulkDepartments([]);
                    setBulkDepartmentSearch('');
                  }}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success(`Assigned ${selectedMembers.size} member${selectedMembers.size > 1 ? 's' : ''} to ${selectedBulkDepartments.length} department${selectedBulkDepartments.length > 1 ? 's' : ''}`);
                    setShowBulkAssignModal(false);
                    setSelectedBulkDepartments([]);
                    setBulkDepartmentSearch('');
                    setSelectedMembers(new Set());
                  }}
                  disabled={selectedBulkDepartments.length === 0}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Delete {selectedMembers.size} Member{selectedMembers.size > 1 ? 's' : ''}?
              </h3>
              <p className="text-slate-600 mb-6">
                {selectedMembers.size === 1 
                  ? 'Are you sure you want to remove this team member? This action cannot be undone.'
                  : `Are you sure you want to remove these ${selectedMembers.size} team members? This action cannot be undone.`}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                    deselectAllMembers();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success(`Removed ${selectedMembers.size} member${selectedMembers.size > 1 ? 's' : ''} from team`);
                    setShowBulkDeleteModal(false);
                    deselectAllMembers();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
