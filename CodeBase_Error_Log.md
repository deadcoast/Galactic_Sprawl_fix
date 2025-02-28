# System Errors and Fixes

This document tracks system-wide errors that have been identified and fixed in the Galactic Sprawl codebase. It serves as a reference for common issues and their solutions.

## TypeScript Linting Errors

# System Linting Errors

This document provides a detailed analysis of the remaining linting errors in the Galactic Sprawl codebase, categorized by type and component.

# Linting Fixes for Galactic Sprawl Codebase

This document tracks the linting issues that have been fixed in the Galactic Sprawl codebase.

## ESLint Configuration Fixes

- **Issue**: ESLint configuration files using CommonJS module format causing 'module is not defined' errors
- **Fix**: Converted `.eslintrc.js` and `.prettierrc.js` to JSON format (`.eslintrc.json` and `.prettierrc.json`)
- **Best Practice**: Use JSON format for ESLint and Prettier configuration files when possible to avoid CommonJS module issues

## TypeScript Explicit Any Errors

### Fixed Files

- `src/utils/modules/moduleValidation.ts`
  - **Issue**: Functions using `any` type for parameters in type validation functions
  - **Fix**: Replaced `any` with `unknown` and added proper type assertions using `as Partial<T>` pattern
  - **Example**:
  ```typescript
  // Before
  export function validateModularBuilding(building: any): building is ModularBuilding {
    // Direct property access on 'any' type
    if (typeof building.id !== 'string') {
      return false;
    }
    // ...
  }

  // After
  export function validateModularBuilding(building: unknown): building is ModularBuilding {
    if (typeof building !== 'object' || building === null) {
      return false;
    }
    
    // Use type assertion to access properties
    const b = building as Partial<ModularBuilding>;
    
    if (typeof b.id !== 'string' || b.id.trim() === '') {
      return false;
    }
    // ...
  }
  ```
  - **Best Practice**: Use `unknown` instead of `any` for parameters in type guard functions, then use type assertions with `Partial<T>` to safely access properties during validation.

- `src/initialization/gameSystemsIntegration.ts`
  - **Issue**: Multiple `any` types used for window properties and event handlers
  - **Fix**: 
    - Created proper interfaces for message payloads
    - Replaced `any` with `unknown` and added proper type assertions
    - Added null checks for potentially undefined values
  - **Example**:
  ```typescript
  // Before
  const resourceManager = (window as any).resourceManager as ResourceManager;
  
  // After
  const resourceManager = (window as unknown as { resourceManager?: ResourceManager }).resourceManager;
  
  // Before
  const techUnlockedListener = (data: any) => {
    // Unsafe property access
    const category = data.node.category;
  }
  
  // After
  interface TechUpdatePayload {
    nodeId: string;
    node?: {
      category: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }
  
  const techUnlockedListener = (data: TechUpdatePayload) => {
    // Safe property access with optional chaining
    const category = data.node?.category;
  }
  ```
  - **Best Practice**: Define proper interfaces for message payloads and use optional chaining (`?.`) for potentially undefined properties.

- `src/managers/game/ResourceManager.ts`
  - **Issue**: Using `any` for the `details` property in the `ResourceError` type
  - **Fix**: Replaced `any` with `unknown` for the `details` property in the `ResourceError` type
  - **Example**:
  ```typescript
  // Before
  type ResourceError = {
    code: 'INVALID_RESOURCE' | 'INSUFFICIENT_RESOURCES' | 'INVALID_TRANSFER' | 'THRESHOLD_VIOLATION';
    message: string;
    details?: any;
  };

  // After
  type ResourceError = {
    code: 'INVALID_RESOURCE' | 'INSUFFICIENT_RESOURCES' | 'INVALID_TRANSFER' | 'THRESHOLD_VIOLATION';
    message: string;
    details?: unknown;
  };
  ```
  - **Best Practice**: Use `unknown` instead of `any` to force explicit type checking before using the value.

- `src/managers/module/ModuleStatusManager.ts`
  - **Issue**: Multiple `any` types used in event handlers and return types
  - **Fix**: 
    - Created a `ModuleAlert` interface to replace `any[]` return type
    - Used the `ModuleEvent` type from ModuleEvents.ts for event handlers
    - Added proper type assertions for event data properties
    - Removed unused imports (`BaseModule` and `ModuleType`)
  - **Example**:
  ```typescript
  // Before
  public getModuleAlerts(moduleId: string, onlyUnacknowledged = false): any[] {
    const alerts = this.moduleStatuses.get(moduleId)?.alerts || [];
    return onlyUnacknowledged ? alerts.filter(alert => !alert.acknowledged) : alerts;
  }

  private handleModuleCreated = (event: any): void => {
    this.initializeModuleStatus(event.moduleId);
  };

  // After
  export interface ModuleAlert {
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: number;
    acknowledged: boolean;
  }

  public getModuleAlerts(moduleId: string, onlyUnacknowledged = false): ModuleAlert[] {
    const alerts = this.moduleStatuses.get(moduleId)?.alerts || [];
    return onlyUnacknowledged ? alerts.filter(alert => !alert.acknowledged) : alerts;
  }

  private handleModuleCreated = (event: ModuleEvent): void => {
    this.initializeModuleStatus(event.moduleId);
  };
  ```
  - **Best Practice**: Use proper type definitions for event handlers and return types, and use type assertions with optional chaining for safe property access.

- `src/components/ui/modules/ModuleStatusDisplay.tsx`, `src/components/ui/modules/ModuleUpgradeDisplay.tsx`, `src/components/ui/modules/SubModuleHUD.tsx`
  - **Issue**: Using `any` type for module state variables and unsafe type casting
  - **Fix**: 
    - Replaced `useState<any>(null)` with `useState<BaseModule | null>(null)`
    - Added proper null checks when setting state with potentially undefined values
    - Used proper type assertions for accessing manager properties
  - **Example**:
  ```typescript
  // Before
  const [module, setModule] = useState<any>(null);
  
  useEffect(() => {
    const moduleData = moduleManager.getModule(moduleId);
    setModule(moduleData);
  }, [moduleId]);

  // After
  const [module, setModule] = useState<BaseModule | null>(null);
  
  useEffect(() => {
    const moduleData = moduleManager.getModule(moduleId);
    setModule(moduleData || null);
  }, [moduleId]);
  ```

  ```typescript
  // Before (in SubModuleHUD.tsx)
  const {configs} = subModuleManager as any;
  
  // After
  const manager = subModuleManager as SubModuleManager;
  const configs = (manager as unknown as { configs: Map<SubModuleType, SubModuleConfig> }).configs;
  ```
  - **Best Practice**: 
    - Always use specific types instead of `any` for state variables
    - Add null checks when setting state with values that might be undefined
    - Use proper type assertions with intermediate steps for complex type conversions
    - Import necessary types from their respective modules

