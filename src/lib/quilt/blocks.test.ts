import { describe, it, expect } from 'vitest';
import { patternPieces, piecePath, sawtoothBorder, type PatternName } from './blocks';

const area = (pts: [number, number][]) =>
  Math.abs(
    pts.reduce((s, [x, y], i) => {
      const [nx, ny] = pts[(i + 1) % pts.length];
      return s + x * ny - nx * y;
    }, 0),
  ) / 2;
const names: PatternName[] = [
  'ninePatch',
  'railFence',
  'pinwheel',
  'geese',
  'churnDash',
  'friendshipStar',
  'ohioStar',
  'courthouse',
  'hourglass',
  'triangles',
];

describe('patternPieces', () => {
  it.each(names)('%s pieces cover its cell exactly once', (name) => {
    const pieces = patternPieces(name);
    const total = pieces.reduce((s, p) => s + area(p.points), 0);
    expect(total).toBeCloseTo(name === 'geese' ? 100 * 100 : 100 * 100, 0);
    expect(pieces.every((p) => [0, 1, 2].includes(p.fabric))).toBe(true);
  });

  it('runs flying geese across a wide block and repeats other patterns per cell', () => {
    const wide = patternPieces('geese', 2, 1);
    expect(wide.reduce((s, p) => s + area(p.points), 0)).toBeCloseTo(200 * 100, 0);
    const tall = patternPieces('geese', 1, 2);
    expect(tall.reduce((s, p) => s + area(p.points), 0)).toBeCloseTo(100 * 200, 0);
    const twoByOne = patternPieces('ninePatch', 2, 1);
    expect(twoByOne).toHaveLength(18);
    expect(Math.max(...twoByOne.flatMap((p) => p.points.map(([x]) => x)))).toBe(200);
  });
});

describe('sawtoothBorder', () => {
  it('frames a block with triangles in two fabrics against the light one', () => {
    const border = sawtoothBorder(200, 200, 12.5);
    expect(new Set(border.map((p) => p.fabric))).toEqual(new Set([0, 1, 2]));
    const xs = border.flatMap((p) => p.points.map(([x]) => x));
    expect(Math.min(...xs)).toBe(0);
    expect(Math.max(...xs)).toBe(200);
  });
  it('always places at least one triangle per side', () => {
    expect(sawtoothBorder(10, 30, 20).length).toBeGreaterThan(0);
  });
});

describe('piecePath', () => {
  it('rounds to hundredths and closes the shape', () => {
    expect(
      piecePath({
        points: [
          [0, 0],
          [33.3333, 0],
          [0, 1],
        ],
        fabric: 0,
      }),
    ).toBe('M0 0L33.33 0L0 1Z');
  });
});
