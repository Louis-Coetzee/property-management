'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Lock,
  User,
  X,
  Check,
  Search,
  ChevronRight,
  Loader2,
  Shield,
  ShieldAlert} from 'lucide-react';
import { PasswordValidator } from '@/components/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const userFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  role: z.enum(['admin', 'manager', 'user'])}).refine((data) => {
  // Only validate password match if password is provided (for new users)
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ['confirmPassword']});

type UserFormData = z.infer<typeof userFormSchema>;

interface CompanyUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  isActive?: boolean;
  role?: string;
  isEmailVerified?: boolean;
  createdAt?: number;
}

export default function CRMUsersPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  // Query company
  const companies = useQuery(
    api.companies.getCompaniesByUser,
    user?.id ? { userId: user.id as any } : "skip"
  );
  const company = companies?.find(c => c?._id === companyId);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  // Mock users data (replace with actual Convex query)
  const [users, setUsers] = useState<CompanyUser[]>([
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      contactNumber: '+1 234 567 8900',
      isActive: true,
      role: 'admin',
      isEmailVerified: true,
      createdAt: Date.now() - 86400000 * 30},
    {
      _id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@example.com',
      contactNumber: '+1 234 567 8901',
      isActive: true,
      role: 'manager',
      isEmailVerified: true,
      createdAt: Date.now() - 86400000 * 15},
    {
      _id: '3',
      firstName: 'Mike',
      lastName: 'Williams',
      email: 'mike@example.com',
      contactNumber: '+1 234 567 8902',
      isActive: false,
      role: 'user',
      isEmailVerified: false,
      createdAt: Date.now() - 86400000 * 7},
  ]);

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }} = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      password: '',
      confirmPassword: '',
      role: 'user' as const}});

  const watchedPassword = watch('password', '');

  // Filter users based on search
  const filteredUsers = users.filter(u =>
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = async (data: any) => {
    if (!isPasswordValid) {
      toast.error('Please ensure your password meets all requirements');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Call actual Convex action to create user
      // await createUserAction({
      //   firstName: data.firstName,
      //   lastName: data.lastName,
      //   email: data.email,
      //   contactNumber: data.contactNumber,
      //   password: data.password!,
      //   domain: domain,
      //   companyId: companyId,
      //   role: data.role,
      // });

      // Mock user creation for now
      const newUser: CompanyUser = {
        _id: Date.now().toString(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        contactNumber: data.contactNumber,
        isActive: true,
        role: data.role,
        isEmailVerified: false,
        createdAt: Date.now()};

      setUsers([newUser, ...users]);
      setShowAddModal(false);
      reset();
      setIsPasswordValid(false);
      toast.success('User created successfully! Verification email sent.');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (data: any) => {
    setIsSubmitting(true);

    try {
      // TODO: Call actual Convex mutation to update user
      // await updateUserAction({
      //   userId: selectedUser!._id,
      //   ...data,
      // });

      // Mock user update for now
      setUsers(users.map(u =>
        u._id === selectedUser!._id
          ? { ...u, firstName: data.firstName, lastName: data.lastName, email: data.email, contactNumber: data.contactNumber, role: data.role }
          : u
      ));

      setShowEditModal(false);
      setSelectedUser(null);
      reset();
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);

    try {
      // TODO: Call actual Convex mutation to delete user
      // await deleteUserAction({ userId: selectedUser._id });

      // Mock user deletion for now
      setUsers(users.filter(u => u._id !== selectedUser._id));
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      // TODO: Call actual Convex mutation to toggle user status
      // await toggleUserStatusAction({ userId });

      // Mock toggle for now
      setUsers(users.map(u =>
        u._id === userId ? { ...u, isActive: !u.isActive } : u
      ));
      toast.success('User status updated');
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const openEditModal = (user: CompanyUser) => {
    setSelectedUser(user);
    setValue('firstName', user.firstName);
    setValue('lastName', user.lastName);
    setValue('email', user.email);
    setValue('contactNumber', user.contactNumber);
    setValue('role', (user.role === 'admin' || user.role === 'manager' || user.role === 'user') ? user.role : 'user');
    setValue('password', '');
    setValue('confirmPassword', '');
    setShowEditModal(true);
  };

  const openDeleteModal = (user: CompanyUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading users...</p>
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
            <span className="text-slate-900 font-medium">Users</span>
          </div>

          {/* Title */}
          <div className="pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h1>
                  <p className="text-slate-600 mt-1">Manage team members and their access</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-5 w-5" />
                <span>Add User</span>
              </button>
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
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Users List */}
        {filteredUsers.length > 0 ? (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-slate-500" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {user.firstName} {user.lastName}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4" />
                            <span>{user.contactNumber}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-4 w-4" />
                            <span className="capitalize">{user.role || 'User'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Toggle Status */}
                      <button
                        onClick={() => handleToggleActive(user._id)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                          user.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                          user.isActive ? 'right-1' : 'left-1'
                        }`} />
                      </button>

                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="p-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                {!user.isEmailVerified && (
                  <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      Verification email pending
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No users found' : 'No users yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first team member'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-5 w-5" />
                Add First User
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Add New User</h3>
                    <p className="text-sm text-slate-500">Create a team member account</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    reset();
                    setIsPasswordValid(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleAddUser)} className="p-6 space-y-5">
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
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
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
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
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
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
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
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.contactNumber && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.contactNumber.message}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 bg-white"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Create a password"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.password.message}</p>
                )}
                <PasswordValidator
                  password={watchedPassword || ''}
                  onValidationChange={setIsPasswordValid}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    reset();
                    setIsPasswordValid(false);
                  }}
                  className="px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isPasswordValid || isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Edit2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Edit User</h3>
                    <p className="text-sm text-slate-500">Update user information</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    reset();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleEditUser)} className="p-6 space-y-5">
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
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
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
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.contactNumber && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.contactNumber.message}</p>
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
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Password (Optional for edit) */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  New Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Enter new password to change"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.password.message}</p>
                )}
                {watchedPassword && (
                  <PasswordValidator
                    password={watchedPassword}
                    onValidationChange={setIsPasswordValid}
                  />
                )}
              </div>

              {/* Confirm Password */}
              {watchedPassword && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1.5">{errors.confirmPassword.message}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    reset();
                  }}
                  className="px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6">
              {/* Warning Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete User</h3>
              <p className="text-slate-600 text-center mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</span>?
              </p>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <p className="text-sm text-red-800 leading-relaxed">
                  This action cannot be undone. The user will be permanently removed from the system.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
