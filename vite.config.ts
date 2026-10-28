import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';
import { paraglideOptions } from './scripts/paraglide-config.js';

export default defineConfig({
  plugins: [sveltekit(), paraglideVitePlugin(paraglideOptions)],
  // Bundle the motion libraries into the server build. Left external, Vercel's Node runtime
  // loads gsap as CommonJS, which has no named exports, and every page fails to render.
  ssr: { noExternal: ['gsap', 'lenis'] },
});
