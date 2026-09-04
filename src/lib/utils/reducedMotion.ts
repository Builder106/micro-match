import { browser } from '$app/environment';
import { readable } from 'svelte/store';

export function createReducedMotion() {
  return readable(false, (set) => {
  if (!browser || typeof window.matchMedia !== 'function') return;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => set(mediaQuery.matches);
  update();
  mediaQuery.addEventListener('change', update);

  return () => mediaQuery.removeEventListener('change', update);
  });
}

export const reducedMotion = createReducedMotion();
