import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex-http';
import { api } from '@/convex/_generated/api';

interface ProcessShippingRequest {
  orderId: string;
  orderNumber: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyId: string;
  deductCredit?: boolean;
  creditAmount?: number;
}

async function getBobGoCredentials(convex: ReturnType<typeof getConvexClient>) {
  try {
    const bobgoIntegration = await convex.query(api.integrations.getBobgoSettings);
    
    if (!bobgoIntegration || !bobgoIntegration.enabled) {
      console.log('[SHIPPING] BobGo integration not enabled or not found');
      return null;
    }
    
    const config = bobgoIntegration.config as Record<string, string>;
    const mode = bobgoIntegration.mode || 'sandbox';
    
    console.log('[SHIPPING] BobGo mode:', mode);
    console.log('[SHIPPING] liveApiKey present:', !!config.liveApiKey);
    console.log('[SHIPPING] sandboxApiKey present:', !!config.sandboxApiKey);
    
    const apiKey = mode === 'live' ? config.liveApiKey : config.sandboxApiKey;
    
    if (!apiKey) {
      console.log('[SHIPPING] No API key found for mode:', mode);
      return null;
    }
    
    const baseUrl = mode === 'live' ? 'https://api.bobgo.co.za/v2' : 'https://api.sandbox.bobgo.co.za/v2';
    console.log('[SHIPPING] Using baseUrl:', baseUrl);
    console.log('[SHIPPING] API Key (first 10):', apiKey.substring(0, 10));
    
    return {
      apiKey,
      baseUrl,
      mode,
    };
  } catch (error) {
    console.error('[SHIPPING] Error fetching credentials:', error);
    return null;
  }
}

async function getShippingOption(companyId: string, convex: ReturnType<typeof getConvexClient>) {
  try {
    const shippingOptions = await convex.query(api.orders.getShippingOptionsPublic, {
      companyId,
    });
    
    const bobgoOption = shippingOptions.find((s: any) => s.shippingType === 'bobgo');
    return bobgoOption || null;
  } catch (error) {
    console.error('[SHIPPING] Error fetching shipping option:', error);
    return null;
  }
}

