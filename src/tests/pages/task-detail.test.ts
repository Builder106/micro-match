import { describe, it, expect, beforeEach, vi } from 'vitest';

const { envState, mocks } = vi.hoisted(() => ({
  envState: {} as Record<string, string | undefined>,
  mocks: {
    getTaskById: vi.fn(),
    usersGet: vi.fn()
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));
vi.mock('$lib/server/appwrite', () => ({ getTaskById: mocks.getTaskById }));
vi.mock('node-appwrite', () => ({
  Client: class { setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } },
  Users: class { get = mocks.usersGet; }
}));

import { load } from '../../routes/task/[id]/+page.server';

function makeEvent(opts: { userId?: string; taskId?: string; search?: string } = {}) {
  return {
    params: { id: opts.taskId ?? 'task-1' },
    url: new URL(`http://test/task/${opts.taskId ?? 'task-1'}${opts.search ?? ''}`),
    locals: opts.userId ? { session: { user: { id: opts.userId } } } : {}
  } as unknown as Parameters<typeof load>[0];
}

async function expectThrow(promise: unknown, status: number) {
  try {
    await promise;
    throw new Error('expected load() to throw');
  } catch (err: unknown) {
    const e = err as { status?: number };
    expect(e.status).toBe(status);
  }
}

describe('/task/[id] load', () => {
  beforeEach(() => {
    for (const key of Object.keys(envState)) delete envState[key];
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('404s when the task does not exist', async () => {
    mocks.getTaskById.mockResolvedValue(undefined);
    await expectThrow(load(makeEvent()), 404);
  });

  it('marks isOwner true when the session user matches the task orgId', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'T', description: 'D' });
    const result = (await load(makeEvent({ userId: 'org-1' }))) as Exclude<Awaited<ReturnType<typeof load>>, void>;
    expect(result.isOwner).toBe(true);
  });

  it('marks isOwner false for a different user', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'T', description: 'D' });
    const result = (await load(makeEvent({ userId: 'user-2' }))) as Exclude<Awaited<ReturnType<typeof load>>, void>;
    expect(result.isOwner).toBe(false);
  });

  it('skips the org-name lookup when Appwrite is not configured', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'T', description: 'D' });
    const result = (await load(makeEvent())) as Exclude<Awaited<ReturnType<typeof load>>, void>;
    expect(result.orgName).toBeNull();
    expect(mocks.usersGet).not.toHaveBeenCalled();
  });

  it('looks up the org display name when Appwrite is configured', async () => {
    envState.APPWRITE_ENDPOINT = 'https://fake.appwrite.io/v1';
    envState.APPWRITE_PROJECT_ID = 'proj';
    envState.APPWRITE_API_KEY = 'key';
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'T', description: 'D' });
    mocks.usersGet.mockResolvedValue({ prefs: { orgName: 'Acme NGO' } });

    const result = (await load(makeEvent())) as Exclude<Awaited<ReturnType<typeof load>>, void>;
    expect(result.orgName).toBe('Acme NGO');
  });

  it('does not request a translation when there is no ?lang= param', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'T', description: 'D' });
    const result = (await load(makeEvent())) as Exclude<Awaited<ReturnType<typeof load>>, void>;
    expect(result.translatedTo).toBeNull();
  });

  it('returns original task content and defers a supported ?lang= translation to the client', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'Hello', description: 'World' });

    const result = (await load(makeEvent({ search: '?lang=es' }))) as Exclude<Awaited<ReturnType<typeof load>>, void>;

    expect(result.task.title).toBe('Hello');
    expect(result.task.description).toBe('World');
    expect(result.translatedTo).toBe('es');
  });

  it('ignores unsupported translation codes', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'Hello', description: 'World' });

    const result = (await load(makeEvent({ search: '?lang=zh-Hans' }))) as Exclude<Awaited<ReturnType<typeof load>>, void>;

    expect(result.task.title).toBe('Hello');
    expect(result.task.description).toBe('World');
    expect(result.translatedTo).toBeNull();
  });
});
