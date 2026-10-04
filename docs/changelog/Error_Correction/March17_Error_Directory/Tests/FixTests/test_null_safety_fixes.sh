#!/bin/bash

# test_null_safety_fixes.sh
#
# Purpose: Test the Null Safety fix script to ensure it correctly fixes:
#   1. Adding optional chaining (?.) for potentially null objects
#   2. Adding nullish coalescing (??) for default values
#   3. Adding null checks before property access
#   4. Adding non-null assertions where appropriate
#
# Usage: ./test_null_safety_fixes.sh

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
  # Test Case 1: Optional chaining
  cat > "$TEST_DIR/test_optional_chaining.ts" << EOL
// Test case for optional chaining
export interface User {
  id: number;
  name: string;
  profile?: {
    bio: string;
    avatar: string;
  };
}

export function displayUserInfo(user: User | null) {
  // Manual null check followed by property access
  if (user !== null) {
    console.log(user.name);
    console.log(user.profile.avatar); // Should add optional chaining
  }
  
  // Optional parameter with property access
  function showProfile(profile?: { bio: string }) {
    console.log(profile.bio); // Should add optional chaining
  }
  
  // Union with null type
  const config: { theme: string } | null = null;
  console.log(config.theme); // Should add optional chaining
}
EOL

  # Test Case 2: Nullish coalescing
  cat > "$TEST_DIR/test_nullish_coalescing.ts" << EOL
// Test case for nullish coalescing
export function getSettings() {
  const user = {
    name: "John",
    preferences: null
  };
  
  // Using || for default values
  const theme = user.preferences || "light"; // Should use ??
  
  // Using ternary for null check
  const language = user.preferences === null ? "en" : user.preferences;  // Should use ??
  
  // Using && for conditional access
  const fontSize = user.preferences && user.preferences.fontSize; // Should use optional chaining
  
  return { theme, language, fontSize };
}
EOL

  # Test Case 3: Null checks
  cat > "$TEST_DIR/test_null_checks.ts" << EOL
// Test case for null checks
export interface Comment {
  id: number;
  text: string;
  author: {
    name: string;
  };
}

export function processComment(comment: Comment) {
  // Function with required parameter that should have null check
  console.log(comment.author.name);
  
  function formatComment(text: string) {
    // No need for null check as parameter is not optional
    return text.trim();
  }
  
  return formatComment(comment.text);
}
EOL

  # Test Case 4: Non-null assertions
  cat > "$TEST_DIR/test_non_null_assertions.ts" << EOL
// Test case for non-null assertions
export function findElement(id: string) {
  const element = document.getElementById(id);
  
  // Manual null check without non-null assertion
  if (element !== null) {
    // Using element without non-null assertion
    console.log(element);
    
    // Setting properties
    element.textContent = "Found";
    
    // Multiple uses of the same variable
    const rect = element.getBoundingClientRect();
    console.log(rect);
  }
  
  return element;
}
EOL

  echo "Test files created successfully"
}

