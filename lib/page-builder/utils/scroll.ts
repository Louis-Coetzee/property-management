'use client';

/**
 * Smooth scroll to a section on the page
 * @param sectionId - The ID of the section to scroll to
 * @param offset - Optional offset in pixels (default: 80 for navbar height)
 */
export function smoothScrollToSection(sectionId: string, offset: number = 80): void {
  // Remove 'section-' prefix if present to get the raw section ID
  const rawId = sectionId.startsWith('section-') ? sectionId.replace('section-', '') : sectionId;

  // Try with section- prefix first (how PageRenderer renders them)
  let element = document.getElementById(`section-${rawId}`);

  // If not found, try without prefix
  if (!element) {
    element = document.getElementById(rawId);
  }

  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

/**
 * Navigate to a page
 * @param pageSlug - The slug of the page to navigate to
 * @param homePageSlug - Optional home page slug to check if target is home page
 */
export function navigateToPage(pageSlug: string, homePageSlug?: string): void {
  // Check if the target page is the home page
  const targetSlug = pageSlug.startsWith('/') ? pageSlug.slice(1) : pageSlug;
  const isHomePage = !targetSlug || targetSlug === '' || (homePageSlug && targetSlug === homePageSlug);

  // Navigate to the appropriate URL
  if (isHomePage) {
    window.location.href = '/';
  } else {
    window.location.href = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;
  }
}

/**
 * Navigate to a page and optionally scroll to a section
 * @param pageSlug - The slug of the page to navigate to
 * @param sectionId - Optional section ID to scroll to after navigation
 * @param homePageSlug - Optional home page slug to check if target is home page
 */
export function navigateToPageWithSection(
  pageSlug: string,
  sectionId?: string,
  homePageSlug?: string
): void {
  // Store the target section ID in sessionStorage for post-navigation scrolling
  if (sectionId) {
    sessionStorage.setItem('targetSectionId', sectionId);
  }

  // Check if the target page is the home page
  // If target is home page (matches homePageSlug or is '/'), navigate to base URL
  const targetSlug = pageSlug.startsWith('/') ? pageSlug.slice(1) : pageSlug;
  const isHomePage = !targetSlug || targetSlug === '' || (homePageSlug && targetSlug === homePageSlug);

  // Navigate to the appropriate URL
  if (isHomePage) {
    // Navigate to base URL (home page)
    window.location.href = '/';
  } else {
    // Navigate to the specific page
    window.location.href = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;
  }
}

/**
 * Check and scroll to a section from sessionStorage after page load
 * Call this in useEffect or on mount to handle section navigation
 */
export function scrollToStoredSection(): void {
  const targetSectionId = sessionStorage.getItem('targetSectionId');

  if (targetSectionId) {
    // Clear the stored section ID
    sessionStorage.removeItem('targetSectionId');

    // Wait for the page to fully render before scrolling
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Additional delay to ensure all sections are rendered
      setTimeout(() => {
        smoothScrollToSection(targetSectionId);
      }, 100);
    });
  }
}

/**
 * Get the href for a navbar link based on its type
 * @param link - The navbar link object
 * @param currentPageSlug - The slug of the current page (for same-page detection)
 * @returns The href string for the link
 */
export function getNavbarLinkHref(
  link: any,
  currentPageSlug?: string
): string {
  if (link.type === 'url') {
    return link.url || '#';
  }

  // For page type links, return the page slug
  // Section navigation is handled via onClick
  return link.url || '#';
}
