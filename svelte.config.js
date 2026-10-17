import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Pin the Vercel runtime so builds don't depend on the host Node version
    // detection (Bun's compat reports a Node version the adapter rejects).
    adapter: adapter({ runtime: 'nodejs24.x' }),
    alias: {
      $engine: 'src/engine',
      $styles: 'src/styles'
    }
  }
};

export default config;