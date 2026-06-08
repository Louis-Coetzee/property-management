'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';
import { Id } from '@/convex/_generated/dataModel';
import {
  Receipt,
  Plus,
  Edit2,
  X,
  ChevronRight,
  Download,
  Send,
  Eye,
  Calendar,
  User,
  Building2,
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
  Trash2,
  Check,
  Loader2,
  FilePlus,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  _id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  clientPhone?: string;
  clientAddress?: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  sentAt?: number;
  acceptedAt?: number;
  rejectedAt?: number;
}

const statusConfig: Record<QuoteStatus, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-100', icon: FileText },
  sent: { label: 'Sent', color: 'text-blue-700', bg: 'bg-blue-100', icon: Send },
  accepted: { label: 'Accepted', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: TrendingUp },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100', icon: X },
  expired: { label: 'Expired', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock }};

export default function QuotesPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | 'all'>('all');

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Query quotes from database
  const quotesData = useQuery(
    api.quotes.listByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Mutations
  const createQuote = useMutation(api.quotes.create);
  const updateQuote = useMutation(api.quotes.update);
  const deleteQuote = useMutation(api.quotes.remove);
  const markQuoteAsSent = useMutation(api.quotes.markAsSent);
  const markQuoteAsAccepted = useMutation(api.quotes.markAsAccepted);
  const markQuoteAsRejected = useMutation(api.quotes.markAsRejected);
  const createInvoiceFromQuote = useMutation(api.invoices.createFromQuote);

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertDueDate, setConvertDueDate] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const quotes: Quote[] = (quotesData || []) as Quote[];

  // Filter quotes
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = searchQuery === '' ||
      quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quote.clientCompany && quote.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;

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
            <a href={`/companies/${companyId}/manage`} className="text-slate-500 hover:text-slate-700 transition-colors">{company.name}</a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <a href={`/companies/${companyId}/crm`} className="text-slate-500 hover:text-slate-700 transition-colors">CRM</a>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Quotes</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-5">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Receipt className="h-7 w-7 text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-[#00072e] tracking-tight">
                    Quotes
                  </h1>
                  <p className="text-slate-600 text-base">
                    Create and manage price quotes
                  </p>
                </div>
              </div>

              {/* Actions - Desktop: right side, Mobile: below title */}
              <div className="flex items-center gap-3 md:gap-4">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={() => router.push(`/${params.domain}/companies/${companyId}/crm/quotes/new`)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20 md:w-auto w-full"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">New Quote</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
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
              {(Object.keys(statusConfig) as QuoteStatus[]).map((status) => {
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

      {/* Quotes List */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {filteredQuotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuotes.map((quote) => {
              const statusConf = statusConfig[quote.status];
              const StatusIcon = statusConf.icon;
              const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date() && quote.status === 'sent';

              return (
                <div
                  key={quote._id}
                  className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                    quote.status !== 'rejected'
                      ? 'border-slate-200/80 hover:border-slate-300'
                      : 'border-slate-200 opacity-60'
                  }`}
                >
                  {/* Gradient Header Bar */}
                  <div className={`h-1.5 rounded-t-2xl ${quote.status === 'accepted' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' : quote.status === 'rejected' ? 'bg-slate-300' : 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800'}`} />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                          quote.status === 'accepted'
                            ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-500/20'
                            : quote.status === 'rejected'
                            ? 'bg-slate-200'
                            : 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-900/20'
                        }`}>
                          <Receipt className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 leading-tight">{quote.quoteNumber}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${statusConf.bg} ${statusConf.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusConf.label}
                            </span>
                            {isExpired && (
                              <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Expired
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                        title="Delete quote"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Client Info */}
                    <div className="mb-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{quote.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{quote.clientCompany}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="mb-4 pb-4 border-b border-slate-100">
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(quote.total)}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Calendar className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span>Valid until {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedQuote(quote)}
                        className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-all duration-200"
                        title="View Quote"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      {quote.status === 'accepted' ? (
                        <button
                          onClick={() => {
                            setSelectedQuote(quote);
                            setConvertDueDate('');
                            setShowConvertModal(true);
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-emerald-600 border border-emerald-600 hover:bg-emerald-700 rounded-lg transition-all duration-200"
                          title="Convert to Invoice"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          Invoice
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `/public/quotes/${quote._id}`;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </button>
                      )}
                    </div>
                    {quote.status !== 'accepted' && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          onClick={() => router.push(`/${params.domain}/companies/${companyId}/crm/quotes/${quote._id}/edit`)}
                          className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-all duration-200"
                          title="Edit Quote"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="col-span-full py-16 px-5 bg-white rounded-2xl shadow-lg border border-slate-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No quotes found' : 'No quotes yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Create your first quote to get started'}
            </p>
            {(!searchQuery && filterStatus === 'all') && (
              <button
                onClick={() => router.push(`/${params.domain}/companies/${companyId}/crm/quotes/new`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-4 w-4" />
                Create First Quote
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quote Detail Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700 px-5 py-4 z-10 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedQuote.quoteNumber}</h3>
                  <p className="text-slate-300 text-sm mt-1">{selectedQuote.clientCompany}</p>
                </div>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Contact Person</p>
                  <p className="font-semibold text-slate-900">{selectedQuote.clientName}</p>
                  <p className="text-sm text-slate-600">{selectedQuote.clientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Valid Until</p>
                  <p className="font-semibold text-slate-900">{selectedQuote.validUntil ? new Date(selectedQuote.validUntil).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              {/* Line Items */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Quote Items</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 text-sm font-semibold text-slate-700">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {selectedQuote.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-4 px-4 py-3 text-sm">
                        <div className="col-span-6 text-slate-900">{item.description}</div>
                        <div className="col-span-2 text-center text-slate-700">{item.quantity}</div>
                        <div className="col-span-2 text-right text-slate-700">{formatCurrency(item.unitPrice)}</div>
                        <div className="col-span-2 text-right font-medium text-slate-900">{formatCurrency(item.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(selectedQuote.subtotal)}</span>
                  </div>
                  {selectedQuote.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">VAT ({selectedQuote.taxRate}%)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(selectedQuote.taxAmount)}</span>
                  </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-200">
                    <span className="text-slate-900">Total</span>
                    <span className="text-slate-900">{formatCurrency(selectedQuote.total)}</span>
                  </div>
                </div>
              </div>

              {selectedQuote.notes && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Notes</h4>
                  <p className="text-slate-700 bg-slate-50 rounded-xl p-4">{selectedQuote.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20">
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                {selectedQuote.status === 'draft' && (
                  <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all">
                    <Send className="h-4 w-4" />
                    Send to Client
                  </button>
                )}
                <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Invoice Modal */}
      {showConvertModal && selectedQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-6 rounded-t-3xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Convert to Invoice</h3>
                  <p className="text-white/80 mt-1">Create an invoice from quote {selectedQuote.quoteNumber}</p>
                </div>
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-slate-600 mb-2">Quote Details</p>
                <p className="font-semibold text-slate-900">{selectedQuote.clientName}</p>
                {selectedQuote.clientCompany && (
                  <p className="text-sm text-slate-600">{selectedQuote.clientCompany}</p>
                )}
                <p className="text-lg font-bold text-emerald-600 mt-2">{formatCurrency(selectedQuote.total)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={convertDueDate}
                  onChange={(e) => setConvertDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!convertDueDate) {
                      toast.error('Please select a due date');
                      return;
                    }
                    if (!user?.id || !companyId) {
                      toast.error('User or company not found');
                      return;
                    }
                    
                    setIsConverting(true);
                    try {
                      const result = await createInvoiceFromQuote({
                        userId: user.id as any,
                        companyId: companyId as any,
                        quoteId: selectedQuote._id as any,
                        invoiceNumber: `INV-${Date.now()}`,
                        dueDate: convertDueDate,
                      });
                      
                      if (result.success) {
                        toast.success('Invoice created successfully!');
                        setShowConvertModal(false);
                      }
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to create invoice');
                    } finally {
                      setIsConverting(false);
                    }
                  }}
                  disabled={isConverting || !convertDueDate}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConverting ? 'Creating...' : 'Create Invoice'}
                </button>
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
