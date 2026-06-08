import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  validateCompanyResourceAccess,
} from "./security";

// Product status enum values
const ProductStatus = {
  draft: "draft",
  available: "available",
  out_of_stock: "out_of_stock",
  discontinued: "discontinued",
};

// Get all products for a company
export const getProductsByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const products = await ctx.db
        .query("products")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },
});

// Get unique product categories for a company
export const getProductCategoriesByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const products = await ctx.db
        .query("products")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const categoriesMap = new Map<string, { name: string; count: number }>();
      products.forEach((product) => {
        const productCategories = product.categories && product.categories.length > 0 
          ? product.categories 
          : ["uncategorized"];
        productCategories.forEach((cat: string) => {
          const existing = categoriesMap.get(cat);
          if (existing) {
            existing.count++;
          } else {
            categoriesMap.set(cat, { name: cat, count: 1 });
          }
        });
      });

      return Array.from(categoriesMap.values()).sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      throw error;
    }
  },
});

// Get all products for a website (via company)
export const getProductsByWebsite = query({
  args: {
    userId: v.id("users"),
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const website = await ctx.db.get(args.websiteId);
      if (!website || !website.companyId) {
        return [];
      }

      await validateCompanyResourceAccess(ctx, args.userId, website.companyId);

      const products = await ctx.db
        .query("products")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      // Filter to active products only (show all statuses for accurate stock display)
      return products.filter((p) => p.isActive);
    } catch (error) {
      console.error("Error fetching active products by website:", error);
      throw error;
    }
  },
});

// Public query to get all products for a website without authentication
export const getProductsByWebsitePublic = query({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const website = await ctx.db.get(args.websiteId);
      if (!website || !website.companyId) {
        return [];
      }

      const products = await ctx.db
        .query("products")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      return products.filter((p) => p.isActive);
    } catch (error) {
      console.error("Error fetching products by website (public):", error);
      throw error;
    }
  },
});

// Public query to get active/available products for a website without authentication
export const getActiveProductsByWebsitePublic = query({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    try {
      const website = await ctx.db.get(args.websiteId);
      if (!website || !website.companyId) {
        return [];
      }

      const products = await ctx.db
        .query("products")
        .withIndex("by_company", (q) => q.eq("companyId", website.companyId))
        .collect();

      // Return all active products (status is handled by the card component)
      return products.filter((p) => p.isActive);
    } catch (error) {
      console.error("Error fetching active products by website (public):", error);
      throw error;
    }
  },
});

// Public query to get a single product by ID without authentication
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getProductByIdPublic = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const searchIds = [
        args.productId,
        args.productId.startsWith("products_") ? args.productId : `products_${args.productId}`,
      ];
      
      console.log("[getProductByIdPublic] Searching with IDs:", searchIds);
      
      // Try direct lookup with each ID
      for (const searchId of searchIds) {
        try {
          const product: any = await ctx.db.get(searchId as any);
          if (product && product.isActive) {
            console.log("[getProductByIdPublic] Found product:", product.name);
            return product;
          }
        } catch (e) {
          console.log("[getProductByIdPublic] Error getting", searchId, ":", e);
        }
      }
      
      // Fallback: scan all products
      const allProducts = await ctx.db.query("products").collect();
      console.log("[getProductByIdPublic] Total products:", allProducts.length);
      
      const found = allProducts.find(p => 
        p.isActive && (p._id === args.productId || p._id.endsWith(args.productId))
      );
      
      if (found) {
        console.log("[getProductByIdPublic] Found via fallback:", found.name);
        return found;
      }
      
      console.log("[getProductByIdPublic] Product not found");
      return null;
    } catch (error) {
      console.error("Error fetching product by ID (public):", error);
      return null;
    }
  },
});

