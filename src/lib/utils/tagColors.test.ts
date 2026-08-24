import { describe, it, expect } from 'vitest';
import { getTagStyle } from './tagColors';

describe('getTagStyle', () => {
  it('returns the matching palette entry for a known tag', () => {
    expect(getTagStyle('spanish')).toEqual({ bg: '#F3E8FF', color: '#581C87' });
    expect(getTagStyle('health')).toEqual({ bg: '#D1FAE5', color: '#064E3B' });
  });

  it('strips a leading # before lookup', () => {
    expect(getTagStyle('#data')).toEqual({ bg: '#FEF3C7', color: '#78350F' });
  });

  it('is case-insensitive', () => {
    const lower = getTagStyle('spanish');
    const upper = getTagStyle('SPANISH');
    const mixed = getTagStyle('Spanish');
    expect(upper).toEqual(lower);
    expect(mixed).toEqual(lower);
  });

  it('falls back to a neutral default for unknown tags', () => {
    expect(getTagStyle('quilting')).toEqual({ bg: '#F1F5F9', color: '#334155' });
    expect(getTagStyle('')).toEqual({ bg: '#F1F5F9', color: '#334155' });
  });
});

