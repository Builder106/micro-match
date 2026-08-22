import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * POST /api/profile/update
 *   Body: { displayName?: string; bio?: string; orgName?: string; avatarFileId?: string }
 *
 *   Server-side updateName + read-modify-write of prefs using the admin API
 *   key. Avoids the client SDK entirely, which lets the save flow work even
 *   when the browser blocks Appwrite's cross-origin session cookie (Safari
 *   ITP, strict tracking prevention, etc).
 *
 *   Authentication: prefer mm_session (first-party cookie set by our server),
 *   fall back to a Bearer JWT if present (kept for API parity with
 *   /api/profile/role).
 *
 *   Role updates are not handled here — they go through /api/profile/role
 *   which owns the role transition (team membership, downgrade cleanup, etc).
 */

async function getUserId(event: Parameters<RequestHandler>[0]): Promise<string | null> {
  const sessionUserId = event.locals.session?.user?.id ?? undefined;
  if (sessionUserId) return sessionUserId;
  try {
    const auth = event.request.headers.get('authorization') ?? '';
    if (!auth.toLowerCase().startsWith('bearer ')) return null;
    const jwt = auth.slice(7).trim();
    const { Client, Account } = await import('node-appwrite');
    const client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT || '')
      .setProject(env.APPWRITE_PROJECT_ID || '')
      .setJWT(jwt);
    const acct = new Account(client);
    const me = await acct.get();
    return me?.$id ?? null;
  } catch {
    return null;
  }
}

export const POST: RequestHandler = async (event) => {
  const userId = await getUserId(event);
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  interface UpdateProfileBody {
    displayName?: string;
    bio?: string;
    orgName?: string;
    avatarFileId?: string;
  }

  let body: UpdateProfileBody;
  try {
    body = (await event.request.json()) as UpdateProfileBody;
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : undefined;
  const bio = typeof body.bio === 'string' ? body.bio : undefined;
  const orgName = typeof body.orgName === 'string' ? body.orgName : undefined;
  const avatarFileId = typeof body.avatarFileId === 'string' ? body.avatarFileId : undefined;

  const { Client, Users } = await import('node-appwrite');
  const client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT!)
    .setProject(env.APPWRITE_PROJECT_ID!)
    .setKey(env.APPWRITE_API_KEY!);
  const users = new Users(client);

  if (displayName !== undefined && displayName.length > 0) {
    try {
      await users.updateName(userId, displayName);
    } catch (err) {
      if (env.NODE_ENV !== 'production') console.error('updateName failed', err);
      return json({ error: 'Could not update name' }, { status: 500 });
    }
  }

  // Read-modify-write so we don't clobber prefs we don't manage here
  // (role, verificationStatus, etc).
  if (bio !== undefined || orgName !== undefined || avatarFileId !== undefined) {
    try {
      const me = await users.get<import('$lib/types').UserPreferences>(userId);
      const next: import('$lib/types').UserPreferences = { ...(me?.prefs ?? {}) };
      if (bio !== undefined) next.bio = bio;
      if (orgName !== undefined) next.orgName = orgName;
      if (avatarFileId !== undefined) next.avatarFileId = avatarFileId;
      await users.updatePrefs(userId, next);
    } catch (err) {
      if (env.NODE_ENV !== 'production') console.error('updatePrefs failed', err);
      return json({ error: 'Could not update profile' }, { status: 500 });
    }
  }

  return json({ ok: true });
};
