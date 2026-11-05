import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: { getPublicProfile: vi.fn(), listPublicBadges: vi.fn() },
}));
vi.mock('#lib/server/vault.js', () => ({
  getPublicProfile: mocks.getPublicProfile,
  listPublicBadges: mocks.listPublicBadges,
}));

import { load } from '../../routes/v/[handle]/+page.server';
import { createServerLoadEventFor, requireLoadResult } from '../helpers/createLoadEvent';
import { isHttpError } from '../helpers/httpError';

beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

describe('/v/[handle] load', () => {
  it('returns the handle, name and badges of a public profile, looked up in lower case', async () => {
    mocks.getPublicProfile.mockResolvedValue({
      userId: 'u1',
      handle: 'jane',
      displayName: 'Jane D',
      isPublic: true,
    });
    mocks.listPublicBadges.mockResolvedValue([{ id: 'b', label: 'Pantry' }]);
    const data = requireLoadResult(
      await load(createServerLoadEventFor<typeof load>({ params: { handle: 'JANE' } })),
    );
    expect(data).toEqual({
      handle: 'jane',
      displayName: 'Jane D',
      badges: [{ id: 'b', label: 'Pantry' }],
    });
    expect(mocks.getPublicProfile).toHaveBeenCalledWith('jane');
    expect(mocks.listPublicBadges).toHaveBeenCalledWith('u1');
  });

  it('is a 404 for a private or unknown handle', async () => {
    mocks.getPublicProfile.mockResolvedValue(undefined);
    try {
      await load(createServerLoadEventFor<typeof load>({ params: { handle: 'ghost' } }));
      expect.unreachable();
    } catch (err) {
      if (!isHttpError(err)) throw err;
      expect(err.status).toBe(404);
    }
    expect(mocks.listPublicBadges).not.toHaveBeenCalled();
  });
});
