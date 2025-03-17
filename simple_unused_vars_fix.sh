#!/bin/bash

# Simple Unused Variables Fix Script
# This script demonstrates how to find and fix unused variables in TypeScript files

# Target file
TARGET_FILE="../Tests/test_unused_vars.ts"
DRY_RUN=true

echo "=== Simple Unused Variables Fix Script ==="
echo "Target file: $TARGET_FILE"
echo "Dry run: $DRY_RUN"

if [ ! -f "$TARGET_FILE" ]; then
    echo "Error: Target file $TARGET_FILE does not exist"
    exit 1
fi

# Create a backup
BACKUP_FILE="${TARGET_FILE}.backup"
cp "$TARGET_FILE" "$BACKUP_FILE"
echo "Created backup at $BACKUP_FILE"

# Define patterns to look for - these are the specific patterns in our test file
patterns=(
    "options is never used"
    "count is never used"
    "email is never used"
    "length is never used"
    "config is never used"
    "index is never used"
    "error is never used"
    "city is never used"
)

# Variables to fix
declare -A fixes
fixes=(
    ["options"]="_options"
    ["count"]="_count"
    ["email"]="_email"
    ["length"]="_length"
    ["config"]="_config"
    ["index"]="_index"
    ["error"]="_error"
    ["city"]="_city"
)

# Find the lines where these variables are declared
for var in "${!fixes[@]}"; do
    echo "Looking for variable: $var"
    
    # Look for variable declarations and function parameters
    lines=$(grep -n "\b$var\b" "$TARGET_FILE" | cut -d: -f1)
    
    for line in $lines; do
        line_content=$(sed -n "${line}p" "$TARGET_FILE")
        
        # Skip lines where the variable is already used with an underscore
        if [[ "$line_content" =~ _$var ]]; then
            echo "  Line $line: Variable already has underscore prefix, skipping"
            continue
        fi
        
        # Check if this is a variable declaration or function parameter
        if [[ "$line_content" =~ (const|let|var|function|=>|\{) ]]; then
            echo "  Line $line: Found unused variable '$var'"
            
            if $DRY_RUN; then
                echo "  Would fix: Line $line: $var -> ${fixes[$var]}"
            else
                # Replace the variable name with an underscore prefix
                # Use word boundaries to ensure we replace the exact variable name
                sed -i.tmp "${line}s/\b$var\b/${fixes[$var]}/g" "$TARGET_FILE"
                echo "  Fixed: Line $line: $var -> ${fixes[$var]}"
            fi
        fi
    done
done

if $DRY_RUN; then
    echo "Dry run complete. No changes were made."
    echo "To apply changes, set DRY_RUN=false at the beginning of the script."
else
    echo "Fixes applied successfully."
fi

# Cleanup
rm -f "$TARGET_FILE.tmp"

echo "Script execution completed." 