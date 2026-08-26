import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    isUserAdmin: vi.fn()
  }
}));

vi.mock('$lib/server/teams', () => ({
  isUserAdmin: mocks.isUserAdmin
}));

import { load } from '../../routes/+layout.server';

describe('+layout.server load', () => {
  beforeEach(() => {
    mocks.isUserAdmin.mockReset();
  });

  it('returns anonymous role and isAdmin=false when no session exists', async () => {
    const event = {
      locals: {},
      url: new URL('http://localhost:5173/about')
    } as unknown as Parameters<typeof load>[0];

    const result = await load(event);
    expect(result).toEqual({
      userRole: 'anonymous',
      isAdmin: false,
      origin: 'http://localhost:5173',
      locale: 'en'
    });
    expect(mocks.isUserAdmin).not.toHaveBeenCalled();
  });

  it('checks admin status when user session exists', async () => {
    mocks.isUserAdmin.mockResolvedValue(true);

    const event = {
      locals: {
        userRole: 'ngo',
        session: { user: { id: 'admin-user-1' } }
      },
      url: new URL('http://localhost:5173/dashboard')
    } as unknown as Parameters<typeof load>[0];

    const result = await load(event);
    expect(result).toEqual({
      userRole: 'ngo',
      isAdmin: true,
      origin: 'http://localhost:5173',
      locale: 'en'
    });
    expect(mocks.isUserAdmin).toHaveBeenCalledWith('admin-user-1');
  });

  it('returns isAdmin=false when isUserAdmin returns false', async () => {
    mocks.isUserAdmin.mockResolvedValue(false);

    const event = {
      locals: {
        userRole: 'volunteer',
        session: { user: { id: 'volunteer-1' } }
      },
      url: new URL('http://localhost:5173/profile')
    } as unknown as Parameters<typeof load>[0];

    const result = await load(event);
    expect(result).toEqual({
      userRole: 'volunteer',
      isAdmin: false,
      origin: 'http://localhost:5173',
      locale: 'en'
    });
    expect(mocks.isUserAdmin).toHaveBeenCalledWith('volunteer-1');
  });
});

