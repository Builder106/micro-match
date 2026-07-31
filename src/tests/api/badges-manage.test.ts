import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getUserRole: vi.fn(),
    createBadgeDefinition: vi.fn(),
    listBadgeDefinitions: vi.fn(),
    deleteBadgeDefinition: vi.fn()
  }
}));

vi.mock('$lib/server/auth', () => ({ getUserRole: mocks.getUserRole }));
vi.mock('$lib/server/badgeDefs', () => ({
  createBadgeDefinition: mocks.createBadgeDefinition,
  listBadgeDefinitions: mocks.listBadgeDefinitions,
  deleteBadgeDefinition: mocks.deleteBadgeDefinition
}));

import { POST, GET, DELETE } from '../../routes/api/badges/manage/+server';

function makeEvent(opts: { orgId?: string | null; body?: unknown; deleteId?: string }) {
  const url = new URL('http://test/api/badges/manage');
  if (opts.deleteId) url.searchParams.set('id', opts.deleteId);
  return {
    locals: { session: opts.orgId ? { user: { id: opts.orgId } } : null },
    request: {
      json: async () => {
        if (opts.body === undefined) throw new Error('no body');
        return opts.body;
      }
    },
    url
  } as any;
}

const validBadge = {
  label: 'Translation Hero',
  color: '#FF6B6B',
  icon: 'hugeicons:trophy-01',
  criteria: 'task-completion',
  description: 'Awarded for translation work'
};

describe('POST /api/badges/manage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.createBadgeDefinition.mockImplementation(async (input: any) => ({
      id: 'def-1',
      orgId: input.orgId,
      ...input,
      createdAt: new Date().toISOString()
    }));
  });

  it('returns 403 for non-NGO role', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await POST(makeEvent({ orgId: 'org-1', body: validBadge }));
    expect(res.status).toBe(403);
    expect(mocks.createBadgeDefinition).not.toHaveBeenCalled();
  });

  it('returns 401 when there is no session', async () => {
    const res = await POST(makeEvent({ orgId: null, body: validBadge }));
    expect(res.status).toBe(401);
  });

  it('rejects empty label with 400', async () => {
    const res = await POST(makeEvent({ orgId: 'org-1', body: { ...validBadge, label: '   ' } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/label/);
  });

  it('rejects label longer than 100 chars', async () => {
    const res = await POST(makeEvent({
      orgId: 'org-1',
      body: { ...validBadge, label: 'x'.repeat(101) }
    }));
    expect(res.status).toBe(400);
  });

  it('rejects malformed hex color', async () => {
    const cases = ['red', '#zzz', 'rgb(255,0,0)', '#GG6B6B'];
    for (const color of cases) {
      const res = await POST(makeEvent({ orgId: 'org-1', body: { ...validBadge, color } }));
      expect(res.status, `color="${color}"`).toBe(400);
    }
  });

  it('accepts valid hex colors of various lengths', async () => {
    const cases = ['#FF6B6B', '#fff', '#FFFFFFFF'];
    for (const color of cases) {
      const res = await POST(makeEvent({ orgId: 'org-1', body: { ...validBadge, color } }));
      expect(res.status, `color="${color}"`).toBe(201);
    }
  });

  it('rejects unsupported criteria values', async () => {
    const res = await POST(makeEvent({
      orgId: 'org-1',
      body: { ...validBadge, criteria: 'cosmic-rays' }
    }));
    expect(res.status).toBe(400);
  });

  it('requires taskId when criteria=task-specific', async () => {
    const res = await POST(makeEvent({
      orgId: 'org-1',
      body: { ...validBadge, criteria: 'task-specific' /* no taskId */ }
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/taskId/);
  });

  it('persists trimmed label, sliced description, and the orgId from session', async () => {
    const res = await POST(makeEvent({
      orgId: 'org-1',
      body: {
        ...validBadge,
        label: '  Trimmed Hero  ',
        description: 'x'.repeat(800) // longer than 500 cap
      }
    }));

    expect(res.status).toBe(201);
    expect(mocks.createBadgeDefinition).toHaveBeenCalledWith(expect.objectContaining({
      orgId: 'org-1',
      label: 'Trimmed Hero'
    }));
    const args = mocks.createBadgeDefinition.mock.calls[0]![0] as { description: string };
    expect(args.description.length).toBe(500);
  });

  it('returns the created badge in a 201 response', async () => {
    const res = await POST(makeEvent({ orgId: 'org-1', body: validBadge }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.badge.id).toBe('def-1');
  });
});

describe('GET /api/badges/manage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('returns 403 for non-NGO', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await GET(makeEvent({ orgId: 'org-1' }));
    expect(res.status).toBe(403);
  });

  it('returns 401 when there is no session', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await GET(makeEvent({ orgId: null }));
    expect(res.status).toBe(401);
  });

  it('passes the session orgId to the listing helper', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.listBadgeDefinitions.mockResolvedValue([{ id: 'd1', orgId: 'org-1', label: 'B', color: '#FF6B6B', criteria: 'task-completion' }]);

    const res = await GET(makeEvent({ orgId: 'org-1' }));
    const body = await res.json();

    expect(mocks.listBadgeDefinitions).toHaveBeenCalledExactlyOnceWith('org-1');
    expect(body.badges).toHaveLength(1);
  });
});

describe('DELETE /api/badges/manage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.getUserRole.mockResolvedValue('ngo');
  });

  it('returns 403 for non-NGO', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await DELETE(makeEvent({ orgId: 'org-1', deleteId: 'def-1' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when id is missing from query', async () => {
    const res = await DELETE(makeEvent({ orgId: 'org-1' }));
    expect(res.status).toBe(400);
  });

  it('passes the orgId so deletion can enforce ownership', async () => {
    mocks.deleteBadgeDefinition.mockResolvedValue(true);

    const res = await DELETE(makeEvent({ orgId: 'org-1', deleteId: 'def-1' }));

    expect(res.status).toBe(200);
    expect(mocks.deleteBadgeDefinition).toHaveBeenCalledWith('def-1', 'org-1');
  });

  it('returns 404 when the underlying delete returns false (wrong owner or missing)', async () => {
    mocks.deleteBadgeDefinition.mockResolvedValue(false);

    const res = await DELETE(makeEvent({ orgId: 'org-1', deleteId: 'def-from-org-2' }));
    expect(res.status).toBe(404);
  });
});
