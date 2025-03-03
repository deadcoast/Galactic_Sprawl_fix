## Tests

### Unit Tests

- `src/tests/managers/resource/ResourceFlowManager.cache.test.ts` - Unit tests for the caching system in ResourceFlowManager
- `src/tests/managers/resource/ResourceFlowManager.batch.test.ts` - Unit tests for batch processing in ResourceFlowManager
- `src/tests/managers/resource/ResourceFlowManager.errors.test.ts` - Unit tests for error handling in ResourceFlowManager
- `src/tests/managers/resource/ResourceFlowManager.chain.test.ts` - Unit tests for multi-step production chains in ResourceFlowManager
- `src/tests/managers/resource/ResourceFlowManager.test.ts` - Core unit tests for ResourceFlowManager functionality
- `src/tests/managers/weapons/AdvancedWeaponEffectManager.test.ts` - Comprehensive tests for the AdvancedWeaponEffectManager, including singleton pattern, effect creation for different weapon types and variants, lifecycle management, event emission, environmental interactions, effect updates, visual configurations based on quality levels, and proper interface implementation

### Integration Tests

- `src/tests/integration/resource/MiningResourceIntegration.test.ts` - Integration tests for the ResourceFlowManager and MiningResourceIntegration classes
- `src/tests/integration/ui/ResourceVisualization.test.tsx` - Integration tests for the ResourceVisualization UI component with complete ResourceTrackingResult mock implementations, testing resource visualization rendering with different resource states (normal, critical, abundant)

### Component Tests

- `src/tests/components/ui/ResourceVisualization.snapshot.test.tsx` - Snapshot tests for the ResourceVisualization component
- `src/tests/components/buildings/MiningWindow.test.tsx` - Component tests for the MiningWindow component with user interactions

### End-to-End Tests

- `src/tests/e2e/README.md` - Documentation and setup instructions for E2E testing with Playwright
- `src/tests/e2e/models/MiningPage.ts` - Page Object Model for the Mining page used in E2E tests
- `src/tests/e2e/mining.spec.ts` - E2E tests for the Mining module functionality

### Test Utilities

- `src/tests/utils/testUtils.tsx` - Utility functions for testing, including renderWithProviders, mock factories, common testing patterns, and performance testing utilities
- `src/tests/utils/testUtilsUsageExample.test.tsx` - Example usage of the test utilities for reference

### Performance Tests

- `src/tests/performance/ResourceFlowManager.benchmark.ts` - Performance benchmarks for the ResourceFlowManager
- `src/tests/performance/EventSystem.benchmark.ts` - Performance benchmarks for the event processing system

## Core Systems

### Resource Management

- `src/managers/resource/ResourceFlowManager.ts` - Core manager for resource flows, transfers, optimizations, and conversion processes with comprehensive JSDoc documentation
- `src/managers/resource/ChainProcessor.ts` - Handles multi-step production chains with chain status tracking and step processing
- `src/types/resources/ResourceTypes.ts` - Type definitions for resources, flows, transfers, conversion processes, and chain processing interfaces
- `src/utils/resources/resourceValidation.ts` - Validation utilities for resource operations
- `src/utils/resources/efficiencyCalculator.ts` - Utility for calculating compound efficiency for resource conversions

### Automation System

- `src/managers/game/AutomationManager.ts` - Core manager for module automation, supporting complex condition types, action chaining, and rule lifecycle management. Includes robust type handling for mixed return types with proper type assertions and narrowing.
- `src/managers/automation/GlobalAutomationManager.ts` - System-wide manager for automation routines, integrating with module-specific automation, delegating rule management to AutomationManager
- `src/components/ui/automation/AutomationVisualization.tsx` - Main interface for visualizing and managing automation routines, including filtering, enabling/disabling, and accessing the visual rule editor
- `src/components/ui/automation/AutomationRuleEditor.tsx` - Visual programming interface for automation rules with drag-and-drop functionality, allowing users to create complex conditions and action chains
- `src/components/ui/automation/AutomationRuleEditor.css` - Styling for the visual programming interface with a modern, clean design
- `src/initialization/automationSystemInit.ts` - Bootstrap for automation system, registering default automation routines
- `src/hooks/automation/useAutomation.ts` - Custom React hook for accessing automation functionality from components

