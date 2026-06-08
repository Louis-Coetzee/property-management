'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';
import { Id } from '@/convex/_generated/dataModel';
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  Clock,
  Video,
  MessageSquare,
  Coffee,
  X,
  ChevronRight,
  Search,
  User,
  Building2,
  Edit2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type LeadMethod = 'phone_call' | 'email' | 'whatsapp' | 'physical_meeting' | 'online_meeting';
type LeadStatus = 'new_lead' | 'contacted' | 'qualified' | 'engaged' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

interface LeadItem {
  _id: string;
  method: LeadMethod;
  status: LeadStatus;
  description?: string;
  relatedToId?: string;
  relatedToType?: string;
  relatedToName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  startDate: string;
  startTime?: string;
  notes?: string;
  value?: number;
  createdAt: number;
}

const methodConfig: Record<LeadMethod, { label: string; icon: any; color: string; bg: string }> = {
  phone_call: { label: 'Phone Call', icon: Phone, color: 'text-emerald-700', bg: 'bg-emerald-100' },
  email: { label: 'Email', icon: Mail, color: 'text-blue-700', bg: 'bg-blue-100' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-700', bg: 'bg-green-100' },
  physical_meeting: { label: 'Physical Meeting', icon: Coffee, color: 'text-amber-700', bg: 'bg-amber-100' },
  online_meeting: { label: 'Online Meeting', icon: Video, color: 'text-purple-700', bg: 'bg-purple-100' },
};

const statusConfig: Record<LeadStatus, { label: string; description: string; color: string; bg: string }> = {
  new_lead: { label: 'New Lead', description: 'A newly captured contact who has not yet been engaged.', color: 'text-blue-700', bg: 'bg-blue-100' },
  contacted: { label: 'Contacted', description: 'Initial outreach has been made.', color: 'text-purple-700', bg: 'bg-purple-100' },
  qualified: { label: 'Qualified', description: 'Meets criteria for potential opportunity.', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  engaged: { label: 'Engaged', description: 'Active interaction in progress.', color: 'text-amber-700', bg: 'bg-amber-100' },
  proposal: { label: 'Proposal Sent', description: 'Formal offer has been shared.', color: 'text-orange-700', bg: 'bg-orange-100' },
  negotiation: { label: 'Negotiation', description: 'Terms being discussed.', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  closed_won: { label: 'Closed Won', description: 'Successfully converted to customer.', color: 'text-green-700', bg: 'bg-green-100' },
  closed_lost: { label: 'Closed Lost', description: 'Did not proceed.', color: 'text-red-700', bg: 'bg-red-100' },
};

const leadMethods: LeadMethod[] = ['phone_call', 'email', 'whatsapp', 'physical_meeting', 'online_meeting'];
const leadStatuses: LeadStatus[] = ['new_lead', 'contacted', 'qualified', 'engaged', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

export default function LeadsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const domain = params.domain as string;
  const companyId = params.companyId as string;

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [filterMethod, setFilterMethod] = useState<LeadMethod | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<LeadItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    method: 'phone_call' as LeadMethod,
    status: 'new_lead' as LeadStatus,
    description: '',
    relatedToName: '',
    relatedToId: '',
    clientDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    assignedTo: [] as { userId: string; id: string; name: string }[],
    startDate: '',
    startTime: '',
    notes: '',
    value: 0,
  });

  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [assignedSearchQuery, setAssignedSearchQuery] = useState('');
  const [showAssignedDropdown, setShowAssignedDropdown] = useState(false);

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const leadsData = useQuery(
    api.leads.getLeadsByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  const createLead = useMutation(api.leads.createLead);
  const updateLead = useMutation(api.leads.updateLead);
  const deleteLead = useMutation(api.leads.deleteLead);

  const clientResults = useQuery(
    api.clients.searchClientsByCompany,
    user?.id && companyId && clientSearchQuery.length >= 2 
      ? { userId: user.id as any, companyId: companyId as any, searchQuery: clientSearchQuery } 
      : "skip"
  );

  const teamMemberResults = useQuery(
    api.teamMembers.searchTeamMembers,
    user?.id && companyId && assignedSearchQuery.length >= 2
      ? { userId: user.id as any, companyId: companyId as any, searchQuery: assignedSearchQuery }
      : "skip"
  );

  const leads: LeadItem[] = (leadsData || []) as LeadItem[];

  const filteredLeads = leads.filter(lead => {
    const matchesMethod = filterMethod === 'all' || lead.method === filterMethod;
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
    const matchesSearch = searchQuery === '' ||
      (lead.description && lead.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.relatedToName && lead.relatedToName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (fullName && fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMethod && matchesStatus && matchesSearch;
  });

  const groupedLeads = filteredLeads.reduce((acc, lead) => {
    const date = lead.startDate || new Date(lead.createdAt).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(lead);
    return acc;
  }, {} as Record<string, LeadItem[]>);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const resetForm = () => {
    setFormData({
      method: 'phone_call',
      status: 'new_lead',
      description: '',
      relatedToName: '',
      relatedToId: '',
      clientDetails: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      },
      assignedTo: [],
      startDate: new Date().toISOString().split('T')[0],
      startTime: '',
      notes: '',
      value: 0,
    });
    setClientSearchQuery('');
    setAssignedSearchQuery('');
    setShowAssignedDropdown(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (lead: LeadItem) => {
    const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
    const assignedUsers = (lead as any).assignedTo || [];
    
    setFormData({
      method: lead.method || 'phone_call',
      status: lead.status || 'new_lead',
      description: lead.description || '',
      relatedToName: lead.relatedToName || '',
      relatedToId: lead.relatedToId || '',
      clientDetails: {
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        email: lead.email || '',
        phone: lead.phone || '',
      },
      assignedTo: Array.isArray(assignedUsers) ? assignedUsers.map((id: string) => ({ userId: id, id: id, name: '' })) : [],
      startDate: lead.startDate || new Date(lead.createdAt).toISOString().split('T')[0],
      startTime: lead.startTime || '',
      notes: lead.notes || '',
      value: lead.value || 0,
    });
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    if (!user?.id || !companyId) return;
    
    if (!formData.relatedToId) {
      toast.error('Please select a client');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const assignedUserIds = formData.assignedTo.map(a => a.userId);
      
      if (isEdit && selectedLead) {
        await updateLead({
          userId: user.id as Id<'users'>,
          leadId: selectedLead._id as Id<'leads'>,
          firstName: formData.clientDetails.firstName || undefined,
          lastName: formData.clientDetails.lastName || undefined,
          email: formData.clientDetails.email || undefined,
          phone: formData.clientDetails.phone || undefined,
          status: formData.status,
          description: formData.description || undefined,
          relatedToName: formData.relatedToName || undefined,
          relatedToId: formData.relatedToId ? formData.relatedToId as Id<'clients'> : undefined,
          startDate: formData.startDate,
          startTime: formData.startTime || undefined,
          notes: formData.notes || undefined,
          value: formData.value || undefined,
          method: formData.method,
          assignedTo: assignedUserIds.length > 0 ? assignedUserIds as Id<'users'>[] : undefined,
        });
      } else {
        await createLead({
          userId: user.id as Id<'users'>,
          companyId: companyId as Id<'companies'>,
          firstName: formData.clientDetails.firstName || undefined,
          lastName: formData.clientDetails.lastName || undefined,
          email: formData.clientDetails.email || undefined,
          phone: formData.clientDetails.phone || undefined,
          status: formData.status,
          description: formData.description || undefined,
          relatedToName: formData.relatedToName || undefined,
          relatedToId: formData.relatedToId ? formData.relatedToId as Id<'clients'> : undefined,
          startDate: formData.startDate,
          startTime: formData.startTime || undefined,
          notes: formData.notes || undefined,
          value: formData.value || undefined,
          method: formData.method,
          assignedTo: assignedUserIds.length > 0 ? assignedUserIds as Id<'users'>[] : undefined,
          source: 'manual',
        });
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedLead(null);
      resetForm();
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id || !leadToDelete) return;
    setIsSubmitting(true);

    try {
      await deleteLead({
        userId: user.id as Id<'users'>,
        leadId: leadToDelete._id as Id<'leads'>,
      });
      setShowDeleteModal(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 text-sm overflow-x-auto">
            <Link href={`/companies`} className="text-slate-500 hover:text-slate-700 whitespace-nowrap">Companies</Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 whitespace-nowrap">{company?.name || 'Company'}</Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 whitespace-nowrap">CRM</Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium whitespace-nowrap">Leads</span>
          </div>

          <div className="flex items-center justify-between gap-4 pb-6">
            <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
            <div className="flex items-center gap-3">
              <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-all"
              >
                <Calendar className="h-5 w-5" />
                Add Lead
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value as LeadMethod | 'all')}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
          >
            <option value="all">All Methods</option>
            {leadMethods.map(m => (
              <option key={m} value={m}>{methodConfig[m].label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LeadStatus | 'all')}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
          >
            <option value="all">All Statuses</option>
            {leadStatuses.map(s => (
              <option key={s} value={s}>{statusConfig[s].label} - {statusConfig[s].description}</option>
            ))}
          </select>
        </div>

        {filteredLeads.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedLeads)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dayLeads]) => (
                <div key={date}>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-violet-500" />
                    {formatTime(date)}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(dayLeads as LeadItem[]).map((lead) => {
                      const methodConf = methodConfig[lead.method];
                      const statusConf = statusConfig[lead.status];
                      const Icon = methodConf?.icon || Phone;
                      const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
                      const displayName = fullName || lead.relatedToName || 'Unknown';

                      return (
                        <div
                          key={lead._id}
                          className="p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-lg ${methodConf?.bg} flex items-center justify-center`}>
                              <Icon className={`h-4 w-4 ${methodConf?.color}`} />
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusConf?.bg} ${statusConf?.color}`}>
                              {statusConf?.label}
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium text-slate-900 mb-1">{methodConf?.label}</p>
                          
                          <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                            <User className="h-3 w-3" />
                            {displayName}
                          </p>
                          
                          {lead.email && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </p>
                          )}
                          
                          {lead.startTime && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lead.startTime}
                            </p>
                          )}

                          {lead.value && lead.value > 0 && (
                            <p className="text-sm font-semibold text-green-700 mt-2">
                              R{lead.value.toLocaleString()}
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditModal(lead); }}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 rounded-lg"
                            >
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setLeadToDelete(lead); setShowDeleteModal(true); }}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No leads yet</h3>
            <p className="text-slate-500 mb-4">Start tracking your leads</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700"
            >
              <Plus className="h-5 w-5" />
              Add First Lead
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{showAddModal ? 'Add Lead' : 'Edit Lead'}</h3>
                  <p className="text-xs text-white/80 mt-1">Track your leads</p>
                </div>
                <button onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Method *</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value as LeadMethod })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {leadMethods.map(m => (
                      <option key={m} value={m}>{methodConfig[m].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {leadStatuses.map(s => (
                      <option key={s} value={s}>{statusConfig[s].label} - {statusConfig[s].description}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deal Value (R)</label>
                <input
                  type="number"
                  value={formData.value || ''}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="15000"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Client *</label>
                <input
                  type="text"
                  value={formData.relatedToName}
                  onChange={(e) => {
                    setFormData({ ...formData, relatedToName: e.target.value, relatedToId: '', clientDetails: { firstName: '', lastName: '', email: '', phone: '' } });
                    setClientSearchQuery(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Search client..."
                />
                {showClientDropdown && clientResults && clientResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {(clientResults as any[]).map((client: any) => (
                      <button
                        key={client._id}
                        type="button"
                        onClick={() => {
                          setFormData({ 
                            ...formData, 
                            relatedToName: client.companyName, 
                            relatedToId: client._id,
                            clientDetails: {
                              firstName: client.contactName?.split(' ')[0] || '',
                              lastName: client.contactName?.split(' ').slice(1).join(' ') || '',
                              email: client.email || '',
                              phone: client.contactNumber || '',
                            }
                          });
                          setShowClientDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-violet-50"
                      >
                        <div className="font-medium">{client.companyName}</div>
                        <div className="text-xs text-slate-500">{client.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-end mt-2">
                  <Link
                    href={`/companies/${companyId}/crm/clients`}
                    className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Client
                  </Link>
                </div>
              </div>

              {formData.relatedToId && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-2">Client Details (Read-only)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Name</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formData.clientDetails.firstName} {formData.clientDetails.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-900">{formData.clientDetails.email || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="text-sm font-medium text-slate-900">{formData.clientDetails.phone || '-'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">To update client details, go to Clients page</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign Team Members</label>
                <div className="relative">
                  <input
                    type="text"
                    value={assignedSearchQuery}
                    onChange={(e) => {
                      setAssignedSearchQuery(e.target.value);
                      setShowAssignedDropdown(true);
                    }}
                    onFocus={() => setShowAssignedDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAssignedDropdown(false), 200)}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Search team members..."
                  />
                  {showAssignedDropdown && teamMemberResults && teamMemberResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {(teamMemberResults as any[]).map((member: any) => (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() => {
                            const exists = formData.assignedTo.find(a => a.id === member._id);
                            if (!exists) {
                              setFormData({ 
                                ...formData, 
                                assignedTo: [...formData.assignedTo, { userId: member.userId, id: member._id, name: member.name }]
                              });
                            }
                            setAssignedSearchQuery('');
                            setShowAssignedDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-violet-50"
                        >
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-slate-500">{member.email || member.role}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {formData.assignedTo.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.assignedTo.map((member, index) => (
                      <span 
                        key={member.id} 
                        className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-full"
                      >
                        {member.name || member.id}
                        <button
                          type="button"
                          onClick={() => {
                            const newAssigned = formData.assignedTo.filter((_, i) => i !== index);
                            setFormData({ ...formData, assignedTo: newAssigned });
                          }}
                          className="ml-1 hover:text-violet-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1">Leave empty to assign to yourself</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="Lead notes..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(showEditModal)}
                  disabled={isSubmitting}
                  className="px-5 py-3 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : showEditModal ? 'Update' : 'Add Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && leadToDelete && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Lead</h3>
            <p className="text-slate-600 text-center mb-6">Are you sure you want to delete this lead?</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setLeadToDelete(null); }}
                className="flex-1 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
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