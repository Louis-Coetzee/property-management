import { NextRequest, NextResponse } from 'next/server';
import { getPaymentGatewayConfig } from '@/lib/payfast-config';
import {
  PaygateConfig,
  getPaygateUrls,
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
  const finalString = dataString + encryptionKey;
  return generateMD5(finalString);
}

function createPaygateInitiateRequest(config: PaygateConfig): Record<string, string> {
  const data: Record<string, string> = {
    PAYGATE_ID: config.payGateId,
    REFERENCE: config.orderNumber,
    AMOUNT: Math.round(config.amount * 100).toString(),
    CURRENCY: config.currency || 'ZAR',
    RETURN_URL: config.returnUrl,
    TRANSACTION_DATE: new Date().toISOString().replace(/[:.]/g, '-').split('T')[0],
    LOCALE: 'en-za',
    COUNTRY_CODE: config.countryCode || 'ZAF',
    EMAIL: config.email || '',
    FIRST_NAME: config.firstName || '',
    LAST_NAME: config.lastName || '',
    NOTIFY_URL: config.notifyUrl,
    USER1: config.optional1 || '',
    USER2: config.optional2 || '',
    USER3: config.optional3 || '',
    ACTION: 'PAY'
  };

  const checksum = generatePaygateChecksum(data, config.encryptionKey);
  data.CHECKSUM = checksum;

  return data;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      orderNumber,
      description,
      returnUrl,
      gateway,
      email,
      firstName,
      lastName
    } = body;

    const sites = await convex.query(api.sites.getAllSites);
    const site = sites && sites.length > 0 ? sites[0] : null;

    if (!site?.settings?.payment) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 400 }
      );
    }

    const paymentSettings = site.settings.payment;
    let paygateConfig;

    if (gateway === 'paygate' && paymentSettings.paygate?.enabled) {
      paygateConfig = paymentSettings.paygate;
    } else {
      return NextResponse.json(
        { error: 'Paygate not enabled or configured' },
        { status: 400 }
      );
    }

    const requestData = createPaygateInitiateRequest({
      payGateId: paygateConfig.liveMode ? (paygateConfig.payGateId || '') : PAYGATE_TEST_CREDENTIALS.payGateId,
      encryptionKey: paygateConfig.liveMode ? (paygateConfig.encryptionKey || '') : PAYGATE_TEST_CREDENTIALS.encryptionKey,
      returnUrl,
      notifyUrl: `${process.env.NEXT_PUBLIC_URL}/api/paygate/notify`,
      amount,
      currency: 'ZAR',
      orderNumber,
      transactionReference: orderNumber,
      description,
      email,
      firstName,
      lastName,
      countryCode: 'ZAF',
      locale: 'en-za',
      method: 'cc'
    });

    const paygateUrls = getPaygateUrls(paygateConfig.liveMode);
    const response = await fetch(paygateUrls.initiateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestData).toString()
    });

    const responseText = await response.text();
    const responseParams = new URLSearchParams(responseText);
    const responseData: Record<string, string> = {};
    responseParams.forEach((value, key) => {
      responseData[key] = value;
    });

    if (responseData.RESULT_CODE !== '0') {
      return NextResponse.json(
        {
          error: 'Paygate initiation failed',
          details: responseData.RESULT_DESC
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payRequestId: responseData.PAY_REQUEST_ID,
      checksum: responseData.CHECKSUM,
      processUrl: paygateUrls.processUrl,
      payGateId: paygateConfig.liveMode ? (paygateConfig.payGateId || '') : PAYGATE_TEST_CREDENTIALS.payGateId
    });

  } catch (error) {
    console.error('Paygate initiation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
