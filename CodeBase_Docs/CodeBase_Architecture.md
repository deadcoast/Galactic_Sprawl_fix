---
GALACTIC SPRAWL SYSTEM ARCHITECTURE
---

## Table of Contents

1. [Linter Configuration](#linter-configuration)
2. [Linting Workflow and Testing](#linting-workflow-and-testing)
3. [Linting Issue Fixes](#linting-issue-fixes)
   - [Fixing TypeScript `any` Types](#fixing-typescript-any-types)
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
    - [Type Assertion Issues](#type-assertion-issues)
    - [Map Iteration Issues](#map-iteration-issues)
18. [Testing Framework Configuration](#testing-framework-configuration)
19. [Test Utilities and Fixtures](#test-utilities-and-fixtures)
    - [Resource State Fixtures](#resource-state-fixtures)
    - [Mock Manager Creation](#mock-manager-creation)
    - [Handling Unused Variables](#handling-unused-variables)
    - [Mocking ES Modules in Tests](#mocking-es-modules-in-tests)
    - [Performance Testing Best Practices](#performance-testing-best-practices)

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
   - Dynamic port allocation to prevent conflicts between test runs
   - Web server configuration is optional to allow tests to run without a server

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

### Test Isolation and WebSocket Server Conflict Resolution

To ensure reliable and consistent E2E test execution, Galactic Sprawl implements a robust test isolation strategy that prevents conflicts between test runs:

1. **Dynamic Port Allocation**:

   - Each test run uses a unique port for the WebSocket server
   - A utility function `getUniquePort()` generates random ports between 8000-9000
   - The current port is stored in a module-level variable and accessed via `getCurrentPort()`
   - This prevents the "address already in use" errors that occur when multiple tests try to use the same port

2. **Test Setup and Teardown**:

   - A dedicated test setup file (`src/tests/e2e/test-setup.ts`) manages the test environment
   - `setupTest()` function configures global error handling and timeouts before each test
   - `teardownTest()` function cleans up resources and resets state after each test
   - These functions are called in the `beforeEach` and `afterEach` hooks of each test file

3. **Playwright Configuration Integration**:

   - The `playwright.config.ts` file is updated to use the dynamic port:

     ```typescript
     import { getCurrentPort } from './src/tests/e2e/test-setup';

     export default defineConfig({
       // ...
       projects: [
         {
           name: 'chromium',
           use: {
             baseURL: `http://localhost:${getCurrentPort()}`,
           },
         },
         // ...
       ],
       webServer: {
         command: 'npm run dev',
         port: getCurrentPort(),
       },
     });
     ```

4. **Custom Test Fixtures**:

   - Custom fixtures are defined to provide page objects and other test utilities
   - The `baseURL` fixture is overridden to use the dynamic port
   - Page object instances (e.g., `miningPage`) are created once per test and properly typed

5. **Implementation Example**:

   ```typescript
   // src/tests/e2e/test-setup.ts
   import { test as baseTest, expect, Page } from '@playwright/test';
   import { MiningPage } from './models/MiningPage';

   // Generate a unique port for each test run
   function getUniquePort(): number {
     return Math.floor(Math.random() * 1000) + 8000;
   }

   // Store the current port for the test run
   let currentPort = getUniquePort();

   // Export a function to get the current port
   export function getCurrentPort(): number {
     return currentPort;
   }

   // Define custom fixtures
   type CustomFixtures = {
     miningPage: MiningPage;
   };

   // Extend the base test with custom fixtures
   export const test = baseTest.extend<CustomFixtures>({
     // Override baseURL to use the unique port
     baseURL: ({ baseURL }, use) => {
       use(`http://localhost:${getCurrentPort()}`);
     },

     // Add miningPage fixture
     miningPage: async ({ page }, use) => {
       const miningPage = new MiningPage(page);
       await use(miningPage);
     },
   });

   // Export the expect function
   export { expect };

   // Setup function to configure the test environment
   export async function setupTest(): Promise<void> {
     // Configure global error handling and timeouts
   }

   // Teardown function to clean up after tests
   export async function teardownTest(): Promise<void> {
     // Clean up resources and reset state
   }
   ```

6. **Best Practices**:

   - Always use dynamic port allocation for services in tests
   - Implement proper setup and teardown procedures for each test
   - Ensure resources are properly cleaned up after each test run
   - Use unique identifiers for test resources to prevent conflicts
   - Consider using test isolation techniques to prevent interference between tests

This approach ensures that E2E tests can run reliably in various environments, including CI/CD pipelines, without conflicts between test runs or leftover state from previous tests.

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
  - Limited console statements (only `console.warn` and `console.error` allowed)
  - Special rules for test files
- Common linting issues to fix:
  - Replace `any` types with proper TypeScript types
  - Add curly braces to case blocks with lexical declarations
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

4. Tech Tree System

   The Tech Tree System is implemented in `src/components/ui/TechTree.tsx` and provides a visual representation of the technology progression in the game.

   #### Key Components

   1. **TechNode Interface**:

      - Extends the imported `ImportedTechNode` from the tech tree manager
      - Adds icon property for visual representation
      - Uses a type-safe approach with `NodeIconsType` for icon references

   2. **Visual Components**:

      - `TechVisualFeedback`: Renders individual tech nodes with visual feedback
      - `TechConnectionLine`: Renders connections between tech nodes
      - `ResearchProgressIndicator`: Shows research progress for active technologies
      - `TechSynergyIndicator`: Displays synergy effects between technologies

   3. **Helper Functions**:

      - `_mapToLocalTechNode`: Maps imported tech nodes to local format
      - `getCategoryIcon`: Determines the appropriate icon based on tech category
      - `getTierNodes`: Filters nodes by tier for organized display

   4. **State Management**:

      - Uses React state for managing tech nodes, connections, and research progress
      - Implements functions for starting research, unlocking nodes, and handling node selection

   5. **Rendering Logic**:
      - Organizes nodes by tier for hierarchical display
      - Renders connections between nodes with appropriate status indicators
      - Provides filtering by category for focused viewing

   #### Best Practices

   1. **Type Safety**:

      - Uses TypeScript interfaces for clear type definitions
      - Avoids `any` types by using proper interfaces and type aliases

   2. **Component Organization**:

      - Separates visual components into dedicated files
      - Uses consistent naming conventions for functions and variables
      - Implements clear separation of concerns between data and presentation

   3. **Performance Optimization**:
      - Uses refs for node position tracking
      - Implements efficient rendering with conditional logic
      - Avoids unnecessary re-renders with appropriate state management

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

### RealTimeMapUpdates

**Key Features:**

- Real-time visualization of map changes including sector status updates, ship movements, and resource transfers
- Connection status monitoring with automatic reconnection attempts
- Configurable update intervals for performance optimization
- Manual refresh capability for on-demand updates
- Detailed statistics tracking for monitoring system performance
- Event-based updates for sector scans, anomaly detection, and resource discoveries
- Visual indicators for connection status and update activity

**Implementation Details:**

- Subscribes to module events using the moduleEventBus for real-time updates
- Uses React hooks for state management and side effects
- Implements interval-based updates for ship positions and resource transfers
- Handles error conditions with automatic reconnection logic
- Provides visual feedback on connection status and update activity
- Supports different quality levels for performance optimization

**Usage Example:**

```tsx
<RealTimeMapUpdates
  sectors={sectors}
  ships={ships}
  transfers={transfers}
  onSectorsUpdate={handleSectorsUpdate}
  onShipsUpdate={handleShipsUpdate}
  onTransfersUpdate={handleTransfersUpdate}
  updateInterval={2000}
  autoRefresh={true}
  quality="high"
/>
```

**File Location:** `src/components/exploration/RealTimeMapUpdates.tsx`

### AdvancedFilteringSystem

**Key Features:**

- Comprehensive filtering capabilities for exploration data
- Multi-criteria search with real-time results
- Filter by sector status, resource potential, habitability score
- Anomaly filtering by type and severity
- Resource type filtering
- Time-based filtering for recently scanned sectors
- Visual indicators for active filters
- Collapsible interface for space efficiency
- Mobile-responsive design

**Implementation Details:**

- Standalone component that can be integrated with any exploration view
- Uses React hooks for state management
- Implements memoization for performance optimization
- Provides a clean API for filter state management
- Supports both compact and expanded modes
- Includes a counter for active filters
- Implements reset functionality for individual and all filters

**Usage Example:**

```tsx
<AdvancedFilteringSystem
  filters={filters}
  onFiltersChange={handleFiltersChange}
  onSearchChange={handleSearchChange}
  onReset={handleReset}
  compact={false}
/>
```

**Integration Example:**

```tsx
// In a parent component
const [filters, setFilters] = useState<AdvancedFilters>(defaultAdvancedFilters);
const [searchQuery, setSearchQuery] = useState('');

// Apply filters to data
const filteredSectors = sectors.filter(sector => {
  // Apply filters based on criteria
  // ...
});

// Then in the render method
<AdvancedFilteringSystem
  filters={{ ...filters, searchQuery }}
  onFiltersChange={setFilters}
  onSearchChange={setSearchQuery}
  onReset={() => {
    setFilters(defaultAdvancedFilters);
    setSearchQuery('');
  }}
/>;
```

**File Location:** `src/components/exploration/AdvancedFilteringSystem.tsx`

**Related Components:**

- `src/components/exploration/AdvancedFilteringDemo.tsx` - Demonstration component
- `src/components/exploration/ExplorationSystemIntegration.tsx` - Integration example

### DetailedAnomalyAnalysis

**Key Features:**

- Comprehensive anomaly analysis with detailed visualizations and metrics
- Multi-tab interface for different analysis perspectives (overview, detailed, research, exploitation)
- Advanced filtering and sorting capabilities for anomaly management
- Interactive data visualization for spectrum analysis, material properties, spatial distortions, and biological impacts
- Support for related anomalies with cross-referencing
- Export and sharing capabilities for analysis results
- Configurable quality levels for performance optimization
- Advanced mode for additional features and controls
- Mobile-responsive design with collapsible sections

**Implementation Details:**

- Standalone component that can be integrated with any exploration system
- Uses React hooks for state management and memoization for performance
- Implements a tabbed interface for organizing complex analysis data
- Provides detailed visualizations for different types of anomalies (artifacts, signals, phenomena)
- Supports different quality levels for performance optimization
- Includes comprehensive filtering and sorting capabilities
- Implements expandable/collapsible sections for better information organization
- Provides a clean API for anomaly data management and analysis

**Usage Example:**

```tsx
<DetailedAnomalyAnalysis
  anomalies={anomalies}
  onInvestigate={handleInvestigate}
  onAnalysisComplete={handleAnalysisComplete}
  onExport={handleExport}
  onShare={handleShare}
  onRelatedAnomalySelect={handleRelatedAnomalySelect}
  quality="medium"
  advancedMode={false}
/>
```

**Demo Component:**

A demonstration component `DetailedAnomalyAnalysisDemo` is available that showcases the `DetailedAnomalyAnalysis` component with sample data. It provides controls for adjusting quality levels and toggling advanced mode.

**File Location:**

- `src/components/exploration/DetailedAnomalyAnalysis.tsx`
- `src/components/exploration/DetailedAnomalyAnalysisDemo.tsx`

**Related Components:**

- `src/components/exploration/AnomalyAnalysis.tsx` - Simpler anomaly analysis component
- `src/components/exploration/ExplorationHub.tsx` - Main exploration interface

### ResourcePotentialVisualization

**Key Features:**

- Comprehensive visualization of resource potential across different sectors
- Multiple view modes (chart and grid) for different analysis perspectives
- Advanced filtering and sorting capabilities for resource management
- Interactive visualizations for resource distribution, quality, and extraction difficulty
- Detailed sector analysis with resource breakdown and scan information
- Resource type categorization with visual indicators
- Value estimation and comparison across sectors
- Scan accuracy visualization and recommendations
- Mobile-responsive design with collapsible sections

**Implementation Details:**

- Standalone component that can be integrated with any exploration system
- Uses React hooks for state management and memoization for performance
- Implements multiple visualization modes for different analysis needs
- Provides detailed resource breakdowns with visual indicators
- Supports filtering by resource type and sorting by different metrics
- Includes comprehensive sector details with resource properties
- Implements expandable/collapsible sections for better information organization
- Provides recommendations based on resource data and scan accuracy

**Usage Example:**

```tsx
<ResourcePotentialVisualization
  sectorData={sectorData}
  onSectorSelect={handleSectorSelect}
  selectedSectorId={selectedSectorId}
  quality="medium"
/>
```

**Demo Component:**

A demonstration component `ResourcePotentialVisualizationDemo` is available that showcases the `ResourcePotentialVisualization` component with sample data. It provides controls for adjusting quality levels and demonstrates sector selection.

**File Location:**

- `src/components/exploration/ResourcePotentialVisualization.tsx`
- `src/components/exploration/ResourcePotentialVisualizationDemo.tsx`

**Related Components:**

- `src/components/exploration/ExplorationHub.tsx` - Main exploration interface
- `src/components/exploration/DetailedAnomalyAnalysis.tsx` - Anomaly analysis component

### GalaxyMapSystem

**Key Features:**

- Interactive visualization of sectors with zoom and pan capabilities
- Filtering and search functionality for sectors
- Color-coded sector status indicators
- Anomaly detection visualization
- Grid-based coordinate system
- Detailed sector information on selection
- Support for different quality levels for performance optimization

**Implementation Details:**

- Uses SVG for rendering sectors and grid
- Implements drag and zoom functionality for map navigation
- Provides filtering by sector status, resource potential, and anomalies
- Includes search functionality for finding specific sectors
- Supports different quality levels for performance optimization
- Renders sectors with visual indicators for status and anomalies

**Usage Example:**

```tsx
<GalaxyMapSystem
  sectors={sectors}
  onSectorSelect={handleSectorSelect}
  onSectorScan={handleSectorScan}
  selectedSectorId={selectedSectorId}
  activeScanId={activeScanId}
  quality="medium"
/>
```

**File Location:** `src/components/exploration/GalaxyMapSystem.tsx`

### GalaxyMappingSystem

**Key Features:**

- Enhanced galaxy map with parallax background for immersive experience
- Faction territory visualization with control level indicators
- Trade route visualization with resource type indicators
- Cosmic event system with visual effects and sector impact
- Interactive overlay toggles for different data layers
- Tutorial system for new users
- Day/night cycle with visual effects

**Implementation Details:**

- Builds upon the GalaxyMapSystem component with additional features
- Implements parallax background with multiple layers for depth
- Uses SVG for rendering trade routes and faction territories
- Generates random cosmic events that affect sectors
- Provides overlay toggles for different data visualizations
- Includes a comprehensive tutorial system
- Implements day/night cycle with visual effects

**Usage Example:**

```tsx
<GalaxyMappingSystem
  sectors={sectors}
  tradeRoutes={tradeRoutes}
  onSectorSelect={handleSectorSelect}
  onSectorScan={handleSectorScan}
  selectedSectorId={selectedSectorId}
  activeScanId={activeScanId}
  quality="medium"
/>
```

**Demo Component:**

A demonstration component `GalaxyMappingSystemDemo` is available that showcases the `GalaxyMappingSystem` component with sample data. It provides controls for adjusting quality levels and regenerating sample data.

**File Location:**

- `src/components/exploration/GalaxyMappingSystem.tsx`
- `src/components/exploration/GalaxyMappingSystemDemo.tsx`

**Related Components:**

- `src/components/exploration/GalaxyMapSystem.tsx`
- `src/components/exploration/ExplorationHub.tsx`

### ResourceDiscoverySystem

**Key Features:**

- Comprehensive resource discovery processing and visualization
- Raw signal analysis and resource data generation
- Multi-criteria filtering and sorting of discoveries
- Detailed resource property visualization (quality, accessibility, distribution)
- Resource value estimation based on multiple factors
- Discovery confidence calculation
- Notes and documentation system for discoveries
- Real-time processing visualization with progress indicators
- Mobile-responsive design with collapsible sections

**Implementation Details:**

- Processes raw resource signals from recon ships into detailed resource data
- Uses a sophisticated algorithm to determine resource properties based on signal characteristics
- Implements a filtering and sorting system for managing multiple discoveries
- Provides detailed visualizations of both raw signals and processed resources
- Includes a notes system for documenting discoveries
- Supports different quality levels for performance optimization
- Implements a real-time processing simulation with progress tracking

**Usage Example:**

```tsx
<ResourceDiscoverySystem
  discoveries={discoveries}
  sectors={sectors}
  onProcessDiscovery={handleProcessDiscovery}
  onUpdateNotes={handleUpdateNotes}
  quality="medium"
/>
```

**Demo Component:**

A demonstration component `ResourceDiscoveryDemo` is available that showcases the `ResourceDiscoverySystem` component with sample data. It provides controls for adjusting quality levels and regenerating sample data.

**File Location:**

- `src/components/exploration/ResourceDiscoverySystem.tsx`
- `src/components/exploration/ResourceDiscoveryDemo.tsx`

**Related Components:**

- `src/components/exploration/ResourcePotentialVisualization.tsx`
- `src/components/exploration/GalaxyMapSystem.tsx`
- `src/managers/exploration/ReconShipManagerImpl.ts`

### ExplorationDataManager

**Key Features:**

- Comprehensive exploration data management system for organizing, categorizing, and analyzing exploration data
- Hierarchical category system with parent-child relationships for organizing records
- Tagging system for flexible record organization and filtering
- Advanced search and filtering capabilities for finding specific records
- Starred records system for marking important discoveries
- Notes and documentation system for adding context to records
- Related records linking for establishing connections between discoveries
- Data export and import functionality for sharing and backing up data
- Record editing and deletion capabilities
- Sorting by various criteria (name, date, type)
- Mobile-responsive design with collapsible sections

**Implementation Details:**

- Standalone component that can be integrated with any exploration system
- Uses React hooks for state management and memoization for performance
- Implements a hierarchical category system with expandable/collapsible tree view
- Provides comprehensive filtering capabilities including text search, type filters, tag filters, and category filters
- Supports record selection for batch operations (export, delete)
- Includes record detail view for editing and viewing comprehensive information
- Implements data export and import functionality with JSON format
- Provides a clean API for record and category management
- Supports different record types (sectors, anomalies, resources) with type-specific visualizations

**Usage Example:**

```tsx
<ExplorationDataManager
  records={records}
  categories={categories}
  onSaveRecord={handleSaveRecord}
  onDeleteRecord={handleDeleteRecord}
  onExportData={handleExportData}
  onImportData={handleImportData}
  onCreateCategory={handleCreateCategory}
  onUpdateCategory={handleUpdateCategory}
  onDeleteCategory={handleDeleteCategory}
/>
```

**Demo Component:**

A demonstration component `ExplorationDataManagerDemo` is available that showcases the `ExplorationDataManager` component with sample data. It provides controls for adding sample sectors, anomalies, and resources, as well as clearing all data.

**File Location:**

- `src/components/exploration/ExplorationDataManager.tsx`
- `src/components/exploration/ExplorationDataManagerDemo.tsx`

**Related Components:**

- `src/components/exploration/ResourceDiscoverySystem.tsx`
- `src/components/exploration/DetailedAnomalyAnalysis.tsx`
- `src/components/exploration/GalaxyMapSystem.tsx`

### DiscoveryClassification

**Key Features:**

- Comprehensive discovery classification system for both anomalies and resources
- Hierarchical taxonomy system with categories and subcategories
- AI-powered classification suggestions with confidence scoring
- Detailed property management for different classification types
- Classification history tracking and comparison
- Similar discovery identification and cross-referencing
- Confidence level visualization and management
- Compact and full view modes for different UI contexts
- Mobile-responsive design with collapsible sections

**Implementation Details:**

- Standalone component that can be integrated with any exploration system
- Uses React Context for state management and data sharing
- Implements a hierarchical taxonomy system for organizing discoveries
- Provides AI-powered classification suggestions based on discovery properties
- Supports both anomaly and resource classification with type-specific properties
- Includes comprehensive classification history tracking
- Implements similar discovery identification based on classification properties
- Provides confidence scoring and visualization for classifications
- Supports both compact and full view modes for different UI contexts

**Usage Example:**

```tsx
<ClassificationProvider>
  <DiscoveryClassification discovery={discoveryData} onClassify={handleClassify} compact={false} />
</ClassificationProvider>
```

**Demo Component:**

A demonstration component `DiscoveryClassificationDemo` is available that showcases the `DiscoveryClassification` component with sample data. It provides controls for filtering discoveries, switching between view modes, and searching for specific discoveries.

**File Location:**

- `src/components/exploration/DiscoveryClassification.tsx`
- `src/components/exploration/DiscoveryClassificationDemo.tsx`
- `src/contexts/ClassificationContext.tsx`
- `src/types/exploration/ClassificationTypes.ts`

**Related Components:**

- `src/components/exploration/DetailedAnomalyAnalysis.tsx` - For anomaly analysis integration
- `src/components/exploration/ResourceDiscoverySystem.tsx` - For resource discovery integration
- `src/components/exploration/ExplorationDataManager.tsx` - For data persistence integration

**Technical Architecture:**

The Discovery Classification system is built on a layered architecture:

1. **Data Layer:**

   - `ClassificationTypes.ts` - Core interfaces and types
   - `ClassificationContext.tsx` - State management and data operations

2. **UI Layer:**

   - `DiscoveryClassification.tsx` - Main classification interface
   - `DiscoveryClassificationDemo.tsx` - Demo and testing component

3. **Integration Layer:**
   - Integration with DetailedAnomalyAnalysis for anomaly classification
   - Integration with ResourceDiscoverySystem for resource classification
   - Integration with ExplorationDataManager for data persistence

The system uses a hierarchical taxonomy approach with parent-child relationships between categories. Each category can have specific properties that are used to classify discoveries. The AI suggestion system analyzes discovery properties to suggest appropriate classifications with confidence scores.

**Performance Considerations:**

- Uses React.memo and useMemo for optimized rendering
- Implements virtualized lists for large discovery datasets
- Provides configurable view modes for different performance requirements
- Uses lazy loading for classification suggestions

**Accessibility Features:**

- Keyboard navigation support for all interactive elements
- ARIA attributes for screen reader compatibility
- Color contrast compliance for confidence level indicators
- Responsive design for different screen sizes and devices

### ReconShipCoordination

**Key Features:**

- Fleet formation management for recon ships
- Coordinated scanning capabilities for improved efficiency
- Formation type specialization (exploration, survey, defensive)
- Role-based ship assignments within formations
- Automatic task distribution among available ships
- Formation bonuses for scan speed, detection, and stealth
- Visual management interface for formations and coordination
- Mobile-responsive design with tabbed interface

**Implementation Details:**

- Standalone component that integrates with ReconShipManagerImpl
- Uses React hooks for state management and memoization for performance
- Implements a tabbed interface for organizing different coordination features
- Provides comprehensive formation management with role assignments
- Supports coordinated scanning with multiple ships for improved efficiency
- Includes automatic task distribution with formation prioritization
- Implements expandable/collapsible sections for better information organization
- Provides a clean API for formation and coordination management

**Usage Example:**

```tsx
<ReconShipCoordination
  ships={ships}
  sectors={sectors}
  formations={formations}
  onCreateFormation={handleCreateFormation}
  onDisbandFormation={handleDisbandFormation}
  onAddShipToFormation={handleAddShipToFormation}
  onRemoveShipFromFormation={handleRemoveShipFromFormation}
  onStartCoordinatedScan={handleStartCoordinatedScan}
  onShareTask={handleShareTask}
  onAutoDistributeTasks={handleAutoDistributeTasks}
/>
```

**Demo Component:**

A demonstration component `ReconShipCoordinationDemo` is available that showcases the `ReconShipCoordination` component with sample data. It provides a comprehensive demonstration of formation management, coordinated scanning, and automatic task distribution with real-time progress tracking and activity logging.

**File Location:**

- `src/components/exploration/ReconShipCoordination.tsx`
- `src/components/exploration/ReconShipCoordinationDemo.tsx`
- `src/managers/exploration/ReconShipManagerImpl.ts` (Enhanced with coordination capabilities)

**Related Components:**

- `src/components/exploration/AutomatedSectorScanner.tsx` - For sector scanning integration
- `src/components/exploration/RealTimeMapUpdates.tsx` - For visualizing coordinated operations

**Technical Architecture:**

The ReconShipCoordination system is built on a layered architecture:

1. **Data Layer:**

   - `ReconShipManagerImpl.ts` - Core implementation of recon ship management and coordination
   - Fleet formation data structures and coordination algorithms

2. **UI Layer:**

   - `ReconShipCoordination.tsx` - Main coordination interface
   - `ReconShipCoordinationDemo.tsx` - Demo and testing component

3. **Integration Layer:**
   - Integration with AutomatedSectorScanner for coordinated scanning
   - Integration with RealTimeMapUpdates for visualizing coordinated operations

The system uses a formation-based approach to coordination, where ships can be organized into formations with specific types (exploration, survey, defensive) and roles (leader, support, scout). Each formation provides bonuses to its member ships based on the formation type and composition. The coordination system enables more efficient scanning operations through coordinated scans and automatic task distribution.

**Performance Considerations:**

- Uses React.memo and useMemo for optimized rendering
- Implements efficient algorithms for formation management
- Provides configurable options for automatic task distribution
- Uses optimized data structures for formation tracking

**Accessibility Features:**

- Keyboard navigation support for all interactive elements
- ARIA attributes for screen reader compatibility
- Color contrast compliance for formation type indicators
- Responsive design for different screen sizes and devices

### DataAnalysisSystem

**Key Features:**

- Comprehensive data analysis for exploration data (sectors, anomalies, resources)
- Multiple analysis types (trend, correlation, distribution, clustering, prediction, etc.)
- Interactive visualizations for analysis results
- Dataset management for organizing and filtering exploration data
- Analysis configuration management for reusable analysis setups
- Insight generation for automatic pattern detection
- Support for various visualization types (charts, maps, tables, etc.)
- Mobile-responsive design with tabbed interface

**Implementation Details:**

- Standalone component that integrates with existing exploration components
- Uses React Context for state management and data sharing
- Implements a tabbed interface for organizing different analysis features
- Provides comprehensive dataset management with filtering capabilities
- Supports multiple analysis types with configurable parameters
- Generates insights based on analysis results
- Implements various visualization types for different analysis needs
- Provides a clean API for analysis configuration and execution

**Usage Example:**

```tsx
<DataAnalysisProvider>
  <DataAnalysisSystem />
</DataAnalysisProvider>
```

**Demo Component:**

A demonstration component `DataAnalysisSystemDemo` is available that showcases the `DataAnalysisSystem` component with sample data. It provides a comprehensive demonstration of dataset creation, analysis configuration, and result visualization.

**File Location:**

- `src/components/exploration/DataAnalysisSystem.tsx`
- `src/components/exploration/DataAnalysisSystemDemo.tsx`
- `src/types/exploration/DataAnalysisTypes.ts`
- `src/contexts/DataAnalysisContext.tsx`

**Related Components:**

- `src/components/exploration/ExplorationDataManager.tsx` - For data management integration
- `src/components/exploration/ResourceDiscoverySystem.tsx` - For resource data integration
- `src/components/exploration/DetailedAnomalyAnalysis.tsx` - For anomaly data integration

**Technical Architecture:**

The Data Analysis System is built on a layered architecture:

1. **Data Layer:**

   - `DataAnalysisTypes.ts` - Core interfaces and types
   - `DataAnalysisContext.tsx` - State management and data operations

2. **UI Layer:**

   - `DataAnalysisSystem.tsx` - Main analysis interface
   - `DataAnalysisSystemDemo.tsx` - Demo and testing component

3. **Analysis Layer:**
   - Dataset management for organizing exploration data
   - Analysis configuration for setting up analysis parameters
   - Analysis execution for running analyses on datasets
   - Result visualization for displaying analysis results

The system uses a dataset-based approach where exploration data is organized into datasets that can be analyzed using various analysis types. Each analysis type has its own set of parameters and visualization options. The system provides a comprehensive set of analysis types for different exploration data analysis needs.

**Analysis Types:**

1. **Trend Analysis**: Analyze how values change over time or another dimension
2. **Correlation Analysis**: Identify relationships between different variables
3. **Distribution Analysis**: Analyze how values are distributed across a range
4. **Clustering Analysis**: Group similar data points into clusters
5. **Prediction Analysis**: Predict values based on historical data
6. **Comparison Analysis**: Compare different groups of data
7. **Anomaly Detection**: Identify outliers and anomalies in the data
8. **Resource Mapping**: Visualize resource distribution across sectors
9. **Sector Analysis**: Analyze sector properties and compare sectors

**Visualization Types:**

1. **Line Chart**: Show trends over time or another dimension
2. **Bar Chart**: Compare values across categories
3. **Scatter Plot**: Show relationships between two variables
4. **Pie Chart**: Show proportions of a whole
5. **Heat Map**: Show intensity of values across two dimensions
6. **Radar Chart**: Compare multiple variables across categories
7. **Histogram**: Show distribution of values
8. **Box Plot**: Show distribution statistics
9. **Table**: Show raw data in tabular format
10. **Map**: Show spatial distribution of values
11. **Network Graph**: Show relationships between entities

**Performance Considerations:**

- Uses React.memo and useMemo for optimized rendering
- Implements efficient data structures for dataset management
- Provides configurable visualization quality for performance optimization
- Uses lazy loading for analysis results

**Accessibility Features:**

- Keyboard navigation support for all interactive elements
- ARIA attributes for screen reader compatibility
- Color contrast compliance for visualization elements
- Responsive design for different screen sizes and devices

### Exploration System Component Fixes

The Exploration System components had several linting issues that were fixed:

1. **GalaxyMapSystem.tsx**:

   - Removed unused interfaces: `CosmicEventState`, `DayNightCycleState`, `ParallaxLayer`
   - Removed unused functions: `renderSectors`, `generateParallaxLayers`, `generateCosmicEvent`
   - Removed unused state variables: `hoveredSectorId`, `setHoveredSectorId`, `parallaxLayers`, `dayNightCycle`, `setDayNightCycle`
   - Removed unused filter state and advanced filters
   - Added proper implementation of `handleSectorClick` function
   - Added helper functions for colors: `getSectorColor` and `getResourceColor`

2. **GalaxyMappingSystem.tsx**:

   - Removed unused `cosmicEvents` prop
   - Fixed duplicate `affectedSectorIds` identifier
   - Fixed unused `s` variable in filter function

3. **ReconShipCoordination.tsx**:

   - Renamed `_onShareTask` prop to `onShareTask` and made it optional
   - Added implementation for `handleShareTask` function
   - Added UI controls to use the task sharing functionality

4. **ResourceDiscoverySystem.tsx**:

   - Added implementation for the unused `quality` prop
   - Created quality settings based on the prop value
   - Used quality settings for processing speed and animations

5. **ResourcePotentialVisualization.tsx**:
   - Added implementation for the unused `quality` prop
   - Created quality settings for visualization details
   - Used the `index` variable in the `filteredSectors.map` function for animation effects

These fixes ensure that all variables, props, and functions are either properly used or removed, improving code quality and maintainability.

## Test Structure Updates

### Test Directory Structure

- **Unit Tests**: Organized into `src/tests/components/`, `src/tests/managers/`, `src/tests/hooks/`, and `src/tests/utils/`.
- **Integration Tests**: Located in `src/tests/integration/`, organized by feature area.
- **End-to-End Tests**: Found in `src/tests/e2e/`, utilizing Playwright for browser automation.
- **Performance Tests**: Located in `src/tests/performance/`, focusing on benchmark tests.
- **Tool Tests**: Found in `src/tests/tools/`, requiring Node.js features.

### Test Naming Conventions

- Unit and integration tests: `*.test.ts` or `*.test.tsx`
- End-to-end tests: `*.spec.ts`
- Performance tests: `*.benchmark.ts`
- Tool tests: `*.test.js`

### NPM Scripts for Running Tests

```json
{
  "test": "vitest",
  "test:unit": "vitest src/tests/components src/tests/utils src/tests/hooks src/tests/managers",
  "test:integration": "vitest src/tests/integration",
  "test:e2e": "playwright test",
  "test:perf": "vitest src/tests/performance",
  "test:tools": "vitest src/tests/tools"
}
```

### Test Fixtures

To improve test consistency and reduce duplication, we've added a fixtures directory with common test data:

- **Resource Fixtures** (`src/tests/fixtures/resourceFixtures.ts`): Contains common resource types, states, priorities, flow nodes, connections, and flows for testing resource-related functionality.

- **Exploration Fixtures** (`src/tests/fixtures/explorationFixtures.ts`): Provides test data for recon ships, sectors, fleet formations, and exploration tasks.

- **Mining Fixtures** (`src/tests/fixtures/miningFixtures.ts`): Includes test data for mining ships, nodes, hubs, and operations.

- **Fixture Index** (`src/tests/fixtures/index.ts`): Exports all fixtures for easy importing in tests.

Example usage in tests:

```typescript
import { resourceStates, flowNodes } from '../../fixtures';

describe('ResourceManager', () => {
  it('should handle resource state updates', () => {
    const manager = new ResourceManager();
    manager.updateState('energy', resourceStates.standard);
    expect(manager.getState('energy')).toEqual(resourceStates.standard);
  });
});
```

These fixtures help standardize test data across the test suite, making tests more consistent and easier to maintain.

### Test Utilities

We've enhanced the test utilities to make testing easier and more consistent:

#### Fixture Utilities (`src/tests/utils/fixtureUtils.ts`)

Provides utility functions for working with test fixtures:

- `createResourceState`: Creates customized resource states
- `createFlowNode`: Creates customized flow nodes
- `createMockResourceManager`: Creates a mock resource manager
- `createMockMiningManager`: Creates a mock mining manager
- `createMockExplorationManager`: Creates a mock exploration manager
- `createReconShip`, `createMiningShip`, `createSector`, `createMiningNode`: Create customized entities
- `createBatch`: Creates multiple test items with customizations

Example usage:

```typescript
import { createMockResourceManager, createFlowNode } from '../../utils/fixtureUtils';

describe('ResourceFlowComponent', () => {
  it('should render flow nodes correctly', () => {
    const mockManager = createMockResourceManager();
    const customNode = createFlowNode('producer', { efficiency: 0.95 });

    // Test with the mock manager and custom node
  });
});
```

#### Async Test Utilities (`src/tests/utils/asyncTestUtils.ts`)

Provides utilities for testing asynchronous code:

- `wait`: Waits for a specified time
- `waitForConditionAsync`: Waits for a condition to be true
- `createDeferredPromise`: Creates a promise that can be resolved externally
- `createMockEventEmitter`: Creates a mock event emitter
- `createMockTimer`: Creates a mock timer for testing time-based functionality
- `createMockRAF`: Creates a mock requestAnimationFrame implementation

Example usage:

```typescript
import { createMockEventEmitter, waitForConditionAsync } from '../../utils';

describe('EventHandler', () => {
  it('should process events asynchronously', async () => {
    const mockEmitter = createMockEventEmitter();
    const handler = new EventHandler(mockEmitter);

    mockEmitter.emit('data', { value: 42 });

    await waitForConditionAsync(() => handler.processed === true);
    expect(handler.result).toBe(42);
  });
});
```

#### Performance Test Utilities (`src/tests/utils/performanceTestUtils.ts`)

Provides utilities for performance testing:

- `measureExecTime`: Measures execution time of a function
- `runBenchmark`: Runs a benchmark for a function
- `createPerfReporter`: Creates a performance reporter for tracking metrics
- `measureMemory`: Measures memory usage of a function

Example usage:

```typescript
import { runBenchmark, createPerfReporter } from '../../utils';

describe('ResourceCalculator', () => {
  it('should perform calculations efficiently', () => {
    const calculator = new ResourceCalculator();

    const results = runBenchmark(
      () => calculator.calculateOptimalFlow(largeResourceNetwork),
      100 // Run 100 iterations
    );

    expect(results.average).toBeLessThan(50); // Should take less than 50ms
  });
});
```

#### Main Test Utilities (`src/tests/utils/testUtils.tsx`)

Provides general test utilities for React components and other functionality:

- `renderWithProviders`: Renders components with providers
- `createMockElement`: Creates a mock DOM element
- `testLoadingState`: Tests loading states in components
- `testErrorState`: Tests error states in components

#### Unified Exports (`src/tests/utils/index.ts`)

All utilities are exported from a single index file, with renamed exports to avoid naming conflicts:

```typescript
import {
  renderWithProviders,
  createMockResourceManager,
  waitForConditionAsync,
  runBenchmark,
} from '../../utils';
```

These enhanced test utilities make it easier to write consistent, reliable tests across the codebase.

## Test File Best Practices

### Vitest Test Structure

When writing tests with Vitest, follow these best practices to ensure consistent and maintainable tests:

1. **ES Module Imports**:

   - Always use ES module imports instead of CommonJS `require()`
   - For testing modules, use dynamic imports with `await import()`

   ```javascript
   // Good
   await import('../../path/to/module.js');

   // Bad
   require('../../path/to/module.js');
   ```

2. **Mocking Global Objects**:

   - Create mock objects at the top of the test file for better reusability

   ```javascript
   const mockConsole = {
     log: vi.fn(),
     error: vi.fn(),
     warn: vi.fn(),
   };

   const mockProcess = {
     argv: ['node', 'script.js'],
     exit: vi.fn(),
     stdout: { write: vi.fn() },
   };
   ```

3. **Using Mock Objects**:

   - Use `vi.stubGlobal()` to mock global objects
   - Reference mock objects in assertions instead of global objects

   ```javascript
   // Setup
   vi.stubGlobal('console', mockConsole);
   vi.stubGlobal('process', mockProcess);

   // Assertions
   expect(mockConsole.log).toHaveBeenCalled();
   expect(mockProcess.exit).toHaveBeenCalledWith(0);
   ```

4. **Overriding Mock Properties**:

   - Use the spread operator to preserve existing mock properties when overriding specific ones

   ```javascript
   vi.stubGlobal('process', {
     ...mockProcess,
     argv: ['node', 'script.js', '--flag'],
   });
   ```

5. **Async Test Functions**:

   - Make test functions async when using dynamic imports

   ```javascript
   it('should test something', async () => {
     await import('../../path/to/module.js');
     // test assertions
   });
   ```

6. **Resetting Mocks**:

   - Reset all mocks before each test to ensure test isolation

   ```javascript
   beforeEach(() => {
     vi.resetAllMocks();
   });

   afterEach(() => {
     vi.resetAllMocks();
   });
   ```

7. **Mock Implementation**:
   - Use `mockImplementation` for complex mock behavior
   ```javascript
   mockFunction.mockImplementation((arg1, arg2) => {
     if (arg1 === 'specific value') {
       return 'special result';
     }
     return 'default result';
   });
   ```

Following these practices ensures consistent test structure, proper isolation between tests, and avoids common linting errors.

## Test Utilities and Fixtures

### Resource State Fixtures

The `fixtureUtils.ts` file provides utility functions for creating test fixtures. These utilities help maintain consistency across tests and reduce code duplication.

#### Resource State Creation

The `createResourceState` function creates customized resource states for testing:

```typescript
export function createResourceState(
  resourceType: ResourceType,
  overrides: Partial<typeof resourceStates.standard> = {}
) {
  // Apply resource-specific defaults based on type
  const typeDefaults: Record<ResourceType, Partial<typeof resourceStates.standard>> = {
    minerals: { production: 10, consumption: 5, max: 1000, current: 100, min: 0 },
    energy: { production: 20, consumption: 15, max: 2000, current: 200, min: 0 },
    // ... other resource types
  };

  return {
    ...resourceStates.standard,
    ...typeDefaults[resourceType],
    ...overrides,
  };
}
```

This approach:

1. Uses the `resourceType` parameter to apply type-specific defaults
2. Starts with the standard resource state as a base
3. Applies type-specific defaults based on the resource type
4. Finally applies any custom overrides provided by the caller

This pattern ensures that:

- All resource types have sensible defaults
- Tests can easily customize specific properties
- The code is type-safe by using the correct properties from the ResourceState interface

### Handling Unused Variables

When encountering unused variables in the codebase:

1. **Evaluate the intent**: Determine if the variable was meant to be used but was overlooked
2. **Make it meaningful**: If the variable should be used, find a way to incorporate it meaningfully
3. **Remove if unnecessary**: If the variable is truly not needed, remove it from the parameter list
4. **Document the decision**: Update relevant documentation to explain the approach taken

In the case of `resourceType` in `createResourceState`, we determined that it should be used to provide type-specific defaults, making the function more useful and eliminating the unused variable warning.

### Mocking ES Modules in Tests

When mocking ES modules in Vitest tests, follow these best practices:

1. **Create mock functions outside vi.mock() calls**:

   ```typescript
   // Create mock functions first
   const mockExistSync = vi.fn();
   const mockWriteFileSync = vi.fn();

   // Then use them in the mock
   vi.mock('fs', async () => {
     return {
       existsSync: mockExistSync,
       writeFileSync: mockWriteFileSync,
       default: {
         existsSync: mockExistSync,
         writeFileSync: mockWriteFileSync,
       },
     };
   });
   ```

2. **Always include both named exports and default exports**:

   - ES modules can be imported using both named imports and default imports
   - Ensure your mocks support both patterns by providing both formats

3. **Reset modules between tests**:

   ```typescript
   beforeEach(() => {
     vi.resetModules();
   });
   ```

4. **Use flexible assertions for file paths**:

   - Different environments may represent paths differently
   - Use content-based assertions rather than exact path matching:

   ```typescript
   // Instead of:
   expect(mockWriteFileSync).toHaveBeenCalledWith('.vscode/settings.json', expect.any(String));

   // Use:
   const settingsCall = mockWriteFileSync.mock.calls.find(
     call => typeof call[1] === 'string' && call[1].includes('editor.formatOnSave')
   );
   expect(settingsCall).toBeDefined();
   ```

5. **Clean up global mocks after tests**:
   ```typescript
   afterEach(() => {
     vi.resetAllMocks();
     vi.unstubAllGlobals();
   });
   ```

### Performance Testing Best Practices

When writing performance tests, follow these guidelines to ensure reliable and meaningful results:

1. **Avoid setTimeout for simulating slow operations**:

   - setTimeout is unreliable in test environments
   - Timing can vary significantly between runs
   - Tests may pass or fail inconsistently

2. **Use CPU-intensive operations for reliable timing**:

   ```typescript
   function cpuIntensiveFunction(iterations: number): number {
     let result = 0;
     for (let i = 0; i < iterations; i++) {
       result += Math.sin(i) * Math.cos(i);
     }
     return result;
   }

   // Use in test
   const { executionTimeMs } = measureExecutionTime(() => {
     cpuIntensiveFunction(10000);
   });
   ```

3. **Test for relative timing values, not exact values**:

   ```typescript
   // Instead of:
   expect(executionTimeMs).toBe(100);

   // Use:
   expect(executionTimeMs).toBeGreaterThan(0);
   ```

4. **Ensure performance metrics are collected correctly**:

   ```typescript
   const reporter = new PerformanceReporter();

   // Run multiple iterations
   for (let i = 0; i < 5; i++) {
     const result = cpuIntensiveFunction(1000);
     reporter.recordMetric('calculation', result);
   }

   // Verify metrics
   const metrics = reporter.getMetrics();
   expect(metrics.calculation.iterations).toBe(5);
   expect(metrics.calculation.min).toBeGreaterThan(0);
   ```

5. **Isolate performance tests from external factors**:
   - Avoid network requests or file system operations
   - Mock external dependencies
   - Focus on measuring specific operations

## Best Practices for Mocking in Test Files

When writing tests that require mocking external dependencies, follow these best practices to ensure reliable and maintainable tests:

### Module Mocking

1. **Mock both named and default exports**:

   ```javascript
   vi.mock('fs', () => ({
     // Named exports
     writeFileSync: mockWriteFileSync,
     existsSync: mockExistsSync,

     // Default export
     default: {
       writeFileSync: mockWriteFileSync,
       existsSync: mockExistsSync,
     },
   }));
   ```

2. **Use importOriginal for partial mocking**:

   ```javascript
   vi.mock('node:timers', async importOriginal => {
     const actual = await importOriginal();
     return {
       ...actual,
       setTimeout: mockSetTimeout,
       clearTimeout: mockClearTimeout,
       default: {
         ...actual.default,
         setTimeout: mockSetTimeout,
         clearTimeout: mockClearTimeout,
       },
     };
   });
   ```

3. **Create mock functions outside vi.mock() calls**:

   ```javascript
   // Define mock functions outside vi.mock() for better reuse
   const mockWriteFileSync = vi.fn();
   const mockExistsSync = vi.fn();

   vi.mock('fs', () => ({
     writeFileSync: mockWriteFileSync,
     existsSync: mockExistsSync,
   }));
   ```

### Global Object Mocking

1. **Direct replacement for simple tests**:

   ```javascript
   // Store original objects
   const originalProcess = globalThis.process;
   const originalConsole = globalThis.console;

   // Create mock objects
   const mockProcess = {
     /* ... */
   };
   const mockConsole = {
     /* ... */
   };

   // Replace global objects
   globalThis.process = mockProcess;
   globalThis.console = mockConsole;

   // Restore in afterEach
   afterEach(() => {
     globalThis.process = originalProcess;
     globalThis.console = originalConsole;
   });
   ```

2. **Use vi.stubGlobal for more complex tests**:

   ```javascript
   // Create mock objects
   const mockProcess = {
     /* ... */
   };
   const mockConsole = {
     /* ... */
   };

   // Stub global objects
   vi.stubGlobal('process', mockProcess);
   vi.stubGlobal('console', mockConsole);

   // Restore in afterEach
   afterEach(() => {
     vi.unstubAllGlobals();
   });
   ```

### Event-Based API Mocking

1. **Capture callbacks directly**:

   ```javascript
   // Store callbacks for later use
   let dataCallback;
   let endCallback;

   // Mock the event registration
   mockProcess.stdin.on.mockImplementation((event, callback) => {
     if (event === 'data') dataCallback = callback;
     if (event === 'end') endCallback = callback;
     return mockProcess.stdin;
   });

   // Call the callbacks directly in the test
   dataCallback(sampleData);
   endCallback();
   ```

2. **Implement comprehensive interface mocks**:
   ```javascript
   // Mock readline interface with all required methods
   vi.mock('readline', () => ({
     createInterface: vi.fn(() => ({
       question: vi.fn((query, callback) => callback('y')),
       close: vi.fn(),
       on: vi.fn(),
       pause: vi.fn(),
       resume: vi.fn(),
       write: vi.fn(),
       input: {
         on: vi.fn(),
         pause: vi.fn(),
         resume: vi.fn(),
       },
       output: {
         on: vi.fn(),
         write: vi.fn(),
       },
     })),
   }));
   ```

### Test Cleanup and Isolation

1. **Reset modules between tests**:

   ```javascript
   beforeEach(() => {
     vi.resetModules();
     vi.resetAllMocks();
   });
   ```

2. **Restore global objects**:

   ```javascript
   afterEach(() => {
     globalThis.process = originalProcess;
     globalThis.console = originalConsole;
     // Or
     vi.unstubAllGlobals();
   });
   ```

3. **Clear mock state**:
   ```javascript
   afterEach(() => {
     vi.clearAllMocks(); // Clears mock.mock.calls and mock.mock.results
     vi.resetAllMocks(); // Clears mock.mock and resets implementation
     vi.restoreAllMocks(); // Restores original implementation
   });
   ```

### Simplifying Test Approach

1. **Focus on core functionality**:

   - Test the most important aspects of the code
   - Don't try to test every detail
   - Prioritize critical paths

2. **Use simpler assertions**:

   - Make assertions more flexible for timing-related values
   - Use `expect.any(Type)` for dynamic values
   - Use `expect.stringContaining()` for partial string matches

3. **Reduce test complexity**:
   - Break complex tests into smaller, focused tests
   - Use helper functions for common test patterns
   - Avoid complex setup and teardown logic

### Common Pitfalls to Avoid

1. **Incomplete mocks**: Missing methods or properties in mocks
2. **Inconsistent mocking patterns**: Different approaches across files
3. **Missing cleanup**: Not restoring global objects or resetting mocks
4. **Over-specific assertions**: Testing implementation details rather than behavior
5. **Complex test setup**: Making tests hard to understand and maintain

By following these best practices, you can create more reliable, maintainable, and effective tests that properly isolate the code under test from its dependencies.
