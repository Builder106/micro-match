// The idle input: t in seconds; x and y in -0.5..0.5, lagged toward the pointer (touch
// devices get the slow clock only). Publishes numbers on the GSAP ticker and moves nothing itself.
// The clock runs only while someone is using the page: five seconds after the last input it
// slows to a stop, so the quilt's ambient motion never runs on unattended (WCAG 2.2.2). With a
// reduced-motion preference it never starts.
import { gsap } from 'gsap';
import { isTouch, prefersStill } from './env';

export const idle = { t: 0, x: 0, y: 0 };
let started = false;

const REST_AFTER = 5;

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
  if (heldStill() || prefersStill()) return;
  const touch = isTouch();
  const aim = { x: 0, y: 0 };
  let lastInput = 0;
  let speed = 1;
  const wake = () => (lastInput = gsap.ticker.time);
  if (!touch)
    addEventListener(
      'pointermove',
      (e: PointerEvent) => {
        aim.x = e.clientX / innerWidth - 0.5;
        aim.y = e.clientY / innerHeight - 0.5;
        wake();
      },
      { passive: true },
    );
  for (const type of ['pointerdown', 'keydown', 'wheel', 'scroll'] as const)
    addEventListener(type, wake, { passive: true, capture: true });
  gsap.ticker.add((time, deltaMs) => {
    const r = gsap.ticker.deltaRatio();
    speed += ((time - lastInput < REST_AFTER ? 1 : 0) - speed) * (1 - Math.pow(0.9, r));
    idle.t += (deltaMs / 1000) * speed;
    const k = 1 - Math.pow(0.95, r);
    idle.x += (aim.x - idle.x) * k;
    idle.y += (aim.y - idle.y) * k;
  });
}
