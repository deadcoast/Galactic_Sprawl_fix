# Error Analysis and Correction Scripts

This directory contains scripts for analyzing and fixing errors in the Galactic Sprawl codebase. Each script is designed to be self-contained and focused on a specific task.

## Analysis Scripts

### 1. `analyze_all.sh`

**Purpose**: Run a complete analysis of the codebase and generate comprehensive reports.

**Usage**:

```bash
./analyze_all.sh
```

**Output**:

- Generates TypeScript error logs in `../Analysis/TypeScript/`
- Generates ESLint error logs in `../Analysis/ESLint/`
- Creates categorized error lists in `../Categories/`
- Produces summary reports in `../Reports/`

### 2. `analyze_typescript.sh`

**Purpose**: Run TypeScript type checking and categorize errors by type.

**Usage**:

```bash
./analyze_typescript.sh
```

**Output**:

- Generates type-specific error files in `../Analysis/TypeScript/`
- Creates a summary report in `../Reports/typescript_summary.md`

### 3. `analyze_eslint.sh`

**Purpose**: Run ESLint and categorize errors by rule.

**Usage**:

```bash
./analyze_eslint.sh
```

**Output**:

- Generates rule-specific error files in `../Analysis/ESLint/`
- Creates a summary report in `../Reports/eslint_summary.md`

### 4. `categorize_errors.sh`

**Purpose**: Process raw error logs and categorize them by component, feature, or error type.

**Usage**:

```bash
./categorize_errors.sh
```

**Output**:

- Populates the `../Categories/` directory with categorized error files
- Updates the priority report in `../Reports/priority_report.md`

## Reporting Scripts

### 1. `generate_summary.sh`

**Purpose**: Generate a comprehensive summary of all errors.

**Usage**:

```bash
./generate_summary.sh
```

**Output**:

- Creates `../Reports/error_summary.md` with detailed statistics
- Includes charts and trend analysis if previous reports exist

### 2. `track_progress.sh`

**Purpose**: Track progress over time by comparing current errors with previous runs.

**Usage**:

```bash
./track_progress.sh
```

**Output**:

- Creates `../Reports/daily_progress.md` with progress metrics
- Updates trend charts and projections

## Fix Scripts

### 1. `fix_resource_types.sh`

**Purpose**: Automatically fix common resource type errors.

**Usage**:

```bash
./fix_resource_types.sh [--dry-run]
```

**Options**:

- `--dry-run`: Show proposed changes without applying them

**Output**:

- Makes changes to files with resource type errors
- Generates a report of changes made in `../Reports/fixes/resource_types_fixes.md`

### 2. `fix_unused_vars.sh`

**Purpose**: Automatically prefix unused variables with underscore.

**Usage**:

```bash
./fix_unused_vars.sh [--dry-run]
```

**Options**:

- `--dry-run`: Show proposed changes without applying them

**Output**:

- Makes changes to files with unused variable warnings
- Generates a report of changes made in `../Reports/fixes/unused_vars_fixes.md`

### 3. `template_generator.sh`

**Purpose**: Generate fix templates for common error patterns.

**Usage**:

```bash
./template_generator.sh <error_type>
```

**Options**:

- `<error_type>`: Type of error to generate templates for (e.g., resource_type, event_system)

**Output**:

- Creates template files in `../Fixes/Templates/`
- Includes implementation examples and usage notes

## Utility Scripts

### 1. `setup_environment.sh`

**Purpose**: Set up the error correction environment and dependencies.

**Usage**:

```bash
./setup_environment.sh
```

**Output**:

- Creates necessary directories
- Installs required tools if missing
- Sets up configuration files

### 2. `update_config.sh`

**Purpose**: Update ESLint or TypeScript configuration to improve error detection.

**Usage**:

```bash
./update_config.sh <config_type>
```

**Options**:

- `<config_type>`: Type of configuration to update (eslint or typescript)

**Output**:

- Updates configuration files
- Generates a report of changes made

## Adding New Scripts

When adding new scripts to this directory:

1. Make sure the script is executable (`chmod +x script_name.sh`)
2. Add detailed documentation within the script itself
3. Update this README with information about the script
4. Add any necessary dependencies to the `setup_environment.sh` script
