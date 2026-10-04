#!/bin/bash

# analyze_eslint.sh
#
# Purpose: Run ESLint and perform detailed analysis on JavaScript/TypeScript linting errors.
# This script identifies patterns in ESLint errors and categorizes them for easier fixing.
#
# Usage: ./analyze_eslint.sh [--verbose] [--output-dir=<dir>]
#
# Options:
#   --verbose       Show more detailed output during processing
#   --output-dir    Specify an alternative output directory (default: ../Analysis/ESLint)
#
# Created: March 17, 2025

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
  OUTPUT_DIR="$BASE_DIR/Analysis/ESLint"
fi

# Make sure output directory exists
mkdir -p "$OUTPUT_DIR"

# Get the current date for file naming
DATE_STR=$(date +"%Y-%m-%d")
ESLINT_ERROR_FILE="$OUTPUT_DIR/eslint_errors_$DATE_STR.txt"
ESLINT_JSON_FILE="$OUTPUT_DIR/eslint_errors_$DATE_STR.json"

# Function to log verbose messages
log_verbose() {
  if [ "$VERBOSE" = true ]; then
    echo "[VERBOSE] $1"
  fi
}

# Check if ESLint is available
check_eslint() {
  if ! command -v npx eslint &> /dev/null; then
    echo "Error: ESLint not found. Please make sure it's installed."
    echo "Try running: npm install eslint --save-dev"
    exit 1
  fi
}

# Run ESLint analysis
run_eslint_analysis() {
  echo "Running ESLint analysis..."
  
  # Run ESLint in JSON format and save output
  npx eslint --ext .js,.jsx,.ts,.tsx --format json /Users/deadcoast/CursorProjects/Galactic_Sprawl/src > "$ESLINT_JSON_FILE" 2>/dev/null || true
  
  # Also save a readable version
  npx eslint --ext .js,.jsx,.ts,.tsx /Users/deadcoast/CursorProjects/Galactic_Sprawl/src > "$ESLINT_ERROR_FILE" 2>/dev/null || true
  
  # Count errors
  local error_count=$(grep -c "error" "$ESLINT_ERROR_FILE" || echo "0")
  echo "Found $error_count ESLint errors/warnings."
  
  log_verbose "Error file saved to: $ESLINT_ERROR_FILE"
  log_verbose "JSON report saved to: $ESLINT_JSON_FILE"
  
  return 0
}

# Extract different types of errors into separate files
categorize_errors() {
  echo "Categorizing ESLint errors..."
  
  # Unused variables
  log_verbose "Extracting unused variable errors..."
  grep -E "'.*' is defined but never used" "$ESLINT_ERROR_FILE" > "$OUTPUT_DIR/unused_vars_$DATE_STR.txt" || true
  local count=$(wc -l < "$OUTPUT_DIR/unused_vars_$DATE_STR.txt" || echo "0")
  echo "- Unused variables: $count"
  
  # Import errors
  log_verbose "Extracting import errors..."
  grep -E "import/|Unable to resolve path to module" "$ESLINT_ERROR_FILE" > "$OUTPUT_DIR/import_errors_$DATE_STR.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/import_errors_$DATE_STR.txt" || echo "0")
  echo "- Import errors: $count"
  
  # React errors
  log_verbose "Extracting React errors..."
  grep -E "react/|jsx-" "$ESLINT_ERROR_FILE" > "$OUTPUT_DIR/react_errors_$DATE_STR.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/react_errors_$DATE_STR.txt" || echo "0")
  echo "- React errors: $count"
  
  # TypeScript-specific errors
  log_verbose "Extracting TypeScript errors..."
  grep -E "@typescript-eslint/" "$ESLINT_ERROR_FILE" > "$OUTPUT_DIR/typescript_errors_$DATE_STR.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/typescript_errors_$DATE_STR.txt" || echo "0")
  echo "- TypeScript-specific errors: $count"
  
  # Formatting errors
  log_verbose "Extracting formatting errors..."
  grep -E "indent|linebreak|quotes|semi|spacing|formatting" "$ESLINT_ERROR_FILE" > "$OUTPUT_DIR/formatting_errors_$DATE_STR.txt" || true
  count=$(wc -l < "$OUTPUT_DIR/formatting_errors_$DATE_STR.txt" || echo "0")
  echo "- Formatting errors: $count"
  
  echo "Error categorization complete."
}

# Find files with the most errors
find_error_hotspots() {
  echo "Finding error hotspots..."
  
  # Extract filenames from error output and count occurrences
  grep -oE "/.*\.(js|jsx|ts|tsx):" "$ESLINT_ERROR_FILE" | sort | uniq -c | sort -nr > "$OUTPUT_DIR/eslint_hotspots_$DATE_STR.txt"
  
  # Display top 10 files with most errors
  if [ -s "$OUTPUT_DIR/eslint_hotspots_$DATE_STR.txt" ]; then
    echo "Top 10 files with most ESLint errors:"
    head -n 10 "$OUTPUT_DIR/eslint_hotspots_$DATE_STR.txt"
  else
    echo "No error hotspots found."
  fi
  
  echo "Hotspot analysis complete. Full list in: $OUTPUT_DIR/eslint_hotspots_$DATE_STR.txt"
}

