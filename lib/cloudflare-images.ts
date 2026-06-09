// Cloudflare API error type
interface CloudflareError {
  code: number;
  message: string;
}

// Cloudflare API message type
interface CloudflareMessage {
  code: number;
  message: string;
}

// Cloudflare Images API types
interface CloudflareImageUploadResponse {
  success: boolean;
  errors: CloudflareError[];
  messages: CloudflareMessage[];
  result?: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
}

interface CloudflareImageDeleteResponse {
  success: boolean;
  errors: CloudflareError[];
  messages: CloudflareMessage[];
}

// Environment variables with fallbacks
const env = {
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  CLOUDFLARE_DELIVERY_ACCOUNT_ID: process.env.CLOUDFLARE_DELIVERY_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_HASH || process.env.CLOUDFLARE_ACCOUNT_ID || '',
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || '',
  MIGRATION_BATCH_SIZE: parseInt(process.env.MIGRATION_BATCH_SIZE || '5'),
  MIGRATION_DELAY_MS: parseInt(process.env.MIGRATION_DELAY_MS || '1000'),
};

// Validation function
function validateCloudflareConfig(): boolean {
  return !!(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN);
}

function getCloudflareDeliveryUrl(): string {
  return `https://imagedelivery.net/${env.CLOUDFLARE_DELIVERY_ACCOUNT_ID}`;
}

// Cloudflare Images API client
export class CloudflareImagesClient {
  private accountId: string;
  private deliveryAccountId: string;
  private apiToken: string;
  private deliveryUrl: string;
  private baseUrl: string;

  constructor() {
    if (!validateCloudflareConfig()) {
      throw new Error('Cloudflare Images configuration is invalid. Please check your environment variables.');
    }

    this.accountId = env.CLOUDFLARE_ACCOUNT_ID;
    this.deliveryAccountId = env.CLOUDFLARE_DELIVERY_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = env.CLOUDFLARE_API_TOKEN;
    this.deliveryUrl = getCloudflareDeliveryUrl();
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`;
  }

  /**
   * Upload an image to Cloudflare Images
   */
  async uploadImage(file: File | Buffer, filename?: string): Promise<string> {
    try {
      const formData = new FormData();
      
      // Handle different file types properly
      if (file instanceof File) {
        formData.append('file', file);
      } else if (Buffer.isBuffer(file)) {
        // Detect the actual image format
        const detectedFormat = this.detectImageFormat(file);
        let mimeType = 'application/octet-stream';
        let finalFilename = filename || 'image.jpg';
        
        // Set proper MIME type based on detected format
        switch (detectedFormat) {
          case 'jpeg':
            mimeType = 'image/jpeg';
            finalFilename = finalFilename.replace(/\.[^.]+$/, '.jpg');
            break;
          case 'png':
            mimeType = 'image/png';
            finalFilename = finalFilename.replace(/\.[^.]+$/, '.png');
            break;
          case 'webp':
            mimeType = 'image/webp';
            finalFilename = finalFilename.replace(/\.[^.]+$/, '.webp');
            break;
          case 'gif':
            mimeType = 'image/gif';
            finalFilename = finalFilename.replace(/\.[^.]+$/, '.gif');
            break;
          case 'svg':
            mimeType = 'image/svg+xml';
            finalFilename = finalFilename.replace(/\.[^.]+$/, '.svg');
            break;
          default:
            // For unsupported formats like AVIF, try to upload as JPEG
            console.log(`⚠️  Unsupported format ${detectedFormat}, attempting to upload as JPEG`);
            mimeType = 'image/jpeg';
            finalFilename = finalFilename.replace(/\.[^.]+$/, '.jpg');
            break;
        }
        
        // Convert Buffer to Blob with correct MIME type
        const blob = new Blob([new Uint8Array(file)], { type: mimeType });
        formData.append('file', blob, finalFilename);
      } else {
        throw new Error('Invalid file type. Expected File or Buffer.');
      }

      // Add metadata if filename is provided
      if (filename) {
        formData.append('metadata', JSON.stringify({ filename }));
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare Images API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result: CloudflareImageUploadResponse = await response.json();

      if (!result.success || !result.result) {
        throw new Error(`Cloudflare Images upload failed: ${JSON.stringify(result.errors)}`);
      }

      // Return the public URL for the uploaded image
      // Try different variants to see which one works
      const imageId = result.result.id;
      console.log(`🎯 Available variants from Cloudflare:`, result.result.variants);
      
      // Use the first available variant or 'public' as fallback
      const variant = result.result.variants && result.result.variants.length > 0 
        ? result.result.variants[0].split('/').pop() 
        : 'public';
      
      console.log(`🔄 Using variant: ${variant}`);
      return this.getImageUrl(imageId, variant);
    } catch (error) {
      console.error('Error uploading to Cloudflare Images:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Cloudflare Images
   */
  async deleteImage(imageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare Images API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result: CloudflareImageDeleteResponse = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting from Cloudflare Images:', error);
      throw error;
    }
  }

  /**
   * Get the public URL for an image
   */
  getImageUrl(imageId: string, variant: string = 'public'): string {
    // Use the delivery account ID for the URL, not the API account ID
    const url = `https://imagedelivery.net/${this.deliveryAccountId}/${imageId}/${variant}`;
    console.log(`🔗 Generated image URL: ${url}`);
    console.log(`📊 URL components: deliveryAccountId=${this.deliveryAccountId}, imageId=${imageId}, variant=${variant}`);
    return url;
  }

