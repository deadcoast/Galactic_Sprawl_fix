---
GALACTIC SPRAWL SYSTEM ARCHITECTURE
---

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
- Added specific rules for:
  - Preventing use of `var` (use `const` or `let` instead)
  - Warning about unused variables
  - Limiting console statements (allowing only `console.warn` and `console.error`)
  - Ignoring test files for certain rules
- Identified linting issues that need to be addressed
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

- Implemented a comprehensive linting workflow with the following steps:

  1. **Setup Linting Environment** (`tools/setup-linting.js`):
     - Initializes and configures ESLint and Prettier
     - Creates/updates configuration files
     - Sets up VS Code integration
  2. **Analyze Linting Issues** (`tools/analyze-lint-errors.js`):
     - Analyzes ESLint output to categorize and prioritize errors
     - Generates detailed reports with statistics
     - Identifies top issues by rule, file, and directory
  3. **Fix Issues by Rule** (`tools/fix-eslint-by-rule.js`):
     - Fixes ESLint and Prettier issues by rule name or automatically
     - Provides interactive menu of top issues
     - Supports batch processing and dry run mode
     - Features color-coded output with spinner for better UX
  4. **Track Linting Progress** (`tools/track-eslint-progress.js`):
     - Records linting status to track progress over time
     - Creates timestamped entries with issue counts
     - Supports detailed breakdown of top issues
  5. **Visualize Progress** (`tools/chart-lint-progress.js`):
     - Generates ASCII chart showing progress over time
     - Calculates fix rates and estimates completion timeline
     - Provides detailed trend analysis in verbose mode

- Added a unified workflow runner (`tools/run-lint-workflow.js`):

  - Executes all linting tools in the correct sequence
  - Provides options to skip specific steps
  - Shows progress and summary of execution
  - Handles errors gracefully

- Implemented comprehensive test suite for all linting tools:

  - Created test files for each linting tool:
    - `tools/tests/setup-linting.test.js`
    - `tools/tests/analyze-lint-errors.test.js`
    - `tools/tests/fix-eslint-by-rule.test.js`
    - `tools/tests/fix-typescript-any.test.js`
    - `tools/tests/run-lint-workflow.test.js`
  - Tests use Vitest framework for modern JavaScript testing
  - Implemented mocks for file system, child process, and readline
  - Tests cover various scenarios and edge cases:
    - Command-line flag handling
    - Error handling and graceful failure
    - Progress tracking and reporting
    - Interactive mode functionality
    - Batch processing and thresholds
  - Run tests with `npx vitest run tools/tests/`

- Enhanced `fix-eslint-by-rule.js` and `fix-typescript-any.js` with:
  - Color-coded output for better readability
  - Spinner animation during command execution
  - Progress indicators for long-running operations
  - Improved error handling and user feedback
  - Memory-efficient processing of large codebases

### Linting Issue Fixes

#### Fixing TypeScript `any` Types

When fixing `any` types, we follow these best practices:

