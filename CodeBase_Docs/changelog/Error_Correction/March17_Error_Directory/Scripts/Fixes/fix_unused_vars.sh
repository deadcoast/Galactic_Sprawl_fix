#!/bin/bash

# fix_unused_vars.sh
#
# Purpose: Automatically fix unused variable warnings by prefixing variable names with underscore.
# This is a common TypeScript pattern to indicate that a variable is intentionally unused.
#
# Usage: ./fix_unused_vars.sh [--dry-run] [--target=<file-or-directory>]
#
# Options:
#   --dry-run    Show changes that would be made without actually making them
#   --target     Specify a target file or directory to fix (default: src/)
#
# Created: March 17, 2023
# Author: Claude AI Assistant

# Set strict mode
set -euo pipefail

# Parse arguments
DRY_RUN=false
TARGET_PATH="src/"

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --target=*)
      TARGET_PATH="${arg#*=}"
      shift
      ;;
    *)
      # Unknown option
      ;;
  esac
done

# Define script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# Backup directory
BACKUP_DIR="$BASE_DIR/Fixes/Backups/$(date +"%Y-%m-%d_%H-%M-%S")"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate a report file for changes
REPORT_FILE="$BASE_DIR/Reports/fixes/unused_vars_fixes_$(date +"%Y-%m-%d_%H-%M-%S").md"
mkdir -p "$(dirname "$REPORT_FILE")"

# Initialize report file
cat > "$REPORT_FILE" << EOF
# Unused Variables Fixes - $(date +"%Y-%m-%d %H:%M:%S")

## Overview

This report documents unused variables that have been prefixed with underscore
to silence TypeScript/ESLint warnings.

## Files Changed

EOF

# First run ESLint to find all unused variables
find_unused_variables() {
  local target="$1"
  local output_file="$BASE_DIR/Analysis/ESLint/unused_vars_$(date +"%Y-%m-%d").txt"
  
  echo "Finding unused variables in $target..."
  mkdir -p "$(dirname "$output_file")"
  
  # Run ESLint with the unused-vars rule
  npx eslint --ext .ts,.tsx "$target" --no-eslintrc -c /dev/null \
    --parser "@typescript-eslint/parser" \
    --plugin "@typescript-eslint" \
    --rule '{"@typescript-eslint/no-unused-vars": "error"}' > "$output_file" 2>&1 || true
  
  echo "Found $(grep -c "@typescript-eslint/no-unused-vars" "$output_file" || echo "0") unused variables."
  echo "Results saved to $output_file"
  
  # Return the path to the output file
  echo "$output_file"
}

# Parse the ESLint output to extract unused variable names and their locations
parse_eslint_output() {
  local eslint_output="$1"
  local parsed_output="$BASE_DIR/Analysis/ESLint/parsed_unused_vars_$(date +"%Y-%m-%d").txt"
  
  echo "Parsing ESLint output..."
  
  # Extract the variable name and location
  grep "@typescript-eslint/no-unused-vars" "$eslint_output" | \
    sed -E 's/.*([0-9]+:[0-9]+).*'\''([a-zA-Z0-9_]+)'\'' .*/\1:\2/' > "$parsed_output"
  
  echo "Parsed $(wc -l < "$parsed_output") unused variables."
  
  # Return the path to the parsed output
  echo "$parsed_output"
}

# Fix a single file
fix_file() {
  local file="$1"
  local parsed_output="$2"
  local fixed_count=0
  
  echo "Processing $file..."
  
  # Create a backup
  cp "$file" "$BACKUP_DIR/$(basename "$file")"
  
  # Get all unused variables in this file
  local file_vars=$(grep "^$file:" "$parsed_output" || echo "")
  
  if [ -z "$file_vars" ]; then
    echo "No unused variables found in $file"
    return 0
  fi
  
  # Process each unused variable
  echo "$file_vars" | while read -r line; do
    # Extract line number and variable name
    local file_path=$(echo "$line" | cut -d: -f1)
    local line_num=$(echo "$line" | cut -d: -f2)
    local col_num=$(echo "$line" | cut -d: -f3)
    local var_name=$(echo "$line" | cut -d: -f4)
    
    # Skip if the variable already starts with underscore
    if [[ "$var_name" == _* ]]; then
      continue
    fi
    
    # Generate the new variable name
    local new_var_name="_$var_name"
    
    if [ "$DRY_RUN" = true ]; then
      echo "[DRY RUN] Would rename $var_name to $new_var_name at $file_path:$line_num:$col_num"
    else
      # Get the line content
      local line_content=$(sed -n "${line_num}p" "$file_path")
      
      # Replace the variable name, being careful to match whole words only
      local new_line_content=$(echo "$line_content" | sed -E "s/\b$var_name\b/$new_var_name/g")
      
      # Apply the change
      local temp_file=$(mktemp)
      sed "${line_num}s/.*/$new_line_content/" "$file_path" > "$temp_file"
      mv "$temp_file" "$file_path"
      
      # Add to report
      echo "- $file_path:$line_num: Renamed $var_name to $new_var_name" >> "$REPORT_FILE"
      
      # Count fixes
      ((fixed_count++))
    fi
  done
  
  if [ "$fixed_count" -gt 0 ]; then
    echo "Fixed $fixed_count unused variables in $file"
  fi
  
  return 0
}

