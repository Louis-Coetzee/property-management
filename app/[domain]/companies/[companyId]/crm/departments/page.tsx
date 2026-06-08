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
  GitBranch,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  Check,
  AlertTriangle,
  ChevronRight,
  Network,
} from 'lucide-react';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';

// Form validation schema
const departmentSchema = z.object({
  title: z.string().min(1, 'Department title is required').max(100, 'Department title must be less than 100 characters'),
  description: z.string().optional(),
  branchId: z.union([z.string(), z.null()]).optional(),
  isActive: z.boolean().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export default function DepartmentsPage() {
  const params = useParams();
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const companyId = params.companyId as string;

  // Queries
  const departments = useQuery(api.departments.getDepartmentsByCompany, {
    userId: user?.id as any,
    companyId: companyId as any,
  });
  const branches = useQuery(api.branches.getActiveBranchesByCompany, {
    userId: user?.id as any,
    companyId: companyId as any,
  });
  const company = useQuery(api.companies.getByCompanyId, {
    userId: user?.id as any,
    companyId: companyId as any,
  });

  // Mutations
  const createDepartment = useMutation(api.departments.createDepartment);
  const updateDepartment = useMutation(api.departments.updateDepartment);
  const deleteDepartment = useMutation(api.departments.deleteDepartment);
  const toggleDepartmentStatus = useMutation(api.departments.toggleDepartmentStatus);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      title: '',
      description: '',
      branchId: null,
      isActive: true,
    },
  });

  // Filter departments by search query
  const filteredDepartments = departments?.filter((department) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      department.title.toLowerCase().includes(searchLower) ||
      department.description?.toLowerCase().includes(searchLower) ||
      department.branchName?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Open modal for adding new department
  const handleAddNew = () => {
    setEditingDepartment(null);
    reset({
      title: '',
      description: '',
      branchId: null,
      isActive: true,
    });
    setShowModal(true);
  };

  // Open modal for editing department
  const handleEdit = (department: any) => {
    setEditingDepartment(department);
    reset({
      title: department.title,
      description: department.description || '',
      branchId: department.branchId || null,
      isActive: department.isActive,
    });
    setShowModal(true);
  };

  // Handle form submission
  const onSubmit = async (data: DepartmentFormValues) => {
    setIsSubmitting(true);
    try {
      const branchId = data.branchId && data.branchId !== 'none' ? (data.branchId as any) : undefined;

      if (editingDepartment) {
        await updateDepartment({
          userId: user?.id as any,
          departmentId: editingDepartment._id,
          title: data.title,
          description: data.description,
          branchId,
          isActive: data.isActive,
        });
        toast.success('Department updated successfully!');
      } else {
        await createDepartment({
          userId: user?.id as any,
          companyId: companyId as any,
          title: data.title,
          description: data.description,
          branchId,
          isActive: data.isActive,
        });
        toast.success('Department created successfully!');
      }
      setShowModal(false);
      setEditingDepartment(null);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (department: any) => {
    setDeletingDepartment(department);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingDepartment) return;

    setIsSubmitting(true);
    try {
      await deleteDepartment({ userId: user?.id as any, departmentId: deletingDepartment._id });
      toast.success('Department deleted successfully!');
      setShowDeleteModal(false);
      setDeletingDepartment(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (department: any) => {
    try {
      await toggleDepartmentStatus({ userId: user?.id as any, departmentId: department._id });
      toast.success(`Department ${department.isActive ? 'deactivated' : 'activated'} successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update department status.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <span className="text-slate-900 font-medium whitespace-nowrap">Departments</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-5">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Network className="h-7 w-7 text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-[#00072e] tracking-tight">
                    Departments
                  </h1>
                  <p className="text-slate-600 text-base">
                    Manage your organizational structure
                  </p>
                </div>
              </div>

              {/* Actions - Desktop: right side, Mobile: below title */}
              <div className="flex items-center gap-3 md:gap-4">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00072e] text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-[#00072e]/20 md:w-auto w-full"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add Department</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-4 mb-6">
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Departments List */}
        {departments === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="col-span-full py-16 px-5 bg-white rounded-2xl shadow-lg border border-slate-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Network className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No departments found' : 'No departments yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first department'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-4 w-4" />
                Add First Department
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((department) => (
              <div
                key={department._id}
                className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                  department.isActive
                    ? 'border-slate-200/80 hover:border-slate-300'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Gradient Header Bar */}
                <div className={`h-1.5 rounded-t-2xl ${department.isActive ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800' : 'bg-slate-300'}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                        department.isActive
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-900/20'
                          : 'bg-slate-200'
                      }`}>
                        <Network className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{department.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            department.isActive
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${department.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {department.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteClick(department)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                      title="Delete department"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Description */}
                  {department.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{department.description}</p>
                  )}

                  {/* Branch Info */}
                  <div className="mb-4">
                    {department.branchName ? (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <GitBranch className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium">{department.branchName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>Company-wide</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleEdit(department)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-all duration-200"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Department
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
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingDepartment ? 'Edit Department' : 'Add New Department'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingDepartment(null);
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
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Department Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="e.g., Sales, Human Resources, IT Support"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  placeholder="Brief description of the department's role and responsibilities"
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Branch Assignment */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Assign to Branch (Optional)
                </label>
                <div className="relative">
                  <select
                    {...register('branchId')}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all appearance-none bg-white text-slate-900"
                  >
                    <option value="none">Company-wide (not branch specific)</option>
                    {branches?.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                        {branch.isDefault ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <GitBranch className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Leave as "Company-wide" if this department applies to all branches
                </p>
              </div>

              {/* Active Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Active Status</p>
                  <p className="text-xs text-slate-600">
                    {watch('isActive')
                      ? 'Department is active and visible'
                      : 'Department is inactive and hidden'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('isActive', !watch('isActive'))}
                  className={`relative w-14 h-8 rounded-full transition-all ${
                    watch('isActive')
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600'
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
                    setEditingDepartment(null);
                    reset();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-violet-700 rounded-lg hover:from-violet-600 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : editingDepartment ? (
                    'Update Department'
                  ) : (
                    'Create Department'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingDepartment && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Remove Department</h3>
              <p className="text-slate-600 text-center mb-5">
                Are you sure you want to remove <span className="font-semibold text-slate-900">{deletingDepartment.title}</span>?
              </p>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-5">
                <p className="text-sm text-red-800">
                  This action cannot be undone. The department will be permanently removed.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingDepartment(null);
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