  /**
   * Extract image ID from a Cloudflare Images URL
   */
  extractImageIdFromUrl(url: string): string | null {
    const match = url.match(/\/([a-f0-9-]+)\/public$/);
    return match ? match[1] : null;
  }

  /**
   * Check if a URL is a Cloudflare Images URL
   */
  isCloudflareImageUrl(url: string): boolean {
    return url.includes('imagedelivery.net') || url.includes(this.deliveryUrl);
  }

  /**
   * Detect image format from buffer magic numbers
   */
  private detectImageFormat(buffer: Buffer): string {
    // Check magic numbers to detect actual format
    if (buffer.length < 12) return 'unknown';
    
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'jpeg';
    }
    
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'png';
    }
    
    // WebP: RIFF ... WEBP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'webp';
    }
    
    // GIF: GIF87a or GIF89a
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'gif';
    }
    
    // SVG: Look for XML declaration or <svg
    const start = buffer.slice(0, 100).toString('utf8');
    if (start.includes('<?xml') || start.includes('<svg')) {
      return 'svg';
    }
    
    return 'unknown';
  }
}

// Export singleton instance (lazy — only throws when actually used without config)
let _client: CloudflareImagesClient | null = null;
export function getCloudflareImagesClient(): CloudflareImagesClient {
  if (!_client) _client = new CloudflareImagesClient();
  return _client;
}

const _noop: any = {};
export const cloudflareImagesClient: CloudflareImagesClient = validateCloudflareConfig()
  ? new CloudflareImagesClient()
  : new Proxy(_noop, {
      get(_, prop) {
        if (prop === 'getOptimizedImageProps') return (_src: string, alt = 'Image') => ({ src: '/placeholder-image.svg', alt, unoptimized: true });
        if (prop === 'getCloudflareImageUrl') return (_id: string, _variant = 'public') => null;
        return () => { throw new Error('Cloudflare Images not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.'); };
      },
    });

// Convenient wrapper functions
export async function uploadImageToCloudflare(file: File | Buffer, filename?: string): Promise<string> {
  return await cloudflareImagesClient.uploadImage(file, filename);
}

export async function deleteImageFromCloudflare(imageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await cloudflareImagesClient.deleteImage(imageId);
    return { success };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

const CLOUDFLARE_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH || env.CLOUDFLARE_DELIVERY_ACCOUNT_ID || '';

export function getCloudflareImageUrl(imageIdOrUrl: string | null | undefined, variant: string = 'public'): string | null {
  if (!imageIdOrUrl) return null;
  if (imageIdOrUrl.startsWith('http')) {
    if (imageIdOrUrl.includes('imagedelivery.net')) return imageIdOrUrl;
    return imageIdOrUrl;
  }
  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageIdOrUrl}/${variant}`;
}

export function getOptimizedImageProps(
  src: string | null | undefined,
  alt: string = 'Image',
  variant: string = 'public'
) {
  const imageUrl = getCloudflareImageUrl(src, variant);
  return {
    src: imageUrl || '/placeholder-image.svg',
    alt,
    unoptimized: true,
    onError: (e: any) => {
      e.target.src = '/placeholder-image.svg';
    }
  };
}