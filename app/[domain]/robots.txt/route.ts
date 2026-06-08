import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;
  
  const content = `User-agent: *
Allow: /

Sitemap: https://${domain}/sitemap.xml

Disallow: /api/
Disallow: /admin/
Disallow: /crm/
Disallow: /auth/
`;

  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
