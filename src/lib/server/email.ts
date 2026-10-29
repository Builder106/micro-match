import {
  PLUNK_SECRET_KEY,
  PLUNK_FROM_ADDRESS,
  NODE_ENV,
  PLUNK_API_URL,
  PLUNK_FROM_NAME,
  PUBLIC_APP_URL,
} from '$app/env/private';

import { defaultLocale, type Locale } from '#lib/locale.js';
import { renderVerificationApproved, renderVerificationRejected } from './emailTemplates';

export type SendArgs = {
  to: string;
  subject: string;
  html?: string | null;
  text?: string;
};

const DEFAULT_API_URL = 'https://next-api.useplunk.com';
const DEFAULT_FROM_NAME = 'MicroMatch';
const SEND_TIMEOUT_MS = 10_000;

type PlunkResponse = {
  success?: boolean;
  data?: { emails?: Array<{ email?: string }> };
  error?: string | { message?: string } | null;
};

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

export async function sendEmail(
  args: SendArgs,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = PLUNK_SECRET_KEY?.trim();
  const fromAddress = PLUNK_FROM_ADDRESS?.trim();

  if (!apiKey || !fromAddress) {
    if (NODE_ENV !== 'production') {
      console.log(`[email:dev] would send to ${args.to} — ${args.subject} (Plunk not configured)`);
    }
    return { ok: false, error: 'Plunk not configured (set PLUNK_SECRET_KEY, PLUNK_FROM_ADDRESS)' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  const apiUrl = (PLUNK_API_URL?.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
  const body =
    args.html === undefined || args.html === null ? textToHtml(args.text ?? '') : args.html;

  const payload = {
    to: args.to,
    subject: args.subject,
    body,
    from: {
      name: PLUNK_FROM_NAME?.trim() || DEFAULT_FROM_NAME,
      email: fromAddress,
    },
  };

  try {
    const res = await fetch(`${apiUrl}/v1/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => null)) as PlunkResponse | null;

    if (!res.ok || data?.success !== true)
      return { ok: false, error: responseError(data, res.status) };

    return { ok: true, id: data.data?.emails?.[0]?.email };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network error' };
  } finally {
    clearTimeout(timeout);
  }
}

function appUrl(): string {
  return (PUBLIC_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
}

export async function sendVerificationApproved(args: {
  to: string;
  orgName: string;
  locale?: Locale;
}) {
  return sendEmail({
    to: args.to,
    ...renderVerificationApproved(args.orgName, appUrl(), args.locale ?? defaultLocale),
  });
}

export async function sendVerificationRejected(args: {
  to: string;
  orgName: string;
  reason: string;
  locale?: Locale;
}) {
  return sendEmail({
    to: args.to,
    ...renderVerificationRejected(
      args.orgName,
      args.reason,
      appUrl(),
      args.locale ?? defaultLocale,
    ),
  });
}

function escapeHtml(s: string): string {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c] as string,
  );
}
