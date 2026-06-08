import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-http';
import { api } from '@/convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const { companyId, amount, currency = 'ZAR', userId } = await request.json();

    if (!companyId || !amount || amount < 50) {
      return NextResponse.json(
        { error: 'Invalid company or amount' },
        { status: 400 }
      );
    }

    const company = await convex.query(api.companies.getByCompanyIdPublic, {
      companyId: companyId as any,
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const adminSettings = await convex.query(api.adminSettings.getMyAdminSettings, {
      userId: userId as any,
    });

    const paypalSettings = adminSettings?.paypal;
    
    if (!paypalSettings || !paypalSettings.enabled) {
      return NextResponse.json(
        { error: 'PayPal is not enabled' },
        { status: 400 }
      );
    }

    const isTestMode = paypalSettings.testMode ?? true;
    const clientId = isTestMode ? paypalSettings.testClientId : paypalSettings.liveClientId;
    const clientSecret = isTestMode ? paypalSettings.testClientSecret : paypalSettings.liveClientSecret;

    console.log('[PAYPAL ADD CREDITS] Test mode:', isTestMode);
    console.log('[PAYPAL ADD CREDITS] Base URL:', isTestMode ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com');

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'PayPal is not properly configured' },
        { status: 400 }
      );
    }

    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'AUD', 'CAD'];
    const paypalCurrency = supportedCurrencies.includes(currency) ? currency : 'USD';

    const origin = request.headers.get('origin') || '';

    const returnUrl = `${origin}/companies/${companyId}/store/add-credits/success?success=true`;
    const cancelUrl = `${origin}/companies/${companyId}/store/add-credits?cancelled=true`;

    const baseUrl = isTestMode 
      ? 'https://api.sandbox.paypal.com' 
      : 'https://api.paypal.com';

    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('[PAYPAL ADD CREDITS] Auth failed:', errorText);
      return NextResponse.json(
        { error: 'PayPal authentication failed' },
        { status: 500 }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: companyId,
            description: `Add ${amount} ${paypalCurrency} shipping credits`,
            soft_descriptor: 'REFRESH CREDIT',
            amount: {
              currency_code: paypalCurrency,
              value: amount.toFixed(2),
            },
            custom_id: JSON.stringify({
              companyId,
              amount,
              type: 'add_credits',
            }),
          },
        ],
        application_context: {
          brand_name: (company as any)?.name || 'RefreshCRM',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('[PAYPAL ADD CREDITS] Order creation failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: 500 }
      );
    }

    const orderData = await orderResponse.json();
    
    const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      return NextResponse.json(
        { error: 'Failed to get approval URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ approvalUrl, orderId: orderData.id });
  } catch (error) {
    console.error('[PAYPAL ADD CREDITS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}