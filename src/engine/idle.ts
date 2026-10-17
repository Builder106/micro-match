// The idle input: t in seconds; x and y in -0.5..0.5, lagged toward the pointer (touch
// devices get the slow clock only). Publishes numbers on the GSAP ticker and moves nothing itself.
import { gsap } from 'gsap';
import { isTouch } from './env';

export const idle = { t: 0, x: 0, y: 0 };
let started = false;

// Visual regression tests set this flag so screenshots of the quilt hold still.
function heldStill(): boolean {
  try {
    return localStorage.getItem('mm-still') === '1';
  } catch {
    return false;
  }
}

export function startIdle() {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (heldStill()) return;
  const touch = isTouch();
  const aim = { x: 0, y: 0 };
  if (!touch) addEventListener('pointermove', (e: PointerEvent) => { aim.x = e.clientX / innerWidth - 0.5; aim.y = e.clientY / innerHeight - 0.5; }, { passive: true });
  gsap.ticker.add((t) => {
    const r = gsap.ticker.deltaRatio();
    const k = 1 - Math.pow(0.95, r);
    idle.t = t;
    idle.x += (aim.x - idle.x) * k;
    idle.y += (aim.y - idle.y) * k;
  });
}
