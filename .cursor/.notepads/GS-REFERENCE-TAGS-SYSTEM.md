# GALACTIC SPRAWL (GS) - Reference Tags System

## Overview
This document defines a standardized notation system for referencing system documentation in code comments. These reference tags help Cursor.AI understand the context of the code being written or modified, allowing it to generate more accurate suggestions and completions.

## Reference Tag Format

### Basic Reference Tag
Reference tags use the following format:

```
// @context: system-name
```

### Multiple System References
To reference multiple systems, separate them with commas:

```
// @context: resource-system, event-system
```

### Specific Component References
To reference specific components or subsystems, use dot notation:

```
// @context: resource-system.threshold
```

## Available System References

### Core Systems
- `architecture-core` - Overall architecture and system relationships
- `type-definitions` - Core type definitions and type safety patterns
- `event-system` - Event handling and communication
- `resource-system` - Resource management and flow
- `factory-system` - Object creation patterns
- `registry-system` - Manager and service registry
- `entity-pooling` - Entity pooling and performance optimization

### Manager Systems
- `manager-registry` - Manager access patterns
- `resource-manager` - Resource management
- `module-manager` - Module lifecycle management
- `faction-manager` - Faction behavior and relationships
- `combat-manager` - Combat mechanics and calculations
- `exploration-manager` - Exploration and discovery

### UI Systems
- `component-library` - UI component patterns
- `visualization-system` - Data visualization
- `shader-system` - WebGL shader management

## Usage Guidelines

1. **File Headers**
   Place reference tags at the top of the file to establish the overall context:
```typescript
   /**
    * ResourceManager.ts
    * @context: resource-system, event-system
    * 
    * Central manager for all resource operations.
    */
```

2. **Function/Method Context** Use reference tags above functions or methods that interact with specific systems:
    
```typescript
    // @context: event-system
    private setupEventListeners(): void {
      // Event subscription implementation
    }
```
    
3. **Component Context** Use reference tags in React components to indicate system dependencies:
    
```typescript
    /**
     * ResourceDisplay.tsx
     * @context: resource-system, component-library
     */
    export function ResourceDisplay({ resourceType }: { resourceType: ResourceType }) {
      // Component implementation
    }
```
    
4. **Implementation References** Use reference tags to indicate that code should follow specific implementation patterns:
    
```typescript
    // @context: manager-registry.singleton-pattern
    export class CustomManager {
      // Implementation should follow singleton pattern
    }
```
    

## Examples

### Resource Manager Implementation

```typescript
/**
 * ResourceThresholdManager.ts
 * @context: resource-system.threshold, event-system
 * 
 * Manages resource thresholds and triggers events when thresholds are crossed.
 */
export class ResourceThresholdManager {
  // Class implementation
}
```

### Event Handler Component

```typescript
/**
 * ResourceMonitor.tsx
 * @context: event-system, resource-system
 */
function ResourceMonitor() {
  // @context: event-system.subscription
  useEffect(() => {
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_PRODUCED,
      handleResourceProduced
    );
    
    return unsubscribe;
  }, []);
  
  // Component implementation
}
```

### Factory Implementation

```typescript
/**
 * ShipFactory.ts
 * @context: factory-system, manager-registry
 */
export class ShipFactory {
  // @context: factory-system.singleton-pattern
  private static instance: ShipFactory;
  
  public static getInstance(): ShipFactory {
    // Singleton implementation
  }
  
  // @context: factory-system.creation-methods
  public createShip(type: ShipType): Ship {
    // Factory implementation
  }
}
```

# GALACTIC SPAWL (GS) - Reference Tags System

## Overview
This document defines a standardized notation system for referencing system documentation in code comments. These reference tags help Cursor.AI understand the context of the code being written or modified, allowing it to generate more accurate suggestions and completions.

## Reference Tag Format

### Basic Reference Tag
Reference tags use the following format:

```
// @context: system-name
```

### Multiple System References
To reference multiple systems, separate them with commas:

```
// @context: resource-system, event-system
```

### Specific Component References
To reference specific components or subsystems, use dot notation:

```
// @context: resource-system.threshold
```

## Available System References

### Core Systems
- `architecture-core` - Overall architecture and system relationships
- `type-definitions` - Core type definitions and type safety patterns
- `event-system` - Event handling and communication
- `resource-system` - Resource management and flow
- `factory-system` - Object creation patterns
- `registry-system` - Manager and service registry
- `entity-pooling` - Entity pooling and performance optimization

### Manager Systems
- `manager-registry` - Manager access patterns
- `resource-manager` - Resource management
- `module-manager` - Module lifecycle management
- `faction-manager` - Faction behavior and relationships
- `combat-manager` - Combat mechanics and calculations
- `exploration-manager` - Exploration and discovery