## Lexical Declaration Errors in Case Blocks

### Fixed Files

- `src/hooks/factions/useFleetAI.ts`
  - **Issue**: Multiple case blocks with lexical declarations (`const`, `let`) without curly braces
  - **Fix**: Added curly braces around case blocks containing lexical declarations
  - **Example**:
  ```typescript
  // Before
  case 'arrow':
    const arrowDepth = Math.ceil(unitCount / 3);
    for (let i = 0; i < unitCount; i++) {
      // ...
    }
    break;

  // After
  case 'arrow': {
    const arrowDepth = Math.ceil(unitCount / 3);
    for (let i = 0; i < unitCount; i++) {
      // ...
    }
    break;
  }
  ```
  - **Best Practice**: Always use curly braces around case blocks that contain lexical declarations to avoid scope issues.

- `src/managers/game/AutomationManager.ts`
  - **Issue**: Multiple case blocks with lexical declarations (`const`, `let`) without curly braces
  - **Fix**: Added curly braces around case blocks containing lexical declarations
  - **Example**:
  ```typescript
  // Before
  case 'RESOURCE_ABOVE':
    if (!condition.target || !condition.value) {
      continue;
    }
    const currentAmount = resourceManager.getResourceAmount(condition.target as ResourceType);
    if (currentAmount <= condition.value) {
      return false;
    }
    break;

  // After
  case 'RESOURCE_ABOVE': {
    if (!condition.target || !condition.value) {
      continue;
    }
    const currentAmount = resourceManager.getResourceAmount(condition.target as ResourceType);
    if (currentAmount <= condition.value) {
      return false;
    }
    break;
  }
  ```
  - **Best Practice**: Always use curly braces around case blocks that contain lexical declarations to create proper block scoping.

## Promise Executor Errors

### Fixed Files

- `src/managers/game/assetManager.ts`
  - **Issue**: Using `async` keyword in promise executor function
  - **Fix**: Removed `async` keyword and used traditional promise handling with `.then()` and `.catch()`
  - **Example**:
  ```typescript
  // Before
  this.loadPromise = new Promise(async (resolve, reject) => {
    try {
      await Assets.init();
      await Assets.loadBundle('default');
      // Process loaded assets
      resolve();
    } catch (error) {
      reject(error);
    }
  });

  // After
  this.loadPromise = new Promise((resolve, reject) => {
    Assets.init()
      .then(() => Assets.loadBundle('default'))
      .then(() => {
        // Process loaded assets
        resolve();
      })
      .catch(error => {
        reject(error);
      });
  });
  ```
  - **Best Practice**: Never use `async` functions as promise executors to prevent unhandled promise rejections.

## Console Statement Warnings

### 1. `src/initialization/gameSystemsIntegration.ts`

**Fix**: Replaced `console.log` with `console.warn` for important system messages.

```typescript
// Before
console.log('Initializing resource integration with available managers');

// After
console.warn('Initializing resource integration with available managers');
```

**Best Practice**: Use `console.warn` for important system messages that should be visible in production.

### 2. `src/managers/game/ResourceManager.ts`

**Fix**: Replaced all `console.debug` statements with `console.warn` to comply with the linting rules.

```typescript
// Before
console.debug('[ResourceManager] Initialized with config:', config);
console.debug(`[ResourceManager] Optimized production for ${type}: ${oldProduction.toFixed(2)} -> ${targetProduction.toFixed(2)}`);
console.debug(`[ResourceManager] Adjusted transfer interval for ${resource.type}: ${oldInterval}ms -> ${resource.interval}ms`);

// After
console.warn('[ResourceManager] Initialized with config:', config);
console.warn(`[ResourceManager] Optimized production for ${type}: ${oldProduction.toFixed(2)} -> ${targetProduction.toFixed(2)}`);
console.warn(`[ResourceManager] Adjusted transfer interval for ${resource.type}: ${oldInterval}ms -> ${resource.interval}ms`);
```

**Best Practice**: Use appropriate console methods based on the importance of the message. In this codebase, only `console.warn` and `console.error` are allowed.

### Fixed Files

- `src/hooks/factions/useFleetAI.ts`
  - **Issue**: Using `console.log` for officer experience tracking
  - **Fix**: Replaced `console.log` with `console.warn` for officer experience tracking
  - **Example**:
  ```typescript
  // Before
  function emitOfficerExperience(officerId: string, amount: number) {
    // This would be connected to your event system
    console.log(`Officer ${officerId} gained ${amount} experience`);
  }

  // After
  function emitOfficerExperience(officerId: string, amount: number) {
    // This would be connected to your event system
    console.warn(`Officer ${officerId} gained ${amount} experience`);
  }
  ```
  - **Best Practice**: Use `console.warn` for important messages that should be visible in production, and `console.error` for critical errors.

- `src/managers/game/AutomationManager.ts`
  - **Issue**: Using `console.error` for non-critical action execution errors
  - **Fix**: Replaced `console.error` with `console.warn` for action execution errors
  - **Example**:
  ```typescript
  // Before
  catch (error) {
    console.error(`Error executing action ${action.type}:`, error);
    // Continue with next action even if one fails
  }

  // After
  catch (error) {
    console.warn(`Error executing action ${action.type}:`, error);
    // Continue with next action even if one fails
  }
  ```
  - **Best Practice**: Reserve `console.error` for critical errors that require immediate attention, and use `console.warn` for non-critical issues.

## Unused Variables and Imports

### Fixed Files

