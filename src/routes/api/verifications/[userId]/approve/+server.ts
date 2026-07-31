import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isUserAdmin } from '$lib/server/teams';
import { getVerificationByUserId, getUserEmail, setUserVerificationPref, setVerificationStatus } from '$lib/server/verifications';
import { setTasksVerifiedForOrg } from '$lib/server/appwrite';
import { sendVerificationApproved } from '$lib/server/email';

export const POST: RequestHandler = async (event) => {
  const session = event.locals.session;
  const adminId = session?.user?.id;
  if (!adminId || !(await isUserAdmin(adminId))) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const targetUserId = event.params.userId;
  if (!targetUserId) return json({ error: 'Missing userId' }, { status: 400 });

  const before = await getVerificationByUserId(targetUserId);
  if (!before) return json({ error: 'Verification not found' }, { status: 404 });

  const updated = await setVerificationStatus(targetUserId, 'approved', adminId);
  if (!updated) return json({ error: 'Failed to approve' }, { status: 500 });

  // Backfill: existing tasks owned by this NGO now show the Verified chip.
  let tasksUpdated = 0;
  try { tasksUpdated = await setTasksVerifiedForOrg(targetUserId, true); } catch {}

  // Sync the user's prefs so client-side UI sees the new status without a fetch.
  await setUserVerificationPref(targetUserId, 'approved');

  // Notify the NGO via email.
  let emailResult: { ok: boolean; error?: string } = { ok: false };
  try {
    const email = await getUserEmail(targetUserId);
    if (email) emailResult = await sendVerificationApproved({ to: email, orgName: updated.orgName });
  } catch (err) {
    emailResult = { ok: false, error: (err as Error).message };
  }

  return json({ ok: true, verification: updated, tasksUpdated, email: emailResult });
};
