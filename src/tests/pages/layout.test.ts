import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    isUserAdmin: vi.fn(),
    getTasks: vi.fn(),
    getQuiltPatches: vi.fn(),
    translateTasks: vi.fn()
  }
}));

vi.mock('$lib/server/teams', () => ({
  isUserAdmin: mocks.isUserAdmin
}));
vi.mock('$lib/server/appwrite', () => ({ getTasks: mocks.getTasks }));
vi.mock('$lib/server/quilt', () => ({ getQuiltPatches: mocks.getQuiltPatches }));
vi.mock('$lib/server/taskTranslation', () => ({ translateTasks: mocks.translateTasks }));

const emptyQuilt = {
  quilt: { patches: [], total: 0 },
  openTasks: { count: 0, upTo: { 15: 0, 20: 0, 30: 0 }, preview: [] }
};

import { load } from '../../routes/+layout.server';
import { createServerLoadEvent, requireLoadResult } from '../helpers/createLoadEvent';

describe('+layout.server load', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.getTasks.mockResolvedValue([]);
    mocks.getQuiltPatches.mockResolvedValue([]);
    mocks.translateTasks.mockImplementation(async (tasks: unknown[]) => tasks);
  });

  it('returns anonymous role and isAdmin=false when no session exists', async () => {
    const event = createServerLoadEvent({ url: 'http://localhost:5173/about' });

    const result = await load(event);
    expect(result).toEqual({
      userRole: 'anonymous',
      isAdmin: false,
      origin: 'http://localhost:5173',
      locale: 'en',
      ...emptyQuilt
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
      locale: 'en',
      ...emptyQuilt
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
      locale: 'en',
      ...emptyQuilt
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
      locale: 'en',
      ...emptyQuilt
    });
    expect(mocks.isUserAdmin).toHaveBeenCalledWith('volunteer-1');
  });

  it('loads the newest 52 patches, the open task count by length and a translated preview', async () => {
    const patches = Array.from({ length: 60 }, (_, i) => ({ id: `p${i}` }));
    const tasks = [
      { id: 't1', estimatedMinutes: 5 },
      { id: 't2', estimatedMinutes: 20 },
      { id: 't3', estimatedMinutes: 30 },
      { id: 't4' }
    ];
    mocks.getQuiltPatches.mockResolvedValue(patches);
    mocks.getTasks.mockResolvedValue(tasks);
    mocks.translateTasks.mockResolvedValue([{ id: 't1', title: 'translated' }]);

    const event = createServerLoadEvent({ url: 'http://localhost:5173/', locals: { locale: 'es' } });
    const result = requireLoadResult(await load(event));

    expect(result.quilt.total).toBe(60);
    expect(result.quilt.patches).toEqual(patches.slice(-52));
    expect(result.openTasks.count).toBe(4);
    expect(result.openTasks.upTo).toEqual({ 15: 1, 20: 2, 30: 3 });
    expect(mocks.translateTasks).toHaveBeenCalledWith(tasks.slice(0, 3), 'es');
    expect(result.openTasks.preview).toEqual([{ id: 't1', title: 'translated' }]);
    expect(result.locale).toBe('es');
  });
  it('renders an empty quilt instead of failing when the quilt and tasks cannot load', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.getQuiltPatches.mockRejectedValue(new Error('appwrite down'));
    mocks.getTasks.mockRejectedValue(new Error('appwrite down'));
    const result = requireLoadResult(await load(createServerLoadEvent({ url: 'http://localhost:5173/en' })));
    expect(result.quilt).toEqual(emptyQuilt.quilt);
    expect(result.openTasks).toEqual(emptyQuilt.openTasks);
    expect(error).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });

  it('shows untranslated task titles when translation fails', async () => {
    const tasks = [{ id: 't1', title: 'Original' }];
    mocks.getTasks.mockResolvedValue(tasks);
    mocks.translateTasks.mockRejectedValue(new Error('translator down'));
    const result = requireLoadResult(await load(createServerLoadEvent({ url: 'http://localhost:5173/en' })));
    expect(result.openTasks.preview).toEqual(tasks);
  });
});
