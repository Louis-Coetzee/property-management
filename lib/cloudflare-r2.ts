// Cloudflare R2 API client for document storage

// Environment variables for R2
const r2Env = {
  CLOUDFLARE_R2_ACCOUNT_ID: process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '',
  CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'media-documents',
  CLOUDFLARE_R2_PUBLIC_DOMAIN: process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || '',
};

// File type detection
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.ico'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(extension);
}

export function isDocumentFile(filename: string): boolean {
  const documentExtensions = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.rtf', '.csv', '.zip', '.rar', '.7z',
    '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv',
    '.json', '.xml', '.md'
  ];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return documentExtensions.includes(extension);
}

export function getContentType(filename: string): string {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  const contentTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf',
    '.csv': 'text/csv',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.md': 'text/markdown'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

// Validate R2 configuration
function validateR2Config(): boolean {
  const isValid = !!(
    r2Env.CLOUDFLARE_R2_ACCOUNT_ID &&
    r2Env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    r2Env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    r2Env.CLOUDFLARE_R2_BUCKET_NAME &&
    r2Env.CLOUDFLARE_R2_PUBLIC_DOMAIN
  );
  console.log('[R2] Config validation:', { 
    hasAccountId: !!r2Env.CLOUDFLARE_R2_ACCOUNT_ID,
    hasAccessKey: !!r2Env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    hasSecretKey: !!r2Env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    hasBucket: !!r2Env.CLOUDFLARE_R2_BUCKET_NAME,
    hasPublicDomain: !!r2Env.CLOUDFLARE_R2_PUBLIC_DOMAIN,
    isValid
  });
  return isValid;
}


export class CloudflareR2Client {
  private accountId: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private bucketName: string;
  private publicDomain: string;
  private endpoint: string;

  constructor() {
    if (!validateR2Config()) {
      throw new Error('Cloudflare R2 configuration is incomplete. Please set CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME environment variables.');
    }

    this.accountId = r2Env.CLOUDFLARE_R2_ACCOUNT_ID;
    this.accessKeyId = r2Env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    this.secretAccessKey = r2Env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.bucketName = r2Env.CLOUDFLARE_R2_BUCKET_NAME;
    this.publicDomain = r2Env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
    this.endpoint = `https://${this.accountId}.r2.cloudflarestorage.com`;
  }

  async uploadDocument(file: Buffer, filename: string, contentType?: string): Promise<string> {
    try {
      const actualContentType = contentType || getContentType(filename);
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const key = `documents/${timestamp}-${sanitizedFilename}`;
      
      // Use proper S3-compatible API with AWS SDK v3 style
      const AWS = await import('@aws-sdk/client-s3');
      const { S3Client, PutObjectCommand } = AWS;
      
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: actualContentType,
        ContentLength: file.length,
      };
      
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      // Construct the public URL
      const publicUrl = this.publicDomain 
        ? `https://${this.publicDomain}/${key}`
        : `${this.endpoint}/${this.bucketName}/${key}`;

      return publicUrl;
    } catch (error) {
      console.error('Error uploading to R2:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload document: ${errorMessage}`);
    }
  }

  async deleteDocument(url: string): Promise<boolean> {
    try {
      // Extract key from URL
      const key = this.extractKeyFromUrl(url);
      if (!key) {
        throw new Error('Invalid document URL');
      }

      // Use proper S3-compatible API with AWS SDK v3 style
      const AWS = await import('@aws-sdk/client-s3');
      const { S3Client, DeleteObjectCommand } = AWS;
      
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
      
      const deleteParams = {
        Bucket: this.bucketName,
        Key: key,
      };
      
      const command = new DeleteObjectCommand(deleteParams);
      await s3Client.send(command);

      return true;
    } catch (error) {
      console.error('Error deleting from R2:', error);
      return false;
    }
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      // Handle both public domain and direct R2 URLs
      if (this.publicDomain && url.includes(this.publicDomain)) {
        return url.split(`https://${this.publicDomain}/`)[1];
      } else if (url.includes(this.endpoint)) {
        return url.split(`${this.endpoint}/${this.bucketName}/`)[1];
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Create singleton instance
let r2ClientInstance: CloudflareR2Client | null = null;

export function getR2Client(): CloudflareR2Client {
  if (!r2ClientInstance) {
    r2ClientInstance = new CloudflareR2Client();
  }
  return r2ClientInstance;
}

export function generateAISectionKey(sectionFileId: string): string {
  return `ai-sections/${sectionFileId}.html`;
}

export function getAISectionPublicUrl(sectionFileId: string): string {
  let publicDomain = r2Env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
  if (!publicDomain) {
    throw new Error('CLOUDFLARE_R2_PUBLIC_DOMAIN is not configured');
  }
  if (publicDomain.startsWith('https://')) {
    publicDomain = publicDomain.replace('https://', '');
  }
  return `https://${publicDomain}/ai-sections/${sectionFileId}.html`;
}

export async function uploadAISectionToR2(
  sectionFileId: string,
  htmlCode: string
): Promise<{ key: string; publicUrl: string }> {
  console.log('[R2] uploadAISectionToR2 called with:', { sectionFileId, codeLength: htmlCode.length });
  
  if (!validateR2Config()) {
    throw new Error('Cloudflare R2 configuration is incomplete');
  }

  const key = generateAISectionKey(sectionFileId);
  const endpoint = `https://${r2Env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  console.log('[R2] Uploading to:', { endpoint, bucket: r2Env.CLOUDFLARE_R2_BUCKET_NAME, key });

  const AWS = await import('@aws-sdk/client-s3');
  const { S3Client, PutObjectCommand } = AWS;

  const s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: r2Env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: r2Env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });

  const command = new PutObjectCommand({
    Bucket: r2Env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    Body: htmlCode,
    ContentType: 'text/html; charset=utf-8',
    CacheControl: 'no-cache, no-store, must-revalidate',
  });

  console.log('[R2] Sending command to R2...');
  await s3Client.send(command);
  console.log('[R2] Upload complete!');

  const publicUrl = getAISectionPublicUrl(sectionFileId);
  console.log('[R2] Public URL:', publicUrl);

  return {
    key,
    publicUrl,
  };
}

export async function deleteAISectionFromR2(sectionFileId: string): Promise<boolean> {
  if (!validateR2Config()) {
    return false;
  }

  const key = generateAISectionKey(sectionFileId);
  const endpoint = `https://${r2Env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  try {
    const AWS = await import('@aws-sdk/client-s3');
    const { S3Client, DeleteObjectCommand } = AWS;

    const s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: r2Env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: r2Env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
    });

    const command = new DeleteObjectCommand({
      Bucket: r2Env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting AI section from R2:', error);
    return false;
  }
}
