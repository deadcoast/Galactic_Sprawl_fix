#!/bin/bash

# test_fix_scripts.sh
#
# Purpose: Test the error analysis and fix scripts on sample files
# This script runs the analysis and fix scripts on test files and verifies the results
#
# Usage: ./test_fix_scripts.sh
#
# Created: March 17, 2023
# Author: Claude AI Assistant

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

# Test files
RESOURCE_TEST_FILE="$SCRIPT_DIR/test_resource_types.ts"
UNUSED_VARS_TEST_FILE="$SCRIPT_DIR/test_unused_vars.ts"

# Create a temporary directory for testing
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "=== Galactic Sprawl Error Correction Scripts Test ==="
echo "Temporary test directory: $TEMP_DIR"

# Function to check if a command exists
check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}Error: $1 command not found.${NC}"
    return 1
  fi
  return 0
}

# Function to run a test and verify the result
run_test() {
  local test_name="$1"
  local command="$2"
  local verification_command="$3"
  
  echo -e "\n${YELLOW}Running test: $test_name${NC}"
  echo "Command: $command"
  
  # Run the command
  eval "$command"
  local exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    echo -e "${RED}Test failed: Command exited with code $exit_code${NC}"
    return 1
  fi
  
  # Run verification command
  echo "Verifying results..."
  eval "$verification_command"
  local verification_exit_code=$?
  
  if [ $verification_exit_code -eq 0 ]; then
    echo -e "${GREEN}Test passed: $test_name${NC}"
    return 0
  else
    echo -e "${RED}Test failed: Verification failed with code $verification_exit_code${NC}"
    return 1
  fi
}

# Function to copy a file to the temp directory
copy_to_temp() {
  local source_file="$1"
  local dest_file="$TEMP_DIR/$(basename "$source_file")"
  
  cp "$source_file" "$dest_file"
  echo "Copied $source_file to $dest_file"
  
  echo "$dest_file"
}

# Setup: Check for required tools
echo "Checking for required tools..."
check_command "node" || exit 1
check_command "npx" || exit 1
check_command "grep" || exit 1
check_command "sed" || exit 1

# Test 1: Test analyze_typescript.sh
test_analyze_typescript() {
  local test_file=$(copy_to_temp "$RESOURCE_TEST_FILE")
  
  # Run analyze_typescript.sh on the test file
  echo "Running analyze_typescript.sh on $test_file..."
  
  # Create a temporary output directory
  local output_dir="$TEMP_DIR/typescript_analysis"
  mkdir -p "$output_dir"
  
  # Run the analysis script
  local command="cd \"$BASE_DIR\" && ./Scripts/analyze_typescript.sh --output-dir=\"$output_dir\" --verbose"
  local verification="[ -f \"$output_dir/typescript_error_report_$(date +\"%Y-%m-%d\").md\" ] && \
    [ -f \"$output_dir/resource_type_errors.txt\" ] && \
    grep -q \"ResourceType\" \"$output_dir/resource_type_errors.txt\""
  
  run_test "analyze_typescript.sh" "$command" "$verification"
  return $?
}

# Test 2: Test fix_resource_types.sh
test_fix_resource_types() {
  local test_file=$(copy_to_temp "$RESOURCE_TEST_FILE")
  
  # Check initial content
  local initial_check=$(grep -c "'minerals'" "$test_file" || echo "0")
  if [ "$initial_check" -eq 0 ]; then
    echo -e "${RED}Test file doesn't contain expected string literals.${NC}"
    return 1
  fi
  
  # Run fix_resource_types.sh on the test file
  echo "Running fix_resource_types.sh on $test_file..."
  
  # First run in dry-run mode to test that functionality
  local dry_run_command="cd \"$BASE_DIR\" && ./Scripts/fix_resource_types.sh --dry-run --target=\"$test_file\""
  local dry_run_verification="grep -q \"'minerals'\" \"$test_file\"" # Should still contain the string literals
  
  if ! run_test "fix_resource_types.sh (dry run)" "$dry_run_command" "$dry_run_verification"; then
    return 1
  fi
  
  # Now run for real
  local command="cd \"$BASE_DIR\" && ./Scripts/fix_resource_types.sh --target=\"$test_file\""
  local verification="grep -q \"ResourceType.MINERALS\" \"$test_file\" && \
    ! grep -q \"'minerals'\" \"$test_file\" && \
    grep -q \"import { ResourceType }\" \"$test_file\""
  
  run_test "fix_resource_types.sh" "$command" "$verification"
  return $?
}

