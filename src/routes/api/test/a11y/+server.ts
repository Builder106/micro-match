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

let seededTaskId: string | undefined;

function requireHarness(): void {
  if (!isHarnessEnabled()) throw error(404, 'Not found');
}


async function seedFixtures(): Promise<{ taskId: string }> {
  if (!seededTaskId || !(await getTaskById(seededTaskId))) {
    const task = await createTask({
      orgId: identities.ngo.userId,
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
    seededTaskId = task.id;
    await createClaim({
      taskId: task.id,
      userId: identities.volunteer.userId,
      status: 'approved',
      notes: 'Accessibility fixture claim',
      proofUrl: 'https://example.com/a11y-proof'
    });
    await awardBadge({
      userId: identities.volunteer.userId,
      taskId: task.id,
      label: 'Accessibility Reviewer',
      color: '#2563eb'
    });
  }

  if ((await listBadgeDefinitions(identities.ngo.userId)).length === 0) {
    await createBadgeDefinition({
      orgId: identities.ngo.userId,
      label: 'Accessibility Reviewer',
      color: '#2563eb',
      criteria: 'task-completion',
      description: 'Awarded for completing an accessibility review.'
    });
  }

  await upsertVerification({
    userId: identities.ngo.userId,
    orgName: 'Accessibility Fixture NGO',
    country: 'US',
    taxId: 'A11Y-0001'
  });

  return { taskId: seededTaskId };
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  requireHarness();
  const body = await request.json().catch(() => ({})) as { action?: string; role?: string };

  if (body.action === 'seed') return json(await seedFixtures(), { headers: { 'cache-control': 'no-store' } });

  if (body.action === 'session' && body.role && body.role in identities) {
    const identity = identities[body.role as keyof typeof identities];
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
    return json({ role: body.role, userId: identity.userId }, { headers: { 'cache-control': 'no-store' } });
  }

  return json({ error: 'Unsupported accessibility harness action.' }, { status: 400 });
};
