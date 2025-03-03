---
TESTING FRAMEWORK REFERENCES
---

# Testing Framework

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

### End-to-End Tests

- Game Initialization Tests: `src/tests/e2e/GameInitialization.test.ts`
  Purpose: Test game initialization
  Dependencies: Vitest, GameSystem mocks
- Game Loop Tests: `src/tests/e2e/GameLoop.test.ts`
  Purpose: Test game loop
  Dependencies: Vitest, GameSystem mocks
- Resource Flow Tests: `src/tests/e2e/ResourceFlow.test.ts`
  Purpose: Test resource flow
  Dependencies: Vitest, GameSystem mocks
- Combat Scenario Tests: `src/tests/e2e/CombatScenario.test.ts`
  Purpose: Test combat scenarios
  Dependencies: Vitest, GameSystem mocks

### Unit Tests

1. Event System Tests
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

### Unit Tests

1. Event System Tests
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
