import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getTasks: vi.fn(),
    createTask: vi.fn(),
    getUserRole: vi.fn(),
    getVerificationByUserId: vi.fn(),
    moderateText: vi.fn()
  }
}));

vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks, createTask: mocks.createTask }));
vi.mock('$lib/server/auth', () => ({ getUserRole: mocks.getUserRole }));
vi.mock('$lib/server/verifications', () => ({ getVerificationByUserId: mocks.getVerificationByUserId }));
vi.mock('$lib/server/contentsafety', () => ({ moderateText: mocks.moderateText }));

import { GET, POST } from '../../routes/api/tasks/+server';

function makeEvent(opts: { orgId?: string | null; body?: unknown } = {}) {
  return {
    locals: opts.orgId ? { session: { user: { id: opts.orgId } } } : {},
    request: {
      json: async () => {
        if (opts.body === undefined) throw new Error('no body');
        return opts.body;
      }
    }
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('GET /api/tasks', () => {
  beforeEach(() => mocks.getTasks.mockReset());

  it('returns a public read-only projection of every task', async () => {
    mocks.getTasks.mockResolvedValue([{
      id: 't1', orgId: 'org-1', title: 'T', shortDescription: 's', description: 'long',
      tags: ['a'], estimatedMinutes: 10, language: 'en', status: 'active'
    }]);

    const res = await GET({} as unknown as import("@sveltejs/kit").RequestEvent);
    const body = await res.json();

    expect(body).toEqual([{ id: 't1', title: 'T', shortDescription: 's', tags: ['a'], estimatedMinutes: 10, language: 'en' }]);
    // orgId/status/description are not part of the public projection
    expect(body[0].orgId).toBeUndefined();
    expect(body[0].description).toBeUndefined();
  });
});

const validBody = { title: 'Translate flyer', shortDescription: 'Short', description: 'Long', tags: ['i18n'] };

describe('POST /api/tasks', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.moderateText.mockResolvedValue({ blocked: false, reasons: [] });
    mocks.getVerificationByUserId.mockResolvedValue(undefined);
    mocks.createTask.mockImplementation(async (input: Record<string, unknown>) => ({ id: 'new-task', ...input }));
  });

  it('returns 403 for non-NGO roles', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await POST(makeEvent({ orgId: 'org-1', body: validBody }));
    expect(res.status).toBe(403);
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it('returns 401 when there is no session', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await POST(makeEvent({ orgId: null, body: validBody }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when title or shortDescription is missing', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await POST(makeEvent({ orgId: 'org-1', body: { title: 'Only title' } }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when content moderation blocks the task text', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.moderateText.mockResolvedValue({ blocked: true, reasons: [{ category: 'Hate', severity: 5 }] });

    const res = await POST(makeEvent({ orgId: 'org-1', body: validBody }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.reasons).toEqual([{ category: 'Hate', severity: 5 }]);
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it('derives isVerified from the org\'s verification status', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getVerificationByUserId.mockResolvedValue({ status: 'approved' });

    await POST(makeEvent({ orgId: 'org-1', body: validBody }));

    expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({ isVerified: true, status: 'active' }));
  });

  it('sets isVerified false when the org has no approved verification', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getVerificationByUserId.mockResolvedValue({ status: 'pending' });

    await POST(makeEvent({ orgId: 'org-1', body: validBody }));

    expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({ isVerified: false }));
  });

  it('returns the created task with a 201 status', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await POST(makeEvent({ orgId: 'org-1', body: validBody }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('new-task');
  });
});
