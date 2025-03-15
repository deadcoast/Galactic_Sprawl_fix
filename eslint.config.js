import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

// Import the custom rule
let noStringResourceTypes;
try {
  const ruleModule = await import('./src/eslint-rules/no-string-resource-types.js');
  noStringResourceTypes = ruleModule.default;
} catch {
  // If the rule can't be loaded, use an empty object
  noStringResourceTypes = {};
}

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '.git/**', '.venv/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'galactic-sprawl': {
        rules: {
          'no-string-resource-types': noStringResourceTypes,
        },
      },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'galactic-sprawl/no-string-resource-types': 'warn',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['tools/**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  }
);
