'use client';

import { cn } from '@/lib/utils';

interface InvoiceTemplateModernProps {
  company: any;
  invoice: any;
  formatCurrency: (amount: number) => string;
  className?: string;
}

export function InvoiceTemplateModern({ company, invoice, formatCurrency, className }: InvoiceTemplateModernProps) {
  return (
    <div className={cn('bg-white', className)}>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-8 py-8">
        <div className="flex justify-between items-start">
          <div>
            {company?.branding?.logoUrl && (
              <img src={company.branding.logoUrl} alt="Company Logo" className="h-12 mb-4" />
            )}
            <h1 className="text-2xl font-bold text-white">INVOICE</h1>
            <p className="text-slate-300 mt-1">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-white">{company?.name || 'Company Name'}</h3>
            <p className="text-sm text-slate-300">{company?.description}</p>
            {company?.address && <p className="text-xs text-slate-400 mt-1">{company.address}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Bill To</p>
            <p className="font-medium text-white">{invoice.clientName}</p>
            {invoice.clientCompany && <p className="text-sm text-slate-300">{invoice.clientCompany}</p>}
            {invoice.clientEmail && <p className="text-sm text-slate-400">{invoice.clientEmail}</p>}
            {invoice.clientPhone && <p className="text-sm text-slate-400">{invoice.clientPhone}</p>}
          </div>
          <div className="text-right">
            <div className="space-y-2">
              <div className="flex justify-end gap-4">
                <span className="text-slate-400 text-sm">Issue Date</span>
                <span className="text-white text-sm font-medium">{invoice.issueDate}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-slate-400 text-sm">Due Date</span>
                <span className="text-white text-sm font-medium">{invoice.dueDate}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-slate-400 text-sm">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                  invoice.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                  invoice.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-500/20 text-slate-300'
                }`}>
                  {invoice.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
              <th className="text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Price</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any, index: number) => (
              <tr key={index} className="border-b border-slate-100">
                <td className="py-3 text-slate-900">{item.description}</td>
                <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                <td className="py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-right text-slate-900 font-medium">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Subtotal</span>
              <span className="text-slate-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Tax ({invoice.taxRate}%)</span>
                <span className="text-slate-900">{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 bg-slate-900 px-3 rounded-lg mt-2">
              <span className="font-semibold text-white">Total</span>
              <span className="text-lg font-bold text-white">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="bg-slate-50 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-slate-900 mb-1 text-sm">Notes</h4>
            <p className="text-sm text-slate-600">{invoice.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-8 py-4 text-center">
        <p className="text-sm text-slate-500">Thank you for your business!</p>
        {company?.email && <p className="text-xs text-slate-400 mt-1">{company.email}</p>}
      </div>
    </div>
  );
}