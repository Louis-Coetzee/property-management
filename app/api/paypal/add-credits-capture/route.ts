import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-http';
import { api } from '@/convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const body = await request.json();
    const { orderId, companyId: providedCompanyId } = body;

    console.log('[PAYPAL ADD CREDITS CAPTURE] Request:', { orderId, providedCompanyId });

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing order ID' },
        { status: 400 }
      );
    }

    // If companyId is provided from frontend, use it directly
    const companyId = providedCompanyId || body.custom_id?.companyId || body.purchase_units?.[0]?.custom_id?.companyId;
    const amount = body.custom_id?.amount || body.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;

    if (!companyId || !amount) {
      console.error('[PAYPAL ADD CREDITS CAPTURE] Missing companyId or amount');
      return NextResponse.json(
        { error: 'Missing required information' },
        { status: 400 }
      );
    }

    console.log('[PAYPAL ADD CREDITS CAPTURE] Processing:', { companyId, amount, orderId });

    const company = await convex.query(api.companies.getByCompanyIdPublic, {
      companyId: companyId as any,
    });

    if (!company) {
      console.error('[PAYPAL ADD CREDITS CAPTURE] Company not found:', companyId);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const adminSettings = await convex.query(api.adminSettings.getMyAdminSettings, {
      userId: (company as any)?._id ? { _sender: (company as any)._sender } : 'skip' as any,
    });

    const paypalSettings = adminSettings?.paypal;
    const isTestMode = paypalSettings?.testMode ?? true;

    const clientId = isTestMode ? paypalSettings?.testClientId : paypalSettings?.liveClientId;
    const clientSecret = isTestMode ? paypalSettings?.testClientSecret : paypalSettings?.liveClientSecret;

    console.log('[PAYPAL ADD CREDITS CAPTURE] Test mode:', isTestMode);
    console.log('[PAYPAL ADD CREDITS CAPTURE] Base URL:', isTestMode ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com');

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'PayPal not configured' },
        { status: 400 }
      );
    }

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
      console.error('[PAYPAL ADD CREDITS CAPTURE] Auth failed');
      return NextResponse.json(
        { error: 'PayPal authentication failed' },
        { status: 500 }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error('[PAYPAL ADD CREDITS CAPTURE] Capture failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to capture payment' },
        { status: 500 }
      );
    }

    const captureData = await captureResponse.json();
    
    if (captureData.status === 'COMPLETED') {
      const captureAmount = parseFloat(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || amount);
      
      // Find the payment record first
      const payment = await convex.query(api.companies.getCreditPaymentByReference, {
        reference: orderId,
      });
      
      // Update payment status to completed if found
      if (payment) {
        await convex.mutation(api.companies.updateCreditPaymentStatus, {
          paymentId: payment._id,
          status: 'completed',
          reference: orderId,
        });
      }
      
      await convex.mutation(api.companies.addCompanyCredit, {
        companyId: companyId as any,
        amount: captureAmount,
        paymentMethod: 'paypal',
        reference: orderId,
        description: `Added credits via PayPal - Order: ${orderId}`,
      });

      console.log('[PAYPAL ADD CREDITS CAPTURE] Credits added successfully:', companyId, captureAmount);

      return NextResponse.json({ 
        success: true, 
        balance: captureAmount 
      });
    } else {
      console.error('[PAYPAL ADD CREDITS CAPTURE] Payment not completed:', captureData.status);
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[PAYPAL ADD CREDITS CAPTURE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}