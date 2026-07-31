import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { NGO_TEAM_ID, VOLUNTEER_TEAM_ID, addUserToTeam, removeUserFromTeam } from '$lib/server/teams';
import { withdrawVerification, setUserVerificationPref } from '$lib/server/verifications';
import { setTasksVerifiedForOrg } from '$lib/server/appwrite';

/**
 * POST /api/profile/role
 *   Body: { newRole: 'volunteer' | 'ngo' }
 *   Owns the role-change transaction. Idempotent — calling it with the role the
 *   user already has is a safe no-op that just reconciles team membership.
 *
 *   When transitioning ngo → volunteer:
 *     - withdraw any existing ngoVerifications row
 *     - mark all of the user's existing tasks as isVerified=false
 *     - clear prefs.verificationStatus
 *   When transitioning volunteer → ngo:
 *     - just swap teams; verification has to be submitted from scratch
 */

async function getUserId(event: Parameters<RequestHandler>[0]): Promise<string | null> {
  const sessionUserId = (event.locals as any)?.session?.user?.id as string | undefined;
  if (sessionUserId) return sessionUserId;
  try {
    const authHeader = event.request.headers.get('authorization') ?? '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
    const jwt = authHeader.slice(7).trim();
    const { Client, Account } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT || '')
      .setProject(env.APPWRITE_PROJECT_ID || '')
      .setJWT(jwt);
    const account = new Account(client);
    const me: any = await account.get();
    return me?.$id ?? me?.id ?? null;
  } catch {
    return null;
  }
}

export const POST: RequestHandler = async (event) => {
  const userId = await getUserId(event);
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await event.request.json(); } catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }
  const newRole = String(body?.newRole ?? '').trim();
  if (newRole !== 'volunteer' && newRole !== 'ngo') {
    return json({ error: 'newRole must be "volunteer" or "ngo"' }, { status: 400 });
  }

  // Read current prefs to detect transition direction.
  const { Client, Users } = await import('node-appwrite');
  const client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT!)
    .setProject(env.APPWRITE_PROJECT_ID!)
    .setKey(env.APPWRITE_API_KEY!);
  const users = new Users(client);

  let oldRole: string;
  try {
    const me: any = await users.get(userId);
    oldRole = String(me?.prefs?.role ?? '');
  } catch {
    return json({ error: 'User not found' }, { status: 404 });
  }

  const downgrading = oldRole === 'ngo' && newRole === 'volunteer';

  // 1. Cleanup if downgrading from NGO.
  let tasksUpdated = 0;
  if (downgrading) {
    try { await withdrawVerification(userId); } catch {}
    try { tasksUpdated = await setTasksVerifiedForOrg(userId, false); } catch {}
    try { await setUserVerificationPref(userId, null); } catch {}
  }

  // 2. Update prefs.role (read-modify-write so we don't clobber other prefs).
  try {
    const me: any = await users.get(userId);
    const nextPrefs = { ...(me?.prefs ?? {}), role: newRole };
    if (downgrading) nextPrefs.verificationStatus = '';
    await users.updatePrefs(userId, nextPrefs);
  } catch (err) {
    console.error('updatePrefs failed', err);
    return json({ error: 'Could not update profile' }, { status: 500 });
  }

  // 3. Reconcile team memberships.
  const targetTeamId = newRole === 'ngo' ? NGO_TEAM_ID : VOLUNTEER_TEAM_ID;
  const otherTeamId = newRole === 'ngo' ? VOLUNTEER_TEAM_ID : NGO_TEAM_ID;
  try {
    if (otherTeamId) await removeUserFromTeam(userId, otherTeamId);
    if (targetTeamId) await addUserToTeam(userId, targetTeamId, [newRole]);
  } catch (err) {
    console.error('Team reconciliation failed', err);
    // Continue — prefs are correct, team will be retried on next sign-in.
  }

  return json({ ok: true, role: newRole, downgraded: downgrading, tasksUpdated });
};
