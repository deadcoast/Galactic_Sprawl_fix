#!/bin/bash

# fix_null_safety.sh
#
# Purpose: Automatically fix common null/undefined safety issues in TypeScript code:
#   1. Add optional chaining (?.) for potentially null objects
#   2. Add nullish coalescing (??) for default values
#   3. Add null checks before property access
#   4. Add non-null assertions where appropriate
#
# Usage: ./fix_null_safety.sh [--dry-run] [--target=<file-or-directory>]
#
# Options:
#   --dry-run    Show changes that would be made without actually making them
#   --target     Specify a target file or directory to fix (default: src/)
#
# Created: Based on Future_Advancements.md tasklist

# Set strict mode
set -euo pipefail

# Parse arguments
DRY_RUN=false
TARGET="src/"

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    --target=*)
      TARGET="${arg#*=}"
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: ./fix_null_safety.sh [--dry-run] [--target=<file-or-directory>]"
      exit 1
      ;;
  esac
done

# Make sure the target exists
if [ ! -e "$TARGET" ]; then
  echo "Error: Target not found: $TARGET"
  exit 1
fi

# Create backup directory
BACKUP_DIR="../Fixes/Backups/$(date +"%Y-%m-%d_%H-%M-%S")"
mkdir -p "$BACKUP_DIR"

echo "=== Null Safety Fix Script ==="
if [ "$DRY_RUN" = true ]; then
  echo "Running in DRY RUN mode. No changes will be made."
fi
echo "Target: $TARGET"
echo "Backup directory: $BACKUP_DIR"

# Function to fix null safety issues in a file
fix_null_safety() {
  local file="$1"
  
  echo "Processing $file..."
  
  # Make a backup copy of the file
  cp "$file" "$BACKUP_DIR/$(basename "$file")"
  
  # Add optional chaining
  add_optional_chaining "$file"
  
  # Add nullish coalescing
  add_nullish_coalescing "$file"
  
  # Add null checks
  add_null_checks "$file"
  
  # Add non-null assertions
  add_non_null_assertions "$file"
}

