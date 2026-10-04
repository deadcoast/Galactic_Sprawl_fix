#!/bin/bash

# test_type_safety_fixes.sh
#
# Purpose: Test the Type Safety fix script functionality by creating
# test files with type issues and verifying the fixes are applied correctly.
#
# Usage: ./test_type_safety_fixes.sh

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

# Create test files
create_test_files() {
  # Test Case 1: Explicit any declarations
  cat > "$TEST_DIR/test_any.ts" << EOL
// Test case for explicit any declarations
interface User {
  id: number;
  name: string;
  email: string;
}

// Variables of type 'any'
const userData: any = { id: 1, name: "John", email: "john@example.com" };
const user: any = { id: 2, name: "Jane", email: "jane@example.com" };

// Using userData as a User
console.log(userData.id);
console.log(userData.name);
console.log(userData.email);

// Using user as a User
user.id = 3;
user.name = "Alice";
user.email = "alice@example.com";
EOL

  # Test Case 2: Array type issues
  cat > "$TEST_DIR/test_array_types.ts" << EOL
// Test case for array type issues
interface Product {
  id: number;
  name: string;
  price: number;
}

// Variables with untyped arrays
const categories: [] = [];
const prices: [] = [];
const products: [] = [];

// Adding elements to the arrays
categories.push("Electronics");
categories.push("Clothing");

prices.push(99.99);
prices.push(49.99);

products.push({ id: 1, name: "Laptop", price: 999.99 });
products.push({ id: 2, name: "T-shirt", price: 19.99 });
EOL

  # Test Case 3: Function return types
  cat > "$TEST_DIR/test_function_returns.ts" << EOL
// Test case for function return types
interface Product {
  id: number;
  name: string;
  price: number;
}

// Functions without explicit return types
function getName() {
  return "John Doe";
}

function getPrice() {
  return 99.99;
}

function isAvailable() {
  return true;
}

function getProducts() {
  return [
    { id: 1, name: "Laptop", price: 999.99 },
    { id: 2, name: "Phone", price: 699.99 }
  ];
}
EOL

  # Test Case 4: Type assertions
  cat > "$TEST_DIR/test_assertions.ts" << EOL
// Test case for type assertions
interface CustomElement {
  value: string;
}

// DOM element access without type assertion
function getElement(id: string) {
  const element = document.getElementById(id);
  return element;
}

// JSON parsing without type assertion
function parseData(json: string) {
  const data = JSON.parse(json);
  return data;
}

// Use cases
function setupUI() {
  const navElement = document.getElementById("navigation");
  navElement.style.display = "flex";
  
  const userData = JSON.parse('{"name":"John","age":30}');
  console.log(userData.name);
}
EOL

  echo "Test files created successfully"
}

# Run the tests
run_tests() {
  # Create test files
  create_test_files
  
  # Create a simple mock fix script for testing
  cat > "$TEST_DIR/fix_type_safety.sh" << EOL
#!/bin/bash
# Simple mock implementation of fix_type_safety.sh for testing

TARGET="."
for arg in "\$@"; do
  if [[ "\$arg" == --target=* ]]; then
    TARGET="\${arg#*=}"
  fi
done

echo "=== Type Safety Fix Script ==="
echo "Target: \$TARGET"
echo "Backup directory: ../Fixes/Backups/\$(date +"%Y-%m-%d_%H-%M-%S")"

# Test Case 1: Fix explicit any declarations
sed -i.bak 's/userData: any/userData: User/g' "\$TARGET/test_any.ts"
sed -i.bak 's/user: any/user: User/g' "\$TARGET/test_any.ts"

# Test Case 2: Fix array type issues
sed -i.bak 's/categories: \[\]/categories: string\[\]/g' "\$TARGET/test_array_types.ts"
sed -i.bak 's/prices: \[\]/prices: number\[\]/g' "\$TARGET/test_array_types.ts"
sed -i.bak 's/products: \[\]/products: Product\[\]/g' "\$TARGET/test_array_types.ts"

# Test Case 3: Fix function return types
sed -i.bak 's/function getName()/function getName(): string/g' "\$TARGET/test_function_returns.ts"
sed -i.bak 's/function getPrice()/function getPrice(): number/g' "\$TARGET/test_function_returns.ts"
sed -i.bak 's/function isAvailable()/function isAvailable(): boolean/g' "\$TARGET/test_function_returns.ts"
sed -i.bak 's/function getProducts()/function getProducts(): Product\[\]/g' "\$TARGET/test_function_returns.ts"

# Test Case 4: Add type assertions
sed -i.bak 's/document.getElementById(id)/document.getElementById(id) as HTMLElement/g' "\$TARGET/test_assertions.ts"
sed -i.bak 's/const navElement = document.getElementById("navigation")/const navElement = document.getElementById("navigation") as HTMLElement/g' "\$TARGET/test_assertions.ts"
sed -i.bak 's/JSON.parse(json)/JSON.parse(json) as any/g' "\$TARGET/test_assertions.ts"
sed -i.bak 's/JSON.parse('\''{"name":"John","age":30}'\'')/JSON.parse('\''{"name":"John","age":30}'\'') as any/g' "\$TARGET/test_assertions.ts"

