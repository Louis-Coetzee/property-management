import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { deleteImageFromCloudflare } from '@/lib/cloudflare-images';
import { getR2Client } from '@/lib/cloudflare-r2';

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Delete image API called');

    // Get session token from cookies or headers
    const cookieStore = await cookies();
    let sessionToken = cookieStore.get('sessionToken')?.value ||
                       cookieStore.get('session')?.value ||
                       cookieStore.get('session_token')?.value;

    // If no cookie found, try headers
    if (!sessionToken) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        sessionToken = authHeader.substring(7);
      } else {
        sessionToken = request.headers.get("x-session-token") || undefined;
      }
    }

    if (!sessionToken) {
      console.log('❌ No session token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const user = await convex.query(api.auth.getUserBySession, {
      sessionToken: sessionToken
    });

    if (!user) {
      console.log('❌ User not found for session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`👤 Authenticated user: ${user.email} (${user.id})`);

    // Get mediaId and forceDelete from request body
    const { mediaId, forceDelete } = await request.json();

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
    }

    console.log(`🗑️ Attempting to delete media item: ${mediaId}${forceDelete ? ' (force delete)' : ''}`);

    // Call the media remove mutation to check permissions and get Cloudflare image ID
    const deleteResult = await convex.mutation(api.media.remove, {
      mediaId: mediaId as Id<"mediaLibrary">,
      requestingUserId: user.id as Id<"users">,
      forceDelete: forceDelete || false
    });

    if (!deleteResult.success) {
      console.log('❌ Database deletion failed:', deleteResult.reason);
      return NextResponse.json({ 
        error: deleteResult.reason || 'Failed to delete from database',
        usageLocations: deleteResult.usageLocations 
      }, { status: 400 });
    }

    console.log('✅ Database deletion successful');

    // Delete from appropriate Cloudflare service based on storage type
    const storageType = deleteResult.storageType || "image";
    
    if (storageType === "image" && deleteResult.cloudflareImageId) {
      console.log(`☁️ Deleting image from Cloudflare Images: ${deleteResult.cloudflareImageId}`);
      
      try {
        const cloudflareResult = await deleteImageFromCloudflare(deleteResult.cloudflareImageId);
        
        if (cloudflareResult.success) {
          console.log('✅ Cloudflare Images deletion successful');
        } else {
          console.warn('⚠️ Cloudflare Images deletion failed but database deletion succeeded:', cloudflareResult.error);
        }
      } catch (cloudflareError) {
        console.warn('⚠️ Cloudflare Images deletion error (but database deletion succeeded):', cloudflareError);
      }
    } else if (storageType === "document" && deleteResult.mediaItem?.url) {
      console.log(`📁 Deleting document from Cloudflare R2: ${deleteResult.mediaItem.url}`);
      
      try {
        const r2Client = getR2Client();
        const r2Result = await r2Client.deleteDocument(deleteResult.mediaItem.url);
        
        if (r2Result) {
          console.log('✅ Cloudflare R2 deletion successful');
        } else {
          console.warn('⚠️ Cloudflare R2 deletion failed but database deletion succeeded');
        }
      } catch (r2Error) {
        console.warn('⚠️ Cloudflare R2 deletion error (but database deletion succeeded):', r2Error);
      }
    } else {
      console.warn(`⚠️ No deletion ID found for ${storageType}, skipping cloud storage deletion`);
    }

    return NextResponse.json({
      success: true,
      message: `${storageType === 'image' ? 'Image' : 'Document'} deleted successfully`,
      storageType: storageType,
      deletedItem: deleteResult.mediaItem
    });

  } catch (error: unknown) {
    console.error('❌ Delete image API error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to delete image'
    }, { status: 500 });
  }
}