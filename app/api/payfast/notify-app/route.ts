import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Verify payment status
    if (data.payment_status === 'COMPLETE') {
      // Extract user ID and app key from m_payment_id
      const paymentIdParts = data.m_payment_id?.split('_') || [];
      const userId = paymentIdParts[0];
      const appKey = paymentIdParts[1];

      console.log('PayFast app payment successful:', {
        userId,
        appKey,
        amount: data.amount_gross,
        paymentId: data.m_payment_id,
      });

      // The success page handles the app enablement via the return URL
      // This webhook can be used for additional verification/logging
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PayFast app notify error:', error);
    return NextResponse.json({ error: 'Failed to process notification' }, { status: 500 });
  }
}
