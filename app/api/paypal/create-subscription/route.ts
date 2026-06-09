import { NextRequest, NextResponse } from 'next/server';
import { getPlatformDomain } from '@/lib/domain';

interface PayPalProduct {
  id: string;
  name: string;
}

interface PayPalPlan {
  id: string;
  name: string;
  status: string;
  billing_cycles?: Array<{
    frequency?: {
      interval: string;
    };
    pricing_scheme?: {
      fixed_price?: {
        value: string;
        currency_code: string;
      };
    };
  }>;
}

interface PayPalSubscriptionLink {
  rel: string;
  href: string;
}

interface PayPalSubscription {
  id: string;
  links?: PayPalSubscriptionLink[];
}

interface PayPalProductsResponse {
  products?: PayPalProduct[];
}

interface PayPalPlansResponse {
  plans?: PayPalPlan[];
}

const APP_NAMES: Record<string, string> = {
  businessTools: 'Business Tools',
  websites: 'Websites',
  vehicleDealership: 'Vehicle Dealership',
  onlineStore: 'Online Store',
  bookingsApp: 'Booking System',
  realEstate: 'Real Estate',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, amount, currency = 'USD', userId, companyId, testMode, clientId, clientSecret, userEmail, userFirstName, userLastName } = body;

    console.log('PayPal create-subscription request:', {
      appId,
      amount,
      currency,
      userId,
      companyId,
      testMode,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length,
      clientSecretLength: clientSecret?.length,
      clientIdPreview: clientId ? `${clientId.substring(0, 10)}...` : 'none',
    });

    if (!appId || !amount || !userId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required parameters: appId, amount, userId, or companyId' },
        { status: 400 }
      );
    }

    const trimmedClientId = clientId?.trim() || '';
    const trimmedClientSecret = clientSecret?.trim() || '';

    if (!trimmedClientId || !trimmedClientSecret) {
      return NextResponse.json(
        {
          error: 'PayPal credentials are missing',
          details: 'Please ensure Client ID and Client Secret are configured in Admin Settings',
        },
        { status: 400 }
      );
    }

    const baseUrl = testMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    const credentials = `${trimmedClientId}:${trimmedClientSecret}`;
    const encodedCredentials = Buffer.from(credentials, 'utf8').toString('base64');

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.text();
      let errorMessage = 'Failed to authenticate with PayPal';
      let errorDetails = errorData;

      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error_description || errorJson.error || errorMessage;
        errorDetails = errorJson;
      } catch {
        // If not JSON, use the text as-is
      }

      console.error('PayPal auth error:', {
        status: authResponse.status,
        statusText: authResponse.statusText,
        error: errorData,
        testMode,
        baseUrl,
        clientIdLength: trimmedClientId.length,
        clientSecretLength: trimmedClientSecret.length,
      });

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
          debug: {
            testMode,
            baseUrl,
            clientIdLength: trimmedClientId.length,
            clientSecretLength: trimmedClientSecret.length,
          }
        },
        { status: 500 }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    const appName = APP_NAMES[appId] || appId;

    // Step 1: Create or Get Product
    const productId = await createOrUpdateProduct(baseUrl, accessToken, appId, appName);

    // Step 2: Create Plan with monthly billing cycle
    const planId = await createOrUpdatePlan(baseUrl, accessToken, productId, appId, appName, amount, currency);

    // Step 3: Create Subscription
    const subscriptionId = await createSubscription(
      baseUrl,
      accessToken,
      planId,
      appId,
      userId,
      companyId,
      currency,
      request,
      userEmail,
      userFirstName,
      userLastName
    );

    // Step 4: Get approval URL
    const approvalUrl = await getSubscriptionApprovalUrl(baseUrl, accessToken, subscriptionId);

    return NextResponse.json({
      subscriptionId,
      approvalUrl,
    });
  } catch (error) {
    console.error('PayPal subscription creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function createOrUpdateProduct(
  baseUrl: string,
  accessToken: string,
  appId: string,
  appName: string
): Promise<string> {
  const listResponse = await fetch(`${baseUrl}/v1/catalogs/products?page_size=20`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (listResponse.ok) {
    const listData: PayPalProductsResponse = await listResponse.json();
    const existingProduct = listData.products?.find(
      (p) => p.name === `RefreshCRM - ${appName}` || p.id.includes(appId)
    );

    if (existingProduct) {
      return existingProduct.id;
    }
  }

  const productResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `RefreshCRM - ${appName}`,
      description: `Monthly subscription for ${appName} - Full access to all features`,
      type: 'SERVICE',
      category: 'SOFTWARE',
      image_url: `https://${getPlatformDomain()}/logo.png`,
      home_url: `https://${getPlatformDomain()}`,
    }),
  });

  if (!productResponse.ok) {
    const error = await productResponse.text();
    console.error('Failed to create PayPal product:', {
      status: productResponse.status,
      statusText: productResponse.statusText,
      error: error,
    });
    throw new Error(`Failed to create PayPal product: ${error}`);
  }

  const productData = await productResponse.json();
  return productData.id;
}

