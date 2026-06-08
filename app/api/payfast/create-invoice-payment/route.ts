import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, amount, itemName, companyId } = body;

    if (!invoiceId || !amount || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isTest = process.env.PAYFAST_TEST_MODE === 'true';
    const merchantId = process.env.PAYFAST_MERCHANT_ID || (isTest ? '10000100' : '');
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || (isTest ? '46f0cd694581a' : '');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/public/invoices/payment-success?invoiceId=${invoiceId}&method=payfast`;
    const cancelUrl = `${baseUrl}/public/invoices/payment-cancel?invoiceId=${invoiceId}`;
    const notifyUrl = `${baseUrl}/api/payfast/invoice-notify`;

    const signatureData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      m_payment_id: invoiceId,
      amount: amount.toFixed(2),
      item_name: itemName || 'Invoice Payment',
    };

    const signature = Object.entries(signatureData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const payfastBaseUrl = isTest 
      ? 'https://sandbox.payfast.co.za/eng/process' 
      : 'https://payfast.co.za/eng/process';

    const paymentUrl = `${payfastBaseUrl}?${signature}`;

    return NextResponse.json({ url: paymentUrl });
  } catch (error) {
    console.error('PayFast payment error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}