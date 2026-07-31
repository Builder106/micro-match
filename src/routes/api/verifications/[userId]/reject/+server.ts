import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isUserAdmin } from '$lib/server/teams';
import { getVerificationByUserId, getUserEmail, setUserVerificationPref, setVerificationStatus } from '$lib/server/verifications';
import { setTasksVerifiedForOrg } from '$lib/server/appwrite';
import { sendVerificationRejected } from '$lib/server/email';

export const POST: RequestHandler = async (event) => {
  const session = event.locals.session;
  const adminId = session?.user?.id;
  if (!adminId || !(await isUserAdmin(adminId))) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const targetUserId = event.params.userId;
  if (!targetUserId) return json({ error: 'Missing userId' }, { status: 400 });

  interface RejectPayload { reason?: string }
  let body: RejectPayload;
  try { body = await event.request.json(); } catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const reason = String(body?.reason ?? '').trim();
  if (!reason) return json({ error: 'reason is required' }, { status: 400 });
  if (reason.length > 1000) return json({ error: 'reason too long (max 1000 chars)' }, { status: 400 });

  const before = await getVerificationByUserId(targetUserId);
  if (!before) return json({ error: 'Verification not found' }, { status: 404 });

  const updated = await setVerificationStatus(targetUserId, 'rejected', adminId, reason);
  if (!updated) return json({ error: 'Failed to reject' }, { status: 500 });

  // Backfill: existing tasks owned by this NGO lose the Verified chip.
  let tasksUpdated = 0;
  try { tasksUpdated = await setTasksVerifiedForOrg(targetUserId, false); } catch {}

  await setUserVerificationPref(targetUserId, 'rejected');

  let emailResult: { ok: boolean; error?: string } = { ok: false };
  try {
    const email = await getUserEmail(targetUserId);
    if (email) emailResult = await sendVerificationRejected({ to: email, orgName: updated.orgName, reason });
  } catch (err) {
    emailResult = { ok: false, error: (err as Error).message };
  }

  return json({ ok: true, verification: updated, tasksUpdated, email: emailResult });
};