### UI Systems
- `ui-system` - Overall UI system architecture and patterns
- `component-library` - UI component patterns
- `ui-theme-system` - Theming and styling patterns
- `ui-layout-system` - Layout components and patterns
- `ui-form-system` - Form components and validation
- `ui-hook-system` - UI-specific React hooks
- `ui-animation-system` - Animation and transition patterns
- `visualization-system` - Data visualization
- `ui-responsive-system` - Responsive design patterns
- `ui-accessibility` - Accessibility patterns and implementations
- `ui-error-handling` - UI error boundary and fallback patterns
- `shader-system` - WebGL shader management

## Usage Guidelines

1. **File Headers**
   Place reference tags at the top of the file to establish the overall context:
```typescript
   /**
    * ResourceManager.ts
    * @context: resource-system, event-system
    * 
    * Central manager for all resource operations.
    */
```

2. **Function/Method Context** Use reference tags above functions or methods that interact with specific systems:
    
```typescript
    // @context: event-system
    private setupEventListeners(): void {
      // Event subscription implementation
    }
```
    
3. **Component Context** Use reference tags in React components to indicate system dependencies:
    
```typescript
    /**
     * ResourceDisplay.tsx
     * @context: resource-system, component-library
     */
    export function ResourceDisplay({ resourceType }: { resourceType: ResourceType }) {
      // Component implementation
    }
```
    
4. **Implementation References** Use reference tags to indicate that code should follow specific implementation patterns:
    
```typescript
    // @context: manager-registry.singleton-pattern
    export class CustomManager {
      // Implementation should follow singleton pattern
    }
```

5. **UI Component Context** Use reference tags to indicate UI component system relationships:
    
```typescript
    /**
     * Button.tsx
     * @context: ui-system, component-library
     */
    export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
      ({ variant, size, children, ...props }, ref) => {
        // Component implementation
      }
    );
```

## Examples

### Resource Manager Implementation

```typescript
/**
 * ResourceThresholdManager.ts
 * @context: resource-system.threshold, event-system
 * 
 * Manages resource thresholds and triggers events when thresholds are crossed.
 */
export class ResourceThresholdManager {
  // Class implementation
}
```

### Event Handler Component

```typescript
/**
 * ResourceMonitor.tsx
 * @context: event-system, resource-system
 */
function ResourceMonitor() {
  // @context: event-system.subscription
  useEffect(() => {
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_PRODUCED,
      handleResourceProduced
    );
    
    return unsubscribe;
  }, []);
  
  // Component implementation
}
```

### Factory Implementation

```typescript
/**
 * ShipFactory.ts
 * @context: factory-system, manager-registry
 */
export class ShipFactory {
  // @context: factory-system.singleton-pattern
  private static instance: ShipFactory;
  
  public static getInstance(): ShipFactory {
    // Singleton implementation
  }
  
  // @context: factory-system.creation-methods
  public createShip(type: ShipType): Ship {
    // Factory implementation
  }
}
```

### UI Component Implementation

```typescript
/**
 * ResourceDisplay.tsx
 * @context: ui-system, component-library, resource-system
 */
export function ResourceDisplay({ resourceType }: ResourceDisplayProps) {
  // @context: ui-hook-system, resource-manager
  const { data, loading, error } = useResourceData(resourceType);
  
  // @context: ui-error-handling
  if (error) {
    return <ErrorMessage message={error.message} />;
  }
  
  // @context: ui-responsive-system
  const { isMobile } = useBreakpoint();
  
  return (
    <div className={`resource-display ${isMobile ? 'mobile' : ''}`}>
      {/* Component rendering */}
    </div>
  );
}
```

### Form Component Implementation

```typescript
/**
 * ResourceForm.tsx
 * @context: ui-form-system, ui-system, resource-system
 */
export function ResourceForm({ onSubmit }: ResourceFormProps) {
  // @context: ui-form-system.validation
  const { values, errors, handleChange, handleSubmit } = useForm<ResourceFormData>({
    initialValues: { type: ResourceType.ENERGY, amount: 0 },
    validationSchema: resourceFormValidationSchema
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## Benefits

1. **Improved Context Awareness**: Cursor.AI can access relevant system documentation based on reference tags
2. **Consistent Implementation**: Tags ensure that code follows established patterns
3. **Better Code Generation**: Cursor.AI can generate more accurate code with proper context
4. **Documentation Integration**: Tags connect code to broader documentation
5. **Pattern Enforcement**: Tags signal which patterns should be applied to the current code

## Context Commands

### Command System Document
