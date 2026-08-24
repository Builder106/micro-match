import { describe, it, expect, vi } from 'vitest';
import { createSession, getSession, deleteSession, SESSION_TTL_SECONDS } from './session';

describe('session store', () => {
  it('creates a session with a unique id and the default 14-day TTL', () => {
    const a = createSession({ userId: 'u1', email: 'a@example.com', role: 'volunteer' });
    const b = createSession({ userId: 'u2', email: 'b@example.com', role: 'ngo' });

    expect(a.id).not.toBe(b.id);
    expect(a.userId).toBe('u1');
    expect(a.role).toBe('volunteer');
    expect(a.expiresAt - Date.now()).toBeCloseTo(SESSION_TTL_SECONDS * 1000, -3);
  });

  it('getSession returns the record that createSession produced', () => {
    const created = createSession({ userId: 'u3', email: 'c@example.com', role: 'user' });
    const found = getSession(created.id);

    expect(found).toEqual(created);
  });

  it('getSession returns null for an unknown id', () => {
    expect(getSession('does-not-exist')).toBeNull();
  });

  it('getSession returns null and purges an expired session', () => {
    const created = createSession({ userId: 'u4', email: 'd@example.com', role: 'user', ttlSeconds: 60 });
    vi.spyOn(Date, 'now').mockReturnValue(created.expiresAt + 1);

    expect(getSession(created.id)).toBeNull();
    // Second call after unmocking still shouldn't find it — it was purged.
    vi.spyOn(Date, 'now').mockRestore();
    expect(getSession(created.id)).toBeNull();
  });

  it('clamps ttlSeconds to a 60s floor', () => {
    const created = createSession({ userId: 'u5', email: 'e@example.com', role: 'user', ttlSeconds: 1 });
    expect(created.expiresAt - Date.now()).toBeCloseTo(60_000, -2);
  });

  it('deleteSession removes the record so getSession no longer finds it', () => {
    const created = createSession({ userId: 'u6', email: 'f@example.com', role: 'ngo' });
    deleteSession(created.id);
    expect(getSession(created.id)).toBeNull();
  });

  it('deleteSession on an unknown id is a no-op', () => {
    expect(() => deleteSession('ghost')).not.toThrow();
  });

  it('purges expired sessions as a side effect of creating a new one', () => {
    const expiring = createSession({ userId: 'u7', email: 'g@example.com', role: 'user', ttlSeconds: 60 });
    vi.spyOn(Date, 'now').mockReturnValue(expiring.expiresAt + 1);

    expect(getSession(expiring.id)).toBeNull();
  });

  it('falls back to node crypto when globalThis.crypto is undefined', () => {
    const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    try {
      Reflect.deleteProperty(globalThis, 'crypto');
      const s = createSession({ userId: 'u-fallback', email: 'fallback@example.com', role: 'user' });
      expect(s.id).toBeTruthy();
    } finally {
      if (cryptoDescriptor) Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
    }
  });
});
