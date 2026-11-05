// The badge vault: work done outside MicroMatch, confirmed by an email to the organization's
// contact, then minted as a badge. Limits live in #lib/vault.js.
import { createHash, randomBytes } from 'node:crypto';
import {
  APPWRITE_OFFPLATFORM_CLAIMS_TABLE_ID,
  APPWRITE_VAULT_PROFILES_TABLE_ID,
} from '$app/env/private';

import { VAULT_LIMITS, type ClaimInput } from '#lib/vault.js';
import type { Badge, OffplatformClaim, VaultProfile } from '#lib/types.js';
import { awardBadge, listBadgesByUser } from './appwrite.js';
import { openTable } from './rowStore.js';

const claims = openTable<OffplatformClaim>(APPWRITE_OFFPLATFORM_CLAIMS_TABLE_ID);
const profiles = openTable<VaultProfile>(APPWRITE_VAULT_PROFILES_TABLE_ID);

const DAY_MS = 24 * 60 * 60 * 1000;
const OFFPLATFORM_COLOR = '#F2B84B';

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** A claim that nobody answered in time reads as expired, with no write needed. */
function settle(claim: OffplatformClaim, now: Date): OffplatformClaim {
  return claim.status === 'pending' && Date.parse(claim.expiresAt) <= now.getTime()
    ? { ...claim, status: 'expired' }
    : claim;
}

export type Refusal = 'ownAddress' | 'tooManyPending' | 'dailyLimit' | 'addressLimit';

async function refusal(
  userId: string,
  userEmail: string | undefined,
  contactEmail: string,
  now: Date,
  replacing?: string,
): Promise<Refusal | null> {
  if (userEmail && userEmail.trim().toLowerCase() === contactEmail) return 'ownAddress';

  const mine = (await claims.list({ userId })).filter((c) => c.id !== replacing);
  if (mine.filter((c) => settle(c, now).status === 'pending').length >= VAULT_LIMITS.pendingPerUser)
    return 'tooManyPending';

  const since = now.getTime() - DAY_MS;
  const sent = (rows: OffplatformClaim[]) =>
    rows.filter((c) => Date.parse(c.createdAt) > since).length;
  if (sent(mine) >= VAULT_LIMITS.sendsPerUserPerDay) return 'dailyLimit';

  const toAddress = await claims.list({ contactEmail });
  if (sent(toAddress) >= VAULT_LIMITS.sendsPerAddressPerDay) return 'addressLimit';
  return null;
}

async function open(
  userId: string,
  input: ClaimInput,
  locale: string,
  now: Date,
): Promise<{ claim: OffplatformClaim; token: string }> {
  const token = randomBytes(32).toString('base64url');
  const claim = await claims.create({
    userId,
    ...input,
    status: 'pending',
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + VAULT_LIMITS.tokenDays * DAY_MS).toISOString(),
    locale,
    createdAt: now.toISOString(),
  });
  return { claim, token };
}

export type Opened =
  { ok: true; claim: OffplatformClaim; token: string } | { ok: false; reason: Refusal };

/** Records a claim and returns the token to email. Only the token's hash is stored. */
export async function submitClaim(
  userId: string,
  userEmail: string | undefined,
  input: ClaimInput,
  locale: string,
  now = new Date(),
): Promise<Opened> {
  const reason = await refusal(userId, userEmail, input.contactEmail, now);
  if (reason) return { ok: false, reason };
  return { ok: true, ...(await open(userId, input, locale, now)) };
}

/** Sends a fresh link for a claim the organization has not answered. The old link stops working. */
export async function resendClaim(
  userId: string,
  userEmail: string | undefined,
  claimId: string,
  now = new Date(),
): Promise<Opened | { ok: false; reason: 'notFound' }> {
  const old = (await claims.list({ userId })).find((c) => c.id === claimId);
  if (!old || !['pending', 'expired'].includes(settle(old, now).status))
    return { ok: false, reason: 'notFound' };

  const reason = await refusal(userId, userEmail, old.contactEmail, now, old.id);
  if (reason) return { ok: false, reason };

  const input: ClaimInput = {
    volunteerName: old.volunteerName,
    orgName: old.orgName,
    contactEmail: old.contactEmail,
    description: old.description,
    ...(old.date ? { date: old.date } : {}),
    ...(old.minutes ? { minutes: old.minutes } : {}),
  };
  const opened = await open(userId, input, old.locale, now);
  await claims.update(old.id, { status: 'expired', resolvedAt: now.toISOString() });
  return { ok: true, ...opened };
}

/** Lets a volunteer drop a pending claim, for example after mistyping the address. */
export async function withdrawClaim(
  userId: string,
  claimId: string,
  now = new Date(),
): Promise<boolean> {
  const claim = (await claims.list({ userId })).find((c) => c.id === claimId);
  if (!claim || settle(claim, now).status !== 'pending') return false;
  await claims.update(claim.id, { status: 'withdrawn', resolvedAt: now.toISOString() });
  return true;
}

export async function listUserClaims(
  userId: string,
  now = new Date(),
): Promise<OffplatformClaim[]> {
  return (await claims.list({ userId })).map((c) => settle(c, now));
}

export async function getClaimByToken(
  token: string,
  now = new Date(),
): Promise<OffplatformClaim | undefined> {
  const found = (await claims.list({ tokenHash: hashToken(token) }, 1))[0];
  return found && settle(found, now);
}

/** The organization's answer. Confirming mints the badge; either answer closes the link. */
export async function resolveClaim(
  token: string,
  decision: 'verified' | 'rejected',
  now = new Date(),
): Promise<'ok' | 'notFound' | 'closed'> {
  const claim = await getClaimByToken(token, now);
  if (!claim) return 'notFound';
  if (claim.status !== 'pending') return 'closed';
  await claims.update(claim.id, { status: decision, resolvedAt: now.toISOString() });
  if (decision === 'verified') {
    await awardBadge({
      userId: claim.userId,
      label: claim.orgName,
      color: OFFPLATFORM_COLOR,
      source: 'offplatform',
      orgName: claim.orgName,
      awardedAt: now.toISOString(),
    });
  }
  return 'ok';
}

export async function getProfile(userId: string): Promise<VaultProfile | undefined> {
  return (await profiles.list({ userId }, 1))[0];
}

export async function getPublicProfile(handle: string): Promise<VaultProfile | undefined> {
  const found = (await profiles.list({ handle }, 1))[0];
  return found?.isPublic ? found : undefined;
}

export type SavedProfile =
  { ok: true; profile: VaultProfile } | { ok: false; reason: 'handleTaken' };

export async function saveProfile(
  userId: string,
  fields: Pick<VaultProfile, 'handle' | 'displayName' | 'isPublic'>,
): Promise<SavedProfile> {
  const owner = (await profiles.list({ handle: fields.handle }, 1))[0];
  if (owner && owner.userId !== userId) return { ok: false, reason: 'handleTaken' };
  const mine = await getProfile(userId);
  const profile = mine
    ? ((await profiles.update(mine.id, fields)) as VaultProfile)
    : await profiles.create({ userId, ...fields });
  return { ok: true, profile };
}

/** What anyone may see on a public vault: label, organization, source and date. */
export type PublicBadge = Pick<
  Badge,
  'id' | 'label' | 'color' | 'awardedAt' | 'source' | 'orgName'
>;

export async function listPublicBadges(userId: string): Promise<PublicBadge[]> {
  const badges = await listBadgesByUser(userId);
  return badges
    .map(({ id, label, color, awardedAt, source, orgName }) => ({
      id,
      label,
      color,
      awardedAt,
      source,
      orgName,
    }))
    .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt));
}
