# Root Directory Organization

## Overview

This document describes the reorganized root directory structure implemented to improve maintainability, reduce cognitive load, and establish clear organizational patterns.

## New Directory Structure

```plaintext
root/
├── config/                     # Configuration files organized by category
│   ├── build/                  # Build-related configurations
│   │   ├── .prettierrc.json    # Prettier formatting configuration
│   │   └── postcss.config.js   # PostCSS configuration
│   ├── testing/                # Testing configurations
│   │   ├── jest.config.js      # Jest test configuration
│   │   └── jest-setup.js       # Jest setup file
│   └── linting/                # Linting configurations
│       └── eslint_baseline.txt # ESLint baseline file
├── docs/                       # All documentation
├── reports/                    # Generated reports and logs
│   ├── ERRORS.json             # Error reports
│   ├── WARNINGS.json           # Warning reports
│   └── test-prettier.js        # Prettier test reports
├── assets/                     # Static assets
└── [essential files remain in root]
```

## Essential Files Remaining in Root

The following files remain in the root directory for tool compatibility and convention:

- `package.json` - NPM configuration and scripts
- `package-lock.json` - NPM lock file
- `index.html` - Vite entry point
- `vite.config.ts` - Build tool configuration
- `eslint.config.js` - ESLint configuration
- `tsconfig*.json` - TypeScript configuration files
- `playwright.config.ts` - E2E test configuration
- `vitest.config.ts` - Unit test configuration
- `tailwind.config.js` - CSS framework configuration
- `.gitignore` - Git exclusion rules
- `README.md` - Project documentation

## Configuration File References

### Updated Package.json Scripts

The following npm scripts have been updated to reference the new configuration file locations:

```json
{
  "scripts": {
    "format": "prettier --config config/build/.prettierrc.json --write \"src/**/*.{ts,tsx,js,jsx,json,css,scss}\"",
    "format:check": "prettier --config config/build/.prettierrc.json --check \"src/**/*.{ts,tsx,js,jsx,json,css,scss}\""
  }
}
```

### Vite Configuration

The Vite configuration has been updated to reference the PostCSS config in the new location:

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    devSourcemap: true,
    postcss: './config/build/postcss.config.js',
  },
});
```

## Benefits of the New Structure

1. **Reduced Root Directory Clutter**: From 32+ files to ~15 essential files
2. **Logical Organization**: Configuration files grouped by purpose
3. **Clear Separation**: Build artifacts, documentation, and configuration are clearly separated
4. **Improved Navigation**: Developers can quickly locate files by category
5. **Maintained Compatibility**: All existing tools continue to work without modification

## Migration Impact

### What Changed

- Configuration files moved to `config/` subdirectories
- Reports moved to `reports/` directory
- Documentation consolidated in `docs/` directory
- Asset directory moved to root level

### What Remained the Same

- All essential development tools continue to work
- Build processes remain unchanged
- Development server functionality preserved
- All npm scripts continue to function

## Validation

The reorganization has been validated through comprehensive integration tests that verify:

- Build system functionality
- Development server startup
- Linting and formatting tools
- Testing framework operation
- Configuration file accessibility
- Asset serving capabilities

## Future Maintenance

When adding new configuration files:

1. **Build-related configs** → `config/build/`
2. **Testing configs** → `config/testing/`
3. **Linting configs** → `config/linting/`
4. **Generated reports** → `reports/`
5. **Documentation** → `docs/`

## Troubleshooting

If you encounter issues after the reorganization:

1. Verify configuration file paths in npm scripts
2. Check that tools can find their configuration files
3. Ensure relative paths are updated in moved configuration files
4. Validate that the development server can serve assets correctly

For any issues, refer to the integration tests in `src/tests/integration/` for examples of expected behavior.
