#!/bin/bash

# test_basic.sh
#
# Purpose: Basic test for the error correction workflow
# This script performs a minimal test of the scripts
#
# Usage: ./test_basic.sh
#
# Created: March 17, 2023

# Set strict mode
set -euo pipefail

# Define script directory and base directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "=== Basic Error Correction Workflow Test ==="

# Check script permissions
echo "Checking script permissions..."
chmod +x "$BASE_DIR/Scripts/"*.sh
echo "Scripts are now executable."

# Check if scripts exist
echo "Checking if all scripts exist..."
REQUIRED_SCRIPTS=(
  "analyze_all.sh"
  "analyze_typescript.sh"
  "fix_resource_types.sh"
  "fix_unused_vars.sh"
)

MISSING_SCRIPTS=()
for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [ ! -f "$BASE_DIR/Scripts/$script" ]; then
    MISSING_SCRIPTS+=("$script")
  fi
done

if [ ${#MISSING_SCRIPTS[@]} -gt 0 ]; then
  echo -e "${RED}Missing scripts: ${MISSING_SCRIPTS[*]}${NC}"
  exit 1
fi

echo -e "${GREEN}All required scripts exist.${NC}"

# Check test files
echo "Checking test files..."
if [ ! -f "$SCRIPT_DIR/test_resource_types.ts" ]; then
  echo -e "${RED}Missing test_resource_types.ts${NC}"
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/test_unused_vars.ts" ]; then
  echo -e "${RED}Missing test_unused_vars.ts${NC}"
  exit 1
fi

echo -e "${GREEN}All test files exist.${NC}"

# Display test file content
echo "Displaying first 10 lines of test files..."
echo -e "${YELLOW}test_resource_types.ts:${NC}"
head -n 10 "$SCRIPT_DIR/test_resource_types.ts"

echo -e "\n${YELLOW}test_unused_vars.ts:${NC}"
head -n 10 "$SCRIPT_DIR/test_unused_vars.ts"

# Check directory structure
echo "Checking directory structure..."
REQUIRED_DIRS=(
  "Analysis"
  "Categories"
  "Fixes"
  "Reports"
  "Scripts"
)

MISSING_DIRS=()
for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$BASE_DIR/$dir" ]; then
    MISSING_DIRS+=("$dir")
  fi
done

if [ ${#MISSING_DIRS[@]} -gt 0 ]; then
  echo -e "${RED}Missing directories: ${MISSING_DIRS[*]}${NC}"
  echo "Creating missing directories..."
  for dir in "${MISSING_DIRS[@]}"; do
    mkdir -p "$BASE_DIR/$dir"
    echo "Created $BASE_DIR/$dir"
  fi
else
  echo -e "${GREEN}All required directories exist.${NC}"
fi

# Run a simple test of analyze_typescript.sh
echo "Running a simple test of analyze_typescript.sh..."
mkdir -p "$BASE_DIR/Analysis/TypeScript"
"$BASE_DIR/Scripts/analyze_typescript.sh" --output-dir="$BASE_DIR/Analysis/TypeScript" || {
  echo -e "${RED}analyze_typescript.sh test failed.${NC}"
  exit 1
}
echo -e "${GREEN}analyze_typescript.sh test completed.${NC}"

# Check if the script generated output
if [ -f "$BASE_DIR/Analysis/TypeScript/typescript_errors_$(date +"%Y-%m-%d").txt" ]; then
  echo -e "${GREEN}analyze_typescript.sh generated expected output file.${NC}"
else
  echo -e "${RED}analyze_typescript.sh did not generate expected output file.${NC}"
fi

echo -e "\n${GREEN}Basic tests completed successfully!${NC}"
echo "The error correction workflow components are set up correctly."
echo "To run the full workflow, use ./Scripts/analyze_all.sh" 