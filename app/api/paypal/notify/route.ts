import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "@/lib/email";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    const txnType = params.get('txn_type');
    const paymentStatus = params.get('payment_status');
    const txnId = params.get('txn_id');
    const custom = params.get('custom');
    const mcGross = params.get('mc_gross');
    const receiverEmail = params.get('receiver_email');

    console.log('📋 [PAYPAL IPN] Received notification:', {
      txnType,
      paymentStatus,
      txnId,
      custom,
    });

    if (!custom) {
      console.error('❌ [PAYPAL IPN] No order ID in custom field');
      return new NextResponse('No order ID', { status: 400 });
    }

    const orderId = custom;

    const order = await convex.query(api.orders.getOrderByIdPublic, {
      orderId: orderId as any,
    });

    if (!order) {
      console.error('❌ [PAYPAL IPN] Order not found:', orderId);
      return new NextResponse('Order not found', { status: 404 });
    }

    const company = await convex.query(api.companies.getByCompanyIdPublic, {
      companyId: order.companyId,
    });

    const paymentSettings = (company as any)?.paymentSettings?.paypal;
    const isTestMode = paymentSettings?.testMode ?? true;

    let clientId: string;
    let clientSecret: string;

    if (isTestMode) {
      clientId = paymentSettings?.testClientId || '';
      clientSecret = paymentSettings?.testClientSecret || '';
    } else {
      clientId = paymentSettings?.liveClientId || '';
      clientSecret = paymentSettings?.liveClientSecret || '';
    }

    const paypalUrl = isTestMode
      ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
      : 'https://ipnpb.paypal.com/cgi-bin/webscr';

    const verifyParams = new URLSearchParams();
    verifyParams.append('cmd', '_notify-validate');
    params.forEach((value, key) => {
      verifyParams.append(key, value);
    });

    const verifyResponse = await fetch(paypalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });

    const verifyResult = await verifyResponse.text();

    if (verifyResult !== 'VERIFIED') {
      console.error('❌ [PAYPAL IPN] Verification failed:', verifyResult);
      return new NextResponse('Verification failed', { status: 400 });
    }

    console.log('✅ [PAYPAL IPN] Payment verified:', paymentStatus);

    if (paymentStatus === 'Completed') {
      await convex.mutation(api.payments.updatePublicStatus, {
        orderId: orderId as any,
        status: 'completed',
        transactionId: txnId || undefined,
        gateway: 'paypal',
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
          console.error('⚠️ [PAYPAL IPN] Error updating stock for product:', item.productId, stockError);
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
        console.error('⚠️ [PAYPAL IPN] Error sending emails:', emailError);
      }

      console.log('✅ [PAYPAL IPN] Order completed successfully:', orderId);
    } else if (paymentStatus === 'Refunded' || paymentStatus === 'Reversed') {
      await convex.mutation(api.payments.updatePublicStatus, {
        orderId: orderId as any,
        status: 'refunded',
        transactionId: txnId || undefined,
        gateway: 'paypal',
      });

      console.log('⚠️ [PAYPAL IPN] Payment refunded:', orderId);
    } else if (paymentStatus === 'Failed' || paymentStatus === 'Denied') {
      await convex.mutation(api.payments.updatePublicStatus, {
        orderId: orderId as any,
        status: 'failed',
        transactionId: txnId || undefined,
        gateway: 'paypal',
      });

      console.log('⚠️ [PAYPAL IPN] Payment failed:', orderId);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('❌ [PAYPAL IPN] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
