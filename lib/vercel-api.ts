// Vercel API Integration Utilities
// Subdomains use .refreshcars.site (wildcard configured, no Vercel check needed)
// Custom domains use Vercel API for validation

const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || process.env.NEXT_PUBLIC_VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || process.env.NEXT_PUBLIC_VERCEL_TEAM_ID;

// Domain for subdomains - configurable via environment variable
const SUBDOMAIN_BASE = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || 'livewebapp.site';

export interface VercelAddDomainResponse {
  name: string;
  apexName: string;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  redirect?: string;
}

interface VercelDomainConfig {
  configuredBy?: string | null;
  acceptedChallenges?: string[];
  misconfigured: boolean;
}

/**
 * Check if a subdomain format is valid for .refreshcars.site
 * Note: This only validates format, actual availability is checked in database
 */
export function isValidSubdomain(domain: string): boolean {
  const subdomainPattern = /^[a-z0-9-]+\.[a-z0-9.-]+$/;
  return subdomainPattern.test(domain);
}

/**
 * Generate a subdomain based on site name
 */
export function generateSubdomain(siteName: string): string {
  // Clean and format the site name
  const cleaned = siteName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63); // Max length for subdomain

  return `${cleaned}.${SUBDOMAIN_BASE}`;
}

/**
 * Generate subdomain variations for suggestion
 * These should be checked against the database, not Vercel
 */
export function generateSubdomainVariations(baseName: string): string[] {
  const variations: string[] = [];
  const cleanedBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Generate 5 variations
  variations.push(`${cleanedBase}.${SUBDOMAIN_BASE}`);
  variations.push(`${cleanedBase}-site.${SUBDOMAIN_BASE}`);
  variations.push(`${cleanedBase}-web.${SUBDOMAIN_BASE}`);
  variations.push(`${cleanedBase}-online.${SUBDOMAIN_BASE}`);
  variations.push(`${cleanedBase}-app.${SUBDOMAIN_BASE}`);

  return variations;
}

/**
 * Check if a CUSTOM domain (not subdomain) is available on Vercel
 * This is only used for custom domains, not .refreshcars.site subdomains
 *
 * @param domain - The custom domain to check
 * @param options - Optional parameters
 * @param options.keepIfAvailable - If true, when domain is available, keep it (don't delete after test add)
 * @returns Object with available status and whether domain was added
 */
