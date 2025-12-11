# TypeScript Type Guard Best Practices

This document outlines best practices for implementing and using type guards in TypeScript, with a focus on their use in test files.

## Type Guards in Test Files

When implementing type guards in test files, follow these best practices:

### 1. Create Helper Functions

Wrap type guards in helper functions that provide additional functionality:

```typescript
// Type guard function
function isValidEventType(type: string): type is EventType {
  return ["EVENT_1", "EVENT_2", "EVENT_3"].includes(type);
}

// Helper function that uses the type guard
const validateEventType = (eventType: string): boolean => {
  if (!isValidEventType(eventType)) {
    console.warn(`Invalid event type: ${eventType}`);
    return false;
  }
  return true;
};
```

### 2. Test the Type Guard Itself

Create dedicated test cases that verify the type guard works correctly:

```typescript
describe("Event Type Validation", () => {
  it("should validate valid event types", () => {
    expect(validateEventType("EVENT_1")).toBe(true);
    expect(validateEventType("EVENT_2")).toBe(true);
  });

  it("should reject invalid event types", () => {
    expect(validateEventType("INVALID_EVENT")).toBe(false);
  });
});
```

### 3. Use in Test Setup

Use type guards to validate test data before using it:

```typescript
// Validate event type before emitting
expect(validateEventType(testEvent.type)).toBe(true);
eventBus.emit(testEvent);
```

### 4. Document Type Guard Purpose

Add clear comments explaining what the type guard is checking and why:

```typescript
// Helper function to validate if an event type is a valid custom module event type
// This ensures we only emit events with types that our system can handle
function isValidCustomEventType(type: string): type is CustomEventType {
  // Implementation...
}
```

## Real-World Example

Here's a real-world example from our codebase:

```typescript
// Define custom event types for testing
type _CustomModuleEventType =
  | ModuleEventType
  | "SHIP_ASSIGNED"
  | "RESOURCE_LEVEL_CHANGED";

// Helper function to validate if an event type is a valid custom module event type
function isValidCustomEventType(type: string): type is _CustomModuleEventType {
  // Check if it's one of the standard module event types
  const standardEventTypes = [
    "RESOURCE_PRODUCED",
    "RESOURCE_CONSUMED",
    "RESOURCE_UPDATED",
    "SHIP_ASSIGNED",
    "RESOURCE_TRANSFERRED",
  ];
  return (
    standardEventTypes.includes(type) ||
    type === "SHIP_ASSIGNED" ||
    type === "RESOURCE_LEVEL_CHANGED"
  );
}

// Helper function to validate event types using our custom type guard
const validateEventType = (eventType: string): boolean => {
  if (!isValidCustomEventType(eventType)) {
    console.warn(`Invalid event type: ${eventType}`);
    return false;
  }
  return true;
};

// Test cases for the type guard
describe("Event Type Validation", () => {
  it("should validate standard module event types", () => {
    // Test standard event types
    expect(validateEventType("RESOURCE_PRODUCED")).toBe(true);
    expect(validateEventType("RESOURCE_CONSUMED")).toBe(true);
    expect(validateEventType("RESOURCE_UPDATED")).toBe(true);
    expect(validateEventType("RESOURCE_TRANSFERRED")).toBe(true);
    expect(validateEventType("SHIP_ASSIGNED")).toBe(true);
  });

  it("should validate custom event types", () => {
    // Test custom event types
    expect(validateEventType("RESOURCE_LEVEL_CHANGED")).toBe(true);
  });

  it("should reject invalid event types", () => {
    // Test invalid event types
    expect(validateEventType("INVALID_EVENT_TYPE")).toBe(false);
    expect(validateEventType("UNKNOWN_EVENT")).toBe(false);
  });
});

// Using the validation in test setup
const shipAssignedEvent: ShipAssignedEvent = {
  type: "SHIP_ASSIGNED",
  // ... other properties
};

// Validate the event type before emitting
expect(validateEventType(shipAssignedEvent.type)).toBe(true);

// Act: Manually call the event handler
moduleEventBus.emit(shipAssignedEvent as unknown as ModuleEvent);
```

## Benefits of Proper Type Guard Implementation

1. **Type Safety**: Type guards provide compile-time type checking, ensuring that only valid types are used.
2. **Runtime Validation**: Helper functions that use type guards can provide runtime validation and error reporting.
3. **Self-Documenting Code**: Well-implemented type guards make the code more self-documenting and easier to understand.
4. **Improved Test Coverage**: Testing type guards directly improves test coverage and ensures they work correctly.
5. **Better Error Messages**: Helper functions can provide better error messages when invalid types are encountered.

## Common Pitfalls to Avoid

1. **Unused Type Guards**: Defining type guards but not using them in the code.
2. **Overly Complex Type Guards**: Creating type guards that are too complex and hard to understand.
3. **Missing Test Cases**: Not testing type guards directly to ensure they work correctly.
4. **Inadequate Documentation**: Not documenting the purpose and usage of type guards.
5. **Inconsistent Usage**: Using type guards inconsistently throughout the codebase.
