#!/bin/bash

# fix_type_safety.sh
#
# Purpose: Automatically fix common type safety issues in TypeScript code:
#   1. Convert any types to specific types where possible
#   2. Fix array type issues ([] → Type[])
#   3. Add proper type assertions
#   4. Fix function return types
#
# Usage: ./fix_type_safety.sh [--dry-run] [--target=<file-or-directory>]
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
      echo "Usage: ./fix_type_safety.sh [--dry-run] [--target=<file-or-directory>]"
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

echo "=== Type Safety Fix Script ==="
if [ "$DRY_RUN" = true ]; then
  echo "Running in DRY RUN mode. No changes will be made."
fi
echo "Target: $TARGET"
echo "Backup directory: $BACKUP_DIR"

# Function to fix type safety issues in a file
fix_type_safety() {
  local file="$1"
  
  echo "Processing $file..."
  
  # Make a backup copy of the file
  cp "$file" "$BACKUP_DIR/$(basename "$file")"
  
  # Fix explicit any declarations
  fix_explicit_any "$file"
  
  # Fix array type issues
  fix_array_types "$file"
  
  # Fix function return types
  fix_function_return_types "$file"
  
  # Add type assertions
  add_type_assertions "$file"
}

# Function to fix explicit any declarations
fix_explicit_any() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix explicit any declarations"
    return
  fi
  
  # First, determine common types used in the file
  local types=$(grep -E "interface |type " "$file" | grep -oE "[A-Z][a-zA-Z0-9_]+" | sort | uniq)
  
  # Check if we should replace any with a specific type
  if [ -n "$types" ]; then
    echo "Found types in file: $types"
    
    # Look for variable declarations with any
    local any_vars=$(grep -n -E ":\s*any\s*=" "$file")
    
    if [ -n "$any_vars" ]; then
      echo "$any_vars" | while read -r line_info; do
        # Get the line number and full line content
        local line=$(echo "$line_info" | cut -d: -f1)
        local content=$(echo "$line_info" | cut -d: -f2-)
        
        # Extract the variable name
        local var_name=$(echo "$content" | grep -oE "[a-zA-Z0-9_]+\s*:\s*any" | cut -d: -f1 | xargs)
        
        # Look for usage of this variable to determine its likely type
        local usage_lines=$(grep -n "$var_name" "$file" | grep -v "$line")
        
        # Try to determine the type from usage
        for type in $types; do
          # If the variable is used with a method/property specific to this type
          if echo "$usage_lines" | grep -q "$var_name\.$type" || echo "$usage_lines" | grep -q "$var_name as $type"; then
            echo "Fixing any to $type for variable $var_name at line $line"
            local temp_file=$(mktemp)
            sed "${line}s/: any/: ${type}/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
            break
          fi
        done
      done
    fi
    
    # Look for function parameters with any
    local any_params=$(grep -n -E "\([^)]*:\s*any[,)]" "$file")
    
    if [ -n "$any_params" ]; then
      echo "$any_params" | while read -r line_info; do
        # Get the line number and content
        local line=$(echo "$line_info" | cut -d: -f1)
        local content=$(echo "$line_info" | cut -d: -f2-)
        
        # Extract parameter names
        local params=$(echo "$content" | grep -oE "[a-zA-Z0-9_]+\s*:\s*any" | cut -d: -f1 | xargs)
        
        for param in $params; do
          # Find the function body to analyze param usage
          local start_line=$line
          local end_line=$(grep -n "^[[:space:]]*}" "$file" | awk -v start="$start_line" '$1 > start {print $1; exit}' | cut -d: -f1)
          
          if [ -n "$end_line" ]; then
            local function_body=$(sed -n "${start_line},${end_line}p" "$file")
            
            # Try to determine the type from usage within the function
            for type in $types; do
              if echo "$function_body" | grep -q "$param\.$type" || echo "$function_body" | grep -q "$param as $type"; then
                echo "Fixing any to $type for parameter $param at line $line"
                local temp_file=$(mktemp)
                sed "${line}s/$param\s*:\s*any/$param: ${type}/g" "$file" > "$temp_file"
                mv "$temp_file" "$file"
                break
              fi
            done
          fi
        done
      done
    fi
  fi
  
  # Special case: Replace any[] with more specific types if possible
  local any_arrays=$(grep -n -E ":\s*any\[\]" "$file")
  
  if [ -n "$any_arrays" ]; then
    echo "$any_arrays" | while read -r line_info; do
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract the variable name
      local var_name=$(echo "$content" | grep -oE "[a-zA-Z0-9_]+\s*:\s*any\[\]" | cut -d: -f1 | xargs)
      
      # Look for map/filter/forEach usage to determine element type
      local array_usage=$(grep -n "$var_name" "$file" | grep -v "$line" | grep -E "map|filter|forEach|reduce")
      
      if [ -n "$array_usage" ]; then
        # Extract the type from lambda parameters
        local lambda_types=$(echo "$array_usage" | grep -oE "$var_name\.(map|filter|forEach|reduce)\(\([a-zA-Z0-9_]+:\s*[A-Z][a-zA-Z0-9_]+" | grep -oE ":[A-Z][a-zA-Z0-9_]+" | cut -d: -f2)
        
        if [ -n "$lambda_types" ]; then
          local element_type=$(echo "$lambda_types" | head -1)
          echo "Fixing any[] to ${element_type}[] for $var_name at line $line"
          
          local temp_file=$(mktemp)
          sed "${line}s/: any\[\]/: ${element_type}[]/g" "$file" > "$temp_file"
          mv "$temp_file" "$file"
        fi
      fi
    done
  fi
}

