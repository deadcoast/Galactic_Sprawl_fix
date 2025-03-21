#!/bin/bash

# fix_resource_types_advanced.sh
#
# Purpose: Enhanced script to fix ResourceType errors including:
#   1. Function signatures returning string resource types
#   2. Function parameters using string instead of ResourceType
#   3. Import handling to add ResourceType import when fixing
#   4. Object property access patterns
#
# Usage: ./fix_resource_types_advanced.sh [--dry-run] [--target=<file-or-directory>]
#
# Options:
#   --dry-run    Show changes that would be made without actually making them
#   --target     Specify a target file or directory to fix (default: src/)
#
# Created: Based on fix_resource_types.sh
# Enhanced: Based on Future_Advancements.md tasklist

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
      echo "Usage: ./fix_resource_types_advanced.sh [--dry-run] [--target=<file-or-directory>]"
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

echo "=== Enhanced ResourceType Fix Script ==="
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
  
  # Define the patterns and their replacements
  local strings=("'minerals'" "\"minerals\"" "'gas'" "\"gas\"" "'energy'" "\"energy\"" "'food'" "\"food\"" "'water'" "\"water\"")
  local replacements=("ResourceType.MINERALS" "ResourceType.MINERALS" "ResourceType.GAS" "ResourceType.GAS" "ResourceType.ENERGY" "ResourceType.ENERGY" "ResourceType.FOOD" "ResourceType.FOOD" "ResourceType.WATER" "ResourceType.WATER")
  
  # Check if we need to add the import first
  add_resource_type_import "$file"
  
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
  
  # Fix function return types
  fix_function_return_types "$file"
  
  # Fix array types
  fix_array_types "$file"
  
  # Fix interface properties
  fix_interface_properties "$file"
  
  # ENHANCEMENT: Fix object property access patterns
  fix_object_property_access "$file"
}

# Enhanced function to add ResourceType import if needed
add_resource_type_import() {
  local file="$1"
  
  # Skip if the file already has the import
  if grep -q "import { ResourceType }" "$file" || grep -q "import {ResourceType}" "$file"; then
    return
  fi
  
  # Check if this file needs the ResourceType import by looking for resource-related patterns
  if grep -q -E "'minerals'|\"minerals\"|'gas'|\"gas\"|'energy'|\"energy\"|'food'|\"food\"|'water'|\"water\"|: string.*=.*resource|ResourceType" "$file"; then
    echo "Adding ResourceType import..."
    
    if [ "$DRY_RUN" = true ]; then
      echo "[DRY RUN] Would add import for ResourceType"
      return
    fi
    
    # Determine the correct import path based on the file location
    local import_path="../../types/resources/ResourceTypes"
    # If file is in components, adjust path
    if [[ "$file" == *"/components/"* ]]; then
      import_path="../types/resources/ResourceTypes"
    # If file is in types, adjust path
    elif [[ "$file" == *"/types/"* ]]; then
      import_path="./resources/ResourceTypes"
    fi
    
    # Try to find where to add the import
    local first_import_line=$(grep -n "^import " "$file" | head -1 | cut -d: -f1)
    
    if [ -n "$first_import_line" ]; then
      # Add after the first import line
      local temp_file=$(mktemp)
      head -n "$first_import_line" "$file" > "$temp_file"
      echo "import { ResourceType } from '$import_path';" >> "$temp_file"
      tail -n +$((first_import_line + 1)) "$file" >> "$temp_file"
      mv "$temp_file" "$file"
    else
      # Add at the beginning of the file
      local temp_file=$(mktemp)
      echo "import { ResourceType } from '$import_path';" > "$temp_file"
      cat "$file" >> "$temp_file"
      mv "$temp_file" "$file"
    fi
  fi
}

