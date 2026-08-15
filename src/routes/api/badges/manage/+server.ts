import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getUserRole } from '$lib/server/auth';
import { createBadgeDefinition, deleteBadgeDefinition, listBadgeDefinitions } from '$lib/server/badgeDefs';

const VALID_CRITERIA = new Set(['task-completion', 'task-specific', 'time-based', 'milestone', 'custom']);

function getOrgId(event: Parameters<RequestHandler>[0]): string | null {
  const session = event.locals.session;
  return session?.user?.id ?? null;
}

export const POST: RequestHandler = async (event) => {
  const role = await getUserRole(event);
  if (role !== 'ngo') return json({ error: 'Forbidden' }, { status: 403 });

  const orgId = getOrgId(event);
  if (!orgId) return json({ error: 'Not signed in' }, { status: 401 });

  interface ManageBadgeBody {
    label?: string;
    color?: string;
    icon?: string;
    criteria?: import('$lib/types').BadgeDefinition['criteria'];
    taskId?: string;
    description?: string;
  }

  let body: ManageBadgeBody | null = null;
  try { body = (await event.request.json()) as ManageBadgeBody; } catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }

  const label = String(body?.label ?? '').trim();
  const color = String(body?.color ?? '#FF6B6B').trim();
  const icon = body?.icon ? String(body.icon).trim() : undefined;
  const criteria = String(body?.criteria ?? 'task-completion') as import('$lib/types').BadgeDefinition['criteria'];
  const taskId = body?.taskId ? String(body.taskId).trim() : undefined;
  const description = body?.description ? String(body.description).trim().slice(0, 500) : undefined;

  if (!label) return json({ error: 'Badge label is required' }, { status: 400 });
  if (label.length > 100) return json({ error: 'Badge label too long (max 100 chars)' }, { status: 400 });
  if (!/^#[0-9a-fA-F]{3,8}$/.test(color)) return json({ error: 'Invalid color (must be hex like #FF6B6B)' }, { status: 400 });
  if (!VALID_CRITERIA.has(criteria)) return json({ error: 'Invalid criteria' }, { status: 400 });
  if (criteria === 'task-specific' && !taskId) return json({ error: 'taskId is required when criteria=task-specific' }, { status: 400 });

  try {
    const def = await createBadgeDefinition({
      orgId,
      label,
      color,
      icon,
      criteria,
      taskId,
      description
    });
    return json({ ok: true, badge: def }, { status: 201 });
  } catch (err) {
    console.error('Badge definition create error:', err);
    return json({ error: 'Failed to create badge' }, { status: 500 });
  }
};

export const GET: RequestHandler = async (event) => {
  const role = await getUserRole(event);
  if (role !== 'ngo') return json({ error: 'Forbidden' }, { status: 403 });
  const orgId = getOrgId(event);
  if (!orgId) return json({ error: 'Not signed in' }, { status: 401 });
  const defs = await listBadgeDefinitions(orgId);
  return json({ badges: defs });
};

export const DELETE: RequestHandler = async (event) => {
  const role = await getUserRole(event);
  if (role !== 'ngo') return json({ error: 'Forbidden' }, { status: 403 });
  const orgId = getOrgId(event);
  if (!orgId) return json({ error: 'Not signed in' }, { status: 401 });

  const id = event.url.searchParams.get('id');
  if (!id) return json({ error: 'Missing badge id' }, { status: 400 });

  const ok = await deleteBadgeDefinition(id, orgId);
  if (!ok) return json({ error: 'Not found or not owned by you' }, { status: 404 });
  return json({ ok: true });
};
