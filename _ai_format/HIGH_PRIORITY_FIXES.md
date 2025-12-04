# HIGH PRIORITY ESLint FIXES - Critical Issues

**Target**: 799 errors (39.3% of total)  
**Timeline**: Week 1-2  
**Impact**: Type safety, runtime reliability, critical bugs

---

## 🚨 **CRITICAL NULLISH COALESCING FIXES (436 errors)**

### **Context**: Replace `||` with `??` to prevent logic bugs with falsy values

- [ ] **Task H1.1: Identify Files with Most Nullish Coalescing Issues**
  ```bash
  npx eslint . --ext .ts,.tsx --quiet | grep "prefer-nullish-coalescing" | cut -d':' -f1 | sort | uniq -c | sort -nr | head -20
  ```
  - [ ] Create priority list of top 20 files
  - [ ] Focus on files with 10+ occurrences first

- [ ] **Task H1.2: Fix Resource Manager Files (Critical System)**
  - [ ] **File**: `src/managers/resource/ResourceManager.ts`
    - [ ] Pattern: `resourceState.current || 0` → `resourceState.current ?? 0`
    - [ ] Pattern: `options.amount || defaultAmount` → `options.amount ?? defaultAmount`
    - [ ] Pattern: `config.max || DEFAULT_MAX` → `config.max ?? DEFAULT_MAX`
    - [ ] Validation: Test resource addition/removal operations
  
  - [ ] **File**: `src/managers/resource/ResourceFlowManager.ts`
    - [ ] Pattern: `flow.rate || 1.0` → `flow.rate ?? 1.0`
    - [ ] Pattern: `node.capacity || maxCapacity` → `node.capacity ?? maxCapacity`
    - [ ] Validation: Test resource flow calculations

- [ ] **Task H1.3: Fix Event System Files**
  - [ ] **File**: `src/lib/events/EventBus.ts`
    - [ ] Pattern: `event.data || {}` → `event.data ?? {}`
    - [ ] Pattern: `handler.priority || 0` → `handler.priority ?? 0`
    - [ ] Validation: Test event emission and subscription

- [ ] **Task H1.4: Fix Component Default Props**
  - [ ] **Pattern**: Component prop defaults
    ```typescript
    // FIND
    const value = props.value || defaultValue;
    
    // REPLACE  
    const value = props.value ?? defaultValue;
    ```
  - [ ] **Priority Files**:
    - [ ] `src/components/exploration/DetailedAnomalyAnalysis.tsx`
    - [ ] `src/components/exploration/DiscoveryClassification.tsx`
    - [ ] `src/components/combat/radar/RadarSweepAnimation.tsx`
  - [ ] Validation: Test component rendering with various prop values

- [ ] **Task H1.5: Fix Configuration Objects**
  - [ ] **Pattern**: Configuration merging
    ```typescript
    // FIND
    const config = userConfig || defaultConfig;
    const timeout = options.timeout || 5000;
    
    // REPLACE
    const config = userConfig ?? defaultConfig;
    const timeout = options.timeout ?? 5000;
    ```
  - [ ] Focus on config files in `src/config/` directory
  - [ ] Validation: Test configuration loading and merging

---

## 🔧 **UNSAFE TYPE OPERATION FIXES (202 errors)**

### **Context**: Add type guards and proper typing to prevent runtime errors

- [ ] **Task H2.1: Fix Unsafe Assignments (84 errors)**
  - [ ] **File**: `src/components/exploration/DataPointVirtualList.tsx`
    - [ ] **Current Issue**: `const d3 = require('d3') as any;`
    - [ ] **Fix**: 
      ```typescript
      import * as d3 from 'd3';
      // Or create proper type definitions for specific d3 usage
      ```
    - [ ] Add type guards for data validation:
      ```typescript
      function isValidDataPoint(data: unknown): data is DataPoint {
        return typeof data === 'object' && data !== null && 'value' in data;
      }
      ```

  - [ ] **File**: `src/utils/dataTransforms/DataTransformUtils.ts`
    - [ ] Add proper interface definitions for data structures
    - [ ] Replace `any` with specific types
    - [ ] Add runtime validation functions

- [ ] **Task H2.2: Fix Unsafe Member Access (63 errors)**
  - [ ] **Pattern**: Accessing properties on `any` or `unknown`
    ```typescript
    // FIND
    const value = data.someProperty;
    
    // REPLACE
    const value = isValidData(data) ? data.someProperty : defaultValue;
    ```
  - [ ] Create type guards for common data structures:
    ```typescript
    function isResourceEventData(data: unknown): data is ResourceEventData {
      return typeof data === 'object' && data !== null && 
             'resourceType' in data && 'amount' in data;
    }
    ```

- [ ] **Task H2.3: Fix Unsafe Function Calls (55 errors)**
  - [ ] **Pattern**: Calling functions on `any` type
    ```typescript
    // FIND
    const result = someFunction.call(context, args);
    
    // REPLACE
    const result = typeof someFunction === 'function' ? 
                   someFunction.call(context, args) : defaultResult;
    ```
  - [ ] Focus on D3.js integration files
  - [ ] Add proper function type definitions

