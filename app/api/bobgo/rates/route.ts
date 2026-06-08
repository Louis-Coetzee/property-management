import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

interface ShippingOptionData {
  shippingType?: string;
  pickupAddress?: string;
  pickupPostalCode?: string;
  pickupCity?: string;
  pickupProvince?: string;
  pickupCountry?: string;
  bobgoServiceCode?: string;
}

interface BobGoRateRequest {
  shippingOptionId: string;
  destinationAddress: string;
  destinationPostalCode: string;
  destinationCity: string;
  destinationProvince: string;
  destinationCountry: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{
    weight: number;
    length: number;
    width: number;
    height: number;
  }>;
}

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

interface BobGoCredentials {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  mode: string;
}

interface BobGoUserCredentials {
  email: string;
  password: string;
}

async function getBobGoCredentials(): Promise<BobGoCredentials | null> {
  try {
    console.log('[BOBGO] Fetching BobGo credentials from Convex...');
    const bobgoIntegration = await convex.query(api.integrations.getBobgoSettings);
    
    console.log('[BOBGO] Raw integration data:', JSON.stringify(bobgoIntegration, null, 2));
    
    if (!bobgoIntegration || !bobgoIntegration.enabled) {
      console.log('[BOBGO] Integration not enabled or not found');
      return null;
    }
    
    const config = bobgoIntegration.config as Record<string, string>;
    const mode = bobgoIntegration.mode || 'sandbox';
    
    console.log('[BOBGO] Mode:', mode);
    console.log('[BOBGO] Config keys:', Object.keys(config));
    console.log('[BOBGO] sandboxApiKey present:', !!config.sandboxApiKey);
    console.log('[BOBGO] sandboxApiSecret present:', !!config.sandboxApiSecret);
    console.log('[BOBGO] sandboxUserEmail present:', !!config.sandboxUserEmail);
    console.log('[BOBGO] sandboxUserPassword present:', !!config.sandboxUserPassword);
    console.log('[BOBGO] liveApiKey present:', !!config.liveApiKey);
    
    const apiKey = mode === 'live' ? config.liveApiKey : config.sandboxApiKey;
    const apiSecret = mode === 'live' ? config.liveApiSecret : config.sandboxApiSecret;
    
    console.log('[BOBGO] Selected API Key (first 10 chars):', apiKey?.substring(0, 10));
    console.log('[BOBGO] API Key length:', apiKey?.length);
    console.log('[BOBGO] Selected API Secret present:', !!apiSecret);
    
    if (!apiKey) {
      console.log('[BOBGO] No API key found for mode:', mode);
      return null;
    }
    
    return {
      apiKey,
      apiSecret: apiSecret || apiKey,
      baseUrl: mode === 'live' ? 'https://api.bobgo.co.za/v2' : 'https://api.sandbox.bobgo.co.za/v2',
      mode,
    };
  } catch (error) {
    console.error('[BOBGO] Error fetching credentials:', error);
    return null;
  }
}

async function getShippingOption(shippingOptionId: string): Promise<ShippingOptionData | null> {
  try {
    console.log('[BOBGO] Fetching shipping option:', shippingOptionId);
    const shippingOption = await convex.query(api.orders.getShippingOptionByIdPublic, {
      shippingOptionId,
    });
    
    const typedOption = shippingOption as unknown as ShippingOptionData;
    console.log('[BOBGO] Shipping option data:', JSON.stringify(typedOption, null, 2));
    
    if (typedOption) {
      console.log('[BOBGO] shippingType:', typedOption.shippingType);
      console.log('[BOBGO] pickupAddress:', typedOption.pickupAddress);
      console.log('[BOBGO] pickupCity:', typedOption.pickupCity);
      console.log('[BOBGO] pickupPostalCode:', typedOption.pickupPostalCode);
    }
    
    return typedOption;
  } catch (error) {
    console.error('[BOBGO] Error fetching shipping option:', error);
    return null;
  }
}

async function getBobGoUserCredentials(): Promise<BobGoUserCredentials | null> {
  try {
    const bobgoIntegration = await convex.query(api.integrations.getBobgoSettings);
    
    if (!bobgoIntegration) {
      return null;
    }
    
    const config = bobgoIntegration.config as Record<string, string>;
    const mode = bobgoIntegration.mode || 'sandbox';
    
    const email = mode === 'live' ? config.liveUserEmail : config.sandboxUserEmail;
    const password = mode === 'live' ? config.liveUserPassword : config.sandboxUserPassword;
    
    if (!email || !password) {
      console.log('[BOBGO] No user credentials found for mode:', mode);
      return null;
    }
    
    console.log('[BOBGO] Using user credentials for mode:', mode);
    return { email, password };
  } catch (error) {
    console.error('[BOBGO] Error fetching user credentials:', error);
    return null;
  }
}