# Function to fix array type issues
fix_array_types() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix array type issues"
    return
  fi
  
  # Find untyped arrays (using [])
  local untyped_arrays=$(grep -n -E ":\s*\[\]" "$file")
  
  if [ -n "$untyped_arrays" ]; then
    echo "$untyped_arrays" | while read -r line_info; do
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract the variable name
      local var_name=$(echo "$content" | grep -oE "[a-zA-Z0-9_]+\s*:\s*\[\]" | cut -d: -f1 | xargs)
      
      # Look for array usage to determine element type
      local array_usage=$(grep -n "$var_name" "$file" | grep -v "$line")
      
      # Check for common types of arrays
      if echo "$array_usage" | grep -q "\.push" && echo "$array_usage" | grep -q -E "string|number|boolean"; then
        # Determine type from push calls
        if echo "$array_usage" | grep -q -E "\.push\(['\"]"; then
          echo "Fixing [] to string[] for $var_name at line $line"
          local temp_file=$(mktemp)
          sed "${line}s/: \[\]/: string[]/g" "$file" > "$temp_file"
          mv "$temp_file" "$file"
        elif echo "$array_usage" | grep -q -E "\.push\([0-9]"; then
          echo "Fixing [] to number[] for $var_name at line $line"
          local temp_file=$(mktemp)
          sed "${line}s/: \[\]/: number[]/g" "$file" > "$temp_file"
          mv "$temp_file" "$file"
        elif echo "$array_usage" | grep -q -E "\.push\((true|false)"; then
          echo "Fixing [] to boolean[] for $var_name at line $line"
          local temp_file=$(mktemp)
          sed "${line}s/: \[\]/: boolean[]/g" "$file" > "$temp_file"
          mv "$temp_file" "$file"
        fi
      else
        # Look for custom types in the file
        local types=$(grep -E "interface |type " "$file" | grep -oE "[A-Z][a-zA-Z0-9_]+" | sort | uniq)
        
        for type in $types; do
          if echo "$array_usage" | grep -q "$type"; then
            echo "Fixing [] to ${type}[] for $var_name at line $line"
            local temp_file=$(mktemp)
            sed "${line}s/: \[\]/: ${type}[]/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
            break
          fi
        done
      fi
    done
  fi
}

