#!/bin/bash

# fix_resource_types.sh
#
# Purpose: Automatically fix common ResourceType errors by replacing string literals
# with proper ResourceType enum references.
#
# Usage: ./fix_resource_types.sh [--dry-run] [--target=<file-or-directory>]
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
      echo "Usage: ./fix_resource_types.sh [--dry-run] [--target=<file-or-directory>]"
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

echo "=== ResourceType Fix Script ==="
if [ "$DRY_RUN" = true ]; then
  echo "Running in DRY RUN mode. No changes will be made."
fi
echo "Target: $TARGET"
echo "Backup directory: $BACKUP_DIR"

# Function to replace string literals with ResourceType enum
fix_resource_literals() {
  local file="$1"
  
  echo "Processing $file..."
  
  # Make a backup copy of the file
  cp "$file" "$BACKUP_DIR/$(basename "$file")"
  
  # Use simpler approach for string replacement (compatible with bash 3.2)
  # Simply define the patterns and their replacements
  local strings=("'minerals'" "\"minerals\"" "'gas'" "\"gas\"" "'energy'" "\"energy\"" "'food'" "\"food\"" "'water'" "\"water\"")
  local replacements=("ResourceType.MINERALS" "ResourceType.MINERALS" "ResourceType.GAS" "ResourceType.GAS" "ResourceType.ENERGY" "ResourceType.ENERGY" "ResourceType.FOOD" "ResourceType.FOOD" "ResourceType.WATER" "ResourceType.WATER")
  
  # Check if we need to add the import first
  if ! grep -q "import { ResourceType }" "$file" && ! grep -q "import {ResourceType}" "$file"; then
    # Only add import if we actually find any string literals to replace
    local needs_import=false
    for string in "${strings[@]}"; do
      if grep -q "$string" "$file"; then
        needs_import=true
        break
      fi
    done
    
    if [ "$needs_import" = true ]; then
      echo "Adding ResourceType import..."
      
      if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] Would add import for ResourceType"
      else
        # Try to find where to add the import
        local first_import_line=$(grep -n "^import " "$file" | head -1 | cut -d: -f1)
        
        if [ -n "$first_import_line" ]; then
          # Add after the first import line
          local temp_file=$(mktemp)
          head -n "$first_import_line" "$file" > "$temp_file"
          echo "import { ResourceType } from '../../types/resources/ResourceTypes';" >> "$temp_file"
          tail -n +$((first_import_line + 1)) "$file" >> "$temp_file"
          mv "$temp_file" "$file"
        else
          # Add at the beginning of the file
          local temp_file=$(mktemp)
          echo "import { ResourceType } from '../../types/resources/ResourceTypes';" > "$temp_file"
          cat "$file" >> "$temp_file"
          mv "$temp_file" "$file"
        fi
      fi
    fi
  fi
  
  # Replace string literals
  for ((i=0; i<${#strings[@]}; i++)); do
    local string="${strings[$i]}"
    local replacement="${replacements[$i]}"
    
    # Check if this string pattern exists in the file
    if grep -q "$string" "$file"; then
      echo "Replacing $string with $replacement"
      
      if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] Would replace $string with $replacement"
      else
        local temp_file=$(mktemp)
        # Use sed for the actual replacement, preserving the original file for now
        sed "s/$string/$replacement/g" "$file" > "$temp_file"
        mv "$temp_file" "$file"
      fi
    fi
  done

  # Fix function parameters
  fix_function_parameters "$file"
  
  # Fix variable declarations
  fix_variable_declarations "$file"
  
  # Fix function return types
  fix_function_return_types "$file"
  
  # Fix array types
  fix_array_types "$file"
  
  # Fix interface properties
  fix_interface_properties "$file"
}

# Function to fix parameter types in function declarations
fix_function_parameters() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix function parameters with string type"
    return
  fi
  
  # Use sed to replace the parameter types
  local temp_file=$(mktemp)
  sed -E "s/\(\s*resource\s*:\s*string/\(resource: ResourceType/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
  
  temp_file=$(mktemp)
  sed -E "s/\(\s*resourceType\s*:\s*string/\(resourceType: ResourceType/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
  
  temp_file=$(mktemp)
  sed -E "s/\(\s*type\s*:\s*string/\(type: ResourceType/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
}

