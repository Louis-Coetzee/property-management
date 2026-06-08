import { NextRequest, NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to, invoiceNumber, clientName, clientEmail, clientCompany,
      total, dueDate, issueDate, items, subtotal, taxRate, taxAmount,
      status, notes, companyName, companyEmail, companyPhone, companyAddress,
      branding, paymentUrl, currency, bankingDetails, template,
      showBankingDetails, paymentLink
    } = body;

    if (!to || !invoiceNumber || !clientName || !total || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sendInvoiceEmail({
      to,
      invoiceNumber,
      clientName,
      clientEmail,
      clientCompany,
      total,
      dueDate,
      issueDate,
      items: items || [],
      subtotal: subtotal || 0,
      taxRate: taxRate || 0,
      taxAmount: taxAmount || 0,
      status: status || 'sent',
      notes,
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      branding,
      paymentUrl,
      currency,
      bankingDetails,
      template,
      showBankingDetails,
      paymentLink,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice email' },
      { status: 500 }
    );
  }
}