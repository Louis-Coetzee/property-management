'use client';

import { useState } from 'react';
import { useAuthGuard, useAuth } from '@/app/[domain]/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Building2,
  ArrowLeft,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
  Settings,
  Check,
  Wrench,
  Globe,
  Car,
  ShoppingBag,
  Calendar as CalendarIcon,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';

// App configuration
const appConfigs = [
  { appKey: 'businessTools', name: 'Business Tools', icon: Wrench, gradient: 'from-blue-500 to-blue-600' },
  { appKey: 'websites', name: 'Website Builder', icon: Globe, gradient: 'from-purple-500 to-purple-600' },
  { appKey: 'onlineStore', name: 'Online Store', icon: ShoppingBag, gradient: 'from-orange-500 to-orange-600' },
  { appKey: 'bookingsApp', name: 'Booking System', icon: CalendarIcon, gradient: 'from-cyan-500 to-cyan-600' },
  { appKey: 'vehicleDealership', name: 'Vehicle Dealership', icon: Car, gradient: 'from-emerald-500 to-emerald-600' },
  { appKey: 'realEstate', name: 'Real Estate', icon: Home, gradient: 'from-teal-500 to-teal-600' },
];

export default function AdminCompaniesPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const { domain } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [togglingApp, setTogglingApp] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    enabled: true});

  // Get user's companies for navigation
  const userCompanies = useQuery(api.companies.getCompaniesByUser, {
    userId: user?.id as any,
  });
  const defaultCompany = userCompanies?.[0];

  // Query all companies
  const companies = useQuery(api.admin.getAllCompanies);

  // Derive selectedCompany from companies query for reactive updates
  const selectedCompany = companies?.find(c => c._id === selectedCompanyId);

  // Mutation for toggling apps
  const toggleApp = useMutation(api.companies.toggleCompanyApp);

  const handleApps = (company: any) => {
    setSelectedCompanyId(company._id);
    setShowAppsModal(true);
  };

  const handleToggleApp = async (appKey: string, enabled: boolean) => {
    if (!selectedCompany || !user) return;

    setTogglingApp(appKey);
    try {
      await toggleApp({
        userId: user.id as any,
        companyId: selectedCompany._id as any,
        appKey,
        enabled,
      });
      toast.success(`${appConfigs.find(a => a.appKey === appKey)?.name} ${enabled ? 'enabled' : 'disabled'} for ${selectedCompany.name}`);
    } catch (error) {
      console.error('Error toggling app:', error);
      toast.error('Failed to update app status');
    } finally {
      setTogglingApp(null);
    }
  };

  useEffect(() => {
    if (!isLoading && (!user || (user.userType !== 'admin' && user.userType !== 'administrator'))) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleEdit = (company: any) => {
    setSelectedCompanyId(company._id);
    setEditForm({
      name: company.name,
      description: company.description || '',
      enabled: company.enabled});
    setShowEditModal(true);
  };

  const handleDelete = (company: any) => {
    setSelectedCompanyId(company._id);
    setShowDeleteModal(true);
  };

  const filteredCompanies = companies?.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
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
            <span className="text-slate-900 font-medium">Companies</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                {/* Companies Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                  <Building2 className="h-7 w-7 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                      Companies
                    </h1>
                  </div>
                  <p className="text-slate-600 text-base">
                    {companies?.length || 0} {companies?.length === 1 ? 'company' : 'companies'}
                  </p>
                </div>
              </div>

              {/* Menu Button */}
              {defaultCompany && <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
            />
          </div>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company._id}
                className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {company.enabled ? (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="h-3 w-3" />
                            <span className="text-xs">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400">
                            <XCircle className="h-3 w-3" />
                            <span className="text-xs">Disabled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleApps(company)}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                      title="Manage Apps"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(company)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(company)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {company.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {company.description}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Created {formatDistanceToNow(company.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <User className="h-3.5 w-3.5" />
                    <span>Owner</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No companies found' : 'No companies yet'}
            </h3>
            <p className="text-slate-600">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Companies will appear here when they are created'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Edit Company</h3>
              <p className="text-sm text-white/70">Update company information</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={editForm.enabled}
                    onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-slate-700">
                    Company is enabled
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success('Company updated successfully');
                    setShowEditModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                Delete Company
              </h3>
              <p className="text-slate-600 text-center mb-6">
                Are you sure you want to delete "{selectedCompany.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success('Company deleted successfully');
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apps Management Modal */}
      {showAppsModal && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Manage Apps</h3>
                  <p className="text-sm text-white/70">{selectedCompany.name}</p>
                </div>
                <button
                  onClick={() => setShowAppsModal(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Apps List */}
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {appConfigs.map((app) => {
                const Icon = app.icon;
                const isEnabled = (selectedCompany as any)?.enabledApps?.[app.appKey]?.enabled || false;
                const isToggling = togglingApp === app.appKey;

                return (
                  <div
                    key={app.appKey}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isEnabled
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-sm`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{app.name}</h4>
                        <p className="text-xs text-slate-500">
                          {isEnabled ? 'Enabled for this company' : 'Not enabled'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleApp(app.appKey, !isEnabled)}
                      disabled={isToggling}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                        isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                      } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isToggling ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-3 w-3 animate-spin text-white" />
                        </div>
                      ) : (
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                            isEnabled ? 'right-1' : 'left-1'
                          }`}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
              <button
                onClick={() => setShowAppsModal(false)}
                className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all"
              >
                Done
              </button>
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
