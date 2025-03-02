---
RESOURCE MANAGEMENT REFERENCES
---

# Resource Management System Implementation

## Core Components

- Resource Manager: src/managers/game/ResourceManager.ts
  Purpose: Central manager for all resource operations
  Dependencies: ResourceTypes, ResourceThresholdManager, ResourceFlowManager

- Resource Threshold Manager: src/managers/resource/ResourceThresholdManager.ts
  Purpose: Monitors resource thresholds and triggers actions
  Dependencies: ResourceTypes, ModuleEvents
  Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors; includes severity information in the data object of ModuleEvents

- Resource Flow Manager: src/managers/resource/ResourceFlowManager.ts
  Purpose: Optimizes resource flows between systems
  Dependencies: ResourceTypes, ResourceValidation
  Notes: Uses ResourcePriority interface for priority management, requires complete objects rather than primitive values; uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors

- Resource Storage Manager: src/managers/resource/ResourceStorageManager.ts
  Purpose: Manages resource storage containers
  Dependencies: ResourceTypes, ResourceValidation
  Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors

- Resource Pool Manager: src/managers/resource/ResourcePoolManager.ts
  Purpose: Manages resource pools, distribution, and allocation
  Dependencies: ResourceTypes, ResourcePoolTypes, ResourceValidation
  Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors; uses Map.get() and Map.set() methods for type-safe access

## Resource Type Definitions

- Resource Types: src/types/resources/ResourceTypes.ts
  Purpose: Core resource type definitions
  Dependencies: GameTypes
  Notes: Includes ResourceType, ResourceState, ResourcePool, ResourceContainer interfaces

- Resource Serialization Types: src/types/resources/ResourceSerializationTypes.ts
  Purpose: Serialization interfaces for resource data
  Dependencies: ResourceTypes
  Notes: Includes SerializedResource, SerializedResourceState, ResourceTotals interfaces for localStorage persistence

- Resource Pool Types: src/types/resources/ResourcePoolTypes.ts
  Purpose: Type definitions for resource pool management
  Dependencies: ResourceTypes
  Notes: Includes PoolDistributionRule, PoolAllocationResult, PoolAllocationOptions interfaces for pool management

## Resource Utilities

- Resource Validation: src/utils/resources/resourceValidation.ts
  Purpose: Validates resource objects and operations
  Dependencies: ResourceTypes
  Notes: Includes type guards for resource objects

## Resource Type Relationships

```
ResourceTypes.ResourceType
├── 'minerals'
├── 'energy'
├── 'population'
├── 'research'
├── 'plasma'
├── 'gas'
└── 'exotic'

ResourceTypes.ResourceState
├── current: number
├── max: number
├── min: number
├── production: number
└── consumption: number

ResourceSerializationTypes.SerializedResourceState
├── resources: Record<ResourceType, SerializedResource>
├── thresholds: Record<string, SerializedThreshold[]>
├── alerts: ResourceAlert[]
└── timestamp?: number

ResourcePoolTypes.PoolDistributionRule
├── id: string
├── poolId: string
├── targetIds: string[]
├── resourceType: ResourceType
├── percentage: number
├── minAmount?: number
├── maxAmount?: number
├── priority: number
├── condition?: (state: ResourceState) => boolean
├── enabled?: boolean
├── sourceId?: string
└── amount?: number
```

## Resource Tracking Flow

1. Resource Production

   - Module produces resources
   - ResourceManager.addResource() called
   - ResourceThresholdManager checks thresholds
   - ResourceFlowManager optimizes distribution
   - ResourceStorageManager updates storage

2. Resource Consumption

   - Module requests resources
   - ResourceManager.consumeResource() called
   - ResourceThresholdManager checks thresholds
   - ResourceFlowManager optimizes distribution
   - ResourceStorageManager updates storage

3. Resource Transfer

   - Module transfers resources
   - ResourceManager.transferResource() called
   - ResourceThresholdManager checks thresholds
   - ResourceFlowManager optimizes distribution
   - ResourceStorageManager updates storage

4. Resource Pool Management
   - ResourcePoolManager.distributePool() called
   - ResourcePoolManager applies distribution rules
   - ResourceManager updates resource states
   - ResourceThresholdManager checks thresholds
   - ResourceStorageManager updates storage

## Resource Management Events

- ResourceThresholdEvent: Triggered when a resource crosses a threshold
  Payload: { resourceType, threshold, value, direction, severity }