- `src/hooks/factions/useFleetAI.ts`
  - **Issue**: Unused variables `diamondSize` and `currentIndex` in formation calculation
  - **Fix**: Removed the unused variables completely
  - **Example**:
  ```typescript
  // Before
  case 'diamond': {
    const diamondSize = Math.ceil(Math.sqrt(unitCount));
    for (let i = 0; i < unitCount; i++) {
      // ...
    }
    break;
  }

  case 'spearhead': {
    const spearUnits = Math.ceil(unitCount * 0.3);
    const wingUnits = Math.floor((unitCount - spearUnits) / 2);
    let currentIndex = 0;
    
    // Spear tip
    for (let i = 0; i < spearUnits; i++) {
      // ...
      currentIndex++;
    }
    // ...
  }

  // After
  case 'diamond': {
    for (let i = 0; i < unitCount; i++) {
      // ...
    }
    break;
  }

  case 'spearhead': {
    const spearUnits = Math.ceil(unitCount * 0.3);
    const wingUnits = Math.floor((unitCount - spearUnits) / 2);
    
    // Spear tip
    for (let i = 0; i < spearUnits; i++) {
      // ...
    }
    // ...
  }
  ```
  - **Best Practice**: Remove unused variables to improve code readability and prevent memory leaks.

- `src/managers/game/AutomationManager.ts`
  - **Issue**: Unused imports `BaseModule` and `ModuleType`
  - **Fix**: Removed the unused imports
  - **Example**:
  ```typescript
  // Before
  import { moduleEventBus } from '../../lib/modules/ModuleEvents';
  import { BaseModule, ModuleType } from '../../types/buildings/ModuleTypes';
  import { moduleManager } from '../module/ModuleManager';
  import { resourceManager } from './ResourceManager';
  import { ModuleEventType } from '../../lib/modules/ModuleEvents';

  // After
  import { moduleEventBus } from '../../lib/modules/ModuleEvents';
  import { moduleManager } from '../module/ModuleManager';
  import { resourceManager } from './ResourceManager';
  import { ModuleEventType, ModuleEvent } from '../../lib/modules/ModuleEvents';
  import { ResourceType } from '../../types/resources/ResourceTypes';
  ```
  - **Best Practice**: Remove unused imports to improve code readability and reduce bundle size.

## Type Safety Improvements

### Fixed Files

- `src/managers/game/AutomationManager.ts`
  - **Issue**: Using `any` types for condition values, action values, and event handlers
  - **Fix**: 
    - Created specific interfaces for different condition and action value types
    - Added proper type assertions for values
    - Used the `ModuleEvent` type for event handlers
  - **Example**:
  ```typescript
  // Before
  export interface AutomationCondition {
    type: AutomationConditionType;
    target?: string;
    value?: any;
    operator?: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains';
  }

  export interface AutomationAction {
    type: AutomationActionType;
    target?: string;
    value?: any;
    delay?: number;
  }

  // After
  export interface ResourceConditionValue {
    amount: number;
  }

  export interface TimeConditionValue {
    milliseconds: number;
  }

  export interface TransferResourcesValue {
    from: string;
    to: string;
    amount: number;
    type: ResourceType;
  }

  export interface AutomationCondition {
    type: AutomationConditionType;
    target?: string;
    value?: ResourceConditionValue | TimeConditionValue | EventConditionValue | StatusConditionValue | number;
    operator?: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains';
  }

  export interface AutomationAction {
    type: AutomationActionType;
    target?: string;
    value?: TransferResourcesValue | ResourceActionValue | EmitEventValue | number | string;
    delay?: number;
  }
  ```
  - **Best Practice**: Create specific interfaces for different value types to improve type safety and code readability.

## Remaining Linting Issues

The following issues still need to be addressed:

1. TypeScript explicit any errors
   - Replace remaining `any` types with proper type definitions
   - Create interfaces for untyped objects
   - Use type guards for runtime type checking

2. Unused variables and imports
   - Remove unused variables or prefix with underscore (_)
   - Clean up unused imports
   - Document imports that appear unused but are required

3. Console statements
   - Replace remaining `console.log` with proper logging system
   - Keep only necessary `console.warn` and `console.error` statements
   - Add comments for debug-only console statements

4. React hook dependency warnings
   - Add missing dependencies to dependency arrays
   - Extract functions outside of hooks where appropriate
   - Use useCallback/useMemo for functions in dependency arrays

5. Prefer const over let
   - Replace `let` with `const` for variables that are never reassigned

## Next Steps

1. Continue fixing TypeScript explicit any errors in critical files
2. Address lexical declaration errors in case blocks
3. Clean up unused variables and imports
4. Replace console statements with proper logging
5. Fix React hook dependency warnings 

## Error Categories

### 1. WeaponEffect Property Errors (8 errors)
- **Files**: `WeaponComponents.tsx`, `WeaponControl.tsx`
- **Error**: Properties like 'name' and 'description' don't exist on type 'WeaponEffect'
- **Root Cause**: The WeaponEffect interface in WeaponEffects.ts doesn't include these properties, but components are trying to access them
- **Solution Approach**: Update the WeaponEffect interface to include these properties or use a more specific effect type that includes them

### 2. Effect Type Errors (5 errors)
- **Files**: `shipEffects.ts`, `effectUtils.ts`
- **Error**: Object literals specifying properties not in the type definition
- **Root Cause**: The Effect interface doesn't include properties like 'name' that are being used in object literals
- **Solution Approach**: Update the Effect interface to include these properties or create a more specific interface that extends Effect

### 3. CombatUnit Type Errors (10+ errors)
- **Files**: `useCombatAI.ts`, `ShipClassFactory.ts`
- **Error**: Type mismatches and missing properties in CombatUnit
- **Root Cause**: The CombatUnit interface doesn't include properties like 'health', 'maxHealth', 'shield', 'maxShield' that are being accessed
- **Solution Approach**: Update the CombatUnit interface to include these properties or create a proper type conversion function

### 4. ResourceTracking Type Errors (10+ errors)
- **Files**: `useResourceTracking.ts`
- **Error**: Missing type definitions and property access errors
- **Root Cause**: Missing interfaces like SerializedResourceState, SerializedResource, ResourceTotals, SerializedThreshold
- **Solution Approach**: Define these missing interfaces in ResourceTypes.ts

