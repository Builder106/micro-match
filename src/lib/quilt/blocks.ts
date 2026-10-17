// Traditional quilt block patterns for the sampler. Each block is pieced from squares,
// rectangles and triangles in a 100-unit cell (a 2-wide block is 200 x 100). `fabric` indexes
// the block's fabric list: 0 the main color, 1 the second, 2 the light background.
// design/glaxnimate/sampler-blocks.svg is the drawn reference made from this geometry.

export type PatternName =
  | 'ninePatch'
  | 'railFence'
  | 'pinwheel'
  | 'geese'
  | 'churnDash'
  | 'friendshipStar'
  | 'ohioStar'
  | 'courthouse'
  | 'hourglass'
  | 'triangles';

export type BlockPiece = { points: [number, number][]; fabric: number };

const S = 100;
const rect = (x: number, y: number, w: number, h: number, fabric: number): BlockPiece => ({
  points: [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h]
  ],
  fabric
});
const tri = (a: [number, number], b: [number, number], c: [number, number], fabric: number): BlockPiece => ({
  points: [a, b, c],
  fabric
});

/** A half-square triangle unit: the square split on a diagonal. `dir` picks which diagonal. */
function hst(x: number, y: number, s: number, dir: 0 | 1 | 2 | 3, a: number, b: number): BlockPiece[] {
  const tl: [number, number] = [x, y];
  const tr: [number, number] = [x + s, y];
  const br: [number, number] = [x + s, y + s];
  const bl: [number, number] = [x, y + s];
  if (dir === 0) return [tri(tl, tr, bl, a), tri(tr, br, bl, b)];
  if (dir === 1) return [tri(tl, tr, br, a), tri(tl, br, bl, b)];
  if (dir === 2) return [tri(tr, br, bl, a), tri(tl, tr, bl, b)];
  return [tri(tl, br, bl, a), tri(tl, tr, br, b)];
}

/** A quarter-square triangle unit (an hourglass): four triangles meeting in the middle. */
function qst(x: number, y: number, s: number, ab: number, lr: number): BlockPiece[] {
  const c: [number, number] = [x + s / 2, y + s / 2];
  return [
    tri([x, y], [x + s, y], c, ab),
    tri([x + s, y], [x + s, y + s], c, lr),
    tri([x + s, y + s], [x, y + s], c, ab),
    tri([x, y + s], [x, y], c, lr)
  ];
}