- ResourceUpdateEvent: Triggered when a resource state is updated
  Payload: { resourceType, oldState, newState, source }

- ResourcePoolEvent: Triggered when a resource pool is updated
  Payload: { poolId, resourceType, oldAmount, newAmount, source }

- ResourceAlertEvent: Triggered when a resource alert is generated
  Payload: { resourceType, alertType, message, severity, timestamp }

## Resource Management Hooks

- useResourceState: src/hooks/resources/useResourceState.ts
  Purpose: React hook for accessing resource state
  Dependencies: ResourceTypes, ResourceManager

- useResourceThresholds: src/hooks/resources/useResourceThresholds.ts
  Purpose: React hook for managing resource thresholds
  Dependencies: ResourceTypes, ResourceThresholdManager

- useResourceFlow: src/hooks/resources/useResourceFlow.ts
  Purpose: React hook for managing resource flows
  Dependencies: ResourceTypes, ResourceFlowManager

- useResourcePool: src/hooks/resources/useResourcePool.ts
  Purpose: React hook for managing resource pools
  Dependencies: ResourceTypes, ResourcePoolManager

## Resource Management UI Components

- ResourceDisplay: src/components/ui/resources/ResourceDisplay.tsx
  Purpose: Displays resource information
  Dependencies: useResourceState

- ResourceThresholdEditor: src/components/ui/resources/ResourceThresholdEditor.tsx
  Purpose: UI for editing resource thresholds
  Dependencies: useResourceThresholds

- ResourceFlowDiagram: src/components/ui/resources/ResourceFlowDiagram.tsx
  Purpose: Visualizes resource flows
  Dependencies: useResourceFlow

- ResourcePoolManager: src/components/ui/resources/ResourcePoolManager.tsx
  Purpose: UI for managing resource pools
  Dependencies: useResourcePool

# Resource Management System Implementation

## Core Components

- Resource Manager: src/managers/game/ResourceManager.ts
  Purpose: Central manager for all resource operations
  Dependencies: ResourceTypes, ResourceThresholdManager, ResourceFlowManager

- Resource Threshold Manager: src/managers/resource/ResourceThresholdManager.ts
  Purpose: Monitors resource thresholds and triggers actions
  Dependencies: ResourceTypes, ModuleEvents
  Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors; includes severity information in the data object of ModuleEvents

- Resource Flow Manager: src/managers/resource/ResourceFlowManager.ts
  Purpose: Optimizes resource flows between systems
  Dependencies: ResourceTypes, ResourceValidation
  Notes: Uses ResourcePriority interface for priority management, requires complete objects rather than primitive values; uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors

- Resource Storage Manager: src/managers/resource/ResourceStorageManager.ts
  Purpose: Manages resource storage containers
  Dependencies: ResourceTypes, ResourceValidation
  Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors

- Resource Pool Manager: src/managers/resource/ResourcePoolManager.ts
  Purpose: Manages resource pools, distribution, and allocation
  Dependencies: ResourceTypes, ResourcePoolTypes, ResourceValidation
  Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors; uses Map.get() and Map.set() methods for type-safe access

## Resource Type Definitions

- Resource Types: src/types/resources/ResourceTypes.ts
  Purpose: Core resource type definitions
  Dependencies: GameTypes
  Notes: Includes ResourceType, ResourceState, ResourcePool, ResourceContainer interfaces

- Resource Serialization Types: src/types/resources/ResourceSerializationTypes.ts
  Purpose: Serialization interfaces for resource data
  Dependencies: ResourceTypes
  Notes: Includes SerializedResource, SerializedResourceState, ResourceTotals interfaces for localStorage persistence

- Resource Pool Types: src/types/resources/ResourcePoolTypes.ts
  Purpose: Type definitions for resource pool management
  Dependencies: ResourceTypes
  Notes: Includes PoolDistributionRule, PoolAllocationResult, PoolAllocationOptions interfaces for pool management

CombatManager.CombatUnit
├── id: string
├── faction: string
├── type: string
├── tier: number
├── position: { x, y }
├── status: string
├── health: number
├── maxHealth: number
├── shield: number
├── maxShield: number
├── target?: string
└── weapons: Array<{
id: string,
type: string,
range: number,
damage: number,
cooldown: number,
status: string
}>

CombatTypes.CombatUnit
├── id: string
├── type: string
├── position: { x, y }
├── rotation: number
├── velocity: { x, y }
├── status: CombatUnitStatus
├── weapons: WeaponSystem[]
└── stats: {
health: number,
maxHealth: number,
shield: number,
maxShield: number,
armor: number,
speed: number,
turnRate: number
}

