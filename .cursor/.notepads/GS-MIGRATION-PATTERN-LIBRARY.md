# GALACTIC SPAWL - Migration Pattern Library

## Overview

This document provides guidance on migrating from deprecated patterns to current best practices in the Galactic Sprawl codebase. Each section shows both the deprecated approach and the current recommended implementation.

## String Literals to Enum Types

Migrating from string literals to enum types for better type safety.

### Resource Types Migration

#### Deprecated Approach: String Literals

```typescript
// Deprecated: Using string literals for resource types
const resourceType = 'energy';

function processResource(type: string, amount: number) {
  if (type === 'energy') {
    processEnergy(amount);
  } else if (type === 'minerals') {
    processMinerals(amount);
  } else {
    processGenericResource(type, amount);
  }
}

// Deprecated: String arrays for resource collections
const resources = ['energy', 'minerals', 'population'];

// Deprecated: String keys in objects
const resourceAmounts = {
  'energy': 100,
  'minerals': 50,
  'population': 200
};
```

#### Current Approach: Enum Types

```typescript
// Current: Using ResourceType enum
import { ResourceType } from '../types/resources/ResourceTypes';

const resourceType = ResourceType.ENERGY;

function processResource(type: ResourceType, amount: number) {
  switch (type) {
    case ResourceType.ENERGY:
      processEnergy(amount);
      break;
    case ResourceType.MINERALS:
      processMinerals(amount);
      break;
    default:
      processGenericResource(type, amount);
      break;
  }
}

// Current: Enum arrays for resource collections
const resources = [
  ResourceType.ENERGY,
  ResourceType.MINERALS,
  ResourceType.POPULATION
];

// Current: Enum keys in objects using computed property syntax
const resourceAmounts = {
  [ResourceType.ENERGY]: 100,
  [ResourceType.MINERALS]: 50,
  [ResourceType.POPULATION]: 200
};
```

### Event Types Migration

#### Deprecated Approach: String Literals

```typescript
// Deprecated: Using string literals for event types
moduleEventBus.subscribe('RESOURCE_PRODUCED', (event) => {
  console.log(`Resource produced: ${event.data.type}`);
});

// Deprecated: Emitting events with string literals
moduleEventBus.emit({
  type: 'RESOURCE_PRODUCED',
  moduleId: 'module-1',
  moduleType: 'resource-generator',
  timestamp: Date.now(),
  data: {
    type: 'energy',
    amount: 100
  }
});

// Deprecated: String literals in switch statements
function handleEvent(event) {
  switch (event.type) {
    case 'RESOURCE_PRODUCED':
      handleResourceProduced(event);
      break;
    case 'RESOURCE_CONSUMED':
      handleResourceConsumed(event);
      break;
    default:
      console.warn(`Unknown event type: ${event.type}`);
      break;
  }
}
```

#### Current Approach: Enum Types

```typescript
// Current: Using EventType enum
import { EventType } from '../types/events/EventTypes';
import { ModuleType } from '../types/modules/ModuleTypes';
import { ResourceType } from '../types/resources/ResourceTypes';

moduleEventBus.subscribe(EventType.RESOURCE_PRODUCED, (event) => {
  console.log(`Resource produced: ${event.data.resourceType}`);
});

// Current: Emitting events with enum types
moduleEventBus.emit({
  type: EventType.RESOURCE_PRODUCED,
  moduleId: 'module-1',
  moduleType: ModuleType.RESOURCE_GENERATOR,
  timestamp: Date.now(),
  data: {
    resourceType: ResourceType.ENERGY,
    amount: 100
  }
});

// Current: Enum types in switch statements
function handleEvent(event: BaseEvent) {
  switch (event.type) {
    case EventType.RESOURCE_PRODUCED:
      handleResourceProduced(event);
      break;
    case EventType.RESOURCE_CONSUMED:
      handleResourceConsumed(event);
      break;
    default:
      console.warn(`Unknown event type: ${event.type}`);
      break;
  }
}
```

## Type Assertion to Type Guards

Migrating from unsafe type assertions to type guards for runtime validation.

### Deprecated Approach: Type Assertions

```typescript
// Deprecated: Unsafe type assertions
function processEvent(event: unknown) {
  // Unsafe assertion without validation
  const typedEvent = event as BaseEvent;
  
  // Potential runtime error if event doesn't have these properties
  console.log(`Event type: ${typedEvent.type}`);
  console.log(`Module ID: ${typedEvent.moduleId}`);
  
  // Potential runtime error if data doesn't have these properties
  const resourceData = typedEvent.data as ResourceEventData;
  updateResource(resourceData.resourceType, resourceData.amount);
}

// Deprecated: Direct property access
function getResourceAmount(data: unknown): number {
  // Potential runtime error if data doesn't have an amount property
  return (data as any).amount || 0;
}
```

