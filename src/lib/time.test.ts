import { describe, it, expect } from 'vitest';
import { deadlineLabel, minutesLabel, relativeTime } from './time';

const now = Date.parse('2026-10-16T12:00:00Z');
const ago = (ms: number) => new Date(now - ms).toISOString();

describe('relativeTime', () => {
  it('reads like speech', () => {
    expect(relativeTime(ago(20_000), now)).toBe('just now');
    expect(relativeTime(ago(5 * 60_000), now)).toBe('5 min ago');
    expect(relativeTime(ago(3 * 3_600_000), now)).toBe('3 h ago');
    expect(relativeTime(ago(26 * 3_600_000), now)).toBe('yesterday');
    expect(relativeTime(ago(3 * 86_400_000), now)).toBe('3 days ago');
    expect(relativeTime(ago(20 * 86_400_000), now)).toMatch(/Sep/);
  });
  it('is empty for missing or broken dates', () => {
    expect(relativeTime(null, now)).toBe('');
    expect(relativeTime('nope', now)).toBe('');
  });
});

describe('deadlineLabel', () => {
  const inDays = (d: number) => new Date(now + d * 86_400_000 - 1000).toISOString();
  it('describes past, near and far deadlines', () => {
    expect(deadlineLabel(inDays(-2), now)?.tone).toBe('late');
    expect(deadlineLabel(new Date(now - 1000).toISOString(), now)).toMatchObject({ text: 'Due today', tone: 'soon' });
    expect(deadlineLabel(inDays(1), now)?.text).toBe('Due tomorrow');
    expect(deadlineLabel(inDays(5), now)?.text).toBe('Due in 5 days');
    expect(deadlineLabel(inDays(30), now)?.tone).toBe('normal');
  });
  it('is null without a valid date', () => {
    expect(deadlineLabel(undefined, now)).toBeNull();
    expect(deadlineLabel('soon', now)).toBeNull();
  });
});

describe('minutesLabel', () => {
  it('names the length or says it is not set', () => {
    expect(minutesLabel(15)).toBe('15 min');
    expect(minutesLabel(undefined)).toBe('Time not set');
  });
});
