# Validation System Documentation

## Overview

The validation system provides a robust mechanism for verifying the structure and integrity of data throughout the codebase, with a particular focus on event data validation. This system helps prevent runtime errors by ensuring that data adheres to expected formats before it's processed by the application.

## Core Components

### 1. Type Guards

Type guards are functions that perform runtime checks to verify that values conform to expected types. They return boolean values and provide TypeScript with type narrowing capabilities.

```typescript
/**
 * Validates that a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Validates that a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Validates that a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}
```

### 2. Event Validation

The system includes specialized validation for events, ensuring they contain required properties and conform to expected structures.

```typescript
/**
 * Validates that an object conforms to the BaseEvent interface
 */
export function isBaseEvent(event: unknown): event is BaseEvent {
  if (!isObject(event)) return false;

  return (
    "type" in event &&
    isString(event.type) &&
    "timestamp" in event &&
    isNumber(event.timestamp)
  );
}

/**
 * Validates event data for specific event types
 */
export function validateEventData<T extends EventType>(
  event: BaseEvent,
  expectedType: T,
  validator: (data: unknown) => data is EventDataMap[T],
): event is TypedEvent<T> {
  if (event.type !== expectedType) return false;

  return validator(event.data);
}
```

### 3. Schema-Based Validation

The system supports schema-based validation for complex data structures, allowing for declarative validation rules.

```typescript
/**
 * Schema definition type for validation
 */
export type ValidationSchema = {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object" | "array";
    required?: boolean;
    validator?: (value: unknown) => boolean;
  };
};

/**
 * Validates an object against a schema
 */
export function validateSchema(
  obj: unknown,
  schema: ValidationSchema,
): boolean {
  if (!isObject(obj)) return false;

  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];

    // Check required fields
    if (rules.required && (value === undefined || value === null)) {
      return false;
    }

    // Skip validation for undefined optional fields
    if (value === undefined) continue;

    // Validate type
    if (value !== null) {
      if (rules.type === "array" && !Array.isArray(value)) return false;
      if (rules.type !== "array" && typeof value !== rules.type) return false;
    }

    // Run custom validator if provided
    if (rules.validator && !rules.validator(value)) {
      return false;
    }
  }

  return true;
}
```

## Event Data Structure

### BaseEvent Interface

All events in the system extend the `BaseEvent` interface, which provides common properties for event handling:

```typescript
/**
 * Base event interface that all events implement
 */
export interface BaseEvent {
  type: EventType | string; // The type of event
  timestamp: number; // When the event occurred
  data?: unknown; // Optional payload data
  source?: string; // Optional source identifier
  id?: string; // Optional unique event ID
}
```

### Type-Safe Events

The system uses TypeScript's generic type system to create type-safe events:

```typescript
/**
 * Event data map that links event types to their respective data structures
 */
export interface EventDataMap {
  [EventType.RESOURCE_UPDATED]: ResourceUpdateEventData;
  [EventType.MODULE_CREATED]: ModuleCreatedEventData;
  [EventType.MODULE_UPDATED]: ModuleUpdatedEventData;
  // Additional event type mappings...
}

/**
 * Type-safe event interface with proper data typing
 */
export interface TypedEvent<T extends EventType> extends BaseEvent {
  type: T;
  data: EventDataMap[T];
}
```

### Event Data Examples

Below are examples of correctly structured event data for common event types:

#### Resource Updated Event

```typescript
const resourceUpdatedEvent: TypedEvent<EventType.RESOURCE_UPDATED> = {
  type: EventType.RESOURCE_UPDATED,
  timestamp: Date.now(),
  data: {
    resourceType: ResourceType.MINERALS,
    amount: 100,
    delta: 10,
    reason: "mining",
    location: { x: 10, y: 20 },
  },
};
```

#### Module Created Event

```typescript
const moduleCreatedEvent: TypedEvent<EventType.MODULE_CREATED> = {
  type: EventType.MODULE_CREATED,
  timestamp: Date.now(),
  data: {
    module: {
      id: "module-1",
      name: "Mining Module",
      type: "mineral",
      position: { x: 10, y: 20 },
      isActive: true,
      level: 1,
      status: "active",
    },
    buildingId: "building-1",
  },
};
```

#### Module Status Changed Event

