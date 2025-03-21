# GALACTIC SPRAWL (GS) - Context Commands

## Overview
This document defines shorthand commands that can be used in prompts to Cursor.AI to access specific functionality related to code pattern verification, implementation assistance, and codebase navigation.

## Command Format

Commands use the following format:
```
@command-name [parameters]
```

## Available Commands

### Pattern Verification Commands

#### @check-pattern
Verifies if code follows established patterns for the specified system.

```
@check-pattern [code-snippet]
```

Example:
```
@check-pattern function processResource(resourceType: string, amount: number) { if (resourceType === 'energy') { return processEnergy(amount); } else if (resourceType === 'minerals') { return processMinerals(amount); } }
```

#### @verify-types
Checks if the provided code uses proper type definitions and type safety patterns.

```
@verify-types [code-snippet]
```

Example:
```
@verify-types function handleEvent(event: any) { console.log(`Received event: ${event.type}`); processEvent(event.data); }
```

### Implementation Assistance Commands

#### @find-similar
Locates similar implementations in the codebase for the specified functionality.

```
@find-similar [functionality-description]
```

Example:
```
@find-similar resource threshold checking logic
```

#### @implement-pattern
Generates code for a specific implementation pattern with proper typing and structure.

```
@implement-pattern [pattern-name] [parameters]
```

Example:
```
@implement-pattern singleton-manager ResourceConversionManager
```

#### @refactor-to-pattern
Refactors provided code to follow a specific pattern.

```
@refactor-to-pattern [pattern-name] [code-snippet]
```

Example:
```
@refactor-to-pattern type-safe-event moduleEventBus.emit('RESOURCE_PRODUCED', { amount: 100, type: 'energy' });
```

### Navigation Commands

#### @show-documentation
Retrieves documentation for a specific system or component.

```
@show-documentation [system-name]
```

Example:
```
@show-documentation resource-system
```

#### @show-interface
Displays the interface definition for a specified type or class.

```
@show-interface [type-name]
```

Example:
```
@show-interface ResourceState
```

### Type System Commands

#### @convert-to-enum
Converts string literals to corresponding enum types.

```
@convert-to-enum [enum-type] [code-snippet]
```

Example:
```
@convert-to-enum ResourceType const resources = ['energy', 'minerals', 'population'];
```

#### @add-type-guards
Adds appropriate type guards to the provided code.

```
@add-type-guards [code-snippet]
```

Example:
```
@add-type-guards function processEvent(event: unknown) { const typedEvent = event as BaseEvent; handleEvent(typedEvent); }
```

### Integration Commands

#### @integrate-with
Generates code to integrate with a specific system.

```
@integrate-with [system-name] [component-name]
```

Example:
```
@integrate-with event-system ResourceProcessor

```
#### @add-manager-registry
Updates the Manager Registry with a new manager class.

```
@add-manager-registry [manager-name]
```

Example:
```
@add-manager-registry MiningManager
```

## Usage Examples

### Complete Implementation Flow Example

```typescript
// First, get documentation for the resource system @show-documentation resource-system

// Find similar implementations for resource threshold management @find-similar resource threshold management

// Create an interface following the pattern @implement-pattern resource-threshold ResourceWarningThreshold

// Verify the implementation follows the pattern @check-pattern export class ResourceWarningManager { private thresholds: Map<ResourceType, number> = new Map();

public setThreshold(resourceType: ResourceType, value: number): void { this.thresholds.set(resourceType, value); }

public checkThreshold(resourceType: ResourceType, currentValue: number): boolean { const threshold = this.thresholds.get(resourceType); if (threshold === undefined) return false; return currentValue < threshold; } }

// Integrate with the manager registry @add-manager-registry ResourceWarningManager
```

### Refactoring Flow Example

```typescript
// First, verify what's wrong with the current implementation @verify-types function 

handleResourceChange(resourceName: string, amount: number) { if (resourceName === 'energy') { console.log('Energy changed by ' + amount); } }

// Get the correct pattern @show-documentation type-definitions

// Refactor to use proper enum types @refactor-to-pattern resource-type-enum function

handleResourceChange(resourceName: string, amount: number) { if (resourceName === 'energy') { console.log('Energy changed by ' + amount); } }
```

# GALACTIC SPRAWL (GS) - Context Commands

## Overview
This document defines shorthand commands that can be used in prompts to Cursor.AI to access specific functionality related to code pattern verification, implementation assistance, and codebase navigation.

## Command Format

Commands use the following format:
```
@command-name [parameters]
```

## Available Commands

### Pattern Verification Commands

#### @check-pattern
Verifies if code follows established patterns for the specified system.

```
@check-pattern [code-snippet]
```

Example:
```
@check-pattern function processResource(resourceType: string, amount: number) { if (resourceType === 'energy') { return processEnergy(amount); } else if (resourceType === 'minerals') { return processMinerals(amount); } }
```

#### @verify-types
Checks if the provided code uses proper type definitions and type safety patterns.

```
@verify-types [code-snippet]
```

