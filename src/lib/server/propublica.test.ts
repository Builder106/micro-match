import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { lookupNonprofitByEin } from './propublica';

const ENDPOINT_BASE = 'https://projects.propublica.org/nonprofits/api/v2/organizations/';

function mockFetchOnce(response: Partial<Response> & { ok: boolean; status?: number; json?: () => Promise<unknown> }) {
  vi.stubGlobal('fetch', vi.fn(async () => response as unknown as Response));
}

describe('lookupNonprofitByEin', () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('rejects EINs that are not 9 digits after stripping non-numeric characters', async () => {
    const result = await lookupNonprofitByEin('12-345');
    expect(result).toEqual({ found: false, error: 'EIN must be 9 digits' });
  });

  it('strips dashes from EIN before calling the API', async () => {
    const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ organization: { name: 'Test Org' } })
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchSpy);

    await lookupNonprofitByEin('13-3433452');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = fetchSpy.mock.calls[0]?.[0];
    expect(url).toBe(`${ENDPOINT_BASE}133433452.json`);
  });

  it('returns active status when revocation_date is empty', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({
        organization: { name: 'Doctors Without Borders', ntee_code: 'Q33', ruling_date: '1980-09-01' }
      })
    });

    const result = await lookupNonprofitByEin('133433452');
    expect(result).toEqual({
      found: true,
      orgName: 'Doctors Without Borders',
      status: 'active',
      ntee: 'Q33',
      rulingDate: '1980-09-01'
    });
  });

  it('reports revoked status when revocation_date is set', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({
        organization: { name: 'Bad Charity', revocation_date: '2018-05-15' }
      })
    });

    const result = await lookupNonprofitByEin('123456789');
    expect(result).toMatchObject({ found: true, status: 'revoked' });
  });

  it('returns found=false on 404', async () => {
    mockFetchOnce({ ok: false, status: 404 });
    const result = await lookupNonprofitByEin('999999999');
    expect(result).toEqual({ found: false, error: 'Not found in IRS records' });
  });

  it('returns found=false with status code on other HTTP errors', async () => {
    mockFetchOnce({ ok: false, status: 503 });
    const result = await lookupNonprofitByEin('111111111');
    expect(result).toEqual({ found: false, error: 'ProPublica 503' });
  });

  it('handles a malformed response that lacks the organization field', async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });
    const result = await lookupNonprofitByEin('222222222');
    expect(result).toEqual({ found: false, error: 'Empty response' });
  });

  it('catches network errors and surfaces them in the error field', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('connect ECONNREFUSED'); }));
    const result = await lookupNonprofitByEin('333333333');
    expect(result).toEqual({ found: false, error: 'connect ECONNREFUSED' });

    // Non-Error exception throw
    vi.stubGlobal('fetch', vi.fn(async () => { throw 'string exception'; }));
    const resultStringErr = await lookupNonprofitByEin('333333333');
    expect(resultStringErr).toEqual({ found: false, error: 'string exception' });
  });

  it('falls back to "Unknown" when organization has no name', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ organization: {} })
    });
    const result = await lookupNonprofitByEin('444444444');
    expect(result).toEqual({ found: true, orgName: 'Unknown', status: 'active', ntee: undefined, rulingDate: undefined });
  });
});
