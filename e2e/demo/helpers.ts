import type { Locator, Page } from '@playwright/test';

// Tunable knobs (env-overridable per CLAUDE.md preferences).
export const DEMO_DWELL_MS = Number(process.env.DEMO_DWELL_MS ?? 1500);
export const DEMO_TYPE_DELAY = Number(process.env.DEMO_TYPE_DELAY ?? 70);
export const DEMO_TAIL_MS = Number(process.env.DEMO_TAIL_MS ?? 1500);
export const DEMO_ZOOM = Number(process.env.DEMO_ZOOM ?? 1.3);

const DEMO = process.env.DEMO === '1';

/**
 * Hold a frame after an assertion or navigation. slowMo only pauses *between*
 * Playwright actions — it doesn't cover page.goto(), and assertions resolve
 * the moment the element exists. Without dwellForDemo, modals and empty
 * states flash on screen before the eye can register them.
 */
export async function dwellForDemo(page: Page, ms = DEMO_DWELL_MS): Promise<void> {
  if (!DEMO) return;
  try { await page.waitForTimeout(ms); } catch { /* page closed */ }
}

/**
 * Inject a visible cursor dot + a counter-scaled zoom CSS into every page.
 * `addInitScript` re-runs on every navigation so this needs to be called once
 * per page (Playwright handles re-injection internally for init scripts).
 *
 * Pass `{ zoom: 1 }` for phone-viewport demos — the "filmed close" zoom is
 * there to make a 2560px-wide desktop page readable, and applying it to a
 * 390px layout just overflows it sideways.
 */