# Function to fix function return types
fix_function_return_types() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix function return types"
    return
  fi
  
  # Find functions without explicit return types
  local untyped_functions=$(grep -n -E "function [a-zA-Z0-9_]+\([^)]*\) {" "$file")
  
  if [ -n "$untyped_functions" ]; then
    echo "$untyped_functions" | while read -r line_info; do
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Extract the function name
      local func_name=$(echo "$content" | grep -oE "function [a-zA-Z0-9_]+" | cut -d' ' -f2)
      
      # Find the function body to analyze return statements
      local start_line=$line
      local end_line=$(grep -n "^[[:space:]]*}" "$file" | awk -v start="$start_line" '$1 > start {print $1; exit}' | cut -d: -f1)
      
      if [ -n "$end_line" ]; then
        local function_body=$(sed -n "${start_line},${end_line}p" "$file")
        
        # Check return statements
        local return_statements=$(echo "$function_body" | grep -E "return " | grep -v "return;")
        
        if [ -n "$return_statements" ]; then
          # Determine return type from statements
          if echo "$return_statements" | grep -q -E "return ['\""]"; then
            echo "Adding string return type to function $func_name at line $line"
            local temp_file=$(mktemp)
            sed "${line}s/function $func_name(\([^)]*\)) {/function $func_name(\1): string {/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
          elif echo "$return_statements" | grep -q -E "return [0-9]"; then
            echo "Adding number return type to function $func_name at line $line"
            local temp_file=$(mktemp)
            sed "${line}s/function $func_name(\([^)]*\)) {/function $func_name(\1): number {/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
          elif echo "$return_statements" | grep -q -E "return (true|false)"; then
            echo "Adding boolean return type to function $func_name at line $line"
            local temp_file=$(mktemp)
            sed "${line}s/function $func_name(\([^)]*\)) {/function $func_name(\1): boolean {/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
          elif echo "$return_statements" | grep -q -E "return \["; then
            # Try to determine array type
            local first_return=$(echo "$return_statements" | head -1)
            if echo "$first_return" | grep -q -E "return \[['\"]"; then
              echo "Adding string[] return type to function $func_name at line $line"
              local temp_file=$(mktemp)
              sed "${line}s/function $func_name(\([^)]*\)) {/function $func_name(\1): string[] {/g" "$file" > "$temp_file"
              mv "$temp_file" "$file"
            elif echo "$first_return" | grep -q -E "return \[[0-9]"; then
              echo "Adding number[] return type to function $func_name at line $line"
              local temp_file=$(mktemp)
              sed "${line}s/function $func_name(\([^)]*\)) {/function $func_name(\1): number[] {/g" "$file" > "$temp_file"
              mv "$temp_file" "$file"
            else
              # Look for custom types in the file
              local types=$(grep -E "interface |type " "$file" | grep -oE "[A-Z][a-zA-Z0-9_]+" | sort | uniq)
              
              for type in $types; do
                if echo "$first_return" | grep -q "$type"; then
                  echo "Adding ${type}[] return type to function $func_name at line $line"
                  local temp_file=$(mktemp)
                  sed "${line}s/function $func_name(\([^)]*\)) {/function $func_name(\1): ${type}[] {/g" "$file" > "$temp_file"
                  mv "$temp_file" "$file"
                  break
                fi
              done
            fi
          elif echo "$return_statements" | grep -q -E "return \{"; then
            # For object returns, look for custom types
            local types=$(grep -E "interface |type " "$file" | grep -oE "[A-Z][a-zA-Z0-9_]+" | sort | uniq)
            
            for type in $types; do
              if echo "$function_body" | grep -q "$type"; then
                echo "Adding $type return type to function $func_name at line $line"
                local temp_file=$(mktemp)
                sed "${line}s/function $func_name(\([^)]*\)) {/function $func_name(\1): $type {/g" "$file" > "$temp_file"
                mv "$temp_file" "$file"
                break
              fi
            done
          fi
        else
          # Function with no return statement or just "return;"
          echo "Adding void return type to function $func_name at line $line"
          local temp_file=$(mktemp)
          sed "${line}s/function $func_name(\([^)]*\)) {/function $func_name(\1): void {/g" "$file" > "$temp_file"
          mv "$temp_file" "$file"
        fi
      fi
    done
  fi
}

