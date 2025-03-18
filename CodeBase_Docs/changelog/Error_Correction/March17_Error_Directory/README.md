# TypeScript & ESLint Error Analysis Workflow

## Overview

This workflow provides a comprehensive solution for analyzing and fixing TypeScript and ESLint errors in a codebase. It includes tools for:

1. **Analysis**: Identify and categorize different types of errors
2. **Reporting**: Generate detailed reports with error statistics
3. **Fixing**: Apply automated fixes for common error patterns

## Workflow Components

### Analysis Scripts

| Script                  | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `analyze_typescript.sh` | Analyzes TypeScript compiler errors                |
| `analyze_eslint.sh`     | Analyzes ESLint errors and warnings                |
| `run_full_analysis.sh`  | Runs both analyses and generates a combined report |

### Fix Scripts

| Script                  | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `fix_resource_types.sh` | Converts string literals to ResourceType enum values |
| `fix_unused_vars.sh`    | Prefixes unused variables with underscore            |

## Execution Order

For the complete workflow:

1. Run tests to verify the fix scripts work correctly:

   ```bash
   cd Tests/essential
   ./test_master.sh
   ```

2. Run the full analysis:

   ```bash
   ./Scripts/run_full_analysis.sh
   ```

3. Apply fixes based on analysis results:

   ```bash
   ./Scripts/fix_resource_types.sh --target=/path/to/target
   ./Scripts/fix_unused_vars.sh --target=/path/to/target
   ```

4. Re-run analysis to verify fixes:
   ```bash
   ./Scripts/run_full_analysis.sh
   ```

## Individual Commands

### Analysis

Run TypeScript analysis only:

```bash
./Scripts/analyze_typescript.sh [--verbose] [--output-dir=<dir>]
```

Run ESLint analysis only:

```bash
./Scripts/analyze_eslint.sh [--verbose] [--output-dir=<dir>]
```

Run both analyses with a combined report:

```bash
./Scripts/run_full_analysis.sh [--verbose]
```

### Fixing

Fix ResourceType string literals:

```bash
./Scripts/fix_resource_types.sh --target=/path/to/file_or_directory
```

Fix unused variables:

```bash
./Scripts/fix_unused_vars.sh --target=/path/to/file_or_directory
```

## Generated Reports

### TypeScript Analysis (`Analysis/TypeScript/`)

- `typescript_errors_YYYY-MM-DD.txt`: Raw TypeScript compiler output
- `typescript_error_report_YYYY-MM-DD.md`: Markdown report with error summary
- Categorized error files:
  - `type_mismatch_errors.txt`
  - `missing_property_errors.txt`
  - `null_undefined_errors.txt`
  - `resource_type_errors.txt`
  - `event_system_errors.txt`
  - `react_component_errors.txt`
  - `syntax_errors.txt`
  - `unused_variable_errors.txt`
- Analysis files:
  - `error_hotspots.txt`: Files with the most errors
  - `error_code_frequency.txt`: Most common error codes

### ESLint Analysis (`Analysis/ESLint/`)

- `eslint_errors_YYYY-MM-DD.txt`: Readable ESLint output
- `eslint_errors_YYYY-MM-DD.json`: JSON-formatted ESLint output
- `eslint_error_report_YYYY-MM-DD.md`: Markdown report with error summary
- Categorized error files:
  - `unused_vars_YYYY-MM-DD.txt`
  - `import_errors_YYYY-MM-DD.txt`
  - `react_errors_YYYY-MM-DD.txt`
  - `typescript_errors_YYYY-MM-DD.txt`
  - `formatting_errors_YYYY-MM-DD.txt`
- Analysis files:
  - `eslint_hotspots_YYYY-MM-DD.txt`: Files with the most ESLint errors
  - `eslint_rule_frequency_YYYY-MM-DD.txt`: Most common ESLint rules

### Combined Report (`Analysis/Combined/`)

- `analysis_summary_YYYY-MM-DD.md`: Unified report with data from both analyses

## Workflow Tips

1. Always run the tests first to ensure fix scripts are working correctly
2. Run the full analysis before applying any fixes to understand the error landscape
3. Fix issues in this order:
   - Syntax errors
   - Resource type errors
   - Unused variables
   - Type mismatches and null/undefined errors
   - Component-specific issues
4. Re-run analysis after each major fix to verify progress