### UI Components

- `src/components/ui/resource/ChainVisualization.tsx` - Interactive React component that visualizes production chains using D3.js with interactive node selection, visual feedback on node clicks, and event handlers for nodes, links, and tooltips
- `src/components/ui/resource/ConverterDashboard.tsx` - Main interface for managing converters and production chains
- `src/components/ui/resource/ConverterDetailsView.tsx` - Detailed view of a single converter with stats, active processes, available recipes, and efficiency factors
- `src/components/ui/resource/ChainManagementInterface.tsx` - Interface for creating and managing multi-step production chains and templates
- `src/components/ui/resource/ConverterDashboard.css` - Styles for the converter dashboard component
- `src/components/ui/resource/ConverterDetailsView.css` - Styles for the converter details view component
- `src/components/ui/resource/ChainManagementInterface.css` - Styles for the chain management interface component

### Combat System UI Components

- `src/components/combat/CombatLayout.tsx` - Layout component for combat-related pages providing navigation and common structure
- `src/components/combat/CombatDashboard.tsx` - Main dashboard for combat operations overview
- `src/components/combat/FleetDetails.tsx` - Component for detailed fleet information and management
- `src/components/combat/BattleView.tsx` - Component for viewing and managing active battles
- `src/components/combat/formations/FormationTacticsPage.tsx` - Page component for managing formation tactics
- `src/components/combat/formations/FormationTacticsPanel.tsx` - Panel component for displaying formation visualizations, tactical bonuses, and behavior options
- `src/components/combat/formations/FormationVisualizer.tsx` - Visual representation of fleet formations
- `src/components/combat/formations/TacticalBehaviorSelector.tsx` - Component for selecting tactical behaviors
- `src/components/combat/formations/FormationTacticsContainer.tsx` - Container for managing formations across multiple fleets

### Weapon Effects

- **src/managers/weapons/AdvancedWeaponEffectManager.ts**: Manages advanced weapon effects including beam, homing, multi-stage, and environment interactions. The manager extends EventEmitter and implements the \_WeaponEvents interface with proper property getters and setters. Supports various weapon categories (machineGun, gaussCannon, etc.) and variants (standard, sparkRounds, etc.)

### UI Library Components

- `src/components/ui/Button.tsx` - Versatile button component with multiple style variants and sizes using class-variance-authority
- `src/components/ui/Tabs.tsx` - Accessible tabbed interface component using @radix-ui/react-tabs

### Module Status Components

- `src/components/ui/modules/ModuleStatusDisplay.tsx` - Component for displaying and managing module status with status transition visualization and interactive status controls

### Visual Effects

- `src/effects/component_effects/SmokeTrailEffect.tsx` - Particle-based visual effect component that creates dynamic smoke trails with customizable direction, color, and particle behavior, using Three.js for rendering
- `src/effects/component_effects/ExplosionEffect.tsx` - Visual effect for creating explosion animations
- `src/effects/component_effects/GlowEffect.tsx` - Visual effect for creating glowing elements

### Pages

- `src/pages/ConverterManagementPage.tsx` - Page component that integrates the converter management UI components with routing
- `src/pages/ConverterManagementPage.css` - Styles for the converter management page

### Event System

- `src/lib/modules/ModuleEvents.ts` - Core event system implementation with event types and the event bus with detailed JSDoc documentation
- `src/utils/events/EventDispatcher.tsx` - React context provider and hooks for the event system with comprehensive documentation
- `src/hooks/useModuleEvents.ts` - Custom hook for working with module events

### Mining Hub UI Components

