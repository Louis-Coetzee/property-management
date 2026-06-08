# Multi-Tenant Website Application Documentation

## Overview

This is a Next.js multi-tenant CRM and website builder application that allows companies to create and manage websites with custom domains. Each website operates as a separate tenant with its own pages, content, and branding.

---

## Technology Stack Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  React 19.2.4                              │  Next.js 16.1.6             │
│  ├─ Components (UI)                       │  ├─ App Router              │
│  ├─ Hooks (useQuery, useMutation)          │  ├─ Dynamic Routes         │
│  └─ State (useState, useContext)          │  └─ Server Components      │
│                                            │                             │
│  Styling:                                  │  Forms:                     │
│  ├─ Tailwind CSS 4.1.18                   │  ├─ React Hook Form 7.71.1  │
│  ├─ Tailwind Merge 3.4.0                  │  └─ Zod 4.3.6               │
│  └─ clsx 2.1.1                             │                             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    VERCEL (Hosting)     │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  NEXT.JS     │      │   CONVEX      │      │   EXTERNAL    │
│  Server      │      │  (Backend)    │      │   Services    │
├───────────────┤      ├───────────────┤      ├───────────────┤
│ Route        │      │ Database      │      │ Resend        │
│ Handlers     │──────│ (SQL-like)    │      │ (Email)       │
│              │      │               │      │               │
│ Sitemap      │      │ Tables:       │      │ AWS S3        │
│ Robots.txt   │      │ - users       │      │ (File Store)  │
│              │      │ - companies   │      │               │
│ API Routes   │      │ - websites    │      │ ImageKit/    │
│ (optional)   │      │ - pages       │      │ ImageDeliv.  │
│              │      │ - apps        │      │ (Images)     │
└───────────────┘      │ - forms      │      └───────────────┘
                       │ - domainMaps │
                       │ - ...        │
                       └──────────────┘