export async function checkCustomDomainAvailability(
  domain: string,
  options?: { keepIfAvailable?: boolean }
): Promise<{ available: boolean; added?: boolean }> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('Vercel credentials not configured, skipping domain check');
    return { available: true }; // Assume available if API not configured
  }

  const keepIfAvailable = options?.keepIfAvailable === true;

  try {
    // First, check if the domain is already in the current project
    const projectUrl = `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    const projectResponse = await fetch(projectUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (projectResponse.ok) {
      console.log(`Domain ${domain} exists in current project - not available`);
      return { available: false, added: false }; // Domain is already in this project
    }

    // The definitive test: Try to add the domain to the project
    // This is the only reliable way to check availability (Vercel's global domain API can have stale cache)
    const addUrl = `${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    const addResponse = await fetch(addUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });

    if (addResponse.ok) {
      // Domain was added - check the response to see if it's truly available or already configured elsewhere
      const addData = await addResponse.json();
      console.log(`Domain ${domain} add response:`, addData);

      // Check if domain is already configured by another project/team
      // Vercel returns verification array if domain needs verification or is already in use
      if (addData.verification && addData.verification.length > 0) {
        // Check each verification entry for signs that domain is already configured
        for (const verification of addData.verification) {
          // Check for "already in use" or "configured" indicators in the reason
          if (verification.reason) {
            const reason = verification.reason.toLowerCase();
            if (reason.includes('already') ||
                reason.includes('configured') ||
                reason.includes('another team') ||
                reason.includes('another project') ||
                reason.includes('in use')) {
              console.log(`❌ Domain ${domain} is already in use - verification reason: ${verification.reason}`);
              // Clean up the domain we just added
              try {
                await fetch(`${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${
                  VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
                }`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
                });
              } catch {
                // Ignore cleanup error
              }
              return { available: false, added: false };
            }
          }
        }
      }

      // Check the configuredBy field - if set, it means the domain is already configured
      if (addData.configuredBy) {
        console.log(`❌ Domain ${domain} is already configured by: ${addData.configuredBy}`);
        // Clean up the domain we just added
        try {
          await fetch(`${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${
            VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
          }`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
          });
        } catch {
          // Ignore cleanup error
        }
        return { available: false, added: false };
      }

      console.log(`✓ Domain ${domain} is available (test add succeeded)`);

      if (keepIfAvailable) {
        // Keep the domain - don't delete it (useful for editing)
        console.log(`Domain ${domain} kept in project after validation`);
        return { available: true, added: true };
      } else {
        // Clean up - remove the test domain (for new site creation)
        console.log(`Domain ${domain} cleaning up after test...`);

        let deleteSuccess = false;
        try {
          const deleteResponse = await fetch(`${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${
            VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
          }`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${VERCEL_TOKEN}`,
            },
          });

          if (deleteResponse.ok) {
            deleteSuccess = true;
            console.log(`Domain ${domain} cleaned up successfully`);
          } else {
            const deleteError = await deleteResponse.text();
            console.error(`Failed to clean up test domain ${domain}:`, deleteError);
          }
        } catch (deleteError) {
          console.error(`Exception during cleanup of ${domain}:`, deleteError);
        }

        // If delete failed, try one more time
        if (!deleteSuccess) {
          console.warn(`Retrying cleanup for domain ${domain}...`);
          try {
            const retryResponse = await fetch(`${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${
              VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
            }`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${VERCEL_TOKEN}`,
              },
            });

            if (retryResponse.ok) {
              console.log(`Domain ${domain} cleaned up on retry`);
            } else {
              console.error(`Failed to clean up even on retry for ${domain}`);
            }
          } catch {
            // Final retry failed
          }
        }

        return { available: true, added: false };
      }
    } else {
      // Domain add failed - check the specific error
      const errorText = await addResponse.text();
      let errorData;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      const errorMessage = (errorData.error?.message || errorText).toLowerCase();
      const errorCode = errorData.error?.code;

      console.log(`Domain ${domain} add failed:`, errorMessage, 'code:', errorCode);

      // Check if this is a "domain already taken" error
      const isTakenError =
        errorMessage.includes('already') ||
        errorMessage.includes('another team') ||
        errorMessage.includes('another project') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('in use') ||
        errorMessage.includes('owned by') ||
        errorMessage.includes('belongs to') ||
        errorMessage.includes('configured') ||
        errorMessage.includes('not available') ||
        errorMessage.includes('claimed') ||
        errorMessage.includes('registered') ||
        errorCode === 'domain_already_exists' ||
        errorCode === 'domain_taken' ||
        errorCode === 'domain_already_in_use' ||
        errorCode === 'domain_not_available' ||
        errorCode === 'forbidden' ||
        errorCode === 'conflict';

      if (isTakenError) {
        console.log(`❌ Domain ${domain} is already in use on Vercel - not available`);
        return { available: false, added: false }; // Domain is taken
      }

      // Any other error means we couldn't determine availability
      // Assume it's available but log the error
      console.log(`Domain ${domain} check returned unknown error, assuming available`);
      return { available: true, added: false };
    }
  } catch (error) {
    console.error('Error checking domain availability:', error);
    return { available: true, added: false }; // Assume available on error
  }
}

/**
 * Add a domain with a redirect to another domain
 * e.g., add "www.example.com" that redirects to "example.com"
 */
