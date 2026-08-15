import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

// PROD: Add proper session management with Redis or database
// PROD: Add JWT token refresh mechanism
// PROD: Add session invalidation and logout tracking
export type UserRole = 'anonymous' | 'user' | 'ngo' | 'volunteer';

// PROD: Add proper JWT validation and signature verification
// PROD: Add JWT token expiration handling
// PROD: Add JWT token blacklisting for logout
function parseBearer(event: RequestEvent): string | null {
  const authHeader = event.request.headers.get('authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}

// PROD: Add proper error handling and logging
// PROD: Add user session caching
// PROD: Add user profile caching with TTL
async function getUserFromJWT(jwt: string): Promise<any | null> {
  try {
    const { Client, Account } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT!)
      .setProject(env.APPWRITE_PROJECT_ID!)
      .setJWT(jwt);
    const account = new Account(client);
    return await account.get();
  } catch {
    return null;
  }
}

// PROD: Add role-based access control (RBAC) system
// PROD: Add permission-based authorization
// PROD: Add role hierarchy and inheritance
function roleFromUser(user: { prefs?: Record<string, unknown> } | null | undefined): UserRole {
  const prefs = (user?.prefs ?? {}) as Record<string, unknown>;
  const role = typeof prefs.role === 'string' ? prefs.role : '';
  if (role === 'ngo') return 'ngo';
  if (role === 'volunteer') return 'volunteer';
  return 'user';
}

/**
 * Preferred: Appwrite JWT in Authorization header → derive role from user.prefs.role
 * Fallback (MVP): NGO_API_TOKEN / USER_API_TOKEN shared secrets.
 * 
 * PROD: Implement proper OAuth2/OIDC integration
 * PROD: Add multi-factor authentication (MFA)
 * PROD: Add social login providers (Google, GitHub, etc.)
 * PROD: Add user account lockout after failed attempts
 */
export async function getUserRole(event: RequestEvent): Promise<UserRole> {
  // Prefer locals set by our session
  try {
    const localsRole = event.locals.userRole;
    if (localsRole && localsRole !== 'anonymous') return localsRole;
  } catch {}

  // Try Appwrite JWT first
  const jwt = parseBearer(event);
  if (jwt && env.APPWRITE_ENDPOINT && env.APPWRITE_PROJECT_ID) {
    const user = await getUserFromJWT(jwt);
    if (user) {
      // Check team memberships first if configured
      try {
        const { NGO_TEAM_ID, VOLUNTEER_TEAM_ID, isUserInTeam } = await import('./teams');
        const userId: string | undefined = user.$id ?? user.id;
        if (userId) {
          if (NGO_TEAM_ID && (await isUserInTeam(userId, NGO_TEAM_ID))) return 'ngo';
          if (VOLUNTEER_TEAM_ID && (await isUserInTeam(userId, VOLUNTEER_TEAM_ID))) return 'volunteer';
        }
      } catch {}
      // Fallback to prefs.role
      return roleFromUser(user);
    }
  }

  // PROD: Remove shared token fallback in production
  // PROD: Add proper API key management system
  // PROD: Add API key rotation and expiration
  // Fallback to temporary shared tokens
  const token = jwt ?? '';
  const ngoToken = env.NGO_API_TOKEN ?? '';
  const userToken = env.USER_API_TOKEN ?? '';
  if (ngoToken && token === ngoToken) return 'ngo';
  if (userToken && token === userToken) return 'user';
  return 'anonymous';
}

