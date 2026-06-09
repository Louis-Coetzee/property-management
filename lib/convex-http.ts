import { ConvexHttpClient } from "convex/browser";

let client: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!client) {
    const url = process.env.CONVEX_URL;
    if (!url) {
      throw new Error(
        "CONVEX_URL environment variable is not set. " +
        "Add it to your .env.local or Vercel project settings."
      );
    }
    client = new ConvexHttpClient(url);
  }
  return client;
}

// Shared Convex HTTP client for API routes (matches FA's lib/convex.ts export)
export const convexHttpClient = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);
