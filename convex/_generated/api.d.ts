/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminSettings from "../adminSettings.js";
import type * as appConfigs from "../appConfigs.js";
import type * as apps from "../apps.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as bookingPaymentSettings from "../bookingPaymentSettings.js";
import type * as bookings from "../bookings.js";
import type * as branches from "../branches.js";
import type * as clientNotes from "../clientNotes.js";
import type * as clients from "../clients.js";
import type * as companies from "../companies.js";
import type * as consultants from "../consultants.js";
import type * as cron from "../cron.js";
import type * as departments from "../departments.js";
import type * as domainManagement from "../domainManagement.js";
import type * as domainValidation from "../domainValidation.js";
import type * as email from "../email.js";
import type * as emailActions from "../emailActions.js";
import type * as favorites from "../favorites.js";
import type * as fileManager from "../fileManager.js";
import type * as fileManagerActions from "../fileManagerActions.js";
import type * as forms from "../forms.js";
import type * as inquiries from "../inquiries.js";
import type * as integrations from "../integrations.js";
import type * as invoices from "../invoices.js";
import type * as leads from "../leads.js";
import type * as media from "../media.js";
import type * as messageGroups from "../messageGroups.js";
import type * as messages from "../messages.js";
import type * as orders from "../orders.js";
import type * as pages from "../pages.js";
import type * as payments from "../payments.js";
import type * as products from "../products.js";
import type * as quotes from "../quotes.js";
import type * as security from "../security.js";
import type * as services from "../services.js";
import type * as shipping from "../shipping.js";
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
  admin: typeof admin;
  adminSettings: typeof adminSettings;
  appConfigs: typeof appConfigs;
  apps: typeof apps;
  auth: typeof auth;
  authActions: typeof authActions;
  bookingPaymentSettings: typeof bookingPaymentSettings;
  bookings: typeof bookings;
  branches: typeof branches;
  clientNotes: typeof clientNotes;
  clients: typeof clients;
  companies: typeof companies;
  consultants: typeof consultants;
  cron: typeof cron;
  departments: typeof departments;
  domainManagement: typeof domainManagement;
  domainValidation: typeof domainValidation;
  email: typeof email;
  emailActions: typeof emailActions;
  favorites: typeof favorites;
  fileManager: typeof fileManager;
  fileManagerActions: typeof fileManagerActions;
  forms: typeof forms;
  inquiries: typeof inquiries;
  integrations: typeof integrations;
  invoices: typeof invoices;
  leads: typeof leads;
  media: typeof media;
  messageGroups: typeof messageGroups;
  messages: typeof messages;
  orders: typeof orders;
  pages: typeof pages;
  payments: typeof payments;
  products: typeof products;
  quotes: typeof quotes;
  security: typeof security;
  services: typeof services;
  shipping: typeof shipping;
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
