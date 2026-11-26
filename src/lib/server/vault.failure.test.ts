import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OffplatformClaim } from '#lib/types.js';

const { store, awardBadge } = vi.hoisted(() => ({
  store: { rows: new Map<string, unknown>(), failUpdates: false, throwOnReopen: false },
  awardBadge: vi.fn(),
}));

vi.mock('./rowStore', () => ({
  openTable: () => ({
    create: async (data: object) => {
      const row = { ...data, id: `r${store.rows.size + 1}` };
      store.rows.set(row.id, row);
      return row;
    },
    list: async (where: Record<string, unknown> = {}) =>
      [...store.rows.values()].filter((row) =>
        Object.entries(where).every(([k, v]) => (row as Record<string, unknown>)[k] === v),
      ),
    update: async (id: string, patch: object) => {
      if (store.throwOnReopen && (patch as { status?: string }).status === 'pending') {
        throw new Error('reopen failed');
      }
      const row = store.rows.get(id);
      if (!row || store.failUpdates) return undefined;
      const next = { ...row, ...patch };
      store.rows.set(id, next);
      return next;
    },
  }),
}));
vi.mock('./appwrite', () => ({ awardBadge, listBadgesByUser: vi.fn() }));

import { resolveClaim, submitClaim, withdrawClaim } from './vault';

const now = new Date('2026-11-04T12:00:00Z');

async function open() {
  const result = await submitClaim(
    'u1',
    'u1@mail.test',
    {
      volunteerName: 'Jane Doe',
      orgName: 'Riverside Food Pantry',
      contactEmail: 'c@org.test',
      description: 'Sorted donations every Saturday.',
    },
    'en',
    now,
  );
  if (!result.ok) throw new Error('refused');
  return result;
}

const status = (id: string) => (store.rows.get(id) as OffplatformClaim).status;

describe('vault when a write fails', () => {
  beforeEach(() => {
    store.rows.clear();
    store.failUpdates = false;
    store.throwOnReopen = false;
    awardBadge.mockReset();
  });

  it('mints no badge when the claim cannot be closed', async () => {
    const { token } = await open();
    store.failUpdates = true;
    expect(await resolveClaim(token, 'verified', now)).toBe('notFound');
    expect(awardBadge).not.toHaveBeenCalled();
  });

  it('reopens the claim when the badge cannot be minted, so the link still works', async () => {
    const { claim, token } = await open();
    awardBadge.mockRejectedValueOnce(new Error('down'));
    await expect(resolveClaim(token, 'verified', now)).rejects.toThrow('down');
    expect(status(claim.id)).toBe('pending');

    awardBadge.mockResolvedValueOnce({});
    expect(await resolveClaim(token, 'verified', now)).toBe('ok');
    expect(status(claim.id)).toBe('verified');
  });

  it('still surfaces the minting error when reopening the claim also throws', async () => {
    const { token } = await open();
    store.throwOnReopen = true;
    awardBadge.mockRejectedValueOnce(new Error('down'));
    await expect(resolveClaim(token, 'verified', now)).rejects.toThrow('down');
  });

  it('does not report a withdrawal that was not saved', async () => {
    const { claim } = await open();
    store.failUpdates = true;
    expect(await withdrawClaim('u1', claim.id, now)).toBe(false);
  });
});
