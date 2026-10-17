// Dates in plain words. `now` is a parameter so the wording is testable.

export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const min = Math.floor((now - then) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export type Deadline = { text: string; tone: 'late' | 'soon' | 'normal' };

export function deadlineLabel(iso: string | null | undefined, now = Date.now()): Deadline | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.ceil((date.getTime() - now) / 86400000);
  const day = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  if (days < 0) return { text: `Closed ${day}`, tone: 'late' };
  if (days === 0) return { text: 'Due today', tone: 'soon' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'soon' };
  if (days <= 7) return { text: `Due in ${days} days`, tone: 'soon' };
  return { text: `Due ${day}`, tone: 'normal' };
}

/** Minutes as words for a task length: "15 min". */
export const minutesLabel = (m: number | null | undefined) => (typeof m === 'number' ? `${m} min` : 'Time not set');
