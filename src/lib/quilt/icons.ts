// Embroidered patch icons. Path data comes from design/glaxnimate/patch-icons.svg (24 x 24,
// stroked, round caps). Badge definitions store an icon name; this maps any name, including
// the older Iconify names, to the icon that gets stitched on the patch.
import * as m from '$lib/paraglide/messages.js';

export const PATCH_ICONS = {
  heart:
    'M12 20C7.2 16.4 3.6 13.3 3.6 9.4 3.6 6.8 5.6 4.8 8.1 4.8c1.6 0 3 .8 3.9 2.2.9-1.4 2.3-2.2 3.9-2.2 2.5 0 4.5 2 4.5 4.6 0 3.9-3.6 7-8.4 10.6z',
  star: 'M12 3.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z',
  leaf: 'M5.2 19.6C4.4 11 9.4 4.6 19.6 4.4c.4 10.2-5.6 15.6-14.4 15.2zM5.2 19.6l7.4-7.6',
  globe:
    'M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 1 0 0-16.8zM3.8 12h16.4M12 3.6c2.4 2.3 3.7 5.1 3.7 8.4s-1.3 6.1-3.7 8.4c-2.4-2.3-3.7-5.1-3.7-8.4s1.3-6.1 3.7-8.4z',
  book: 'M12 6.6C10 5 7.4 4.6 4 4.6v13c3.4 0 6 .4 8 2 2-1.6 4.6-2 8-2v-13c-3.4 0-6 .4-8 2zM12 6.6v13',
  pencil: 'M15.6 4.6l3.8 3.8L8.6 19.2l-4.6.8.8-4.6zM13.4 6.8l3.8 3.8',
  speech:
    'M5.6 5h12.8c.9 0 1.6.7 1.6 1.6v7.8c0 .9-.7 1.6-1.6 1.6h-7l-4.2 3.4V16H5.6c-.9 0-1.6-.7-1.6-1.6V6.6C4 5.7 4.7 5 5.6 5zM8 9.4h8M8 12.4h5',
  house: 'M4.2 11.2 12 4.4l7.8 6.8M6.4 9.4v10.2h11.2V9.4M10 19.6v-5.2h4v5.2',
  sun: 'M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 1 0 0-7.2zM12 3.4v2.2M12 18.4v2.2M3.4 12h2.2M18.4 12h2.2M5.9 5.9l1.6 1.6M16.5 16.5l1.6 1.6M5.9 18.1l1.6-1.6M16.5 7.5l1.6-1.6',
  paw: 'M12 12.6c-2.8 0-5.4 2.9-5.4 5.2 0 1.5 1.2 2.2 2.6 2.2 1.1 0 1.8-.6 2.8-.6s1.7.6 2.8.6c1.4 0 2.6-.7 2.6-2.2 0-2.3-2.6-5.2-5.4-5.2zM6.2 8.4a1.6 2 0 1 0 0 4 1.6 2 0 1 0 0-4zM9.6 4.4a1.7 2.1 0 1 0 0 4.2 1.7 2.1 0 1 0 0-4.2zM14.4 4.4a1.7 2.1 0 1 0 0 4.2 1.7 2.1 0 1 0 0-4.2zM17.8 8.4a1.6 2 0 1 0 0 4 1.6 2 0 1 0 0-4z',
} as const;

export type PatchIcon = keyof typeof PATCH_ICONS;

export const PATCH_ICON_NAMES = Object.keys(PATCH_ICONS) as PatchIcon[];

export const PATCH_ICON_LABELS: Record<PatchIcon, () => string> = {
  heart: m.icon_heart,
  star: m.icon_star,
  leaf: m.icon_leaf,
  globe: m.icon_globe,
  book: m.icon_book,
  pencil: m.icon_pencil,
  speech: m.icon_speech,
  house: m.icon_house,
  sun: m.icon_sun,
  paw: m.icon_paw,
};

// Keywords from Iconify names that earlier badge definitions used, mapped to a stitched icon.
const KEYWORDS: [RegExp, PatchIcon][] = [
  [/heart|care|hand/, 'heart'],
  [/trophy|award|medal|star|sparkle/, 'star'],
  [/leaf|tree|plant|eco|seed/, 'leaf'],
  [/globe|earth|world|map/, 'globe'],
  [/book|read|database|data|doc|file/, 'book'],
  [/pencil|pen|edit|write|design/, 'pencil'],
  [/language|speech|chat|message|translat/, 'speech'],
  [/house|home/, 'house'],
  [/sun|fire|zap|bolt|flash/, 'sun'],
  [/paw|pet|animal|dog|cat/, 'paw'],
];

/** The stitched icon for a stored icon name, or null when nothing fits. */
export function resolvePatchIcon(name: string | null | undefined): PatchIcon | null {
  const raw = (name ?? '').trim().toLowerCase();
  if (!raw) return null;
  const bare = raw.startsWith('quilt:') ? raw.slice(6) : raw;
  if (bare in PATCH_ICONS) return bare as PatchIcon;
  return KEYWORDS.find(([pattern]) => pattern.test(bare))?.[1] ?? null;
}

/** The value stored on a badge definition for a stitched icon. */
export const iconValue = (icon: PatchIcon): string => `quilt:${icon}`;