function findSuccessfulRate(ratesData: any): { rate: any; providerSlug: string } | null {
  const providers: any[] = ratesData.provider_rate_requests || [];
  
  // Prefer sandbox provider over demo for testing
  const selectedRate = providers
    .find((p: any) => p.status === 'success' && p.provider_slug === 'sandbox' && p.responses?.length > 0)
    ?? providers
    .find((p: any) => p.status === 'success' && p.responses?.length > 0);
  
  if (selectedRate && selectedRate.responses?.length > 0) {
    const rate = selectedRate.responses.find((r: any) => r.status === 'success');
    if (rate) {
      return { rate, providerSlug: selectedRate.provider_slug };
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const body: ProcessShippingRequest = await request.json();
    console.log('[SHIPPING] Processing shipping for order:', body.orderNumber);
    
    const credentials = await getBobGoCredentials(convex);
    if (!credentials) {
      return NextResponse.json(
        { error: 'BobGo integration not configured' },
        { status: 400 }
      );
    }
    
    const { apiKey, baseUrl } = credentials;
    
    const shippingOption = await getShippingOption(body.companyId, convex);
    if (!shippingOption) {
      return NextResponse.json(
        { error: 'No BobGo shipping option configured' },
        { status: 400 }
      );
    }
    
    
    
    // Step 1: Create order in BobGo
    const nameParts = (body.customerName || 'Customer').split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';
    
    const orderRequestBody = {
      channel_order_number: body.orderNumber,
      customer_name: firstName,
      customer_surname: lastName,
      customer_email: body.customerEmail,
      customer_phone: body.customerPhone || '+27812345678',
      currency: 'ZAR',
      buyer_selected_shipping_cost: 0,
      buyer_selected_shipping_method: 'Standard',
      delivery_address: {
        street_address: body.shippingAddress || '',
        local_area: '',
        city: body.shippingCity || '',
        zone: body.shippingState || '',
        country: 'ZA',
        code: body.shippingZipCode || '0000',
      },
      order_items: [
        {
          description: 'Order parcel',
          sku: body.orderNumber,
          unit_price: 0,
          qty: 1,
          unit_weight_kg: 0.5,
        },
      ],
      payment_status: 'pending',
    };
    
    console.log('[SHIPPING] Creating order in BobGo...');
    
    const orderResponse = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderRequestBody),
    });
    
    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('[SHIPPING] Order creation failed:', errorText);
      return NextResponse.json(
        { error: `Failed to create order: ${errorText}` },
        { status: 400 }
      );
    }
    
    const orderData = await orderResponse.json();
    console.log('[SHIPPING] Order created:', orderData.id);
    
    // Step 2: Get rates
    const ratesRequestBody = {
      collection_address: {
        company: '',
        street_address: shippingOption.pickupAddress,
        local_area: '',
        city: shippingOption.pickupCity,
        zone: shippingOption.pickupProvince,
        country: 'ZA',
        code: shippingOption.pickupPostalCode,
      },
      delivery_address: {
        street_address: body.shippingAddress || '',
        local_area: '',
        city: body.shippingCity || '',
        zone: body.shippingState || '',
        country: 'ZA',
        code: body.shippingZipCode || '0000',
      },
      parcels: [
        {
          submitted_length_cm: 20,
          submitted_width_cm: 15,
          submitted_height_cm: 10,
          submitted_weight_kg: 0.5,
          description: 'Order parcel',
        },
      ],
      timeout: 10000,
    };
    
    console.log('[SHIPPING] Getting rates...');
    
    const ratesResponse = await fetch(`${baseUrl}/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ratesRequestBody),
    });
    
    if (!ratesResponse.ok) {
      const errorText = await ratesResponse.text();
      console.error('[SHIPPING] Rates failed:', errorText);
      return NextResponse.json(
        { error: `Failed to get rates: ${errorText}` },
        { status: 400 }
      );
    }
    
    let ratesData = await ratesResponse.json();
    
    // Try to find successful rate
    let rateResult = findSuccessfulRate(ratesData);
    
    // Poll if not ready
    if (!rateResult) {
      console.log('[SHIPPING] No rates available yet, polling...');
      const rateRequestId = ratesData.id;
      
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const pollResponse = await fetch(`${baseUrl}/rates?id=${rateRequestId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        
        ratesData = await pollResponse.json();
        rateResult = findSuccessfulRate(ratesData);
        
        if (rateResult) break;
      }
    }
    
    if (!rateResult) {
      return NextResponse.json(
        { error: 'No shipping rates available' },
        { status: 400 }
      );
    }
    
    const { rate: selectedRate, providerSlug: selectedProviderSlug } = rateResult;
    console.log('[SHIPPING] Selected rate:', selectedRate.rate_amount);
    console.log('[SHIPPING] Selected provider:', selectedProviderSlug);
    console.log('[SHIPPING] Service level code:', selectedRate.service_level_code);
    
    // Calculate collection date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const collectionMinDate = tomorrow.toISOString().split('T')[0] + 'T08:00:00+02:00';
    
    // Step 3: Create shipment
    const shipmentRequestBody = {
      order_id: orderData.id,
      provider_slug: selectedProviderSlug,
      service_level_code: selectedRate.service_level_code,
      collection_address: {
        street_address: shippingOption.pickupAddress,
        local_area: '',
        city: shippingOption.pickupCity,
        zone: shippingOption.pickupProvince,
        country: 'ZA',
        code: shippingOption.pickupPostalCode,
      },
      delivery_address: {
        street_address: body.shippingAddress || '',
        local_area: '',
        city: body.shippingCity || '',
        zone: body.shippingState || '',
        country: 'ZA',
        code: body.shippingZipCode || '0000',
      },
      parcels: [
        {
          submitted_length_cm: 20,
          submitted_width_cm: 15,
          submitted_height_cm: 10,
          submitted_weight_kg: 0.5,
          description: 'Parcel',
        },
      ],
      collection_min_date: collectionMinDate,
      collection_contact_full_name: 'Owner',
      collection_contact_email: 'info@refreshtech.co.za',
      collection_contact_mobile_number: '+27619932005',
      delivery_contact_full_name: body.customerName || 'Customer',
      delivery_contact_email: body.customerEmail || 'customer@email.com',
      delivery_contact_mobile_number: body.customerPhone || '+27812345678',
    };
    
    console.log('[SHIPPING] Creating shipment...');
    console.log('[SHIPPING] Shipment request:', JSON.stringify(shipmentRequestBody, null, 2));
    
    const shipmentResponse = await fetch(`${baseUrl}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentRequestBody),
    });
    
    if (!shipmentResponse.ok) {
      const errorText = await shipmentResponse.text();
      console.error('[SHIPPING] Shipment creation failed:', errorText);
      return NextResponse.json(
        { error: `Failed to create shipment: ${errorText}` },
        { status: 400 }
      );
    }
    
    const shipmentData = await shipmentResponse.json();
    console.log('[SHIPPING] Shipment created:', shipmentData.id);
    
    // Step 4: Get waybill
    let waybillUrl = null;
    if (shipmentData.id) {
      try {
        const waybillResponse = await fetch(`${baseUrl}/shipments/waybill?shipment_id=${shipmentData.id}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        
        if (waybillResponse.ok) {
          const waybillData = await waybillResponse.json();
          console.log('[SHIPPING] Waybill response:', waybillData);
          // Handle both URL and base64 formats
          waybillUrl = waybillData.public_url || waybillData.url || waybillData.base64 || null;
          if (waybillData.base64) {
            console.log('[SHIPPING] Waybill is base64 format');
          }
        }
      } catch (error) {
        console.log('[SHIPPING] Waybill not available yet:', error);
      }
    }
    
    // Step 5: Update order in database with shipment info
    try {
      await convex.mutation(api.orders.updateOrderShippingInfo, {
        orderId: body.orderId as any,
        bobgoOrderId: orderData.id,
        bobgoShipmentId: shipmentData.id,
        bobgoRateId: ratesData.id,
        waybillUrl: waybillUrl,
        shippingCost: selectedRate.rate_amount,
      });
      console.log('[SHIPPING] Order updated with shipping info');
    } catch (error) {
      console.error('[SHIPPING] Failed to update order:', error);
    }
    
    // Step 6: Deduct credit from company if requested
    if (body.deductCredit && body.creditAmount && body.creditAmount > 0) {
      try {
        await convex.mutation(api.companies.useCompanyCredit, {
          companyId: body.companyId as any,
          amount: body.creditAmount,
          orderId: body.orderId as any,
          description: `Shipping for order ${body.orderNumber} - BobGo Rate: ${selectedRate.rate_amount}`,
        });
        console.log('[SHIPPING] Credit deducted:', body.creditAmount);
      } catch (creditError) {
        console.error('[SHIPPING] Failed to deduct credit:', creditError);
      }
    }
    
    return NextResponse.json({
      success: true,
      bobgoOrderId: orderData.id,
      bobgoRateId: ratesData.id,
      bobgoShipmentId: shipmentData.id,
      rateAmount: selectedRate.rate_amount,
      serviceLevel: selectedRate.service_level?.name,
      waybillUrl: waybillUrl,
    });
    
  } catch (error) {
    console.error('[SHIPPING] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
