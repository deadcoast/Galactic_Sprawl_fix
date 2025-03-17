#!/bin/bash

# Fix Unused Variables Script
# This script automatically fixes unused variable warnings in TypeScript files
# by prefixing variable names with an underscore (_).
#
# Usage: 
#   ./fix_unused_vars.sh --target=path/to/file_or_dir [--dry-run]
#
# Options:
#   --target      Path to the file or directory to process
#   --dry-run     Run in dry-run mode (no changes will be made)

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$BASE_DIR/Fixes/Backups/$(date +"%Y-%m-%d_%H-%M-%S")"
ANALYSIS_DIR="$BASE_DIR/Analysis/ESLint"

# Default values
dry_run=false
target=""
scan_mode="file"

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$ANALYSIS_DIR"

# Process command line arguments
for arg in "$@"
do
    case $arg in
        --dry-run)
        dry_run=true
        shift
        ;;
        --target=*)
        target="${arg#*=}"
        shift
        ;;
        *)
        # Unknown option
        ;;
    esac
done

# Display script information
echo "=== Unused Variables Fix Script ==="
if $dry_run; then
    echo "Running in DRY RUN mode. No changes will be made."
fi
echo "Target: $target"
echo "Backup directory: $BACKUP_DIR"

# Validate input
if [ -z "$target" ]; then
    echo "Error: No target specified. Use --target=path/to/file_or_dir"
    exit 1
fi

