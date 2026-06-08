import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_TOKEN;
  
  if (!expectedToken) {
    return NextResponse.json({ error: 'Cron token not configured' }, { status: 500 });
  }
  
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await convex.mutation(api.cron.processRecurringInvoices, {});
    
    return NextResponse.json({ 
      success: true, 
      processed: result?.processed || 0,
      created: result?.created || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[CRON] Recurring invoice processing error:', error);
    return NextResponse.json({ 
      error: 'Processing failed',
      message: error.message 
    }, { status: 500 });
  }
}