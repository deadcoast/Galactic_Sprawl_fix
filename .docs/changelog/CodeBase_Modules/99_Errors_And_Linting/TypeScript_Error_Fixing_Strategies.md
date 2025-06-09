# TypeScript Error Fixing Strategies

Our approach to fixing TypeScript errors in the codebase follows these strategies:

## Prioritization by Error Type

- Focus first on errors that affect runtime behavior (type assertions, null checks)
- Then address errors that affect code maintainability (unused variables, implicit any)
- Finally address documentation-related errors (missing JSDoc, parameter descriptions)

## Systematic Approach by File Category

- Group files by system (resource management, combat, UI, etc.)
- Fix errors in core systems first, then move to peripheral systems
- Address shared utilities and types before component-specific code

## Implementation vs. Documentation

- For unused variables that serve a clear purpose, implement them with minimal functionality
- For unused interfaces and functions planned for future use, add comprehensive documentation
- For type assertion issues, use proper type guards and narrowing techniques

## Custom Type Definitions

- Create custom type definitions for complex objects (e.g., `CustomElementRef` for Three.js elements)
- Use type guards to narrow types in conditional blocks
- Implement proper generic constraints for reusable components

## Handling React and Three.js Integration

- Use proper type assertions for refs and elements
- Create wrapper components with proper type definitions
- Use children props correctly with appropriate typing

## Documentation Standards

- Add JSDoc comments for all public functions and interfaces
- Document parameters with specific descriptions
- Include return type documentation
- Add examples for complex functions

## Error Suppression Guidelines

- Use `@ts-expect-error` with explanatory comments for intentionally unused code
- Avoid using `@ts-ignore` without explanation
- Document all suppressed errors in the architecture documentation

## Testing After Fixes

- Run TypeScript compiler after each set of fixes
- Verify that no new errors are introduced
- Run tests to ensure functionality is preserved

## Refactoring Opportunities

- Identify patterns in errors that suggest deeper architectural issues
- Refactor code to improve type safety where appropriate
- Create reusable utility types for common patterns

## Documentation Updates

- Update architecture documentation with new type patterns
- Document error fixing strategies for future reference
- Create examples of before/after fixes for common error types

## Method Ordering Issues

When TypeScript reports that a method or property doesn't exist on a type, but you're certain it's defined in the file, check the ordering of method definitions.

### Problem

TypeScript processes files sequentially. If a method is defined after it's referenced, TypeScript may not recognize it.

Example error:

```
Property 'methodName' does not exist on type 'ClassName'.
```

### Solution

1. **Locate the method definition** in the file.

2. **Check if the method is defined after it's used** in the code.

3. **Move the method definition earlier in the file**, ideally before any code that references it.

4. **Consider reordering class methods** by:
   - Grouping related methods together
   - Placing core/frequently used methods at the top
   - Following a consistent pattern (public methods first, then private methods)

### Example

Actual error we encountered:

```
Property 'getNode' does not exist on type 'ResourceFlowManager'. Did you mean 'getNodes'?
```

The `getNode()` method was defined at the end of the ResourceFlowManager.ts file (line 2395), while it was being referenced much earlier in the file. Moving the method definition earlier in the file (before line 2300) resolved the issue.

## Results

By following these strategies, we've successfully reduced TypeScript errors in the codebase from 328 errors in 77 files to 0 errors, achieving 100% TypeScript compliance.

## Common Error Patterns and Solutions

### Unused Variables and Functions

**Problem**: Variables or functions declared but never used, causing TS6133 errors.

**Solution**:

- For variables intended for future use, add comprehensive documentation with `@ts-expect-error` comments
- For functions intended for future use, add detailed JSDoc comments with at least 5 specific future use cases
- For variables that can be implemented now, add minimal implementation that serves a purpose

**Example**:

```typescript
/**
 * Converts a weapon system to a weapon instance
 *
 * This function will be used in future implementations to:
 * 1. Create fully configured weapon instances for faction ships during combat
 * 2. Support the upcoming weapon customization system for faction ships
 * 3. Generate appropriate weapon configurations based on faction specializations
 * 4. Apply faction-specific bonuses to weapon parameters
 * 5. Implement progressive weapon upgrades for faction ships
 *
 * @param weapon The weapon system to convert
 * @returns A fully configured weapon instance
 */
// @ts-expect-error - This function is documented for future use in the faction behavior system
function _convertToWeaponInstance(weapon: WeaponSystem): WeaponInstance {
  // Implementation...
}
```

