import type { RequestHandler } from '@sveltejs/kit';
import { deleteSession } from '#lib/server/session.js';
import { NODE_ENV } from '$app/env/private';

export const POST: RequestHandler = async (event) => {
  const id = event.cookies.get('mm_session');
  if (id) deleteSession(id);
  const secure = event.url.protocol === 'https:' || NODE_ENV === 'production';
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
  return Response.json({ ok: true });
};
