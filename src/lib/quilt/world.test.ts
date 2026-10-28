import { describe, it, expect } from 'vitest';
import {
  BLOCKS,
  GRID,
  HOME_FOCUS,
  block,
  blockCenter,
  blockForPath,
  cameraFor,
  clampCamera,
  clothFill,
  focusForPath,
  panelKindForPath,
  phonePath,
  seams,
  toPixels,
  worldSize,
} from './world';

describe('seams', () => {
  const all = seams();
  it('quilts every block edge once and never through a block', () => {
    const grid = GRID.cols * (GRID.rows + 1) + GRID.rows * (GRID.cols + 1);
    const inside = BLOCKS.reduce((s, b) => s + (b.w - 1) * b.h + (b.h - 1) * b.w, 0);
    expect(all).toHaveLength(grid - inside);
    expect(new Set(all.map((s) => `${s.dir}${s.x},${s.y}`)).size).toBe(all.length);
    expect(all.some((s) => s.dir === 'v' && s.x === 2 && s.y === 1)).toBe(false);
  });
  it('runs outward from the home focus', () => {
    const left = all.find((s) => s.dir === 'h' && s.x === 0 && s.y === 0)!;
    const right = all.find((s) => s.dir === 'h' && s.x === 4 && s.y === 0)!;
    expect([left.reverse, right.reverse]).toEqual([true, false]);
    expect(Math.min(...all.map((s) => s.dist))).toBeLessThan(1);
  });
});

describe('the quilt map', () => {
  it('tiles the grid exactly once', () => {
    const cells = new Set<string>();
    BLOCKS.forEach((b) => {
      for (let c = b.col; c < b.col + b.w; c++)
        for (let r = b.row; r < b.row + b.h; r++) cells.add(`${c},${r}`);
    });
    expect(cells.size).toBe(GRID.cols * GRID.rows);
    expect(BLOCKS.reduce((s, b) => s + b.w * b.h, 0)).toBe(GRID.cols * GRID.rows);
  });
  it('has a phone order that starts with the title and community blocks', () => {
    expect(
      phonePath()
        .slice(0, 3)
        .map((b) => b.id),
    ).toEqual(['title', 'community', 'tasks']);
    expect(block('tasks').w).toBe(2);
  });
});

describe('blockForPath', () => {
  it.each([
    ['/en', null],
    ['/en/contents', null],
    ['/en/tasks', 'tasks'],
    ['/en/task/abc/claim', 'tasks'],
    ['/en/dashboard', 'account'],
    ['/en/badges/manage', 'account'],
    ['/en/login', 'account'],
    ['/en/privacy', 'label'],
    ['/en/impact', 'community'],
    ['/en/docs/api', 'api'],
    ['/en/docs', 'docs'],
    ['/en/how-it-works', 'how'],
    ['/en/about/', 'about'],
    ['/en/nope', null],
  ])('%s opens %s', (path, id) => expect(blockForPath(path)).toBe(id));
});

describe('panelKindForPath', () => {
  it('opens no panel at home, and narrow, work or read panels elsewhere', () => {
    expect(panelKindForPath('/en')).toBeNull();
    expect(panelKindForPath('/en/signup')).toBe('narrow');
    expect(panelKindForPath('/en/tasks')).toBe('work');
    expect(panelKindForPath('/en/admin/verifications')).toBe('work');
    expect(panelKindForPath('/en/help')).toBe('read');
    expect(panelKindForPath('/en/missing')).toBe('read');
  });
});

describe('camera math', () => {
  const m = { cell: 300, sash: 20 };
  it('converts pitch units to pixels', () => {
    expect(toPixels({ x: 0, y: 0 }, m)).toEqual({ x: 10, y: 10 });
    expect(toPixels(blockCenter(block('how')), m)).toEqual({
      x: 10 + 3.5 * 320,
      y: 10 + 0.5 * 320,
    });
    expect(worldSize(m)).toEqual({ w: 5 * 320 + 20, h: 4 * 320 + 20 });
  });
  it('focuses the home center or the route block', () => {
    expect(focusForPath('/en')).toEqual(HOME_FOCUS);
    expect(focusForPath('/en/impact')).toEqual({ x: 4, y: 2 });
  });
  it('centers the focus, leaving room for a panel', () => {
    expect(cameraFor({ x: 500, y: 400 }, { w: 1000, h: 800 })).toEqual({ x: 0, y: 0 });
    expect(cameraFor({ x: 500, y: 400 }, { w: 1000, h: 800 }, 400)).toEqual({ x: -200, y: 0 });
  });
  it('keeps the quilt within its slack, and centers a quilt smaller than the view', () => {
    const view = { w: 1000, h: 800 };
    const world = { w: 2000, h: 1600 };
    expect(clampCamera({ x: 500, y: -5000 }, view, world, 100)).toEqual({ x: 100, y: -900 });
    expect(clampCamera({ x: -300, y: -300 }, view, world, 100)).toEqual({ x: -300, y: -300 });
    expect(clampCamera({ x: 0, y: 0 }, { w: 3000, h: 800 }, world, 100)).toEqual({ x: 500, y: 0 });
  });
});

describe('clothFill', () => {
  it('lets muslin and indigo follow the color scheme and keeps every other dye', () => {
    expect(clothFill('#FBF3EA')).toBe('var(--cloth-muslin)');
    expect(clothFill('#1C1F3B')).toBe('var(--cloth-indigo)');
    expect(clothFill('#FF6B6B')).toBe('#FF6B6B');
  });
});
