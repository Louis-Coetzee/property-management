'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Loader2,
  X,
  ChevronRight} from 'lucide-react';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';

// Form validation schema
const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(100, 'Branch name must be less than 100 characters'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  isActive: z.boolean().optional()});

type BranchFormValues = z.infer<typeof branchSchema>;

export default function BranchesPage() {
  const params = useParams();
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const companyId = params.companyId as string;

  // Queries
  const branches = useQuery(api.branches.getBranchesByCompany, {
    userId: user?.id as any,
    companyId: companyId as any});
  const company = useQuery(api.companies.getByCompanyId, {
    userId: user?.id as any,
    companyId: companyId as any});

  // Mutations
  const createBranch = useMutation(api.branches.createBranch);
  const updateBranch = useMutation(api.branches.updateBranch);
  const deleteBranch = useMutation(api.branches.deleteBranch);
  const toggleBranchStatus = useMutation(api.branches.toggleBranchStatus);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }} = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phone: '',
      email: '',
      isActive: true}});

  // Filter branches by search query
  const filteredBranches = branches?.filter((branch) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      branch.name.toLowerCase().includes(searchLower) ||
      branch.address?.toLowerCase().includes(searchLower) ||
      branch.city?.toLowerCase().includes(searchLower) ||
      branch.state?.toLowerCase().includes(searchLower) ||
      branch.email?.toLowerCase().includes(searchLower) ||
      branch.phone?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Open modal for adding new branch
  const handleAddNew = () => {
    setEditingBranch(null);
    reset({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phone: '',
      email: '',
      isActive: true});
    setShowModal(true);
  };

  // Open modal for editing branch
  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    reset({
      name: branch.name,
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      zipCode: branch.zipCode || '',
      country: branch.country || '',
      phone: branch.phone || '',
      email: branch.email || '',
      isActive: branch.isActive});
    setShowModal(true);
  };

  // Handle form submission
  const onSubmit = async (data: BranchFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingBranch) {
        await updateBranch({
          userId: user?.id as any,
          branchId: editingBranch._id,
          ...data});
        toast.success('Branch updated successfully!');
      } else {
        await createBranch({
          userId: user?.id as any,
          companyId: companyId as any,
          ...data});
        toast.success('Branch created successfully!');
      }
      setShowModal(false);
      setEditingBranch(null);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save branch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (branch: any) => {
    setDeletingBranch(branch);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingBranch) return;

    setIsSubmitting(true);
    try {
      await deleteBranch({ userId: user?.id as any, branchId: deletingBranch._id });
      toast.success('Branch deleted successfully!');
      setShowDeleteModal(false);
      setDeletingBranch(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete branch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (branch: any) => {
    try {
      await toggleBranchStatus({ userId: user?.id as any, branchId: branch._id });
      toast.success(`Branch ${branch.isActive ? 'deactivated' : 'activated'} successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update branch status.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm overflow-x-auto">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              Companies
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              {company?.name}
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              CRM
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap">Branches</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-5">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Building2 className="h-7 w-7 text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-[#00072e] tracking-tight">
                    Branches
                  </h1>
                  <p className="text-slate-600 text-base">
                    Manage your company locations
                  </p>
                </div>
              </div>

              {/* Actions - Desktop: right side, Mobile: below title */}
              <div className="flex items-center gap-3 md:gap-4">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20 md:w-auto w-full"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add Branch</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-4 mb-6">
          <input
            type="text"
            placeholder="Search branches by name, address, city, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Branches List */}
        {branches === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="col-span-full py-16 px-5 bg-white rounded-2xl shadow-lg border border-slate-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No branches found' : 'No branches yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first branch'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-4 w-4" />
                Add First Branch
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map((branch) => (
              <div
                key={branch._id}
                className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                  branch.isActive !== false
                    ? 'border-slate-200/80 hover:border-slate-300'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Gradient Header Bar */}
                <div className={`h-1.5 rounded-t-2xl ${branch.isActive !== false ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800' : 'bg-slate-300'}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                        branch.isActive !== false
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-900/20'
                          : 'bg-slate-200'
                      }`}>
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{branch.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            branch.isActive !== false
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${branch.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {branch.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteClick(branch)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                      title="Delete branch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Address Info */}
                  <div className="mb-4 space-y-1">
                    {branch.address && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{branch.address}</span>
                      </div>
                    )}
                    {(branch.city || branch.state) && (
                      <p className="text-sm text-slate-500 pl-5 truncate">
                        {[branch.city, branch.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{branch.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleEdit(branch)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-all duration-200"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Branch
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingBranch(null);
                    reset();
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g., Downtown Branch, North Location"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="e.g., 123 Main Street"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* City, State, Zip Code Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    {...register('city')}
                    placeholder="City"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    {...register('state')}
                    placeholder="State"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Zip/Postal Code
                  </label>
                  <input
                    type="text"
                    {...register('zipCode')}
                    placeholder="Zip Code"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  {...register('country')}
                  placeholder="e.g., South Africa, United States"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Phone and Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="e.g., +27 11 123 4567"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="e.g., branch@example.com"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Active Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Active Status</p>
                  <p className="text-sm text-slate-600">
                    {watch('isActive')
                      ? 'Branch is active and visible'
                      : 'Branch is inactive and hidden'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('isActive', !watch('isActive'))}
                  className={`relative w-14 h-8 rounded-full transition-all ${
                    watch('isActive')
                      ? 'bg-slate-900'
                      : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                      watch('isActive') ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBranch(null);
                    reset();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? 'Saving...' : editingBranch ? 'Update Branch' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingBranch && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Remove Branch</h3>
              <p className="text-slate-600 text-center mb-5">
                Are you sure you want to remove <span className="font-semibold text-slate-900">"{deletingBranch.name}"</span>?
              </p>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-5">
                <p className="text-sm text-red-800">
                  This action cannot be undone. The branch will be permanently removed.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingBranch(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side Sheet Overlay */}
      {isSideSheetOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setIsSideSheetOpen(false)}
        />
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
