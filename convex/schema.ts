import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    contactNumber: v.string(),
    passwordHash: v.string(),
    profileImage: v.optional(v.string()),
    isEmailVerified: v.boolean(),
    emailVerificationToken: v.optional(v.string()),
    emailVerificationTokenExpiry: v.optional(v.number()),
    passwordResetToken: v.optional(v.string()),
    passwordResetTokenExpiry: v.optional(v.number()),
    passwordExpiresAt: v.optional(v.number()), // Timestamp when password expires and must be changed
    requirePasswordChange: v.optional(v.boolean()), // Force password change on next login
    apps: v.record(v.string(), v.object({
      hasAccess: v.boolean(),
      role: v.string(),
      grantedAt: v.number(),
      emailVerified: v.optional(v.boolean()),
      termsAcceptedAt: v.optional(v.number()),
      termsVersion: v.optional(v.string()),
    })),
    userAccess: v.optional(v.record(v.string(), v.record(v.string(), v.string()))), // websiteId -> { appName: role }
    userType: v.optional(v.string()), // e.g., "admin", "user", "operator", "sales"
    createdAt: v.number(),
    updatedAt: v.number(),
    registeredFromDomain: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_emailVerificationToken", ["emailVerificationToken"])
    .index("by_passwordResetToken", ["passwordResetToken"])
    .index("by_domain", ["registeredFromDomain"]),

  sessions: defineTable({
    userId: v.id("users"),
    activeCompanyId: v.optional(v.id("companies")),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    domain: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"])
    .index("by_domain", ["domain"]),

  emailVerificationLogs: defineTable({
    email: v.string(),
    token: v.string(),
    sentAt: v.number(),
    isUsed: v.boolean(),
    domain: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  passwordResetLogs: defineTable({
    email: v.string(),
    token: v.string(),
    sentAt: v.number(),
    isUsed: v.boolean(),
    domain: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  mediaLibrary: defineTable({
    userIds: v.array(v.id("users")),
    companyId: v.id("companies"), // Company association
    folderId: v.optional(v.id("mediaFolders")), // Parent folder for organization
    url: v.string(),
    filename: v.string(),
    originalFilename: v.optional(v.string()), // Original filename before any processing
    fileType: v.string(), // "image", "document", "video", "audio", "folder", "archive"
    fileSize: v.number(),
    storageType: v.optional(v.string()), // "cloudflare_images", "cloudflare_r2", "s3", etc.
    mimeType: v.optional(v.string()), // MIME type for files
    width: v.optional(v.number()), // Image/video width
    height: v.optional(v.number()), // Image/video height
    duration: v.optional(v.number()), // Video/audio duration in seconds
    thumbnailUrl: v.optional(v.string()), // Thumbnail URL for videos/documents
    createdAt: v.string(),
    updatedAt: v.string(),
    categories: v.optional(v.array(v.string())),
    settings: v.optional(v.object({
      alt: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })),
    createdBy: v.id("users"),
    // Sharing and permissions
    isShared: v.optional(v.boolean()),
    shareToken: v.optional(v.string()),
    shareExpiresAt: v.optional(v.number()),
    sharedWith: v.optional(v.array(v.object({
      userId: v.id("users"),
      permission: v.string(), // "view", "download", "comment", "edit"
      sharedAt: v.number(),
    }))),
    permissions: v.optional(v.object({
      canEdit: v.array(v.id("users")),
      canDelete: v.array(v.id("users")),
      canDownload: v.array(v.id("users")),
    })),
    // Version control for files
    version: v.optional(v.number()),
    previousVersions: v.optional(v.array(v.object({
      url: v.string(),
      version: v.number(),
      createdAt: v.string(),
      createdBy: v.id("users"),
    }))),
  }).index("by_user_ids", ["userIds"])
    .index("by_created_by", ["createdBy"])
    .index("by_company", ["companyId"])
    .index("by_folder", ["folderId"])
    .index("by_share_token", ["shareToken"])
    .index("by_file_type", ["fileType"]),
    
  // Media folders for file organization
  mediaFolders: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("mediaFolders")), // For nested folders
    color: v.optional(v.string()), // Folder color for UI
    icon: v.optional(v.string()), // Folder icon type
    path: v.string(), // Full path like "/documents/2024/images"
    level: v.number(), // Folder depth level (0 = root)
    itemCount: v.optional(v.number()), // Number of items in folder
    totalSize: v.optional(v.number()), // Total size of folder contents in bytes
    isShared: v.optional(v.boolean()), // Whether folder is shared
    shareToken: v.optional(v.string()), // Unique token for shared folder access
    shareExpiresAt: v.optional(v.number()), // Optional expiration for shared access
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.id("users"),
    // Access control
    sharedWith: v.optional(v.array(v.object({
      userId: v.id("users"),
      permission: v.string(), // "view", "comment", "edit"
      sharedAt: v.number(),
    }))),
  }).index("by_company", ["companyId"])
    .index("by_parent", ["parentId"])
    .index("by_created_by", ["createdBy"])
    .index("by_path", ["path"])
    .index("by_share_token", ["shareToken"]),

  mediaCategories: defineTable({
    userIds: v.array(v.id("users")),
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.id("users"),
    sharedAt: v.optional(v.string()),
  }).index("by_user_ids", ["userIds"])
    .index("by_created_by", ["createdBy"])
    .index("by_name_and_users", ["name", "userIds"]),

  companies: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    enabled: v.boolean(),
    // Enabled apps for this company
    enabledApps: v.optional(v.object({
      businessTools: v.optional(v.object({
        enabled: v.boolean(),
        enabledAt: v.optional(v.number()),
      })),
      websites: v.optional(v.object({
        enabled: v.boolean(),
        enabledAt: v.optional(v.number()),
      })),
      vehicleDealership: v.optional(v.object({
        enabled: v.boolean(),
        enabledAt: v.optional(v.number()),
      })),
      onlineStore: v.optional(v.object({
        enabled: v.boolean(),
        enabledAt: v.optional(v.number()),
      })),
      bookingsApp: v.optional(v.object({
        enabled: v.boolean(),
        enabledAt: v.optional(v.number()),
      })),
      realEstate: v.optional(v.object({
        enabled: v.boolean(),
        enabledAt: v.optional(v.number()),
      })),
    })),
    // Currency settings
    currency: v.optional(v.object({
      code: v.optional(v.string()), // Currency code: USD, EUR, GBP, ZAR, etc.
      symbol: v.optional(v.string()), // Currency symbol: $, €, £, R, etc.
      symbolPosition: v.optional(v.string()), // "before" or "after" the amount
      customSymbol: v.optional(v.string()), // Custom currency symbol if not using standard
    })),
    // Timezone settings
    timezone: v.optional(v.string()), // e.g., "Africa/Johannesburg", "America/New_York"
    // Credit system for shipping
    credit: v.optional(v.object({
      balance: v.number(), // Current available credit balance
      totalSpent: v.number(), // Total amount spent on shipping
      lastUpdated: v.number(), // Timestamp of last credit update
    })),
    // Branding settings
    branding: v.optional(v.object({
      primaryColor: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      faviconUrl: v.optional(v.string()),
      logoType: v.optional(v.union(v.literal("image"), v.literal("text"))), // "image" or "text"
      logoText: v.optional(v.string()), // Text content for text logo
      logoTextColor: v.optional(v.string()), // Color for text logo
    })),
    // Payment/Gateway settings (per-company overrides)
    paymentSettings: v.optional(v.object({
      payfast: v.optional(v.object({
        enabled: v.boolean(),
        testMode: v.boolean(),
        merchantId: v.optional(v.string()),
        merchantKey: v.optional(v.string()),
        passphrase: v.optional(v.string()),
      })),
      paypal: v.optional(v.object({
        enabled: v.boolean(),
        testMode: v.boolean(),
        testClientId: v.optional(v.string()),
        testClientSecret: v.optional(v.string()),
        liveClientId: v.optional(v.string()),
        liveClientSecret: v.optional(v.string()),
      })),
    })),
    // Banking details (displayed on invoices)
    bankingDetails: v.optional(v.object({
      bankName: v.optional(v.string()),
      branchCode: v.optional(v.string()),
      accountType: v.optional(v.string()), // "cheque" | "savings" | "transmission" | "business" | etc.
      accountNumber: v.optional(v.string()),
      accountHolder: v.optional(v.string()),
      swiftCode: v.optional(v.string()),
    })),
    // Custom domain for the company (e.g., "mycompany.livewebapp.site")
    subdomain: v.optional(v.string()),
    // Legacy field - old subdomain storage
    customDomain: v.optional(v.string()),
    // Primary domain for SEO - the canonical domain
    primaryDomain: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_subdomain", ["subdomain"]),

  // Credit transactions for tracking credit additions and usage
  companyCredits: defineTable({
    companyId: v.id("companies"),
    amount: v.number(), // Positive for credits added, negative for credits used
    type: v.string(), // "added" | "used" | "refunded"
    paymentMethod: v.optional(v.string()), // "payfast" | "paypal" | "manual"
    reference: v.optional(v.string()), // Payment reference or order ID
    description: v.optional(v.string()),
    balanceAfter: v.number(), // Balance after this transaction
    createdAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_and_created", ["companyId", "createdAt"]),

  // Pending credit payment requests for tracking payment status
  creditPayments: defineTable({
    companyId: v.id("companies"),
    amount: v.number(), // Amount of credits to add
    paymentMethod: v.string(), // "payfast" | "paypal"
    status: v.string(), // "pending" | "completed" | "cancelled" | "failed"
    reference: v.optional(v.string()), // Payment gateway transaction ID
    gatewayOrderId: v.optional(v.string()), // PayFast m_payment_id or PayPal order ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["status"])
    .index("by_reference", ["reference"]),

  apps: defineTable({
    // App type (e.g., "website", "calendar", "store", "business", "courseSite", "propertySite", "scheduler", "vehicleDealershipSite")
    type: v.string(),

    // Domains associated with this app
    domains: v.array(v.string()),

    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_domains", ["domains"]),

  // App configurations - global app settings including pricing
  appConfigs: defineTable({
    // App identifier (e.g., "businessTools", "websites", "vehicleDealership")
    appKey: v.string(),

    // Display information
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    gradient: v.optional(v.string()),

    // Pricing
    pricing: v.optional(v.object({
      monthlyPrice: v.number(),
      yearlyPrice: v.optional(v.number()),
      currency: v.optional(v.string()),
      enabled: v.boolean(),
    })),

    // Features list
    features: v.optional(v.array(v.string())),

    // Status
    isActive: v.boolean(),
    isComingSoon: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),

    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_app_key", ["appKey"])
    .index("by_active", ["isActive"]),

  websites: defineTable({
    // Company ownership
    companyId: v.id("companies"),

    // Basic information
    name: v.string(),
    description: v.string(), // Now required

    // Domains - array of all domains (subdomains and custom domains)
    domains: v.array(v.string()),

    // Primary domain - the canonical domain for SEO
    primaryDomain: v.optional(v.string()),

    // Publishing status
    isPublished: v.boolean(),
    isActive: v.boolean(), // Soft delete flag

    // Branding settings
    branding: v.optional(v.object({
      primaryColor: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      faviconUrl: v.optional(v.string()),
      logoType: v.optional(v.union(v.literal("image"), v.literal("text"))), // "image" or "text"
      logoText: v.optional(v.string()), // Text content for text logo
      logoTextColor: v.optional(v.string()), // Color for text logo
    })),

    // Integrations settings
    integrations: v.optional(v.object({
      autoTrader: v.optional(v.boolean()),
      easyQuotes: v.optional(v.object({
        enabled: v.boolean(),
        formIds: v.optional(v.array(v.id("forms"))),
        mode: v.optional(v.string()), // "test" or "live"
        liveCredentials: v.optional(v.object({
          username: v.optional(v.string()),
          password: v.optional(v.string()),
          clientId: v.optional(v.string()),
          clientSecret: v.optional(v.string()),
          dealerId: v.optional(v.string()),
        })),
      })),
    })),

    // Contact information for vehicle listings
    inquiryFormId: v.optional(v.id("forms")),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    address: v.optional(v.string()),

    // Audit
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_active", ["isActive"])
    .index("by_published", ["isPublished"])
    .index("by_created_by", ["createdBy"])
    .index("by_domains", ["domains"]),

  // Domain mappings for multi-domain support
  domainMappings: defineTable({
    // Company this domain belongs to (required)
    companyId: v.id("companies"),
    
    // Entity that owns this domain (e.g., website, company)
    entityId: v.union(v.id("websites"), v.id("companies")),
    entityType: v.string(), // "website", "calendar", "store", "company", etc.

    // Domain information
    domainType: v.string(), // "subdomain" or "custom"
    domainValue: v.string(), // The actual domain value (subdomain part or full custom domain)

    // Domain status
    status: v.optional(v.string()), // "pending_configuration" | "configured" | "active"
    lastChecked: v.optional(v.number()), // Timestamp of last DNS verification

    // Audit
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_entity", ["entityId", "entityType"])
    .index("by_domain_value", ["domainValue"])
    .index("by_type_and_entity", ["domainType", "entityId"])
    .index("by_created_by", ["createdBy"]),

  // Website pages
  pages: defineTable({
    // Website ownership
    websiteId: v.id("websites"),

    // Basic information
    name: v.string(), // Display name of the page (e.g., "About Us")
    slug: v.string(), // URL-friendly identifier (e.g., "about-us")
    title: v.optional(v.string()), // SEO title
    description: v.optional(v.string()), // SEO description
    content: v.optional(v.string()), // Page content (HTML, JSON, etc.)
    contentType: v.optional(v.string()), // "html", "markdown", "richtext", etc.

    // Publishing status
    isPublished: v.boolean(),
    isActive: v.boolean(), // Soft delete flag
    isHomePage: v.boolean(), // Whether this is the website's home page

    // Optional: page order for custom navigation
    sortOrder: v.optional(v.number()),

    // Audit
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_website", ["websiteId"])
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"])
    .index("by_published", ["isPublished"])
    .index("by_home_page", ["websiteId", "isHomePage"])
    .index("by_created_by", ["createdBy"]),

  // Website forms
  forms: defineTable({
    // Website ownership
    websiteId: v.id("websites"),

    // Basic information
    name: v.string(), // Form title/name
    description: v.optional(v.string()), // Form description (optional)

    // Form fields - array of field objects
    fields: v.array(v.object({
      id: v.string(), // Unique field ID
      label: v.string(), // Field label
      type: v.string(), // Field type: "text", "textarea", "email", "number", "tel", "url", "date", "time", "radio", "checkbox", "select", "multiselect", "file"
      placeholder: v.optional(v.string()), // Placeholder text
      required: v.boolean(), // Whether field is required
      options: v.optional(v.array(v.string())), // Options for radio, checkbox, select, multiselect
      validation: v.optional(v.object({ // Optional validation rules
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        pattern: v.optional(v.string()),
      })),
    })),

    // Email recipients - array of email addresses to receive form submissions
    recipients: v.array(v.string()),

    // Form settings
    submitButtonText: v.optional(v.string()), // Custom submit button text
    successMessage: v.optional(v.string()), // Custom success message
    errorMessage: v.optional(v.string()), // Custom error message

    // Visual theme
    themeColor: v.optional(v.string()), // Theme color for form modal and buttons (hex color)

    // Publishing status
    isActive: v.boolean(), // Soft delete flag

    // Audit
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_website", ["websiteId"])
    .index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"]),

  // Form submissions
  formSubmissions: defineTable({
    // Form reference - optional for contact section submissions
    formId: v.optional(v.id("forms")),
    // Source identifier for contact forms (e.g., "contact_section_xxx")
    contactFormSource: v.optional(v.string()),
    websiteId: v.id("websites"),

    // Submission data - key-value pairs of field IDs to submitted values
    data: v.array(v.object({
      fieldId: v.string(),
      fieldLabel: v.string(),
      value: v.string(), // Stored as string for simplicity, can be parsed based on field type
    })),

    // Submission metadata
    submittedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),

    // Processing status
    status: v.string(), // "pending", "sent", "failed"
    errorMessage: v.optional(v.string()), // Error message if sending failed

    // Email delivery status
    emailsSent: v.optional(v.array(v.object({
      recipient: v.string(),
      status: v.string(), // "pending", "sent", "failed"
      sentAt: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
    }))),
  })
    .index("by_form", ["formId"])
    .index("by_website", ["websiteId"])
    .index("by_status", ["status"])
    .index("by_submitted_at", ["submittedAt"]),

  // Branches for multi-location companies
  branches: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    isActive: v.boolean(),
    isDefault: v.optional(v.boolean()), // Flag to mark the default/primary branch
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_active", ["isActive"])
    .index("by_company_default", ["companyId", "isDefault"]),

  // Departments for organizational structure
  departments: defineTable({
    companyId: v.id("companies"),
    branchId: v.optional(v.id("branches")), // Optional - department can be company-wide or branch-specific
    title: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_branch", ["branchId"])
    .index("by_active", ["isActive"])
    .index("by_company_active", ["companyId", "isActive"]),

  // userCompanies - many-to-many table linking users to companies with roles
  userCompanies: defineTable({
    userId: v.id("users"),
    companyId: v.id("companies"),
    role: v.string(), // owner, admin, manager, supervisor, member
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    isActive: v.boolean(),
    invitedBy: v.id("users"),
    invitedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Card-based permissions - maps card key to permission level
    cardPermissions: v.optional(v.record(v.string(), v.string())), // e.g., { "invoices": "read-write", "quotes": "read", "products": "none" }
  })
    .index("by_user", ["userId"])
    .index("by_company", ["companyId"])
    .index("by_active", ["isActive"])
    .index("by_user_company", ["userId", "companyId"]),

  // Messages for team messaging
  messages: defineTable({
    companyId: v.id("companies"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.optional(v.string()), // text, image, file
    isDirect: v.boolean(), // true for DM, false for group
    recipientId: v.optional(v.id("users")), // for DMs
    groupId: v.optional(v.id("messageGroups")), // for group conversations
    isRead: v.boolean(),
    readBy: v.optional(v.array(v.id("users"))), // who has read the message
    isDelivered: v.boolean(), // whether message has been delivered to recipient
    deliveredTo: v.optional(v.array(v.id("users"))), // users who have received the message
    replyTo: v.optional(v.id("messages")), // for threaded replies
    editedAt: v.optional(v.number()), // if message was edited
    deletedAt: v.optional(v.number()), // soft delete
    createdAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_sender", ["senderId"])
    .index("by_recipient", ["recipientId"])
    .index("by_group", ["groupId"])
    .index("by_created_at", ["createdAt"]),

  // Message groups for multi-user conversations
  messageGroups: defineTable({
    companyId: v.id("companies"),
    name: v.string(), // Group name
    description: v.optional(v.string()), // Group description
    createdById: v.id("users"), // Creator
    memberIds: v.array(v.id("users")), // All members
    avatarEmoji: v.optional(v.string()), // Optional emoji avatar
    avatarColor: v.optional(v.string()), // Optional color for avatar
    isActive: v.boolean(), // Soft delete flag
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_member", ["memberIds"])
    .index("by_company_active", ["companyId", "isActive"])
    .index("by_created_by", ["createdById"]),

  // Vehicle listings
  vehicles: defineTable({
    // Core fields
    name: v.string(),
    description: v.optional(v.string()),
    reference: v.string(), // Internal reference number (indexed)
    vin: v.optional(v.string()), // Vehicle Identification Number (unique, indexed) - optional to allow vehicles without VIN

    // Classification
    vehicleType: v.optional(v.string()), // sedan, suv, truck, etc.
    brand: v.optional(v.string()), // Vehicle brand (optional)
    make: v.string(), // Brand/Manufacturer
    model: v.string(),
    year: v.number(),
    condition: v.optional(v.string()), // new, used, certified

    // Pricing
    price: v.number(),
    discountedPrice: v.optional(v.number()),
    cost: v.optional(v.number()), // Internal cost

    // Inventory status
    status: v.string(), // draft, available, reserved, sold
    isActive: v.boolean(), // Soft delete/active flag

    // Relationships
    companyId: v.id("companies"),
    branchId: v.optional(v.id("branches")),
    assignedSalespersonIds: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
    leadIds: v.optional(v.array(v.id("leads"))),

    // Media
    images: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    documentUrls: v.optional(v.array(v.string())),

    // Specifications
    specifications: v.optional(v.object({
      engine: v.optional(v.string()),
      transmission: v.optional(v.string()),
      fuelType: v.optional(v.string()),
      drivetrain: v.optional(v.string()),
      mileage: v.optional(v.number()),
      exteriorColor: v.optional(v.string()),
      interiorColor: v.optional(v.string()),
      doors: v.optional(v.number()),
      cylinders: v.optional(v.number()),
      horsepower: v.optional(v.number()),
    })),

    // Extensions
    extraSpecifications: v.optional(v.record(v.string(), v.any())),
    features: v.optional(v.array(v.string())),

    // Analytics
    viewsCount: v.optional(v.number()),
    leadCount: v.optional(v.number()),

    // Metadata
    schemaVersion: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_branch", ["branchId"])
    .index("by_reference", ["reference"])
    .index("by_vin", ["vin"])
    .index("by_salesperson", ["assignedSalespersonIds"])
    .index("by_active", ["isActive"]),

  // Products catalog
  products: defineTable({
    // Core fields
    name: v.string(),
    description: v.optional(v.string()),
    reference: v.string(), // Internal reference number/SKU

    // Classification
    categories: v.optional(v.array(v.string())),

    // Pricing
    price: v.number(),
    discountedPrice: v.optional(v.number()),
    cost: v.optional(v.number()), // Internal cost

    // Inventory
    sku: v.optional(v.string()),
    stockQuantity: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),

    // Inventory status
    status: v.string(), // draft, available, out_of_stock, discontinued
    isActive: v.boolean(), // Soft delete/active flag

    // Relationships
    companyId: v.id("companies"),
    branchId: v.optional(v.id("branches")),
    tags: v.optional(v.array(v.string())),

    // Media
    images: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    documentUrls: v.optional(v.array(v.string())),

    // Specifications/Attributes
    specifications: v.optional(v.object({
      weight: v.optional(v.number()),
      dimensions: v.optional(v.object({
        length: v.optional(v.number()), // in cm
        width: v.optional(v.number()), // in cm
        height: v.optional(v.number()), // in cm
      })),
      color: v.optional(v.string()),
      material: v.optional(v.string()),
      size: v.optional(v.string()),
    })),

    // BobGo shipping - pickup location (required for BobGo shipping)
    pickupLocation: v.optional(v.string()),
    pickupAddress: v.optional(v.string()),
    pickupPostalCode: v.optional(v.string()),
    pickupCity: v.optional(v.string()),
    pickupProvince: v.optional(v.string()),
    pickupCountry: v.optional(v.string()),
    showPickupLocation: v.optional(v.boolean()), // Show on frontend

    // Extensions
    extraSpecifications: v.optional(v.record(v.string(), v.any())),
    features: v.optional(v.array(v.string())),

    // Display settings
    showSpecifications: v.optional(v.boolean()), // Show weight/dimensions on product page

    // Analytics
    viewsCount: v.optional(v.number()),
    purchaseCount: v.optional(v.number()),

    // Metadata
    schemaVersion: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_branch", ["branchId"])
    .index("by_reference", ["reference"])
    .index("by_sku", ["sku"])
    .index("by_active", ["isActive"]),

  // Shipping options
  shippingOptions: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    estimatedDays: v.optional(v.string()), // e.g., "3-5 business days"
    isFree: v.boolean(), // Free shipping flag
    freeShippingThreshold: v.optional(v.number()), // Min order amount for free shipping
    isActive: v.boolean(),
    sortOrder: v.optional(v.number()),
    
    // BobGo shipping integration
    shippingType: v.optional(v.string()), // "manual" | "bobgo"
    bobgoServiceCode: v.optional(v.string()), // BobGo service code (e.g., "ECONOMY", "EXPRESS")
    
    // Pickup location for BobGo (required for bobgo shipping)
    pickupAddress: v.optional(v.string()),
    pickupPostalCode: v.optional(v.string()),
    pickupCity: v.optional(v.string()),
    pickupProvince: v.optional(v.string()),
    pickupCountry: v.optional(v.string()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_active", ["companyId", "isActive"]),

  // Clients (customer accounts)
  clients: defineTable({
    companyId: v.id("companies"),
    userId: v.optional(v.id("users")), // Linked user account for client portal access
    companyName: v.string(),
    contactName: v.string(),
    email: v.string(),
    contactNumber: v.string(),
    address: v.optional(v.string()),
    industry: v.optional(v.string()),
    status: v.string(), // active, inactive, prospect
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_active", ["isActive"]),

  // Client Notes
  clientNotes: defineTable({
    companyId: v.id("companies"),
    clientId: v.id("clients"),
    title: v.string(),
    note: v.string(),
    noteDate: v.string(),
    noteTime: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_company", ["companyId"])
    .index("by_client_date", ["clientId", "noteDate"]),

  // Leads (potential buyers and form submissions)
  leads: defineTable({
    // Company and website
    companyId: v.id("companies"),
    websiteId: v.optional(v.id("websites")),
    formId: v.optional(v.id("forms")),

    // Linked client (optional - links to existing client)
    clientId: v.optional(v.id("clients")),

    // Source tracking
    source: v.string(), // contact_form, inquiry_form, facebook, auto_trader, walk_in, referral, other
    sourceDetails: v.optional(v.string()), // Additional source info (e.g., specific campaign, page URL)

    // Vehicle context
    vehicleId: v.optional(v.id("vehicles")),
    vehicleName: v.optional(v.string()),

    // Contact information (can be populated from linked client)
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Original form submission data (if from form)
    formData: v.optional(v.array(v.object({
      fieldId: v.string(),
      fieldLabel: v.string(),
      value: v.string(),
    }))),

    // Status and assignment
    method: v.optional(v.string()), // phone_call, email, whatsapp, physical_meeting, online_meeting
    status: v.string(), // new_lead, contacted, qualified, engaged, proposal, negotiation, closed_won, closed_lost
    description: v.optional(v.string()),
    relatedToId: v.optional(v.string()),
    relatedToName: v.optional(v.string()),
    assignedTo: v.optional(v.array(v.id("users"))), // Multiple team members can be assigned
    notes: v.optional(v.string()),
    startDate: v.optional(v.string()),
    startTime: v.optional(v.string()),
    value: v.optional(v.number()),

    // Email tracking
    emailSent: v.optional(v.boolean()),
    emailSentAt: v.optional(v.number()),

    // Metadata
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string()),
    sourcePage: v.optional(v.string()), // URL of page where form was submitted

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_client", ["clientId"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_assigned", ["assignedTo"])
    .index("by_status", ["status"])
    .index("by_source", ["source"])
    .index("by_website", ["websiteId"])
    .index("by_form", ["formId"])
    .index("by_created_at", ["createdAt"]),

  // Inquiries (form submissions from website forms)
  inquiries: defineTable({
    // Company ownership
    companyId: v.id("companies"),
    websiteId: v.id("websites"),
    formId: v.id("forms"),

    // Form details
    formName: v.string(), // Store form name for display even if form is deleted

    // Submission data
    data: v.array(v.object({
      fieldId: v.string(),
      fieldLabel: v.string(),
      value: v.string(),
    })),

    // Extracted contact information for easy filtering
    submitterName: v.optional(v.string()),
    submitterEmail: v.optional(v.string()),
    submitterPhone: v.optional(v.string()),

    // Context
    sourcePage: v.optional(v.string()), // URL of page where form was submitted
    vehicleId: v.optional(v.id("vehicles")), // If submitted from a vehicle listing page
    vehicleName: v.optional(v.string()), // Store vehicle name for display

    // Status and assignment
    status: v.string(), // new, contacted, qualified, converted, lost, archived
    assignedTo: v.optional(v.id("users")),
    notes: v.optional(v.string()),

    // Email tracking
    emailSent: v.boolean(),
    emailSentAt: v.optional(v.number()),
    emailsSentLog: v.optional(v.array(v.object({
      recipient: v.string(),
      sentAt: v.number(),
      status: v.string(), // sent, failed
      errorMessage: v.optional(v.string()),
    }))),

    // Metadata
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string()),

    // Timestamps
    submittedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_website", ["websiteId"])
    .index("by_form", ["formId"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_assigned", ["assignedTo"])
    .index("by_submitted_at", ["submittedAt"])
    .index("by_status", ["status"]),

  // Admin settings for payment gateway configuration
  adminSettings: defineTable({
    userId: v.id("users"),

    // Payment Gateway Configuration
    payfast: v.optional(v.object({
      enabled: v.boolean(),
      testMode: v.boolean(),
      merchantId: v.optional(v.string()),
      merchantKey: v.optional(v.string()),
      passphrase: v.optional(v.string()),
    })),

    paypal: v.optional(v.object({
      enabled: v.boolean(),
      testMode: v.boolean(),
      testClientId: v.optional(v.string()),
      testClientSecret: v.optional(v.string()),
      liveClientId: v.optional(v.string()),
      liveClientSecret: v.optional(v.string()),
    })),

    // App Pricing Configuration
    appPricing: v.optional(v.object({
      businessTools: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
      websites: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
      vehicleDealership: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
      onlineStore: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
      bookingsApp: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
      realEstate: v.optional(v.object({
        monthlyPrice: v.number(),
        currency: v.string(),
        enabled: v.boolean(),
      })),
    })),

    // Admin Details
    adminEmail: v.optional(v.string()),
    adminName: v.optional(v.string()),
    adminPhone: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Services catalog - generic for any industry
  services: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    price: v.number(),
    duration: v.optional(v.number()), // Duration in minutes
    isActive: v.boolean(),
    sortOrder: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_active", ["companyId", "isActive"])
    .index("by_category", ["category"]),

  // Consultant Services - services assigned to consultants
  consultantServices: defineTable({
    consultantId: v.id("consultants"),
    serviceId: v.id("services"),
    companyId: v.id("companies"),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_consultant", ["consultantId"])
    .index("by_service", ["serviceId"])
    .index("by_company", ["companyId"])
    .index("by_consultant_active", ["consultantId", "isActive"]),

  // App subscriptions for users
  appSubscriptions: defineTable({
    userId: v.id("users"),
    companyId: v.id("companies"),
    appKey: v.string(), // "businessTools", "websites", "vehicleDealership"

    // Payment info
    paymentProvider: v.string(), // "payfast" or "paypal"
    paymentStatus: v.string(), // "pending", "completed", "failed", "cancelled"
    paymentId: v.optional(v.string()), // Transaction/subscription ID from provider

    // Pricing at time of purchase
    amount: v.number(),
    currency: v.string(),
    billingCycle: v.string(), // "monthly", "yearly"

    // Subscription status
    status: v.string(), // "active", "expired", "cancelled"
    startDate: v.number(),
    endDate: v.optional(v.number()),

    // PayPal specific
    paypalSubscriptionId: v.optional(v.string()),
    paypalPlanId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_company", ["companyId"])
    .index("by_user_company", ["userId", "companyId"])
    .index("by_app_key", ["appKey"])
    .index("by_payment_id", ["paymentId"]),

  // User availability for scheduling
  userAvailability: defineTable({
    userId: v.id("users"),
    companyId: v.id("companies"),

    // Weekly availability - array of time slots for each day
    weeklyAvailability: v.object({
      monday: v.optional(v.array(v.object({
        startTime: v.string(), // "09:00"
        endTime: v.string(), // "17:00"
        enabled: v.boolean(),
      }))),
      tuesday: v.optional(v.array(v.object({
        startTime: v.string(),
        endTime: v.string(),
        enabled: v.boolean(),
      }))),
      wednesday: v.optional(v.array(v.object({
        startTime: v.string(),
        endTime: v.string(),
        enabled: v.boolean(),
      }))),
      thursday: v.optional(v.array(v.object({
        startTime: v.string(),
        endTime: v.string(),
        enabled: v.boolean(),
      }))),
      friday: v.optional(v.array(v.object({
        startTime: v.string(),
        endTime: v.string(),
        enabled: v.boolean(),
      }))),
      saturday: v.optional(v.array(v.object({
        startTime: v.string(),
        endTime: v.string(),
        enabled: v.boolean(),
      }))),
      sunday: v.optional(v.array(v.object({
        startTime: v.string(),
        endTime: v.string(),
        enabled: v.boolean(),
      }))),
    }),

    // Exclusion dates - specific dates/times when unavailable
    exclusions: v.optional(v.array(v.object({
      date: v.string(), // "2025-03-15"
      isFullDay: v.boolean(),
      startTime: v.optional(v.string()), // Only if not full day
      endTime: v.optional(v.string()), // Only if not full day
      reason: v.optional(v.string()), // "Vacation", "Sick", "Meeting", etc.
    }))),

    // Timezone for the user
    timezone: v.optional(v.string()), // "Africa/Johannesburg", "UTC", etc.

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_company", ["companyId"])
    .index("by_user_company", ["userId", "companyId"]),

  // Quotes
  quotes: defineTable({
    // Company ownership
    companyId: v.id("companies"),
    
    // Client linking
    clientId: v.optional(v.id("clients")),
    
    // Quote details
    quoteNumber: v.string(),
    clientName: v.string(),
    clientEmail: v.optional(v.string()),
    clientCompany: v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    clientAddress: v.optional(v.string()),
    status: v.string(), // draft, sent, accepted, rejected, expired
    
    // Template
    template: v.optional(v.string()), // "default" or "modern"
    
    // Line items with product/service references
    items: v.array(v.object({
      itemType: v.optional(v.string()), // "product", "service", "custom"
      itemId: v.optional(v.string()),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(), // Original price from product/service
      customPrice: v.optional(v.number()), // Custom price set for this quote
      total: v.number(),
    })),
    
    // Totals
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    
    // Dates
    validUntil: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    
    // Notes
    notes: v.optional(v.string()),
    
    // Public link for client viewing
    publicToken: v.optional(v.string()),
    publicEnabled: v.optional(v.boolean()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["status"])
    .index("by_quote_number", ["quoteNumber"])
    .index("by_client_name", ["clientName"])
    .index("by_created_at", ["createdAt"]),

  // Invoices
  invoices: defineTable({
    // Company ownership
    companyId: v.string(),
    
    // Client linking
    clientId: v.optional(v.id("clients")),
    
    // Link to order if created from order
    orderId: v.optional(v.id("orders")),
    
    // Link to quote if converted
    quoteId: v.optional(v.id("quotes")),
    
    // Invoice details
    invoiceNumber: v.string(),
    clientName: v.string(),
    clientEmail: v.optional(v.string()),
    clientCompany: v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    clientAddress: v.optional(v.string()),
    status: v.string(), // draft, sent, paid, overdue, cancelled
    
    // Template
    template: v.optional(v.string()), // "default" or "modern"
    
    // Line items - enhanced to include product/service references
    items: v.array(v.object({
      itemType: v.optional(v.string()), // "product", "service", "custom"
      itemId: v.optional(v.string()),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    })),
    
    // Totals
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    amountPaid: v.number(),
    
    // Dates
    issueDate: v.string(),
    dueDate: v.string(),
    paidAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    
    // Notes
    notes: v.optional(v.string()),
    
    // Custom payment link (overrides generated public link for "Pay Now" button in email)
    paymentLink: v.optional(v.string()),
    
    // Whether to include company banking details on the invoice
    showBankingDetails: v.optional(v.boolean()),
    
    // Public link for client viewing
    publicToken: v.optional(v.string()),
    publicEnabled: v.optional(v.boolean()),
    
    // Recurring invoice settings
    isRecurring: v.optional(v.boolean()),
    recurringInterval: v.optional(v.string()), // "days" or "monthly"
    recurringDays: v.optional(v.number()), // e.g., every 30 days
    recurringDayOfMonth: v.optional(v.number()), // e.g., day 15 of each month
    recurringDueDays: v.optional(v.number()), // days after issue for payment due
    recurringDueDayOfMonth: v.optional(v.number()), // specific day of month for due
    recurringDueDateDayOfNextMonth: v.optional(v.number()), // specific day in following month for due (1-31)
    parentInvoiceId: v.optional(v.id("invoices")), // for recurring child invoices
    nextRecurringDate: v.optional(v.string()), // next date to create invoice
    lastRecurringProcessedAt: v.optional(v.number()), // timestamp of last recurring invoice creation
    
    // Scheduled sending
    scheduledSendAt: v.optional(v.number()), // timestamp to send
    scheduledSendTo: v.optional(v.string()), // email to send to
    scheduledSendTime: v.optional(v.string()), // "08:00" or "13:00" or "18:00"
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["status"])
    .index("by_invoice_number", ["invoiceNumber"])
    .index("by_client_name", ["clientName"])
    .index("by_quote", ["quoteId"])
    .index("by_order", ["orderId"])
    .index("by_created_at", ["createdAt"]),

  // Suppliers
  suppliers: defineTable({
    companyId: v.id("companies"),
    
    // Supplier details
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    
    // Address
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    province: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()),
    
    // Additional info
    taxNumber: v.optional(v.string()), // VAT/Tax registration number
    notes: v.optional(v.string()),
    category: v.optional(v.string()), // e.g., parts, services, materials
    
    // Status
    isActive: v.optional(v.boolean()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_name", ["name"])
    .index("by_category", ["category"]),

  // Payments
  payments: defineTable({
    // Company ownership - using string for flexibility
    companyId: v.string(),
    
    // Transaction type: "income" or "expense"
    type: v.optional(v.string()),
    
    // Link to order (optional - some payments may be for invoices only)
    orderId: v.optional(v.id("orders")),
    
    // Link to invoice
    invoiceId: v.optional(v.id("invoices")),
    
    // Link to client (for non-invoice income)
    clientId: v.optional(v.id("clients")),
    clientName: v.optional(v.string()),
    
    // Payment details
    paymentNumber: v.string(),
    amount: v.number(),
    paymentMethod: v.string(), // cash, card, eft, bank_transfer, other
    status: v.string(), // pending, completed, failed, refunded
    
    // Source description (e.g. "Other income" or "Other expense" when no invoice/supplier)
    source: v.optional(v.string()),
    
    // Expense category (for expenses): operating, materials, salary, utilities, marketing, other
    expenseType: v.optional(v.string()),
    
    // Date the transaction took place
    transactionDate: v.optional(v.string()),
    
    // Payment info
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    
    // Optional supplier link
    supplierId: v.optional(v.id("suppliers")),
    supplierName: v.optional(v.string()),
    
    // Items for payment (outgoing payments)
    items: v.optional(v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
    }))),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_invoice", ["invoiceId"])
    .index("by_order", ["orderId"])
    .index("by_status", ["status"])
    .index("by_payment_number", ["paymentNumber"])
    .index("by_created_at", ["createdAt"]),

  // AI Section Files - stores HTML content for AI-generated sections
  aiSectionFiles: defineTable({
    sectionFileId: v.string(), // Unique identifier (e.g., ai-1710123456789-abc12345)
    htmlCode: v.string(), // The HTML/Tailwind code
    sectionName: v.string(), // Display name
    prompt: v.optional(v.string()), // Original prompt used to generate
    
    // Ownership
    websiteId: v.optional(v.id("websites")),
    companyId: v.optional(v.id("companies")),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_section_file_id", ["sectionFileId"])
    .index("by_website", ["websiteId"])
    .index("by_company", ["companyId"]),

  // Orders - customer orders
  orders: defineTable({
    // Company and customer - using string to support external IDs
    companyId: v.string(), // Support both Convex IDs and external IDs
    websiteId: v.optional(v.string()),
    customerId: v.optional(v.string()), // Logged-in customer (optional for guest checkout)
    
    // Order details
    orderNumber: v.string(), // Unique order number (e.g., ORD-20240330-12345)
    
    // Customer info (for guest checkout or stored)
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
    
    // Order status
    status: v.string(), // pending, processing, shipped, delivered, cancelled, refunded
    
    // Financial
    subtotal: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    
    // Payment
    paymentMethod: v.optional(v.string()), // card, eft, payfast, paypal, cash
    paymentStatus: v.string(), // pending, paid, failed, refunded
    paymentId: v.optional(v.string()), // Payment gateway transaction ID
    
    // BobGo shipping info
    bobgoOrderId: v.optional(v.number()),
    bobgoShipmentId: v.optional(v.number()),
    bobgoRateId: v.optional(v.number()),
    waybillUrl: v.optional(v.string()),
    shippingCost: v.optional(v.number()),
    
    // Notes
    notes: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_website", ["websiteId"])
    .index("by_customer", ["customerId"])
    .index("by_order_number", ["orderNumber"])
    .index("by_status", ["status"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_created_at", ["createdAt"]),

  // Order items - line items for each order
  orderItems: defineTable({
    // Order reference
    orderId: v.id("orders"),
    
    // Product reference - using string to support external IDs
    productId: v.string(),
    productName: v.string(), // Store name at time of purchase
    productImage: v.optional(v.string()), // Store image URL at time of purchase
    productPrice: v.number(), // Price at time of purchase
    
    // Item details
    quantity: v.number(),
    total: v.number(), // quantity * productPrice
    
    // Metadata
    createdAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_product", ["productId"]),

  // User favorites - products saved by logged in users
  favorites: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    companyId: v.id("companies"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_product", ["userId", "productId"])
    .index("by_product", ["productId"]),

  // Application-level integration settings (global, not per company)
  integrations: defineTable({
    // Integration name (e.g., "bobgo", "stripe", "paypal")
    name: v.string(),
    
    // Configuration for each integration
    config: v.record(v.string(), v.any()),
    
    // Mode: "sandbox" | "live"
    mode: v.optional(v.string()),
    
    // Whether the integration is enabled
    enabled: v.boolean(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"]),

  // Consultants - team members assigned as consultants for a specific company
  consultants: defineTable({
    // Company ownership
    companyId: v.id("companies"),
    
    // Reference to the team member (userCompanies record)
    userCompanyId: v.id("userCompanies"),
    
    // Reference to the user
    userId: v.id("users"),
    
    // Consultant details
    role: v.optional(v.string()),
    description: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    isActive: v.boolean(),
    isDefault: v.optional(v.boolean()), // Default consultant for bookings
    
    // Weekly availability - days of the week with time slots
    availability: v.optional(v.object({
      monday: v.optional(v.object({
        enabled: v.boolean(),
        slots: v.optional(v.array(v.object({
          startTime: v.string(),
          endTime: v.string(),
        }))),
      })),
      tuesday: v.optional(v.object({
        enabled: v.boolean(),
        slots: v.optional(v.array(v.object({
          startTime: v.string(),
          endTime: v.string(),
        }))),
      })),
      wednesday: v.optional(v.object({
        enabled: v.boolean(),
        slots: v.optional(v.array(v.object({
          startTime: v.string(),
          endTime: v.string(),
        }))),
      })),
      thursday: v.optional(v.object({
        enabled: v.boolean(),
        slots: v.optional(v.array(v.object({
          startTime: v.string(),
          endTime: v.string(),
        }))),
      })),
      friday: v.optional(v.object({
        enabled: v.boolean(),
        slots: v.optional(v.array(v.object({
          startTime: v.string(),
          endTime: v.string(),
        }))),
      })),
      saturday: v.optional(v.object({
        enabled: v.boolean(),
        slots: v.optional(v.array(v.object({
          startTime: v.string(),
          endTime: v.string(),
        }))),
      })),
      sunday: v.optional(v.object({
        enabled: v.boolean(),
        slots: v.optional(v.array(v.object({
          startTime: v.string(),
          endTime: v.string(),
        }))),
      })),
    })),
    
    // Exclusion dates - specific dates when consultant is unavailable
    exclusions: v.optional(v.array(v.object({
      date: v.string(), // "2025-03-15"
      startTime: v.optional(v.string()),
      endTime: v.optional(v.string()),
      reason: v.optional(v.string()),
    }))),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
.index("by_company", ["companyId"])
  .index("by_user_company", ["userCompanyId"])
  .index("by_user", ["userId"])
  .index("by_company_active", ["companyId", "isActive"])
  .index("by_company_default", ["companyId", "isDefault"]),

  // Bookings - customer appointment bookings
  bookings: defineTable({
    // Company ownership
    companyId: v.id("companies"),
    
    // Customer info
    userId: v.optional(v.id("users")),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    
    // Service details
    serviceId: v.optional(v.id("services")),
    consultantServiceId: v.optional(v.id("consultantServices")),
    serviceName: v.string(),
    servicePrice: v.number(),
    serviceDuration: v.optional(v.number()),
    
    // Consultant (if assigned)
    consultantId: v.optional(v.id("consultants")),
    consultantName: v.optional(v.string()),
    
    // Booking date & time
    bookingDate: v.string(), // "2025-03-15"
    bookingTime: v.string(), // "14:00"
    
    // Booking status
    status: v.string(), // "pending", "confirmed", "completed", "cancelled", "no_show"
    paymentStatus: v.string(), // "pending", "paid", "failed", "refunded"
    paymentMethod: v.optional(v.string()), // "payfast", "paypal", "cash"
    paymentId: v.optional(v.string()),
    
    // Notes
    notes: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_company", ["companyId"])
  .index("by_user", ["userId"])
  .index("by_date", ["bookingDate"])
  .index("by_status", ["status"])
  .index("by_company_date", ["companyId", "bookingDate"]),

  // Accommodation bookings - separate from appointment bookings
  accommodationBookings: defineTable({
    bookingCode: v.string(),
    listingId: v.id("listings"),
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    checkInDate: v.string(),
    checkOutDate: v.string(),
    numberOfGuests: v.number(),
    numberOfNights: v.number(),
    pricePerNight: v.number(),
    totalAmount: v.number(),
    cleaningFee: v.optional(v.number()),
    securityDeposit: v.optional(v.number()),
    specialRequests: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled"), v.literal("completed")),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed"), v.literal("refunded")),
    paymentMethod: v.optional(v.string()),
    payfastPaymentId: v.optional(v.string()),
    confirmedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_booking_code", ["bookingCode"])
  .index("by_user", ["userId"])
  .index("by_listing", ["listingId"])
  .index("by_status", ["status"]),

  // Booking system payment settings - separate from company payment settings
  bookingPaymentSettings: defineTable({
    companyId: v.id("companies"),
    // PayFast settings
    payfast: v.optional(v.object({
      enabled: v.boolean(),
      testMode: v.boolean(),
      merchantId: v.string(),
      merchantKey: v.string(),
      passphrase: v.optional(v.string()),
    })),
    // PayPal settings
    paypal: v.optional(v.object({
      enabled: v.boolean(),
      testMode: v.boolean(),
      testClientId: v.string(),
      testClientSecret: v.string(),
      liveClientId: v.string(),
      liveClientSecret: v.string(),
    })),
    // General booking payment settings
    allowCashPayment: v.optional(v.boolean()),
    requirePrepayment: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"]),

  // Rate limiting for login attempts
  loginRateLimit: defineTable({
    ipAddress: v.string(),
    email: v.string(),
    attempts: v.number(),
    lockedUntil: v.optional(v.number()),
    lastAttemptAt: v.number(),
    domain: v.string(),
  })
    .index("by_ip_email", ["ipAddress", "email"])
    .index("by_ip", ["ipAddress"])
    .index("by_email", ["email"]),

  // Rate limiting for password reset requests
  passwordResetRateLimit: defineTable({
    ipAddress: v.string(),
    email: v.string(),
    requests: v.number(),
    lastRequestAt: v.number(),
    cooldownUntil: v.optional(v.number()),
    domain: v.string(),
  })
    .index("by_ip_email", ["ipAddress", "email"])
    .index("by_ip", ["ipAddress"])
    .index("by_email", ["email"]),

  // Security events logging
  securityEvents: defineTable({
    eventType: v.string(), // "login_failed", "password_reset_requested", "account_locked", "rate_limit_exceeded", "verification_resent"
    email: v.optional(v.string()),
    ipAddress: v.string(),
    domain: v.optional(v.string()),
    details: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_ip", ["ipAddress"])
    .index("by_type", ["eventType"])
    .index("by_timestamp", ["timestamp"]),

  // Rate limiting for email verification resend
  verificationRateLimit: defineTable({
    ipAddress: v.string(),
    email: v.string(),
    requests: v.number(),
    lastRequestAt: v.number(),
    cooldownUntil: v.optional(v.number()),
    domain: v.string(),
  })
    .index("by_ip_email", ["ipAddress", "email"])
    .index("by_ip", ["ipAddress"])
    .index("by_email", ["email"]),

  // ========================================================================
  // FIND ACCOMMODATION TABLES
  // ========================================================================

  // Accommodation listings
  listings: defineTable({
    title: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    propertyType: v.string(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    maxGuests: v.number(),
    location: v.object({
      country: v.string(),
      province: v.string(),
      city: v.string(),
      suburb: v.optional(v.string()),
      address: v.string(),
      buildingName: v.optional(v.string()),
      locationId: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      streetAddress: v.optional(v.string()),
      unitNumber: v.optional(v.string()),
    }),
    pricePerNight: v.number(),
    currency: v.string(),
    cleaningFee: v.union(v.number(), v.null()),
    securityDeposit: v.union(v.number(), v.null()),
    amenities: v.array(v.string()),
    images: v.array(v.string()),
    featuredImage: v.union(v.string(), v.null()),
    availableFrom: v.string(),
    availableTo: v.string(),
    minimumStay: v.number(),
    maximumStay: v.union(v.number(), v.null()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    houseRules: v.optional(v.string()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    cancellationPolicy: v.optional(v.string()),
    agents: v.optional(v.array(v.object({
      id: v.id("users"),
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      contactNumber: v.optional(v.string()),
    }))),
    notificationsEnabled: v.optional(v.boolean()),
    paymentDetails: v.optional(v.object({
      enabled: v.optional(v.boolean()),
      bankingDetails: v.optional(v.object({
        bankName: v.optional(v.string()),
        accountHolder: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
        branchCode: v.optional(v.string()),
        accountType: v.optional(v.string()),
        swiftCode: v.optional(v.string()),
      })),
      paymentMethods: v.optional(v.array(v.string())),
      depositRequirements: v.optional(v.object({
        bookingDeposit: v.optional(v.union(v.number(), v.null())),
        damageDepositAmount: v.optional(v.union(v.number(), v.null())),
        keyDepositAmount: v.optional(v.union(v.number(), v.null())),
      })),
      paymentTerms: v.optional(v.object({
        fullPaymentDue: v.optional(v.string()),
        depositDue: v.optional(v.string()),
        refundPolicy: v.optional(v.string()),
        lateCancellationFee: v.optional(v.union(v.number(), v.null())),
        noShowFee: v.optional(v.union(v.number(), v.null())),
        paymentSecuredOnly: v.optional(v.boolean()),
      })),
      additionalFees: v.optional(v.array(v.object({
        name: v.string(),
        amount: v.number(),
        type: v.union(v.literal("percentage"), v.literal("fixed")),
        mandatory: v.boolean(),
        description: v.optional(v.string()),
      }))),
      paymentInstructions: v.optional(v.string()),
    })),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("pending"),
      v.literal("suspended")
    ),
    isVerified: v.boolean(),
    isFeatured: v.boolean(),
    views: v.union(v.number(), v.null()),
    inquiries: v.union(v.number(), v.null()),
    contactViews: v.optional(v.union(v.number(), v.null())),
    ownerId: v.id("users"),
    companyId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_property_type", ["propertyType"])
    .index("by_location_city", ["location.city"])
    .index("by_location_province", ["location.province"])
    .index("by_company", ["companyId"]),

  // Listing availability for managing booking dates
  listingAvailability: defineTable({
    listingId: v.id("listings"),
    date: v.string(),
    status: v.union(
      v.literal("available"),
      v.literal("booked"),
      v.literal("blocked")
    ),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_listing", ["listingId"])
    .index("by_listing_and_date", ["listingId", "date"])
    .index("by_date", ["date"]),

  // Accommodation booking inquiries (different from form-based inquiries)
  accommodationInquiries: defineTable({
    listingId: v.id("listings"),
    listingTitle: v.string(),
    bookingNumber: v.string(),
    guestId: v.optional(v.id("users")),
    hostId: v.id("users"),
    guestName: v.string(),
    guestEmail: v.string(),
    guestPhone: v.optional(v.string()),
    checkInDate: v.string(),
    checkOutDate: v.string(),
    numberOfGuests: v.number(),
    numberOfAdults: v.optional(v.number()),
    numberOfChildren: v.optional(v.number()),
    totalNights: v.number(),
    pricePerNight: v.number(),
    totalAmount: v.number(),
    currency: v.string(),
    cleaningFee: v.optional(v.number()),
    securityDeposit: v.optional(v.number()),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("confirmed"),
      v.literal("in-progress"),
      v.literal("checked-in"),
      v.literal("checked-out"),
      v.literal("payment-pending"),
      v.literal("payment-received")
    ),
    companyId: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    responseMessage: v.optional(v.string()),
    respondedAt: v.optional(v.string()),
  })
    .index("by_listing", ["listingId"])
    .index("by_guest", ["guestId"])
    .index("by_host", ["hostId"])
    .index("by_status", ["status"])
    .index("by_bookingNumber", ["bookingNumber"])
    .index("by_company", ["companyId"]),

  // Notes on accommodation inquiries
  inquiryNotes: defineTable({
    inquiryId: v.id("accommodationInquiries"),
    userId: v.id("users"),
    note: v.string(),
    createdAt: v.string(),
  })
    .index("by_inquiry", ["inquiryId"])
    .index("by_user", ["userId"])
    .index("by_inquiry_and_created", ["inquiryId", "createdAt"]),

  // Email tracking for accommodation inquiries
  inquiryEmails: defineTable({
    inquiryId: v.id("accommodationInquiries"),
    companyId: v.optional(v.string()),
    senderName: v.string(),
    senderEmail: v.string(),
    recipientEmail: v.string(),
    message: v.string(),
    sentBy: v.id("users"),
    sentAt: v.string(),
    emailSubject: v.string(),
    status: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("bounced")
    ),
    resendId: v.optional(v.string()),
    pdfAttached: v.boolean(),
    metadata: v.optional(v.object({
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
    })),
  })
    .index("by_inquiry", ["inquiryId"])
    .index("by_company", ["companyId"])
    .index("by_sent_by", ["sentBy"])
    .index("by_sent_at", ["sentAt"])
    .index("by_recipient", ["recipientEmail"]),

  // User search alerts for accommodation
  alerts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    location: v.string(),
    priceMin: v.optional(v.number()),
    priceMax: v.optional(v.number()),
    listingTypes: v.optional(v.array(v.string())),
    maxGuests: v.optional(v.number()),
    facilities: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    frequency: v.string(),
    lastSent: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_active", ["isActive"]),

  // Analytics tracking for accommodation
  analytics: defineTable({
    eventType: v.union(
      v.literal("page_view"),
      v.literal("contact_view"),
      v.literal("contact_form_submission"),
      v.literal("listing_contact_form"),
      v.literal("home_page_view"),
      v.literal("contact_page_view"),
      v.literal("listing_page_view")
    ),
    entityId: v.optional(v.union(v.id("listings"), v.id("users"), v.string())),
    entityType: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    metadata: v.optional(v.object({
      listingId: v.optional(v.id("listings")),
      listingTitle: v.optional(v.string()),
      hostId: v.optional(v.id("users")),
      page: v.optional(v.string()),
      referrer: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      location: v.optional(v.string()),
      formData: v.optional(v.any()),
      contactEmail: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
    })),
    timestamp: v.string(),
    createdAt: v.string(),
  })
    .index("by_event_type", ["eventType"])
    .index("by_entity", ["entityId"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_created_at", ["createdAt"]),

  // Saved accommodation listings
  savedItems: defineTable({
    userId: v.id("users"),
    listingId: v.id("listings"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_listing", ["listingId"])
    .index("by_user_and_listing", ["userId", "listingId"]),

  // Newsletter subscriptions
  newsletterSubscriptions: defineTable({
    email: v.string(),
    subscribedAt: v.string(),
    isActive: v.boolean(),
    source: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_active", ["isActive"])
    .index("by_subscribed_at", ["subscribedAt"]),

  // South African location autocomplete
  location: defineTable({
    country: v.string(),
    province: v.string(),
    district: v.string(),
    city: v.string(),
    suburb: v.string(),
    searchText: v.string(),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_search_text", ["searchText"])
    .index("by_suburb", ["suburb"])
    .index("by_city", ["city"])
    .index("by_district", ["district"])
    .index("by_province", ["province"])
    .index("by_country", ["country"])
    .index("by_active", ["isActive"])
    .searchIndex("search_locations", {
      searchField: "searchText",
      filterFields: ["isActive", "province", "country", "city", "district"],
    }),

  siteSettings: defineTable({
    key: v.string(),
    settings: v.any(),
    updatedAt: v.string(),
    updatedBy: v.optional(v.id("users")),
  })
    .index("by_key", ["key"]),
});