export async function addDomainWithRedirect(domain: string, redirectTarget: string): Promise<VercelAddDomainResponse | null> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('Vercel credentials not configured, skipping domain addition');
    return null;
  }

  try {
    // First, check if the domain already exists in the current project
    const checkUrl = `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    console.log(`[addDomainWithRedirect] Checking if domain "${domain}" already exists in project...`);

    const checkResponse = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (checkResponse.ok) {
      // Domain already exists - check if it has the correct redirect
      const existingData = await checkResponse.json();
      if (existingData.redirect === redirectTarget) {
        console.log(`✓ Domain "${domain}" already exists with correct redirect to "${redirectTarget}":`, existingData);
        return existingData;
      } else {
        console.log(`⚠️  Domain "${domain}" exists but redirects to "${existingData.redirect}" instead of "${redirectTarget}"`);
        // Could update the redirect here, but for now just return existing
        return existingData;
      }
    }

    console.log(`[addDomainWithRedirect] Adding domain "${domain}" with redirect to "${redirectTarget}"...`);

    // Domain doesn't exist, add it with redirect
    const url = `${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
        redirect: redirectTarget,
        redirectStatusCode: 307,
      }),
    });

    console.log(`[addDomainWithRedirect] Add response status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Domain "${domain}" added with redirect to "${redirectTarget}":`, data);
      return data;
    } else {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          console.error(`[addDomainWithRedirect] Error response body:`, errorText);
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorText;
          } catch {
            errorMessage = errorText;
          }
        }
      } catch (parseError) {
        errorMessage += ` (parse error: ${parseError})`;
      }
      console.error(`✗ Failed to add domain "${domain}" with redirect:`, errorMessage);
      return null;
    }
  } catch (error) {
    console.error(`✗ Exception adding domain "${domain}" with redirect:`, error);
    return null;
  }
}

/**
 * Add a domain to the Vercel project
 * If the domain already exists in this project, returns the existing domain info
 */
export async function addDomainToProject(domain: string): Promise<VercelAddDomainResponse | null> {
  console.log(`[addDomainToProject] Starting for domain: ${domain}`);
  console.log(`[addDomainToProject] VERCEL_TOKEN exists:`, !!VERCEL_TOKEN);
  console.log(`[addDomainToProject] VERCEL_PROJECT_ID:`, VERCEL_PROJECT_ID);
  console.log(`[addDomainToProject] VERCEL_TEAM_ID:`, VERCEL_TEAM_ID);

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('Vercel credentials not configured, skipping domain addition');
    return null;
  }

  try {
    // First, check if the domain already exists in the current project
    const checkUrl = `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    console.log(`[addDomainToProject] Checking if domain "${domain}" already exists in project...`);
    console.log(`[addDomainToProject] Check URL: ${checkUrl.replace(VERCEL_TOKEN || '', '[TOKEN]')}`);

    const checkResponse = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    });

    console.log(`[addDomainToProject] Check response status: ${checkResponse.status}`);

    if (checkResponse.ok) {
      // Domain already exists in this project - return success with existing data
      const existingData = await checkResponse.json();
      console.log(`✓ Domain "${domain}" already exists in project, using existing:`, existingData);
      return existingData;
    }

    console.log(`[addDomainToProject] Domain "${domain}" not found in project, adding now...`);

    // Domain doesn't exist, add it
    const url = `${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    console.log(`[addDomainToProject] Add URL: ${url.replace(VERCEL_TOKEN || '', '[TOKEN]')}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });

    console.log(`[addDomainToProject] Add response status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Domain added successfully: ${domain}`, data);
      return data;
    } else {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          console.error(`[addDomainToProject] Error response body:`, errorText);
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorText;
          } catch {
            errorMessage = errorText;
          }
        }
      } catch (parseError) {
        errorMessage += ` (parse error: ${parseError})`;
      }
      console.error(`✗ Failed to add domain "${domain}":`, errorMessage);
      return null;
    }
  } catch (error) {
    console.error(`✗ Exception adding domain "${domain}":`, error);
    return null;
  }
}

/**
 * Add www subdomain with redirect to the main domain
 * e.g., if domain is "example.com", adds "www.example.com" that redirects to "example.com"
 * If the www domain already exists in this project, it will be updated or left as-is
 */
export async function addWwwRedirectDomain(mainDomain: string): Promise<VercelAddDomainResponse | null> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('Vercel credentials not configured, skipping www domain addition');
    return null;
  }

  const wwwDomain = `www.${mainDomain.replace(/^www\./, '')}`;
  console.log(`[addWwwRedirectDomain] Checking www redirect: ${wwwDomain} -> ${mainDomain}`);

  try {
    // First, check if the www domain already exists in the current project
    const checkUrl = `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(wwwDomain)}${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    const checkResponse = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (checkResponse.ok) {
      // WWW domain already exists - check if it has the correct redirect
      const existingData = await checkResponse.json();
      if (existingData.redirect === mainDomain) {
        console.log(`✓ WWW redirect "${wwwDomain}" already configured correctly:`, existingData);
        return existingData;
      } else {
        console.log(`⚠️  WWW redirect "${wwwDomain}" exists but redirects to "${existingData.redirect}" instead of "${mainDomain}"`);
        // Could update the redirect here, but for now just return existing
        return existingData;
      }
    }

    console.log(`[addWwwRedirectDomain] Adding www redirect domain "${wwwDomain}" -> ${mainDomain}...`);

    // Domain doesn't exist, add it
    const url = `${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: wwwDomain,
        redirect: mainDomain,
        redirectStatusCode: 307, // Use 307 for temporary redirects (standard for Vercel)
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ WWW redirect domain added successfully: ${wwwDomain} -> ${mainDomain}`, data);
      return data;
    } else {
      let errorMessage = 'Unknown error';
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorText;
          } catch {
            errorMessage = errorText;
          }
        }
      } catch (parseError) {
        errorMessage = `Failed to parse error response: ${parseError}`;
      }
      console.error(`✗ Failed to add www redirect domain "${wwwDomain}":`, errorMessage);
      return null;
    }
  } catch (error) {
    console.error(`✗ Exception adding www redirect domain "${wwwDomain}":`, error);
    return null;
  }
}