// Public query to get multiple products by IDs (for cart stock checking)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getProductsByIdsPublic = query({
  args: {
    productIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const products: any[] = [];
      
      for (const productId of args.productIds) {
        const normalizedId = productId.startsWith("products_")
          ? productId
          : `products_${productId}`;
        
        try {
          const product: any = await ctx.db.get(normalizedId as any);
          if (product && product.isActive) {
            products.push({
              _id: product._id,
              stockQuantity: product.stockQuantity ?? 0,
              status: product.status,
            });
          }
        } catch {
          // Skip this product if it fails
        }
      }
      
      return products;
    } catch (error) {
      console.error("Error fetching products by IDs (public):", error);
      return [];
    }
  },
});

// Get company info for a product (public)
export const getCompanyByProductIdPublic = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const normalizedId = args.productId.startsWith("products_")
        ? args.productId
        : `products_${args.productId}`;

      try {
        const product: any = await ctx.db.get(normalizedId as any);
        if (!product || !product.companyId) {
          return null;
        }

        try {
          const company: any = await ctx.db.get(product.companyId as any);
          if (!company) {
            return null;
          }

          return {
            _id: company._id,
            name: company.name,
            currency: company.currency,
            branding: company.branding,
          };
        } catch {
          return null;
        }
      } catch {
        return null;
      }
    } catch (error) {
      console.error("Error fetching company by product (public):", error);
      return null;
    }
  },
});

// Get products by status
export const getProductsByStatus = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const products = await ctx.db
        .query("products")
        .withIndex("by_company_status", (q) =>
          q.eq("companyId", args.companyId).eq("status", args.status)
        )
        .collect();

      return products;
    } catch (error) {
      console.error("Error fetching products by status:", error);
      throw error;
    }
  },
});

// Get a product by ID
export const getProductById = query({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const product = await ctx.db.get(args.productId);
      if (!product) {
        return null;
      }

      await validateCompanyResourceAccess(ctx, args.userId, product.companyId);

      return product;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  },
});

// Get a product by string ID (for URL params)
export const getProductByIdString = query({
  args: {
    userId: v.id("users"),
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const normalizedId = args.productId.startsWith("products_")
        ? args.productId
        : `products_${args.productId}`;

      try {
        const product = await ctx.db.get(normalizedId as any) as any;
        if (!product) {
          return null;
        }

        await validateCompanyResourceAccess(ctx, args.userId, product.companyId);

        return product;
      } catch {
        return null;
      }
    } catch (error) {
      console.error("Error fetching product by string ID:", error);
      throw error;
    }
  },
});

// Search products by reference/SKU
export const searchByReference = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(ctx, args.userId, args.companyId);

    try {
      const products = await ctx.db
        .query("products")
        .withIndex("by_reference", (q) => q.eq("reference", args.reference))
        .collect();

      return products.filter((p) => p.companyId === args.companyId);
    } catch (error) {
      console.error("Error searching products by reference:", error);
      throw error;
    }
  },
});

// Search products by SKU
export const searchBySKU = query({
  args: {
    userId: v.id("users"),
    sku: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      const product = await ctx.db
        .query("products")
        .withIndex("by_sku", (q) => q.eq("sku", args.sku))
        .unique();

      if (!product) {
        return null;
      }

      await validateCompanyResourceAccess(ctx, args.userId, product.companyId);

      return product;
    } catch (error) {
      console.error("Error searching product by SKU:", error);
      throw error;
    }
  },
});

