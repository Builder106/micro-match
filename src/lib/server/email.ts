import { env } from '$env/dynamic/private';

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function mailgunBaseUrl(): string {
  // Mailgun has two regions; default to US.
  const region = (env.MAILGUN_REGION || 'us').toLowerCase();
  return region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
}

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = env.MAILGUN_API_KEY;
  const domain = env.MAILGUN_DOMAIN;
  const from = env.MAILGUN_FROM_EMAIL || (domain ? `MicroMatch <noreply@${domain}>` : '');

  if (!apiKey || !domain || !from) {
    if (env.NODE_ENV !== 'production') {
      console.log(`[email:dev] would send to ${args.to} — ${args.subject} (Mailgun not configured)`);
    }
    return { ok: false, error: 'Mailgun not configured (set MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL)' };
  }

  // Mailgun expects HTTP Basic auth with username "api".
  const auth = Buffer.from(`api:${apiKey}`).toString('base64');
  const body = new URLSearchParams();
  body.set('from', from);
  body.set('to', args.to);
  body.set('subject', args.subject);
  body.set('html', args.html);
  if (args.text) body.set('text', args.text);

  try {
    const res = await fetch(`${mailgunBaseUrl()}/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, error: `Mailgun ${res.status}: ${detail.slice(0, 200)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
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
