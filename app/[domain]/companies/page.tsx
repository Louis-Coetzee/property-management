'use client';

// NOTE: All links within [domain] routes should NOT include ${domain} in hrefs
// Next.js App Router automatically handles the domain segment
// WRONG: href={`/${domain}/companies/${id}`}
// RIGHT: href={`/companies/${id}`}

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../AuthProvider';
import Link from 'next/link';
import { Building2, Plus, Edit2, Trash2, X, Check, ArrowRight, Grid3X3, Settings } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import toast from 'react-hot-toast';

export default function CompaniesPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const domain = params.domain as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const SUBDOMAIN_BASE = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subdomain: '',
    enabled: true,
    branchName: ''});

  // Query companies - skip if user not loaded
  const companies = useQuery(
    api.companies.getCompaniesByUser,
    user?.id ? { userId: user.id as any } : "skip"
  );

  // Mutations
  const createCompany = useMutation(api.companies.createCompany);
  const updateCompany = useMutation(api.companies.updateCompany);
  const deleteCompany = useMutation(api.companies.deleteCompany);
  const toggleCompany = useMutation(api.companies.toggleCompany);

  // Filter companies based on search
  const filteredCompanies = companies ? companies.filter((company) => {
    if (!company) return false;
    return company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.description && company.description.toLowerCase().includes(searchQuery.toLowerCase()));
  }) : [];

  const handleCreateCompany = async () => {
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const subdomainValue = formData.subdomain || formData.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 63);

      await createCompany({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        enabled: formData.enabled,
        userId: user?.id as any,
        subdomain: subdomainValue,
        initialBranch: {
          name: formData.branchName.trim() || 'Main Branch',
          address: undefined,
          city: undefined,
          state: undefined,
          zipCode: undefined,
          country: undefined,
          phone: undefined,
          email: undefined,
        },
      });

      setShowCreateModal(false);
      setFormData({ name: '', description: '', subdomain: '', enabled: true, branchName: '' });
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCompany = async () => {
    if (!selectedCompany || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateCompany({
        companyId: selectedCompany._id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        subdomain: formData.subdomain || undefined,
        enabled: formData.enabled,
        userId: user?.id as any
      });

      setShowEditModal(false);
      setSelectedCompany(null);
      setFormData({ name: '', description: '', subdomain: '', enabled: true, branchName: '' });
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (company: any) => {
    setSelectedCompany(company);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;

    setIsSubmitting(true);
    try {
      await deleteCompany({
        companyId: selectedCompany._id,
        userId: user?.id as any
      });

      setShowDeleteModal(false);
      setSelectedCompany(null);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Error deleting company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEnabled = async (companyId: string) => {
    const company = companies?.filter((c): c is NonNullable<typeof c> => c !== null).find(c => c._id === companyId);
    if (!company) return;

    const newEnabledState = !company.enabled;

    try {
      await toggleCompany({
        companyId: companyId as any,
        userId: user?.id as any
      });

      toast.success(
        newEnabledState
          ? `${company.name} has been enabled`
          : `${company.name} has been disabled`,
        {
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          },
          iconTheme: {
            primary: newEnabledState ? '#10b981' : '#94a3b8',
            secondary: '#fff',
          },
        }
      );
    } catch (error) {
      console.error('Error toggling company:', error);
      toast.error('Failed to update company status', {
        duration: 3000,
        style: {
          background: '#fff',
          color: '#1e293b',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        },
      });
    }
  };

  const openEditModal = (company: any) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      description: company.description || '',
      subdomain: company.subdomain || '',
      enabled: company.enabled,
      branchName: ''});
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Companies</h1>
              <p className="text-slate-600 mt-1">Manage your business entities</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all duration-200 shadow-lg shadow-slate-900/20"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">New Company</span>
              <span className="sm:hidden text-sm">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {companies === undefined && (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          </div>
        )}

        {/* Search Bar and Companies Grid */}
        {companies !== undefined && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Companies Grid */}
            {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => {
              if (!company) return null;
              return (
              <div
                key={company._id}
                className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                  company.enabled
                    ? 'border-slate-200/80 hover:border-slate-300'
                    : 'border-slate-200 opacity-70'
                }`}
              >
                {/* Gradient Header Bar */}
                <div className={`h-1.5 rounded-t-2xl ${company.enabled ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800' : 'bg-slate-300'}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                        company.enabled
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-900/20'
                          : 'bg-slate-200'
                      }`}>
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{company.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            company.enabled
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${company.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {company.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Switch & Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteClick(company)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete company"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleEnabled(company._id)}
                        className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                          company.enabled ? 'bg-slate-800' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                          company.enabled ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {company.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{company.description}</p>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    {/* Row 1 */}
                    <div className="flex gap-2">
                      <Link
                        href={`/companies/${company._id}/manage`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border-2 border-slate-200 hover:text-slate-800 hover:border-slate-500 hover:bg-slate-50 rounded-lg transition-all duration-200"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        Manage
                      </Link>
                      <div className="flex-1 glow-border-wrapper-orange">
                        <Link
                          href={`/companies/${company._id}/apps`}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:text-orange-600 rounded-lg transition-all duration-200 w-full"
                        >
                          <Grid3X3 className="h-3.5 w-3.5" />
                          Apps
                        </Link>
                      </div>
                    </div>
                    {/* Row 2 */}
                    <div className="flex gap-2">
                      <Link
                        href={`/companies/${company._id}/settings`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border-2 border-slate-200 hover:text-slate-800 hover:border-slate-500 hover:bg-slate-50 rounded-lg transition-all duration-200"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Settings
                      </Link>
                      <button
                        onClick={() => openEditModal(company)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border-2 border-slate-200 hover:text-slate-800 hover:border-slate-500 hover:bg-slate-50 rounded-lg transition-all duration-200"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No companies found' : 'No companies yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first company'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-4 w-4" />
                Create Company
              </button>
            )}
          </div>
        )}
        </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">New Company</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', description: '', subdomain: '', enabled: true, branchName: '' });
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Acme Corporation"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this company"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Subdomain <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.subdomain || formData.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 63)}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').substring(0, 63) })}
                    placeholder="my-company"
                    maxLength={63}
                    className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  <span className="px-4 py-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-sm text-slate-500">
                    .{SUBDOMAIN_BASE}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Your company's web address: https://{(formData.subdomain || formData.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 63)) || 'subdomain'}.{SUBDOMAIN_BASE}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Initial Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  placeholder="e.g., Main Branch, Headquarters, Store 1"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This will create the first branch for your company
                </p>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Enable Company</label>
                  <p className="text-xs text-slate-500 mt-0.5">Allow this company to be used</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    formData.enabled ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                    formData.enabled ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 shrink-0 border-t border-slate-100 -mx-6 -mb-6 px-6 pb-6 bg-white">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '', subdomain: '', enabled: true, branchName: '' });
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCompany}
                  disabled={!formData.name.trim() || isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  {isSubmitting ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Edit2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Company</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCompany(null);
                  setFormData({ name: '', description: '', subdomain: '', enabled: true, branchName: '' });
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Acme Corporation"
                  maxLength={100}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this company"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Subdomain <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.subdomain || ''}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').substring(0, 63) })}
                    placeholder="my-company"
                    maxLength={63}
                    className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  <span className="px-4 py-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-sm text-slate-500">
                    .{SUBDOMAIN_BASE}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Enable Company</label>
                  <p className="text-xs text-slate-500 mt-0.5">Allow this company to be used</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    formData.enabled ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                    formData.enabled ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 shrink-0 border-t border-slate-100 -mx-6 -mb-6 px-6 pb-6 bg-white">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCompany(null);
                    setFormData({ name: '', description: '', subdomain: '', enabled: true, branchName: '' });
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCompany}
                  disabled={!formData.name.trim() || isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  {isSubmitting ? 'Updating...' : 'Update Company'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCompany && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete Company</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCompany(null);
                  setDeleteConfirmText('');
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Confirm Deletion</p>
                  <p className="text-sm text-slate-600">
                    Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedCompany.name}</span>?
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 leading-relaxed">
                  This action cannot be undone. The company will be permanently removed from your account.
                </p>
              </div>

              {/* Confirmation Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Type <span className="text-red-600">Delete company {selectedCompany.name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={`Delete company ${selectedCompany.name}`}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCompany(null);
                    setDeleteConfirmText('');
                  }}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCompany}
                  disabled={isSubmitting || deleteConfirmText !== `Delete company ${selectedCompany.name}`}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-200"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Company'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
