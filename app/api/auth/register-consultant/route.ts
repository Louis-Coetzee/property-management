import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-http";
import { api } from "@/convex/_generated/api";
import { addCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function POST(request: NextRequest) {
  const convex = getConvexClient();
  try {
    console.log('🔵 [REGISTER-CONSULTANT API] Received request');
    
    const body = await request.json();
    console.log('📋 [REGISTER-CONSULTANT API] Request body:', JSON.stringify(body, null, 2));
    
    const { 
      firstName, 
      lastName, 
      email, 
      contactNumber, 
      domain, 
      consultantTitle,
      customTitle,
      bio,
      avatar,
      createdBy 
    } = body;

    console.log('🔍 [REGISTER-CONSULTANT API] Extracted fields:', {
      firstName,
      lastName,
      email,
      contactNumber,
      domain,
      consultantTitle,
      customTitle,
      bio,
      avatar,
      createdBy
    });

    // Check for required fields with detailed logging
    const requiredFields = { firstName, lastName, email, contactNumber, domain, consultantTitle, createdBy };
    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error('❌ [REGISTER-CONSULTANT API] Missing required fields:', missingFields);
      console.error('❌ [REGISTER-CONSULTANT API] Field values:', requiredFields);
      return addCorsHeaders(NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields,
          receivedFields: Object.keys(body)
        },
        { status: 400 }
      ), request);
    }

    console.log('✅ [REGISTER-CONSULTANT API] All required fields present');

    // Generate a temporary password for the consultant
    const temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    console.log('🔑 [REGISTER-CONSULTANT API] Generated temporary password');

    const actionArgs = {
      firstName,
      lastName,
      email,
      contactNumber,
      password: temporaryPassword,
      domain,
      consultantTitle,
      customTitle,
      bio,
      avatar,
      createdBy,
    };

    console.log('📤 [REGISTER-CONSULTANT API] Calling registerConsultantAction with args:', {
      ...actionArgs,
      password: '[REDACTED]'
    });

    const result = await convex.action(api.authActions.registerConsultantAction, actionArgs);

    console.log('📥 [REGISTER-CONSULTANT API] Action result:', result);

    return addCorsHeaders(NextResponse.json(result), request);
  } catch (error: unknown) {
    console.error('💥 [REGISTER-CONSULTANT API] Error occurred:', error);
    console.error('💥 [REGISTER-CONSULTANT API] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack'
    });

    if (error instanceof Error && error.message?.startsWith("EXISTING_USER:")) {
      const userId = error.message.split(":")[1];
      console.log('ℹ️ [REGISTER-CONSULTANT API] Handling EXISTING_USER case');
      return addCorsHeaders(NextResponse.json(
        { 
          error: "EXISTING_USER",
          userId,
          message: "A user with this email already exists. The consultant record has been created and linked to the existing user."
        },
        { status: 409 }
      ), request);
    }

    if (error instanceof Error && error.message?.startsWith("CONSULTANT_EXISTS:")) {
      const consultantError = error.message.split(":")[1];
      console.log('ℹ️ [REGISTER-CONSULTANT API] Handling CONSULTANT_EXISTS case');
      return addCorsHeaders(NextResponse.json(
        { 
          error: "CONSULTANT_EXISTS",
          message: consultantError
        },
        { status: 409 }
      ), request);
    }

    console.error('❌ [REGISTER-CONSULTANT API] Returning 400 error to client');
    return addCorsHeaders(NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Consultant registration failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 400 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}