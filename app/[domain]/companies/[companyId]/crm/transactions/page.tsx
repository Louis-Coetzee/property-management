'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '../../../../AuthProvider';
import { NavigationSideSheet, NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { Id } from '@/convex/_generated/dataModel';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Loader2,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
type PaymentMethod = 'eft' | 'card' | 'cash' | 'bank_transfer';

interface Payment {
  _id: string;
  paymentNumber: string;
  invoiceId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  clientName?: string;
  clientCompany?: string;
  invoiceNumber?: string;
  dueDate?: string;
  paidDate?: number;
}

const statusConfig: Record<PaymentStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-red-700', bg: 'bg-red-100', icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'text-slate-700', bg: 'bg-slate-100', icon: ArrowDownCircle }};

const methodConfig: Record<PaymentMethod, { label: string; icon: any }> = {
  eft: { label: 'EFT', icon: ArrowUpCircle },
  card: { label: 'Card', icon: CreditCard },
  cash: { label: 'Cash', icon: Wallet },
  bank_transfer: { label: 'Bank Transfer', icon: ArrowUpCircle }};

export default function TransactionsPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Query company
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Query payments from database
  const paymentsData = useQuery(
    api.payments.listByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Query invoices for reference
  const invoicesData = useQuery(
    api.invoices.listByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : "skip"
  );

  // Query suppliers
  // Mutations
  const deletePayment = useMutation(api.payments.remove);
  const reversePayment = useMutation(api.invoices.reversePayment);

  const handleDelete = async () => {
    if (!deleteTarget || !user?.id) return;
    setIsDeleting(true);
    try {
      // Reverse the linked invoice payment first (if applicable) so amountPaid stays in sync
      if (
        deleteTarget.invoiceId &&
        deleteTarget.status === 'completed' &&
        (deleteTarget.amount || 0) > 0
      ) {
        try {
          await reversePayment({
            userId: user.id as Id<'users'>,
            invoiceId: deleteTarget.invoiceId as any,
            amount: deleteTarget.amount,
          });
        } catch (e) {
          console.error('Failed to reverse invoice payment before delete', e);
        }
      }

      await deletePayment({
        userId: user.id as Id<'users'>,
        paymentId: deleteTarget._id as any,
      });
      toast.success('Transaction deleted');
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  const invoices = invoicesData || [];
  
  const payments: Payment[] = (paymentsData || []).map((payment) => {
    const invoice = invoices.find((inv: any) => inv._id === payment.invoiceId);
    return {
      ...payment,
      clientName: invoice?.clientName || '',
      clientCompany: invoice?.clientCompany || '',
      invoiceNumber: invoice?.invoiceNumber || '',
      dueDate: invoice?.dueDate,
      paidDate: invoice?.paidAt,
    } as Payment;
  });

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      payment.paymentNumber.toLowerCase().includes(q) ||
      (payment.clientName && payment.clientName.toLowerCase().includes(q)) ||
      (payment.clientCompany && payment.clientCompany.toLowerCase().includes(q)) ||
      (payment.invoiceNumber && payment.invoiceNumber.toLowerCase().includes(q)) ||
      (payment.reference && payment.reference.toLowerCase().includes(q)) ||
      ((payment as any).supplierName && (payment as any).supplierName.toLowerCase().includes(q)) ||
      ((payment as any).source && (payment as any).source.toLowerCase().includes(q));

    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesType =
      filterType === 'all' ||
      ((payment as any).type || (payment.invoiceId ? 'income' : 'expense')) === filterType;

    return matchesSearch && matchesStatus && matchesType;
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
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
            <span className="text-slate-900 font-medium">Transactions</span>
          </div>

          {/* Title Section */}
          <div className="pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-5">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <CreditCard className="h-7 w-7 text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Transactions
                  </h1>
                  <p className="text-slate-600 text-base">
                    Track payments, balances, and financial activity
                  </p>
                </div>
              </div>

              {/* Actions - Desktop: right side, Mobile: below title */}
              <div className="flex items-center gap-3 md:gap-4">
                <NavigationMenuButton onClick={() => setIsSideSheetOpen(true)} />
                <button
                  onClick={() =>
                    router.push(`/${params.domain}/companies/${companyId}/crm/transactions/new`)
                  }
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20 md:w-auto w-full"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">New Transaction</span>
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
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filterType === 'income'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Income
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filterType === 'expense'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <ArrowDownCircle className="h-4 w-4" />
                Expense
              </button>
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
              {(Object.keys(statusConfig) as PaymentStatus[]).map((status) => {
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

      {/* Payments List */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {filteredPayments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPayments.map((payment) => {
              const statusConf = statusConfig[payment.status];
              const StatusIcon = statusConf.icon;
              const methodConf = methodConfig[payment.paymentMethod as PaymentMethod] || methodConfig.eft;
              const MethodIcon = methodConf.icon;

              return (
                <div
                  key={payment._id}
                  className={`group bg-white rounded-xl border transition-all duration-300 hover:shadow-lg ${
                    payment.status !== 'failed' && payment.status !== 'refunded'
                      ? 'border-slate-200/80 hover:border-slate-300'
                      : 'border-slate-200 opacity-60'
                  }`}
                >
                  {/* Gradient Header Bar */}
                  <div className={`h-1 rounded-t-xl ${payment.status === 'completed' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' : payment.status === 'pending' ? 'bg-gradient-to-r from-amber-600 to-amber-700' : payment.status === 'failed' ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-slate-300'}`} />

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          payment.status === 'completed'
                            ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-md shadow-emerald-500/20'
                            : payment.status === 'pending'
                            ? 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-md shadow-amber-500/20'
                            : payment.status === 'failed'
                            ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-md shadow-red-500/20'
                            : 'bg-slate-200'
                        }`}>
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">{payment.paymentNumber}</h3>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${statusConf.bg} ${statusConf.color}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {statusConf.label}
                          </span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteTarget(payment)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                        title="Delete transaction"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Client/Source Info */}
                    <div className="mb-3 space-y-0.5">
                      {(payment as any).type === 'expense' ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">
                              {(payment as any).supplierName || (payment as any).source || 'Expense'}
                            </span>
                          </div>
                          {(payment as any).expenseType && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <span className="truncate capitalize">
                                {((payment as any).expenseType as string).replace(/_/g, ' ')}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (payment as any).type === 'income' ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <User className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">
                              {payment.clientName || (payment as any).source || 'Income'}
                            </span>
                          </div>
                          {payment.invoiceNumber && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <span className="truncate">Invoice {payment.invoiceNumber}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <User className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{payment.clientName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{payment.clientCompany}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="mb-3 pb-3 border-b border-slate-100">
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                        <MethodIcon className="h-2.5 w-2.5 text-slate-400 flex-shrink-0" />
                        <span>{methodConf.label}</span>
                        <span className="text-slate-300 mx-0.5">•</span>
                        <Calendar className="h-2.5 w-2.5 text-slate-400 flex-shrink-0" />
                        <span>Due {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() =>
                          router.push(
                            `/${params.domain}/companies/${companyId}/crm/transactions/${payment._id}/edit`
                          )
                        }
                        className="flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:text-slate-900 hover:border-slate-300 hover:bg-white rounded-md transition-all duration-200"
                        title="Edit Transaction"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(payment)}
                        className="flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:text-red-600 hover:border-red-300 hover:bg-red-50 rounded-md transition-all duration-200"
                        title="Delete Transaction"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
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
              <CreditCard className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {searchQuery || filterStatus !== 'all' ? 'No transactions found' : 'No transactions yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Record your first payment to get started'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() =>
                  router.push(`/${params.domain}/companies/${companyId}/crm/transactions/new`)
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all duration-200 shadow-md shadow-slate-900/20"
              >
                <Plus className="h-4 w-4" />
                Record First Transaction
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        itemName={deleteTarget?.paymentNumber || 'Transaction'}
        itemSubtitle={
          deleteTarget?.amount ? formatCurrency(deleteTarget.amount) : undefined
        }
        description="This transaction will be permanently removed. This action cannot be undone."
        isDeleting={isDeleting}
        confirmLabel="Delete Transaction"
      />

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
