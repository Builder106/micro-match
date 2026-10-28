// Smooth scrolling inside a reading panel, on the GSAP ticker. App panels scroll natively,
// and so does every panel with a reduced-motion preference.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { prefersStill } from './env';

let lenis: Lenis | null = null;
const raf = (time: number) => lenis?.raf(time * 1000);

export function smoothPanel(wrapper: HTMLElement, content: HTMLElement) {
  stopSmoothPanel();
  if (prefersStill()) return;
  lenis = new Lenis({
    wrapper,
    content,
    lerp: 0.12,
    wheelMultiplier: 1,
    touchMultiplier: 1.2,
    anchors: true,
  });
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
}

export function stopSmoothPanel() {
  if (!lenis) return;
  gsap.ticker.remove(raf);
  lenis.destroy();
  lenis = null;
}

export function resetPanelScroll(wrapper: HTMLElement) {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else wrapper.scrollTop = 0;
}
