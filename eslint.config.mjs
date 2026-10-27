import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const UI_PACKAGES = ['react', 'react-dom', 'three', '@react-three/*', 'next', 'next/*', 'next-*'];

const FEATURES = ['home', 'learning', 'orbits', 'tutor'];
// The tutor panel is embedded by other features, so only the rest are off limits.
const ISOLATED_FEATURES = ['home', 'learning', 'orbits'];

// Only the pure `model` folder of a feature is shared with the server and other features.
function otherFeatures(current) {
  return ISOLATED_FEATURES.filter((feature) => feature !== current).flatMap((feature) => [
    `@/features/${feature}/*`,
    `!@/features/${feature}/model`,
    `!@/features/${feature}/model/*`,
  ]);
}

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
    files: ['src/physics/**', 'src/features/*/model/**', 'src/shared/constants/**'],
    rules: restrictImports(
      [...UI_PACKAGES, '@/server/*', '@/shared/ui/*', '@/shared/three/*', ...otherFeatures()],
      'Domain modules must stay framework-free.',
    ),
  },
  {
    files: ['src/server/**'],
    rules: restrictImports(
      ['react', '@/shared/ui/*', '@/shared/three/*', ...otherFeatures()],
      'Server modules must not depend on UI code.',
    ),
  },
  {
    files: ['src/shared/ui/**', 'src/shared/three/**'],
    rules: restrictImports(
      ['@/server/*', '@/features/*'],
      'Shared components must not depend on server code or on a feature.',
    ),
  },
  // A later block replaces the rule for matching files, so each feature repeats the server ban.
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**`],
    rules: restrictImports(
      ['@/server/*', ...otherFeatures(feature)],
      'Features must not import server code or the UI of another feature.',
    ),
  })),
  globalIgnores([
    '.next/**',
    'next-env.d.ts',
    'public/orbits/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
