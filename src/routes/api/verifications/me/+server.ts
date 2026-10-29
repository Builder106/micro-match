import type { RequestHandler } from '@sveltejs/kit';
import {
  getVerificationByUserId,
  withdrawVerification,
  setUserVerificationPref,
} from '#lib/server/verifications.js';

export const GET: RequestHandler = async (event) => {
  const session = event.locals.session;
  const userId = session?.user?.id;
  if (!userId) return Response.json({ verification: null }, { status: 200 });
  const verification = await getVerificationByUserId(userId);
  return Response.json({ verification: verification ?? null });
};

export const DELETE: RequestHandler = async (event) => {
  const session = event.locals.session;
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: 'Not signed in' }, { status: 401 });
  const ok = await withdrawVerification(userId);
  if (ok) await setUserVerificationPref(userId, null);
  return Response.json({ ok });
};
