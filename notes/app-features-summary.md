# App Features Summary

## Overview

This document summarizes the different apps (modules) available in the RefreshCRM application and their features.

---

## Available Apps

### 1. Business Tools

Business Tools is the core CRM module for managing business operations.

**Status**: Optional (must be enabled per company)

**Features:**
- **Team Members** - Manage team structure, roles, departments, and permissions
- **Team Availability** - Set team member availability schedules
- **Messaging** - Internal team communication
- **Departments** - Organize team members into departments
- **Branches** - Multi-location management
- **Products** - Product catalog management
- **Services** - Service offerings catalog
- **Clients** - Client/customer relationship management
- **Leads** - Lead tracking and conversion
- **Activities** - Track calls, emails, meetings, notes, tasks
- **Pipeline** - Sales pipeline with Kanban boards
- **Quotes** - Price quote generation
- **Invoices** - Invoice generation and tracking
- **Payments** - Payment tracking and balances

**Routes:**
- `/companies/[companyId]/crm/team` - Team management
- `/companies/[companyId]/crm/team/[userId]/availability` - Availability scheduling
- `/companies/[companyId]/crm/departments` - Departments
- `/companies/[companyId]/crm/branches` - Branches
- `/companies/[companyId]/crm/products` - Products
- `/companies/[companyId]/crm/services` - Services
- `/companies/[companyId]/crm/clients` - Clients
- `/companies/[companyId]/crm/leads` - Leads
- `/companies/[companyId]/crm/activities` - Activities
- `/companies/[companyId]/crm/pipeline` - Pipeline
- `/companies/[companyId]/crm/quotes` - Quotes
- `/companies/[companyId]/crm/invoices` - Invoices
- `/companies/[companyId]/crm/payments` - Payments
- `/companies/[companyId]/crm/messaging` - Messaging
- `/companies/[companyId]/crm/consultants` - Consultants

### 2. Websites

Website builder for creating and managing company websites.

**Status**: Optional (must be enabled per company)

**Features:**
- **Page Builder** - Visual drag-and-drop page editor
- **Canvas Editor** - Canvas-based page design
- **Templates** - Pre-built page templates
- **Forms** - Form builder for lead capture
- **Custom Domains** - Connect custom domains
- **Subdomains** - Automatic subdomain generation
- **Branding** - Logo, colors, custom styling
- **AI Section Generator** - AI-powered section generation

**Routes:**
- `/companies/[companyId]/websites` - Websites list
- `/companies/[companyId]/websites/[websiteId]` - Website dashboard
- `/companies/[companyId]/websites/[websiteId]/pages` - Pages
- `/companies/[companyId]/websites/[websiteId]/pages/[pageId]/design` - Page editor
- `/companies/[companyId]/websites/[websiteId]/pages/[pageId]/canvas` - Canvas editor
- `/companies/[companyId]/websites/[websiteId]/pages/[pageId]/design/templates` - Templates
- `/companies/[companyId]/websites/[websiteId]/settings` - Website settings
- `/companies/[companyId]/websites/[websiteId]/forms` - Forms

### 3. Online Store

E-commerce platform for selling products online.

**Status**: Optional (must be enabled per company)

**Features:**
- **Orders** - Order management
- **Shipping** - Shipping and fulfillment
- **Product Catalog** - Online product listings
- **Shopping Cart** - Customer cart functionality
- **Checkout** - Payment and checkout flow
- **Credits System** - credit-based shipping

**Routes:**
- `/companies/[companyId]/store/orders` - Orders
- `/companies/[companyId]/store/shipping` - Shipping settings
- `/companies/[companyId]/store/add-credits` - Add shipping credits
- `/checkout` - Public checkout

### 4. Bookings App

Appointment scheduling system.

**Status**: Optional (must be enabled per company)

**Features:**
- **Appointments** - Appointment scheduling
- **Availability** - Service availability windows
- **Calendar Views** - Calendar-based booking

**Routes:**
- `/companies/[companyId]/bookings/appointments` - Appointments

### 5. Vehicle Dealership

Specialized module for vehicle dealerships.

**Status**: Optional (must be enabled per company)

**Features:**
- **Vehicle Listings** - Vehicle inventory management
- **Parts** - Parts catalog
- **Auto Trader Integration** - AutoTrader feed integration

**Routes:**
- `/companies/[companyId]/crm/listings` - Vehicle listings
- `/companies/[companyId]/crm/parts` - Parts catalog

### 6. Real Estate

Real estate property management.

**Status**: Optional (must be enabled per company)

**Features:**
- **Property Listings** - Property inventory
- **Property Details** - Property information management

---

## Organization Features

These features are available to all companies regardless of enabled apps:

### Always Available

- **Consultants** - External consultants management
- **Inquiries** - Website form submissions
- **File Manager** - Media and file library

---

## Admin Features

Global admin features available to platform administrators:

**Routes:**
- `/admin` - Admin dashboard
- `/admin/companies` - Company management
- `/admin/users` - User management
- `/admin/apps` - App configuration
- `/admin/integrations` - Platform integrations

---

## Database Tables

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `companies` | Company records |
| `userCompanies` | User-company relationships |
| `sessions` | User sessions |
| `mediaLibrary` | File storage |
| `mediaFolders` | File organization |

### Business Tables

| Table | Description |
|-------|-------------|
| `branches` | Company branches |
| `departments` | Departments |
| `clients` | Clients |
| `leads` | Leads |
| `activities` | Activities |
| `quotes` | Quotes |
| `invoices` | Invoices |
| `payments` | Payments |
| `consultants` | Consultants |
| `services` | Services catalog |
| `vehicles` | Vehicle listings |
| `products` | Product catalog |
| `orders` | Store orders |

### Website Tables

| Table | Description |
|-------|-------------|
| `websites` | Websites |
| `pages` | Website pages |
| `forms` | Form definitions |
| `formSubmissions` | Form submissions |
| `domainMappings` | Domain mappings |

### Messaging Tables

| Table | Description |
|-------|-------------|
| `messages` | Team messages |
| `messageGroups` | Message groups |

---

## Payment Gateways

The application supports the following payment providers:

- **PayFast** - South African payment gateway
- **PayPal** - International payments
- **BobGo** - Courier/shipping services

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 |
| Database | Convex (serverless) |
| Authentication | Custom JWT |
| Styling | Tailwind CSS |
| UI Components | Radix UI, Lucide React |
| Forms | React Hook Form + Zod |