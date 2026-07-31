import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { createTask, getTasks } from '$lib/server/appwrite';
import { getUserRole } from '$lib/server/auth';
import { getVerificationByUserId } from '$lib/server/verifications';
import type { Task } from '$lib/types';
import { moderateText } from '$lib/server/contentsafety';

// PROD: Add rate limiting middleware (e.g., express-rate-limit)
// PROD: Add request validation middleware (e.g., Joi, Zod)
// PROD: Add API versioning support
export const GET: RequestHandler = async () => {
  // PROD: Add caching headers for better performance
  // PROD: Add pagination support with cursor-based pagination
  // PROD: Add filtering and sorting capabilities
  const tasks = await getTasks();
  // public read-only projection for MVP
  const result = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    shortDescription: t.shortDescription,
    tags: t.tags,
    estimatedMinutes: t.estimatedMinutes,
    language: t.language
  } satisfies Partial<Task> & { id: string }));
  return json(result);
};

// PROD: Add input validation and sanitization
// PROD: Add proper error handling with structured logging
// PROD: Add audit logging for all task creations
export const POST: RequestHandler = async (event) => {
  // PROD: Add rate limiting per user/organization
  // PROD: Add request size limits
  // PROD: Add proper authentication and authorization middleware
  const role = await getUserRole(event);
  if (role !== 'ngo') return json({ error: 'Forbidden' }, { status: 403 });
  
  const session = event.locals.session;
  const orgId = session?.user?.id;
  if (!orgId) {
    return json({ error: 'Unauthorized: No user session found' }, { status: 401 });
  }

  const { request } = event;
  const body = (await request.json()) as Partial<Task>;
  if (!body?.title || !body?.shortDescription) {
    return json({ error: 'title and shortDescription are required' }, { status: 400 });
  }

  // PROD: Move content moderation to a background job for better performance
  // PROD: Add content moderation queue and retry logic
  // PROD: Add content moderation caching
  // Content Safety: check title, shortDescription, and description
  const textToCheck = [body.title, body.shortDescription, body.description ?? '']
    .filter(Boolean)
    .join('\n\n');
  const moderation = await moderateText(textToCheck);
  if (moderation.blocked) {
    return json({ error: 'Content failed safety checks', reasons: moderation.reasons }, { status: 400 });
  }
  
  // isVerified is derived server-side from the NGO's verification record.
  // Clients can't claim verification — only the verification queue grants it.
  const verification = await getVerificationByUserId(orgId);
  const isVerified = verification?.status === 'approved';

  const created = await createTask({
    orgId,
    title: body.title,
    shortDescription: body.shortDescription,
    description: body.description ?? '',
    language: body.language ?? 'English',
    tags: Array.isArray(body.tags) ? body.tags : [],
    estimatedMinutes: typeof body.estimatedMinutes === 'number' ? body.estimatedMinutes : undefined,
    status: 'active', // new tasks always start active; status changes are a separate flow
    maxVolunteers: typeof body.maxVolunteers === 'number' ? body.maxVolunteers : undefined,
    deadline: body.deadline,
    isVerified,
    lastActivityAt: new Date().toISOString()
  });
  return json(created, { status: 201 });
};