// Create a new product
export const createProduct = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    // Core fields
    name: v.string(),
    description: v.optional(v.string()),
    reference: v.string(),

    // Classification
    categories: v.optional(v.array(v.string())),

    // Pricing
    price: v.number(),
    discountedPrice: v.optional(v.number()),
    cost: v.optional(v.number()),

    // Inventory
    sku: v.optional(v.string()),
    stockQuantity: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),

    // Status
    status: v.optional(v.string()),
    isActive: v.optional(v.boolean()),

    // Relationships
    branchId: v.optional(v.id("branches")),
    tags: v.optional(v.array(v.string())),

    // Media
    images: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    documentUrls: v.optional(v.array(v.string())),

    // Specifications
    specifications: v.optional(
      v.object({
        weight: v.optional(v.number()),
        dimensions: v.optional(v.object({
          length: v.optional(v.number()),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
          unit: v.optional(v.string()),
        })),
        color: v.optional(v.string()),
        material: v.optional(v.string()),
        size: v.optional(v.string()),
      })
    ),

    // Extensions
    extraSpecifications: v.optional(v.record(v.string(), v.any())),
    features: v.optional(v.array(v.string())),

    // Display settings
    showSpecifications: v.optional(v.boolean()),

    // Analytics
    viewsCount: v.optional(v.number()),
    purchaseCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);
    await validateCompanyResourceAccess(
      ctx,
      args.userId,
      args.companyId,
      "member"
    );

    try {
      const now = Date.now();

      const isValidNumber = (value: any): boolean => {
        return typeof value === "number" && !isNaN(value);
      };

      // Check if reference already exists for this company
      const existingReference = await ctx.db
        .query("products")
        .withIndex("by_reference", (q) => q.eq("reference", args.reference))
        .collect();

      const refExistsForCompany = existingReference.some(
        (p) => p.companyId === args.companyId
      );
      if (refExistsForCompany) {
        throw new Error(
          "A product with this reference already exists in your company"
        );
      }

      // Check if SKU already exists (only if SKU is provided)
      if (args.sku && args.sku.trim() !== "") {
        const existingProduct = await ctx.db
          .query("products")
          .withIndex("by_sku", (q) => q.eq("sku", args.sku))
          .unique();

        if (existingProduct) {
          throw new Error("A product with this SKU already exists");
        }
      }

      const productId = await ctx.db.insert("products", {
        // Core
        name: args.name,
        description: args.description || undefined,
        reference: args.reference,

        // Classification
        categories: args.categories || undefined,

        // Pricing
        price: args.price,
        discountedPrice: isValidNumber(args.discountedPrice)
          ? args.discountedPrice
          : undefined,
        cost: isValidNumber(args.cost) ? args.cost : undefined,

        // Inventory
        sku: args.sku || undefined,
        stockQuantity: isValidNumber(args.stockQuantity)
          ? args.stockQuantity
          : undefined,
        lowStockThreshold: isValidNumber(args.lowStockThreshold)
          ? args.lowStockThreshold
          : undefined,

        // Status
        status: args.status || "draft",
        isActive: args.isActive !== undefined ? args.isActive : true,

        // Relationships
        companyId: args.companyId,
        branchId: args.branchId,
        tags: args.tags || [],

        // Media
        images: args.images || [],
        featuredImage: args.featuredImage || undefined,
        coverImage: args.coverImage || undefined,
        documentUrls: args.documentUrls || [],

        // Specifications
        specifications: args.specifications || undefined,

        // BobGo shipping - pickup location
        pickupLocation: (args as any).pickupLocation || undefined,
        pickupAddress: (args as any).pickupAddress || undefined,
        pickupPostalCode: (args as any).pickupPostalCode || undefined,
        pickupCity: (args as any).pickupCity || undefined,
        pickupProvince: (args as any).pickupProvince || undefined,
        pickupCountry: (args as any).pickupCountry || undefined,
        showPickupLocation: (args as any).showPickupLocation || false,

        // Extensions
        extraSpecifications: args.extraSpecifications || {},
        features: args.features || [],

        // Display settings
        showSpecifications: (args as any).showSpecifications !== undefined ? (args as any).showSpecifications : true,

        // Analytics
        viewsCount: isValidNumber(args.viewsCount) ? args.viewsCount : 0,
        purchaseCount: isValidNumber(args.purchaseCount)
          ? args.purchaseCount
          : 0,

        // Metadata
        schemaVersion: "1.0",
        createdAt: now,
        updatedAt: now,
      });

      return productId;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },
});