```

---

## File Structure Diagram

```
/home/louis/Desktop/Refreshtech/apps/CRM/
│
├── app/                               # Next.js App Router
│   ├── [domain]/                      # Multi-tenant catch-all
│   │   ├── page.tsx                   # Homepage
│   │   ├── [slug]/page.tsx            # Dynamic page route
│   │   ├── sitemap.xml/route.ts       # Sitemap handler
│   │   ├── robots.txt/route.ts        # Robots.txt handler
│   │   ├── layout.tsx                 # Domain layout
│   │   ├── DomainLayoutWrapper.tsx    # Layout wrapper
│   │   │
│   │   ├── companies/                 # Company management
│   │   │   └── [companyId]/
│   │   │       ├── manage/            # Company settings
│   │   │       ├── apps/               # App management
│   │   │       ├── websites/           # Website list
│   │   │       │   └── [websiteId]/
│   │   │       │       ├── pages/       # Page editor
│   │   │       │       │   └── [pageId]/
│   │   │       │       │       ├── design/
│   │   │       │       │       ├── canvas/
│   │   │       │       │       └── templates/
│   │   │       │       ├── settings/   # Website settings
│   │   │       │       └── forms/       # Form builder
│   │   │       ├── crm/                # CRM module
│   │   │       │   ├── clients/
│   │   │       │   ├── leads/
│   │   │       │   ├── pipeline/
│   │   │       │   ├── quotes/
│   │   │       │   ├── invoices/
│   │   │       │   ├── team/
│   │   │       │   └── ...
│   │   │       ├── store/              # E-commerce
│   │   │       ├── bookings/           # Appointments
│   │   │       └── inquiries/         # Inquiries
│   │   │
│   │   ├── dashboard/                 # Main dashboard
│   │   ├── admin/                     # Admin panel
│   │   ├── auth/                      # Authentication
│   │   ├── file-manager/              # File management
│   │   ├── products/                  # Product management
│   │   ├── checkout/                  # E-commerce checkout
│   │   ├── listings/                   # Vehicle listings
│   │   └── ...
│   │
│   ├── api/                           # API Routes (if needed)
│   └── layout.tsx                     # Root layout
│
├── components/                        # React components
│   ├── page-builder/
│   │   ├── renderer/                   # Public-facing rendering
│   │   │   ├── sections/               # Section components
│   │   │   │   ├── NavbarBasic.tsx
│   │   │   │   ├── NavbarModern.tsx
│   │   │   │   ├── HeroBasic.tsx
│   │   │   │   ├── HeroModern.tsx
│   │   │   │   ├── FeaturesBasic.tsx
│   │   │   │   ├── ContactBasic.tsx
│   │   │   │   ├── FooterBasic.tsx
│   │   │   │   └── ... (30+ sections)
│   │   │   ├── PageRenderer.tsx        # Main page renderer
│   │   │   └── SectionRenderer.tsx     # Section wrapper
│   │   │
│   │   └── builder/                    # Editor components
│   │       ├── EditSectionPanel.tsx
│   │       ├── SectionEditor.tsx
│   │       ├── PageDesignCanvas.tsx
│   │       └── sections/               # Editor panels for each section
│   │
│   ├── ui/                            # Reusable UI components
│   ├── navigation/                    # Navigation components
│   └── ...
│
├── convex/                           # Backend functions
│   ├── _generated/                    # Auto-generated TypeScript
│   ├── schema.ts                      # Database schema
│   ├── auth.ts                        # Authentication
│   ├── users.ts                       # User CRUD
│   ├── companies.ts                   # Company operations
│   ├── websites.ts                    # Website queries/mutations
│   ├── pages.ts                       # Page queries/mutations
│   ├── apps.ts                        # App management
│   ├── forms.ts                       # Form builder
│   ├── products.ts                    # Products (e-commerce)
│   ├── listings.ts                    # Vehicle listings
│   └── ...
│
├── lib/                              # Utility functions
│   ├── email/                         # Email utilities
│   ├── auth/                          # Auth helpers
│   ├── page-builder/                  # Page builder hooks
│   │   └── usePageContent.ts
│   └── ...
│
├── public/                           # Static assets
│   └── ...
│
├── notes/                            # Documentation
│   └── application-documentation.md
│
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependencies
```

---

## Architecture

### Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 |
| Database | Convex (serverless backend) |
| Authentication | Custom with bcrypt + JWT |
| Styling | Tailwind CSS 4.x |
| UI Components | Radix UI, Lucide React |
| Form Handling | React Hook Form + Zod |
| Animation | Framer Motion |

---

## Multi-Tenant Routing Structure

### Core Domain Routing

The application uses a **catch-all route** pattern with `[domain]` as the root parameter:

```
app/
├── [domain]/
│   ├── page.tsx              # Homepage for domain
│   ├── [slug]/page.tsx       # Dynamic page routing
│   ├── sitemap.xml/route.ts  # Per-domain sitemap
│   ├── robots.txt/route.ts   # Per-domain robots.txt
│   └── layout.tsx            # Domain-specific layout
```

### How Domain Routing Works

1. **Request Flow**: When a user visits `example.com`, Next.js matches `[domain]` to extract the domain
2. **Website Lookup**: The layout and pages query Convex to find the website by domain
3. **Content Rendering**: Page content is rendered based on the website's configuration

### Domain Resolution Priority

The system uses **dual-domain tracking** for redundancy - both methods are checked:

1. **Custom Domains** (e.g., `valuelearning.co.za`) - via `domainMappings` table
2. **Subdomains** (e.g., `valuelearning.livewebapp.site`) - via `websites.domains` array

#### Domain Lookup Flow

```
getWebsiteByDomainPublic(domain: string)
│
├─► Check domainMappings table (Primary)
│   └─ WHERE domainValue = :domain AND domainType = 'custom'
│   └─► If found: use entityId to get website
│
└─► If not found: Check websites.domains array (Fallback)
    └─ WHERE domain IN (SELECT domains FROM websites WHERE isActive = true)
    └─► Find website where domains array contains the domain
