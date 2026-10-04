#!/bin/bash

# run_targeted_fixes.sh
#
# Purpose: Unified script runner that can execute multiple fix scripts
# based on error analysis and priorities. Features:
#   1. Run fixes based on error analysis
#   2. Command-line options for fix types
#   3. Progressive mode (fix easiest errors first)
#   4. Scope limiting functionality (single directory/file)
#
# Usage: ./run_targeted_fixes.sh [options]
#
# Options:
#   --target=<path>       Target file or directory (default: src/)
#   --fix=<fix_type>      Type of fix to apply (resource|type|null|all)
#   --progressive         Run in progressive mode (easiest fixes first)
#   --dry-run             Show what would be fixed without making changes
#   --analyze-first       Analyze errors before applying fixes
#   --verification        Run tests after fixes are applied
#
# Created: Based on Future_Advancements.md tasklist

# Set strict mode
set -euo pipefail

# Default values
TARGET="src/"
FIX_TYPE="all"
PROGRESSIVE=false
DRY_RUN=false
ANALYZE_FIRST=false
VERIFICATION=false

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --target=*)
      TARGET="${arg#*=}"
      ;;
    --fix=*)
      FIX_TYPE="${arg#*=}"
      ;;
    --progressive)
      PROGRESSIVE=true
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    --analyze-first)
      ANALYZE_FIRST=true
      ;;
    --verification)
      VERIFICATION=true
      ;;
    --help)
      echo "Usage: ./run_targeted_fixes.sh [options]"
      echo ""
      echo "Options:"
      echo "  --target=<path>       Target file or directory (default: src/)"
      echo "  --fix=<fix_type>      Type of fix to apply (resource|type|null|all)"
      echo "  --progressive         Run in progressive mode (easiest fixes first)"
      echo "  --dry-run             Show what would be fixed without making changes"
      echo "  --analyze-first       Analyze errors before applying fixes"
      echo "  --verification        Run tests after fixes are applied"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Use --help for usage information."
      exit 1
      ;;
  esac
done

# Make sure the target exists
if [ ! -e "$TARGET" ]; then
  echo "Error: Target not found: $TARGET"
  exit 1
fi

# Validate fix type
if [[ ! "$FIX_TYPE" =~ ^(resource|type|null|all)$ ]]; then
  echo "Error: Invalid fix type: $FIX_TYPE"
  echo "Valid fix types: resource, type, null, all"
  exit 1
fi

# Create a timestamp for logs and backups
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_DIR="../Reports/$TIMESTAMP"
mkdir -p "$LOG_DIR"

echo "=== Targeted Fix Runner ==="
echo "Target:       $TARGET"
echo "Fix type:     $FIX_TYPE"
echo "Progressive:  $PROGRESSIVE"
echo "Dry run:      $DRY_RUN"
echo "Log directory: $LOG_DIR"

# Function to run analysis script
run_analysis() {
  if [ -f "../Scripts/run_full_analysis.sh" ]; then
    echo "Running error analysis..."
    ../Scripts/run_full_analysis.sh --target="$TARGET" > "$LOG_DIR/pre_fix_analysis.log"
    
    # Extract error counts for different types
    local resource_errors=$(grep -c "Type.*expected.*ResourceType" "$LOG_DIR/pre_fix_analysis.log" || echo "0")
    local type_errors=$(grep -c "Type.*any" "$LOG_DIR/pre_fix_analysis.log" || echo "0")
    local null_errors=$(grep -c "Object is possibly 'null' or 'undefined'" "$LOG_DIR/pre_fix_analysis.log" || echo "0")
    
    echo "Error counts:"
    echo "  Resource type errors: $resource_errors"
    echo "  Type safety errors:   $type_errors"
    echo "  Null safety errors:   $null_errors"
    
    # Store error counts
    echo "$resource_errors" > "$LOG_DIR/resource_errors"
    echo "$type_errors" > "$LOG_DIR/type_errors"
    echo "$null_errors" > "$LOG_DIR/null_errors"
  else
    echo "Warning: Analysis script not found, skipping analysis."
  fi
}