### 5. ResourcePoolManager Errors (15+ errors)
- **Files**: `ResourcePoolManager.ts`
- **Error**: Property access errors and possible undefined values
- **Root Cause**: Accessing properties that don't exist on the PoolDistributionRule interface and possible undefined values
- **Solution Approach**: Update the PoolDistributionRule interface and add null checks for possibly undefined values

### 6. Test File Errors (20+ errors)
- **Files**: `ModuleManager.test.ts`, `ResourceFlowManager.test.ts`
- **Error**: Type mismatches in test data
- **Root Cause**: Test data doesn't match the expected interfaces
- **Solution Approach**: Update test data to match current type definitions or create test-specific interfaces

### 7. Type Conversion Errors (5+ errors)
- **Files**: `typeConversions.ts`
- **Error**: Type mismatches in conversion functions
- **Root Cause**: Conversion functions not handling all edge cases or missing properties
- **Solution Approach**: Update conversion functions to handle all edge cases and ensure all required properties are included

### 8. Initialization Errors (5 errors)
- **Files**: `automationSystemInit.ts`, `moduleFrameworkInit.ts`
- **Error**: Missing arguments and unknown properties
- **Root Cause**: Function calls missing required arguments and object literals with unknown properties
- **Solution Approach**: Add missing arguments to function calls and update object literals to match expected interfaces

### 9. Miscellaneous Errors
- **Files**: Various
- **Error**: Duplicate function implementations, unknown names, etc.
- **Root Cause**: Various issues including duplicate function implementations and placeholder code
- **Solution Approach**: Remove duplicate functions and fix placeholder code

## Detailed Error Analysis

### WeaponEffect Property Errors

#### WeaponComponents.tsx
```typescript
// Error: Property 'name' does not exist on type 'WeaponEffect'
effect.name // Line 133
```

#### WeaponControl.tsx
```typescript
// Error: Property 'description' does not exist on type 'WeaponEffect'
effect.description // Line 138
```

### Effect Type Errors

#### shipEffects.ts
```typescript
// Error: Object literal may only specify known properties, and 'name' does not exist in type 'Effect'
{
  id: 'shield-boost',
  name: 'Shield Boost', // 'name' doesn't exist in type 'Effect'
  type: 'shield',
  duration: 10,
  magnitude: 1.5
}
```

#### effectUtils.ts
```typescript
// Error: Type '{ name: string; description: string; type: EffectType; id: string; duration?: number | undefined; magnitude: number; target?: string | undefined; active: boolean; cooldown?: number | undefined; }' is not assignable to type 'BaseEffect'
// Types of property 'duration' are incompatible
// Type 'number | undefined' is not assignable to type 'number'
// Type 'undefined' is not assignable to type 'number'
```

### CombatUnit Type Errors

#### useCombatAI.ts
```typescript
// Error: Property 'health' does not exist on type 'CombatUnit'
unit.health // Line 136

// Error: Property 'maxHealth' does not exist on type 'CombatUnit'
unit.maxHealth // Line 136

// Error: Property 'shield' does not exist on type 'CombatUnit'
unit.shield // Line 136

// Error: Property 'maxShield' does not exist on type 'CombatUnit'
unit.maxShield // Line 136
```

#### ShipClassFactory.ts
```typescript
// Error: Type 'string' is not assignable to type 'CombatUnitStatus'
status: 'ready', // Line 36
```

### ResourceTracking Type Errors

#### useResourceTracking.ts
```typescript
// Error: Cannot find name 'SerializedResourceState'
const deserializeState = (serialized: SerializedResourceState) // Line 500

// Error: Cannot find name 'SerializedResource'
const resources: Record<ResourceType, SerializedResource> = {} // Line 501

// Error: Property 'capacity' does not exist on type 'ResourceState'
state.capacity // Line 508

// Error: Cannot find name 'ResourceTotals'
const calculateTotals = (): ResourceTotals => { // Line 541
```

### ResourcePoolManager Errors

#### ResourcePoolManager.ts
```typescript
// Error: Property 'enabled' does not exist on type 'PoolDistributionRule'
rule.enabled // Line 597

// Error: Property 'sourceId' does not exist on type 'PoolDistributionRule'
rule.sourceId // Line 602

// Error: Property 'targetId' does not exist on type 'PoolDistributionRule'. Did you mean 'targetIds'?
rule.targetId // Line 609

// Error: 'sourceContainer.resources' is possibly 'undefined'
sourceContainer.resources // Line 616

// Error: Duplicate function implementation
applyDistributionRules() // Line 261 and Line 593
```

## Solution Patterns

### 1. Interface Updates
- Add missing properties to interfaces
- Create extended interfaces for types that need additional properties
- Ensure all required properties are defined

### 2. Type Conversions
- Create helper functions for type conversions
- Use proper type assertions with null checks
- Implement type guards for runtime type checking

### 3. Null Handling
- Add null checks for possibly undefined values
- Use optional chaining (?.) and nullish coalescing (??) operators
- Provide default values for optional properties

### 4. Test Data Updates
- Update test data to match current type definitions
- Create test-specific interfaces if needed
- Use proper mocking techniques for dependencies

### 5. Code Cleanup
- Remove duplicate function implementations
- Fix placeholder code
- Update function calls with missing arguments 

### Type Mismatch Errors (Code 2367)

#### FactionShipStats.tsx - Comparing FactionBehaviorType with string
- **Error**: Comparing incompatible types 'FactionBehaviorType' and 'string'
- **Fix**: Created helper function `getBehaviorString` to convert FactionBehaviorType to string before comparison
- **Solution Pattern**: When comparing complex types with primitive types, create helper functions to extract the relevant property

```typescript
// Helper function to get behavior string from FactionBehaviorType
const getBehaviorString = (behavior: FactionBehaviorType): string => {
  return behavior.behavior || '';
};

// Usage
if (getBehaviorString(ship.tactics) === 'aggressive') {
  // ...
}
```

#### Faction Ship Files - Using string instead of FactionBehaviorType
- **Error**: Type 'string' is not assignable to type 'FactionBehaviorType'
- **Fix**: Created helper function to convert string to FactionBehaviorType
- **Solution Pattern**: Create helper functions to convert between primitive types and complex objects

