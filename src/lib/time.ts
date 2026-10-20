// Dates in plain words, in the visitor's language. `now` is a parameter so the wording is testable.
import * as m from '$lib/paraglide/messages.js';
import { getLocale } from '$lib/paraglide/runtime.js';

const shortDay = (date: Date) => date.toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' });

export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const min = Math.floor((now - then) / 60000);
  if (min < 1) return m.time_just_now();
  const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });
  if (min < 60) return rtf.format(-min, 'minute');
  const hr = Math.floor(min / 60);
  if (hr < 24) return rtf.format(-hr, 'hour');
  const days = Math.floor(hr / 24);
  if (days < 7) return rtf.format(-days, 'day');
  return shortDay(new Date(iso));
}

export type Deadline = { text: string; tone: 'late' | 'soon' | 'normal' };

export function deadlineLabel(iso: string | null | undefined, now = Date.now()): Deadline | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.ceil((date.getTime() - now) / 86400000);
  const day = shortDay(date);
  if (days < 0) return { text: m.deadline_closed({ day }), tone: 'late' };
  if (days === 0) return { text: m.deadline_today(), tone: 'soon' };
  if (days === 1) return { text: m.deadline_tomorrow(), tone: 'soon' };
  if (days <= 7) return { text: m.deadline_in_days({ count: days }), tone: 'soon' };
  return { text: m.deadline_on({ day }), tone: 'normal' };
}

/** Minutes as words for a task length: "15 min". */
export const minutesLabel = (minutes: number | null | undefined) => (typeof minutes === 'number' ? m.minutes_short({ count: minutes }) : m.time_not_set());
