'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';
import InvoiceTemplate from '@/components/invoices/InvoiceTemplate';
import { Id } from '@/convex/_generated/dataModel';
import {
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  Download,
  Send,
  Eye,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  DollarSign,
  Loader2,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  clientPhone?: string;
  clientAddress?: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  dueDate: string;
  issueDate: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  sentAt?: number;
  paidAt?: number;
  quoteId?: string;
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-100', icon: FileSpreadsheet },
  sent: { label: 'Sent', color: 'text-blue-700', bg: 'bg-blue-100', icon: Send },
  paid: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  overdue: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-100', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'text-amber-700', bg: 'bg-amber-100', icon: X }};

export default function InvoicesPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Query invoices from database
  const invoicesData = useQuery(
    api.invoices.listByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Mutations
  const createInvoice = useMutation(api.invoices.create);
  const updateInvoice = useMutation(api.invoices.update);
  const deleteInvoice = useMutation(api.invoices.remove);
  const markInvoiceAsSent = useMutation(api.invoices.markAsSent);
  const markInvoiceAsPaid = useMutation(api.invoices.markAsPaid);

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const sendInvoiceEmail = async (invoice: Invoice) => {
    if (!invoice.clientEmail) {
      toast.error('No email address for client');
      return;
    }
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invoice.clientEmail,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          clientCompany: invoice.clientCompany,
          total: invoice.total,
          dueDate: invoice.dueDate,
          issueDate: invoice.issueDate,
          items: invoice.items,
          subtotal: invoice.subtotal,
          taxRate: invoice.taxRate,
          taxAmount: invoice.taxAmount,
          status: invoice.status,
          notes: invoice.notes,
          companyName: company?.name || 'Company',
          companyEmail: company?.description,
          branding: company?.branding,
          paymentUrl: `${window.location.origin}/public/invoices/${invoice._id}`,
          paymentLink: (invoice as any).paymentLink,
          showBankingDetails: (invoice as any).showBankingDetails,
          currency: company?.currency,
          bankingDetails: company?.bankingDetails,
          template: (invoice as any).template,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Invoice sent to client!');
        await markInvoiceAsSent({ userId: user!.id as any, invoiceId: invoice._id as any });
      } else {
        toast.error('Failed to send email');
      }
    } catch (error) {
      toast.error('Failed to send email');
    }
    setIsSendingEmail(false);
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    const content = `
      <div style="padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div>
            ${company?.branding?.logoUrl ? `<img src="${company.branding.logoUrl}" style="max-height: 60px; margin-bottom: 20px;">` : `<h1 style="margin: 0 0 20px 0; color: #111827;">${company?.name || 'Company'}</h1>`}
            <h2 style="color: #111827; margin: 0;">INVOICE</h2>
            <p style="color: #6b7280; margin: 4px 0 0 0;">${invoice.invoiceNumber}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-weight: 600; margin: 0;">${company?.name || 'Company'}</p>
            <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">${company?.description || ''}</p>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0 0 4px 0;">Bill To:</p>
            <p style="font-weight: 500; margin: 0;">${invoice.clientName}</p>
            ${invoice.clientCompany ? `<p style="color: #6b7280; margin: 0;">${invoice.clientCompany}</p>` : ''}
            ${invoice.clientEmail ? `<p style="color: #6b7280; margin: 0;">${invoice.clientEmail}</p>` : ''}
            ${invoice.clientPhone ? `<p style="color: #6b7280; margin: 0;">${invoice.clientPhone}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0 0 4px 0;">Issue Date: <span style="color: #111827;">${invoice.issueDate}</span></p>
            <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0 0 4px 0;">Due Date: <span style="color: #111827;">${invoice.dueDate}</span></p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #111827; color: white;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #111827;">Description</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #111827;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #111827;">Unit Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #111827;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-left: auto; width: 280px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #6b7280;">Subtotal</span>
            <span style="color: #111827;">$${invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.taxRate > 0 && (
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #6b7280;">Tax (${invoice.taxRate}%)</span>
            <span style="color: #111827;">$${invoice.taxAmount.toFixed(2)}</span>
          </div>
          )}
          <div style="display: flex; justify-content: space-between; padding: 12px 0 8px 0; border-top: 2px solid #111827; margin-top: 8px;">
            <span style="font-weight: 600; color: #111827;">Total</span>
            <span style="font-size: 20px; font-weight: 700; color: #111827;">$${invoice.total.toFixed(2)}</span>
          </div>
        </div>
        ${invoice.notes ? `
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 24px;">
          <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0 0 8px 0;">Notes:</p>
          <p style="color: #111827; margin: 0;">${invoice.notes}</p>
        </div>
        ` : ''}
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Invoice ${invoice.invoiceNumber}</title></head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    try {
      await markInvoiceAsPaid({ userId: user!.id as any, invoiceId: selectedInvoice._id as any });
      toast.success('Payment recorded!');
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const invoices: Invoice[] = (invoicesData || []) as Invoice[];

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchQuery === '' ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.clientCompany && invoice.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    const currencyCode = company?.currency?.code || 'ZAR';
    const currencySymbol = company?.currency?.symbol || (currencyCode === 'ZAR' ? 'R' : '$');
    const symbolPosition = company?.currency?.symbolPosition || 'before';
    
    const formatted = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    
    if (symbolPosition === 'after') {
      return value.toFixed(2) + ' ' + currencySymbol;
    }
    return formatted;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
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
          <div className="flex items-center gap-2 py-4 text-sm">
            <a href="/companies" className="text-slate-500 hover:text-slate-700 transition-colors">Companies</a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors">{company?.name || ''}</a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 transition-colors">CRM</a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Invoices</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <FileSpreadsheet className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h1>
                  <p className="text-slate-600 text-base">Generate and track customer invoices</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button 
                  onClick={() => router.push(`/${params.domain}/companies/${companyId}/crm/invoices/new`)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20 md:w-auto w-full"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Status
              </button>
              {(Object.keys(statusConfig) as InvoiceStatus[]).map((status) => {
                const Icon = statusConfig[status].icon;
                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      filterStatus === status
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {statusConfig[status].label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {filteredInvoices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredInvoices.map((invoice) => {
              const statusConf = statusConfig[invoice.status];
              const StatusIcon = statusConf.icon;

              return (
                <div
                  key={invoice._id}
                  className={`group bg-white rounded-xl border transition-all duration-300 hover:shadow-lg ${
                    invoice.status !== 'cancelled'
                      ? 'border-slate-200/80 hover:border-slate-300'
                      : 'border-slate-200 opacity-60'
                  }`}
                >
                  {/* Gradient Header Bar */}
                  <div className={`h-1 rounded-t-xl ${invoice.status === 'paid' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' : invoice.status === 'cancelled' ? 'bg-slate-300' : invoice.status === 'overdue' ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800'}`} />

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          invoice.status === 'paid'
                            ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-md shadow-emerald-500/20'
                            : invoice.status === 'overdue'
                            ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-md shadow-red-500/20'
                            : invoice.status === 'cancelled'
                            ? 'bg-slate-200'
                            : 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-md shadow-slate-900/20'
                        }`}>
                          <FileSpreadsheet className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">{invoice.invoiceNumber}</h3>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${statusConf.bg} ${statusConf.color}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {statusConf.label}
                          </span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                        title="Delete invoice"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Client Info */}
                    <div className="mb-3 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <User className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{invoice.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{invoice.clientCompany}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="mb-3 pb-3 border-b border-slate-100">
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(invoice.total)}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                        <Calendar className="h-2.5 w-2.5 text-slate-400 flex-shrink-0" />
                        <span>Due {new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:text-slate-900 hover:border-slate-300 hover:bg-white rounded-md transition-all duration-200"
                        title="View Invoice"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `/public/invoices/${invoice._id}`;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-md transition-all duration-200"
                        title="Download PDF"
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </button>
                      <button
                        onClick={() => router.push(`/${params.domain}/companies/${companyId}/crm/invoices/${invoice._id}/edit`)}
                        className="flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:text-slate-900 hover:border-slate-300 hover:bg-white rounded-md transition-all duration-200"
                        title="Edit Invoice"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="col-span-full py-12 px-5 bg-white rounded-xl shadow-sm border border-slate-200 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {searchQuery || filterStatus !== 'all' ? 'No invoices found' : 'No invoices yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Create your first invoice to get started'}
            </p>
            {(!searchQuery && filterStatus === 'all') && (
              <button
                onClick={() => router.push(`/${params.domain}/companies/${companyId}/crm/invoices/new`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all duration-200 shadow-md shadow-slate-900/20"
              >
                <Plus className="h-4 w-4" />
                Create First Invoice
              </button>
            )}
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className={`px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50`}>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Invoice {selectedInvoice.invoiceNumber}</h3>
                <p className="text-sm text-slate-600 mt-0.5">{selectedInvoice.clientCompany || selectedInvoice.clientName}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-slate-100">
              <div className="max-w-3xl mx-auto my-6 bg-white shadow-lg rounded-lg overflow-hidden">
                <InvoiceTemplate
                  invoiceNumber={selectedInvoice.invoiceNumber}
                  clientName={selectedInvoice.clientName}
                  clientEmail={selectedInvoice.clientEmail}
                  clientCompany={selectedInvoice.clientCompany}
                  clientPhone={selectedInvoice.clientPhone}
                  clientAddress={selectedInvoice.clientAddress}
                  issueDate={selectedInvoice.issueDate}
                  dueDate={selectedInvoice.dueDate}
                  items={selectedInvoice.items}
                  subtotal={selectedInvoice.subtotal}
                  taxRate={selectedInvoice.taxRate}
                  taxAmount={selectedInvoice.taxAmount}
                  total={selectedInvoice.total}
                  notes={selectedInvoice.notes}
                  template={(selectedInvoice as any).template === 'modern' ? 'modern' : 'default'}
                  showBankingDetails={(selectedInvoice as any).showBankingDetails !== false}
                  paymentLink={(selectedInvoice as any).paymentLink}
                  company={{
                    name: company?.name,
                    description: company?.description,
                    logoUrl: company?.branding?.logoUrl,
                    primaryColor: company?.branding?.primaryColor,
                    bankingDetails: company?.bankingDetails,
                  }}
                  formatCurrency={formatCurrency}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-white">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                {selectedInvoice.clientEmail && (
                  <button
                    onClick={() => sendInvoiceEmail(selectedInvoice)}
                    disabled={isSendingEmail}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {isSendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                )}
                {selectedInvoice.status === 'sent' && (
                  <button
                    onClick={handleRecordPayment}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all"
                  >
                    <CreditCard className="h-4 w-4" />
                    Record Payment
                  </button>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[selectedInvoice.status].bg} ${statusConfig[selectedInvoice.status].color}`}>
                    {(() => {
                      const Icon = statusConfig[selectedInvoice.status].icon;
                      return <Icon className="h-3 w-3" />;
                    })()}
                    {statusConfig[selectedInvoice.status].label}
                  </span>
                  <button
                    onClick={() => router.push(`/${params.domain}/companies/${companyId}/crm/invoices/${selectedInvoice._id}/edit`)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
