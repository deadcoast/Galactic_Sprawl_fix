#!/bin/bash

# test_resource_type_fixes.sh
#
# Purpose: Test the enhanced ResourceType fix script to ensure it correctly fixes:
#   1. Function signatures returning string resource types
#   2. Function parameters using string instead of ResourceType
#   3. Import handling for ResourceType
#   4. Object property access patterns
#
# Usage: ./test_resource_type_fixes.sh

# Set strict mode
set -euo pipefail

# Create a temporary directory for our tests
TEST_DIR=$(mktemp -d)
echo "Created temporary test directory: $TEST_DIR"

# Cleanup function to run on exit
cleanup() {
  echo "Cleaning up test directory..."
  rm -rf "$TEST_DIR"
}

# Register the cleanup function to be called on exit
trap cleanup EXIT

# Define some test cases
create_test_files() {
  # Test Case 1: Function signatures returning string resources
  cat > "$TEST_DIR/test_function_signatures.ts" << EOL
// Test case for function return types
export function getResourceType(): string {
  return 'minerals';
}

export function fetchResourceType(id: number): string {
  if (id === 1) {
    return 'gas';
  } else if (id === 2) {
    return 'energy';
  }
  return 'minerals';
}

// This function should not be changed (not resource related)
export function getName(): string {
  return 'John';
}
EOL

  # Test Case 2: Function parameters using string
  cat > "$TEST_DIR/test_function_parameters.ts" << EOL
// Test case for function parameters
export function processResource(resource: string) {
  console.log("Processing resource:", resource);
}

export function calculateResourceValue(type: string, amount: number): number {
  if (type === 'minerals') {
    return amount * 2;
  } else if (type === 'gas') {
    return amount * 3;
  }
  return amount;
}

export function batchProcess(resources: string[], quantities: number[]) {
  resources.forEach((resource, index) => {
    console.log(\`Processing \${resource}: \${quantities[index]}\`);
  });
}

// This function should not be changed (not resource related)
export function formatName(name: string): string {
  return name.toUpperCase();
}
EOL

  # Test Case 3: Object property access
  cat > "$TEST_DIR/test_object_properties.ts" << EOL
// Test case for object property access
export interface Resource {
  id: number;
  type: string;
  amount: number;
}

export function processResources(resources: Resource[]) {
  resources.forEach(resource => {
    if (resource.type === 'minerals') {
      console.log('Found minerals:', resource.amount);
    } else if (resource.type === 'gas') {
      console.log('Found gas:', resource.amount);
    }
  });
}

export function calculateTotal(resource: { type: string, amount: number }) {
  if (resource.type === 'energy') {
    return resource.amount * 1.5;
  }
  return resource.amount;
}

// Resource type checking in conditionals
export function isValuableResource(resource: Resource): boolean {
  return resource.type === 'minerals' || resource.type === 'gas';
}
EOL

  # Test Case 4: Interface definitions
  cat > "$TEST_DIR/test_interfaces.ts" << EOL
// Test case for interface definitions
export interface ResourceData {
  id: number;
  resourceType: string;
  amount: number;
}

export type ResourceRequest = {
  requestedType: string;
  quantity: number;
};

export interface ResourceContainer {
  resources: {
    type: string;
    amount: number;
  }[];
}

// This interface should not be changed (not resource related)
export interface UserData {
  id: number;
  name: string;
}
EOL

  echo "Test files created successfully"
}

# Function to test the fix
run_tests() {
  # Create the test files
  create_test_files
  
  # Copy the fix script to the test directory
  cp "../Scripts/fix_resource_types_advanced.sh" "$TEST_DIR/"
  chmod +x "$TEST_DIR/fix_resource_types_advanced.sh"
  
  # Run the fix script on the test directory
  (cd "$TEST_DIR" && ./fix_resource_types_advanced.sh --target=.)
  
  # Now verify the fixes
  
  # Test Case 1: Function signatures
  echo "Testing function signature fixes..."
  if grep -q "getResourceType(): ResourceType" "$TEST_DIR/test_function_signatures.ts" && \
     grep -q "fetchResourceType(id: number): ResourceType" "$TEST_DIR/test_function_signatures.ts" && \
     grep -q "return ResourceType.MINERALS" "$TEST_DIR/test_function_signatures.ts" && \
     grep -q "return ResourceType.GAS" "$TEST_DIR/test_function_signatures.ts" && \
     grep -q "return ResourceType.ENERGY" "$TEST_DIR/test_function_signatures.ts" && \
     grep -q "getName(): string" "$TEST_DIR/test_function_signatures.ts"; then
    echo "✅ Function signature test passed"
  else
    echo "❌ Function signature test failed"
    echo "--- Actual output: ---"
    cat "$TEST_DIR/test_function_signatures.ts"
  fi
  
  # Test Case 2: Function parameters
  echo "Testing function parameter fixes..."
  if grep -q "processResource(resource: ResourceType)" "$TEST_DIR/test_function_parameters.ts" && \
     grep -q "calculateResourceValue(type: ResourceType" "$TEST_DIR/test_function_parameters.ts" && \
     grep -q "batchProcess(resources: ResourceType\[\]" "$TEST_DIR/test_function_parameters.ts" && \
     grep -q "formatName(name: string)" "$TEST_DIR/test_function_parameters.ts"; then
    echo "✅ Function parameter test passed"
  else
    echo "❌ Function parameter test failed"
    echo "--- Actual output: ---"
    cat "$TEST_DIR/test_function_parameters.ts"
  fi
  
  # Test Case 3: Object property access
  echo "Testing object property access fixes..."
  if grep -q "type: ResourceType;" "$TEST_DIR/test_object_properties.ts" && \
     grep -q "resource.type === ResourceType.MINERALS" "$TEST_DIR/test_object_properties.ts" && \
     grep -q "resource.type === ResourceType.GAS" "$TEST_DIR/test_object_properties.ts" && \
     grep -q "resource.type === ResourceType.ENERGY" "$TEST_DIR/test_object_properties.ts" && \
     grep -q "type: ResourceType, amount: number" "$TEST_DIR/test_object_properties.ts"; then
    echo "✅ Object property access test passed"
  else
    echo "❌ Object property access test failed"
    echo "--- Actual output: ---"
    cat "$TEST_DIR/test_object_properties.ts"
  fi
  
  # Test Case 4: Interface definitions
  echo "Testing interface definition fixes..."
  if grep -q "resourceType: ResourceType;" "$TEST_DIR/test_interfaces.ts" && \
     grep -q "requestedType: ResourceType;" "$TEST_DIR/test_interfaces.ts" && \
     grep -q "type: ResourceType;" "$TEST_DIR/test_interfaces.ts" && \
     grep -q "name: string;" "$TEST_DIR/test_interfaces.ts"; then
    echo "✅ Interface definition test passed"
  else
    echo "❌ Interface definition test failed"
    echo "--- Actual output: ---"
    cat "$TEST_DIR/test_interfaces.ts"
  fi
  
  # Check if import was added correctly
  echo "Testing import handling..."
  if grep -q "import { ResourceType }" "$TEST_DIR/test_function_signatures.ts" && \
     grep -q "import { ResourceType }" "$TEST_DIR/test_function_parameters.ts" && \
     grep -q "import { ResourceType }" "$TEST_DIR/test_object_properties.ts" && \
     grep -q "import { ResourceType }" "$TEST_DIR/test_interfaces.ts"; then
    echo "✅ Import handling test passed"
  else
    echo "❌ Import handling test failed"
  fi
}

# Main execution
echo "=== ResourceType Fix Test Script ==="
run_tests
echo "=== Test Completed ===" 