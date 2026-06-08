import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-http";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders } from "@/lib/cors";

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const body = await request.json();
    const { orderId, orderNumber, gateway, amount, testMode } = body;

    if (!orderId || !orderNumber || !gateway || !amount) {
      return addCorsHeaders(NextResponse.json(
        { error: "Missing required fields: orderId, orderNumber, gateway, amount" },
        { status: 400 }
      ), request);
    }

    const result = await convex.mutation(api.payments.createPublic, {
      orderId,
      orderNumber,
      gateway,
      amount,
      testMode: testMode ?? true,
    });

    return addCorsHeaders(NextResponse.json({
      success: true,
      paymentId: result.paymentId,
    }), request);
  } catch (error) {
    console.error("❌ [API/PAYMENTS/CREATE] Error:", error);
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment" },
      { status: 500 }
    ), request);
  }
}