1. **Use `unknown` for type guards**: Replace `any` with `unknown` in type guard functions to maintain type safety while allowing for runtime type checking.

   ```typescript
   // Before
   function isValidResource(obj: any): obj is Resource {
     // type checking logic
   }

   // After
   function isValidResource(obj: unknown): obj is Resource {
     // type checking logic
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
- Resource management should be optimized
- UI components should be responsive
- All managers should implement proper cleanup
- When using complex interfaces like ResourcePriority, always create complete objects rather than using primitive values
- Ensure all required properties are provided when emitting events through moduleEventBus
- Fix syntax errors in initialization functions to prevent runtime errors
- Use proper error handling in singleton initialization patterns
- When iterating over Map entries in TypeScript with a target lower than ES2015, use Array.from() to convert the entries to an array first to avoid MapIterator errors
- Apply the Array.from() pattern consistently across the codebase when iterating over Maps to ensure compatibility with different TypeScript target configurations
- Include severity information in the data object of ModuleEvents rather than as a property of the event itself
- Always enable the `downlevelIteration` option in TypeScript configuration when targeting ES2020 or lower to ensure proper iteration over Map, Set, and other iterables
- Use `--downlevelIteration` flag when running TypeScript compiler to ensure proper compilation of iteration constructs
- Configure build tools like Vite to use the correct TypeScript target and options to avoid runtime errors
- When encountering MapIterator errors, prefer using Array.from() over modifying the TypeScript target, as it provides better compatibility across different environments
- For test files with type errors, consider excluding them from TypeScript checking temporarily while fixing the core codebase
- When working with string literal union types like FactionId, use Record<FactionId, T> instead of object literals to ensure type safety
- Create helper functions to convert complex types to simpler types (like strings) before using methods specific to those simpler types
- Use type guards to check if an object has the expected properties before accessing them
- When dealing with complex nested types, create intermediate helper functions to handle type conversions
- For objects with optional properties, use optional chaining (?.) and nullish coalescing (??) operators to safely access properties
- When comparing enum-like types, ensure you're comparing the correct property of the object, not the object itself
- Use type assertions with caution and only when you're certain of the type
- Create utility functions for common type conversions to maintain consistency across the codebase
- Document type relationships and conversions for future reference
- When working with 'never' type errors, investigate the source of the error by examining the type flow
- Use TypeScript's built-in utility types like Partial<T>, Required<T>, and Pick<T, K> to create derived types
- Prefer Arrays over Sets when TypeScript has trouble with type narrowing in forEach callbacks
- When encountering 'never' type errors in collection iteration, try using traditional for loops instead of forEach methods
- Be cautious with Set.forEach as TypeScript may lose type information during iteration
- When working with Web Workers, ensure proper type definitions for message passing
- Use explicit type annotations for collections to help TypeScript infer types correctly
- Consider using type predicates (user-defined type guards) to help TypeScript narrow types correctly
- When working with complex data structures, break down operations into smaller, well-typed functions
- Document type narrowing strategies for complex operations to help future developers
- Create extended interfaces for types that need additional properties not in the base interface
- Always add null checks after type assertions to ensure runtime safety
- Define all interfaces used in the codebase, even if they're only used internally
- Use interface extension (extends) to create more specific types while maintaining compatibility
- When accessing potentially undefined properties after type assertion, add explicit null checks
- Consider creating utility types for common patterns in your codebase
- Use JSDoc comments to document complex type relationships and conversions
- Avoid using 'any' type whenever possible; prefer unknown with type guards instead
- When extending interfaces, make additional properties optional to maintain compatibility
- When working with FactionBehaviorType, create a helper function to convert string tactics to the proper object format
- In faction ship components, always convert string tactics to FactionBehaviorType objects before passing to child components
- Create a consistent pattern for handling FactionBehaviorType across all faction ship components
- Define the createFactionBehavior helper function in each component that needs to convert string tactics
- When passing tactics to ship components, ensure it's always a FactionBehaviorType object, not a string
- For components that accept both string and FactionBehaviorType, implement type checking to handle both cases
- When working with effect types, use specific effect types (DamageEffect, AreaEffect, StatusEffect) instead of generic types
- Ensure all required properties are included when creating effect objects
- Create serialization interfaces for complex objects that need to be stored or transmitted
- When working with resource-related types, ensure consistent usage of ResourcePriority objects instead of primitive numbers
- For test files, consider creating test-specific interfaces that match the structure of your test data
- Use proper mocking techniques for dependencies in tests to ensure type safety
- When fixing MapIterator errors, check for similar patterns throughout the codebase to ensure consistent fixes
- For resource-related components, ensure all required properties are defined in the appropriate interfaces
- When working with weapon effects, use the correct specific effect type with all required properties
- For combat-related components, ensure the CombatUnit interface includes all necessary properties
- Create proper type conversions for complex types like CombatUnit to ensure type safety

### Additional Type Safety Best Practices

- Always use `unknown` instead of `any` when the type is not known, and add proper type guards to narrow the type
- Use curly braces around case blocks that contain lexical declarations to avoid scope issues
- Never use async functions as promise executors, as it can lead to unhandled promise rejections
- When validating objects, use type assertions with Partial<T> to safely access properties during validation
- Create type-safe validation functions that return boolean values and use type predicates
- When working with complex interfaces, break down validation into smaller, focused functions
- Use consistent patterns for type validation across the codebase
- Document validation requirements and edge cases for complex types
- When replacing `any` with `unknown`, follow this pattern:

  ```typescript
  // Before
  function validateSomething(value: any): boolean {
    return typeof value.someProperty === 'string';
  }

  // After
  function validateSomething(value: unknown): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const val = value as { someProperty?: unknown };
    return typeof val.someProperty === 'string';
  }
  ```

- When fixing lexical declaration errors in switch statements, follow this pattern:

  ```typescript
  // Before
  switch (type) {
    case 'something':
      const value = getValue();
      // do something with value
      break;
  }

  // After
  switch (type) {
    case 'something': {
      const value = getValue();
      // do something with value
      break;
    }
  }
  ```

- When fixing async promise executors, follow this pattern:

  ```typescript
  // Before
  const promise = new Promise(async (resolve, reject) => {
    try {
      const result = await asyncOperation();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });

  // After
  const promise = new Promise((resolve, reject) => {
    asyncOperation()
      .then(result => resolve(result))
      .catch(error => reject(error));
  });
  ```

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
- Handle React Context properly by:
  1. Always checking for null/undefined context values
  2. Using early returns with null checks
  3. Destructuring context values after null checks
  4. Using function expressions instead of declarations in components
  5. Maintaining consistent context usage patterns across components
- Maintain proper function ordering in React components:
  1. Define callback functions before they are used in hooks
  2. Keep related functions together (e.g., effect handlers with their effects)
  3. Use useCallback for functions used in dependency arrays
  4. Place event handlers after hooks but before render logic
  5. Group similar functions together (e.g., all effect handlers, all event handlers)
- Implement weapon effects with proper visual hierarchy:
  1. Use consistent shader patterns for similar weapon types
  2. Scale effect intensity based on weapon power
  3. Maintain proper z-index ordering for overlapping effects
  4. Use appropriate blend modes for different effect types
  5. Implement proper cleanup for all weapon effects

### Required Types

- WeaponSystem from WeaponTypes.ts
- WeaponMount from WeaponTypes.ts
- WeaponInstance from WeaponTypes.ts
- WeaponCategory from WeaponTypes.ts
- Position from GameTypes.ts
- FactionBehaviorType from FactionTypes.ts
- CommonShipStats from CommonShipTypes.ts
- WeaponConversionType (new intermediate type)
- WeaponMountSize from WeaponTypes.ts

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

### Crucial Lessons

1. Performance

   - Always implement proper cleanup
   - Use efficient data structures
   - Optimize render cycles
   - Handle memory properly
   - Use proper batching
   - Implement proper caching

2. Type Safety

   - Always use strict mode
   - Handle nulls properly
   - Use proper guards
   - Maintain consistency
   - Handle assertions safely
   - Document type usage

3. State Management
   - Use proper patterns
   - Handle cleanup properly
   - Maintain consistency
   - Use safe assertions
   - Handle events properly
   - Document state flow

### System Dependencies

1. Core Dependencies

   - React/TypeScript
   - Redux/Context
   - WebGL/Three.js
   - RxJS/Observable
   - GSAP/Framer
   - React-spring

2. Development Dependencies

   - Webpack/Vite
   - Jest/Testing
   - ESLint/Prettier
   - Storybook
   - TypeScript
   - Node.js

3. Production Dependencies
   - Browser compatibility
   - Mobile responsiveness
   - Performance optimization
   - State persistence
   - Memory management
   - Error handling

### Notes

- Always implement proper cleanup
- Maintain consistent patterns
- Focus on performance
- Handle types safely
- Document thoroughly
- Test comprehensively

### Development Best Practices

- Add debug information to stderr while keeping stdout clean
- Handle lexical declarations in switch-case blocks using block scoping
- Remove unused imports to avoid TypeScript linter warnings
- Use 'as const' assertions to properly type string literals
- Properly handle cleanup in useEffect to prevent memory leaks
- When implementing threshold-based systems, use proper TypeScript types and React Context
- For search results, ensure proper handling of different character encodings (UTF-8)
- Ensure proper event emission and handling across the system
- Maintain consistent type usage across related components
- Use type assertions with 'as const' for string literal arrays to ensure proper type inference
- Implement proper error handling and type safety for automation systems
- Use memoization for complex calculations and filtering operations
- Implement proper cleanup for automated processes
- Use Record<string, T> instead of Map for serializable state in React Context
- Implement playback controls with proper cleanup and state management
- Use transition animations for smooth visual updates in replay systems
- Implement proper event filtering and time-based playback for mission replays
- Use NonNullable type assertion for filtering out undefined values
- Implement proper type safety for ship status monitoring
- Use proper cleanup for interval-based updates
- Implement smooth transitions for status bar updates
- Use proper color coding for different status types
- Implement proper particle effects for resource transfers
- Use proper cleanup for particle systems
- Ensure proper module type definitions for new features
- Use consistent naming conventions for automation rules
- Implement proper resource requirement scaling for buildings
- Use proper event emission for automation state changes
- Implement proper cleanup for automation rules
- Implement proper event subscription using moduleEventBus.subscribe
- Use proper type assertions for moduleType comparisons
- Implement proper cleanup for visual effects
- Use proper animation keyframes for smooth transitions
- Implement proper particle system cleanup
- Use proper color coding for different combat states
- Implement proper visual feedback for automation actions
- Use proper event filtering for automation events
- Maintain consistent visual hierarchy in effects
- Handle component lifecycle properly for animations
- Implement proper combat automation rules with intervals
- Use proper formation patterns for fleet management
- Implement proper damage control and shield management
- Use proper weapon system automation with cooldowns
- Implement proper emergency protocols with priorities
- Use proper visual feedback for combat actions
- Maintain proper cleanup for combat effects
- Handle proper event emission for combat automation
- Use spatial partitioning for efficient collision detection
- Implement object pooling for particle systems
- Offload heavy calculations to Web Workers
- Use virtualization for large lists of elements
- Batch updates with requestAnimationFrame
- Memoize expensive calculations
- Use refs for mutable state that doesn't need re-renders
- Implement proper cleanup for Web Workers
- Use TypeScript for worker message types
- Optimize combat calculations with spatial indexing
- Implement proper particle system pooling
- Use proper cleanup for particle effects
- Optimize render cycles with virtualization
- Handle proper cleanup for combat effects
- Maintain proper type safety in Web Workers
- Implement smooth formation transitions with quality-based effects
- Use requestAnimationFrame for animation performance
- Handle proper cleanup for animation effects
- Implement proper easing functions for smooth transitions
- Use quality-based particle systems for visual feedback
- Track formation state changes for transition triggers
- Maintain consistent color schemes across formation patterns
- Use SVG for formation shape visualization
- Implement proper position interpolation for unit movement
- Handle proper cleanup for particle effects
- Implement proper weapon effect management with quality settings
- Use centralized effect lifecycle management for weapons
- Implement pattern-based weapon effects with proper cleanup
- Use quality-based particle count adjustment for performance
- Integrate weapon effects with particle system management
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
- Properly implement all required interface properties
- Handle weapon type conversions carefully
- Use intermediate types for complex conversions
- Pay attention to map function parameter types
- Consider intermediate types for complex conversions

# System Architecture

## Type System

### Combat Types

#### CombatUnit

- Base unit type for all combat entities
- Contains position, rotation, velocity, and status
- Includes basic stats and weapon systems
- Status system with main state, secondary state, and effects

#### FactionCombatUnit

- Extends CombatUnit with faction-specific features
- Includes class, tactics, and formation information
- Enhanced stats with accuracy, evasion, and critical hit mechanics
- Experience and skill system
- Weapon mount system for modular weapons

### Weapon Types

#### WeaponSystem

- Core weapon type with damage, range, and cooldown
- Status system for weapon states (ready, charging, cooling, disabled)
- Support for upgrades and requirements

#### WeaponMount

- Modular weapon mounting system
- Size and position constraints
- Category restrictions for weapon types
- Current weapon instance tracking

### Faction System

#### FactionId

- Comprehensive faction identification
- Supports player, enemy, neutral, and ally factions
- Includes special factions: space-rats, lost-nova, equator-horizon

#### FactionBehaviorType

- Structured behavior definition
- Formation and targeting system
- Customizable behavior patterns

## Type Conversion System

### Combat Unit Conversion

- Safe conversion between CombatUnit and FactionCombatUnit
- Preserves unit state and properties
- Handles weapon system conversion
- Type guard functions for runtime checks

### Weapon Conversion

- Bidirectional conversion between WeaponMount and WeaponSystem
- Preserves weapon stats and state
- Handles mount requirements and restrictions
- Type validation for weapon categories

## Geometry System

### Vector2D

- 2D vector operations
- Distance and angle calculations
- Vector normalization and scaling
- Point interpolation

### BoundingBox

- Rectangular boundary representation
- Collision detection
- Point containment checks
- Rotation and transformation

## Best Practices

### Type Safety

- Use type guards for runtime type checking
- Implement conversion functions for type transitions
- Maintain strict type definitions
- Document type relationships

### Code Organization

- Group related types in dedicated files
- Use interfaces for complex type definitions
- Implement validation functions
- Keep type conversion logic centralized

### Documentation

- Document type relationships
- Maintain type conversion patterns
- Update documentation with type changes
- Include usage examples

### Combat System Architecture

1. Type Definitions

   - FactionCombatUnit extends CombatUnit with faction-specific properties
   - FactionWeaponSystem extends WeaponSystem with mount information
   - Proper type guards for unit type checking (isFactionCombatUnit, isBaseCombatUnit)
   - Consistent use of CommonShipStats for ship properties
   - Proper handling of weapon conversions between systems and mounts

2. State Machine Implementation

   - Faction-specific state types (FactionStateType)
   - Event-driven transitions (FactionEvent)
   - State history tracking
   - Proper cleanup and state management
   - Type-safe event handling

3. Fleet Management

   - Type-safe fleet updates with proper conversions
   - Formation management with proper positioning
   - Strength calculations with proper type handling
   - Ship status management with proper type safety
   - Resource-aware fleet operations

4. Faction Behavior System
   - State machine-driven behavior patterns
   - Resource management integration
   - Territory control system
   - Relationship management
   - Combat tactics system

### Type System Improvements

1. Weapon System Types

   - Clear separation between WeaponSystem and WeaponMount
   - Type-safe conversions between system types
   - Proper handling of weapon effects
   - Mount size and position typing
   - Category-based validation
   - Effect type handling:
     - Required properties: id, type, duration, magnitude
     - Optional properties: target, radius
     - Use utility functions for effect creation
     - Consistent type conversion patterns
   - Weapon Effect System:
     - WeaponLike interface for flexible effect creation
     - Type-safe effect generation from weapons
     - Proper validation and normalization
     - Clear separation of concerns between weapons and effects
   - Advanced Effect Features:
     - Effect scaling with proper type safety
     - Effect combination utilities
     - Effect chain creation
     - Type-safe conversion between weapon systems
     - Proper handling of optional properties
     - Consistent naming patterns across systems
   - Best Practices:
     - Use createWeaponLike for type-safe weapon effect creation
     - Use convertToWeaponLike for converting existing weapons
     - Use createWeaponEffect for standard effects
     - Use createScaledWeaponEffect for damage scaling
     - Use createEffectChain for sequential effects
     - Maintain consistent property naming across systems
     - Document effect relationships and dependencies
     - Use type guards for runtime validation

2. Ship Type System

   - Proper inheritance hierarchy for ship types
   - Faction-specific ship class handling
   - Status type safety improvements
   - Stats type consistency
   - Ability system typing

3. Resource Type Safety

   - Strong typing for resource amounts
   - Type-safe resource transfers
   - Resource threshold typing
   - Income calculation type safety
   - Resource node type definitions

4. Territory System Types
   - Position type consistency
   - Boundary type safety
   - Control point typing
   - Resource distribution typing
   - Threat level calculations

### Best Practices Updates

1. Type Conversion

   - Always use type guard functions for type checking
   - Implement conversion utilities for complex types
   - Maintain type safety during state updates
   - Use proper type assertions when necessary
   - Document type conversion patterns

2. State Machine Patterns
   - Use discriminated unions for state types
   - Implement type-safe transitions
   - Track state history with proper typing
   - Handle cleanup properly
   - Maintain consistent state patterns

# Effect System Architecture

## Type Hierarchy

### Base Effect Types

```typescript
// Core Effect interface (GameTypes.ts)
interface Effect {
  id: string;
  type: string;
  duration: number;
  magnitude: number;
  target?: string;
}

// Base Effect interface (EffectTypes.ts)
interface BaseEffect extends Effect {
  id: string;
  name: string;
  description: string;
  type: EffectType;
  magnitude: number;
  duration?: number;
  active?: boolean;
  cooldown?: number;
}
```

### Weapon Effect Types

```typescript
// Base weapon effect
interface WeaponEffect extends Effect {
  type: 'damage' | 'area' | 'status';
  duration: number;
  strength: number;
}

// Specialized weapon effects
interface DamageEffect extends WeaponEffect {
  type: 'damage';
  damageType: 'physical' | 'energy' | 'explosive';
  penetration: number;
}

interface AreaEffect extends WeaponEffect {
  type: 'area';
  radius: number;
  falloff: number;
}

interface StatusEffect extends WeaponEffect {
  type: 'status';
  statusType: 'burn' | 'emp' | 'slow' | 'stun';
}

type WeaponEffectType = DamageEffect | AreaEffect | StatusEffect;
```

## Effect Creation Patterns

### Base Pattern

1. Create base effect with common properties
2. Extend with specific effect type properties
3. Validate and return typed effect

### Type-Safe Creation Functions

```typescript
// Base weapon effect creation
function createBaseWeaponEffect(params): WeaponEffect;

// Specialized effect creation
function createDamageEffect(params): DamageEffect;
function createAreaEffect(params): AreaEffect;
function createStatusEffect(params): StatusEffect;

// Generic effect creation
function createCustomWeaponEffect(params): WeaponEffectType;
```

### Effect Composition Patterns

1. Effect Scaling: Scale magnitude while preserving type
2. Effect Combining: Merge effects with compatible types
3. Effect Chaining: Create sequential effect triggers

## Type Guards and Validation

### Type Guard Pattern

```typescript
function isWeaponEffect(effect): effect is WeaponEffect {
  return (
    'type' in effect &&
    (effect.type === 'damage' || effect.type === 'area' || effect.type === 'status') &&
    'strength' in effect
  );
}

function isDamageEffect(effect): effect is DamageEffect {
  return isWeaponEffect(effect) && effect.type === 'damage' && 'damageType' in effect;
}

function isAreaEffect(effect): effect is AreaEffect {
  return isWeaponEffect(effect) && effect.type === 'area' && 'radius' in effect;
}

function isStatusEffect(effect): effect is StatusEffect {
  return isWeaponEffect(effect) && effect.type === 'status' && 'statusType' in effect;
}
```

### Validation Pattern

1. Check required properties
2. Validate property types
3. Ensure type-specific constraints
4. Return validated effect

## Best Practices

### Effect Creation

1. Always use typed creation functions
2. Provide complete effect parameters
3. Handle optional properties with defaults
4. Maintain effect type consistency

### Effect Management

1. Use type guards for effect filtering
2. Maintain effect stacks type-safely
3. Handle effect cleanup properly
4. Track effect lifecycles

### Type Safety

1. Use proper type extensions
2. Implement comprehensive type guards
3. Maintain strict type checking
4. Document type relationships

## Integration Guidelines

### Weapon System Integration

1. Use WeaponEffectType for effect arrays
2. Implement proper effect filtering
3. Handle effect application type-safely
4. Maintain effect state consistency

### Combat System Integration

1. Use proper effect type guards
2. Handle effect stacking safely
3. Manage effect durations
4. Clean up expired effects

### UI Integration

1. Type-safe effect rendering
2. Proper effect state display
3. Effect feedback visualization
4. Status effect indicators

# Resource Management System Architecture

## Resource Management System

The Resource Management System provides comprehensive management of game resources, including tracking, validation, storage, flow optimization, and threshold monitoring.

### Core Components

#### Resource Types

- Defined in `src/types/resources/ResourceTypes.ts`
- Provides type definitions for all resource-related entities
- Includes interfaces for `ResourceState`, `ResourceTransfer`, `ResourceThreshold`, etc.
- Ensures type safety throughout the resource management system

#### Resource Validation

- Implemented in `src/utils/resources/resourceValidation.ts`
- Provides validation functions for all resource types
- Ensures data integrity and type safety
- Used by managers and components to validate resource operations

#### Resource Threshold Manager

- Implemented in `src/managers/resource/ResourceThresholdManager.ts`
- Monitors resource levels against defined thresholds
- Triggers actions when thresholds are crossed
- Supports different threshold types (min, max, target)
- Manages alerts and notifications for threshold events

#### Resource Flow Manager

- Implemented in `src/managers/resource/ResourceFlowManager.ts`
- Optimizes resource flows between producers, consumers, and storage
- Manages network of resource nodes and connections
- Calculates optimal flow rates based on priorities
- Identifies bottlenecks and underutilized resources

#### Resource Storage Manager

- Implemented in `src/managers/resource/ResourceStorageManager.ts`
- Manages storage containers, pools, and allocation strategies
- Handles resource storage, retrieval, and transfer operations
- Implements overflow policies and automatic rebalancing
- Tracks storage history and provides analytics

#### Resource Cost Manager

- Implemented in `src/managers/resource/ResourceCostManager.ts`
- Validates resource costs for purchases and operations
- Calculates adjusted costs with discounts and taxes
- Applies costs to resource states
- Supports tiered and bulk pricing models
- Tracks cost history for analytics

#### Resource Exchange Manager

- Implemented in `src/managers/resource/ResourceExchangeManager.ts`
- Manages resource exchange rates between different types
- Simulates market dynamics with different conditions
- Supports rate modifiers and fluctuations
- Calculates optimal exchange paths
- Tracks exchange transactions

#### Resource Pool Manager

- Implemented in `src/managers/resource/ResourcePoolManager.ts`
- Manages resource pools for centralized distribution
- Implements different allocation strategies
- Supports rule-based distribution to containers
- Handles priority-based and demand-based allocation
- Tracks allocation history and analytics

#### Resource Tracking Hook

- Implemented in `src/hooks/resources/useResourceTracking.ts`
- Provides global resource tracking for React components
- Manages resource state, history, and alerts
- Offers utility functions for resource operations
- Persists resource state to local storage

### Integration Points

- **Event System**: Resource managers emit events for resource updates, threshold triggers, and alerts
- **Module Framework**: Resource managers integrate with the module system for automation
- **UI Components**: Resource tracking hook provides data for UI visualization
- **Game Loop**: Resource flow optimization runs on game loop ticks

### Design Patterns

- **Observer Pattern**: Resource managers notify subscribers of resource changes
- **Strategy Pattern**: Different allocation strategies for resource storage
- **Factory Pattern**: Resource creation and validation
- **Repository Pattern**: Centralized resource state management

### Implementation Notes

- Resource types use TypeScript interfaces for strong typing
- Managers use Maps for efficient lookup and storage
- Thresholds support multiple action types (production, consumption, transfer, notification)
- Flow optimization uses priority-based allocation
- Storage manager supports different container types and overflow policies
- Cost manager implements tiered pricing and bulk discounts
- Exchange manager simulates market dynamics with different conditions
- Pool manager supports multiple allocation strategies for distribution

### Type Safety Improvements

- Fixed type safety issues in ResourcePoolManager by properly typing container priorities
- Corrected event bus integration in ResourceThresholdManager using ModuleEventType
- Resolved property access errors in ResourceFlowManager with proper null checks
- Updated validation imports and function calls in ResourceStorageManager
- Corrected ResourceType usage in useResourceTracking hook
- Implemented proper ResourceState structure without timestamp property
- Used type assertions where necessary to maintain type safety
- Added proper null checks for optional properties

### Best Practices

- Used Partial<Record<ResourceType, number>> for flexible record types
- Implemented conditional property access with optional chaining
- Added fallback values for potentially undefined properties
- Used type assertions only when necessary and with proper type checking
- Implemented proper event bus pattern with type-safe event emission
- Maintained consistent state structure across all resource managers
- Ensured proper cleanup in all resource managers

## Implementation Guidelines

### Type Safety

- Strong typing for resource amounts
- Type-safe resource transfers
- Resource threshold typing
- Income calculation type safety
- Resource node type definitions

### Performance Optimization

- Efficient resource calculations
- Optimized resource flow algorithms
- Batched resource updates
- Memory-efficient storage

### State Management

- Consistent state updates
- Proper event handling
- Clean resource transfer patterns
- Proper cleanup in all components

# Resource Management System Testing

## Test Structure

The resource management system includes comprehensive unit tests for all major components:

### Test Setup

- `src/tests/setup.ts`: Provides common test utilities and mocks
  - Mock implementation of localStorage for testing persistence
  - Mock implementation of moduleEventBus for testing event handling
  - Utility functions for testing timers and async operations

### Manager Tests

- `ResourceThresholdManager.test.ts`: Tests threshold monitoring and alerts

  - Tests threshold registration and configuration
  - Tests threshold triggering and resolution
  - Tests alert creation and clearing
  - Tests action execution for different threshold types

- `ResourceFlowManager.test.ts`: Tests resource flow optimization

  - Tests node and connection registration
  - Tests flow creation and validation
  - Tests flow optimization algorithms
  - Tests transfer history tracking

- `ResourceStorageManager.test.ts`: Tests storage management
  - Tests container registration and configuration
  - Tests resource storage and retrieval
  - Tests capacity limits and overflow handling
  - Tests container filtering by resource type

### Hook Tests

- `useResourceTracking.test.tsx`: Tests the global resource tracking hook
  - Tests initialization with default and custom resource types
  - Tests resource updating, incrementing, and decrementing
  - Tests resource transfer operations
  - Tests threshold monitoring and alerts
  - Tests persistence to localStorage

## Testing Best Practices

1. **Mock External Dependencies**

   - Use vi.mock() for external modules
   - Create mock implementations for browser APIs
   - Use dependency injection for testable components

2. **Test Component Lifecycle**

   - Test initialization and cleanup
   - Test state transitions
   - Test error handling

3. **Test Edge Cases**

   - Test boundary conditions (min/max values)
   - Test invalid inputs
   - Test resource constraints

4. **Test Performance**

   - Test with large datasets
   - Test optimization algorithms
   - Test memory usage

5. **Test Integration Points**
   - Test event emission and handling
   - Test persistence and serialization
   - Test component interactions

# Resource Management System Integration

## Integration Architecture

The resource management system has been integrated with existing game systems through a layered architecture:

### Core Integration Layer

The `ResourceIntegration` class serves as the primary bridge between the new specialized resource managers and the legacy `ResourceManager`. It provides:

1. **Event Translation**: Translates events between the legacy event system and the new resource management system
2. **State Synchronization**: Keeps resource states synchronized between systems
3. **Flow Optimization**: Applies optimized resource flows to the legacy system
4. **Threshold Management**: Connects threshold alerts with the legacy system

### Mining Integration Layer

The `MiningResourceIntegration` class connects the mining system with the resource management system:

1. **Mining Node Registration**: Registers mining nodes as resource producers
2. **Ship Efficiency Tracking**: Updates resource production rates based on ship efficiency
3. **Threshold-Based Mining**: Prioritizes mining operations based on resource thresholds
4. **Flow Optimization**: Optimizes resource extraction and transfer

### React Integration Layer

The `useResourceManagement` hook provides React components with access to the resource management system:

1. **Resource State Access**: Provides access to resource states, amounts, and capacities
2. **Resource Modification**: Allows components to consume and add resources
3. **Rate Management**: Provides access to production and consumption rates
4. **Capacity Management**: Provides access to resource capacities and percentages

### UI Integration

The `ResourceVisualizationEnhanced` component demonstrates integration with the UI layer:

1. **Dynamic Resource Display**: Shows all available resource types
2. **Real-Time Updates**: Updates resource displays in real-time
3. **Threshold Visualization**: Shows warnings for low resource levels
4. **Rate Display**: Shows production and consumption rates

## Integration Patterns

The integration uses several design patterns:

1. **Adapter Pattern**: The `ResourceIntegration` class adapts between the legacy and new systems
2. **Observer Pattern**: Event subscriptions allow systems to react to changes
3. **Facade Pattern**: The `useResourceManagement` hook provides a simplified interface
4. **Factory Pattern**: The `createResourceIntegration` function creates and initializes the integration

## Integration Benefits

The integration provides several benefits:

1. **Gradual Migration**: Allows gradual migration from the legacy system to the new system
2. **Enhanced Functionality**: Adds new features without disrupting existing functionality
3. **Improved Performance**: Optimizes resource flows and reduces unnecessary updates
4. **Better Type Safety**: Provides strong typing for resource operations
5. **Testability**: Makes it easier to test resource management in isolation

## Integration Challenges

The integration addresses several challenges:

1. **Event System Differences**: Bridges between different event systems
2. **Type Safety**: Ensures type safety across system boundaries
3. **State Synchronization**: Keeps resource states consistent between systems
4. **Performance**: Minimizes overhead from running two systems in parallel

## Lessons Learned

During the implementation of the resource management system, we learned several important lessons:

1. **Type Safety**:

   - Always use proper type definitions for resource-related entities
   - Implement type guards for runtime type checking
   - Use TypeScript's utility types (Partial, Record, etc.) for flexible type definitions
   - Handle optional properties with proper null checks

2. **Event Handling**:

   - Use a consistent event emission pattern across the system
   - Implement proper event filtering to avoid unnecessary updates
   - Ensure proper cleanup of event subscriptions to prevent memory leaks
   - Use typed events for better type safety

3. **Integration Strategies**:

   - Use adapter pattern for integrating with legacy systems
   - Implement gradual migration strategies to minimize disruption
   - Create clear boundaries between systems with well-defined interfaces
   - Use factory functions for easy creation and initialization of components

4. **Performance Considerations**:
   - Batch resource updates to reduce unnecessary renders
   - Optimize resource flow calculations for large resource networks
   - Use memoization for expensive calculations
   - Implement proper cleanup to prevent memory leaks

These lessons have been applied throughout the resource management system implementation and should be considered for future system implementations.

## Module Framework Architecture

The Module Framework provides a comprehensive system for managing, attaching, visualizing, and automating modules within the game. It follows a modular architecture with clear separation of concerns.

### Core Components

#### Module Type System

- **Purpose**: Defines the core module interfaces and types
- **Key Features**:
  - Type definitions for various module types
  - Module status tracking
  - Module capability definitions
  - Module upgrade paths

#### Module Validation System

- **Purpose**: Ensures type safety and validation for module operations
- **Key Features**:
  - Type guards for module types
  - Validation utilities for module operations
  - Conversion functions between module types
  - Error handling for invalid operations

#### Module Attachment System

- **Purpose**: Manages the attachment of modules to buildings and ships
- **Key Features**:
  - Attachment configuration system
  - Validation of attachment compatibility
  - Attachment visualization
  - Event-based attachment notifications

#### Module HUD System

- **Purpose**: Provides dynamic UI components for module visualization and control
- **Key Features**:
  - Dynamic module information display
  - Module control interfaces
  - Status visualization
  - Support for module lists and building modules

#### Module Automation System

- **Purpose**: Enables automated control of modules based on rules and conditions
- **Key Features**:
  - Resource threshold rules
  - Time-based rules
  - Status-based rules
  - Event-based rules
  - Custom automation rules

### Integration Architecture

The Module Framework is integrated with existing game systems through a centralized initialization system that establishes connections between modules and other core systems.

#### Module Framework Initialization

- **Purpose**: Initializes and integrates the module framework with existing systems
- **Key Features**:
  - Resource integration for consumption and production
  - Status tracking integration with resource thresholds
  - Sub-module configuration registration
  - Periodic status updates for active modules
  - Event subscription for system-wide communication

#### Resource Integration

- **Purpose**: Connects modules with the resource management system
- **Key Features**:
  - Resource consumption registration for active modules
  - Resource production registration for productive modules
  - Resource-based module upgrades
  - Resource threshold monitoring for module status
  - Level-based production scaling

#### Event System Integration

- **Purpose**: Enables communication between modules and other systems
- **Key Features**:
  - Module lifecycle event handling
  - Resource threshold event handling
  - Status change notifications
  - Upgrade progress tracking
  - Sub-module effect application

#### Status Tracking Integration

- **Purpose**: Monitors module status based on system-wide conditions
- **Key Features**:
  - Resource availability impact on module status
  - Periodic status updates for active modules
  - Status-based automation rules
  - Alert generation for status changes
  - Status visualization in the UI

### Design Patterns

#### Observer Pattern

The Module Framework extensively uses the Observer pattern through the event system. Modules emit events when their state changes, and other components can subscribe to these events to react accordingly.

#### Factory Pattern

Factory functions are used to create modules and automation rules, encapsulating the creation logic and ensuring proper initialization.

#### Strategy Pattern

The automation system uses the Strategy pattern to implement different rule types, allowing for flexible rule behavior without changing the core automation logic.

#### Command Pattern

Module actions (activate, deactivate, upgrade) are implemented using the Command pattern, encapsulating the action logic and making it reusable.

### Integration Points

#### Resource Management Integration

- Modules consume resources when active
- Automation rules can be based on resource thresholds
- Module upgrades require resources
- Resource production is scaled based on module level
- Resource thresholds affect module status

#### Event System Integration

- Modules emit events on state changes
- Automation rules can be triggered by events
- HUD components subscribe to module events
- Resource threshold events affect module status
- Upgrade progress is tracked through events

#### UI Framework Integration

- Module HUD components provide visualization
- Module controls are integrated with the UI
- Module status is visually represented
- Upgrade progress is visualized
- Sub-module effects are displayed

### Best Practices

#### Module Design

- Keep modules focused on specific functionality
- Ensure resource costs are balanced
- Design clear upgrade paths
- Consider compatibility with other modules
- Document module behavior clearly

#### Integration Implementation

- Use event-based communication for loose coupling
- Implement proper cleanup for all subscriptions
- Handle resource changes efficiently
- Update UI components only when necessary
- Validate all operations before execution

#### Performance Considerations

- Batch resource updates to reduce unnecessary renders
- Use memoization for expensive calculations
- Implement proper cleanup to prevent memory leaks
- Optimize event handling for high-frequency events
- Use efficient data structures for module storage

### Future Enhancements

#### Advanced Integration

- Integration with tech tree for unlocking modules
- Integration with faction system for faction-specific modules
- Integration with mission system for module-based objectives
- Integration with achievement system for module milestones
- Integration with tutorial system for module guidance

#### Performance Optimization

- Implement module pooling for frequently created modules
- Optimize resource calculations for large module networks
- Implement lazy loading for module UI components
- Use Web Workers for heavy module calculations
- Implement caching for module status calculations

#### UI Enhancements

- Implement drag-and-drop module attachment
- Create interactive module upgrade visualization
- Develop module comparison interface
- Implement module search and filtering
- Create module recommendation system

### Event System Architecture

The Event System provides a comprehensive framework for event handling, communication, and synchronization across the application. It integrates with existing systems while providing enhanced capabilities through RxJS integration, a centralized game loop, and advanced event filtering.

#### Core Components

1. **Event Dispatcher**

   - **Purpose**: Provides a React Context-based event dispatcher for components
   - **Key Features**:
     - Context provider for application-wide event access
     - Subscription management for component lifecycle
     - Event history tracking and retrieval
     - Type-safe event emission and handling
   - **Integration Points**: React components, Module system, Resource system

2. **RxJS Integration**

   - **Purpose**: Integrates RxJS with the event system for reactive programming
   - **Key Features**:
     - Observable wrappers for event streams
     - Subject-based event broadcasting
     - Operators for filtering, mapping, and transforming events
     - Subscription management utilities
   - **Integration Points**: Event Dispatcher, Module Events, Game Loop

3. **Game Loop Manager**

   - **Purpose**: Provides a centralized timer and update system
   - **Key Features**:
     - Priority-based update scheduling
     - Delta time calculation for consistent updates
     - Performance monitoring and statistics
     - Frame rate optimization
   - **Integration Points**: Animation systems, AI systems, Physics systems

4. **Event Communication**

   - **Purpose**: Enables cross-component and system-to-system messaging
   - **Key Features**:
     - Message priority levels
     - Acknowledgment system for reliable delivery
     - System-specific message routing
     - Correlation ID tracking for related messages
   - **Integration Points**: Resource system, Module system, Combat system

5. **Event Filtering**

   - **Purpose**: Provides advanced event filtering, batching, and prioritization
   - **Key Features**:
     - Priority queue for event processing
     - Conditional event filtering
     - Event batching for performance
     - Throttling and debouncing utilities
   - **Integration Points**: UI updates, Resource processing, Combat calculations

6. **Game Systems Integration**
   - **Purpose**: Connects the event system with existing game systems
   - **Key Features**:
     - Resource system integration for resource events
     - Mining system integration for mining operations
     - Combat system integration for combat events
     - Tech tree integration for technology progression
     - Error handling for robust operation
     - Cleanup management for proper resource release
   - **Integration Points**: Resource Manager, Mining Manager, Combat Manager, Tech Tree Manager

#### Event Flow Architecture

The event flow in the system follows these patterns:

1. **Component-to-Component Communication**:

   - Component A uses `useEventDispatcher` to emit an event
   - Component B uses `useEventSubscription` to listen for the event
   - Event Dispatcher handles delivery and lifecycle management

2. **System-to-System Communication**:

   - System A uses `EventCommunication` to send a message to System B
   - System B registers handlers for specific message types
   - Message acknowledgments ensure reliable delivery

3. **Reactive Data Flow**:

   - Events are transformed into Observables using RxJS integration
   - Data transformations are applied using RxJS operators
   - Components subscribe to transformed data streams

4. **Game Loop Updates**:

   - Systems register update callbacks with the Game Loop Manager
   - Updates are executed based on priority and timing
   - Delta time ensures consistent behavior regardless of frame rate

5. **Game Systems Integration Flow**:
   - Event system initializes and connects to game systems
   - Game systems register event handlers for specific message types
   - Events are processed based on priority and system requirements
   - Cross-system communication is facilitated through the event system
   - Cleanup functions ensure proper resource release on shutdown

#### Event Types and Priorities

Events in the system are categorized by priority:

1. **Critical (0)**: System errors, critical failures

   - Processed immediately, never throttled
   - Examples: ERROR_OCCURRED, system crashes

2. **High (1)**: Important gameplay events

   - Processed with high priority, rarely throttled
   - Examples: RESOURCE_SHORTAGE, MODULE_DETACHED

3. **Normal (2)**: Standard gameplay events

   - Regular processing, may be throttled during high load
   - Examples: MODULE_CREATED, RESOURCE_PRODUCED

4. **Low (3)**: Non-critical updates

   - Processed when resources available, often throttled
   - Examples: STATUS_CHANGED, visual updates

5. **Background (4)**: Maintenance and analytics
   - Processed only when system is idle
   - Examples: MISSION_PROGRESS_UPDATED, analytics

#### Integration Architecture

The Event System integrates with other systems through these mechanisms:

1. **Module Framework Integration**:

   - Module events are captured and processed through the Event Dispatcher
   - Module status changes trigger appropriate events
   - Module automation is driven by the Game Loop

2. **Resource Management Integration**:

   - Resource changes emit events through the Event System
   - Resource thresholds trigger priority-based alerts
   - Resource flows are optimized through batched event processing

3. **UI Integration**:

   - UI components subscribe to relevant events using hooks
   - UI updates are throttled based on priority
   - Animation timing is synchronized with the Game Loop

4. **Combat System Integration**:
   - Combat events are processed with appropriate priorities
   - Time-sensitive combat calculations use the Game Loop
   - Combat results are communicated through the Event System

#### Best Practices

1. **Event Emission**:

   - Use the appropriate event type for the situation
   - Include all necessary data in the event payload
   - Set the correct priority for the event
   - Use correlation IDs for related events

2. **Event Subscription**:

   - Clean up subscriptions when components unmount
   - Use specific event types rather than broad subscriptions
   - Apply appropriate filtering to reduce processing
   - Handle errors in event handlers

3. **Game Loop Usage**:

   - Register updates with appropriate priorities
   - Keep update callbacks lightweight
   - Use fixed timestep for physics and simulations
   - Unregister updates when no longer needed

4. **Performance Optimization**:

   - Batch similar events when possible
   - Use throttling for high-frequency events
   - Apply debouncing for user input events
   - Prioritize critical events during high load

5. **Error Handling**:
   - Catch and log errors in event handlers
   - Provide fallback behavior for failed events
   - Use the acknowledgment system for critical operations
   - Monitor event system performance

#### Future Enhancements

1. **Advanced Event Routing**:

   - Dynamic routing based on system state
   - Content-based routing for complex scenarios
   - Multi-cast routing for efficient broadcasting

2. **Enhanced Visualization**:

   - Event flow visualization for debugging
   - Real-time event monitoring dashboard
   - Performance analytics for event processing

3. **Distributed Event Processing**:

   - Worker thread support for heavy processing
   - Sharded event processing for scalability
   - Prioritized worker allocation based on event type

4. **Advanced Synchronization**:
   - Event-based synchronization primitives
   - Transactional event processing
   - Conflict resolution for concurrent events

### Automation System Architecture

The Automation System provides a framework for creating, managing, and visualizing automated routines that can perform various tasks within the game without direct player intervention.

#### Core Components

1. **GlobalAutomationManager**

   - Central manager for all automation routines
   - Handles routine registration, execution, and lifecycle
   - Integrates with the game loop for timed execution
   - Communicates with other systems via the event system
   - Implements priority-based execution queue
   - Provides methods for enabling/disabling routines
   - Manages routine conditions and actions

2. **AutomationVisualization**

   - React component for visualizing automation routines
   - Provides UI for filtering, sorting, and managing routines
   - Displays routine status, history, and performance metrics
   - Allows enabling/disabling/removing routines
   - Implements responsive design for different screen sizes

3. **useAutomation Hook**

   - React hook for accessing the global automation system
   - Provides methods for creating, updating, and removing routines
   - Manages routine state and updates
   - Handles routine filtering by type, tag, and system
   - Integrates with the event system for real-time updates

4. **Automation System Initialization**
   - Initializes the global automation manager
   - Registers default automation routines
   - Integrates with the event system
   - Sets up communication with other systems

#### Design Patterns

1. **Singleton Pattern**

   - GlobalAutomationManager implemented as a singleton
   - Ensures a single instance manages all automation routines
   - Provides global access to automation functionality

2. **Observer Pattern**

   - Routines can subscribe to events from various systems
   - Event-based triggers for routine execution
   - Real-time updates to visualization components

3. **Command Pattern**

   - Actions encapsulated as executable commands
   - Standardized interface for different action types
   - Enables composition of complex automation behaviors

4. **Strategy Pattern**

   - Different routine types implement specialized behaviors
   - Consistent interface for varied automation strategies
   - Allows for extensibility with new routine types

5. **Factory Pattern**
   - Helper methods for creating common routine types
   - Standardized routine creation with proper defaults
   - Ensures type safety and validation during creation

#### Integration Points

1. **Event System Integration**

   - Subscribes to relevant game events
   - Emits events for routine execution and status changes
   - Uses event filtering for efficient event processing

2. **Game Loop Integration**

   - Registers with the game loop for regular updates
   - Implements priority-based execution scheduling
   - Handles delta time for consistent execution timing

3. **Resource System Integration**

   - Monitors resource levels for condition-based execution
   - Performs resource-related actions
   - Optimizes resource flow based on game state

4. **Module System Integration**
   - Interacts with game modules through standardized interfaces
   - Automates module operations based on conditions
   - Monitors module status for responsive automation

#### Best Practices

1. **Performance Optimization**

   - Use priority queue for efficient routine execution
   - Implement condition short-circuiting to avoid unnecessary checks
   - Batch similar actions for improved performance
   - Use throttling and debouncing for frequent events

2. **Type Safety**

   - Define clear interfaces for routines, conditions, and actions
   - Use proper type guards for runtime type checking
   - Implement validation for user-created routines
   - Maintain consistent type usage across the system

3. **Error Handling**

   - Implement robust error handling for routine execution
   - Log errors with context for debugging
   - Prevent cascading failures from problematic routines
   - Provide clear error messages in the UI

4. **Extensibility**
   - Design for easy addition of new routine types
   - Use composition for complex automation behaviors
   - Implement plugin architecture for system extensions
   - Provide hooks for custom routine visualization

### Testing Architecture

The testing architecture for the Galactic Sprawl project is designed to ensure comprehensive coverage of all system components while maintaining isolation between tests. The testing framework is built on Vitest and React Testing Library, providing a robust foundation for unit, integration, and component testing.

#### Testing Principles

1. **Isolation**: Each test should be isolated from others, with no shared state or dependencies.
2. **Mocking**: External dependencies should be mocked to ensure tests focus on the unit being tested.
3. **Coverage**: Tests should cover all critical paths and edge cases.
4. **Readability**: Tests should be clear and readable, serving as documentation for the system.
5. **Maintainability**: Tests should be easy to maintain and update as the system evolves.

#### Test Organization

Tests are organized to mirror the structure of the codebase, with test files located in the `src/tests` directory. The directory structure within `src/tests` matches the structure of the source code, making it easy to locate tests for specific components.

```
src/tests/
├── components/
│   └── ui/
│       ├── modules/
│       └── automation/
├── hooks/
│   ├── modules/
│   ├── resources/
│   └── automation/
├── managers/
│   ├── module/
│   ├── resource/
│   ├── game/
│   └── automation/
├── utils/
│   ├── modules/
│   ├── resources/
│   └── events/
└── initialization/
```

#### Testing Strategies

1. **Unit Testing**

   - Tests for individual functions and classes
   - Mocks all external dependencies
   - Focuses on specific behaviors and edge cases

2. **Component Testing**

   - Tests for React components
   - Uses React Testing Library for rendering and interaction
   - Verifies component behavior and rendering

3. **Integration Testing**

   - Tests for interactions between multiple components
   - Verifies that components work together correctly
   - Uses minimal mocking to test real interactions

4. **Mock Implementations**
   - Custom mock implementations for complex dependencies
   - Stored in `src/tests/mocks` directory
   - Provides consistent behavior across tests

#### Event System Testing

The event system testing focuses on verifying the correct behavior of the event dispatcher, RxJS integration, game loop, event communication, and event filtering components.

1. **Event Dispatcher Testing**

   - Tests the React Context-based event dispatcher
   - Verifies event subscription, emission, and history tracking
   - Tests hooks for accessing event data

2. **RxJS Integration Testing**

   - Tests the Observable wrappers for events
   - Verifies Subject-based event streams
   - Tests operators for event filtering and transformation
   - Verifies event filtering by type, module ID, and data properties
   - Tests event data extraction and mapping
   - Verifies custom filtered event streams
   - Tests event emission through both moduleEventBus and RxJS Subject
   - Verifies event type subjects and cleanup
   - Tests transformed event streams and combined event streams
   - Ensures proper subscription management and cleanup

3. **Game Loop Testing**

   - Tests the centralized timer manager initialization with default and custom configurations
   - Verifies delta time calculation and elapsed time tracking
   - Tests priority-based update system with different priority levels
   - Verifies frame rate optimization and performance monitoring
   - Tests starting and stopping the game loop
   - Verifies registering and unregistering update callbacks
   - Tests game loop execution with proper delta time and elapsed time
   - Verifies error handling in update callbacks
   - Tests update intervals for fixed timestep updates
   - Verifies delta time capping to prevent spiral of death
   - Tests priority-based update execution order
   - Verifies priority throttling for low-priority updates
   - Tests stats reporting and performance metrics
   - Uses mocked timers and performance.now for deterministic testing

4. **Event Communication Testing**

   - Tests system-to-system messaging
   - Verifies message priorities and routing
   - Tests acknowledgment handling for both successful and error cases
   - Verifies that message priorities are respected
   - Test broadcast messages to ensure they reach all intended recipients
   - Test system-to-system messaging with different source and target systems
   - Test error handling in message handlers and acknowledgments
   - Test timeout handling for acknowledgments
   - Test cleanup and resource management
   - Test observable streams for messages, acknowledgments, and payloads
   - Verify proper handling of async message handlers

5. **Event Filtering Testing**
   - Tests type-based filtering
   - Verifies priority-based event handling
   - Tests conditional event processing
   - Verifies event batching

#### Automation System Testing

The automation system testing focuses on verifying the correct behavior of the global automation manager, automation hooks, and automation system initialization.

1. **Global Automation Manager Testing**

   - Tests routine registration and management
   - Verifies condition evaluation
   - Tests action execution
   - Verifies routine scheduling

2. **Automation Hook Testing**

   - Tests the React hook for accessing the automation system
   - Verifies routine creation, enabling, and disabling
   - Tests routine filtering by type, tag, and system

3. **Automation System Initialization Testing**
   - Tests the initialization of the automation system
   - Verifies registration of default routines
   - Tests integration with the event system

#### Best Practices

1. **Test Naming**

   - Use descriptive names that indicate what is being tested
   - Follow the pattern `describe('Component', () => { it('should do something', () => {}) })`
   - Group related tests together

2. **Test Setup**

   - Use `beforeEach` and `afterEach` for setup and teardown
   - Reset mocks between tests
   - Avoid shared state between tests

3. **Assertions**

   - Use specific assertions that clearly indicate what is being tested
   - Prefer `expect(actual).toBe(expected)` over `expect(actual).toEqual(expected)` when possible
   - Include meaningful error messages

4. **Mocking**

   - Mock only what is necessary
   - Use `vi.mock()` for module-level mocking
   - Use `vi.fn()` for function-level mocking
   - Restore mocks after tests

5. **Testing Hooks**
   - Use `renderHook` from React Testing Library
   - Test hook behavior with `act`
   - Verify state changes and side effects

## Testing Best Practices

### Event System Testing

The Event System has been designed with testability in mind. Here are the best practices for testing the various components:

1. **Mocking Dependencies**

   - Always mock the `moduleEventBus` when testing components that depend on it
   - Use Vitest's mocking capabilities to create mock implementations of event handlers
   - For RxJS testing, use `Subject` instances to control the flow of events in tests

2. **Testing Event Filtering**

   - Test each filtering function in isolation
   - Use simple, predictable event streams for testing
   - Verify both positive cases (events that should pass the filter) and negative cases (events that should be filtered out)
   - For time-based operations, use Vitest's timer mocking capabilities
   - Create custom interfaces for test events to avoid type errors
   - Split complex tests into basic and comprehensive test files for better maintainability
   - Use proper typing for mock functions to avoid type errors
   - Test priority-based processing by verifying the order of processed events
   - Test batch processing with different batch sizes and manual flushing
   - Test conditional processing with various conditions
   - Verify priority queue behavior with different priority levels

3. **Testing Event Communication**

   - Mock the event bus to capture emitted events and simulate received events
   - Test acknowledgment handling for both successful and error cases
   - Verify that message priorities are respected
   - Test broadcast messages to ensure they reach all intended recipients
   - Test system-to-system messaging with different source and target systems
   - Test error handling in message handlers and acknowledgments
   - Test timeout handling for acknowledgments
   - Test cleanup and resource management
   - Test observable streams for messages, acknowledgments, and payloads
   - Verify proper handling of async message handlers

4. **Testing the Game Loop**

   - Use fake timers to control the passage of time
   - Test registration and unregistration of update callbacks
   - Verify that updates are called with the correct delta time
   - Test error handling to ensure the game loop continues despite errors in callbacks

5. **Testing Event Dispatching**

   - Use React Testing Library to test React context-based event dispatching
   - Verify that events are properly emitted and received by components
   - Test history tracking to ensure events are properly recorded
   - Test subscription management to ensure components can subscribe and unsubscribe from events

6. **Integration Testing**
   - Test the integration between different parts of the event system
   - Verify that events flow correctly from one system to another
   - Test error handling at the integration level
   - Use mock implementations of game systems to test the integration with the event system

By following these best practices, we ensure that the Event System remains robust, reliable, and maintainable as the codebase evolves.

### Effect System Type Safety Best Practices

1. **Interface Extension**

   - When components need additional properties on an interface, extend the interface rather than modifying the base interface
   - Add missing properties directly to the interface if they are fundamental to the type
   - Use optional properties when extending interfaces to maintain backward compatibility
   - Document the purpose of each property with JSDoc comments

2. **Effect Type Hierarchy**

   - Maintain a clear hierarchy of effect types (Effect -> BaseEffect -> SpecificEffects)
   - Use specific effect types (DamageEffect, AreaEffect, StatusEffect) instead of generic types
   - Ensure all required properties are included when creating effect objects
   - Use type assertions with caution and only when necessary

3. **Utility Functions**

   - Create utility functions for common effect creation patterns
   - Provide default values for optional properties in utility functions
   - Use proper type annotations for parameters and return types
   - Handle edge cases like undefined values with default values

4. **Type Conversion**

   - Create helper functions for converting between effect types
   - Use type guards to check if an object has the expected properties
   - Implement proper validation in conversion functions
   - Document conversion patterns for future reference

5. **Component Usage**
   - Use the most specific effect type possible in components
   - Implement proper null checks for optional properties
   - Use type guards before accessing properties
   - Document expected effect structure in component props

### Patterns for Fixing Type Errors

1. **Missing Properties Pattern**

   - **Problem**: Components accessing properties that don't exist on the interface
   - **Solution**: Add the missing properties to the interface or use a more specific interface
   - **Example**: Added 'name' and 'description' to WeaponEffect interface
   - **Best Practice**: Document the purpose of each property with JSDoc comments

2. **Interface Extension Pattern**

   - **Problem**: Need to add properties to an interface without breaking existing code
   - **Solution**: Create a new interface that extends the base interface
   - **Example**: Using BaseEffect which extends Effect with additional properties
   - **Best Practice**: Use optional properties when extending interfaces

3. **Utility Function Pattern**

   - **Problem**: Inconsistent object creation leading to type errors
   - **Solution**: Create utility functions with proper type annotations
   - **Example**: Updated createEffect function to ensure duration is not undefined
   - **Best Practice**: Provide default values for optional properties

4. **Type Assertion Pattern**

   - **Problem**: Need to use properties not in the type definition
   - **Solution**: Use type assertions with proper validation
   - **Example**: Using 'as any' with proper null checks
   - **Best Practice**: Always validate before using type assertions

5. **Default Value Pattern**
   - **Problem**: Optional properties causing undefined errors
   - **Solution**: Provide default values for optional properties
   - **Example**: Using `options.duration || 0` for duration
   - **Best Practice**: Use nullish coalescing operator (??) for default values

### Combat System Type Safety Best Practices

1. **Interface Consistency**

   - When multiple interfaces with the same name exist in different files, create conversion functions
   - Document the differences between interfaces and their intended use cases
   - Use type assertions with caution and proper validation
   - Provide default values for missing properties during conversion

2. **Type Conversion**

   - Create explicit conversion functions for complex types
   - Handle all edge cases and provide default values
   - Use type guards to validate objects before conversion
   - Document conversion patterns for future reference

3. **Property Access**

   - Access properties through the correct structure (e.g., stats.health instead of health)
   - Use optional chaining (?.) for potentially undefined properties
   - Provide fallback values with nullish coalescing (??) or logical OR (||)
   - Add type annotations to clarify expected property types

4. **Interface Extension**

   - Use intersection types (Type1 & Type2) to add properties to existing interfaces
   - Create wrapper interfaces for specific use cases
   - Document the purpose of extended interfaces
   - Keep extensions minimal and focused

5. **Type Assertions**
   - Use type assertions only when necessary and with proper validation
   - Prefer type guards over type assertions
   - Convert to 'unknown' first before asserting to a specific type
   - Document the reason for type assertions

### Patterns for Fixing Interface Inconsistencies

1. **Type Conversion Pattern**

   - **Problem**: Different interfaces with the same name in different files
   - **Solution**: Create conversion functions between interface versions
   - **Example**: Created convertToCombatTypesUnit to convert between CombatUnit interfaces
   - **Best Practice**: Handle all edge cases and provide default values

2. **Property Access Pattern**

   - **Problem**: Accessing properties that exist in one interface but not another
   - **Solution**: Update property access to use the correct structure
   - **Example**: Changed unit.health to unit.stats.health
   - **Best Practice**: Use optional chaining and provide fallback values

3. **Interface Extension Pattern**

   - **Problem**: Need to add properties to an interface for specific use cases
   - **Solution**: Use intersection types to add properties
   - **Example**: CombatUnit & { target?: string }
   - **Best Practice**: Keep extensions minimal and focused

4. **Type Guard Pattern**

   - **Problem**: Need to check if an object conforms to a specific interface
   - **Solution**: Create type guard functions
   - **Example**: isManagerCombatUnit and isCombatTypesUnit
   - **Best Practice**: Check for specific properties that distinguish the types

5. **Default Value Pattern**
   - **Problem**: Properties might be undefined during conversion
   - **Solution**: Provide default values for all properties
   - **Example**: health: unit.health || 0
   - **Best Practice**: Use nullish coalescing for more precise fallbacks

### Resource System Type Safety Best Practices

1. **Map to Record Conversion**

   - When serializing Map objects to JSON, convert them to Record objects
   - Use explicit type definitions for both Map and Record versions
   - Create helper functions for conversion in both directions
   - Document the conversion process with comments

2. **Serialization Interfaces**

   - Create dedicated interfaces for serialized data structures
   - Keep serialized interfaces simple and JSON-compatible
   - Include timestamp or version information in serialized data
   - Implement validation for deserialized data

3. **Type Guards for Deserialization**

   - Create type guard functions to validate deserialized data
   - Check for required properties before using deserialized objects
   - Provide fallback values for missing or invalid properties
   - Log validation failures for debugging

4. **Resource Totals Calculation**

   - Use strongly typed calculation functions
   - Initialize totals objects with default values for all resource types
   - Handle missing resources gracefully
   - Document calculation methods

5. **Threshold Management**
   - Define explicit interfaces for threshold configuration
   - Use enums for threshold types and severity levels
   - Implement type-safe threshold checking functions
   - Ensure threshold interfaces are consistent with resource interfaces

### Patterns for Resource Serialization

1. **Map to Record Pattern**

   - **Problem**: Maps cannot be directly serialized to JSON
   - **Solution**: Convert Maps to Records for serialization and back for deserialization
   - **Example**:

   ```typescript
   // Serialization
   function serializeResourceMap(
     map: Map<ResourceType, Resource>
   ): Record<ResourceType, SerializedResource> {
     const record: Record<ResourceType, SerializedResource> = {} as Record<
       ResourceType,
       SerializedResource
     >;
     Array.from(map.entries()).forEach(([key, value]) => {
       record[key] = {
         amount: value.amount,
         capacity: value.capacity,
         rate: value.rate,
       };
     });
     return record;
   }

   // Deserialization
   function deserializeResourceMap(
     record: Record<ResourceType, SerializedResource>
   ): Map<ResourceType, Resource> {
     const map = new Map<ResourceType, Resource>();
     Object.entries(record).forEach(([key, value]) => {
       map.set(key as ResourceType, {
         amount: value.amount,
         capacity: value.capacity,
         rate: value.rate,
       });
     });
     return map;
   }
   ```

   - **Best Practice**: Use Array.from() to convert Map entries to avoid MapIterator errors

2. **Type Guard Pattern**

   - **Problem**: Deserialized data may not match expected interfaces
   - **Solution**: Create type guard functions to validate deserialized data
   - **Example**:

   ```typescript
   function isSerializedResource(obj: any): obj is SerializedResource {
     return (
       obj !== null &&
       typeof obj === 'object' &&
       'amount' in obj &&
       'capacity' in obj &&
       'rate' in obj
     );
   }

   function isSerializedResourceState(obj: any): obj is SerializedResourceState {
     return (
       obj !== null &&
       typeof obj === 'object' &&
       'resources' in obj &&
       'thresholds' in obj &&
       'timestamp' in obj
     );
   }
   ```

   - **Best Practice**: Check for required properties and proper types

3. **Default Value Pattern**

   - **Problem**: Deserialized data may have missing or invalid values
   - **Solution**: Provide default values for all properties
   - **Example**:

   ```typescript
   function getResourceWithDefaults(resource: Partial<SerializedResource>): Resource {
     return {
       amount: resource.amount ?? 0,
       capacity: resource.capacity ?? 100,
       rate: resource.rate ?? 0,
     };
   }
   ```

   - **Best Practice**: Use nullish coalescing operator (??) for default values

4. **Validation Pattern**

   - **Problem**: Deserialized data may be invalid
   - **Solution**: Implement validation functions for deserialized data
   - **Example**:

   ```typescript
   function validateResourceState(state: SerializedResourceState): boolean {
     if (!state.resources || typeof state.resources !== 'object') return false;
     if (!state.thresholds || typeof state.thresholds !== 'object') return false;
     if (typeof state.timestamp !== 'number') return false;

     // Check each resource
     for (const key in state.resources) {
       const resource = state.resources[key];
       if (!isSerializedResource(resource)) return false;
     }

     return true;
   }
   ```

   - **Best Practice**: Return boolean indicating validity and log specific validation failures

### Type Conversion Best Practices

Based on our experience fixing type conversion errors in the codebase, we've established the following best practices for handling type conversions:

1. **Type Assertions**

   - Use type assertions sparingly and only when necessary
   - Always validate the object before using type assertions
   - Use the `as` keyword instead of angle brackets (`<>`) for better readability
   - Convert to `unknown` first before asserting to a specific type for safer conversions
   - Document the reason for type assertions with comments

2. **Safe Property Access**

   - Use optional chaining (`?.`) for accessing properties that might be undefined
   - Use nullish coalescing (`??`) for providing default values
   - Extract properties to local variables with safe defaults for complex objects
   - Check for undefined values before accessing nested properties
   - Use type guards to narrow types before accessing properties

3. **Default Values**

   - Provide default values for all properties in conversion functions
   - Use sensible defaults that won't cause runtime errors
   - Document the default values with comments
   - Use nullish coalescing for optional properties
   - Consider the domain context when choosing default values

4. **Type Guards**

   - Implement type guards for runtime type checking
   - Use type predicates (`is` keyword) for better type narrowing
   - Check for required properties to determine the type
   - Keep type guards simple and focused on one type
   - Use type guards before accessing type-specific properties

5. **Conversion Functions**

   - Create explicit conversion functions for complex types
   - Document the purpose and behavior of conversion functions
   - Handle all edge cases and provide default values
   - Return well-defined types with all required properties
   - Break down complex conversions into smaller, more manageable steps

6. **Interface Extensions**

   - Use interface extensions for adding properties to existing interfaces
   - Document the purpose of extended interfaces
   - Keep extensions minimal and focused
   - Use intersection types (`Type1 & Type2`) for combining interfaces
   - Consider creating wrapper interfaces for specific use cases

7. **Documentation**
   - Document type relationships and conversion patterns
   - Add JSDoc comments to conversion functions
   - Explain the purpose of type assertions and guards
   - Document default values and edge cases
   - Provide examples of usage for complex conversions

### Type Conversion Patterns

Based on our fixes to the typeConversions.ts file, we've identified several common patterns for handling type conversions:

1. **Type Assertion Pattern**

   ```typescript
   // Use type assertion with validation
   const category = convertSystemTypeToWeaponCategory(weapon.type as WeaponSystemType);

   // Extract properties with type assertion and safe defaults
   const formationType = (unit as any).formation?.type ?? 'balanced';
   const formationSpacing = (unit as any).formation?.spacing ?? 100;
   const formationFacing = (unit as any).formation?.facing ?? 0;
   ```

2. **Safe Property Access Pattern**

   ```typescript
   // Use optional chaining and nullish coalescing
   const weaponStatus = (w as any).state?.status || 'ready';
   const weaponLastFired = (w as any).state?.lastFired || 0;

   // Extract properties to local variables
   const weaponId = w.id;
   const weaponType = w.type;
   const weaponRange = w.range || 0;
   const weaponDamage = w.damage;
   const weaponCooldown = w.cooldown;
   ```

3. **Default Value Pattern**

   ```typescript
   // Provide default values for all properties
   return {
     id: unit.id,
     type: unit.type,
     position: unit.position,
     rotation: 0, // Default value if not present
     velocity: { x: 0, y: 0 }, // Default value if not present
     status: {
       main: convertStatusToMain(unit.status),
       secondary: undefined,
       effects: [],
     },
     // ...
   };
   ```

4. **Type Guard Pattern**

   ```typescript
   // Type guard for FactionCombatUnit
   export function isFactionCombatUnit(
     unit: CombatUnit | FactionCombatUnit
   ): unit is FactionCombatUnit {
     return 'class' in unit && 'tactics' in unit && 'weaponMounts' in unit;
   }

   // Type guard for basic CombatUnit
   export function isBaseCombatUnit(unit: CombatUnit | FactionCombatUnit): unit is CombatUnit {
     return !isFactionCombatUnit(unit);
   }
   ```

5. **Conversion Function Pattern**

   ```typescript
   /**
    * Converts a CombatUnit from combatManager.ts to a CombatUnit from CombatTypes.ts
    */
   export function convertToCombatTypesUnit(
     unit: any
   ): import('../types/combat/CombatTypes').CombatUnit {
     // Create a CombatUnit that matches the interface in CombatTypes.ts
     return {
       id: unit.id,
       type: unit.type,
       // ... other properties with default values
     };
   }
   ```

6. **Property Extraction Pattern**

   ```typescript
   // Extract properties to local variables with safe defaults
   const formationType = (unit as any).formation?.type ?? 'balanced';
   const formationSpacing = (unit as any).formation?.spacing ?? 100;
   const formationFacing = (unit as any).formation?.facing ?? 0;

   // Use extracted properties
   formation: {
     type: formationType,
     spacing: formationSpacing,
     facing: formationFacing,
     position: 0
   }
   ```

7. **Complete Object Pattern**
   ```typescript
   // Create a complete object with all required properties
   stats: {
     health: unit.stats?.health || 100,
     maxHealth: unit.stats?.maxHealth || 100,
     shield: unit.stats?.shield || 50,
     maxShield: unit.stats?.maxShield || 50,
     armor: unit.stats?.armor || 0,
     speed: unit.stats?.speed || 5,
     turnRate: unit.stats?.turnRate || 1,
     accuracy: 0.8,
     evasion: 0.2,
     criticalChance: 0.1,
     criticalDamage: 1.5,
     armorPenetration: 0,
     shieldPenetration: 0,
     experience: 0,
     level: 1
   }
   ```

These patterns should be applied consistently across the codebase to ensure type safety and prevent runtime errors.

## Additional Type Safety Best Practices (Part 2)

### Message Payload Typing

1. **Define Explicit Interfaces for Message Payloads**: Create specific interfaces for message payloads to ensure type safety when handling events and messages.

   ```typescript
   // Instead of:
   function handleMessage(message: any) {
     console.log(message.payload.resourceType);
   }

   // Do this:
   interface ResourceUpdatePayload {
     resourceType: string;
     [key: string]: unknown;
   }

   function handleMessage(message: { payload: ResourceUpdatePayload }) {
     console.log(message.payload.resourceType);
   }
   ```

2. **Use Index Signatures for Flexible Objects**: When dealing with objects that may have additional properties, use index signatures with `unknown` type.

   ```typescript
   interface ConfigObject {
     id: string;
     name: string;
     [key: string]: unknown;
   }
   ```

3. **Type Window Properties Safely**: When accessing properties on the global window object, use type assertions with proper interfaces.

   ```typescript
   // Instead of:
   const manager = (window as any).resourceManager;

   // Do this:
   const manager = (window as unknown as { resourceManager?: ResourceManager }).resourceManager;
   ```

### Null Safety

1. **Use Optional Chaining for Nested Properties**: When accessing properties that might be undefined, use optional chaining to prevent runtime errors.

   ```typescript
   // Instead of:
   const category = data.node.category; // May throw if node is undefined

   // Do this:
   const category = data.node?.category; // Safely returns undefined if node is undefined
   ```

2. **Add Null Checks Before Using Dependencies**: When a function depends on multiple objects, check that all are available before proceeding.

   ```typescript
   if (resourceManager && thresholdManager && flowManager) {
     // Safe to use all three managers
     const integration = new Integration(resourceManager, thresholdManager, flowManager);
     integration.initialize();
   } else {
     console.warn('Some required managers are missing');
   }
   ```

3. **Provide Fallbacks with Nullish Coalescing**: Use the nullish coalescing operator to provide default values.
   ```typescript
   const count = data.count ?? 0; // Use 0 if data.count is null or undefined
   ```

### Console Usage

1. **Use Appropriate Console Methods**: Use the right console method for the message type.

   - `console.error()`: For errors that require attention
   - `console.warn()`: For warnings and important system messages
   - `console.info()`: For informational messages (use sparingly)
   - `console.debug()`: For debug-only messages (should be removed in production)

2. **Add Comments for Debug-Only Console Statements**: If a console statement is only for debugging, add a comment to indicate it should be removed in production.

   ```typescript
   // DEBUG: Remove in production
   console.debug('Processing item:', item);
   ```

3. **Consider a Logging Service**: For complex applications, implement a logging service that can be configured for different environments.

   ```typescript
   class Logger {
     static error(message: string, ...args: unknown[]): void {
       console.error(`[ERROR] ${message}`, ...args);
     }

     static warn(message: string, ...args: unknown[]): void {
       console.warn(`[WARN] ${message}`, ...args);
     }

     // Additional methods and configuration options
   }

   // Usage
   Logger.warn('Resource update received', { type: 'minerals', amount: 100 });
   ```

### Unused Variables and Imports

1. **Prefix Unused Parameters with Underscore**: When a parameter is required by a function signature but not used in the implementation, prefix it with an underscore.

   ```typescript
   // Instead of:
   function update(deltaTime: number) {
     // deltaTime is never used
   }

   // Do this:
   function update(_deltaTime: number) {
     // Clearly indicates deltaTime is intentionally unused
   }
   ```

2. **Remove Unused Imports**: Regularly clean up unused imports to reduce bundle size and improve code clarity.

3. **Document Required but Seemingly Unused Imports**: If an import appears unused but is actually required (e.g., for side effects), add a comment explaining why it's needed.
   ```typescript
   // Required for side effects - registers components with the framework
   import './registerComponents';
   ```

These best practices will help maintain type safety, prevent runtime errors, and improve code quality throughout the codebase.

# Linting Progress

## Overview

The codebase has been configured with ESLint v9 and TypeScript-ESLint to enforce code quality standards. The initial linting scan identified 671 issues (222 errors and 449 warnings) that need to be addressed.

## Progress Summary

- Fixed TypeScript explicit any errors in:

  - src/utils/modules/moduleValidation.ts
  - src/initialization/gameSystemsIntegration.ts
  - src/managers/game/ResourceManager.ts

- Fixed lexical declaration errors in case blocks in:

  - src/hooks/factions/useFactionBehavior.ts

- Fixed promise executor errors in:

  - src/managers/game/assetManager.ts

- Fixed console statement warnings in:
  - src/initialization/gameSystemsIntegration.ts
  - src/managers/game/ResourceManager.ts

## Documentation

- Created LintingFixes.md to document common linting issues and their solutions
- Updated CodeBase_Architecture.md with type safety best practices
- Updated CodeBase_Mapping.md to include LintingFixes.md in the Development Tools section

## Remaining Issues

- TypeScript explicit any errors in ModuleStatusManager.ts and other files
- Unused variables and imports across the codebase
- Console statement warnings in various files
- React hook dependency warnings
- Preference for const over let for variables never reassigned

## Next Steps

1. Continue fixing TypeScript explicit any errors in critical files
2. Address lexical declaration errors in case blocks
3. Clean up unused variables and imports
4. Replace console statements with appropriate alternatives
5. Fix React hook dependency warnings

# Event Handling Type Safety

## Event Handler Type Safety

When working with event handlers in the codebase, follow these best practices to ensure type safety:

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

These practices ensure that event handling throughout the codebase is type-safe, preventing runtime errors and improving code maintainability.

## Case Block Lexical Declaration Best Practices

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
   ```

## DOM Element Typing Best Practices

When working with DOM elements in TypeScript, follow these best practices to ensure type safety:

1. **Use Specific Element Types Instead of Any**: Instead of using `any` for DOM elements, use the appropriate HTML element types:

   ```typescript
   // Incorrect
   function handleClick(element: any) {
     element.style.color = 'red';
   }

   // Correct
   function handleClick(element: HTMLElement) {
     element.style.color = 'red';
   }
   ```

2. **Use More Specific Element Types When Possible**: Use the most specific element type that applies:

   ```typescript
   // General element
   const element: HTMLElement = document.getElementById('container')!;

   // Button element with button-specific properties
   const button: HTMLButtonElement = document.getElementById('submit') as HTMLButtonElement;
   button.disabled = true;

   // Input element with input-specific properties
   const input: HTMLInputElement = document.getElementById('name') as HTMLInputElement;
   input.value = 'John';
   ```

3. **Use Event Types for Event Handlers**: Use the appropriate event types for event handlers:

   ```typescript
   // Incorrect
   const handleClick = (e: any) => {
     e.preventDefault();
   };

   // Correct
   const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
     e.preventDefault();
   };

   // For native DOM events
   const handleNativeClick = (e: MouseEvent) => {
     e.preventDefault();
   };
   ```

4. **Type Event Target Correctly**: When accessing properties on event targets, use type assertions with the appropriate element type:

   ```typescript
   // Incorrect
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const value = e.target.value;
     const checked = e.target.checked; // Error: Property 'checked' does not exist on type 'EventTarget'
   };

   // Correct
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const value = e.target.value;
     const checked = e.target.checked;
   };
   ```

5. **Use Element Collections with Proper Types**: When working with element collections, use the appropriate collection types:

   ```typescript
   // HTMLCollection
   const divs: HTMLCollectionOf<HTMLDivElement> = document.getElementsByTagName('div');

   // NodeList
   const paragraphs: NodeListOf<HTMLParagraphElement> = document.querySelectorAll('p');
   ```

6. **Type Custom Elements Correctly**: For custom elements, create interfaces that extend HTMLElement:

   ```typescript
   interface CustomSliderElement extends HTMLElement {
     value: number;
     min: number;
     max: number;
     step: number;
   }

   const slider = document.getElementById('custom-slider') as CustomSliderElement;
   slider.value = 50;
   ```

7. **Use Record for Element Dictionaries**: When storing elements in a dictionary, use Record with the appropriate element type:

   ```typescript
   // Incorrect
   const elements: { [key: string]: any } = {};

   // Correct
   const elements: Record<string, HTMLElement> = {};

   // Even better - with specific element types
   const formElements: Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> =
     {};
   ```

8. **Handle Null Values Safely**: Always handle potential null values when querying DOM elements:

   ```typescript
   // Incorrect
   const element = document.getElementById('container');
   element.style.color = 'red'; // Might cause runtime error if element is null

   // Correct
   const element = document.getElementById('container');
   if (element) {
     element.style.color = 'red';
   }

   // Alternative with non-null assertion (use only when you're certain the element exists)
   const element = document.getElementById('container')!;
   element.style.color = 'red';
   ```

These best practices will help ensure type safety when working with DOM elements in TypeScript, preventing runtime errors and improving code quality.

### TypeScript Linting Issue Resolution

#### Approach to Fixing Explicit `any` Types

When replacing `any` types with more specific types, we follow these steps:

1. **Identify the context**: Examine how the variable is used to understand its structure and purpose.
2. **Create specific interfaces/types**: Define custom interfaces or types that accurately represent the data structure.
3. **Apply the new type**: Replace the `any` type with the newly created specific type.
4. **Verify with ESLint**: Run ESLint to confirm the issue is resolved.

#### Examples of Fixed `any` Types

1. **VPR State Management** (src/hooks/ui/useVPR.ts)

   - Created `VPRState` interface to replace `any` in the `updateVPR` function:

   ```typescript
   interface VPRState {
     active: boolean;
     animationState: string;
     intensity: number;
     duration: number;
     customClass?: string;
   }
   ```

2. **Module Update Data** (src/hooks/ui/useVPRSystem.ts)

   - Created `ModuleUpdateData` type to replace `any` in the `handleModuleUpdate` function:

   ```typescript
   type ModuleUpdateData = Partial<{
     type: string;
     tier: number;
     status: 'active' | 'inactive' | 'error' | 'upgrading';
     progress: number;
   }>;
   ```

3. **Automation Events** (src/hooks/automation/useGlobalAutomation.ts)
   - Created `AutomationEvent` interface to replace `any` in the `handleAutomationEvent` function:
   ```typescript
   interface AutomationEvent {
     type: 'start' | 'stop' | 'pause' | 'resume' | 'complete' | 'error';
     routineId: string;
     timestamp: number;
     data?: unknown;
   }
   ```

#### Best Practices for Type Safety

1. **Use unknown instead of any**: When the exact type is not known, use `unknown` instead of `any` and add proper type guards.
2. **Create partial types when appropriate**: Use `Partial<T>` when only some properties might be present.
3. **Use union types for specific values**: Define allowed values using union types (e.g., `'active' | 'inactive'`).
4. **Document type relationships**: Add comments explaining the purpose and usage of custom types.
5. **Use consistent naming conventions**: Name interfaces and types clearly to indicate their purpose.
6. **Verify fixes with ESLint**: Always run ESLint after making changes to ensure the issue is resolved.
