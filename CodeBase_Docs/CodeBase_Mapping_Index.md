## Tests

### Unit Tests

- `src/tests/managers/resource/ResourceFlowManager.cache.test.ts` - Unit tests for the caching system in ResourceFlowManager
- `src/tests/managers/resource/ResourceFlowManager.batch.test.ts` - Unit tests for batch processing in ResourceFlowManager
- `src/tests/managers/resource/ResourceFlowManager.errors.test.ts` - Unit tests for error handling in ResourceFlowManager
- `src/tests/managers/resource/ResourceFlowManager.chain.test.ts` - Unit tests for multi-step production chains in ResourceFlowManager
- `src/tests/managers/resource/ResourceFlowManager.test.ts` - Core unit tests for ResourceFlowManager functionality

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

### UI Components

- `src/components/ui/resource/ChainVisualization.tsx` - React component that visualizes production chains using D3.js
- `src/components/ui/resource/ConverterDashboard.tsx` - Main interface for managing converters and production chains
- `src/components/ui/resource/ConverterDetailsView.tsx` - Detailed view of a single converter with stats, active processes, available recipes, and efficiency factors
- `src/components/ui/resource/ChainManagementInterface.tsx` - Interface for creating and managing multi-step production chains and templates
- `src/components/ui/resource/ConverterDashboard.css` - Styles for the converter dashboard component
- `src/components/ui/resource/ConverterDetailsView.css` - Styles for the converter details view component
- `src/components/ui/resource/ChainManagementInterface.css` - Styles for the chain management interface component

### Pages

- `src/pages/ConverterManagementPage.tsx` - Page component that integrates the converter management UI components with routing
- `src/pages/ConverterManagementPage.css` - Styles for the converter management page

### Event System

- `src/lib/modules/ModuleEvents.ts` - Core event system implementation with event types and the event bus with detailed JSDoc documentation
- `src/utils/events/EventDispatcher.tsx` - React context provider and hooks for the event system with comprehensive documentation
- `src/hooks/useModuleEvents.ts` - Custom hook for working with module events

## Documentation

### Architecture

- `CodeBase_Docs/CodeBase_Architecture.md` - Overall architecture of the codebase
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

- `CodeBase_Docs/CodeBase_Error_Log.md` - Common issues encountered during development
- `CodeBase_Docs/CodeBase_Linting_Progress.md` - Linting rules and best practices
- `CodeBase_Docs/TypeScript_Error_Fixing_Strategies.md` - Strategies for fixing TypeScript errors
