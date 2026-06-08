import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, amount, description, companyId } = body;

    if (!invoiceId || !amount || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isTest = process.env.PAYPAL_TEST_MODE !== 'false';
    const clientId = isTest 
      ? process.env.PAYPAL_TEST_CLIENT_ID 
      : process.env.PAYPAL_LIVE_CLIENT_ID;
    const clientSecret = isTest 
      ? process.env.PAYPAL_TEST_CLIENT_SECRET 
      : process.env.PAYPAL_LIVE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'PayPal not configured' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/public/invoices/payment-success?invoiceId=${invoiceId}&method=paypal`;
    const cancelUrl = `${baseUrl}/public/invoices/payment-cancel?invoiceId=${invoiceId}`;

    // Get access token
    const authResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get PayPal token' }, { status: 500 });
    }

    // Create order
    const orderResponse = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: invoiceId,
          description: description || 'Invoice Payment',
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
        }],
        redirect_urls: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (orderData.links) {
      const approvalLink = orderData.links.find((link: any) => link.rel === 'approve');
      if (approvalLink) {
        return NextResponse.json({ url: approvalLink.href });
      }
    }

    return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
  } catch (error) {
    console.error('PayPal payment error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}