---
BUILD CONFIGURATION REFERENCES
---

# Build Configuration

## TypeScript Configuration

- Main configuration: tsconfig.json
  - Target: ES2020
  - Module: ESNext
  - Strict mode enabled
  - downlevelIteration enabled for proper Map/Set iteration
  - esModuleInterop enabled for better module compatibility
- Type checking configuration: tsconfig.check.json
  - Extends main configuration
  - Target: ES2015
  - Excludes problematic test files
- NPM Scripts:
  - type-check: Runs TypeScript compiler with downlevelIteration flag
  - type-check:downlevel: Uses tsconfig.check.json for stricter checking
  - build: Includes downlevelIteration flag for production builds

## Vite Configuration

- Configuration file: vite.config.ts
- ESBuild target: ES2020
- React plugin enabled
- Static file serving configured
- CSS source maps enabled
- Optimized dependencies configuration

### Build Configuration

1. TypeScript Configuration
   - Main configuration: tsconfig.json
     - Target: ES2020
     - Module: ESNext
     - Strict mode enabled
     - downlevelIteration enabled for proper Map/Set iteration
     - esModuleInterop enabled for better module compatibility
   - Type checking configuration: tsconfig.check.json
     - Extends main configuration
     - Target: ES2015
     - Excludes problematic test files
   - NPM Scripts:
     - type-check: Runs TypeScript compiler with downlevelIteration flag
     - type-check:downlevel: Uses tsconfig.check.json for stricter checking
     - build: Includes downlevelIteration flag for production builds

2. Vite Configuration
   - Configuration file: vite.config.ts
   - ESBuild target: ES2020
   - React plugin enabled
   - Static file serving configured
   - CSS source maps enabled
   - Optimized dependencies configuration

### Build Configuration

1. TypeScript Configuration
   - Main configuration: tsconfig.json
     - Target: ES2020
     - Module: ESNext
     - Strict mode enabled
     - downlevelIteration enabled for proper Map/Set iteration
     - esModuleInterop enabled for better module compatibility
   - Type checking configuration: tsconfig.check.json
     - Extends main configuration
     - Target: ES2015
     - Excludes problematic test files
   - NPM Scripts:
     - type-check: Runs TypeScript compiler with downlevelIteration flag
     - type-check:downlevel: Uses tsconfig.check.json for stricter checking
     - build: Includes downlevelIteration flag for production builds

2. Vite Configuration
   - Configuration file: vite.config.ts
   - ESBuild target: ES2020
   - React plugin enabled
   - Static file serving configured
   - CSS source maps enabled
   - Optimized dependencies configuration
