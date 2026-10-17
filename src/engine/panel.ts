// A block lifting off the quilt and unfolding into a panel of cloth, and folding back.
// The panel's face carries the block's pattern during the flight, so what flies is the block.
import { gsap } from 'gsap';
import { ease } from './env';

type Rect = { left: number; top: number; width: number; height: number };

function flight(panel: HTMLElement, from: Rect) {
  const to = panel.getBoundingClientRect();
  return {
    x: from.left - to.left,
    y: from.top - to.top,
    scaleX: from.width / to.width,
    scaleY: from.height / to.height
  };
}

const parts = (panel: HTMLElement) => ({
  face: panel.querySelector<HTMLElement>('[data-panel-face]'),
  body: panel.querySelector<HTMLElement>('[data-panel-body]')
});

/** Unfold the panel from the block's rectangle on screen. */
export function unfold(panel: HTMLElement, from: Rect | null): Promise<unknown> {
  const { face, body } = parts(panel);
  gsap.killTweensOf([panel, face, body]);
  if (!from) {
    return Promise.resolve(
      gsap.timeline().fromTo(panel, { y: 24, rotation: 0.8 }, { y: 0, rotation: 0, duration: 0.7, ease: ease.out, clearProps: 'transform' })
    );
  }
  const f = flight(panel, from);
  const tl = gsap
    .timeline()
    .set(panel, { transformOrigin: '0 0', ...f, rotation: -1.5 })
    .set(face, { autoAlpha: 1 })
    .set(body, { autoAlpha: 0, y: 18 })
    .to(panel, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 0.82, ease: ease.out, clearProps: 'transform' })
    .to(face, { autoAlpha: 0, duration: 0.35, ease: 'power1.out' }, 0.32)
    .to(body, { autoAlpha: 1, y: 0, duration: 0.6, ease: ease.out, clearProps: 'transform,opacity,visibility' }, 0.42);
  return Promise.resolve(tl);
}

/** Fold the panel back into the block's hole. */
export function fold(panel: HTMLElement, to: Rect | null): Promise<unknown> {
  const { face, body } = parts(panel);
  gsap.killTweensOf([panel, face, body]);
  if (!to) return Promise.resolve(gsap.to(panel, { y: 30, autoAlpha: 0, duration: 0.35, ease: ease.inOut }));
  const f = flight(panel, to);
  return Promise.resolve(
    gsap
      .timeline()
      .to(body, { autoAlpha: 0, duration: 0.18 })
      .to(face, { autoAlpha: 1, duration: 0.25 }, 0.05)
      .to(panel, { transformOrigin: '0 0', ...f, rotation: 1.2, duration: 0.62, ease: ease.inOut }, 0.08)
  );
}

/** Between two panels: the old content lifts away... */
export function contentOut(panel: HTMLElement): Promise<unknown> {
  const { body } = parts(panel);
  if (!body) return Promise.resolve();
  return Promise.resolve(gsap.to(body, { autoAlpha: 0, y: -10, duration: 0.22, ease: ease.soft }));
}

/** ...and the new content settles in. */
export function contentIn(panel: HTMLElement): Promise<unknown> {
  const { body } = parts(panel);
  if (!body) return Promise.resolve();
  return Promise.resolve(
    gsap.fromTo(body, { autoAlpha: 0, y: 16, rotation: -0.4 }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.6, ease: ease.out, clearProps: 'all' })
  );
}
