#!/bin/bash

# run_full_analysis.sh
#
# Purpose: Run complete code analysis with TypeScript compiler and ESLint
# This script runs both analysis tools and generates unified reports
#
# Usage: ./run_full_analysis.sh [--verbose]
#
# Options:
#   --verbose       Show more detailed output during processing
#
# Created: March 17, 2025

# Set strict mode
set -euo pipefail

# Parse arguments
VERBOSE=""
for arg in "$@"; do
  case $arg in
    --verbose)
      VERBOSE="--verbose"
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
ANALYSIS_DIR="$BASE_DIR/Analysis"
OUTPUT_DIR="$ANALYSIS_DIR/Combined"

# Make sure output directory exists
mkdir -p "$OUTPUT_DIR"

# Get the current date for file naming
DATE_STR=$(date +"%Y-%m-%d")
SUMMARY_FILE="$OUTPUT_DIR/analysis_summary_$DATE_STR.md"

# Set permissions for scripts
chmod +x "$SCRIPT_DIR/analyze_typescript.sh"
chmod +x "$SCRIPT_DIR/analyze_eslint.sh"

# Function to generate a unified summary report
generate_summary_report() {
  echo "Generating unified analysis summary..."
  
  # Count total errors from both analyses
  local ts_errors=$(grep -c "error TS" "$ANALYSIS_DIR/TypeScript/typescript_errors_$DATE_STR.txt" 2>/dev/null || echo "0")
  local eslint_errors=$(grep -c "error" "$ANALYSIS_DIR/ESLint/eslint_errors_$DATE_STR.txt" 2>/dev/null || echo "0")
  local eslint_warnings=$(grep -c "warning" "$ANALYSIS_DIR/ESLint/eslint_errors_$DATE_STR.txt" 2>/dev/null || echo "0")
  
  # Start report file
  cat > "$SUMMARY_FILE" << EOF
# Code Analysis Summary - $DATE_STR

## Overview

This report summarizes the results of both TypeScript and ESLint analysis.

## Error Summary

| Analysis Type | Errors | Warnings |
|--------------|--------|----------|
| TypeScript   | $ts_errors | 0 |
| ESLint       | $eslint_errors | $eslint_warnings |
| **Total**    | $(($ts_errors + $eslint_errors)) | $eslint_warnings |

## TypeScript Error Categories

| Category | Count |
|----------|-------|
| Type Mismatches | $(wc -l < "$ANALYSIS_DIR/TypeScript/type_mismatch_errors.txt" 2>/dev/null || echo "0") |
| Missing Properties | $(wc -l < "$ANALYSIS_DIR/TypeScript/missing_property_errors.txt" 2>/dev/null || echo "0") |
| Unused Variables | $(wc -l < "$ANALYSIS_DIR/TypeScript/unused_variable_errors.txt" 2>/dev/null || echo "0") |
| Null/Undefined | $(wc -l < "$ANALYSIS_DIR/TypeScript/null_undefined_errors.txt" 2>/dev/null || echo "0") |
| Resource Type Issues | $(wc -l < "$ANALYSIS_DIR/TypeScript/resource_type_errors.txt" 2>/dev/null || echo "0") |
| Event System Issues | $(wc -l < "$ANALYSIS_DIR/TypeScript/event_system_errors.txt" 2>/dev/null || echo "0") |
| React Component Issues | $(wc -l < "$ANALYSIS_DIR/TypeScript/react_component_errors.txt" 2>/dev/null || echo "0") |
| Syntax Errors | $(wc -l < "$ANALYSIS_DIR/TypeScript/syntax_errors.txt" 2>/dev/null || echo "0") |

## ESLint Error Categories

| Category | Count |
|----------|-------|
| Unused Variables | $(wc -l < "$ANALYSIS_DIR/ESLint/unused_vars_$DATE_STR.txt" 2>/dev/null || echo "0") |
| Import Errors | $(wc -l < "$ANALYSIS_DIR/ESLint/import_errors_$DATE_STR.txt" 2>/dev/null || echo "0") |
| React Errors | $(wc -l < "$ANALYSIS_DIR/ESLint/react_errors_$DATE_STR.txt" 2>/dev/null || echo "0") |
| TypeScript Errors | $(wc -l < "$ANALYSIS_DIR/ESLint/typescript_errors_$DATE_STR.txt" 2>/dev/null || echo "0") |
| Formatting Errors | $(wc -l < "$ANALYSIS_DIR/ESLint/formatting_errors_$DATE_STR.txt" 2>/dev/null || echo "0") |

## Error Hotspots

The following files have the most errors across both TypeScript and ESLint:

EOF

  # Combine and sort error hotspots
  if [ -f "$ANALYSIS_DIR/TypeScript/error_hotspots.txt" ] || [ -f "$ANALYSIS_DIR/ESLint/eslint_hotspots_$DATE_STR.txt" ]; then
    touch "$OUTPUT_DIR/combined_hotspots.tmp"
    
    if [ -f "$ANALYSIS_DIR/TypeScript/error_hotspots.txt" ]; then
      cat "$ANALYSIS_DIR/TypeScript/error_hotspots.txt" >> "$OUTPUT_DIR/combined_hotspots.tmp"
    fi
    
    if [ -f "$ANALYSIS_DIR/ESLint/eslint_hotspots_$DATE_STR.txt" ]; then
      cat "$ANALYSIS_DIR/ESLint/eslint_hotspots_$DATE_STR.txt" >> "$OUTPUT_DIR/combined_hotspots.tmp"
    fi
    
    sort -nr "$OUTPUT_DIR/combined_hotspots.tmp" | head -n 10 | awk '{print "- " $2 " (" $1 " errors)"}' >> "$SUMMARY_FILE"
    rm "$OUTPUT_DIR/combined_hotspots.tmp"
  else
    echo "No error hotspots found." >> "$SUMMARY_FILE"
  fi

  # Add recommendations
  cat >> "$SUMMARY_FILE" << EOF

## Recommended Fix Strategy

1. **Fix Syntax Errors First**:
   - Address any syntax errors that prevent proper compilation
   - Fix issues with function signatures and parameter types

2. **Resource Type Fixes**:
   - Run fix_resource_types.sh to convert string literals to enums
   - Update function signatures to use ResourceType enum
   - Fix all resource type related errors

3. **Unused Variables Fixes**:
   - Run fix_unused_vars.sh to prefix unused variables with underscore
   - Remove completely unused imports and variables

4. **Address Type Safety Issues**:
   - Fix type mismatches
   - Address null/undefined handling
   - Correct missing property errors

5. **Clean Up React Components**:
   - Fix React component issues
   - Address JSX-related errors
   - Ensure proper prop types

## Available Fix Tools

| Tool | Purpose |
|------|---------|
| fix_resource_types.sh | Converts string literals to ResourceType enum |
| fix_unused_vars.sh | Prefixes unused variables with underscore |

## Detailed Reports

- [TypeScript Error Report](../TypeScript/typescript_error_report_$DATE_STR.md)
- [ESLint Error Report](../ESLint/eslint_error_report_$DATE_STR.md)

EOF

  echo "Unified summary report generated: $SUMMARY_FILE"
}

# Main function
main() {
  echo "=== Running Full Code Analysis ==="
  echo "Output directory: $OUTPUT_DIR"
  
  # Run TypeScript analysis first
  echo -e "\n--- Running TypeScript Analysis ---"
  "$SCRIPT_DIR/analyze_typescript.sh" $VERBOSE || true
  
  # Run ESLint analysis next
  echo -e "\n--- Running ESLint Analysis ---"
  "$SCRIPT_DIR/analyze_eslint.sh" $VERBOSE || true
  
  # Generate unified summary
  generate_summary_report
  
  echo -e "\n=== Analysis Complete ==="
  echo "Check the following reports for details:"
  echo "- TypeScript Analysis: $ANALYSIS_DIR/TypeScript/"
  echo "- ESLint Analysis: $ANALYSIS_DIR/ESLint/"
  echo "- Combined Summary: $SUMMARY_FILE"
  
  # Return success even if analysis found errors
  # This allows the script to complete and generate reports
  exit 0
}

# Run main function
main 