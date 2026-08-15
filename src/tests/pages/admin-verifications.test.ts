import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({ mocks: { isUserAdmin: vi.fn() } }));
vi.mock('$lib/server/teams', () => ({ isUserAdmin: mocks.isUserAdmin }));

import { load } from '../../routes/admin/verifications/+page.server';

function makeEvent(userId?: string | null): Parameters<typeof load>[0] {
  return { locals: userId ? { session: { user: { id: userId } } } : {} } as unknown as Parameters<typeof load>[0];
}

interface HttpError {
  status?: number;
  location?: string;
  body?: { message?: string };
}
async function expectThrow(promise: unknown, matcher: (err: HttpError) => void) {
  try {
    await promise;
    throw new Error('expected load() to throw');
  } catch (err: unknown) {
    matcher(err as HttpError);
  }
}

describe('/admin/verifications load', () => {
  beforeEach(() => mocks.isUserAdmin.mockReset());

  it('redirects to login when there is no session', async () => {
    await expectThrow(load(makeEvent()), (err) => {
      expect(err.status).toBe(303);
      expect(err.location).toBe('/login?next=/admin/verifications');
    });
  });

  it('403s when the session user is not an admin', async () => {
    mocks.isUserAdmin.mockResolvedValue(false);
    await expectThrow(load(makeEvent('user-1')), (err) => {
      expect(err.status).toBe(403);
    });
  });

  it('returns {} for an admin user', async () => {
    mocks.isUserAdmin.mockResolvedValue(true);
    const result = await load(makeEvent('admin-1'));
    expect(result).toEqual({});
  });
});
