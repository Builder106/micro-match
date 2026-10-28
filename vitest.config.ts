import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '$env/dynamic/private': 'node:process',
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      $engine: fileURLToPath(new URL('./src/engine', import.meta.url)),
    },
  },
  test: {
    fileParallelism: false,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,js}'],
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts', 'src/routes/**/*.server.ts', 'src/routes/**/+server.ts'],
      exclude: [
        'src/lib/**/*.d.ts',
        'src/lib/types.ts',
        'src/lib/**/index.ts',
        'src/routes/**/*.d.ts',
        'src/lib/paraglide/**',
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
