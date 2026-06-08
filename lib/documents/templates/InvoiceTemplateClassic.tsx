'use client';

import { cn } from '@/lib/utils';

interface InvoiceTemplateClassicProps {
  company: any;
  invoice: any;
  formatCurrency: (amount: number) => string;
  className?: string;
}

export function InvoiceTemplateClassic({ company, invoice, formatCurrency, className }: InvoiceTemplateClassicProps) {
  return (
    <div className={cn('bg-white p-8', className)}>
      <div className="flex justify-between items-start mb-8">
        <div>
          {company?.branding?.logoUrl && (
            <img src={company.branding.logoUrl} alt="Company Logo" className="h-16 mb-4" />
          )}
          <h1 className="text-3xl font-bold text-slate-900">INVOICE</h1>
          <p className="text-slate-600 mt-1">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <h3 className="font-semibold text-slate-900">{company?.name || 'Company Name'}</h3>
          <p className="text-sm text-slate-600">{company?.description}</p>
          {company?.address && <p className="text-sm text-slate-500 mt-1">{company.address}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-2">Bill To:</h4>
          <p className="font-medium text-slate-900">{invoice.clientName}</p>
          {invoice.clientCompany && <p className="text-slate-600">{invoice.clientCompany}</p>}
          {invoice.clientEmail && <p className="text-sm text-slate-500">{invoice.clientEmail}</p>}
          {invoice.clientPhone && <p className="text-sm text-slate-500">{invoice.clientPhone}</p>}
          {invoice.clientAddress && <p className="text-sm text-slate-500">{invoice.clientAddress}</p>}
        </div>
        <div className="text-right">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Issue Date:</span>
              <span className="text-slate-900">{invoice.issueDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Due Date:</span>
              <span className="text-slate-900">{invoice.dueDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {invoice.status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-3 text-sm font-semibold text-slate-700">Description</th>
            <th className="text-center py-3 text-sm font-semibold text-slate-700">Qty</th>
            <th className="text-right py-3 text-sm font-semibold text-slate-700">Unit Price</th>
            <th className="text-right py-3 text-sm font-semibold text-slate-700">Total</th>
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

      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span className="text-slate-600">Subtotal</span>
            <span className="text-slate-900">{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.taxRate > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-slate-600">Tax ({invoice.taxRate}%)</span>
              <span className="text-slate-900">{formatCurrency(invoice.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-slate-900">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="text-2xl font-bold text-slate-900">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="bg-slate-50 rounded-lg p-4 mb-8">
          <h4 className="font-medium text-slate-900 mb-2">Notes</h4>
          <p className="text-sm text-slate-600">{invoice.notes}</p>
        </div>
      )}

      <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-200">
        <p>Thank you for your business!</p>
        {company?.email && <p>{company.email}</p>}
      </div>
    </div>
  );
}