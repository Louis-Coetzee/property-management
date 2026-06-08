'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getRegisterError } from '@/utils/errorHandler';
import { useRouter, useParams } from 'next/navigation';

interface AppAccess {
  hasAccess: boolean;
  role: string;
  grantedAt: number;
  calendarId?: string;
  storeId?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  profileImage?: string;
  apps: Record<string, AppAccess>;
  isEmailVerified: boolean;
  userType?: string;
}

interface LoginResult {
  success?: boolean;
  requiresEmailVerification?: boolean;
  requiresRegistration?: boolean;
  requiresPasswordChange?: boolean;
  userId?: string;
  message?: string;
  sessionToken?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    apps: Record<string, AppAccess>;
  };
}

interface RegisterResult {
  userId: string;
  emailVerificationToken: string;
  message: string;
}

interface AddDomainResult {
  success: boolean;
  userId?: string;
  message: string;
  requiresEmailVerification?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  addDomainAccess: (email: string, password: string) => Promise<AddDomainResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  domain: string;
  setSessionToken: (token: string | null) => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, domain }: { children: ReactNode; domain: string }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user data from session token
  const user = useQuery(
    api.auth.getUserBySession,
    sessionToken ? { sessionToken } : 'skip'
  );

  // Actions and Mutations
  const loginAction = useAction(api.authActions.loginUserAction);
  const registerAction = useAction(api.authActions.registerUserAction);
  const addDomainAccessAction = useAction(api.authActions.addDomainToExistingUserAction);
  const logoutMutation = useMutation(api.auth.logoutUser);

  useEffect(() => {
    // Check for existing session token in localStorage
    const token = localStorage.getItem('sessionToken');
    if (token) {
      setSessionToken(token);
      // Also set as cookie for API requests
      document.cookie = `sessionToken=${token}; path=/; max-age=604800`; // 7 days
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await loginAction({ email, password, domain });
      
      if (result.success && result.sessionToken) {
        setSessionToken(result.sessionToken);
        localStorage.setItem('sessionToken', result.sessionToken);
        // Also set as cookie for API requests
        document.cookie = `sessionToken=${result.sessionToken}; path=/; max-age=604800`; // 7 days
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    // Debug logging for domain parameter
    console.log('🏠 AuthProvider register called with domain:', domain);
    console.log('🏠 Registration data:', JSON.stringify(data, null, 2));

    try {
      const result = await registerAction({ ...data, domain });
      return result;
    } catch (error: unknown) {
      // Enhanced debug logging in AuthProvider
      console.log('🔧 AuthProvider register error:', error);

      // Use centralized error handler but preserve special error patterns for EXISTING_USER
      let errorMessage = '';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }

      // Check for EXISTING_USER pattern which needs special handling
      if (errorMessage.includes('EXISTING_USER:')) {
        // Preserve the original error for frontend to handle password prompt
        throw error;
      }

      // For all other errors, convert to user-friendly message
      const userFriendlyMessage = getRegisterError(error);
      throw new Error(userFriendlyMessage);
    }
  };

  const addDomainAccess = async (email: string, password: string) => {
    try {
      const result = await addDomainAccessAction({ email, password, domain });
      return result;
    } catch (error) {
      console.error('Error adding domain access:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await logoutMutation({ sessionToken });
      }
      setSessionToken(null);
      localStorage.removeItem('sessionToken');
      // Also remove cookie
      document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local session even if server logout fails
      setSessionToken(null);
      localStorage.removeItem('sessionToken');
      // Also remove cookie
      document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
  };

  const refreshUser = async () => {
    // Force a re-fetch of user data by temporarily setting sessionToken to trigger re-query
    if (sessionToken) {
      const currentToken = sessionToken;
      setSessionToken(null);
      // Use setTimeout to ensure state update happens first
      setTimeout(() => {
        setSessionToken(currentToken);
      }, 0);
    }
  };

  const setSessionTokenExternal = (token: string | null) => {
    setSessionToken(token);
    if (token) {
      localStorage.setItem('sessionToken', token);
      document.cookie = `sessionToken=${token}; path=/; max-age=604800`;
    } else {
      localStorage.removeItem('sessionToken');
      document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading || (sessionToken !== null && user === undefined),
    login,
    register,
    addDomainAccess,
    logout,
    refreshUser,
    domain,
    setSessionToken: setSessionTokenExternal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Reusable hook to protect pages that require authentication.
 * Redirects to login if user is not authenticated.
 *
 * @returns { isAuthenticated: boolean, isLoading: boolean, user: User | null }
 *
 * @example
 * export default function ProtectedPage() {
 *   const { isAuthenticated, isLoading } = useAuthGuard();
 *
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   if (!isAuthenticated) {
 *     return null; // Will redirect to login
 *   }
 *
 *   return <div>Protected content</div>;
 * }
 */
export function useAuthGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const domain = params.domain as string;

  useEffect(() => {
    if (!isLoading && !user && domain) {
      router.push(`/${domain}/auth/login`);
    }
  }, [isLoading, user, router, domain]);

  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}
