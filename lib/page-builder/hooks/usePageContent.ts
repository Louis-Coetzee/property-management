import { useCallback } from 'react';
import type { PageContent, PageSection } from '@/types/page-builder';

// ============================================================================
// Page Content Helpers
// ============================================================================

/**
 * Parse page content from JSON string
 */
export function parsePageContent(contentJson: string | null | undefined): PageContent | null {
  if (!contentJson) return null;

  try {
    const parsed = JSON.parse(contentJson);
    // Validate basic structure
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sections)) {
      return parsed as PageContent;
    }
    return null;
  } catch (error) {
    console.error('Failed to parse page content:', error);
    return null;
  }
}

/**
 * Stringify page content to JSON string
 */
export function stringifyPageContent(content: PageContent): string {
  return JSON.stringify(content);
}

/**
 * Create an empty page content structure
 */
export function createEmptyPageContent(): PageContent {
  return {
    sections: [],
    version: '1.0',
    lastModified: Date.now(),
  };
}

/**
 * Check if a page is using the page builder
 */
export function isPageBuilderPage(contentType: string | null | undefined): boolean {
  return contentType === 'pageBuilder';
}

// ============================================================================
// Section Helpers
// ============================================================================

/**
 * Generate a unique ID for a section
 */
export function generateSectionId(): string {
  return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new section with default values
 */
export function createSection(
  type: string,
  templateId: string,
  defaultContent: Record<string, any>,
  order: number
): PageSection {
  const now = Date.now();
  return {
    id: generateSectionId(),
    type: type as any,
    templateId,
    order,
    content: { ...defaultContent },
    settings: {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Reorder sections based on new order array
 */
export function reorderSections(
  sections: PageSection[],
  newOrder: Array<{ id: string; order: number }>
): PageSection[] {
  const sectionMap = new Map(sections.map((s) => [s.id, s]));

  const reordered = newOrder
    .map(({ id, order }) => {
      const section = sectionMap.get(id);
      if (section) {
        return { ...section, order, updatedAt: Date.now() };
      }
      return null;
    })
    .filter((s): s is PageSection => s !== null);

  // Add any sections not in the new order array
  const reorderedIds = new Set(reordered.map((s) => s.id));
  const remaining = sections.filter((s) => !reorderedIds.has(s.id));

  return [...reordered, ...remaining];
}

/**
 * Update a specific section's content and optionally settings
 */
export function updateSectionContent(
  sections: PageSection[],
  sectionId: string,
  content: Record<string, any>,
  settings?: Record<string, any>
): PageSection[] {
  console.log('[updateSectionContent] sectionId:', sectionId);
  console.log('[updateSectionContent] content:', content);
  console.log('[updateSectionContent] content.ctaText:', content.ctaText);
  
  return sections.map((section) => {
    if (section.id === sectionId) {
      console.log('[updateSectionContent] Found section, section.content:', section.content);
      
      // Start with the new content, filtering out undefined values
      const filteredContent: Record<string, any> = {};
      Object.keys(content).forEach(key => {
        if (content[key] !== undefined) {
          filteredContent[key] = content[key];
        }
      });
      
      // Merge with existing content (existing content serves as fallback)
      const mergedContent = { ...section.content, ...filteredContent };
      
      // If ctaText is undefined or empty in new content, remove all CTA-related keys
      if (filteredContent.ctaText === undefined || filteredContent.ctaText === '') {
        delete mergedContent.ctaText;
        delete mergedContent.ctaType;
        delete mergedContent.ctaLink;
        delete mergedContent.ctaPageId;
        delete mergedContent.ctaSectionId;
        delete mergedContent.ctaFormId;
      }
      
      const updated: PageSection = {
        ...section,
        content: mergedContent,
        updatedAt: Date.now(),
      };
      console.log('[updateSectionContent] Updated section.content:', updated.content);
      if (settings !== undefined) {
        updated.settings = settings;
      }
      return updated;
    }
    return section;
  });
}

/**
 * Delete a section from the sections array
 */
export function deleteSection(sections: PageSection[], sectionId: string): PageSection[] {
  return sections.filter((s) => s.id !== sectionId);
}

/**
 * Get the next order value for a new section
 */
export function getNextOrderValue(sections: PageSection[]): number {
  if (sections.length === 0) return 0;
  return Math.max(...sections.map((s) => s.order)) + 1;
}

// ============================================================================
// Custom Hook
// ============================================================================

interface UsePageContentOptions {
  contentJson: string | null | undefined;
  contentType: string | null | undefined;
}

interface UsePageContentReturn {
  isPageBuilder: boolean;
  pageContent: PageContent | null;
  sections: PageSection[];
  isEmpty: boolean;
  hasContent: boolean;
}

/**
 * Custom hook to work with page content
 */
export function usePageContent({ contentJson, contentType }: UsePageContentOptions): UsePageContentReturn {
  const isPageBuilder = isPageBuilderPage(contentType);
  const pageContent = isPageBuilder ? parsePageContent(contentJson) : null;
  const sections = pageContent?.sections ?? [];
  const isEmpty = sections.length === 0;
  const hasContent = !isEmpty;

  return {
    isPageBuilder,
    pageContent,
    sections,
    isEmpty,
    hasContent,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate page content structure
 */
export function validatePageContent(content: any): content is PageContent {
  return (
    content &&
    typeof content === 'object' &&
    Array.isArray(content.sections) &&
    content.version === '1.0' &&
    typeof content.lastModified === 'number'
  );
}

/**
 * Validate section structure
 */
export function validateSection(section: any): section is PageSection {
  return (
    section &&
    typeof section === 'object' &&
    typeof section.id === 'string' &&
    typeof section.type === 'string' &&
    typeof section.templateId === 'string' &&
    typeof section.order === 'number' &&
    typeof section.content === 'object' &&
    typeof section.createdAt === 'number' &&
    typeof section.updatedAt === 'number'
  );
}