### Current Approach: Type Guards

```typescript
// Current: Type guards for runtime validation
function processEvent(event: unknown): void {
  // Validate basic event structure
  if (!isValidEvent(event)) {
    console.error('Invalid event structure:', event);
    return;
  }
  
  // Now TypeScript knows event is a BaseEvent
  console.log(`Event type: ${event.type}`);
  console.log(`Module ID: ${event.moduleId}`);
  
  // Validate resource event data
  if (isResourceEvent(event)) {
    // Now TypeScript knows event.data has resourceType and amount
    updateResource(event.data.resourceType, event.data.amount);
  }
}

// Type guard implementation for base events
function isValidEvent(value: unknown): value is BaseEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'moduleId' in value &&
    'timestamp' in value
  );
}

// Type guard implementation for resource events
function isResourceEvent(
  event: BaseEvent
): event is BaseEvent & { data: ResourceEventData } {
  return (
    event?.data !== undefined &&
    typeof event?.data === 'object' &&
    event?.data !== null &&
    'resourceType' in event?.data &&
    'amount' in event?.data &&
    typeof event?.data?.amount === 'number'
  );
}

// Current: Safe property access
function getResourceAmount(data: unknown): number {
  //
```

### Safe Property Access

```typescript
// Current: Safe property access
function getResourceAmount(data: unknown): number {
  // First validate the data structure
  if (!data || typeof data !== 'object') {
    return 0;
  }
  
  // Use safe extraction utilities
  return safelyExtractNumber(data as Record<string, unknown>, 'amount', 0);
}

// Safe extraction utility
function safelyExtractNumber(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  defaultValue = 0
): number {
  if (!obj) return defaultValue;
  const value = obj[key];
  return typeof value === 'number' ? value : defaultValue;
}
```

## Direct Manager Instantiation to Registry Access

Migrating from direct manager instantiation to using the Manager Registry.

### Deprecated Approach: Direct Instantiation

```typescript
// Deprecated: Direct import and instantiation of manager classes
import { ResourceManager } from '../managers/resource/ResourceManager';
import { CombatManager } from '../managers/combat/CombatManager';

function processGame() {
  // Direct instantiation creates multiple instances
  const resourceManager = new ResourceManager();
  const combatManager = new CombatManager();
  
  // Use managers
  resourceManager.addResource('energy', 100);
  combatManager.initiateCombat('player', 'enemy');
}

// Deprecated: Class with direct manager dependencies
class GameProcessor {
  private resourceManager: ResourceManager;
  private combatManager: CombatManager;
  
  constructor() {
    // Direct instantiation in constructor
    this.resourceManager = new ResourceManager();
    this.combatManager = new CombatManager();
  }
  
  // Methods that use the managers...
}
```

### Current Approach: Registry Access

```typescript
// Current: Import manager accessors from registry
import { 
  getResourceManager,
  getCombatManager
} from '../managers/ManagerRegistry';

function processGame() {
  // Get singleton instances through registry
  const resourceManager = getResourceManager();
  const combatManager = getCombatManager();
  
  // Use managers
  resourceManager.addResource(ResourceType.ENERGY, 100);
  combatManager.initiateCombat('player', 'enemy');
}

// Current: Class with manager registry dependencies
class GameProcessor {
  // Methods that access managers when needed
  
  public processResources(): void {
    const resourceManager = getResourceManager();
    // Use resourceManager methods
  }
  
  public processCombat(): void {
    const combatManager = getCombatManager();
    // Use combatManager methods
  }
}
```

## Untyped Events to Typed Events

Migrating from untyped event handling to type-safe event handling.

### Deprecated Approach: Untyped Events

```typescript
// Deprecated: Untyped event bus
class EventBus {
  private handlers: Map<string, Array<(event: any) => void>> = new Map();
  
  public subscribe(type: string, handler: (event: any) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    
    this.handlers.get(type)?.push(handler);
    
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  public emit(event: any): void {
    const handlers = this.handlers.get(event.type) || [];
    
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    });
  }
}

// Deprecated: Untyped event handling
const eventBus = new EventBus();

eventBus.subscribe('resourceUpdated', (event) => {
  // Unsafe property access
  console.log(`Resource type: ${event.data.type}`);
  console.log(`New amount: ${event.data.amount}`);
});

eventBus.emit({
  type: 'resourceUpdated',
  data: {
    type: 'energy',
    amount: 100
  }
});
```

