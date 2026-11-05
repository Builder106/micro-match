import { describe, expect, it } from 'vitest';
import type { ClaimInput } from '#lib/vault.js';
import { VAULT_LIMITS } from '#lib/vault.js';
import { listBadgesByUser } from './appwrite';
import {
  getClaimByToken,
  getProfile,
  getPublicProfile,
  hashToken,
  listPublicBadges,
  listUserClaims,
  resendClaim,
  resolveClaim,
  saveProfile,
  submitClaim,
  withdrawClaim,
} from './vault';

const now = new Date('2026-11-04T12:00:00Z');
const later = (days: number) => new Date(now.getTime() + days * 86_400_000);
let n = 0;
const fresh = () => `user-${++n}`;
const input = (over: Partial<ClaimInput> = {}): ClaimInput => ({
  volunteerName: 'Jane Doe',
  orgName: 'Riverside Food Pantry',
  contactEmail: `c${++n}@org.test`,
  description: 'Sorted donations every Saturday.',
  ...over,
});

async function open(userId: string, over: Partial<ClaimInput> = {}, at = now) {
  const result = await submitClaim(userId, `${userId}@mail.test`, input(over), 'es', at);
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  return result;
}

describe('submitClaim', () => {
  it('stores the hash, never the token, and sets a 14-day expiry', async () => {
    const userId = fresh();
    const { claim, token } = await open(userId);
    expect(claim).toMatchObject({
      userId,
      status: 'pending',
      locale: 'es',
      tokenHash: hashToken(token),
    });
    expect(JSON.stringify(claim)).not.toContain(token);
    expect(claim.expiresAt).toBe(later(VAULT_LIMITS.tokenDays).toISOString());
    expect(token.length).toBeGreaterThanOrEqual(43);
  });

  it('refuses the volunteer’s own address, ignoring case and spaces', async () => {
    const result = await submitClaim(
      'u-own',
      ' Me@Mail.test ',
      input({ contactEmail: 'me@mail.test' }),
      'en',
      now,
    );
    expect(result).toEqual({ ok: false, reason: 'ownAddress' });
  });

  it('allows a claim when the session has no email', async () => {
    expect((await submitClaim(fresh(), undefined, input(), 'en', now)).ok).toBe(true);
  });

  it('stops at 5 pending claims, and expired ones stop counting', async () => {
    const old = fresh();
    for (let i = 0; i < VAULT_LIMITS.pendingPerUser; i++)
      await open(old, {}, later(-20 + i * 0.01));
    expect((await open(old)).ok).toBe(true);

    const busy = fresh();
    for (let i = 0; i < VAULT_LIMITS.pendingPerUser; i++) await open(busy, {}, later(-1 - i));
    expect(await submitClaim(busy, undefined, input(), 'en', now)).toEqual({
      ok: false,
      reason: 'tooManyPending',
    });
  });

  it('stops at 5 sends in 24 hours even when the earlier ones were answered', async () => {
    const userId = fresh();
    for (let i = 0; i < VAULT_LIMITS.sendsPerUserPerDay; i++) {
      const { token } = await open(userId);
      await resolveClaim(token, 'rejected', now);
    }
    expect(await submitClaim(userId, undefined, input(), 'en', now)).toEqual({
      ok: false,
      reason: 'dailyLimit',
    });
    expect((await submitClaim(userId, undefined, input(), 'en', later(1.01))).ok).toBe(true);
  });

  it('stops an address at 3 emails a day across different volunteers', async () => {
    const contactEmail = `shared${++n}@org.test`;
    for (let i = 0; i < VAULT_LIMITS.sendsPerAddressPerDay; i++)
      expect((await submitClaim(fresh(), undefined, input({ contactEmail }), 'en', now)).ok).toBe(
        true,
      );
    expect(await submitClaim(fresh(), undefined, input({ contactEmail }), 'en', now)).toEqual({
      ok: false,
      reason: 'addressLimit',
    });
    expect(
      (await submitClaim(fresh(), undefined, input({ contactEmail }), 'en', later(2))).ok,
    ).toBe(true);
  });
});

describe('claim lifecycle', () => {
  it('looks a claim up by its token and reads unanswered old ones as expired', async () => {
    const { claim, token } = await open(fresh());
    expect((await getClaimByToken(token, now))?.id).toBe(claim.id);
    expect((await getClaimByToken(token, later(15)))?.status).toBe('expired');
    expect(await getClaimByToken('nope', now)).toBeUndefined();
  });

  it('confirming mints one badge for the volunteer, then closes the link', async () => {
    const userId = fresh();
    const { token } = await open(userId, { orgName: 'Library Archives' });
    expect(await resolveClaim(token, 'verified', now)).toBe('ok');
    expect(await resolveClaim(token, 'verified', now)).toBe('closed');
    const badges = await listBadgesByUser(userId);
    expect(badges).toHaveLength(1);
    expect(badges[0]).toMatchObject({
      label: 'Library Archives',
      source: 'offplatform',
      orgName: 'Library Archives',
      awardedAt: now.toISOString(),
    });
    expect((await listUserClaims(userId, now))[0]?.status).toBe('verified');
  });

  it('declining mints nothing', async () => {
    const userId = fresh();
    const { token } = await open(userId);
    expect(await resolveClaim(token, 'rejected', now)).toBe('ok');
    expect(await listBadgesByUser(userId)).toEqual([]);
    expect((await listUserClaims(userId, now))[0]?.status).toBe('rejected');
  });

  it('refuses an unknown or expired token', async () => {
    expect(await resolveClaim('unknown', 'verified', now)).toBe('notFound');
    const userId = fresh();
    const { token } = await open(userId);
    expect(await resolveClaim(token, 'verified', later(20))).toBe('closed');
    expect(await listBadgesByUser(userId)).toEqual([]);
  });

  it('withdraws only the caller’s own pending claim', async () => {
    const userId = fresh();
    const { claim, token } = await open(userId);
    expect(await withdrawClaim('someone-else', claim.id, now)).toBe(false);
    expect(await withdrawClaim(userId, 'missing', now)).toBe(false);
    expect(await withdrawClaim(userId, claim.id, now)).toBe(true);
    expect(await withdrawClaim(userId, claim.id, now)).toBe(false);
    expect(await resolveClaim(token, 'verified', now)).toBe('closed');
    expect((await listUserClaims(userId, now))[0]?.status).toBe('withdrawn');
  });
});

