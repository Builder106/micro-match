/* global App */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    listBadgesByUser: vi.fn(),
    sendVaultRequest: vi.fn(),
    getProfile: vi.fn(),
    listUserClaims: vi.fn(),
    resendClaim: vi.fn(),
    saveProfile: vi.fn(),
    submitClaim: vi.fn(),
    withdrawClaim: vi.fn(),
  },
}));

vi.mock('#lib/server/appwrite.js', () => ({ listBadgesByUser: mocks.listBadgesByUser }));
vi.mock('#lib/server/email.js', () => ({ sendVaultRequest: mocks.sendVaultRequest }));
vi.mock('#lib/server/vault.js', () => ({
  getProfile: mocks.getProfile,
  listUserClaims: mocks.listUserClaims,
  resendClaim: mocks.resendClaim,
  saveProfile: mocks.saveProfile,
  submitClaim: mocks.submitClaim,
  withdrawClaim: mocks.withdrawClaim,
}));

import { actions, load } from '../../routes/vault/+page.server';
import {
  createRequestEvent,
  createServerLoadEventFor,
  requireLoadResult,
} from '../helpers/createLoadEvent';
import { isHttpError } from '../helpers/httpError';

const claim = {
  id: 'c1',
  userId: 'u1',
  volunteerName: 'Jane',
  orgName: 'Pantry',
  contactEmail: 'pat@riverside.org',
  description: 'Sorted donations every Saturday.',
  status: 'pending',
  tokenHash: 'secret-hash',
  expiresAt: '2026-11-18T00:00:00.000Z',
  locale: 'es',
  createdAt: '2026-11-04T00:00:00.000Z',
};

function formEvent(
  fields: Record<string, string>,
  opts: { userId?: string | null; email?: string | null; locale?: App.Locals['locale'] } = {},
) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  const userId = opts.userId === undefined ? 'u1' : opts.userId;
  return createRequestEvent({
    session: userId
      ? { user: { id: userId, email: opts.email === undefined ? 'me@mail.test' : opts.email } }
      : null,
    locals: 'locale' in opts ? { locale: opts.locale } : { locale: 'es' },
    request: new Request('http://localhost/vault', { method: 'POST', body }),
  });
}

const logFields = {
  volunteerName: 'Jane Doe',
  orgName: 'Pantry',
  contactEmail: 'Pat@Riverside.org',
  description: 'Sorted donations every Saturday.',
};

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.sendVaultRequest.mockResolvedValue({ ok: true });
});

describe('/vault load', () => {
  it('redirects to login without a session', async () => {
    try {
      await load(createServerLoadEventFor<typeof load>({}));
      expect.unreachable();
    } catch (err) {
      if (!isHttpError(err)) throw err;
      expect(err.status).toBe(303);
      expect(err.location).toBe('/login?next=/vault');
    }
  });

  it('returns badges newest first, claims with a masked contact and no hash, and the profile', async () => {
    mocks.listBadgesByUser.mockResolvedValue([
      { id: 'b1', userId: 'u1', label: 'Old', awardedAt: '2026-01-01T00:00:00Z' },
      {
        id: 'b2',
        userId: 'u1',
        label: 'New',
        awardedAt: '2026-06-01T00:00:00Z',
        source: 'offplatform',
        orgName: 'Pantry',
      },
    ]);
    mocks.listUserClaims.mockResolvedValue([claim]);
    mocks.getProfile.mockResolvedValue({
      id: 'p',
      userId: 'u1',
      handle: 'jane',
      displayName: 'Jane',
      isPublic: true,
    });
    const data = requireLoadResult(
      await load(createServerLoadEventFor<typeof load>({ userId: 'u1' })),
    );
    expect(data.badges.map((b: { label: string }) => b.label)).toEqual(['New', 'Old']);
    expect(data.claims[0]).toMatchObject({ id: 'c1', contact: 'p***@riverside.org' });
    expect(JSON.stringify(data)).not.toContain('secret-hash');
    expect(JSON.stringify(data)).not.toContain('pat@riverside.org');
    expect(data.profile).toEqual({ handle: 'jane', displayName: 'Jane', isPublic: true });
  });

  it('returns a null profile when none is saved', async () => {
    mocks.listBadgesByUser.mockResolvedValue([]);
    mocks.listUserClaims.mockResolvedValue([]);
    mocks.getProfile.mockResolvedValue(undefined);
    const data = requireLoadResult(
      await load(createServerLoadEventFor<typeof load>({ userId: 'u1' })),
    );
    expect(data).toMatchObject({ badges: [], claims: [], profile: null });
  });
});

