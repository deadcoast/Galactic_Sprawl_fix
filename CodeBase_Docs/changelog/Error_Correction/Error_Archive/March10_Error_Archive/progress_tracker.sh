#!/bin/bash

# Progress Tracker for Codebase Remediation
# This script runs TypeScript and ESLint checks and generates a progress report

# Create output directory
mkdir -p CodeBase_Docs/Analysis/progress

# Get current date for the report
DATE=$(date +"%Y-%m-%d")
REPORT_FILE="CodeBase_Docs/Analysis/progress/progress_report_$DATE.md"

# Run TypeScript type check
echo "Running TypeScript type check..."
npx tsc --noEmit > CodeBase_Docs/Analysis/progress/typescript_errors_$DATE.txt 2>&1

# Run ESLint
echo "Running ESLint..."
npx eslint --ext .ts,.tsx src/ > CodeBase_Docs/Analysis/progress/eslint_errors_$DATE.txt 2>&1

# Count errors
TS_ERROR_COUNT=$(grep -c "error TS" CodeBase_Docs/Analysis/progress/typescript_errors_$DATE.txt || echo "0")
ESLINT_ERROR_COUNT=$(grep -c "error" CodeBase_Docs/Analysis/progress/eslint_errors_$DATE.txt || echo "0")
ESLINT_WARNING_COUNT=$(grep -c "warning" CodeBase_Docs/Analysis/progress/eslint_errors_$DATE.txt || echo "0")

# Count specific error types
TS_TYPE_MISMATCH=$(grep -c "is not assignable to type" CodeBase_Docs/Analysis/progress/typescript_errors_$DATE.txt || echo "0")
TS_MISSING_PROP=$(grep -c "Property '.*' does not exist on type" CodeBase_Docs/Analysis/progress/typescript_errors_$DATE.txt || echo "0")
TS_UNUSED_VAR=$(grep -c "TS6133" CodeBase_Docs/Analysis/progress/typescript_errors_$DATE.txt || echo "0")

ESLINT_ANY_TYPE=$(grep -c "@typescript-eslint/no-explicit-any" CodeBase_Docs/Analysis/progress/eslint_errors_$DATE.txt || echo "0")
ESLINT_UNUSED_VARS=$(grep -c "@typescript-eslint/no-unused-vars" CodeBase_Docs/Analysis/progress/eslint_errors_$DATE.txt || echo "0")
ESLINT_STRING_RESOURCE=$(grep -c "no-string-resource-types" CodeBase_Docs/Analysis/progress/eslint_errors_$DATE.txt || echo "0")

# Initial counts
INITIAL_TS_ERROR_COUNT=1304
INITIAL_ESLINT_ERROR_COUNT=551
INITIAL_ESLINT_WARNING_COUNT=725
INITIAL_TS_TYPE_MISMATCH=287
INITIAL_TS_MISSING_PROP=287
INITIAL_TS_UNUSED_VAR=369
INITIAL_ESLINT_ANY_TYPE=298
INITIAL_ESLINT_UNUSED_VARS=287
INITIAL_ESLINT_STRING_RESOURCE=264