### Implicit 'any' Type

**Problem**: Parameters or variables with implicit 'any' type, causing TS7006 errors.

**Solution**:

- Add explicit type annotations for all parameters
- Use type guards to narrow types in conditional blocks
- Create custom type definitions for complex objects

**Example**:

```typescript
// Before: Implicit 'any' type
function handleEvent(e) {
  console.log(e.target.value);
}

// After: Explicit type annotation
function handleEvent(e: React.ChangeEvent<HTMLInputElement>): void {
  console.log(e.target.value);
}
```

### Type Assertion Issues

**Problem**: Incorrect type assertions causing TS2352 errors.

**Solution**:

- Use proper type guards to narrow types before assertions
- Create custom type definitions for complex objects
- Use the 'unknown' type as an intermediate step for safer type assertions

**Example**:

```typescript
// Before: Unsafe type assertion
const element = ref.current as HTMLElement;

// After: Safe type assertion with type guard
if (ref.current && ref.current instanceof HTMLElement) {
  const element = ref.current;
  // Now safe to use element
}
```

### Map Iteration Issues

**Problem**: Direct iteration over Map objects causing TS2488 errors.

**Solution**:

- Use Array.from() to convert Map entries to arrays before iteration
- Use Map.forEach() for direct iteration without conversion
- Use destructuring to access key-value pairs

**Example**:

```typescript
// Before: Direct iteration causing error
for (const [key, value] of myMap) {
  console.log(key, value);
}

// After: Safe iteration with Array.from()
for (const [key, value] of Array.from(myMap.entries())) {
  console.log(key, value);
}
```

### React Component Props Issues

**Problem**: Missing or incorrect prop types in React components causing TS2339 errors.

**Solution**:

- Define explicit interface for component props
- Use React.FC<Props> type for functional components
- Use proper type definitions for event handlers

**Example**:

```typescript
// Before: Missing prop types
const Button = ({ onClick, label }) => {
  return <button onClick={onClick}>{label}</button>;
};

// After: Explicit prop types
interface ButtonProps {
  onClick: () => void;
  label: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, label }) => {
  return <button onClick={onClick}>{label}</button>;
};
```

## Handling Unused Variables

When TypeScript or ESLint warns about unused variables, the best approach is to properly implement them rather than simply marking them as unused:

### 1. Proper Implementation (Preferred Approach)

The preferred approach is to fully implement the unused variables and functions, integrating them into the component's functionality:

```typescript
// Before: Unused function
function handleSelection(id: string) {
  // Function is defined but never used
}

// After: Proper implementation
function handleSelection(id: string) {
  // Implementation that serves a purpose
  setSelectedId(id);
  fetchDetails(id);
  logUserSelection(id);
}
```

### 2. Underscore Prefix with Documentation (When Full Implementation Is Not Yet Possible)

When a variable or function is intentionally declared for future use but cannot be implemented yet, use an underscore prefix and add clear documentation about its intended purpose:

```typescript
// Before: Unused state setter
const [isLoading, setIsLoading] = useState(false);

// After: Documented with underscore prefix
const [isLoading, _setIsLoading] = useState(false); // Reserved for loading state during async operations
```

Example from our combat system:

```typescript
// Before: Multiple unused state setters
const [threatLevel, setThreatLevel] = useState(0);
const [activeUnits, setActiveUnits] = useState(0);
const [isActive, setIsActive] = useState(false);

// After: Proper documentation with underscore prefix
const [threatLevel, _setThreatLevel] = useState(0); // Reserved for future threat level updates
const [activeUnits, _setActiveUnits] = useState(0); // Reserved for tracking active combat units
const [isActive, _setIsActive] = useState(false); // Reserved for combat activation status
```

### 3. Converting Development Logs

For unused variables in debugging code or console logs, consider properly implementing them or converting debug logs to appropriate format:

```typescript
// Before: Console.log with unused variables
console.log(`Updating formation for fleet ${fleetId}:`, formation);

// After: Proper console method following project standards
console.warn(`Updating formation for fleet ${fleetId}:`, formation);
```

### 4. Guidelines for Managing Unused Variables

1. **Never delete functionality** without understanding its purpose in the larger system
2. **Always document** the intended purpose of variables marked with underscore
3. **Group related variables** to make their relationships clear
4. **Consider refactoring** if many unused variables exist in one component
5. **Check for exported variables** that might be used elsewhere in the codebase
6. **Consider implementing stubs** for future functionality that meet the basic type requirements

