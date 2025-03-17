#!/bin/bash

# analyze_typescript.sh
#
# Purpose: Run TypeScript compiler and perform detailed analysis on TypeScript errors.
# This script identifies patterns in TypeScript errors and categorizes them for easier fixing.
#
# Usage: ./analyze_typescript.sh [--verbose] [--output-dir=<dir>]
#
# Options:
#   --verbose       Show more detailed output during processing
#   --output-dir    Specify an alternative output directory (default: ../Analysis/TypeScript)
#
# Created: March 17, 2023
# Author: Claude AI Assistant

# Set strict mode
set -euo pipefail

# Parse arguments
VERBOSE=false
OUTPUT_DIR=""

for arg in "$@"; do
  case $arg in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --output-dir=*)
      OUTPUT_DIR="${arg#*=}"
      shift
      ;;
    *)
      # Unknown option
      ;;
  esac
done

# Define script directory and base directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# Set default output directory if not specified
if [ -z "$OUTPUT_DIR" ]; then
  OUTPUT_DIR="$BASE_DIR/Analysis/TypeScript"
fi

# Make sure output directory exists
mkdir -p "$OUTPUT_DIR"

# Get the current date for file naming
DATE_STR=$(date +"%Y-%m-%d")
TS_ERROR_FILE="$OUTPUT_DIR/typescript_errors_$DATE_STR.txt"

# Function to log verbose messages
log_verbose() {
  if [ "$VERBOSE" = true ]; then
    echo "[VERBOSE] $1"
  fi
}

# Run TypeScript analysis
run_typescript_analysis() {
  echo "Running TypeScript compiler analysis..."
  
  # Run TypeScript check and save output
  npx tsc --noEmit --pretty false > "$TS_ERROR_FILE" 2>&1 || true
  
  # Count errors
  local error_count=$(grep -c "error TS" "$TS_ERROR_FILE" || echo "0")
  echo "Found $error_count TypeScript errors."
  
  log_verbose "Error file saved to: $TS_ERROR_FILE"
  
  return 0
}

# Extract different types of errors into separate files
categorize_errors() {
  echo "Categorizing TypeScript errors..."
  
  # Type mismatch errors
  log_verbose "Extracting type mismatch errors..."
  grep "is not assignable to" "$TS_ERROR_FILE" > "$OUTPUT_DIR/type_mismatch_errors.txt" || true
  local count=$(wc -l < "$OUTPUT_DIR/type_mismatch_errors.txt" || echo "0")
  echo "- Type mismatch errors: $count"
  
  # Missing property errors
  log_verbose "Extracting missing property errors..."
  grep "Property '.*' does not exist on type" "$TS_ERROR_FILE" > "$OUTPUT_DIR/missing_property_errors.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/missing_property_errors.txt" || echo "0")
  echo "- Missing property errors: $count"
  
  # Unused variable errors
  log_verbose "Extracting unused variable errors..."
  grep "is declared but" "$TS_ERROR_FILE" > "$OUTPUT_DIR/unused_variable_errors.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/unused_variable_errors.txt" || echo "0")
  echo "- Unused variable errors: $count"
  
  # Null/undefined errors
  log_verbose "Extracting null/undefined errors..."
  grep -E "null|undefined" "$TS_ERROR_FILE" > "$OUTPUT_DIR/null_undefined_errors.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/null_undefined_errors.txt" || echo "0")
  echo "- Null/undefined errors: $count"
  
  # Resource type errors (specific to this project)
  log_verbose "Extracting ResourceType errors..."
  grep -E "ResourceType|resource type" "$TS_ERROR_FILE" > "$OUTPUT_DIR/resource_type_errors.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/resource_type_errors.txt" || echo "0")
  echo "- Resource type errors: $count"
  
  # Event system errors (specific to this project)
  log_verbose "Extracting event system errors..."
  grep -E "EventEmitter|event|subscribe" "$TS_ERROR_FILE" > "$OUTPUT_DIR/event_system_errors.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/event_system_errors.txt" || echo "0")
  echo "- Event system errors: $count"
  
  # React component errors (specific to this project)
  log_verbose "Extracting React component errors..."
  grep -E "React|Component|Props|JSX" "$TS_ERROR_FILE" > "$OUTPUT_DIR/react_component_errors.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/react_component_errors.txt" || echo "0")
  echo "- React component errors: $count"
  
  # Syntax errors
  log_verbose "Extracting syntax errors..."
  grep -E "TS1005|TS1128|TS1109|TS1003|TS1435|TS1068" "$TS_ERROR_FILE" > "$OUTPUT_DIR/syntax_errors.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/syntax_errors.txt" || echo "0")
  echo "- Syntax errors: $count"
  
  echo "Error categorization complete."
}

# Find files with the most errors
find_error_hotspots() {
  echo "Finding error hotspots..."
  
  # Extract filenames from error output
  grep -o "[^ ]*\.tsx\?:[0-9]*:[0-9]*" "$TS_ERROR_FILE" | cut -d':' -f1 | sort | uniq -c | sort -nr > "$OUTPUT_DIR/error_hotspots.txt"
  
  # Display top 10 files with most errors
  if [ -s "$OUTPUT_DIR/error_hotspots.txt" ]; then
    echo "Top 10 files with most errors:"
    head -n 10 "$OUTPUT_DIR/error_hotspots.txt"
  else
    echo "No error hotspots found."
  fi
  
  echo "Hotspot analysis complete. Full list in: $OUTPUT_DIR/error_hotspots.txt"
}