# Function to add optional chaining operators (?.)
add_optional_chaining() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would add optional chaining operators"
    return
  fi
  
  # Find property access that might need optional chaining
  # First look for null/undefined checks followed by property access
  local null_checks=$(grep -n -E "if\s*\(\s*[a-zA-Z0-9_\.]+\s*(!==?|===?)\s*(null|undefined)" "$file")
  
  if [ -n "$null_checks" ]; then
    echo "$null_checks" | while read -r line_info; do
      # Get the line number and content
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract the variable being checked
      local var_name=$(echo "$content" | grep -oE "[a-zA-Z0-9_\.]+\s*(!==?|===?)\s*(null|undefined)" | grep -oE "^[a-zA-Z0-9_\.]+" | head -1)
      
      # Find the if-block to locate property accesses
      local start_line=$line
      local end_line=$(grep -n -E "^[[:space:]]*}\s*(else|catch)?" "$file" | awk -v start="$start_line" '$1 > start {print $1; exit}' | cut -d: -f1)
      
      if [ -n "$end_line" ]; then
        local if_block=$(sed -n "$((start_line+1)),$((end_line-1))p" "$file")
        
        # Check for property access without optional chaining
        if echo "$if_block" | grep -q "$var_name\.[a-zA-Z0-9_]"; then
          # Get all unique property accesses
          local properties=$(echo "$if_block" | grep -oE "$var_name\.[a-zA-Z0-9_]+" | sort | uniq)
          
          # Replace property access with optional chaining in the whole file
          echo "$properties" | while read -r prop; do
            local base_var=$(echo "$prop" | cut -d. -f1)
            local property=$(echo "$prop" | cut -d. -f2-)
            
            # Don't add optional chaining if already present
            if ! grep -q "$base_var?\\.$property" "$file"; then
              echo "Adding optional chaining to $prop"
              local temp_file=$(mktemp)
              # Match exact pattern to avoid partial matches
              sed -E "s/([^\.a-zA-Z0-9_])($base_var)\.($property)([^a-zA-Z0-9_])/\1\2?.\3\4/g" "$file" > "$temp_file"
              mv "$temp_file" "$file"
            fi
          done
        fi
      fi
    done
  fi
  
  # Find property access on parameters that are optional
  local optional_params=$(grep -n -E "function [a-zA-Z0-9_]+\([^)]*\?\s*:" "$file")
  
  if [ -n "$optional_params" ]; then
    echo "$optional_params" | while read -r line_info; do
      # Get the line number and content
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract optional parameter names
      local params=$(echo "$content" | grep -oE "[a-zA-Z0-9_]+\?\s*:" | cut -d? -f1)
      
      for param in $params; do
        # Find the function body to locate property accesses
        local start_line=$line
        local end_line=$(grep -n "^[[:space:]]*}" "$file" | awk -v start="$start_line" '$1 > start {print $1; exit}' | cut -d: -f1)
        
        if [ -n "$end_line" ]; then
          local function_body=$(sed -n "$((start_line+1)),$((end_line-1))p" "$file")
          
          # Check for property access without optional chaining
          if echo "$function_body" | grep -q "$param\.[a-zA-Z0-9_]"; then
            # Get all unique property accesses
            local properties=$(echo "$function_body" | grep -oE "$param\.[a-zA-Z0-9_]+" | sort | uniq)
            
            # Replace property access with optional chaining in the function body
            echo "$properties" | while read -r prop; do
              local property=$(echo "$prop" | cut -d. -f2-)
              
              # Don't add optional chaining if already present
              if ! grep -n -E "$param\?\.$property" "$file" | awk -v start="$start_line" -v end="$end_line" '$1 >= start && $1 <= end' | grep -q .; then
                echo "Adding optional chaining to $prop for optional parameter"
                local temp_file=$(mktemp)
                # Only replace in the function body
                sed -i "$((start_line+1)),$((end_line-1))s/$param\\.$property/$param?.$property/g" "$file"
              fi
            done
          fi
        fi
      done
    done
  fi
  
  # Find properties access on variables that might be null based on types
  local nullable_types=$(grep -n -E ":\s*([A-Z][a-zA-Z0-9_]+|string|number|boolean)\s*\|\s*(null|undefined)" "$file")
  
  if [ -n "$nullable_types" ]; then
    echo "$nullable_types" | while read -r line_info; do
      # Get the line number and content
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract variable name
      local var_name=$(echo "$content" | grep -oE "[a-zA-Z0-9_]+\s*:" | cut -d: -f1 | xargs)
      
      if [ -n "$var_name" ]; then
        # Find all property accesses on this variable in the file
        local accesses=$(grep -n -E "$var_name\.[a-zA-Z0-9_]+" "$file" | grep -v "$var_name\\?\\.")
        
        if [ -n "$accesses" ]; then
          echo "$accesses" | while read -r access_info; do
            local access_line=$(echo "$access_info" | cut -d: -f1)
            local access_content=$(echo "$access_info" | cut -d: -f2-)
            
            # Extract the full property access
            local property_access=$(echo "$access_content" | grep -oE "$var_name\.[a-zA-Z0-9_]+")
            
            if [ -n "$property_access" ]; then
              local property=$(echo "$property_access" | cut -d. -f2-)
              
              echo "Adding optional chaining to $property_access for nullable type"
              local temp_file=$(mktemp)
              # Only replace this specific occurrence
              sed "${access_line}s/$var_name\\.$property/$var_name?.$property/g" "$file" > "$temp_file"
              mv "$temp_file" "$file"
            fi
          done
        fi
      fi
    done
  fi
}

