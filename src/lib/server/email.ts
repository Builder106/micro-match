import { env } from '$env/dynamic/private';

export type SendArgs = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

const DEFAULT_API_URL = 'https://next-api.useplunk.com';
const DEFAULT_FROM_NAME = 'MicroMatch';
const SEND_TIMEOUT_MS = 10_000;

type PlunkResponse = { success?: boolean; data?: { emails?: Array<{ email?: string }> }; error?: unknown };

function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

function responseError(data: PlunkResponse | null, status: number): string {
  const error = typeof data?.error === 'string' ? data.error : 'Request failed';
  return `Plunk ${status}: ${error}`;
}

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = env.PLUNK_SECRET_KEY?.trim();
  const fromAddress = env.PLUNK_FROM_ADDRESS?.trim();

  if (!apiKey || !fromAddress) {
    if (env.NODE_ENV !== 'production') {
      console.log(`[email:dev] would send to ${args.to} — ${args.subject} (Plunk not configured)`);
    }
    return { ok: false, error: 'Plunk not configured (set PLUNK_SECRET_KEY, PLUNK_FROM_ADDRESS)' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  const apiUrl = (env.PLUNK_API_URL?.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
  const body = args.html === undefined || args.html === null
    ? textToHtml(args.text ?? '')
    : args.html;
  const payload = {
    to: args.to,
    subject: args.subject,
    body,
    from: { name: env.PLUNK_FROM_NAME?.trim() || DEFAULT_FROM_NAME, email: fromAddress }
  };

  try {
    const res = await fetch(`${apiUrl}/v1/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = (await res.json().catch(() => null)) as PlunkResponse | null;
    if (!res.ok || data?.success !== true) return { ok: false, error: responseError(data, res.status) };
    return { ok: true, id: data.data?.emails?.[0]?.email };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network error' };
  } finally {
    clearTimeout(timeout);
  }
}

function appUrl(): string {
  return (env.PUBLIC_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function shell(headline: string, body: string, ctaLabel: string, ctaHref: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FDFCF8;font-family:Inter,system-ui,sans-serif;color:#1E293B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDFCF8;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:24px;border:1px solid rgba(15,23,42,0.06);box-shadow:0 8px 24px rgba(15,23,42,0.04);">
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-family:'Plus Jakarta Sans',Inter,sans-serif;font-weight:800;font-size:18px;color:#FF6B6B;letter-spacing:-0.01em;">MicroMatch</div>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h1 style="font-family:'Plus Jakarta Sans',Inter,sans-serif;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.02em;margin:0 0 12px;">${headline}</h1>
          <div style="font-size:15px;line-height:1.6;color:#1E293B;">${body}</div>
        </td></tr>
        <tr><td style="padding:24px 32px 32px;">
          <a href="${ctaHref}" style="display:inline-block;background:#FF6B6B;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 24px;border-radius:9999px;">${ctaLabel}</a>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:rgba(15,23,42,0.5);">You're receiving this because you submitted an NGO verification on MicroMatch.</p>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendVerificationApproved(args: { to: string; orgName: string }) {
  const url = `${appUrl()}/profile`;
  const body = `
    <p style="margin:0 0 12px;">Good news — <strong>${escapeHtml(args.orgName)}</strong> is now a verified NGO on MicroMatch.</p>
    <p style="margin:0;">Tasks you post will show a <strong>Verified</strong> chip so volunteers know your work is trusted.</p>`;
  return sendEmail({
    to: args.to,
    subject: 'Your NGO is verified',
    html: shell('You\'re verified ✓', body, 'Post a task →', `${appUrl()}/org`),
    text: `Good news — ${args.orgName} is now a verified NGO on MicroMatch. Visit ${url} to manage your profile.`
  });
}

export async function sendVerificationRejected(args: { to: string; orgName: string; reason: string }) {
  const url = `${appUrl()}/profile`;
  const body = `
    <p style="margin:0 0 12px;">We took a look at the verification submission for <strong>${escapeHtml(args.orgName)}</strong> and need a couple of changes before approving it:</p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;background:#FEF3C7;border-left:4px solid #D97706;border-radius:8px;font-size:14px;color:#78350F;">${escapeHtml(args.reason)}</blockquote>
    <p style="margin:0;">You can update your submission and resubmit anytime from your profile.</p>`;
  return sendEmail({
    to: args.to,
    subject: 'Verification needs changes',
    html: shell('Verification needs changes', body, 'Update submission →', url),
    text: `Verification for ${args.orgName} needs changes: ${args.reason}\n\nUpdate your submission at ${url}.`
  });
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c] as string));
}
