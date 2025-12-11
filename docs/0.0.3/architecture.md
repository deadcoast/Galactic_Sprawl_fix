# PROPERLY UTILIZING THE ARCHITECTURE DOCUMENTATION

This document serves as the foundation for understanding and implementing the Galactic Sprawl system architecture. It provides essential guidelines for working with the system components and maintaining architectural integrity.

## Purpose

This documentation represents the `source of truth` for system architecture decisions and should inform all implementation work. It helps:

1. Understand the intended architecture
2. Identify gaps between current implementation and architectural vision
3. Determine necessary connections and fixes
4. Maintain consistency across the codebase

## Usage Instructions

When working with this architectural documentation:

1. **Component References**
   - Use unique identifiers for all system elements
   - Follow established naming conventions
   - Maintain clear component boundaries

2. **Implementation Specifications**
   - Parse JSON objects and TypeScript interfaces as structured specifications
   - Use these definitions as templates for concrete implementations
   - Follow type definitions strictly

3. **Code Analysis**
   - Review relevant codebase files before implementation
   - Understand current implementation status
   - Identify potential integration points

4. **Implementation Standards**
   - Fill placeholder values with concrete code that aligns with standards
   - Follow established architectural patterns
   - Maintain type safety throughout

5. **Code Generation**
   - Present implementation suggestions with specific examples
   - Follow the established patterns in example code
   - Include all necessary imports and dependencies

6. **Documentation**
   - Update relevant documentation when making changes
   - Include code examples for complex patterns
   - Document any deviations from standard patterns

## Architectural Patterns

### BaseManager Pattern

```typescript
interface BaseManager<T extends BaseEvent = BaseEvent> {
  // Lifecycle methods
  initialize(dependencies?: Record<string, unknown>): Promise<void>;
  update(deltaTime: number): void;
  dispose(): void;

  // Event handling
  subscribeToEvent<E extends T>(
    eventType: EventType,
    handler: EventHandler<E>,
  ): Unsubscribe;
  publishEvent<E extends T>(event: E): void;

  // Metadata
  getMetadata(): ManagerMetadata;
}
```

### Context Provider Pattern

```typescript
// Context creation
export const ExampleContext = React.createContext<ExampleContextType | null>(null);

// Provider component
export const ExampleProvider: React.FC<ExampleProviderProps> = ({
  children,
  exampleManager,
  initialState = {},
}) => {
  // State management
  const [state, dispatch] = useReducer(exampleReducer, initialState);

  // Event subscriptions
  useEffect(() => {
    const unsubscribe = exampleManager.subscribeToEvent(
      EventType.EXAMPLE_EVENT,
      handleExampleEvent
    );

    return () => unsubscribe();
  }, [exampleManager]);

  // Context value
  const contextValue = {
    ...state,
    exampleManager,
    // Actions
    doSomething: () => { /* implementation */ },
  };

  return (
    <ExampleContext.Provider value={contextValue}>
      {children}
    </ExampleContext.Provider>
  );
};
```

### Event Subscription Pattern

```typescript
// In a component
useEffect(() => {
  const unsubscribe = eventBus.subscribe(EventType.EXAMPLE_EVENT, handleEvent);
  return () => unsubscribe();
}, [eventBus]);

// Using the hook
useEventSubscription(eventBus, EventType.EXAMPLE_EVENT, handleEvent, [
  /* dependencies */
]);
```

### Component Registration Pattern

```typescript
// In a component
const componentId = useComponentRegistration({
  type: "ExampleComponent",
  eventSubscriptions: ["EXAMPLE_EVENT_TYPE"],
  updatePriority: "medium",
});

useComponentLifecycle({
  onMount: () => console.log("Component mounted"),
  onUnmount: () => console.log("Component unmounted"),
  eventSubscriptions: [
    {
      eventType: "EXAMPLE_EVENT_TYPE",
      handler: (event) => handleEvent(event),
    },
  ],
});
```

## Best Practices

1. **Type Safety**
   - Use TypeScript interfaces and types consistently
   - Avoid using `any` type
   - Implement proper type guards

2. **Event Handling**
   - Always clean up event subscriptions
   - Use typed event handlers
   - Follow the event subscription pattern

3. **State Management**
   - Use context providers for shared state
   - Implement proper state updates
   - Follow the reducer pattern

4. **Performance**
   - Implement proper memoization
   - Use React.memo for pure components
   - Follow the component registration pattern

5. **Testing**
   - Write unit tests for all components
   - Implement integration tests for system boundaries
   - Include performance tests for critical paths

## Directory Structure

```
src/
├── lib/
│   ├── managers/      # Base manager implementations
│   ├── contexts/      # Base context implementations
│   ├── events/        # Event system implementations
│   └── utils/         # Shared utilities
├── managers/
│   ├── game/          # Game-specific managers
│   ├── resource/      # Resource-specific managers
│   └── module/        # Module-specific managers
├── contexts/          # Context implementations
├── components/
│   ├── core/          # Core UI components
│   ├── ui/            # Shared UI components
│   └── modules/       # Module-specific components
└── tests/
    ├── unit/          # Unit tests
    ├── integration/   # Integration tests
    └── performance/   # Performance tests
```

## Related Documentation

- [System Overview](02_SYSTEM_OVERVIEW.md)
- [Status Dashboard](03_STATUS_DASHBOARD.md)
- [Resource System](components/01_RESOURCE_SYSTEM.md)
- [Event System](components/02_EVENT_SYSTEM.md)
- [Testing Architecture](testing/01_TEST_ARCHITECTURE.md)
