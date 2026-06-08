import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import * as crypto from "crypto";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "@/lib/email";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
  
  console.log('[PAYFAST ITN] Signature data (ordered):', signatureData);
  
  if (passphrase) {
    const signatureDataWithPassphrase = signatureData + `&passphrase=${passphrase}`;
    console.log('[PAYFAST ITN] With passphrase:', signatureDataWithPassphrase);
    return crypto.createHash('md5').update(signatureDataWithPassphrase).digest('hex');
  }
  
  return crypto.createHash('md5').update(signatureData).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log('📋 [PAYFAST ITN] Received notification:', data);

    const {
      m_payment_id,
      pf_payment_id,
      payment_status,
      amount_gross,
      amount_fee,
      amount_net,
      signature,
      item_name,
      custom_str1,
    } = data;

    const orderId = custom_str1 || m_payment_id;

    if (!orderId) {
      console.error('❌ [PAYFAST ITN] No order ID in notification');
      return new NextResponse('No order ID', { status: 400 });
    }

    const order = await convex.query(api.orders.getOrderByIdPublic, {
      orderId: orderId as any,
    });

    if (!order) {
      console.error('❌ [PAYFAST ITN] Order not found:', orderId);
      return new NextResponse('Order not found', { status: 404 });
    }

    const company = await convex.query(api.companies.getByCompanyIdPublic, {
      companyId: order.companyId,
    });

    const paymentSettings = (company as any)?.paymentSettings?.payfast;
    const isTestMode = paymentSettings?.testMode ?? true;

    let passphrase: string | undefined;
    let merchantId: string;

    if (isTestMode) {
      merchantId = '10000100';
      passphrase = undefined;
    } else {
      merchantId = paymentSettings?.merchantId || '';
      passphrase = paymentSettings?.passphrase;
    }

    if (data.merchant_id !== merchantId) {
      console.error('❌ [PAYFAST ITN] Merchant ID mismatch');
      return new NextResponse('Invalid merchant', { status: 400 });
    }

    const expectedSignature = generateSignature(data, passphrase);
    if (signature.toLowerCase() !== expectedSignature.toLowerCase()) {
      console.error('❌ [PAYFAST ITN] Signature mismatch');
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
      console.error('❌ [PAYFAST ITN] Verification failed:', verifyText);
      return new NextResponse('Verification failed', { status: 400 });
    }

    console.log('✅ [PAYFAST ITN] Payment verified:', payment_status);

    if (payment_status === 'COMPLETE') {
      await convex.mutation(api.payments.updatePublicStatus, {
        orderId: orderId as any,
        status: 'completed',
        transactionId: pf_payment_id,
        gateway: 'payfast',
      });

      await convex.mutation(api.invoices.createFromOrder, {
        orderId: orderId as any,
      });

      const orderItems = await convex.query(api.orders.getOrderItemsByOrderIdPublic, {
        orderId: orderId as any,
      });

      for (const item of orderItems) {
        try {
          const product = await convex.query(api.products.getProductByIdPublic, {
            productId: item.productId,
          });
          
          if (product && (product as any).stockQuantity !== undefined) {
            const newStock = Math.max(0, (product as any).stockQuantity - item.quantity);
            await convex.mutation(api.products.updateProductStock, {
              productId: item.productId as any,
              stockQuantity: newStock,
              status: newStock > 0 ? (product as any).status : 'out_of_stock',
            });
          }
        } catch (stockError) {
          console.error('⚠️ [PAYFAST ITN] Error updating stock for product:', item.productId, stockError);
        }
      }

      try {
        const website = await convex.query(api.websites.getWebsiteByIdPublic, {
          websiteId: (order as any).websiteId,
        });
        
        await sendOrderConfirmationEmail({
          to: order.customerEmail,
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          orderTotal: order.total,
          items: orderItems.map((item: any) => ({
            description: item.productName,
            quantity: item.quantity,
            unitPrice: item.productPrice,
            total: item.total,
          })),
          shippingAddress: order.shippingAddress ? 
            `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState || ''} ${order.shippingZipCode || ''}, ${order.shippingCountry || ''}` : undefined,
          shippingMethod: order.shippingMethodName,
          domain: request.headers.get('host') || 'refreshtech.co.za',
          websiteBranding: website?.branding,
          companyName: company?.name,
        });

        await sendAdminOrderNotification({
          to: 'louis@refreshtech.co.za',
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          orderNumber: order.orderNumber,
          orderTotal: order.total,
          items: orderItems.map((item: any) => ({
            description: item.productName,
            quantity: item.quantity,
            unitPrice: item.productPrice,
            total: item.total,
          })),
          shippingAddress: order.shippingAddress ? 
            `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState || ''} ${order.shippingZipCode || ''}, ${order.shippingCountry || ''}` : undefined,
          shippingMethod: order.shippingMethodName,
          domain: request.headers.get('host') || 'refreshtech.co.za',
          websiteBranding: website?.branding,
          companyName: company?.name,
        });
      } catch (emailError) {
        console.error('⚠️ [PAYFAST ITN] Error sending emails:', emailError);
      }

      console.log('✅ [PAYFAST ITN] Order completed successfully:', orderId);
    } else if (payment_status === 'FAILED' || payment_status === 'CANCELLED') {
      await convex.mutation(api.payments.updatePublicStatus, {
        orderId: orderId as any,
        status: 'failed',
        transactionId: pf_payment_id,
        gateway: 'payfast',
      });

      console.log('⚠️ [PAYFAST ITN] Payment failed/cancelled:', orderId, payment_status);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('❌ [PAYFAST ITN] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
