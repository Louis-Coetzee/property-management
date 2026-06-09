import { NextRequest, NextResponse } from 'next/server';
import {
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

    const sites = await convex.query(api.sites.getAllSites);
    const site = sites && sites.length > 0 ? sites[0] : null;

    if (!site?.settings?.payment?.paygate) {
      return NextResponse.redirect(new URL('/payment-error?reason=config', request.url));
    }

    const paygateSettings = site.settings.payment.paygate;
    const encryptionKey = paygateSettings.liveMode
      ? (paygateSettings.encryptionKey || PAYGATE_TEST_CREDENTIALS.encryptionKey)
      : PAYGATE_TEST_CREDENTIALS.encryptionKey;

    if (!verifyPaygateResponse(responseParams, encryptionKey)) {
      return NextResponse.redirect(new URL('/payment-error?reason=checksum', request.url));
    }

    const transactionSuccess = isTransactionSuccessful(
      responseParams.TRANSACTION_STATUS,
      responseParams.RESULT_CODE
    );

    const customData = JSON.parse(responseParams.USER1 || '{}');
    const { type, userId, bookingId, packageType } = customData;

    if (transactionSuccess) {
      if (type === 'subscription' || type === 'package') {
        return NextResponse.redirect(new URL('/packages/success?gateway=paygate', request.url));
      } else if (type === 'booking') {
        return NextResponse.redirect(new URL(`/payment/booking/success?gateway=paygate&booking=${bookingId}`, request.url));
      }
    } else {
      const errorUrl = new URL('/payment-error', request.url);
      errorUrl.searchParams.set('gateway', 'paygate');
      errorUrl.searchParams.set('code', responseParams.RESULT_CODE);
      errorUrl.searchParams.set('message', responseParams.RESULT_DESC);
      return NextResponse.redirect(errorUrl);
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Paygate return error:', error);
    return NextResponse.redirect(new URL('/payment-error?reason=server_error', request.url));
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const responseParams: Record<string, string> = {};
  params.forEach((value, key) => { responseParams[key] = value; });

  try {
    const sites = await convex.query(api.sites.getAllSites);
    const site = sites && sites.length > 0 ? sites[0] : null;

    if (!site?.settings?.payment?.paygate) {
      return NextResponse.redirect(new URL('/payment-error?reason=config', request.url));
    }

    const paygateSettings = site.settings.payment.paygate;
    const encryptionKey = paygateSettings.liveMode
      ? (paygateSettings.encryptionKey || PAYGATE_TEST_CREDENTIALS.encryptionKey)
      : PAYGATE_TEST_CREDENTIALS.encryptionKey;

    if (!verifyPaygateResponse(responseParams, encryptionKey)) {
      return NextResponse.redirect(new URL('/payment-error?reason=checksum', request.url));
    }

    const transactionSuccess = isTransactionSuccessful(
      responseParams.TRANSACTION_STATUS,
      responseParams.RESULT_CODE
    );

    const customData = JSON.parse(responseParams.USER1 || '{}');
    const { type, userId, bookingId, packageType } = customData;

    if (transactionSuccess) {
      if (type === 'subscription' || type === 'package') {
        return NextResponse.redirect(new URL('/packages/success?gateway=paygate', request.url));
      } else if (type === 'booking') {
        return NextResponse.redirect(new URL(`/payment/booking/success?gateway=paygate&booking=${bookingId}`, request.url));
      }
    } else {
      const errorUrl = new URL('/payment-error', request.url);
      errorUrl.searchParams.set('gateway', 'paygate');
      errorUrl.searchParams.set('code', responseParams.RESULT_CODE);
      errorUrl.searchParams.set('message', responseParams.RESULT_DESC);
      return NextResponse.redirect(errorUrl);
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Paygate return error:', error);
    return NextResponse.redirect(new URL('/payment-error?reason=server_error', request.url));
  }
}
