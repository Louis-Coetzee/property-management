'use client';

import { ReactNode } from 'react';
import { ConvexProvider as ConvexProviderBase } from 'convex/react';
import { ConvexReactClient } from 'convex/react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_CONVEX_URL environment variable.'
  );
}

const convex = new ConvexReactClient(convexUrl);

export function RootConvexProvider({ children }: { children: ReactNode }) {
  return <ConvexProviderBase client={convex}>{children}</ConvexProviderBase>;
}
