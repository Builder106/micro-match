export const isTouch = () => matchMedia('(hover: none), (pointer: coarse)').matches;
export const isMobile = () => matchMedia('(max-width: 767px)').matches;
export const prefersStill = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Shared easing vocabulary. Use these names everywhere; never invent per-component curves.
export const ease = {
  out: 'expo.out', // settles: cloth laid down
  inOut: 'power2.inOut', // stitches and the curtain
  soft: 'power3.out', // small UI
  spring: 'back.out(1.6)', // a press that pops back, used rarely
} as const;
