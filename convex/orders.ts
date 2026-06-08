import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate unique order number
function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `ORD-${dateStr}-${random}`;
}

// Get shipping options for a company (public)
export const getShippingOptionsPublic = query({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const shippingOptions = await ctx.db
        .query("shippingOptions")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId as any))
        .collect();

      return shippingOptions.filter((s) => s.isActive);
    } catch (error) {
      console.error("Error fetching shipping options:", error);
      return [];
    }
  },
});

// Get shipping option by ID (public)
export const getShippingOptionByIdPublic = query({
  args: {
    shippingOptionId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const shippingOption = await ctx.db.get(args.shippingOptionId as any);
      return shippingOption || null;
    } catch (error) {
      console.error("Error fetching shipping option:", error);
      return null;
    }
  },
});

// Create a new order
export const createOrder = mutation({
  args: {
    // Company and website
    companyId: v.string(), // Accept string to handle both formats
    websiteId: v.optional(v.string()),
    
    // Customer info
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    
    // Shipping info
    shippingName: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    shippingCity: v.optional(v.string()),
    shippingState: v.optional(v.string()),
    shippingZipCode: v.optional(v.string()),
    shippingCountry: v.optional(v.string()),
    
    // Shipping method
    shippingOptionId: v.optional(v.string()),
    shippingMethodName: v.optional(v.string()),
    shippingPrice: v.optional(v.number()),
    
    // Order items
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      productPrice: v.number(),
      quantity: v.number(),
      total: v.number(),
    })),
    
    // Financial
    subtotal: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    
    // Payment
    paymentMethod: v.optional(v.string()),
    paymentId: v.optional(v.string()),
    
    // Notes
    notes: v.optional(v.string()),
  },
 handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Normalize companyId to ensure it has the correct prefix
      let companyIdValue: any = args.companyId;
      if (args.companyId) {
        // Remove any existing prefix and add correct one
        const cleanId = args.companyId.replace(/^companies_/, '');
        companyIdValue = `companies_${cleanId}`;
      }
      
      // Validate company exists
      try {
        const company = await ctx.db.get(companyIdValue as any);
        if (!company) {
          throw new Error("Company not found");
        }
      } catch (dbError) {
        console.error("Company lookup error:", dbError);
      }
      
      // Generate unique order number
      const orderNumber = generateOrderNumber();
      
      // Create the order
      const orderId = await ctx.db.insert("orders", {
        companyId: companyIdValue,
        websiteId: args.websiteId as any,
        orderNumber,
        
        // Customer info
        customerName: args.customerName,
        customerEmail: args.customerEmail,
        customerPhone: args.customerPhone,
        
        // Shipping info
        shippingName: args.shippingName,
        shippingAddress: args.shippingAddress,
        shippingCity: args.shippingCity,
        shippingState: args.shippingState,
        shippingZipCode: args.shippingZipCode,
        shippingCountry: args.shippingCountry,
        
        // Shipping method
        shippingOptionId: args.shippingOptionId as any,
        shippingMethodName: args.shippingMethodName,
        shippingPrice: args.shippingPrice,
        
        // Status
        status: "pending",
        paymentStatus: args.paymentId ? "paid" : "pending",
        
        // Financial
        subtotal: args.subtotal,
        taxAmount: args.taxAmount,
        total: args.total,
        
        // Payment
        paymentMethod: args.paymentMethod,
        paymentId: args.paymentId,
        
        // Notes
        notes: args.notes,
        
        // Timestamps
        createdAt: now,
        updatedAt: now,
      });
      
      // Create order items
      for (const item of args.items) {
        await ctx.db.insert("orderItems", {
          orderId,
          productId: item.productId as any,
          productName: item.productName,
          productImage: item.productImage,
          productPrice: item.productPrice,
          quantity: item.quantity,
          total: item.total,
          createdAt: now,
        });
        
        // Reduce stock quantity
        try {
          const product = await ctx.db.get(item.productId as any) as any;
          if (product && product.stockQuantity !== undefined) {
            const newStock = Math.max(0, product.stockQuantity - item.quantity);
            await ctx.db.patch(item.productId as any, {
              stockQuantity: newStock,
              status: newStock > 0 ? product.status : "out_of_stock",
            });
          }
        } catch (err) {
          console.error("Error reducing stock:", err);
        }
      }
      
      return {
        orderId,
        orderNumber,
      };
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },
});

// Get orders by company (internal use)
export const getOrdersByCompanyInternal = query({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalize companyId to handle both formats
    const normalizedId = args.companyId.replace(/^companies_/, '');
    const withPrefix = `companies_${normalizedId}`;
    
    const allOrders = await ctx.db
      .query("orders")
      .collect();
    
    // Filter orders matching this company (either format)
    const orders = allOrders.filter((order) => 
      order.companyId === args.companyId || 
      order.companyId === withPrefix ||
      order.companyId === normalizedId ||
      order.companyId === `companies_${normalizedId}`
    );
    
    // Also get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();
        return { ...order, items };
      })
    );
    
    return ordersWithItems.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get a single order by ID
export const getOrderById = query({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      return null;
    }
    
    // Get order items
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();
    
    return {
      ...order,
      items,
    };
  },
});

// Update order status
export const updateOrderStatus = mutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Update payment status
export const updatePaymentStatus = mutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
    paymentStatus: v.string(),
    paymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      paymentStatus: args.paymentStatus,
      paymentId: args.paymentId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Public mutation to update order after successful payment
export const updateOrderAfterPayment = mutation({
  args: {
    orderId: v.id("orders"),
    paymentStatus: v.string(),
    paymentId: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Update order with payment info
    await ctx.db.patch(args.orderId, {
      paymentStatus: args.paymentStatus,
      paymentId: args.paymentId,
      status: args.status || "confirmed",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get order by ID (public)
export const getOrderByIdPublic = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      return null;
    }

    // Get order items
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    return {
      ...order,
      items,
    };
  },
});

// Get order items by order ID (public)
export const getOrderItemsByOrderIdPublic = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    return items;
  },
});

// Delete an order and its items
export const deleteOrder = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    // Delete all order items first
    const orderItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    for (const item of orderItems) {
      await ctx.db.delete(item._id);
    }

    // Delete the order
    await ctx.db.delete(args.orderId);

    return { success: true };
  },
});

// Update order details
export const updateOrder = mutation({
  args: {
    orderId: v.id("orders"),
    customerName: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    shippingName: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    shippingCity: v.optional(v.string()),
    shippingState: v.optional(v.string()),
    shippingZipCode: v.optional(v.string()),
    shippingCountry: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { orderId, ...updates } = args;
    
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(orderId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update order with BobGo shipping info
export const updateOrderShippingInfo = mutation({
  args: {
    orderId: v.id("orders"),
    bobgoOrderId: v.optional(v.number()),
    bobgoShipmentId: v.optional(v.number()),
    bobgoRateId: v.optional(v.number()),
    waybillUrl: v.optional(v.string()),
    shippingCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { orderId, ...updates } = args;
    
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(orderId, {
      ...filteredUpdates,
      status: "shipped",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
