'use client';

import { cn } from '@/lib/utils';

interface QuoteTemplateModernProps {
  company: any;
  quote: any;
  formatCurrency: (amount: number) => string;
  className?: string;
}

export function QuoteTemplateModern({ company, quote, formatCurrency, className }: QuoteTemplateModernProps) {
  return (
    <div className={cn('bg-white', className)}>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-8 py-8">
        <div className="flex justify-between items-start">
          <div>
            {company?.branding?.logoUrl && (
              <img src={company.branding.logoUrl} alt="Company Logo" className="h-12 mb-4" />
            )}
            <h1 className="text-2xl font-bold text-white">QUOTE</h1>
            <p className="text-slate-300 mt-1">{quote.quoteNumber}</p>
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-white">{company?.name || 'Company Name'}</h3>
            <p className="text-sm text-slate-300">{company?.description}</p>
            {company?.address && <p className="text-xs text-slate-400 mt-1">{company.address}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Prepared For</p>
            <p className="font-medium text-white">{quote.clientName}</p>
            {quote.clientCompany && <p className="text-sm text-slate-300">{quote.clientCompany}</p>}
            {quote.clientEmail && <p className="text-sm text-slate-400">{quote.clientEmail}</p>}
            {quote.clientPhone && <p className="text-sm text-slate-400">{quote.clientPhone}</p>}
          </div>
          <div className="text-right">
            <div className="space-y-2">
              <div className="flex justify-end gap-4">
                <span className="text-slate-400 text-sm">Date</span>
                <span className="text-white text-sm font-medium">{quote.createdAt || new Date().toISOString().split('T')[0]}</span>
              </div>
              {quote.validUntil && (
                <div className="flex justify-end gap-4">
                  <span className="text-slate-400 text-sm">Valid Until</span>
                  <span className="text-white text-sm font-medium">{quote.validUntil}</span>
                </div>
              )}
              <div className="flex justify-end gap-4">
                <span className="text-slate-400 text-sm">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  quote.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                  quote.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  quote.status === 'expired' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-slate-500/20 text-slate-300'
                }`}>
                  {quote.status?.toUpperCase()}
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
            {quote.items?.map((item: any, index: number) => (
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
              <span className="text-slate-900">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.taxRate > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Tax ({quote.taxRate}%)</span>
                <span className="text-slate-900">{formatCurrency(quote.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 bg-slate-900 px-3 rounded-lg mt-2">
              <span className="font-semibold text-white">Total</span>
              <span className="text-lg font-bold text-white">{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="bg-slate-50 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-slate-900 mb-1 text-sm">Notes</h4>
            <p className="text-sm text-slate-600">{quote.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-8 py-4 text-center">
        <p className="text-sm text-slate-500">This quote is valid for 30 days from the date of issue.</p>
        {company?.email && <p className="text-xs text-slate-400 mt-1">{company.email}</p>}
      </div>
    </div>
  );
}