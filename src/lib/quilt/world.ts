// The site is one quilt. This module is its map: which block sits where, which routes open
// which block, and where the camera looks. Positions are in "pitch" units (one cell plus one
// strip of sashing), so CSS and the camera agree without measuring the DOM.
import { canonicalPath } from '#lib/site.js';
import type { PatternName } from './blocks';

export type BlockId =
  | 'title'
  | 'community'
  | 'tasks'
  | 'how'
  | 'volunteers'
  | 'nonprofits'
  | 'account'
  | 'about'
  | 'contact'
  | 'help'
  | 'docs'
  | 'api'
  | 'label';

export type PanelKind = 'read' | 'work' | 'narrow';

export type BlockDef = {
  id: BlockId;
  /** Route the block opens, or null for blocks that are not links themselves. */
  href: string | null;
  col: number;
  row: number;
  w: number;
  h: number;
  pattern: PatternName | null;
  /** Fabric hexes the pattern is pieced from, lightest last. */
  fabrics: string[];
  /** Order in the phone's vertical path. */
  phone: number;
};

export const GRID = { cols: 5, rows: 4 } as const;

export const BLOCKS: BlockDef[] = [
  {
    id: 'account',
    href: '/dashboard',
    col: 0,
    row: 0,
    w: 1,
    h: 1,
    pattern: 'courthouse',
    fabrics: ['#7A4E7E', '#F4A6B8', '#FBF3EA'],
    phone: 7,
  },
  {
    id: 'tasks',
    href: '/tasks',
    col: 1,
    row: 0,
    w: 2,
    h: 1,
    pattern: 'geese',
    fabrics: ['#FF6B6B', '#F2B84B', '#FBF3EA'],
    phone: 2,
  },
  {
    id: 'how',
    href: '/how-it-works',
    col: 3,
    row: 0,
    w: 1,
    h: 1,
    pattern: 'ninePatch',
    fabrics: ['#3B4A8C', '#7FB7D9', '#FBF3EA'],
    phone: 3,
  },
  {
    id: 'volunteers',
    href: '/for-volunteers',
    col: 4,
    row: 0,
    w: 1,
    h: 1,
    pattern: 'friendshipStar',
    fabrics: ['#F08A3C', '#F2B84B', '#FBF3EA'],
    phone: 4,
  },
  {
    id: 'nonprofits',
    href: '/for-nonprofits',
    col: 0,
    row: 1,
    w: 1,
    h: 1,
    pattern: 'churnDash',
    fabrics: ['#5E7D4F', '#8DAA8B', '#FBF3EA'],
    phone: 5,
  },
  {
    id: 'title',
    href: null,
    col: 1,
    row: 1,
    w: 2,
    h: 2,
    pattern: null,
    fabrics: ['#1C1F3B', '#FF6B6B', '#FBF3EA'],
    phone: 0,
  },
  {
    id: 'community',
    href: '/impact',
    col: 3,
    row: 1,
    w: 2,
    h: 2,
    pattern: null,
    fabrics: ['#1C1F3B'],
    phone: 1,
  },
  {
    id: 'about',
    href: '/about',
    col: 0,
    row: 2,
    w: 1,
    h: 1,
    pattern: 'railFence',
    fabrics: ['#FF6B6B', '#F4A6B8', '#FBF3EA'],
    phone: 8,
  },
  {
    id: 'contact',
    href: '/contact',
    col: 0,
    row: 3,
    w: 1,
    h: 1,
    pattern: 'ohioStar',
    fabrics: ['#5D6B7A', '#7FB7D9', '#FBF3EA'],
    phone: 12,
  },
  {
    id: 'help',
    href: '/help',
    col: 1,
    row: 3,
    w: 1,
    h: 1,
    pattern: 'pinwheel',
    fabrics: ['#F2B84B', '#F08A3C', '#FBF3EA'],
    phone: 9,
  },
  {
    id: 'docs',
    href: '/docs',
    col: 2,
    row: 3,
    w: 1,
    h: 1,
    pattern: 'hourglass',
    fabrics: ['#3B4A8C', '#8DAA8B', '#FBF3EA'],
    phone: 10,
  },
  {
    id: 'api',
    href: '/docs/api',
    col: 3,
    row: 3,
    w: 1,
    h: 1,
    pattern: 'triangles',
    fabrics: ['#7A4E7E', '#7FB7D9', '#FBF3EA'],
    phone: 11,
  },
  {
    id: 'label',
    href: null,
    col: 4,
    row: 3,
    w: 1,
    h: 1,
    pattern: null,
    fabrics: ['#1C1F3B'],
    phone: 13,
  },
];

/**
 * SVG fill for a piecing fabric. Muslin and indigo follow the color scheme (by lamplight the
 * muslin goes dark and the indigo turns cream); every other dye keeps its hex.
 */
export function clothFill(hex: string): string {
  if (hex === '#FBF3EA') return 'var(--cloth-muslin)';
  if (hex === '#1C1F3B') return 'var(--cloth-indigo)';
  return hex;
}

const BY_ID = new Map(BLOCKS.map((b) => [b.id, b]));

export function block(id: BlockId): BlockDef {
  return BY_ID.get(id) as BlockDef;
}