# Function to add nullish coalescing operators (??) for default values
add_nullish_coalescing() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would add nullish coalescing operators"
    return
  fi
  
  # Find common patterns for default value assignment
  # Pattern 1: var = something || defaultValue
  local or_defaults=$(grep -n -E "[a-zA-Z0-9_\.]+\s*=\s*[a-zA-Z0-9_\.]+\s*\|\|\s*" "$file")
  
  if [ -n "$or_defaults" ]; then
    echo "$or_defaults" | while read -r line_info; do
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract the pattern
      local pattern=$(echo "$content" | grep -oE "[a-zA-Z0-9_\.]+\s*=\s*[a-zA-Z0-9_\.]+\s*\|\|")
      
      if [ -n "$pattern" ]; then
        echo "Replacing || with ?? for default value at line $line"
        local temp_file=$(mktemp)
        sed "${line}s/||/??/g" "$file" > "$temp_file"
        mv "$temp_file" "$file"
      fi
    done
  fi
  
  # Pattern 2: ternary checking for null/undefined
  local null_ternaries=$(grep -n -E "[a-zA-Z0-9_\.]+\s*===?\s*(null|undefined)\s*\?\s*[^:]+\s*:\s*[a-zA-Z0-9_\.]+" "$file")
  
  if [ -n "$null_ternaries" ]; then
    echo "$null_ternaries" | while read -r line_info; do
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract the variable and its default
      local var_check=$(echo "$content" | grep -oE "[a-zA-Z0-9_\.]+\s*===?\s*(null|undefined)")
      local var_name=$(echo "$var_check" | grep -oE "^[a-zA-Z0-9_\.]+")
      local default_value=$(echo "$content" | grep -oE ":\s*[a-zA-Z0-9_\.]+" | cut -d: -f2 | xargs)
      
      if [ -n "$var_name" ] && [ -n "$default_value" ]; then
        echo "Replacing null check ternary with ?? for $var_name at line $line"
        local temp_file=$(mktemp)
        sed "${line}s/$var_name\s*===?\s*(null|undefined)\s*?\s*[^:]\+\s*:\s*$default_value/$var_name ?? $default_value/g" "$file" > "$temp_file"
        mv "$temp_file" "$file"
      fi
    done
  fi
  
  # Pattern 3: const value = obj && obj.property
  local and_property=$(grep -n -E "=\s*[a-zA-Z0-9_\.]+\s*&&\s*[a-zA-Z0-9_\.]+\.[a-zA-Z0-9_]+" "$file")
  
  if [ -n "$and_property" ]; then
    echo "$and_property" | while read -r line_info; do
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract the pattern
      local pattern=$(echo "$content" | grep -oE "[a-zA-Z0-9_\.]+\s*&&\s*[a-zA-Z0-9_\.]+\.[a-zA-Z0-9_]+")
      
      if [ -n "$pattern" ]; then
        # Check if left and right side have the same object
        local left_side=$(echo "$pattern" | cut -d'&' -f1 | xargs)
        local right_side=$(echo "$pattern" | cut -d'&' -f2 | sed 's/^&//g' | xargs)
        
        if [[ "$right_side" == $left_side* ]]; then
          echo "Replacing && with optional chaining for $left_side at line $line"
          local temp_file=$(mktemp)
          local property=$(echo "$right_side" | sed "s/$left_side\\.//g")
          sed "${line}s/$left_side && $left_side\\.$property/$left_side?.$property/g" "$file" > "$temp_file"
          mv "$temp_file" "$file"
        fi
      fi
    done
  fi
}

# Function to add explicit null checks
add_null_checks() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would add explicit null checks"
    return
  fi
  
  # Find functions with required parameters that access properties
  local functions=$(grep -n -E "function [a-zA-Z0-9_]+\([^)]+\)" "$file" | grep -v "?:")
  
  if [ -n "$functions" ]; then
    echo "$functions" | while read -r line_info; do
      # Get the line number and content
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract parameter names
      local params=$(echo "$content" | sed -E 's/function [a-zA-Z0-9_]+\(([^)]+)\).*/\1/g' | grep -oE "[a-zA-Z0-9_]+\s*:" | cut -d: -f1)
      
      # Find the function body
      local start_line=$line
      local end_line=$(grep -n "^[[:space:]]*}" "$file" | awk -v start="$start_line" '$1 > start {print $1; exit}' | cut -d: -f1)
      
      if [ -n "$end_line" ]; then
        local function_body=$(sed -n "$((start_line+1)),$((end_line-1))p" "$file")
        
        # Check if body already has null checks
        local has_null_check=$(echo "$function_body" | grep -E "if\s*\([^)]*null|if\s*\([^)]*undefined" | wc -l)
        
        # Only add checks if there aren't many already
        if [ "$has_null_check" -le 1 ]; then
          for param in $params; do
            # Check if parameter is accessed in the function body
            if echo "$function_body" | grep -q "$param\\." && ! echo "$function_body" | grep -q "$param\\?\\."; then
              # Check if there's already a null check for this parameter
              if ! echo "$function_body" | grep -q "if.*$param.*null"; then
                # Get the indentation of the first line of the function body
                local indent=$(echo "$function_body" | head -1 | grep -oE "^[[:space:]]*")
                
                echo "Adding null check for parameter $param"
                local temp_file=$(mktemp)
                # Add the null check after the function opening
                sed "$((start_line+1))a\\
