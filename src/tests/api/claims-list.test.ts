import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: { getClaims: vi.fn(), getUserRole: vi.fn() }
}));
vi.mock('$lib/server/appwrite', () => ({ getClaims: mocks.getClaims }));
vi.mock('$lib/server/auth', () => ({ getUserRole: mocks.getUserRole }));

import { GET } from '../../routes/api/claims/+server';

function makeEvent(opts: { userId?: string | null; search?: string } = {}) {
  return {
    locals: opts.userId ? { session: { user: { id: opts.userId } } } : {},
    request: { headers: new Headers() },
    url: new URL(`http://test/api/claims${opts.search ?? ''}`)
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('GET /api/claims', () => {
  beforeEach(() => {
    mocks.getClaims.mockReset();
    mocks.getUserRole.mockReset();
  });

  it('returns 401 when there is no session', async () => {
    const res = await GET(makeEvent());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Authentication required');
  });

  it('returns 401 when getUserRole resolves to anonymous', async () => {
    mocks.getUserRole.mockResolvedValue('anonymous');
    const res = await GET(makeEvent({ userId: 'user-1' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when role is not volunteer, ngo, or user', async () => {
    mocks.getUserRole.mockResolvedValue('superadmin');
    const res = await GET(makeEvent({ userId: 'user-1' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 for an invalid status filter', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const res = await GET(makeEvent({ userId: 'user-1', search: '?status=bogus' }));
    expect(res.status).toBe(400);
  });


  it('returns the user\'s claims with pagination metadata', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    mocks.getClaims.mockResolvedValue([
      { id: 'c1', status: 'pending' },
      { id: 'c2', status: 'approved' }
    ]);

    const res = await GET(makeEvent({ userId: 'user-1' }));
    const body = await res.json();

    expect(mocks.getClaims).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(body.data).toHaveLength(2);
    expect(body.meta).toEqual({ total: 2, limit: 50, offset: 0, hasMore: false });
  });

  it('filters by status and applies limit/offset', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    mocks.getClaims.mockResolvedValue([
      { id: 'c1', status: 'pending' },
      { id: 'c2', status: 'pending' },
      { id: 'c3', status: 'approved' }
    ]);

    const res = await GET(makeEvent({ userId: 'user-1', search: '?status=pending&limit=1&offset=0' }));
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.meta).toEqual({ total: 2, limit: 1, offset: 0, hasMore: true });
  });

  it('returns 500 without leaking error details when getClaims throws', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    mocks.getClaims.mockRejectedValue(new Error('db exploded with secrets'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const res = await GET(makeEvent({ userId: 'user-1' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toMatch(/secrets/);
    errSpy.mockRestore();
  });

  it('returns the same safe response when getClaims rejects with a non-Error value', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    mocks.getClaims.mockRejectedValue('upstream unavailable');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await GET(makeEvent({ userId: 'user-1' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error', data: null });
    errSpy.mockRestore();
  });

  it('uses a timestamp error identifier when crypto.randomUUID is unavailable', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    mocks.getClaims.mockRejectedValue(new Error('upstream unavailable'));
    vi.stubGlobal('crypto', { randomUUID: undefined });
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(12345);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await GET(makeEvent({ userId: 'user-1' }));

    expect(res.status).toBe(500);
    expect(errSpy).toHaveBeenCalledWith(
      'Claims API Error [12345]:',
      expect.objectContaining({ message: 'upstream unavailable' })
    );
    errSpy.mockRestore();
    nowSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
