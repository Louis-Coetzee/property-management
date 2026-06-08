/**
 * Migration script to export users from old app and import into new app
 *
 * Usage: npx ts-node migrations/export-users.ts
 *
 * This script:
 * 1. Exports users from the old app (quirky-elephant-940.convex.cloud)
 * 2. Filters for specific users (e.g., name = "Dumisani")
 * 3. Saves exported data to a JSON file
 * 4. Can import into the new app
 */

// Old app Convex configuration
const OLD_CONVEX_URL = 'https://quirky-elephant-940.convex.cloud';

// New app Convex configuration (from your current app)
const NEW_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://quirky-elephant-940.convex.cloud';

// Helper to call Convex query via HTTP API
async function callConvexQuery(url: string, functionName: string, args: Record<string, any> = {}) {
  const response = await fetch(`${url}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: functionName,
      args: args,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Convex query failed: ${response.status} ${text}`);
  }

  return response.json();
}

// Helper to call Convex mutation via HTTP API
async function callConvexMutation(url: string, functionName: string, args: Record<string, any> = {}) {
  const response = await fetch(`${url}/api/mutation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: functionName,
      args: args,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Convex mutation failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function main() {
  const filterName = process.argv[2] || 'Dumisani';
  const exportOnly = process.argv.includes('--export-only');

  console.log(`\n🚀 Starting user migration...`);
  console.log(`   Filter: users with name "${filterName}"`);
  console.log(`   Old app: ${OLD_CONVEX_URL}`);
  console.log(`   New app: ${NEW_CONVEX_URL}`);
  console.log('');

  try {
    // Step 1: List all users from old app to find the one we want
    console.log('📋 Fetching users from old app...');
    const users = await callConvexQuery(OLD_CONVEX_URL, 'userExport:listUsersForSelection', {});

    console.log(`   Found ${users.length} total users`);

    // Filter for the specific user
    const filteredUsers = users.filter(
      (u: any) => u.firstName?.toLowerCase().includes(filterName.toLowerCase()) ||
                  u.lastName?.toLowerCase().includes(filterName.toLowerCase())
    );

    console.log(`   Found ${filteredUsers.length} users matching "${filterName}"`);

    if (filteredUsers.length === 0) {
      console.log('\n❌ No users found with that name');
      console.log('\nAvailable users:');
      users.slice(0, 20).forEach((u: any) => {
        console.log(`   - ${u.firstName} ${u.lastName} (${u.email})`);
      });
      return;
    }

    // Step 2: Export the filtered users with full data
    console.log('\n📦 Exporting full user data...');
    const emails = filteredUsers.map((u: any) => u.email);
    const exportedUsers = await callConvexQuery(OLD_CONVEX_URL, 'userExport:exportUsersForMigration', {
      emails: emails
    });

    console.log(`   Exported ${exportedUsers.length} users`);

    // Step 3: Save to file
    const fs = await import('fs');
    const path = await import('path');
    const outputPath = path.join(__dirname, 'exported-users.json');

    fs.writeFileSync(outputPath, JSON.stringify(exportedUsers, null, 2));
    console.log(`   Saved to: ${outputPath}`);

    // Display exported users
    console.log('\n✅ Exported users:');
    exportedUsers.forEach((u: any) => {
      console.log(`   - ${u.firstName} ${u.lastName} (${u.email})`);
      console.log(`     Apps: ${Object.keys(u.apps || {}).join(', ') || 'none'}`);
    });

    if (exportOnly) {
      console.log('\n✅ Export-only mode. Skipping import.');
      return;
    }

    // Step 4: Import into new app
    console.log('\n📥 Importing into new app...');
    const result = await callConvexMutation(NEW_CONVEX_URL, 'userImport:importUsers', {
      users: exportedUsers,
      skipExisting: true,
    });

    console.log('\n📊 Import results:');
    console.log(`   Imported: ${result.imported}`);
    console.log(`   Skipped: ${result.skipped}`);
    if (result.errors?.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
      result.errors.forEach((e: string) => console.log(`     - ${e}`));
    }

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
