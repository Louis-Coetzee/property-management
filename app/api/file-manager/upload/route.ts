import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { cloudflareImagesClient } from '@/lib/cloudflare-images';
import { getR2Client, isImageFile, isDocumentFile, getContentType } from '@/lib/cloudflare-r2';
import { addCorsHeaders, handleCorsOptions } from '@/lib/cors';

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

// Helper function to get user from session token
async function getUserFromToken(token: string) {
  try {
    const user = await convex.query(api.auth.getUserBySession, { sessionToken: token });
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 File Manager: Starting file upload...');

    // Get authentication from headers or cookies
    const authHeader = request.headers.get('authorization');
    const xSessionToken = request.headers.get('x-session-token');
    const cookieStore = request.cookies;
    const sessionCookie = cookieStore.get('sessionToken')?.value || cookieStore.get('session')?.value;

    let token = '';
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (xSessionToken) {
      token = xSessionToken;
    } else if (sessionCookie) {
      token = sessionCookie;
    }

    if (!token) {
      return addCorsHeaders(NextResponse.json({ error: 'Authentication required' }, { status: 401 }), request);
    }

    // Get user from session
    const user = await getUserFromToken(token);
    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Invalid session' }, { status: 401 }), request);
    }

    console.log(`✅ Authenticated user: ${user.firstName} ${user.lastName}`);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;
    const folderId = formData.get('folderId') as string | null;
    const alt = formData.get('alt') as string | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const tagsJson = formData.get('tags') as string | null;

    if (!file) {
      return addCorsHeaders(NextResponse.json({ error: 'No file provided' }, { status: 400 }), request);
    }

    if (!companyId) {
      return addCorsHeaders(NextResponse.json({ error: 'Company ID is required' }, { status: 400 }), request);
    }

    console.log(`📁 Processing file: ${file.name} (${Math.round(file.size / 1024)} KB)`);

    // Determine file type and storage location
    const isImage = isImageFile(file.name);
    const isDocument = isDocumentFile(file.name);
    const storageType = isImage ? "cloudflare_images" : (isDocument ? "cloudflare_r2" : "cloudflare_r2");

    let uploadUrl: string;
    let fileId: string;

    // Get image dimensions for images
    let width: number | undefined;
    let height: number | undefined;
    let duration: number | undefined;

    if (isImage) {
      // Get image dimensions
      const dimensions = await getImageDimensions(file);
      width = dimensions.width;
      height = dimensions.height;

      console.log('☁️ Uploading to Cloudflare Images...');
      uploadUrl = await cloudflareImagesClient.uploadImage(file, file.name);
      fileId = cloudflareImagesClient.extractImageIdFromUrl(uploadUrl) || uploadUrl;
    } else {
      console.log('📁 Uploading document to Cloudflare R2...');
      const r2Client = getR2Client();
      const buffer = Buffer.from(await file.arrayBuffer());
      uploadUrl = await r2Client.uploadDocument(buffer, file.name, file.type || getContentType(file.name));
      fileId = uploadUrl;
    }

    // Parse tags
    let tags: string[] | undefined;
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
      } catch (e) {
        console.warn('Failed to parse tags:', e);
      }
    }

    // Determine file type category
    let fileType = 'document';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.startsWith('video/')) fileType = 'video';
    else if (file.type.startsWith('audio/')) fileType = 'audio';
    else if (file.name.endsWith('.zip') || file.name.endsWith('.rar') || file.name.endsWith('.7z')) fileType = 'archive';

    // Save to media library
    console.log('💾 Saving to media library...');
    const mediaId = await convex.mutation(api.fileManager.createFile, {
      companyId: companyId as Id<'companies'>,
      userId: user.id as Id<'users'>,
      url: uploadUrl,
      filename: file.name,
      originalFilename: file.name,
      fileType,
      fileSize: file.size,
      storageType,
      mimeType: file.type,
      width,
      height,
      duration,
      folderId: folderId ? (folderId as Id<'mediaFolders'>) : undefined,
      alt: alt || undefined,
      title: title || undefined,
      description: description || undefined,
      tags: tags || undefined,
    });

    console.log(`✅ File uploaded successfully: ${mediaId}`);

    return addCorsHeaders(NextResponse.json({
      success: true,
      url: uploadUrl,
      fileId: mediaId,
      filename: file.name,
      fileType,
      storageType,
      message: 'File uploaded successfully'
    }), request);

  } catch (error) {
    console.error('❌ Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return addCorsHeaders(NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    ), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

// Helper function to get image dimensions
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  // For server-side, we'll use a different approach
  // Create a buffer and detect dimensions from the image data
  const buffer = Buffer.from(await file.arrayBuffer());

  // Simple PNG dimension detection
  if (buffer.toString('ascii', 1, 4) === 'PNG') {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  // Simple JPEG dimension detection
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let i = 2;
    while (i < buffer.length) {
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xC0) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        return { width, height };
      }
      i += 2 + buffer.readUInt16BE(i + 2);
    }
  }

  // Simple WebP dimension detection
  if (buffer.toString('ascii', 8, 12) === 'VP8 ') {
    const width = buffer.readUInt16LE(26);
    const height = buffer.readUInt16LE(28);
    return { width, height };
  }

  if (buffer.toString('ascii', 12, 16) === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    const width = (bits & 0x3FFF) + 1;
    const height = ((bits >> 14) & 0x3FFF) + 1;
    return { width, height };
  }

  if (buffer.toString('ascii', 12, 16) === 'VP8X') {
    const width = buffer.readUInt8(21) | (buffer.readUInt8(22) << 8) | (buffer.readUInt8(23) << 16) + 1;
    const height = buffer.readUInt8(24) | (buffer.readUInt8(25) << 8) | (buffer.readUInt8(26) << 16) + 1;
    return { width, height };
  }

  // Default dimensions if we can't detect
  return { width: 0, height: 0 };
}
