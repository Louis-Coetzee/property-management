import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  validateCompanyResourceAccess,
} from "./security";

// Get all suppliers for a company
export const getSuppliersByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const suppliers = await ctx.db
        .query("suppliers")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      return suppliers;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  },
});

// Get supplier by ID
export const getSupplierById = query({
  args: {
    userId: v.id("users"),
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);

    if (!supplier) {
      throw new Error("NOT_FOUND: Supplier not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, supplier.companyId);

    return supplier;
  },
});

// Search suppliers by company
export const searchSuppliersByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const suppliers = await ctx.db
        .query("suppliers")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const query = args.searchQuery.toLowerCase();
      return suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(query) ||
        (supplier.email && supplier.email.toLowerCase().includes(query)) ||
        (supplier.category && supplier.category.toLowerCase().includes(query))
      );
    } catch (error) {
      console.error('Error searching suppliers:', error);
      throw error;
    }
  },
});

// Create a new supplier
export const createSupplier = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    province: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()),
    taxNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const now = Date.now();

      const supplierId = await ctx.db.insert("suppliers", {
        companyId: args.companyId,
        name: args.name,
        email: args.email,
        phone: args.phone,
        contactPerson: args.contactPerson,
        address: args.address,
        city: args.city,
        province: args.province,
        postalCode: args.postalCode,
        country: args.country,
        taxNumber: args.taxNumber,
        notes: args.notes,
        category: args.category,
        isActive: args.isActive !== undefined ? args.isActive : true,
        createdAt: now,
        updatedAt: now,
      });

      return supplierId;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  },
});

// Update a supplier
export const updateSupplier = mutation({
  args: {
    userId: v.id("users"),
    supplierId: v.id("suppliers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    province: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()),
    taxNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);

    if (!supplier) {
      throw new Error("NOT_FOUND: Supplier not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, supplier.companyId);

    const now = Date.now();

    const updateData: any = {
      updatedAt: now,
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.contactPerson !== undefined) updateData.contactPerson = args.contactPerson;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.city !== undefined) updateData.city = args.city;
    if (args.province !== undefined) updateData.province = args.province;
    if (args.postalCode !== undefined) updateData.postalCode = args.postalCode;
    if (args.country !== undefined) updateData.country = args.country;
    if (args.taxNumber !== undefined) updateData.taxNumber = args.taxNumber;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;

    await ctx.db.patch(args.supplierId, updateData);

    return { success: true };
  },
});

// Delete a supplier
export const deleteSupplier = mutation({
  args: {
    userId: v.id("users"),
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);

    if (!supplier) {
      throw new Error("NOT_FOUND: Supplier not found");
    }

    await validateCompanyResourceAccess(ctx, args.userId, supplier.companyId);

    await ctx.db.delete(args.supplierId);

    return { success: true };
  },
});