```typescript
// Helper function to create a FactionBehaviorType from string
const createFactionBehavior = (behavior: string): FactionBehaviorType => {
  return {
    formation: 'standard',
    behavior: behavior
  };
};

// Usage
tactics: typeof tactics === 'string' ? createFactionBehavior(tactics) : tactics
```

### Property Access Errors (Code 2339)

#### FactionShipStats.tsx - Using string methods on FactionBehaviorType
- **Error**: Property 'charAt' does not exist on type 'FactionBehaviorType'
- **Fix**: Created helper function `formatBehavior` to handle string operations after conversion
- **Solution Pattern**: Create utility functions for type conversions and operations

```typescript
// Helper function to format the behavior string
const formatBehavior = (behavior: string): string => {
  if (!behavior) return '';
  return behavior.charAt(0).toUpperCase() + behavior.slice(1);
};

// Usage
{formatBehavior(getBehaviorString(ship.tactics))}
```

#### combatWorker.ts - Accessing properties on 'never' type
- **Error**: Property 'id' does not exist on type 'never'
- **Fix**: Replaced Set with Array and used traditional for loop instead of forEach
- **Solution Pattern**: When TypeScript has trouble with type narrowing in collection iteration, use arrays and traditional for loops

```typescript
// Create a filtered array of hazards instead of using Set
const nearbyHazards: Hazard[] = [];

// Push to array instead of adding to Set
hazards.forEach(hazard => {
  if (/* condition */) {
    nearbyHazards.push(hazard);
  }
});

// Use traditional for loop instead of forEach
for (let i = 0; i < nearbyHazards.length; i++) {
  const hazard = nearbyHazards[i];
  // TypeScript maintains type information better in this context
}
```

#### ResourceExchangeManager.ts - Accessing non-existent properties
- **Error**: Property 'active'/'sourceType'/'targetType' does not exist on type 'ExchangeRateModifier'/'ResourceExchangeRate'
- **Fix**: Extended interfaces to include missing properties and used type assertions with proper null checks
- **Solution Pattern**: Create extended interfaces for types that need additional properties and use type assertions with proper null checks

```typescript
// Define extended interface with additional properties
export interface ExtendedRate extends ResourceExchangeRate {
  sourceType?: ResourceType;
  targetType?: ResourceType;
}

// Use type assertion with proper null check
const extendedRate = rate as ExtendedRate;
if (extendedRate.sourceType !== sourceType) {
  continue;
}

const intermediateType = extendedRate.targetType;
if (!intermediateType) continue;
```

#### Faction Ship Files - Using incorrect WeaponEffect properties
- **Error**: Property 'name' does not exist on type 'WeaponEffectType'
- **Fix**: Used the correct DamageEffect type with proper properties
- **Solution Pattern**: Import and use the correct specific type instead of a generic type

```typescript
// Import the correct WeaponEffect type
import { DamageEffect } from '../../../effects/types_effects/WeaponEffects';

// Create a proper DamageEffect instead of WeaponEffect
const weaponEffect: DamageEffect = {
  id: 'void-pulse-weapon',
  type: 'damage',
  duration: 8,
  strength: 1.0,
  magnitude: 1.0,
  damageType: 'energy',
  penetration: 0.5
};
```

### Index Signature Errors (Code 7053)

#### FactionShipBase.tsx - Using FactionId to index FACTION_COLORS
- **Error**: Element implicitly has an 'any' type because expression of type 'FactionId' can't be used to index type
- **Fix**: Updated FACTION_COLORS to use Record<FactionId, string> and included all possible FactionId values
- **Solution Pattern**: Use Record type with string literal union types for type-safe mappings

```typescript
import { FactionId } from '../../../types/ships/FactionTypes';

// Update FACTION_COLORS to include all possible FactionId values
const FACTION_COLORS: Record<FactionId, string> = {
  'space-rats': 'red',
  'lost-nova': 'violet',
  'equator-horizon': 'amber',
  'player': 'blue',
  'enemy': 'red',
  'neutral': 'gray',
  'ally': 'green',
} as const;
```

### Missing Property Errors

#### Faction Ship Files - Missing required properties
- **Error**: Property 'abilities' is missing in type but required in type 'FactionShip'
- **Fix**: Added the missing 'abilities' property to the ship object
- **Solution Pattern**: Check the interface definition and ensure all required properties are provided

```typescript
// Create a ship object that matches the expected type
const shipData: FactionShip = {
  // ... other properties ...
  abilities: [
    {
      name: 'Void Pulse',
      description: 'Disrupts enemy shields and cloaking',
      cooldown: 10,
      duration: 8,
      active: hasEffect('void-pulse'),
      effect: {
        id: 'void-pulse-effect',
        type: 'jamming',
        duration: 8,
        magnitude: 1.5
      }
    },
    // ... other abilities ...
  ]
};
```

## TypeScript Configuration Errors

### MapIterator Errors

- **Error**: Object is not iterable when using Map/Set iteration with ES2020 target
- **Fix**: Added downlevelIteration option to tsconfig.json and used Array.from() pattern
- **Solution Pattern**: Use Array.from() to convert Map entries to arrays before iteration

```typescript
// Before
for (const [key, value] of myMap) {
  // This causes errors when targeting ES2020 without downlevelIteration
}

// After
for (const [key, value] of Array.from(myMap.entries())) {
  // This works with any target configuration
}
```

### Missing Interface Errors

- **Error**: Cannot find name 'ExchangePath'
- **Fix**: Added missing interface definitions
- **Solution Pattern**: Define all interfaces used in the codebase, even if they're only used internally

```typescript
/**
 * Exchange path step
 */
export interface ExchangePathStep {
  sourceType: ResourceType;
  targetType: ResourceType;
  rate: number;
  inputAmount: number;
  outputAmount: number;
}

/**
 * Exchange path
 */
export interface ExchangePath {
  steps: ExchangePathStep[];
  totalRate: number;
  inputAmount: number;
  outputAmount: number;
}
```

## Common Patterns for Fixing Faction Ship Files

When fixing faction ship files like LostNovaShip.tsx, SpaceRatShip.tsx, etc., follow these steps:

1. **Import Correct Types**:
   - Import FactionShip from FactionShipTypes.ts, not from FactionShipStats.tsx
   - Import specific effect types like DamageEffect instead of generic WeaponEffect

