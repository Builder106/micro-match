import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: { getClaimByToken: vi.fn(), resolveClaim: vi.fn() },
}));
vi.mock('#lib/server/vault.js', () => ({
  getClaimByToken: mocks.getClaimByToken,
  resolveClaim: mocks.resolveClaim,
}));

import { actions, load } from '../../routes/vault/confirm/[token]/+page.server';
import {
  createRequestEvent,
  createServerLoadEventFor,
  requireLoadResult,
} from '../helpers/createLoadEvent';

const claim = {
  id: 'c1',
  volunteerName: 'Jane',
  orgName: 'Pantry',
  description: 'Sorted donations.',
  date: '2026-10-03',
  minutes: 90,
  status: 'pending',
  tokenHash: 'secret-hash',
  contactEmail: 'pat@riverside.org',
};

beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

describe('/vault/confirm/[token] load', () => {
  it('shows the open claim without the hash or either address, and keeps the link private', async () => {
    mocks.getClaimByToken.mockResolvedValue(claim);
    const setHeaders = vi.fn();
    const data = requireLoadResult(
      await load(createServerLoadEventFor<typeof load>({ params: { token: 't' }, setHeaders })),
    );
    expect(data).toEqual({
      open: true,
      volunteerName: 'Jane',
      orgName: 'Pantry',
      description: 'Sorted donations.',
      date: '2026-10-03',
      minutes: 90,
    });
    expect(setHeaders).toHaveBeenCalledWith({
      'referrer-policy': 'no-referrer',
      'cache-control': 'private, no-store',
    });
  });

  it.each([
    ['unknown', undefined],
    ['answered', { ...claim, status: 'verified' }],
    ['expired', { ...claim, status: 'expired' }],
  ])('reports a %s link as closed', async (_name, found) => {
    mocks.getClaimByToken.mockResolvedValue(found);
    const data = requireLoadResult(
      await load(createServerLoadEventFor<typeof load>({ params: { token: 't' } })),
    );
    expect(data).toEqual({ open: false });
  });
});

describe('/vault/confirm/[token] actions', () => {
  const event = () =>
    createRequestEvent({
      params: { token: 't' },
      request: new Request('http://localhost/x', { method: 'POST' }),
    });

  it('confirm records a verified answer', async () => {
    mocks.getClaimByToken.mockResolvedValue(claim);
    mocks.resolveClaim.mockResolvedValue('ok');
    expect(await actions.confirm(event())).toEqual({ decision: 'verified', volunteerName: 'Jane' });
    expect(mocks.resolveClaim).toHaveBeenCalledWith('t', 'verified');
  });

  it('decline records a rejected answer', async () => {
    mocks.getClaimByToken.mockResolvedValue(claim);
    mocks.resolveClaim.mockResolvedValue('ok');
    expect(await actions.decline(event())).toEqual({ decision: 'rejected', volunteerName: 'Jane' });
    expect(mocks.resolveClaim).toHaveBeenCalledWith('t', 'rejected');
  });

  it('answers 409 when the link is unknown or was closed in the meantime', async () => {
    mocks.getClaimByToken.mockResolvedValue(undefined);
    expect(await actions.confirm(event())).toMatchObject({ status: 409, data: { closed: true } });
    expect(mocks.resolveClaim).not.toHaveBeenCalled();

    mocks.getClaimByToken.mockResolvedValue(claim);
    mocks.resolveClaim.mockResolvedValue('closed');
    expect(await actions.confirm(event())).toMatchObject({ status: 409 });
  });
});