### Current Approach: Typed Events

```typescript
// Current: Typed event bus
class EventBus<T extends BaseEvent> {
  private handlers: Map<string, Array<(event: T) => void>> = new Map();
  
  public subscribe(type: EventType | string, handler: (event: T) => void): () => void {
    const typeString = type.toString();
    
    if (!this.handlers.has(typeString)) {
      this.handlers.set(typeString, []);
    }
    
    this.handlers.get(typeString)?.push(handler);
    
    return () => {
      const handlers = this.handlers.get(typeString);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  public emit(event: T): void {
    const typeString = event.type.toString();
    const handlers = this.handlers.get(typeString) || [];
    
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${typeString}:`, error);
      }
    });
  }
}

// Current: Type-safe event handling
const moduleEventBus = new EventBus<ModuleEvent>();

moduleEventBus.subscribe(EventType.RESOURCE_UPDATED, (event) => {
  // Validate event data with type guard
  if (isResourceUpdateEvent(event)) {
    // Type-safe property access
    console.log(`Resource type: ${event.data.resourceType}`);
    console.log(`New amount: ${event.data.newAmount}`);
  }
});

moduleEventBus.emit({
  type: EventType.RESOURCE_UPDATED,
  moduleId: 'resource-manager',
  moduleType: ModuleType.MANAGER,
  timestamp: Date.now(),
  data: {
    resourceType: ResourceType.ENERGY,
    oldAmount: 0,
    newAmount: 100
  }
});
```

## Direct Property Access to Safe Extraction

Migrating from direct property access to safe extraction utilities.

### Deprecated Approach: Direct Property Access

```typescript
// Deprecated: Direct property access
function displayResourceInfo(data: any): void {
  // Unsafe direct property access
  const type = data.type;
  const amount = data.amount;
  const efficiency = data.efficiency || 100;
  
  // Display potentially undefined values
  console.log(`Resource: ${type}, Amount: ${amount}, Efficiency: ${efficiency}%`);
}

// Deprecated: Nested property access
function processShipData(ship: any): void {
  // Unsafe nested property access
  const weaponDamage = ship.weapons.primary.damage;
  const shieldCapacity = ship.defenses.shield.capacity;
  
  // Use potentially undefined values
  console.log(`Weapon damage: ${weaponDamage}, Shield capacity: ${shieldCapacity}`);
}
```

### Current Approach: Safe Extraction

```typescript
// Current: Safe extraction utilities
function displayResourceInfo(data: unknown): void {
  // Safe property extraction with defaults
  const type = safelyExtractString(data as Record<string, unknown>, 'type', 'unknown');
  const amount = safelyExtractNumber(data as Record<string, unknown>, 'amount', 0);
  const efficiency = safelyExtractNumber(data as Record<string, unknown>, 'efficiency', 100);
  
  // Display with safe values
  console.log(`Resource: ${type}, Amount: ${amount}, Efficiency: ${efficiency}%`);
}

// Current: Safe nested property access
function processShipData(ship: unknown): void {
  if (!isObject(ship)) {
    console.warn('Invalid ship data: not an object');
    return;
  }
  
  // Safe nested property access with path notation
  const weaponDamage = safelyExtractPath(ship, 'weapons.primary.damage', 0);
  const shieldCapacity = safelyExtractPath(ship, 'defenses.shield.capacity', 0);
  
  // Use safe values with defaults
  console.log(`Weapon damage: ${weaponDamage}, Shield capacity: ${shieldCapacity}`);
}

// Safe extraction for nested paths
function safelyExtractPath<T>(
  obj: Record<string, unknown> | null | undefined,
  path: string,
  defaultValue: T
): T {
  if (!obj) return defaultValue;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current !== null && current !== undefined ? (current as T) : defaultValue;
}
```

## Best Practices for Migration

1. **Gradual Migration**: Migrate one system at a time to avoid breaking changes
2. **Type Guards First**: Implement type guards before changing implementation details
3. **Use Deprecated and Warning Comments**: Mark deprecated code to help identify future targets
4. **Update Documentation**: Update documentation to reflect new patterns
5. **Add Migration Guides**: Provide examples for common migration scenarios
6. **Use IDEs and Tools**: Use TypeScript and ESLint to identify deprecated patterns
7. **Integration Tests**: Ensure that migrations don't break existing functionality
8. **Code Reviews**: Have team members review migrations for completeness
9. **Performance Testing**: Verify that migrations don't introduce performance regressions
10. **Monitor Error Rates**: Watch for increased error rates after migrations
