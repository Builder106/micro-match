import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignores
  { ignores: ['**/node_modules/**', 'build/**', 'dist/**', '.svelte-kit/**', '.vercel/**', 'coverage/**', 'src/types/**/*.d.ts', '**/*.min.js', '**/*.min.ts', 'trailer/**', 'ui-demo/**'] },

  // Core JS/TS configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Browser + Node globals for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        RequestInfo: 'readonly',
        RequestInit: 'readonly',
        ResponseInit: 'readonly'
      }
    }
  },

  // Svelte support
  ...svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest'
      }
    }
  },

  // Project-wide rule tweaks
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none', argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      'no-useless-assignment': 'error',
      'no-func-assign': 'error',
      'no-unsafe-finally': 'error',
      'no-redeclare': 'error',
      'no-cond-assign': 'error',
      'no-undef': 'error',
      'no-case-declarations': 'error',
      'no-useless-escape': 'error',
      'no-prototype-builtins': 'error',
      'no-unused-private-class-members': 'error',
      'no-sparse-arrays': 'error',
      'no-self-assign': 'error',
      'svelte/no-navigation-without-resolve': 'error',
      'svelte/no-immutable-reactive-statements': 'error',
      'svelte/require-each-key': 'error',
      'svelte/prefer-svelte-reactivity': 'error',
      'svelte/no-unused-svelte-ignore': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'require-yield': 'error',
      'no-irregular-whitespace': 'error',
      'no-control-regex': 'error',
      'no-constant-binary-expression': 'error',
      'no-async-promise-executor': 'error',
      'getter-return': 'error',
      'no-unassigned-vars': 'error',
      'preserve-caught-error': 'error'
    }
  },

  // Prettier last
  eslintConfigPrettier,
  ...svelte.configs['flat/prettier']
];
