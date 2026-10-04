# Error Correction Workflow Tests

This directory contains test files and scripts to validate the error analysis and correction workflow.

## Test Files

- **test_resource_types.ts**: Contains common ResourceType errors for testing fix_resource_types.sh
- **test_unused_vars.ts**: Contains unused variables for testing fix_unused_vars.sh
- **test_fix_scripts.sh**: Main test script that runs all tests

### Expected Output

The `expected_output` directory contains files that show what the test files should look like after the fixes are applied:

- **resource_types_fixed.ts**: Expected output after running fix_resource_types.sh
- **unused_vars_fixed.ts**: Expected output after running fix_unused_vars.sh

## Running the Tests

To run all tests, make sure the scripts in the parent directory are executable, then run:

```bash
cd CodeBase_Docs/changelog/Error_Correction/March17_Error_Directory
chmod +x Scripts/*.sh
cd Tests
chmod +x test_fix_scripts.sh
./test_fix_scripts.sh
```

## Test Process

The test script performs the following:

1. **Setup**: Creates a temporary directory and copies test files
2. **analyze_typescript.sh Test**: Runs the TypeScript analysis script and verifies outputs
3. **fix_resource_types.sh Test**:
   - Tests dry-run mode (verifies no changes are made)
   - Tests actual fix mode (verifies ResourceType enum is used)
4. **fix_unused_vars.sh Test**:
   - Tests dry-run mode (verifies no changes are made)
   - Tests actual fix mode (verifies variables are prefixed with underscore)
5. **analyze_all.sh Test**: Runs the full analysis pipeline and verifies reports

## Adding New Tests

To add a new test:

1. Create a test file with the patterns you want to test
2. Add an expected output file showing the correct fixes
3. Update the test_fix_scripts.sh script to include your new test

## Troubleshooting

If tests fail, check:

1. Script permissions (all scripts should be executable)
2. Test file contents (ensure they contain the expected error patterns)
3. Script paths (ensure they point to the correct location)

You can run individual tests by calling the specific test functions in test_fix_scripts.sh:

```bash
# Run only the ResourceType test
./test_fix_scripts.sh test_fix_resource_types
```
