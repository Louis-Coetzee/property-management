'use client';

import { useState, useMemo } from 'react';
import { useAuthGuard, useAuth } from '@/app/[domain]/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  Users,
  ArrowLeft,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Shield,
  Key,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  ChevronDown,
  ChevronRight,
  UserPlus,
  X} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { PasswordValidator } from '@/components/auth/PasswordValidator';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';

type UserRole = 'admin' | 'admin' | 'user' | 'operator' | 'sales' | '';

export default function AdminUsersPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const { domain } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole>('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    userType: 'user',
    isEmailVerified: false});
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
    userType: 'user',
    registeredFromDomain: ''});
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''});
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    companyId: '',
    role: 'member',
  });

  // Query all users and companies
  const users = useQuery(api.admin.getAllUsers);
  const companies = useQuery(api.admin.getAllCompanies);
  const userCompanies = useQuery(api.companies.getCompaniesByUser, {
    userId: user?.id as any,
  });
  const defaultCompany = userCompanies?.[0];

  // Query all userCompanies to show counts
  const allUserCompanies = useQuery(api.admin.getAllUserCompanies);

  // Query userCompanies for the selected user
  const selectedUserCompanies = useQuery(
    api.admin.getUserCompaniesAdmin,
    selectedUser ? { userId: selectedUser._id } : 'skip'
  );

  // Create a map of userId -> active company count
  const userCompanyCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allUserCompanies?.forEach((uc) => {
      if (uc.isActive) {
        map[uc.userId] = (map[uc.userId] || 0) + 1;
      }
    });
    return map;
  }, [allUserCompanies]);

  // Mutations
  const updateUserAdmin = useMutation(api.admin.updateUserAdmin);
  const deleteUserAdmin = useMutation(api.admin.deleteUserAdmin);
  const updateUserPasswordAdmin = useMutation(api.admin.updateUserPasswordAdmin);
  const createUserAdmin = useMutation(api.admin.createUserAdmin);
  const verifyUserEmailAdmin = useMutation(api.admin.verifyUserEmailAdmin);
  const assignUserToCompany = useMutation(api.admin.assignUserToCompany);
  const removeUserFromCompany = useMutation(api.admin.removeUserFromCompany);

  useEffect(() => {
    if (!isLoading && (!user || (user.userType !== 'admin' && user.userType !== 'administrator'))) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users?.filter((u) => {
      const matchesSearch =
        searchQuery === '' ||
        u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === '' || u.userType === roleFilter;

      const matchesVerification =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && u.isEmailVerified) ||
        (verificationFilter === 'unverified' && !u.isEmailVerified);

      return matchesSearch && matchesRole && matchesVerification;
    }) || [];
  }, [users, searchQuery, roleFilter, verificationFilter]);

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      userType: user.userType || 'user',
      isEmailVerified: user.isEmailVerified});
    setShowEditModal(true);
  };

  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handlePassword = (user: any) => {
    setSelectedUser(user);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const handleCompany = (user: any) => {
    setSelectedUser(user);
    setCompanyForm({ companyId: '', role: 'member' });
    setShowCompanyModal(true);
  };

  const handleSaveEdit = async () => {
    // Form validation
    if (!editForm.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!editForm.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }
    if (!editForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!editForm.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!editForm.contactNumber.trim()) {
      toast.error('Contact number is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserAdmin({
        userId: selectedUser._id,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        contactNumber: editForm.contactNumber,
        userType: editForm.userType,
        isEmailVerified: editForm.isEmailVerified});
      toast.success('User updated successfully');
      setShowEditModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      await deleteUserAdmin({ userId: selectedUser._id });
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePassword = async () => {
    if (!isPasswordValid) {
      toast.error('Please ensure your password meets all requirements');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Note: In production, you should hash the password before sending
      // This is a simplified version for demonstration
      await updateUserPasswordAdmin({
        userId: selectedUser._id,
        passwordHash: passwordForm.newPassword, // In production, hash this!
      });
      toast.success('Password updated successfully');
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setIsPasswordValid(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAddUser = async () => {
    // Form validation
    if (!addForm.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!addForm.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }
    if (!addForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!addForm.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!addForm.contactNumber.trim()) {
      toast.error('Contact number is required');
      return;
    }
    if (!addForm.password || addForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsCreating(true);
    try {
      await createUserAdmin({
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        contactNumber: addForm.contactNumber,
        passwordHash: addForm.password, // In production, hash this!
        userType: addForm.userType,
        registeredFromDomain: addForm.registeredFromDomain || 'default',
        isEmailVerified: true});
      toast.success('User created successfully');
      setShowAddModal(false);
      setAddForm({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        password: '',
        userType: 'user',
        registeredFromDomain: ''});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignCompany = async () => {
    try {
      if (!companyForm.companyId) {
        toast.error('Please select a company');
        return;
      }
      await assignUserToCompany({
        userId: selectedUser._id,
        companyId: companyForm.companyId as Id<'companies'>,
        role: companyForm.role,
        invitedBy: user?.id as Id<'users'>,
      });
      toast.success('Company access assigned successfully');
      setCompanyForm({ companyId: '', role: 'member' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign company access');
    }
  };

  const handleRemoveCompany = async (companyId: Id<'companies'>) => {
    try {
      await removeUserFromCompany({
        userId: selectedUser._id,
        companyId});
      toast.success('Company access removed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove company access');
    }
  };

  const handleVerifyEmail = async (user: any) => {
    try {
      await verifyUserEmailAdmin({ userId: user._id });
      toast.success('Email verified successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify email');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || (user.userType !== 'admin' && user.userType !== 'administrator')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm">
            <Link
              href="/admin"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Admin Panel
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Users</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                {/* Users Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                  <Users className="h-7 w-7 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                      Users
                    </h1>
                  </div>
                  <p className="text-slate-600 text-base">
                    {users?.length || 0} {users?.length === 1 ? 'user' : 'users'}
                  </p>
                </div>
              </div>

              {/* Menu Button and Add Button */}
              <div className="flex items-center gap-3">
                {defaultCompany && <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-all z-20"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Role Filter */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Filter className="h-4 w-4" />
                <span>{roleFilter || 'All Roles'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {showRoleDropdown && (
                <div className="absolute top-full mt-2 left-0 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-10 min-w-[150px]">
                  <button
                    onClick={() => { setRoleFilter(''); setShowRoleDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                  >
                    All Roles
                  </button>
                  {['admin', 'admin', 'user', 'operator', 'sales'].map((role) => (
                    <button
                      key={role}
                      onClick={() => { setRoleFilter(role as UserRole); setShowRoleDropdown(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors capitalize"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Verification Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVerificationFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  verificationFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVerificationFilter('verified')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  verificationFilter === 'verified'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setVerificationFilter('unverified')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  verificationFilter === 'unverified'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Unverified
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length > 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Companies</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-slate-500 sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        <p className="text-sm text-slate-600">{u.email}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          u.userType === 'admin' || u.userType === 'administrator'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.userType || 'user'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {u.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                              <XCircle className="h-3.5 w-3.5" />
                              Unverified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                        <span className="text-sm text-slate-600">
                          {userCompanyCountMap[u._id] || 0}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-end gap-1">
                          {!u.isEmailVerified && (
                            <button
                              onClick={() => handleVerifyEmail(u)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Verify Email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePassword(u)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            title="Change Password"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCompany(u)}
                            className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                            title="Manage Companies"
                          >
                            <Building2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete User"
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
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery || roleFilter ? 'No users found' : 'No users yet'}
            </h3>
            <p className="text-slate-600">
              {searchQuery || roleFilter
                ? 'Try adjusting your search criteria'
                : 'Users will appear here when they are created'}
            </p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-4 sticky top-0">
              <h3 className="text-lg font-bold text-white">Add New User</h3>
              <p className="text-sm text-white/70">Create a new user account</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={addForm.lastName}
                    onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={addForm.contactNumber}
                  onChange={(e) => setAddForm({ ...addForm, contactNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={addForm.userType}
                  onChange={(e) => setAddForm({ ...addForm, userType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="user">User</option>
                  <option value="operator">Operator</option>
                  <option value="sales">Sales</option>
                  <option value="admin">Admin</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-4 sticky top-0">
              <h3 className="text-lg font-bold text-white">Edit User</h3>
              <p className="text-sm text-white/70">Update user information</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.contactNumber}
                  onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={editForm.userType}
                  onChange={(e) => setEditForm({ ...editForm, userType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="operator">Operator</option>
                  <option value="sales">Sales</option>
                  <option value="admin">Admin</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editVerified"
                  checked={editForm.isEmailVerified}
                  onChange={(e) => setEditForm({ ...editForm, isEmailVerified: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="editVerified" className="text-sm font-medium text-slate-700">
                  Email is verified
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Change Password</h3>
              <p className="text-sm text-white/70">Set a new password for {selectedUser.firstName}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <PasswordValidator
                password={passwordForm.newPassword}
                onValidationChange={setIsPasswordValid}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ newPassword: '', confirmPassword: '' });
                    setIsPasswordValid(false);
                  }}
                  disabled={isUpdatingPassword}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePassword}
                  disabled={!isPasswordValid || passwordForm.newPassword !== passwordForm.confirmPassword || isUpdatingPassword}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Access Modal */}
      {showCompanyModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 px-6 py-4 sticky top-0">
              <h3 className="text-lg font-bold text-white">Manage Company Access</h3>
              <p className="text-sm text-white/70">{selectedUser.firstName} {selectedUser.lastName}</p>
            </div>
            <div className="p-6">
              {/* Current Access */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Current Access</h4>
                {selectedUserCompanies && selectedUserCompanies.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedUserCompanies.map((uc) => (
                      <div
                        key={uc._id}
                        className={`flex items-center justify-between p-2 rounded-lg ${uc.isActive ? 'bg-slate-50' : 'bg-red-50 opacity-60'}`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{uc.company?.name || 'Unknown Company'}</p>
                          <span className="text-xs text-slate-400">•</span>
                          <p className="text-xs text-slate-500">{uc.role}</p>
                          {!uc.isActive && <span className="text-xs text-red-600 ml-1">(Inactive)</span>}
                        </div>
                        <button
                          onClick={() => handleRemoveCompany(uc.companyId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                          title="Remove access"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No company access assigned</p>
                )}
              </div>

              {/* Add New Access */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Assign New Access</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                    <select
                      value={companyForm.companyId}
                      onChange={(e) => setCompanyForm({ ...companyForm, companyId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select a company</option>
                      {companies?.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                      value={companyForm.role}
                      onChange={(e) => setCompanyForm({ ...companyForm, role: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="member">Member</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowCompanyModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={handleAssignCompany}
                  className="flex-1 px-4 py-2.5 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 transition-all"
                >
                  Assign Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                Delete User
              </h3>
              <p className="text-slate-600 text-center mb-6">
                Are you sure you want to delete "{selectedUser.firstName} {selectedUser.lastName}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Side Sheet */}
      {defaultCompany && (
        <NavigationSideSheet
          isOpen={isSideSheetOpen}
          onClose={() => setIsSideSheetOpen(false)}
          companyId={defaultCompany._id}
          companyName={defaultCompany.name}
        />
      )}
    </div>
  );
}