/** Blocks in the phone's reading order. */
export function phonePath(): BlockDef[] {
  return [...BLOCKS].sort((a, b) => a.phone - b.phone);
}

const ACCOUNT_PATHS = [
  '/dashboard',
  '/profile',
  '/org',
  '/badges',
  '/admin',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];
const WORK_PATHS = ['/tasks', '/task', '/dashboard', '/profile', '/org', '/badges', '/admin'];
const NARROW_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'];
const LABEL_PATHS = ['/privacy', '/terms', '/cookies'];

const within = (path: string, roots: string[]) =>
  roots.some((r) => path === r || path.startsWith(`${r}/`));

/** The block a route opens, or null for home, the contents page and unknown routes. */
export function blockForPath(pathname: string): BlockId | null {
  const path = canonicalPath(pathname);
  if (path === '/' || path === '/contents') return null;
  if (within(path, ['/tasks', '/task'])) return 'tasks';
  if (within(path, ACCOUNT_PATHS)) return 'account';
  if (within(path, LABEL_PATHS)) return 'label';
  if (path === '/impact') return 'community';
  if (path === '/docs/api') return 'api';
  const match = BLOCKS.find((b) => b.href === path);
  return match ? match.id : null;
}

/** Which panel a route opens in, or null when the route is the quilt itself (home). */
export function panelKindForPath(pathname: string): PanelKind | null {
  const path = canonicalPath(pathname);
  if (path === '/') return null;
  if (within(path, NARROW_PATHS)) return 'narrow';
  if (within(path, WORK_PATHS)) return 'work';
  return 'read';
}

export type Point = { x: number; y: number };

/** Where the camera looks on the quilt at rest: between the title and community blocks. */
export const HOME_FOCUS: Point = { x: 3, y: 2 };

/** A block's center in pitch units. */
export function blockCenter(b: Pick<BlockDef, 'col' | 'row' | 'w' | 'h'>): Point {
  return { x: b.col + b.w / 2, y: b.row + b.h / 2 };
}

/** The camera's focus for a route: the block it opens, or the quilt's center. */
export function focusForPath(pathname: string): Point {
  const id = blockForPath(pathname);
  return id ? blockCenter(block(id)) : HOME_FOCUS;
}

/**
 * The quilting line: one cell-long stretch of sashing for every block edge, shared edges once.
 * `x`, `y` is the cell the seam borders on its top (h) or left (v) side. A seam runs away from
 * the home focus, because a quilt is quilted from the center out.
 */
export type Seam = { x: number; y: number; dir: 'h' | 'v'; reverse: boolean; dist: number };

export function seams(): Seam[] {
  const owner = (c: number, r: number) =>
    BLOCKS.find((b) => c >= b.col && c < b.col + b.w && r >= b.row && r < b.row + b.h)?.id ?? null;
  const out: Seam[] = [];
  for (let r = 0; r <= GRID.rows; r++) {
    for (let c = 0; c <= GRID.cols; c++) {
      if (c < GRID.cols && owner(c, r - 1) !== owner(c, r)) {
        out.push({
          x: c,
          y: r,
          dir: 'h',
          reverse: c + 0.5 < HOME_FOCUS.x,
          dist: Math.hypot(c + 0.5 - HOME_FOCUS.x, r - HOME_FOCUS.y),
        });
      }
      if (r < GRID.rows && owner(c - 1, r) !== owner(c, r)) {
        out.push({
          x: c,
          y: r,
          dir: 'v',
          reverse: r + 0.5 < HOME_FOCUS.y,
          dist: Math.hypot(c - HOME_FOCUS.x, r + 0.5 - HOME_FOCUS.y),
        });
      }
    }
  }
  return out;
}

export type Metrics = { cell: number; sash: number };

/** Pitch units to pixels on the quilt. A pitch is one cell plus one strip of sashing. */
export function toPixels(p: Point, m: Metrics): Point {
  const pitch = m.cell + m.sash;
  return { x: m.sash / 2 + p.x * pitch, y: m.sash / 2 + p.y * pitch };
}

export function worldSize(m: Metrics): { w: number; h: number } {
  return { w: GRID.cols * (m.cell + m.sash) + m.sash, h: GRID.rows * (m.cell + m.sash) + m.sash };
}

/**
 * Camera translation that puts `focus` (quilt pixels) at the center of the visible area. With
 * a panel open, the visible area is the strip of quilt left of the panel.
 */
export function cameraFor(focus: Point, viewport: { w: number; h: number }, panelWidth = 0): Point {
  return { x: (viewport.w - panelWidth) / 2 - focus.x, y: viewport.h / 2 - focus.y };
}

/** Keep the quilt on screen: it may drift past its edges by `slack` pixels, no further. */
export function clampCamera(
  cam: Point,
  viewport: { w: number; h: number },
  world: { w: number; h: number },
  slack: number,
): Point {
  const axis = (value: number, view: number, size: number) => {
    const min = view - size - slack;
    const max = slack;
    if (min > max) return (view - size) / 2;
    return Math.min(max, Math.max(min, value));
  };
  return { x: axis(cam.x, viewport.w, world.w), y: axis(cam.y, viewport.h, world.h) };
}
