import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { transactionId, companyId: providedCompanyId } = await request.json();

    console.log('[PAYFAST ADD CREDITS SUCCESS] Request:', { transactionId, providedCompanyId });

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Missing transaction ID' },
        { status: 400 }
      );
    }

    const companyId = providedCompanyId;

    if (!companyId) {
      console.error('[PAYFAST ADD CREDITS SUCCESS] Missing companyId');
      return NextResponse.json(
        { error: 'Missing company information' },
        { status: 400 }
      );
    }

    const company = await convex.query(api.companies.getByCompanyIdPublic, {
      companyId: companyId as any,
    });

    if (!company) {
      console.error('[PAYFAST ADD CREDITS SUCCESS] Company not found:', companyId);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const payment = await convex.query(api.companies.getCreditPaymentByReference, {
      reference: transactionId,
    });

    if (!payment) {
      console.error('[PAYFAST ADD CREDITS SUCCESS] Payment not found:', transactionId);
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    if (payment.companyId !== company._id) {
      console.error('[PAYFAST ADD CREDITS SUCCESS] Company mismatch');
      return NextResponse.json(
        { error: 'Invalid payment data' },
        { status: 400 }
      );
    }

    const creditAmount = payment.amount;

    console.log('[PAYFAST ADD CREDITS SUCCESS] Processing:', { companyId, amount: creditAmount, transactionId });

    await convex.mutation(api.companies.updateCreditPaymentStatus, {
      paymentId: payment._id,
      status: 'completed',
      reference: transactionId,
    });

    await convex.mutation(api.companies.addCompanyCredit, {
      companyId: company._id,
      amount: creditAmount,
      paymentMethod: 'payfast',
      reference: transactionId,
      description: `Added credits via PayFast - Transaction: ${transactionId}`,
    });

    console.log('[PAYFAST ADD CREDITS SUCCESS] Credits added successfully:', companyId, creditAmount);

    return NextResponse.json({ 
      success: true, 
      balance: creditAmount 
    });
  } catch (error) {
    console.error('[PAYFAST ADD CREDITS SUCCESS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}