// Authenticate with BobGo - try different auth methods
async function loginToBobGo(
  credentials: { apiKey: string; baseUrl: string },
  email: string,
  password: string
): Promise<string | null> {
  const { apiKey, baseUrl } = credentials;
  
  console.log('[BOBGO] Attempting BobGo authentication...');
  console.log('[BOBGO] Base URL:', baseUrl);
  
  // Try POST to /auth/login with various header combinations
  const authMethods = [
    {
      name: 'POST /auth/login with Authorization header',
      fetch: () => fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 
          'Authorization': apiKey, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email, password }),
      })
    },
    {
      name: 'POST /auth/login with Bearer token',
      fetch: () => fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email, password }),
      })
    },
    {
      name: 'POST /auth/login with x-api-key header',
      fetch: () => fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 
          'x-api-key': apiKey, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email, password }),
      })
    },
    {
      name: 'POST /login with Authorization header',
      fetch: () => fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 
          'Authorization': apiKey, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email, password }),
      })
    },
  ];
  
  for (const method of authMethods) {
    console.log('[BOBGO] Trying:', method.name);
    try {
      const response = await method.fetch();
      const responseText = await response.text();
      console.log('[BOBGO] Response:', response.status, responseText);
      
      if (response.ok && responseText) {
        try {
          const data = JSON.parse(responseText);
          if (data.token || data.sessionToken || data.accessToken) {
            console.log('[BOBGO] Got token!');
            return data.token || data.sessionToken || data.accessToken;
          }
        } catch {
          // Not JSON, might be token directly
        }
      }
    } catch (error) {
      console.log('[BOBGO] Error:', method.name, error);
    }
  }
  
  console.log('[BOBGO] All auth methods failed');
  return null;
}

// Get auth headers with session
function getAuthHeaders(apiKey: string, sessionToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': apiKey,
    'Content-Type': 'application/json',
  };
  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }
  return headers;
}

