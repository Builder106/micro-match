import { describe, it, expect } from 'vitest';
import {
  createLoadEvent,
  createServerLoadEvent,
  createPageLoadEvent,
  createMockCookies
} from './createLoadEvent';

describe('createMockCookies helper', () => {
  it('handles get, set, delete, getAll, and serialize', () => {
    const cookies = createMockCookies({ theme: 'dark', session: 'xyz' });

    expect(cookies.get('theme')).toBe('dark');
    expect(cookies.get('session')).toBe('xyz');
    expect(cookies.get('nonexistent')).toBeUndefined();

    expect(cookies.getAll()).toEqual([
      { name: 'theme', value: 'dark' },
      { name: 'session', value: 'xyz' }
    ]);

    cookies.set('locale', 'es', { path: '/' });
    expect(cookies.get('locale')).toBe('es');

    cookies.delete('theme', { path: '/' });
    expect(cookies.get('theme')).toBeUndefined();

    expect(cookies.serialize('pref', 'compact', { path: '/' })).toBe('pref=compact');
  });
});

describe('createServerLoadEvent helper', () => {
  it('provides safe defaults for ServerLoadEvent', async () => {
    const event = createServerLoadEvent();

    expect(event.url.href).toBe('http://localhost:5173/');
    expect(event.params).toEqual({});
    expect(event.route).toEqual({ id: null });
    expect(event.locals.userRole).toBe('anonymous');
    expect(event.locals.session).toBeUndefined();
    expect(event.isDataRequest).toBe(false);
    expect(event.isSubRequest).toBe(false);
    expect(event.getClientAddress()).toBe('127.0.0.1');
    expect(await event.parent()).toEqual({});
    expect(event.request.url).toBe('http://localhost:5173/');
    expect(event.tracing.enabled).toBe(false);
    expect(event.tracing.root.isRecording()).toBe(false);
    expect(event.tracing.current).toBe(event.tracing.root);
  });

  it('correctly maps userRole, userId, and session options', () => {
    const event = createServerLoadEvent({
      userRole: 'ngo',
      userId: 'org-123',
      email: 'ngo@example.org'
    });

    expect(event.locals.userRole).toBe('ngo');
    expect(event.locals.session).toEqual({
      user: {
        id: 'org-123',
        email: 'ngo@example.org'
      }
    });
  });

  it('accepts string url and string route', () => {
    const event = createServerLoadEvent({
      url: 'http://localhost:5173/tasks?status=open',
      route: '/tasks'
    });

    expect(event.url.pathname).toBe('/tasks');
    expect(event.url.searchParams.get('status')).toBe('open');
    expect(event.route.id).toBe('/tasks');
  });

  it('supports initial cookies object', () => {
    const event = createServerLoadEvent({
      cookies: { mm_session: 'sess-abc' }
    });

    expect(event.cookies.get('mm_session')).toBe('sess-abc');
  });
});

describe('createPageLoadEvent helper', () => {
  it('provides required PageLoadEvent properties', async () => {
    const event = createPageLoadEvent({
      data: { initialCount: 5 },
      params: { id: 'task-1' },
      route: '/task/[id]'
    });

    expect(event.data).toEqual({ initialCount: 5 });
    expect(event.params).toEqual({ id: 'task-1' });
    expect(event.route).toEqual({ id: '/task/[id]' });
    expect(await event.parent()).toEqual({});
    expect(event.tracing.enabled).toBe(false);
    expect(event.tracing.root.isRecording()).toBe(false);

    const compute = event.untrack(() => 42);
    expect(compute).toBe(42);

    expect(() => event.depends('app:tasks')).not.toThrow();
  });
});
describe('createLoadEvent entrypoint', () => {
  it('creates ServerLoadEvent by default', () => {
    const event = createLoadEvent({ userRole: 'volunteer' });
    expect(event.locals.userRole).toBe('volunteer');
    expect('cookies' in event).toBe(true);
  });

  it('creates PageLoadEvent when type is page', () => {
    const event = createLoadEvent({
      type: 'page',
      data: { hello: 'world' }
    });
    expect(event.data).toEqual({ hello: 'world' });
    expect('depends' in event).toBe(true);
  });
});