# Function to add type assertions
add_type_assertions() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would add type assertions"
    return
  fi
  
  # Find common patterns where type assertions would be useful
  # 1. document.getElementById without type assertion
  local document_gets=$(grep -n -E "document.getElementById\(['\"][^'\"]+['\"]\)" "$file" | grep -v " as ")
  
  if [ -n "$document_gets" ]; then
    echo "$document_gets" | while read -r line_info; do
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Check if assigned to a variable with a type
      local var_declaration=$(echo "$content" | grep -oE "[a-zA-Z0-9_]+\s*:\s*[A-Z][a-zA-Z0-9_]+\s*=")
      
      if [ -n "$var_declaration" ]; then
        # Extract the type
        local element_type=$(echo "$var_declaration" | grep -oE ":\s*[A-Z][a-zA-Z0-9_]+" | cut -d: -f2 | xargs)
        
        echo "Adding type assertion for getElementById at line $line"
        local temp_file=$(mktemp)
        sed "${line}s/document.getElementById(\([^)]*\))/document.getElementById(\1) as ${element_type}/g" "$file" > "$temp_file"
        mv "$temp_file" "$file"
      else
        # Default to HTMLElement if type cannot be determined
        echo "Adding HTMLElement type assertion for getElementById at line $line"
        local temp_file=$(mktemp)
        sed "${line}s/document.getElementById(\([^)]*\))/document.getElementById(\1) as HTMLElement/g" "$file" > "$temp_file"
        mv "$temp_file" "$file"
      fi
    done
  fi
  
  # 2. JSON.parse without type assertion
  local json_parses=$(grep -n -E "JSON.parse\(" "$file" | grep -v " as ")
  
  if [ -n "$json_parses" ]; then
    echo "$json_parses" | while read -r line_info; do
      local line=$(echo "$line_info" | cut -d: -f1)
      local content=$(echo "$line_info" | cut -d: -f2-)
      
      # Check if assigned to a variable with a type
      local var_declaration=$(echo "$content" | grep -oE "[a-zA-Z0-9_]+\s*:\s*[A-Z][a-zA-Z0-9_]+\s*=")
      
      if [ -n "$var_declaration" ]; then
        # Extract the type
        local data_type=$(echo "$var_declaration" | grep -oE ":\s*[A-Z][a-zA-Z0-9_]+" | cut -d: -f2 | xargs)
        
        echo "Adding type assertion for JSON.parse at line $line"
        local temp_file=$(mktemp)
        sed "${line}s/JSON.parse(\([^)]*\))/JSON.parse(\1) as ${data_type}/g" "$file" > "$temp_file"
        mv "$temp_file" "$file"
      else
        # Look for var name hints (e.g., parseUser → User)
        local var_name=$(echo "$content" | grep -oE "[a-zA-Z0-9_]+\s*=\s*JSON.parse" | cut -d= -f1 | xargs)
        
        if [ -n "$var_name" ]; then
          # Extract type hints from variable name (e.g., userData → Data)
          local type_hint=$(echo "$var_name" | grep -oE "[A-Z][a-zA-Z0-9_]*$")
          
          if [ -n "$type_hint" ]; then
            echo "Adding $type_hint type assertion for JSON.parse at line $line based on variable name"
            local temp_file=$(mktemp)
            sed "${line}s/JSON.parse(\([^)]*\))/JSON.parse(\1) as ${type_hint}/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
          else
            # If no type hint, use any for now
            echo "Adding any type assertion for JSON.parse at line $line"
            local temp_file=$(mktemp)
            sed "${line}s/JSON.parse(\([^)]*\))/JSON.parse(\1) as any/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
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
      fix_type_safety "$file"
    done
  elif [ -f "$TARGET" ]; then
    # Process a single file
    if [[ "$TARGET" == *.ts || "$TARGET" == *.tsx ]]; then
      fix_type_safety "$TARGET"
    else
      echo "Warning: Target file is not a TypeScript file (.ts or .tsx): $TARGET"
    fi
  fi
}

# Run the script
process_typescript_files

echo "=== Type Safety Fix Completed ==="
if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN completed. No actual changes were made."
else
  echo "All fixes applied. Backups stored in $BACKUP_DIR"
fi 