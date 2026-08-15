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
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { caughtErrors: 'none', argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'no-useless-assignment': 'warn',
      'no-func-assign': 'warn',
      'no-unsafe-finally': 'warn',
      'no-redeclare': 'warn',
      'no-cond-assign': 'warn',
      'no-undef': 'warn',
      'no-case-declarations': 'warn',
      'no-useless-escape': 'warn',
      'no-prototype-builtins': 'warn',
      'no-unused-private-class-members': 'warn',
      'no-sparse-arrays': 'warn',
      'no-self-assign': 'warn',
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/no-immutable-reactive-statements': 'warn',
      'svelte/require-each-key': 'warn',
      'svelte/prefer-svelte-reactivity': 'warn',
      'svelte/no-unused-svelte-ignore': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'require-yield': 'warn',
      'no-irregular-whitespace': 'warn',
      'no-control-regex': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-async-promise-executor': 'warn',
      'getter-return': 'warn',
      'no-unassigned-vars': 'off',
      'preserve-caught-error': 'off'
    }
  },

  // Prettier last
  eslintConfigPrettier,
  ...svelte.configs['flat/prettier']
];
