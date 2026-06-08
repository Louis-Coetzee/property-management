import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { uploadAISectionToR2 } from '@/lib/cloudflare-r2';

interface GenerateSectionRequest {
  prompt: string;
}

interface GenerateSectionResponse {
  success: boolean;
  htmlCode?: string;
  sectionFileId?: string;
  r2Url?: string;
  sectionName: string;
  error?: string;
  details?: string;
  errorType?: string;
  endpoint?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json() as GenerateSectionRequest;

    console.log('[DEBUG] Received prompt:', prompt?.substring(0, 50));

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Prompt must be at least 10 characters' } as GenerateSectionResponse,
        { status: 400 }
      );
    }

    // Get configuration from environment variables
    // Prioritize ZAI_API_URL for z.ai endpoint
    const apiKey = process.env.ZAI_API_KEY || process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
    const baseURL = process.env.ZAI_API_URL || process.env.ANTHROPIC_BASE_URL;
    // Use a text-only model - glm-4-flash is faster and text-only
    const model = process.env.AI_MODEL || 'glm-4-flash';

    // Debug logging (mask sensitive values)
    console.log('[DEBUG] ZAI_API_KEY set:', !!process.env.ZAI_API_KEY);
    console.log('[DEBUG] AI_API_KEY set:', !!process.env.AI_API_KEY);
    console.log('[DEBUG] ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY);
    console.log('[DEBUG] ZAI_API_URL:', process.env.ZAI_API_URL || 'not set');
    console.log('[DEBUG] ANTHROPIC_BASE_URL:', process.env.ANTHROPIC_BASE_URL || 'not set');
    console.log('[DEBUG] AI_MODEL:', model);
    console.log('[DEBUG] Final API key present:', !!apiKey);
    console.log('[DEBUG] Final baseURL:', baseURL || 'not set (will use default)');

    if (!apiKey) {
      console.error('[ERROR] AI API key not configured');
      return NextResponse.json(
        { success: false, error: 'AI API key not configured' } as GenerateSectionResponse,
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert web developer and designer. You generate clean, modern, and professional HTML sections using Tailwind CSS.

CRITICAL RULES:
1. Generate a COMPLETE, STANDALONE HTML section - NOT a full page, just ONE section
2. Use ONLY Tailwind CSS classes for ALL styling (assume Tailwind is available in the project)
3. Make it FULLY MOBILE RESPONSIVE - use responsive classes (sm:, md:, lg:, xl:, 2xl:)
4. The section must be 100% SELF-CONTAINED with its own colors, typography, spacing, and design
5. DO NOT reference or integrate with existing website sections - this is a custom standalone piece
6. Include ALL content: headings, paragraphs, buttons, images (use placeholder URLs like https://images.unsplash.com/...)
7. Use modern, professional color palettes (gradients, vibrant accent colors, etc.)
8. Add hover effects, transitions, and subtle animations using Tailwind classes
9. Use semantic HTML elements (section, header, nav, main, article, etc.)
10. The output MUST be valid HTML that can be inserted directly into a page

OUTPUT FORMAT (JSON):
{
  "htmlCode": "<section class='...'>...your complete HTML section...</section>",
  "sectionName": "Descriptive Name"
}

IMPORTANT: The htmlCode value must be a STRING containing HTML, not another JSON object. Do not escape quotes inside the HTML - use single quotes for HTML attributes to avoid escaping issues.`;

    // Construct the API URL - handle the base URL properly
    // Z.AI API endpoint format: https://api.z.ai/api/paas/v4/chat/completions
    // Or for coding plan: https://api.z.ai/api/coding/paas/v4/chat/completions
    let apiEndpoint: string;
    let isOpenAIStyle = false;

    if (baseURL) {
      let cleanBase = baseURL.replace(/\/$/, '');

      // z.ai uses OpenAI-style format
      isOpenAIStyle = true;

      // Strip any existing path segments to get the base
      // ZAI_API_URL should be the base like https://api.z.ai or https://api.z.ai/api/coding/paas/v4
      // If it already includes /paas/v4 or /coding/paas/v4, use it as-is
      if (!cleanBase.includes('/paas/') && !cleanBase.includes('/coding/')) {
        // Default to the coding endpoint if no specific path provided
        cleanBase = `${cleanBase}/api/coding/paas/v4`;
      }

      // If URL already ends with /chat/completions, use it directly
      if (cleanBase.endsWith('/chat/completions')) {
        apiEndpoint = cleanBase;
      }
      // Default: append /chat/completions
      else {
        apiEndpoint = `${cleanBase}/chat/completions`;
      }
    } else {
      apiEndpoint = 'https://api.anthropic.com/v1/messages';
      isOpenAIStyle = false;
    }

    console.log('[DEBUG] Base URL:', baseURL);
    console.log('[DEBUG] Constructed endpoint:', apiEndpoint);
    console.log('[DEBUG] API style:', isOpenAIStyle ? 'OpenAI' : 'Anthropic');

    console.log('[DEBUG] Calling AI API endpoint:', apiEndpoint);
    console.log('[DEBUG] Request model:', model);

    // Prepare request body based on API style
    const requestBody = isOpenAIStyle
      ? {
          model: model,
          max_tokens: 4096,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: `Generate a ${prompt}. Make it beautiful, modern, and professional. Use gradient backgrounds, modern colors, and include hover effects. Ensure it works perfectly on mobile, desktop, and tablet screens.`,
            },
          ],
        }
      : {
          model: model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Generate a ${prompt}. Make it beautiful, modern, and professional. Use gradient backgrounds, modern colors, and include hover effects. Ensure it works perfectly on mobile, desktop, and tablet screens.`,
            },
          ],
        };

    // Prepare headers based on API style
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (isOpenAIStyle) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    // Make direct fetch call to the API
    let response: Response;
    try {
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
      console.log('[DEBUG] API response status:', response.status);
    } catch (fetchError) {
      console.error('[ERROR] Fetch failed:', fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      const errorCause = fetchError instanceof Error && 'cause' in fetchError ? fetchError.cause : '';
      console.error('[ERROR] Fetch error cause:', errorCause);
      return NextResponse.json(
        {
          success: false,
          error: `Fetch failed: ${errorMessage}`,
          details: String(errorCause),
        } as GenerateSectionResponse,
        { status: 500 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR] AI API error:', response.status, errorText);
      console.error('[ERROR] Requested URL:', apiEndpoint);

      // Check for image/vision related errors
      if (errorText.includes('image') || errorText.includes('vision') || errorText.includes('Screenshot')) {
        return NextResponse.json(
          {
            success: false,
            error: 'The AI model does not support image input. Please use a text-only prompt.',
            details: errorText,
          } as GenerateSectionResponse,
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `AI API error: ${response.status}`,
          details: errorText,
          endpoint: apiEndpoint,
        } as GenerateSectionResponse,
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('[DEBUG] API response data:', JSON.stringify(data).substring(0, 500));

    // Check for z.ai error response format
    if (data.success === false || data.code === 500) {
      console.error('[ERROR] z.ai API error:', data.msg || data);
      return NextResponse.json(
        {
          success: false,
          error: `z.ai API error: ${data.msg || 'Unknown error'}`,
          details: JSON.stringify(data),
          endpoint: apiEndpoint,
        } as GenerateSectionResponse,
        { status: 500 }
      );
    }

    // Extract the text content from the response (handle both OpenAI and Anthropic formats)
    let responseText = '';
    if (isOpenAIStyle) {
      // OpenAI format: choices[0].message.content
      responseText = data.choices?.[0]?.message?.content || '';
    } else {
      // Anthropic format: content[0].text
      const content = data.content?.[0];
      responseText = content?.text || '';
    }

    console.log('[DEBUG] Raw response text:', responseText.substring(0, 500));

    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('[DEBUG] Raw response text:', responseText.substring(0, 1000));

    // Parse the JSON response - try JSON.parse first (handles escaping properly)
    let htmlCode = '';
    let sectionName = '';

    try {
      // Try to find and parse the JSON object in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Handle case where htmlCode might be an object or nested JSON
        if (parsed.htmlCode) {
          if (typeof parsed.htmlCode === 'object') {
            htmlCode = JSON.stringify(parsed.htmlCode);
            console.warn('[WARN] htmlCode was returned as object, converting to string');
          } else if (typeof parsed.htmlCode === 'string') {
            // Check if htmlCode contains another JSON object
            if (parsed.htmlCode.trim().startsWith('{') && parsed.htmlCode.includes('"htmlCode"')) {
              try {
                const nested = JSON.parse(parsed.htmlCode);
                htmlCode = nested.htmlCode || parsed.htmlCode;
              } catch {
                htmlCode = parsed.htmlCode;
              }
            } else {
              htmlCode = parsed.htmlCode;
            }
          }
        }
        sectionName = parsed.sectionName || '';
        console.log('[DEBUG] Successfully parsed JSON, htmlCode length:', htmlCode.length);
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      
      // Fallback: extract section name
      const nameMatch = responseText.match(/"sectionName"\s*:\s*"([^"]*)"/);
      if (nameMatch && nameMatch[1]) {
        sectionName = nameMatch[1];
      }
      
      // Try to find htmlCode - look for the property and capture everything until the next property or closing brace
      const htmlCodeStart = responseText.indexOf('"htmlCode"');
      if (htmlCodeStart !== -1) {
        const afterProperty = responseText.substring(htmlCodeStart + 10);
        const colonIndex = afterProperty.indexOf(':');
        const quoteStart = afterProperty.indexOf('"', colonIndex);
        if (quoteStart !== -1) {
          const afterQuote = afterProperty.substring(quoteStart + 1);
          // Find the closing quote (not escaped)
          let endIndex = 0;
          for (let i = 0; i < afterQuote.length; i++) {
            if (afterQuote[i] === '"' && (i === 0 || afterQuote[i-1] !== '\\')) {
              endIndex = i;
              break;
            }
          }
          if (endIndex > 0) {
            htmlCode = afterQuote.substring(0, endIndex);
          }
        }
      }
    }

    // If we still don't have HTML, use the whole response
    if (!htmlCode && responseText) {
      htmlCode = responseText;
    }

    // Basic sanitization - remove script tags and event handlers
    const sanitizedHtml = htmlCode
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    console.log('[DEBUG] Extracted htmlCode length:', sanitizedHtml.length);
    console.log('[DEBUG] Extracted sectionName:', sectionName);

    const finalSectionName = sectionName || prompt.substring(0, 40).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'AI Section';

    const sectionFileId = `ai-${Date.now()}-${randomUUID().substring(0, 8)}`;

    console.log('[DEBUG] Uploading AI section to R2...');
    const { publicUrl: r2Url } = await uploadAISectionToR2(sectionFileId, sanitizedHtml);
    console.log('[DEBUG] AI section uploaded to R2:', r2Url);

    return NextResponse.json({
      success: true,
      htmlCode: sanitizedHtml,
      sectionFileId,
      r2Url,
      sectionName: finalSectionName.charAt(0).toUpperCase() + finalSectionName.slice(1),
    } as GenerateSectionResponse);
  } catch (error) {
    console.error('[ERROR] AI generation error:', error);
    console.error('[ERROR] Error type:', error?.constructor?.name);

    if (error instanceof Error) {
      console.error('[ERROR] Error message:', error.message);
      console.error('[ERROR] Error stack:', error.stack);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorType: error.constructor.name,
        } as GenerateSectionResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate section. Please try again.' } as GenerateSectionResponse,
      { status: 500 }
    );
  }
}