export async function setupDemoPage(page: Page, opts: { zoom?: number } = {}): Promise<void> {
  if (!DEMO) return;
  const zoomFactor = opts.zoom ?? DEMO_ZOOM;

  // Visible cursor — headless mode hides the system cursor, so the viewer
  // can't see where the test is "looking" without this.
  //
  // The dot lives inside the zoomed <html>, so its left/top are interpreted
  // in zoomed coordinates while MouseEvent clientX/Y arrive in unzoomed
  // viewport pixels. Without dividing by the zoom factor the dot renders
  // zoom× past the actual target (visibly off the button it "clicks").
  await page.addInitScript((zoom) => {
    const install = () => {
      if (document.getElementById('demo-cursor')) return;
      const dot = document.createElement('div');
      dot.id = 'demo-cursor';
      dot.style.cssText = [
        'position: fixed', 'top: -100px', 'left: -100px',
        'width: 28px', 'height: 28px',
        'background: rgba(255, 107, 107, 0.9)',
        'border: 4px solid white',
        'border-radius: 50%',
        'pointer-events: none',
        'z-index: 2147483647',
        'transform: translate(-50%, -50%)',
        'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35)',
        // left/top get a transition so the dot *glides* between action targets.
        // Playwright teleports the pointer to each target in a single hop, so
        // without this the dot jumps around the page between clicks.
        'transition: left 380ms cubic-bezier(0.22, 1, 0.36, 1), top 380ms cubic-bezier(0.22, 1, 0.36, 1), transform 120ms ease-out, background 120ms ease-out'
      ].join(';');
      document.body.appendChild(dot);

      // Tween toward each new pointer position instead of relying on a CSS
      // transition: a fixed-duration transition turns long hops into a dash,
      // while a distance-proportional tween keeps short moves snappy and
      // stretches big ones into a visible glide.
      let cx = -100;
      let cy = -100;
      let raf = 0;
      const render = () => {
        dot.style.left = cx + 'px';
        dot.style.top = cy + 'px';
      };
      window.addEventListener('mousemove', (e) => {
        const tx = e.clientX / zoom;
        const ty = e.clientY / zoom;
        const dist = Math.hypot(tx - cx, ty - cy);
        if (cx < 0 || dist < 24) {
          cancelAnimationFrame(raf);
          cx = tx; cy = ty; render();
          return;
        }
        const sx = cx;
        const sy = cy;
        const dur = Math.min(900, Math.max(260, dist * 0.9));
        const t0 = performance.now();
        cancelAnimationFrame(raf);
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          cx = sx + (tx - sx) * eased;
          cy = sy + (ty - sy) * eased;
          render();
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, { passive: true });
      window.addEventListener('mousedown', () => {
        dot.style.transform = 'translate(-50%, -50%) scale(0.7)';
        dot.style.background = 'rgba(232, 85, 85, 1)';
      });
      window.addEventListener('mouseup', () => {
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
        dot.style.background = 'rgba(255, 107, 107, 0.9)';
      });
    };
    if (document.body) install();
    else document.addEventListener('DOMContentLoaded', install);
  }, zoomFactor);

  // CSS zoom + counter-scale for "filmed close" feel without losing centered
  // content. zoom: 1.3 on <html> makes min-h-screen render at 130vh, so we
  // counter-scale by 1/zoom to keep the layout fitting the viewport.
  if (zoomFactor !== 1) {
    await page.addInitScript((zoom) => {
      const apply = () => {
        if (document.getElementById('demo-zoom')) return;
        const style = document.createElement('style');
        style.id = 'demo-zoom';
        style.textContent = `
          html { zoom: ${zoom}; }
          body, .min-h-screen { min-height: ${100 / zoom}vh !important; }
        `;
        document.head.appendChild(style);
      };
      if (document.head) apply();
      else document.addEventListener('DOMContentLoaded', apply);
    }, zoomFactor);
  }
}

/**
 * Type a value character-by-character so the form-fill animates in the
 * recorded video. Without this, slowMo only pauses *between* Playwright
 * actions — the field itself fills instantly.
 *
 * Use in demos instead of `.fill()`:
 *   await slowFill(page.getByPlaceholder('jane@example.com'), 'jane@example.com');
 *
 * (We can't patch Locator.prototype globally because @playwright/test only
 * exports Locator as a type, not a runtime class.)
 */
export async function slowFill(locator: Locator, value: string): Promise<void> {
  if (!DEMO) {
    await locator.fill(value);
    return;
  }
  await demoClick(locator);
  await locator.pressSequentially(value, { delay: DEMO_TYPE_DELAY });
}

/** No-op kept so existing `patchFillForDemo()` calls in demo specs still compile. */
export function patchFillForDemo(): void {
  /* see slowFill() — explicit helper replaces the prototype patch */
}

/**
 * Click with a visible glide. Playwright's click() moves the pointer to the
 * target in one hop, so the dot would otherwise sit parked through every
 * dwell and then dash at the last moment. Two separate actions fix that:
 * a mouse.move to the halfway point (starts the travel a slowMo-beat early),
 * then hover() (finishes the approach), then the click lands at rest.
 */
const lastPointer = new WeakMap<Page, { x: number; y: number }>();

export async function demoClick(locator: Locator): Promise<void> {
  if (DEMO) {
    const pg = locator.page();
    const box = await locator.boundingBox().catch(() => null);
    if (box) {
      const tx = box.x + box.width / 2;
      const ty = box.y + box.height / 2;
      const from = lastPointer.get(pg);
      if (from && Math.hypot(tx - from.x, ty - from.y) > 80) {
        await pg.mouse.move((from.x + tx) / 2, (from.y + ty) / 2);
      }
      lastPointer.set(pg, { x: tx, y: ty });
    }
    await locator.hover();
  }
  await locator.click();
}

// ───────────────────────────── Demo accounts ─────────────────────────────
// Seeded by `bun run seed` when SEED_DEMO_PASSWORD is set (see scripts/seed.ts).
// The NGO account has to be the one that owns the seeded tasks: the approval
// endpoint 403s unless the reviewer is the task's org.

export const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? '';
export const VOLUNTEER_EMAIL = process.env.SEED_VOLUNTEER_EMAIL ?? 'jane@example.com';
export const NGO_EMAIL = process.env.SEED_DEMO_EMAIL ?? 'demo@micromatch.app';
export const BADGE_LABEL = process.env.SEED_BADGE_LABEL ?? 'First Mission';

/**
 * Wait until the auth page has hydrated.
 *
 * AuthBrandPanel renders <dotlottie-player> only after onMount's dynamic import
 * resolves, so its presence in the DOM proves Svelte finished hydrating — it's
 * the last thing these pages render.
 *
 * This is load-bearing, not belt-and-braces: `on:submit={handleEmailSignIn}` is
 * what calls preventDefault(). Click "Sign in" before hydration attaches that
 * handler and the browser performs a *native GET*, which navigates to
 * /login?email=…&password=… — no sign-in, and the password lands in the URL.
 * It's easy to miss because slowMo normally pauses long enough to hide it.
 */
export async function waitForAuthHydration(page: Page): Promise<void> {
  await page.locator('dotlottie-player').first().waitFor({ state: 'attached', timeout: 20_000 });
}

/**
 * Sign in through the real login form (not a cookie shortcut) — the typing is
 * part of the demo. Waits on the dashboard heading rather than just the URL:
 * SvelteKit navigates before hydration finishes, and the dashboard's badge and
 * claim data is fetched client-side in onMount.
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await waitForAuthHydration(page);
  await dwellForDemo(page, 1200);
  await slowFill(page.getByLabel(/Email address/i), email);
  await slowFill(page.getByLabel(/Password/i), password);
  await demoClick(page.getByRole('button', { name: /Sign in/i }));
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' });
}

/** Sign out via the sidebar link. Lands back on the landing page. */
export async function signOut(page: Page): Promise<void> {
  await demoClick(page.getByRole('link', { name: /Sign out/i }));
  await page.waitForURL(/\/$/, { timeout: 30_000 });
}
