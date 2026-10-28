import { describe, it, expect } from 'vitest';
import {
  PATCH_ICONS,
  PATCH_ICON_LABELS,
  PATCH_ICON_NAMES,
  iconValue,
  resolvePatchIcon,
} from './icons';

describe('patch icons', () => {
  it('labels every icon', () => {
    expect(PATCH_ICON_NAMES).toHaveLength(Object.keys(PATCH_ICONS).length);
    PATCH_ICON_NAMES.forEach((n) => expect(PATCH_ICON_LABELS[n]()).toBeTruthy());
  });
  it('reads stored names with or without the quilt prefix', () => {
    expect(resolvePatchIcon('quilt:leaf')).toBe('leaf');
    expect(resolvePatchIcon('Paw')).toBe('paw');
    expect(iconValue('sun')).toBe('quilt:sun');
  });
  it('maps older Iconify names by keyword', () => {
    expect(resolvePatchIcon('hugeicons:trophy-01')).toBe('star');
    expect(resolvePatchIcon('hugeicons:fire')).toBe('sun');
    expect(resolvePatchIcon('hugeicons:globe-02')).toBe('globe');
    expect(resolvePatchIcon('lucide:languages')).toBe('speech');
    expect(resolvePatchIcon('lucide:database')).toBe('book');
    expect(resolvePatchIcon('lucide:check-heart')).toBe('heart');
    expect(resolvePatchIcon('mdi:tree')).toBe('leaf');
    expect(resolvePatchIcon('mdi:pencil-ruler')).toBe('pencil');
    expect(resolvePatchIcon('mdi:home-city')).toBe('house');
    expect(resolvePatchIcon('mdi:dog')).toBe('paw');
  });
  it('returns null when nothing fits', () => {
    expect(resolvePatchIcon('lucide:rocket')).toBeNull();
    expect(resolvePatchIcon('')).toBeNull();
    expect(resolvePatchIcon(null)).toBeNull();
  });
});
