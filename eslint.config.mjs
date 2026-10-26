import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const UI_PACKAGES = ['react', 'react-dom', 'three', '@react-three/*', 'next', 'next/*', 'next-*'];

function restrictImports(patterns, message) {
  return { 'no-restricted-imports': ['error', { patterns: [{ group: patterns, message }] }] };
}

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      complexity: ['error', 12],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.test.ts', 'tests/**'],
    rules: { 'max-lines': 'off' },
  },
  {
    files: ['src/physics/**', 'src/data/**', 'src/constants/**'],
    rules: restrictImports(
      [...UI_PACKAGES, '@/server/*', '@/features/*', '@/components/*', '@/visualization/*'],
      'Domain modules must stay framework-free.',
    ),
  },
  {
    files: ['src/server/**'],
    rules: restrictImports(
      ['react', '@/features/*', '@/components/*', '@/visualization/*'],
      'Server modules must not depend on UI code.',
    ),
  },
  {
    files: ['src/features/**', 'src/components/**', 'src/visualization/**'],
    rules: restrictImports(['@/server/*'], 'UI code must call the server through API routes.'),
  },
  // A later block replaces the rule for matching files, so each feature repeats the server ban.
  {
    files: ['src/features/learning/**'],
    rules: restrictImports(
      ['@/server/*', '@/features/orbits/*'],
      'Features must not import server code or each other.',
    ),
  },
  {
    files: ['src/features/orbits/**'],
    rules: restrictImports(
      ['@/server/*', '@/features/learning/*'],
      'Features must not import server code or each other.',
    ),
  },
  globalIgnores([
    '.next/**',
    'next-env.d.ts',
    'public/orbits/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
