# Platform Domain Configuration

## What is Different About the Platform Domain?

The domain `refreshcrm.vercel.app` (and its variants `refreshcrm` and `refresh-tech`) is treated as a special **platform/admin domain** in the application. This means:

1. **Dashboard Shows Companies List**: When accessing `/dashboard` on this domain, users see a list of all companies they have access to, with the ability to create, edit, and delete companies.

2. **Default Branding**: Email verification pages and auth pages use default platform colors instead of website-specific branding.

3. **Navbar Display**: Shows platform navigation instead of website-specific navigation.

4. **Multi-Company Management**: This domain serves as the central hub for managing multiple companies/websites from a single account.

5. **Access Control**: Some features are restricted on this domain (e.g., certain actions in authActions.ts check if domain is NOT the platform domain).

Other subdomains (e.g., `mycompany.livewebapp.site`) are treated as customer websites and show the actual website content, not the company management interface.

---

## How to Change the Platform Domain

If you want to use a different domain as the platform domain (e.g., `admin` or `platform`), you need to update the following files:

---

### File 1: `app/[domain]/dashboard/page.tsx`

**Location**: Line 23

**Current code**:
```javascript
const isRefreshTech = domain === 'refreshcrm' || domain === 'refreshcrm.vercel.app' || domain === 'refresh-tech';
```

**What to change**: Add your new domain to this condition.

---

### File 2: `app/[domain]/auth/verify-email/page.tsx`

**Location**: Line 23

**Current code**:
```javascript
const isRefreshTech = domain === 'refreshcrm' || domain === 'refreshcrm.vercel.app' || domain === 'refresh-tech';
```

**What to change**: Add your new domain to this condition.

---

### File 3: `components/auth/AuthButton.tsx`

**Location**: Line 26

**Current code**:
```javascript
const isRefreshTechDomain = !domain || domain === 'refreshcrm' || domain === 'refreshcrm.vercel.app' || domain === 'refresh-tech' || domain?.includes('refreshcrm.vercel.app');
```

**What to change**: Add your new domain to this condition.

---

### File 4: `components/auth/AuthLayoutWrapper.tsx`

**Location**: Line 60

**Current code**:
```javascript
const isRefreshTech = !domain || domain === 'refreshcrm' || domain === 'refreshcrm.vercel.app' || domain === 'refresh-tech' || domain?.includes('refreshcrm.vercel.app');
```

**What to change**: Add your new domain to this condition.

---

### File 5: `components/Navbar.tsx`

**Location**: Line 33

**Current code**:
```javascript
const isRefreshTech = currentDomain === 'refreshcrm' || currentDomain === 'refreshcrm.vercel.app' || currentDomain === 'refresh-tech';
```

**What to change**: Add your new domain to this condition.

---

### File 6: `convex/authActions.ts`

**Location**: Line 64

**Current code**:
```javascript
if (args.domain && args.domain !== 'refreshcrm.vercel.app' && !args.domain.endsWith('.refreshcrm.vercel.app')) {
```

**What to change**: This checks if the domain is NOT the platform domain. Update to include your new domain.

---

### File 7: `convex/clients.ts`

**Locations**: Lines 368, 402

**Current code** (both lines):
```javascript
const domain = (company as any).subdomain || (company as any).customDomain || 'refreshcrm.vercel.app';
```

**What to change**: This is a fallback default domain for generating client URLs. Consider using an environment variable instead (e.g., `process.env.DEFAULT_PLATFORM_DOMAIN`).

---

### File 8: `convex/teamMemberActions.ts`

**Locations**: Lines 99, 131

**Current code** (both lines):
```javascript
const domain = company.subdomain || company.customDomain || 'refreshcrm.vercel.app';
```

**What to change**: Same as above - fallback default domain.

---

### File 9: `convex/domainManagement.ts`

**Location**: Line 100

**Current code**:
```javascript
const subdomainPart = args.domain.replace('.refreshcrm.vercel.app', '').replace('.vercel.app', '');
```

**What to change**: This strips the platform domain from subdomain. Update to strip your new domain as well.

---

### File 10: `app/api/paypal/create-subscription/route.ts`

**Locations**: Lines 223, 224, 352, 355

**Current code** (examples):
```javascript
image_url: 'https://refreshcrm.vercel.app/logo.png',
home_url: 'https://refreshcrm.vercel.app',
const origin = request.headers.get('origin') || 'https://refreshcrm.vercel.app';
```

**What to change**: These are hardcoded URLs for PayPal integration. Consider using environment variables instead.

---

## Summary of Files to Update

| File | Line | Change Type | Purpose |
|------|------|-------------|---------|
| `app/[domain]/dashboard/page.tsx` | ~23 | Platform domain check | Show companies list |
| `app/[domain]/auth/verify-email/page.tsx` | ~23 | Platform domain check | Default branding |
| `components/auth/AuthButton.tsx` | ~26 | Platform domain check | Auth button styling |
| `components/auth/AuthLayoutWrapper.tsx` | ~60 | Platform domain check | Auth layout styling |
| `components/Navbar.tsx` | ~33 | Platform domain check | Navbar display |
| `convex/authActions.ts` | ~64 | Platform domain check | Feature restrictions |
| `convex/clients.ts` | ~368, 402 | Default fallback | Generate client URLs |
| `convex/teamMemberActions.ts` | ~99, 131 | Default fallback | Generate team URLs |
| `convex/domainManagement.ts` | ~100 | Domain stripping | Remove platform domain from subdomain |
| `app/api/paypal/create-subscription/route.ts` | ~223, 224, 352, 355 | Hardcoded URLs | PayPal integration URLs |

---

## Recommended Approach

Instead of updating all these files manually, consider:

1. **Create an environment variable** (e.g., `NEXT_PUBLIC_PLATFORM_DOMAIN`) in `next.config.ts` and use it across all files.

2. **Centralize the platform domain check** in a utility function that can be imported everywhere.

Example utility function in `lib/platform-config.ts`:
```typescript
export const PLATFORM_DOMAINS = [
  process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'refreshcrm.vercel.app',
  'refreshcrm',
  'refresh-tech',
];

export function isPlatformDomain(domain: string): boolean {
  return PLATFORM_DOMAINS.some(d => domain === d || domain?.endsWith(`.${d}`));
}
```

---

## Additional Notes

- The condition checks for both the short domain (e.g., `refreshcrm`) and the full domain with `.vercel.app` suffix to handle different deployment scenarios.
- You may also want to update the proxy.ts file if it references specific domains for rewrites.
- After making changes, redeploy to Vercel for the changes to take effect.
- Email from addresses (`refreshcrm.co.za`) are separate from the platform domain and should be updated in env variables if needed.