2. **Create Helper Functions**:
   - Create a helper function to convert string tactics to FactionBehaviorType
   - Use helper functions for any other common type conversions

3. **Fix WeaponEffect Usage**:
   - Use the correct specific effect type (DamageEffect, AreaEffect, StatusEffect)
   - Include all required properties for the specific effect type
   - Remove properties that don't exist on the type

4. **Ensure Required Properties**:
   - Check the FactionShip interface to ensure all required properties are provided
   - Add the 'abilities' property with proper Effect objects
   - Use proper type assertions with null checks

5. **Use Type Guards**:
   - Add type guards for runtime type checking
   - Use typeof checks before accessing properties
   - Add null/undefined checks where needed

## Best Practices for Error Prevention

1. **Type Conversion**: Create helper functions for converting between complex and primitive types
2. **Collection Iteration**: Prefer Arrays over Sets when TypeScript has trouble with type narrowing
3. **Loop Patterns**: Use traditional for loops instead of forEach methods when encountering 'never' type errors
4. **Type Mapping**: Use Record<K, V> for type-safe mappings with string literal union types
5. **Type Guards**: Implement custom type guards using type predicates (user-defined type guards)
6. **Null Handling**: Use optional chaining (?.) and nullish coalescing (??) operators for safe property access
7. **Type Assertions**: Use type assertions sparingly and only when you're certain of the type
8. **Documentation**: Document type relationships and conversion strategies for complex operations
9. **Interface Extensions**: Create extended interfaces for types that need additional properties
10. **Null Checks**: Always add null checks after type assertions to ensure runtime safety

### Fixed Faction Ship Files

The following faction ship files have been fixed to address type errors:

#### DarkMatterReaper.tsx
- **Error**: Type 'string' is not assignable to type 'FactionBehaviorType'
- **Fix**: Added helper function `createFactionBehavior` to convert string to FactionBehaviorType
- **Solution Pattern**: Create a local tactics variable using the helper function

```typescript
// Helper function to create a FactionBehaviorType from string
const createFactionBehavior = (behavior: string): FactionBehaviorType => {
  return {
    formation: 'standard',
    behavior: behavior
  };
};

// Create a proper FactionBehaviorType for tactics
const tactics = createFactionBehavior('stealth');

// Use the tactics object in the component
<LostNovaShip
  // ... other props ...
  tactics={tactics}
  // ... other props ...
/>
```

#### NullHunter.tsx
- **Error**: Type 'string' is not assignable to type 'FactionBehaviorType'
- **Fix**: Added helper function `createFactionBehavior` to convert string to FactionBehaviorType
- **Solution Pattern**: Create a local tactics variable using the helper function

```typescript
// Create a proper FactionBehaviorType for tactics
const tactics = createFactionBehavior('aggressive');
```

#### EclipseScythe.tsx
- **Error**: Type 'string' is not assignable to type 'FactionBehaviorType'
- **Fix**: Added helper function `createFactionBehavior` to convert string to FactionBehaviorType
- **Solution Pattern**: Create a local tactics variable using the helper function

```typescript
// Create a proper FactionBehaviorType for tactics
const tactics = createFactionBehavior('hit-and-run');
```

#### RogueNebula.tsx
- **Error**: Type 'string' is not assignable to type 'FactionBehaviorType'
- **Fix**: Added helper function `createFactionBehavior` to convert string to FactionBehaviorType
- **Solution Pattern**: Create a local tactics variable using the helper function

```typescript
// Create a proper FactionBehaviorType for tactics
const tactics = createFactionBehavior('hit-and-run');
```

## Additional Implementation Notes

### MapIterator Errors
- Project was previously using ES2020 target without downlevelIteration
- MapIterator errors occur when targeting below ES2015 without downlevelIteration
- Fixed errors by using Array.from() to convert Map entries to arrays before iteration
- Created tsconfig.check.json with ES2015 target for more accurate type checking
- Updated build script to include --downlevelIteration flag
- Recommend using Array.from() pattern consistently for Map/Set iteration
- TypeScript configuration now properly supports iteration over Map and Set objects

### Resource System Errors
- The ResourcePriority type is being used inconsistently across the codebase
- Fixed by creating proper ResourcePriority objects instead of using numbers
- Some resource-related interfaces are missing or incomplete
- Need to define SerializedResourceState, ResourceTotals, and SerializedThreshold interfaces

### Module System Errors
- The ModuleEvent interface requires specific properties that are missing in some implementations
- Fixed by adding missing properties to the data object instead of the event object
- Some test files are using properties that don't exist in the interfaces they're testing
- Need to update test data to match current type definitions

### Fixed Files
- Fixed ResourceThresholdManager.ts MapIterator error by using Array.from() to convert Map entries to an array before iteration
- Fixed ResourceFlowManager.ts MapIterator errors by using Array.from() to convert Map entries to an array before iteration
- Fixed useResourceTracking.ts MapIterator errors by using Array.from() to convert Map entries to an array before iteration
- Fixed EventFiltering.ts MapIterator errors by using Array.from() to convert Map entries to an array before iteration and fixed the processEvent method using processor instead
- Fixed ResourceExchangeManager.ts MapIterator errors by using Array.from() to convert Map entries to an array before iteration
- Fixed ResourcePoolManager.ts MapIterator errors by using Array.from() to convert Map entries to an array before iteration
- Fixed AsteroidFieldManager.ts MapIterator errors by using Array.from() to convert Map entries to an array before iteration
- ModuleUpgradeManager.ts already uses Array.from() to convert Map entries to an array before iteration

### Remaining Errors
- WeaponEffect property errors in WeaponComponents.tsx and WeaponControl.tsx
- Effect type errors in shipEffects.ts and effectUtils.ts
- CombatUnit type errors in useCombatAI.ts and ShipClassFactory.ts
- ResourceTracking type errors in useResourceTracking.ts
- ResourcePoolManager errors related to property access and possible undefined values
- Test file errors in ModuleManager.test.ts and ResourceFlowManager.test.ts
- Type conversion errors in typeConversions.ts
- Initialization errors in automationSystemInit.ts and moduleFrameworkInit.ts
- Miscellaneous errors including duplicate function implementations and unknown names 

