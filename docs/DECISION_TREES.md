# Decision Trees - Galactic Sprawl

**Purpose**: This document provides decision-making guidance for common architectural choices during integration. When faced with a choice, follow the decision tree to maintain consistency.

**Last Updated**: 2025-11-13

---

## Table of Contents

1. [When to Use Interface+Impl vs Direct Class](#decision-1-interfaceimpl-vs-direct-class)
2. [When to Use getInstance() vs Registry Pattern](#decision-2-getinstance-vs-registry-pattern)
3. [How to Handle Type Mismatches](#decision-3-type-mismatch-handling)
4. [Which Component Integration Pattern to Use](#decision-4-component-integration-pattern)
5. [When to Create New Factory vs Use Existing](#decision-5-factory-creation)
6. [String Literal vs Enum Decision](#decision-6-string-literal-vs-enum)

---

## Decision 1: Interface+Impl vs Direct Class

### When Adding a New Manager

**Question**: Should I create an interface + implementation class, or just a direct class?

```
START: Adding new manager
│
├─→ Does manager need multiple implementations?
│   │
│   ├─→ YES → Use Interface+Impl pattern
│   │   Example: ObjectDetectionSystem has ObjectDetectionSystemImpl
│   │   Reason: Allows for testing mocks, alternative implementations
│   │
│   └─→ NO → Continue to next question
│
├─→ Will manager be mocked extensively in tests?
│   │
│   ├─→ YES → Use Interface+Impl pattern
│   │   Example: CombatMechanicsSystem has CombatMechanicsSystemImpl
│   │   Reason: Easy to create test doubles
│   │
│   └─→ NO → Continue to next question
│
├─→ Is this a core/critical system manager?
│   │
│   ├─→ YES → Use Interface+Impl pattern
│   │   Example: ThreatAssessmentManager has ThreatAssessmentManagerImpl
│   │   Reason: Future-proofing for alternative implementations
│   │
│   └─→ NO → Use Direct Class
│       Example: GameManager, CombatManager, ResourceManager
│       Reason: Simpler, less boilerplate
```

### Pattern Examples

**Interface+Impl Pattern**:
```typescript
// ObjectDetectionSystem.ts
export interface ObjectDetectionSystem {
  detectObjects(): void;
  // ... methods
}

export class ObjectDetectionSystemImpl implements ObjectDetectionSystem {
  private static instance: ObjectDetectionSystem | null = null;

  public static getInstance(): ObjectDetectionSystem {
    if (!ObjectDetectionSystemImpl.instance) {
      ObjectDetectionSystemImpl.instance = new ObjectDetectionSystemImpl();
    }
    return ObjectDetectionSystemImpl.instance;
  }

  detectObjects(): void {
    // implementation
  }
}
```

**Direct Class Pattern**:
```typescript
// CombatManager.ts
export class CombatManager {
  // No interface, just the class

  constructor() {
    // initialization
  }

  performCombat(): void {
    // implementation
  }
}
```

### Current Codebase Patterns

**Using Interface+Impl**:
- ObjectDetectionSystem
- CombatMechanicsSystem
- ThreatAssessmentManager

**Using Direct Class**:
- CombatManager
- GameManager
- ResourceManager
- AssetManager
- GameLoopManager
- MiningShipManager
- ExplorationManager

**Recommendation**: **Use Direct Class** unless you have a specific reason for Interface+Impl.

---

## Decision 2: getInstance() vs Registry Pattern

### When Creating Manager Instance

**Question**: Should the manager have its own `getInstance()` method, or rely on ManagerRegistry?

```
START: Creating manager instance pattern
│
├─→ Is this a new manager being added?
│   │
│   ├─→ YES → Use Registry Pattern only
│   │   Implementation: ManagerRegistry creates instance with `new` or `getInstance()`
│   │   Reason: Centralized control, consistent pattern
│   │
│   └─→ NO → This is legacy code, continue to next question
│
├─→ Does manager already have getInstance()?
│   │
│   ├─→ YES → Call getInstance() from ManagerRegistry
│   │   Example: TechTreeManager.getInstance()
│   │   Pattern:
│   │   ```typescript
│   │   export function getTechTreeManager(): TechTreeManager {
│   │     if (!techTreeManagerInstance) {
│   │       techTreeManagerInstance = TechTreeManager.getInstance();
│   │     }
│   │     return techTreeManagerInstance;
│   │   }
│   │   ```
│   │
│   └─→ NO → Use `new` from ManagerRegistry
│       Example: new GameManager()
│       Pattern:
│       ```typescript
│       export function getGameManager(): GameManager {
│         if (!gameManagerInstance) {
│           gameManagerInstance = new GameManager();
│         }
│         return gameManagerInstance;
│       }
│       ```
```

### ⚠️ Do NOT Create Double Singletons

**WRONG** ❌:
```typescript
// Manager has getInstance()
export class SomeManager {
  private static instance: SomeManager;

  static getInstance() {
    if (!this.instance) {
      this.instance = new SomeManager();
    }
    return this.instance;
  }
}

// ManagerRegistry ALSO creates instance
export function getSomeManager(): SomeManager {
  if (!someManagerInstance) {
    someManagerInstance = new SomeManager(); // ❌ Bypasses getInstance!
  }
  return someManagerInstance;
}
```

**CORRECT** ✅:
```typescript
// If manager has getInstance(), use it:
export function getSomeManager(): SomeManager {
  if (!someManagerInstance) {
    someManagerInstance = SomeManager.getInstance(); // ✅ Use getInstance
  }
  return someManagerInstance;
}

// OR remove getInstance() and let Registry handle it:
export class SomeManager {
  // No static instance, no getInstance()
  constructor() { ... }
}

export function getSomeManager(): SomeManager {
  if (!someManagerInstance) {
    someManagerInstance = new SomeManager(); // ✅ Registry controls instance
  }
  return someManagerInstance;
}
```

### Recommendation

**For NEW managers**: Do NOT add `getInstance()`. Let ManagerRegistry handle all singleton logic.

**For EXISTING managers**: If they have `getInstance()`, call it from ManagerRegistry. If not, use `new`.

---

## Decision 3: Type Mismatch Handling

### When Component Types Don't Match Manager Types

**Question**: Component expects type A, but manager provides type B. How to handle?

```
START: Component type != Manager type
│
├─→ Are types semantically the same (just different names)?
│   │
│   ├─→ YES → Create conversion layer in component
│   │   Example: UnifiedMiningShip → MiningShip
│   │   Location: Component's useEffect
│   │   Pattern: See example below
│   │
│   └─→ NO → Continue to next question
│
├─→ Is component type deprecated/legacy?
│   │
│   ├─→ YES → Update component to use manager type
│   │   Action: Change component's type imports
│   │   Benefit: Reduces technical debt
│   │
│   └─→ NO → Continue to next question
│
├─→ Is manager type deprecated/legacy?
│   │
│   ├─→ YES → ⚠️ DON'T INTEGRATE YET
│   │   Action: Update manager types first (Phase 2)
│   │   Reason: Don't spread deprecated types
│   │
│   └─→ NO → Continue to next question
│
└─→ Types are fundamentally different
    │
    ├─→ Can they be unified?
    │   │
    │   ├─→ YES → Create unified type in Phase 2
    │   │   Action: Postpone integration until types unified
    │   │
    │   └─→ NO → Create conversion utility
    │       Location: src/utils/conversions/
    │       Example: convertShipFormat(managerShip): ComponentShip
```

### Conversion Layer Pattern (Temporary)

**Example** (from MiningWindow.tsx):
```typescript
useEffect(() => {
  const updateShips = () => {
    // Get manager data (UnifiedMiningShip[])
    const unifiedShips = miningShipManager.getAllShips();

    // Convert to component format (MiningShip[])
    const convertedShips: MiningShip[] = unifiedShips.map(ship => ({
      id: ship.id,
      name: ship.name,
      type: ship.shipClass === PlayerShipClass.ROCK_BREAKER
        ? PlayerShipClass.ROCK_BREAKER
        : PlayerShipClass.VOID_DREDGER,
      status: (ship.status as 'idle' | 'mining' | 'returning') || 'idle',
      capacity: typeof ship.stats?.cargo === 'number'
        ? ship.stats.cargo
        : ship.stats?.cargo?.capacity || 1000,
      currentLoad: ship.currentLoad || 0,
      targetNode: ship.targetNode,
      efficiency: ship.efficiency || 1.0,
    }));

    setManagerShips(convertedShips);
  };

  updateShips();
  const interval = setInterval(updateShips, 1000);
  return () => clearInterval(interval);
}, [miningShipManager]);
```

**Location**: Inside component, in the sync useEffect

**When to Use**: Temporary solution during migration. Plan to unify types in Phase 2.

### Conversion Utility Pattern (Permanent)

**Example**:
```typescript
// src/utils/conversions/shipConversions.ts
export function convertUnifiedToMining(unified: UnifiedMiningShip): MiningShip {
  return {
    id: unified.id,
    name: unified.name,
    type: unified.shipClass,
    status: unified.status as 'idle' | 'mining' | 'returning',
    capacity: getCargoCapacity(unified.stats),
    currentLoad: unified.currentLoad || 0,
    targetNode: unified.targetNode,
    efficiency: unified.efficiency || 1.0,
  };
}

// In component:
const convertedShips = unifiedShips.map(convertUnifiedToMining);
```

**When to Use**: When types cannot be unified and will remain different.

---

## Decision 4: Component Integration Pattern

### Which Integration Approach to Use

**Question**: How should I connect this component to the manager?

```
START: Component integration
│
├─→ Does component need real-time updates?
│   │
│   ├─→ YES → Continue to next question
│   │
│   └─→ NO → Use simple data fetch
│       Pattern: Call manager method once in useEffect
│       Example:
│       ```typescript
│       useEffect(() => {
│         const data = manager.getData();
│         setData(data);
│       }, [manager]);
│       ```
│
├─→ Does manager emit relevant events?
│   │
│   ├─→ YES → Use Event-Driven pattern
│   │   Pattern: Subscribe to moduleEventBus events
│   │   Benefit: Most efficient, no polling
│   │   See: PATTERN_LIBRARY.md Pattern 5
│   │
│   └─→ NO → Continue to next question
│
├─→ Is data updated frequently (< 5 seconds)?
│   │
│   ├─→ YES → Use Polling pattern (1-2 second interval)
│   │   Pattern: setInterval in useEffect
│   │   Example:
│   │   ```typescript
│   │   useEffect(() => {
│   │     const update = () => setData(manager.getData());
│   │     update();
│   │     const interval = setInterval(update, 1000);
│   │     return () => clearInterval(interval);
│   │   }, [manager]);
│   │   ```
│   │
│   └─→ NO → Use Slow Polling pattern (5-10 second interval)
│       Pattern: Same as above but longer interval
│       Benefit: Reduces performance impact
```

### Pattern Comparison

| Pattern | When to Use | Performance | Complexity |
|---------|-------------|-------------|------------|
| **Event-Driven** | Manager emits events | ⭐⭐⭐ Best | 🟡 Medium |
| **Fast Polling** | Data changes frequently | 🟡 Moderate | 🟢 Easy |
| **Slow Polling** | Data changes occasionally | ⭐⭐ Good | 🟢 Easy |
| **One-Time Fetch** | Static/rarely changing data | ⭐⭐⭐ Best | 🟢 Easy |

### Hybrid Pattern (Recommended for Reliability)

```typescript
useEffect(() => {
  const updateData = () => {
    const data = manager.getData();
    setData(data);
  };

  // Event-driven updates (primary)
  const unsubscribe = moduleEventBus.subscribe(
    EventType.DATA_UPDATED,
    updateData
  );

  // Polling as fallback (secondary)
  updateData(); // Initial fetch
  const interval = setInterval(updateData, 5000); // Slower fallback

  return () => {
    unsubscribe();
    clearInterval(interval);
  };
}, [manager]);
```

**Benefit**: Events provide instant updates, polling catches missed events.

---

## Decision 5: Factory Creation

### When to Create New Factory vs Use Existing

**Question**: Do I need to create a factory for this system?

```
START: Considering factory for system
│
├─→ Does a factory already exist for this type?
│   │
│   ├─→ YES → Use existing factory
│   │   Example: ShipFactory exists → use it for all ships
│   │   Action: Import and use factory
│   │
│   └─→ NO → Continue to next question
│
├─→ Does the system create complex objects?
│   │
│   ├─→ NO → Don't create factory
│   │   Example: Simple data objects, configurations
│   │   Action: Use constructor or object literals
│   │
│   └─→ YES → Continue to next question
│
├─→ Are objects created in multiple places?
│   │
│   ├─→ NO → Don't create factory (yet)
│   │   Action: Wait until second use case appears
│   │   Reason: YAGNI (You Aren't Gonna Need It)
│   │
│   └─→ YES → Continue to next question
│
├─→ Does creation involve complex logic?
│   │
│   ├─→ YES → Create factory
│   │   Examples: Validation, defaults, type determination
│   │   Pattern: See Factory Pattern below
│   │
│   └─→ NO → Consider factory (optional)
│       Decision: Factory provides consistency even if simple
```

### Factory Pattern

```typescript
// src/factories/SomeFactory.ts
export class SomeFactory {
  private static instance: SomeFactory;

  public static getInstance(): SomeFactory {
    if (!this.instance) {
      this.instance = new SomeFactory();
    }
    return this.instance;
  }

  public create(config: SomeConfig): SomeObject {
    // Validation
    if (!this.validate(config)) {
      throw new Error('Invalid configuration');
    }

    // Apply defaults
    const withDefaults = this.applyDefaults(config);

    // Create object
    return new SomeObject(withDefaults);
  }

  private validate(config: SomeConfig): boolean {
    // Validation logic
    return true;
  }

  private applyDefaults(config: Partial<SomeConfig>): SomeConfig {
    return {
      // defaults
      ...config,
    };
  }
}
```

### When NOT to Create Factory

**Don't create factory if:**
- Objects are simple (just data, no behavior)
- Objects created in only one place
- Creation is trivial (no validation, no defaults)
- No variations in creation logic

**Example** (no factory needed):
```typescript
// Simple object creation
const config = {
  id: '123',
  name: 'Config Name',
  enabled: true,
};
```

---

## Decision 6: String Literal vs Enum

### When to Use Enum vs String Literal Type

**Question**: Should this be an enum or a string literal union type?

```
START: Defining a type with known values
│
├─→ Are values used at runtime (not just types)?
│   │
│   ├─→ YES → Use Enum
│   │   Example: EventType (used in switch statements, comparisons)
│   │   Reason: Enum provides both type AND values
│   │
│   └─→ NO → Continue to next question
│
├─→ Do values need to be iterated?
│   │
│   ├─→ YES → Use Enum
│   │   Example: Object.values(EnumName) to get all values
│   │   Reason: Enum is iterable, string literal is not
│   │
│   └─→ NO → Continue to next question
│
├─→ Are there more than 5 possible values?
│   │
│   ├─→ YES → Use Enum
│   │   Reason: Better IDE autocomplete, easier to maintain
│   │
│   └─→ NO → Continue to next question
│
├─→ Will values be added/removed frequently?
│   │
│   ├─→ YES → Use Enum
│   │   Reason: Single source of truth, easier updates
│   │
│   └─→ NO → String Literal is acceptable
│       Example: type Status = 'active' | 'inactive'
│       Reason: Simple, inline type definition
```

### When to ALWAYS Use Enum

**Use enum for**:
- Event types (EventType)
- Resource types (ResourceType)
- Ship classes (PlayerShipClass)
- Module types (ModuleType ← currently string literal, needs conversion!)
- Building types
- Any type with > 5 values
- Any type used in switch statements
- Any type that needs runtime iteration

### Enum Pattern

```typescript
/**
 * Description of what these values represent
 */
export enum TypeName {
  VALUE_ONE = 'value-one',
  VALUE_TWO = 'value-two',
  VALUE_THREE = 'value-three',
}

// Usage:
const value: TypeName = TypeName.VALUE_ONE;

// Runtime iteration:
const allValues = Object.values(TypeName);

// Type guard:
export function isTypeName(value: unknown): value is TypeName {
  return typeof value === 'string' &&
         Object.values(TypeName).includes(value as TypeName);
}
```

### String Literal Pattern (Acceptable for Small Sets)

```typescript
/**
 * Simple status type
 */
export type SimpleStatus = 'active' | 'inactive' | 'pending';

// Usage:
const status: SimpleStatus = 'active';
```

**When acceptable**:
- 2-3 values only
- Values won't change frequently
- Only used as types (not runtime values)
- Component-specific, not global

---

## Quick Decision Cheat Sheet

| Question | Answer | Reference |
|----------|--------|-----------|
| Interface+Impl or Direct Class? | **Direct Class** (unless testing/multiple impls) | Decision 1 |
| getInstance() or Registry? | **Registry controls** (use getInstance if exists) | Decision 2 |
| Type mismatch? | **Conversion layer** (temp until Phase 2) | Decision 3 |
| Component integration? | **Event-driven** (or polling if no events) | Decision 4 |
| Create factory? | **Only if complex** (wait for second use case) | Decision 5 |
| Enum or string literal? | **Enum** (if > 5 values or used at runtime) | Decision 6 |

---

**Last Updated**: 2025-11-13
**Maintainer**: Galactic Sprawl Audit Team
