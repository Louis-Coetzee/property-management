'use client';

import { Building2, Banknote } from 'lucide-react';

export type InvoiceTemplateType = 'default' | 'modern';

export interface InvoiceTemplateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceTemplateBanking {
  bankName?: string;
  branchCode?: string;
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;
  swiftCode?: string;
}

export interface InvoiceTemplateProps {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  clientPhone?: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceTemplateItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  template: InvoiceTemplateType;
  showBankingDetails?: boolean;
  paymentLink?: string;
  company: {
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
    primaryColor?: string;
    bankingDetails?: InvoiceTemplateBanking;
  };
  formatCurrency: (value: number) => string;
}

function BankingDetailsBlock({ banking, accent }: { banking: InvoiceTemplateBanking; accent: string }) {
  const hasAny = banking.bankName || banking.accountNumber || banking.branchCode || banking.accountHolder;
  if (!hasAny) return null;
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginTop: 24 }}>
      <p style={{ color: accent, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Banknote style={{ width: 14, height: 14 }} /> Banking Details
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13 }}>
        {banking.accountHolder && (
          <>
            <span style={{ color: '#6b7280' }}>Account Holder</span>
            <span style={{ color: '#111827', fontWeight: 500 }}>{banking.accountHolder}</span>
          </>
        )}
        {banking.bankName && (
          <>
            <span style={{ color: '#6b7280' }}>Bank</span>
            <span style={{ color: '#111827', fontWeight: 500 }}>{banking.bankName}</span>
          </>
        )}
        {banking.accountType && (
          <>
            <span style={{ color: '#6b7280' }}>Account Type</span>
            <span style={{ color: '#111827', fontWeight: 500, textTransform: 'capitalize' }}>{banking.accountType}</span>
          </>
        )}
        {banking.accountNumber && (
          <>
            <span style={{ color: '#6b7280' }}>Account Number</span>
            <span style={{ color: '#111827', fontWeight: 500, fontFamily: 'monospace' }}>{banking.accountNumber}</span>
          </>
        )}
        {banking.branchCode && (
          <>
            <span style={{ color: '#6b7280' }}>Branch Code</span>
            <span style={{ color: '#111827', fontWeight: 500, fontFamily: 'monospace' }}>{banking.branchCode}</span>
          </>
        )}
        {banking.swiftCode && (
          <>
            <span style={{ color: '#6b7280' }}>SWIFT / BIC</span>
            <span style={{ color: '#111827', fontWeight: 500, fontFamily: 'monospace' }}>{banking.swiftCode}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function InvoiceTemplate({
  invoiceNumber,
  clientName,
  clientEmail,
  clientCompany,
  clientPhone,
  clientAddress,
  issueDate,
  dueDate,
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  notes,
  template,
  showBankingDetails = true,
  paymentLink,
  company,
  formatCurrency,
}: InvoiceTemplateProps) {
  const accent = company?.primaryColor || '#4F46E5';
  const showTax = taxRate > 0 && taxAmount > 0;
  const banking = showBankingDetails ? company?.bankingDetails : null;

  if (template === 'modern') {
    return (
      <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: '#0f172a', background: '#ffffff', padding: 40 }}>
        {/* Modern Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 24, borderBottom: `3px solid ${accent}`, marginBottom: 32 }}>
          <div>
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} style={{ maxHeight: 56, marginBottom: 12 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
                {(company?.name || 'C').charAt(0).toUpperCase()}
              </div>
            )}
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{company?.name || 'Company'}</h1>
            {company?.description && <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: 14 }}>{company.description}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 36, fontWeight: 800, color: accent, margin: 0, letterSpacing: '-0.03em' }}>INVOICE</p>
            <p style={{ color: '#0f172a', fontSize: 16, fontWeight: 600, margin: '6px 0 0 0' }}>#{invoiceNumber}</p>
          </div>
        </div>

        {/* Bill To + Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          <div>
            <p style={{ color: accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px 0' }}>Bill To</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>{clientName}</p>
            {clientCompany && <p style={{ color: '#475569', margin: '2px 0 0 0', fontSize: 14 }}>{clientCompany}</p>}
            {clientEmail && <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 13 }}>{clientEmail}</p>}
            {clientPhone && <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 13 }}>{clientPhone}</p>}
            {clientAddress && <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 13, whiteSpace: 'pre-wrap' }}>{clientAddress}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 12 }}>
              <p style={{ color: accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px 0' }}>Issue Date</p>
              <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: 0 }}>{issueDate}</p>
            </div>
            <div>
              <p style={{ color: accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px 0' }}>Due Date</p>
              <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: 0 }}>{dueDate}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: accent, color: 'white' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderTopLeftRadius: 8 }}>Description</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Qty</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Unit Price</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderTopRightRadius: 8 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 14, color: '#0f172a', fontSize: 14 }}>{item.description}</td>
                <td style={{ padding: 14, textAlign: 'center', color: '#475569', fontSize: 14 }}>{item.quantity}</td>
                <td style={{ padding: 14, textAlign: 'right', color: '#475569', fontSize: 14 }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ padding: 14, textAlign: 'right', color: '#0f172a', fontSize: 14, fontWeight: 600 }}>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Subtotal</span>
              <span style={{ color: '#0f172a', fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
            </div>
            {showTax && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Tax ({taxRate}%)</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 8px 0', borderTop: `2px solid ${accent}`, marginTop: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: '-0.02em' }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Banking Details */}
        <BankingDetailsBlock banking={banking || {}} accent={accent} />

        {/* Notes */}
        {notes && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginTop: 24 }}>
            <p style={{ color: accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px 0' }}>Notes</p>
            <p style={{ color: '#334155', margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 40, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
          Thank you for your business{company?.name ? ` with ${company.name}` : ''}.
        </div>
      </div>
    );
  }

  // Default template (classic, professional)
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: '#0f172a', background: '#ffffff', padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} style={{ maxHeight: 60, marginBottom: 16 }} />
          ) : (
            <h1 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: 24, fontWeight: 700 }}>{company?.name || 'Company'}</h1>
          )}
          <h2 style={{ color: '#111827', margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>INVOICE</h2>
          <p style={{ color: accent, margin: '4px 0 0 0', fontSize: 14, fontWeight: 600 }}>{invoiceNumber}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {company?.name && !company?.logoUrl && (
            <p style={{ fontWeight: 700, margin: 0, fontSize: 16, color: '#111827' }}>{company.name}</p>
          )}
          {company?.description && <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0 0' }}>{company.description}</p>}
          {company?.email && <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0 0' }}>{company.email}</p>}
          {company?.phone && <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0 0' }}>{company.phone}</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 32 }}>
        <div>
          <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px 0', fontWeight: 700 }}>Bill To</p>
          <p style={{ fontWeight: 600, margin: 0, color: '#111827', fontSize: 15 }}>{clientName}</p>
          {clientCompany && <p style={{ color: '#475569', margin: '2px 0 0 0', fontSize: 14 }}>{clientCompany}</p>}
          {clientEmail && <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 13 }}>{clientEmail}</p>}
          {clientPhone && <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 13 }}>{clientPhone}</p>}
          {clientAddress && <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 13, whiteSpace: 'pre-wrap' }}>{clientAddress}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: 10 }}>
            <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px 0', fontWeight: 700 }}>Issue Date</p>
            <p style={{ color: '#111827', fontSize: 14, fontWeight: 600, margin: 0 }}>{issueDate}</p>
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px 0', fontWeight: 700 }}>Due Date</p>
            <p style={{ color: '#111827', fontSize: 14, fontWeight: 600, margin: 0 }}>{dueDate}</p>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#0f172a', color: 'white' }}>
            <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</th>
            <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Qty</th>
            <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Unit Price</th>
            <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: 12, color: '#0f172a', fontSize: 14 }}>{item.description}</td>
              <td style={{ padding: 12, textAlign: 'center', color: '#475569', fontSize: 14 }}>{item.quantity}</td>
              <td style={{ padding: 12, textAlign: 'right', color: '#475569', fontSize: 14 }}>{formatCurrency(item.unitPrice)}</td>
              <td style={{ padding: 12, textAlign: 'right', color: '#0f172a', fontSize: 14, fontWeight: 600 }}>{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <div style={{ width: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
            <span style={{ color: '#64748b' }}>Subtotal</span>
            <span style={{ color: '#111827', fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
          </div>
          {showTax && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Tax ({taxRate}%)</span>
              <span style={{ color: '#111827', fontWeight: 500 }}>{formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 8px 0', borderTop: '2px solid #0f172a', marginTop: 8 }}>
            <span style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <BankingDetailsBlock banking={banking || {}} accent={accent} />

      {notes && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginTop: 24 }}>
          <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px 0', fontWeight: 700 }}>Notes</p>
          <p style={{ color: '#111827', margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>{notes}</p>
        </div>
      )}

      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 40, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
        Thank you for your business{company?.name ? ` with ${company.name}` : ''}.
      </div>
    </div>
  );
}
