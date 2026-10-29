import type { RequestHandler } from '@sveltejs/kit';
import { getUserRole } from '#lib/server/auth.js';
import {
  createBadgeDefinition,
  deleteBadgeDefinition,
  listBadgeDefinitions,
} from '#lib/server/badgeDefs.js';

const VALID_CRITERIA = new Set([
  'task-completion',
  'task-specific',
  'time-based',
  'milestone',
  'custom',
]);

function getOrgId(event: Parameters<RequestHandler>[0]): string | null {
  const session = event.locals.session;
  return session?.user?.id ?? null;
}

export const POST: RequestHandler = async (event) => {
  const role = await getUserRole(event);
  if (role !== 'ngo') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const orgId = getOrgId(event);
  if (!orgId) return Response.json({ error: 'Not signed in' }, { status: 401 });

  interface ManageBadgeBody {
    label?: string;
    color?: string;
    icon?: string;
    criteria?: import('#lib/types.js').BadgeDefinition['criteria'];
    taskId?: string;
    description?: string;
  }

  let body: ManageBadgeBody;
  try {
    body = (await event.request.json()) as ManageBadgeBody;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const label = String(body.label ?? '').trim();
  const color = String(body.color ?? '#FF6B6B').trim();
  const icon = body.icon ? String(body.icon).trim() : undefined;
  const criteria = String(
    body.criteria ?? 'task-completion',
  ) as import('#lib/types.js').BadgeDefinition['criteria'];
  const taskId = body.taskId ? String(body.taskId).trim() : undefined;
  const description = body.description ? String(body.description).trim().slice(0, 500) : undefined;

  if (!label) return Response.json({ error: 'Badge label is required' }, { status: 400 });
  if (label.length > 100)
    return Response.json({ error: 'Badge label too long (max 100 chars)' }, { status: 400 });
  if (!/^#[0-9a-fA-F]{3,8}$/.test(color))
    return Response.json({ error: 'Invalid color (must be hex like #FF6B6B)' }, { status: 400 });
  if (!VALID_CRITERIA.has(criteria))
    return Response.json({ error: 'Invalid criteria' }, { status: 400 });
  if (criteria === 'task-specific' && !taskId)
    return Response.json(
      { error: 'taskId is required when criteria=task-specific' },
      { status: 400 },
    );

  try {
    const def = await createBadgeDefinition({
      orgId,
      label,
      color,
      icon,
      criteria,
      taskId,
      description,
    });
    return Response.json({ ok: true, badge: def }, { status: 201 });
  } catch (err) {
    console.error('Badge definition create error:', err);
    return Response.json({ error: 'Failed to create badge' }, { status: 500 });
  }
};

export const GET: RequestHandler = async (event) => {
  const role = await getUserRole(event);
  if (role !== 'ngo') return Response.json({ error: 'Forbidden' }, { status: 403 });
  const orgId = getOrgId(event);
  if (!orgId) return Response.json({ error: 'Not signed in' }, { status: 401 });
  const defs = await listBadgeDefinitions(orgId);
  return Response.json({ badges: defs });
};

export const DELETE: RequestHandler = async (event) => {
  const role = await getUserRole(event);
  if (role !== 'ngo') return Response.json({ error: 'Forbidden' }, { status: 403 });
  const orgId = getOrgId(event);
  if (!orgId) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const id = event.url.searchParams.get('id');
  if (!id) return Response.json({ error: 'Missing badge id' }, { status: 400 });

  const ok = await deleteBadgeDefinition(id, orgId);
  if (!ok) return Response.json({ error: 'Not found or not owned by you' }, { status: 404 });
  return Response.json({ ok: true });
};
