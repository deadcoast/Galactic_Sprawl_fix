#!/bin/bash

# Simple test script to check if scripts exist and are executable

# Define paths
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$BASE_DIR/Scripts"
TEST_DIR="$BASE_DIR/Tests"

echo "=== Error Correction Workflow Simple Test ==="
echo "Base directory: $BASE_DIR"
echo "Scripts directory: $SCRIPTS_DIR"
echo "Test directory: $TEST_DIR"

# Check if scripts exist
echo "Checking if scripts exist..."
for script in "analyze_all.sh" "analyze_typescript.sh" "fix_resource_types.sh" "fix_unused_vars.sh"; do
  if [ -f "$SCRIPTS_DIR/$script" ]; then
    echo "✓ $script exists"
  else
    echo "✗ $script does not exist"
  fi
done

# Make scripts executable
echo "Making scripts executable..."
chmod +x "$SCRIPTS_DIR"/*.sh

# Check for test files
echo "Checking test files..."
for file in "test_resource_types.ts" "test_unused_vars.ts"; do
  if [ -f "$TEST_DIR/$file" ]; then
    echo "✓ $file exists"
  else
    echo "✗ $file does not exist"
  fi
done

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p "$BASE_DIR/Analysis/TypeScript"
mkdir -p "$BASE_DIR/Categories"
mkdir -p "$BASE_DIR/Fixes/Templates"
mkdir -p "$BASE_DIR/Reports"

echo "Directory structure created."
echo "Test complete." 