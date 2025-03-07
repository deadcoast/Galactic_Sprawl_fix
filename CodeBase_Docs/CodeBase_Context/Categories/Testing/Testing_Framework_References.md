---
TESTING FRAMEWORK REFERENCES
---

# Testing Framework

### Setup and Utilities

- **src/tests/setup.ts**: Central test setup including WebSocket server management, localStorage mocks, and global test hooks
  - `disableAllWebSocketServers()`: Disables WebSocket servers globally for tests
  - `enableAllWebSocketServers()`: Re-enables WebSocket servers after tests
  - `getTestWebSocketPort(serviceName)`: Gets a unique port for a test WebSocket server
  - `registerTestWebSocketServer(port, closeFunction)`: Registers a WebSocket server for cleanup
  - `createTestWebSocketServer(port?)`: Creates a test WebSocket server with proper cleanup

### Test Factories

- **src/tests/factories/createTestModuleEvents.ts**: Factory for creating isolated ModuleEvents instances for tests
- **src/tests/factories/createTestResourceManager.ts**: Factory for creating isolated ResourceManager instances for tests
- **src/tests/factories/createTestGameProvider.tsx**: Factory for creating isolated GameContext providers for component tests
  - Uses global WebSocket management from setup.ts
  - Provides helper methods for manipulating game state in tests

## Configuration Files

- Vitest Configuration: `vitest.config.ts`
  Purpose: Configures Vitest testing framework
  Dependencies: Vite, React, JSdom

- Jest Configuration: `jest.config.js`
  Purpose: Configures Jest testing framework
  Dependencies: ts-jest

- Jest Setup: `jest-setup.js`
  Purpose: Provides compatibility layer between Vitest and Jest
  Dependencies: @jest/globals
  Features:
  - Maps Vitest's `vi` to Jest's `jest` global
  - Adds compatibility layer for Vitest functions to run in Jest environment
  - Uses `globalThis` to define global functions and avoid ESLint errors

## Unit Tests

### Event System Tests

- Event Dispatcher Tests: `src/tests/utils/events/EventDispatcher.test.tsx`
  Purpose: Test the React Context-based event dispatcher
  Dependencies: React Testing Library, Vitest
- RxJS Integration Tests: `src/tests/utils/events/rxjsIntegration.test.ts`
  Purpose: Test the RxJS integration with the event system
  Dependencies: RxJS, Vitest
- Game Loop Tests: `src/tests/managers/game/GameLoopManager.test.ts`
  Purpose: Test the centralized timer manager
  Dependencies: Vitest
- Event Communication Tests: `src/tests/utils/events/EventCommunication.test.ts`
  Purpose: Test the system-to-system communication
  Dependencies: Vitest, moduleEventBus mock
  Features:
  - System-to-system messaging tests
  - Message priority tests
  - Acknowledgment system tests
  - Error handling tests
  - Observable stream tests
  - Cleanup and resource management tests
- Event Filtering Tests:
  - Basic Tests: `src/tests/utils/events/EventFilteringBasic.test.ts`

### Resource Management Tests

- Resource Manager Tests: `src/tests/managers/resource/ResourceManager.test.ts`
  Purpose: Test the central resource management system
  Dependencies: Vitest, ResourceManager mock
- Resource Threshold Tests: `src/tests/managers/resource/ResourceThresholdManager.test.ts`
  Purpose: Test resource threshold management and alerts
  Dependencies: Vitest, ResourceThresholdManager mock
- Resource Performance Tests: `src/tests/managers/resource/ResourcePerformanceMonitor.test.ts`
  Purpose: Test resource performance monitoring
  Dependencies: Vitest, ResourcePerformanceMonitor mock

### Module System Tests

- Module Manager Tests: `src/tests/managers/module/ModuleManager.test.ts`
  Purpose: Test module lifecycle and management
  Dependencies: Vitest, ModuleManager mock
- Module Attachment Tests: `src/tests/managers/module/ModuleAttachmentManager.test.ts`
  Purpose: Test module attachment system
  Dependencies: Vitest, ModuleAttachmentManager mock
- Module Status Tests: `src/tests/managers/module/ModuleStatusManager.test.ts`
  Purpose: Test module status tracking
  Dependencies: Vitest, ModuleStatusManager mock
- Module Upgrade Tests: `src/tests/managers/module/ModuleUpgradeManager.test.ts`
  Purpose: Test module upgrade system
  Dependencies: Vitest, ModuleUpgradeManager mock

