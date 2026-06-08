import { NextRequest, NextResponse } from 'next/server';

// EasySystems API configuration
const EASYSYSTEMS_BASE_URL = 'https://www.esleads.co.za';
const AUTH_ENDPOINT = `${EASYSYSTEMS_BASE_URL}/Oauth2/login`;
const LEADS_ENDPOINT = `${EASYSYSTEMS_BASE_URL}/api/leads`;

// Test credentials (predefined)
const TEST_CREDENTIALS = {
  username: 'ESTest',
  password: 'eb7475f7-92b8-4dd8-8cdd-deb70e0f081b',
  client_id: 'b3259840-0b2e-4ed7-b928-7774bcfea500',
  client_secret: 'sLf5YNNdTFLDyUrVD7MTtTLYsQqPfpbdkLPfmCE2wdpztpqDRK',
  dealer_id: '355',
};

// Store access tokens in memory with expiration (in production, use Redis or similar)
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

/**
 * Get OAuth2 access token for EasySystems API
 */
async function getAccessToken(credentials: {
  username: string;
  password: string;
  client_id: string;
  client_secret: string;
}): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', credentials.client_id);
    params.append('client_secret', credentials.client_secret);
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    const response = await fetch(AUTH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EasyQuotes] Auth failed:', response.status, errorText);
      return {
        success: false,
        error: `Authentication failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      console.error('[EasyQuotes] No access token in response:', data);
      return { success: false, error: 'No access token received' };
    }

    console.log('[EasyQuotes] Access token obtained successfully');
    return { success: true, token: accessToken };
  } catch (error) {
    console.error('[EasyQuotes] Auth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error',
    };
  }
}

/**
 * Submit lead to EasySystems API
 */
async function submitLead(
  accessToken: string,
  leadData: Record<string, any>
): Promise<{ success: boolean; subId?: number; error?: string; message?: string }> {
  try {
    const response = await fetch(LEADS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    const responseText = await response.text();
    console.log('[EasyQuotes] Lead submission response:', response.status, responseText);

    // Try to parse JSON response regardless of status code
    // EasySystems returns 500 with valid JSON containing error details
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { Message: responseText };
    }

    // Check if response is OK and Success is true
    if (!response.ok) {
      // Return the parsed error details from EasySystems
      return {
        success: false,
        subId: result.SubID ? parseInt(result.SubID) : undefined,
        error: result.Message || `Lead submission failed: ${response.status} ${response.statusText}`,
        message: result.Message,
      };
    }

    if (result.Success) {
      console.log('[EasyQuotes] Lead submitted successfully. SubID:', result.SubID);
      return { success: true, subId: result.SubID, message: result.Message || 'Success' };
    } else {
      console.error('[EasyQuotes] Lead submission returned Success=false:', result);
      return { success: false, error: result.Message || 'Lead submission failed', message: result.Message };
    }
  } catch (error) {
    console.error('[EasyQuotes] Lead submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown submission error',
    };
  }
}

/**
 * Extract field value from form data by label pattern matching
 */
function extractFieldValue(formData: Array<{ fieldId: string; fieldLabel: string; value: string }>, patterns: string[]): string {
  for (const pattern of patterns) {
    const field = formData.find(
      f => f.fieldLabel.toLowerCase().includes(pattern.toLowerCase()) ||
           f.fieldId.toLowerCase().includes(pattern.toLowerCase())
    );
    if (field && field.value) {
      return field.value;
    }
  }
  return '';
}

/**
 * POST /api/easyquotes/submit
 * Submit a form to EasySystems Leads API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      formData,
      websiteId,
      formId,
      mode = 'test', // 'test' or 'live'
      liveCredentials, // Only required for live mode
      vehicleData, // Optional: vehicle information for vehicle-related leads
      externalLeadId, // Optional: custom external lead ID
    } = body;

    // Validate required fields
    if (!formData || !Array.isArray(formData)) {
      return NextResponse.json(
        { success: false, error: 'Invalid form data' },
        { status: 400 }
      );
    }

    // Determine credentials based on mode
    let credentials;
    if (mode === 'live') {
      if (!liveCredentials) {
        console.error('[EasyQuotes] Live mode requires credentials');
        return NextResponse.json(
          { success: false, error: 'Live credentials required for live mode' },
          { status: 400 }
        );
      }
      credentials = {
        username: liveCredentials.username,
        password: liveCredentials.password,
        client_id: liveCredentials.clientId,
        client_secret: liveCredentials.clientSecret,
      };
    } else {
      credentials = TEST_CREDENTIALS;
    }

    // Extract required fields from form data
    const firstName = extractFieldValue(formData, ['first name', 'firstname', 'first_name']);
    const lastName = extractFieldValue(formData, ['last name', 'lastname', 'last_name']);
    const contactNumber = extractFieldValue(formData, ['contact number', 'phone', 'mobile', 'contact']);
    const emailAddress = extractFieldValue(formData, ['email', 'email address']);
    const title = extractFieldValue(formData, ['title', 'mr', 'mrs', 'ms', 'dr']);
    const comments = extractFieldValue(formData, ['comment', 'message', 'question', 'inquiry']);

    // Normalize contact number for South African format
    // Remove all non-numeric characters
    let normalizedContactNumber = contactNumber.replace(/\D/g, '');

    // If starts with 0, keep as is (e.g., 0731234567)
    // If starts with 27 (country code without +), add 0 at the beginning
    if (normalizedContactNumber.startsWith('27') && !normalizedContactNumber.startsWith('0')) {
      normalizedContactNumber = '0' + normalizedContactNumber.substring(2);
    }

    console.log('[EasyQuotes] Contact number normalization:', {
      original: contactNumber,
      normalized: normalizedContactNumber,
    });

    // Validate required fields
    if (!firstName || !lastName || !normalizedContactNumber) {
      console.error('[EasyQuotes] Missing required fields:', { firstName, lastName, contactNumber: normalizedContactNumber });
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields (First Name, Last Name, Contact Number are required)',
        },
        { status: 400 }
      );
    }

    // Get access token
    console.log('[EasyQuotes] Getting access token...', { mode });
    const authResult = await getAccessToken(credentials);

    if (!authResult.success || !authResult.token) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Authentication failed',
        },
        { status: 401 }
      );
    }

    // Build lead data according to EasySystems API v6.0 specification
    const dealerId = mode === 'live' && liveCredentials?.dealerId
      ? liveCredentials.dealerId
      : TEST_CREDENTIALS.dealer_id;

    // Generate a unique external lead ID
    const externalLeadIdValue = externalLeadId || `EQ${Date.now()}`;

    // Start with required fields only
    const leadData: Record<string, any> = {
      DealerID: parseInt(dealerId),
      ExternalLeadID: externalLeadIdValue,
      FirstName: firstName.trim(),
      LastName: lastName.trim(),
      ContactNumber: normalizedContactNumber,
      NewUsed: vehicleData?.condition === 'new' ? 'New' : vehicleData?.condition === 'used' ? 'Used' : 'New',
    };

    // Add optional fields
    if (title) leadData.Title = title.trim();
    if (emailAddress) leadData.EmailAddress = emailAddress.trim();
    if (comments) leadData.Comments = comments.trim();
    if (vehicleData?.make) leadData.VehicleBrand = vehicleData.make;
    if (vehicleData?.model) leadData.Vehicle = `${vehicleData.make || ''} ${vehicleData.model}`.trim();
    if (vehicleData?.year) leadData.ModelYear = String(vehicleData.year);
    if (vehicleData?.reference) leadData.StockNo = vehicleData.reference;

    // Add lead origin (helps with tracking)
    leadData.LeadOrigin = 'Website Form';

    // IMPORTANT: Log the exact data being sent
    console.log('[EasyQuotes] ==================================================');
    console.log('[EasyQuotes] SUBMITTING LEAD TO EASYSYSTEMS API');
    console.log('[EasyQuotes] URL:', LEADS_ENDPOINT);
    console.log('[EasyQuotes] MODE:', mode);
    console.log('[EasyQuotes] DEALER ID:', leadData.DealerID);
    console.log('[EasyQuotes] LEAD DATA:', JSON.stringify(leadData, null, 2));
    console.log('[EasyQuotes] ==================================================');

    console.log('[EasyQuotes] Submitting lead:', {
      mode,
      dealerId: leadData.DealerID,
      externalLeadId: leadData.ExternalLeadID,
      firstName,
      lastName,
      hasVehicleData: !!vehicleData,
      leadData: JSON.stringify(leadData, null, 2),
    });

    // Submit lead
    const result = await submitLead(authResult.token, leadData);

    console.log('[EasyQuotes] Final result:', {
      success: result.success,
      subId: result.subId,
      error: result.error,
      message: result.message,
    });

    return NextResponse.json({
      success: result.success,
      subId: result.subId,
      message: result.message,
      error: result.error,
    });
  } catch (error) {
    console.error('[EasyQuotes] API route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
