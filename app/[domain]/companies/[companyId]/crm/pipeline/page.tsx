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
  MessageSquare,
  Coffee,
  Video,
  ChevronRight,
  DollarSign,
  Building2,
  GripVertical,
  X,
  Check,
  TrendingUp,
  Award,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

type LeadStatus = 'new_lead' | 'contacted' | 'qualified' | 'engaged' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
type LeadMethod = 'phone_call' | 'email' | 'whatsapp' | 'physical_meeting' | 'online_meeting';

interface Lead {
  _id: string;
  method?: LeadMethod;
  status: LeadStatus;
  description?: string;
  relatedToId?: string;
  relatedToName?: string;
  value?: number;
  startDate?: string;
  startTime?: string;
  notes?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  clientId?: string;
  createdAt: number;
}

const statusConfig: Record<LeadStatus, { label: string; description: string; color: string; bg: string; border: string; dot: string }> = {
  new_lead:    { label: 'New Lead',       description: 'Not yet engaged',      color: 'text-sky-700',    bg: 'bg-sky-50',    border: 'border-sky-200',    dot: 'bg-sky-500' },
  contacted:   { label: 'Contacted',      description: 'Initial outreach done', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200',  dot: 'bg-violet-500' },
  qualified:   { label: 'Qualified',      description: 'Meets criteria',        color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200',    dot: 'bg-teal-500' },
  engaged:     { label: 'Engaged',        description: 'In discussion',         color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',   dot: 'bg-amber-500' },
  proposal:    { label: 'Proposal',       description: 'Awaiting response',     color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',  dot: 'bg-orange-500' },
  negotiation: { label: 'Negotiation',    description: 'Finalising terms',      color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200',    dot: 'bg-rose-500' },
  closed_won:  { label: 'Closed Won',     description: 'Deal won!',             color: 'text-emerald-700',bg: 'bg-emerald-50',border: 'border-emerald-200', dot: 'bg-emerald-500' },
  closed_lost: { label: 'Closed Lost',    description: 'Deal lost',             color: 'text-slate-600',  bg: 'bg-slate-100', border: 'border-slate-200',   dot: 'bg-slate-400' },
};

const methodConfig: Record<LeadMethod, { label: string; icon: any; color: string; bg: string }> = {
  phone_call:       { label: 'Phone Call', icon: Phone,         color: 'text-emerald-600', bg: 'bg-emerald-50' },
  email:            { label: 'Email',      icon: Mail,          color: 'text-sky-600',     bg: 'bg-sky-50' },
  whatsapp:         { label: 'WhatsApp',   icon: MessageSquare, color: 'text-green-600',   bg: 'bg-green-50' },
  physical_meeting: { label: 'In-Person',  icon: Coffee,        color: 'text-amber-600',   bg: 'bg-amber-50' },
  online_meeting:   { label: 'Video Call', icon: Video,         color: 'text-purple-600',  bg: 'bg-purple-50' },
};

const statusOrder: LeadStatus[] = ['new_lead', 'contacted', 'qualified', 'engaged', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

export default function PipelinePage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const domain = params.domain as string;
  const companyId = params.companyId as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);

  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : 'skip'
  );

  const leadsData = useQuery(
    api.leads.getLeadsByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : 'skip'
  );

  const updateLeadStatus = useMutation(api.leads.updateLeadStatus);

  const leads: Lead[] = (leadsData || []) as Lead[];

  const filteredLeads = leads.filter(l =>
    searchQuery === '' ||
    (l.relatedToName && l.relatedToName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.firstName && l.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.lastName && l.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = filteredLeads.filter(l => l.status === status);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>);

  const totalValue = filteredLeads.reduce((sum, l) => sum + (l.value || 0), 0);
  const wonValue   = (groupedByStatus['closed_won'] || []).reduce((sum, l) => sum + (l.value || 0), 0);
  const wonCount   = (groupedByStatus['closed_won'] || []).length;
  const winRate    = filteredLeads.length > 0 ? Math.round((wonCount / filteredLeads.length) * 100) : 0;

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData('leadId', lead._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = () => setDragOverStatus(null);

  const handleDrop = async (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId && user?.id) {
      try {
        await updateLeadStatus({
          userId: user.id as Id<'users'>,
          leadId: leadId as Id<'leads'>,
          status: newStatus,
        });
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    }
  };

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const formatCurrency = (value: number) => {
    const currencyCode = company?.currency?.code || 'ZAR';
    const currencySymbol = company?.currency?.symbol || (currencyCode === 'ZAR' ? 'R' : '$');
    const symbolPosition = company?.currency?.symbolPosition || 'before';
    
    const formatted = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(value);
    
    if (symbolPosition === 'after') {
      return value.toFixed(0) + ' ' + currencySymbol;
    }
    return formatted;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 animate-pulse" />
          <p className="text-sm text-slate-500 font-medium">Loading pipeline…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8fb] flex flex-col">

      {/* ── TOP HEADER ── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 pt-4 pb-3">

          {/* Breadcrumb + menu */}
          <div className="flex items-center justify-between mb-4">
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto whitespace-nowrap">
              <Link href={`/companies`} className="hover:text-slate-600 transition-colors">Companies</Link>
              <ChevronRight className="h-3 w-3 flex-shrink-0" />
              <Link href={`/companies/${companyId}/crm`} className="hover:text-slate-600 transition-colors">CRM</Link>
              <ChevronRight className="h-3 w-3 flex-shrink-0" />
              <span className="text-slate-700 font-semibold">Pipeline</span>
            </nav>
            <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
          </div>

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Pipeline</h1>
              {company?.name && (
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{company.name}</p>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search deals…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* ── STATS STRIP ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <StatCard
              label="Total Deals"
              value={String(filteredLeads.length)}
              icon={<BarChart3 className="h-4 w-4" />}
              accent="violet"
            />
            <StatCard
              label="Win Rate"
              value={`${winRate}%`}
              icon={<TrendingUp className="h-4 w-4" />}
              accent="teal"
            />
            <StatCard
              label="Pipeline Value"
              value={formatCurrency(totalValue)}
              icon={<DollarSign className="h-4 w-4" />}
              accent="sky"
            />
            <StatCard
              label="Won Value"
              value={formatCurrency(wonValue)}
              icon={<Award className="h-4 w-4" />}
              accent="emerald"
            />
          </div>
        </div>
      </header>

      {/* ── PIPELINE BOARD ── */}
      <main className="flex-1 overflow-x-auto">
        <div className="flex gap-3 p-4 sm:p-5 min-w-max h-full items-start">
          {statusOrder.map((status) => {
            const deals    = groupedByStatus[status] || [];
            const stageVal = deals.reduce((s, d) => s + (d.value || 0), 0);
            const cfg      = statusConfig[status];
            const isOver   = dragOverStatus === status;

            return (
              <div
                key={status}
                className="flex flex-col w-44 sm:w-52 flex-shrink-0"
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                {/* Column header */}
                <div className={`rounded-xl mb-2 px-3 py-2.5 border ${cfg.bg} ${cfg.border} transition-shadow`}>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <h3 className={`text-xs font-bold ${cfg.color} truncate`}>{cfg.label}</h3>
                    </div>
                    <span className={`text-xs font-bold ${cfg.color} bg-white/70 px-1.5 py-0.5 rounded-lg flex-shrink-0 tabular-nums`}>
                      {deals.length}
                    </span>
                  </div>
                  <p className={`text-[11px] font-semibold mt-1 ${cfg.color} opacity-80 tabular-nums`}>
                    {formatCurrency(stageVal)}
                  </p>
                </div>

                {/* Cards drop zone */}
                <div
                  className={`flex-1 rounded-xl min-h-[120px] p-1.5 space-y-1.5 transition-all duration-150
                    ${isOver
                      ? 'bg-violet-50 ring-2 ring-violet-400 ring-offset-1'
                      : 'bg-slate-100/80'
                    }`}
                >
                  {deals.map((lead) => {
                    const mc   = methodConfig[(lead.method || 'phone_call') as LeadMethod];
                    const Icon = mc?.icon || Phone;

                    return (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onClick={() => openDetail(lead)}
                        className="group bg-white rounded-xl px-2.5 py-2 shadow-sm border border-slate-200/80 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-violet-300 hover:-translate-y-px transition-all duration-150 select-none"
                      >
                        {/* Method icon + client name */}
                        <div className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-lg ${mc?.bg || 'bg-slate-100'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Icon className={`h-3 w-3 ${mc?.color || 'text-slate-500'}`} />
                          </div>
                          <p className="text-[11px] font-semibold text-slate-800 leading-snug line-clamp-2">
                            {lead.relatedToName || lead.firstName + ' ' + lead.lastName || 'No client'}
                          </p>
                        </div>

                        {/* Date + value */}
                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-medium tabular-nums">{lead.startDate || '-'}</span>
                          {lead.value && lead.value > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 tabular-nums">
                              {formatCurrency(lead.value)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {deals.length === 0 && (
                    <div className={`flex flex-col items-center justify-center h-20 rounded-lg border-2 border-dashed transition-colors
                      ${isOver ? 'border-violet-300 bg-violet-50/50' : 'border-slate-200'}`}>
                      <p className="text-[10px] text-slate-400 font-medium">Drop here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── DETAIL MODAL ── */}
      {showDetailModal && selectedLead && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowDetailModal(false); setSelectedLead(null); } }}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal header */}
            <div className={`px-5 py-4 ${statusConfig[selectedLead.status as LeadStatus].bg} border-b ${statusConfig[selectedLead.status as LeadStatus].border} flex-shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[selectedLead.status as LeadStatus].dot}`} />
                  <div>
                    <h3 className={`text-base font-bold ${statusConfig[selectedLead.status as LeadStatus].color}`}>
                      {statusConfig[selectedLead.status as LeadStatus].label}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedLead.startDate || '-'}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedLead(null); }}
                  className="w-8 h-8 rounded-xl bg-white/60 hover:bg-white flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              {(selectedLead.relatedToName || (selectedLead.firstName && selectedLead.lastName)) && (
                <InfoRow
                  icon={<Building2 className="h-4 w-4 text-violet-500" />}
                  iconBg="bg-violet-50"
                  label="Client"
                  value={selectedLead.relatedToName || `${selectedLead.firstName} ${selectedLead.lastName}`}
                />
              )}

              <InfoRow
                icon={(() => {
                  const mc = methodConfig[(selectedLead.method || 'phone_call') as LeadMethod];
                  const Icon = mc?.icon || Phone;
                  return <Icon className={`h-4 w-4 ${mc?.color || 'text-slate-500'}`} />;
                })()}
                iconBg={methodConfig[(selectedLead.method || 'phone_call') as LeadMethod]?.bg || 'bg-slate-100'}
                label="Method"
                value={methodConfig[(selectedLead.method || 'phone_call') as LeadMethod]?.label || selectedLead.method || 'Phone Call'}
              />

              {selectedLead.value && selectedLead.value > 0 && (
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                  iconBg="bg-emerald-50"
                  label="Deal Value"
                  value={formatCurrency(selectedLead.value)}
                  valueClass="text-emerald-700 font-bold text-lg"
                />
              )}

              {selectedLead.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed border border-slate-100">
                    {selectedLead.description}
                  </p>
                </div>
              )}

              {selectedLead.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed border border-slate-100">
                    {selectedLead.notes}
                  </p>
                </div>
              )}

              {/* Move to stage */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Move to Stage</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {statusOrder.map((status) => {
                    const isCurrent = status === selectedLead.status;
                    const cfg = statusConfig[status];
                    return (
                      <button
                        key={status}
                        onClick={async () => {
                          if (user?.id && !isCurrent) {
                            await updateLeadStatus({
                              userId: user.id as Id<'users'>,
                              leadId: selectedLead._id as Id<'leads'>,
                              status,
                            });
                            setShowDetailModal(false);
                            setSelectedLead(null);
                          }
                        }}
                        disabled={isCurrent}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                          ${isCurrent
                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200'
                            : `${cfg.bg} ${cfg.color} ${cfg.border} hover:opacity-75 active:scale-95`
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? 'bg-white' : cfg.dot}`} />
                        <span className="truncate">{cfg.label}</span>
                        {isCurrent && <Check className="h-3 w-3 ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
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

/* ── Helper sub-components ── */

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  const accentMap: Record<string, string> = {
    violet:  'bg-violet-50 text-violet-600 border-violet-100',
    teal:    'bg-teal-50   text-teal-600   border-teal-100',
    sky:     'bg-sky-50    text-sky-600    border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  const valueMap: Record<string, string> = {
    violet:  'text-violet-900',
    teal:    'text-teal-900',
    sky:     'text-sky-900',
    emerald: 'text-emerald-900',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-3 py-2.5 flex items-center gap-2.5 shadow-sm">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${accentMap[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</p>
        <p className={`text-sm font-bold tabular-nums truncate ${valueMap[accent]}`}>{value}</p>
      </div>
    </div>
  );
}

function InfoRow({
  icon, iconBg, label, value, valueClass,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 border border-slate-100`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-semibold text-slate-800 ${valueClass || ''}`}>{value}</p>
      </div>
    </div>
  );
}
