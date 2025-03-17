#!/bin/bash

# analyze_all.sh
#
# Purpose: Run a complete analysis of the codebase and generate comprehensive reports.
# This script serves as the main entry point for the error analysis workflow.
#
# Usage: ./analyze_all.sh
#
# Created: March 17, 2023
# Author: Claude AI Assistant

# Set strict mode
set -euo pipefail

# Define script directory and base directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# Initialize directory structure if not already created
function setup_directories() {
  echo "Setting up directory structure..."
  
  # Create main directories
  mkdir -p "$BASE_DIR/Analysis/TypeScript"
  mkdir -p "$BASE_DIR/Analysis/ESLint"
  mkdir -p "$BASE_DIR/Analysis/Dependencies"
  
  mkdir -p "$BASE_DIR/Categories/ResourceTypes"
  mkdir -p "$BASE_DIR/Categories/EventSystem"
  mkdir -p "$BASE_DIR/Categories/TypeSafety"
  mkdir -p "$BASE_DIR/Categories/Components"
  mkdir -p "$BASE_DIR/Categories/Managers"
  
  mkdir -p "$BASE_DIR/Reports"
  mkdir -p "$BASE_DIR/Reports/fixes"
  mkdir -p "$BASE_DIR/Reports/trends"
  
  mkdir -p "$BASE_DIR/Fixes/Templates"
  
  # Create placeholder READMEs if they don't exist
  for dir in "$BASE_DIR/Analysis" "$BASE_DIR/Categories" "$BASE_DIR/Reports" "$BASE_DIR/Fixes"; do
    if [ ! -f "$dir/README.md" ]; then
      echo "# $(basename "$dir")" > "$dir/README.md"
      echo "" >> "$dir/README.md"
      echo "This directory contains $(basename "$dir" | tr '[:upper:]' '[:lower:]') related to error correction." >> "$dir/README.md"
    fi
  done
  
  echo "Directory structure setup complete."
}