- `src/components/buildings/modules/MiningHub/MiningWindow.tsx` - Main interface for the Mining Hub module, allowing resource visualization and management
- `src/components/buildings/modules/MiningHub/MiningControls.tsx` - Control panel for mining operations
- `src/components/buildings/modules/MiningHub/MiningMap.tsx` - Visual map representation of mining resources
- `src/components/buildings/modules/MiningHub/ResourceNode.tsx` - Individual resource node component used in the mining interface
- `src/components/buildings/modules/MiningHub/ResourceTransfer.tsx` - Component for visualizing and managing resource transfers
- `src/components/buildings/modules/MiningHub/ResourceStorage.tsx` - UI for resource storage management
- `src/components/buildings/modules/MiningHub/ThresholdManager.tsx` - Interface for setting and managing resource thresholds
- `src/components/buildings/modules/MiningHub/ThresholdStatusIndicator.tsx` - Visual indicator for threshold status
- `src/components/buildings/modules/MiningHub/MiningTutorial.tsx` - Tutorial component for the Mining Hub

## Documentation

### Architecture

- `CodeBase_Docs/CodeBase_Architecture.md` - Overall architecture of the codebase, including a comprehensive section on TypeScript best practices for handling mixed return types
- `CodeBase_Docs/CodeBase_Mapping_Index.md` - This file, a master index of all files in the codebase
- `CodeBase_Docs/System_Architecture_Diagrams.md` - Visual diagrams and detailed explanations of complex systems

### System Design

- `CodeBase_Docs/Performance_Considerations.md` - Analysis of performance critical paths with optimization techniques and recommendations
- `CodeBase_Docs/ResourceFlowManager_Optimizations.md` - Specific optimizations for the resource flow system
- `CodeBase_Docs/Event_System_Optimizations.md` - Specific optimizations for the event system
- `CodeBase_Docs/MultiStep_Production_Chains.md` - Detailed documentation of the multi-step production chain system
- `CodeBase_Docs/Resource_Conversion_Efficiency.md` - Comprehensive guide to the resource conversion efficiency system
- `CodeBase_Docs/ConverterManagementUI.md` - Design specifications for the converter management user interface

### Testing Documentation

- `CodeBase_Docs/Integration_Testing_Best_Practices.md` - Guidelines for creating effective integration tests
- `CodeBase_Docs/ResourceFlowManager_Testing.md` - Documentation for ResourceFlowManager test implementation
- `CodeBase_Docs/UI_Testing_Best_Practices.md` - Comprehensive guide for component, integration, and E2E UI testing
- `CodeBase_Docs/Performance_Benchmark_Practices.md` - Best practices for performance benchmarking
- `CodeBase_Docs/Test_Utilities_Guide.md` - Guide to using the enhanced test utilities

### Error and Linting Documentation

- `CodeBase_Docs/CodeBase_Error_Log.md` - Common issues encountered during development, including detailed logs of fixes for TypeScript errors like property access on mixed return types
- `CodeBase_Docs/CodeBase_Linting_Progress.md` - Linting rules and best practices
- `CodeBase_Docs/TypeScript_Error_Fixing_Strategies.md` - Strategies for fixing TypeScript errors

## Configuration Files

### TypeScript Configuration

- `tsconfig.json` - Main TypeScript configuration for the application code
- `tsconfig.node.json` - TypeScript configuration for Node.js-specific files
- `tsconfig.check.json` - TypeScript configuration for type checking with downlevel iteration

### ESLint Configuration

- `eslint.config.js` - ESLint configuration using the new flat config format
- `.eslintignore` - Files and directories to be ignored by ESLint

### Build Configuration

- `vite.config.ts` - Vite build configuration
- `vitest.config.ts` - Vitest test configuration
- `jest.config.js` - Jest test configuration for legacy tests

## Recent Updates

- `src/managers/weapons/AdvancedWeaponEffectManager.ts` - Implemented the `_WeaponEvents` interface properly in the `AdvancedWeaponEffectManager` class. The interface is now used for handling weapon effect events and bridges between the custom `_WeaponEvents` format and the standard `AdvancedWeaponEffectEvents` system. Added properties, index signature, and a bridging method to properly satisfy the interface requirements.