describe('/vault ?/log', () => {
  it('needs a session', async () => {
    const result = await actions.log(formEvent(logFields, { userId: null }));
    expect(result).toMatchObject({ status: 401 });
  });

  it('sends the field errors and what was typed back on invalid input', async () => {
    const result = await actions.log(formEvent({ ...logFields, orgName: '' }));
    expect(result).toMatchObject({
      status: 400,
      data: { errors: ['orgName'], values: { volunteerName: 'Jane Doe' } },
    });
    expect(mocks.submitClaim).not.toHaveBeenCalled();
  });

  it('records the claim, emails the contact in the volunteer’s language, and reports a masked address', async () => {
    mocks.submitClaim.mockResolvedValue({ ok: true, claim, token: 'tok' });
    const result = await actions.log(formEvent(logFields));
    expect(result).toEqual({ form: 'log', sent: 'p***@riverside.org', emailFailed: false });
    expect(mocks.submitClaim).toHaveBeenCalledWith(
      'u1',
      'me@mail.test',
      expect.objectContaining({ contactEmail: 'pat@riverside.org' }),
      'es',
    );
    expect(mocks.sendVaultRequest).toHaveBeenCalledWith({
      to: 'pat@riverside.org',
      claim,
      token: 'tok',
      locale: 'es',
    });
  });

  it('falls back to English when the locale is missing or the stored one is unknown', async () => {
    mocks.submitClaim.mockResolvedValue({
      ok: true,
      claim: { ...claim, locale: 'xx' },
      token: 'tok',
    });
    await actions.log(formEvent(logFields, { locale: undefined, email: null }));
    expect(mocks.submitClaim).toHaveBeenCalledWith('u1', undefined, expect.anything(), 'en');
    expect(mocks.sendVaultRequest).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en' }));
  });

  it('keeps the claim and says so when the email could not be sent', async () => {
    mocks.submitClaim.mockResolvedValue({ ok: true, claim, token: 'tok' });
    mocks.sendVaultRequest.mockResolvedValue({ ok: false, error: 'down' });
    expect(await actions.log(formEvent(logFields))).toMatchObject({ emailFailed: true });
  });

  it('answers 429 with the reason when a limit applies', async () => {
    mocks.submitClaim.mockResolvedValue({ ok: false, reason: 'addressLimit' });
    const result = await actions.log(formEvent(logFields));
    expect(result).toMatchObject({ status: 429, data: { refused: 'addressLimit' } });
    expect(mocks.sendVaultRequest).not.toHaveBeenCalled();
  });
});

describe('/vault ?/resend', () => {
  it('needs a session', async () => {
    expect(await actions.resend(formEvent({ id: 'c1' }, { userId: null }))).toMatchObject({
      status: 401,
    });
  });

  it('sends a fresh link', async () => {
    mocks.resendClaim.mockResolvedValue({ ok: true, claim, token: 'tok2' });
    const result = await actions.resend(formEvent({ id: 'c1' }));
    expect(result).toEqual({ form: 'claims', sent: 'p***@riverside.org', emailFailed: false });
    expect(mocks.resendClaim).toHaveBeenCalledWith('u1', 'me@mail.test', 'c1');
  });

  it('works for a session that has no email', async () => {
    mocks.resendClaim.mockResolvedValue({ ok: true, claim, token: 'tok2' });
    await actions.resend(formEvent({ id: 'c1' }, { email: null }));
    expect(mocks.resendClaim).toHaveBeenCalledWith('u1', undefined, 'c1');
  });

  it('treats a missing id as not found', async () => {
    mocks.resendClaim.mockResolvedValue({ ok: false, reason: 'notFound' });
    expect(await actions.resend(formEvent({}))).toMatchObject({ status: 404 });
    expect(mocks.resendClaim).toHaveBeenCalledWith('u1', 'me@mail.test', '');
  });

  it('answers 429 when a limit applies', async () => {
    mocks.resendClaim.mockResolvedValue({ ok: false, reason: 'dailyLimit' });
    expect(await actions.resend(formEvent({ id: 'c1' }))).toMatchObject({
      status: 429,
      data: { refused: 'dailyLimit' },
    });
  });
});

describe('/vault ?/withdraw', () => {
  it('needs a session', async () => {
    expect(await actions.withdraw(formEvent({ id: 'c1' }, { userId: null }))).toMatchObject({
      status: 401,
    });
  });

  it('withdraws a pending claim', async () => {
    mocks.withdrawClaim.mockResolvedValue(true);
    expect(await actions.withdraw(formEvent({ id: 'c1' }))).toEqual({
      form: 'claims',
      withdrawn: true,
    });
    expect(mocks.withdrawClaim).toHaveBeenCalledWith('u1', 'c1');
  });

  it('is 404 for anything else, including a missing id', async () => {
    mocks.withdrawClaim.mockResolvedValue(false);
    expect(await actions.withdraw(formEvent({}))).toMatchObject({ status: 404 });
    expect(mocks.withdrawClaim).toHaveBeenCalledWith('u1', '');
  });
});

describe('/vault ?/profile', () => {
  it('needs a session', async () => {
    expect(await actions.profile(formEvent({ handle: 'jane' }, { userId: null }))).toMatchObject({
      status: 401,
    });
  });

  it('rejects a bad or missing handle', async () => {
    expect(await actions.profile(formEvent({ handle: 'Ja' }))).toMatchObject({
      status: 400,
      data: { handleError: 'invalid' },
    });
    expect(await actions.profile(formEvent({}))).toMatchObject({ status: 400 });
  });

  it('rejects a handle someone else holds', async () => {
    mocks.saveProfile.mockResolvedValue({ ok: false, reason: 'handleTaken' });
    expect(await actions.profile(formEvent({ handle: 'jane' }))).toMatchObject({
      status: 409,
      data: { handleError: 'taken' },
    });
  });

  it('saves with the name falling back to the handle, and public only when ticked', async () => {
    mocks.saveProfile.mockResolvedValue({ ok: true, profile: {} });
    expect(
      await actions.profile(formEvent({ handle: ' Jane-D ', displayName: '', isPublic: 'on' })),
    ).toEqual({ form: 'profile', saved: true });
    expect(mocks.saveProfile).toHaveBeenLastCalledWith('u1', {
      handle: 'jane-d',
      displayName: 'jane-d',
      isPublic: true,
    });

    await actions.profile(formEvent({ handle: 'jane-d', displayName: 'Jane D' }));
    expect(mocks.saveProfile).toHaveBeenLastCalledWith('u1', {
      handle: 'jane-d',
      displayName: 'Jane D',
      isPublic: false,
    });
  });
});
