import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';
import { paraglideOptions } from './scripts/paraglide-config.js';

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      // Pin the Vercel runtime so builds don't depend on the host Node version
      // detection (Bun's compat reports a Node version the adapter rejects).
      adapter: adapter({ runtime: 'nodejs24.x' }),
    }),
    paraglideVitePlugin(paraglideOptions),
  ],
  // Bundle the motion libraries into the server build. Left external, Vercel's Node runtime
  // loads gsap as CommonJS, which has no named exports, and every page fails to render.
  ssr: { noExternal: ['gsap', 'lenis'] },
});