### Combat System Tests

- Combat Manager Tests: `src/tests/managers/combat/combatManager.test.ts`
  Purpose: Test combat system management
  Dependencies: Vitest, CombatManager mock
- War Ship Manager Tests: `src/tests/managers/combat/WarShipManagerImpl.test.ts`
  Purpose: Test war ship management
  Dependencies: Vitest, WarShipManagerImpl mock
- Fleet AI Tests: `src/tests/hooks/factions/useFleetAI.test.ts`
  Purpose: Test fleet AI behavior
  Dependencies: Vitest, useFleetAI mock
- Faction Behavior Tests: `src/tests/hooks/factions/useFactionBehavior.test.ts`
  Purpose: Test faction behavior patterns
  Dependencies: Vitest, useFactionBehavior mock

### Mining System Tests

- Mining Ship Manager Tests: `src/tests/managers/mining/MiningShipManager.test.ts`
  Purpose: Test mining ship management
  Dependencies: Vitest, MiningShipManager mock
- Mining Controls Tests: `src/tests/components/buildings/modules/MiningHub/MiningControls.test.tsx`
  Purpose: Test mining controls UI
  Dependencies: React Testing Library, Vitest

### Exploration System Tests

- Recon Ship Manager Tests: `src/tests/managers/exploration/ReconShipManagerImpl.test.ts`
  Purpose: Test recon ship management
  Dependencies: Vitest, ReconShipManagerImpl mock
- Exploration Hub Tests: `src/tests/components/buildings/modules/ExplorationHub/ExplorationHub.test.tsx`
  Purpose: Test exploration hub UI
  Dependencies: React Testing Library, Vitest

## Component Tests

### UI Component Tests

- Game Layout Tests: `src/tests/components/ui/GameLayout.test.tsx`
  Purpose: Test main game layout
  Dependencies: React Testing Library, Vitest
- Game HUD Tests: `src/tests/components/ui/GameHUD.test.tsx`
  Purpose: Test game HUD
  Dependencies: React Testing Library, Vitest
- VPR View Tests: `src/tests/components/ui/VPRStarSystemView.test.tsx`
  Purpose: Test VPR view
  Dependencies: React Testing Library, Vitest
- Tech Tree Tests: `src/tests/components/ui/TechTree.test.tsx`
  Purpose: Test tech tree UI
  Dependencies: React Testing Library, Vitest

### Module UI Tests

- Module HUD Tests: `src/tests/components/ui/modules/ModuleHUD.test.tsx`
  Purpose: Test module HUD
  Dependencies: React Testing Library, Vitest
- Sub-Module HUD Tests: `src/tests/components/ui/modules/SubModuleHUD.test.tsx`
  Purpose: Test sub-module HUD
  Dependencies: React Testing Library, Vitest
- Module Status Display Tests: `src/tests/components/ui/modules/ModuleStatusDisplay.test.tsx`
  Purpose: Test module status display
  Dependencies: React Testing Library, Vitest
- Module Upgrade Display Tests: `src/tests/components/ui/modules/ModuleUpgradeDisplay.test.tsx`
  Purpose: Test module upgrade display
  Dependencies: React Testing Library, Vitest

## Integration Tests

### System Integration Tests

- Event System Integration Tests: `src/tests/integration/events/EventSystemIntegration.test.ts`
  Purpose: Test event system integration
  Dependencies: Vitest, EventSystem mocks
- Resource System Integration Tests: `src/tests/integration/resources/ResourceSystemIntegration.test.ts`
  Purpose: Test resource system integration
  Dependencies: Vitest, ResourceSystem mocks
- Module System Integration Tests: `src/tests/integration/modules/ModuleSystemIntegration.test.ts`
  Purpose: Test module system integration
  Dependencies: Vitest, ModuleSystem mocks
- Combat System Integration Tests: `src/tests/integration/combat/CombatSystemIntegration.test.ts`
  Purpose: Test combat system integration
  Dependencies: Vitest, CombatSystem mocks

## End-to-End Tests

### Configuration

- Playwright Configuration: `playwright.config.ts`
  Purpose: Configures Playwright for end-to-end testing
  Features:

  - Dynamic port allocation to prevent conflicts
  - Configures browsers (Chromium, Firefox)
  - Sets test directory to `./src/tests/e2e`
  - Optional web server configuration