# Process all TypeScript files in a directory
process_directory() {
  local dir="$1"
  local parsed_output="$2"
  
  echo "Processing directory $dir..."
  
  # Find all TypeScript files with unused variables
  local files=$(grep -o "^[^:]*" "$parsed_output" | sort | uniq)
  
  if [ -z "$files" ]; then
    echo "No files with unused variables found in $dir"
    return 0
  fi
  
  # Process each file
  echo "$files" | while read -r file; do
    if [[ "$file" == $dir* ]]; then
      fix_file "$file" "$parsed_output"
    fi
  done
  
  return 0
}

# Process a single TypeScript file
process_file() {
  local file="$1"
  local parsed_output="$2"
  
  # Check if the file exists
  if [ ! -f "$file" ]; then
    echo "Error: File not found: $file"
    return 1
  fi
  
  # Skip if not a TypeScript file
  if [[ ! "$file" =~ \.(ts|tsx)$ ]]; then
    echo "Skipping non-TypeScript file: $file"
    return 0
  fi
  
  # Fix the file
  fix_file "$file" "$parsed_output"
  
  return 0
}

# Main function
main() {
  echo "=== Unused Variables Fix Script ==="
  
  if [ "$DRY_RUN" = true ]; then
    echo "Running in DRY RUN mode. No changes will be made."
  fi
  
  echo "Target: $TARGET_PATH"
  echo "Backup directory: $BACKUP_DIR"
  
  # Find unused variables
  local eslint_output=$(find_unused_variables "$TARGET_PATH")
  
  # Parse ESLint output
  local parsed_output=$(parse_eslint_output "$eslint_output")
  
  # Check if we found any unused variables
  if [ ! -s "$parsed_output" ]; then
    echo "No unused variables found. Nothing to fix."
    exit 0
  fi
  
  # Process target path
  if [ -f "$TARGET_PATH" ]; then
    # Single file
    process_file "$TARGET_PATH" "$parsed_output"
  elif [ -d "$TARGET_PATH" ]; then
    # Directory
    process_directory "$TARGET_PATH" "$parsed_output"
  else
    echo "Error: Target path not found: $TARGET_PATH"
    exit 1
  fi
  
  # Add summary to report
  if [ "$DRY_RUN" = false ]; then
    # Count total variables fixed
    local total_vars=$(grep -c "^- " "$REPORT_FILE" || echo "0")
    local total_files=$(grep "^- " "$REPORT_FILE" | cut -d: -f1 | sort | uniq | wc -l)
    
    # Add summary to report
    cat >> "$REPORT_FILE" << EOF

## Summary

- Total variables fixed: $total_vars
- Total files modified: $total_files
- Backup location: $BACKUP_DIR

## Next Steps

1. Rebuild the project to verify the changes: \`npm run build\`
2. Run ESLint again to check for remaining unused variable warnings: \`npx eslint --ext .ts,.tsx src/\`
3. For functional parameters that come from React or other libraries and cannot be renamed, consider using:
   \`\`\`typescript
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   function Component({ unusedProp }) {
     // ...
   }
   \`\`\`
EOF
    
    echo "Fixes complete. Report saved to: $REPORT_FILE"
  else
    echo "Dry run complete. No changes were made."
  fi
  
  echo "=== Unused Variables Fix Script Complete ==="
}

# Run main function
main 