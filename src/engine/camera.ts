// The camera over the quilt (desktop only). One transform on one wrapper, eased toward a
// target on the GSAP ticker. Drag, wheel, arrow keys and keyboard focus all set the target.
// The page itself never scrolls on desktop, so nothing here fights native scrolling.
import { gsap } from 'gsap';
import { clampCamera, cameraFor, worldSize, type Metrics, type Point } from '$lib/quilt/world';
import { idle } from './idle';

export type Camera = {
  /** Look at a point on the quilt (pixels), leaving `panelWidth` on the right for a panel. */
  lookAt: (focus: Point, panelWidth?: number, immediate?: boolean) => void;
  /** Pan by a screen delta, as a drag or a wheel does. */
  nudge: (dx: number, dy: number) => void;
  position: () => Point;
  metrics: () => Metrics;
  destroy: () => void;
};

const SLACK = 140;
const KEY_STEP = 140;

// Custom properties come back unresolved (a clamp() string), so read the resolved grid instead.
function readMetrics(world: HTMLElement): Metrics {
  const css = getComputedStyle(world);
  return { cell: parseFloat(css.gridTemplateColumns), sash: parseFloat(css.columnGap) };
}

function readTranslate(el: HTMLElement): Point {
  const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  return { x: m.m41, y: m.m42 };
}

export function createCamera(viewport: HTMLElement, world: HTMLElement): Camera {
  let metrics = readMetrics(world);
  const cur = readTranslate(world);
  const target = { ...cur };
  let panel = 0;
  gsap.set(world, { x: cur.x, y: cur.y, force3D: true });

  const view = () => ({ w: viewport.clientWidth, h: viewport.clientHeight });
  const clamp = () => {
    const c = clampCamera(target, { w: view().w - panel, h: view().h }, worldSize(metrics), SLACK);
    target.x = c.x;
    target.y = c.y;
  };

  let shown = { x: NaN, y: NaN };
  const tick = () => {
    const k = 1 - Math.pow(0.86, gsap.ticker.deltaRatio());
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    // Idle: the quilt hangs a few pixels toward the pointer, like cloth on a frame.
    const x = Math.round((cur.x + idle.x * -10) * 4) / 4;
    const y = Math.round((cur.y + idle.y * -8 + Math.sin(idle.t * 0.6) * 1.5) * 4) / 4;
    if (x === shown.x && y === shown.y) return;
    shown = { x, y };
    gsap.set(world, { x, y });
  };
  gsap.ticker.add(tick);

  // Drag to pan. A drag of more than a few pixels swallows the click that follows it.
  let drag: { x: number; y: number; tx: number; ty: number; moved: boolean } | null = null;
  const down = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('input, textarea, select, [data-no-drag]')) return;
    drag = { x: e.clientX, y: e.clientY, tx: target.x, ty: target.y, moved: false };
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 6) {
      drag.moved = true;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(e.pointerId);
    }
    if (!drag.moved) return;
    target.x = drag.tx + dx;
    target.y = drag.ty + dy;
    clamp();
  };
  const up = (e: PointerEvent) => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    if (moved) {
      const swallow = (c: Event) => {
        c.preventDefault();
        c.stopPropagation();
      };
      viewport.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => viewport.removeEventListener('click', swallow, { capture: true }), 0);
    }
  };

  // The wheel and trackpad pan the quilt (the page has nothing else to scroll on desktop).
  const wheel = (e: WheelEvent) => {
    if ((e.target as HTMLElement).closest('[data-panel]')) return;
    e.preventDefault();
    const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
    const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
    nudge(-dx, -dy);
  };

  const key = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable], [data-panel]')) return;
    const step = { ArrowLeft: [KEY_STEP, 0], ArrowRight: [-KEY_STEP, 0], ArrowUp: [0, KEY_STEP], ArrowDown: [0, -KEY_STEP] }[e.key];
    if (!step) return;
    e.preventDefault();
    nudge(step[0], step[1]);
  };

  // Keyboard focus moving to a block brings that block into view.
  const focus = (e: FocusEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-block]');
    if (!el || !(e.target as HTMLElement).matches(':focus-visible')) return;
    const r = el.getBoundingClientRect();
    const v = view();
    const visible = r.left >= 0 && r.right <= v.w - panel && r.top >= 0 && r.bottom <= v.h;
    if (visible) return;
    target.x += (v.w - panel) / 2 - (r.left + r.width / 2);
    target.y += v.h / 2 - (r.top + r.height / 2);
    clamp();
  };

  const resize = () => {
    metrics = readMetrics(world);
    clamp();
  };

  function nudge(dx: number, dy: number) {
    target.x += dx;
    target.y += dy;
    clamp();
  }

  viewport.addEventListener('pointerdown', down);
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  viewport.addEventListener('wheel', wheel, { passive: false });
  addEventListener('keydown', key);
  world.addEventListener('focusin', focus);
  addEventListener('resize', resize);

  return {
    lookAt(focusPoint, panelWidth = 0, immediate = false) {
      panel = panelWidth;
      const c = cameraFor(focusPoint, view(), panelWidth);
      target.x = c.x;
      target.y = c.y;
      clamp();
      if (immediate) {
        cur.x = target.x;
        cur.y = target.y;
      }
    },
    nudge,
    position: () => ({ ...cur }),
    metrics: () => metrics,
    destroy() {
      gsap.ticker.remove(tick);
      viewport.removeEventListener('pointerdown', down);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      viewport.removeEventListener('wheel', wheel);
      removeEventListener('keydown', key);
      world.removeEventListener('focusin', focus);
      removeEventListener('resize', resize);
      gsap.set(world, { clearProps: 'transform' });
      world.style.transform = '';
    }
  };
}