// Update a product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    requestingUserId: v.id("users"),

    // Optional update fields
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    reference: v.optional(v.string()),

    // Classification
    categories: v.optional(v.array(v.string())),

    // Pricing
    price: v.optional(v.number()),
    discountedPrice: v.optional(v.number()),
    cost: v.optional(v.number()),

    // Inventory
    sku: v.optional(v.string()),
    stockQuantity: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),

    // Status
    status: v.optional(v.string()),
    isActive: v.optional(v.boolean()),

    // Relationships
    branchId: v.optional(v.id("branches")),
    tags: v.optional(v.array(v.string())),

    // Media
    images: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    documentUrls: v.optional(v.array(v.string())),

    // Specifications
    specifications: v.optional(
      v.object({
        weight: v.optional(v.number()),
        dimensions: v.optional(v.object({
          length: v.optional(v.number()),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        })),
        color: v.optional(v.string()),
        material: v.optional(v.string()),
        size: v.optional(v.string()),
      })
    ),

    // BobGo shipping - pickup location
    pickupLocation: v.optional(v.string()),
    pickupAddress: v.optional(v.string()),
    pickupPostalCode: v.optional(v.string()),
    pickupCity: v.optional(v.string()),
    pickupProvince: v.optional(v.string()),
    pickupCountry: v.optional(v.string()),
    showPickupLocation: v.optional(v.boolean()),

    // Extensions
    extraSpecifications: v.optional(v.record(v.string(), v.any())),
    features: v.optional(v.array(v.string())),

    // Display settings
    showSpecifications: v.optional(v.boolean()),

    // Analytics
    viewsCount: v.optional(v.number()),
    purchaseCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.requestingUserId);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    await validateCompanyResourceAccess(
      ctx,
      args.requestingUserId,
      product.companyId,
      "member"
    );

    try {
      const isValidNumber = (value: any): boolean => {
        return typeof value === "number" && !isNaN(value);
      };

      // Check if reference is being changed and if new reference already exists
      if (args.reference && args.reference !== product.reference) {
        const existingReference = await ctx.db
          .query("products")
          .withIndex("by_reference", (q) => q.eq("reference", args.reference!))
          .collect();

        const refExistsForCompany = existingReference.some(
          (p) => p.companyId === product.companyId && p._id !== args.productId
        );

        if (refExistsForCompany) {
          throw new Error(
            "A product with this reference already exists in your company"
          );
        }
      }

      // Check if SKU is being changed and if new SKU already exists
      if (args.sku && args.sku !== product.sku) {
        const existingProduct = await ctx.db
          .query("products")
          .withIndex("by_sku", (q) => q.eq("sku", args.sku))
          .unique();

        if (existingProduct && existingProduct._id !== args.productId) {
          throw new Error("A product with this SKU already exists");
        }
      }

      const now = Date.now();

      const updateData: any = {
        ...(args.name !== undefined && { name: args.name }),
        ...(args.description !== undefined && { description: args.description }),
        ...(args.reference !== undefined && { reference: args.reference }),
        ...(args.categories !== undefined && { categories: args.categories }),
        ...(args.price !== undefined && args.price !== null && { price: args.price }),
        ...(isValidNumber(args.discountedPrice) && {
          discountedPrice: args.discountedPrice,
        }),
        ...(isValidNumber(args.cost) && { cost: args.cost }),
        ...(args.sku !== undefined && { sku: args.sku }),
        ...(args.stockQuantity !== undefined && { stockQuantity: args.stockQuantity }),
        ...(args.lowStockThreshold !== undefined && {
          lowStockThreshold: args.lowStockThreshold,
        }),
        ...(args.status !== undefined && { status: args.status }),
        ...(args.isActive !== undefined && { isActive: args.isActive }),
        ...(args.branchId !== undefined && { branchId: args.branchId }),
        ...(args.tags !== undefined && { tags: args.tags }),
        ...(args.images !== undefined && { images: args.images }),
        ...(args.featuredImage !== undefined && { featuredImage: args.featuredImage }),
        ...(args.coverImage !== undefined && { coverImage: args.coverImage }),
        ...(args.documentUrls !== undefined && { documentUrls: args.documentUrls }),
        ...(args.specifications !== undefined && { specifications: args.specifications }),
        ...(args.pickupLocation !== undefined && { pickupLocation: args.pickupLocation }),
        ...(args.pickupAddress !== undefined && { pickupAddress: args.pickupAddress }),
        ...(args.pickupPostalCode !== undefined && { pickupPostalCode: args.pickupPostalCode }),
        ...(args.pickupCity !== undefined && { pickupCity: args.pickupCity }),
        ...(args.pickupProvince !== undefined && { pickupProvince: args.pickupProvince }),
        ...(args.pickupCountry !== undefined && { pickupCountry: args.pickupCountry }),
        ...(args.showPickupLocation !== undefined && { showPickupLocation: args.showPickupLocation }),
        ...(args.extraSpecifications !== undefined && {
          extraSpecifications: args.extraSpecifications,
        }),
        ...(args.features !== undefined && { features: args.features }),
        ...(args.showSpecifications !== undefined && { showSpecifications: args.showSpecifications }),
        ...(isValidNumber(args.viewsCount) && { viewsCount: args.viewsCount }),
        ...(isValidNumber(args.purchaseCount) && { purchaseCount: args.purchaseCount }),
        updatedAt: now,
      };

      await ctx.db.patch(args.productId, updateData);

      return { success: true };
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },
});

