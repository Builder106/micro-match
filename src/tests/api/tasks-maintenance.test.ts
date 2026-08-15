import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    isUserAdmin: vi.fn(),
    expireTasks: vi.fn(),
    autoArchiveTasks: vi.fn()
  }
}));

vi.mock('$lib/server/teams', () => ({ isUserAdmin: mocks.isUserAdmin }));
vi.mock('$lib/server/appwrite', () => ({
  expireTasks: mocks.expireTasks,
  autoArchiveTasks: mocks.autoArchiveTasks
}));

import { GET, POST } from '../../routes/api/tasks/maintenance/+server';

function makeEvent(opts: { userId?: string | null; body?: unknown } = {}) {
  return {
    locals: { session: opts.userId ? { user: { id: opts.userId } } : null },
    request: {
      json: async () => {
        if (opts.body === undefined) throw new Error('no body');
        return opts.body;
      }
    }
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('GET/POST /api/tasks/maintenance', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.isUserAdmin.mockResolvedValue(true);
    mocks.expireTasks.mockResolvedValue(2);
    mocks.autoArchiveTasks.mockResolvedValue(5);
  });

  it('GET returns 403 for a plain NGO session (not admin)', async () => {
    mocks.isUserAdmin.mockResolvedValue(false);
    const res = await GET(makeEvent({ userId: 'ngo-1' }));
    expect(res.status).toBe(403);
    expect(mocks.expireTasks).not.toHaveBeenCalled();
  });

  it('GET returns 403 when there is no session at all', async () => {
    const res = await GET(makeEvent({ userId: null }));
    expect(res.status).toBe(403);
    expect(mocks.isUserAdmin).not.toHaveBeenCalled();
  });

  it('GET runs both sweeps for an admin', async () => {
    const res = await GET(makeEvent({ userId: 'admin-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mocks.isUserAdmin).toHaveBeenCalledWith('admin-1');
    expect(body).toMatchObject({ success: true, expiredCount: 2, archivedCount: 5 });
  });

  it('POST returns 403 for a plain NGO session (not admin)', async () => {
    mocks.isUserAdmin.mockResolvedValue(false);
    const res = await POST(makeEvent({ userId: 'ngo-1', body: { action: 'both' } }));
    expect(res.status).toBe(403);
    expect(mocks.expireTasks).not.toHaveBeenCalled();
    expect(mocks.autoArchiveTasks).not.toHaveBeenCalled();
  });

  it('POST rejects an invalid action with 400 for an admin', async () => {
    const res = await POST(makeEvent({ userId: 'admin-1', body: { action: 'nuke' } }));
    expect(res.status).toBe(400);
  });

  it('POST runs the requested action for an admin', async () => {
    const res = await POST(makeEvent({ userId: 'admin-1', body: { action: 'expire' } }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mocks.expireTasks).toHaveBeenCalled();
    expect(mocks.autoArchiveTasks).not.toHaveBeenCalled();
    expect(body).toMatchObject({ success: true, expiredCount: 2 });
  });
});