# Function to determine fix order based on error counts
determine_fix_order() {
  if [ -f "$LOG_DIR/resource_errors" ] && [ -f "$LOG_DIR/type_errors" ] && [ -f "$LOG_DIR/null_errors" ]; then
    local resource_errors=$(cat "$LOG_DIR/resource_errors")
    local type_errors=$(cat "$LOG_DIR/type_errors")
    local null_errors=$(cat "$LOG_DIR/null_errors")
    
    # Create array of fix types with their error counts
    declare -A error_counts
    error_counts["resource"]=$resource_errors
    error_counts["type"]=$type_errors
    error_counts["null"]=$null_errors
    
    # Sort fix types by error count (easiest/fewest first for progressive mode)
    if [ "$PROGRESSIVE" = true ]; then
      # Sort by ascending error count (fewest first)
      echo "Determining fix order based on error counts (progressive mode - easiest first)..."
      FIXES_SORTED=$(for fix in "${!error_counts[@]}"; do 
        echo "$fix ${error_counts[$fix]}"
      done | sort -k2,2n | cut -d' ' -f1)
    else
      # Sort by descending error count (most errors first)
      echo "Determining fix order based on error counts (targeting most errors first)..."
      FIXES_SORTED=$(for fix in "${!error_counts[@]}"; do 
        echo "$fix ${error_counts[$fix]}"
      done | sort -k2,2nr | cut -d' ' -f1)
    fi
    
    # Convert to array
    FIXES_TO_RUN=()
    for fix in $FIXES_SORTED; do
      FIXES_TO_RUN+=("$fix")
    done
    
    echo "Fix order: ${FIXES_TO_RUN[*]}"
  else
    # Default order if no analysis results
    if [ "$PROGRESSIVE" = true ]; then
      FIXES_TO_RUN=("resource" "null" "type")
    else
      FIXES_TO_RUN=("resource" "type" "null")
    fi
    echo "No analysis results found, using default fix order: ${FIXES_TO_RUN[*]}"
  fi
}

# Function to run a specific fix script
run_fix_script() {
  local fix_type="$1"
  local dry_run_flag=""
  
  if [ "$DRY_RUN" = true ]; then
    dry_run_flag="--dry-run"
  fi
  
  case "$fix_type" in
    "resource")
      echo "Running ResourceType fixes..."
      if [ -f "../Scripts/fix_resource_types_advanced.sh" ]; then
        ../Scripts/fix_resource_types_advanced.sh $dry_run_flag --target="$TARGET" > "$LOG_DIR/resource_fix.log"
      else
        echo "Warning: ResourceType fix script not found."
      fi
      ;;
    "type")
      echo "Running Type Safety fixes..."
      if [ -f "../Scripts/fix_type_safety.sh" ]; then
        ../Scripts/fix_type_safety.sh $dry_run_flag --target="$TARGET" > "$LOG_DIR/type_fix.log"
      else
        echo "Warning: Type Safety fix script not found."
      fi
      ;;
    "null")
      echo "Running Null Safety fixes..."
      if [ -f "../Scripts/fix_null_safety.sh" ]; then
        ../Scripts/fix_null_safety.sh $dry_run_flag --target="$TARGET" > "$LOG_DIR/null_fix.log"
      else
        echo "Warning: Null Safety fix script not found."
      fi
      ;;
    *)
      echo "Unknown fix type: $fix_type"
      ;;
  esac
}

# Function to run tests after fixes
run_verification() {
  if [ -f "../Tests/test_resource_type_fixes.sh" ]; then
    echo "Running verification tests..."
    ../Tests/test_resource_type_fixes.sh > "$LOG_DIR/verification.log"
    
    # Check for failures
    if grep -q "❌" "$LOG_DIR/verification.log"; then
      echo "⚠️ Some verification tests failed. See $LOG_DIR/verification.log for details."
    else
      echo "✅ All verification tests passed."
    fi
  else
    echo "Warning: Verification tests not found."
  fi
  
  # Run analysis again to compare error counts
  if [ "$ANALYZE_FIRST" = true ] && [ -f "../Scripts/run_full_analysis.sh" ]; then
    echo "Running post-fix analysis..."
    ../Scripts/run_full_analysis.sh --target="$TARGET" > "$LOG_DIR/post_fix_analysis.log"
    
    # Compare error counts
    if [ -f "$LOG_DIR/pre_fix_analysis.log" ] && [ -f "$LOG_DIR/post_fix_analysis.log" ]; then
      local pre_errors=$(grep -c "error TS" "$LOG_DIR/pre_fix_analysis.log" || echo "0")
      local post_errors=$(grep -c "error TS" "$LOG_DIR/post_fix_analysis.log" || echo "0")
      local fixed=$((pre_errors - post_errors))
      local percentage=0
      
      if [ "$pre_errors" -gt 0 ]; then
        percentage=$((fixed * 100 / pre_errors))
      fi
      
      echo "Error reduction:"
      echo "  Before: $pre_errors errors"
      echo "  After:  $post_errors errors"
      echo "  Fixed:  $fixed errors ($percentage%)"
    fi
  fi
}

# Main execution
if [ "$ANALYZE_FIRST" = true ]; then
  run_analysis
fi

if [ "$FIX_TYPE" = "all" ]; then
  # Determine the order of fixes
  determine_fix_order
  
  # Run all fix scripts in the determined order
  for fix in "${FIXES_TO_RUN[@]}"; do
    run_fix_script "$fix"
  done
else
  # Run only the specified fix
  run_fix_script "$FIX_TYPE"
fi

if [ "$VERIFICATION" = true ]; then
  run_verification
fi

echo "=== Fixes Completed ==="
echo "Logs and results stored in: $LOG_DIR" 