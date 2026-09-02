import { error, json, type RequestHandler } from '@sveltejs/kit';
import { awardBadge, createClaim, createTask, getTaskById } from '$lib/server/appwrite';
import { createBadgeDefinition, listBadgeDefinitions } from '$lib/server/badgeDefs';
import { createSession, SESSION_TTL_SECONDS } from '$lib/server/session';
import { upsertVerification } from '$lib/server/verifications';

function isHarnessEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.PLAYWRIGHT_A11Y_HARNESS === '1';
}


const identities = {
  volunteer: { userId: 'a11y-volunteer', email: 'a11y-volunteer@example.test', role: 'volunteer' as const },
  ngo: { userId: 'a11y-ngo', email: 'a11y-ngo@example.test', role: 'ngo' as const },
  admin: { userId: 'a11y-admin', email: 'a11y-admin@example.test', role: 'user' as const }
};

const namespacePattern = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const seededTaskIds = new Map<string, string>();
const seeding = new Map<string, Promise<string>>();

function requireHarness(): void {
  if (!isHarnessEnabled()) throw error(404, 'Not found');
}

function requireNamespace(value: unknown): string {
  if (typeof value !== 'string' || !namespacePattern.test(value)) {
    throw error(400, 'A valid accessibility harness namespace is required.');
  }
  return value;
}

function namespaceIdentity(namespace: string, role: keyof typeof identities) {
  const identity = identities[role];
  return { ...identity, userId: `${identity.userId}-${namespace}`, email: `${role}-${namespace}@example.test` };
}

async function seedFixtures(namespace: string): Promise<{ taskId: string }> {
  const existingTaskId = seededTaskIds.get(namespace);
  if (existingTaskId && await getTaskById(existingTaskId)) return { taskId: existingTaskId };

  const pending = seeding.get(namespace);
  if (pending) return { taskId: await pending };

  const promise = (async () => {
    const namespaceIdentities = {
      volunteer: namespaceIdentity(namespace, 'volunteer'),
      ngo: namespaceIdentity(namespace, 'ngo'),
      admin: namespaceIdentity(namespace, 'admin')
    };
    const task = await createTask({
      orgId: namespaceIdentities.ngo.userId,
      title: 'Accessibility fixture task',
      shortDescription: 'A deterministic task for accessibility checks.',
      description: 'Review a short public document and submit a clear proof note.',
      language: 'English',
      tags: ['accessibility', 'documentation'],
      estimatedMinutes: 15,
      status: 'active',
      maxVolunteers: 5,
      isVerified: true,
      lastActivityAt: new Date().toISOString()
    });
    seededTaskIds.set(namespace, task.id);
    await createClaim({
      taskId: task.id,
      userId: namespaceIdentities.volunteer.userId,
      status: 'approved',
      notes: 'Accessibility fixture claim',
      proofUrl: 'https://example.com/a11y-proof'
    });
    await awardBadge({
      userId: namespaceIdentities.volunteer.userId,
      taskId: task.id,
      label: 'Accessibility Reviewer',
      color: '#2563eb'
    });
    if ((await listBadgeDefinitions(namespaceIdentities.ngo.userId)).length === 0) {
      await createBadgeDefinition({
        orgId: namespaceIdentities.ngo.userId,
        label: 'Accessibility Reviewer',
        color: '#2563eb',
        criteria: 'task-completion',
        description: 'Awarded for completing an accessibility review.'
      });
    }

    await upsertVerification({
      userId: namespaceIdentities.ngo.userId,
      orgName: `Accessibility Fixture NGO ${namespace}`,
      country: 'US',
      taxId: `A11Y-${namespace}`
    });

    return task.id;
  })();
  seeding.set(namespace, promise);
  try {
    return { taskId: await promise };
  } finally {
    seeding.delete(namespace);
  }
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  requireHarness();
  const body = await request.json().catch(() => ({})) as { action?: string; role?: string; namespace?: unknown };
  const namespace = requireNamespace(body.namespace);

  if (body.action === 'seed') return json(await seedFixtures(namespace), { headers: { 'cache-control': 'no-store' } });

  if (body.action === 'session' && body.role && body.role in identities) {
    const identity = namespaceIdentity(namespace, body.role as keyof typeof identities);
    const session = createSession({ ...identity, ttlSeconds: SESSION_TTL_SECONDS });
    cookies.set('mm_session', session.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: SESSION_TTL_SECONDS
    });
    cookies.set('mm_role', identity.role, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: false,
      maxAge: SESSION_TTL_SECONDS
    });
    return json({ namespace, role: body.role, userId: identity.userId }, { headers: { 'cache-control': 'no-store' } });
  }

  return json({ error: 'Unsupported accessibility harness action.' }, { status: 400 });
};
