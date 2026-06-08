'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, CreditCard, Download, Share2, Mail, Phone, 
  MapPin, Calendar, CheckCircle, Clock, AlertCircle, Loader2
} from 'lucide-react';
import { InvoiceTemplateClassic, InvoiceTemplateModern } from '@/lib/documents/templates';
import InvoiceTemplate from '@/components/invoices/InvoiceTemplate';
import toast, { Toaster } from 'react-hot-toast';

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
  status: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  dueDate: string;
  issueDate: string;
  notes?: string;
  template?: string;
  paymentLink?: string;
  showBankingDetails?: boolean;
  companyId: string;
}

interface Company {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
  currency?: {
    code?: string;
    symbol?: string;
    symbolPosition?: 'before' | 'after';
  };
  bankingDetails?: {
    bankName?: string;
    branchCode?: string;
    accountType?: string;
    accountNumber?: string;
    accountHolder?: string;
    swiftCode?: string;
  };
  paymentSettings?: {
    payfast?: {
      enabled: boolean;
      testMode: boolean;
      merchantId?: string;
    };
    paypal?: {
      enabled: boolean;
      testMode: boolean;
    };
  };
}

export default function PublicInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const printRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{ invoice: Invoice; company: Company } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'payfast' | 'paypal' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const result = useQuery(api.invoices.getByPublicToken, { publicToken: token });
  const processPayment = useMutation(api.invoices.processPayment);

  useEffect(() => {
    if (result) {
      setData(result as any);
      setIsLoading(false);
    }
  }, [result]);

  const handlePayNow = async () => {
    if (!data?.invoice) return;
    setIsProcessing(true);
    try {
      await processPayment({ invoiceId: data.invoice._id as any });
      setShowPaymentModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Payment failed:', error);
    }
    setIsProcessing(false);
  };

  const handlePayFastPayment = async () => {
    if (!data?.invoice) return;
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/payfast/create-invoice-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: data.invoice._id,
          amount: data.invoice.total,
          itemName: `Invoice ${data.invoice.invoiceNumber}`,
          companyId: data.invoice.companyId,
        }),
      });

      const result = await response.json();
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error('Failed to initiate payment');
      }
    } catch (error) {
      toast.error('Payment error');
    }
    setIsProcessing(false);
  };

  const handlePayPalPayment = async () => {
    if (!data?.invoice) return;
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/paypal/create-invoice-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: data.invoice._id,
          amount: data.invoice.total,
          description: `Invoice ${data.invoice.invoiceNumber}`,
          companyId: data.invoice.companyId,
        }),
      });

      const result = await response.json();
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error('Failed to initiate payment');
      }
    } catch (error) {
      toast.error('Payment error');
    }
    setIsProcessing(false);
  };

  const handleDownloadPDF = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${data?.invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111827; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .logo { max-height: 60px; }
            .invoice-title { font-size: 32px; font-weight: 700; color: #111827; }
            .invoice-number { color: #6b7280; margin-top: 4px; }
            .company-info { text-align: right; }
            .company-name { font-weight: 600; font-size: 18px; }
            .company-details { color: #6b7280; font-size: 14px; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .label { color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .value { font-weight: 500; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .items-table th { background: #111827; color: white; padding: 12px; text-align: left; font-size: 12px; }
            .items-table th:nth-child(2), .items-table th:nth-child(3), .items-table th:nth-child(4) { text-align: right; }
            .items-table th:nth-child(2) { text-align: center; }
            .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .items-table td:nth-child(2) { text-align: center; }
            .items-table td:nth-child(3), .items-table td:nth-child(4) { text-align: right; }
            .totals { margin-left: auto; width: 280px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals-row.total { border-top: 2px solid #111827; margin-top: 8px; padding-top: 16px; font-weight: 700; font-size: 20px; }
            .notes { margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; }
            .notes-title { font-weight: 600; margin-bottom: 8px; }
            .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const formatCurrency = (value: number): string => {
    if (!data?.company?.currency) return `R${value.toFixed(2)}`;
    const { code, symbol, symbolPosition } = data.company.currency;
    const currencyCode = code || 'ZAR';
    const currencySymbol = symbol || (currencyCode === 'ZAR' ? 'R' : '$');
    const formatted = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    if (symbolPosition === 'after') {
      return value.toFixed(2) + ' ' + currencySymbol;
    }
    return formatted;
  };

  const shareViaWhatsApp = () => {
    const text = `Invoice ${data?.invoice.invoiceNumber} from ${data?.company.name}: ${formatCurrency(data?.invoice.total || 0)}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Invoice ${data?.invoice.invoiceNumber} from ${data?.company.name}`;
    const body = `Dear ${data?.invoice.clientName},\n\nPlease find your invoice ${data?.invoice.invoiceNumber} for ${formatCurrency(data?.invoice.total || 0)}.\n\nView online: ${window.location.href}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle };
      case 'sent':
        return { label: 'Sent', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock };
      case 'overdue':
        return { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-100', icon: AlertCircle };
      case 'draft':
        return { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-100', icon: Clock };
      default:
        return { label: status, color: 'text-slate-700', bg: 'bg-slate-100', icon: Clock };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invoice Not Found</h1>
          <p className="text-slate-600">This invoice may not exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  const { invoice, company } = data;
  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;
  const primaryColor = company.branding?.primaryColor || '#4F46E5';
  
  const payfastEnabled = company.paymentSettings?.payfast?.enabled || false;
  const paypalEnabled = company.paymentSettings?.paypal?.enabled || false;
  const payfastTestMode = company.paymentSettings?.payfast?.testMode ?? true;
  const paypalTestMode = company.paymentSettings?.paypal?.testMode ?? true;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={copyLink}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Copy Link"
            >
              <Share2 className="h-5 w-5 text-slate-600" />
            </button>
            <button
              onClick={shareViaWhatsApp}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Share via WhatsApp"
            >
              <Phone className="h-5 w-5 text-slate-600" />
            </button>
            <button
              onClick={shareViaEmail}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Share via Email"
            >
              <Mail className="h-5 w-5 text-slate-600" />
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Download PDF"
            >
              <Download className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div ref={printRef} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <InvoiceTemplate
            invoiceNumber={invoice.invoiceNumber}
            clientName={invoice.clientName}
            clientEmail={invoice.clientEmail}
            clientCompany={invoice.clientCompany}
            clientPhone={invoice.clientPhone}
            clientAddress={invoice.clientAddress}
            issueDate={invoice.issueDate}
            dueDate={invoice.dueDate}
            items={invoice.items}
            subtotal={invoice.subtotal}
            taxRate={invoice.taxRate}
            taxAmount={invoice.taxAmount}
            total={invoice.total}
            notes={invoice.notes}
            template={invoice.template === 'modern' ? 'modern' : 'default'}
            showBankingDetails={invoice.showBankingDetails !== false}
            paymentLink={invoice.paymentLink}
            company={{
              name: company.name,
              description: company.description,
              email: company.email,
              phone: company.phone,
              logoUrl: company.branding?.logoUrl,
              primaryColor: company.branding?.primaryColor,
              bankingDetails: company.bankingDetails,
            }}
            formatCurrency={formatCurrency}
          />

          {/* Pay Button */}
          {invoice.status !== 'paid' && (
            <div className="px-8 py-8 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-600 text-sm">Balance Due</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(invoice.total - invoice.amountPaid)}</p>
                </div>
                <div className="flex gap-3">
                  {invoice.paymentLink ? (
                    <a
                      href={invoice.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white text-lg font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                    >
                      <CreditCard className="h-5 w-5" />
                      Pay Now
                    </a>
                  ) : (payfastEnabled || paypalEnabled) ? (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white text-lg font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                    >
                      <CreditCard className="h-5 w-5" />
                      Pay Now
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white text-lg font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                    >
                      <CreditCard className="h-5 w-5" />
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Powered by Refresh CRM</p>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Select Payment Method</h3>
            <p className="text-slate-600 mb-6">
              Invoice <span className="font-semibold">{invoice.invoiceNumber}</span> - <span className="font-bold text-xl">{formatCurrency(invoice.total)}</span>
            </p>

            <div className="space-y-3 mb-6">
              {payfastEnabled && (
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    handlePayFastPayment();
                  }}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl hover:border-slate-900 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <span className="text-amber-700 font-bold text-sm">PF</span>
                    </div>
                    <span className="font-medium text-slate-900">PayFast</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${payfastTestMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {payfastTestMode ? 'Test' : 'Live'}
                  </span>
                </button>
              )}
              
              {paypalEnabled && (
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    handlePayPalPayment();
                  }}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl hover:border-slate-900 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">PP</span>
                    </div>
                    <span className="font-medium text-slate-900">PayPal</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${paypalTestMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {paypalTestMode ? 'Test' : 'Live'}
                  </span>
                </button>
              )}

              {!payfastEnabled && !paypalEnabled && (
                <button
                  onClick={handlePayNow}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center p-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all"
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Payment'}
                </button>
              )}
            </div>

            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}