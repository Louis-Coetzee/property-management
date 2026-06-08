/**
 * AI-Generated Sections Registry
 *
 * This module manages AI-generated sections. Each generated section
 * is stored in the Convex database and can be dynamically rendered.
 */

import type { AISectionContent, PageSection, CustomCodeContent } from '@/types/page-builder';

/**
 * Generates a unique section ID for AI-generated sections
 */
export function generateAISectionId(): string {
  return `ai-section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique section ID for custom code sections
 */
export function generateCustomCodeId(): string {
  return `custom-code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a new AI-generated section object
 */
export function createAISection(
  content: AISectionContent,
  order: number
): PageSection {
  const now = Date.now();
  return {
    id: generateAISectionId(),
    type: 'ai-generated',
    templateId: 'ai-generated-custom',
    order,
    content: content,
    settings: {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates a new custom code section object
 */
export function createCustomCodeSection(
  content: CustomCodeContent,
  order: number
): PageSection {
  const now = Date.now();
  return {
    id: generateCustomCodeId(),
    type: 'custom-code',
    templateId: 'custom-code-custom',
    order,
    content: content,
    settings: {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validates AI-generated HTML code for safety
 */
export function validateAISectionCode(htmlCode: string): { valid: boolean; error?: string } {
  // Basic validation - check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["']?\s*javascript:/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(htmlCode)) {
      return { valid: false, error: 'Code contains potentially unsafe content' };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes AI-generated HTML by removing potentially dangerous elements
 */
export function sanitizeAISectionCode(htmlCode: string): string {
  // Remove script tags
  let sanitized = htmlCode.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove data: URLs in src/href attributes
  sanitized = sanitized.replace(/(src|href)\s*=\s*["']data:[^"']*["']/gi, '');

  return sanitized.trim();
}

/**
 * Extracts a section name from the user prompt
 */
export function extractSectionName(prompt: string): string {
  // Take first 50 chars, remove special characters
  let name = prompt.substring(0, 50);
  name = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();

  // Capitalize first letter
  if (name.length > 0) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return name || 'AI Section';
}
