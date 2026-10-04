#!/bin/bash
# Audit Progress Tracker
# Purpose: Show progress across all 9 phases of the audit

echo "========================================="
echo " GALACTIC SPRAWL - AUDIT PROGRESS"
echo "========================================="
echo ""
echo "Last Updated: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ========================================
# PHASE 1: Manager Integration
# ========================================
echo "PHASE 1: Manager Integration"
echo "-----------------------------------------"

TOTAL_MANAGERS=51
MANAGERS_IN_REGISTRY=$(grep -c "^export function get" src/managers/ManagerRegistry.ts 2>/dev/null || echo "0")
MANAGER_PERCENT=$((MANAGERS_IN_REGISTRY * 100 / TOTAL_MANAGERS))

echo "  Managers in Registry: $MANAGERS_IN_REGISTRY / $TOTAL_MANAGERS ($MANAGER_PERCENT%)"

TOTAL_HOOKS=51
HOOKS_CREATED=$(grep -cE "^export (function|const) use" src/hooks/managers/useManagers.ts 2>/dev/null || echo "0")
HOOK_PERCENT=$((HOOKS_CREATED * 100 / TOTAL_HOOKS))

echo "  Hooks Created: $HOOKS_CREATED / $TOTAL_HOOKS ($HOOK_PERCENT%)"

# Progress bar for Phase 1
PHASE1_PROGRESS=$((MANAGER_PERCENT))
BARS=$((PHASE1_PROGRESS / 4))
printf "  Progress: ["
for i in $(seq 1 25); do
  if [ $i -le $BARS ]; then
    printf "█"
  else
    printf "░"
  fi
done
printf "] $PHASE1_PROGRESS%%\n"

if [ "$MANAGER_PERCENT" -eq 100 ] && [ "$HOOK_PERCENT" -eq 100 ]; then
  echo "  Status: ✅ COMPLETE"
else
  echo "  Status: ⏳ IN PROGRESS"
fi

echo ""

# ========================================
# PHASE 2: Type System
# ========================================
echo "PHASE 2: Type System Unification"
echo "-----------------------------------------"

# Count string literal types (simple heuristic)
STRING_LITERALS=$(grep -r "type.*=.*'.*'.*|" src/types/ 2>/dev/null | wc -l)
echo "  String Literal Types Remaining: ~$STRING_LITERALS (target: 0)"

# Check for enum files
ENUM_FILES=$(find src/types -name "*Enum*.ts" -o -name "*Types.ts" 2>/dev/null | wc -l)
echo "  Enum Definition Files: $ENUM_FILES"

echo "  Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░] 0%"
echo "  Status: ❌ NOT STARTED"

echo ""

# ========================================
# PHASE 3: Event System
# ========================================
echo "PHASE 3: Event System Integration"
echo "-----------------------------------------"

# Count EventType enum values
EVENT_TYPES=$(grep -c "^  [A-Z_]*," src/types/events/EventTypes.ts 2>/dev/null || echo "0")
echo "  Event Types Defined: $EVENT_TYPES"

# Count event subscriptions (heuristic)
EVENT_SUBS=$(grep -r "moduleEventBus.subscribe" src/components/ 2>/dev/null | wc -l)
echo "  Event Subscriptions in Components: ~$EVENT_SUBS"

echo "  Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░] 0%"
echo "  Status: ❌ NOT STARTED"

echo ""

# ========================================
# PHASE 4: Component Integration
# ========================================
echo "PHASE 4: Component Integration"
echo "-----------------------------------------"

TOTAL_COMPONENTS=297

# Count components using managers (heuristic - imports from '@/hooks/managers')
COMPONENTS_USING_MANAGERS=$(grep -r "from '@/hooks/managers'" src/components/ 2>/dev/null | wc -l)
COMPONENT_PERCENT=$((COMPONENTS_USING_MANAGERS * 100 / TOTAL_COMPONENTS))

echo "  Components Using Managers: ~$COMPONENTS_USING_MANAGERS / $TOTAL_COMPONENTS (~$COMPONENT_PERCENT%)"

