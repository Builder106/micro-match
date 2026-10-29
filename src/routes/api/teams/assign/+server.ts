import type { RequestHandler } from '@sveltejs/kit';
import { getUserRole } from '#lib/server/auth.js';
import {
  NGO_TEAM_ID,
  VOLUNTEER_TEAM_ID,
  addUserToTeam,
  removeUserFromTeam,
} from '#lib/server/teams.js';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '$app/env/private';

async function getUserId(event: Parameters<RequestHandler>[0]): Promise<string | null> {
  const sessionUserId = event.locals.session?.user?.id ?? undefined;
  if (sessionUserId) return sessionUserId;
  try {
    const authHeader = event.request.headers.get('authorization') ?? '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
    const jwt = authHeader.slice(7).trim();
    const { Client, Account } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT || '')
      .setProject(APPWRITE_PROJECT_ID || '')
      .setJWT(jwt);
    const account = new Account(client);
    const me = await account.get();
    return me?.$id ?? null;
  } catch {
    return null;
  }
}

export const POST: RequestHandler = async (event) => {
  // Determine target role from current role detection (prefs or prior memberships)
  const role = await getUserRole(event);
  if (role !== 'ngo' && role !== 'volunteer') return Response.json({ ok: true });

  const userId = await getUserId(event);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const targetTeamId = role === 'ngo' ? NGO_TEAM_ID : VOLUNTEER_TEAM_ID;
  const otherTeamId = role === 'ngo' ? VOLUNTEER_TEAM_ID : NGO_TEAM_ID;

  try {
    await removeUserFromTeam(userId, otherTeamId);
    await addUserToTeam(userId, targetTeamId, [role]);
    return Response.json({ ok: true });
  } catch (e) {
    console.error('Team assign failed', e);
    return Response.json({ error: 'Team assignment failed' }, { status: 500 });
  }
};
