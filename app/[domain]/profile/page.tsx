'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuthGuard, useAuth } from '../AuthProvider';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import toast from 'react-hot-toast';
import { getProfileUpdateError, getPasswordChangeError, getResendVerificationError } from '@/utils/errorHandler';
import MediaLibraryModal from '@/components/media-library-modal';
import { Plus } from 'lucide-react';

// Validation schemas
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  contactNumber: z.string().regex(/^[0-9]{7,15}$/, 'Contact number must be 7-15 digits')});

// Validation schemas
const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your new password')}).refine((data) => data.currentPassword === data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']});

export default function ProfilePage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const { logout, refreshUser, domain } = useAuth();
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Form setup
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      contactNumber: user?.contactNumber || ''}});

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''}});

  // Actions
  const updateProfileAction = useAction(api.authActions.updateProfileAction);
  const changePasswordAction = useAction(api.authActions.changePasswordAction);
  const sendVerificationEmailAction = useAction(api.email.sendVerificationEmail);

  const handleProfileUpdate = async (data: any) => {
    if (!user) return;
    try {
      await updateProfileAction({
        userId: user.id as Id<"users">,
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber});

      toast.success('Profile updated successfully');
      await refreshUser();
    } catch (error) {
      throw error;
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    try {
      const result = await changePasswordAction({
        userId: user.id as Id<"users">,
        currentPassword: passwordForm.getValues('currentPassword'),
        newPassword: passwordForm.getValues('newPassword')});

      toast.success(result.message || 'Password changed successfully');
      passwordForm.reset();
      setShowPasswordFields(false);
    } catch (error) {
      throw error;
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    try {
      const result = await sendVerificationEmailAction({
        email: user.email,
        firstName: user.firstName,
        verificationToken: '',
        domain: domain || ''});

      toast.success(result.message || 'Verification email sent');
    } catch (error) {
      throw error;
    }
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Spacer */}
      <div className="h-16"></div>

      <div className="mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account information and settings</p>
          </div>

          {/* User Profile Image - Centered */}
          <div className="flex justify-center mb-8">
            {user?.profileImage ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
                <button
                  onClick={() => setIsMediaModalOpen(true)}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                  title="Change profile picture"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-3xl font-bold text-white">
                    {user?.firstName?.[0]} {user?.lastName?.[0]}
                  </span>
                </div>
                <button
                  onClick={() => setIsMediaModalOpen(true)}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                  title="Add profile picture"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex gap-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'profile'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'security'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Security
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            {activeTab === 'profile' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleProfileUpdate(profileForm.getValues());
              }} className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      {...profileForm.register('firstName')}
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-gray-50"
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      {...profileForm.register('lastName')}
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-gray-50"
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    value={user?.email || ''}
                    type="email"
                    readOnly
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <input
                    {...profileForm.register('contactNumber')}
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-gray-50"
                  />
                  {profileForm.formState.errors.contactNumber && (
                    <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.contactNumber.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/40 transition-all duration-200"
                >
                  Save Changes
                </button>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                {!showPasswordFields ? (
                  <button
                    onClick={() => setShowPasswordFields(true)}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/40 transition-all duration-200"
                  >
                    Change Password
                  </button>
                ) : (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handlePasswordChange();
                  }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        {...passwordForm.register('currentPassword')}
                        type="password"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-gray-50"
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        {...passwordForm.register('newPassword')}
                        type="password"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-gray-50"
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        {...passwordForm.register('confirmPassword')}
                        type="password"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-gray-50"
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="submit"
                        className="flex-1 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/40 transition-all duration-200"
                      >
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordFields(false);
                          passwordForm.reset();
                        }}
                        className="px-8 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        userId={user?.id || ''}
        onSelectImage={(url) => {
          // Handle profile image selection
          console.log('Selected profile image:', url);
          // TODO: Update user profile image with the selected URL
        }}
        open={isMediaModalOpen}
        onOpenChange={(open) => setIsMediaModalOpen(open)}
      />
    </div>
  );
}
