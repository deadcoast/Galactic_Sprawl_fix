#!/bin/bash

# run_analysis_workflow.sh
#
# Purpose: Master script to run the complete analysis and fix workflow
#   1. Analyze the codebase for errors
#   2. Apply fixes based on analysis
#   3. Verify fixes
#
# Usage: ./run_analysis_workflow.sh [--target=<directory>] [--analysis-only] [--fix-only]

# Set strict mode
set -euo pipefail

# Parse arguments
TARGET="src/"
ANALYSIS_ONLY=false
FIX_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --target=*)
      TARGET="${arg#*=}"
      ;;
    --analysis-only)
      ANALYSIS_ONLY=true
      ;;
    --fix-only)
      FIX_ONLY=true
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: ./run_analysis_workflow.sh [--target=<directory>] [--analysis-only] [--fix-only]"
      exit 1
      ;;
  esac
done

# Make sure the target exists
if [ ! -e "$TARGET" ]; then
  echo "Error: Target not found: $TARGET"
  exit 1
fi

# Make sure scripts are executable
chmod +x Analysis/*.sh Fixes/*.sh 2>/dev/null || true

# Function to run analysis
run_analysis() {
  echo "=== Running Code Analysis ==="
  
  if [ -f "./Analysis/run_full_analysis.sh" ]; then
    ./Analysis/run_full_analysis.sh
  else
    echo "Warning: Full analysis script not found."
    
    if [ -f "./Analysis/analyze_typescript.sh" ]; then
      echo "Running TypeScript analysis..."
      ./Analysis/analyze_typescript.sh
    fi
    
    if [ -f "./Analysis/analyze_eslint.sh" ]; then
      echo "Running ESLint analysis..."
      ./Analysis/analyze_eslint.sh
    fi
  fi
  
  echo "Analysis completed."
}

# Function to apply fixes
apply_fixes() {
  echo "=== Applying Fixes ==="
  
  # Run type safety fixes
  if [ -f "./Fixes/fix_type_safety.sh" ]; then
    echo "Applying type safety fixes..."
    ./Fixes/fix_type_safety.sh --target="$TARGET"
  else
    echo "Warning: Type safety fix script not found."
  fi
  
  # Run null safety fixes
  if [ -f "./Fixes/fix_null_safety.sh" ]; then
    echo "Applying null safety fixes..."
    ./Fixes/fix_null_safety.sh --target="$TARGET"
  else
    echo "Warning: Null safety fix script not found."
  fi
  
  # Run resource type fixes
  if [ -f "./Fixes/fix_resource_types_advanced.sh" ]; then
    echo "Applying resource type fixes..."
    ./Fixes/fix_resource_types_advanced.sh --target="$TARGET"
  elif [ -f "./Fixes/fix_resource_types.sh" ]; then
    echo "Applying resource type fixes..."
    ./Fixes/fix_resource_types.sh --target="$TARGET"
  else
    echo "Warning: Resource type fix script not found."
  fi
  
  # Run unused vars fixes
  if [ -f "./Fixes/fix_unused_vars.sh" ]; then
    echo "Applying unused variables fixes..."
    ./Fixes/fix_unused_vars.sh --target="$TARGET"
  else
    echo "Warning: Unused variables fix script not found."
  fi
  
  echo "All fixes applied."
}

# Function to verify fixes
verify_fixes() {
  echo "=== Verifying Fixes ==="
  
  echo "Running TypeScript compiler check..."
  npx tsc --noEmit
  
  echo "Running ESLint check..."
  npx eslint "$TARGET" || true
  
  echo "Verification completed."
}

# Main workflow execution
if [ "$ANALYSIS_ONLY" = false ] && [ "$FIX_ONLY" = false ]; then
  # Run the complete workflow
  run_analysis
  apply_fixes
  verify_fixes
elif [ "$ANALYSIS_ONLY" = true ]; then
  # Run only the analysis
  run_analysis
elif [ "$FIX_ONLY" = true ]; then
  # Run only the fixes
  apply_fixes
  verify_fixes
fi

echo "=== Analysis Workflow Completed ===" 