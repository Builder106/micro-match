import type { APIRequestContext, BrowserContext } from '@playwright/test';

// Test data through the real APIs, as harness users. Namespaces keep each test's people apart.
export type Role = 'volunteer' | 'ngo' | 'admin';

export async function signInAs(context: BrowserContext, role: Role, namespace: string): Promise<string> {
  const res = await context.request.post('/api/test/a11y', { data: { action: 'session', role, namespace } });
  if (!res.ok()) throw new Error(`harness session failed: ${res.status()}`);
  return (await res.json()).userId as string;
}

async function call<T>(request: APIRequestContext, method: 'POST' | 'GET' | 'DELETE', path: string, data?: unknown): Promise<T> {
  const res = await request.fetch(path, { method, data });
  if (!res.ok()) throw new Error(`${method} ${path} -> ${res.status()} ${await res.text()}`);
  return (await res.json()) as T;
}

export type Seeded = { taskIds: string[]; ngo: string; badge: string };

/** A verified nonprofit with a designed patch and some tasks. Returns their ids. */
export async function seedNonprofit(
  browser: { newContext: () => Promise<BrowserContext> },
  namespace: string,
  tasks: { title: string; minutes: number; tags: string[] }[],
  badge = { label: `Helper ${namespace}`, color: '#3B4A8C', icon: 'quilt:book' }
): Promise<Seeded> {
  const ngoCtx = await browser.newContext();
  const adminCtx = await browser.newContext();
  const ngo = await signInAs(ngoCtx, 'ngo', namespace);
  await signInAs(adminCtx, 'admin', namespace);
  await call(ngoCtx.request, 'POST', '/api/verifications', { orgName: `E2E nonprofit ${namespace}`, country: 'US', taxId: '00-0000000' });
  await call(adminCtx.request, 'POST', `/api/verifications/${ngo}/approve`);
  await call(ngoCtx.request, 'POST', '/api/badges/manage', { ...badge, criteria: 'task-completion' });
  const taskIds: string[] = [];
  for (const t of tasks) {
    const created = await call<{ id: string }>(ngoCtx.request, 'POST', '/api/tasks', {
      title: t.title,
      shortDescription: `${t.title}, a short summary.`,
      description: `The brief for ${t.title}.`,
      estimatedMinutes: t.minutes,
      tags: t.tags,
      language: 'English'
    });
    taskIds.push(created.id);
  }
  await ngoCtx.close();
  await adminCtx.close();
  return { taskIds, ngo, badge: badge.label };
}
