/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accommodationInquiries from "../accommodationInquiries.js";
import type * as admin from "../admin.js";
import type * as adminSettings from "../adminSettings.js";
import type * as alerts from "../alerts.js";
import type * as analytics from "../analytics.js";
import type * as appConfigs from "../appConfigs.js";
import type * as apps from "../apps.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as availability from "../availability.js";
import type * as bookingPaymentSettings from "../bookingPaymentSettings.js";
import type * as bookings from "../bookings.js";
import type * as branches from "../branches.js";
import type * as clientNotes from "../clientNotes.js";
import type * as clients from "../clients.js";
import type * as companies from "../companies.js";
import type * as consultants from "../consultants.js";
import type * as contact from "../contact.js";
import type * as cron from "../cron.js";
import type * as departments from "../departments.js";
import type * as domainManagement from "../domainManagement.js";
import type * as domainUtils from "../domainUtils.js";
import type * as domainValidation from "../domainValidation.js";
import type * as email from "../email.js";
import type * as emailActions from "../emailActions.js";
import type * as faListings from "../faListings.js";
import type * as favorites from "../favorites.js";
import type * as fileManager from "../fileManager.js";
import type * as fileManagerActions from "../fileManagerActions.js";
import type * as forms from "../forms.js";
import type * as inquiries from "../inquiries.js";
import type * as integrations from "../integrations.js";
import type * as invoices from "../invoices.js";
import type * as leads from "../leads.js";
import type * as listings from "../listings.js";
import type * as locations from "../locations.js";
import type * as media from "../media.js";
import type * as messageGroups from "../messageGroups.js";
import type * as messages from "../messages.js";
import type * as newsletter from "../newsletter.js";
import type * as orders from "../orders.js";
import type * as pages from "../pages.js";
import type * as payments from "../payments.js";
import type * as products from "../products.js";
import type * as quotes from "../quotes.js";
import type * as savedItems from "../savedItems.js";
import type * as security from "../security.js";
import type * as services from "../services.js";
import type * as shipping from "../shipping.js";
import type * as siteSettings from "../siteSettings.js";
import type * as suppliers from "../suppliers.js";
import type * as teamMemberActions from "../teamMemberActions.js";
import type * as teamMembers from "../teamMembers.js";
import type * as userAvailability from "../userAvailability.js";
import type * as userImport from "../userImport.js";
import type * as vehicles from "../vehicles.js";
import type * as websites from "../websites.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accommodationInquiries: typeof accommodationInquiries;
  admin: typeof admin;
  adminSettings: typeof adminSettings;
  alerts: typeof alerts;
  analytics: typeof analytics;
  appConfigs: typeof appConfigs;
  apps: typeof apps;
  auth: typeof auth;
  authActions: typeof authActions;
  availability: typeof availability;
  bookingPaymentSettings: typeof bookingPaymentSettings;
  bookings: typeof bookings;
  branches: typeof branches;
  clientNotes: typeof clientNotes;
  clients: typeof clients;
  companies: typeof companies;
  consultants: typeof consultants;
  contact: typeof contact;
  cron: typeof cron;
  departments: typeof departments;
  domainManagement: typeof domainManagement;
  domainUtils: typeof domainUtils;
  domainValidation: typeof domainValidation;
  email: typeof email;
  emailActions: typeof emailActions;
  faListings: typeof faListings;
  favorites: typeof favorites;
  fileManager: typeof fileManager;
  fileManagerActions: typeof fileManagerActions;
  forms: typeof forms;
  inquiries: typeof inquiries;
  integrations: typeof integrations;
  invoices: typeof invoices;
  leads: typeof leads;
  listings: typeof listings;
  locations: typeof locations;
  media: typeof media;
  messageGroups: typeof messageGroups;
  messages: typeof messages;
  newsletter: typeof newsletter;
  orders: typeof orders;
  pages: typeof pages;
  payments: typeof payments;
  products: typeof products;
  quotes: typeof quotes;
  savedItems: typeof savedItems;
  security: typeof security;
  services: typeof services;
  shipping: typeof shipping;
  siteSettings: typeof siteSettings;
  suppliers: typeof suppliers;
  teamMemberActions: typeof teamMemberActions;
  teamMembers: typeof teamMembers;
  userAvailability: typeof userAvailability;
  userImport: typeof userImport;
  vehicles: typeof vehicles;
  websites: typeof websites;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
