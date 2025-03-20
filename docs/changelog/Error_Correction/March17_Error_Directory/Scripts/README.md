# TypeScript Error Analysis & Fix Workflow

## Overview

This directory contains scripts for analyzing and fixing common TypeScript and ESLint errors in the Galactic Sprawl codebase. The workflow has been consolidated and standardized to provide a consistent approach to error management.

## Directory Structure

```
Scripts/
├── Analysis/                  # Analysis scripts
│   ├── analyze_typescript.sh
│   ├── analyze_eslint.sh
│   ├── analyze_error_patterns.sh
│   ├── analyze_all.sh
│   └── run_full_analysis.sh
├── Fixes/                     # Fix scripts
│   ├── fix_type_safety.sh
│   ├── fix_null_safety.sh
│   ├── fix_resource_types.sh
│   ├── fix_resource_types_advanced.sh
│   ├── fix_unused_vars.sh
│   ├── run_targeted_fixes.sh
│   └── ResourceTools/         # Additional resource-specific tools
│       └── fix_resources.sh
├── Backups/                   # Directory for backups
├── manage_backups.sh          # Script to manage backup directories
├── run_analysis_workflow.sh   # Master script to run the entire workflow
└── README.md                  # This documentation
```

## Related Directories

```
Tests/
├── essential/                 # Essential test cases
│   └── test_master.sh
├── FixTests/                  # Tests for fix scripts
│   ├── test_null_safety_fixes.sh
│   ├── test_resource_type_fixes.sh
│   ├── test_type_safety_fixes.sh
│   └── mock_fix_resource_types_advanced.sh
└── run_all_tests.sh           # Run all tests
```

## Master Workflow

The easiest way to run the entire workflow is using the master script:

```bash
./run_analysis_workflow.sh [--target=<directory>] [--analysis-only] [--fix-only]
```

Options:

- `--target=<directory>`: Specify a target directory (default: src/)
- `--analysis-only`: Run only the analysis step, no fixes
- `--fix-only`: Skip analysis and apply fixes directly

## Individual Scripts

### Analysis Scripts

```bash
# Run TypeScript analysis
./Analysis/analyze_typescript.sh [--verbose] [--output-dir=<dir>]

# Run ESLint analysis
./Analysis/analyze_eslint.sh [--verbose] [--output-dir=<dir>]

# Run both analyses with a combined report
./Analysis/run_full_analysis.sh [--verbose]

# Run comprehensive error analysis
./Analysis/analyze_error_patterns.sh [--target=<directory>]

# Run all analyses
./Analysis/analyze_all.sh
```

### Fix Scripts

```bash
# Apply type safety fixes
./Fixes/fix_type_safety.sh --target=<file-or-directory>

# Apply null safety fixes
./Fixes/fix_null_safety.sh --target=<file-or-directory>

# Apply resource type fixes (basic version)
./Fixes/fix_resource_types.sh --target=<file-or-directory>

# Apply resource type fixes (advanced version)
./Fixes/fix_resource_types_advanced.sh --target=<file-or-directory>

# Apply resource-specific fixes (comprehensive)
./Fixes/ResourceTools/fix_resources.sh --target=<file-or-directory>

# Fix unused variables
./Fixes/fix_unused_vars.sh --target=<file-or-directory>

# Run targeted fixes based on analysis
./Fixes/run_targeted_fixes.sh --target=<file-or-directory> [--fix-type=<type>]
```

### Testing

```bash
# Run all tests for the fix scripts
../Tests/run_all_tests.sh

# Run tests for specific fix scripts
../Tests/FixTests/test_null_safety_fixes.sh
../Tests/FixTests/test_resource_type_fixes.sh
../Tests/FixTests/test_type_safety_fixes.sh
```

### Backup Management

All fix scripts automatically create backups in the `../Fixes/Backups/` directory with timestamped subdirectories. You can manage these backups using:

```bash
./manage_backups.sh [--clean=<days>] [--archive]
```

Options:

- `--clean=<days>`: Remove backups older than the specified number of days
- `--archive`: Create a compressed archive of all backups

## Fix Types

### Type Safety Fixes

- Converts explicit `any` types to more specific types
- Fixes array type declarations
- Adds function return types
- Adds type assertions for common patterns

### Null Safety Fixes

- Adds optional chaining (`?.`) for object property access
- Adds nullish coalescing (`??`) for default values
- Adds null checks in conditions
- Adds non-null assertions where appropriate

### Resource Type Fixes

- Converts string literals to ResourceType enum values
- Fixes function signatures that use strings instead of ResourceType
- Corrects imports to include ResourceType when needed
- Fixes object property access patterns related to resources

### Unused Variables Fixes

- Prefixes unused variables with underscore to match ESLint rules
- Updates function arguments that are unused
- Handles unused catch clause variables

## Best Practices

1. Always run tests first to ensure scripts are working as expected
2. Run the full analysis workflow to understand what errors exist before applying fixes
3. Make sure to check backups before running large-scale fixes
4. Address one type of issue at a time in this order:
   - Resource type issues (most impactful)
   - Type safety issues
   - Null safety issues
   - Unused variables
5. Verify fixes with TypeScript compiler and ESLint after each major change
6. Use the backup management script regularly to keep the backups directory organized
