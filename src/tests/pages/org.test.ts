/* global App */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    createTask: vi.fn(),
    getUserRole: vi.fn(),
    getVerificationByUserId: vi.fn()
  }
}));

vi.mock('$lib/server/appwrite', () => ({ createTask: mocks.createTask }));
vi.mock('$lib/server/auth', () => ({ getUserRole: mocks.getUserRole }));
vi.mock('$lib/server/verifications', () => ({ getVerificationByUserId: mocks.getVerificationByUserId }));

import { load, actions } from '../../routes/org/+page.server';
import { createRequestEvent, createServerLoadEventFor, requireLoadResult } from '../helpers/createLoadEvent';
import { isHttpError } from '../helpers/httpError';
import type { HttpError } from '../helpers/httpError';

function makeLoadEvent(opts: { userRole?: App.Locals['userRole']; userId?: string } = {}) {
  return createServerLoadEventFor<typeof load>({
    userRole: opts.userRole,
    userId: opts.userId
  });
}

async function expectThrow(promise: unknown, matcher: (err: HttpError) => void) {
  try {
    await promise;
    expect.unreachable('expected to throw');
  } catch (err: unknown) {
    if (!isHttpError(err)) throw err;
    matcher(err);
  }
}

describe('/org load', () => {
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  it('redirects anonymous users to login', async () => {
    await expectThrow(load(makeLoadEvent()), (err) => {
      expect(err.status).toBe(303);
      expect(err.location).toBe('/login?next=/org');
    });

    await expectThrow(load(makeLoadEvent()), (err) => {
      expect(err.status).toBe(303);
      expect(err.location).toBe('/login?next=/org');
    });

    const omittedRoleEvent = makeLoadEvent({ userRole: 'ngo', userId: 'org-1' });
    omittedRoleEvent.locals.userRole = undefined;
    await expectThrow(load(omittedRoleEvent), (err) => {
      expect(err.status).toBe(303);
      expect(err.location).toBe('/login?next=/org');
    });
  });


  it('403s for a non-NGO role', async () => {
    await expectThrow(load(makeLoadEvent({ userRole: 'volunteer' })), (err) => {
      expect(err.status).toBe(403);
    });
  });

  it('returns the verification status for an NGO user', async () => {
    mocks.getVerificationByUserId.mockResolvedValue({ status: 'approved' });
    const result = requireLoadResult(await load(makeLoadEvent({ userRole: 'ngo', userId: 'org-1' })));
    expect(result).toEqual({ verificationStatus: 'approved' });
  });

  it('returns null verificationStatus when none exists', async () => {
    mocks.getVerificationByUserId.mockResolvedValue(undefined);
    const result = requireLoadResult(await load(makeLoadEvent({ userRole: 'ngo', userId: 'org-1' })));
    expect(result).toEqual({ verificationStatus: null });

    // NGO user without userId
    const resultNoUser = requireLoadResult(await load(makeLoadEvent({ userRole: 'ngo' })));
    expect(resultNoUser).toEqual({ verificationStatus: null });
  });
});


function makeActionEvent(opts: { userId?: string; fields: Record<string, string> }) {
  const form = new FormData();
  for (const [k, v] of Object.entries(opts.fields)) form.set(k, v);
  return createRequestEvent({
    userId: opts.userId,
    request: new Request('http://localhost/org', { method: 'POST', body: form })
  });
}

describe('/org action (create task)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.createTask.mockImplementation(async (input: Record<string, unknown>) => ({ id: 'new-task', ...input }));
  });

  it('returns success:false for non-NGO roles', async () => {
    mocks.getUserRole.mockResolvedValue('volunteer');
    const result = await actions.default(makeActionEvent({ fields: { title: 'T' } }));
    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns success:false when required fields are missing', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    const result = requireLoadResult(await actions.default(makeActionEvent({ userId: 'org-1', fields: { title: 'T' } })));
    expect(result.success).toBe(false);
    expect(mocks.createTask).not.toHaveBeenCalled();

    const result2 = requireLoadResult(await actions.default(makeActionEvent({
      userId: 'org-1', fields: { title: 'T', shortDescription: 'S' }
    })));
    expect(result2.success).toBe(false);

    const result3 = requireLoadResult(await actions.default(makeActionEvent({
      userId: 'org-1', fields: { shortDescription: 'S', description: 'D' }
    })));
    expect(result3.success).toBe(false);
  });


  it('parses tags and minutes, and derives isVerified from the org verification status', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getVerificationByUserId.mockResolvedValue({ status: 'approved' });

    const result = await actions.default(makeActionEvent({
      userId: 'org-1',
      fields: {
        title: 'Translate flyer', shortDescription: 'Short', description: 'Long',
        tags: 'i18n, spanish , health', minutes: '30'
      }
    }));

    expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({
      tags: ['i18n', 'spanish', 'health'],
      estimatedMinutes: 30,
      orgId: 'org-1',
      isVerified: true
    }));
    expect(result).toEqual({ success: true, taskId: 'new-task' });
  });

  it('sets isVerified false when the org has no approved verification', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getVerificationByUserId.mockResolvedValue(undefined);

    await actions.default(makeActionEvent({
      userId: 'org-1',
      fields: { title: 'T', shortDescription: 'S', description: 'D' }
    }));

    expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({ isVerified: false }));
  });

  it('handles empty estimatedMinutes safely in action', async () => {
    mocks.getUserRole.mockResolvedValue('ngo');
    mocks.getVerificationByUserId.mockResolvedValue(undefined);

    await actions.default(makeActionEvent({
      userId: 'org-1',
      fields: { title: 'T', shortDescription: 'S', description: 'D', minutes: 'invalid' }
    }));

    expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({ estimatedMinutes: undefined }));

    // Test without session userId (orgId undefined)
    await actions.default(makeActionEvent({
      fields: { title: 'T', shortDescription: 'S', description: 'D', language: 'Spanish' }
    }));
    expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({ orgId: undefined, language: 'Spanish' }));
  });
});