# Function to detect unused variables in a file using grep instead of ESLint
detect_unused_vars() {
    local file="$1"
    local output_file="$ANALYSIS_DIR/unused_vars_$(date +"%Y-%m-%d").txt"
    local results=()
    
    echo "Analyzing $file for unused variables..."
    
    # Ensure the output file exists
    mkdir -p "$(dirname "$output_file")"
    touch "$output_file"
    
    # Check for unused variables that are declared but not used
    echo "Checking for unused constant/variable declarations..."
    local declarations=$(grep -n -E '(const|let|var) ([a-zA-Z0-9_]+)' "$file" | sed -E 's/([0-9]+):.*[ \t](const|let|var) ([a-zA-Z0-9_]+).*/\1:\3/')
    
    while IFS= read -r declaration; do
        if [ -z "$declaration" ]; then
            continue
        fi
        
        line=$(echo "$declaration" | cut -d':' -f1)
        var_name=$(echo "$declaration" | cut -d':' -f2)
        
        # Skip common variable names that might be false positives
        if [[ "$var_name" == "i" || "$var_name" == "j" || "$var_name" == "k" ]]; then
            continue
        fi
        
        # Get the file content without the declaration line
        file_content=$(sed -e "${line}d" "$file")
        
        # Check if variable is used elsewhere in the file
        if ! grep -q "\b$var_name\b" <<< "$file_content"; then
            results+=("$line:$var_name")
            echo "Found unused variable: $var_name at line $line"
        fi
    done <<< "$declarations"
    
    # Check for unused function parameters
    echo "Checking for unused function parameters..."
    local function_lines=$(grep -n -E 'function [a-zA-Z0-9_]+\(' "$file")
    
    while IFS= read -r func_line; do
        if [ -z "$func_line" ]; then
            continue
        fi
        
        line_num=$(echo "$func_line" | cut -d':' -f1)
        
        # Extract function signature and find the closing parenthesis
        local func_sig=$(sed -n "${line_num}p" "$file")
        local open_paren_pos=$(expr index "$func_sig" "(")
        
        if [ "$open_paren_pos" -eq 0 ]; then
            continue
        fi
        
        # Extract the function body to search for parameter usage
        # First find the opening brace
        local brace_line=$line_num
        local found_brace=false
        while ! $found_brace && [ "$brace_line" -lt "$(wc -l < "$file")" ]; do
            if grep -q "{" <<< "$(sed -n "${brace_line}p" "$file")"; then
                found_brace=true
            else
                brace_line=$((brace_line + 1))
            fi
        done
        
        if ! $found_brace; then
            continue
        fi
        
        # Now find the closing brace (taking nested braces into account)
        local close_brace_line=$brace_line
        local brace_count=1
        while [ "$brace_count" -gt 0 ] && [ "$close_brace_line" -lt "$(wc -l < "$file")" ]; do
            close_brace_line=$((close_brace_line + 1))
            local line_content=$(sed -n "${close_brace_line}p" "$file")
            
            # Count opening braces
            local open_count=$(grep -o "{" <<< "$line_content" | wc -l)
            # Count closing braces
            local close_count=$(grep -o "}" <<< "$line_content" | wc -l)
            
            brace_count=$((brace_count + open_count - close_count))
        done
        
        # Extract the function body
        local func_body=$(sed -n "${line_num},${close_brace_line}p" "$file")
        
        # Extract parameters from function signature
        local params=$(echo "$func_sig" | grep -o '([^)]*)')
        params=${params#"("}
        params=${params%")"}
        
        # Parse each parameter
        IFS=',' read -ra PARAM_ARRAY <<< "$params"
        for param in "${PARAM_ARRAY[@]}"; do
            # Extract parameter name (ignoring type annotations)
            param_name=$(echo "$param" | sed -E 's/([a-zA-Z0-9_]+)(:.*)?/\1/' | tr -d ' ')
            
            if [ -z "$param_name" ]; then
                continue
            fi
            
            # Skip if parameter has underscore prefix
            if [[ "$param_name" == _* ]]; then
                continue
            fi
            
            # Check if parameter is used in function body
            if ! grep -q "\b$param_name\b" <<< "$(echo "$func_body" | sed -e "1d")"; then
                results+=("$line_num:$param_name")
                echo "Found unused parameter: $param_name at line $line_num"
            fi
        done
    done <<< "$function_lines"
    
    # Check for unused arrow function parameters
    echo "Checking for unused arrow function parameters..."
    local arrow_lines=$(grep -n -E '(\([^)]*\)|[a-zA-Z0-9_]+) +=> ' "$file")
    
    while IFS= read -r arrow_line; do
        if [ -z "$arrow_line" ]; then
            continue
        fi
        
        line_num=$(echo "$arrow_line" | cut -d':' -f1)
        arrow_sig=$(echo "$arrow_line" | cut -d':' -f2-)
        
        # Get arrow function body
        local arrow_body=""
        if grep -q "{" <<< "$(sed -n "${line_num}p" "$file")"; then
            # Multi-line arrow function
            local brace_line=$line_num
            local brace_count=1
            arrow_body=$(sed -n "${line_num}p" "$file")
            
            while [ "$brace_count" -gt 0 ] && [ "$brace_line" -lt "$(wc -l < "$file")" ]; do
                brace_line=$((brace_line + 1))
                local line_content=$(sed -n "${brace_line}p" "$file")
                arrow_body="$arrow_body\n$line_content"
                
                # Count opening braces
                local open_count=$(grep -o "{" <<< "$line_content" | wc -l)
                # Count closing braces
                local close_count=$(grep -o "}" <<< "$line_content" | wc -l)
                
                brace_count=$((brace_count + open_count - close_count))
            done
        else
            # Single-line arrow function
            arrow_body=$(sed -n "${line_num}p" "$file")
        fi
        
        # Extract parameters
        local params=""
        if [[ "$arrow_sig" =~ \(([^)]*)\) ]]; then
            # Multiple parameters in parentheses
            params="${BASH_REMATCH[1]}"
        else
            # Single parameter without parentheses
            params=$(echo "$arrow_sig" | sed -E 's/([a-zA-Z0-9_]+) +=> .*/\1/')
        fi
        
        # Parse each parameter
        IFS=',' read -ra PARAM_ARRAY <<< "$params"
        for param in "${PARAM_ARRAY[@]}"; do
            # Extract parameter name (ignoring type annotations)
            param_name=$(echo "$param" | sed -E 's/([a-zA-Z0-9_]+)(:.*)?/\1/' | tr -d ' ')
            
            if [ -z "$param_name" ]; then
                continue
            fi
            
            # Skip if parameter has underscore prefix
            if [[ "$param_name" == _* ]]; then
                continue
            fi
            
            # Check if parameter is used in function body
            if ! grep -q "\b$param_name\b" <<< "$(echo "$arrow_body" | grep -v "^${line_num}:" | grep -v "$param_name *=>")"; then
                results+=("$line_num:$param_name")
                echo "Found unused parameter: $param_name at line $line_num"
            fi
        done
    done <<< "$arrow_lines"
    
    # Check for unused destructured variables
    echo "Checking for unused destructured variables..."
    local destructuring_lines=$(grep -n -E 'const \{[^}]*\}' "$file")
    
    while IFS= read -r dest_line; do
        if [ -z "$dest_line" ]; then
            continue
        fi
        
        line_num=$(echo "$dest_line" | cut -d':' -f1)
        dest_sig=$(echo "$dest_line" | cut -d':' -f2-)
        
        # Extract destructured variables
        if [[ "$dest_sig" =~ \{([^}]*)\} ]]; then
            local vars="${BASH_REMATCH[1]}"
            
            # Parse each variable
            IFS=',' read -ra VAR_ARRAY <<< "$vars"
            for var in "${VAR_ARRAY[@]}"; do
                # Extract variable name
                var_name=$(echo "$var" | sed -E 's/([a-zA-Z0-9_]+)(:.*)?/\1/' | tr -d ' ')
                
                if [ -z "$var_name" ]; then
                    continue
                fi
                
                # Get the file content without the declaration line
                file_content=$(sed -e "${line_num}d" "$file")
                
                # Check if variable is used elsewhere in the file
                if ! grep -q "\b$var_name\b" <<< "$file_content"; then
                    results+=("$line_num:$var_name")
                    echo "Found unused destructured variable: $var_name at line $line_num"
                fi
            done
        fi
    done <<< "$destructuring_lines"
    
    # Save results to file
    > "$output_file"
    for result in "${results[@]}"; do
        echo "$result" >> "$output_file"
    done
    
    echo "Found ${#results[@]} unused variables."
    echo "Results saved to $output_file"
    
    # Return the path to the output file
    echo "$output_file"
}