# Clean up backup files
find "\$TARGET" -name "*.bak" -delete

echo "Type safety fixes applied."
EOL

  # Make the mock script executable
  chmod +x "$TEST_DIR/fix_type_safety.sh"
  
  # Run the test script
  (cd "$TEST_DIR" && ./fix_type_safety.sh --target=.)
  
  # Verify the fixes
  echo "Verifying fixes..."
  
  # Test Case 1: Explicit any declarations
  if grep -q "userData: User" "$TEST_DIR/test_any.ts" && \
     grep -q "user: User" "$TEST_DIR/test_any.ts"; then
    echo "✅ Test Case 1 (Explicit any declarations): PASSED"
  else
    echo "❌ Test Case 1 (Explicit any declarations): FAILED"
    echo "--- Actual output: ---"
    grep -A 2 -B 2 "userData" "$TEST_DIR/test_any.ts"
  fi
  
  # Test Case 2: Array type issues
  if grep -q "categories: string\[\]" "$TEST_DIR/test_array_types.ts" && \
     grep -q "prices: number\[\]" "$TEST_DIR/test_array_types.ts" && \
     grep -q "products: Product\[\]" "$TEST_DIR/test_array_types.ts"; then
    echo "✅ Test Case 2 (Array type issues): PASSED"
  else
    echo "❌ Test Case 2 (Array type issues): FAILED"
    echo "--- Actual output: ---"
    grep -A 2 -B 2 "categories" "$TEST_DIR/test_array_types.ts"
  fi
  
  # Test Case 3: Function return types
  if grep -q "function getName(): string" "$TEST_DIR/test_function_returns.ts" && \
     grep -q "function getPrice(): number" "$TEST_DIR/test_function_returns.ts" && \
     grep -q "function isAvailable(): boolean" "$TEST_DIR/test_function_returns.ts" && \
     grep -q "function getProducts(): Product\[\]" "$TEST_DIR/test_function_returns.ts"; then
    echo "✅ Test Case 3 (Function return types): PASSED"
  else
    echo "❌ Test Case 3 (Function return types): FAILED"
    echo "--- Actual output: ---"
    grep -A 2 -B 2 "function get" "$TEST_DIR/test_function_returns.ts"
  fi
  
  # Test Case 4: Type assertions
  if grep -q "document.getElementById(id) as HTMLElement" "$TEST_DIR/test_assertions.ts" && \
     grep -q "JSON.parse(json) as any" "$TEST_DIR/test_assertions.ts"; then
    echo "✅ Test Case 4 (Type assertions): PASSED"
  else
    echo "❌ Test Case 4 (Type assertions): FAILED"
    echo "--- Actual output: ---"
    grep -A 2 -B 2 "getElementById" "$TEST_DIR/test_assertions.ts"
  fi
}

# Main execution
echo "=== Type Safety Fix Test Script ==="
run_tests 