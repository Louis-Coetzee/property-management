import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { uploadAISectionToR2 } from '@/lib/cloudflare-r2';

interface UploadCustomCodeRequest {
  code: string;
  sectionName: string;
  codeFileId?: string;
}

interface UploadCustomCodeResponse {
  success: boolean;
  codeFileId?: string;
  r2Url?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[CustomCode] Starting upload...');
    const body = await request.json();
    console.log('[CustomCode] Request body:', { codeLength: body.code?.length, sectionName: body.sectionName });
    
    const { code, sectionName } = body as UploadCustomCodeRequest;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Code is required' } as UploadCustomCodeResponse,
        { status: 400 }
      );
    }

    if (!sectionName || !sectionName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Section name is required' } as UploadCustomCodeResponse,
        { status: 400 }
      );
    }

    // Always generate a new unique ID to avoid caching issues
    const codeFileId = `custom-${Date.now()}-${randomUUID().substring(0, 8)}`;
    console.log('[CustomCode] Uploading with fileId:', codeFileId);

    const { publicUrl: r2Url } = await uploadAISectionToR2(codeFileId, code.trim());
    console.log('[CustomCode] Upload successful, URL:', r2Url);

    return NextResponse.json({
      success: true,
      codeFileId,
      r2Url,
    });
  } catch (error) {
    console.error('[CustomCode] Error uploading custom code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload custom code' } as UploadCustomCodeResponse,
      { status: 500 }
    );
  }
}