# Find common error rules
analyze_error_rules() {
  echo "Analyzing error rules..."
  
  # Extract error rule IDs and count occurrences
  grep -o "[a-z/-]*" "$ESLINT_ERROR_FILE" | grep -E "^[a-z]" | sort | uniq -c | sort -nr > "$OUTPUT_DIR/eslint_rule_frequency_$DATE_STR.txt"
  
  # Display top 10 error rules
  if [ -s "$OUTPUT_DIR/eslint_rule_frequency_$DATE_STR.txt" ]; then
    echo "Top 10 most frequent ESLint rules:"
    head -n 10 "$OUTPUT_DIR/eslint_rule_frequency_$DATE_STR.txt"
  else
    echo "No error rules found."
  fi
  
  echo "Error rule analysis complete. Full list in: $OUTPUT_DIR/eslint_rule_frequency_$DATE_STR.txt"
}

# Generate comprehensive error report
generate_error_report() {
  echo "Generating error report..."
  
  local report_file="$OUTPUT_DIR/eslint_error_report_$DATE_STR.md"
  
  # Start report file
  cat > "$report_file" << EOF
# ESLint Error Analysis Report - $DATE_STR

## Overview

This report provides a detailed analysis of ESLint errors in the codebase.

## Error Summary

Total ESLint errors/warnings: $(grep -c "error\|warning" "$ESLINT_ERROR_FILE" || echo "0")

## Error Categories

| Category | Count |
|----------|-------|
| Unused Variables | $(wc -l < "$OUTPUT_DIR/unused_vars_$DATE_STR.txt" || echo "0") |
| Import Errors | $(wc -l < "$OUTPUT_DIR/import_errors_$DATE_STR.txt" || echo "0") |
| React Errors | $(wc -l < "$OUTPUT_DIR/react_errors_$DATE_STR.txt" || echo "0") |
| TypeScript Errors | $(wc -l < "$OUTPUT_DIR/typescript_errors_$DATE_STR.txt" || echo "0") |
| Formatting Errors | $(wc -l < "$OUTPUT_DIR/formatting_errors_$DATE_STR.txt" || echo "0") |
EOF

  # Add error rule frequency
  if [ -s "$OUTPUT_DIR/eslint_rule_frequency_$DATE_STR.txt" ]; then
    cat >> "$report_file" << EOF

## Top Error Rules

$(head -n 5 "$OUTPUT_DIR/eslint_rule_frequency_$DATE_STR.txt" | awk '{ print "- " $2 " (" $1 " occurrences)" }')
EOF
  fi

  # Add error hotspots
  if [ -s "$OUTPUT_DIR/eslint_hotspots_$DATE_STR.txt" ]; then
    cat >> "$report_file" << EOF

## Error Hotspots

The following files have the most ESLint errors:

$(head -n 5 "$OUTPUT_DIR/eslint_hotspots_$DATE_STR.txt" | awk '{ print "- " $2 " (" $1 " errors)" }')
EOF
  fi

  # Add code samples for each category
  cat >> "$report_file" << EOF

## Common Error Patterns

### Unused Variables

\`\`\`
$(head -n 3 "$OUTPUT_DIR/unused_vars_$DATE_STR.txt" 2>/dev/null || echo "No unused variable errors found.")
\`\`\`

### Import Errors

\`\`\`
$(head -n 3 "$OUTPUT_DIR/import_errors_$DATE_STR.txt" 2>/dev/null || echo "No import errors found.")
\`\`\`

### React Errors

\`\`\`
$(head -n 3 "$OUTPUT_DIR/react_errors_$DATE_STR.txt" 2>/dev/null || echo "No React errors found.")
\`\`\`

## Recommended Fixes

1. **Unused Variables**:
   - Remove unused variables or prefix with underscore
   - Use the fix_unused_vars.sh script to automatically fix

2. **Import Fixes**:
   - Fix import paths
   - Remove unused imports
   - Use proper import syntax

3. **React Component Fixes**:
   - Follow React best practices
   - Define proper prop types
   - Fix component structure issues

4. **Code Formatting**:
   - Use Prettier to automatically format code
   - Follow consistent indentation rules
   - Apply proper spacing and line breaks

## Next Steps

1. Run fix_unused_vars.sh to fix unused variable issues
2. Address import and path resolution issues
3. Fix React component issues
4. Apply auto-formatting with Prettier
EOF
  
  echo "Error report generated: $report_file"
}

# Main function
main() {
  echo "=== ESLint Error Analysis ==="
  echo "Output directory: $OUTPUT_DIR"
  
  # Check dependencies
  check_eslint
  
  # Run analysis
  run_eslint_analysis
  
  # Process results
  categorize_errors
  find_error_hotspots
  analyze_error_rules
  generate_error_report
  
  echo "=== Analysis Complete ==="
  echo "Check $OUTPUT_DIR for detailed error reports."
  
  # Set exit code to 0 even if ESLint found errors
  # This allows the script to complete and generate reports
  exit 0
}

# Run main function
main 