#!/bin/bash
# Validation Script for Phase 1: Manager Integration
# Purpose: Verify all managers are properly integrated into registry

echo "===================================="
echo " Phase 1 Validation: Manager Integration"
echo "===================================="
echo ""

# Define targets
TOTAL_MANAGERS=51
TARGET_HOOKS=51

# Count managers in registry (count 'export function get' lines)
REGISTRY_COUNT=$(grep -c "^export function get" src/managers/ManagerRegistry.ts 2>/dev/null || echo "0")
echo "✓ Managers in Registry:"
echo "  Found: $REGISTRY_COUNT / $TOTAL_MANAGERS"

if [ "$REGISTRY_COUNT" -eq "$TOTAL_MANAGERS" ]; then
  echo "  Status: ✅ COMPLETE"
else
  REMAINING=$((TOTAL_MANAGERS - REGISTRY_COUNT))
  PERCENT=$((REGISTRY_COUNT * 100 / TOTAL_MANAGERS))
  echo "  Status: ⏳ IN PROGRESS ($PERCENT%)"
  echo "  Remaining: $REMAINING managers"
fi

echo ""

# Count hooks created (count 'export function use' or 'export const use' lines)
HOOK_COUNT=$(grep -cE "^export (function|const) use" src/hooks/managers/useManagers.ts 2>/dev/null || echo "0")
echo "✓ Hooks Created:"
echo "  Found: $HOOK_COUNT / $TARGET_HOOKS"

if [ "$HOOK_COUNT" -eq "$TARGET_HOOKS" ]; then
  echo "  Status: ✅ COMPLETE"
else
  REMAINING=$((TARGET_HOOKS - HOOK_COUNT))
  PERCENT=$((HOOK_COUNT * 100 / TARGET_HOOKS))
  echo "  Status: ⏳ IN PROGRESS ($PERCENT%)"
  echo "  Remaining: $REMAINING hooks"
fi

echo ""
echo "===================================="
echo " Code Quality Checks"
echo "===================================="
echo ""

# Type check
echo "✓ TypeScript Type Check:"
if npm run type-check > /dev/null 2>&1; then
  echo "  Status: ✅ PASS"
else
  echo "  Status: ❌ FAIL"
  echo "  Run 'npm run type-check' to see errors"
fi

echo ""

# Lint check
echo "✓ ESLint Check:"
if npm run lint > /dev/null 2>&1; then
  echo "  Status: ✅ PASS"
else
  echo "  Status: ❌ FAIL"
  echo "  Run 'npm run lint' to see errors"
fi

echo ""

# Build check
echo "✓ Build Check:"
if npm run build > /dev/null 2>&1; then
  echo "  Status: ✅ PASS"
else
  echo "  Status: ❌ FAIL"
  echo "  Run 'npm run build' to see errors"
fi

echo ""
echo "===================================="
echo " Summary"
echo "===================================="
echo ""

# Calculate overall progress
TOTAL_ITEMS=$((TOTAL_MANAGERS + TARGET_HOOKS + 3)) # +3 for type-check, lint, build
COMPLETED_ITEMS=$((REGISTRY_COUNT + HOOK_COUNT))

# Add passed checks
if npm run type-check > /dev/null 2>&1; then
  COMPLETED_ITEMS=$((COMPLETED_ITEMS + 1))
fi
if npm run lint > /dev/null 2>&1; then
  COMPLETED_ITEMS=$((COMPLETED_ITEMS + 1))
fi
if npm run build > /dev/null 2>&1; then
  COMPLETED_ITEMS=$((COMPLETED_ITEMS + 1))
fi

OVERALL_PERCENT=$((COMPLETED_ITEMS * 100 / TOTAL_ITEMS))

echo "Overall Phase 1 Progress: $OVERALL_PERCENT%"
echo "Items Completed: $COMPLETED_ITEMS / $TOTAL_ITEMS"

if [ "$OVERALL_PERCENT" -eq 100 ]; then
  echo ""
  echo "🎉 Phase 1 COMPLETE! All managers integrated!"
  echo ""
else
  echo ""
  echo "⏳ Phase 1 in progress. Keep going!"
  echo ""
fi

echo "===================================="
echo ""
echo "Run this script regularly to track your progress!"
echo ""
