import { NextRequest, NextResponse } from 'next/server';
import {
  parsePaygateResponse,
  isTransactionSuccessful,
  PAYGATE_TEST_CREDENTIALS
} from '@/lib/paygate-utils';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import * as crypto from 'crypto';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function generateMD5(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex');
}

function generatePaygateChecksum(data: Record<string, string>, encryptionKey: string): string {
  const sortedKeys = Object.keys(data).sort();
  let dataString = '';
  for (const key of sortedKeys) {
    if (data[key] !== '') {
      dataString += data[key];
    }
  }
  return generateMD5(dataString + encryptionKey);
}

function verifyPaygateResponse(response: Record<string, string>, encryptionKey: string): boolean {
  const checksum = response.CHECKSUM;
  const dataWithoutChecksum = { ...response };
  delete dataWithoutChecksum.CHECKSUM;
  const calculatedChecksum = generatePaygateChecksum(dataWithoutChecksum, encryptionKey);
  return checksum === calculatedChecksum;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const responseParams: Record<string, string> = {};
    params.forEach((value, key) => { responseParams[key] = value; });

    const parsedResponse = parsePaygateResponse(body);

    const sites = await convex.query(api.sites.getAllSites);
    const site = sites && sites.length > 0 ? sites[0] : null;

    if (!site?.settings?.payment?.paygate) {
      return NextResponse.json({ error: 'Paygate not configured' }, { status: 400 });
    }

    const paygateSettings = site.settings.payment.paygate;
    const encryptionKey = paygateSettings.liveMode
      ? (paygateSettings.encryptionKey || PAYGATE_TEST_CREDENTIALS.encryptionKey)
      : PAYGATE_TEST_CREDENTIALS.encryptionKey;

    if (!verifyPaygateResponse(responseParams, encryptionKey)) {
      return NextResponse.json({ error: 'Invalid checksum' }, { status: 400 });
    }

    const transactionSuccess = isTransactionSuccessful(
      parsedResponse.TRANSACTION_STATUS,
      parsedResponse.RESULT_CODE
    );

    const customData = JSON.parse(responseParams.USER1 || '{}');
    const { type, userId, bookingId, packageType } = customData;

    if (transactionSuccess) {
      console.log('Paygate payment successful:', {
        transactionId: parsedResponse.TRANSACTION_ID,
        payRequestId: parsedResponse.PAY_REQUEST_ID,
        amount: parsedResponse.AMOUNT,
        type
      });

      if (type === 'booking' && bookingId) {
        try {
          await convex.mutation(api.accommodationBookings.updateBookingStatus, {
            bookingId,
            status: 'confirmed',
            paymentStatus: 'paid',
          } as any);
        } catch (e) {
          console.error('Failed to update booking status:', e);
        }
      }

      // Also update the accommodation inquiry status to payment-received
      const inquiryId = customData.inquiryId;
      if (inquiryId) {
        try {
          await convex.mutation(api.accommodationInquiries.updateInquiryStatusDirect, {
            inquiryId,
            status: 'payment-received',
          });
        } catch (e) {
          console.error('Failed to update inquiry status:', e);
        }
      }
    } else {
      console.log('Paygate payment failed:', {
        payRequestId: parsedResponse.PAY_REQUEST_ID,
        resultCode: parsedResponse.RESULT_CODE,
        resultDesc: parsedResponse.RESULT_DESC,
        type
      });
    }

    return NextResponse.json({
      status: transactionSuccess ? 'success' : 'failed',
      transactionId: parsedResponse.TRANSACTION_ID,
      payRequestId: parsedResponse.PAY_REQUEST_ID
    });

  } catch (error) {
    console.error('Paygate notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