# Generate report
echo "# Progress Report - $DATE" > $REPORT_FILE
echo "" >> $REPORT_FILE
echo "## Error Counts" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "| Error Type | Count | Initial Count | Progress |" >> $REPORT_FILE
echo "|------------|-------|---------------|----------|" >> $REPORT_FILE
echo "| TypeScript Errors | $TS_ERROR_COUNT | $INITIAL_TS_ERROR_COUNT | $(( (INITIAL_TS_ERROR_COUNT - TS_ERROR_COUNT) * 100 / INITIAL_TS_ERROR_COUNT ))% |" >> $REPORT_FILE
echo "| ESLint Errors | $ESLINT_ERROR_COUNT | $INITIAL_ESLINT_ERROR_COUNT | $(( (INITIAL_ESLINT_ERROR_COUNT - ESLINT_ERROR_COUNT) * 100 / INITIAL_ESLINT_ERROR_COUNT ))% |" >> $REPORT_FILE
echo "| ESLint Warnings | $ESLINT_WARNING_COUNT | $INITIAL_ESLINT_WARNING_COUNT | $(( (INITIAL_ESLINT_WARNING_COUNT - ESLINT_WARNING_COUNT) * 100 / INITIAL_ESLINT_WARNING_COUNT ))% |" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "## Specific Error Types" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "### TypeScript" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "| Error Type | Count | Initial Count | Progress |" >> $REPORT_FILE
echo "|------------|-------|---------------|----------|" >> $REPORT_FILE
echo "| Type Mismatches | $TS_TYPE_MISMATCH | $INITIAL_TS_TYPE_MISMATCH | $(( (INITIAL_TS_TYPE_MISMATCH - TS_TYPE_MISMATCH) * 100 / INITIAL_TS_TYPE_MISMATCH ))% |" >> $REPORT_FILE
echo "| Missing Properties | $TS_MISSING_PROP | $INITIAL_TS_MISSING_PROP | $(( (INITIAL_TS_MISSING_PROP - TS_MISSING_PROP) * 100 / INITIAL_TS_MISSING_PROP ))% |" >> $REPORT_FILE
echo "| Unused Variables | $TS_UNUSED_VAR | $INITIAL_TS_UNUSED_VAR | $(( (INITIAL_TS_UNUSED_VAR - TS_UNUSED_VAR) * 100 / INITIAL_TS_UNUSED_VAR ))% |" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "### ESLint" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "| Error Type | Count | Initial Count | Progress |" >> $REPORT_FILE
echo "|------------|-------|---------------|----------|" >> $REPORT_FILE
echo "| Any Type Usage | $ESLINT_ANY_TYPE | $INITIAL_ESLINT_ANY_TYPE | $(( (INITIAL_ESLINT_ANY_TYPE - ESLINT_ANY_TYPE) * 100 / INITIAL_ESLINT_ANY_TYPE ))% |" >> $REPORT_FILE
echo "| Unused Variables | $ESLINT_UNUSED_VARS | $INITIAL_ESLINT_UNUSED_VARS | $(( (INITIAL_ESLINT_UNUSED_VARS - ESLINT_UNUSED_VARS) * 100 / INITIAL_ESLINT_UNUSED_VARS ))% |" >> $REPORT_FILE
echo "| String Resource Types | $ESLINT_STRING_RESOURCE | $INITIAL_ESLINT_STRING_RESOURCE | $(( (INITIAL_ESLINT_STRING_RESOURCE - ESLINT_STRING_RESOURCE) * 100 / INITIAL_ESLINT_STRING_RESOURCE ))% |" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "## Phase Progress" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "### Phase 1: Resource Type Standardization" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Progress: $(( (INITIAL_ESLINT_STRING_RESOURCE - ESLINT_STRING_RESOURCE) * 100 / INITIAL_ESLINT_STRING_RESOURCE ))%" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "### Phase 2: Event System Standardization" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Progress: $(( (INITIAL_TS_MISSING_PROP - TS_MISSING_PROP) * 100 / INITIAL_TS_MISSING_PROP ))%" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "### Phase 3: Type Safety Improvements" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Progress: $(( (INITIAL_ESLINT_ANY_TYPE - ESLINT_ANY_TYPE) * 100 / INITIAL_ESLINT_ANY_TYPE ))%" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Calculate combined progress for Phase 4
TOTAL_UNUSED=$((TS_UNUSED_VAR + ESLINT_UNUSED_VARS))
TOTAL_INITIAL_UNUSED=$((INITIAL_TS_UNUSED_VAR + INITIAL_ESLINT_UNUSED_VARS))
echo "### Phase 4: Code Quality Improvements" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Progress: $(( (TOTAL_INITIAL_UNUSED - TOTAL_UNUSED) * 100 / TOTAL_INITIAL_UNUSED ))%" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "## Next Steps" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Determine next phase based on progress
if [ "$ESLINT_STRING_RESOURCE" -gt 100 ]; then
  NEXT_PHASE="1: Resource Type Standardization"
  FOCUS_AREA="converting string resource types to enum types"
elif [ "$TS_MISSING_PROP" -gt 100 ]; then
  NEXT_PHASE="2: Event System Standardization"
  FOCUS_AREA="fixing missing properties in manager classes"
elif [ "$ESLINT_ANY_TYPE" -gt 100 ]; then
  NEXT_PHASE="3: Type Safety Improvements"
  FOCUS_AREA="replacing 'any' types with proper types"
else
  NEXT_PHASE="4: Code Quality Improvements"
  FOCUS_AREA="fixing unused variables and imports"
fi

echo "1. Continue with Phase $NEXT_PHASE" >> $REPORT_FILE
echo "2. Focus on $FOCUS_AREA" >> $REPORT_FILE
echo "3. Run this script again after making changes to track progress" >> $REPORT_FILE

echo "Progress report generated at $REPORT_FILE" 