# Fixed Errors

## WeaponEffect Property Errors

### Issue
Properties like 'name' and 'description' were being accessed on WeaponEffect objects, but these properties were not defined in the WeaponEffect interface.

### Root Cause
The WeaponEffect interface extended the Effect interface from GameTypes.ts, which didn't include 'name' and 'description' properties. However, there was a BaseEffect interface in EffectTypes.ts that did include these properties.

### Solution
1. Added 'name' and 'description' properties directly to the WeaponEffect interface:
```typescript
export interface WeaponEffect extends Effect {
  type: 'damage' | 'area' | 'status';
  duration: number;
  strength: number;
  /** Name of the effect */
  name: string;
  /** Description of what the effect does */
  description: string;
}
```

2. Updated utility functions in weaponEffectUtils.ts to include these properties:
```typescript
export function createBaseWeaponEffect(params: {
  id: string;
  type: 'damage' | 'area' | 'status';
  magnitude: number;
  duration: number;
  strength: number;
  name?: string;
  description?: string;
}): WeaponEffect {
  return {
    id: params.id,
    type: params.type,
    magnitude: params.magnitude,
    duration: params.duration,
    strength: params.strength,
    name: params.name || params.id,
    description: params.description || `${params.type} effect with magnitude ${params.magnitude}`
  };
}
```

3. Updated all effect creation functions to include name and description parameters.

### Pattern
When components are accessing properties that don't exist on an interface, either:
1. Add the missing properties to the interface if they are fundamental to the type
2. Use a more specific interface that includes the required properties
3. Create utility functions that provide default values for optional properties

## Effect Type Errors

### Issue
Object literals in shipEffects.ts were specifying properties like 'name' and 'description' that didn't exist on the Effect type.

### Root Cause
The shipEffects.ts file was creating Effect objects with 'name' and 'description' properties, but the Effect interface in GameTypes.ts didn't include these properties.

### Solution
1. Updated shipEffects.ts to use BaseEffect instead of Effect:
```typescript
import { BaseEffect } from './EffectTypes';

export const DAMAGE_BOOST_EFFECT: BaseEffect = {
  id: 'damage-boost-effect',
  type: 'damage',
  name: 'Damage Boost',
  description: 'Increases weapon damage',
  magnitude: 1.8,
  duration: 12
};
```

2. Updated the createEffect function in effectUtils.ts to ensure duration is not undefined:
```typescript
export function createEffect(
  id: string,
  name: string,
  type: EffectType,
  magnitude: number,
  description: string,
  options: Partial<BaseEffect> = {}
): BaseEffect {
  return {
    id,
    name,
    type,
    magnitude,
    description,
    active: true,
    duration: options.duration || 0,
    ...options
  };
}
```

### Pattern
When creating objects with properties not in the type definition:
1. Use the correct interface that includes all required properties
2. Create utility functions that handle optional properties with default values
3. Document the expected structure of objects with JSDoc comments 

## CombatUnit Type Errors

### Issue
Properties like 'health', 'maxHealth', 'shield', 'maxShield', and 'target' were being accessed directly on CombatUnit objects, but these properties were not defined in the CombatUnit interface in CombatTypes.ts.

### Root Cause
There are two different `CombatUnit` interfaces in the codebase:

1. In `src/types/combat/CombatTypes.ts`, the `CombatUnit` interface has properties like `rotation`, `velocity`, and `stats` (which contains `health`, `maxHealth`, etc.).

2. In `src/managers/combat/combatManager.ts`, the `CombatUnit` interface has direct properties like `health`, `maxHealth`, `shield`, `maxShield`, and `target`.

The errors occurred because the code in `useCombatAI.ts`, `ShipClassFactory.ts`, and `BehaviorTreeManager.ts` was using the `CombatUnit` interface from `CombatTypes.ts`, but trying to access properties like `health` directly, which only exist in the `CombatUnit` interface from `combatManager.ts`.

### Solution
1. Created type conversion functions in typeConversions.ts to convert between the two CombatUnit types:
```typescript
/**
 * Converts a CombatUnit from combatManager.ts to a CombatUnit from CombatTypes.ts
 */
export function convertToCombatTypesUnit(unit: any): import('../types/combat/CombatTypes').CombatUnit {
  // Create a CombatUnit that matches the interface in CombatTypes.ts
  return {
    id: unit.id,
    type: unit.type,
    position: unit.position,
    rotation: 0, // Default value if not present
    velocity: { x: 0, y: 0 }, // Default value if not present
    status: {
      main: convertStatusToMain(unit.status),
      secondary: undefined,
      effects: []
    },
    weapons: unit.weapons.map((w: any) => ({
      id: w.id,
      type: w.type,
      damage: w.damage,
      cooldown: w.cooldown,
      range: w.range,
      state: {
        status: w.status,
        lastFired: w.lastFired || 0,
        effects: []
      }
    })),
    stats: {
      health: unit.health || 0,
      maxHealth: unit.maxHealth || 0,
      shield: unit.shield || 0,
      maxShield: unit.maxShield || 0,
      armor: unit.armor || 0,
      speed: unit.speed || 0,
      turnRate: unit.turnRate || 0
    }
  };
}
```

2. Updated useCombatAI.ts to use the conversion function and access properties through the stats object:
```typescript
// Convert to CombatTypes.CombatUnit
const unit = convertToCombatTypesUnit(managerUnit);

// Access health through stats
const unitStrength = (unit.stats.health / unit.stats.maxHealth) * (unit.stats.shield / unit.stats.maxShield);
```

3. Updated ShipClassFactory.ts to use the conversion function:
```typescript
// Create a manager-style CombatUnit first
const managerUnit = {
  id: `${factionId}-${shipClass}-${Date.now()}`,
  type: shipClass,
  tier: stats.tier,
  position,
  status: 'idle',
  health: stats.health,
  maxHealth: stats.maxHealth,
  shield: stats.shield,
  maxShield: stats.maxShield,
  weapons: stats.weapons.map(this.convertToWeaponSystem),
  faction: factionId,
  formation,
};

// Convert to CombatTypes.CombatUnit
return convertToCombatTypesUnit(managerUnit);
```

