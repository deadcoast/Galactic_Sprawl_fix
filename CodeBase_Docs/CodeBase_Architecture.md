---
GALACTIC SPRAWL SYSTEM ARCHITECTURE
---

## Table of Contents

1. [Linter Configuration](#linter-configuration)
2. [Linting Workflow and Testing](#linting-workflow-and-testing)
3. [Linting Issue Fixes](#linting-issue-fixes)
   - [Fixing TypeScript `any` Types](#fixing-typescript-any-types)
   - [Fixing Unused Variables](#fixing-unused-variables)
4. [Type Safety Best Practices](#type-safety-best-practices)
5. [State Management Best Practices](#state-management-best-practices)
6. [Core Architecture Principles](#core-architecture-principles)
7. [Component Architecture](#component-architecture)
8. [System Integration Rules](#system-integration-rules)
9. [Critical Requirements](#critical-requirements)
10. [System-Specific Rules](#system-specific-rules)
11. [Development Guidelines](#development-guidelines)
12. [Event Handling Best Practices](#event-handling-best-practices)
13. [Case Block Lexical Declaration Best Practices](#case-block-lexical-declaration-best-practices)
14. [DOM Element Typing Best Practices](#dom-element-typing-best-practices)
15. [TypeScript Linting Issue Resolution](#typescript-linting-issue-resolution)
16. [Linting Progress](#linting-progress)

### Linter Configuration

- ESLint v9.20.1 with TypeScript support configured in `.eslintrc.json`
- Prettier configuration in `.prettierrc.json`
- JSON format used for configuration files to avoid CommonJS module issues
- Key linting rules:
  - No use of `var` (use `const` or `let` instead)
  - Warning for unused variables
  - Limited console statements (only `console.warn` and `console.error` allowed)
  - Special rules for test files
- Common linting issues to fix:
  - Replace `any` types with proper TypeScript types
  - Add curly braces to case blocks with lexical declarations
  - Remove unused variables and imports
  - Replace console.log statements with proper logging
- Run linter with `npx eslint [file-or-directory]` command
- Fix linting issues with `npx eslint --fix [file-or-directory]` command
- Created `eslint.config.js` using ESLint v9 format
- Configured TypeScript parser and rules
- Enhanced linting tools:

  - Added progress bar to `analyze-lint-errors.js` to provide visual feedback during execution
  - Progress bar shows percentage complete and number of files processed
  - Added status messages to indicate different stages of analysis (parsing, analyzing, generating report)
  - Improved `analyze-lint-errors.js` with:
    - Batch processing to prevent hanging with large inputs
    - Debug logging with `--debug` flag for troubleshooting
    - Option to disable progress bar with `--no-progress` flag
    - Configurable timeout with `--timeout=<ms>` option
    - Comprehensive error handling with try/catch blocks
    - Detailed error messages for better debugging
    - Memory-efficient processing of large codebases
  - Usage examples for `analyze-lint-errors.js`:

    ```bash
    # Basic usage
    npx eslint src/ --format json | node tools/analyze-lint-errors.js

    # With debug logging
    npx eslint src/ --format json | node tools/analyze-lint-errors.js --debug
    ```

### Linting Workflow and Testing

- Comprehensive linting workflow implemented with specialized tools:

  - `setup-linting.js` - Initializes and configures ESLint and Prettier
  - `analyze-lint-errors.js` - Analyzes ESLint output to categorize and prioritize errors
  - `fix-eslint-by-rule.js` - Fixes ESLint and Prettier issues by rule name or automatically
  - `track-eslint-progress.js` - Records linting status to track progress over time
  - `chart-lint-progress.js` - Generates ASCII chart showing progress over time
  - `run-lint-workflow.js` - Runs all linting tools in the correct order

- Systematic approach to fixing linting issues:

  1. Fix @typescript-eslint/no-explicit-any errors first (highest priority)
  2. Fix react-hooks/exhaustive-deps errors
  3. Fix no-console warnings
  4. Fix @typescript-eslint/no-unused-vars warnings
  5. Track progress after each batch of fixes
  6. Verify fixes with type checking and tests

- Current linting status (as of March 1, 2025):

  - Total issues: 22 (7 errors, 15 warnings)
  - Main issue types:
    - @typescript-eslint/no-explicit-any: 7 errors
    - @typescript-eslint/no-unused-vars: 9 warnings
    - no-console: 6 warnings

- Challenges and solutions:

  - Automated fix tools timing out on large files: Manually fix issues in problematic files
  - Complex type definitions: Create dedicated interfaces with optional properties
  - Legacy code integration: Prioritize fixing newer code first, then gradually refactor legacy code
  - React hook dependencies: Refactor hooks to use useCallback and useMemo to stabilize dependencies
  - Private property access in tests: Create proper API methods or use type assertions with unknown

- Best practices established:

  - Always use explicit return types for functions
  - Avoid using 'any' type - create interfaces instead
  - Prefix unused variables with underscore
  - Use appropriate console methods based on severity
  - Include all referenced variables in React hook dependency arrays
  - Use unknown instead of any for values of truly unknown type
  - Create dedicated interfaces for complex data structures
  - Use proper type guards with unknown instead of any
  - Avoid direct access to private properties in tests

- Progress tracking:
  - Use `track-eslint-progress.js --details` to record current status
  - Use `chart-lint-progress.js` to visualize progress
  - Use `analyze-lint-errors.js` to identify remaining issues
  - Document fixed files and issues in `CodeBase_Docs/CodeBase_Linting_Progress.md`

### Linting Issue Fixes

#### Fixing TypeScript `any` Types

When fixing `any` types, we follow these best practices:

1. **Use `unknown` for type guards**: Replace `any` with `unknown` in type guard functions to maintain type safety while allowing for runtime type checking.

   ```typescript
   // Before
   function isValidResource(obj: any): obj is Resource {
     return obj && typeof obj === 'object' && 'id' in obj;
   }

   // After
   function isValidResource(obj: unknown): obj is Resource {
     return obj !== null && obj !== undefined && typeof obj === 'object' && 'id' in obj;
   }
   ```

2. **Create specific interfaces for event data**: When handling events, create specific interfaces for the event data structure instead of using `any`.

   ```typescript
   // Before
   private handleModuleUpgraded = (event: any): void => {
     const { moduleId, newLevel } = event.data;
     // handle event
   };

   // After
   interface ModuleUpgradedEventData {
     moduleId: string;
     newLevel: number;
     previousLevel?: number;
   }

   private handleModuleUpgraded = (event: ModuleEvent): void => {
     const { moduleId, newLevel } = event.data as ModuleUpgradedEventData;
     // handle event
   };
   ```

3. **Use type assertions with caution**: When accessing private properties or methods, use type assertions with `unknown` as an intermediate step to avoid direct `any` usage.

   ```typescript
   // Before
   const config = (manager as any).configs.get(type);

   // After
   const config = (manager as unknown as { configs: Map<string, Config> }).configs.get(type);
   ```

4. **Create reusable utility types**: For common patterns, create reusable utility types to avoid repeating `any` types.

   ```typescript
   // Before
   function processData(data: any): any {
     // process data
   }

   // After
   type DataInput = Record<string, unknown>;
   type DataOutput = { processed: boolean; result: unknown };

   function processData(data: DataInput): DataOutput {
     // process data
   }
   ```

5. **Use generics for flexible typing**: When a function needs to work with different types, use generics instead of `any`.

   ```typescript
   // Before
   function convertMapToRecord(map: Map<string, any>): Record<string, any> {
     // conversion logic
   }

   // After
   function convertMapToRecord<K extends string, V>(map: Map<K, V>): Record<K, V> {
     // conversion logic
   }
   ```

6. **Proper API design for testing**: Instead of directly accessing private properties in tests, create proper API methods or use indirect approaches.

   ```typescript
   // Before (in test file)
   (flowManager as any).network.nodes = mockNodes;
   (flowManager as any).network.connections = mockConnections;

   // After (in test file)
   // Register nodes and connections through public API
   mockNodes.forEach(node => flowManager.registerNode(node));
   mockConnections.forEach(conn => flowManager.registerConnection(conn));

   // Or create a flow to set up the internal state
   const flow: ResourceFlow = {
     sourceId: 'source1',
     targetId: 'target1',
     resourceType: 'energy',
     amount: 100,
   };
   flowManager.addFlow(flow);
   ```

7. **Handle unknown types safely**: When working with unknown types, add proper type checking before accessing properties.

   ```typescript
   // Before
   function isHazard(obj: any): obj is Hazard {
     return obj && typeof obj === 'object' && 'id' in obj && 'position' in obj;
   }

   // After
   function isHazard(obj: unknown): obj is Hazard {
     return (
       obj !== null &&
       obj !== undefined &&
       typeof obj === 'object' &&
       'id' in obj &&
       'position' in obj
     );
   }
   ```

8. **Use Record with unknown for dynamic objects**: When dealing with objects with dynamic properties, use Record with unknown instead of any.

   ```typescript
   // Before
   const dynamicConfig: any = {};

   // After
   const dynamicConfig: Record<string, unknown> = {};
   ```

#### Fixing Unused Variables

For unused variables, we follow these practices:

1. **Remove unused variables**: Delete variables that are not used in the code.

2. **Use underscore for intentionally unused parameters**: Use `_` for parameters that are required by a function signature but not used in the function body.

   ```javascript
   // Before
   function processItems(items, callback) {
     // logic that doesn't use callback
   }

   // After
   function processItems(items, _) {
     // logic that doesn't use the second parameter
   }
   ```

3. **Use empty catch blocks**: For try/catch blocks where the error is not used, use an empty catch parameter.

   ```javascript
   // Before
   try {
     // risky operation
   } catch (error) {
     console.log('Operation failed');
   }

   // After
   try {
     // risky operation
   } catch {
     console.log('Operation failed');
   }
   ```

4. **Comment out variables for future use**: If a variable might be needed in the future, comment it out with a note.

   ```javascript
   // Before
   const result = calculateResult();
   const metadata = getMetadata(); // Not used yet

   // After
   const result = calculateResult();
   // const metadata = getMetadata(); // Will be used in future implementation
   ```

### Type Safety Best Practices

- Use proper type extensions for specialized interfaces
- Handle type conflicts by creating specific interfaces
- Use Omit/Pick for type modifications
- Maintain consistent type usage across components
- Use proper type assertions when necessary
- Create utility functions for type conversions
- Handle type assertions carefully with unknown intermediate
- Ensure proper type narrowing with type guards
- Use Position type for coordinate handling
- Keep geometry utilities in separate module

### State Management Best Practices

- Use React Context for global state
- Implement proper null checks
- Use early returns with null checks
- Destructure context values after null checks
- Use function expressions in components
- Handle type definition conflicts by:
  1. Using more specific type declarations from @types packages
  2. Updating TypeScript to latest version for better type definitions
  3. Creating custom type declarations to resolve conflicts
  4. Using type assertions when necessary to override conflicting types

### Core Architecture Principles

1. Type Safety & Management

   - Use TypeScript strict mode throughout
   - Create specific interfaces for type conflicts
   - Use Omit/Pick for type modifications
   - Implement proper type guards
   - Use 'as const' assertions for string literals
   - Handle type assertions with unknown intermediate
   - Maintain consistent type usage across components
   - Use Record<string, T> instead of Map for React Context

2. State Management

   - Use React Context for global state
   - Implement proper null checks
   - Use early returns with null checks
   - Destructure context values after null checks
   - Use function expressions in components
   - Maintain consistent context patterns

3. Performance Optimization
   - Use spatial partitioning for collision detection
   - Implement object pooling for particle systems
   - Offload heavy calculations to Web Workers
   - Use virtualization for large lists
   - Batch updates with requestAnimationFrame
   - Memoize expensive calculations
   - Use refs for mutable state
   - Implement proper cleanup for Web Workers

### Component Architecture

1. Function Organization

   - Define callbacks before hook usage
   - Keep related functions together
   - Use useCallback for dependency arrays
   - Place event handlers after hooks
   - Group similar functions together
   - Maintain consistent naming conventions

2. Effect Management

   - Implement proper cleanup in useEffect
   - Handle component lifecycle properly
   - Use proper cleanup for intervals
   - Manage automated process cleanup
   - Handle proper event cleanup
   - Implement proper animation cleanup

3. Visual Systems
   - Use consistent shader patterns
   - Scale effect intensity based on power
   - Maintain proper z-index ordering
   - Use appropriate blend modes
   - Implement proper cleanup for effects
   - Use quality-based particle systems

### System Integration Rules

1. Event System

   - Use centralized event bus
   - Implement proper event filtering
   - Handle event emission consistently
   - Use proper event subscription
   - Maintain proper cleanup
   - Handle time-based events properly

2. Resource Management

   - Implement proper threshold systems
   - Use proper type safety for resources
   - Handle resource transfers safely
   - Implement proper cleanup
   - Use proper validation
   - Maintain consistent state

3. Module System
   - Use proper type definitions
   - Implement proper cleanup
   - Handle lifecycle events
   - Maintain proper validation
   - Use consistent patterns
   - Handle dependencies properly

### Critical Requirements

1. Performance Requirements

   - Efficient canvas rendering
   - Optimized animation performance
   - Proper memory management
   - Efficient particle systems
   - Proper cleanup implementation
   - Frame rate optimization

2. Type Safety Requirements

   - Strict TypeScript mode
   - Proper interface definitions
   - Consistent type usage
   - Proper type guards
   - Safe type assertions
   - Proper generics usage

3. State Management Requirements
   - Proper context usage
   - Safe null handling
   - Consistent patterns
   - Proper cleanup
   - Safe type assertions
   - Proper event handling

### System-Specific Rules

1. Combat System

   - Use proper formation patterns
   - Implement damage control properly
   - Handle weapon systems safely
   - Manage emergency protocols
   - Handle proper cleanup
   - Maintain proper state

2. Resource System

   - Use proper threshold management
   - Implement safe transfers
   - Handle proper cleanup
   - Maintain consistent state
   - Use proper validation
   - Handle proper events

3. Module System [FULLY IMPLEMENTED]

   - Use proper type definitions
   - Implement proper cleanup
   - Handle lifecycle events
   - Maintain proper validation
   - Use consistent patterns
   - Handle dependencies properly
   - Implement attachment system
   - Create dynamic HUD components
   - Develop automation hooks
   - Implement sub-module support
   - Create status tracking system
   - Develop upgrade system
   - Integrate with resource system

4. Tech System
   - Use proper progression tracking
   - Implement safe requirements
   - Handle proper cleanup
   - Maintain consistent state
   - Use proper validation
   - Handle proper events

### Development Guidelines

1. Code Organization

   - Maintain modular architecture
   - Use consistent naming
   - Implement proper testing
   - Focus on performance
   - Document thoroughly
   - Handle cleanup properly

2. Testing Requirements

   - Unit test core systems
   - Integration test modules
   - Performance benchmarks
   - Browser compatibility
   - Visual regression
   - State management

3. Documentation Requirements
   - Clear component docs
   - System integration docs
   - Performance notes
   - Type safety docs
   - State management docs
   - Cleanup procedures

### Event Handling Best Practices

1. **Use Proper Event Types**: Always use the correct event type from the event system (e.g., `ModuleEvent` from ModuleEvents.ts) instead of using `any` for event parameters.

2. **Type-Safe Event Data Access**: Use optional chaining and type assertions when accessing event data properties:

   ```typescript
   // Unsafe
   const { status, reason } = event.data;

   // Safe
   const status = event.data?.status as ExtendedModuleStatus | undefined;
   const reason = event.data?.reason as string | undefined;
   ```

3. **Define Alert Interfaces**: Create proper interfaces for alert objects instead of using generic types:

   ```typescript
   export interface ModuleAlert {
     level: 'info' | 'warning' | 'error' | 'critical';
     message: string;
     timestamp: number;
     acknowledged: boolean;
   }
   ```

4. **Type-Safe Event Emission**: When emitting events, ensure all required properties are properly typed:

   ```typescript
   moduleEventBus.emit({
     type: 'STATUS_CHANGED' as ModuleEventType,
     moduleId,
     moduleType: module.type,
     timestamp: Date.now(),
     data: {
       status,
       previousStatus: statusDetails.previousStatus,
       reason,
     },
   });
   ```

5. **Null Checks in Event Handlers**: Always check for null/undefined values in event handlers:

   ```typescript
   private handleErrorOccurred = (event: ModuleEvent): void => {
     const { moduleId } = event;
     const level = event.data?.level as 'info' | 'warning' | 'error' | 'critical' | undefined;
     const message = event.data?.message as string | undefined;

     // Add alert only if message exists
     if (message) {
       this.addAlert(moduleId, level || 'error', message);
     }
   };
   ```

6. **Default Values for Optional Properties**: Provide default values for optional properties:

   ```typescript
   this.updateModuleStatus(moduleId, 'critical', message || 'Critical error occurred');
   ```

7. **Type-Safe Collections**: Use proper typing for collections of events or alerts:

   ```typescript
   public getModuleAlerts(moduleId: string, onlyUnacknowledged = false): ModuleAlert[] {
     const alerts = this.moduleStatuses.get(moduleId)?.alerts || [];
     return onlyUnacknowledged ? alerts.filter(alert => !alert.acknowledged) : alerts;
   }
   ```

8. **Event Subscription Type Safety**: Ensure event subscriptions use the correct event types:

   ```typescript
   moduleEventBus.subscribe('MODULE_CREATED' as ModuleEventType, this.handleModuleCreated);
   ```

9. **Cleanup Type Safety**: Properly type and check cleanup functions:

   ```typescript
   const unsubscribeCreated = moduleEventBus.subscribe(
     'MODULE_CREATED' as ModuleEventType,
     this.handleModuleCreated
   );

   if (typeof unsubscribeCreated === 'function') {
     unsubscribeCreated();
   }
   ```

10. **Event Data Validation**: Validate event data before using it:
    ```typescript
    if (status && status !== this.getModuleStatus(moduleId)) {
      this.updateModuleStatus(moduleId, status, reason);
    }
    ```

### Case Block Lexical Declaration Best Practices

When working with switch statements in TypeScript/JavaScript, follow these best practices to avoid lexical declaration errors:

1. **Always Use Curly Braces for Case Blocks with Lexical Declarations**: When a case block contains variable declarations using `let` or `const`, always wrap the entire case block in curly braces to create proper block scoping.

   ```typescript
   // Incorrect - will cause linting errors
   switch (type) {
     case 'resource':
       const amount = calculateAmount();
       processResource(amount);
       break;
   }

   // Correct - proper block scoping
   switch (type) {
     case 'resource': {
       const amount = calculateAmount();
       processResource(amount);
       break;
     }
   }
   ```

### DOM Element Typing Best Practices

When working with DOM elements in TypeScript, follow these best practices to ensure type safety:

1. **Use Specific Element Types Instead of Any**: Instead of using `any` for DOM elements, use the appropriate HTML element types.

2. **Use More Specific Element Types When Possible**: Use the most specific element type that applies.

3. **Use Event Types for Event Handlers**: Use the appropriate event types for event handlers.

4. **Type Event Target Correctly**: When accessing properties on event targets, use type assertions with the appropriate element type.

5. **Use Element Collections with Proper Types**: When working with element collections, use the appropriate collection types.

6. **Type Custom Elements Correctly**: For custom elements, create interfaces that extend HTMLElement.

7. **Use Record for Element Dictionaries**: When storing elements in a dictionary, use Record with the appropriate element type.

8. **Handle Null Values Safely**: Always handle potential null values when querying DOM elements.

### TypeScript Linting Issue Resolution

#### Approach to Fixing Explicit `any` Types

1. **Identify the context**: Examine how the variable is used to understand its structure and purpose.
2. **Create specific interfaces/types**: Define custom interfaces or types that accurately represent the data structure.
3. **Apply the new type**: Replace the `any` type with the newly created specific type.
4. **Verify with ESLint**: Run ESLint to confirm the issue is resolved.

#### Best Practices for Type Safety

1. **Use unknown instead of any**: When the exact type is not known, use `unknown` instead of `any` and add proper type guards.
2. **Create partial types when appropriate**: Use `Partial<T>` when only some properties might be present.
3. **Use union types for specific values**: Define allowed values using union types (e.g., `'active' | 'inactive'`).
4. **Document type relationships**: Add comments explaining the purpose and usage of custom types.
5. **Use consistent naming conventions**: Name interfaces and types clearly to indicate their purpose.
6. **Verify fixes with ESLint**: Always run ESLint after making changes to ensure the issue is resolved.

### Linting Progress

The codebase has been configured with ESLint v9 and TypeScript-ESLint to enforce code quality standards. We are systematically addressing linting issues across the codebase, focusing on:

1. Fixing TypeScript explicit any errors
2. Addressing lexical declaration errors in case blocks
3. Resolving promise executor errors
4. Removing console statement warnings

We've created documentation to track common linting issues and their solutions, and we're updating the architecture documentation with type safety best practices.
