import { fail, type Action } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getClaimByToken, resolveClaim } from '#lib/server/vault.js';

// The link is a secret: keep it out of Referer headers and caches. The page only reads on GET,
// because mail scanners open links, and an answer is recorded only by the POST buttons below.
export const load: PageServerLoad = async ({ params, setHeaders }) => {
  setHeaders({ 'referrer-policy': 'no-referrer', 'cache-control': 'private, no-store' });
  const claim = await getClaimByToken(params.token);
  if (claim?.status !== 'pending') return { open: false as const };
  const { volunteerName, orgName, description, date, minutes } = claim;
  return { open: true as const, volunteerName, orgName, description, date, minutes };
};

function answer(decision: 'verified' | 'rejected'): Action<{ token: string }> {
  return async ({ params }) => {
    const claim = await getClaimByToken(params.token);
    if (!claim || (await resolveClaim(params.token, decision)) !== 'ok')
      return fail(409, { closed: true as const });
    return { decision, volunteerName: claim.volunteerName };
  };
}

export const actions: Actions = { confirm: answer('verified'), decline: answer('rejected') };
