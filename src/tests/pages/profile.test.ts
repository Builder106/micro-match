/* global App */

import { describe, it, expect, vi } from 'vitest';

const { envState } = vi.hoisted(() => ({
  envState: { NODE_ENV: 'development' } as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));



import { load, actions } from '../../routes/profile/+page.server';
import { createRequestEvent, createServerLoadEventFor, requireLoadResult } from '../helpers/createLoadEvent';

function makeLoadEvent(opts: { userRole?: App.Locals['userRole']; userId?: string } = {}) {
  return createServerLoadEventFor<typeof load>({
    userRole: opts.userRole,
    userId: opts.userId
  });
}

describe('/profile load', () => {
  it('passes through userRole/user from locals, with user:null when signed out', async () => {
    const result = requireLoadResult(await load(makeLoadEvent()));
    expect(result).toEqual({ userRole: 'anonymous', user: null });

    const resultEmpty = requireLoadResult(await load(makeLoadEvent()));
    expect(resultEmpty).toEqual({ userRole: 'anonymous', user: null });

    const omittedRoleEvent = makeLoadEvent({ userRole: 'ngo', userId: 'user-1' });
    omittedRoleEvent.locals.userRole = undefined;
    const omittedRoleResult = requireLoadResult(await load(omittedRoleEvent));
    expect(omittedRoleResult.userRole).toBe('anonymous');
  });

  it('returns the session user when signed in', async () => {
    const result = requireLoadResult(await load(makeLoadEvent({ userRole: 'ngo', userId: 'org-1' })));
    expect(result).toEqual({ userRole: 'ngo', user: { id: 'org-1', email: 'jane@example.com' } });

    const resultNoEmail = requireLoadResult(await load(createServerLoadEventFor<typeof load>({
      session: { user: { id: 'user-2' } }
    })));
    expect(resultNoEmail).toEqual({ userRole: 'anonymous', user: { id: 'user-2', email: undefined } });
  });
});


function makeActionEvent(opts: { userId?: string; fields?: Record<string, string> }) {
  const form = new FormData();
  for (const [k, v] of Object.entries(opts.fields ?? {})) form.set(k, v);
  return createRequestEvent({
    userId: opts.userId,
    request: new Request('http://localhost/profile', { method: 'POST', body: form }),
    fetch: vi.fn<typeof fetch>()
  });
}

describe('/profile action (update)', () => {
  it('fails with 401 when there is no session', async () => {
    const result = requireLoadResult(await actions.default(makeActionEvent({})));
    expect(result.status).toBe(401);
  });

  it('acknowledges the update with the trimmed field values or empty defaults', async () => {
    const result = requireLoadResult(await actions.default(makeActionEvent({
      userId: 'user-1',
      fields: { displayName: '  Jane  ', role: 'ngo', bio: 'Hello', orgName: 'Acme' }
    })));

    expect(result).toEqual({ ok: true, role: 'ngo', displayName: 'Jane', bio: 'Hello', orgName: 'Acme' });

    // Test with empty fields object (all defaults '')
    const resultEmpty = requireLoadResult(await actions.default(makeActionEvent({
      userId: 'user-1',
      fields: {}
    })));
    expect(resultEmpty).toEqual({ ok: true, role: '', displayName: '', bio: '', orgName: '' });
  });

  it('fails with 400 when an error is thrown during form parsing (in dev and prod)', async () => {
    envState.NODE_ENV = 'development';
    const brokenEvent = createRequestEvent({
      userId: 'user-1',
      request: new Request('http://localhost/profile', { method: 'POST' })
    });
    vi.spyOn(brokenEvent.request, 'formData').mockRejectedValue(new Error('formData failed'));

    const result = requireLoadResult(await actions.default(brokenEvent));
    expect(result.status).toBe(400);

    // In production
    envState.NODE_ENV = 'production';
    const resultProd = requireLoadResult(await actions.default(brokenEvent));
    expect(resultProd.status).toBe(400);
  });
});
