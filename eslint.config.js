import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import prettier from 'eslint-config-prettier';

/**
 * Screaming (feature-based) architecture boundaries.
 * Each feature is a top-level folder under `src/`; ESLint enforces which
 * features may import which, and keeps `three` at the edge (black-hole only),
 * so the pure physics/camera/settings/i18n code stays framework-free.
 */
export default tseslint.config(
  { ignores: ['dist', 'coverage', '**/*.d.ts'] },

  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'shared', pattern: 'src/shared/**' },
        { type: 'i18n', pattern: 'src/i18n/**' },
        { type: 'camera', pattern: 'src/camera/**' },
        { type: 'black-hole', pattern: 'src/black-hole/**' },
        { type: 'controls', pattern: 'src/controls/**' },
        { type: 'main', pattern: 'src/main.ts', mode: 'file' },
      ],
    },
    rules: {
      'boundaries/no-unknown': 'error',
      'boundaries/no-unknown-files': 'error',
      // Feature dependencies flow one way; `shared` and `i18n` are leaves.
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'shared', allow: ['shared'] },
            { from: 'i18n', allow: ['i18n'] },
            { from: 'camera', allow: ['camera', 'shared'] },
            { from: 'black-hole', allow: ['black-hole', 'camera', 'shared'] },
            { from: 'controls', allow: ['controls', 'black-hole', 'camera', 'i18n', 'shared'] },
            {
              from: 'main',
              allow: ['main', 'black-hole', 'camera', 'controls', 'i18n', 'shared'],
            },
          ],
        },
      ],
      // Frameworks stay at the edge: only the black-hole feature may touch three.js.
      'boundaries/external': [
        'error',
        {
          default: 'allow',
          rules: [{ from: ['shared', 'camera', 'controls', 'i18n', 'main'], disallow: ['three'] }],
        },
      ],
    },
  },

  {
    files: ['**/*.test.ts'],
    rules: {
      'boundaries/element-types': 'off',
      'boundaries/no-unknown-files': 'off',
    },
  },

  prettier,
);
