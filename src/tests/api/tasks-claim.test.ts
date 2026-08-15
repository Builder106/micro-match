import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getUserRole: vi.fn(),
    getTaskById: vi.fn(),
    createClaim: vi.fn(),
    moderateText: vi.fn()
  }
}));

vi.mock('$lib/server/appwrite', () => ({ createClaim: mocks.createClaim, getTaskById: mocks.getTaskById }));
vi.mock('$lib/server/auth', () => ({ getUserRole: mocks.getUserRole }));
vi.mock('$lib/server/contentsafety', () => ({ moderateText: mocks.moderateText }));

import { POST } from '../../routes/api/tasks/[id]/claim/+server';

function makeEvent(opts: { userId?: string | null; taskId?: string; body?: unknown } = {}) {
  return {
    params: { id: opts.taskId ?? 'task-1' },
    locals: opts.userId ? { session: { user: { id: opts.userId } } } : {},
    request: { json: async () => opts.body ?? {} }
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('POST /api/tasks/[id]/claim', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.moderateText.mockResolvedValue({ blocked: false, reasons: [] });
    mocks.createClaim.mockImplementation(async (input: Record<string, unknown>) => ({ id: 'claim-1', status: 'pending', ...input }));
  });

  it('returns 401 for an anonymous caller', async () => {
    mocks.getUserRole.mockResolvedValue('anonymous');
    const res = await POST(makeEvent());
    expect(res.status).toBe(401);
    expect(mocks.createClaim).not.toHaveBeenCalled();
  });

  it('returns 404 when the task does not exist', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    mocks.getTaskById.mockResolvedValue(undefined);
    const res = await POST(makeEvent());
    expect(res.status).toBe(404);
  });

  it('returns 400 when the notes fail content moderation', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    mocks.getTaskById.mockResolvedValue({ id: 'task-1' });
    mocks.moderateText.mockResolvedValue({ blocked: true, reasons: [{ category: 'Hate', severity: 6 }] });

    const res = await POST(makeEvent({ userId: 'user-1', body: { notes: 'nasty' } }));
    expect(res.status).toBe(400);
    expect(mocks.createClaim).not.toHaveBeenCalled();
  });

  it('does not run moderation when there are no notes', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    mocks.getTaskById.mockResolvedValue({ id: 'task-1' });

    await POST(makeEvent({ userId: 'user-1', body: { proofUrl: 'https://proof' } }));
    expect(mocks.moderateText).not.toHaveBeenCalled();
  });

  it('creates a claim tied to the task and the session user', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    mocks.getTaskById.mockResolvedValue({ id: 'task-1' });

    const res = await POST(makeEvent({ userId: 'user-1', taskId: 'task-1', body: { proofUrl: 'https://proof', notes: 'done' } }));

    expect(mocks.createClaim).toHaveBeenCalledWith({
      taskId: 'task-1', proofUrl: 'https://proof', notes: 'done', userId: 'user-1'
    });
    expect(res.status).toBe(201);
  });

  it('allows an unauthenticated (non-anonymous-role) claim to omit userId', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    mocks.getTaskById.mockResolvedValue({ id: 'task-1' });

    await POST(makeEvent({ userId: null, taskId: 'task-1', body: {} }));

    expect(mocks.createClaim).toHaveBeenCalledWith(expect.objectContaining({ userId: undefined }));
  });
});
