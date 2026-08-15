import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { listBadgesByUser: vi.fn() } }));
vi.mock('$lib/server/appwrite', () => ({ listBadgesByUser: mocks.listBadgesByUser }));

import { GET } from '../../routes/api/badges/+server';

function makeEvent(opts: { userId?: string; query?: string } = {}) {
  return {
    locals: opts.userId ? { session: { user: { id: opts.userId } } } : {},
    url: new URL(`http://test/api/badges${opts.query ?? ''}`)
  } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('GET /api/badges', () => {
  beforeEach(() => mocks.listBadgesByUser.mockReset());

  it('uses the session userId when present', async () => {
    mocks.listBadgesByUser.mockResolvedValue([{ id: 'b1' }]);
    await GET(makeEvent({ userId: 'user-1' }));
    expect(mocks.listBadgesByUser).toHaveBeenCalledWith('user-1');
  });

  it('falls back to the userId query param when there is no session', async () => {
    mocks.listBadgesByUser.mockResolvedValue([]);
    await GET(makeEvent({ query: '?userId=user-2' }));
    expect(mocks.listBadgesByUser).toHaveBeenCalledWith('user-2');
  });

  it('falls back to "demo-user" when neither session nor query param is present', async () => {
    mocks.listBadgesByUser.mockResolvedValue([]);
    await GET(makeEvent());
    expect(mocks.listBadgesByUser).toHaveBeenCalledWith('demo-user');
  });

  it('returns the badges as JSON', async () => {
    mocks.listBadgesByUser.mockResolvedValue([{ id: 'b1', label: 'Helper' }]);
    const res = await GET(makeEvent({ userId: 'user-1' }));
    const body = await res.json();
    expect(body).toEqual([{ id: 'b1', label: 'Helper' }]);
  });
});
