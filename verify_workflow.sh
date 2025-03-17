#!/bin/bash

# verify_workflow.sh - Simple verification script for error correction workflow

# Define script directory and base directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Error Correction Workflow Verification ==="
echo "Base directory: $BASE_DIR"

# Check if required scripts exist
echo "Checking for required scripts..."
REQUIRED_SCRIPTS=("analyze_all.sh" "analyze_typescript.sh" "fix_resource_types.sh" "fix_unused_vars.sh")
MISSING_SCRIPTS=0

for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [ -f "$BASE_DIR/Scripts/$script" ]; then
    echo "✓ Found $script"
  else
    echo "✗ Missing $script"
    MISSING_SCRIPTS=$((MISSING_SCRIPTS+1))
  fi
done

if [ $MISSING_SCRIPTS -eq 0 ]; then
  echo "All required scripts exist."
else
  echo "Warning: $MISSING_SCRIPTS script(s) missing."
fi

# Create required directories
echo "Creating required directories..."
mkdir -p "$BASE_DIR/Analysis/TypeScript"
mkdir -p "$BASE_DIR/Analysis/ESLint"
mkdir -p "$BASE_DIR/Categories"
mkdir -p "$BASE_DIR/Reports"
mkdir -p "$BASE_DIR/Fixes/Templates"

echo "Basic setup complete."
echo ""
echo "To run the full workflow, use: cd $BASE_DIR && ./Scripts/analyze_all.sh" 