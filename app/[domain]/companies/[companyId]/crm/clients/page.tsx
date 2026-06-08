'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import {
  UserCircle as UserGroup,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  User,
  X,
  ChevronRight,
  Building2,
  Check,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';
import { Id } from '@/convex/_generated/dataModel';

const clientFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  companyName: z.string().optional(),
  address: z.string().optional(),
});

// Edit form schema - no password required
const clientEditFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  companyName: z.string().optional(),
  address: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;
type ClientEditFormData = z.infer<typeof clientEditFormSchema>;

interface Client {
  _id: string;
  companyName: string;
  contactName: string;
  email: string;
  contactNumber: string;
  address?: string;
  industry?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: number;
}

export default function CRMClientsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const domain = params.domain as string;
  const companyId = params.companyId as string;

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Query clients from database
  const clientsData = useQuery(
    api.clients.getClientsByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Actions
  const createClientWithUser = useAction(api.clients.createClientWithUser);
  // Mutations
  const updateClient = useMutation(api.clients.updateClient);
  const deleteClient = useMutation(api.clients.deleteClient);

  const clients: Client[] = (clientsData || []) as Client[];

  // Email options state
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }} = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      companyName: '',
      address: '',
    }});

  // Edit form setup (no password required)
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    watch: watchEdit,
    formState: { errors: editErrors },
  } = useForm<ClientEditFormData>({
    resolver: zodResolver(clientEditFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      companyName: '',
      address: '',
    },
  });

  // Filter clients based on search
  const filteredClients = clients.filter(c =>
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddClient = async (data: ClientFormData) => {
    if (!user?.id || !companyId) {
      toast.error('User or company not found');
      return;
    }

    const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    
    setIsSubmitting(true);

    try {
      const result = await createClientWithUser({
        userId: user.id as any,
        companyId: companyId as any,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        contactNumber: data.contactNumber,
        companyName: data.companyName || '',
        address: data.address,
        password: generatedPassword,
        sendWelcomeEmail,
        requireEmailVerification,
        requirePasswordChange,
      });

      const emailStatus = requireEmailVerification 
        ? ' They will need to verify their email to access the portal.' 
        : ' Their email has been verified automatically.';
      const welcomeStatus = sendWelcomeEmail 
        ? ' A welcome email has been sent to them.' 
        : '';
      const passwordChangeStatus = requirePasswordChange
        ? ' They will be required to change their password upon first login.'
        : '';

      setSuccessMessage(`Client "${data.companyName}" has been created successfully!${welcomeStatus}${emailStatus}${passwordChangeStatus}`);
      setShowSuccessModal(true);
      setShowAddModal(false);
      reset();
      setSendWelcomeEmail(false);
      setRequireEmailVerification(false);
      setRequirePasswordChange(false);
    } catch (error: any) {
      console.error('Error creating client:', error);
      
      // Try to extract the actual error message - handle different error formats
      let errorMessage = 'Failed to add client. Please try again.';
      
      // Get error as string
      const errorStr = String(error?.message || error || '');
      console.log('Error string:', errorStr);
      
      // Direct string matching for specific error codes
      if (errorStr.includes('EXISTING_USER:')) {
        const match = errorStr.match(/EXISTING_USER:\s*(.+?)(?:\s+at\s|$)/);
        errorMessage = match?.[1] || 'A user account with this email already exists. Please use a different email address.';
      } else if (errorStr.includes('DUPLICATE_CLIENT:')) {
        const match = errorStr.match(/DUPLICATE_CLIENT:\s*(.+?)(?:\s+at\s|$)/);
        errorMessage = match?.[1] || 'A client with this email already exists in this company.';
      } else if (errorStr.includes('NOT_FOUND')) {
        errorMessage = 'Company not found. Please refresh the page and try again.';
      } else if (errorStr.includes('permission') || errorStr.includes('Permission')) {
        errorMessage = 'You do not have permission to add clients. Please contact your administrator.';
      } else if (errorStr.includes('Validation') || errorStr.includes('validation')) {
        errorMessage = 'Invalid data provided. Please check all required fields and try again.';
      } else if (errorStr.includes('duplicate') || errorStr.includes('Duplicate')) {
        errorMessage = 'A record with this information already exists. Please use unique values.';
      } else if (errorStr.includes('Uncaught Error:')) {
        const match = errorStr.match(/Uncaught Error:\s*(.+?)(?:\n|$|at handler)/);
        if (match) {
          errorMessage = match[1].trim();
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClient = async (data: ClientEditFormData) => {
    console.log('Edit client data:', data);
    console.log('Selected client:', selectedClient);
    console.log('User:', user);
    
    if (!user?.id || !selectedClient?._id) {
      toast.error('User or client not found');
      return;
    }

    setIsSubmitting(true);

    try {
      const contactName = `${data.firstName} ${data.lastName}`.trim();
      console.log('Calling updateClient with:', {
        userId: user.id,
        clientId: selectedClient._id,
        companyName: data.companyName,
        contactName,
        email: data.email,
        contactNumber: data.contactNumber,
        address: data.address,
      });
      
      await updateClient({
        userId: user.id as any,
        clientId: selectedClient._id as any,
        companyName: data.companyName,
        contactName: contactName,
        email: data.email,
        contactNumber: data.contactNumber,
        address: data.address,
      });

      setShowEditModal(false);
      setSelectedClient(null);
      resetEdit();
      toast.success('Client updated successfully');
    } catch (error: any) {
      console.error('Error updating client:', error);
      
      let errorMessage = 'Failed to update client. Please try again.';
      const errorStr = String(error?.message || error?.toString() || '');
      
      if (errorStr.includes('NOT_FOUND')) {
        errorMessage = 'Client not found. It may have been deleted. Please refresh the page.';
      } else if (errorStr.includes('EXISTING_USER')) {
        errorMessage = 'A user account with this email already exists. Please use a different email address.';
      } else if (errorStr.includes('DUPLICATE_CLIENT')) {
        errorMessage = 'A client with this email already exists in this company.';
      } else if (errorStr.includes('duplicate') || errorStr.includes('Duplicate')) {
        errorMessage = 'A client with this email already exists. Please use a different email.';
      } else if (errorStr.includes('permission') || errorStr.includes('Permission')) {
        errorMessage = 'You do not have permission to update this client.';
      } else {
        const match = errorStr.match(/(?:Uncaught Error:\s*)?(.+?)(?:\s+at\s|$)/);
        if (match && match[1] && match[1].length > 5) {
          errorMessage = match[1].trim();
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient || !user?.id) return;

    setIsSubmitting(true);

    try {
      await deleteClient({
        userId: user.id as any,
        clientId: selectedClient._id as any,
      });
      setSuccessMessage(`Client "${selectedClient.companyName}" has been removed successfully.`);
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      setSelectedClient(null);
      setDeleteConfirmText('');
    } catch (error: any) {
      console.error('Error deleting client:', error);
      
      let errorMessage = 'Failed to remove client. Please try again.';
      const errorStr = String(error?.message || error?.toString() || '');
      
      if (errorStr.includes('NOT_FOUND')) {
        errorMessage = 'Client not found. It may have already been deleted. Please refresh the page.';
      } else if (errorStr.includes('permission') || errorStr.includes('Permission')) {
        errorMessage = 'You do not have permission to delete this client.';
      } else {
        const match = errorStr.match(/(?:Uncaught Error:\s*)?(.+?)(?:\s+at\s|$)/);
        if (match && match[1] && match[1].length > 5) {
          errorMessage = match[1].trim();
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    const nameParts = client.contactName.split(' ');
    setValueEdit('firstName', nameParts[0] || '');
    setValueEdit('lastName', nameParts.slice(1).join(' ') || '');
    setValueEdit('companyName', client.companyName);
    setValueEdit('email', client.email);
    setValueEdit('contactNumber', client.contactNumber);
    setValueEdit('address', client.address || '');
    setShowEditModal(true);
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'inactive':
        return 'bg-slate-100 text-slate-600';
      case 'prospect':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'prospect':
        return 'Prospect';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-4 text-sm overflow-x-auto">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              Companies
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              {company?.name || ''}
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <a href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
              CRM
            </a>
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap">Clients</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-5">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <UserGroup className="h-7 w-7 text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-[#00072e] tracking-tight">
                    Clients
                  </h1>
                  <p className="text-slate-600 text-base">
                    Manage client relationships and accounts
                  </p>
                </div>
              </div>

              {/* Actions - Desktop: right side, Mobile: below title */}
              <div className="flex items-center gap-3 md:gap-4">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00072e] text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-[#00072e]/20 md:w-auto w-full"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add Client</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-4 mb-6">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Clients List */}
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client._id}
                className="py-[22px] px-5 bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>

                {/* Client Info */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">
                      {client.companyName}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(client.status)}`}>
                      {getStatusLabel(client.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-1">
                    <User className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{client.contactName}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{client.contactNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(client)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <Link
                    href={`/companies/${companyId}/crm/clients/${client._id}/notes`}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 rounded-lg transition-all"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Notes
                  </Link>
                  <button
                    onClick={() => openDeleteModal(client)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="col-span-full py-16 px-5 bg-white rounded-xl border-2 border-slate-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroup className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first client'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00072e] text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Add First Client
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Add New Client</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    reset();
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleAddClient)} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    placeholder="John"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    placeholder="Smith"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('contactNumber')}
                  type="tel"
                  placeholder="+27 11 123 4567"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {errors.contactNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.contactNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Company Name
                </label>
                <input
                  {...register('companyName')}
                  type="text"
                  placeholder="Acme Corporation (optional)"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Address
                </label>
                <input
                  {...register('address')}
                  type="text"
                  placeholder="123 Main St, Johannesburg (optional)"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Client Portal Access</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWelcomeEmail}
                      onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">
                      Send welcome email to client
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireEmailVerification}
                      onChange={(e) => setRequireEmailVerification(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">
                      Client must verify their email address to log in
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requirePasswordChange}
                      onChange={(e) => setRequirePasswordChange(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">
                      Client needs to change their password upon login
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    reset();
                    setSendWelcomeEmail(false);
                    setRequireEmailVerification(false);
                    setRequirePasswordChange(false);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg hover:from-blue-600 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Edit Client</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedClient(null);
                    reset();
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitEdit(handleEditClient)} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('firstName')}
                    type="text"
                    placeholder="John"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {editErrors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{editErrors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('lastName')}
                    type="text"
                    placeholder="Smith"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {editErrors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{editErrors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerEdit('email')}
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {editErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{editErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerEdit('contactNumber')}
                  type="tel"
                  placeholder="+27 11 123 4567"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
                {editErrors.contactNumber && (
                  <p className="text-sm text-red-600 mt-1">{editErrors.contactNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Company Name
                </label>
                <input
                  {...registerEdit('companyName')}
                  type="text"
                  placeholder="Acme Corporation (optional)"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Address
                </label>
                <input
                  {...registerEdit('address')}
                  type="text"
                  placeholder="123 Main St, Johannesburg (optional)"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedClient(null);
                    resetEdit();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg hover:from-blue-600 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? 'Updating...' : 'Update Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedClient && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Remove Client</h3>
              <p className="text-slate-600 text-center mb-5">
                Are you sure you want to remove <span className="font-semibold text-slate-900">{selectedClient.companyName}</span>?
              </p>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-5">
                <p className="text-sm text-red-800">
                  This action cannot be undone. The client will be permanently removed.
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Type <span className="text-red-600 font-bold">Delete</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type Delete"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedClient(null);
                    setDeleteConfirmText('');
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClient}
                  disabled={isSubmitting || deleteConfirmText !== 'Delete'}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Success!</h3>
            <p className="text-slate-600 mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800"
            >
              Done
            </button>
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
