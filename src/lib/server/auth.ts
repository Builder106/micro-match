import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

import type { UserRole, UserPreferences } from '$lib/types';
export type { UserRole };

function parseBearer(event: RequestEvent): string | null {
  const authHeader = event.request.headers.get('authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}

async function getUserFromJWT(jwt: string): Promise<import('node-appwrite').Models.User<UserPreferences> | null> {
  try {
    const { Client, Account } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT!)
      .setProject(env.APPWRITE_PROJECT_ID!)
      .setJWT(jwt);
    const account = new Account(client);
    return await account.get<UserPreferences>();
  } catch {
    return null;
  }
}

function roleFromUser(user: { prefs?: UserPreferences } | null | undefined): UserRole {
  const prefs = user?.prefs ?? {};
  const role = typeof prefs.role === 'string' ? prefs.role : '';
  if (role === 'ngo') return 'ngo';
  if (role === 'volunteer') return 'volunteer';
  return 'user';
}

/**
 * Preferred: Appwrite JWT in Authorization header → derive role from user.prefs.role
 * Fallback (MVP): NGO_API_TOKEN / USER_API_TOKEN shared secrets.
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
        const userId: string | undefined = user.$id;
        if (userId) {
          if (NGO_TEAM_ID && (await isUserInTeam(userId, NGO_TEAM_ID))) return 'ngo';
          if (VOLUNTEER_TEAM_ID && (await isUserInTeam(userId, VOLUNTEER_TEAM_ID))) return 'volunteer';
        }
      } catch {}
      // Fallback to prefs.role
      return roleFromUser(user);
    }
  }

  // Fallback to temporary shared tokens
  const token = jwt ?? '';
  const ngoToken = env.NGO_API_TOKEN ?? '';
  const userToken = env.USER_API_TOKEN ?? '';
  if (ngoToken && token === ngoToken) return 'ngo';
  if (userToken && token === userToken) return 'user';
  return 'anonymous';
}

