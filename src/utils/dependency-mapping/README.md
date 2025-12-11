# Root Directory Reorganization - Pre-Analysis Tools

This directory contains the comprehensive dependency mapping and validation tools created for the root directory reorganization project.

## Overview

The tools implement **Property 1: Build System Integrity** and **Property 2: Dependency Resolution Preservation** from the root-directory-organization specification, ensuring that file reorganization can be performed safely without breaking the build system or file dependencies.

## Components

### 1. DependencyMapper (`DependencyMapper.ts`)

- **Purpose**: Analyzes all file dependencies in the project
- **Features**:
  - Categorizes files into critical, config, documentation, source, and asset types
  - Identifies which files can be safely relocated
  - Maps cross-references between files
  - Validates build system integrity

### 2. BaselineValidator (`BaselineValidator.ts`)

- **Purpose**: Establishes baseline test results before reorganization
- **Features**:
  - Runs build, type-check, lint, and test commands
  - Captures performance baselines
  - Validates tool availability
  - Compares results before/after reorganization

### 3. ReorganizationValidator (`ReorganizationValidator.ts`)

- **Purpose**: Main orchestrator for pre-reorganization analysis
- **Features**:
  - Runs complete analysis workflow
  - Generates recommendations and warnings
  - Creates workspace backups
  - Validates reorganization plans

### 4. Property-Based Tests

- **DependencyMapper.test.ts**: Tests build system integrity properties
- **PathResolution.test.ts**: Tests dependency resolution preservation properties

## Usage

### Command Line Interface

```bash
# Run complete pre-reorganization analysis
node src/utils/dependency-mapping/cli.ts
```

### Programmatic Usage

```typescript
import { ReorganizationValidator } from "./src/utils/dependency-mapping";

const validator = new ReorganizationValidator();
const plan = await validator.runCompleteAnalysis();
const validation = validator.validatePlan(plan);

if (validation.canProceed) {
  console.log("Ready for reorganization!");
} else {
  console.log("Blockers:", validation.blockers);
}
```

## Property-Based Testing Results

### ✅ Property 1: Build System Integrity

**Validates Requirements 1.1, 1.2**

Tests that for any configuration file relocation, the build system continues to function without errors. The tests verify:

- Critical files (package.json, vite.config.ts, etc.) are correctly identified as non-relocatable
- File categorization is consistent and accurate
- Build system validation works for various project structures
- Edge cases are handled gracefully

### ✅ Property 2: Dependency Resolution Preservation

**Validates Requirements 1.3, 2.1**

Tests that for any file move, all existing import paths and references continue to resolve correctly. The tests verify:

- Path resolution works for basic file moves
- External imports remain unchanged during reorganization
- Relative path calculations are accurate
- Bidirectional references are preserved

## File Categories

### Critical Files (Must Stay in Root)

- `package.json` - NPM configuration
- `vite.config.ts` - Build configuration
- `tsconfig*.json` - TypeScript configuration
- `eslint.config.js` - Linting configuration
- `playwright.config.ts` - E2E test configuration
- `vitest.config.ts` - Unit test configuration
- `tailwind.config.js` - CSS framework configuration
- `.gitignore` - Git exclusion rules
- `index.html` - Vite entry point

### Relocatable Files

- **Config**: `.prettierrc*`, `.sourcery.yaml`, `postcss.config.js`, `jest.config.js`, `eslint_baseline.txt`
- **Documentation**: `*.md` files
- **Reports**: `ERRORS.json`, `WARNINGS.json`, `test-prettier.js`
- **Assets**: `.assets/` directory and contents

### 5. FileClassificationSystem (`FileClassificationSystem.ts`)

- **Purpose**: Complete file classification and validation system
- **Features**:
  - Classifies files into categories (critical, build, testing, linting, documentation, reports, assets, source)
  - Determines which files can be safely relocated
  - Identifies tools affected by file moves
  - Generates proposed new paths for relocatable files
  - Creates comprehensive validation test suites
  - Implements atomic operations with rollback capability
  - Provides safety checks for tool configuration accessibility

### 6. Command Line Interface (`cli.ts`)

- **Purpose**: Interactive analysis and reporting tool
- **Features**:
  - Runs complete project analysis
  - Displays file classification results
  - Shows proposed reorganization plan
  - Lists validation test requirements
  - Provides actionable next steps

