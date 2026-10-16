// Rules for sending work on a claim.
export const NOTES_MAX = 1000;

/** A proof link must be a full http(s) URL the nonprofit can open. */
export function isHttpUrl(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
