import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./security";

export const listByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return payments.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listByInvoice = query({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    return payments.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: {
    userId: v.id("users"),
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const payment = await ctx.db.get(args.paymentId);
    return payment;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    amount: v.number(),
    paymentMethod: v.string(),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    invoiceId: v.optional(v.id("invoices")),
    clientId: v.optional(v.id("clients")),
    clientName: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    supplierName: v.optional(v.string()),
    source: v.optional(v.string()),
    expenseType: v.optional(v.string()),
    transactionDate: v.optional(v.string()),
    items: v.optional(v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const timestamp = Date.now();
    const paymentNumber = `TXN-${timestamp}`;

    const paymentId = await ctx.db.insert("payments", {
      companyId: args.companyId as string,
      paymentNumber,
      type: args.type,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      status: args.status || "pending",
      reference: args.reference,
      notes: args.notes,
      invoiceId: args.invoiceId,
      clientId: args.clientId,
      clientName: args.clientName,
      supplierId: args.supplierId,
      supplierName: args.supplierName,
      source: args.source,
      expenseType: args.expenseType,
      transactionDate: args.transactionDate,
      items: args.items,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, paymentId };
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    paymentId: v.id("payments"),
    paymentNumber: v.string(),
    amount: v.number(),
    paymentMethod: v.string(),
    type: v.optional(v.string()),
    status: v.string(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    invoiceId: v.optional(v.id("invoices")),
    clientId: v.optional(v.id("clients")),
    clientName: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    supplierName: v.optional(v.string()),
    source: v.optional(v.string()),
    expenseType: v.optional(v.string()),
    transactionDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    await ctx.db.patch(args.paymentId, {
      paymentNumber: args.paymentNumber,
      type: args.type,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      status: args.status,
      reference: args.reference,
      notes: args.notes,
      invoiceId: args.invoiceId,
      clientId: args.clientId,
      clientName: args.clientName,
      supplierId: args.supplierId,
      supplierName: args.supplierName,
      source: args.source,
      expenseType: args.expenseType,
      transactionDate: args.transactionDate,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    // NOTE: Callers must reverse the linked invoice payment (via invoices.reversePayment)
    // BEFORE calling this mutation when the transaction was completed and linked to an
    // invoice, so amountPaid stays in sync. This mutation only deletes the row.

    await ctx.db.delete(args.paymentId);

    return { success: true };
  },
});

// Public mutation to create payment record (called from checkout)
export const createPublic = mutation({
  args: {
    orderId: v.id("orders"),
    orderNumber: v.string(),
    gateway: v.string(),
    amount: v.number(),
    testMode: v.boolean(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const paymentId = await ctx.db.insert("payments", {
      companyId: order.companyId,
      orderId: args.orderId,
      paymentNumber: `PAY-${args.orderNumber}-${Date.now()}`,
      amount: args.amount,
      paymentMethod: args.gateway,
      status: "pending",
      reference: args.testMode ? `TEST_${Date.now()}` : undefined,
      notes: `Gateway: ${args.gateway}, Test Mode: ${args.testMode}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, paymentId };
  },
});

// Public mutation to update payment status after gateway callback
export const updatePublicStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
    transactionId: v.optional(v.string()),
    gateway: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Find payment for this order
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    const payment = payments.find(p => p.paymentMethod === args.gateway);
    if (!payment) {
      throw new Error("Payment record not found");
    }

    // Update payment status
    await ctx.db.patch(payment._id, {
      status: args.status,
      reference: args.transactionId,
      updatedAt: Date.now(),
    });

    // If payment completed, update order status
    if (args.status === "completed") {
      await ctx.db.patch(args.orderId, {
        paymentStatus: "paid",
        status: "confirmed",
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Public query to get payment by order
export const getByOrderPublic = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    return payments[0] || null;
  },
});