- Test Setup: `src/tests/e2e/test-setup.ts`
  Purpose: Provides test setup and teardown utilities
  Features:
  - Dynamic port allocation
  - Custom fixtures for page objects
  - Global setup and teardown functions
  - Error handling and logging

### Page Object Models

- Mining Page: `src/tests/e2e/models/MiningPage.ts`
  Purpose: Page object model for the Mining page
  Features:

  - Element locators
  - Navigation methods
  - Action methods (search, filter, select)
  - Verification methods

- Exploration Page: `src/tests/e2e/models/ExplorationPage.ts`
  Purpose: Page object model for the Exploration page
  Features:
  - Element locators
  - Navigation methods
  - Action methods (search, filter, select, explore, scan)
  - Verification methods

### Test Files

- Mining Tests: `src/tests/e2e/mining-simplified.spec.ts`
  Purpose: Tests for the Mining page
  Features:

  - Resource display tests
  - Search functionality tests
  - Filtering tests
  - Resource selection tests

- Mining Basic Tests: `src/tests/e2e/mining-basic.spec.ts`
  Purpose: Self-contained tests for the Mining page that don't require a server
  Features:

  - Uses page.setContent() to create HTML content directly
  - Includes JavaScript functionality in the HTML content
  - Tests resource display, search, filtering, and selection
  - Uses .first() for locators that match multiple elements

- Exploration Tests: `src/tests/e2e/exploration.spec.ts`
  Purpose: Tests for the Exploration page
  Features:

  - Interface display tests
  - Star system display tests
  - Star system selection tests

- Exploration Basic Tests: `src/tests/e2e/exploration-basic.spec.ts`
  Purpose: Self-contained tests for the Exploration page that don't require a server
  Features:

  - Uses page.setContent() to create HTML content directly
  - Includes JavaScript functionality in the HTML content
  - Tests interface display, star system display, and star system selection
  - Uses .first() for locators that match multiple elements

- Simple Test: `src/tests/e2e/simple-test.spec.ts`
  Purpose: Simple test to verify the test setup
  Features:
  - Basic page interaction
  - Element verification
  - Screenshot capture

## Documentation

- Testing Framework Overview: `CodeBase_Docs/CodeBase_Architecture.md` (Testing section)
  Purpose: Provides an overview of the testing framework and its components
  Features:

  - Unit testing approach
  - Integration testing approach
  - End-to-end testing approach
  - Performance testing approach

- Self-Contained Test Approach: `CodeBase_Docs/CodeBase_Architecture.md` (Self-Contained Test Approach section)
  Purpose: Documents the self-contained test approach for E2E tests
  Features:

  - HTML content generation
  - JavaScript functionality
  - Test interaction
  - Locator best practices
  - Benefits of self-contained tests

- E2E Test Issues and Solutions: `CodeBase_Docs/CodeBase_Error_Log.md` (E2E Test Self-Contained Approach section)
  Purpose: Documents issues encountered with E2E tests and their solutions
  Features:

  - Connection errors
  - WebSocket server conflicts
  - Test isolation issues
  - Page object implementation

- TypeScript E2E Test Errors: `CodeBase_Docs/TypeScript_E2E_Test_Errors.md`
  Purpose: Documents TypeScript errors in E2E tests and their solutions
  Features:
  - Template literal errors in JavaScript code
  - Solutions using page.evaluate()
  - Type assertions for DOM elements
  - Null checks for DOM elements
  - Object parameters for passing variables

### Test Utilities

- Test Setup: `src/tests/setup.ts`
  Purpose: Provides test setup and teardown utilities for unit and integration tests
  Features:

  - WebSocket server management with dynamic port allocation
  - Mock localStorage implementation
  - Global hooks for test setup and teardown
  - WebSocket server registration and cleanup
  - Functions to enable/disable WebSocket servers for testing

- Test Isolation Examples: `src/tests/examples/testIsolationExample.test.ts`
  Purpose: Demonstrates proper test isolation techniques
  Features:

  - Resource manager isolation between tests
  - WebSocket server isolation with proper type checking
  - Multiple manager isolation examples
  - Safe destructuring pattern for potentially null objects

- Simple Game Provider Test: `src/tests/factories/SimpleGameProviderTest.test.tsx`
  Purpose: Demonstrates how to properly test React components that use contexts
  Features:
  - WebSocket server management using global functions
  - Complete implementation of GameContext without mocking
  - Proper type safety for context values
  - Example of rendering components with and without context