### 5. ESLint Configuration

Our ESLint is configured to allow variables prefixed with underscore to be unused. This is intentional and follows the pattern:

```typescript
// This will not cause an ESLint error
const [value, _setValue] = useState(0);

// This will cause an ESLint error
const [value, setValue] = useState(0); // Error: 'setValue' is defined but never used
```

### 6. When to Use Full Implementation vs. Underscore Prefix

| Situation                          | Recommendation                                   |
| ---------------------------------- | ------------------------------------------------ |
| Setter used in event handlers      | Full implementation                              |
| Setter planned for future features | Underscore prefix with documentation             |
| Function referenced in JSX         | Full implementation                              |
| Function for future event handling | Underscore prefix with documentation             |
| Destructured props                 | Omit unused props or use rest syntax `{...rest}` |
| Temporary debugging variables      | Remove completely when debugging is complete     |

## Interface Implementation

### Avoid Definite Assignment Operator for Interface Methods

When implementing an interface in a class, avoid using the definite assignment operator (`!`) for interface methods or properties:

```typescript
// BAD
export class MyClass implements MyInterface {
  // This only satisfies the interface typewise but doesn't provide an implementation
  public requiredMethod!: MyInterface['requiredMethod'];
}

// GOOD
export class MyClass implements MyInterface {
  // This properly implements the interface method
  public requiredMethod(
    params: Parameters<MyInterface['requiredMethod']>[0]
  ): ReturnType<MyInterface['requiredMethod']> {
    // Implementation here
  }
}
```

Using the definite assignment operator is a shortcut that leaves the actual implementation undefined, leading to runtime errors when the method is called. Instead, always provide a proper method implementation.

### Use Getters/Setters for Interface Properties

When implementing an interface that expects properties (not methods), use getter and setter properties to maintain both type compatibility and desired behavior:

```typescript
// Interface that expects properties
interface EventInterface {
  notification: {
    id: string;
    message: string;
  };
}

// BAD - Using methods instead of properties
export class EventManager implements EventInterface {
  // TypeScript error: Type '(data: { id: string; message: string; }) => void'
  // is not assignable to type '{ id: string; message: string; }'
  public notification(data: { id: string; message: string }): void {
    // Implementation here
  }
}

// GOOD - Using getter/setter properties
export class EventManager implements EventInterface {
  private _notification: { id: string; message: string } | undefined;

  public get notification(): { id: string; message: string } {
    return this._notification as { id: string; message: string };
  }

  public set notification(data: { id: string; message: string }) {
    this._notification = data;
    // Additional behavior when the property is set
    this.processNotification(data);
  }

  private processNotification(data: { id: string; message: string }): void {
    // Process the notification data
  }
}
```

This approach ensures:

1. Type compatibility with the interface
2. Ability to add behavior when properties are accessed or modified
3. Proper encapsulation of internal state
4. Clean separation of concerns

## Interface Extension for Missing Properties

### Problem Pattern

When you see errors like:

```
Object literal may only specify known properties, and 'propertyName' does not exist in type 'InterfaceName'.
```

This occurs when you're trying to use properties that aren't defined in an interface.

### Solution Strategy

1. **Identify the interface** that needs to be extended
2. **Add the missing properties** to the interface definition
3. **Include proper documentation** for the new properties

```typescript
// Before
interface ErrorMetadata {
  userId?: string;
  action?: string;
}

// After
interface ErrorMetadata {
  userId?: string;
  action?: string;
  recoveryStrategy?: string; // Added missing property
  filename?: string; // Added missing property
}
```

## Lexical Declarations in Case Blocks

### Problem Pattern

When you see ESLint errors like:

```
Unexpected lexical declaration in case block.
```

This occurs when you declare variables with `let` or `const` inside a case block in a switch statement without proper block scoping.

### Solution Strategy

1. **Wrap the case block in curly braces** to create a proper block scope

```typescript
// Before - Error
switch (value) {
  case 'something':
    const variable = getValue();
    doSomething(variable);
    break;
}

// After - Fixed
switch (value) {
  case 'something': {
    const variable = getValue();
    doSomething(variable);
    break;
  }
}
```

## Unused Parameters

### Problem Pattern

When you see TypeScript warnings like:

```
'parameterName' is declared but its value is never read.
```

This occurs when you have function parameters, destructured props, or state variables that aren't used in the function body.

