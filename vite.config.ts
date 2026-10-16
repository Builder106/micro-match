import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';
import { paraglideOptions } from './scripts/paraglide-config.js';

export default defineConfig({
  plugins: [
    sveltekit(),
    paraglideVitePlugin(paraglideOptions)
  ],
  test: {
    fileParallelism: false,
    // Coverage applies across all projects
    coverage: {
      reporter: ['text', 'html'],
      include: [
        'src/lib/**/*.ts',
        'src/routes/**/*.server.ts',
        'src/routes/**/+server.ts'
      ],
      exclude: [
        'src/lib/**/*.d.ts',
        'src/lib/types.ts',
        'src/lib/**/index.ts',
        'src/routes/**/*.d.ts',
        'src/lib/paraglide/**'
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100
      }
    },
    // Server logic and loaders run in node. Component tests return with the new frontend.
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{ts,js}'],
          setupFiles: ['./src/tests/setup.ts']
        }
      }
    ]
  }
});