describe('resendClaim', () => {
  it('replaces the link: the old one stops working and the new one carries the same details', async () => {
    const userId = fresh();
    const first = await open(userId, { date: '2026-10-03', minutes: 90 });
    const again = await resendClaim(userId, `${userId}@mail.test`, first.claim.id, later(1));
    if (!again.ok) throw new Error('expected a resend');
    expect(again.claim).toMatchObject({
      orgName: first.claim.orgName,
      contactEmail: first.claim.contactEmail,
      date: '2026-10-03',
      minutes: 90,
      locale: 'es',
    });
    expect(await resolveClaim(first.token, 'verified', later(1))).toBe('closed');
    expect(await resolveClaim(again.token, 'verified', later(1))).toBe('ok');
  });

  it('can revive an expired claim, and the replaced claim does not count against the pending cap', async () => {
    const userId = fresh();
    const stale = await open(userId, {}, later(-30));
    for (let i = 0; i < VAULT_LIMITS.pendingPerUser - 1; i++)
      await open(userId, {}, later(-0.1 * (i + 1)));
    expect((await resendClaim(userId, undefined, stale.claim.id, now)).ok).toBe(true);
  });

  it('keeps optional details off when the original had none', async () => {
    const userId = fresh();
    const first = await open(userId);
    const again = await resendClaim(userId, undefined, first.claim.id, now);
    if (!again.ok) throw new Error('expected a resend');
    expect(again.claim.date).toBeUndefined();
    expect(again.claim.minutes).toBeUndefined();
  });

  it('is not found for other people’s, answered or unknown claims', async () => {
    const userId = fresh();
    const { claim, token } = await open(userId);
    expect(await resendClaim('other', undefined, claim.id, now)).toEqual({
      ok: false,
      reason: 'notFound',
    });
    expect(await resendClaim(userId, undefined, 'missing', now)).toEqual({
      ok: false,
      reason: 'notFound',
    });
    await resolveClaim(token, 'rejected', now);
    expect(await resendClaim(userId, undefined, claim.id, now)).toEqual({
      ok: false,
      reason: 'notFound',
    });
  });

  it('applies the same limits and leaves the old claim alone when refused', async () => {
    const userId = fresh();
    const first = await open(userId);
    expect(await resendClaim(userId, first.claim.contactEmail, first.claim.id, now)).toEqual({
      ok: false,
      reason: 'ownAddress',
    });
    expect(await resolveClaim(first.token, 'verified', now)).toBe('ok');
  });
});

describe('profiles', () => {
  it('creates a profile, updates it, and finds only public ones by handle', async () => {
    const userId = fresh();
    const handle = `h-${userId}`;
    expect(await getProfile(userId)).toBeUndefined();
    expect((await saveProfile(userId, { handle, displayName: 'Jane', isPublic: false })).ok).toBe(
      true,
    );
    expect(await getPublicProfile(handle)).toBeUndefined();

    const updated = await saveProfile(userId, { handle, displayName: 'Jane D', isPublic: true });
    expect(updated).toMatchObject({ ok: true, profile: { displayName: 'Jane D', isPublic: true } });
    expect((await getProfile(userId))?.displayName).toBe('Jane D');
    expect((await getPublicProfile(handle))?.userId).toBe(userId);
    expect(await getPublicProfile('nobody-here')).toBeUndefined();
  });

  it('refuses a handle another person holds', async () => {
    const handle = `taken-${++n}`;
    await saveProfile(fresh(), { handle, displayName: 'A', isPublic: true });
    expect(await saveProfile(fresh(), { handle, displayName: 'B', isPublic: true })).toEqual({
      ok: false,
      reason: 'handleTaken',
    });
  });
});

describe('listPublicBadges', () => {
  it('lists only label, organization, source, color and date, newest first', async () => {
    const userId = fresh();
    const a = await open(userId, { orgName: 'First Org' }, later(-3));
    const b = await open(userId, { orgName: 'Second Org' }, later(-1));
    await resolveClaim(a.token, 'verified', later(-2));
    await resolveClaim(b.token, 'verified', later(-0.5));
    const badges = await listPublicBadges(userId);
    expect(badges.map((x) => x.label)).toEqual(['Second Org', 'First Org']);
    expect(Object.keys(badges[0]!).sort()).toEqual([
      'awardedAt',
      'color',
      'id',
      'label',
      'orgName',
      'source',
    ]);
  });
});
