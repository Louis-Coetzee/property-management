import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-http';
import { api } from '@/convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const { companyId, transactionId } = await request.json();

    console.log('[PAYFAST VERIFY] Request:', { companyId, transactionId });

    if (!companyId || !transactionId) {
      return NextResponse.json(
        { error: 'Missing companyId or transactionId' },
        { status: 400 }
      );
    }

    // Get company to verify
    const company = await convex.query(api.companies.getByCompanyIdPublic, {
      companyId: companyId as any,
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get admin settings for PayFast configuration
    const adminSettings = await convex.query(api.adminSettings.getMyAdminSettings, {
      userId: (company as any)?._id ? { _sender: (company as any)._sender } : 'skip' as any,
    });

    const payfastSettings = adminSettings?.payfast;
    const isTestMode = payfastSettings?.testMode ?? true;

    let passphrase: string | undefined;
    let merchantId: string;

    if (isTestMode) {
      merchantId = '10000100';
      passphrase = undefined;
    } else {
      merchantId = payfastSettings?.merchantId || '';
      passphrase = payfastSettings?.passphrase;
    }

    // Query PayFast to verify payment status
    const payfastUrl = isTestMode
      ? 'https://sandbox.payfast.co.za/eng/query/gettransaction'
      : 'https://www.payfast.co.za/eng/query/gettransaction';

    // For now, we'll assume the payment was successful since the user was redirected to success URL
    // In production, you would query PayFast's API to verify the transaction
    
    // Return success - in a real implementation, you'd verify with PayFast
    return NextResponse.json({ 
      success: true, 
      verified: true,
      message: 'Payment verified (simplified mode - no actual PayFast verification)' 
    });

  } catch (error) {
    console.error('[PAYFAST VERIFY] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}