# Function to fix variable type declarations
fix_variable_declarations() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix variable declarations with string type"
    return
  fi
  
  # Use sed to replace the variable types
  local temp_file=$(mktemp)
  sed -E "s/:\s*string\s*=\s*(['\"])minerals\\1/: ResourceType = ResourceType.MINERALS/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
  
  temp_file=$(mktemp)
  sed -E "s/:\s*string\s*=\s*(['\"])gas\\1/: ResourceType = ResourceType.GAS/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
  
  temp_file=$(mktemp)
  sed -E "s/:\s*string\s*=\s*(['\"])energy\\1/: ResourceType = ResourceType.ENERGY/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
  
  temp_file=$(mktemp)
  sed -E "s/:\s*string\s*=\s*(['\"])food\\1/: ResourceType = ResourceType.FOOD/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
  
  temp_file=$(mktemp)
  sed -E "s/:\s*string\s*=\s*(['\"])water\\1/: ResourceType = ResourceType.WATER/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
}

# Function to fix function return types
fix_function_return_types() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix function return types"
    return
  fi
  
  # Find functions that return a resource string but should return ResourceType
  local resource_return_functions=$(grep -n "): string {" "$file" | grep -i "resource")
  
  if [ -n "$resource_return_functions" ]; then
    # Loop through each found function
    echo "$resource_return_functions" | while read -r line_info; do
      # Get the line number
      local line=$(echo "$line_info" | cut -d: -f1)
      
      # Get the function context
      local context=$(sed -n "$((line-5)),$((line+5))p" "$file")
      
      # Check if this function is related to resources and should return ResourceType
      if echo "$context" | grep -q -i "resource\|mineral\|gas\|energy"; then
        echo "Fixing return type at line $line"
        
        # Replace the return type
        local temp_file=$(mktemp)
        sed "${line}s/): string {/): ResourceType {/" "$file" > "$temp_file"
        mv "$temp_file" "$file"
        
        # Also fix the return statements to ensure they return ResourceType
        local start_bracket=$(sed -n "${line}s/.*{//p" "$file")
        local end_line=$(grep -n "^}" "$file" | awk -v start="$line" '$1 > start {print $1; exit}' | cut -d: -f1)
        
        # Replace return statements
        local temp_file=$(mktemp)
        sed "${line},${end_line}s/return ['\"]\(minerals\|gas\|energy\|food\|water\)['\"];/return ResourceType.\U\1;/g" "$file" > "$temp_file"
        mv "$temp_file" "$file"
      fi
    done
  fi
}

# Function to fix array types
fix_array_types() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix array types"
    return
  fi
  
  # Find arrays of strings that should be arrays of ResourceType
  local resource_arrays=$(grep -n ": string\[\]" "$file" | grep -i "resource")
  
  if [ -n "$resource_arrays" ]; then
    # Loop through each found array
    echo "$resource_arrays" | while read -r line_info; do
      # Get the line number
      local line=$(echo "$line_info" | cut -d: -f1)
      
      # Get the array context
      local context=$(sed -n "$((line-5)),$((line+5))p" "$file")
      
      # Check if this array is related to resources and should be ResourceType[]
      if echo "$context" | grep -q -i "resource\|mineral\|gas\|energy"; then
        echo "Fixing array type at line $line"
        
        # Replace the array type
        local temp_file=$(mktemp)
        sed "${line}s/: string\[\]/: ResourceType[]/" "$file" > "$temp_file"
        mv "$temp_file" "$file"
      fi
    done
  fi
}

# Function to fix interface properties
fix_interface_properties() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix interface properties"
    return
  fi
  
  # Find interface properties that should be ResourceType
  local interface_props=$(grep -n "  [a-zA-Z]\+: string;" "$file" | grep -i "resource\|type")
  
  if [ -n "$interface_props" ]; then
    # Loop through each found property
    echo "$interface_props" | while read -r line_info; do
      # Get the line number
      local line=$(echo "$line_info" | cut -d: -f1)
      
      # Get the property context
      local context=$(sed -n "$((line-5)),$((line+5))p" "$file")
      
      # Check if this property is related to resources and should be ResourceType
      if echo "$context" | grep -q -i "resource\|mineral\|gas\|energy"; then
        echo "Fixing interface property at line $line"
        
        # Replace the property type
        local temp_file=$(mktemp)
        sed "${line}s/: string;/: ResourceType;/" "$file" > "$temp_file"
        mv "$temp_file" "$file"
      fi
    done
  fi
}

# Main process
if [ -d "$TARGET" ]; then
  # Process all TypeScript files in the target directory
  find "$TARGET" -name "*.ts" -o -name "*.tsx" | while read -r file; do
    fix_resource_literals "$file"
  done
else
  # Process a single file
  fix_resource_literals "$TARGET"
fi

echo "Done!"
if [ "$DRY_RUN" = true ]; then
  echo "This was a dry run. No changes were made."
else
  echo "Files have been updated. Backups are stored in $BACKUP_DIR"
fi 