${indent}if ($param === null || $param === undefined) {\\
${indent}  console.warn('Parameter $param is null or undefined');\\
${indent}  return;\\
${indent}}" "$file" > "$temp_file"
                mv "$temp_file" "$file"
              fi
            fi
          done
        fi
      fi
    done
  fi
}

# Function to add non-null assertions
add_non_null_assertions() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would add non-null assertions"
    return
  fi
  
  # Find places where we've manually checked for null/undefined before using a value
  local checked_nulls=$(grep -n -E "if\s*\(\s*[a-zA-Z0-9_\.]+\s*(!==?)\s*(null|undefined)" "$file")
  
  if [ -n "$checked_nulls" ]; then
    echo "$checked_nulls" | while read -r line_info; do
      # Get the line number and content
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract the variable being checked
      local var_name=$(echo "$content" | grep -oE "[a-zA-Z0-9_\.]+\s*(!==?)\s*(null|undefined)" | grep -oE "^[a-zA-Z0-9_\.]+" | head -1)
      
      # Find the if-block to locate uses of this variable
      local start_line=$line
      local end_line=$(grep -n -E "^[[:space:]]*}\s*(else|catch)?" "$file" | awk -v start="$start_line" '$1 > start {print $1; exit}' | cut -d: -f1)
      
      if [ -n "$end_line" ]; then
        local if_block=$(sed -n "$((start_line+1)),$((end_line-1))p" "$file")
        
        # Check for uses of the variable without non-null assertion
        local var_uses=$(echo "$if_block" | grep -n "$var_name" | grep -v "$var_name!")
        
        if [ -n "$var_uses" ]; then
          # Check for variable on the left side of assignments, where ! is not needed
          local var_assigns=$(echo "$var_uses" | grep -E "$var_name\s*=")
          
          # Remove assignment lines from var_uses
          if [ -n "$var_assigns" ]; then
            for line in $(echo "$var_assigns" | cut -d: -f1); do
              var_uses=$(echo "$var_uses" | grep -v "^$line:")
            done
          fi
          
          # Check remaining uses where non-null assertion can be added
          if [ -n "$var_uses" ]; then
            # Add non-null assertions to the if block
            local temp_content=$(echo "$if_block")
            
            echo "$var_uses" | while read -r use_info; do
              local use_line=$(echo "$use_info" | cut -d: -f1)
              local use_content=$(echo "$use_info" | cut -d: -f2-)
              
              # Skip lines with optional chaining
              if echo "$use_content" | grep -q "$var_name\\?\\."; then
                continue
              fi
              
              # Skip function calls where var is the function name
              if echo "$use_content" | grep -q "$var_name("; then
                continue
              fi
              
              # Skip if this is a property access that should use optional chaining instead
              if echo "$use_content" | grep -q "$var_name\\."; then
                continue
              fi
              
              echo "Adding non-null assertion to $var_name at line $((start_line+use_line))"
              # Replace just this instance of the variable
              local line_in_file=$((start_line+use_line))
              local temp_file=$(mktemp)
              # Use a pattern that won't match partial names
              sed "${line_in_file}s/\\b$var_name\\b/$var_name!/g" "$file" > "$temp_file"
              mv "$temp_file" "$file"
            done
          fi
        fi
      fi
    done
  fi
}

# Main function to process TypeScript files
process_typescript_files() {
  # Find all TypeScript files in the target directory
  if [ -d "$TARGET" ]; then
    find "$TARGET" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
      fix_null_safety "$file"
    done
  elif [ -f "$TARGET" ]; then
    # Process a single file
    if [[ "$TARGET" == *.ts || "$TARGET" == *.tsx ]]; then
      fix_null_safety "$TARGET"
    else
      echo "Warning: Target file is not a TypeScript file (.ts or .tsx): $TARGET"
    fi
  fi
}

# Run the script
process_typescript_files

echo "=== Null Safety Fix Completed ==="
if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN completed. No actual changes were made."
else
  echo "All fixes applied. Backups stored in $BACKUP_DIR"
fi 