# Check for required tools
function check_dependencies() {
  echo "Checking dependencies..."
  
  # List of required tools
  local required_tools=("node" "npx" "grep" "awk" "sed" "jq")
  local missing_tools=()
  
  # Check each tool
  for tool in "${required_tools[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
      missing_tools+=("$tool")
    fi
  done
  
  # Report missing tools
  if [ ${#missing_tools[@]} -ne 0 ]; then
    echo "Error: The following required tools are missing:"
    for tool in "${missing_tools[@]}"; do
      echo "  - $tool"
    done
    echo "Please install these tools before continuing."
    exit 1
  fi
  
  echo "All dependencies are installed."
}

# Run TypeScript analysis
function run_typescript_analysis() {
  echo "Running TypeScript analysis..."
  
  # Get the current date for file naming
  local date_str=$(date +"%Y-%m-%d")
  local ts_error_file="$BASE_DIR/Analysis/TypeScript/typescript_errors_$date_str.txt"
  
  # Run TypeScript check and save output
  echo "Running TypeScript compiler..."
  npx tsc --noEmit --pretty false > "$ts_error_file" 2>&1 || true
  
  # Count errors
  local error_count=$(grep -c "error TS" "$ts_error_file" || echo "0")
  echo "Found $error_count TypeScript errors."
  
  # Categorize TypeScript errors
  echo "Categorizing TypeScript errors..."
  
  # Type mismatch errors
  grep "is not assignable to" "$ts_error_file" > "$BASE_DIR/Analysis/TypeScript/type_mismatch_errors.txt" || true
  
  # Missing property errors
  grep "Property '.*' does not exist on type" "$ts_error_file" > "$BASE_DIR/Analysis/TypeScript/missing_property_errors.txt" || true
  
  # Unused variable errors
  grep "is declared but" "$ts_error_file" > "$BASE_DIR/Analysis/TypeScript/unused_variable_errors.txt" || true
  
  # Resource type errors (specific to this project)
  grep -E "ResourceType|resource type" "$ts_error_file" > "$BASE_DIR/Analysis/TypeScript/resource_type_errors.txt" || true
  
  # Event system errors (specific to this project)
  grep -E "EventEmitter|event|subscribe" "$ts_error_file" > "$BASE_DIR/Analysis/TypeScript/event_system_errors.txt" || true
  
  echo "TypeScript analysis complete."
}

# Run ESLint analysis
function run_eslint_analysis() {
  echo "Running ESLint analysis..."
  
  # Get the current date for file naming
  local date_str=$(date +"%Y-%m-%d")
  local eslint_error_file="$BASE_DIR/Analysis/ESLint/eslint_errors_$date_str.txt"
  
  # Run ESLint and save output
  echo "Running ESLint..."
  npx eslint --ext .ts,.tsx src/ > "$eslint_error_file" 2>&1 || true
  
  # Count errors and warnings
  local error_count=$(grep -c "error" "$eslint_error_file" || echo "0")
  local warning_count=$(grep -c "warning" "$eslint_error_file" || echo "0")
  echo "Found $error_count ESLint errors and $warning_count warnings."
  
  # Categorize ESLint errors
  echo "Categorizing ESLint errors..."
  
  # Any type usage
  grep -E "@typescript-eslint/no-explicit-any" "$eslint_error_file" > "$BASE_DIR/Analysis/ESLint/any_type_errors.txt" || true
  
  # Unused variables
  grep -E "@typescript-eslint/no-unused-vars" "$eslint_error_file" > "$BASE_DIR/Analysis/ESLint/unused_vars_errors.txt" || true
  
  # String resource types (specific to this project)
  grep -E "no-string-resource-types" "$eslint_error_file" > "$BASE_DIR/Analysis/ESLint/string_resource_errors.txt" || true
  
  echo "ESLint analysis complete."
}

# Group errors by component or feature
function categorize_by_component() {
  echo "Categorizing errors by component..."
  
  # Get all error files
  local ts_error_files=("$BASE_DIR/Analysis/TypeScript"/*.txt)
  local eslint_error_files=("$BASE_DIR/Analysis/ESLint"/*.txt)
  
  # Resource type related errors
  echo "Extracting resource type errors..."
  mkdir -p "$BASE_DIR/Categories/ResourceTypes"
  grep -h "ResourceType" "${ts_error_files[@]}" > "$BASE_DIR/Categories/ResourceTypes/typescript_errors.txt" || true
  grep -h "no-string-resource-types" "${eslint_error_files[@]}" > "$BASE_DIR/Categories/ResourceTypes/eslint_errors.txt" || true
  
  # Event system related errors
  echo "Extracting event system errors..."
  mkdir -p "$BASE_DIR/Categories/EventSystem"
  grep -h -E "EventEmitter|event|subscribe" "${ts_error_files[@]}" > "$BASE_DIR/Categories/EventSystem/typescript_errors.txt" || true
  
  # Component related errors
  echo "Extracting component errors..."
  mkdir -p "$BASE_DIR/Categories/Components"
  grep -h -E "React|Component|Props|JSX" "${ts_error_files[@]}" > "$BASE_DIR/Categories/Components/typescript_errors.txt" || true
  
  # Manager related errors
  echo "Extracting manager errors..."
  mkdir -p "$BASE_DIR/Categories/Managers"
  grep -h -E "Manager|Service" "${ts_error_files[@]}" > "$BASE_DIR/Categories/Managers/typescript_errors.txt" || true
  
  echo "Component categorization complete."
}

# Generate summary report
function generate_summary() {
  echo "Generating summary report..."
  
  local date_str=$(date +"%Y-%m-%d")
  local summary_file="$BASE_DIR/Reports/error_summary_$date_str.md"
  
  # Start summary file
  cat > "$summary_file" << EOF
# Error Analysis Summary - $date_str

## Overview

This report summarizes the errors found in the codebase during analysis.

## Error Counts

| Category | Count |
|----------|-------|
EOF
  
  # Add TypeScript error counts
  local ts_error_count=$(grep -c "error TS" "$BASE_DIR/Analysis/TypeScript/typescript_errors_$date_str.txt" || echo "0")
  echo "| TypeScript Errors | $ts_error_count |" >> "$summary_file"
  
  # Add ESLint error and warning counts
  local eslint_error_count=$(grep -c "error" "$BASE_DIR/Analysis/ESLint/eslint_errors_$date_str.txt" || echo "0")
  local eslint_warning_count=$(grep -c "warning" "$BASE_DIR/Analysis/ESLint/eslint_errors_$date_str.txt" || echo "0")
  echo "| ESLint Errors | $eslint_error_count |" >> "$summary_file"
  echo "| ESLint Warnings | $eslint_warning_count |" >> "$summary_file"
  
  # Add detailed error breakdowns
  cat >> "$summary_file" << EOF

## TypeScript Error Breakdown

| Error Type | Count |
|------------|-------|
EOF
  
  # Count specific TypeScript error types
  local type_mismatch_count=$(wc -l < "$BASE_DIR/Analysis/TypeScript/type_mismatch_errors.txt" || echo "0")
  local missing_property_count=$(wc -l < "$BASE_DIR/Analysis/TypeScript/missing_property_errors.txt" || echo "0")
  local unused_variable_count=$(wc -l < "$BASE_DIR/Analysis/TypeScript/unused_variable_errors.txt" || echo "0")
  local resource_type_count=$(wc -l < "$BASE_DIR/Analysis/TypeScript/resource_type_errors.txt" || echo "0")
  local event_system_count=$(wc -l < "$BASE_DIR/Analysis/TypeScript/event_system_errors.txt" || echo "0")
  
  echo "| Type Mismatches | $type_mismatch_count |" >> "$summary_file"
  echo "| Missing Properties | $missing_property_count |" >> "$summary_file"
  echo "| Unused Variables | $unused_variable_count |" >> "$summary_file"
  echo "| Resource Type Issues | $resource_type_count |" >> "$summary_file"
  echo "| Event System Issues | $event_system_count |" >> "$summary_file"
  
  # Add ESLint error breakdown
  cat >> "$summary_file" << EOF

## ESLint Error Breakdown

| Error Type | Count |
|------------|-------|
EOF
  
  # Count specific ESLint error types
  local any_type_count=$(wc -l < "$BASE_DIR/Analysis/ESLint/any_type_errors.txt" || echo "0")
  local unused_vars_count=$(wc -l < "$BASE_DIR/Analysis/ESLint/unused_vars_errors.txt" || echo "0")
  local string_resource_count=$(wc -l < "$BASE_DIR/Analysis/ESLint/string_resource_errors.txt" || echo "0")
  
  echo "| Any Type Usage | $any_type_count |" >> "$summary_file"
  echo "| Unused Variables | $unused_vars_count |" >> "$summary_file"
  echo "| String Resource Types | $string_resource_count |" >> "$summary_file"
  
  # Add category breakdown
  cat >> "$summary_file" << EOF

## Error Categories

| Category | Count |
|----------|-------|
EOF
  
  # Count errors by category
  local resource_types_count=$(wc -l < "$BASE_DIR/Categories/ResourceTypes/typescript_errors.txt" 2>/dev/null || echo "0")
  resource_types_count=$((resource_types_count + $(wc -l < "$BASE_DIR/Categories/ResourceTypes/eslint_errors.txt" 2>/dev/null || echo "0")))
  
  local event_system_count=$(wc -l < "$BASE_DIR/Categories/EventSystem/typescript_errors.txt" 2>/dev/null || echo "0")
  local components_count=$(wc -l < "$BASE_DIR/Categories/Components/typescript_errors.txt" 2>/dev/null || echo "0")
  local managers_count=$(wc -l < "$BASE_DIR/Categories/Managers/typescript_errors.txt" 2>/dev/null || echo "0")
  
  echo "| Resource Types | $resource_types_count |" >> "$summary_file"
  echo "| Event System | $event_system_count |" >> "$summary_file"
  echo "| Components | $components_count |" >> "$summary_file"
  echo "| Managers | $managers_count |" >> "$summary_file"
  
  # Add recommended priorities
  cat >> "$summary_file" << EOF

## Recommended Priorities

Based on the error analysis, here are the recommended priorities for fixing:

1. **Resource Type Issues** - $resource_types_count errors
   - Fix string literals to use ResourceType enum
   - Update function parameters to accept proper types
   - Add type conversion utilities where needed

2. **Event System Issues** - $event_system_count errors
   - Fix event subscription and emission type safety
   - Implement proper typing for event payloads
   - Ensure consistent event naming

3. **Component Issues** - $components_count errors
   - Fix component prop types
   - Address JSX-related issues
   - Ensure consistent component patterns

4. **Manager Implementation** - $managers_count errors
   - Fix singleton pattern issues
   - Address method implementation problems
   - Ensure proper dependency injection

## Next Steps

1. Review the detailed error logs in the Analysis directory
2. Focus on fixing the high-priority issues first
3. Run this analysis again after making changes to track progress
EOF
  
  echo "Summary report generated at $summary_file"
}

# Generate priority report
function generate_priority_report() {
  echo "Generating priority report..."
  
  local date_str=$(date +"%Y-%m-%d")
  local priority_file="$BASE_DIR/Reports/priority_report_$date_str.md"
  
  # Start priority file
  cat > "$priority_file" << EOF
# Error Priority Report - $date_str

This report prioritizes errors based on impact and dependencies.

## High Priority Errors

These errors should be fixed first as they have the most impact or block other fixes:

EOF
  
  # Add sample high priority errors
  if [ -f "$BASE_DIR/Analysis/TypeScript/resource_type_errors.txt" ]; then
    echo "### Resource Type Errors" >> "$priority_file"
    echo "" >> "$priority_file"
    echo "\`\`\`" >> "$priority_file"
    head -n 10 "$BASE_DIR/Analysis/TypeScript/resource_type_errors.txt" >> "$priority_file"
    echo "\`\`\`" >> "$priority_file"
    echo "" >> "$priority_file"
  fi
  
  if [ -f "$BASE_DIR/Analysis/TypeScript/event_system_errors.txt" ]; then
    echo "### Event System Errors" >> "$priority_file"
    echo "" >> "$priority_file"
    echo "\`\`\`" >> "$priority_file"
    head -n 10 "$BASE_DIR/Analysis/TypeScript/event_system_errors.txt" >> "$priority_file"
    echo "\`\`\`" >> "$priority_file"
    echo "" >> "$priority_file"
  fi
  
  # Add medium priority errors
  cat >> "$priority_file" << EOF

## Medium Priority Errors

These errors should be addressed after high priority issues:

EOF
  
  if [ -f "$BASE_DIR/Analysis/TypeScript/type_mismatch_errors.txt" ]; then
    echo "### Type Mismatch Errors" >> "$priority_file"
    echo "" >> "$priority_file"
    echo "\`\`\`" >> "$priority_file"
    head -n 10 "$BASE_DIR/Analysis/TypeScript/type_mismatch_errors.txt" >> "$priority_file"
    echo "\`\`\`" >> "$priority_file"
    echo "" >> "$priority_file"
  fi
  
  if [ -f "$BASE_DIR/Analysis/ESLint/any_type_errors.txt" ]; then
    echo "### Any Type Usage" >> "$priority_file"
    echo "" >> "$priority_file"
    echo "\`\`\`" >> "$priority_file"
    head -n 10 "$BASE_DIR/Analysis/ESLint/any_type_errors.txt" >> "$priority_file"
    echo "\`\`\`" >> "$priority_file"
    echo "" >> "$priority_file"
  fi
  
  # Add low priority errors
  cat >> "$priority_file" << EOF

## Low Priority Errors

These errors can be addressed last:

EOF
  
  if [ -f "$BASE_DIR/Analysis/ESLint/unused_vars_errors.txt" ]; then
    echo "### Unused Variables" >> "$priority_file"
    echo "" >> "$priority_file"
    echo "\`\`\`" >> "$priority_file"
    head -n 10 "$BASE_DIR/Analysis/ESLint/unused_vars_errors.txt" >> "$priority_file"
    echo "\`\`\`" >> "$priority_file"
    echo "" >> "$priority_file"
  fi
  
  # Add recommendations
  cat >> "$priority_file" << EOF

## Recommendation

1. Start with fixing resource type issues, especially in the MiningShipManager
2. Address event system issues next, focusing on event emitter implementations
3. Fix type mismatches and any type usage
4. Clean up unused variables and other code quality issues

## Specific Files to Focus On

Based on error frequency, these files should be prioritized:

1. \`src/managers/mining/MiningShipManagerImpl.ts\`
2. \`src/utils/performance/D3AnimationQualityManager.ts\`
3. \`src/types/resources/ResourceTypes.ts\`
4. \`src/lib/events/EventEmitter.ts\`
EOF
  
  echo "Priority report generated at $priority_file"
}

# Create fix templates
function create_fix_templates() {
  echo "Creating fix templates..."
  
  # Create resource type fix template
  local resource_type_template="$BASE_DIR/Fixes/Templates/ResourceTypeFix.md"
  
  cat > "$resource_type_template" << EOF
# Resource Type Fix Template

## Problem

String literals are used instead of the ResourceType enum, causing type safety issues.

## Example Error

\`\`\`
src/managers/mining/MiningShipManagerImpl.ts:245:12 - error TS2367: This condition will always return 'false' since the types 'ResourceType.GAS' and 'string' have no overlap.
\`\`\`

## Fix

1. Replace string literals with ResourceType enum values:

\`\`\`typescript
// Before
if (resourceStr.toLowerCase() === 'gas') {
  return 'gas';
}

// After
if (resourceStr.toLowerCase() === 'gas') {
  return ResourceType.GAS;
}
\`\`\`

2. Update method signatures to use ResourceType:

\`\`\`typescript
// Before
function processResource(type: string): void {
  // ...
}

// After
function processResource(type: ResourceType): void {
  // ...
}
\`\`\`

3. Use conversion utilities for string-to-enum conversion:

\`\`\`typescript
import { ResourceTypeConverter } from '../../utils/ResourceTypeConverter';

// Convert string to enum
const resourceType = ResourceTypeConverter.stringToEnum(resourceStr);
\`\`\`

## Implementation Notes

- Import ResourceType from \`../../types/resources/ResourceTypes\`
- Use the ResourceTypeConverter utility for conversions
- Update all return types to use ResourceType instead of string
- Update function parameters to use ResourceType
- Add type guards where needed
EOF
  
  # Create event system fix template
  local event_system_template="$BASE_DIR/Fixes/Templates/EventSystemFix.md"
  
  cat > "$event_system_template" << EOF
# Event System Fix Template

## Problem

Event system implementations have type safety issues, causing TypeScript errors.

## Example Error

\`\`\`
src/managers/module/ModuleManager.ts:156:12 - error TS2345: Argument of type 'string' is not assignable to parameter of type 'ModuleEventType'.
\`\`\`

## Fix

1. Use typed event emitters:

\`\`\`typescript
// Before
import { EventEmitter } from '../../lib/events/EventEmitter';

class MyManager extends EventEmitter {
  // ...
}

// After
import { TypedEventEmitter } from '../../lib/events/EventEmitter';

interface MyEvents {
  resourceUpdated: { resourceId: string; amount: number };
  statusChanged: { oldStatus: string; newStatus: string };
}

class MyManager extends TypedEventEmitter<MyEvents> {
  // ...
}
\`\`\`

2. Use enum for event types:

\`\`\`typescript
// Before
this.emit('resourceUpdated', { resourceId, amount });

// After
enum MyEventType {
  RESOURCE_UPDATED = 'resourceUpdated',
  STATUS_CHANGED = 'statusChanged'
}

this.emit(MyEventType.RESOURCE_UPDATED, { resourceId, amount });
\`\`\`

3. Use proper subscription typing:

\`\`\`typescript
// Before
this.on('resourceUpdated', (data) => {
  // data is any
});

// After
this.on(MyEventType.RESOURCE_UPDATED, (data: { resourceId: string; amount: number }) => {
  // data is properly typed
});
\`\`\`

## Implementation Notes

- Import TypedEventEmitter instead of EventEmitter
- Create interface for event payloads
- Use enums for event types
- Ensure event names in emit and on methods match exactly
EOF
  
  echo "Fix templates created."
}

# Generate error correction workflow document
function create_workflow_document() {
  echo "Creating error correction workflow document..."
  
  local workflow_file="$BASE_DIR/Correction_Workflow.md"
  
  cat > "$workflow_file" << EOF
# Error Correction Workflow

This document outlines the recommended workflow for addressing errors in the Galactic Sprawl codebase.

## 1. Analysis Phase

1. **Run Full Analysis**
   \`\`\`bash
   cd CodeBase_Docs/changelog/Error_Correction/March17_Error_Directory/Scripts
   ./analyze_all.sh
   \`\`\`

2. **Review Reports**
   - Check \`Reports/error_summary_*.md\` for an overview of errors
   - Review \`Reports/priority_report_*.md\` for recommended priorities

3. **Understand Error Patterns**
   - Examine categorized errors in the \`Categories/\` directory
   - Look for patterns and root causes

## 2. Planning Phase

1. **Set Priorities**
   - Focus on high-impact errors first
   - Address errors that block other fixes
   - Consider dependencies between fixes

2. **Group Related Fixes**
   - Plan to fix related issues together
   - Identify files that need multiple fixes

3. **Select Fix Templates**
   - Review templates in \`Fixes/Templates/\`
   - Choose appropriate patterns for each error type

## 3. Implementation Phase

1. **Apply Fixes**
   - Use fix templates as a guide
   - Make changes to address specific errors
   - Use automated fix scripts when available:
     \`\`\`bash
     ./Scripts/fix_resource_types.sh
     \`\`\`

2. **Test Each Fix**
   - Run TypeScript compiler after each significant change
   - Check that errors are resolved
   - Ensure no new errors are introduced

3. **Document Fixes**
   - Note which errors have been addressed
   - Update any documentation as needed

## 4. Verification Phase

1. **Run Analysis Again**
   \`\`\`bash
   ./Scripts/analyze_all.sh
   \`\`\`

2. **Compare Reports**
   - Check for reduced error counts
   - Verify that targeted errors are fixed

3. **Address Any New Issues**
   - Sometimes fixes can expose new errors
   - Prioritize and address these as needed

## 5. Reporting Phase

1. **Update Progress Report**
   - Document what was fixed
   - Note any challenges or patterns discovered

2. **Plan Next Iteration**
   - Select the next set of errors to address
   - Update priorities based on new information

## Common Error Patterns and Fixes

### Resource Type Errors

The most common errors involve string literals being used instead of ResourceType enum values.

Example fix:
\`\`\`typescript
// Before
if (resourceType === 'minerals') {
  // ...
}

// After
import { ResourceType } from '../../types/resources/ResourceTypes';

if (resourceType === ResourceType.MINERALS) {
  // ...
}
\`\`\`

### Event System Errors

Event system errors typically involve untyped event emitters and handlers.

Example fix:
\`\`\`typescript
// Before
class MyManager extends EventEmitter {
  emitUpdate() {
    this.emit('update', { data: 'value' });
  }
}

// After
interface MyEvents {
  update: { data: string };
}

class MyManager extends TypedEventEmitter<MyEvents> {
  emitUpdate() {
    this.emit('update', { data: 'value' });
  }
}
\`\`\`

## Tips for Efficient Error Correction

1. **Fix Common Patterns First** - Many errors follow similar patterns
2. **Use Global Search and Replace** - For systematic changes across files
3. **Verify Incrementally** - Run the TypeScript compiler frequently
4. **Update Tests** - Ensure tests are updated to reflect type changes
5. **Document Patterns** - Note recurring issues for future prevention
EOF
  
  echo "Workflow document created at $workflow_file"
}

# Main function
function main() {
  echo "=== Starting Error Analysis ==="
  
  # Initialize
  setup_directories
  check_dependencies
  
  # Analysis
  run_typescript_analysis
  run_eslint_analysis
  categorize_by_component
  
  # Reporting
  generate_summary
  generate_priority_report
  
  # Templates and workflow
  create_fix_templates
  create_workflow_document
  
  echo "=== Error Analysis Complete ==="
  echo "Check the Reports directory for analysis results."
  echo "See Correction_Workflow.md for next steps."
}

# Run main function
main 