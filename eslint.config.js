import eslintJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default tseslint.config(
  // Base recommended configurations
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,

  // Configuration for TypeScript files WITHIN src/
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-unknown': 'off',
    },
  },

  // Global settings (applies to all files unless overridden)
  {
    languageOptions: {
      globals: {
        browser: true,
        es2021: true,
        node: true,
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
  eslintConfigPrettier
);
