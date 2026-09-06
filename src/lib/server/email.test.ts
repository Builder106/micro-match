import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { envState } = vi.hoisted(() => ({ envState: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({ env: new Proxy(envState, { get: (_, key: string) => envState[key] }) }));
import { sendEmail, sendVerificationApproved, sendVerificationRejected } from './email';

function setEnv(values: Record<string, string | undefined>) { for (const key of Object.keys(envState)) delete envState[key]; Object.assign(envState, values); }
function response(body: unknown = { success: true, data: { emails: [{ email: 'plunk-id' }] } }, init: Partial<Response> = {}) { return { ok: true, status: 200, json: async () => body, ...init } as Response; }

describe('email module (Plunk)', () => {
  beforeEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); setEnv({}); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('returns a best-effort configuration error and logs only outside production', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    setEnv({ NODE_ENV: 'development' });
    expect((await sendVerificationApproved({ to: 'a@b', orgName: 'Org' })).error).toMatch(/Plunk not configured/);
    expect(log).toHaveBeenCalledOnce();
    setEnv({ NODE_ENV: 'production' }); log.mockClear();
    expect((await sendVerificationApproved({ to: 'a@b', orgName: 'Org' })).ok).toBe(false);
    expect(log).not.toHaveBeenCalled();
  });

  it('sends HTML to the default endpoint with Bearer auth and sender config', async () => {
    setEnv({ PLUNK_SECRET_KEY: 'secret', PLUNK_FROM_ADDRESS: 'noreply@micromatch.app' });
    const fetchSpy = vi.fn().mockResolvedValue(response()); vi.stubGlobal('fetch', fetchSpy);
    expect(await sendVerificationApproved({ to: 'jane@example.com', orgName: 'Example' })).toEqual({ ok: true, id: 'plunk-id' });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://next-api.useplunk.com/v1/send'); expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret');
    expect(JSON.parse(init.body as string)).toMatchObject({ to: 'jane@example.com', subject: 'Your NGO is verified', from: { name: 'MicroMatch', email: 'noreply@micromatch.app' } });
  });

  it('uses custom endpoint/name and supplied HTML', async () => {
    setEnv({ PLUNK_SECRET_KEY: 'secret', PLUNK_FROM_ADDRESS: 'env@example.com', PLUNK_FROM_NAME: 'MicroMatch Beta', PLUNK_API_URL: 'https://plunk.test/' });
    const fetchSpy = vi.fn().mockResolvedValue(response()); vi.stubGlobal('fetch', fetchSpy);
    await sendEmail({ to: 'a@b', subject: 'Subject', html: '<p>HTML</p>', text: 'ignored' });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://plunk.test/v1/send'); expect(JSON.parse(init.body as string)).toMatchObject({ body: '<p>HTML</p>', from: { name: 'MicroMatch Beta' } });
  });

  it('escapes text and converts it to HTML when HTML is absent', async () => {
    setEnv({ PLUNK_SECRET_KEY: 'secret', PLUNK_FROM_ADDRESS: 'a@b' }); const fetchSpy = vi.fn().mockResolvedValue(response()); vi.stubGlobal('fetch', fetchSpy);
    await sendEmail({ to: 'a@b', subject: 'Subject', text: '<script>x</script>\n\nSecond' });
    const body = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body as string).body;
    expect(body).toContain('&lt;script&gt;x&lt;/script&gt;'); expect(body).toContain('<p>Second</p>'); expect(body).not.toContain('<script>');
    await sendEmail({ to: 'a@b', subject: 'Subject', html: null as unknown as string, text: 'null HTML fallback' });
    await sendEmail({ to: 'a@b', subject: 'Subject' });
  });

  it('escapes organization names and rejection reasons in templates', async () => {
    setEnv({ PLUNK_SECRET_KEY: 'secret', PLUNK_FROM_ADDRESS: 'a@b' }); const fetchSpy = vi.fn().mockResolvedValue(response()); vi.stubGlobal('fetch', fetchSpy);
    await sendVerificationApproved({ to: 'a@b', orgName: '<script>alert(1)</script>' }); await sendVerificationRejected({ to: 'a@b', orgName: 'Org', reason: '<img onerror=x>' });
    const bodies = fetchSpy.mock.calls.map((call) => JSON.parse((call[1] as RequestInit).body as string).body as string);
    expect(bodies[0]).toContain('&lt;script&gt;'); expect(bodies[1]).toContain('&lt;img onerror=x&gt;');
  });

  it('rejects HTTP and Plunk failures', async () => {
    setEnv({ PLUNK_SECRET_KEY: 'secret', PLUNK_FROM_ADDRESS: 'a@b' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: 'bad key' }, { ok: false, status: 401 })));
    expect((await sendEmail({ to: 'a@b', subject: 'x', html: '<p>x</p>' })).error).toBe('Plunk 401: bad key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ success: false }))); expect((await sendEmail({ to: 'a@b', subject: 'x', html: '<p>x</p>' })).ok).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: { code: 'bad' } }))); expect((await sendEmail({ to: 'a@b', subject: 'x', html: '<p>x</p>' })).error).toBe('Plunk 200: Request failed');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(undefined, { json: async () => { throw new Error('invalid json'); } }))); expect((await sendEmail({ to: 'a@b', subject: 'x', html: '<p>x</p>' })).error).toBe('Plunk 200: Request failed');
  });

  it('accepts a successful response without a provider id', async () => {
    setEnv({ PLUNK_SECRET_KEY: 'secret', PLUNK_FROM_ADDRESS: 'a@b' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ success: true })));
    expect(await sendEmail({ to: 'a@b', subject: 'x', html: '<p>x</p>' })).toEqual({ ok: true, id: undefined });
  });

  it('normalizes non-Error network failures', async () => {
    setEnv({ PLUNK_SECRET_KEY: 'secret', PLUNK_FROM_ADDRESS: 'a@b' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    expect((await sendEmail({ to: 'a@b', subject: 'x', html: '<p>x</p>' })).error).toBe('network error');
  });

  it('returns network and timeout errors without retrying', async () => {
    setEnv({ PLUNK_SECRET_KEY: 'secret', PLUNK_FROM_ADDRESS: 'a@b' }); const fetchSpy = vi.fn().mockRejectedValue(new Error('socket hangup')); vi.stubGlobal('fetch', fetchSpy);
    expect((await sendEmail({ to: 'a@b', subject: 'x', html: '<p>x</p>' })).error).toBe('socket hangup');
    vi.useFakeTimers(); const timeoutFetch = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_, reject) => { init.signal?.addEventListener('abort', () => reject(new Error('aborted'))); })); vi.stubGlobal('fetch', timeoutFetch);
    const pending = sendEmail({ to: 'a@b', subject: 'x', html: '<p>x</p>' }); await vi.advanceTimersByTimeAsync(10_000);
    expect((await pending).error).toBe('aborted'); expect(timeoutFetch).toHaveBeenCalledOnce();
  });
});