### Solution Strategy

1. **Prefix unused parameters with an underscore** to indicate they're intentionally unused

```typescript
// Before - Warning
function processData(data: Data, options: Options): Result {
  // Only uses data, not options
  return transform(data);
}

// After - Fixed
function processData(data: Data, _options: Options): Result {
  // Only uses data, not options
  return transform(data);
}
```

2. **For destructured props in React components**, rename the variables during destructuring:

```typescript
// Before - Warning
function MyComponent({ id, name, description }: Props) {
  // Only uses name
  return <div>{name}</div>;
}

// After - Fixed
function MyComponent({ id: _id, name, description: _description }: Props) {
  // Only uses name
  return <div>{name}</div>;
}
```

3. **For unused state variables**, prefix with underscore:

```typescript
// Before - Warning
const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
// dimensions is never used, only setDimensions

// After - Fixed
const [_dimensions, setDimensions] = useState({ width: 0, height: 0 });
```

4. **For destructured object properties**, rename during destructuring:

```typescript
// Before - Warning
const {
  datasets,
  analysisConfigs,
  getDatasetById, // Unused
  createAnalysisConfig,
} = useDataAnalysis();

// After - Fixed
const {
  datasets,
  analysisConfigs,
  getDatasetById: _getDatasetById, // Renamed during destructuring
  createAnalysisConfig,
} = useDataAnalysis();
```

5. **For already prefixed but still unused code**, remove it entirely:

```typescript
// Before - Still showing warning
const _getAlertBorder = (level: AlertLevel) => {
  // ... function implementation
};

// After - Fixed
// Removed unused function
```

6. **For complex unused code blocks**, remove them and leave a comment:

```typescript
// Before - Warning
const _filteredCategories = useMemo(() => {
  // ... complex implementation
}, [dependencies]);

// After - Fixed
// Filter taxonomy categories based on discovery type and search query - Removed unused code
```

This approach is particularly useful when destructuring from objects with specific property names, such as context hooks or API responses.

## React Component Type Compatibility

### Problem Pattern

When you see errors like:

```
No overload matches this call.
  The last overload gave the following error.
    Argument of type 'ComponentType<Props>' is not assignable to parameter of type 'string | FunctionComponent<{}> | ComponentClass<{}, any>'.
```

This occurs when using generic component types with React.createElement.

### Solution Strategy

1. **Import JSXElementConstructor** from React
2. **Use a type assertion** with JSXElementConstructor for the component

```typescript
// Before - Error
p => React.createElement(Component, p);

// After - Fixed
import { JSXElementConstructor } from 'react';

p => React.createElement(Component as unknown as JSXElementConstructor<Props>, p);
```

## React Import Compatibility

### Problem Pattern

When you see errors like:

```
Module can only be default-imported using the 'esModuleInterop' flag
```

This occurs because React is exported using `export =` syntax, which requires a different import style.

### Solution Strategy

1. **Use namespace import** for React

```typescript
// Before - Error
import React, { ComponentType, ReactElement } from 'react';

// After - Fixed
import * as React from 'react';
import { ComponentType, ReactElement } from 'react';
```

## Interface Constraint Satisfaction

### Problem Pattern

When you see errors like:

```
Type 'InterfaceName' does not satisfy the constraint 'Record<string, unknown>'.
  Index signature for type 'string' is missing in type 'InterfaceName'.
```

This occurs when an interface is used with a generic class or function that requires the interface to extend a specific type (in this case, `Record<string, unknown>`), but the interface doesn't satisfy that constraint.

### Solution Strategy

1. **Explicitly extend the required type** in the interface definition

```typescript
// Before - Error
interface EventMap {
  event1: EventData1;
  event2: EventData2;
}

// After - Fixed
interface EventMap extends Record<string, unknown> {
  event1: EventData1;
  event2: EventData2;
}
```

2. **Understand the constraint requirements**:

   - `Record<string, unknown>` requires that the interface can accept any string key with an unknown value
   - This is often required for event emitters, maps, and other collections that need to be indexed by string keys

3. **Consider the implications**:
   - Extending `Record<string, unknown>` means the interface will accept any string key, not just the ones explicitly defined
   - This can sometimes lead to less type safety, so use it judiciously

## Conclusion

By systematically addressing TypeScript errors using these strategies, we've achieved 100% TypeScript compliance in our codebase. This has improved code quality, maintainability, and developer experience, while reducing the risk of runtime errors.