async function createOrUpdatePlan(
  baseUrl: string,
  accessToken: string,
  productId: string,
  appId: string,
  appName: string,
  amount: number,
  currency: string
): Promise<string> {
  const listResponse = await fetch(`${baseUrl}/v1/billing/plans?page_size=20&product_id=${productId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (listResponse.ok) {
    const listData: PayPalPlansResponse = await listResponse.json();
    const existingPlan = listData.plans?.find(
      (p) =>
        p.billing_cycles?.[0]?.frequency?.interval === 'MONTH' &&
        p.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.value === amount.toFixed(2) &&
        p.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.currency_code === currency
    );

    if (existingPlan) {
      if (existingPlan.status !== 'ACTIVE') {
        await fetch(`${baseUrl}/v1/billing/plans/${existingPlan.id}/activate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
      return existingPlan.id;
    }
  }

  const planResponse = await fetch(`${baseUrl}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      product_id: productId,
      name: `${appName} - Monthly Subscription`,
      description: `Monthly subscription for ${appName} - ${currency.toUpperCase()} ${amount.toFixed(2)}/month`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: amount.toFixed(2),
              currency_code: currency,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: currency,
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!planResponse.ok) {
    const error = await planResponse.text();
    console.error('Failed to create PayPal plan:', {
      status: planResponse.status,
      statusText: planResponse.statusText,
      error: error,
      productId,
      amount,
      currency,
    });
    throw new Error(`Failed to create PayPal billing plan: ${error}`);
  }

  const planData = await planResponse.json();
  return planData.id;
}

async function createSubscription(
  baseUrl: string,
  accessToken: string,
  planId: string,
  appId: string,
  userId: string,
  companyId: string,
  currency: string,
  request: NextRequest,
  userEmail?: string,
  userFirstName?: string,
  userLastName?: string
): Promise<string> {
  const origin = request.headers.get('origin') || `https://${getPlatformDomain()}`;

  // Use provided user info or defaults
  const subscriberEmail = userEmail || `user_${userId}@refreshcrm.app`;
  const subscriberFirstName = userFirstName || 'RefreshCRM';
  const subscriberLastName = userLastName || 'User';

  const subscriptionResponse = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      plan_id: planId,
      quantity: '1',
      subscriber: {
        name: {
          given_name: subscriberFirstName,
          surname: subscriberLastName,
        },
        email_address: subscriberEmail,
      },
      auto_renewal: true,
      application_context: {
        brand_name: 'RefreshCRM',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: `${origin}/dashboard/app-success?app=${appId}&gateway=paypal&currency=${currency}&company=${companyId}`,
        cancel_url: `${origin}/explore-apps`,
      },
      custom_id: `${userId}_${appId}_${companyId}_${Date.now()}`,
    }),
  });

  if (!subscriptionResponse.ok) {
    const error = await subscriptionResponse.text();
    console.error('Failed to create PayPal subscription:', error);
    throw new Error('Failed to create PayPal subscription');
  }

  const subscriptionData = await subscriptionResponse.json();
  return subscriptionData.id;
}

async function getSubscriptionApprovalUrl(
  baseUrl: string,
  accessToken: string,
  subscriptionId: string
): Promise<string> {
  const subscriptionResponse = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!subscriptionResponse.ok) {
    throw new Error('Failed to get subscription details');
  }

  const subscriptionData: PayPalSubscription = await subscriptionResponse.json();

  const approvalUrl = subscriptionData.links?.find(
    (link) => link.rel === 'approve'
  )?.href;

  if (!approvalUrl) {
    throw new Error('No approval URL found in subscription response');
  }

  return approvalUrl;
}
