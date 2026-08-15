import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createSession as createAppSession, SESSION_TTL_SECONDS } from '$lib/server/session';

/**
 * Server-side OAuth token exchange.
 *
 * The client kicks off OAuth via account.createOAuth2Token(provider, success, failure)
 * where `success` points here. The provider redirects back with `?userId=…&secret=…`.
 * We exchange those credentials for a real Appwrite session (validating them in
 * the process), read the user's profile and team membership via the admin SDK,
 * and mint a first-party mm_session cookie. This sidesteps Safari/ITP, which
 * blocks the third-party session cookie set by the older createOAuth2Session flow.
 */
export const GET: RequestHandler = async (event) => {
  const userId = event.url.searchParams.get('userId') ?? '';
  const secret = event.url.searchParams.get('secret') ?? '';
  if (!userId || !secret) {
    throw redirect(303, '/login?error=oauth_token');
  }

  const { Client, Account, Users } = await import('node-appwrite');

  // 1. Validate the OAuth token by exchanging it for an Appwrite session.
  //    If userId/secret were forged the call 401s and we bail.
  const userClient = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT!)
    .setProject(env.APPWRITE_PROJECT_ID!);
  const userAccount = new Account(userClient);
  try {
    await userAccount.createSession(userId, secret);
  } catch (err) {
    if (env.NODE_ENV !== 'production') console.error('OAuth token exchange failed:', err);
    throw redirect(303, '/login?error=oauth_invalid');
  }

  // 2. Read full user record via the admin SDK so we have email, name, prefs.
  const adminClient = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT!)
    .setProject(env.APPWRITE_PROJECT_ID!)
    .setKey(env.APPWRITE_API_KEY!);
  const users = new Users(adminClient);

  let user: import('node-appwrite').Models.User<import('$lib/types').UserPreferences> | undefined;
  try {
    user = await users.get<import('$lib/types').UserPreferences>(userId);
  } catch (err) {
    if (env.NODE_ENV !== 'production') console.error('users.get after OAuth failed:', err);
    throw redirect(303, '/login?error=oauth_user');
  }
  const email: string = user?.email ?? '';
  if (!email) throw redirect(303, '/login?error=oauth_email');

  // 3. Determine role: prefs.role first, then team membership.
  const prefs = user?.prefs ?? {};
  const prefRole = typeof prefs.role === 'string' ? prefs.role : '';
  let role: 'user' | 'ngo' | 'volunteer' = 'user';
  if (prefRole === 'ngo') role = 'ngo';
  else if (prefRole === 'volunteer') role = 'volunteer';

  if (env.APPWRITE_API_KEY) {
    try {
      const { NGO_TEAM_ID, VOLUNTEER_TEAM_ID, isUserInTeam } = await import('$lib/server/teams');
      if (NGO_TEAM_ID && (await isUserInTeam(userId, NGO_TEAM_ID))) role = 'ngo';
      else if (VOLUNTEER_TEAM_ID && (await isUserInTeam(userId, VOLUNTEER_TEAM_ID))) role = 'volunteer';
    } catch (err) {
      if (env.NODE_ENV !== 'production') console.log('Team check failed in OAuth callback:', err);
    }
  }

  // 4. Mint mm_session and the resilience role-hint cookie.
  const session = createAppSession({ userId, email, role });
  const secure = event.url.protocol === 'https:' || env.NODE_ENV === 'production';
  event.cookies.set('mm_session', session.id, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: SESSION_TTL_SECONDS
  });
  event.cookies.set('mm_role', role, {
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: SESSION_TTL_SECONDS
  });

  // 5. Land users without a chosen role on /profile so they can pick one.
  const hasRole = prefRole === 'ngo' || prefRole === 'volunteer';
  throw redirect(303, hasRole ? '/dashboard' : '/profile');
};