/**
 * Get domain information from Vercel
 * Returns the domain data including whether it's a redirect, verified status, etc.
 */
export async function getDomainInfo(domain: string): Promise<Record<string, unknown> | null> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('Vercel credentials not configured');
    return null;
  }

  try {
    const url = `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[getDomainInfo] Domain "${domain}" info:`, JSON.stringify(data, null, 2));
      return data;
    } else {
      const statusCode = response.status;
      const errorText = await response.text();
      console.error(`[getDomainInfo] Failed to get info for "${domain}": HTTP ${statusCode}`, errorText);
      return null;
    }
  } catch (error) {
    console.error(`[getDomainInfo] Exception getting info for "${domain}":`, error);
    return null;
  }
}

/**
 * Remove a domain from the Vercel project
 */
export async function removeDomainFromProject(domain: string): Promise<{
  success: boolean;
  error?: string;
  details?: unknown;
}> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('Vercel credentials not configured, skipping domain removal');
    return {
      success: false,
      error: 'Vercel credentials not configured'
    };
  }

  try {
    const url = `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    console.log(`[removeDomainFromProject] Attempting to delete domain: ${domain}`);
    console.log(`[removeDomainFromProject] URL: ${url.replace(VERCEL_TOKEN || '', '[TOKEN]')}`);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (response.ok) {
      console.log(`[removeDomainFromProject] ✓ Domain "${domain}" removed successfully (HTTP ${response.status})`);
      return { success: true };
    } else {
      const statusCode = response.status;
      const statusText = response.statusText;
      let errorDetails: unknown = 'Unknown error';
      let errorMessage = `HTTP ${statusCode} ${statusText}`;

      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson;
            errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
          } catch {
            // Not JSON, use raw text
            errorDetails = errorText;
            errorMessage = errorText;
          }
        }
      } catch (parseError) {
        errorDetails = `Failed to read error response: ${parseError}`;
      }

      console.error(`[removeDomainFromProject] ✗ Failed to delete "${domain}": ${errorMessage}`);
      console.error(`[removeDomainFromProject] Full error details:`, errorDetails);

      return {
        success: false,
        error: errorMessage,
        details: errorDetails
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown exception';
    console.error(`[removeDomainFromProject] ✗ Exception deleting "${domain}":`, error);
    return {
      success: false,
      error: `Exception: ${errorMessage}`,
      details: error
    };
  }
}

/**
 * Check domain configuration status
 */
export async function checkDomainConfiguration(domain: string): Promise<VercelDomainConfig | null> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('Vercel credentials not configured');
    return null;
  }

  try {
    const url = `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}/config${
      VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Error checking domain config:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Error checking domain configuration:', error);
    return null;
  }
}

/**
 * Get DNS records required for custom domain
 */
export function getDNSRecords(_domain: string) {
  // Vercel's standard DNS configuration
  return {
    aRecords: [
      { type: 'A', name: '@', value: '76.76.21.21' },
    ],
    cnameRecord: {
      type: 'CNAME',
      name: 'www',
      value: 'cname.vercel-dns.com',
    },
  };
}
