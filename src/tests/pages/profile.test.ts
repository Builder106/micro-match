import { describe, it, expect, vi } from 'vitest';

const { envState } = vi.hoisted(() => ({
  envState: { NODE_ENV: 'development' } as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(envState, { get: (_, key: string) => envState[key] })
}));



import { load, actions } from '../../routes/profile/+page.server';

function makeLoadEvent(opts: { userRole?: string; userId?: string } = {}) {
  return {
    locals: {
      userRole: opts.userRole ?? 'anonymous',
      session: opts.userId ? { user: { id: opts.userId, email: 'jane@example.com' } } : undefined
    }
  } as unknown as Parameters<typeof load>[0];
}

describe('/profile load', () => {
  it('passes through userRole/user from locals, with user:null when signed out', async () => {
    const result = await load(makeLoadEvent());
    expect(result).toEqual({ userRole: 'anonymous', user: null });

    const resultEmpty = await load({ locals: {} } as unknown as Parameters<typeof load>[0]);
    expect(resultEmpty).toEqual({ userRole: 'anonymous', user: null });
  });

  it('returns the session user when signed in', async () => {
    const result = await load(makeLoadEvent({ userRole: 'ngo', userId: 'org-1' }));
    expect(result).toEqual({ userRole: 'ngo', user: { id: 'org-1', email: 'jane@example.com' } });

    const resultNoEmail = await load({
      locals: {
        session: { user: { id: 'user-2' } }
      }
    } as unknown as Parameters<typeof load>[0]);
    expect(resultNoEmail).toEqual({ userRole: 'anonymous', user: { id: 'user-2', email: undefined } });
  });
});


function makeActionEvent(opts: { userId?: string; fields?: Record<string, string> }) {
  const form = new FormData();
  for (const [k, v] of Object.entries(opts.fields ?? {})) form.set(k, v);
  return {
    request: { formData: async () => form },
    locals: { session: opts.userId ? { user: { id: opts.userId, email: 'jane@example.com' } } : undefined },
    fetch: vi.fn()
  } as unknown as Parameters<typeof load>[0];
}

describe('/profile action (update)', () => {
  it('fails with 401 when there is no session', async () => {
    const result = (await actions.default(makeActionEvent({}))) as { status?: number; error?: string };
    expect(result.status).toBe(401);
  });

  it('acknowledges the update with the trimmed field values or empty defaults', async () => {
    const result = (await actions.default(makeActionEvent({
      userId: 'user-1',
      fields: { displayName: '  Jane  ', role: 'ngo', bio: 'Hello', orgName: 'Acme' }
    }))) as { ok?: boolean; role?: string; displayName?: string; bio?: string; orgName?: string };

    expect(result).toEqual({ ok: true, role: 'ngo', displayName: 'Jane', bio: 'Hello', orgName: 'Acme' });

    // Test with empty fields object (all defaults '')
    const resultEmpty = (await actions.default(makeActionEvent({
      userId: 'user-1',
      fields: {}
    }))) as { ok?: boolean; role?: string; displayName?: string; bio?: string; orgName?: string };
    expect(resultEmpty).toEqual({ ok: true, role: '', displayName: '', bio: '', orgName: '' });
  });

  it('fails with 400 when an error is thrown during form parsing (in dev and prod)', async () => {
    envState.NODE_ENV = 'development';
    const brokenEvent = {
      request: {
        formData: async () => {
          throw new Error('formData failed');
        }
      },
      locals: { session: { user: { id: 'user-1' } } }
    } as unknown as Parameters<typeof load>[0];

    const result = (await actions.default(brokenEvent)) as { status?: number; data?: { message?: string } };
    expect(result.status).toBe(400);

    // In production
    envState.NODE_ENV = 'production';
    const resultProd = (await actions.default(brokenEvent)) as { status?: number; data?: { message?: string } };
    expect(resultProd.status).toBe(400);
  });
});



