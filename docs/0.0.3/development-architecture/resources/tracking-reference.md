---
RESOURCE TRACKING REFERENCES
---

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

## Resource Tracking Components

- **ResourceTracker**: src/components/resources/ResourceTracker.tsx
  - Purpose: Main component for tracking and displaying resource information
  - Dependencies: useResourceTracking, ResourceDisplay

- **ResourceHistory**: src/components/resources/ResourceHistory.tsx
  - Purpose: Displays historical resource data
  - Dependencies: useResourceTracking, ChartJS

- **ResourceAlerts**: src/components/resources/ResourceAlerts.tsx
  - Purpose: Displays resource alerts and notifications
  - Dependencies: useResourceTracking, AlertSystem

## Resource Tracking Hooks

- **useResourceHistory**: src/hooks/resources/useResourceHistory.ts
  - Purpose: Hook for accessing resource history data
  - Dependencies: useResourceTracking

- **useResourceAlerts**: src/hooks/resources/useResourceAlerts.ts
  - Purpose: Hook for managing resource alerts
  - Dependencies: useResourceTracking, AlertSystem

- **useResourceThresholds**: src/hooks/resources/useResourceThresholds.ts
  - Purpose: Hook for managing resource thresholds
  - Dependencies: useResourceTracking

## Resource Tracking Events

- **ResourceUpdateEvent**: Triggered when a resource is updated
  - Payload: { resourceType, oldValue, newValue, source }

- **ResourceThresholdEvent**: Triggered when a resource crosses a threshold
  - Payload: { resourceType, threshold, value, direction }

- **ResourceAlertEvent**: Triggered when a resource alert is generated
  - Payload: { resourceType, alertType, message, severity }

## Resource Tracking Integration

- **ResourceTrackingProvider**: src/providers/ResourceTrackingProvider.tsx
  - Purpose: Context provider for resource tracking
  - Dependencies: useResourceTracking

- **ResourceTrackingConsumer**: src/providers/ResourceTrackingConsumer.tsx
  - Purpose: Context consumer for resource tracking
  - Dependencies: ResourceTrackingProvider

- **ResourceTrackingContext**: src/contexts/ResourceTrackingContext.ts
  - Purpose: Context for resource tracking
  - Dependencies: React.createContext

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
