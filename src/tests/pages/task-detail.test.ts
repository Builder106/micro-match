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
import { createServerLoadEventFor, requireLoadResult } from '../helpers/createLoadEvent';
import { isHttpError } from '../helpers/httpError';

function makeEvent(opts: { userId?: string; taskId?: string; search?: string } = {}) {
  const taskId = opts.taskId ?? 'task-1';
  return createServerLoadEventFor<typeof load>({
    params: { id: taskId },
    url: `http://test/task/${taskId}${opts.search ?? ''}`,
    userId: opts.userId
  });
}

async function expectThrow(promise: unknown, status: number) {
  try {
    await promise;
    throw new Error('expected load() to throw');
  } catch (err: unknown) {
    if (!isHttpError(err)) {
      throw new Error('expected a structured HTTP error', { cause: err });
    }
    expect(err.status).toBe(status);
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
    const result = requireLoadResult(await load(makeEvent({ userId: 'org-1' })));
    expect(result.isOwner).toBe(true);
  });

  it('marks isOwner false for a different user', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'T', description: 'D' });
    const result = requireLoadResult(await load(makeEvent({ userId: 'user-2' })));
    expect(result.isOwner).toBe(false);
  });

  it('skips the org-name lookup when Appwrite is not configured', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'T', description: 'D' });
    const result = requireLoadResult(await load(makeEvent()));
    expect(result.orgName).toBeNull();
    expect(mocks.usersGet).not.toHaveBeenCalled();

    // Also when task has no orgId
    mocks.getTaskById.mockResolvedValue({ id: 'task-2', orgId: undefined, title: 'T2', description: 'D2' });
    const resultNoOrg = requireLoadResult(await load(makeEvent({ taskId: 'task-2' })));
    expect(resultNoOrg.orgName).toBeNull();
  });


  it('looks up the org display name when Appwrite is configured', async () => {
    envState.APPWRITE_ENDPOINT = 'https://fake.appwrite.io/v1';
    envState.APPWRITE_PROJECT_ID = 'proj';
    envState.APPWRITE_API_KEY = 'key';
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'T', description: 'D' });
    mocks.usersGet.mockResolvedValue({ prefs: { orgName: 'Acme NGO' } });

    const result = requireLoadResult(await load(makeEvent()));
    expect(result.orgName).toBe('Acme NGO');
  });

  it('falls back to u.name when prefs.orgName is missing or throws', async () => {
    envState.APPWRITE_ENDPOINT = 'https://fake.appwrite.io/v1';
    envState.APPWRITE_PROJECT_ID = 'proj';
    envState.APPWRITE_API_KEY = 'key';
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'T', description: 'D' });
    mocks.usersGet.mockResolvedValue({ name: 'Fallback Org Name', prefs: {} });

    const result = requireLoadResult(await load(makeEvent()));
    expect(result.orgName).toBe('Fallback Org Name');

    // Test when prefs.orgName is empty whitespace string
    mocks.usersGet.mockResolvedValue({ name: 'Fallback Name 2', prefs: { orgName: '   ' } });
    const resultWhitespace = requireLoadResult(await load(makeEvent()));
    expect(resultWhitespace.orgName).toBe('Fallback Name 2');

    // Test when prefs.orgName is missing and user has no name either
    mocks.usersGet.mockResolvedValue({ prefs: {} });
    const resultNoName = requireLoadResult(await load(makeEvent()));
    expect(resultNoName.orgName).toBeNull();

    // Test when users.get returns undefined
    mocks.usersGet.mockResolvedValue(undefined);
    const resultUndef = requireLoadResult(await load(makeEvent()));
    expect(resultUndef.orgName).toBeNull();

    // Also verify catch branch
    mocks.usersGet.mockRejectedValue(new Error('user lookup failed'));
    const resultCatch = requireLoadResult(await load(makeEvent()));
    expect(resultCatch.orgName).toBeNull();
  });



  it('does not request a translation when there is no ?lang= param', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'T', description: 'D' });
    const result = requireLoadResult(await load(makeEvent()));
    expect(result.translatedTo).toBeNull();
  });


  it('returns original task content and defers a supported ?lang= translation to the client', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'Hello', description: 'World' });

    const result = requireLoadResult(await load(makeEvent({ search: '?lang=es' })));

    expect(result.task.title).toBe('Hello');
    expect(result.task.description).toBe('World');
    expect(result.translatedTo).toBe('es');
  });

  it('ignores unsupported translation codes', async () => {
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1', title: 'Hello', description: 'World' });

    const result = requireLoadResult(await load(makeEvent({ search: '?lang=zh-Hans' })));

    expect(result.task.title).toBe('Hello');
    expect(result.task.description).toBe('World');
    expect(result.translatedTo).toBeNull();
  });
});
