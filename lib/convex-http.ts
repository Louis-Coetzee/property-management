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
