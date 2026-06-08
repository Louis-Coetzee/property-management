import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-http';
import { api } from '@/convex/_generated/api';
import * as crypto from 'crypto';

function generateTransactionId(): string {
  return `CREDIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[PAYFAST ADD CREDITS] Failed to parse JSON:', e);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { companyId, amount, userId } = body;

    console.log('[PAYFAST ADD CREDITS] Request received:', { 
      companyId, 
      amount, 
      userId,
      companyIdType: typeof companyId,
      companyIdLength: companyId?.length,
      startsWithCompanies: companyId?.startsWith?.('companies_')
    });

    if (!companyId || !amount || amount < 50) {
      return NextResponse.json(
        { error: 'Invalid company or amount' },
        { status: 400 }
      );
    }

    const company = await convex.query(api.companies.getByCompanyIdPublic, {
      companyId: companyId as any,
    });

    console.log('[PAYFAST ADD CREDITS] Company result:', company);

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const adminSettings = await convex.query(api.adminSettings.getMyAdminSettings, {
      userId: userId as any,
    });

    const payfastSettings = adminSettings?.payfast;
    
    if (!payfastSettings || !payfastSettings.enabled) {
      return NextResponse.json(
        { error: 'PayFast is not enabled' },
        { status: 400 }
      );
    }

    const isTestMode = payfastSettings.testMode ?? true;
    const merchantId = isTestMode ? '10000100' : payfastSettings.merchantId;
    const merchantKey = isTestMode ? '46f0cd694581a' : payfastSettings.merchantKey;
    const passphrase = isTestMode ? undefined : payfastSettings.passphrase;

    console.log('[PAYFAST ADD CREDITS] Test mode:', isTestMode);
    console.log('[PAYFAST ADD CREDITS] Merchant ID:', merchantId);
    console.log('[PAYFAST ADD CREDITS] PayFast URL:', isTestMode ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process');

    if (!merchantId || !merchantKey) {
      return NextResponse.json(
        { error: 'PayFast is not properly configured' },
        { status: 400 }
      );
    }

    const transactionId = generateTransactionId();
    const currencyCode = company?.currency?.code || 'ZAR';
    const itemName = `Shipping Credits - ${currencyCode} ${amount}`;

    const origin = request.headers.get('origin') || '';
    
    const returnUrl = `${origin}/companies/${companyId}/store/add-credits/success?success=true&transaction=${transactionId}`;
    const cancelUrl = `${origin}/companies/${companyId}/store/add-credits?cancelled=true`;
    const notifyUrl = `${origin}/api/payfast/add-credits-notify`;

    const payfastData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      m_payment_id: transactionId,
      item_name: itemName,
      item_description: `Add ${amount} ${currencyCode} shipping credits to company account`,
      amount: amount.toFixed(2),
      custom_str1: String(companyId),
      custom_str2: transactionId,
      custom_str3: String(userId || ''),
      custom_int1: String(Math.round(amount)),
      email_confirmation: '1',
      confirmation_address: (company as any)?.email || '',
      name_first: '',
      email_address: (company as any)?.email || '',
    };

    console.log('[PAYFAST ADD CREDITS] PayFast data:', JSON.stringify(payfastData, null, 2));

    const payfastUrl = isTestMode
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    // Build form - no signature for now (sandbox mode)
    const formParams = new URLSearchParams();
    Object.entries(payfastData).forEach(([key, value]) => {
      if (value) formParams.append(key, value);
    });

    const formHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting to PayFast...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f9fafb;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            .spinner {
              width: 40px;
              height: 40px;
              border: 3px solid #e5e7eb;
              border-top-color: #7c3aed;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            p {
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <p>Redirecting to PayFast secure payment...</p>
          </div>
          <form id="payfast-form" action="${payfastUrl}" method="post">
            ${Object.entries(payfastData).map(([key, value]) => {
              const escapedValue = String(value).replace(/"/g, '&quot;').replace(/&/g, '&amp;');
              return `<input type="hidden" name="${key}" value="${escapedValue}" />`;
            }).join('')}
          </form>
          <script>document.getElementById('payfast-form').submit();</script>
        </body>
      </html>
    `;

    return NextResponse.json({ formHtml, transactionId });
  } catch (error) {
    console.error('Error initiating PayFast credit payment:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}