// Delete a product
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.requestingUserId);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    await validateCompanyResourceAccess(
      ctx,
      args.requestingUserId,
      product.companyId,
      "admin"
    );

    try {
      await ctx.db.delete(args.productId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },
});

// Toggle product active status
export const toggleProductStatus = mutation({
  args: {
    productId: v.id("products"),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.requestingUserId);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    await validateCompanyResourceAccess(
      ctx,
      args.requestingUserId,
      product.companyId,
      "member"
    );

    try {
      await ctx.db.patch(args.productId, {
        isActive: !product.isActive,
        updatedAt: Date.now(),
      });

      return { success: true, isActive: !product.isActive };
    } catch (error) {
      console.error("Error toggling product status:", error);
      throw error;
    }
  },
});

// Update product status
export const updateProductStatus = mutation({
  args: {
    productId: v.id("products"),
    requestingUserId: v.id("users"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.requestingUserId);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    await validateCompanyResourceAccess(
      ctx,
      args.requestingUserId,
      product.companyId,
      "member"
    );

    try {
      await ctx.db.patch(args.productId, {
        status: args.status,
        updatedAt: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating product status:", error);
      throw error;
    }
  },
});

// Get products for user across all accessible companies (for showcase)
export const getProductsForUserShowcase = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthenticatedUser(ctx, args.userId);

    try {
      // Get all companies the user has access to
      const userCompanies = await ctx.db
        .query("userCompanies")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      const companyIds = userCompanies.map((uc) => uc.companyId);

      // Get products for all accessible companies
      const allProducts: any[] = [];

      for (const companyId of companyIds) {
        const products = await ctx.db
          .query("products")
          .withIndex("by_company", (q) => q.eq("companyId", companyId))
          .collect();
        allProducts.push(...products);
      }

      return allProducts;
    } catch (error) {
      console.error("Error fetching products for user showcase:", error);
      throw error;
    }
  },
});

export const updateProductStock = mutation({
  args: {
    productId: v.string(),
    stockQuantity: v.number(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedId = args.productId.startsWith("products_")
      ? args.productId
      : `products_${args.productId}`;

    try {
      // Auto-update status based on stock quantity if not provided
      let newStatus = args.status;
      if (!newStatus) {
        if (args.stockQuantity <= 0) {
          newStatus = 'out_of_stock';
        } else if (args.stockQuantity <= 5) {
          newStatus = 'low_stock';
        } else {
          newStatus = 'available';
        }
      }
      
      await ctx.db.patch(normalizedId as any, {
        stockQuantity: args.stockQuantity,
        status: newStatus as any,
        updatedAt: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating product stock:", error);
      throw error;
    }
  },
});