# Test 3: Test fix_unused_vars.sh
test_fix_unused_vars() {
  local test_file=$(copy_to_temp "$UNUSED_VARS_TEST_FILE")
  
  # Check initial content
  local initial_check=$(grep -c "const count" "$test_file" || echo "0")
  if [ "$initial_check" -eq 0 ]; then
    echo -e "${RED}Test file doesn't contain expected unused variables.${NC}"
    return 1
  fi
  
  # Run fix_unused_vars.sh on the test file
  echo "Running fix_unused_vars.sh on $test_file..."
  
  # First run in dry-run mode to test that functionality
  local dry_run_command="cd \"$BASE_DIR\" && ./Scripts/fix_unused_vars.sh --dry-run --target=\"$test_file\""
  local dry_run_verification="grep -q \"const count\" \"$test_file\"" # Should still contain the original variable name
  
  if ! run_test "fix_unused_vars.sh (dry run)" "$dry_run_command" "$dry_run_verification"; then
    return 1
  fi
  
  # Now run for real
  local command="cd \"$BASE_DIR\" && ./Scripts/fix_unused_vars.sh --target=\"$test_file\""
  local verification="grep -q \"const _count\" \"$test_file\" && \
    ! grep -q \"const count =\" \"$test_file\""
  
  run_test "fix_unused_vars.sh" "$command" "$verification"
  return $?
}

# Test 4: Test analyze_all.sh
test_analyze_all() {
  # Make a copy of both test files in a new directory
  local test_dir="$TEMP_DIR/src"
  mkdir -p "$test_dir"
  
  cp "$RESOURCE_TEST_FILE" "$test_dir/"
  cp "$UNUSED_VARS_TEST_FILE" "$test_dir/"
  
  # Run analyze_all.sh
  echo "Running analyze_all.sh..."
  
  # Temporarily modify the analyze_all.sh script to target our test directory
  local temp_script="$TEMP_DIR/analyze_all.sh"
  cp "$BASE_DIR/Scripts/analyze_all.sh" "$temp_script"
  chmod +x "$temp_script"
  
  # Replace src/ with our test directory in the script
  sed -i.bak "s|src/|$test_dir/|g" "$temp_script"
  
  local command="cd \"$BASE_DIR\" && \"$temp_script\""
  local verification="[ -f \"$BASE_DIR/Reports/error_summary_$(date +\"%Y-%m-%d\").md\" ] && \
    [ -f \"$BASE_DIR/Reports/priority_report_$(date +\"%Y-%m-%d\").md\" ]"
  
  run_test "analyze_all.sh" "$command" "$verification"
  return $?
}

# Run all tests
echo "Starting tests..."

# Run tests and track results
test_results=()

if test_analyze_typescript; then
  test_results+=("analyze_typescript.sh: PASSED")
else
  test_results+=("analyze_typescript.sh: FAILED")
fi

if test_fix_resource_types; then
  test_results+=("fix_resource_types.sh: PASSED")
else
  test_results+=("fix_resource_types.sh: FAILED")
fi

if test_fix_unused_vars; then
  test_results+=("fix_unused_vars.sh: PASSED")
else
  test_results+=("fix_unused_vars.sh: FAILED")
fi

if test_analyze_all; then
  test_results+=("analyze_all.sh: PASSED")
else
  test_results+=("analyze_all.sh: FAILED")
fi

# Print summary
echo -e "\n${YELLOW}=== Test Summary ===${NC}"
for result in "${test_results[@]}"; do
  if [[ $result == *": PASSED" ]]; then
    echo -e "${GREEN}$result${NC}"
  else
    echo -e "${RED}$result${NC}"
  fi
done

# Check if all tests passed
if [[ ! " ${test_results[*]} " =~ " FAILED" ]]; then
  echo -e "\n${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed.${NC}"
  exit 1
fi 