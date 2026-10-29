import type { RequestHandler } from '@sveltejs/kit';
import { getClaimById, getTaskById, updateClaimStatus } from '#lib/server/appwrite.js';
import { getUserRole } from '#lib/server/auth.js';

export const POST: RequestHandler = async (event) => {
  const role = await getUserRole(event);
  if (role !== 'ngo') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const reviewerId = event.locals.session?.user?.id ?? undefined;
  if (!reviewerId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { params } = event;
  const id = params.id;
  if (!id) return Response.json({ error: 'Missing claim id' }, { status: 400 });

  const claim = await getClaimById(id);
  if (!claim) return Response.json({ error: 'Claim not found' }, { status: 404 });

  const task = claim.taskId ? await getTaskById(claim.taskId) : undefined;
  if (!task) return Response.json({ error: 'Task not found' }, { status: 404 });
  if (task.orgId !== reviewerId) {
    return Response.json({ error: 'Forbidden: You do not own this task' }, { status: 403 });
  }

  const updated = await updateClaimStatus(id, 'rejected', reviewerId);
  if (!updated) return Response.json({ error: 'Failed to reject' }, { status: 500 });

  return Response.json({ ok: true, claim: updated });
};