## Usage

### Command Line Interface

```bash
# Run complete analysis (when CLI is properly configured)
npx ts-node src/utils/dependency-mapping/cli.ts
```

### Programmatic Usage

```typescript
import { FileClassificationSystem } from "./src/utils/dependency-mapping/FileClassificationSystem";

const system = new FileClassificationSystem();
const plan = await system.generateReorganizationPlan();

console.log("Relocatable files:", plan.relocatableFiles.length);
console.log("Critical files:", plan.criticalFiles.length);

// Run validation tests
const testSuite = system.buildValidationTestSuite();
const preResults = await system.runValidationTests(testSuite.preMove);
```

## Property-Based Testing Results

### ✅ Property 1: Build System Integrity

**Validates Requirements 1.1, 1.2**

Tests that for any configuration file relocation, the build system continues to function without errors. The tests verify:

- Critical files (package.json, vite.config.ts, etc.) are correctly identified as non-relocatable
- File categorization is consistent and accurate
- Build system validation works for various project structures
- Edge cases are handled gracefully

### ✅ Property 2: Dependency Resolution Preservation

**Validates Requirements 1.3, 2.1**

Tests that for any file move, all existing import paths and references continue to resolve correctly. The tests verify:

- Path resolution works for basic file moves
- External imports remain unchanged during reorganization
- Relative path calculations are accurate
- Bidirectional references are preserved

### ✅ Property 3: Script Execution Continuity

**Validates Requirements 1.4, 2.2**

Tests that for any npm script that references files, the script should execute successfully after reorganization. The tests verify:

- Script file reference extraction is accurate
- File path updates in scripts work correctly
- Complex multi-file reorganization preserves script functionality
- Script structure and command syntax is maintained

### ✅ Property 4: Tool Configuration Accessibility

**Validates Requirements 2.3, 3.1**

Tests that for any development tool configuration, the tool should locate and use its configuration file after reorganization. The tests verify:

- Tools that require root configuration are correctly identified
- Relocatable tools can find configurations in subdirectories
- Configuration move safety is accurately assessed
- Proper flag syntax is provided for relocated configurations

## File Categories

### Critical Files (Must Stay in Root)

- `package.json` - NPM configuration
- `vite.config.ts` - Build configuration
- `tsconfig*.json` - TypeScript configuration
- `eslint.config.js` - Linting configuration
- `playwright.config.ts` - E2E test configuration
- `tailwind.config.js` - CSS framework configuration
- `.gitignore` - Git exclusion rules
- `index.html` - Vite entry point

### Relocatable Files

- **Build Config**: `.prettierrc*`, `.sourcery.yaml`, `postcss.config.js` → `config/build/`
- **Testing Config**: `vitest.config.ts`, `jest.config.js`, `jest-setup.js` → `config/testing/`
- **Linting Config**: `eslint_baseline.txt` → `config/linting/`
- **Documentation**: `*.md` files → `docs/`
- **Reports**: `ERRORS.json`, `WARNINGS.json`, `test-prettier.js` → `reports/`
- **Assets**: `.assets/` directory → `assets/`

## Validation Test Suite

The system includes comprehensive validation tests for three phases:

### Pre-Move Tests

- Baseline build verification
- Type checking validation
- Lint baseline capture
- Test suite execution

### During-Move Tests

- Incremental build validation
- Incremental type checking

### Post-Move Tests

- Final build verification
- Final type checking
- Lint comparison
- Test suite validation
- Development server startup

## Rollback System

The system implements atomic operations with full rollback capability:

- Creates backups before any file moves
- Supports atomic move operations
- Provides verification of each operation
- Enables complete rollback in reverse order
- Maintains system integrity throughout the process

## Next Steps

1. Review the analysis results from running the FileClassificationSystem
2. Execute the reorganization tasks from the tasks.md file
3. Run validation after each major step to ensure no regressions
4. Use the baseline comparison to verify the reorganization was successful

## Implementation Notes

- Uses ES2015+ compatible iteration patterns for broad TypeScript compatibility
- Implements comprehensive error handling and validation
- Provides detailed logging and progress reporting
- Creates automatic backups before any changes
- Follows the property-based testing methodology for correctness verification
- Includes atomic operations with rollback capability
- Supports tool configuration safety checks
- Provides comprehensive file classification system
