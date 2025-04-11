// eslint.config.js
import { configs as jsConfigs } from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { configs as prettierConfigs } from 'eslint-config-prettier';

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // 1. Base JS recommended rules
  ...jsConfigs.recommended,

  // 2. Base TS plugin recommended rules
  ...tsPlugin.configs.recommended,

  // 3. Override for your src/**/*.ts(x) files (type‑aware rules)
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // example: turn off this one if you really don’t want it
      '@typescript-eslint/no-explicit-unknown': 'off',

      // make sure you have some warnings enabled:
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      // …add any other rules you care about at “warn” level
    },
  },

  // 4. Global environment settings
  {
    languageOptions: {
      globals: {
        browser: 'readonly',
        node: 'readonly',
        es2021: 'readonly',
      },
    },
  },

  // Ignores configuration
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '.*cache',
      '.venv/',
      'report/',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.cjs',
      '**/*.config.ts',
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/generated/**',
    ],
  },

  // Prettier configuration (must be last)
  prettierConfigs.recommended,
];
