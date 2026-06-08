# User Migration Guide

This guide explains how to export users from the old RefreshTech application and import them into the new application.

## Overview

- **Old App Location:** `/home/louis/Desktop/Refreshtech/apps/businessapp/new`
- **Old App Production URL:** `https://hidden-pigeon-609.convex.cloud`
- **Old App Dev URL:** `https://quirky-elephant-940.convex.cloud`
- **Exported Data Location:** `migrations/exported-users.json`

## Quick Reference

### Export Users from Old App

```bash
# Navigate to old app
cd /home/louis/Desktop/Refreshtech/apps/businessapp/new

# List all users (production)
npx convex run userExport:listUsersForSelection '{}' --prod

# List all users (dev)
npx convex run userExport:listUsersForSelection '{}'

# Export specific users by email (production)
npx convex run userExport:exportUsersForMigration '{"emails": ["user@example.com"]}' --prod

# Export users by domain (production)
npx convex run userExport:exportUsersForMigration '{"domain": "refreshdashboard.vercel.app", "limit": 10}' --prod
```

### Import Users into New App

```bash
# Navigate to new app
cd /home/louis/Desktop/vehcile

# Import users (production)
npx convex run userImport:importUsers '{"users": [<user-data>], "skipExisting": true}' --prod

# Import users (dev)
npx convex run userImport:importUsers '{"users": [<user-data>], "skipExisting": true}'
```

## Step-by-Step Migration

### Step 1: List Users to Find the Target

```bash
cd /home/louis/Desktop/Refreshtech/apps/businessapp/new
npx convex run userExport:listUsersForSelection '{}' --prod
```

This returns a list of users with:
- `email`
- `firstName`
- `lastName`
- `isEmailVerified`
- `registeredFromDomain`
- `createdAt`

### Step 2: Export Full User Data

Once you have the email, export the full user data:

```bash
npx convex run userExport:exportUsersForMigration '{"emails": ["user@example.com"]}' --prod
```

This returns complete user data including:
- Password hash (bcrypt - compatible with new app)
- Email verification status
- App access permissions
- Contact information

### Step 3: Save Exported Data

Copy the output and save it to `migrations/exported-users.json`:

```json
[
  {
    "apps": { ... },
    "contactNumber": "...",
    "createdAt": 1767802080208,
    "email": "user@example.com",
    "firstName": "...",
    "isEmailVerified": true,
    "lastName": "...",
    "passwordHash": "$2b$12$...",
    "registeredFromDomain": "...",
    "requirePasswordChange": false,
    "updatedAt": 1767802100215
  }
]
```

### Step 4: Import into New App

```bash
cd /home/louis/Desktop/vehcile

# Single user import
npx convex run userImport:importUsers '{
  "users": [{
    "apps": { ... },
    "contactNumber": "...",
    "createdAt": 1767802080208,
    "email": "user@example.com",
    "firstName": "...",
    "isEmailVerified": true,
    "lastName": "...",
    "passwordHash": "$2b$12$...",
    "registeredFromDomain": "...",
    "requirePasswordChange": false,
    "updatedAt": 1767802100215
  }],
  "skipExisting": true
}' --prod
```

### Step 5: Verify Import

The import returns:
```json
{
  "imported": 1,
  "skipped": 0,
  "errors": []
}
```

## Import Options

| Option | Description |
|--------|-------------|
| `skipExisting: true` | Skip users that already exist (recommended) |
| `skipExisting: false` | Report error if user already exists |

## Bulk Migration

To migrate multiple users at once:

```bash
# Export multiple users
npx convex run userExport:exportUsersForMigration '{"emails": ["user1@example.com", "user2@example.com"]}' --prod

# Import all at once
npx convex run userImport:importUsers '{"users": [...], "skipExisting": true}' --prod
```

## Files Reference

| File | Purpose |
|------|---------|
| `convex/userImport.ts` | Import mutation in new app |
| `migrations/export-users.ts` | Node.js migration script |
| `migrations/exported-users.json` | Saved exported user data |
| `app/api/migrate-users/route.ts` | API route for migration |

## Notes

- Password hashes are preserved (bcrypt) - users can log in with their existing passwords
- Email verification status is preserved
- Original `registeredFromDomain` is preserved
- App access permissions are preserved but may need to be updated for new app structure
- New fields (`userAccess`, `userType`) are set to defaults

## Troubleshooting

### "Could not find function" Error

If the export functions aren't found, deploy them first:

```bash
cd /home/louis/Desktop/Refreshtech/apps/businessapp/new
npx convex dev --once
```

### User Already Exists

Use `skipExisting: true` to skip existing users, or manually delete the user from the new app first.

### Convex CLI Not Found

```bash
npm install -g convex
# or use npx
npx convex run ...
```
