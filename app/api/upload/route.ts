import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from "@/lib/convex-http";
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { cloudflareImagesClient } from '@/lib/cloudflare-images';
import { getR2Client, isImageFile, isDocumentFile, getContentType } from '@/lib/cloudflare-r2';
import { addCorsHeaders, handleCorsOptions } from '@/lib/cors';

async function getUserFromToken(token: string, convex: ReturnType<typeof getConvexClient>) {
  try {
    console.log('🔍 Getting user from token...');
    
    // Use the built-in getUserBySession query instead of manually finding sessions
    const user = await convex.query(api.auth.getUserBySession, { sessionToken: token });
    
    if (!user) {
      console.log('❌ No user found for session token');
      return null;
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    console.log('🔄 Starting image upload process...');

    // Get authentication from headers or cookies
    const authHeader = request.headers.get('authorization');
    const xSessionToken = request.headers.get('x-session-token');
    const cookieStore = request.cookies;
    const sessionCookie = cookieStore.get('sessionToken')?.value || cookieStore.get('session')?.value;

    console.log('🔍 Auth debugging:');
    console.log('  - Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'none');
    console.log('  - X-Session-Token header:', xSessionToken ? `${xSessionToken.substring(0, 20)}...` : 'none');
    console.log('  - SessionToken cookie:', sessionCookie ? `${sessionCookie.substring(0, 20)}...` : 'none');

    let token = '';

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('  - Using Bearer token from Authorization header');
    } else if (xSessionToken) {
      token = xSessionToken;
      console.log('  - Using token from X-Session-Token header');
    } else if (sessionCookie) {
      token = sessionCookie;
      console.log('  - Using token from cookies');
    }

    if (!token) {
      console.error('❌ No authentication token found');
      console.error('Available headers:', Object.fromEntries(request.headers.entries()));
      return addCorsHeaders(NextResponse.json({ error: 'Authentication required' }, { status: 401 }), request);
    }
    
    console.log(`🔑 Using token: ${token.substring(0, 10)}...`);

    // Get user from session
    const user = await getUserFromToken(token, convex);
    if (!user) {
      console.error('❌ Invalid session or user not found');
      return addCorsHeaders(NextResponse.json({ error: 'Invalid session' }, { status: 401 }), request);
    }

    console.log(`✅ Authenticated user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   User ID: ${user.id}`);

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('❌ No file provided in request');
      return addCorsHeaders(NextResponse.json({ error: 'No file provided' }, { status: 400 }), request);
    }

    console.log(`📁 Processing file: ${file.name} (${Math.round(file.size / 1024)} KB)`);

    // Determine file type and storage location
    const isImage = isImageFile(file.name);
    const isDocument = isDocumentFile(file.name);
    const storageType = isImage ? "image" : (isDocument ? "document" : "image"); // Default to image for unsupported types
    
    console.log(`📋 File classification: ${storageType} (isImage: ${isImage}, isDocument: ${isDocument})`);

    // Get categories from headers or form data
    let requestedCategories: string[] = [];
    const categoriesHeader = request.headers.get('x-categories');
    const categoriesFormData = formData.get('categories') as string;

    if (categoriesHeader) {
      try {
        requestedCategories = JSON.parse(categoriesHeader);
      } catch (e) {
        console.warn('Failed to parse categories from header:', e);
      }
    } else if (categoriesFormData) {
      try {
        requestedCategories = JSON.parse(categoriesFormData);
      } catch (e) {
        console.warn('Failed to parse categories from form data:', e);
      }
    }

    console.log(`🏷️ Requested Categories: ${requestedCategories.length > 0 ? requestedCategories.join(', ') : 'None'}`);

    // Validate that the categories belong to the user
    let validatedCategories: string[] = [];
    if (requestedCategories.length > 0) {
      try {
        console.log('🔍 Validating categories for user...');
        const userCategories = await convex.query(api.media.getMediaCategories, { userId: user.id });
        const userCategoryNames = new Set(userCategories.map(cat => cat.name));

        // Filter out any categories that don't belong to the user
        validatedCategories = requestedCategories.filter(catName => userCategoryNames.has(catName));

        if (validatedCategories.length < requestedCategories.length) {
          const invalidCategories = requestedCategories.filter(cat => !userCategoryNames.has(cat));
          console.warn(`⚠️ Filtered out invalid categories: ${invalidCategories.join(', ')}`);
        }

        console.log(`✅ Validated categories: ${validatedCategories.length > 0 ? validatedCategories.join(', ') : 'None'}`);
      } catch (error) {
        console.error('❌ Error validating categories:', error);
        // If validation fails, proceed without categories rather than failing the upload
        validatedCategories = [];
      }
    }

    // Check if this exact file already exists for this user
    try {
      console.log('🔍 Checking for existing media item...');
      
      // Convert file to buffer to get a consistent hash/identifier
      // const buffer = Buffer.from(await file.arrayBuffer());
      
      // Create a simple hash based on file content and name
      // const crypto = await import('crypto');
      // const hash = crypto.createHash('md5').update(buffer).update(file.name).digest('hex');
      // const tempUrl = `temp://${hash}`;
      
      // Check if we already have this file
      // Note: Skipping duplicate check for now as media API is not available in upload context
      const existingMedia = null;
      
      if (existingMedia) {
        console.log('📋 Duplicate file detected, returning existing URL');
        return NextResponse.json({
          success: true,
          url: 'existing-url',
          message: 'File already exists in your library'
        });
      }
    } catch (error) {
      console.warn('⚠️ Error checking for duplicates:', error);
      // Continue with upload if duplicate check fails
    }

    // Get user's companies to associate the media with a company
    const userCompanies = await convex.query(api.companies.getCompaniesByUser, { userId: user.id as Id<"users"> });
    if (!userCompanies || userCompanies.length === 0) {
      console.error('❌ User has no companies associated');
      return addCorsHeaders(NextResponse.json({ error: 'User must belong to a company to upload media' }, { status: 400 }), request);
    }
    const firstCompany = userCompanies[0];
    if (!firstCompany) {
      console.error('❌ No valid company found');
      return addCorsHeaders(NextResponse.json({ error: 'No valid company found' }, { status: 400 }), request);
    }
    const companyId = firstCompany._id;

    // Upload based on file type
    let uploadUrl: string;

    if (storageType === "image") {
      console.log('☁️ Uploading to Cloudflare Images...');
      uploadUrl = await cloudflareImagesClient.uploadImage(file, file.name);
      console.log(`✅ Cloudflare Images upload successful!`);
      console.log(`📸 Generated URL: ${uploadUrl}`);
    } else {
      console.log('📁 Uploading document to Cloudflare R2...');
      const r2Client = getR2Client();
      const buffer = Buffer.from(await file.arrayBuffer());
      uploadUrl = await r2Client.uploadDocument(buffer, file.name, file.type || getContentType(file.name));
      console.log(`✅ Cloudflare R2 upload successful!`);
      console.log(`📄 Generated URL: ${uploadUrl}`);
    }

    // Add to media library in Convex
    console.log('💾 Saving to media library...');
    const mediaId = await convex.mutation(api.media.add, {
      userId: user.id as Id<"users">,
      companyId: companyId,
      url: uploadUrl,
      filename: file.name,
      fileType: file.type || getContentType(file.name),
      fileSize: file.size,
      storageType: storageType,
      categories: validatedCategories.length > 0 ? validatedCategories : undefined,
    });

    console.log(`✅ Media library entry created: ${mediaId}`);
    console.log('🎉 Upload process completed successfully!');

    return addCorsHeaders(NextResponse.json({
      success: true,
      url: uploadUrl,
      mediaId: mediaId,
      filename: file.name,
      storageType: storageType,
      message: `${storageType === 'image' ? 'Image' : 'Document'} uploaded successfully`
    }), request);

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return addCorsHeaders(NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      }, 
      { status: 500 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}
