import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const eventType = body.event_type;
    const resource = body.resource;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.COMPLETED') {
      const customId = resource?.purchase_units?.[0]?.custom_id || resource?.custom_id;

      if (customId) {
        const parts = customId.split('_');
        if (parts.length >= 2) {
          const userId = parts[0];
          const appKey = parts[1];

          console.log('PayPal app payment successful:', {
            userId,
            appKey,
            amount: resource?.amount?.value || resource?.amount?.total,
            orderId: resource?.id || body.resource?.id,
          });

          // The success page handles the app enablement via the return URL
          // This webhook can be used for additional verification/logging
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PayPal app notify error:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}