---

## 📐 **ARRAY TYPE SYNTAX FIXES (161 errors)**

### **Context**: Standardize to `T[]` instead of `Array<T>` for consistency

- [ ] **Task H3.1: Automated Array Type Fixes**
  ```bash
  # Most can be auto-fixed
  npx eslint . --ext .ts,.tsx --fix --rule @typescript-eslint/array-type
  ```
  - [ ] Run auto-fix command
  - [ ] Verify TypeScript compilation: `npx tsc --noEmit`
  - [ ] Commit changes: `git add . && git commit -m "Fix array type syntax"`

- [ ] **Task H3.2: Manual Array Type Fixes (if auto-fix incomplete)**
  - [ ] **Pattern**:
    ```typescript
    // FIND
    const items: Array<ResourceType> = [];
    function processItems(data: Array<string>): Array<ProcessedItem>
    
    // REPLACE
    const items: ResourceType[] = [];
    function processItems(data: string[]): ProcessedItem[]
    ```
  
  - [ ] **Priority Files**:
    - [ ] `src/components/exploration/AutomatedSectorScanner.tsx`
    - [ ] `src/types/exploration/ExplorationTypes.ts`
    - [ ] `src/managers/exploration/ExplorationManager.ts`

---

## 🏗️ **GENERIC CONSTRUCTOR FIXES (117 errors)**

### **Context**: Standardize generic constructor patterns

- [ ] **Task H4.1: Fix Map and Set Constructors**
  - [ ] **Pattern**:
    ```typescript
    // FIND
    const map = new Map<string, number>();
    const set = new Set<ResourceType>();
    
    // REPLACE (if type can be inferred)
    const map = new Map<string, number>();  // Keep if explicit type needed
    const set: Set<ResourceType> = new Set(); // Or infer when possible
    ```

- [ ] **Task H4.2: Fix Class Generic Constructors**
  - [ ] **Files**: Manager classes and factory patterns
  - [ ] **Pattern**: Ensure consistent generic parameter usage
    ```typescript
    // Standardize to explicit generics when needed
    class EventEmitter<T extends BaseEvent> {
      private listeners = new Map<string, Array<(event: T) => void>>();
    }
    ```

- [ ] **Task H4.3: Fix Factory Pattern Generics**
  - [ ] **File**: `src/factories/ships/ShipFactory.ts`
  - [ ] **File**: `src/factories/modules/ModuleFactory.ts`
  - [ ] Ensure consistent generic patterns across factory implementations

---

## ⚠️ **VALIDATION REQUIREMENTS**

### **After Each Task Group**
- [ ] **Compilation Check**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **ESLint Progress**
  ```bash
  CURRENT=$(npx eslint . --ext .ts,.tsx --quiet | wc -l)
  echo "Errors remaining: $CURRENT"
  ```

- [ ] **Functional Testing**
  - [ ] Resource system operations (add/remove/transfer)
  - [ ] Event system (emit/subscribe/unsubscribe)
  - [ ] Manager registry access patterns
  - [ ] Component rendering (especially visualizations)

### **Critical System Tests**
- [ ] **Resource Manager Integration**
  - [ ] Test resource type enum usage
  - [ ] Verify nullish coalescing logic correctness
  - [ ] Validate manager registry access

- [ ] **Event System Reliability**
  - [ ] Test event type enum usage
  - [ ] Verify event data type safety
  - [ ] Validate event handler type guards

- [ ] **Visualization Components**
  - [ ] Test D3.js integration with new type safety
  - [ ] Verify data point validation
  - [ ] Check rendering performance

---

## 🎯 **SUCCESS CRITERIA**

- [ ] **Error Reduction**: <1,200 total errors (40%+ reduction)
- [ ] **Type Safety**: Zero unsafe type operations
- [ ] **Pattern Consistency**: All arrays use `T[]` syntax
- [ ] **Nullish Safety**: All logical OR replaced with nullish coalescing where appropriate
- [ ] **System Integrity**: All core systems (Resource, Event, Manager) function correctly

---

## 🔄 **INCREMENTAL EXECUTION STRATEGY**

### **Day 1: Foundation**
- [ ] Complete Tasks H1.1, H1.2 (Resource Manager nullish coalescing)
- [ ] Run automated array type fixes (H3.1)
- [ ] Validate and commit changes

### **Day 2: Component Safety**
- [ ] Complete Tasks H1.3, H1.4 (Event system and component props)
- [ ] Begin unsafe assignment fixes (H2.1)
- [ ] Test component rendering

### **Day 3: Type Operations**
- [ ] Complete remaining H2 tasks (unsafe operations)
- [ ] Address generic constructor issues (H4)
- [ ] Comprehensive testing and validation

---

**Next**: After completing HIGH PRIORITY fixes, proceed to MEDIUM_PRIORITY_FIXES.md 