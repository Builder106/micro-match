import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    createTask: vi.fn(),
    getTaskById: vi.fn(),
    createClaim: vi.fn(),
    awardBadge: vi.fn(),
    listBadgeDefinitions: vi.fn(),
    createBadgeDefinition: vi.fn(),
    upsertVerification: vi.fn(),
    createSession: vi.fn()
  }
}));

vi.mock('$lib/server/appwrite', () => ({
  createTask: mocks.createTask,
  getTaskById: mocks.getTaskById,
  createClaim: mocks.createClaim,
  awardBadge: mocks.awardBadge
}));

vi.mock('$lib/server/badgeDefs', () => ({
  listBadgeDefinitions: mocks.listBadgeDefinitions,
  createBadgeDefinition: mocks.createBadgeDefinition
}));

vi.mock('$lib/server/session', () => ({
  createSession: mocks.createSession,
  SESSION_TTL_SECONDS: 86400
}));

vi.mock('$lib/server/verifications', () => ({
  upsertVerification: mocks.upsertVerification
}));


import { POST } from '../../routes/api/test/a11y/+server';

function makeEvent(opts: { body?: unknown } = {}) {

  const cookieJar: Record<string, string> = {};
  return {
    request: {
      json: async () => {
        if (opts.body === undefined) throw new Error('no body');
        return opts.body;
      }
    },
    cookies: {
      set: vi.fn((key: string, value: string) => {
        cookieJar[key] = value;
      })
    }
  } as unknown as import('@sveltejs/kit').RequestEvent;
}

describe('POST /api/test/a11y', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.createTask.mockResolvedValue({ id: 'task-a11y-1' });
    mocks.getTaskById.mockResolvedValue(null);
    mocks.createClaim.mockResolvedValue({ id: 'claim-a11y-1' });
    mocks.awardBadge.mockResolvedValue({ id: 'badge-a11y-1' });
    mocks.listBadgeDefinitions.mockResolvedValue([]);
    mocks.createBadgeDefinition.mockResolvedValue({ id: 'def-a11y-1' });
    mocks.upsertVerification.mockResolvedValue({ id: 'ver-a11y-1' });
    mocks.createSession.mockReturnValue({ id: 'sess-a11y-1' });
  });

  it('throws 404 when harness is disabled', async () => {
    const orig = process.env.PLAYWRIGHT_A11Y_HARNESS;
    delete process.env.PLAYWRIGHT_A11Y_HARNESS;
    try {
      await expect(POST(makeEvent({ body: { action: 'seed' } }))).rejects.toMatchObject({ status: 404 });
    } finally {
      if (orig) process.env.PLAYWRIGHT_A11Y_HARNESS = orig;
    }
  });

  it('handles seed action by creating fixtures and returning taskId', async () => {
    process.env.PLAYWRIGHT_A11Y_HARNESS = '1';
    const event = makeEvent({ body: { action: 'seed' } });

    const res = await POST(event);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.taskId).toBe('task-a11y-1');
    expect(mocks.createTask).toHaveBeenCalled();
    expect(mocks.createClaim).toHaveBeenCalled();
    expect(mocks.awardBadge).toHaveBeenCalled();
    expect(mocks.createBadgeDefinition).toHaveBeenCalled();
    expect(mocks.upsertVerification).toHaveBeenCalled();

    // Call seed again when task already exists and badge definitions exist
    mocks.getTaskById.mockResolvedValue({ id: 'task-a11y-1' });
    mocks.listBadgeDefinitions.mockResolvedValue([{ id: 'def-a11y-1' }]);
    mocks.createTask.mockClear();
    mocks.createBadgeDefinition.mockClear();

    const res2 = await POST(makeEvent({ body: { action: 'seed' } }));
    const body2 = await res2.json();
    expect(body2.taskId).toBe('task-a11y-1');
    expect(mocks.createTask).not.toHaveBeenCalled();
    expect(mocks.createBadgeDefinition).not.toHaveBeenCalled();
  });




  it('handles session action by setting cookies and returning role and userId', async () => {
    const event = makeEvent({ body: { action: 'session', role: 'volunteer' } });
    const res = await POST(event);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ role: 'volunteer', userId: 'a11y-volunteer' });
    expect(mocks.createSession).toHaveBeenCalled();
    expect(event.cookies.set).toHaveBeenCalledWith('mm_session', 'sess-a11y-1', expect.any(Object));
    expect(event.cookies.set).toHaveBeenCalledWith('mm_role', 'volunteer', expect.any(Object));

    // Admin role
    const eventAdmin = makeEvent({ body: { action: 'session', role: 'admin' } });
    const resAdmin = await POST(eventAdmin);
    const bodyAdmin = await resAdmin.json();
    expect(resAdmin.status).toBe(200);
    expect(bodyAdmin).toEqual({ role: 'admin', userId: 'a11y-admin' });
  });

  it('returns 400 on unsupported actions and invalid bodies', async () => {
    const event = makeEvent({ body: { action: 'unknown' } });
    const res = await POST(event);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Unsupported accessibility harness action');

    // Invalid JSON / no body
    const eventNoBody = makeEvent({});
    const resNoBody = await POST(eventNoBody);
    expect(resNoBody.status).toBe(400);
  });

});
