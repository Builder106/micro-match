// Log cabin quilt geometry. A block starts with one center square, and every strip after it
// wraps around the block so far: right, bottom, left, top, then round again. Strips are
// quadrilaterals that share their inner edge with the block exactly, so seams always meet,
// while their outer corners wobble a little, like a hand-pieced "wonky" log cabin.
// Pure functions: the same count always produces the same quilt.

export type Point = { x: number; y: number };
export type Side = 'center' | 'right' | 'bottom' | 'left' | 'top';

export type Piece = {
  /** Position in the whole quilt, 0-based. */
  index: number;
  block: number;
  side: Side;
  /** Corners in drawing order. */
  corners: [Point, Point, Point, Point];
  /** The seam that joins this piece to the block (the center square uses its full outline). */
  seam: Point[];
  center: Point;
  /** Largest square that comfortably fits, used to size the embroidered icon. */
  room: number;
};

export type QuiltLayout = {
  pieces: Piece[];
  /** The next open piece, chalked in and waiting. */
  next: Piece;
  width: number;
  height: number;
  columns: number;
  rows: number;
  blockSize: number;
};

/** One center square plus three full rounds of strips. */
export const PIECES_PER_BLOCK = 13;
/** Size of a strip's thickness and of half the center square, in quilt units. */
export const UNIT = 40;
const SASHING = UNIT * 0.5;
/**
 * Every block gets the same square cell, sized for the widest a full block can grow (center
 * square, three rounds of the thickest strips, and the most wobble), so the quilt never shifts
 * when a new block starts.
 */
export const BLOCK_SIZE = UNIT * 10;
const MARGIN = UNIT * 0.6;
const ORDER: Exclude<Side, 'center'>[] = ['right', 'bottom', 'left', 'top'];

/** Small deterministic PRNG so every visitor sees the same quilt. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const add = (p: Point, x: number, y: number): Point => ({ x: p.x + x, y: p.y + y });

function centroid(c: Point[]): Point {
  return { x: c.reduce((s, p) => s + p.x, 0) / c.length, y: c.reduce((s, p) => s + p.y, 0) / c.length };
}

type Outline = { tl: Point; tr: Point; br: Point; bl: Point };

/** Every piece of one full block, in local coordinates with the center square at the origin. */
export function blockPieces(block: number): Omit<Piece, 'index' | 'block'>[] {
  const rand = seeded(block * 7919 + 17);
  const wob = () => (rand() - 0.5) * UNIT * 0.15;
  const half = UNIT;
  const o: Outline = {
    tl: { x: -half + wob() * 0.6, y: -half + wob() * 0.6 },
    tr: { x: half + wob() * 0.6, y: -half + wob() * 0.6 },
    br: { x: half + wob() * 0.6, y: half + wob() * 0.6 },
    bl: { x: -half + wob() * 0.6, y: half + wob() * 0.6 }
  };
  const first: [Point, Point, Point, Point] = [o.tl, o.tr, o.br, o.bl];
  const out: Omit<Piece, 'index' | 'block'>[] = [
    { side: 'center', corners: first, seam: [...first, o.tl], center: centroid(first), room: UNIT * 1.6 }
  ];

  for (let i = 1; i < PIECES_PER_BLOCK; i++) {
    const side = ORDER[(i - 1) % 4];
    const t = UNIT * (0.8 + rand() * 0.42);
    let corners: [Point, Point, Point, Point];
    let seam: Point[];
    if (side === 'right') {
      const tr = add(o.tr, t + wob(), wob());
      const br = add(o.br, t + wob(), wob());
      corners = [o.tr, tr, br, o.br];
      seam = [o.tr, o.br];
      o.tr = tr;
      o.br = br;
    } else if (side === 'bottom') {
      const br = add(o.br, wob(), t + wob());
      const bl = add(o.bl, wob(), t + wob());
      corners = [o.bl, o.br, br, bl];
      seam = [o.bl, o.br];
      o.br = br;
      o.bl = bl;
    } else if (side === 'left') {
      const tl = add(o.tl, -t + wob(), wob());
      const bl = add(o.bl, -t + wob(), wob());
      corners = [tl, o.tl, o.bl, bl];
      seam = [o.tl, o.bl];
      o.tl = tl;
      o.bl = bl;
    } else {
      const tl = add(o.tl, wob(), -t + wob());
      const tr = add(o.tr, wob(), -t + wob());
      corners = [tl, tr, o.tr, o.tl];
      seam = [o.tl, o.tr];
      o.tl = tl;
      o.tr = tr;
    }
    out.push({ side, corners, seam, center: centroid(corners), room: t * 0.82 });
  }
  return out;
}

function bounds(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/** Columns for a quilt of `blocks` blocks: one row up to two, then as square as it gets. */
export function columnsFor(blocks: number): number {
  if (blocks <= 2) return Math.max(1, blocks);
  return Math.ceil(Math.sqrt(blocks));
}

/**
 * Lay out a quilt for `count` patches. Blocks sit on a grid of equal cells with sashing
 * between them. The block that is still being pieced keeps its place in its cell, so the
 * quilt never jumps when the next patch arrives.
 */
export function layoutQuilt(count: number): QuiltLayout {
  const n = Math.max(0, Math.floor(count));
  const blocks = Math.max(1, Math.ceil((n + 1) / PIECES_PER_BLOCK));
  const columns = columnsFor(blocks);
  const rows = Math.ceil(blocks / columns);

  const full = Array.from({ length: blocks }, (_, b) => blockPieces(b));
  const extents = full.map((pieces) => bounds(pieces.flatMap((p) => p.corners)));
  const blockSize = BLOCK_SIZE;

  const placed: Piece[] = [];
  full.forEach((pieces, b) => {
    const e = extents[b];
    const col = b % columns;
    const row = Math.floor(b / columns);
    const cellX = MARGIN + col * (blockSize + SASHING);
    const cellY = MARGIN + row * (blockSize + SASHING);
    const dx = cellX + (blockSize - (e.x1 - e.x0)) / 2 - e.x0;
    const dy = cellY + (blockSize - (e.y1 - e.y0)) / 2 - e.y0;
    const move = (p: Point) => add(p, dx, dy);
    pieces.forEach((p, i) => {
      placed.push({
        index: b * PIECES_PER_BLOCK + i,
        block: b,
        side: p.side,
        corners: p.corners.map(move) as Piece['corners'],
        seam: p.seam.map(move),
        center: move(p.center),
        room: p.room
      });
    });
  });

  return {
    pieces: placed.slice(0, n),
    next: placed[n],
    width: MARGIN * 2 + columns * blockSize + (columns - 1) * SASHING,
    height: MARGIN * 2 + rows * blockSize + (rows - 1) * SASHING,
    columns,
    rows,
    blockSize
  };
}

/** SVG path data for a closed polygon. */
export function polygonPath(points: Point[]): string {
  return `M${points.map((p) => `${round(p.x)} ${round(p.y)}`).join('L')}Z`;
}

/** SVG path data for an open polyline. */
export function linePath(points: Point[]): string {
  return `M${points.map((p) => `${round(p.x)} ${round(p.y)}`).join('L')}`;
}

/** Pull points toward a center (their own centroid by default), for stitches just inside the cloth. */
export function inset(points: Point[], amount: number, c: Point = centroid(points)): Point[] {
  return points.map((p) => {
    const dx = c.x - p.x;
    const dy = c.y - p.y;
    const len = Math.hypot(dx, dy);
    return len === 0 ? p : { x: p.x + (dx / len) * amount, y: p.y + (dy / len) * amount };
  });
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
