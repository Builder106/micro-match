// JSON calls to the app's own API, with the error shape the endpoints return
// ({ error, reasons }) turned into one readable message.
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export function errorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const { error, reasons } = body as { error?: unknown; reasons?: unknown };
  const base = typeof error === 'string' && error ? error : fallback;
  return Array.isArray(reasons) && reasons.length ? `${base}: ${reasons.join(', ')}` : base;
}

export async function callApi<T>(
  url: string,
  init: { method?: string; body?: unknown; fallback?: string } = {}
): Promise<ApiResult<T>> {
  const fallback = init.fallback ?? 'Something went wrong. Please try again.';
  try {
    const res = await fetch(url, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      credentials: 'include',
      headers: init.body === undefined ? undefined : { 'content-type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body)
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, error: errorMessage(body, fallback) };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, status: 0, error: 'Could not reach MicroMatch. Check your connection and try again.' };
  }
}