```typescript
const moduleStatusChangedEvent: TypedEvent<EventType.MODULE_STATUS_CHANGED> = {
  type: EventType.MODULE_STATUS_CHANGED,
  timestamp: Date.now(),
  data: {
    moduleId: "module-1",
    oldStatus: "inactive",
    newStatus: "active",
    reason: "user_activated",
  },
};
```

## Using the Validation System

### Validating Events

```typescript
// Import validation utilities
import {
  isBaseEvent,
  validateEventData,
  isResourceUpdateEventData,
} from "./validation";
import { EventType } from "./EventTypes";

// Handler function with validation
function handleEvent(event: unknown): void {
  // First validate that it's a base event
  if (!isBaseEvent(event)) {
    console.error("Invalid event format:", event);
    return;
  }

  // Handle specific event types with proper validation
  if (event.type === EventType.RESOURCE_UPDATED) {
    // Validate the specific data structure for this event type
    if (
      validateEventData(
        event,
        EventType.RESOURCE_UPDATED,
        isResourceUpdateEventData,
      )
    ) {
      // Now TypeScript knows this is a properly typed resource update event
      const { resourceType, amount, delta } = event.data;
      console.log(
        `Resource ${resourceType} updated to ${amount} (delta: ${delta})`,
      );
    } else {
      console.error("Invalid resource update event data:", event);
    }
  }

  // Similar handling for other event types...
}
```

### Schema Validation Example

```typescript
// Define a schema for module configuration
const moduleConfigSchema: ValidationSchema = {
  type: { type: "string", required: true },
  name: { type: "string", required: true },
  level: { type: "number", required: true },
  isActive: { type: "boolean", required: true },
  position: {
    type: "object",
    required: true,
    validator: (value) => isObject(value) && "x" in value && "y" in value,
  },
  attachments: {
    type: "array",
    required: false,
    validator: (value) =>
      Array.isArray(value) && value.every((item) => isObject(item)),
  },
};

// Use validation in a function
function createModule(config: unknown): void {
  if (!validateSchema(config, moduleConfigSchema)) {
    console.error("Invalid module configuration:", config);
    return;
  }

  // If validation passed, it's safe to use the config
  const validConfig = config as ModuleConfig;
  // Continue with module creation...
}
```

## Best Practices

1. **Always Validate External Data**: Validate all data coming from external sources (API responses, user input, etc.).

2. **Use Type Guards**: Use type guards for runtime type checking to complement TypeScript's static type checking.

3. **Validate Event Data**: Always validate event data before processing events to prevent runtime errors.

4. **Define Clear Schemas**: Create clear validation schemas for complex data structures.

5. **Provide Helpful Error Messages**: When validation fails, provide detailed error messages to help debugging.

6. **Centralize Validation Logic**: Keep validation functions centralized for consistency and reusability.

7. **Test Validation Logic**: Create comprehensive tests for validation functions to ensure they work correctly.

## Common Validation Patterns

### Optional Properties Validation

```typescript
// Safely check optional properties
function validateWithOptional(obj: unknown): boolean {
  if (!isObject(obj)) return false;

  // Required properties
  if (!("id" in obj && isString(obj.id))) return false;

  // Optional properties with type checking when present
  if ("metadata" in obj && obj.metadata !== undefined) {
    if (!isObject(obj.metadata)) return false;
  }

  return true;
}
```

### Nested Object Validation

```typescript
// Validate nested structures
function validateNestedStructure(obj: unknown): boolean {
  if (!isObject(obj)) return false;

  // Validate top-level properties
  if (!("config" in obj && isObject(obj.config))) return false;

  // Validate nested properties
  const config = obj.config;
  if (!("settings" in config && isObject(config.settings))) return false;

  // Validate deeply nested properties
  const settings = config.settings;
  if ("advanced" in settings) {
    if (!isObject(settings.advanced)) return false;
  }

  return true;
}
```

### Array Validation

```typescript
// Validate arrays of specific types
function validateStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function validateObjectArray<T>(
  value: unknown,
  validator: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(validator);
}
```

## Conclusion

The validation system provides a robust foundation for ensuring data integrity throughout the application. By consistently applying these validation patterns, you can prevent many common runtime errors and create a more reliable application.
