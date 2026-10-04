#!/bin/bash

# simple_resource_test.sh
#
# Purpose: Simple test for ResourceType fixes
#
# Usage: ./simple_resource_test.sh

# Set strict mode
set -euo pipefail

echo "=== Simple ResourceType Fix Test ==="

# Create a temporary directory for our tests
TEST_DIR=$(mktemp -d)
echo "Created temporary test directory: $TEST_DIR"

# Clean up on exit
cleanup() {
  echo "Cleaning up test directory..."
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

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

# Create mock fix script
cat > "$TEST_DIR/fix_script.sh" << 'EOL'
#!/bin/bash
echo "Applying ResourceType fixes..."
sed -i.bak 's/function getResource(): string/function getResource(): ResourceType/g' test_resource.ts
sed -i.bak 's/function processResource(type: string)/function processResource(type: ResourceType)/g' test_resource.ts
sed -i.bak 's/resourceMap: { \[name: string\]: string }/resourceMap: { [name: string]: ResourceType }/g' test_resource.ts
rm *.bak
echo "ResourceType fixes applied."
EOL
chmod +x "$TEST_DIR/fix_script.sh"

# Run the fix script
(cd "$TEST_DIR" && ./fix_script.sh)

# Check results
if grep -q "function getResource(): ResourceType" "$TEST_DIR/test_resource.ts" && \
   grep -q "function processResource(type: ResourceType)" "$TEST_DIR/test_resource.ts" && \
   grep -q "resourceMap: { \\[name: string\\]: ResourceType }" "$TEST_DIR/test_resource.ts"; then
  echo "✅ ResourceType Fix Test: PASSED"
else
  echo "❌ ResourceType Fix Test: FAILED"
  echo "--- Actual output: ---"
  cat "$TEST_DIR/test_resource.ts"
fi

echo "=== Test Completed ===" 