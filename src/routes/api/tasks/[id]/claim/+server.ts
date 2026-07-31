import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { createClaim, getTaskById } from '$lib/server/appwrite';
import { getUserRole } from '$lib/server/auth';
import { moderateText } from '$lib/server/contentsafety';

export const POST: RequestHandler = async (event) => {
  const role = await getUserRole(event);
  if (role === 'anonymous') return json({ error: 'Unauthorized' }, { status: 401 });
  const { params, request } = event;
  const { id } = params;
  const task = await getTaskById(id);
  if (!task) return json({ error: 'Task not found' }, { status: 404 });

  const body = (await request.json()) as { proofUrl?: string; notes?: string };
  // Content Safety: check notes text only (proofUrl left as-is)
  if (body?.notes) {
    const moderation = await moderateText(body.notes);
    if (moderation.blocked) {
      return json({ error: 'Content failed safety checks', reasons: moderation.reasons }, { status: 400 });
    }
  }
  const sessionUserId = event.locals.session?.user?.id;
  const claim = await createClaim({ taskId: id, proofUrl: body?.proofUrl, notes: body?.notes, userId: sessionUserId ?? undefined });

  // Badges are awarded on approval (not claim), in /api/claims/[id]/approve.

  return json(claim, { status: 201 });
};