async function getBobGoRates(
  credentials: { apiKey: string; apiSecret: string; baseUrl: string },
  pickup: {
    address: string;
    postalCode: string;
    city: string;
    province: string;
    country: string;
  },
  delivery: {
    address: string;
    postalCode: string;
    city: string;
    province: string;
    country: string;
  },
  items: Array<{ weight: number; length: number; width: number; height: number }>
) {
  const { apiKey, baseUrl } = credentials;
  
  console.log('[BOBGO] Getting BobGo rates with Bearer token...');
  console.log('[BOBGO] Base URL:', baseUrl);
  
  const requestBody = {
    collection_address: {
      company: '',
      street_address: pickup.address,
      local_area: '',
      city: pickup.city,
      zone: pickup.province,
      country: pickup.country === 'South Africa' ? 'ZA' : pickup.country,
      code: pickup.postalCode,
    },
    delivery_address: {
      company: '',
      street_address: delivery.address,
      local_area: '',
      city: delivery.city,
      zone: delivery.province,
      country: delivery.country === 'South Africa' ? 'ZA' : delivery.country,
      code: delivery.postalCode,
    },
    parcels: items.map(item => ({
      submitted_length_cm: item.length,
      submitted_width_cm: item.width,
      submitted_height_cm: item.height,
      submitted_weight_kg: item.weight,
      description: 'Parcel',
    })),
  };
  
  console.log('[BOBGO] Rates request body:', JSON.stringify(requestBody, null, 2));
  
  const endpoint = `${baseUrl}/rates`;
  console.log('[BOBGO] Calling endpoint:', endpoint);
  
  // Add timeout to request body to tell BobGo to wait server-side
  const requestWithTimeout = {
    ...requestBody,
    timeout: 10000, // Wait up to 10 seconds for responses
  };
  
  // Step 1: Create rate request with timeout
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestWithTimeout),
  });
  
  const responseText = await response.text();
  console.log('[BOBGO] Rates response status:', response.status);
  
  if (!response.ok) {
    throw new Error(`BobGo API error: ${response.status} - ${responseText}`);
  }
  
  const data = JSON.parse(responseText);
  const rateRequestId = data.id;
  console.log('[BOBGO] Rate request ID:', rateRequestId);
  
  // Check initial response for results
  const providers = data.provider_rate_requests ?? [];
  providers.forEach((p: any) => console.log(`[BOBGO] Provider: ${p.provider_name} status: ${p.status}`));
  
  const hasResults = providers.some(
    (p: any) => p.status === 'success' && p.responses?.length > 0
  );
  
  if (hasResults) {
    console.log('[BOBGO] Got results from initial request!');
    return data;
  }
  
  // Step 2: Poll for results using query param
  const maxAttempts = 10;
  const delayMs = 1000;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Wait before polling
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    console.log(`[BOBGO] Polling attempt ${attempt + 1}/${maxAttempts}...`);
    
    const pollResponse = await fetch(`${baseUrl}/rates?id=${rateRequestId}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    const pollData = await pollResponse.json();
    const pollProviders = pollData.provider_rate_requests ?? [];
    
    pollProviders.forEach((p: any) => console.log(`[BOBGO] Poll Provider: ${p.provider_name} status: ${p.status}`));
    
    const pollHasResults = pollProviders.some(
      (p: any) => p.status === 'success' && p.responses?.length > 0
    );
    
    if (pollHasResults) {
      console.log('[BOBGO] Poll: Got results!');
      return pollData;
    }
  }
  
  // Return the last response even if timed out
  console.log('[BOBGO] Polling timed out, returning last response');
  return data;
}

function extractPriceFromRates(ratesData: any): number {
  console.log('[BOBGO] Extracting price from rates data...');
  console.log('[BOBGO] Rates data keys:', Object.keys(ratesData));
  
  // Find price from provider_rate_requests[].responses[].rate_amount
  const providerRateRequests = ratesData?.provider_rate_requests ?? [];
  console.log('[BOBGO] provider_rate_requests:', providerRateRequests.length, 'items');
  
  for (const provider of providerRateRequests) {
    console.log('[BOBGO] Provider:', provider.provider_name, 'status:', provider.status, 'responses:', provider.responses?.length);
    
    if (provider.status === 'success' && provider.responses?.length > 0) {
      for (const response of provider.responses) {
        console.log('[BOBGO] Response:', response.service_level?.name, 'status:', response.status, 'rate_amount:', response.rate_amount);
        
        if (response.status === 'success' && response.rate_amount > 0) {
          console.log('[BOBGO] Found price:', response.rate_amount);
          return response.rate_amount;
        }
      }
    }
  }
  
  console.log('[BOBGO] No price found, returning 0');
  return 0;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('\n========== BOBGO RATE CALCULATION STARTED ==========');
    const body: BobGoRateRequest = await request.json();
    console.log('[BOBGO] Request body:', JSON.stringify(body, null, 2));
    
    const { 
      destinationAddress,
      destinationPostalCode,
      destinationCity,
      destinationProvince,
      destinationCountry,
      items,
      shippingOptionId,
      customerName,
      customerEmail,
      customerPhone,
    } = body;

    if (!shippingOptionId) {
      console.log('[BOBGO] No shipping option ID provided');
      return NextResponse.json(
        { error: 'Shipping option ID is required' },
        { status: 400 }
      );
    }

    const shippingOption = await getShippingOption(shippingOptionId);
    if (!shippingOption || shippingOption.shippingType !== 'bobgo') {
      console.log('[BOBGO] Shipping option not found or not BobGo type');
      return NextResponse.json(
        { error: 'Shipping option not found or not a BobGo shipping type' },
        { status: 404 }
      );
    }

    const credentials = await getBobGoCredentials();
    if (!credentials) {
      console.log('[BOBGO] No credentials found');
      return NextResponse.json(
        { error: 'BobGo integration not configured' },
        { status: 400 }
      );
    }

    console.log('[BOBGO] Using Bearer token auth');
    console.log('[BOBGO] API Key (first 10):', credentials.apiKey.substring(0, 10));
    console.log('[BOBGO] Base URL:', credentials.baseUrl);

    const pickup = {
      address: shippingOption.pickupAddress || '',
      postalCode: shippingOption.pickupPostalCode || '',
      city: shippingOption.pickupCity || '',
      province: shippingOption.pickupProvince || '',
      country: shippingOption.pickupCountry || 'ZA',
    };

    const delivery = {
      address: destinationAddress,
      postalCode: destinationPostalCode,
      city: destinationCity,
      province: destinationProvince,
      country: destinationCountry || 'ZA',
    };

    console.log('[BOBGO] Pickup:', JSON.stringify(pickup, null, 2));
    console.log('[BOBGO] Delivery:', JSON.stringify(delivery, null, 2));
    console.log('[BOBGO] Items:', JSON.stringify(items, null, 2));
    console.log('[BOBGO] API Key (first 10 chars):', credentials.apiKey.substring(0, 10));
    console.log('[BOBGO] Base URL:', credentials.baseUrl);

    if (!pickup.address || !pickup.city || !pickup.postalCode) {
      console.log('[BOBGO] Missing pickup address fields');
      return NextResponse.json(
        { error: 'Pickup address not configured for this shipping option' },
        { status: 400 }
      );
    }

    console.log('[BOBGO] Getting rates from BobGo...');
    const ratesResult = await getBobGoRates(
      credentials,
      pickup,
      delivery,
      items
    );

    // Extract price from rates response
    const price = extractPriceFromRates(ratesResult);
    
    console.log('[BOBGO] Final price:', price);
    console.log('========== BOBGO RATE CALCULATION COMPLETED ==========\n');

    return NextResponse.json({
      success: true,
      price,
      ratesData: ratesResult,
    });

  } catch (error) {
    console.error('[BOBGO] Error in endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}