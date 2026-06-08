'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Building2,
  User,
  FileText,
  Wallet,
  CreditCard,
  Banknote,
  CheckCircle2,
  Calendar,
  Hash,
  Loader2,
  Save,
  ChevronRight,
  Check,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Stepper, { Step } from '@/components/ui/Stepper';
import { NavigationMenuButton } from '@/components/navigation/NavigationSideSheet';

type TransactionType = 'income' | 'expense';
type IncomeSource = 'invoice' | 'other';
type ExpenseSource = 'supplier' | 'other';
type PaymentMethod = 'cash' | 'card' | 'eft' | 'bank_transfer' | 'other';
type Status = 'pending' | 'completed' | 'failed' | 'refunded';

const paymentMethods: { value: PaymentMethod; label: string; icon: any }[] = [
  { value: 'eft', label: 'EFT / Bank Transfer', icon: ArrowUpCircle },
  { value: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank_transfer', label: 'Direct Bank Transfer', icon: Banknote },
  { value: 'other', label: 'Other', icon: Hash },
];

const expenseTypes = [
  { value: 'operating', label: 'Operating Cost' },
  { value: 'materials', label: 'Materials / Inventory' },
  { value: 'salary', label: 'Salary / Wages' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'travel', label: 'Travel' },
  { value: 'rent', label: 'Rent / Lease' },
  { value: 'tax', label: 'Tax' },
  { value: 'other', label: 'Other' },
];

const incomeSteps: Step[] = [
  { id: 1, title: 'Type', description: 'Income or expense' },
  { id: 2, title: 'Source', description: 'Invoice or other' },
  { id: 3, title: 'Details', description: 'Method & notes' },
  { id: 4, title: 'Review', description: 'Confirm' },
];

const expenseSteps: Step[] = [
  { id: 1, title: 'Type', description: 'Income or expense' },
  { id: 2, title: 'Source', description: 'Supplier or other' },
  { id: 3, title: 'Details', description: 'Category & notes' },
  { id: 4, title: 'Review', description: 'Confirm' },
];

export default function NewTransactionPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const domain = params.domain as string;
  const companyId = params.companyId as string;

  const createTransaction = useMutation(api.payments.create);
  const applyPayment = useMutation(api.invoices.applyPayment);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [type, setType] = useState<TransactionType>('income');
  const [incomeSource, setIncomeSource] = useState<IncomeSource>('invoice');
  const [expenseSource, setExpenseSource] = useState<ExpenseSource>('supplier');
  const [invoiceId, setInvoiceId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [source, setSource] = useState('');
  const [expenseType, setExpenseType] = useState('operating');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('eft');
  const [status, setStatus] = useState<Status>('completed');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentScope, setPaymentScope] = useState<'full' | 'partial'>('full');

  // Queries
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id ? { userId: user.id as any, companyId: companyId as any } : 'skip'
  );

  const invoices = useQuery(
    api.invoices.listByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : 'skip'
  );

  const suppliers = useQuery(
    api.suppliers.getSuppliersByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : 'skip'
  );

  const clients = useQuery(
    api.clients.getClientsByCompany,
    user?.id && companyId ? { userId: user.id as any, companyId: companyId as any } : 'skip'
  );

  const formatCurrency = (v: number) => {
    const code = company?.currency?.code || 'ZAR';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: code }).format(v || 0);
  };

  const selectedInvoice = useMemo(
    () => (invoices as any[] | undefined)?.find((i) => i._id === invoiceId),
    [invoices, invoiceId]
  );

  // Computed outstanding amount for the currently selected invoice
  const invoiceOutstanding = useMemo(() => {
    if (!selectedInvoice) return 0;
    return Math.max(
      0,
      (selectedInvoice.total || 0) - (selectedInvoice.amountPaid || 0)
    );
  }, [selectedInvoice]);

  // Auto-fill amount and client when invoice selected / payment scope changes
  useEffect(() => {
    if (incomeSource === 'invoice' && selectedInvoice) {
      if (selectedInvoice.clientName && !clientName) setClientName(selectedInvoice.clientName);
      if (selectedInvoice.clientId && !clientId) setClientId(selectedInvoice.clientId);
    }
    if (incomeSource === 'invoice' && selectedInvoice && paymentScope === 'full') {
      setAmount(invoiceOutstanding);
    }
  }, [selectedInvoice, incomeSource, paymentScope, invoiceOutstanding]);

  // Reset amount to 0 when switching to partial
  useEffect(() => {
    if (incomeSource === 'invoice' && paymentScope === 'partial' && amount === invoiceOutstanding) {
      setAmount(0);
    }
  }, [paymentScope]);

  const currentSteps = type === 'income' ? incomeSteps : expenseSteps;

  // Validation per step
  const canProceed = () => {
    if (step === 1) return !!type;
    if (step === 2) {
      if (type === 'income') {
        if (incomeSource === 'invoice') {
          if (!invoiceId || amount <= 0) return false;
          // For partial, amount must not exceed outstanding
          if (paymentScope === 'partial' && selectedInvoice) {
            return amount <= invoiceOutstanding;
          }
          return true;
        }
        return source.trim() !== '' && amount > 0;
      } else {
        if (expenseSource === 'supplier') return !!supplierId && amount > 0;
        return source.trim() !== '' && amount > 0;
      }
    }
    if (step === 3) return !!paymentMethod && !!status && !!transactionDate;
    return true;
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.push(`/${domain}/companies/${companyId}/crm/transactions`);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        userId: user.id as any,
        companyId: companyId as any,
        type,
        amount,
        paymentMethod,
        status,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        transactionDate,
        expenseType: type === 'expense' ? expenseType : undefined,
        source:
          type === 'income'
            ? incomeSource === 'other'
              ? source
              : undefined
            : expenseSource === 'other'
            ? source
            : undefined,
      };

      if (type === 'income') {
        if (incomeSource === 'invoice' && invoiceId) {
          payload.invoiceId = invoiceId as any;
          if (clientId) payload.clientId = clientId as any;
          if (clientName) payload.clientName = clientName;
        }
      } else {
        if (expenseSource === 'supplier' && supplierId) {
          payload.supplierId = supplierId as any;
          if (supplierName) payload.supplierName = supplierName;
        }
      }

      const result = await createTransaction(payload);
      if (!result?.success) {
        throw new Error('Failed to save transaction');
      }

      // Apply payment to invoice if linked + completed
      if (
        type === 'income' &&
        incomeSource === 'invoice' &&
        invoiceId &&
        status === 'completed'
      ) {
        const applyResult = await applyPayment({
          userId: user.id as any,
          invoiceId: invoiceId as any,
          amount,
        });
        if (applyResult?.isFullyPaid) {
          toast.success('Transaction saved — invoice marked as fully paid!');
        } else {
          toast.success(
            `Transaction saved. Invoice outstanding: ${formatCurrency(
              applyResult?.outstanding || 0
            )}`
          );
        }
      } else {
        toast.success(`${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`);
      }

      router.push(`/${domain}/companies/${companyId}/crm/transactions`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-slate-900 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const stepContent = () => {
    if (step === 1) {
      return (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            What type of transaction is this?
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Choose whether money is coming in or going out.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`relative p-6 sm:p-8 rounded-2xl border-2 text-left transition-all ${
                type === 'income'
                  ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {type === 'income' && (
                <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
              )}
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                <ArrowUpCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="font-bold text-slate-900 text-lg">Income</p>
              <p className="text-sm text-slate-500 mt-1">
                Money received from a client, customer, or other source.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setType('expense')}
              className={`relative p-6 sm:p-8 rounded-2xl border-2 text-left transition-all ${
                type === 'expense'
                  ? 'border-rose-500 bg-rose-50 ring-4 ring-rose-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {type === 'expense' && (
                <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
              )}
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-3">
                <ArrowDownCircle className="h-6 w-6 text-rose-600" />
              </div>
              <p className="font-bold text-slate-900 text-lg">Expense</p>
              <p className="text-sm text-slate-500 mt-1">
                Money paid out to a supplier, vendor, or for other costs.
              </p>
            </button>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {type === 'income' ? 'Where is this income from?' : 'Where is this expense going?'}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            {type === 'income'
              ? 'Link to an existing invoice or record other income.'
              : 'Select a supplier or record another type of expense.'}
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {type === 'income' ? (
              <>
                <SourceOption
                  selected={incomeSource === 'invoice'}
                  onClick={() => setIncomeSource('invoice')}
                  icon={FileText}
                  title="Existing Invoice"
                  description="Link this income to a paid invoice"
                />
                <SourceOption
                  selected={incomeSource === 'other'}
                  onClick={() => setIncomeSource('other')}
                  icon={ArrowUpCircle}
                  title="Other Income"
                  description="Record income not tied to an invoice"
                />
              </>
            ) : (
              <>
                <SourceOption
                  selected={expenseSource === 'supplier'}
                  onClick={() => setExpenseSource('supplier')}
                  icon={Building2}
                  title="Existing Supplier"
                  description="Pay a known supplier / vendor"
                />
                <SourceOption
                  selected={expenseSource === 'other'}
                  onClick={() => setExpenseSource('other')}
                  icon={ArrowDownCircle}
                  title="Other Expense"
                  description="Record an expense not tied to a supplier"
                />
              </>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {type === 'income' && incomeSource === 'invoice' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Invoice <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                  >
                    <option value="">Choose an invoice…</option>
                    {(invoices as any[] | undefined)?.map((inv) => {
                      const due = Math.max(0, (inv.total || 0) - (inv.amountPaid || 0));
                      const partial = (inv.amountPaid || 0) > 0;
                      return (
                        <option key={inv._id} value={inv._id}>
                          {inv.invoiceNumber} — {inv.clientName} (
                          {partial
                            ? `${formatCurrency(due)} due of ${formatCurrency(inv.total)}`
                            : `${formatCurrency(due)} due`}
                          )
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedInvoice && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="text-slate-500">Total</p>
                        <p className="font-semibold text-slate-900 mt-0.5">
                          {formatCurrency(selectedInvoice.total || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Paid</p>
                        <p className="font-semibold text-emerald-600 mt-0.5">
                          {formatCurrency(selectedInvoice.amountPaid || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Outstanding</p>
                        <p className="font-semibold text-amber-600 mt-0.5">
                          {formatCurrency(invoiceOutstanding)}
                        </p>
                      </div>
                    </div>

                    {(selectedInvoice.amountPaid || 0) > 0 && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        This invoice has prior payments of{' '}
                        <strong>{formatCurrency(selectedInvoice.amountPaid || 0)}</strong>.
                        Outstanding balance is <strong>{formatCurrency(invoiceOutstanding)}</strong>.
                      </p>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Payment Type
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentScope('full')}
                          disabled={invoiceOutstanding <= 0}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            paymentScope === 'full'
                              ? 'border-slate-900 bg-white ring-4 ring-slate-900/10'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            Pay full outstanding
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatCurrency(invoiceOutstanding)} — invoice will be marked as paid
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentScope('partial')}
                          disabled={invoiceOutstanding <= 0}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            paymentScope === 'partial'
                              ? 'border-slate-900 bg-white ring-4 ring-slate-900/10'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            Partial amount
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Pay a portion — invoice stays open
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {type === 'income' && incomeSource === 'other' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Income Source <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Bank interest, Refund received, Investment"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                />
              </div>
            )}

            {type === 'expense' && expenseSource === 'supplier' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    const s = (suppliers as any[] | undefined)?.find((x) => x._id === e.target.value);
                    if (s) setSupplierName(s.name);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                >
                  <option value="">Choose a supplier…</option>
                  {(suppliers as any[] | undefined)?.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type === 'expense' && expenseSource === 'other' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expense Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Office supplies, Internet bill"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                />
              </div>
            )}

            {type === 'expense' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expense Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                >
                  {expenseTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">
                    {company?.currency?.symbol || 'R'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={
                      type === 'income' &&
                      incomeSource === 'invoice' &&
                      paymentScope === 'partial'
                        ? invoiceOutstanding
                        : undefined
                    }
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm font-semibold"
                    placeholder="0.00"
                  />
                </div>
                {type === 'income' &&
                  incomeSource === 'invoice' &&
                  paymentScope === 'partial' &&
                  amount > invoiceOutstanding && (
                    <p className="text-xs text-red-600 mt-1">
                      Amount cannot exceed outstanding balance of {formatCurrency(invoiceOutstanding)}.
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Payment details
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            How was this transaction processed?
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm transition-all ${
                        paymentMethod === m.value
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${paymentMethod === m.value ? 'text-slate-900' : 'text-slate-500'}`} />
                      <span className={paymentMethod === m.value ? 'text-slate-900 font-medium' : 'text-slate-700'}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reference <span className="text-slate-400 text-xs font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. bank reference, receipt #"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes <span className="text-slate-400 text-xs font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any extra context..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      );
    }

    // step 4 - review
    return (
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Review &amp; confirm
        </h2>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Please check the details below before saving.
        </p>

        <div className="mt-6 space-y-4">
          <SummaryCard
            label={type === 'income' ? 'Income From' : 'Expense To'}
            value={
              type === 'income'
                ? incomeSource === 'invoice'
                  ? `Invoice ${selectedInvoice?.invoiceNumber || ''} — ${clientName || ''}`
                  : source
                : expenseSource === 'supplier'
                ? supplierName
                : source
            }
            tone={type === 'income' ? 'emerald' : 'rose'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SummaryCard
              label="Amount"
              value={formatCurrency(amount)}
              highlight
            />
            <SummaryCard
              label="Type"
              value={type === 'income' ? 'Income' : 'Expense'}
            />
            <SummaryCard
              label="Payment Method"
              value={paymentMethods.find((m) => m.value === paymentMethod)?.label || paymentMethod}
            />
            <SummaryCard
              label="Status"
              value={status.charAt(0).toUpperCase() + status.slice(1)}
            />
            <SummaryCard
              label="Transaction Date"
              value={transactionDate}
            />
            {type === 'expense' && (
              <SummaryCard
                label="Expense Category"
                value={expenseTypes.find((t) => t.value === expenseType)?.label || expenseType}
              />
            )}
            {reference && <SummaryCard label="Reference" value={reference} />}
          </div>

          {type === 'income' && incomeSource === 'invoice' && selectedInvoice && (
            <div
              className={`rounded-xl border p-4 ${
                paymentScope === 'full'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <p className={`text-sm font-semibold ${paymentScope === 'full' ? 'text-emerald-900' : 'text-amber-900'}`}>
                {paymentScope === 'full'
                  ? '✓ This will fully pay the invoice'
                  : '◐ This is a partial payment'}
              </p>
              <p className={`text-xs mt-1 ${paymentScope === 'full' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {paymentScope === 'full'
                  ? `After saving, the invoice will be marked as Paid.`
                  : `After saving, ${formatCurrency(
                      Math.max(0, invoiceOutstanding - amount)
                    )} will still be outstanding on this invoice.`}
              </p>
            </div>
          )}

          {notes && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-sm text-slate-900 whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 sm:pb-12">
      <Toaster position="top-right" />

      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  New Transaction
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 truncate">
                  Step {step} of 4 — {currentSteps[step - 1]?.title}
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <NavigationMenuButton onClick={() => {}} />
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Stepper steps={currentSteps} currentStep={step} />
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8">
          {stepContent()}
        </div>
      </div>

      {/* Footer (mobile sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 sm:relative sm:border-0 sm:bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl py-3 sm:py-6 sm:px-0">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-100 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {step === 1 ? 'Cancel' : 'Back'}
              </span>
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || amount <= 0}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm &amp; Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceOption({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
        selected
          ? 'border-slate-900 bg-slate-50 ring-4 ring-slate-900/10'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {selected && (
        <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center">
          <Check className="h-3.5 w-3.5 text-white" />
        </span>
      )}
      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>
      <p className="font-semibold text-slate-900 text-sm sm:text-base">{title}</p>
      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{description}</p>
    </button>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
  tone,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: 'emerald' | 'rose';
}) {
  const toneClasses =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : 'border-slate-200 bg-slate-50 text-slate-900';
  return (
    <div className={`rounded-xl border p-4 ${toneClasses} ${highlight ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className={`mt-1 font-semibold ${highlight ? 'text-2xl' : 'text-base'} break-words`}>
        {value || '—'}
      </p>
    </div>
  );
}