# Find common error codes
analyze_error_codes() {
  echo "Analyzing error codes..."
  
  # Extract error codes and count occurrences
  grep -o "TS[0-9]*" "$TS_ERROR_FILE" | sort | uniq -c | sort -nr > "$OUTPUT_DIR/error_code_frequency.txt"
  
  # Display top 10 error codes
  if [ -s "$OUTPUT_DIR/error_code_frequency.txt" ]; then
    echo "Top 10 most frequent error codes:"
    head -n 10 "$OUTPUT_DIR/error_code_frequency.txt"
  else
    echo "No error codes found."
  fi
  
  echo "Error code analysis complete. Full list in: $OUTPUT_DIR/error_code_frequency.txt"
}

# Generate comprehensive error report
generate_error_report() {
  echo "Generating error report..."
  
  local report_file="$OUTPUT_DIR/typescript_error_report_$DATE_STR.md"
  
  # Start report file
  cat > "$report_file" << EOF
# TypeScript Error Analysis Report - $DATE_STR

## Overview

This report provides a detailed analysis of TypeScript errors in the codebase.

## Error Summary

Total TypeScript errors: $(grep -c "error TS" "$TS_ERROR_FILE" || echo "0")

## Error Categories

| Category | Count |
|----------|-------|
| Type Mismatches | $(wc -l < "$OUTPUT_DIR/type_mismatch_errors.txt" || echo "0") |
| Missing Properties | $(wc -l < "$OUTPUT_DIR/missing_property_errors.txt" || echo "0") |
| Unused Variables | $(wc -l < "$OUTPUT_DIR/unused_variable_errors.txt" || echo "0") |
| Null/Undefined | $(wc -l < "$OUTPUT_DIR/null_undefined_errors.txt" || echo "0") |
| Resource Type Issues | $(wc -l < "$OUTPUT_DIR/resource_type_errors.txt" || echo "0") |
| Event System Issues | $(wc -l < "$OUTPUT_DIR/event_system_errors.txt" || echo "0") |
| React Component Issues | $(wc -l < "$OUTPUT_DIR/react_component_errors.txt" || echo "0") |
| Syntax Errors | $(wc -l < "$OUTPUT_DIR/syntax_errors.txt" || echo "0") |
EOF

  # Add error code frequency
  if [ -s "$OUTPUT_DIR/error_code_frequency.txt" ]; then
    cat >> "$report_file" << EOF

## Top Error Codes

$(head -n 5 "$OUTPUT_DIR/error_code_frequency.txt" | awk '{ print "- " $2 " (" $1 " occurrences)" }')
EOF
  fi

  # Add error hotspots
  if [ -s "$OUTPUT_DIR/error_hotspots.txt" ]; then
    cat >> "$report_file" << EOF

## Error Hotspots

The following files have the most TypeScript errors:

$(head -n 5 "$OUTPUT_DIR/error_hotspots.txt" | awk '{ print "- " $2 " (" $1 " errors)" }')
EOF
  fi

  # Add code samples for each category
  cat >> "$report_file" << EOF

## Common Error Patterns

### Resource Type Issues

The ResourceType enum is not consistently used throughout the codebase:

\`\`\`
$(head -n 3 "$OUTPUT_DIR/resource_type_errors.txt" 2>/dev/null || echo "No resource type errors found.")
\`\`\`

### Event System Issues

Event emitter typing issues are common:

\`\`\`
$(head -n 3 "$OUTPUT_DIR/event_system_errors.txt" 2>/dev/null || echo "No event system errors found.")
\`\`\`

### Type Mismatch Issues

Type compatibility problems are prevalent:

\`\`\`
$(head -n 3 "$OUTPUT_DIR/type_mismatch_errors.txt" 2>/dev/null || echo "No type mismatch errors found.")
\`\`\`

## Recommended Fixes

1. **ResourceType Fixes**:
   - Replace string literals with ResourceType enum
   - Update function signatures to use ResourceType
   - Create proper type guards for resource type checking

2. **Event System Fixes**:
   - Implement typed event emitters
   - Add proper interfaces for event payload types
   - Use event type enums instead of string literals

3. **React Component Fixes**:
   - Define proper prop interfaces
   - Add default prop values
   - Fix component typing

4. **General Type Safety**:
   - Add null/undefined checks
   - Fix missing property access
   - Address type mismatches

## Next Steps

1. Focus on fixing resource type issues first
2. Address event system typing next
3. Fix component prop types
4. Handle general type safety issues
EOF
  
  echo "Error report generated: $report_file"
}

# Main function
main() {
  echo "=== TypeScript Error Analysis ==="
  echo "Output directory: $OUTPUT_DIR"
  
  # Run analysis
  run_typescript_analysis
  
  # Process results
  categorize_errors
  find_error_hotspots
  analyze_error_codes
  generate_error_report
  
  echo "=== Analysis Complete ==="
  echo "Check $OUTPUT_DIR for detailed error reports."
}

# Run main function
main 