Example:
```
@verify-types function handleEvent(event: any) { console.log(`Received event: ${event.type}`); processEvent(event.data); }
```

### Implementation Assistance Commands

#### @find-similar
Locates similar implementations in the codebase for the specified functionality.

```
@find-similar [functionality-description]
```

Example:
```
@find-similar resource threshold checking logic
```

#### @implement-pattern
Generates code for a specific implementation pattern with proper typing and structure.

```
@implement-pattern [pattern-name] [parameters]
```

Example:
```
@implement-pattern singleton-manager ResourceConversionManager
```

#### @refactor-to-pattern
Refactors provided code to follow a specific pattern.

```
@refactor-to-pattern [pattern-name] [code-snippet]
```

Example:
```
@refactor-to-pattern type-safe-event moduleEventBus.emit('RESOURCE_PRODUCED', { amount: 100, type: 'energy' });
```

### Navigation Commands

#### @show-documentation
Retrieves documentation for a specific system or component.

```
@show-documentation [system-name]
```

Example:
```
@show-documentation resource-system
```

#### @show-interface
Displays the interface definition for a specified type or class.

```
@show-interface [type-name]
```

Example:
```
@show-interface ResourceState
```

### Type System Commands

#### @convert-to-enum
Converts string literals to corresponding enum types.

```
@convert-to-enum [enum-type] [code-snippet]
```

Example:
```
@convert-to-enum ResourceType const resources = ['energy', 'minerals', 'population'];
```

#### @add-type-guards
Adds appropriate type guards to the provided code.

```
@add-type-guards [code-snippet]
```

Example:
```
@add-type-guards function processEvent(event: unknown) { const typedEvent = event as BaseEvent; handleEvent(typedEvent); }
```

### Integration Commands

#### @integrate-with
Generates code to integrate with a specific system.

```
@integrate-with [system-name] [component-name]
```

Example:
```
@integrate-with event-system ResourceProcessor
```

#### @add-manager-registry
Updates the Manager Registry with a new manager class.

```
@add-manager-registry [manager-name]
```

Example:
```
@add-manager-registry MiningManager
```

### UI System Commands

#### @implement-ui-component
Generates code for a UI component following the project's UI patterns.

```
@implement-ui-component [component-type] [parameters]
```

Example:
```
@implement-ui-component button { variant: 'primary', size: 'medium', withIcon: true }
```

#### @add-responsive-behavior
Adds responsive behavior to a UI component using the project's responsive patterns.

```
@add-responsive-behavior [component-name] [breakpoints]
```

Example:
```
@add-responsive-behavior ResourceDisplay ['sm', 'md', 'lg']
```

#### @add-ui-integration
Integrates a component with the UI system and related subsystems.

```
@add-ui-integration [component-name] [systems]
```

Example:
```
@add-ui-integration ResourceMonitor ['resource-system', 'event-system']
```

## Usage Examples

### Complete Implementation Flow Example

```typescript
// First, get documentation for the resource system @show-documentation resource-system

// Find similar implementations for resource threshold management @find-similar resource threshold management

// Create an interface following the pattern @implement-pattern resource-threshold ResourceWarningThreshold

// Verify the implementation follows the pattern @check-pattern export class ResourceWarningManager { private thresholds: Map<ResourceType, number> = new Map();

public setThreshold(resourceType: ResourceType, value: number): void { this.thresholds.set(resourceType, value); }

public checkThreshold(resourceType: ResourceType, currentValue: number): boolean { const threshold = this.thresholds.get(resourceType); if (threshold === undefined) return false; return currentValue < threshold; } }

// Integrate with the manager registry @add-manager-registry ResourceWarningManager
```

### UI Component Implementation Flow Example

```typescript
// First, get documentation for the UI system @show-documentation ui-system

// Find similar UI components @find-similar resource display component

// Create a UI component with responsive design @implement-ui-component resource-display { 
  resourceType: ResourceType.ENERGY,
  showIcon: true,
  responsive: true
}

// Add error handling to the component @refactor-to-pattern error-boundary ResourceDisplay

// Integrate with resource system @add-ui-integration ResourceDisplay ['resource-system']
```

### Refactoring Flow Example

```typescript
// First, verify what's wrong with the current implementation @verify-types function 

handleResourceChange(resourceName: string, amount: number) { if (resourceName === 'energy') { console.log('Energy changed by ' + amount); } }

// Get the correct pattern @show-documentation type-definitions

// Refactor to use proper enum types @refactor-to-pattern resource-type-enum function

handleResourceChange(resourceName: string, amount: number) { if (resourceName === 'energy') { console.log('Energy changed by ' + amount); } }
```

## Benefits

1. Efficiency: Commands provide quick access to specific functionality
2. Consistency: Standardized commands ensure consistent code generation
3. Discoverability: Commands expose available functionality to users
4. Guided Implementation: Commands can guide the implementation process
5. Pattern Enforcement: Commands help enforce established patterns

## Progressive Implementation Protocol

### Implementation Protocol Document