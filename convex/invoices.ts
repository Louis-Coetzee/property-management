import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./security";

function generateInvoiceNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${dateStr}-${random}`;
}

export const listByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return invoices.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoice = await ctx.db.get(args.invoiceId);
    return invoice;
  },
});

export const getByQuote = query({
  args: {
    userId: v.id("users"),
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoice = await ctx.db
      .query("invoices")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.quoteId))
      .first();

    return invoice;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    invoiceNumber: v.string(),
    clientId: v.optional(v.id("clients")),
    clientName: v.string(),
    clientEmail: v.optional(v.string()),
    clientCompany: v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    clientAddress: v.optional(v.string()),
    status: v.string(),
    items: v.array(v.object({
      itemType: v.optional(v.string()),
      itemId: v.optional(v.string()),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    })),
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    amountPaid: v.number(),
    issueDate: v.string(),
    dueDate: v.string(),
    notes: v.optional(v.string()),
    template: v.optional(v.string()),
    paymentLink: v.optional(v.string()),
    showBankingDetails: v.optional(v.boolean()),
    quoteId: v.optional(v.id("quotes")),
    isRecurring: v.optional(v.boolean()),
    recurringInterval: v.optional(v.string()),
    recurringDays: v.optional(v.number()),
    recurringDayOfMonth: v.optional(v.number()),
    recurringDueDays: v.optional(v.number()),
    recurringDueDayOfMonth: v.optional(v.number()),
    recurringDueDateDayOfNextMonth: v.optional(v.number()),
    scheduledSendAt: v.optional(v.number()),
    scheduledSendTo: v.optional(v.string()),
    scheduledSendTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const publicToken = Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);

    const invoiceId = await ctx.db.insert("invoices", {
      companyId: args.companyId,
      clientId: args.clientId,
      quoteId: args.quoteId,
      invoiceNumber: args.invoiceNumber,
      clientName: args.clientName,
      clientEmail: args.clientEmail,
      clientCompany: args.clientCompany,
      clientPhone: args.clientPhone,
      clientAddress: args.clientAddress,
      status: args.status,
      items: args.items,
      subtotal: args.subtotal,
      taxRate: args.taxRate,
      taxAmount: args.taxAmount,
      total: args.total,
      amountPaid: args.amountPaid,
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      notes: args.notes,
      template: args.template,
      paymentLink: args.paymentLink,
      showBankingDetails: args.showBankingDetails,
      publicToken,
      publicEnabled: true,
      isRecurring: args.isRecurring,
      recurringInterval: args.recurringInterval,
      recurringDays: args.recurringDays,
      recurringDayOfMonth: args.recurringDayOfMonth,
      recurringDueDays: args.recurringDueDays,
      recurringDueDayOfMonth: args.recurringDueDayOfMonth,
      recurringDueDateDayOfNextMonth: args.recurringDueDateDayOfNextMonth,
      nextRecurringDate: args.isRecurring ? calculateNextRecurringDate(args) : undefined,
      scheduledSendAt: args.scheduledSendAt,
      scheduledSendTo: args.scheduledSendTo,
      scheduledSendTime: args.scheduledSendTime,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, invoiceId, publicToken };
  },
});

function calculateNextRecurringDate(args: { recurringInterval?: string; recurringDays?: number; recurringDayOfMonth?: number; issueDate: string }): string {
  const issueDate = new Date(args.issueDate);
  
  if (args.recurringInterval === 'monthly' && args.recurringDayOfMonth) {
    const nextMonth = new Date(issueDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(args.recurringDayOfMonth);
    return nextMonth.toISOString().split('T')[0];
  }
  
  if (args.recurringDays) {
    const nextDate = new Date(issueDate);
    nextDate.setDate(nextDate.getDate() + args.recurringDays);
    return nextDate.toISOString().split('T')[0];
  }
  
  return '';
}

export const update = mutation({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
    invoiceNumber: v.string(),
    clientId: v.optional(v.id("clients")),
    clientName: v.string(),
    clientEmail: v.optional(v.string()),
    clientCompany: v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    clientAddress: v.optional(v.string()),
    status: v.string(),
    items: v.array(v.object({
      itemType: v.optional(v.string()),
      itemId: v.optional(v.string()),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    })),
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    amountPaid: v.number(),
    issueDate: v.string(),
    dueDate: v.string(),
    sentAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    template: v.optional(v.string()),
    paymentLink: v.optional(v.string()),
    showBankingDetails: v.optional(v.boolean()),
    isRecurring: v.optional(v.boolean()),
    recurringInterval: v.optional(v.string()),
    recurringDays: v.optional(v.number()),
    recurringDayOfMonth: v.optional(v.number()),
    recurringDueDays: v.optional(v.number()),
    recurringDueDayOfMonth: v.optional(v.number()),
    recurringDueDateDayOfNextMonth: v.optional(v.number()),
    scheduledSendAt: v.optional(v.number()),
    scheduledSendTo: v.optional(v.string()),
    scheduledSendTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const updates: any = {
      clientId: args.clientId,
      invoiceNumber: args.invoiceNumber,
      clientName: args.clientName,
      clientEmail: args.clientEmail,
      clientCompany: args.clientCompany,
      clientPhone: args.clientPhone,
      clientAddress: args.clientAddress,
      status: args.status,
      items: args.items,
      subtotal: args.subtotal,
      taxRate: args.taxRate,
      taxAmount: args.taxAmount,
      total: args.total,
      amountPaid: args.amountPaid,
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      notes: args.notes,
      template: args.template,
      paymentLink: args.paymentLink,
      showBankingDetails: args.showBankingDetails,
      updatedAt: Date.now(),
      isRecurring: args.isRecurring,
      recurringInterval: args.recurringInterval,
      recurringDays: args.recurringDays,
      recurringDayOfMonth: args.recurringDayOfMonth,
      recurringDueDays: args.recurringDueDays,
      recurringDueDayOfMonth: args.recurringDueDayOfMonth,
      scheduledSendAt: args.scheduledSendAt,
      scheduledSendTo: args.scheduledSendTo,
    };

    if (args.sentAt) updates.sentAt = args.sentAt;
    if (args.paidAt) updates.paidAt = args.paidAt;
    if (args.isRecurring) {
      updates.nextRecurringDate = calculateNextRecurringDate({
        recurringInterval: args.recurringInterval,
        recurringDays: args.recurringDays,
        recurringDayOfMonth: args.recurringDayOfMonth,
        issueDate: args.issueDate,
      });
    }

    await ctx.db.patch(args.invoiceId, updates);

    return { success: true };
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await ctx.db.delete(args.invoiceId);

    return { success: true };
  },
});

export const markAsSent = mutation({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await ctx.db.patch(args.invoiceId, {
      status: "sent",
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const markAsPaid = mutation({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await ctx.db.patch(args.invoiceId, {
      status: "paid",
      amountPaid: invoice.total,
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const applyPayment = mutation({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (args.amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    const currentPaid = invoice.amountPaid || 0;
    const newPaid = Math.min(currentPaid + args.amount, invoice.total);

    const isFullyPaid = newPaid >= invoice.total;
    const updates: any = {
      amountPaid: newPaid,
      updatedAt: Date.now(),
    };

    if (isFullyPaid) {
      updates.status = 'paid';
      updates.paidAt = Date.now();
    } else if (invoice.status === 'draft' || invoice.status === 'overdue') {
      // If we had partial payment, ensure it's marked as sent (not draft)
      updates.status = 'sent';
      if (!invoice.sentAt) {
        updates.sentAt = Date.now();
      }
    }

    await ctx.db.patch(args.invoiceId, updates);

    return {
      success: true,
      isFullyPaid,
      newAmountPaid: newPaid,
      outstanding: Math.max(0, invoice.total - newPaid),
    };
  },
});

export const reversePayment = mutation({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const currentPaid = invoice.amountPaid || 0;
    const newPaid = Math.max(0, currentPaid - args.amount);
    const isStillPaid = newPaid >= invoice.total;
    const updates: any = {
      amountPaid: newPaid,
      updatedAt: Date.now(),
    };

    if (!isStillPaid && invoice.status === 'paid') {
      updates.status = 'sent';
      updates.paidAt = undefined;
    }

    await ctx.db.patch(args.invoiceId, updates);

    return {
      success: true,
      newAmountPaid: newPaid,
      outstanding: Math.max(0, invoice.total - newPaid),
    };
  },
});

export const markAsOverdue = mutation({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await ctx.db.patch(args.invoiceId, {
      status: "overdue",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const createFromQuote = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    quoteId: v.id("quotes"),
    invoiceNumber: v.string(),
    dueDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    if (quote.status !== "accepted") {
      throw new Error("Only accepted quotes can be converted to invoices");
    }

    // Check if invoice already exists for this quote
    const existingInvoice = await ctx.db
      .query("invoices")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.quoteId))
      .first();

    if (existingInvoice) {
      throw new Error("An invoice has already been created from this quote");
    }

    const invoiceId = await ctx.db.insert("invoices", {
      companyId: args.companyId,
      quoteId: args.quoteId,
      invoiceNumber: args.invoiceNumber,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientCompany: quote.clientCompany,
      clientPhone: quote.clientPhone,
      clientAddress: quote.clientAddress,
      status: "draft",
      items: quote.items,
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      total: quote.total,
      amountPaid: 0,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: args.dueDate,
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, invoiceId };
  },
});

// Create invoice from order (public - called after successful payment)
export const createFromOrder = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Check if invoice already exists for this order
    const existingInvoice = await ctx.db
      .query("invoices")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();

    if (existingInvoice) {
      return { success: true, invoiceId: existingInvoice._id };
    }

    // Get order items as invoice line items
    const orderItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    const invoiceItems = orderItems.map(item => ({
      description: item.productName,
      quantity: item.quantity,
      unitPrice: item.productPrice,
      total: item.total,
    }));

    const invoiceNumber = generateInvoiceNumber();
    const now = Date.now();
    const dueDate = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const invoiceId = await ctx.db.insert("invoices", {
      companyId: order.companyId,
      orderId: args.orderId,
      invoiceNumber,
      clientName: order.customerName,
      clientEmail: order.customerEmail,
      clientPhone: order.customerPhone,
      clientAddress: order.shippingAddress ? 
        `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingCountry}` : undefined,
      status: "paid",
      items: invoiceItems,
      subtotal: order.subtotal,
      taxRate: 0.15,
      taxAmount: order.taxAmount,
      total: order.total,
      amountPaid: order.total,
      issueDate: new Date(now).toISOString().split('T')[0],
      dueDate,
      paidAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, invoiceId };
  },
});

// Get invoice by public token (for client view)
export const getByPublicToken = query({
  args: {
    publicToken: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db
      .query("invoices")
      .filter((q) => q.eq(q.field("publicToken"), args.publicToken))
      .first();
    
    if (!invoice || !invoice.publicEnabled) {
      return null;
    }

    const company = await ctx.db.get(invoice.companyId as any);
    return { invoice, company };
  },
});

// Process payment (mark as paid)
export const processPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await ctx.db.patch(args.invoiceId, {
      status: "paid",
      amountPaid: invoice.total,
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Generate new token for invoice sharing
export const generateShareToken = mutation({
  args: {
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.userId);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const newToken = Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);

    await ctx.db.patch(args.invoiceId, {
      publicToken: newToken,
      publicEnabled: true,
      updatedAt: Date.now(),
    });

    return { success: true, token: newToken };
  },
});

// Create child invoice from recurring
export const createRecurringInvoice = mutation({
  args: {
    parentInvoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const parentInvoice = await ctx.db.get(args.parentInvoiceId);
    if (!parentInvoice) {
      throw new Error("Parent invoice not found");
    }

    const invoiceNumber = generateInvoiceNumber();
    const now = Date.now();
    const issueDate = new Date(now).toISOString().split('T')[0];
    
    let dueDate: string;
    if (parentInvoice.recurringDueDateDayOfNextMonth) {
      const due = new Date(now);
      due.setMonth(due.getMonth() + 1);
      due.setDate(parentInvoice.recurringDueDateDayOfNextMonth);
      dueDate = due.toISOString().split('T')[0];
    } else if (parentInvoice.recurringDueDayOfMonth) {
      const due = new Date(now);
      due.setDate(parentInvoice.recurringDueDayOfMonth);
      dueDate = due.toISOString().split('T')[0];
    } else if (parentInvoice.recurringDueDays) {
      const due = new Date(now);
      due.setDate(due.getDate() + parentInvoice.recurringDueDays);
      dueDate = due.toISOString().split('T')[0];
    } else {
      dueDate = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    let nextRecurringDate: string | undefined;
    if (parentInvoice.isRecurring) {
      nextRecurringDate = calculateNextRecurringDate({
        recurringInterval: parentInvoice.recurringInterval,
        recurringDays: parentInvoice.recurringDays,
        recurringDayOfMonth: parentInvoice.recurringDayOfMonth,
        issueDate,
      });
    }

    const invoiceId = await ctx.db.insert("invoices", {
      companyId: parentInvoice.companyId,
      clientId: parentInvoice.clientId,
      parentInvoiceId: args.parentInvoiceId,
      invoiceNumber,
      clientName: parentInvoice.clientName,
      clientEmail: parentInvoice.clientEmail,
      clientCompany: parentInvoice.clientCompany,
      clientPhone: parentInvoice.clientPhone,
      clientAddress: parentInvoice.clientAddress,
      status: "sent",
      items: parentInvoice.items,
      subtotal: parentInvoice.subtotal,
      taxRate: parentInvoice.taxRate,
      taxAmount: parentInvoice.taxAmount,
      total: parentInvoice.total,
      amountPaid: 0,
      issueDate,
      dueDate,
      notes: parentInvoice.notes,
      publicToken: parentInvoice.publicToken,
      publicEnabled: true,
      isRecurring: parentInvoice.isRecurring,
      recurringInterval: parentInvoice.recurringInterval,
      recurringDays: parentInvoice.recurringDays,
      recurringDayOfMonth: parentInvoice.recurringDayOfMonth,
      recurringDueDays: parentInvoice.recurringDueDays,
      recurringDueDayOfMonth: parentInvoice.recurringDueDayOfMonth,
      recurringDueDateDayOfNextMonth: parentInvoice.recurringDueDateDayOfNextMonth,
      nextRecurringDate,
      scheduledSendTime: parentInvoice.scheduledSendTime,
      sentAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Update parent invoice next recurring date
    if (parentInvoice.isRecurring && nextRecurringDate) {
      await ctx.db.patch(args.parentInvoiceId, {
        nextRecurringDate,
        updatedAt: Date.now(),
      });
    }

    return { success: true, invoiceId };
  },
});