2. Vite Configuration
   - Configuration file: vite.config.ts
   - ESBuild target: ES2020
   - React plugin enabled
   - Static file serving configured
   - CSS source maps enabled
   - Optimized dependencies configuration

# Resource Tracking System Implementation

## Core Resource Tracking Types

- **ResourceTypes.ts**: src/types/resources/ResourceTypes.ts

  - Contains core resource type definitions
  - Includes ResourceState, ResourceType, ResourceThreshold interfaces
  - Dependencies: GameTypes.ts

- **useResourceTracking.ts**: src/hooks/resources/useResourceTracking.ts
  - Provides global resource tracking for React components
  - Manages resource state, history, and alerts
  - Dependencies: ResourceTypes.ts, EventEmitter.ts

## Resource Serialization Interfaces

- **SerializedResourceState**: Interface for serialized resource state

  - Used for localStorage persistence
  - Contains serialized resources and thresholds
  - Implemented in useResourceTracking.ts

- **SerializedResource**: Interface for individual serialized resources

  - Contains amount, capacity, rate properties
  - Used in SerializedResourceState
  - Implemented in useResourceTracking.ts

- **ResourceTotals**: Interface for resource totals

  - Contains total amounts, capacities, and rates
  - Used for summary calculations
  - Implemented in useResourceTracking.ts

- **SerializedThreshold**: Interface for serialized threshold data
  - Contains threshold configuration for persistence
  - Used in SerializedResourceState
  - Implemented in useResourceTracking.ts

## Type Relationships

```

ResourceState
├── resources: Map<ResourceType, Resource>
├── thresholds: Map<string, ResourceThreshold[]>
└── history: ResourceHistory

SerializedResourceState
├── resources: Record<ResourceType, SerializedResource>
├── thresholds: Record<string, SerializedThreshold[]>
└── timestamp: number

Resource
├── amount: number
├── capacity: number
└── rate: number

SerializedResource
├── amount: number
├── capacity: number
└── rate: number

ResourceTotals
├── amounts: Record<ResourceType, number>
├── capacities: Record<ResourceType, number>
└── rates: Record<ResourceType, number>

```

## Resource Tracking Flow

```

useResourceTracking
├── initializeState() → Initial ResourceState
├── updateResource() → Modified ResourceState
├── serializeState() → SerializedResourceState (for storage)
├── deserializeState() → ResourceState (from storage)
└── calculateTotals() → ResourceTotals (for UI)

```

## Map Iteration TypeScript Fixes

The following files have been updated to fix Map iteration issues by using Array.from() to convert Map entries, keys, or values to arrays before iteration:

- **Resource Manager**: src/managers/game/ResourceManager.ts

  - Fixed Map iteration in apply(), update(), and various resource management methods
  - Added calculateTransferRate() method to compute resource transfer rates
  - Updated removeResource() to return a boolean indicating success or failure
  - Added event emission for resource changes

- **Resource Performance Monitor**: src/managers/resource/ResourcePerformanceMonitor.ts

  - Fixed Map iteration in update() and getMetrics() methods
  - Converted Map.values() to arrays before iteration
  - Improved type safety for performance metrics collection

- **Resource Exchange Manager**: src/managers/resource/ResourceExchangeManager.ts

  - Fixed Map iteration in update() and processExchanges() methods
  - Converted Map.entries() to arrays before iteration
  - Enhanced type safety for exchange rate calculations

- **Resource Pool Manager**: src/managers/resource/ResourcePoolManager.ts

  - Fixed Map iteration in distributePool() and allocateResources() methods
  - Converted Map.entries() to arrays before iteration
  - Improved type safety for pool distribution rules

- **Resource Storage Manager**: src/managers/resource/ResourceStorageManager.ts

  - Fixed Map iteration in update() and getStorageContainers() methods
  - Converted Map.values() to arrays before iteration
  - Enhanced type safety for storage container management

- **Asteroid Field Manager**: src/managers/mining/AsteroidFieldManager.ts
  - Fixed Map iteration in update() and processAsteroidFields() methods
  - Converted Map.entries() to arrays before iteration
  - Improved type safety for asteroid field processing

These fixes ensure type safety when iterating over Map objects in TypeScript, avoiding the "Type 'MapIterator<...>' can only be iterated through when using the '--downlevelIteration' flag or with a '--target' of 'es2015' or higher" error.