```

#### Domain Synchronization

All domain operations automatically sync to both locations:

| Operation | Action |
|-----------|--------|
| **Create Website** | Creates domainMappings for all domains in array |
| **Update Website Domains** | Adds new domains to domainMappings, removes deleted ones |
| **Delete Website** | Deletes all associated domainMappings |

**Automatic Domain Type Detection:**
- `subdomain` - Domains ending with `.livewebapp.site`
- `custom` - All other custom domains (e.g., `.co.za`, `.com`)

#### domainMappings Table Fields

| Field | Type | Description |
|-------|------|-------------|
| `entityId` | Id | Website ID |
| `entityType` | string | "website", "calendar", etc. |
| `domainType` | string | "subdomain" or "custom" |
| `domainValue` | string | The domain (e.g., "valuelearning.co.za") |
| `status` | string? | "pending_configuration", "configured", "active" |
| `lastChecked` | number? | Last DNS verification timestamp |
| `createdBy` | Id | User who added the domain |
| `createdAt` | number | Creation timestamp |
| `updatedAt` | number | Last update timestamp |

**Indexes:**
- `by_entity` - entityId, entityType
- `by_domain_value` - domainValue
- `by_type_and_entity` - domainType, entityId

This dual-lookup system allows:
- **Custom domains** to be mapped separately (via domainMappings)
- **Subdomains** to be stored directly in the website record (via domains array)

---

## Database Schema (Convex)

### Core Tables

#### websites

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Primary key |
| `name` | string | Website name |
| `description` | string | Website description |
| `domains` | string[] | Array of all domains (subdomains + custom) |
| `isPublished` | boolean | Whether site is publicly visible |
| `isActive` | boolean | Soft delete flag |
| `branding` | object | Logo, favicon, colors |
| `companyId` | Id | Associated company |

#### pages

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Primary key |
| `websiteId` | Id | Parent website |
| `name` | string | Page display name |
| `slug` | string | URL-friendly identifier |
| `title` | string? | SEO title |
| `description` | string? | SEO description |
| `content` | string? | Page content (JSON for pageBuilder) |
| `contentType` | string | "pageBuilder", "richtext", "staticSite" |
| `isPublished` | boolean | Public visibility |
| `isActive` | boolean | Soft delete |
| `isHomePage` | boolean | Homepage flag |

**Indexes:**
- `by_website` - websiteId
- `by_slug` - slug
- `by_home_page` - [websiteId, isHomePage] (compound)
- `by_active` - isActive
- `by_published` - isPublished

#### domainMappings

Maps custom domains to entities (websites, calendars, etc.)

| Field | Type | Description |
|-------|------|-------------|
| `entityId` | Id | Target entity (e.g., website ID) |
| `entityType` | string | "website", "calendar", etc. |
| `domainType` | string | "subdomain" or "custom" |
| `domainValue` | string | The actual domain |
| `status` | string? | Domain verification status |

#### apps

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Primary key |
| `type` | string | "website", "calendar", "store", etc. |
| `domains` | string[] | Associated domains |

---

## Route Handlers

### Sitemap (`/app/[domain]/sitemap.xml/route.ts`)

Generates XML sitemap per domain:

```typescript
// Query params: { domain: string }
// Returns XML with:
// - Homepage URL
// - All published pages with lastmod
// - Priority and changefreq
```

### Robots.txt (`/app/[domain]/robots.txt/route.ts`)

Generates robots.txt per domain:

```typescript
// Query params: { domain: string }
// Returns:
// - Sitemap reference
// - Crawl rules
```

---

## SEO Implementation

### Meta Tags

Every page automatically generates the following SEO meta tags:

| Meta Tag | Location | Description |
|----------|----------|-------------|
| `title` | All pages | Page title from page.title or website.name |
| `description` | All pages | Page description from page.description or website.description |
| `og:title` | All pages | Open Graph title for social sharing |
| `og:description` | All pages | Open Graph description |
| `og:type` | All pages | Set to "website" |
| `og:url` | All pages | Canonical URL |
| `og:image` | All pages | Website favicon/logo for social sharing |
| `twitter:card` | All pages | Set to "summary_large_image" |
| `twitter:title` | All pages | Twitter Card title |
| `twitter:description` | All pages | Twitter Card description |
| `canonical` | All pages | Canonical URL to prevent duplicate content |

### Primary Domain & Redirects

Each website can set a **primary domain** for SEO consolidation:

| Field | Location | Description |
|-------|----------|-------------|
| `primaryDomain` | websites table | The canonical domain (e.g., valuelearning.co.za) |

**How it works:**
1. Set `primaryDomain` in website settings
2. Proxy (`proxy.ts`) redirects all other domains to the primary domain with 301
3. All canonical URLs use `primaryDomain` if set

**Redirect Logic:**
```
valuelearning.livewebapp.site → valuelearning.co.za (301 redirect)
```

**Files involved:**
- `proxy.ts` - Handles domain routing AND 301 redirects for non-primary domains
- `websites.ts` - Added `primaryDomain` field to updateWebsite mutation
- `page.tsx` - Uses primaryDomain for canonical URLs
- `[slug]/page.tsx` - Uses primaryDomain for canonical URLs
- `schema.ts` - Added primaryDomain field to websites table

### generateMetadata

Located in `app/[domain]/layout.tsx`:

- Generates metadata for all pages in the domain
- Uses website branding (name, description, favicon)
- Includes Open Graph and Twitter Card tags
- Sets canonical URLs

### Page-Level SEO

**Homepage** (`app/[domain]/page.tsx`):
- Uses homePage.title and homePage.description
- Sets canonical URL to domain root

**Dynamic Pages** (`app/[domain]/[slug]/page.tsx`):
- Uses page.title and page.description
- Sets canonical URL to page slug

### Image Alt Tags

All section components in `components/page-builder/renderer/sections/` include proper alt tags:
- Navbar logos: `{brandName} logo`
- Hero images: Descriptive alt text
- Feature icons: Icon descriptions
- Testimonial images: Person name/role

### Best Practices

1. **Title**: Keep under 60 characters, include primary keyword
2. **Description**: Keep under 160 characters, include call-to-action
3. **H1**: One per page, include main keyword
4. **Images**: All images should have alt text
5. **Internal Links**: Use descriptive anchor text
6. **Canonical**: Automatically set to prevent duplicate content

---

## Page Builder System

### Content Types

| Type | Description |
|------|-------------|
| `pageBuilder` | Sections-based editor (navbar, hero, features, etc.) |
| `richtext` | Rich text content |
| `staticSite` | Duplicated site HTML content |

### Section Structure

```typescript
interface Section {
  id: string;
  type: 'navbar' | 'hero' | 'features' | 'contact' | 'footer' | etc.;
  templateId: string;
  order: number;
  content: object;    // Section-specific content
  settings: object;
  createdAt: number;
  updatedAt: number;
}
```

### Page Builder Components

Located in `components/page-builder/renderer/sections/`:

- `NavbarBasic.tsx` / `NavbarModern.tsx`
- `HeroBasic.tsx` / `HeroModern.tsx` / `HeroSlider.tsx`
- `FeaturesBasic.tsx` / `FeaturesModern.tsx`
- `ContactBasic.tsx` / `ContactModern.tsx`
- `FooterBasic.tsx` / `FooterModern.tsx`
- And many more...

### Editor Pages

| Path | Purpose |
|------|---------|
| `/companies/[id]/websites/[id]/pages/[id]/design` | Visual editor |
| `/companies/[id]/websites/[id]/pages/[id]/canvas` | Canvas-based editor |
| `/companies/[id]/websites/[id]/pages/[id]/design/templates` | Template selection |

---

## Navigation & Links

### Link Types

The page builder supports multiple link types:

| Type | Behavior |
|------|----------|
| `url` | Direct URL navigation |
| `page` | Navigate to page + optional section scroll |
| `form` | Open form modal |

### Section Scrolling Logic

When a link has both a page and section:

```typescript
// If on same page: smooth scroll to section
if (currentPage === targetPage) {
  smoothScrollToSection(sectionId);
} else {
  // Navigate to page, then scroll
  navigateToPageWithSection(pageSlug, sectionId);
}
```

**Path Normalization**: `/` and `/home` are treated as the same page for comparison.

---

## Email System

### Email Providers

- **Resend** - Primary email sending service
- Configured via environment variables

### Email Functions

Located in `lib/email/` or similar:

- `sendEmail()` - Generic email sender
- Transactional emails:
  - Form submissions
  - User invitations
  - Password resets
  - Notifications

---

## Key Libraries & Dependencies

### Production Dependencies

```json
{
  "next": "16.1.6",
  "convex": "^1.31.7",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "tailwindcss": "^4.1.18",
  "lucide-react": "^0.564.0",
  "framer-motion": "^12.34.0",
  "zod": "^4.3.6",
  "react-hook-form": "^7.71.1",
  "react-hot-toast": "^2.6.0"
}
```

### Dev Dependencies

```json
{
  "typescript": "^5",
  "eslint": "^10",
  "eslint-config-next": "16.1.6",
  "postcss": "^8.5.6"
}
```

---

## App Types

The system supports multiple app types (managed via `apps` table):

| App Type | Description |
|----------|-------------|
| `website` | Public website with pages |
| `calendar` | Booking/calendar system |
| `store` | E-commerce store |
| `business` | Business tools |
| `courseSite` | Online courses |
| `propertySite` | Property listings |
| `vehicleDealershipSite` | Vehicle dealership |
| `scheduler` | Appointment scheduling |

---

## Admin & Dashboard Routes

### Main Dashboard

- `/dashboard` - Main dashboard

### Company Management

- `/companies` - List companies
- `/companies/[companyId]/manage` - Company settings
- `/companies/[companyId]/apps` - App management

### CRM Routes

- `/companies/[companyId]/crm` - CRM hub
- `/companies/[companyId]/crm/clients` - Clients
- `/companies/[companyId]/crm/leads` - Leads
- `/companies/[companyId]/crm/pipeline` - Sales pipeline
- `/companies/[companyId]/crm/quotes` - Quotes
- `/companies/[companyId]/crm/invoices` - Invoices
- `/companies/[companyId]/crm/team` - Team management

### Website Management

- `/companies/[companyId]/websites` - List websites
- `/companies/[companyId]/websites/[websiteId]/pages` - Pages list
- `/companies/[companyId]/websites/[websiteId]/settings` - Website settings
- `/companies/[companyId]/websites/[websiteId]/forms` - Form builder

### Other Features

- `/file-manager` - File management
- `/media-library` - Media assets
- `/admin` - Admin panel

---

## Authentication

### Auth Flow

1. **Registration**: `/auth/register` - Create account
2. **Login**: `/auth/login` - Authenticate
3. **Protected Routes**: Require authentication via `AuthProvider`

### Auth Provider (`AuthProvider.tsx`)

- Wraps protected routes
- Provides `user`, `isAuthenticated`, `isLoading`
- Handles session management

---

## Public Website Routes

### Homepage

- `/[domain]` - Website homepage

### Dynamic Pages

- `/[domain]/[slug]` - Individual pages

### E-commerce

- `/[domain]/products/[productId]` - Product page
- `/[domain]/checkout` - Checkout flow
- `/[domain]/checkout/success` - Order success

### Other

- `/[domain]/listings/[vehicleId]` - Vehicle listings (dealership)
- `/[domain]/auth/*` - Auth pages for site

---

## Environment Variables

Key environment variables required:

```env
# Convex
CONVEX_DEPLOYMENT=
CONVEX_DEPLOY_KEY=

# Authentication
JWT_SECRET=

# Email
RESEND_API_KEY=

# File Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

# Image Delivery (optional)
IMAGEDELIVERY_URL=
```

---

## Key Convex Functions

### Website Queries

- `getWebsiteByDomain` - Get website by domain (internal)
- `getWebsiteByDomainPublic` - Public website lookup
- `getWebsiteById` - Get by ID

### Page Queries

- `getPageBySlug` - Get page by slug (internal)
- `getPageBySlugPublic` - Public page lookup
- `getHomePage` - Get homepage (internal)
- `getHomePagePublic` - Public homepage lookup
- `getPagesByWebsite` - All pages for website
- `getPagesByWebsitePublic` - Public pages

### Mutations

- `createPage` - Create new page
- `updatePage` - Update page content
- `deletePage` - Soft delete page
- `setHomePage` - Set homepage

---

## Troubleshooting

### Common Issues

1. **Home page not showing**
   - Check `contentType` is `"pageBuilder"`
   - Verify `isHomePage: true` in database
   - Ensure website's `domains` array includes the domain

2. **Sitemap/Robots 404**
   - Route handlers placed in `/app/[domain]/` folder structure
   - Next.js matches specific routes before dynamic `[slug]` routes

3. **CTA not scrolling to section**
   - Check path normalization (`/` and `/home` treated as same)
   - Verify `ctaSectionId` is set in navbar content

4. **Pages not found**
   - Verify website has correct `websiteId`
   - Check pages have correct `websiteId` reference

---

## File Structure Summary

```
app/
├── [domain]/
│   ├── page.tsx              # Homepage
│   ├── [slug]/page.tsx       # Dynamic pages
│   ├── sitemap.xml/route.ts  # Sitemap
│   ├── robots.txt/route.ts   # Robots.txt
│   ├── layout.tsx            # Domain layout
│   ├── DomainLayoutWrapper.tsx
│   ├── companies/            # Admin routes
│   ├── dashboard/            # Dashboard
│   ├── admin/                # Admin panel
│   ├── auth/                 # Auth pages
│   ├── file-manager/         # File manager
│   └── [other features]

convex/
├── _generated/               # Auto-generated
├── schema.ts                 # Database schema
├── auth.ts                   # Auth functions
├── users.ts                  # User queries/mutations
├── companies.ts              # Company operations
├── websites.ts               # Website operations
├── pages.ts                  # Page operations
├── apps.ts                   # App management
└── [other modules]

components/
├── page-builder/
│   ├── renderer/             # Public-facing components
│   │   └── sections/         # Section components
│   ├── builder/              # Editor components
│   └── [builders]
├── ui/                       # Reusable UI components
└── [other components]

lib/
├── email/                    # Email utilities
├── auth/                     # Auth utilities
└── [utilities]
```

---

## Deployment

### Build

```bash
npm run build
```

### Development

```bash
npm run dev
```

### Convex Deployment

```bash
npx convex dev
```

This deploys schema changes and function updates to Convex.

---

## Complete Database Schema (Convex Tables)

### Core Tables (39 total)

| Table | Description |
|-------|-------------|
| `users` | User accounts with auth, profile, apps access |
| `sessions` | JWT tokens for authentication |
| `emailVerificationLogs` | Email verification tracking |
| `passwordResetLogs` | Password reset token tracking |
| `mediaLibrary` | File storage with folders, sharing |
| `mediaFolders` | Folder organization for files |
| `mediaCategories` | File categories |
| `companies` | Company records with apps, branding, payment settings |
| `apps` | App definitions (website, calendar, store, etc.) |
| `appConfigs` | Global app configuration and pricing |
| `websites` | Website records with domains, branding |
| `domainMappings` | Custom domain to entity mapping |
| `pages` | Website pages with page builder content |
| `forms` | Form builder with fields |
| `formSubmissions` | Form submission data |
| `branches` | Multi-location branches |
| `departments` | Organizational departments |
| `userCompanies` | User-company role mapping |
| `messages` | Team messaging |
| `messageGroups` | Group conversations |
| `vehicles` | Vehicle dealership listings |
| `products` | E-commerce products catalog |
| `shippingOptions` | Shipping methods and rates |
| `clients` | CRM client accounts |
| `leads` | CRM leads with source tracking |
| `activities` | CRM activities (calls, emails, meetings) |
| `inquiries` | Website form submissions |
| `adminSettings` | Global admin payment gateway config |
| `services` | Services catalog |
| `appSubscriptions` | User app subscriptions/payments |
| `userAvailability` | Scheduling availability |
| `quotes` | Sales quotes |
| `invoices` | Invoices with line items |
| `payments` | Payment records |
| `aiSectionFiles` | AI-generated HTML sections |
| `orders` | E-commerce orders |
| `orderItems` | Order line items |
| `favorites` | User product favorites |

---

## App Types & Features

### Supported Applications

| App Key | Display Name | Features |
|---------|---------------|----------|
| `businessTools` | Business Tools | CRM, Invoicing, Team, Consultants |
| `websites` | Websites | Page Builder, Forms |
| `vehicleDealership` | Vehicle Dealership | Inventory, Listings |
| `onlineStore` | Online Store | Products, Orders, Checkout |
| `bookingsApp` | Bookings | Scheduling, Availability |
| `realEstate` | Real Estate | Property Listings |

### App Subscription Flow

```
User registers → Enable app for company → Subscribe (PayFast/PayPal) → Access granted
```

---

## CRM Module

### Routes Structure

```
/companies/[companyId]/crm/
├── page.tsx              # CRM Dashboard
├── clients/              # Client management
├── leads/                # Lead management
├── pipeline/             # Sales pipeline
├── quotes/               # Quote generation
├── invoices/             # Invoice management
├── payments/             # Payment tracking
├── team/                 # Team management
│   └── [userId]/availability/  # User scheduling
├── services/             # Services catalog
├── products/             # Product catalog (CRM)
├── parts/                # Parts inventory
├── branches/              # Branch/location management
├── departments/          # Department management
├── activities/           # Activity tracking
├── messaging/            # Team messaging
├── consultants/          # External consultants
└── users/                # User management
```

### Lead Sources

- `contact_form` - Website contact form
- `inquiry_form` - Website inquiry form
- `facebook` - Facebook lead
- `auto_trader` - AutoTrader integration
- `walk_in` - In-person inquiry
- `referral` - Referral
- `other` - Other sources

### Lead Status

`new` → `contacted` → `qualified` → `converted` → `lost`

---

## Products & E-commerce

### Product Routes

```
/[domain]/products/
└── [productId]/page.tsx    # Product detail page
```

### Product Schema

| Field | Description |
|-------|-------------|
| `name` | Product name |
| `description` | Product description |
| `reference` | SKU/reference |
| `productType` | Category type |
| `category` | Product category |
| `brand` | Brand |
| `price` | Regular price |
| `discountedPrice` | Sale price |
| `cost` | Cost price |
| `sku` | Stock keeping unit |
| `stockQuantity` | Available stock |
| `lowStockThreshold` | Low stock alert level |
| `status` | draft, available, out_of_stock, discontinued |
| `images` | Product images array |
| `specifications` | Weight, dimensions, color, etc. |

---

## Services Module

### Services Schema

| Field | Description |
|-------|-------------|
| `name` | Service name |
| `description` | Service description |
| `category` | Service category |
| `price` | Service price |
| `duration` | Duration in minutes |
| `isActive` | Active status |

---

## Invoicing System

### Quote Flow

```
Draft → Sent → Accepted/Rejected → Convert to Invoice
```

### Invoice Flow

```
Draft → Sent → Paid (with payment tracking) → Overdue
```

### Quote/Invoice Schema

| Field | Type | Description |
|-------|------|-------------|
| `quoteNumber/invoiceNumber` | string | Unique number |
| `clientName` | string | Client name |
| `clientEmail` | string | Client email |
| `clientCompany` | string | Company name |
| `clientPhone` | string | Contact phone |
| `clientAddress` | string | Address |
| `status` | string | Current status |
| `items` | array | Line items |
| `subtotal` | number | Subtotal |
| `taxRate` | number | Tax percentage |
| `taxAmount` | number | Tax amount |
| `total` | number | Total |
| `amountPaid` | number | Amount paid (invoices) |
| `issueDate` | string | Issue date |
| `dueDate` | string | Due date |
| `validUntil` | string | Valid until (quotes) |

---

## Payment Implementation

### Supported Payment Gateways

#### PayFast (South Africa)

- **Test Mode**: Sandbox testing
- **Live Mode**: Production payments
- **Configuration**: Merchant ID, Merchant Key, Passphrase

#### PayPal

- **Test Mode**: Sandbox credentials
- **Live Mode**: Live credentials
- **Configuration**: Client ID, Client Secret

### Payment Settings Storage

**Company-level** (`companies.paymentSettings`):
```typescript
{
  payfast: {
    enabled: boolean,
    testMode: boolean,
    merchantId: string,
    merchantKey: string,
    passphrase: string
  },
  paypal: {
    enabled: boolean,
    testMode: boolean,
    testClientId: string,
    testClientSecret: string,
    liveClientId: string,
    liveClientSecret: string
  }
}
```

**Admin-level** (`adminSettings`):
```typescript
{
  payfast: { enabled, testMode, merchantId, merchantKey, passphrase },
  paypal: { enabled, testMode, testClientId, testClientSecret, liveClientId, liveClientSecret }
}
```

### Payment Flow

```
1. Customer completes order
2. Select payment method (PayFast/PayPal)
3. Redirect to payment gateway
4. Customer completes payment
5. Gateway redirects back with result
6. Update order status → Create payment record
```

### Checkout Routes

```
/[domain]/checkout/
├── page.tsx          # Checkout form
└── success/page.tsx  # Order success confirmation
```

---

## Orders Management

### Order Status

`pending` → `processing` → `shipped` → `delivered` → `cancelled` → `refunded`

### Payment Status

`pending` → `paid` → `failed` → `refunded`

### Order Schema

| Field | Description |
|-------|-------------|
| `orderNumber` | Unique order number (e.g., ORD-20240330-12345) |
| `customerName` | Customer name |
| `customerEmail` | Customer email |
| `customerPhone` | Contact phone |
| `shippingAddress` | Delivery address |
| `shippingMethodName` | Shipping method |
| `shippingPrice` | Shipping cost |
| `subtotal` | Subtotal |
| `taxAmount` | Tax |
| `total` | Total |
| `paymentMethod` | card, eft, payfast, paypal, cash |
| `paymentStatus` | Payment status |
| `paymentId` | Gateway transaction ID |

---

## Vehicle Dealership

### Vehicle Schema

| Field | Description |
|-------|-------------|
| `name` | Vehicle name |
| `reference` | Stock number |
| `vin` | Vehicle Identification Number |
| `vehicleType` | sedan, suv, truck, etc. |
| `make` | Brand/Manufacturer |
| `model` | Model name |
| `year` | Year |
| `condition` | new, used, certified |
| `price` | Price |
| `discountedPrice` | Sale price |
| `cost` | Cost |
| `status` | draft, available, reserved, sold |
| `specifications` | Engine, transmission, fuel, etc. |
| `features` | Feature list |
| `images` | Vehicle images |

### Vehicle Routes

```
/[domain]/listings/
└── [vehicleId]/page.tsx    # Vehicle detail page
```

---

## Scheduling & Availability

### User Availability Schema

```typescript
{
  weeklyAvailability: {
    monday: [{ startTime: "09:00", endTime: "17:00", enabled: true }],
    tuesday: [...],
    // ... other days
  },
  exclusions: [
    { date: "2025-03-15", isFullDay: true, reason: "Vacation" }
  ],
  timezone: "Africa/Johannesburg"
}
```

### Scheduling Routes

```
/companies/[companyId]/crm/team/[userId]/availability/page.tsx
```

---

## Form Builder

### Form Fields

| Type | Description |
|------|-------------|
| `text` | Single line text |
| `textarea` | Multi-line text |
| `email` | Email input |
| `number` | Number input |
| `tel` | Phone number |
| `url` | URL input |
| `date` | Date picker |
| `time` | Time picker |
| `radio` | Radio buttons |
| `checkbox` | Checkboxes |
| `select` | Dropdown |
| `multiselect` | Multi-select |
| `file` | File upload |

### Form Submission Flow

```
User submits form → Create formSubmissions record → Send emails to recipients
```

---

## Admin Functionality

### Admin Routes

```
/[domain]/admin/
└── users/page.tsx    # User management
```

### Admin Settings

- Payment gateway configuration
- App pricing
- Admin contact details

---

## Media Library

### File Management

- Upload files to Cloudflare R2/S3
- Organize in folders
- Share files with permissions
- Version control for files

### Media Routes

```
/[domain]/file-manager/
/[domain]/media-library/
```

---

## Team Messaging

### Message Types

- `text` - Text messages
- `image` - Image messages
- `file` - File attachments

### Message Groups

- Direct messages (DMs)
- Group conversations

---

## AI Section Generation

### AI Sections Table

Stores HTML content for AI-generated sections:

```typescript
{
  sectionFileId: string,    // Unique ID
  htmlCode: string,         // Generated HTML
  sectionName: string,      // Display name
  prompt: string,           // Original prompt
  websiteId: string,       // Associated website
  companyId: string         // Associated company
}
```

---

## User Access & Roles

### User Types

- `admin` - Full system access
- `user` - Standard user
- `operator` - Limited operations
- `sales` - Sales-focused access

### Company Roles

- `owner` - Company owner
- `admin` - Company admin
- `manager` - Manager level
- `supervisor` - Supervisor
- `member` - Team member

### Card Permissions

```typescript
{
  "invoices": "read-write",
  "quotes": "read",
  "products": "none"
}
```

### Convex Query/Mutation Usage

```typescript
// In client components
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Fetching data
const data = useQuery(api.module.functionName, { args });

// Mutations
const updateSomething = useMutation(api.module.updateFunction);
await updateSomething({ args });
```

### Next.js 16 Params (Promise-based)

```typescript
// Route handlers and pages in Next.js 16
export default async function Page({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  // ...
}
```

### Page Builder Content Parsing

```typescript
import { parsePageContent } from '@/lib/page-builder/hooks/usePageContent';

const pageContent = parsePageContent(page.content);
const sections = pageContent?.sections ?? [];
const pointerSettings = pageContent?.pointerSettings ?? null;
```

### Component Props Pattern

```typescript
interface SectionProps {
  content: {
    title?: string;
    subtitle?: string;
    backgroundColor?: string;
    // ... section-specific content
  };
  settings?: object;
  websiteId?: string;
  companyId?: string;
  homePageSlug?: string;
}
```

### Form Handling Pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

### Auth Guard Pattern

```typescript
// In protected pages
import { useAuthGuard } from '@/app/[domain]/AuthProvider';

export default function ProtectedPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  
  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Redirect to="/auth/login" />;
  
  // ... page content
}
```

### Tailwind CSS Pattern

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  isActive && "bg-blue-500"
)} />
```

---

## Key Hooks & Utilities

### usePageContent

```typescript
import { parsePageContent } from '@/lib/page-builder/hooks/usePageContent';

// Returns
{
  sections: Section[];
  version: string;
  lastModified: number;
  pointerSettings: object | null;
}
```

### useAuth

```typescript
const { user, isAuthenticated, isLoading, logout } = useAuth();
```

### Page Navigation

```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/path');
router.refresh();
```

---

## Database Query Patterns

### Indexed Queries (Preferred)

```typescript
// Using index - efficient
const results = await ctx.db
  .query("tableName")
  .withIndex("by_index_name", (q) => q.eq("field", value))
  .first();
```

### Compound Index Queries

```typescript
// Multiple fields
const results = await ctx.db
  .query("pages")
  .withIndex("by_home_page", (q) => 
    q.eq("websiteId", websiteId).eq("isHomePage", true)
  )
  .first();
```

### Filtered Queries

```typescript
// Additional filters
const results = await ctx.db
  .query("pages")
  .withIndex("by_website", (q) => q.eq("websiteId", websiteId))
  .filter((q) => q.eq(q.field("isActive"), true))
  .filter((q) => q.eq(q.field("isPublished"), true))
  .collect();
```

---

## Common Development Tasks

### Adding a New Section

1. Create renderer component: `components/page-builder/renderer/sections/NewSection.tsx`
2. Create editor component: `components/page-builder/builder/sections/NewSectionEditor.tsx`
3. Add to section registry
4. Add template to `design/templates/page.tsx`

### Adding a New Table

1. Define schema in `convex/schema.ts`
2. Run `npx convex dev` to create table
3. Create query/mutation functions in new file
4. Export from `convex/_generated/api`

### Adding a New Route

1. Create folder in `app/[domain]/` for tenant routes
2. Create `page.tsx`, `layout.tsx` as needed
3. Add authentication if required

---

## Important File Locations

| Feature | Location |
|---------|----------|
| Page Renderer | `components/page-builder/renderer/PageRenderer.tsx` |
| Section Components | `components/page-builder/renderer/sections/` |
| Page Editor | `app/[domain]/companies/[companyId]/websites/[websiteId]/pages/[pageId]/` |
| Auth Provider | `app/[domain]/AuthProvider.tsx` |
| Domain Layout | `app/[domain]/layout.tsx` |
| Homepage | `app/[domain]/page.tsx` |
| Page Route | `app/[domain]/[slug]/page.tsx` |
| Sitemap | `app/[domain]/sitemap.xml/route.ts` |
| Robots.txt | `app/[domain]/robots.txt/route.ts` |
| Domain Routing & Redirects | `proxy.ts` (root) |

---

## NPM Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## Convex Commands

```bash
npx convex dev      # Start dev server & deploy
npx convex push      # Push functions only
npx convex deploy   # Deploy to production
npx convex dashboard # Open dashboard
```

---

## Version Information

| Package | Version |
|---------|---------|
| Next.js | 16.1.6 |
| React | 19.2.4 |
| Convex | 1.31.7 |
| Tailwind CSS | 4.1.18 |
| TypeScript | 5.x |
| Node.js | 20.x+ |

---

*Last Updated: 03 April 2026*





Location:
/home/louis/Desktop/Refreshtech/apps/CRM/notes/
Purpose:
Ensure that all documentation in this folder is always relevant, accurate, and up-to-date with the latest implementations, features, file structures, and any other important notes about the CRM application.
Guidelines:
Update notes whenever features are added, removed, or modified.
Keep documentation synchronized with actual code, files, and structures.
Verify that spelling, grammar, and formatting are correct.
Make notes clear and concise, ensuring they are understandable for anyone reviewing them.
Include any new dependencies, workflows, or operational instructions as they arise.
Regularly review documentation to remove outdated or irrelevant entries.
Quality Assurance:
Documentation should be 100% accurate and reflect the current state of the application at all times.
Any discrepancies between the notes and the application should be corrected immediately.
