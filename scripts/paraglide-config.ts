import type { CompilerOptions } from '@inlang/paraglide-js';

export const paraglideOptions = {
  project: './project.inlang',
  outdir: './src/lib/paraglide',
  emitTsDeclarations: true,
  strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
  urlPatterns: [
    {
      pattern: '/',
      localized: [
        ['en', '/en'],
        ['es', '/es'],
        ['fr', '/fr'],
        ['de', '/de'],
        ['pt', '/pt'],
        ['zh', '/zh'],
        ['ar', '/ar']
      ]
    },
    {
      pattern: '/:path(.*)?',
      localized: [
        ['en', '/en/:path(.*)?'],
        ['es', '/es/:path(.*)?'],
        ['fr', '/fr/:path(.*)?'],
        ['de', '/de/:path(.*)?'],
        ['pt', '/pt/:path(.*)?'],
        ['zh', '/zh/:path(.*)?'],
        ['ar', '/ar/:path(.*)?']
      ]
    }
  ]
} satisfies CompilerOptions;