function ninePatch(): BlockPiece[] {
  const t = S / 3;
  const out: BlockPiece[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(rect(c * t, r * t, t, t, (r + c) % 2 === 0 ? 0 : 2));
  return out;
}

function railFence(): BlockPiece[] {
  const h = S / 2;
  const out: BlockPiece[] = [];
  [0, 1].forEach((qy) =>
    [0, 1].forEach((qx) => {
      const horizontal = (qx + qy) % 2 === 0;
      for (let i = 0; i < 3; i++) {
        const t = h / 3;
        out.push(
          horizontal ? rect(qx * h, qy * h + i * t, h, t, i) : rect(qx * h + i * t, qy * h, t, h, i)
        );
      }
    })
  );
  return out;
}

function pinwheel(): BlockPiece[] {
  const h = S / 2;
  const c: [number, number] = [h, h];
  return [
    tri([0, 0], [h, 0], c, 0),
    tri([0, 0], c, [0, h], 2),
    tri([S, 0], [S, h], c, 1),
    tri([h, 0], [S, 0], c, 2),
    tri([S, S], [h, S], c, 0),
    tri([S, h], [S, S], c, 2),
    tri([0, S], [0, h], c, 1),
    tri([h, S], [0, S], c, 2)
  ];
}

/** Flying geese across a block `w` cells wide: rows of triangles pointing right. */
function geese(w: number): BlockPiece[] {
  const out: BlockPiece[] = [];
  const rows = 2;
  const gh = S / rows;
  const gw = gh / 2;
  for (let r = 0; r < rows; r++) {
    for (let x = 0; x < w * S; x += gw) {
      const y = r * gh;
      out.push(tri([x, y], [x + gw, y + gh / 2], [x, y + gh], (x / gw + r) % 2 === 0 ? 0 : 1));
      out.push(tri([x, y], [x + gw, y], [x + gw, y + gh / 2], 2));
      out.push(tri([x, y + gh], [x + gw, y + gh / 2], [x + gw, y + gh], 2));
    }
  }
  return out;
}

function churnDash(): BlockPiece[] {
  const t = S / 3;
  return [
    ...hst(0, 0, t, 0, 0, 2),
    ...hst(2 * t, 0, t, 1, 0, 2),
    ...hst(0, 2 * t, t, 3, 0, 2),
    ...hst(2 * t, 2 * t, t, 2, 0, 2),
    rect(t, 0, t, t / 2, 0),
    rect(t, t / 2, t, t / 2, 2),
    rect(t, 2.5 * t, t, t / 2, 0),
    rect(t, 2 * t, t, t / 2, 2),
    rect(0, t, t / 2, t, 0),
    rect(t / 2, t, t / 2, t, 2),
    rect(2.5 * t, t, t / 2, t, 0),
    rect(2 * t, t, t / 2, t, 2),
    rect(t, t, t, t, 1)
  ];
}

function friendshipStar(): BlockPiece[] {
  const t = S / 3;
  return [
    rect(0, 0, t, t, 2),
    rect(2 * t, 0, t, t, 2),
    rect(0, 2 * t, t, t, 2),
    rect(2 * t, 2 * t, t, t, 2),
    ...hst(t, 0, t, 0, 2, 0),
    ...hst(2 * t, t, t, 1, 2, 0),
    ...hst(t, 2 * t, t, 2, 2, 0),
    ...hst(0, t, t, 3, 2, 0),
    rect(t, t, t, t, 1)
  ];
}

function ohioStar(): BlockPiece[] {
  const t = S / 3;
  return [
    rect(0, 0, t, t, 2),
    rect(2 * t, 0, t, t, 2),
    rect(0, 2 * t, t, t, 2),
    rect(2 * t, 2 * t, t, t, 2),
    ...qst(t, 0, t, 2, 0),
    ...qst(t, 2 * t, t, 2, 0),
    ...qst(0, t, t, 0, 2),
    ...qst(2 * t, t, t, 0, 2),
    rect(t, t, t, t, 1)
  ];
}

function courthouse(): BlockPiece[] {
  const out: BlockPiece[] = [];
  const steps = 3;
  const t = S / (2 * steps + 1);
  for (let i = 0; i < steps; i++) {
    const o = i * t;
    const span = S - 2 * o;
    out.push(rect(o, o, span, t, i % 2 === 0 ? 0 : 2));
    out.push(rect(o, S - o - t, span, t, i % 2 === 0 ? 0 : 2));
    out.push(rect(o, o + t, t, span - 2 * t, 1));
    out.push(rect(S - o - t, o + t, t, span - 2 * t, 1));
  }
  out.push(rect(steps * t, steps * t, t, t, 0));
  return out;
}

function hourglass(): BlockPiece[] {
  const h = S / 2;
  return [...qst(0, 0, h, 0, 2), ...qst(h, 0, h, 2, 1), ...qst(0, h, h, 2, 1), ...qst(h, h, h, 0, 2)];
}

function triangles(): BlockPiece[] {
  const n = 4;
  const t = S / n;
  const out: BlockPiece[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) out.push(...hst(c * t, r * t, t, (r + c) % 2 === 0 ? 1 : 3, (r + c) % 3 === 0 ? 1 : 0, 2));
  return out;
}

/** The pieces of a pattern for a block `w` by `h` cells. Non-geese patterns repeat per cell. */
export function patternPieces(name: PatternName, w = 1, h = 1): BlockPiece[] {
  if (name === 'geese') return geese(w).flatMap((p) => tileRows(p, h));
  const one = {
    ninePatch,
    railFence,
    pinwheel,
    churnDash,
    friendshipStar,
    ohioStar,
    courthouse,
    hourglass,
    triangles
  }[name]();
  const out: BlockPiece[] = [];
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++) out.push(...one.map((p) => ({ ...p, points: p.points.map(([x, y]) => [x + c * S, y + r * S] as [number, number]) })));
  return out;
}

function tileRows(p: BlockPiece, h: number): BlockPiece[] {
  return Array.from({ length: h }, (_, r) => ({ ...p, points: p.points.map(([x, y]) => [x, y + r * S] as [number, number]) }));
}

/**
 * A sawtooth border (a classic quilt border of half-square triangles) around a block of
 * `w` by `h` units, `size` deep. Triangles alternate fabric 0 and 1 against fabric 2.
 */
export function sawtoothBorder(w: number, h: number, size: number): BlockPiece[] {
  const out: BlockPiece[] = [];
  const run = (len: number, place: (i: number, s: number) => BlockPiece[]) => {
    const n = Math.max(1, Math.round(len / size));
    const s = len / n;
    for (let i = 0; i < n; i++) out.push(...place(i, s));
  };
  run(w, (i, s) => hst(i * s, 0, s, 0, i % 2 === 0 ? 0 : 1, 2));
  run(w, (i, s) => hst(i * s, h - s, s, 2, i % 2 === 0 ? 1 : 0, 2));
  run(h - 2 * size, (i, s) => hst(0, size + i * s, s, 3, i % 2 === 0 ? 1 : 0, 2));
  run(h - 2 * size, (i, s) => hst(w - s, size + i * s, s, 1, i % 2 === 0 ? 0 : 1, 2));
  return out;
}

/** SVG path data for a piece. */
export function piecePath(p: BlockPiece): string {
  return `M${p.points.map(([x, y]) => `${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100}`).join('L')}Z`;
}