# Progress bar
COMPONENT_BARS=$((COMPONENT_PERCENT / 4))
printf "  Progress: ["
for i in $(seq 1 25); do
  if [ $i -le $COMPONENT_BARS ]; then
    printf "█"
  else
    printf "░"
  fi
done
printf "] $COMPONENT_PERCENT%%\n"

if [ "$COMPONENT_PERCENT" -ge 80 ]; then
  echo "  Status: ✅ COMPLETE"
elif [ "$COMPONENT_PERCENT" -gt 0 ]; then
  echo "  Status: ⏳ IN PROGRESS"
else
  echo "  Status: ❌ NOT STARTED"
fi

echo ""

# ========================================
# PHASE 5-9: Remaining Phases
# ========================================
echo "PHASE 5: Factory System"
echo "-----------------------------------------"
echo "  Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░] 0%"
echo "  Status: ❌ NOT STARTED"
echo ""

echo "PHASE 6: Context API Integration"
echo "-----------------------------------------"
echo "  Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░] 0%"
echo "  Status: ❌ NOT STARTED"
echo ""

echo "PHASE 7: Utility Consolidation"
echo "-----------------------------------------"
echo "  Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░] 0%"
echo "  Status: ❌ NOT STARTED"
echo ""

echo "PHASE 8: Service Standardization"
echo "-----------------------------------------"
echo "  Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░] 0%"
echo "  Status: ❌ NOT STARTED"
echo ""

echo "PHASE 9: State Management Unification"
echo "-----------------------------------------"
echo "  Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░] 0%"
echo "  Status: ❌ NOT STARTED"
echo ""

# ========================================
# OVERALL PROGRESS
# ========================================
echo "========================================="
echo " OVERALL AUDIT PROGRESS"
echo "========================================="

# Simple calculation: Phase 1 is ~10% of total
OVERALL_PERCENT=$((PHASE1_PROGRESS / 10))
OVERALL_BARS=$((OVERALL_PERCENT / 4))

printf "  Overall: ["
for i in $(seq 1 25); do
  if [ $i -le $OVERALL_BARS ]; then
    printf "█"
  else
    printf "░"
  fi
done
printf "] ~$OVERALL_PERCENT%%\n"

echo ""

# ========================================
# CODE QUALITY VALIDATION
# ========================================
echo "========================================="
echo " CODE QUALITY"
echo "========================================="
echo ""

echo "✓ TypeScript Type Check:"
if npm run type-check > /dev/null 2>&1; then
  echo "  Status: ✅ PASS"
else
  echo "  Status: ❌ FAIL (run 'npm run type-check' for details)"
fi

echo ""

echo "✓ ESLint Check:"
if npm run lint > /dev/null 2>&1; then
  echo "  Status: ✅ PASS"
else
  echo "  Status: ⚠️  WARNINGS (run 'npm run lint' for details)"
fi

echo ""

echo "✓ Build Check:"
if npm run build > /dev/null 2>&1; then
  echo "  Status: ✅ PASS"
else
  echo "  Status: ❌ FAIL (run 'npm run build' for details)"
fi

echo ""

# ========================================
# SUMMARY
# ========================================
echo "========================================="
echo " SUMMARY"
echo "========================================="
echo ""

echo "Current Phase: Phase 1 - Manager Integration"
echo "Current Progress: $PHASE1_PROGRESS% of Phase 1"
echo "Overall Progress: ~$OVERALL_PERCENT% of full audit"
echo ""

if [ "$PHASE1_PROGRESS" -eq 100 ]; then
  echo "🎉 Phase 1 complete! Ready for Phase 2."
else
  REMAINING=$((TOTAL_MANAGERS - MANAGERS_IN_REGISTRY))
  echo "⏳ $REMAINING managers remaining in Phase 1"
fi

echo ""
echo "========================================="
echo ""
echo "Run this script anytime to see your progress!"
echo "For Phase 1 validation only: .docs/scripts/validate-phase-1.sh"
echo ""
