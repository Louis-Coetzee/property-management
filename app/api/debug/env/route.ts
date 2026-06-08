import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    vercelTokenExists: !!process.env.VERCEL_TOKEN,
    vercelTokenPrefix: process.env.VERCEL_TOKEN ? process.env.VERCEL_TOKEN.substring(0, 10) + '...' : 'not set',
    vercelProjectId: process.env.VERCEL_PROJECT_ID || 'not set',
    vercelTeamId: process.env.VERCEL_TEAM_ID || 'not set',
    subdomainBase: process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'not set',
    nodeEnv: process.env.NODE_ENV || 'not set',
    deployedAt: new Date().toISOString(),
  });
}
