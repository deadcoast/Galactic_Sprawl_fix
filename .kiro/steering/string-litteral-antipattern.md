---
inclusion: always
description: Do not use string literals for values that have corresponding enum types. Always use the appropriate enum type to ensure type safety and consistency across the codebase.
globs: **/*.tsx, **/*.ts, src/**/*.ts, src/**/*.tsx
---

### String Literal Anti-Pattern Rule

Anti-patterns to avoid:

1. String literals for resource types:
```typescript
// INCORRECT: Using string literals for resource types
const resourceType = 'energy';
if (resourceType === 'minerals') { /* ... */ }
```

Correct implementation:

```typescript
typescript; // CORRECT: Using ResourceType enum
const resourceType = ResourceType.ENERGY;
if (resourceType === ResourceType.MINERALS) {
  /* ... */
}
```

1. String literals for event types:

```typescript
typescript; // INCORRECT: Using string literals for event types
moduleEventBus.subscribe('RESOURCE_PRODUCED', event => {
  /* ... */
});
```

Correct implementation:

```typescript
typescript; // CORRECT: Using EventType enum
moduleEventBus.subscribe(EventType.RESOURCE_PRODUCED, event => {
  /* ... */
});
```

1. String literals for faction IDs:

```typescript
typescript; // INCORRECT: Using string literals for faction IDs
const faction = 'space-rats';
```

Correct implementation:

```typescript
typescript; // CORRECT: Using FactionId type or enum
const faction: FactionId = 'space-rats';
```

1. String literals for flow node types:

```typescript
typescript; // INCORRECT: Using string literals for flow node types
const nodeType = 'producer';
```

Correct implementation:

```typescript
typescript; // CORRECT: Using FlowNodeType enum
const nodeType = FlowNodeType.PRODUCER;
```

Always use the appropriate enum type for predefined values to leverage TypeScript's type checking capabilities.