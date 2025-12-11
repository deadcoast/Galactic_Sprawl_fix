---
GALACTIC SPRAWL SYSTEM ARCHITECTURE
---

## Table of Contents

1. [End-to-End Testing with Playwright](#end-to-end-testing-with-playwright)
   - [Playwright Setup and Configuration](#playwright-setup-and-configuration)
   - [Page Object Model Pattern](#page-object-model-pattern)
   - [Test Structure](#test-structure)
   - [Test Isolation and WebSocket Server Conflict Resolution](#test-isolation-and-websocket-server-conflict-resolution)
   - [TypeScript Integration](#typescript-integration)
   - [Documentation](#documentation)
2. [Ship Ability System](#ship-ability-system)
   - [Ship Ability Type Requirements](#ship-ability-type-requirements)
   - [Best Practices for Ship Abilities](#best-practices-for-ship-abilities)
3. [Linting and Type Safety](#linting-and-type-safety)
   - [Linter Configuration](#linter-configuration)
   - [Linting Workflow and Testing](#linting-workflow-and-testing)
   - [Linting Issue Fixes](#linting-issue-fixes)
     - [Fixing TypeScript `any` Types](#fixing-typescript-any-types)
     - [Fixing Console Statements](#fixing-console-statements)
   - [Type Safety Best Practices](#type-safety-best-practices)
   - [State Management Best Practices](#state-management-best-practices)
   - [Core Architecture Principles](#core-architecture-principles)
   - [Component Architecture](#component-architecture)
   - [System Integration Rules](#system-integration-rules)
   - [Critical Requirements](#critical-requirements)
   - [System-Specific Rules](#system-specific-rules)
   - [Development Guidelines](#development-guidelines)
   - [Event Handling Best Practices](#event-handling-best-practices)
   - [Case Block Lexical Declaration Best Practices](#case-block-lexical-declaration-best-practices)
   - [DOM Element Typing Best Practices](#dom-element-typing-best-practices)
   - [TypeScript Linting Issue Resolution](#typescript-linting-issue-resolution)
     - [Approach to Fixing Explicit `any` Types](#approach-to-fixing-explicit-any-types)
     - [Best Practices for Type Safety](#best-practices-for-type-safety)
   - [Linting Progress](#linting-progress)
   - [TypeScript Error Fixes](#typescript-error-fixes)
     - [EventEmitter Generic Type Constraints](#eventemitter-generic-type-constraints)
     - [Type Assertion Issues](#type-assertion-issues)
     - [Map Iteration Issues](#map-iteration-issues)
     - [Automation Rule Type Fixes](#automation-rule-type-fixes)
     - [Generic Components](#generic-components)
     - [Type Consistency for Union Types vs Object Types](#type-consistency-for-union-types-vs-object-types)
     - [Ship Ability Issues](#ship-ability-issues)
     - [Property Access on Possibly Undefined Values](#property-access-on-possibly-undefined-values)
     - [Incompatible Type Assignments](#incompatible-type-assignments)
     - [Handling Underscore-Prefixed Variables](#handling-underscore-prefixed-variables)
   - [Documenting Unused Interfaces](#documenting-unused-interfaces)
4. [Architecture Principles](#architecture-principles)
   - [Core Architecture Principles](#core-architecture-principles)
   - [Component Architecture](#component-architecture)
   - [System Integration Rules](#system-integration-rules)
   - [Documentation](#documentation-1)
5. [Unit Testing Best Practices](#unit-testing-best-practices)
   - [WebSocket Server Testing](#websocket-server-testing)
   - [Test Context Providers](#test-context-providers)
   - [Handling Unused Variables in Test Code](#handling-unused-variables-in-test-code)
6. [UI Component Integration](#ui-component-integration)
   - [GameHUD Component Integration](#gamehud-component-integration)
   - [GameHUD Component Enhancements (March 2025)](#gamehud-component-enhancements-march-2025)
7. [System Integration Components](#system-integration-components)
   - [Event Propagation System](#event-propagation-system)
   - [Error Handling System](#error-handling-system)
   - [UI Component Event Registration](#ui-component-event-registration)

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
   test.describe("Mining Operations", () => {
     let miningPage: MiningPage;

     test.beforeEach(async ({ page }) => {
       miningPage = new MiningPage(page);
       await miningPage.goto();
     });

     test("should display resource list", async ({ page }) => {
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
     import { getCurrentPort } from "./src/tests/e2e/test-setup";

     export default defineConfig({
       // ...
       projects: [
         {
           name: "chromium",
           use: {
             baseURL: `http://localhost:${getCurrentPort()}`,
           },
         },
         // ...
       ],
       webServer: {
         command: "npm run dev",
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
   import { test as baseTest, expect, Page } from "@playwright/test";
   import { MiningPage } from "./models/MiningPage";

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

## Linting and Type Safety

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
     return obj && typeof obj === "object" && "id" in obj;
   }

   // After
   function isValidResource(obj: unknown): obj is Resource {
     return (
       obj !== null &&
       obj !== undefined &&
       typeof obj === "object" &&
       "id" in obj
     );
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
   const config = (
     manager as unknown as { configs: Map<string, Config> }
   ).configs.get(type);
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
   function convertMapToRecord<K extends string, V>(
     map: Map<K, V>,
   ): Record<K, V> {
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
   mockNodes.forEach((node) => flowManager.registerNode(node));
   mockConnections.forEach((conn) => flowManager.registerConnection(conn));

   // Or create a flow to set up the internal state
   const flow: ResourceFlow = {
     sourceId: "source1",
     targetId: "target1",
     resourceType: "energy",
     amount: 100,
   };
   flowManager.addFlow(flow);
   ```

7. **Handle unknown types safely**: When working with unknown types, add proper type checking before accessing properties.

   ```typescript
   // Before
   function isHazard(obj: any): obj is Hazard {
     return obj && typeof obj === "object" && "id" in obj && "position" in obj;
   }

   // After
   function isHazard(obj: unknown): obj is Hazard {
     return (
       obj !== null &&
       obj !== undefined &&
       typeof obj === "object" &&
       "id" in obj &&
       "position" in obj
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
   console.log(
     `[ResourceFlowManager] Found ${converters.length} active converters in the network`,
   );

   // After (ESLint compliant)
   console.warn(
     `[ResourceFlowManager] Found ${converters.length} active converters in the network`,
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

4. **Documentation for Type Relationships**: Clearly document the relationship between different types.

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
   const abilityId = `${ship.id}-${w.name.toLowerCase().replace(/\s+/g, "-")}-ability`;
   ```

3. **Complete All Required Properties for Effect Objects**: When creating effect objects, ensure that all required properties are included, such as `name` and `description` for `DamageEffect` objects.

   ```typescript
   // Before (missing 'name' and 'description' properties)
   const weaponEffect: DamageEffect = {
     id: "rage-mode-weapon",
     type: "damage",
     duration: 10,
     strength: 1.5,
     magnitude: 1.5,
     damageType: "physical",
     penetration: 0.3,
   };

   // After (with all required properties)
   const weaponEffect: DamageEffect = {
     id: "rage-mode-weapon",
     name: "Rage Mode Weapon Effect",
     description: "Increases weapon damage at the cost of defense",
     type: "damage",
     duration: 10,
     strength: 1.5,
     magnitude: 1.5,
     damageType: "physical",
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
       typeof pos === "object" &&
       "x" in pos &&
       "y" in pos &&
       typeof pos.x === "number" &&
       typeof pos.y === "number"
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
   setAutomationEffects((prev) => [
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
     typeof event.data.position === "object" &&
     "x" in event.data.position &&
     "y" in event.data.position
       ? { x: Number(event.data.position.x), y: Number(event.data.position.y) }
       : { x: 50, y: 50 };

   setAutomationEffects((prev) => [
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
   const message = event.data?.message || "No message provided";
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
   const moduleConfigs = (
     moduleManager as unknown as { configs: Map<string, ModuleConfig> }
   ).configs;
   ```

4. **Create Helper Functions for Type Conversions**: When converting between different types, create helper functions to ensure type safety.

   ```typescript
   // Helper function to convert string to FactionBehaviorConfig
   const createFactionBehavior = (behavior: string): FactionBehaviorConfig => {
     return {
       formation: "standard",
       behavior: behavior as FactionBehaviorType,
     };
   };

   // Using the helper function
   const tactics =
     typeof tacticsInput === "string"
       ? createFactionBehavior(tacticsInput)
       : tacticsInput;
   ```

5. **Use Type Guards for Union Types**: When working with union types, use type guards to narrow down the type before using it.

   ```typescript
   // Type guard for AutomationEffectType
   const isValidEffectType = (type: string): type is AutomationEffectType => {
     return [
       "shield",
       "formation",
       "engagement",
       "repair",
       "attack",
       "retreat",
     ].includes(type);
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
       console.warn("Module status changed handler to be implemented");
     }
   };
   ```

2. **Implement Variables with Type-Safe Approach**: When implementing previously unused variables, use a type-safe approach with thorough null checks and proper type guards.

   ```typescript
   // Calculate position based on event data or use random positioning as fallback
   const eventPosition = {
     x:
       typeof event.data === "object" &&
       event.data !== null &&
       "position" in event.data &&
       typeof event.data.position === "object" &&
       event.data.position !== null &&
       "x" in event.data.position &&
       typeof event.data.position.x === "number"
         ? event.data.position.x
         : Math.random() * 100,
     y:
       typeof event.data === "object" &&
       event.data !== null &&
       "position" in event.data &&
       typeof event.data.position === "object" &&
       event.data.position !== null &&
       "y" in event.data.position &&
       typeof event.data.position.y === "number"
         ? event.data.position.y
         : Math.random() * 100,
   };

   // Create helper functions that use the variable
   const getEventColor = () => {
     switch (event.type) {
       case "exploration":
         return "bg-teal-400";
       case "combat":
         return "bg-red-400";
       case "trade":
         return "bg-amber-400";
       case "diplomacy":
         return "bg-purple-400";
       default:
         return "bg-teal-400";
     }
   };
   ```

3. **Add Placeholder Implementation**: For functions that are required by the interface but not yet fully implemented, add a minimal placeholder implementation with a console.warn statement to indicate future implementation.

   ```typescript
   // Function required by interface but not yet implemented
   const _calculateTotals = useCallback(
     (resources: ResourceState[]): ResourceTotals => {
       // Placeholder implementation
       console.warn("Resource total calculation to be implemented");
       return {
         energy: 0,
         minerals: 0,
         organics: 0,
       };
     },
     [resources],
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

## Exploration System Components

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
const [searchQuery, setSearchQuery] = useState("");

// Apply filters to data
const filteredSectors = sectors.filter((sector) => {
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
    setSearchQuery("");
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
  <DiscoveryClassification
    discovery={discoveryData}
    onClassify={handleClassify}
    compact={false}
  />
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
import { resourceStates, flowNodes } from "../../fixtures";

describe("ResourceManager", () => {
  it("should handle resource state updates", () => {
    const manager = new ResourceManager();
    manager.updateState("energy", resourceStates.standard);
    expect(manager.getState("energy")).toEqual(resourceStates.standard);
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
import {
  createMockResourceManager,
  createFlowNode,
} from "../../utils/fixtureUtils";

describe("ResourceFlowComponent", () => {
  it("should render flow nodes correctly", () => {
    const mockManager = createMockResourceManager();
    const customNode = createFlowNode("producer", { efficiency: 0.95 });

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
import { createMockEventEmitter, waitForConditionAsync } from "../../utils";

describe("EventHandler", () => {
  it("should process events asynchronously", async () => {
    const mockEmitter = createMockEventEmitter();
    const handler = new EventHandler(mockEmitter);

    mockEmitter.emit("data", { value: 42 });

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
import { runBenchmark, createPerfReporter } from "../../utils";

describe("ResourceCalculator", () => {
  it("should perform calculations efficiently", () => {
    const calculator = new ResourceCalculator();

    const results = runBenchmark(
      () => calculator.calculateOptimalFlow(largeResourceNetwork),
      100, // Run 100 iterations
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
} from "../../utils";
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
   await import("../../path/to/module.js");

   // Bad
   require("../../path/to/module.js");
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
     argv: ["node", "script.js"],
     exit: vi.fn(),
     stdout: { write: vi.fn() },
   };
   ```

3. **Using Mock Objects**:
   - Use `vi.stubGlobal()` to mock global objects
   - Reference mock objects in assertions instead of global objects

   ```javascript
   // Setup
   vi.stubGlobal("console", mockConsole);
   vi.stubGlobal("process", mockProcess);

   // Assertions
   expect(mockConsole.log).toHaveBeenCalled();
   expect(mockProcess.exit).toHaveBeenCalledWith(0);
   ```

4. **Overriding Mock Properties**:
   - Use the spread operator to preserve existing mock properties when overriding specific ones

   ```javascript
   vi.stubGlobal("process", {
     ...mockProcess,
     argv: ["node", "script.js", "--flag"],
   });
   ```

5. **Async Test Functions**:
   - Make test functions async when using dynamic imports

   ```javascript
   it("should test something", async () => {
     await import("../../path/to/module.js");
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
     if (arg1 === "specific value") {
       return "special result";
     }
     return "default result";
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
  overrides: Partial<typeof resourceStates.standard> = {},
) {
  // Apply resource-specific defaults based on type
  const typeDefaults: Record<
    ResourceType,
    Partial<typeof resourceStates.standard>
  > = {
    minerals: {
      production: 10,
      consumption: 5,
      max: 1000,
      current: 100,
      min: 0,
    },
    energy: {
      production: 20,
      consumption: 15,
      max: 2000,
      current: 200,
      min: 0,
    },
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

### UI Library Mocking

The `mockUtils.ts` file provides utilities for mocking UI libraries and components used in the application. These utilities help ensure consistent and reliable testing of UI components.

#### Framer-Motion Mocking

Framer-motion is used extensively throughout the application for animations and transitions. Testing components that use framer-motion can be challenging because it relies on browser APIs like `window.matchMedia` that aren't available in the test environment.

The `createFramerMotionMock` function provides a standardized way to mock framer-motion:

```typescript
/**
 * Creates a mock for framer-motion to avoid matchMedia issues in tests
 *
 * @returns A mock implementation of framer-motion
 */
export function createFramerMotionMock() {
  return {
    __esModule: true,
    motion: {
      div: ({ children, ...props }: MotionComponentProps) =>
        React.createElement(
          "div",
          { "data-testid": "motion-div", ...props },
          children,
        ),
      span: ({ children, ...props }: MotionComponentProps) =>
        React.createElement(
          "span",
          { "data-testid": "motion-span", ...props },
          children,
        ),
      // Additional components as needed
    },
    AnimatePresence: ({ children }: AnimatePresenceProps) =>
      React.createElement(React.Fragment, null, children),
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn(),
    }),
    useCycle: <T>(...args: T[]) => {
      const [current, setCurrent] = React.useState(0);
      const cycle = () => setCurrent((prev) => (prev + 1) % args.length);
      return [args[current], cycle] as [T, () => void];
    },
    // Additional hooks as needed
  };
}
```

To use this mock in a test file:

```typescript
import { createFramerMotionMock } from "../../utils/mockUtils";

// Mock framer-motion to avoid matchMedia issues
vi.doMock("framer-motion", () => createFramerMotionMock());
```

Key benefits of this approach:

1. Avoids issues with browser APIs like `window.matchMedia` that aren't available in the test environment
2. Provides a consistent and predictable rendering of framer-motion components in tests
3. Uses React.createElement instead of JSX syntax to avoid issues in TypeScript files
4. Adds data-testid attributes to make it easier to select elements in tests
5. Can be reused across all tests that use framer-motion components

This approach was successfully used to fix the ResourceVisualization.snapshot.test.tsx test that was failing due to framer-motion's `prefersReducedMotion` feature trying to use `window.matchMedia`.

### Mock Manager Creation

## Testing Best Practices

### Test Imports and Mocking

When writing tests, it's important to follow these best practices for imports and mocking:

1. **Prefer Actual Implementations Over Local Mocks**
   - Import and use actual utility functions from shared test utilities when available
   - Only create local mock implementations when the actual implementation doesn't exist or needs to be overridden for specific test cases
   - Example:

     ```typescript
     // Good: Import the actual utility function
     import { createTestEnvironment } from "../../utils/exploration/explorationTestUtils";

     // Bad: Create a local mock that duplicates functionality
     const createTestEnvironment = vi.fn(() => ({
       // Duplicate implementation...
     }));
     ```

2. **Centralize Mocks in Utility Files**
   - Create reusable mock implementations in centralized utility files
   - Use these shared mocks across multiple test files for consistency
   - Example:

     ```typescript
     // In mockUtils.ts
     export function createFramerMotionMock() {
       // Implementation...
     }

     // In test file
     import { createFramerMotionMock } from "../../utils/mockUtils";
     vi.doMock("framer-motion", () => createFramerMotionMock());
     ```

3. **Mock External Dependencies, Not Test Utilities**
   - Mock external libraries and modules that are not part of your codebase
   - Don't mock your own test utilities unless absolutely necessary
   - Example:

     ```typescript
     // Good: Mock external library
     vi.mock("framer-motion", () => ({
       // Mock implementation...
     }));

     // Bad: Mock your own test utility
     vi.mock("../../utils/testUtils", () => ({
       // Mock implementation...
     }));
     ```

4. **Use vi.doMock for Hoisted Mocks**
   - Use `vi.doMock` instead of `vi.mock` when you need to avoid hoisting issues
   - This is especially important when the mock depends on variables defined in the test file
   - Example:

     ```typescript
     // Define variables first
     const mockFunction = vi.fn();

     // Then use doMock to avoid hoisting issues
     vi.doMock("module-name", () => ({
       functionName: mockFunction,
     }));
     ```

5. **Maintain Import Statements When Refactoring**
   - When refactoring test files, ensure that all necessary imports are maintained
   - Missing imports can lead to undefined errors that are difficult to debug
   - Example of a common error:
     ```typescript
     // Error: Missing import for createTestEnvironment
     const { explorationManager } = createTestEnvironment(); // Will fail with "createTestEnvironment is not defined"
     ```

6. **Verify Mock Return Values**
   - Ensure that mock functions return appropriate values for the test
   - Use TypeScript to enforce correct return types
   - Example:
     ```typescript
     // Define return type for mock function
     const mockFunction = vi.fn<[string], boolean>().mockReturnValue(true);
     ```

7. **Clean Up Mocks Between Tests**
   - Reset or clear mocks in beforeEach or afterEach hooks
   - This prevents test interference and ensures a clean state for each test
   - Example:
     ```typescript
     beforeEach(() => {
       vi.clearAllMocks();
     });
     ```

8. **Document Mock Behavior**
   - Add comments explaining the behavior of complex mocks
   - This helps other developers understand the test setup
   - Example:
     ```typescript
     // Mock searchSystems to return different results based on criteria
     searchSystems: vi.fn(criteria => {
       // Return single system when searching by name
       if (criteria.name) {
         return [{ id: 'system-1', name: 'System 1' }];
       }
       // Return multiple systems when searching by type
       else if (criteria.type) {
         return Array.from({ length: 7 }, (_, i) => ({
           id: `system-${i}`,
           name: `System ${i}`,
           type: criteria.type,
         }));
       }
       // Return empty array for other criteria
       return [];
     }),
     ```

By following these best practices, you can avoid common issues with test imports and mocking, such as the undefined error encountered in the ExplorationManager.test.ts file. Proper import management and mocking strategies lead to more reliable and maintainable tests.

## Testing Best Practices - Simplified Approach

### Overview

We've adopted a simplified testing approach that focuses on testing what users see and interact with, rather than implementation details. This approach leads to more maintainable and reliable tests that are less likely to break when the component implementation changes.

### Key Principles

1. **Test behavior, not implementation details**
   - Focus on what components/functions do, not how they do it
   - Test from the user's perspective
   - Verify that components render correctly and respond to user interactions

2. **Minimize mocks**
   - Only mock external dependencies when absolutely necessary
   - Use real implementations whenever possible
   - Avoid mocking React, DOM APIs, or internal utilities

3. **Keep tests simple and focused**
   - Each test should verify one specific aspect of functionality
   - Avoid complex setup and teardown procedures
   - Use descriptive test names that clearly indicate what's being tested

4. **Use flexible selectors**
   - Prefer selectors that are less likely to change, such as text content, roles, and labels
   - Avoid relying on implementation details like class names or DOM structure
   - Use data-testid attributes sparingly and only for elements that can't be selected otherwise

5. **Handle multiple matching elements gracefully**
   - When multiple elements might match a selector, use `getAllBy` variants and filter the results
   - Use more specific selectors to narrow down the search
   - Check for the presence of elements rather than their exact count or structure

### Example: Testing a Component with Multiple Similar Elements

```typescript
// Bad approach - might fail if multiple buttons have no accessible name
const button = screen.getByRole("button", { name: "" });

// Good approach - get all buttons and find the one with the specific icon
const buttons = screen.getAllByRole("button");
const targetButton = Array.from(buttons).find((button) =>
  button.querySelector(".specific-icon-class"),
);
expect(targetButton).toBeTruthy();
```

### Example: Testing Text That Appears Multiple Times

```typescript
// Bad approach - will fail if multiple elements contain the text
const element = screen.getByText(/common text/i);

// Good approach - check that at least one element contains the text
const elements = screen.getAllByText(/common text/i);
expect(elements.length).toBeGreaterThan(0);

// Alternative approach - use queryAllBy and check the length
const elements = screen.queryAllByText(/common text/i);
expect(elements.length > 0).toBeTruthy();
```

### Example: Testing Component Structure

```typescript
// Bad approach - too dependent on implementation details
expect(screen.getByTestId("specific-container")).toHaveClass("specific-class");

// Good approach - focus on what the user sees
expect(screen.getByText("Visible Title")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
```

### Benefits of This Approach

1. **More robust tests**: Tests are less likely to break when implementation details change
2. **Better developer experience**: Tests are easier to write and maintain
3. **Faster test development**: Less time spent on complex mocking and setup
4. **More meaningful test failures**: When tests fail, it's more likely to indicate a real issue
5. **Better representation of user experience**: Tests verify what users actually see and do

By following these principles, we can create a test suite that provides confidence in our code while remaining maintainable and resilient to changes.

## E2E Testing Best Practices

### Key Principles

1. **Test against real application**
   - Use actual application routes and components
   - Avoid simplified HTML pages with `page.setContent()`
   - Test real user flows with proper navigation

2. **Robust error handling**
   - Implement checks for game initialization errors
   - Take screenshots when errors occur for debugging
   - Log detailed page content to diagnose issues

3. **Flexible selectors**
   - Use selectors that can adapt to UI changes
   - Prefer text-based selectors when possible (e.g., `h1:has-text("Mineral Processing")`)
   - Use longer timeouts for critical elements

4. **Port configuration**
   - Development server runs on port 3001 (configured in `vite.config.ts`)
   - Playwright tests connect to port 3001 (configured in `playwright.config.ts`)
   - E2E tests use `http://localhost:3001/` in their navigation
   - Set `strictPort: false` to allow fallback ports

### Example E2E Test

```typescript
test("should display exploration interface", async ({ page }) => {
  // Navigate to the actual application
  await page.goto("http://localhost:3001/");

  try {
    // Wait for the application to load with a generous timeout
    await page.waitForSelector(".exploration-interface", { timeout: 30000 });

    // Verify expected elements are visible
    await expect(page.locator(".star-system-list")).toBeVisible();

    // Take a screenshot for debugging
    await page.screenshot({ path: "exploration-interface.png" });

    // Test user interaction
    await page.fill('input[placeholder*="Search"]', "Alpha");

    // Verify search results
    const results = page.locator('.star-system:has-text("Alpha")');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  } catch (error) {
    // Check for initialization errors
    const pageContent = await page.content();
    if (pageContent.includes("Game failed to initialize")) {
      console.error("Game initialization error detected");
      await page.screenshot({ path: "game-init-error.png" });
      throw new Error(
        "Game failed to initialize - error found in page content",
      );
    }
    throw error;
  }
});
```

### Running E2E Tests

- Use Playwright test runner, not Vitest: `npm run test:e2e`
- For specific files: `npx playwright test src/tests/e2e/exploration.spec.ts`
- For debugging: `npm run test:e2e:debug`, `npm run test:e2e:ui`, or `npm run test:e2e:headed`
- The webServer configuration in playwright.config.ts automatically starts the dev server

## Testing Best Practices - Removing Mocks

### The Problem with Mocks

Mocking in tests can lead to several issues:

1. **Tests verify mock behavior, not actual behavior**: When using mocks, tests often end up verifying that the mocks work as expected, not that the actual code works correctly.
2. **Brittle tests**: Tests with mocks can break when implementation details change, even if the behavior remains the same.
3. **Maintenance burden**: Mocks need to be updated whenever the implementation changes, creating additional maintenance work.
4. **False confidence**: Passing tests with mocks can give a false sense of confidence that the code works correctly.

### Our Approach: Using Actual Implementations

Instead of using mocks, we've adopted an approach that uses actual implementations in tests:

1. **Create factory functions for test setup**: Instead of mocking dependencies, create factory functions that return actual implementations with test data.
2. **Use actual components and services**: Test the actual components and services, not mock versions of them.
3. **Focus on behavior, not implementation details**: Test what the code does, not how it does it.
4. **Use proper type safety**: Ensure that tests use proper types and interfaces to catch type errors early.

### Example: ExplorationManager.test.ts

The ExplorationManager.test.ts file was previously using a mocked implementation of `createTestEnvironment` from a utility file. We replaced this with actual implementations:

```typescript
// Before (using mocks)
import { createTestEnvironment } from "../../utils/exploration/explorationTestUtils";

describe("ExplorationManager", () => {
  it("should handle ship assignment", async () => {
    const { explorationManager, shipManager } = createTestEnvironment();
    // Test with mock implementations
  });
});

// After (using actual implementations)
import {
  ExplorationManagerImpl,
  type StarSystem,
} from "../../../managers/exploration/ExplorationManagerImpl";
import { ShipManagerImpl } from "../../../managers/ships/ShipManagerImpl";

// Create a factory function for test setup with actual implementations
function createTestEnvironmentWithActualImplementations() {
  const shipManager = new ShipManagerImpl();
  const explorationManager = new ExplorationManagerImpl(shipManager);

  return {
    explorationManager,
    shipManager,
  };
}

describe("ExplorationManager", () => {
  it("should handle ship assignment", async () => {
    const { explorationManager, shipManager } =
      createTestEnvironmentWithActualImplementations();
    // Test with actual implementations
  });
});
```

### Benefits of This Approach

1. **Tests verify actual behavior**: Tests now verify that the actual code works correctly, not just that mocks work as expected.
2. **More robust tests**: Tests are less likely to break when implementation details change, as long as the behavior remains the same.
3. **Reduced maintenance burden**: No need to update mocks when the implementation changes.
4. **True confidence**: Passing tests give a true sense of confidence that the code works correctly.
5. **Better type safety**: Using actual implementations ensures that type errors are caught early.

### Guidelines for Removing Mocks

1. **Identify tests using mocks**: Look for tests that use `vi.mock()`, `vi.doMock()`, or similar patterns.
2. **Create actual implementations**: Create or identify actual implementations for the mocked dependencies.
3. **Create factory functions**: Create factory functions that return actual implementations with test data.
4. **Update tests**: Update tests to use the actual implementations instead of mocks.
5. **Fix type issues**: Ensure that tests use proper types and interfaces to catch type errors early.
6. **Document the approach**: Document the new approach in the appropriate documentation files.

# Testing Context-Dependent Components Without Mocks

## Rendering Components with Context

When testing components that depend on React Context, we should avoid mocking the context and instead provide the actual context implementation. This ensures that our tests verify the actual behavior of the component rather than simply verifying that our mocks work correctly.

### Pattern for Testing Context-Dependent Components

The following pattern can be used to test components that depend on a context:

1. Create a custom render function that provides the context
2. Use a helper component to set up the context state
3. Render the component using the custom render function
4. Make assertions based on the rendered output

#### Example: Testing Components that Use GameContext

Here's an example from ResourceVisualization.snapshot.test.tsx:

```typescript
// Custom wrapper that provides a pre-configured GameContext with specific resource values
function renderWithGameContext(
  ui: ReactElement,
  {
    minerals = 100,
    energy = 150,
    population = 20,
    research = 50,
  }: {
    minerals?: number;
    energy?: number;
    population?: number;
    research?: number;
  } = {}
) {
  // Create a wrapper component that provides the GameContext with specified resource values
  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <GameProvider>
        {/* Set the resource values using a child component that triggers dispatch */}
        <ResourceInitializer
          minerals={minerals}
          energy={energy}
          population={population}
          research={research}
        />
        {children}
      </GameProvider>
    );
  };

  // Use the standard render function with our custom wrapper
  return render(ui, { wrapper: Wrapper });
}

// Helper component to set initial resource values
function ResourceInitializer({
  minerals,
  energy,
  population,
  research,
}: {
  minerals: number;
  energy: number;
  population: number;
  research: number;
}) {
  const gameContext = useContext(GameContext);

  // Update the resources when the component mounts
  beforeEach(() => {
    if (gameContext) {
      gameContext.dispatch({
        type: 'UPDATE_RESOURCES',
        resources: {
          minerals,
          energy,
          population,
          research,
        },
      });
    }
  });

  return null;
}

// Test case using the custom render function
it('should render correctly with default state', () => {
  // Render with default values
  const { container } = renderWithGameContext(<ResourceVisualization />);

  // Take a snapshot
  expect(container).toMatchSnapshot();
});

// Test with different values
it('should render correctly with low resources', () => {
  // Render with low resource values
  const { container } = renderWithGameContext(<ResourceVisualization />, {
    minerals: 20,
    energy: 30,
    population: 5,
    research: 10,
  });

  // Take a snapshot
  expect(container).toMatchSnapshot();
});
```

### Benefits of this Approach

1. **Tests Actual Behavior**: Tests the actual behavior of the component with the real context, not a mock
2. **More Reliable Tests**: Tests are more reliable because they use the same context implementation as the real application
3. **Easier Maintenance**: Tests are easier to maintain because they don't depend on mock implementations that need to be updated whenever the context changes
4. **Better Type Safety**: Uses the actual types from the context, improving type safety
5. **Simpler Test Code**: Tests are simpler and more readable, with less setup required
6. **Consistent Setup**: Provides a consistent way to set up context for testing across multiple test files

### When to Use This Pattern

Use this pattern when:

- Testing components that depend on React Context
- Testing components that use hooks that depend on Context
- Creating snapshot tests for components that need context data
- Testing behavior that depends on context state changes

This approach is especially valuable for testing UI components that display data from global state or context, as it ensures the tests accurately reflect how the component will behave in the real application.

## Testing Best Practices - Removing Mocks

### Testing Components with Framer Motion

When testing components that use `framer-motion`, we may encounter issues with the browser APIs that framer-motion relies on, such as `matchMedia`. Instead of creating mocks for these APIs or for framer-motion itself, we can focus our tests on the content rendered by the component rather than its animations.

### Example: Testing ResourceVisualization

```tsx
describe("ResourceVisualization Component", () => {
  it("renders with default resource values", () => {
    render(
      <TestGameProvider>
        <ResourceVisualization />
      </TestGameProvider>,
    );

    // Check for resource labels
    expect(screen.getByText("minerals")).toBeInTheDocument();
    expect(screen.getByText("energy")).toBeInTheDocument();

    // Use getAllByText for values that appear multiple times
    const mineralValues = screen.getAllByText(/1,000/, { exact: false });
    expect(mineralValues.length).toBeGreaterThan(0);
  });
});
```

### Key Principles

1. **Focus on content, not animations**: Test that the correct text, values, and elements are rendered, not the animations or transitions.

2. **Use flexible queries**: Use `getAllByText` with regular expressions when there might be multiple matches, and check that at least one match exists.

3. **Accept matchMedia warnings**: It's okay if tests show warnings about matchMedia in the console as long as the tests pass. These warnings are related to framer-motion's animations and don't affect the core functionality we're testing.

4. **Use custom test providers**: Create simplified context providers that provide only the state needed for the components under test, rather than using the full application contexts.

This approach allows us to test components that use framer-motion without having to create complex mocks, while still verifying that the components render correctly and respond to different states as expected.

### Test Factory Pattern - Replacing Mocks with Actual Implementations

In our ongoing effort to improve test reliability and maintain our "no mocks" policy, we're implementing a Test Factory Pattern approach to replace mock implementations with actual implementations in our test suite.

#### Core Principles

1. **Use real implementations instead of mocks**: Tests should use the actual code that runs in production, not simplified mock versions.
2. **Create factories for test instances**: Instead of mocks, create factory functions that return real instances configured for testing.
3. **Isolate test state**: Ensure each test has its own isolated state to prevent cross-test contamination.
4. **Focus on behavior testing**: Test what components and services do, not their internal implementation details.
5. **Use type safety**: Ensure all test factories and utilities are properly typed for better maintainability.

#### Implementation Strategies by Mock Type

We've identified several categories of mocks in our codebase, each requiring a different replacement strategy:

##### 1. Module Events and Event Bus Testing

Instead of mocking the event system, we'll create a real event bus implementation specifically for testing:

```typescript
// src/tests/factories/createTestModuleEvents.ts
import {
  ModuleEventBus,
  ModuleEventType,
} from "../../lib/modules/ModuleEvents";

export interface TestModuleEvents {
  moduleEventBus: ModuleEventBus;
  ModuleEventType: typeof ModuleEventType;
  // Test helper methods
  getEmittedEvents: (eventType?: string) => any[];
  clearEvents: () => void;
}

export function createTestModuleEvents(): TestModuleEvents {
  // Store events in memory for verification
  const events: any[] = [];

  // Create a real event bus that stores events in memory
  const moduleEventBus: ModuleEventBus = {
    emit: (eventType, eventData) => {
      events.push({ eventType, eventData });
      // Call any registered subscribers
      const subscribers = subscriptions[eventType] || [];
      subscribers.forEach((callback) => callback(eventData));
    },
    subscribe: (eventType, callback) => {
      if (!subscriptions[eventType]) {
        subscriptions[eventType] = [];
      }
      subscriptions[eventType].push(callback);
      return () => {
        subscriptions[eventType] = subscriptions[eventType].filter(
          (cb) => cb !== callback,
        );
      };
    },
    unsubscribe: (eventType, callback) => {
      if (subscriptions[eventType]) {
        subscriptions[eventType] = subscriptions[eventType].filter(
          (cb) => cb !== callback,
        );
      }
    },
    getHistory: () => [...events],
    getModuleHistory: (moduleId) =>
      events.filter((e) => e.eventData?.moduleId === moduleId),
    getEventTypeHistory: (eventType) =>
      events.filter((e) => e.eventType === eventType),
    clearHistory: () => {
      events.length = 0;
    },
  };

  // Storage for subscribers
  const subscriptions: Record<string, Array<(data: any) => void>> = {};

  return {
    moduleEventBus,
    ModuleEventType,
    // Test helper methods
    getEmittedEvents: (eventType?: string) => {
      if (eventType) {
        return events.filter((e) => e.eventType === eventType);
      }
      return [...events];
    },
    clearEvents: () => {
      events.length = 0;
      Object.keys(subscriptions).forEach((key) => {
        subscriptions[key] = [];
      });
    },
  };
}
```

Usage in tests:

```typescript
import { createTestModuleEvents } from "../factories/createTestModuleEvents";

describe("ModuleManager", () => {
  let testModuleEvents;

  beforeEach(() => {
    // Create a fresh test event system for each test
    testModuleEvents = createTestModuleEvents();

    // Use vi.doMock to override the ModuleEvents import
    vi.doMock("../../../lib/modules/ModuleEvents", () => testModuleEvents);
  });

  afterEach(() => {
    // Clean up after each test
    testModuleEvents.clearEvents();
    vi.resetModules();
  });

  it("should emit MODULE_CREATED event when creating a module", () => {
    // Test code using the real ModuleManager and our test event system
    const moduleManager = new ModuleManager();
    moduleManager.createModule({ id: "test", type: "mining" });

    // Verify events using our helper methods
    const events = testModuleEvents.getEmittedEvents(
      testModuleEvents.ModuleEventType.MODULE_CREATED,
    );
    expect(events.length).toBe(1);
    expect(events[0].eventData.moduleId).toBe("test");
  });
});
```

##### 2. Manager Service Testing

Instead of mocking manager services, create real but simplified implementations:

```typescript
// src/tests/factories/createTestResourceManager.ts
import { Resource, ResourceManager } from "../../managers/game/ResourceManager";

export function createTestResourceManager(
  initialResources: Resource[] = [],
): ResourceManager {
  // In-memory storage for resources
  const resources = new Map<string, Resource>();

  // Initialize with any provided resources
  initialResources.forEach((resource) => {
    resources.set(resource.id, { ...resource });
  });

  // Return a real implementation that uses in-memory storage
  return {
    getResource: (id: string) => resources.get(id) || null,
    updateResource: (id: string, updates: Partial<Resource>) => {
      const resource = resources.get(id);
      if (!resource) return false;

      resources.set(id, { ...resource, ...updates });
      return true;
    },
    addResource: (resource: Resource) => {
      if (resources.has(resource.id)) return false;

      resources.set(resource.id, { ...resource });
      return true;
    },
    removeResource: (id: string) => {
      if (!resources.has(id)) return false;

      resources.delete(id);
      return true;
    },
    getAllResources: () => Array.from(resources.values()),
    reset: () => {
      resources.clear();
      initialResources.forEach((resource) => {
        resources.set(resource.id, { ...resource });
      });
    },
  };
}
```

##### 3. Component Testing

For component testing, render the actual components with controlled context providers:

```typescript
// src/tests/factories/createTestGameProvider.tsx
import React, { ReactNode, useReducer, Dispatch } from 'react';
import { GameContext, initialGameState, gameReducer } from '../../contexts/GameContext';

interface TestGameProviderProps {
  children: ReactNode;
  initialState?: Partial<typeof initialGameState>;
}

export function TestGameProvider({ children, initialState = {} }: TestGameProviderProps) {
  // Use the actual game reducer for state management
  const [state, dispatch] = useReducer(
    gameReducer,
    { ...initialGameState, ...initialState }
  );

  // Create context value with actual state and simplified methods
  const contextValue = {
    state,
    dispatch,
    // Simplified versions of context methods
    updateShip: () => {},
    addMission: () => {},
    updateSector: () => {},
  };

  // Provide context to children
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Helper to render components with the test provider
export function renderWithGameContext(ui: React.ReactElement, initialState?: Partial<typeof initialGameState>) {
  return render(
    <TestGameProvider initialState={initialState}>
      {ui}
    </TestGameProvider>
  );
}
```

##### 4. Utility Function Testing

Test utility functions directly without mocking:

```typescript
// src/tests/utils/resourceValidation.test.ts
import {
  validateResourceFlow,
  validateResourceTransfer,
} from "../../utils/resources/resourceValidation";

describe("resourceValidation", () => {
  describe("validateResourceFlow", () => {
    it("should validate a valid resource flow", () => {
      const validFlow = {
        sourceId: "source1",
        targetId: "target1",
        resourceType: "minerals",
        rate: 10,
      };

      // Test the actual function with real validation
      const result = validateResourceFlow(validFlow);
      expect(result).toBe(true);
    });

    it("should reject an invalid resource flow", () => {
      const invalidFlow = {
        sourceId: "source1",
        targetId: "target1",
        resourceType: "minerals",
        rate: -5, // Negative rate should be invalid
      };

      // Test actual validation logic
      const result = validateResourceFlow(invalidFlow);
      expect(result).toBe(false);
    });
  });
});
```

##### 5. External Dependencies Testing

For external dependencies like framer-motion that are challenging to use directly in tests, focus on testing the rendered content rather than animations:

```typescript
// src/tests/components/ui/AnimatedComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { AnimatedComponent } from '../../../components/ui/AnimatedComponent';

describe('AnimatedComponent', () => {
  it('should render the content correctly', () => {
    render(<AnimatedComponent title="Test Title" content="Test Content" />);

    // Focus on testing the content, not the animations
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply the correct CSS classes', () => {
    render(<AnimatedComponent title="Test Title" content="Test Content" variant="success" />);

    // Test the resulting DOM structure and classes
    const component = screen.getByTestId('animated-component');
    expect(component).toHaveClass('success');
  });
});
```

#### Benefits of the Test Factory Pattern

1. **Improved test reliability**: Tests verify real behavior, not mock behavior.
2. **Better test coverage**: Tests interact with the actual code paths used in production.
3. **Simplified maintenance**: When implementations change, tests using real implementations adapt automatically.
4. **Reduced brittleness**: Tests are less likely to pass when real implementations would fail.
5. **Easier debugging**: Test failures reflect actual issues in the code.

#### Implementation Plan

Our implementation of the Test Factory Pattern will proceed in phases:

1. **Create core test factories**: Implement factories for commonly used services like ModuleEvents, ResourceManager, etc.
2. **Update existing tests**: Replace mocks in existing tests with factory-created real implementations.
3. **Document patterns**: Create documentation and examples for using the test factories.
4. **Establish standards**: Create linting rules and code review standards to prevent the reintroduction of mocks.

This approach aligns with our goal of creating more reliable and maintainable tests that verify the actual behavior users will experience.

#### Example: Converting a Mocked Test to Use Real Implementations

**Before (using mocks):**

```typescript
vi.mock("../../../lib/modules/ModuleEvents", () => ({
  moduleEventBus: {
    emit: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  },
  ModuleEventType: {
    MODULE_CREATED: "MODULE_CREATED",
  },
}));

describe("ModuleManager", () => {
  it("should create a module", () => {
    const moduleManager = new ModuleManager();
    moduleManager.createModule({ id: "test", type: "mining" });

    // This only tests that the mock was called, not actual behavior
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      ModuleEventType.MODULE_CREATED,
      expect.objectContaining({ moduleId: "test" }),
    );
  });
});
```

**After (using test factories):**

```typescript
import { createTestModuleEvents } from "../factories/createTestModuleEvents";

describe("ModuleManager", () => {
  let testModuleEvents;

  beforeEach(() => {
    testModuleEvents = createTestModuleEvents();
    vi.doMock("../../../lib/modules/ModuleEvents", () => testModuleEvents);
  });

  afterEach(() => {
    testModuleEvents.clearEvents();
    vi.resetModules();
  });

  it("should create a module", () => {
    const moduleManager = new ModuleManager();
    moduleManager.createModule({ id: "test", type: "mining" });

    // This tests actual behavior and event data
    const events = testModuleEvents.getEmittedEvents(
      testModuleEvents.ModuleEventType.MODULE_CREATED,
    );
    expect(events.length).toBe(1);
    expect(events[0].eventData.moduleId).toBe("test");
    expect(events[0].eventData.moduleType).toBe("mining");
  });
});
```

By following these patterns, we can gradually replace all mocks in our test suite with real implementations that provide more reliable and maintainable tests.

## Testing Best Practices - Removing Mocks

### Testing Components with Framer Motion

When testing components that use `framer-motion`, we may encounter issues with the browser APIs that framer-motion relies on, such as `matchMedia`. Instead of creating mocks for these APIs or for framer-motion itself, we can focus our tests on the content rendered by the component rather than its animations.

### Example: Testing ResourceVisualization

```tsx
describe("ResourceVisualization Component", () => {
  it("renders with default resource values", () => {
    render(
      <TestGameProvider>
        <ResourceVisualization />
      </TestGameProvider>,
    );

    // Check for resource labels
    expect(screen.getByText("minerals")).toBeInTheDocument();
    expect(screen.getByText("energy")).toBeInTheDocument();

    // Use getAllByText for values that appear multiple times
    const mineralValues = screen.getAllByText(/1,000/, { exact: false });
    expect(mineralValues.length).toBeGreaterThan(0);
  });
});
```

### Key Principles

1. **Focus on content, not animations**: Test that the correct text, values, and elements are rendered, not the animations or transitions.

2. **Use flexible queries**: Use `getAllByText` with regular expressions when there might be multiple matches, and check that at least one match exists.

3. **Accept matchMedia warnings**: It's okay if tests show warnings about matchMedia in the console as long as the tests pass. These warnings are related to framer-motion's animations and don't affect the core functionality we're testing.

4. **Use custom test providers**: Create simplified context providers that provide only the state needed for the components under test, rather than using the full application contexts.

This approach allows us to test components that use framer-motion without having to create complex mocks, while still verifying that the components render correctly and respond to different states as expected.

### Test Factory Pattern - Replacing Mocks with Actual Implementations

The test factory pattern is a powerful approach to testing that replaces mocks with real implementations. This ensures that tests verify actual behavior rather than mock interactions.

### Key Principles

1. **Real Implementations**: Test factories create real implementations of components and services that behave like production code but are isolated for testing purposes.

2. **Isolation**: Each test should create its own test factory instances to prevent cross-test contamination.

3. **Verification Helpers**: Test factories provide helper methods for verifying behavior, making tests more readable and maintainable.

4. **Type Safety**: Test factories are type-safe, ensuring that tests use the correct types and interfaces.

### Implemented Test Factories

1. **ModuleEvents Test Factory**
   - Creates a real ModuleEventBus with event tracking
   - Provides helper methods for verifying events and listeners
   - Supports all event types and module types

2. **ResourceManager Test Factory**
   - Implements all ResourceManager methods with real behavior
   - Supports resource initialization, updates, and tracking
   - Handles production, consumption, and transfer operations

3. **GameContext Test Factory**
   - Uses the actual GameContext and reducer pattern
   - Supports configurable initial state
   - Provides helper methods for updating resources, ships, and sectors

### Example: Testing with the GameContext Test Factory

```tsx
// Test component that uses GameContext
it("should display resource values", async () => {
  // Render with TestGameProvider
  render(
    <TestGameProvider
      initialState={{
        resources: { minerals: 500, energy: 1000 },
      }}
    >
      <ResourceDisplay />
    </TestGameProvider>,
  );

  // Verify initial values
  expect(screen.getByTestId("minerals")).toHaveTextContent("Minerals: 500");
  expect(screen.getByTestId("energy")).toHaveTextContent("Energy: 1000");

  // Update resources using helper methods
  render(
    <TestGameProvider
      initialState={{
        resources: { minerals: 500, energy: 1000 },
      }}
    >
      <ResourceDisplay />
      <ResourceUpdater />
    </TestGameProvider>,
  );

  // Wait for updates and verify
  await screen.findByText("Minerals: 1000");
  expect(screen.getByTestId("minerals")).toHaveTextContent("Minerals: 1000");
});
```

### Benefits of Test Factories

1. **Reliability**: Tests verify actual behavior rather than mock interactions
2. **Maintainability**: Tests are less brittle and easier to maintain
3. **Confidence**: Tests provide higher confidence that code works as expected
4. **Simplicity**: Tests are simpler and more focused on behavior
5. **Reusability**: Test factories can be reused across multiple tests

For detailed documentation on test factories, see `CodeBase_Docs/CodeBase_Mapping/Test_Factories.md`.

## WebSocket Management in Tests

When testing components that rely on WebSocket communication, we've implemented a robust approach to prevent port conflicts and ensure proper test isolation:

### WebSocket Server Management

1. **Centralized Configuration** (src/tests/setup.ts)
   - All WebSocket server creation and management is centralized in the setup.ts file
   - Port allocation uses a defined range (8000-9000) to avoid conflicts
   - Global flags control whether WebSocket servers are enabled or disabled for tests

2. **Global Controls**
   - `disableAllWebSocketServers()`: Disables all WebSocket servers for tests that don't need them
   - `enableAllWebSocketServers()`: Re-enables WebSocket servers when needed
   - These functions should be called in beforeAll/afterAll hooks for test suites that need to control WebSockets

3. **Automatic Cleanup**
   - WebSocket servers are automatically registered for cleanup using `registerTestWebSocketServer()`
   - The afterEach hook ensures all servers are closed after each test
   - A final cleanup runs in afterAll to catch any missed servers

### Best Practices for Testing with WebSockets

1. **Disable WebSockets When Possible**

   ```typescript
   // At the start of your test file
   beforeAll(() => {
     disableAllWebSocketServers();
   });

   // At the end of your test file
   afterAll(() => {
     enableAllWebSocketServers();
   });
   ```

2. **Use Dynamic Ports**
   - When WebSockets are required, use `getTestWebSocketPort()` to get a unique port
   - Don't hardcode port numbers in tests

3. **Register for Cleanup**
   - Always register your WebSocket server for cleanup:

   ```typescript
   const port = getTestWebSocketPort("MyService");
   const server = createMyWebSocketServer(port);
   registerTestWebSocketServer(port, server.close);
   ```

4. **Component Testing**
   - For React components that use WebSockets, use the TestGameProvider with WebSockets disabled
   - Focus tests on component behavior rather than WebSocket communication

Following these practices ensures that tests remain isolated and don't interfere with each other, even when multiple test files run in parallel.

## Test Factories

### Implementation Strategy

The project uses a test factory pattern instead of mocks. Test factories create real implementations that behave like the actual code but are isolated for testing purposes. This approach ensures that tests verify real behavior rather than mock interactions.

Examples of test factories include:

#### 1. ModuleEvents Test Factory

The ModuleEvents test factory creates a real implementation of the ModuleEventBus that behaves like the production code but is isolated for testing.

```typescript
export function createTestModuleEvents(): TestModuleEvents {
  // Store events in memory for verification
  const events: any[] = [];

  // Create a real event bus that stores events in memory
  const moduleEventBus: ModuleEventBus = {
    emit: (eventType, eventData) => {
      events.push({ eventType, eventData });
      // Call any registered subscribers
      const subscribers = subscriptions[eventType] || [];
      subscribers.forEach((callback) => callback(eventData));
    },
    subscribe: (eventType, callback) => {
      if (!subscriptions[eventType]) {
        subscriptions[eventType] = [];
      }
      subscriptions[eventType].push(callback);
      return () => {
        subscriptions[eventType] = subscriptions[eventType].filter(
          (cb) => cb !== callback,
        );
      };
    },
    // ... other methods
  };

  return {
    moduleEventBus,
    ModuleEventType,
    // Test helper methods
    getEmittedEvents: (eventType?: string) => {
      if (eventType) {
        return events.filter((e) => e.eventType === eventType);
      }
      return [...events];
    },
    clearEvents: () => {
      events.length = 0;
      Object.keys(subscriptions).forEach((key) => {
        subscriptions[key] = [];
      });
    },
  };
}
```

#### 2. ResourceManager Test Factory

The ResourceManager test factory creates a real ResourceManager for tests with in-memory implementation that follows the actual API.

```typescript
export function createTestResourceManager(
  config: ResourceManagerConfig = DEFAULT_TEST_CONFIG,
): TestResourceManager {
  // Resource state storage
  const resources = new Map<ResourceType, ResourceState>();

  // Track transfers
  const transfers: ResourceTransfer[] = [];

  // ... implementation code

  return {
    getResourceAmount(type: ResourceType): number {
      // Implementation
    },
    setResourceAmount(type: ResourceType, amount: number): void {
      // Implementation
    },
    addResource(type: ResourceType, amount: number): void {
      // Implementation
    },
    // ... other methods
  };
}
```

#### 3. GameContext Test Factory

The GameContext test factory creates a TestGameProvider component that provides a real GameContext for testing React components.

```typescript
export function createTestGameProvider({
  initialState = {},
  disableWebSocket = true,
}: TestGameProviderProps = {}): TestGameProviderReturn {
  // Create a real GameContext provider with test state
  const TestProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const mergedState = {
      ...DEFAULT_GAME_STATE,
      ...initialState,
    };

    return (
      <GameContextProvider initialState={mergedState} disableWebSocket={disableWebSocket}>
        {children}
      </GameContextProvider>
    );
  };

  // Create helper methods for updating state
  const helpers = {
    // Helper methods for test state manipulation
  };

  return {
    TestProvider,
    helpers,
  };
}
```

#### 4. ModuleManager Test Factory

The ModuleManager test factory creates a real ModuleManager instance for testing with isolated state.

```typescript
export function createTestModuleManager(): TestModuleManager {
  // Create a real ModuleManager instance for testing
  const moduleManager = new ModuleManager();

  // Register default test module configs
  Object.values(TEST_MODULE_CONFIGS).forEach((config) => {
    moduleManager.registerModuleConfig(config);
  });

  // Internal storage for tracking module configs
  let moduleConfigs = new Map<ModuleType, ModuleConfig>();

  return {
    // Module configuration
    registerModuleConfig(config: ModuleConfig): void {
      moduleManager.registerModuleConfig(config);
      moduleConfigs.set(config.type, config);
    },

    // Module lifecycle methods
    createModule(type: ModuleType, position: Position): BaseModule {
      return moduleManager.createModule(type, position);
    },

    // ... other methods

    // Test helper methods
    reset(): void {
      // Reset implementation
    },

    createTestModule(
      type: ModuleType,
      position: Position,
      overrides?: Partial<BaseModule>,
    ): BaseModule {
      // Implementation
    },

    createTestBuilding(
      type: BuildingType,
      overrides?: Partial<ModularBuilding>,
    ): ModularBuilding {
      // Implementation
    },
  };
}
```

### Test Factory Benefits

Using test factories instead of mocks provides several benefits:

1. **Real behavior verification** - Tests verify that components work with actual implementations, not mock approximations
2. **Reduced maintenance burden** - Tests don't break when implementation details change but behavior stays the same
3. **Better integration testing** - Components are tested with their real dependencies
4. **Simplified test setup** - Factories provide helper methods for common test scenarios
5. **Improved test isolation** - Each test creates its own isolated test factory instance

### Test Factory Pattern

#### Core Principles

The Galactic Sprawl project uses a Test Factory pattern that follows these core principles:

1. **No Mocks**: Tests should NEVER use mocks. Always use actual implementations.
2. **Isolation**: Test factories should create isolated instances of managers and services for testing.
3. **Reset Capability**: Each factory should provide a way to reset its state between tests.
4. **Configurability**: Test factories should allow for configuration of the system under test.

#### Test Factory Implementation Example

A proper test factory:

1. Creates a real instance of the system under test
2. Provides helper methods for test setup and verification
3. Handles cleanup of resources
4. Does NOT use vi.mock() or any other mocking mechanism

Example implementation from `createTestModuleManager.ts`:

```typescript
export function createTestModuleManager(): TestModuleManager {
  // Create a real ModuleManager instance for testing
  let moduleManager = new ModuleManager();

  // Internal storage for test-specific state
  let nextId = 1;
  let moduleConfigs = new Map<ModuleType, ModuleConfig>();

  // Initialize with default configs
  Object.values(TEST_MODULE_CONFIGS).forEach((config) => {
    moduleManager.registerModuleConfig(config);
    moduleConfigs.set(config.type, config);
  });

  // Helper function to generate unique IDs
  const generateUniqueId = (prefix: string): string => {
    return `${prefix}-${nextId++}`;
  };

  return {
    // Expose methods that use the real ModuleManager implementation
    registerModuleConfig(config: ModuleConfig): void {
      moduleManager.registerModuleConfig(config);
      moduleConfigs.set(config.type, config);
    },

    // Real implementation methods
    createModule(type: ModuleType, position: Position): BaseModule {
      return moduleManager.createModule(type, position);
    },

    // Test helper methods
    reset(): void {
      // Create a fresh ModuleManager instance
      moduleManager = new ModuleManager();

      // Reinstall all the configurations
      for (const config of moduleConfigs.values()) {
        moduleManager.registerModuleConfig(config);
      }

      // Reset ID counter
      nextId = 1;
    },

    // Additional helper methods...
  };
}
```

#### Benefits of Test Factories vs. Mocks

1. **Real Behavior Testing**: Tests verify actual behavior, not mock behavior.
2. **Maintainability**: When the real implementation changes, tests don't break.
3. **Integration Testing**: Tests verify how components work together, not just in isolation.
4. **Confidence**: Tests give confidence that the system works in production, not just in test scenarios.

#### Common Test Factory Implementations

The project includes these test factories:

1. `createTestModuleManager`: For testing module creation, attachment, and lifecycle.
2. `createTestModuleEvents`: For testing module event handling.
3. `createTestResourceManager`: For testing resource management.
4. `createTestGameProvider`: For testing game state and context.

#### Accessing Internal State for Testing

Sometimes it's necessary to access internal state for testing. This is achieved through type casting, not mocking:

```typescript
// Type cast to access internal properties, NOT mocking the behavior
const manager = moduleManager as unknown as ModuleManagerInternal;
```

This should be used sparingly, only when necessary for test setup or verification.

### TypeScript Integration

Playwright tests are fully integrated with TypeScript:

1.  **Type Safety**:

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

## Unit Testing Best Practices

### WebSocket Server Testing

When testing components or systems that use WebSocket servers, follow these principles to ensure reliable tests:

1. **Proper Type Checking**:
   - Always check if WebSocket server creation was successful before using the result
   - Handle the case where WebSocket servers are disabled for testing
   - Use proper TypeScript type guards when destructuring WebSocket server objects

2. **Safe WebSocket Test Implementation**:

   ```typescript
   // Example of proper WebSocket server testing
   it("should create isolated WebSocket servers", () => {
     // Create WebSocket server with null check
     const result1 = createTestWebSocketServer();
     const result2 = createTestWebSocketServer();

     // Skip test if WebSocket servers are disabled
     if (!result1 || !result2) {
       console.log("WebSocket servers are disabled, skipping test");
       return;
     }

     // Safely access server properties after null check
     const { server: server1, port: port1 } = result1;
     const { server: server2, port: port2 } = result2;

     // Test assertions
     expect(port1).not.toBe(port2);
     expect(server1).not.toBe(server2);
   });
   ```

3. **WebSocket Server Isolation**:
   - Use central WebSocket management through the setup file
   - Implement dynamic port allocation to prevent conflicts
   - Enable/disable WebSocket servers globally for different test scenarios
   - Ensure proper cleanup after each test to prevent resource leaks

4. **Best Practices**:
   - Use the `disableAllWebSocketServers()` and `enableAllWebSocketServers()` functions
   - Register all WebSocket servers for automatic cleanup
   - Use unique port allocation for each server
   - Implement proper error handling for WebSocket server operations

### Test Context Providers

When testing components that require React context providers, follow these guidelines:

1. **Complete Context Implementation**:
   - Provide all required properties in the context value
   - Implement actual functionality for required methods instead of using mocks
   - Ensure type safety by satisfying the complete interface

2. **Proper Context Implementation Example**:

   ```typescript
   // Example of a complete game context implementation for testing
   const testGameContextValue: GameContextType = {
     state: {
       resources: {
         minerals: 1000,
         energy: 500,
         population: 100,
         research: 50,
       },
       isRunning: true,
       isPaused: false,
       gameTime: 100,
       events: [],
       resourceRates: {
         minerals: 0,
         energy: 0,
         population: 0,
         research: 0,
       },
       // Include all required state properties
       systems: { ... },
       missions: { ... },
       exploration: { ... },
     },
     // Implement all required methods
     dispatch: vi.fn(),
     updateShip: vi.fn(),
     addMission: vi.fn(),
     updateSector: vi.fn(),
   };
   ```

3. **Test Component Isolation**:
   - Create simplified components for testing specific behavior
   - Test behavior rather than implementation details
   - Use proper error handling and fallbacks in test components

4. **Best Practices**:
   - Avoid type assertions with `as` when creating context values
   - Make sure all required properties and methods are implemented
   - Test both successful and error scenarios
   - Ensure context values are consistent with expected behavior

### Handling Unused Variables in Test Code

When working with test code, you may encounter situations where parameters or variables are required for interface compatibility but not used in the implementation. Follow these guidelines for handling unused variables:

1. **Prefix Unused Variables with Underscore**:

   ```typescript
   // For unused parameters
   function testFunction(_unusedParam: string, usedParam: number): void {
     console.log(usedParam);
   }

   // For unused variables in catch blocks
   try {
     riskyOperation();
   } catch (_error) {
     // Intentionally ignoring the error
   }
   ```

2. **Document Why Variables Are Unused**:

   ```typescript
   // Parameter required for interface compatibility but not used in this implementation
   setStorageEfficiency(_level: number): void {
     // Implementation doesn't use level parameter in test version
   }
   ```

3. **Common Scenarios for Unused Variables**:
   - Interface compatibility requirements
   - Event handlers that don't need the event object
   - Catch blocks where the error is intentionally ignored
   - Placeholder implementations for testing
   - Parameters required for method signature matching

4. **Best Practices**:
   - Always prefix intentionally unused variables with an underscore
   - Consider if an unused variable should actually be used
   - Document why a variable is unused if it's not obvious
   - Be consistent with the approach across the codebase
   - Follow ESLint rules for unused variable handling

## UI Component Integration

### GameHUD Component Integration

The GameHUD component is responsible for providing the user interface for building modules, managing resources, and navigating between different views. There were several issues with the original implementation that prevented the UI from functioning correctly:

1. **Context Usage Issues**
   - The original implementation imported and used functions from the ModuleContext directly (`buildModule`, `canBuildModule`), which caused issues because these functions internally used hooks outside of a component function.
   - **Solution**: Instead of importing these functions, we implemented local versions that use the context directly from within the component function.

2. **Module Building Process**
   - The module building functionality didn't properly connect to the ModuleContext.
   - **Solution**: We implemented a proper `buildModuleLocally` function that:
     - Finds a suitable building and attachment point
     - Dispatches the correct actions to the ModuleContext
     - Updates resources in the game state
     - Provides proper user feedback via notifications

3. **Menu Item Actions**
   - The menu item actions weren't properly implemented, causing buttons to be non-responsive.
   - **Solution**: Implemented a `handleBuildModule` function that:
     - Checks if the module can be built
     - Builds the module if possible
     - Updates resources
     - Shows appropriate notifications
     - Activates the correct view based on the module type

4. **View Toggle Issues**
   - The view toggle functions in GameLayout weren't properly implemented.
   - **Solution**: Implemented proper handler functions with proper state management and logging.

5. **Debugging Improvements**
   - Added comprehensive console logging throughout the UI components to help diagnose issues.
   - Improved error handling with detailed error messages.

### GameHUD Component Enhancements (March 2025)

The GameHUD component has been significantly enhanced with additional features to improve user experience and interface functionality:

1. **Keyboard Shortcut System**
   - Implemented a keyboard navigation system for efficient menu access:
     - Alt+M for Mining menu
     - Alt+E for Exploration menu
     - Alt+H for Mothership menu
     - Alt+C for Colony menu
     - F1 for Tech Tree
     - F2 for Settings
     - Escape to close active menu
   - Implementation uses React's `useCallback` and `useEffect` for efficient event handling
   - Keyboard shortcuts are clearly displayed in the UI for better discoverability

2. **Enhanced Resource Display**
   - Added real-time extraction rate indicators that show resource flow rate
   - Implemented status icons that visually indicate resource states:
     - Critical (red alert triangle)
     - Normal (no icon)
     - Abundant (blue info icon)
   - Color-coded resource values based on thresholds
   - Used callbacks for efficient resource status calculations

3. **Tooltip System**
   - Implemented an advanced tooltip system that shows:
     - Detailed module information
     - Resource requirements with availability status
     - Build availability status
     - Module descriptions
   - Tooltips are positioned intelligently relative to the menu item
   - Tooltips provide immediate visual feedback on resource sufficiency

4. **Improved User Feedback**
   - Enhanced notification messages with specific details about resource shortages
   - Added visual indicators for build status
   - Improved error handling with specific error messages
   - Enhanced visual feedback for user interactions

5. **Implementation Details**
   - Used React's `useState` for managing tooltip state
   - Implemented mouse event handlers for tooltip positioning
   - Created reusable utility functions like `getResourceStatus`
   - Improved component rendering with conditional logic
   - Enhanced styling with Tailwind CSS for a cohesive look and feel

These enhancements significantly improve the usability of the GameHUD component, making it more intuitive and user-friendly while also fixing the underlying functional issues that prevented proper interaction with the game systems.

## System Integration Components

### Event Propagation System

The Galactic Sprawl application uses a robust event propagation system to ensure that events from various parts of the system are properly communicated to interested components. The system includes:

1. **EventPropagationService**:
   - Centralized service for mapping events between different event systems
   - Handles event transformation and routing
   - Ensures events are properly propagated to all interested components
   - Provides a registration API for defining event mappings

2. **Event Types**:
   - `ModuleEventType`: Defined in `src/lib/modules/ModuleEvents.ts`
   - Global events: Handled through the `useGlobalEvents` hook

3. **Event Flow**:
   - Backend events (ModuleEvents) → EventPropagationService → UI Components
   - UI Components → EventPropagationService → Backend systems

### Error Handling System

The application implements a comprehensive error handling system to ensure robustness and provide meaningful feedback to users:

1. **IntegrationErrorHandler**:
   - React error boundary component for catching and handling errors in integration components
   - Provides fallback UI when errors occur
   - Logs errors to the ErrorLoggingService
   - Attempts recovery from non-fatal errors

2. **ErrorLoggingService**:
   - Centralized service for structured error logging
   - Categorizes errors by type and severity
   - Provides deduplication of similar errors
   - Supports metadata for contextual information

3. **Error Recovery**:
   - Integration with RecoveryService for attempting to recover from errors
   - Implements progressive backoff for retry attempts
   - Tracks error frequency to prevent excessive retry attempts

### UI Component Event Registration

To simplify the process of UI components registering for and responding to system events, we've implemented custom hooks:

1. **useModuleEvents**:
   - Custom hook for subscribing to module events with automatic cleanup
   - Ensures subscriptions are properly cleaned up when components unmount
   - Prevents unnecessary re-subscriptions when dependencies change

2. **useGlobalSystemEvents**:
   - Custom hook for subscribing to global game events
   - Provides similar functionality to useModuleEvents but for global events

3. **useMultipleModuleEvents**:
   - Helper hook for subscribing to multiple module events at once
   - Simplifies code when components need to listen to multiple event types

4. **Example Implementation**:
   - `ResourceEventMonitor`: Component that demonstrates the use of these hooks
   - Monitors and displays resource-related events in real-time
   - Shows how to properly subscribe to events and handle cleanup

These integration components work together to ensure robust communication between the frontend and backend systems, proper error handling, and simplified event registration for UI components.
