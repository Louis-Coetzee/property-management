import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-http';
import { api } from '@/convex/_generated/api';
import * as crypto from 'crypto';

function generateSignature(data: Record<string, string>, passphrase?: string): string {
  // PayFast requires specific parameter order for signature
  const requiredFields = [
    'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
    'm_payment_id', 'amount', 'item_name', 'item_description',
    'custom_int1', 'custom_int2', 'custom_int3', 'custom_int4', 'custom_int5',
    'custom_str1', 'custom_str2', 'custom_str3', 'custom_str4', 'custom_str5',
    'email_confirmation', 'confirmation_address'
  ];
  
  const sortedKeys = requiredFields.filter(key => data[key] !== undefined && data[key] !== '');
  
  const signatureData = sortedKeys
    .map(key => `${key}=${data[key]}`)
    .join('&');
  
  console.log('[PAYFAST ADD CREDITS] Signature data (ordered):', signatureData);
  
  if (passphrase) {
    const signatureDataWithPassphrase = signatureData + `&passphrase=${passphrase}`;
    console.log('[PAYFAST ADD CREDITS] With passphrase:', signatureDataWithPassphrase);
    return crypto.createHash('md5').update(signatureDataWithPassphrase).digest('hex');
  }
  
  return crypto.createHash('md5').update(signatureData).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log('[PAYFAST ADD CREDITS] Received notification:', data);

const {
      m_payment_id,
      pf_payment_id,
      payment_status,
      amount,
      amount_gross,
      amount_fee,
      amount_net,
      signature,
      custom_str1,
      custom_str2,
      custom_int1,
    } = data;

    const companyId = custom_str1;
    const transactionId = custom_str2 || m_payment_id;
    const creditAmount = parseFloat(custom_int1 || amount || amount_gross || '0');

    if (!companyId) {
      console.error('[PAYFAST ADD CREDITS] No company ID in notification');
      return new NextResponse('No company ID', { status: 400 });
    }

    const company = await convex.query(api.companies.getByCompanyIdPublic, {
      companyId: companyId as any,
    });

    if (!company) {
      console.error('[PAYFAST ADD CREDITS] Company not found:', companyId);
      return new NextResponse('Company not found', { status: 404 });
    }

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

    if (data.merchant_id !== merchantId) {
      console.error('[PAYFAST ADD CREDITS] Merchant ID mismatch');
      return new NextResponse('Invalid merchant', { status: 400 });
    }

    const expectedSignature = generateSignature(data, passphrase);
    if (signature.toLowerCase() !== expectedSignature.toLowerCase()) {
      console.error('[PAYFAST ADD CREDITS] Signature mismatch');
      return new NextResponse('Invalid signature', { status: 400 });
    }

    const payfastUrl = isTestMode
      ? 'https://sandbox.payfast.co.za/eng/query/verify'
      : 'https://www.payfast.co.za/eng/query/verify';

    const verifyParams = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      verifyParams.append(key, value);
    });

    const verifyResponse = await fetch(payfastUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });

    const verifyText = await verifyResponse.text();
    const isValid = verifyText.includes('VERIFIED');

    if (!isValid) {
      console.error('[PAYFAST ADD CREDITS] Verification failed:', verifyText);
      return new NextResponse('Verification failed', { status: 400 });
    }

    console.log('[PAYFAST ADD CREDITS] Payment verified:', payment_status);

    if (payment_status === 'COMPLETE') {
      await convex.mutation(api.companies.addCompanyCredit, {
        companyId: companyId as any,
        amount: creditAmount,
        paymentMethod: 'payfast',
        reference: transactionId,
        description: `Added credits via PayFast - Transaction: ${pf_payment_id}`,
      });

      console.log('[PAYFAST ADD CREDITS] Credits added successfully:', companyId, creditAmount);
    } else if (payment_status === 'FAILED' || payment_status === 'CANCELLED') {
      console.log('[PAYFAST ADD CREDITS] Payment failed/cancelled:', transactionId, payment_status);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[PAYFAST ADD CREDITS] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}