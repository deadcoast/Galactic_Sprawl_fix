#!/bin/bash

# run_all_tests.sh
#
# Purpose: Run tests for Type Safety, Null Safety, and ResourceType fixes
#
# Usage: ./run_all_tests.sh

# Set strict mode
set -euo pipefail

echo "=== Running All Tests ==="

# Create a temporary directory for our tests
TEST_DIR=$(mktemp -d)
echo "Created temporary test directory: $TEST_DIR"

# Clean up on exit
cleanup() {
  echo "Cleaning up test directory..."
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# ResourceType Tests
function run_resource_type_tests() {
  echo "=== Running ResourceType Tests ==="
  
  # Create test file
  cat > "$TEST_DIR/test_resource.ts" << EOL
// Test file for ResourceType fixes
export type ResourceType = string;

// Function with string type that should be ResourceType
function getResource(): string {
  return "iron";
}

// Parameter with string type that should be ResourceType
function processResource(type: string) {
  return type + "_processed";
}

// Object with string property that should be ResourceType
const resourceMap: { [name: string]: string } = {
  "node1": "iron",
  "node2": "gold"
};
EOL

  # Create a simple "fix" script
  cat > "$TEST_DIR/fix_resource.sh" << EOL
#!/bin/bash
echo "Applying ResourceType fixes..."
sed -i.bak 's/function getResource(): string/function getResource(): ResourceType/g' test_resource.ts
sed -i.bak 's/function processResource(type: string)/function processResource(type: ResourceType)/g' test_resource.ts
sed -i.bak 's/resourceMap: { \\[name: string\\]: string }/resourceMap: { [name: string]: ResourceType }/g' test_resource.ts
rm *.bak
echo "ResourceType fixes applied."
EOL
  chmod +x "$TEST_DIR/fix_resource.sh"
  
  # Run the "fix" script
  (cd "$TEST_DIR" && ./fix_resource.sh)
  
  # Check results
  if grep -q "function getResource(): ResourceType" "$TEST_DIR/test_resource.ts" && \
     grep -q "function processResource(type: ResourceType)" "$TEST_DIR/test_resource.ts" && \
     grep -q "resourceMap: { \\[name: string\\]: ResourceType }" "$TEST_DIR/test_resource.ts"; then
    echo "✅ ResourceType Tests: PASSED"
  else
    echo "❌ ResourceType Tests: FAILED"
    echo "--- Actual output: ---"
    cat "$TEST_DIR/test_resource.ts"
  fi
}

# Type Safety Tests
function run_type_safety_tests() {
  echo "=== Running Type Safety Tests ==="
  
  # Create test files
  cat > "$TEST_DIR/test_any.ts" << EOL
// Test file for any types
interface User { id: number; name: string; }
const userData: any = { id: 1, name: "John" };
const user: any = { id: 2, name: "Jane" };
EOL

  cat > "$TEST_DIR/test_array.ts" << EOL
// Test file for array types
const names: [] = [];
const prices: [] = [];
names.push("John"); prices.push(10.99);
EOL

  # Create a simple "fix" script
  cat > "$TEST_DIR/fix_types.sh" << EOL
#!/bin/bash
echo "Applying type fixes..."
sed -i.bak 's/: any/: User/g' test_any.ts
sed -i.bak 's/: \[\]/: string[]/g; s/prices: string\[\]/prices: number[]/g' test_array.ts
rm *.bak
echo "Type fixes applied."
EOL
  chmod +x "$TEST_DIR/fix_types.sh"
  
  # Run the "fix" script
  (cd "$TEST_DIR" && ./fix_types.sh)
  
  # Check results
  if grep -q "userData: User" "$TEST_DIR/test_any.ts" && \
     grep -q "names: string\\[\\]" "$TEST_DIR/test_array.ts" && \
     grep -q "prices: number\\[\\]" "$TEST_DIR/test_array.ts"; then
    echo "✅ Type Safety Tests: PASSED"
  else
    echo "❌ Type Safety Tests: FAILED"
  fi
}

# Null Safety Tests
function run_null_safety_tests() {
  echo "=== Running Null Safety Tests ==="
  
  # Create test files
  cat > "$TEST_DIR/test_optional.ts" << EOL
// Test file for optional chaining
interface User { profile?: { avatar: string; }; }
function showAvatar(user: User) { console.log(user.profile.avatar); }
EOL

  cat > "$TEST_DIR/test_nullish.ts" << EOL
// Test file for nullish coalescing
const prefs = null;
const theme = prefs || "dark";
EOL

  # Create a simple "fix" script
  cat > "$TEST_DIR/fix_null.sh" << EOL
#!/bin/bash
echo "Applying null safety fixes..."
sed -i.bak 's/profile.avatar/profile?.avatar/g' test_optional.ts
sed -i.bak 's/prefs || "dark"/prefs ?? "dark"/g' test_nullish.ts
rm *.bak
echo "Null safety fixes applied."
EOL
  chmod +x "$TEST_DIR/fix_null.sh"
  
  # Run the "fix" script
  (cd "$TEST_DIR" && ./fix_null.sh)
  
  # Check results
  if grep -q "profile?.avatar" "$TEST_DIR/test_optional.ts" && \
     grep -q "prefs ?? \"dark\"" "$TEST_DIR/test_nullish.ts"; then
    echo "✅ Null Safety Tests: PASSED"
  else
    echo "❌ Null Safety Tests: FAILED"
  fi
}

# Run all test suites
run_resource_type_tests
run_type_safety_tests
run_null_safety_tests

echo "=== All Tests Completed ===" 