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
import { createServerLoadEvent } from '../helpers/createLoadEvent';

describe('+layout.server load', () => {
  beforeEach(() => {
    mocks.isUserAdmin.mockReset();
  });

  it('returns anonymous role and isAdmin=false when no session exists', async () => {
    const event = createServerLoadEvent({ url: 'http://localhost:5173/about' });

    const result = await load(event);
    expect(result).toEqual({
      userRole: 'anonymous',
      isAdmin: false,
      origin: 'http://localhost:5173',
      locale: 'en'
    });
    expect(mocks.isUserAdmin).not.toHaveBeenCalled();
  });

  it('falls back to the anonymous role when locals.userRole is undefined', async () => {
    const event = createServerLoadEvent({
      userRole: 'volunteer',
      url: 'http://localhost:5173/about'
    });
    event.locals.userRole = undefined;

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

    const event = createServerLoadEvent({
      userRole: 'ngo',
      userId: 'admin-user-1',
      url: 'http://localhost:5173/dashboard'
    });

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

    const event = createServerLoadEvent({
      userRole: 'volunteer',
      userId: 'volunteer-1',
      url: 'http://localhost:5173/profile'
    });

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
