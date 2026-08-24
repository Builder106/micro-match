import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
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
        'src/routes/**/*.d.ts'
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100
      }
    },
    // Two projects so server logic and Svelte components can each get the
    // module resolution they need:
    //   - "server"     : node + default conditions for /api/* and lib/server/*
    //   - "components" : jsdom + browser conditions so Svelte resolves to its
    //                    client entry (otherwise mount() throws "not available
    //                    on the server" because Svelte 5 ships separate
    //                    server/client entries via export conditions).
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{ts,js}'],
          exclude: ['src/tests/components/**'],
          setupFiles: ['./src/tests/setup.ts']
        }
      },
      {
        extends: true,
        resolve: { conditions: ['browser'] },
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/tests/components/**/*.{test,spec}.{ts,js}'],
          setupFiles: ['./src/tests/setup.ts']
        }
      }
    ]
  }
});
