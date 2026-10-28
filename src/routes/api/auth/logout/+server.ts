import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/session';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async (event) => {
  const id = event.cookies.get('mm_session');
  if (id) deleteSession(id);
  const secure = event.url.protocol === 'https:' || env.NODE_ENV === 'production';
  event.cookies.set('mm_session', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure,
    maxAge: 0,
  });
  // Clear role hint cookie as well
  event.cookies.set('mm_role', '', {
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 0,
  });
  return json({ ok: true });
};
