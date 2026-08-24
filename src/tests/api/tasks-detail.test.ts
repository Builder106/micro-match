import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getUserRole: vi.fn(),
    getTaskById: vi.fn(),
    updateTaskStatus: vi.fn(),
    updateTaskLastActivity: vi.fn(),
    deleteTask: vi.fn()
  }
}));

vi.mock('$lib/server/appwrite', () => ({
  getTaskById: mocks.getTaskById,
  updateTaskStatus: mocks.updateTaskStatus,
  updateTaskLastActivity: mocks.updateTaskLastActivity,
  deleteTask: mocks.deleteTask
}));
vi.mock('$lib/server/auth', () => ({ getUserRole: mocks.getUserRole }));

import { PATCH, DELETE } from '../../routes/api/tasks/[id]/+server';

function makeEvent(opts: { userId?: string | null; taskId?: string; body?: unknown } = {}): Parameters<typeof PATCH>[0] {
  return {
    params: { id: opts.taskId ?? 'task-1' },
    locals: opts.userId ? { session: { user: { id: opts.userId } } } : {},
    request: {
      json: async () => {
        if (opts.body === undefined) throw new Error('no body');
        return opts.body;
      }
    }
  } as unknown as Parameters<typeof PATCH>[0];
}

describe('PATCH /api/tasks/[id]', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.updateTaskLastActivity.mockResolvedValue(undefined);
  });

  it('returns 400 when task id param is missing', async () => {
    const res = await PATCH({
      params: {},
      locals: { session: { user: { id: 'org-1' } } }
    } as unknown as Parameters<typeof PATCH>[0]);
    expect(res.status).toBe(400);
  });

  it('returns 403 for non-NGO roles', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await PATCH(makeEvent({ userId: 'org-1', body: { status: 'completed' } }));
    expect(res.status).toBe(403);
  });

  it('returns 401 when there is no session', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await PATCH(makeEvent({ userId: null, body: {} }));
    expect(res.status).toBe(401);
  });


  it('returns 404 when the task does not exist', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getTaskById.mockResolvedValue(undefined);
    const res = await PATCH(makeEvent({ userId: 'org-1', body: {} }));
    expect(res.status).toBe(404);
  });

  it('returns 403 when the caller does not own the task', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-2' });
    const res = await PATCH(makeEvent({ userId: 'org-1', body: {} }));
    expect(res.status).toBe(403);
  });

  it('updates status and last-activity for the owning org', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1' });
    mocks.updateTaskStatus.mockResolvedValue({ id: 'task-1', status: 'completed' });

    const res = await PATCH(makeEvent({ userId: 'org-1', body: { status: 'completed' } }));

    expect(mocks.updateTaskStatus).toHaveBeenCalledWith('task-1', 'completed');
    expect(mocks.updateTaskLastActivity).toHaveBeenCalledWith('task-1');
    expect(res.status).toBe(200);

    // Body with no status field (only updateTaskLastActivity)
    mocks.updateTaskStatus.mockClear();
    mocks.updateTaskLastActivity.mockClear();
    const resNoStatus = await PATCH(makeEvent({ userId: 'org-1', body: {} }));
    expect(resNoStatus.status).toBe(200);
    expect(mocks.updateTaskStatus).not.toHaveBeenCalled();
    expect(mocks.updateTaskLastActivity).toHaveBeenCalledWith('task-1');
  });


  it('returns 500 when updateTaskStatus fails to find the row', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1' });
    mocks.updateTaskStatus.mockResolvedValue(undefined);

    const res = await PATCH(makeEvent({ userId: 'org-1', body: { status: 'completed' } }));
    expect(res.status).toBe(500);
  });

  it('returns 500 when the request body cannot be parsed', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1' });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const res = await PATCH(makeEvent({ userId: 'org-1' }));
    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });
});

describe('DELETE /api/tasks/[id]', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('returns 400 when task id param is missing', async () => {
    const res = await DELETE({
      params: {},
      locals: { session: { user: { id: 'org-1' } } }
    } as unknown as Parameters<typeof DELETE>[0]);
    expect(res.status).toBe(400);
  });

  it('returns 403 for non-NGO roles', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await DELETE(makeEvent({ userId: 'org-1' }));
    expect(res.status).toBe(403);
  });


  it('returns 401 when there is no session', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await DELETE(makeEvent({ userId: null }));
    expect(res.status).toBe(401);
  });

  it('returns 404 when the task does not exist', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getTaskById.mockResolvedValue(undefined);
    const res = await DELETE(makeEvent({ userId: 'org-1' }));
    expect(res.status).toBe(404);
  });

  it('returns 403 when the caller does not own the task', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-2' });
    const res = await DELETE(makeEvent({ userId: 'org-1' }));
    expect(res.status).toBe(403);
    expect(mocks.deleteTask).not.toHaveBeenCalled();
  });

  it('deletes the task for the owning org', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getTaskById.mockResolvedValue({ id: 'task-1', orgId: 'org-1' });

    const res = await DELETE(makeEvent({ userId: 'org-1' }));

    expect(mocks.deleteTask).toHaveBeenCalledWith('task-1');
    expect(res.status).toBe(200);
  });
});
