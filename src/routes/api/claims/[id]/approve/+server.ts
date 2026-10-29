import type { RequestHandler } from '@sveltejs/kit';
import { getClaimById, getTaskById, updateClaimStatus } from '#lib/server/appwrite.js';
import { getUserRole } from '#lib/server/auth.js';
import { onTaskApproved } from '#lib/server/badgeAwarder.js';

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

  const updated = await updateClaimStatus(id, 'approved', reviewerId);
  if (!updated) return Response.json({ error: 'Failed to approve' }, { status: 500 });

  // Trigger badge awards based on this org's BadgeDefinitions.
  let awarded: string[] = [];
  if (updated.userId && updated.taskId) {
    try {
      awarded = await onTaskApproved(
        updated.userId,
        updated.taskId,
        task.estimatedMinutes ?? undefined,
      );
    } catch (err) {
      console.error('Badge awarding failed:', err);
      // Don't fail the approval if badge awarding fails.
    }
  }

  return Response.json({ ok: true, claim: updated, awardedBadgeIds: awarded });
};
