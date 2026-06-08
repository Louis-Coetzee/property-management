'use client';

import { createContext, useContext, ReactNode } from 'react';

interface AuthBranding {
  primaryColor: string;
  secondaryColor: string;
}

const defaultBranding: AuthBranding = {
  primaryColor: '#10304f',
  secondaryColor: '#308a29',
};

const AuthBrandingContext = createContext<AuthBranding>(defaultBranding);

export function useAuthBranding() {
  return useContext(AuthBrandingContext);
}

interface AuthBrandingProviderProps {
  children: ReactNode;
  primaryColor: string;
  secondaryColor?: string;
}

export function AuthBrandingProvider({ children, primaryColor, secondaryColor = '#6e6e6e' }: AuthBrandingProviderProps) {
  return (
    <AuthBrandingContext.Provider value={{ primaryColor, secondaryColor }}>
      {children}
    </AuthBrandingContext.Provider>
  );
}