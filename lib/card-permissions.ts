// Card Permission Configuration
// This file defines all available cards/modules that can be assigned to team members

import {
  GitBranch,
  Network,
  Users as PeopleIcon,
  MessageSquare,
  FolderOpen,
  ShoppingCart,
  Wrench,
  UserCircle as UserGroupIcon,
  PhoneCall,
  Activity,
  KanbanSquare,
  Receipt,
  FileSpreadsheet,
  CreditCard,
  Globe,
  Calendar,
  Truck,
  Building2,
  Briefcase,
  LucideIcon,
} from 'lucide-react';

export type PermissionLevel = 'read' | 'write' | 'read-write' | 'none';

export interface CardPermission {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: 'organization' | 'crm' | 'marketing' | 'store' | 'bookings';
  gradient: string;
  requiredApp?: string; // e.g., 'businessTools', 'websites', 'onlineStore', 'bookingsApp'
}

// All available cards organized by category
export const CARD_PERMISSIONS: CardPermission[] = [
  // Organization Cards (Always visible)
  {
    key: 'branches',
    label: 'Branches',
    description: 'Company branch management',
    icon: GitBranch,
    category: 'organization',
    gradient: 'from-slate-500 to-slate-700',
  },
  {
    key: 'departments',
    label: 'Departments',
    description: 'Department organization',
    icon: Network,
    category: 'organization',
    gradient: 'from-violet-500 to-violet-700',
  },
  {
    key: 'teamMembers',
    label: 'Team Members',
    description: 'Team structure management',
    icon: PeopleIcon,
    category: 'organization',
    gradient: 'from-indigo-500 to-indigo-700',
    requiredApp: 'businessTools',
  },
  {
    key: 'messaging',
    label: 'Messaging',
    description: 'Team communication',
    icon: MessageSquare,
    category: 'organization',
    gradient: 'from-emerald-500 to-emerald-700',
    requiredApp: 'businessTools',
  },
  {
    key: 'fileManager',
    label: 'File Manager',
    description: 'Files and media library',
    icon: FolderOpen,
    category: 'organization',
    gradient: 'from-blue-500 to-blue-700',
    requiredApp: 'businessTools',
  },
  {
    key: 'consultants',
    label: 'Consultants',
    description: 'External consultants management',
    icon: Briefcase,
    category: 'organization',
    gradient: 'from-amber-500 to-amber-700',
  },

  // CRM Cards (Business Tools required)
  {
    key: 'products',
    label: 'Products',
    description: 'Product catalog management',
    icon: ShoppingCart,
    category: 'crm',
    gradient: 'from-orange-500 to-orange-700',
    requiredApp: 'businessTools',
  },
  {
    key: 'services',
    label: 'Services',
    description: 'Service scheduling and offerings',
    icon: Wrench,
    category: 'crm',
    gradient: 'from-cyan-500 to-cyan-700',
    requiredApp: 'businessTools',
  },
  {
    key: 'clients',
    label: 'Clients',
    description: 'Manage client relationships',
    icon: UserGroupIcon,
    category: 'crm',
    gradient: 'from-blue-500 to-blue-700',
    requiredApp: 'businessTools',
  },
  {
    key: 'leads',
    label: 'Leads',
    description: 'Track leads and conversions',
    icon: PhoneCall,
    category: 'crm',
    gradient: 'from-emerald-500 to-emerald-700',
    requiredApp: 'businessTools',
  },
  {
    key: 'pipeline',
    label: 'Pipeline',
    description: 'Sales pipeline management',
    icon: KanbanSquare,
    category: 'crm',
    gradient: 'from-indigo-500 to-indigo-700',
    requiredApp: 'businessTools',
  },
  {
    key: 'quotes',
    label: 'Quotes',
    description: 'Price quote management',
    icon: Receipt,
    category: 'crm',
    gradient: 'from-rose-500 to-rose-700',
    requiredApp: 'businessTools',
  },
  {
    key: 'invoices',
    label: 'Invoices',
    description: 'Invoice generation and tracking',
    icon: FileSpreadsheet,
    category: 'crm',
    gradient: 'from-pink-500 to-pink-700',
    requiredApp: 'businessTools',
  },
  {
    key: 'payments',
    label: 'Payments',
    description: 'Payment tracking and balances',
    icon: CreditCard,
    category: 'crm',
    gradient: 'from-teal-500 to-teal-700',
    requiredApp: 'businessTools',
  },

  // Marketing Cards (Websites app required)
  {
    key: 'websites',
    label: 'Websites',
    description: 'Company website management',
    icon: Globe,
    category: 'marketing',
    gradient: 'from-blue-500 to-blue-700',
    requiredApp: 'websites',
  },

  // Store Cards (Online Store required)
  {
    key: 'orders',
    label: 'Orders',
    description: 'Order management',
    icon: Receipt,
    category: 'store',
    gradient: 'from-blue-500 to-blue-700',
    requiredApp: 'onlineStore',
  },
  {
    key: 'shipping',
    label: 'Shipping',
    description: 'Shipping and fulfillment',
    icon: Truck,
    category: 'store',
    gradient: 'from-emerald-500 to-emerald-700',
    requiredApp: 'onlineStore',
  },

  // Bookings Cards (Bookings App required)
  {
    key: 'appointments',
    label: 'Appointments',
    description: 'Appointment scheduling',
    icon: Calendar,
    category: 'bookings',
    gradient: 'from-cyan-500 to-cyan-700',
    requiredApp: 'bookingsApp',
  },
];

// Category labels for display
export const CATEGORY_LABELS: Record<string, string> = {
  organization: 'Organization',
  crm: 'CRM',
  marketing: 'Marketing',
  store: 'Online Store',
  bookings: 'Booking System',
};

// Permission level labels for display
export const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  none: 'No Access',
  read: 'Read Only',
  write: 'Write Only',
  'read-write': 'Read & Write',
};

// Permission level colors for badges
export const PERMISSION_LEVEL_COLORS: Record<PermissionLevel, string> = {
  none: 'bg-slate-100 text-slate-600',
  read: 'bg-blue-100 text-blue-700',
  write: 'bg-amber-100 text-amber-700',
  'read-write': 'bg-emerald-100 text-emerald-700',
};

// Helper function to get cards by category
export function getCardsByCategory(category: string): CardPermission[] {
  return CARD_PERMISSIONS.filter(card => card.category === category);
}

// Helper function to get available cards based on enabled apps
export function getAvailableCards(enabledApps?: Record<string, { enabled: boolean }>): CardPermission[] {
  if (!enabledApps) {
    // Return only cards that don't require any app
    return CARD_PERMISSIONS.filter(card => !card.requiredApp);
  }

  return CARD_PERMISSIONS.filter(card => {
    if (!card.requiredApp) return true;
    const appConfig = enabledApps[card.requiredApp];
    return appConfig?.enabled === true;
  });
}

// Type for storing permissions on userCompanies
export type CardPermissionsMap = Record<string, PermissionLevel>;

// Default permissions (no access to any card)
export const DEFAULT_PERMISSIONS: CardPermissionsMap = {};

// Helper to check if a user has access to a specific card
export function hasCardAccess(
  permissions: CardPermissionsMap | undefined,
  cardKey: string,
  requiredLevel: 'read' | 'write' = 'read'
): boolean {
  if (!permissions) return false;

  const level = permissions[cardKey];
  if (!level || level === 'none') return false;

  if (requiredLevel === 'read') {
    return level === 'read' || level === 'read-write';
  }

  if (requiredLevel === 'write') {
    return level === 'write' || level === 'read-write';
  }

  return false;
}
