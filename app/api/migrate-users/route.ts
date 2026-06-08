import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to migrate users from old app to new app
 *
 * Usage:
 * GET /api/migrate-users?name=Dumisani&exportOnly=true
 * GET /api/migrate-users?email=user@example.com
 * POST /api/migrate-users (with body: { users: [...] })
 */

// Old app Convex configuration
const OLD_CONVEX_URL = 'https://quirky-elephant-940.convex.cloud';

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filterName = searchParams.get('name') || 'Dumisani';
  const filterEmail = searchParams.get('email');
  const exportOnly = searchParams.get('exportOnly') === 'true';

  try {
    // Step 1: List all users from old app
    console.log('Fetching users from old app...');
    const users = await callConvexQuery(OLD_CONVEX_URL, 'userExport:listUsersForSelection', {});

    // Filter users
    let filteredUsers = users;
    if (filterEmail) {
      filteredUsers = users.filter((u: any) => u.email === filterEmail);
    } else {
      filteredUsers = users.filter(
        (u: any) => u.firstName?.toLowerCase().includes(filterName.toLowerCase()) ||
                    u.lastName?.toLowerCase().includes(filterName.toLowerCase())
      );
    }

    if (filteredUsers.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No users found matching "${filterName}"`,
        totalUsers: users.length,
        availableUsers: users.slice(0, 20).map((u: any) => ({
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
        })),
      });
    }

    // Step 2: Export full user data
    const emails = filteredUsers.map((u: any) => u.email);
    const exportedUsers = await callConvexQuery(OLD_CONVEX_URL, 'userExport:exportUsersForMigration', {
      emails: emails
    });

    // Step 3: Return the data (for manual import or verification)
    return NextResponse.json({
      success: true,
      exported: exportedUsers.length,
      users: exportedUsers,
      message: exportOnly
        ? 'Users exported successfully. Use POST to import.'
        : 'Users found. Use POST to import into new app.',
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { users, name, email } = body;

    // If users array provided directly, use it
    // Otherwise, fetch from old app
    let usersToImport = users;

    if (!usersToImport) {
      // Fetch users from old app
      let filteredUsers;
      const allUsers = await callConvexQuery(OLD_CONVEX_URL, 'userExport:listUsersForSelection', {});

      if (email) {
        filteredUsers = allUsers.filter((u: any) => u.email === email);
      } else if (name) {
        filteredUsers = allUsers.filter(
          (u: any) => u.firstName?.toLowerCase().includes(name.toLowerCase()) ||
                      u.lastName?.toLowerCase().includes(name.toLowerCase())
        );
      } else {
        return NextResponse.json({
          success: false,
          error: 'Provide either "users" array, "name", or "email" in request body',
        }, { status: 400 });
      }

      if (filteredUsers.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No users found matching criteria',
        });
      }

      const emails = filteredUsers.map((u: any) => u.email);
      usersToImport = await callConvexQuery(OLD_CONVEX_URL, 'userExport:exportUsersForMigration', {
        emails: emails
      });
    }

    // Return the users to import (actual import needs to happen via Convex mutation from client)
    return NextResponse.json({
      success: true,
      message: 'Users ready for import. Call the importUsers mutation from your client with this data.',
      usersToImport,
      instructions: 'Use: api.userImport.importUsers({ users: usersToImport, skipExisting: true })',
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
