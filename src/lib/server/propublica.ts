// ProPublica Nonprofit Explorer lookup — no API key required.
// Endpoint: GET https://projects.propublica.org/nonprofits/api/v2/organizations/{ein}.json
// Docs: https://projects.propublica.org/nonprofits/api

export type ProPublicaResult =
  | { found: true; orgName: string; status: 'active' | 'revoked' | 'unknown'; ntee?: string; rulingDate?: string }
  | { found: false; error?: string };

function normalizeEin(ein: string): string {
  // EIN format is XX-XXXXXXX or 9 contiguous digits. ProPublica accepts no-dashes.
  return ein.replace(/[^0-9]/g, '');
}

export async function lookupNonprofitByEin(rawEin: string): Promise<ProPublicaResult> {
  const ein = normalizeEin(rawEin);
  if (ein.length !== 9) return { found: false, error: 'EIN must be 9 digits' };

  const url = `https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 404) return { found: false, error: 'Not found in IRS records' };
    if (!res.ok) return { found: false, error: `ProPublica ${res.status}` };

    interface ProPublicaOrg {
      name?: string;
      revocation_date?: string | null;
      ntee_code?: string | null;
      ruling_date?: string | null;
    }
    interface ProPublicaResponse {
      organization?: ProPublicaOrg;
    }
    const data = (await res.json()) as ProPublicaResponse;
    const org = data?.organization;
    if (!org) return { found: false, error: 'Empty response' };

    // tax_period_begin / tax_exempt_status fields vary; rely on what's reliably present.
    // ProPublica exposes a `subsection_code` and `revocation_date`; revocation_date being non-null = revoked.
    const revoked = !!org.revocation_date;
    return {
      found: true,
      orgName: org.name || 'Unknown',
      status: revoked ? 'revoked' : 'active',
      ntee: org.ntee_code || undefined,
      rulingDate: org.ruling_date || undefined
    };
  } catch (err: unknown) {
    return { found: false, error: err instanceof Error ? err.message : String(err) };
  }
}
