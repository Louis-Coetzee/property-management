'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface RootAuthContextType {
  user: any | null;
  loading: boolean;
}

const RootAuthContext = createContext<RootAuthContextType | undefined>(undefined);

export function RootAuthProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const user = useQuery(
    api.auth.getUserBySession,
    sessionToken ? { sessionToken } : 'skip'
  );

  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      setSessionToken(token);
      document.cookie = `sessionToken=${token}; path=/; max-age=604800`;
    }
    setLoading(false);
  }, []);

  return (
    <RootAuthContext.Provider value={{ user: user ?? null, loading }}>
      {children}
    </RootAuthContext.Provider>
  );
}

export function useRootAuth() {
  const context = useContext(RootAuthContext);
  if (!context) {
    throw new Error('useRootAuth must be used within a RootAuthProvider');
  }
  return context;
}
