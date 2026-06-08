import { NextResponse, NextRequest } from "next/server";

// Static allowed origins for specific domains
const ALLOWED_ORIGINS = [
  // Vercel deployments - make sure the booking app domain is included
  'https://refreshbooking.vercel.app',
  'https://refreshwebbuilder.vercel.app',
  'https://tangible-rabbit-550.convex.cloud', // Convex domain if needed
  
  // Add more Vercel deployment variations
  'https://bookingsapp.vercel.app',
  'https://refreshbooking1.vercel.app',
  'https://refreshbooking2.vercel.app', 
  
  // Example production domains (add your actual domains here)
  'https://refreshbooking.com',
  'https://refreshbooking.co.za',
  'https://app.refreshbooking.com',
  'https://app.refreshbooking.co.za',
  
  // Local development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005'
];

// Dynamic patterns for multi-tenant support
const ALLOWED_ORIGIN_PATTERNS = [
  // Vercel domains
  /^https:\/\/refreshbooking\d*\.vercel\.app$/,   // refreshbooking1.vercel.app, refreshbooking2.vercel.app, etc.
  /^https:\/\/refreshwebbuilder\d*\.vercel\.app$/, // refreshwebbuilder1.vercel.app, etc.
  /^https:\/\/[\w-]+\.vercel\.app$/,                // Any vercel.app subdomain
  
  // .com domains
  /^https:\/\/[\w-]+\.com$/,                       // Any .com domain
  /^https:\/\/[\w-]+\.[\w-]+\.com$/,               // Subdomains of .com (e.g., app.example.com)
  
  // .co.za domains  
  /^https:\/\/[\w-]+\.co\.za$/,                    // Any .co.za domain
  /^https:\/\/[\w-]+\.[\w-]+\.co\.za$/,            // Subdomains of .co.za (e.g., app.example.co.za)
  
  // Development
  /^http:\/\/localhost:\d+$/,                      // Any localhost port
  /^http:\/\/127\.0\.0\.1:\d+$/,                  // Local IP access
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  // Check static allowed origins first
  if (ALLOWED_ORIGINS.includes(origin)) {
    console.log(`CORS: Static origin allowed - ${origin}`);
    return true;
  }
  
  // Check dynamic patterns for multi-tenant support
  for (const pattern of ALLOWED_ORIGIN_PATTERNS) {
    if (pattern.test(origin)) {
      console.log(`CORS: Pattern matched - ${origin} (${pattern})`);
      return true;
    }
  }
  
  return false;
}

export function addCorsHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  const origin = request?.headers.get('origin');
  
  // Check if the origin is allowed (static list or pattern match)
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    // Detailed logging already handled in isAllowedOrigin function
  } else if (!origin) {
    // For same-origin requests or when origin is not set
    response.headers.set('Access-Control-Allow-Origin', '*');
    console.log('CORS: No origin header, allowing all');
  } else {
    console.warn(`CORS: ❌ BLOCKED origin: ${origin}`);
    // Don't set Access-Control-Allow-Origin for blocked origins
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Expose-Headers', 'Set-Cookie');
  
  return response;
}

export function handleCorsOptions(request?: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request);
}