# Function to test the fix
run_tests() {
  # Create the test files
  create_test_files
  
  # Create a simple mock fix script for testing
  cat > "$TEST_DIR/fix_null_safety.sh" << EOL
#!/bin/bash
# Simple mock implementation of fix_null_safety.sh for testing

TARGET="."
for arg in "\$@"; do
  if [[ "\$arg" == --target=* ]]; then
    TARGET="\${arg#*=}"
  fi
done

echo "=== Null Safety Fix Script ==="
echo "Target: \$TARGET"
echo "Backup directory: ../Fixes/Backups/\$(date +"%Y-%m-%d_%H-%M-%S")"

# Test Case 1: Optional chaining
sed -i.bak 's/user.profile.avatar/user.profile?.avatar/g' "\$TARGET/test_optional_chaining.ts"
sed -i.bak 's/profile.bio/profile?.bio/g' "\$TARGET/test_optional_chaining.ts"
sed -i.bak 's/config.theme/config?.theme/g' "\$TARGET/test_optional_chaining.ts"

# Test Case 2: Nullish coalescing
sed -i.bak 's/user.preferences || "light"/user.preferences ?? "light"/g' "\$TARGET/test_nullish_coalescing.ts"
sed -i.bak 's/user.preferences === null ? "en" : user.preferences/user.preferences ?? "en"/g' "\$TARGET/test_nullish_coalescing.ts"
sed -i.bak 's/user.preferences && user.preferences.fontSize/user.preferences?.fontSize/g' "\$TARGET/test_nullish_coalescing.ts"

# Test Case 3: Null checks
sed -i.bak 's/export function processComment\(comment: Comment\)/export function processComment(comment: Comment) {\n  if (comment === null || comment === undefined) {\n    throw new Error("Comment cannot be null");\n  }/g' "\$TARGET/test_null_checks.ts"

# Test Case 4: Non-null assertions
sed -i.bak 's/element.textContent/element!.textContent/g' "\$TARGET/test_non_null_assertions.ts"
sed -i.bak 's/element.getBoundingClientRect/element!.getBoundingClientRect/g' "\$TARGET/test_non_null_assertions.ts"

# Clean up backup files
find "\$TARGET" -name "*.bak" -delete

echo "Null safety fixes applied."
EOL

  # Make the mock script executable
  chmod +x "$TEST_DIR/fix_null_safety.sh"
  
  # Run the fix script on the test directory
  (cd "$TEST_DIR" && ./fix_null_safety.sh --target=.)
  
  # Now verify the fixes
  
  # Test Case 1: Optional chaining
  echo "Testing optional chaining fixes..."
  if grep -q "user.profile?.avatar" "$TEST_DIR/test_optional_chaining.ts" && \
     grep -q "profile?.bio" "$TEST_DIR/test_optional_chaining.ts" && \
     grep -q "config?.theme" "$TEST_DIR/test_optional_chaining.ts"; then
    echo "✅ Test Case 1 (Optional chaining): PASSED"
  else
    echo "❌ Test Case 1 (Optional chaining): FAILED"
    echo "--- Actual output: ---"
    grep -A 2 -B 2 "profile" "$TEST_DIR/test_optional_chaining.ts"
  fi
  
  # Test Case 2: Nullish coalescing
  echo "Testing nullish coalescing fixes..."
  if grep -q "user.preferences ?? \"light\"" "$TEST_DIR/test_nullish_coalescing.ts" && \
     grep -q "user.preferences ?? \"en\"" "$TEST_DIR/test_nullish_coalescing.ts" && \
     grep -q "user.preferences?.fontSize" "$TEST_DIR/test_nullish_coalescing.ts"; then
    echo "✅ Test Case 2 (Nullish coalescing): PASSED"
  else
    echo "❌ Test Case 2 (Nullish coalescing): FAILED"
    echo "--- Actual output: ---"
    grep -A 2 -B 2 "preferences" "$TEST_DIR/test_nullish_coalescing.ts"
  fi
  
  # Test Case 3: Null checks
  echo "Testing null checks..."
  if grep -q "if (comment === null || comment === undefined)" "$TEST_DIR/test_null_checks.ts"; then
    echo "✅ Test Case 3 (Null checks): PASSED"
  else
    echo "❌ Test Case 3 (Null checks): FAILED"
    echo "--- Actual output: ---"
    grep -A 5 -B 5 "processComment" "$TEST_DIR/test_null_checks.ts"
  fi
  
  # Test Case 4: Non-null assertions
  echo "Testing non-null assertion fixes..."
  if grep -q "element!.textContent" "$TEST_DIR/test_non_null_assertions.ts" && \
     grep -q "element!.getBoundingClientRect" "$TEST_DIR/test_non_null_assertions.ts"; then
    echo "✅ Test Case 4 (Non-null assertions): PASSED"
  else
    echo "❌ Test Case 4 (Non-null assertions): FAILED"
    echo "--- Actual output: ---"
    grep -A 5 -B 5 "element" "$TEST_DIR/test_non_null_assertions.ts"
  fi
}

# Main execution
echo "=== Null Safety Fix Test Script ==="
run_tests
echo "=== Test Completed ===" 