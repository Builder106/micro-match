import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listBadgesByUser } from '#lib/server/appwrite.js';
import { sendVaultRequest } from '#lib/server/email.js';
import {
  getProfile,
  listUserClaims,
  resendClaim,
  saveProfile,
  submitClaim,
  withdrawClaim,
  type Opened,
} from '#lib/server/vault.js';
import { defaultLocale, isLocale } from '#lib/locale.js';
import { maskEmail, parseClaimInput, parseDisplayName, parseHandle } from '#lib/vault.js';
import type { OffplatformClaim } from '#lib/types.js';

/** A claim as the volunteer sees it: the contact's address is masked and the hash stays server-side. */
function present(claim: OffplatformClaim) {
  const { id, orgName, description, date, minutes, status, expiresAt, createdAt, contactEmail } =
    claim;
  return {
    id,
    orgName,
    description,
    date,
    minutes,
    status,
    expiresAt,
    createdAt,
    contact: maskEmail(contactEmail),
  };
}

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.session?.user?.id;
  if (!userId) throw redirect(303, '/login?next=/vault');

  const [badges, claims, profile] = await Promise.all([
    listBadgesByUser(userId),
    listUserClaims(userId),
    getProfile(userId),
  ]);
  return {
    badges: badges
      .map(({ id, label, color, awardedAt, source, orgName }) => ({
        id,
        label,
        color,
        awardedAt,
        source,
        orgName,
      }))
      .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt)),
    claims: claims.map(present),
    profile: profile
      ? { handle: profile.handle, displayName: profile.displayName, isPublic: profile.isPublic }
      : null,
  };
};

/** Emails the confirmation link. The claim is already saved, so a failed send is reported, not undone. */
async function deliver(opened: Extract<Opened, { ok: true }>) {
  const { claim, token } = opened;
  const locale = isLocale(claim.locale) ? claim.locale : defaultLocale;
  const sent = await sendVaultRequest({ to: claim.contactEmail, claim, token, locale });
  return { sent: maskEmail(claim.contactEmail), emailFailed: !sent.ok };
}

export const actions: Actions = {
  log: async ({ request, locals }) => {
    const userId = locals.session?.user?.id;
    if (!userId) return fail(401, { form: 'log' as const });

    const data = await request.formData();
    const parsed = parseClaimInput(data, new Date());
    if (!parsed.ok) {
      const values = Object.fromEntries([...data.entries()].map(([k, v]) => [k, String(v)]));
      return fail(400, { form: 'log' as const, errors: parsed.errors, values });
    }

    const opened = await submitClaim(
      userId,
      locals.session?.user?.email ?? undefined,
      parsed.value,
      locals.locale ?? defaultLocale,
    );
    if (!opened.ok)
      return fail(429, { form: 'log' as const, refused: opened.reason, values: parsed.value });
    return { form: 'log' as const, ...(await deliver(opened)) };
  },

  resend: async ({ request, locals }) => {
    const userId = locals.session?.user?.id;
    if (!userId) return fail(401, { form: 'claims' as const });

    const id = String((await request.formData()).get('id') ?? '');
    const opened = await resendClaim(userId, locals.session?.user?.email ?? undefined, id);
    if (!opened.ok)
      return fail(opened.reason === 'notFound' ? 404 : 429, {
        form: 'claims' as const,
        refused: opened.reason,
      });
    return { form: 'claims' as const, ...(await deliver(opened)) };
  },

  withdraw: async ({ request, locals }) => {
    const userId = locals.session?.user?.id;
    if (!userId) return fail(401, { form: 'claims' as const });

    const id = String((await request.formData()).get('id') ?? '');
    if (!(await withdrawClaim(userId, id)))
      return fail(404, { form: 'claims' as const, refused: 'notFound' as const });
    return { form: 'claims' as const, withdrawn: true };
  },

  profile: async ({ request, locals }) => {
    const userId = locals.session?.user?.id;
    if (!userId) return fail(401, { form: 'profile' as const });

    const data = await request.formData();
    const handle = parseHandle(String(data.get('handle') ?? ''));
    if (!handle) return fail(400, { form: 'profile' as const, handleError: 'invalid' as const });

    const saved = await saveProfile(userId, {
      handle,
      displayName: parseDisplayName(String(data.get('displayName') ?? ''), handle),
      isPublic: data.get('isPublic') === 'on',
    });
    if (!saved.ok) return fail(409, { form: 'profile' as const, handleError: 'taken' as const });
    return { form: 'profile' as const, saved: true };
  },
};
