import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { listVerifications, upsertVerification, setUserVerificationPref } from '$lib/server/verifications';
import { isUserAdmin } from '$lib/server/teams';
import { getUserRole } from '$lib/server/auth';
import { lookupNonprofitByEin } from '$lib/server/propublica';

/**
 * POST /api/verifications
 *   Body: { orgName, country, taxId, docFileId? }
 *   NGO submits or resubmits their own verification.
 *
 * GET /api/verifications?status=pending
 *   Admin lists verifications (with optional status filter). Each row is enriched
 *   with a ProPublica lookup result for US EINs so admins can sanity-check.
 */

export const POST: RequestHandler = async (event) => {
  const role = await getUserRole(event);
  if (role !== 'ngo') return json({ error: 'Forbidden' }, { status: 403 });

  const session = event.locals.session;
  const userId = session?.user?.id;
  if (!userId) return json({ error: 'Not signed in' }, { status: 401 });

  interface VerificationPostPayload {
    orgName?: string;
    country?: string;
    taxId?: string;
    docFileId?: string;
  }
  let body: VerificationPostPayload;
  try { body = await event.request.json(); } catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const orgName = String(body.orgName ?? '').trim();
  const country = String(body.country ?? '').trim().toUpperCase();
  const taxId = String(body.taxId ?? '').trim();
  const docFileId = body.docFileId ? String(body.docFileId) : undefined;

  if (!orgName) return json({ error: 'orgName is required' }, { status: 400 });
  if (!country || country.length !== 2) return json({ error: 'country must be ISO-3166 alpha-2' }, { status: 400 });
  if (!taxId) return json({ error: 'taxId is required' }, { status: 400 });

  const v = await upsertVerification({ userId, orgName, country, taxId, docFileId });
  await setUserVerificationPref(userId, 'pending');
  return json({ ok: true, verification: v });
};

export const GET: RequestHandler = async (event) => {
  const session = event.locals.session;
  const userId = session?.user?.id;
  if (!userId || !(await isUserAdmin(userId))) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = event.url.searchParams.get('status') as
    | 'pending' | 'approved' | 'rejected' | null;
  const rows = await listVerifications(status ? { status } : undefined);

  // Enrich US rows with ProPublica lookup (cheap — only on admin list view)
  const enriched = await Promise.all(rows.map(async (v) => {
    if (v.country === 'US') {
      const lookup = await lookupNonprofitByEin(v.taxId);
      return { ...v, propublica: lookup };
    }
    return { ...v, propublica: null };
  }));

  return json({ verifications: enriched });
};
