import { describe, it, expect } from 'vitest';
import {
  PIECES_PER_BLOCK,
  UNIT,
  blockPieces,
  columnsFor,
  inset,
  layoutQuilt,
  linePath,
  polygonPath,
  seeded,
} from './layout';

describe('seeded', () => {
  it('repeats the same sequence for the same seed and stays in 0..1', () => {
    const a = seeded(7);
    const b = seeded(7);
    const xs = Array.from({ length: 20 }, () => a());
    expect(Array.from({ length: 20 }, () => b())).toEqual(xs);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(seeded(8)()).not.toBe(xs[0]);
  });
});

describe('blockPieces', () => {
  it('starts with a center square and wraps strips right, bottom, left, top', () => {
    const pieces = blockPieces(0);
    expect(pieces).toHaveLength(PIECES_PER_BLOCK);
    expect(pieces.map((p) => p.side).slice(0, 6)).toEqual([
      'center',
      'right',
      'bottom',
      'left',
      'top',
      'right',
    ]);
    expect(pieces[0].seam).toHaveLength(5);
    expect(pieces.slice(1).every((p) => p.seam.length === 2)).toBe(true);
  });

  it('shares each strip seam with corners of the block before it', () => {
    const [center, right] = blockPieces(3);
    expect(right.seam[0]).toEqual(center.corners[1]);
    expect(right.seam[1]).toEqual(center.corners[2]);
  });

  it('is deterministic per block and differs between blocks', () => {
    expect(blockPieces(2)).toEqual(blockPieces(2));
    expect(blockPieces(2)).not.toEqual(blockPieces(5));
  });
});

describe('columnsFor', () => {
  it('lays one or two blocks in a row, then goes square', () => {
    expect(columnsFor(0)).toBe(1);
    expect(columnsFor(1)).toBe(1);
    expect(columnsFor(2)).toBe(2);
    expect(columnsFor(3)).toBe(2);
    expect(columnsFor(5)).toBe(3);
  });
});

describe('layoutQuilt', () => {
  it('is an empty frame with the center square chalked when there are no patches', () => {
    const q = layoutQuilt(0);
    expect(q.pieces).toEqual([]);
    expect(q.next.side).toBe('center');
    expect(q.columns).toBe(1);
    expect(q.width).toBeGreaterThan(UNIT * 2);
  });

  it('places n pieces and chalks the n+1th', () => {
    const q = layoutQuilt(5);
    expect(q.pieces).toHaveLength(5);
    expect(q.pieces.map((p) => p.index)).toEqual([0, 1, 2, 3, 4]);
    expect(q.next.index).toBe(5);
  });

  it('starts a new block after a full one, without moving the first', () => {
    const one = layoutQuilt(PIECES_PER_BLOCK - 1);
    const two = layoutQuilt(PIECES_PER_BLOCK);
    expect(two.columns).toBe(2);
    expect(two.next.block).toBe(1);
    expect(two.next.side).toBe('center');
    expect(two.pieces[0].corners[0].y).toBeCloseTo(one.pieces[0].corners[0].y);
  });

  it('treats negative and fractional counts as whole patches', () => {
    expect(layoutQuilt(-3).pieces).toHaveLength(0);
    expect(layoutQuilt(2.7).pieces).toHaveLength(2);
  });

  it('grows rows when blocks outnumber the columns', () => {
    const q = layoutQuilt(PIECES_PER_BLOCK * 4);
    expect(q.columns).toBe(3);
    expect(q.rows).toBe(2);
  });
});

describe('path helpers', () => {
  const sq = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  it('writes closed polygons and open lines, rounded to a tenth', () => {
    expect(
      polygonPath([
        { x: 0.04, y: 1.26 },
        { x: 2, y: 3 },
      ]),
    ).toBe('M0 1.3L2 3Z');
    expect(linePath(sq.slice(0, 2))).toBe('M0 0L10 0');
  });

  it('pulls points toward the centroid or a given center', () => {
    const [p] = inset(sq, Math.SQRT2);
    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBeCloseTo(1);
    const [q] = inset([{ x: 0, y: 0 }], 2, { x: 0, y: 4 });
    expect(q).toEqual({ x: 0, y: 2 });
  });

  it('leaves a point that sits on the center where it is', () => {
    expect(inset([{ x: 3, y: 3 }], 2)).toEqual([{ x: 3, y: 3 }]);
  });
});

describe('BLOCK_SIZE', () => {
  it('holds every full block it lays out', async () => {
    const { BLOCK_SIZE } = await import('./layout');
    for (let b = 0; b < 40; b++) {
      const pts = blockPieces(b).flatMap((p) => p.corners);
      const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
      const h = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
      expect(Math.max(w, h)).toBeLessThanOrEqual(BLOCK_SIZE);
    }
  });
});