# Function to fix unused variables in a file
fix_unused_vars() {
    local file="$1"
    local parsed_output="$2"
    local fixed=0
    
    echo "Fixing unused variables in $file..."
    
    # Create backup
    local backup_file="$BACKUP_DIR/$(basename "$file").backup"
    cp "$file" "$backup_file"
    echo "Backup created at $backup_file"
    
    # Read each line of the parsed output
    while IFS= read -r line; do
        if [ -z "$line" ]; then
            continue
        fi
        
        line_num=$(echo "$line" | cut -d':' -f1)
        var_name=$(echo "$line" | cut -d':' -f2)
        
        # Skip if the variable already has an underscore prefix
        if [[ "$var_name" == _* ]]; then
            echo "Variable $var_name at line $line_num already has an underscore prefix. Skipping."
            continue
        fi
        
        # Replace the variable name with an underscore prefix
        if $dry_run; then
            echo "Would fix: Line $line_num, variable '$var_name' -> '_$var_name'"
        else
            # Carefully replace only the variable name at the correct position
            sed -i.tmp "$line_num s/\b$var_name\b/_$var_name/g" "$file"
            rm -f "$file.tmp"
            echo "Fixed: Line $line_num, variable '$var_name' -> '_$var_name'"
            fixed=$((fixed + 1))
        fi
    done < "$parsed_output"
    
    if $dry_run; then
        echo "Dry run complete. Would have fixed $fixed unused variables."
    else
        echo "Fixed $fixed unused variables."
    fi
}

# Main execution

# If target is a directory, process all TypeScript files
if [ -d "$target" ]; then
    echo "Processing all TypeScript files in $target..."
    for ts_file in $(find "$target" -name "*.ts" -o -name "*.tsx"); do
        parsed_output=$(detect_unused_vars "$ts_file")
        
        # Check if any unused variables were found
        if grep -q ":" "$parsed_output"; then
            fix_unused_vars "$ts_file" "$parsed_output"
        else
            echo "No unused variables found in $ts_file. Nothing to fix."
        fi
    done
else
    # Process a single file
    if [[ ! "$target" =~ \.(ts|tsx)$ ]]; then
        echo "Warning: Target file doesn't have a .ts or .tsx extension. Continuing anyway."
    fi
    
    parsed_output=$(detect_unused_vars "$target")
    
    # Check if any unused variables were found
    if grep -q ":" "$parsed_output"; then
        fix_unused_vars "$target" "$parsed_output"
    else
        echo "No unused variables found. Nothing to fix."
    fi
fi

echo "Script execution completed." 