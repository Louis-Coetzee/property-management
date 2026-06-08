'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import {
  Wrench,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { NavigationMenuButton, NavigationSideSheet } from '@/components/navigation/NavigationSideSheet';
import toast from 'react-hot-toast';

interface AssignedService {
  _id: string;
  consultantId: string;
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  servicePrice: number;
  serviceDuration?: number;
  isActive: boolean;
}

interface AvailableService {
  _id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
}

export default function ConsultantServicesPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;
  const consultantId = params.consultantId as string;

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const consultantData = useQuery(api.consultants.getById, {
    userId: user?.id as any,
    consultantId: consultantId as Id<'consultants'>,
  });

  const assignedServices = useQuery(api.consultants.listServicesByConsultant, {
    userId: user?.id as any,
    consultantId: consultantId as Id<'consultants'>,
  });

  const availableServices = useQuery(api.consultants.listAvailableServices, {
    userId: user?.id as any,
    companyId: companyId as Id<'companies'>,
    consultantId: consultantId as Id<'consultants'>,
  });

  const addService = useMutation(api.consultants.addService);
  const removeService = useMutation(api.consultants.removeService);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddService = async (serviceId: string) => {
    setIsSubmitting(true);
    try {
      await addService({
        userId: user?.id as Id<'users'>,
        consultantId: consultantId as Id<'consultants'>,
        serviceId: serviceId as Id<'services'>,
      });
      toast.success('Service added successfully');
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Error adding service:', error);
      toast.error(error?.message || 'Failed to add service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveService = async (consultantServiceId: string) => {
    setIsSubmitting(true);
    try {
      await removeService({
        userId: user?.id as Id<'users'>,
        consultantServiceId: consultantServiceId as Id<'consultantServices'>,
      });
      toast.success('Service removed successfully');
    } catch (error) {
      console.error('Error removing service:', error);
      toast.error('Failed to remove service');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !consultantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const consultant = consultantData as any;
  const assigned: AssignedService[] = assignedServices || [];
  const available: AvailableService[] = availableServices || [];

  const filteredAvailable = available.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              {company?.name || 'Company'}
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/crm/consultants`} className="text-slate-500 hover:text-slate-700 transition-colors">
              Consultants
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">{consultant.userName}</span>
          </div>

          {/* Title */}
          <div className="pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                  <Wrench className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Services</h1>
                  <p className="text-slate-600 mt-1">Manage services for {consultant.userName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all"
                >
                  <Plus className="h-5 w-5" />
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assigned Services */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Assigned Services</h2>
          {assigned.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assigned.map((service) => (
                <div
                  key={service._id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{service.serviceName}</h3>
                        {service.serviceDuration && (
                          <p className="text-xs text-slate-500">{service.serviceDuration} min</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveService(service._id)}
                      disabled={isSubmitting}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Remove service"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {service.serviceDescription && (
                    <p className="text-sm text-slate-600 mb-3">{service.serviceDescription}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-lg font-bold text-slate-900">R{service.servicePrice}</span>
                    <span className="text-xs text-emerald-600 font-medium">Active</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Services Assigned</h3>
              <p className="text-slate-600 mb-4">Add services that this consultant can provide.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Service
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Service</h3>
                  <p className="text-sm text-slate-500">Select a service to assign</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchQuery('');
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-slate-100">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Services List */}
            <div className="p-6 overflow-y-auto max-h-96">
              {filteredAvailable.length > 0 ? (
                <div className="space-y-3">
                  {filteredAvailable.map((service) => (
                    <button
                      key={service._id}
                      onClick={() => handleAddService(service._id)}
                      disabled={isSubmitting}
                      className="w-full p-4 text-left bg-slate-50 hover:bg-amber-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-900 group-hover:text-amber-700">
                            {service.name}
                          </h4>
                          {service.description && (
                            <p className="text-sm text-slate-500 mt-1">{service.description}</p>
                          )}
                          {service.duration && (
                            <p className="text-xs text-slate-400 mt-1">{service.duration} min</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-900">R{service.price}</span>
                          <Plus className="h-4 w-4 text-amber-500 mt-1 ml-auto" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">
                    {searchQuery ? 'No services match your search' : 'No available services to add'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-amber-600 hover:text-amber-700 text-sm"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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