'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { hasCardAccess } from '@/lib/card-permissions';
import type { CardPermissionsMap } from '@/lib/card-permissions';

interface CardPermissionsResult {
  canRead: boolean;
  canWrite: boolean;
  isLoading: boolean;
  userRole: string;
  hasFullAccess: boolean;
}

/**
 * Hook to check card permissions for the current user in a company
 * @param cardKey - The card key to check permissions for (e.g., 'leads', 'clients', 'products')
 * @returns CardPermissionsResult with canRead, canWrite, isLoading, userRole, and hasFullAccess
 */
export function useCardPermissions(cardKey: string): CardPermissionsResult {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthGuard();
  const params = useParams();
  const companyId = params.companyId as string;

  // Query company data to get user's role and card permissions
  const company = useQuery(
    api.companies.getByCompanyId,
    user?.id && companyId
      ? { userId: user.id as any, companyId: companyId as any }
      : "skip"
  );

  // Get user's card permissions
  const cardPermissions: CardPermissionsMap = (company as any)?.cardPermissions || {};
  const userRole = (company as any)?.userRole || 'member';

  // Admin and owner roles bypass permission checks
  const hasFullAccess = userRole === 'admin' || userRole === 'owner';

  // Check read access (user can view the card)
  const canRead = hasFullAccess || hasCardAccess(cardPermissions, cardKey, 'read');

  // Check write access (user can create, edit, delete)
  // A user has write access if their level is 'write' or 'read-write'
  const level = cardPermissions[cardKey];
  const canWrite = hasFullAccess ||
    level === 'write' ||
    level === 'read-write';

  return {
    canRead,
    canWrite,
    isLoading: authLoading || company === undefined,
    userRole,
    hasFullAccess,
  };
}
