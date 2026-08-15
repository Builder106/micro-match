import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getClaimById, getTaskById, updateClaimStatus } from '$lib/server/appwrite';
import { getUserRole } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
  const role = await getUserRole(event);
  if (role !== 'ngo') return json({ error: 'Forbidden' }, { status: 403 });

  const reviewerId = event.locals.session?.user?.id ?? undefined;
  if (!reviewerId) return json({ error: 'Unauthorized' }, { status: 401 });

  const { params } = event;
  const id = params.id;
  if (!id) return json({ error: 'Missing claim id' }, { status: 400 });

  const claim = await getClaimById(id);
  if (!claim) return json({ error: 'Claim not found' }, { status: 404 });

  const task = claim.taskId ? await getTaskById(claim.taskId) : undefined;
  if (!task) return json({ error: 'Task not found' }, { status: 404 });
  if (task.orgId !== reviewerId) {
    return json({ error: 'Forbidden: You do not own this task' }, { status: 403 });
  }

  const updated = await updateClaimStatus(id, 'rejected', reviewerId);
  if (!updated) return json({ error: 'Failed to reject' }, { status: 500 });

  return json({ ok: true, claim: updated });
};