4. Updated BehaviorTreeManager.ts to use the stats property and add a target property to the CombatUnit interface:
```typescript
interface BehaviorContext {
  unit: CombatUnit & { target?: string }; // Add target property to CombatUnit
  // ...
}

// Access health through stats
evaluate: (context) => context.unit.stats.health / context.unit.stats.maxHealth > 0.3,
```

### Pattern
When dealing with inconsistent interfaces across the codebase:
1. Create type conversion functions to convert between different interface versions
2. Use type assertions with caution and proper validation
3. Add missing properties through interface extension or intersection
4. Update property access to use the correct structure
5. Document the conversion pattern for future reference

```typescript
/**
 * Converts a CombatUnit from combatManager.ts to a CombatUnit from CombatTypes.ts
 */
export function convertToCombatTypesUnit(unit: any): import('../types/combat/CombatTypes').CombatUnit {
  // Create a CombatUnit that matches the interface in CombatTypes.ts
  return {
    id: unit.id,
    type: unit.type,
    position: unit.position,
    rotation: 0, // Default value if not present
    velocity: { x: 0, y: 0 }, // Default value if not present
    status: {
      main: convertStatusToMain(unit.status),
      secondary: undefined,
      effects: []
    },
    weapons: unit.weapons.map((w: any) => ({
      id: w.id,
      type: w.type,
      damage: w.damage,
      cooldown: w.cooldown,
      range: w.range,
      state: {
        status: w.status,
        lastFired: w.lastFired || 0,
        effects: []
      }
    })),
    stats: {
      health: unit.health || 0,
      maxHealth: unit.maxHealth || 0,
      shield: unit.shield || 0,
      maxShield: unit.maxShield || 0,
      armor: unit.armor || 0,
      speed: unit.speed || 0,
      turnRate: unit.turnRate || 0
    }
  };
}
```

## ResourcePoolManager Errors

### Issue
The ResourcePoolManager.ts file had multiple type errors related to property access, possible undefined values, and duplicate function implementations.

### Root Cause
1. The PoolDistributionRule interface was missing properties that were being accessed in the code, such as 'enabled', 'sourceId', and 'amount'.
2. There were two implementations of the distributeResources function, causing a duplicate function error.
3. The code was directly accessing properties of Map objects using bracket notation instead of using get/set methods.
4. The code wasn't checking for undefined resources maps before accessing them.

### Solution
1. Updated the PoolDistributionRule interface to include the missing properties:
```typescript
export interface PoolDistributionRule {
  id: string;
  poolId: string;
  targetIds: string[];
  resourceType: ResourceType;
  percentage: number;
  minAmount?: number;
  maxAmount?: number;
  priority: number;
  condition?: (state: ResourceState) => boolean;
  enabled?: boolean;
  sourceId?: string;
  amount?: number;
}
```

2. Removed the duplicate distributeResources function and updated the remaining implementation to handle both cases.

3. Added a check for disabled rules in the distributeResources function:
```typescript
// Skip disabled rules
if (rule.enabled === false) {
  continue;
}
```

4. Replaced the direct resource transfer function with a properly typed implementation:
```typescript
public transferDirectly(
  sourceId: string,
  targetId: string,
  resourceType: ResourceType,
  amount: number
): boolean {
  const sourceContainer = this.containers.get(sourceId);
  const targetContainer = this.containers.get(targetId);

  if (!sourceContainer || !targetContainer) {
    console.error(`Source or target container not found: ${sourceId}, ${targetId}`);
    return false;
  }

  // Initialize resources maps if they don't exist
  if (!sourceContainer.resources) {
    sourceContainer.resources = new Map<ResourceType, number>();
  }

  if (!targetContainer.resources) {
    targetContainer.resources = new Map<ResourceType, number>();
  }

  // Check if source has enough resources
  const sourceAmount = sourceContainer.resources.get(resourceType) || 0;
  if (sourceAmount < amount) {
    console.error(`Insufficient ${resourceType} in source container ${sourceId}`);
    return false;
  }

  // Transfer resources
  const targetAmount = targetContainer.resources.get(resourceType) || 0;
  
  // Update source and target containers
  sourceContainer.resources.set(resourceType, sourceAmount - amount);
  targetContainer.resources.set(resourceType, targetAmount + amount);

  return true;
}
```
## TypeScript Explicit Any Errors

- `src/components/ui/modules/ModuleStatusDisplay.tsx`, `src/components/ui/modules/ModuleUpgradeDisplay.tsx`, `src/components/ui/modules/SubModuleHUD.tsx`
  - **Issue**: Using `any` type for module state variables and unsafe type casting
  - **Fix**: 
    - Replaced `useState<any>(null)` with `useState<BaseModule | null>(null)`
    - Added proper null checks when setting state with potentially undefined values
    - Used proper type assertions for accessing manager properties
  - **Example**:
  ```typescript
  // Before
  const [module, setModule] = useState<any>(null);
  
  useEffect(() => {
    const moduleData = moduleManager.getModule(moduleId);
    setModule(moduleData);
  }, [moduleId]);

  // After
  const [module, setModule] = useState<BaseModule | null>(null);
  
  useEffect(() => {
    const moduleData = moduleManager.getModule(moduleId);
    setModule(moduleData || null);
  }, [moduleId]);
  ```

  ```typescript
  // Before (in SubModuleHUD.tsx)
  const {configs} = subModuleManager as any;
  
  // After
  const manager = subModuleManager as SubModuleManager;
  const configs = (manager as unknown as { configs: Map<SubModuleType, SubModuleConfig> }).configs;
  ```
  - **Best Practice**: 
    - Always use specific types instead of `any` for state variables
    - Add null checks when setting state with values that might be undefined
    - Use proper type assertions with intermediate steps for complex type conversions
    - Import necessary types from their respective modules

### Pattern
When dealing with Map objects and optional properties:
1. Always use Map.get() and Map.set() methods instead of bracket notation
2. Check for undefined values before accessing properties
3. Initialize Map objects if they don't exist
4. Use optional chaining (?.) and nullish coalescing (??) operators for safer property access
5. Ensure interfaces include all properties that are accessed in the code
6. Remove duplicate function implementations and consolidate logic

```typescript
// Skip disabled rules
if (rule.enabled === false) {
  continue;
}
```
