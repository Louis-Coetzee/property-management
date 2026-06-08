import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders } from "@/lib/cors";
import { sendOrderConfirmationEmail } from "@/lib/email";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, transactionId, gateway } = body;

    if (!orderId || !status || !gateway) {
      return addCorsHeaders(NextResponse.json(
        { error: "Missing required fields: orderId, status, gateway" },
        { status: 400 }
      ), request);
    }

    // Update payment status
    const paymentResult = await convex.mutation(api.payments.updatePublicStatus, {
      orderId,
      status,
      transactionId,
      gateway,
    });

    // If payment completed, create invoice and send email
    if (status === "completed") {
      // Create invoice
      await convex.mutation(api.invoices.createFromOrder, {
        orderId,
      });

      // Get order details for email
      const order = await convex.query(api.orders.getOrderByIdPublic, { orderId });
      
      if (order) {
        // Get company branding
        const company = await convex.query(api.companies.getByCompanyIdPublic, {
          companyId: order.companyId,
        });

        // Send order confirmation email
        try {
          await sendOrderConfirmationEmail({
            to: order.customerEmail,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
            orderTotal: order.total,
            items: order.items?.map((item: any) => ({
              description: item.productName,
              quantity: item.quantity,
              unitPrice: item.productPrice,
              total: item.total,
            })) || [],
            shippingAddress: order.shippingAddress ? 
              `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState} ${order.shippingZipCode}, ${order.shippingCountry}` : undefined,
            shippingMethod: order.shippingMethodName,
            domain: 'refreshtech.co.za', // Would need to get from order/website
            websiteBranding: company?.branding,
            companyName: company?.name,
          });
        } catch (emailError) {
          console.error("❌ [API/PAYMENTS/UPDATE] Email sending error:", emailError);
        }
      }
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
    }), request);
  } catch (error) {
    console.error("❌ [API/PAYMENTS/UPDATE] Error:", error);
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update payment" },
      { status: 500 }
    ), request);
  }
}
