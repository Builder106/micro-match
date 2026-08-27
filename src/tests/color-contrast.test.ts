import { describe, expect, it } from 'vitest';

function relativeLuminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

describe('AAA-oriented semantic color pairs', () => {
  it('keeps normal light-mode text at or above 7:1', () => {
    expect(contrastRatio('#334155', '#FDFCF8')).toBeGreaterThanOrEqual(7);
    expect(contrastRatio('#881337', '#FDFCF8')).toBeGreaterThanOrEqual(7);
    expect(contrastRatio('#7F1D1D', '#FEE2E2')).toBeGreaterThanOrEqual(7);
  });

  it('keeps bright coral controls readable with dark text', () => {
    expect(contrastRatio('#020617', '#FF6B6B')).toBeGreaterThanOrEqual(7);
  });

  it('keeps status chip foregrounds at or above 7:1', () => {
    expect(contrastRatio('#064E3B', '#D1FAE5')).toBeGreaterThanOrEqual(7);
    expect(contrastRatio('#78350F', '#FEF3C7')).toBeGreaterThanOrEqual(7);
    expect(contrastRatio('#7F1D1D', '#FEE2E2')).toBeGreaterThanOrEqual(7);
  });
});