# Enhanced function to fix parameter types in function declarations
fix_function_parameters() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix function parameters with string type"
    return
  fi
  
  # Use sed to replace the parameter types - more comprehensive regex
  local temp_file=$(mktemp)
  sed -E "s/\(\s*(resource|resourceType|type|resourceName)\s*:\s*string\b/\(\1: ResourceType/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
  
  # Fix array parameters
  temp_file=$(mktemp)
  sed -E "s/\(\s*(resources|resourceTypes|types)\s*:\s*string\[\]\b/\(\1: ResourceType[]/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
  
  # Fix optional parameters
  temp_file=$(mktemp)
  sed -E "s/\(\s*(resource|resourceType|type)\?\s*:\s*string\b/\(\1?: ResourceType/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
}

# Enhanced function to fix function return types
fix_function_return_types() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix function return types"
    return
  fi
  
  # More comprehensive patterns for function return types
  local patterns=(
    "get[Rr]esource[Tt]ype.*): string"
    "resource[Tt]ype.*): string"
    "get[Rr]esource.*): string"
    "[Rr]esource[Tt]ype.*): string"
  )
  
  for pattern in "${patterns[@]}"; do
    # Find functions that match the pattern
    local matched_functions=$(grep -n "$pattern" "$file")
    
    if [ -n "$matched_functions" ]; then
      # Loop through each found function
      echo "$matched_functions" | while read -r line_info; do
        # Get the line number
        local line=$(echo "$line_info" | cut -d: -f1)
        
        # Get the function context to verify it's related to resources
        local context=$(sed -n "$((line-5)),$((line+10))p" "$file")
        
        # Check if this function is related to resources and should return ResourceType
        if echo "$context" | grep -q -i "resource\|mineral\|gas\|energy\|food\|water"; then
          echo "Fixing return type at line $line"
          
          # Replace the return type
          local temp_file=$(mktemp)
          sed "${line}s/): string {/): ResourceType {/" "$file" > "$temp_file"
          mv "$temp_file" "$file"
          
          # Also fix the return statements to ensure they return ResourceType
          local start_line=$line
          local end_line=$(grep -n "^[[:space:]]*}" "$file" | awk -v start="$start_line" '$1 > start {print $1; exit}' | cut -d: -f1)
          
          if [ -n "$end_line" ]; then
            # Replace return statements with proper ResourceType enum values
            local temp_file=$(mktemp)
            sed "${start_line},${end_line}s/return ['\"]\(minerals\)['\"];/return ResourceType.MINERALS;/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
            
            temp_file=$(mktemp)
            sed "${start_line},${end_line}s/return ['\"]\(gas\)['\"];/return ResourceType.GAS;/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
            
            temp_file=$(mktemp)
            sed "${start_line},${end_line}s/return ['\"]\(energy\)['\"];/return ResourceType.ENERGY;/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
            
            temp_file=$(mktemp)
            sed "${start_line},${end_line}s/return ['\"]\(food\)['\"];/return ResourceType.FOOD;/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
            
            temp_file=$(mktemp)
            sed "${start_line},${end_line}s/return ['\"]\(water\)['\"];/return ResourceType.WATER;/g" "$file" > "$temp_file"
            mv "$temp_file" "$file"
          fi
        fi
      done
    fi
  done
}

