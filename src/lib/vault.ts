// Rules for the badge vault that both the server and the forms share: field checks, the
// handle format, and the limits that keep the confirmation email from becoming a spam tool.

export const VAULT_LIMITS = {
  /** Unanswered claims one volunteer can have at a time. */
  pendingPerUser: 5,
  /** Confirmation emails one volunteer can trigger in 24 hours. */
  sendsPerUserPerDay: 5,
  /** Confirmation emails any address can receive in 24 hours, from everyone. */
  sendsPerAddressPerDay: 3,
  /** Days an organization has to answer. */
  tokenDays: 14,
} as const;

export const FIELD_MAX = {
  name: 80,
  orgName: 80,
  email: 254,
  description: 500,
  displayName: 60,
} as const;

export type ClaimField =
  'volunteerName' | 'orgName' | 'contactEmail' | 'description' | 'date' | 'minutes';

export type ClaimInput = {
  volunteerName: string;
  orgName: string;
  contactEmail: string;
  description: string;
  date?: string;
  minutes?: number;
};

type Raw = { get(name: string): FormDataEntryValue | null };

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
// One line, single spaces: names and organizations end up in an email subject.
const text = (raw: Raw, name: string) => String(raw.get(name) ?? '').trim();
const line = (raw: Raw, name: string) => text(raw, name).replace(/\s+/g, ' ');

/** Checks the log-work form. Date and minutes are optional; everything else is required. */
export function parseClaimInput(
  raw: Raw,
  today: Date,
): { ok: true; value: ClaimInput } | { ok: false; errors: ClaimField[] } {
  const errors: ClaimField[] = [];
  const volunteerName = line(raw, 'volunteerName');
  const orgName = line(raw, 'orgName');
  const contactEmail = text(raw, 'contactEmail').toLowerCase();
  const description = text(raw, 'description');
  const date = text(raw, 'date');
  const minutesText = text(raw, 'minutes');

  if (volunteerName.length < 2 || volunteerName.length > FIELD_MAX.name)
    errors.push('volunteerName');
  if (orgName.length < 2 || orgName.length > FIELD_MAX.orgName) errors.push('orgName');
  if (contactEmail.length > FIELD_MAX.email || !EMAIL.test(contactEmail))
    errors.push('contactEmail');
  if (description.length < 10 || description.length > FIELD_MAX.description)
    errors.push('description');

  const todayText = today.toISOString().slice(0, 10);
  if (
    date &&
    (!DAY.test(date) || date > todayText || Number.isNaN(Date.parse(date)) || date < '1990-01-01')
  )
    errors.push('date');

  let minutes: number | undefined;
  if (minutesText) {
    minutes = Number(minutesText);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60000) errors.push('minutes');
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      volunteerName,
      orgName,
      contactEmail,
      description,
      ...(date ? { date } : {}),
      ...(minutes ? { minutes } : {}),
    },
  };
}

/** `jane.doe@school.org` becomes `j***@school.org`. Shown to the volunteer, never to the public. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  return `${email.slice(0, 1)}***${email.slice(at)}`;
}

const HANDLE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const RESERVED = new Set([
  'admin',
  'api',
  'about',
  'dashboard',
  'help',
  'login',
  'micromatch',
  'null',
  'profile',
  'signup',
  'support',
  'tasks',
  'undefined',
  'vault',
]);

/** A handle is 3 to 30 lowercase letters, digits or hyphens. Returns null when it is not one. */
export function parseHandle(value: string): string | null {
  const handle = value.trim().toLowerCase();
  return HANDLE.test(handle) && !RESERVED.has(handle) && !handle.includes('--') ? handle : null;
}

export function parseDisplayName(value: string, fallback: string): string {
  return value.trim().slice(0, FIELD_MAX.displayName) || fallback;
}
