import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getUserRole: vi.fn(),
    isUserAdmin: vi.fn(),
    upsertVerification: vi.fn(),
    listVerifications: vi.fn(),
    setUserVerificationPref: vi.fn(),
    lookupNonprofitByEin: vi.fn()
  }
}));

vi.mock('$lib/server/auth', () => ({ getUserRole: mocks.getUserRole }));
vi.mock('$lib/server/teams', () => ({ isUserAdmin: mocks.isUserAdmin }));
vi.mock('$lib/server/verifications', () => ({
  upsertVerification: mocks.upsertVerification,
  listVerifications: mocks.listVerifications,
  setUserVerificationPref: mocks.setUserVerificationPref
}));
vi.mock('$lib/server/propublica', () => ({ lookupNonprofitByEin: mocks.lookupNonprofitByEin }));

import { POST, GET } from '../../routes/api/verifications/+server';

function makeEvent(opts: {
  userId?: string | null;
  body?: unknown;
  search?: string;
} = {}) {
  return {
    locals: { session: opts.userId ? { user: { id: opts.userId } } : null },
    request: {
      json: async () => {
        if (opts.body === undefined) throw new Error('no body');
        return opts.body;
      }
    },
    url: new URL(`http://test/api/verifications${opts.search ?? ''}`),
    params: {}
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('POST /api/verifications', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.upsertVerification.mockResolvedValue({
      id: 'v1', userId: 'u1', orgName: 'O', country: 'US', taxId: '123456789',
      status: 'pending', submittedAt: new Date().toISOString()
    });
  });

  it('returns 403 for non-NGO role', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await POST(makeEvent({ userId: 'u1', body: {} }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
    expect(mocks.upsertVerification).not.toHaveBeenCalled();
  });

  it('returns 401 when there is no session userId', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await POST(makeEvent({ userId: null, body: {} }));
    expect(res.status).toBe(401);
    expect(mocks.upsertVerification).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const event = {
      locals: { session: { user: { id: 'u1' } } },
      request: { json: async () => { throw new Error('parse error'); } },
      url: new URL('http://test/api/verifications')
    } as unknown as import("@sveltejs/kit").RequestEvent;
    const res = await POST(event);
    expect(res.status).toBe(400);
  });

  it('rejects when orgName is empty', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await POST(makeEvent({
      userId: 'u1',
      body: { orgName: '   ', country: 'US', taxId: '123456789' }
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/orgName/);
  });

  it('rejects when country is not exactly 2 characters', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await POST(makeEvent({
      userId: 'u1',
      body: { orgName: 'Org', country: 'USA', taxId: '123456789' }
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/country/);
  });

  it('rejects when taxId is missing', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await POST(makeEvent({
      userId: 'u1',
      body: { orgName: 'Org', country: 'US', taxId: '   ' }
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/taxId/);
  });

  it('upper-cases the country code before persisting', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    await POST(makeEvent({
      userId: 'u1',
      body: { orgName: 'Org', country: 'us', taxId: '123' }
    }));
    expect(mocks.upsertVerification).toHaveBeenCalledWith(expect.objectContaining({ country: 'US' }));
  });

  it('persists trimmed values + sets prefs.verificationStatus to pending on success', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const res = await POST(makeEvent({
      userId: 'u1',
      body: { orgName: '  Doctors Without Borders  ', country: 'US', taxId: ' 13-3433452 ', docFileId: 'f-1' }
    }));
    expect(res.status).toBe(200);
    expect(mocks.upsertVerification).toHaveBeenCalledWith({
      userId: 'u1',
      orgName: 'Doctors Without Borders',
      country: 'US',
      taxId: '13-3433452',
      docFileId: 'f-1'
    });
    expect(mocks.setUserVerificationPref).toHaveBeenCalledWith('u1', 'pending');
  });
});

describe('GET /api/verifications (admin list)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('returns 403 when caller is not in the admins team', async () => {
    mocks.isUserAdmin.mockResolvedValue(false);
    const res = await GET(makeEvent({ userId: 'u1' }));
    expect(res.status).toBe(403);
    expect(mocks.listVerifications).not.toHaveBeenCalled();
  });

  it('returns 403 when there is no session', async () => {
    mocks.isUserAdmin.mockResolvedValue(true);
    const res = await GET(makeEvent({ userId: null }));
    expect(res.status).toBe(403);
  });

  it('passes status filter from query string to listVerifications', async () => {
    mocks.isUserAdmin.mockResolvedValue(true);
    mocks.listVerifications.mockResolvedValue([]);

    await GET(makeEvent({ userId: 'admin-1', search: '?status=pending' }));

    expect(mocks.listVerifications).toHaveBeenCalledWith({ status: 'pending' });
  });

  it('omits the filter when no status param is present', async () => {
    mocks.isUserAdmin.mockResolvedValue(true);
    mocks.listVerifications.mockResolvedValue([]);

    await GET(makeEvent({ userId: 'admin-1' }));

    expect(mocks.listVerifications).toHaveBeenCalledWith(undefined);
  });

  it('enriches US rows with the ProPublica lookup result', async () => {
    mocks.isUserAdmin.mockResolvedValue(true);
    mocks.listVerifications.mockResolvedValue([
      { id: 'v1', userId: 'u1', orgName: 'Doctors Without Borders', country: 'US', taxId: '133433452', status: 'pending', submittedAt: '' },
      { id: 'v2', userId: 'u2', orgName: 'British Charity', country: 'GB', taxId: 'CC-1', status: 'pending', submittedAt: '' }
    ]);
    mocks.lookupNonprofitByEin.mockResolvedValue({ found: true, orgName: 'Doctors Without Borders', status: 'active' });

    const res = await GET(makeEvent({ userId: 'admin-1' }));
    const body = await res.json();

    expect(mocks.lookupNonprofitByEin).toHaveBeenCalledExactlyOnceWith('133433452');
    expect(body.verifications[0].propublica).toEqual({ found: true, orgName: 'Doctors Without Borders', status: 'active' });
    expect(body.verifications[1].propublica).toBeNull(); // non-US row skipped
  });
});
