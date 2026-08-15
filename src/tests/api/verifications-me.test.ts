import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getVerificationByUserId: vi.fn(),
    withdrawVerification: vi.fn(),
    setUserVerificationPref: vi.fn()
  }
}));

vi.mock('$lib/server/verifications', () => ({
  getVerificationByUserId: mocks.getVerificationByUserId,
  withdrawVerification: mocks.withdrawVerification,
  setUserVerificationPref: mocks.setUserVerificationPref
}));

import { GET, DELETE } from '../../routes/api/verifications/me/+server';

function makeEvent(userId?: string | null) {
  return { locals: userId ? { session: { user: { id: userId } } } : {} } as unknown as import("@sveltejs/kit").RequestEvent;
}

describe('GET /api/verifications/me', () => {
  beforeEach(() => mocks.getVerificationByUserId.mockReset());

  it('returns { verification: null } when there is no session', async () => {
    const res = await GET(makeEvent());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ verification: null });
  });

  it('returns the verification for the session user', async () => {
    mocks.getVerificationByUserId.mockResolvedValue({ id: 'v1', status: 'pending' });
    const res = await GET(makeEvent('user-1'));
    expect(await res.json()).toEqual({ verification: { id: 'v1', status: 'pending' } });
  });

  it('returns { verification: null } when none exists for the user', async () => {
    mocks.getVerificationByUserId.mockResolvedValue(undefined);
    const res = await GET(makeEvent('user-1'));
    expect(await res.json()).toEqual({ verification: null });
  });
});

describe('DELETE /api/verifications/me', () => {
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  it('returns 401 when there is no session', async () => {
    const res = await DELETE(makeEvent());
    expect(res.status).toBe(401);
  });

  it('withdraws the verification and clears the pref on success', async () => {
    mocks.withdrawVerification.mockResolvedValue(true);
    const res = await DELETE(makeEvent('user-1'));

    expect(mocks.withdrawVerification).toHaveBeenCalledWith('user-1');
    expect(mocks.setUserVerificationPref).toHaveBeenCalledWith('user-1', null);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('does not touch the pref when there was nothing to withdraw', async () => {
    mocks.withdrawVerification.mockResolvedValue(false);
    const res = await DELETE(makeEvent('user-1'));

    expect(mocks.setUserVerificationPref).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({ ok: false });
  });
});