# ENHANCEMENT: Function to fix object property access patterns
fix_object_property_access() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix object property access patterns"
    return
  fi
  
  # Check for patterns like: obj.resourceType === 'minerals'
  local patterns=(
    "\.resourceType\s*===\s*['\"]minerals['\"]"
    "\.resourceType\s*===\s*['\"]gas['\"]"
    "\.resourceType\s*===\s*['\"]energy['\"]"
    "\.resourceType\s*===\s*['\"]food['\"]"
    "\.resourceType\s*===\s*['\"]water['\"]"
    "\.type\s*===\s*['\"]minerals['\"]"
    "\.type\s*===\s*['\"]gas['\"]"
    "\.type\s*===\s*['\"]energy['\"]"
    "\.type\s*===\s*['\"]food['\"]"
    "\.type\s*===\s*['\"]water['\"]"
  )
  
  local replacements=(
    ".resourceType === ResourceType.MINERALS"
    ".resourceType === ResourceType.GAS"
    ".resourceType === ResourceType.ENERGY"
    ".resourceType === ResourceType.FOOD"
    ".resourceType === ResourceType.WATER"
    ".type === ResourceType.MINERALS"
    ".type === ResourceType.GAS"
    ".type === ResourceType.ENERGY"
    ".type === ResourceType.FOOD"
    ".type === ResourceType.WATER"
  )
  
  for ((i=0; i<${#patterns[@]}; i++)); do
    local pattern="${patterns[$i]}"
    local replacement="${replacements[$i]}"
    
    # Check if this pattern exists in the file
    if grep -q -E "$pattern" "$file"; then
      echo "Fixing object property access pattern: $pattern"
      
      local temp_file=$(mktemp)
      sed -E "s/$pattern/$replacement/g" "$file" > "$temp_file"
      mv "$temp_file" "$file"
    fi
  done
  
  # Also fix == comparisons
  for ((i=0; i<${#patterns[@]}; i++)); do
    local pattern="${patterns[$i]//===/==}"
    local replacement="${replacements[$i]//===/==}"
    
    # Check if this pattern exists in the file
    if grep -q -E "$pattern" "$file"; then
      echo "Fixing object property access pattern: $pattern"
      
      local temp_file=$(mktemp)
      sed -E "s/$pattern/$replacement/g" "$file" > "$temp_file"
      mv "$temp_file" "$file"
    fi
  done
}

# Function to fix array types
fix_array_types() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix array types"
    return
  fi
  
  # Fix array type declarations
  local temp_file=$(mktemp)
  sed -E "s/:\s*string\[\]\s*=\s*\[/: ResourceType[] = [/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
  
  # Fix resource-related array parameters
  temp_file=$(mktemp)
  sed -E "s/\((resources|types|resourceTypes)\s*:\s*string\[\]/\(\1: ResourceType[]/g" "$file" > "$temp_file"
  mv "$temp_file" "$file"
}

# Function to fix interface properties
fix_interface_properties() {
  local file="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would fix interface properties"
    return
  fi
  
  # Find interfaces and types that have resource-related properties
  local interfaces=$(grep -n -E "interface|type.*=.*{" "$file")
  
  if [ -n "$interfaces" ]; then
    echo "$interfaces" | while read -r line_info; do
      # Get the line number
      local line=$(echo "$line_info" | cut -d: -f1)
      
      # Find where the interface/type ends
      local end_line=$(grep -n "^}" "$file" | awk -v start="$line" '$1 > start {print $1; exit}' | cut -d: -f1)
      
      if [ -n "$end_line" ]; then
        # Check if this interface/type has resource-related properties
        local interface_content=$(sed -n "${line},${end_line}p" "$file")
        
        if echo "$interface_content" | grep -q -E "resourceType|resource|type.*:.*string"; then
          echo "Fixing resource type in interface/type definition at line $line"
          
          # Fix property types
          local temp_file=$(mktemp)
          sed "${line},${end_line}s/resourceType\s*:\s*string/resourceType: ResourceType/g" "$file" > "$temp_file"
          mv "$temp_file" "$file"
          
          temp_file=$(mktemp)
          sed "${line},${end_line}s/resource\s*:\s*string/resource: ResourceType/g" "$file" > "$temp_file"
          mv "$temp_file" "$file"
          
          # Fix properties that might be resource type-related
          temp_file=$(mktemp)
          sed "${line},${end_line}s/type\s*:\s*string/type: ResourceType/g" "$file" > "$temp_file"
          mv "$temp_file" "$file"
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
      fix_resource_literals "$file"
    done
  elif [ -f "$TARGET" ]; then
    # Process a single file
    if [[ "$TARGET" == *.ts || "$TARGET" == *.tsx ]]; then
      fix_resource_literals "$TARGET"
    else
      echo "Warning: Target file is not a TypeScript file (.ts or .tsx): $TARGET"
    fi
  fi
}

# Run the script
process_typescript_files

echo "=== Resource Type Fix Completed ==="
if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN completed. No actual changes were made."
else
  echo "All fixes applied. Backups stored in $BACKUP_DIR"
fi 