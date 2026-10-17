import { describe, it, expect } from 'vitest';
import { MUSLIN, SWATCHES, THREAD_DARK, THREAD_LIGHT, fabricFor, fabricForTag, luminance, normalizeHex, swatchName, threadFor } from './fabrics';

describe('normalizeHex', () => {
  it('expands short hex, drops alpha and upper-cases', () => {
    expect(normalizeHex('#f6b')).toBe('#FF66BB');
    expect(normalizeHex(' #ff6b6b ')).toBe('#FF6B6B');
    expect(normalizeHex('#ff6b6b80')).toBe('#FF6B6B');
  });
  it('rejects anything else', () => {
    expect(normalizeHex('red')).toBeNull();
    expect(normalizeHex('#12')).toBeNull();
    expect(normalizeHex(null)).toBeNull();
    expect(normalizeHex(undefined)).toBeNull();
  });
});

describe('colors on cloth', () => {
  it('measures luminance across the range', () => {
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#FFFFFF')).toBeCloseTo(1);
    expect(luminance('#020202')).toBeGreaterThan(0);
  });
  it('uses the badge color or undyed muslin', () => {
    expect(fabricFor('#3b4a8c')).toBe('#3B4A8C');
    expect(fabricFor(undefined)).toBe(MUSLIN);
  });
  it('picks indigo thread on light cloth and cream on dark', () => {
    expect(threadFor('#F2B84B')).toBe(THREAD_DARK);
    expect(threadFor('#3B4A8C')).toBe(THREAD_LIGHT);
    expect(threadFor(null)).toBe(THREAD_DARK);
  });
  it('names suggested swatches and falls back to the hex', () => {
    expect(swatchName('#ff6b6b')).toBe('Madder');
    expect(swatchName('#123456')).toBe('#123456');
    expect(swatchName('')).toBe('Muslin');
  });
  it('gives a tag the same swatch every time', () => {
    expect(fabricForTag('Health')).toBe(fabricForTag('#health'));
    expect(SWATCHES.map((s) => s.hex)).toContain(fabricForTag('translation'));
    expect(fabricForTag(undefined)).toBe(SWATCHES[1].hex);
    expect(fabricForTag('  ')).toBe(SWATCHES[1].hex);
  });
});
