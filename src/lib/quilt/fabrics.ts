// Fabric colors for patches. A patch takes its color from the badge its nonprofit designed;
// these swatches are the badge editor's suggestions, and any valid hex works.
import * as m from '$lib/paraglide/messages.js';

export type Swatch = { name: () => string; hex: string };

export const SWATCHES: Swatch[] = [
  { name: m.fabric_madder, hex: '#FF6B6B' },
  { name: m.fabric_weld, hex: '#F2B84B' },
  { name: m.fabric_indigo, hex: '#3B4A8C' },
  { name: m.fabric_sage, hex: '#8DAA8B' },
  { name: m.fabric_rose, hex: '#F4A6B8' },
  { name: m.fabric_sky, hex: '#7FB7D9' },
  { name: m.fabric_plum, hex: '#7A4E7E' },
  { name: m.fabric_moss, hex: '#5E7D4F' },
  { name: m.fabric_marigold, hex: '#F08A3C' },
  { name: m.fabric_slate, hex: '#5D6B7A' }
];

/** Undyed cloth, for patches whose nonprofit has not designed a badge yet. */
export const MUSLIN = '#E3D3B0';
export const THREAD_DARK = '#1C1F3B';
export const THREAD_LIGHT = '#FDFCF8';

/** Normalize #rgb, #rrggbb and #rrggbbaa to #RRGGBB, or return null for anything else. */
export function normalizeHex(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(v);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toUpperCase();
  const long = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/i.exec(v);
  return long ? `#${long[1]}`.toUpperCase() : null;
}

/** WCAG relative luminance of a #RRGGBB color. */
export function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** Cloth color for a patch: the badge color, or undyed muslin. */
export function fabricFor(color: string | null | undefined): string {
  return normalizeHex(color) ?? MUSLIN;
}

/** Thread that reads on the given cloth: indigo on light fabric, cream on dark. */
export function threadFor(color: string | null | undefined): string {
  return luminance(fabricFor(color)) > 0.3 ? THREAD_DARK : THREAD_LIGHT;
}

/** Name of a suggested swatch, or the hex itself for a custom color. */
export function swatchName(color: string | null | undefined): string {
  const hex = normalizeHex(color);
  if (!hex) return m.fabric_muslin();
  return SWATCHES.find((s) => s.hex === hex)?.name() ?? hex;
}

/** A steady swatch for a tag, so tasks about the same thing share a cloth. */
export function fabricForTag(tag: string | null | undefined): string {
  const key = (tag ?? '').replace(/^#/, '').trim().toLowerCase();
  if (!key) return SWATCHES[1].hex;
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SWATCHES[h % SWATCHES.length].hex;
}
