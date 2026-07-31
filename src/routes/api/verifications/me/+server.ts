import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getVerificationByUserId, withdrawVerification, setUserVerificationPref } from '$lib/server/verifications';

export const GET: RequestHandler = async (event) => {
  const session = event.locals.session;
  const userId = session?.user?.id;
  if (!userId) return json({ verification: null }, { status: 200 });
  const verification = await getVerificationByUserId(userId);
  return json({ verification: verification ?? null });
};

export const DELETE: RequestHandler = async (event) => {
  const session = event.locals.session;
  const userId = session?.user?.id;
  if (!userId) return json({ error: 'Not signed in' }, { status: 401 });
  const ok = await withdrawVerification(userId);
  if (ok) await setUserVerificationPref(userId, null);
  return json({ ok });
};
