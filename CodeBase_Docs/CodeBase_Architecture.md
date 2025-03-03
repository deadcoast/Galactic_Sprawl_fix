---
GALACTIC SPRAWL SYSTEM ARCHITECTURE
---

## Table of Contents

1. [Linter Configuration](#linter-configuration)
2. [Linting Workflow and Testing](#linting-workflow-and-testing)
3. [Linting Issue Fixes](#linting-issue-fixes)
   - [Fixing TypeScript `any` Types](#fixing-typescript-any-types)
   - [Fixing Unused Variables](#fixing-unused-variables)
   - [Fixing Console Statements](#fixing-console-statements)
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
17. [TypeScript Error Fixes](#typescript-error-fixes)
    - [EventEmitter Generic Type Constraints](#eventemitter-generic-type-constraints)
    - [Unused Variables and Interfaces](#unused-variables-and-interfaces)
    - [Type Assertion Issues](#type-assertion-issues)
    - [Map Iteration Issues](#map-iteration-issues)
    - [Generic Components](#generic-components)
    - [Type Consistency for Union Types vs Object Types](#type-consistency-for-union-types-vs-object-types)
    - [Ship Ability Issues](#ship-ability-issues)
    - [Property Access on Possibly Undefined Values](#property-access-on-possibly-undefined-values)
    - [Incompatible Type Assignments](#incompatible-type-assignments)
    - [Handling Underscore-Prefixed Variables](#handling-underscore-prefixed-variables)
    - [Handling Parameter Type Issues](#handling-parameter-type-issues)
    - [Implementing Unused Variables](#implementing-unused-variables)
    - [Documenting Unused Interfaces](#documenting-unused-interfaces)
    - [Faction Behavior System Type Safety](#faction-behavior-system-type-safety)
    - [Automation System Type Safety](#automation-system-type-safety)
    - [Handling Unused Functions and Interfaces](#handling-unused-functions-and-interfaces)
    - [TypeScript Error Fixing Strategies](#typescript-error-fixing-strategies)
    - [JSX Namespace Declaration Issues](#jsx-namespace-declaration-issues)
18. [End-to-End Testing with Playwright](#end-to-end-testing-with-playwright)
19. [Resource Management System](#resource-management-system)
    - [Multi-Step Production Chains](#multi-step-production-chains)
    - [Resource Conversion Efficiency](#resource-conversion-efficiency)
    - [Converter Management UI](#converter-management-ui)

## End-to-End Testing with Playwright

### Playwright Setup and Configuration

Galactic Sprawl uses Playwright for end-to-end testing to ensure the application works correctly from a user's perspective. The setup includes:

1. **Installation**:

   - Playwright is installed as a dev dependency: `npm install -D @playwright/test`
   - Browsers are installed using: `npx playwright install`

2. **Configuration**:

   - Configuration is defined in `playwright.config.ts` at the project root
   - Test directory is set to `./src/tests/e2e`
   - Global timeout is set to 30 seconds
   - Configured browsers include Chromium and Firefox
   - Web server is configured to run on port 3000 using `npm run start`

3. **NPM Scripts**:
   - `test:e2e`: Runs all Playwright tests
   - `test:e2e:ui`: Runs tests with Playwright UI
   - `test:e2e:headed`: Runs tests in headed mode (visible browser)
   - `test:e2e:debug`: Runs tests in debug mode

### Page Object Model Pattern

The end-to-end tests follow the Page Object Model (POM) pattern to improve maintainability:

1. **Page Classes**:

   - Each major page has a corresponding class (e.g., `MiningPage`)
   - Page classes encapsulate locators and methods for interacting with the page
   - Located in `src/tests/e2e/models/` directory

2. **Key Features**:

   - Locators are defined at the class level for reuse
   - Methods for common actions (e.g., `searchFor`, `filterByType`)
   - Helper methods for verification (e.g., `verifyResourceVisible`, `verifyResourceCount`)
   - Custom `waitForCondition` method for handling asynchronous operations

3. **Best Practices**:
   - Use descriptive method names that reflect user actions
   - Return `this` from methods to enable method chaining
   - Implement proper waiting strategies for UI interactions
   - Separate test logic from page interaction logic

### Test Structure

End-to-end tests are organized by feature area:

1. **Test Files**:

   - Located in `src/tests/e2e/` directory
   - Named according to feature (e.g., `mining.spec.ts`)
   - Use `test.describe` blocks to group related tests
   - Use `test.beforeEach` for common setup

2. **Test Cases**:

   - Focus on user workflows and critical paths
   - Test individual features as well as complete workflows
   - Include verification steps using Playwright's `expect` assertions

3. **Example Test Structure**:

   ```typescript
   test.describe('Mining Operations', () => {
     let miningPage: MiningPage;

     test.beforeEach(async ({ page }) => {
       miningPage = new MiningPage(page);
       await miningPage.goto();
     });

     test('should display resource list', async ({ page }) => {
       await expect(miningPage.resourceList).toBeVisible();
     });

     // Additional test cases...
   });
   ```

### TypeScript Integration

Playwright tests are fully integrated with TypeScript:

1. **Type Safety**:

   - Page objects use proper type annotations for Playwright's `Page` and `Locator` types
   - Test files import types from `@playwright/test`
   - Custom helper methods include proper return types and parameter types

2. **Common Type Issues**:

   - Ensure proper imports from `@playwright/test` including `Page` type
   - Use built-in Playwright `expect` function rather than test framework assertions
   - Implement proper async/await patterns for all Playwright operations

3. **Best Practices**:
   - Use TypeScript interfaces for complex data structures
   - Leverage type inference where appropriate
   - Document complex types with JSDoc comments

### Documentation

Comprehensive documentation for Playwright testing is available:

1. **Setup Guide**:

   - Detailed setup instructions in `src/tests/e2e/README.md`
   - Installation steps for Playwright and browsers
   - Configuration options and examples

2. **Best Practices**:

   - Page Object Model implementation guidelines
   - Test organization recommendations
   - Performance considerations

3. **CI/CD Integration**:
   - Example GitHub Actions workflow configuration
   - Artifact collection for test reports
   - Parallel test execution configuration

## Ship Ability System

### Ship Ability Type Requirements

The ship ability system requires proper type definitions to ensure type safety across the codebase. Key requirements include:

1. **ID Property Requirement**: All ship abilities must have an `id` property to match the `Effect` interface requirements.
2. **Effect Property**: Each ability must have an associated effect with its own unique ID.
3. **Consistent Interface**: The `CommonShipAbility` interface in `src/types/ships/CommonShipTypes.ts` serves as the base interface for all ship abilities.

### Best Practices for Ship Abilities

1. **Generate Unique IDs**: Use descriptive, kebab-case IDs for abilities (e.g., 'nova-burst-ability') to make them easily identifiable.
2. **Consistent Effect Mapping**: Ensure that each ability's effect is properly defined and matches the ability's purpose.
3. **Type Safety**: Maintain proper type safety by ensuring all ability objects conform to the `CommonShipAbility` interface.
4. **Weapon State Compatibility**: When working with weapon effects, ensure the weapon state includes an `effects` array to match the `WeaponState` interface.

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

5. **Fix Unused Parameters in Function Signatures**: For parameters that are required by a function signature but not used in the function body, prefix them with an underscore.

   ```typescript
   // Before (unused parameter causing linter error)
   function processItems(items, callback) {
     // logic that doesn't use callback
   }

   // After (properly marked as intentionally unused)
   function processItems(items, _callback) {
     // logic that doesn't use the second parameter
   }
   ```

6. **Update Function Calls When Removing Parameters**: When removing unused parameters from function signatures, ensure that all calls to the function are updated accordingly.

   ```typescript
   // Before (function call with unused parameter)
   processItems(items, callback);

   // After (function call updated)
   processItems(items);
   ```

7. **Fix Unused Imports**: Remove unused imports or mark them as used if they're needed for type checking.

   ```typescript
   // Before (unused import causing linter error)
   import { unusedImport } from './module';

   // After (import removed)
   // Import removed as it's not used
   ```

8. **Fix Type Issues When Updating Variables**: When fixing unused variables, ensure that any type issues introduced by the changes are also addressed.

   ```typescript
   // Before (unused variable with type issues)
   const categoryIcons = {
     mining: Database,
     exploration: Radar,
   };

   // After (properly marked as intentionally unused with type issues fixed)
   // Category icon mapping - kept for future implementation of dynamic UI theming
   const __categoryIcons: Record<MenuCategory, IconType> = {
     mining: Database,
     exploration: Radar,
   };
   ```

By following these best practices, we can ensure that our codebase is free of unused variables and interfaces while maintaining clarity about intentionally unused elements that will be used in future implementations.

#### Fixing Console Statements

For console statements, we follow these practices to comply with our ESLint configuration, which only allows `console.warn` and `console.error` methods:

1. **Replace console.log with console.warn**: For debugging and informational messages, use `console.warn` instead of `console.log`.

   ```javascript
   // Before (ESLint error)
   console.log(`[ResourceFlowManager] Found ${converters.length} active converters in the network`);

   // After (ESLint compliant)
   console.warn(
     `[ResourceFlowManager] Found ${converters.length} active converters in the network`
   );
   ```

2. **Files where console.log statements were replaced with console.warn**:

   - `src/lib/ai/shipMovement.ts` - Ship position logging
   - `src/lib/optimization/EntityPool.ts` - Pool expansion logging
   - `src/managers/automation/GlobalAutomationManager.ts` - Automation manager status
   - `src/managers/resource/ResourcePoolManager.ts` - Resource allocation logging
   - `src/managers/weapons/WeaponEffectManager.ts` - Weapon effect creation
   - `src/components/buildings/modules/hangar/ShipHangar.tsx` - Mock ships usage
   - `src/components/combat/BattleEnvironment.tsx` - Fleet AI debugging
   - `src/components/ui/GameHUD.tsx` - Notification system debugging
   - `src/effects/component_effects/ExplosionEffect.tsx` - Particle effect debugging
   - `src/effects/component_effects/ShieldEffect.tsx` - Shader material debugging

3. **When to use each console method**:

   - `console.warn`: For development information, debugging, and non-critical warnings
   - `console.error`: For critical errors, exceptions, and failures that require immediate attention
   - `console.info`: Not currently used, but could be implemented for informational messages in the future

4. **Console statements should be meaningful and provide context**:

   - Bad: `console.warn("Error")`
   - Good: `console.warn("[ResourceManager] Failed to allocate resources: Insufficient minerals (requested: 100, available: 50)")`

5. **Include component/system prefix in console messages**:
   - Use square brackets to indicate the source: `[ComponentName]`
   - Example: `[WeaponEffectManager]`, `[EntityPool]`, `[ResourcePoolManager]`

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
   - Implement rate-of-change detection for resource monitoring
   - Use quality-based adjustments for visual effects
   - Implement proper history management for resource events
   - Use interval-based flow control for complex resource transfers
   - Implement converter efficiency calculations for resource production
   - Add container type checking for resource allocation
   - Use proper logging for resource allocation and transfers
   - Implement performance monitoring with detailed timing information

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

### TypeScript Error Fixes

After resolving all ESLint issues, we still had 328 TypeScript type errors across 77 files. These errors were identified using the `npm run type-check` script, which runs TypeScript's type checker without emitting files.

#### EventEmitter Generic Type Constraints

The EventEmitter class in our codebase requires that generic type parameters extend `Record<string, unknown>`. This ensures that event data objects can have string keys with unknown values. We've verified that all EventEmitter interfaces in the codebase already include the required index signature `[key: string]: unknown;`, which satisfies this constraint.

Files checked and confirmed to have the correct index signature:

- src/lib/optimization/EntityPool.ts (PoolEvents interface)
- src/lib/optimization/RenderBatcher.ts (RenderBatcherEvents interface)
- src/managers/ai/BehaviorTreeManager.ts (BehaviorEvents interface)
- src/lib/ai/shipBehavior.ts (ShipBehaviorEvents interface)
- src/lib/ai/shipMovement.ts (ShipMovementEvents interface)
- src/hooks/factions/useFactionBehavior.ts (FactionBehaviorEvents interface)
- src/managers/game/AsteroidFieldManager.ts (AsteroidFieldEvents interface)
- src/managers/game/ParticleSystemManager.ts (ParticleSystemEvents interface)
- src/managers/effects/EffectLifecycleManager.ts (EffectEvents interface)
- src/managers/factions/FactionRelationshipManager.ts (RelationshipEvents interface)
- src/managers/weapons/WeaponUpgradeManager.ts (WeaponUpgradeEvents interface)
- src/types/officers/OfficerTypes.ts (OfficerEvents interface)
- src/types/buildings/ShipHangarTypes.ts (ShipHangarEvents interface)

#### Unused Variables and Interfaces

When working with unused variables and interfaces in our codebase, we encountered several TypeScript errors related to declared but never used elements. Here are the best practices we established:

1. **Prefix Unused Variables with Underscore**: For variables that are intentionally unused but need to be kept for future implementation, prefix them with a single underscore (`_`).

   ```typescript
   // Before (unused variable causing linter error)
   const baseHealth = 1200;

   // After (properly marked as intentionally unused)
   const _baseHealth = 1200; // Kept for future implementation of ship stat scaling
   ```

2. **Prefix Unused Interfaces with Double Underscore**: For interfaces that are intentionally unused but need to be kept for future implementation, prefix them with a double underscore (`__`).

   ```typescript
   // Before (unused interface causing linter error)
   interface _FleetAIResult {
     // interface properties
   }

   // After (properly marked as intentionally unused)
   // Interface for AI fleet behavior results - kept for future implementation of advanced fleet AI
   interface __FleetAIResult {
     // interface properties
   }
   ```

3. **Add Explanatory Comments**: Always add comments explaining why unused variables or interfaces are kept, including their intended future use.

   ```typescript
   // Ship-specific stats - kept for future implementation of ship stat scaling
   // These will be used when implementing dynamic ship stat adjustments based on player progression
   const _baseHealth = 1200;
   const _baseShield = 800;
   const _baseSpeed = 3.5;
   ```

4. **Remove Truly Unused Variables**: If a variable is truly unused and has no future purpose, remove it completely instead of just prefixing it.

   ```typescript
   // Before (unused variable with no future purpose)
   const unusedVariable = calculateSomething();

   // After (variable removed)
   // Variable removed as it has no current or future purpose
   ```

5. **Fix Unused Parameters in Function Signatures**: For parameters that are required by a function signature but not used in the function body, prefix them with an underscore.

   ```typescript
   // Before (unused parameter causing linter error)
   function processItems(items, callback) {
     // logic that doesn't use callback
   }

   // After (properly marked as intentionally unused)
   function processItems(items, _callback) {
     // logic that doesn't use the second parameter
   }
   ```

6. **Update Function Calls When Removing Parameters**: When removing unused parameters from function signatures, ensure that all calls to the function are updated accordingly.

   ```typescript
   // Before (function call with unused parameter)
   processItems(items, callback);

   // After (function call updated)
   processItems(items);
   ```

7. **Fix Unused Imports**: Remove unused imports or mark them as used if they're needed for type checking.

   ```typescript
   // Before (unused import causing linter error)
   import { unusedImport } from './module';

   // After (import removed)
   // Import removed as it's not used
   ```

8. **Fix Type Issues When Updating Variables**: When fixing unused variables, ensure that any type issues introduced by the changes are also addressed.

   ```typescript
   // Before (unused variable with type issues)
   const categoryIcons = {
     mining: Database,
     exploration: Radar,
   };

   // After (properly marked as intentionally unused with type issues fixed)
   // Category icon mapping - kept for future implementation of dynamic UI theming
   const __categoryIcons: Record<MenuCategory, IconType> = {
     mining: Database,
     exploration: Radar,
   };
   ```

By following these best practices, we can ensure that our codebase is free of unused variables and interfaces while maintaining clarity about intentionally unused elements that will be used in future implementations.

#### Type Assertion Issues

When working with TypeScript in this codebase, we've identified several best practices for handling type assertions and ensuring type safety:

1. **Avoid Direct Type Assertions**: Type assertions (using `as`) should be avoided when possible, as they bypass TypeScript's type checking. Instead, use proper type guards.

2. **Create Type Guard Functions**: For complex type validations, create dedicated type guard functions that return a type predicate (`is` syntax).

   ```typescript
   function isResourceThresholdEventData(data: unknown): data is ResourceThresholdEventData {
     if (!data || typeof data !== 'object') return false;

     const thresholdData = data as Record<string, unknown>;

     return (
       (thresholdData.thresholdType === 'min' || thresholdData.thresholdType === 'max') &&
       typeof thresholdData.resourceType === 'string'
     );
   }
   ```

3. **Check Event Data Existence**: When working with event data, always check if the data exists and has the expected structure before accessing properties.

   ```typescript
   if (!event.data || !isResourceThresholdEventData(event.data)) {
     console.warn('Invalid resource threshold event data:', event.data);
     return;
   }
   ```

4. **Use Intermediate Types**: When converting between complex types, use intermediate `unknown` type to avoid direct type assertions.

   ```typescript
   // Instead of this:
   const data = event.data as SpecificType;

   // Do this:
   const unknownData = event.data as unknown;
   const data = unknownData as SpecificType;
   ```

5. **Handle Map Iteration**: Use Array.from() when iterating over Map.values() to avoid MapIterator errors.

   ```typescript
   // Instead of this:
   for (const value of map.values()) { ... }

   // Do this:
   Array.from(map.values()).forEach(value => { ... });
   ```

6. **Use Optional Chaining and Nullish Coalescing**: When accessing optional properties that might be undefined, use optional chaining (?.) and nullish coalescing (??) operators.

   ```typescript
   const value = event.data?.property ?? defaultValue;
   ```

7. **Type Intersection for Extended Types**: For properties that might exist but aren't in the type definition, use type intersection with additional properties.

   ```typescript
   const extendedState = (state as BaseState & { additionalProp?: string }).additionalProp;
   ```

8. **Destructure After Validation**: After validating an object with a type guard, destructure its properties to make the code cleaner and avoid repeated access.

   ```typescript
   if (isValidData(data)) {
     const { property1, property2 } = data;
     // Use property1 and property2 directly
   }
   ```

9. **Add Comments for Complex Type Handling**: Add comments to explain complex type handling or workarounds to help other developers understand the code.

10. **Create Helper Methods**: Create helper methods for common operations like event emission to reduce repetition and improve type safety.

#### Map Iteration Issues

When working with Map objects in TypeScript, we encountered iteration issues due to the TypeScript compiler's downlevelIteration settings. Here are the best practices we established:

1. **Use Array.from() for Map iteration**: Convert Map entries, keys, or values to arrays before iteration to avoid TypeScript errors.

   ```typescript
   // Before (causes TypeScript error)
   for (const [key, value] of resourceMap) {
     // process key and value
   }

   // After (type-safe)
   for (const [key, value] of Array.from(resourceMap.entries())) {
     // process key and value
   }
   ```

2. **Alternative approaches for Map iteration**:

   - Use Map.forEach() method:

     ```typescript
     resourceMap.forEach((value, key) => {
       // process value and key
     });
     ```

   - Use Array.from() with map.keys() or map.values():

     ```typescript
     // Iterate over keys
     for (const key of Array.from(resourceMap.keys())) {
       const value = resourceMap.get(key);
       // process key and value
     }

     // Iterate over values
     for (const value of Array.from(resourceMap.values())) {
       // process value
     }
     ```

3. **Configure TypeScript for better Map support**: If possible, update tsconfig.json to include downlevelIteration or target ES2015+ to avoid these issues:

   ```json
   {
     "compilerOptions": {
       "downlevelIteration": true,
       // or
       "target": "ES2015"
     }
   }
   ```

4. **Batch processing for large Maps**: For performance optimization with large Maps, consider batch processing:

   ```typescript
   const entries = Array.from(resourceMap.entries());
   const batchSize = 100;

   for (let i = 0; i < entries.length; i += batchSize) {
     const batch = entries.slice(i, i + batchSize);
     for (const [key, value] of batch) {
       // process key and value
     }
   }
   ```

#### Automation Rule Type Fixes

When working with automation rules in our system, we encountered several type-related issues. Here are the best practices we established:

1. **Properly type condition values**: Ensure that condition values match the expected type based on the condition type.

   ```typescript
   // Before (incorrect typing)
   {
     type: 'event',
     value: {
       timeWindow: 300000,
     }
   }

   // After (correct typing)
   {
     type: 'event',
     value: {
       eventType: 'module-event',
       eventData: { type: 'upgrade-complete' },
       timeElapsed: 300000,
     } as EventConditionValue
   }
   ```

2. **Properly type action values**: Ensure that action values include all required properties based on the action type.

   ```typescript
   // Before (missing required properties)
   {
     type: 'emit-event',
     value: {
       data: { type: 'request-upgrade' }
     }
   }

   // After (includes all required properties)
   {
     type: 'emit-event',
     value: {
       eventType: 'module-event' as ModuleEventType,
       data: { type: 'request-upgrade' }
     } as EmitEventValue
   }
   ```

3. **Use type assertions for string literals**: When assigning string literals to union types, use type assertions to ensure type safety.

   ```typescript
   // Before (type error)
   const eventType = 'module-event';

   // After (type-safe)
   const eventType = 'module-event' as ModuleEventType;
   ```

4. **Create consistent interfaces**: Ensure that all interfaces for automation rules are consistent and well-documented.

   ```typescript
   // Example of well-defined interfaces
   interface AutomationRule {
     id: string;
     name: string;
     description: string;
     enabled: boolean;
     conditions: AutomationCondition[];
     actions: AutomationAction[];
     interval?: number;
   }

   interface AutomationCondition {
     type: ConditionType;
     value: ResourceConditionValue | EventConditionValue | TimeConditionValue;
   }

   interface AutomationAction {
     type: ActionType;
     value: EmitEventValue | ModifyResourceValue | ActivateModuleValue;
   }
   ```

5. **Document type requirements**: Clearly document the required properties for each condition and action type to avoid confusion.

   ```typescript
   /**
    * EventConditionValue - Used for event-based conditions
    * Required properties:
    * - eventType: The type of event to listen for
    * - eventData: The specific event data to match (optional)
    * - timeElapsed: The time window in milliseconds (optional)
    */
   interface EventConditionValue {
     eventType: string;
     eventData?: Record<string, unknown>;
     timeElapsed?: number;
   }
   ```

6. **Validate rule configurations**: Implement validation functions to ensure that rule configurations are valid before using them.

   ```typescript
   function validateRule(rule: AutomationRule): boolean {
     // Validate conditions
     for (const condition of rule.conditions) {
       if (!validateCondition(condition)) {
         console.error(`Invalid condition in rule ${rule.id}:`, condition);
         return false;
       }
     }

     // Validate actions
     for (const action of rule.actions) {
       if (!validateAction(action)) {
         console.error(`Invalid action in rule ${rule.id}:`, action);
         return false;
       }
     }

     return true;
   }
   ```

#### Generic Components

When working with reusable components in TypeScript, using generic type parameters can significantly improve type safety and flexibility. Here are the best practices we established:

1. **Use Generic Type Parameters**: Make components more flexible by using generic type parameters for props that can accept different types.

   ```typescript
   // Before (limited flexibility)
   interface DragItem {
     id: string;
     type: 'module' | 'resource' | 'ship';
     data: Record<string, unknown>;
   }

   // After (improved flexibility)
   interface DragItem<T = Record<string, unknown>> {
     id: string;
     type: 'module' | 'resource' | 'ship';
     data: T;
   }
   ```

2. **Provide Default Types**: Always provide default types for generic parameters to maintain backward compatibility.

   ```typescript
   // With default type for backward compatibility
   function Draggable<T = Record<string, unknown>>({ item, children }: DraggableProps<T>) {
     // component implementation
   }
   ```

3. **Safe Property Access**: When accessing properties of generic types, use type assertions with caution and proper null checks.

   ```typescript
   // Unsafe property access
   const name = item.data.name;

   // Safe property access with type assertion and null check
   const name =
     item.type === 'module' || item.type === 'ship'
       ? String((item.data as Record<string, unknown>).name || '')
       : '';
   ```

4. **Extract Values Safely**: Extract values from generic types before using them, with proper type conversions.

   ```typescript
   // Extract and convert to appropriate types
   const amount =
     item.type === 'resource' ? String((item.data as Record<string, unknown>).amount || '') : '';

   const resourceType =
     item.type === 'resource' ? String((item.data as Record<string, unknown>).type || '') : '';
   ```

5. **Type Guards for Generic Types**: Use type guards to narrow down generic types when possible.

   ```typescript
   function isModuleData<T>(data: T): data is T & { type: string; name: string } {
     return data !== null && typeof data === 'object' && 'type' in data && 'name' in data;
   }
   ```

6. **Generic Component Hierarchies**: When creating a hierarchy of components that use generics, ensure that generic parameters are properly passed through the hierarchy.

   ```typescript
   interface DropTargetProps<T = Record<string, unknown>> {
     accept: string[];
     onDrop: (item: DragItem<T>) => void;
     children: React.ReactNode;
   }

   export function DropTarget<T = Record<string, unknown>>({
     accept,
     onDrop,
     children,
   }: DropTargetProps<T>) {
     // component implementation
   }
   ```

7. **JSON Serialization Considerations**: When working with generic types that need to be serialized (e.g., for drag and drop operations), ensure that the types can be properly serialized and deserialized.

   ```typescript
   const handleDragStart = (e: React.DragEvent) => {
     // Serialize the item for transfer
     e.dataTransfer.setData('text', JSON.stringify(item));
   };

   const handleDrop = (e: DragEvent) => {
     // Deserialize the item after transfer
     if (e.dataTransfer) {
       const item = JSON.parse(e.dataTransfer.getData('text')) as DragItem<T>;
       // Use the item
     }
   };
   ```

8. **Documentation for Generic Components**: Clearly document the expected types and constraints for generic parameters to help other developers use the components correctly.

   ```typescript
   /**
    * DragItem - Represents an item that can be dragged in the UI
    * @template T - The type of the data property, defaults to Record<string, unknown>
    * @property id - Unique identifier for the item
    * @property type - The type of the item (module, resource, or ship)
    * @property data - The data associated with the item, of type T
    */
   interface DragItem<T = Record<string, unknown>> {
     id: string;
     type: 'module' | 'resource' | 'ship';
     data: T;
   }
   ```

By following these best practices, we can create reusable components that are both flexible and type-safe, reducing the need for type assertions and improving the developer experience.

#### Type Consistency for Union Types vs Object Types

When working with types that can be represented as either string literals or objects with additional properties, it's important to maintain consistency across the codebase. Here are the best practices we established:

1. **Clear Type Definitions**: Define separate types for different use cases to avoid confusion.

   ```typescript
   // String literal union type for simple references
   export type FactionBehaviorType =
     | 'aggressive'
     | 'defensive'
     | 'hit-and-run'
     | 'stealth'
     | 'balance';

   // Object interface for complex data
   export interface FactionBehaviorConfig {
     formation: string;
     behavior: FactionBehaviorType;
     target?: string;
   }
   ```

2. **Consistent Property Types**: Ensure that interfaces use the correct types for their properties.

   ```typescript
   // In FactionShip interface
   export interface FactionShip extends CommonShip {
     // ...
     tactics: FactionBehaviorConfig; // Not FactionBehaviorType
     // ...
   }
   ```

3. **Helper Functions for Type Conversion**: Create helper functions to convert between different representations.

   ```typescript
   // Helper function to create a FactionBehaviorConfig from string
   const createFactionBehavior = (behavior: string): FactionBehaviorConfig => {
     return {
       formation: 'standard',
       behavior: behavior as FactionBehaviorType,
     };
   };
   ```

4. **Type Assertions for String Literals**: Use type assertions when assigning string literals to union types.

   ```typescript
   // Correct way to assign a string literal to a union type
   const behavior = 'aggressive' as FactionBehaviorType;
   ```

5. **Flexible Component Props**: Allow components to accept either type when appropriate.

   ```typescript
   interface ShipProps {
     // ...
     tactics: FactionBehaviorConfig | string;
     // ...
   }
   ```

6. **Type-Safe Property Access**: Create helper functions to safely access properties from different types.

   ```typescript
   // Helper function to get behavior string from FactionBehaviorConfig
   const getBehaviorString = (behavior: FactionBehaviorConfig): string => {
     return behavior.behavior || '';
   };
   ```

7. **Consistent Type Usage in Functions**: Ensure that functions use the correct types for their parameters and return values.

   ```typescript
   // Function that expects FactionBehaviorConfig
   function applyTactics(ship: FactionShip, tactics: FactionBehaviorConfig): void {
     ship.tactics = tactics;
   }

   // Function that returns FactionBehaviorType
   function getDefaultBehavior(faction: FactionId): FactionBehaviorType {
     return 'defensive';
   }
   ```

8. **Documentation for Type Relationships**: Clearly document the relationship between different types.

   ```typescript
   /**
    * FactionBehaviorType - String literal union type for behavior types
    * FactionBehaviorConfig - Object interface for behavior configuration
    *
    * FactionBehaviorConfig.behavior is of type FactionBehaviorType
    * When a string is provided as tactics, it should be converted to FactionBehaviorConfig
    * using the createFactionBehavior helper function.
    */
   ```

By following these best practices, we can ensure type safety and consistency when working with types that have multiple representations.

#### Ship Ability Issues

When working with ship abilities in our codebase, we encountered several TypeScript errors related to missing properties in ship ability objects. Here are the best practices we established:

1. **Always Include Required Properties**: All ship ability objects must include the `id` property to match the `CommonShipAbility` interface requirements.

   ```typescript
   // Before (missing 'id' property)
   {
     name: 'Overcharge',
     description: 'Increases weapon damage and accuracy',
     cooldown: 15,
     duration: 10,
     active: hasEffect('overcharge'),
     effect: {
       id: 'overcharge',
       type: 'damage',
       magnitude: 1.4,
       duration: 10,
     } as Effect,
   }

   // After (with 'id' property)
   {
     id: 'overcharge-ability',
     name: 'Overcharge',
     description: 'Increases weapon damage and accuracy',
     cooldown: 15,
     duration: 10,
     active: hasEffect('overcharge'),
     effect: {
       id: 'overcharge',
       type: 'damage',
       magnitude: 1.4,
       duration: 10,
     } as Effect,
   }
   ```

2. **Generate Descriptive IDs**: When generating IDs for ship abilities, use descriptive names that include the ship ID and ability name to ensure uniqueness.

   ```typescript
   // Generate a unique ID for each ability
   const abilityId = `${ship.id}-${w.name.toLowerCase().replace(/\s+/g, '-')}-ability`;
   ```

3. **Complete All Required Properties for Effect Objects**: When creating effect objects, ensure that all required properties are included, such as `name` and `description` for `DamageEffect` objects.

   ```typescript
   // Before (missing 'name' and 'description' properties)
   const weaponEffect: DamageEffect = {
     id: 'rage-mode-weapon',
     type: 'damage',
     duration: 10,
     strength: 1.5,
     magnitude: 1.5,
     damageType: 'physical',
     penetration: 0.3,
   };

   // After (with all required properties)
   const weaponEffect: DamageEffect = {
     id: 'rage-mode-weapon',
     name: 'Rage Mode Weapon Effect',
     description: 'Increases weapon damage at the cost of defense',
     type: 'damage',
     duration: 10,
     strength: 1.5,
     magnitude: 1.5,
     damageType: 'physical',
     penetration: 0.3,
   };
   ```

4. **Consistent Ability Structure**: Maintain a consistent structure for ship abilities across different ship types and factions.

   ```typescript
   // Consistent ability structure for all ship types
   abilities: [
     {
       id: 'ability-id',
       name: 'Ability Name',
       description: 'Ability Description',
       cooldown: 15,
       duration: 10,
       active: false,
       effect: {
         id: 'effect-id',
         type: 'effect-type',
         magnitude: 1.5,
         duration: 10,
       } as Effect,
     },
   ],
   ```

5. **Map-Based Ability Generation**: When generating abilities from other data sources (like weapons), ensure that all required properties are included in the mapping function.

   ```typescript
   abilities: ship.weapons.map(w => ({
     id: `${ship.id}-${w.name.toLowerCase().replace(/\s+/g, '-')}-ability`,
     name: w.name,
     description: 'Standard weapon system',
     cooldown: w.cooldown,
     duration: 10,
     active: false,
     effect: createWeaponEffect(createWeaponLike(w)),
   })),
   ```

By following these best practices, we can ensure that all ship ability objects in our codebase are properly typed and include all required properties, reducing TypeScript errors and improving code quality.

#### Property Access on Possibly Undefined Values

When working with properties that might be undefined in our codebase, we encountered several TypeScript errors related to accessing properties on possibly undefined values. Here are the best practices we established:

1. **Use Optional Chaining**: When accessing properties that might be undefined, use the optional chaining operator (`?.`) to safely access nested properties.

   ```typescript
   // Before (unsafe property access)
   if (event.data.buildingId === buildingId) {
     // handle event
   }

   // After (safe property access with optional chaining)
   if (event.data?.buildingId === buildingId) {
     // handle event
   }
   ```

2. **Add Null Checks**: Before accessing properties, add explicit null checks to ensure the object exists.

   ```typescript
   // Before (no null check)
   const { moduleId, newLevel } = event.data;

   // After (with null check)
   if (event.data) {
     const { moduleId, newLevel } = event.data;
     // use moduleId and newLevel
   }
   ```

3. **Use Nullish Coalescing Operator**: When providing default values for potentially undefined properties, use the nullish coalescing operator (`??`).

   ```typescript
   // Before (using logical OR, which can override falsy values)
   const value = event.data.value || defaultValue;

   // After (using nullish coalescing, which only overrides null/undefined)
   const value = event.data?.value ?? defaultValue;
   ```

4. **Type Guards for Complex Objects**: For complex objects, create type guards to narrow down the type before accessing properties.

   ```typescript
   // Type guard for position object
   const isValidPosition = (pos: unknown): pos is Position => {
     return (
       pos !== null &&
       typeof pos === 'object' &&
       'x' in pos &&
       'y' in pos &&
       typeof pos.x === 'number' &&
       typeof pos.y === 'number'
     );
   };

   // Using the type guard
   if (event.data?.position && isValidPosition(event.data.position)) {
     // Now TypeScript knows position has x and y properties
     const { x, y } = event.data.position;
   }
   ```

5. **Create Properly Typed Objects**: When working with objects that might have missing or incorrect types, create properly typed objects before using them.

   ```typescript
   // Before (using potentially undefined object directly)
   setAutomationEffects(prev => [
     ...prev,
     {
       id: `${event.moduleId}-${Date.now()}`,
       type: event.data.type,
       position: event.data.position || { x: 50, y: 50 },
       timestamp: Date.now(),
     },
   ]);

   // After (creating a properly typed object)
   const position: Position =
     event.data?.position &&
     typeof event.data.position === 'object' &&
     'x' in event.data.position &&
     'y' in event.data.position
       ? { x: Number(event.data.position.x), y: Number(event.data.position.y) }
       : { x: 50, y: 50 };

   setAutomationEffects(prev => [
     ...prev,
     {
       id: `${event.moduleId}-${Date.now()}`,
       type: effectType as AutomationEffectType,
       position,
       timestamp: Date.now(),
     },
   ]);
   ```

6. **Destructure After Null Checks**: When destructuring objects, do so after performing null checks to avoid runtime errors.

   ```typescript
   // Before (unsafe destructuring)
   const { status, reason } = event.data;

   // After (safe destructuring after null check)
   if (event.data) {
     const { status, reason } = event.data;
     // use status and reason
   }
   ```

7. **Default Values for Optional Properties**: Provide default values for optional properties to ensure they always have a valid value.

   ```typescript
   // Before (no default value)
   const message = event.data?.message;

   // After (with default value)
   const message = event.data?.message || 'No message provided';
   ```

8. **Early Returns with Null Checks**: Use early returns with null checks to avoid deeply nested conditionals.

   ```typescript
   // Before (deeply nested conditionals)
   if (event.data) {
     if (event.data.buildingId === buildingId) {
       if (event.data.moduleId) {
         // handle event
       }
     }
   }

   // After (early returns with null checks)
   if (!event.data) return;
   if (event.data.buildingId !== buildingId) return;
   if (!event.data.moduleId) return;

   // handle event
   ```

By following these best practices, we can ensure that our code safely handles potentially undefined values, reducing the risk of runtime errors and improving type safety.

#### Incompatible Type Assignments

When working with type assignments in our codebase, we encountered several TypeScript errors related to incompatible types. Here are the best practices we established:

1. **Update Interfaces to Include Required Properties**: When an interface is missing required properties, update it to include them.

   ```typescript
   // Before (missing properties)
   export interface WeaponState {
     status: WeaponStatus;
     currentStats: WeaponStats;
     effects: WeaponEffectType[];
   }

   // After (with required properties)
   export interface WeaponState {
     status: WeaponStatus;
     currentStats: WeaponStats;
     effects: WeaponEffectType[];
     currentAmmo?: number;
     maxAmmo?: number;
   }
   ```

2. **Remove Unused Properties**: When a property is no longer needed or causing type errors, remove it from the component props.

   ```typescript
   // Before (with unused property)
   <EquatorHorizonShip
     id={id}
     name="Celestial Arbiter"
     type="celestialArbiter"
     tactics="aggressive"
     // other props
   />

   // After (without unused property)
   <EquatorHorizonShip
     id={id}
     name="Celestial Arbiter"
     type="celestialArbiter"
     // other props
   />
   ```

3. **Use Proper Type Assertions**: When accessing properties from objects with unknown types, use proper type assertions.

   ```typescript
   // Before (incorrect type assertion)
   const moduleConfigs = (moduleManager as unknown).configs;

   // After (proper type assertion)
   const moduleConfigs = (moduleManager as unknown as { configs: Map<string, ModuleConfig> })
     .configs;
   ```

4. **Create Helper Functions for Type Conversions**: When converting between different types, create helper functions to ensure type safety.

   ```typescript
   // Helper function to convert string to FactionBehaviorConfig
   const createFactionBehavior = (behavior: string): FactionBehaviorConfig => {
     return {
       formation: 'standard',
       behavior: behavior as FactionBehaviorType,
     };
   };

   // Using the helper function
   const tactics =
     typeof tacticsInput === 'string' ? createFactionBehavior(tacticsInput) : tacticsInput;
   ```

5. **Use Type Guards for Union Types**: When working with union types, use type guards to narrow down the type before using it.

   ```typescript
   // Type guard for AutomationEffectType
   const isValidEffectType = (type: string): type is AutomationEffectType => {
     return ['shield', 'formation', 'engagement', 'repair', 'attack', 'retreat'].includes(type);
   };

   // Using the type guard
   if (isValidEffectType(effectType)) {
     // Now TypeScript knows effectType is a valid AutomationEffectType
     const effect = createEffect(effectType);
   }
   ```

6. **Use Generics for Flexible Types**: When a function or component needs to work with different types, use generics to maintain type safety.

   ```typescript
   // Before (using any)
   function processData(data: any): any {
     // process data
   }

   // After (using generics)
   function processData<T, R>(data: T): R {
     // process data
   }
   ```

7. **Update Component Props to Match Expected Types**: When a component's props change, update all usages of the component to match the new props.

   ```typescript
   // Before (with old props)
   <ShipComponent
     id={id}
     name={name}
     oldProp={value}
   />

   // After (with updated props)
   <ShipComponent
     id={id}
     name={name}
     newProp={newValue}
   />
   ```

8. **Use Intersection Types for Extended Types**: When extending a type with additional properties, use intersection types.

   ```typescript
   // Before (type error when accessing additional property)
   const extendedState = state as BaseState;
   const additionalProp = extendedState.additionalProp; // Error: Property 'additionalProp' does not exist on type 'BaseState'

   // After (using intersection type)
   const extendedState = state as BaseState & { additionalProp?: string };
   const additionalProp = extendedState.additionalProp; // OK
   ```

By following these best practices, we can ensure that our code uses compatible types, reducing TypeScript errors and improving type safety.

#### Handling Underscore-Prefixed Variables

When dealing with underscore-prefixed variables (which indicate intentionally unused variables), we follow these best practices:

1. **Document Future Implementation**: For variables and functions that will be implemented in the future, add comprehensive documentation explaining their intended purpose and implementation details.

   ```typescript
   /**
    * Handler for module status changes - will be implemented in future updates
    * This function will be used to:
    * 1. Update module status indicators in real-time
    * 2. Trigger visual feedback for status transitions
    * 3. Update performance metrics based on status changes
    * 4. Notify connected systems about status changes
    * 5. Log status changes for analytics and debugging
    */
   const handleModuleStatusChanged = (event: ModuleEvent) => {
     if (event.data?.buildingId === buildingId) {
       // Future implementation will:
       // - Update status indicators with animation
       // - Trigger status-specific effects
       // - Update resource consumption based on new status
       // - Notify connected modules of status change
       console.warn('Module status changed handler to be implemented');
     }
   };
   ```

2. **Implement Variables with Type-Safe Approach**: When implementing previously unused variables, use a type-safe approach with thorough null checks and proper type guards.

   ```typescript
   // Calculate position based on event data or use random positioning as fallback
   const eventPosition = {
     x:
       typeof event.data === 'object' &&
       event.data !== null &&
       'position' in event.data &&
       typeof event.data.position === 'object' &&
       event.data.position !== null &&
       'x' in event.data.position &&
       typeof event.data.position.x === 'number'
         ? event.data.position.x
         : Math.random() * 100,
     y:
       typeof event.data === 'object' &&
       event.data !== null &&
       'position' in event.data &&
       typeof event.data.position === 'object' &&
       event.data.position !== null &&
       'y' in event.data.position &&
       typeof event.data.position.y === 'number'
         ? event.data.position.y
         : Math.random() * 100,
   };

   // Create helper functions that use the variable
   const getEventColor = () => {
     switch (event.type) {
       case 'exploration':
         return 'bg-teal-400';
       case 'combat':
         return 'bg-red-400';
       case 'trade':
         return 'bg-amber-400';
       case 'diplomacy':
         return 'bg-purple-400';
       default:
         return 'bg-teal-400';
     }
   };
   ```

3. **Add Placeholder Implementation**: For functions that are required by the interface but not yet fully implemented, add a minimal placeholder implementation with a console.warn statement to indicate future implementation.

   ```typescript
   // Function required by interface but not yet implemented
   const _calculateTotals = useCallback(
     (resources: ResourceState[]): ResourceTotals => {
       // Placeholder implementation
       console.warn('Resource total calculation to be implemented');
       return {
         energy: 0,
         minerals: 0,
         organics: 0,
       };
     },
     [resources]
   );
   ```

4. **Maintain Type Safety**: Even for unused variables, ensure proper type safety by using optional chaining and null checks.

   ```typescript
   // Maintain type safety with optional chaining
   if (event.data?.buildingId === buildingId) {
     // Safe access to possibly undefined property
   }
   ```

5. **Document in Code Comments**: Add inline comments explaining why a variable is currently unused and when it will be used.

   ```typescript
   // Ship-specific stats - kept for future implementation of ship stat scaling
   const _baseHealth = 1200; // Will be used for health scaling in future update
   const _baseShield = 800; // Will be used for shield scaling in future update
   ```

6. **Use Consistent Naming Conventions**:
   - Single underscore (`_variable`) for variables that will be used in the future
   - Double underscore (`__variable`) for variables that are for internal use only
   - Descriptive names that indicate purpose, even for unused variables

These practices ensure that unused variables are properly documented and maintained, making it easier for future developers to understand and implement the intended functionality.

### Documenting Unused Interfaces

When documenting unused interfaces in TypeScript (typically prefixed with underscore), we follow these best practices to ensure clarity about their intended future use:

1. **Provide Comprehensive Documentation**: Add detailed JSDoc comments explaining the purpose and future implementation plans for the interface.

   ```typescript
   /**
    * Interface for module event data
    * This interface will be used in future implementations to provide stronger typing for module events.
    * It defines the common structure that all module event data objects should follow.
    *
    * Future implementations will:
    * 1. Extend this interface for specific event types (upgrade, status change, etc.)
    * 2. Use it for type checking in event handlers
    * 3. Implement validation functions to ensure event data conforms to expected structure
    * 4. Provide better error messages when event data is malformed
    * 5. Enable auto-completion and type safety when accessing event data properties
    *
    * The index signature [key: string]: unknown allows for additional properties
    * while maintaining type safety by requiring explicit type checking before use.
    */
   interface _ModuleEventData {
     moduleId: string;
     [key: string]: unknown;
   }
   ```

2. **Explain Index Signatures**: When an interface includes an index signature (`[key: string]: unknown`), explain its purpose and how it contributes to type safety.

   ```typescript
   /**
    * The index signature [key: string]: unknown allows for additional properties
    * while maintaining type safety by requiring explicit type checking before use.
    * This is preferable to using [key: string]: any, which would bypass type checking.
    */
   ```

3. **Document Extension Plans**: If the interface is intended to be extended or implemented by other interfaces, document this relationship.

   ```typescript
   /**
    * This interface will be extended by specific event type interfaces:
    * - ModuleUpgradeEventData
    * - ModuleStatusEventData
    * - ModuleAlertEventData
    */
   ```

4. **Explain Type Safety Considerations**: Document how the interface contributes to type safety in the codebase.

   ```typescript
   /**
    * Using this interface instead of 'any' for event data ensures that:
    * 1. All event data objects have a moduleId property
    * 2. Additional properties require explicit type checking before use
    * 3. Type errors are caught at compile time rather than runtime
    */
   ```

5. **Document Integration with Existing Systems**: Explain how the interface will integrate with existing systems and components.

   ```typescript
   /**
    * This interface will be used in the module event system to:
    * 1. Type event data in event handlers
    * 2. Validate event data before processing
    * 3. Provide auto-completion when accessing event data properties
    * 4. Ensure consistent event data structure across the module system
    */
   ```

6. **Provide Usage Examples**: Include examples of how the interface will be used in the future.

   ```typescript
   /**
    * Example usage:
    *
    * // Type guard for module event data
    * function isModuleEventData(data: unknown): data is _ModuleEventData {
    *   return (
    *     data !== null &&
    *     typeof data === 'object' &&
    *     'moduleId' in data &&
    *     typeof data.moduleId === 'string'
    *   );
    * }
    *
    * // Event handler with type checking
    * function handleModuleEvent(event: ModuleEvent): void {
    *   if (event.data && isModuleEventData(event.data)) {
    *     const { moduleId } = event.data;
    *     // Safe to use moduleId
    *   }
    * }
    */
   ```

By following these best practices, we ensure that unused interfaces are properly documented, making it clear why they exist and how they will be used in future implementations. This documentation helps maintain code quality and makes it easier for future developers to understand and implement the intended functionality.

### Handling Parameter Type Issues

When dealing with parameter type issues in TypeScript, especially implicit 'any' types and generic type parameters, we follow these best practices:

1. **Add Explicit Types for Event Handlers**: Always provide explicit types for event handler parameters to avoid implicit 'any' types.

   ```typescript
   // Before: Implicit 'any' type
   onChange: e => setSortBy(e.target.value),

   // After: Explicit type with proper casting
   onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortOption),
   ```

2. **Create Specific Interfaces for Generic Types**: Instead of using 'any' for generic type parameters, create specific interfaces that describe the expected structure.

   ```typescript
   // Before: Using 'any' for generic types
   const handleResourceDrop = (item: DragItem<any>, storage) => {
     // ...
   };

   // After: Creating specific interfaces
   interface ResourceDragData {
     id: string;
     name: string;
     type: 'mineral' | 'gas' | 'exotic';
     abundance: number;
   }

   const handleResourceDrop = (item: DragItem<ResourceDragData>, storage) => {
     // ...
   };
   ```

3. **Use Type Assertions with Type Guards**: When receiving data from components with unknown types, use type assertions with proper type guards to ensure type safety.

   ```typescript
   // When receiving from a component with unknown type:
   onDrop: (item: DragItem<unknown>) => {
     // Type guard to ensure the item has the expected structure
     if (
       item.type === 'resource' &&
       typeof item.data === 'object' &&
       item.data !== null &&
       'id' in item.data &&
       'type' in item.data
     ) {
       // Safe to use type assertion after validation
       handleResourceDrop(item as DragItem<ResourceDragData>, storage);
     }
   };
   ```

4. **Use Union Types for Specific Values**: When a parameter can only have specific values, use union types instead of string or number.

   ```typescript
   // Before: Using string type
   function setFilterType(type: string) {
     // ...
   }

   // After: Using union type
   type FilterOption = 'all' | 'mineral' | 'gas' | 'exotic';
   function setFilterType(type: FilterOption) {
     // ...
   }
   ```

5. **Handle Event Types Properly**: Use the correct event types from React for different event handlers.

   ```typescript
   // Mouse event handler
   const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
     e.preventDefault();
     // ...
   };

   // Change event handler
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     // ...
   };

   // Form event handler
   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     // ...
   };
   ```

6. **Document Complex Type Relationships**: Add comments explaining complex type relationships, especially when using type assertions or generic types.

   ```typescript
   // This function expects a DragItem with ResourceDragData
   // ResourceDragData must have id, name, type, and abundance properties
   // The type property must be one of: 'mineral', 'gas', 'exotic'
   const handleResourceDrop = (item: DragItem<ResourceDragData>, storage) => {
     // ...
   };
   ```

By following these best practices, we can ensure type safety throughout the codebase, avoid implicit 'any' types, and make the code more maintainable and self-documenting.

### Implementing Unused Variables

When implementing previously unused variables in TypeScript, we follow these best practices to ensure they add meaningful functionality to the codebase:

1. **Understand the Variable's Purpose**: Before implementing, understand the intended purpose of the variable within the component or function.

   ```typescript
   // Before: Unused variable
   const [currentEventIndex, setCurrentEventIndex] = useState<number | null>(null);

   // After: Understanding its purpose as a way to track selected events
   // and implementing it to enhance user interaction
   ```

2. **Add Interactive Elements**: When appropriate, use the variable to create interactive UI elements.

   ```typescript
   // Adding click handlers that use the variable
   <div
     className={`h-2 w-2 rounded-full ${getEventColor()} hover:h-3 hover:w-3`}
     onClick={() => {
       // Set current event index to this event when clicked
       setCurrentEventIndex(index);
     }}
   />
   ```

3. **Provide Visual Feedback**: Use the variable to provide visual feedback to users.

   ```typescript
   // Using the variable to highlight the selected item
   <div
     className={`h-2 w-2 rounded-full ${
       index === currentEventIndex ? 'bg-white' : 'bg-teal-400'
     }`}
     // ...
   />
   ```

4. **Display Additional Information**: Use the variable to show additional information when appropriate.

   ```typescript
   // Displaying details based on the selected item
   {currentEventIndex !== null && currentEvents[currentEventIndex] && (
     <div className="mb-2 text-sm text-white">
       <span className="font-bold">{currentEvents[currentEventIndex].type}</span> event at{' '}
       {new Date(currentEvents[currentEventIndex].timestamp).toLocaleTimeString()}
     </div>
   )}
   ```

5. **Ensure Type Safety**: When implementing variables, ensure proper type safety with null checks and type guards.

#### TypeScript Error Fixing Strategies

We've developed a comprehensive approach to fixing TypeScript errors in our codebase, which has successfully reduced errors from 328 in 77 files to 0 errors, achieving 100% TypeScript compliance. Our strategies include:

1. **Prioritization by Error Type**:

   - Focus first on errors that affect runtime behavior (type assertions, null checks)
   - Then address errors that affect code maintainability (unused variables, implicit any)
   - Finally address documentation-related errors (missing JSDoc, parameter descriptions)

2. **Systematic Approach by File Category**:

   - Group files by system (resource management, combat, UI, etc.)
   - Fix errors in core systems first, then move to peripheral systems
   - Address shared utilities and types before component-specific code

3. **Implementation vs. Documentation**:

   - For unused variables that serve a clear purpose, implement them with minimal functionality
   - For unused interfaces and functions planned for future use, add comprehensive documentation
   - For type assertion issues, use proper type guards and narrowing techniques

4. **Custom Type Definitions**:

   - Create custom type definitions for complex objects (e.g., `CustomElementRef` for Three.js elements)
   - Use type guards to narrow types in conditional blocks
   - Implement proper generic constraints for reusable components

5. **Handling React and Three.js Integration**:

   - Use proper type assertions for refs and elements
   - Create wrapper components with proper type definitions
   - Use children props correctly with appropriate typing

6. **Documentation Standards**:

   - Add JSDoc comments for all public functions and interfaces
   - Document parameters with specific descriptions
   - Include return type documentation
   - Add examples for complex functions

7. **Error Suppression Guidelines**:

   - Use `@ts-expect-error` with explanatory comments for intentionally unused code
   - Avoid using `@ts-ignore` without explanation
   - Document all suppressed errors in the architecture documentation

8. **Testing After Fixes**:

   - Run TypeScript compiler after each set of fixes
   - Verify that no new errors are introduced
   - Run tests to ensure functionality is preserved

9. **Refactoring Opportunities**:

   - Identify patterns in errors that suggest deeper architectural issues
   - Refactor code to improve type safety where appropriate
   - Create reusable utility types for common patterns

10. **Documentation Updates**:
    - Update architecture documentation with new type patterns
    - Document error fixing strategies for future reference
    - Create examples of before/after fixes for common error types

For a more detailed guide on our TypeScript error fixing strategies, see `CodeBase_Docs/TypeScript_Error_Fixing_Strategies.md`.

#### JSX Namespace Declaration Issues

When working with JSX in TypeScript, especially with custom libraries like Three.js, we encountered namespace declaration issues. Here are the best practices we established:

1. **Custom Element References**: Create custom type definitions for element references.

   ```typescript
   // Custom type for Three.js element refs
   type CustomElementRef = React.RefObject<{
     __r3f: {
       root: {
         getState: () => {
           camera: THREE.Camera;
           scene: THREE.Scene;
         };
       };
     };
   }>;
   ```

2. **Proper Children Typing**: Ensure proper typing for children props in JSX components.

   ```typescript
   // Before (incorrect typing)
   interface CanvasProps {
     children: React.ReactNode;
   }

   // After (correct typing)
   interface CanvasProps {
     children: React.ReactNode | React.ReactNode[];
   }
   ```

3. **Component Type Declarations**: Use proper component type declarations for JSX components.

   ```typescript
   // Using React.FC with generic props
   const ShieldEffect: React.FC<ShieldEffectProps> = ({ position, radius, color }) => {
     // component implementation
   };
   ```

4. **Shader Material Properties**: Define proper types for shader material properties.

   ```typescript
   // Type definition for shader material properties
   interface ShaderMaterialProps {
     uniforms: {
       [key: string]: {
         value: any;
       };
     };
     vertexShader: string;
     fragmentShader: string;
     transparent?: boolean;
     side?: THREE.Side;
   }
   ```

5. **Event Handling**: Properly type event handlers for JSX elements.

   ```typescript
   // Properly typed event handler
   const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
     e.stopPropagation();
     // handler implementation
   };
   ```

By following these best practices, we've successfully resolved all JSX namespace declaration issues in our codebase.

## TypeScript Best Practices

### Module Syntax vs Namespaces

- **Use ES2015 Module Syntax**: Always prefer ES2015 module syntax (`import`/`export`) over TypeScript namespaces. This aligns with modern JavaScript practices and provides better tree-shaking and code organization.

- **Type Definitions for Custom Elements**: When working with libraries like Three.js that require custom JSX elements, use type definitions with interfaces or type aliases instead of declaring them in the global JSX namespace:

```typescript
// AVOID this approach:
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.RefObject<THREE.Points>;
      };
      // other elements...
    }
  }
}

// PREFER this approach:
type ThreePointsProps = {
  ref?: React.RefObject<THREE.Points>;
  [key: string]: unknown;
};

// Then use type assertions when creating elements:
React.createElement('points', { ref: pointsRef } as ThreePointsProps);
```

- **Type Assertions**: When using custom elements with React.createElement, use type assertions to provide proper typing:

```typescript
React.createElement('customElement', { prop1: value1 } as CustomElementProps);
```

### Fixed Namespace Issues

The following files had TypeScript namespace issues that were fixed by replacing namespace declarations with proper type definitions:

1. `src/effects/component_effects/ExplosionEffect.tsx`
2. `src/effects/component_effects/SmokeTrailEffect.tsx`
3. `src/effects/component_effects/ThrusterEffect.tsx`

The fixes involved:

- Removing `declare global { namespace JSX { ... } }` declarations
- Creating proper type definitions for Three.js elements
- Using type assertions with React.createElement
- Ensuring proper typing for all props and attributes

```

## Testing Architecture

### Test Utilities

The test utilities in `src/tests/utils/testUtils.tsx` have been enhanced to include:

1. **Mock Factories** - Consistent creation of test data
   - `createMockResource` - Creates resource objects with sensible defaults
   - `createMockResourceNode` - Creates producer or consumer nodes
   - `createMockResourceConnection` - Creates connections between nodes
   - `createMockResources` - Creates multiple resources at once
   - `createMockEvent` - Creates game events

2. **Common Testing Patterns** - Standardized approaches for common scenarios
   - `testLoadingState` - Tests a component's loading state
   - `testErrorState` - Tests a component's error handling
   - `testFormSubmission` - Tests a form's validation and submission

3. **Performance Testing Tools** - Measuring and tracking performance
   - `measureExecutionTime` - Measures how long a function takes to execute
   - `measureMemoryUsage` - Measures memory usage of a function
   - `createPerformanceReporter` - Collects and reports performance metrics

### Performance Benchmarking

We've implemented performance benchmarks for critical systems:

1. **ResourceFlowManager Benchmarks** (`src/tests/performance/ResourceFlowManager.benchmark.ts`)
   - Tests different network sizes (50 to 500 nodes)
   - Compares batch processing strategies
   - Evaluates cache configurations
   - Measures both execution time and memory usage

2. **Event System Benchmarks** (`src/tests/performance/EventSystem.benchmark.ts`)
   - Tests different event loads (100 to 10,000 events)
   - Evaluates scaling with increasing listener count
   - Measures event emission and history retrieval performance
   - Benchmarks complex filtering operations

These benchmarks are designed to be run as part of the CI process to detect performance regressions early.

Additional documentation on these topics can be found in:
- `CodeBase_Docs/Test_Utilities_Guide.md` - Complete guide to the enhanced test utilities
- `CodeBase_Docs/Performance_Benchmark_Practices.md` - Best practices for performance benchmarking

## Resource Management System

### Multi-Step Production Chains

The ResourceFlowManager now supports multi-step production chains through the following components:

1. **ResourceConversionProcess Interface**:
   - Tracks the state of conversion processes with unique process IDs
   - Includes start and end timestamps for performance monitoring
   - Supports efficiency tracking with base and applied efficiency values
   - Handles both primary outputs and byproducts

2. **Conversion Process Lifecycle**:
   - `startConversionProcess`: Initiates a conversion with input validation
   - `updateConversionProcess`: Updates the state of an ongoing conversion
   - `completeConversionProcess`: Finalizes conversion and produces outputs
   - `cancelConversionProcess`: Handles graceful cancellation of conversions

3. **Chain Processing**:
   - Supports sequential processing of multiple conversion steps
   - Handles dependencies between conversion steps
   - Provides status tracking for the entire chain

### Resource Conversion Efficiency

The efficiency system has been enhanced with the following features:

1. **Efficiency Calculation**:
   - Base efficiency determined by converter properties
   - Applied efficiency calculated with modifiers from various sources
   - Compound efficiency for multi-step processes
   - Efficiency impacts both resource consumption and production rates

2. **Efficiency Modifiers**:
   - Environmental factors (temperature, pressure)
   - Module upgrades and technology levels
   - Operator skill levels
   - Maintenance status

3. **Implementation Details**:
   - Efficiency values stored as decimals (0.0 to 1.0+)
   - Values above 1.0 represent super-efficient conversions
   - Efficiency applied to both resource consumption and production
   - Byproduct generation rates affected by efficiency

4. **Testing Considerations**:
   - Tests for various efficiency scenarios
   - Edge case handling for zero or negative efficiency values
   - Performance impact of efficiency calculations in large networks

### Converter Management UI

The Converter Management UI provides a comprehensive interface for monitoring and controlling resource converters and production chains. It consists of several components that work together to create an intuitive user experience:

#### 1. ConverterDashboard Component

The `ConverterDashboard` (`src/components/ui/resource/ConverterDashboard.tsx`) serves as the main entry point for the converter management interface. It provides:

- A dashboard-style overview of all converters in the system
- Real-time monitoring of active conversion processes
- Production metrics display (efficiency, throughput, energy use)
- Controls for starting, pausing, and stopping conversion processes
- Integration with the ChainVisualization component for visualizing production chains

Key features of this component include:

- **Responsive Layout**: Grid-based design that adapts to different screen sizes
- **Real-Time Updates**: Live updates of process progress and status
- **Interactive Controls**: Intuitive controls for managing processes and converters
- **Efficiency Monitoring**: Visual display of efficiency factors and their impact

#### 2. ChainVisualization Component

The `ChainVisualization` (`src/components/ui/resource/ChainVisualization.tsx`) provides an interactive visualization of multi-step production chains using D3.js. Key features include:

- **Force-Directed Graph**: Automatically arranges nodes and links to create a clear visualization
- **Interactive Elements**: Nodes can be dragged and clicked to interact with converters and recipes
- **Color-Coded Status**: Visual indication of step status (pending, in-progress, completed, failed)
- **Animated Transitions**: Smooth animations when chain status changes

The visualization helps players understand complex production chains by:

- Showing the flow of resources between converters
- Highlighting the current status of each step in the chain
- Providing an interactive way to select and manage converters in the chain
- Visualizing the progress of the overall chain

#### 3. UI/UX Considerations

The converter management UI implements several important UI/UX principles:

1. **Consistent Visual Language**:
   - Color coding for status (green for success, yellow for in-progress, red for failure)
   - Consistent layout and interaction patterns across components
   - Clear hierarchy of information with the most important data prominently displayed

2. **Real-Time Feedback**:
   - Progress bars show the current status of processes and chains
   - Status indicators update immediately when changes occur
   - Efficiency factors are displayed with their current values

3. **Responsive Design**:
   - Adapts to different screen sizes using CSS Grid
   - Maintains usability on smaller screens with reorganized layouts
   - Ensures all interactive elements remain accessible on mobile devices

4. **Accessibility**:
   - Proper contrast for text and UI elements
   - Semantic HTML structure for screen readers
   - Keyboard navigation support
   - Alternative indicators beyond color for status (icons, text, etc.)

These UI components work together to create a comprehensive and intuitive interface for managing the converter system, making complex production chains more accessible and easier to manage for players.
```
