import { env } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { createSession, SESSION_TTL_SECONDS } from '$lib/server/session';

export const POST: RequestHandler = async (event) => {
	try {
		const body = (await event.request.json()) as { jwt?: string | null };
		const jwt = (body?.jwt ?? '').trim();
		if (!jwt) return json({ error: 'Missing jwt' }, { status: 400 });

		const { Client, Account } = await import('node-appwrite');
		const client = new Client()
			.setEndpoint(env.APPWRITE_ENDPOINT!)
			.setProject(env.APPWRITE_PROJECT_ID!)
			.setJWT(jwt);
		const account = new Account(client);

		let user: import('node-appwrite').Models.User<Record<string, unknown>> | undefined;
		try {
			user = await account.get();
		} catch {
			return json({ error: 'Invalid jwt' }, { status: 401 });
		}

		const email: string = user?.email ?? '';
		const userId: string = user?.$id ?? '';
		if (!email || !userId) return json({ error: 'Invalid user' }, { status: 401 });

		// Derive role from prefs or team if needed
		let role: 'user' | 'ngo' | 'volunteer' = 'user';
		let roleSource = 'default';
		
		try {
			const prefs = (user?.prefs ?? {}) as Record<string, unknown>;
			const r = typeof prefs.role === 'string' ? prefs.role : '';
			
			if (r === 'ngo') {
				role = 'ngo';
				roleSource = 'preferences';
			} else if (r === 'volunteer') {
				role = 'volunteer'; 
				roleSource = 'preferences';
			}
			
			// optionally check teams
			if (env.APPWRITE_API_KEY) {
				try {
					const { NGO_TEAM_ID, VOLUNTEER_TEAM_ID, isUserInTeam } = await import(
						'$lib/server/teams'
					);
					if (NGO_TEAM_ID && (await isUserInTeam(userId, NGO_TEAM_ID))) {
						role = 'ngo';
						roleSource = 'team_membership';
					} else if (VOLUNTEER_TEAM_ID && (await isUserInTeam(userId, VOLUNTEER_TEAM_ID))) {
						role = 'volunteer';
						roleSource = 'team_membership';
					}
				} catch (err) {
					if (env.NODE_ENV !== 'production') console.log('Team check failed:', err);
				}
			}
		} catch (err) {
			if (env.NODE_ENV !== 'production') console.log('Role determination failed:', err);
		}

		const session = createSession({ userId, email, role });

		const secure = event.url.protocol === 'https:' || env.NODE_ENV === 'production';
		event.cookies.set('mm_session', session.id, {
			httpOnly: true,
			path: '/',
			sameSite: 'strict',
			secure,
			maxAge: SESSION_TTL_SECONDS
		});

		// Also set a non-HttpOnly role hint as a resilience fallback for UI rendering.
		// This is not used for authorization on APIs; it's only read in hooks to keep
		// sidebar/actions consistent when the in-memory session store is unavailable.
		event.cookies.set('mm_role', role, {
			httpOnly: false,
			path: '/',
			sameSite: 'lax',
			secure,
			maxAge: SESSION_TTL_SECONDS
		});

		return json({ ok: true, role, email, roleSource });
	} catch (err) {
		if (env.NODE_ENV !== 'production') console.error('Session API error:', err);
		return json({ error: 'Bad request' }, { status: 400 });
	}
};

