# Core Components References

This file contains references to core components in the codebase.

## System Integration

- `src/components/core/SystemIntegration.tsx` - Central integration component that bridges the gap between backend managers and frontend contexts
  - **Purpose:** Synchronizes resource and module state between managers and UI contexts
  - **Dependencies:** ResourceManager, ModuleManager, GameContext, ModuleContext, ModuleEvents
  - **Key Features:**
    - Real-time resource state synchronization
    - Module state synchronization
    - Event-based updates
    - Performance optimization with change detection
  - **Usage:** Wrapped around the application in App.tsx to provide seamless backend-frontend integration

## App Component

- `src/App.tsx` - Main application entry point
  - **Purpose:** Sets up providers and initializes the game
  - **Dependencies:** GameProvider, ModuleProvider, ThresholdProvider, SystemIntegration
  - **Key Features:** Game initialization, context setup, error handling

## Game Context

- `src/contexts/GameContext.tsx` - Game state management
  - **Purpose:** Provides game state and resource tracking
  - **Dependencies:** React Context API
  - **Key Features:** Resource management, game time tracking, event logging

## Module Context

- `src/contexts/ModuleContext.tsx` - Module state management
  - **Purpose:** Manages module state and operations
  - **Dependencies:** React Context API, ModuleManager
  - **Key Features:** Module creation, activation, selection

## Threshold Context

- `src/contexts/ThresholdContext.tsx` - Resource threshold management
  - **Purpose:** Handles resource thresholds and alerts
  - **Dependencies:** React Context API, ResourceManager
  - **Key Features:** Threshold configuration, alert generation

### Core Components

- `src/types/buildings/ModuleTypes.ts` - Core module type definitions
- `src/managers/module/ModuleManager.ts` - Central module management
- `src/lib/modules/ModuleEvents.ts` - Module event definitions
- `src/managers/module/ModuleAttachmentManager.ts` - Module attachment system
- `src/utils/modules/moduleValidation.ts` - Module validation utilities
- `src/components/ui/modules/ModuleHUD.tsx` - Dynamic module HUD components
- `src/hooks/modules/useModuleAutomation.ts` - Module automation hook
- `src/managers/module/SubModuleManager.ts` - Sub-module management
- `src/hooks/modules/useSubModules.ts` - Sub-module hook
- `src/components/ui/modules/SubModuleHUD.tsx` - Sub-module UI components
- `src/managers/module/ModuleStatusManager.ts` - Module status management
- `src/hooks/modules/useModuleStatus.ts` - Module status hook
- `src/components/ui/modules/ModuleStatusDisplay.tsx` - Module status display
- `src/managers/module/ModuleUpgradeManager.ts` - Module upgrade management
- `src/hooks/modules/useModuleUpgrade.ts` - Module upgrade hook
- `src/components/ui/modules/ModuleUpgradeDisplay.tsx` - Module upgrade display
- `src/components/ui/modules/ModuleUpgradeVisualization.tsx` - Module upgrade visualization
- `src/initialization/moduleFrameworkInit.ts` - Module framework initialization

### Core Components

- `src/types/buildings/ModuleTypes.ts` - Core module type definitions
- `src/managers/module/ModuleManager.ts` - Central module management
- `src/lib/modules/ModuleEvents.ts` - Module event definitions
- `src/managers/module/ModuleAttachmentManager.ts` - Module attachment system
- `src/utils/modules/moduleValidation.ts` - Module validation utilities
- `src/components/ui/modules/ModuleHUD.tsx` - Dynamic module HUD components
- `src/hooks/modules/useModuleAutomation.ts` - Module automation hook
- `src/managers/module/SubModuleManager.ts` - Sub-module management
- `src/hooks/modules/useSubModules.ts` - Sub-module hook
- `src/components/ui/modules/SubModuleHUD.tsx` - Sub-module UI components
- `src/managers/module/ModuleStatusManager.ts` - Module status management
- `src/hooks/modules/useModuleStatus.ts` - Module status hook
- `src/components/ui/modules/ModuleStatusDisplay.tsx` - Module status display
- `src/managers/module/ModuleUpgradeManager.ts` - Module upgrade management
- `src/hooks/modules/useModuleUpgrade.ts` - Module upgrade hook
- `src/components/ui/modules/ModuleUpgradeDisplay.tsx` - Module upgrade display
- `src/components/ui/modules/ModuleUpgradeVisualization.tsx` - Module upgrade visualization
- `src/initialization/moduleFrameworkInit.ts` - Module framework initialization

### Core Components

- `src/types/buildings/ModuleTypes.ts` - Core module type definitions
- `src/managers/module/ModuleManager.ts` - Central module management
- `src/lib/modules/ModuleEvents.ts` - Module event definitions
- `src/managers/module/ModuleAttachmentManager.ts` - Module attachment system
- `src/utils/modules/moduleValidation.ts` - Module validation utilities
- `src/components/ui/modules/ModuleHUD.tsx` - Dynamic module HUD components
- `src/hooks/modules/useModuleAutomation.ts` - Module automation hook
- `src/managers/module/SubModuleManager.ts` - Sub-module management
- `src/hooks/modules/useSubModules.ts` - Sub-module hook
- `src/components/ui/modules/SubModuleHUD.tsx` - Sub-module UI components
- `src/managers/module/ModuleStatusManager.ts` - Module status management
- `src/hooks/modules/useModuleStatus.ts` - Module status hook
- `src/components/ui/modules/ModuleStatusDisplay.tsx` - Module status display
- `src/managers/module/ModuleUpgradeManager.ts` - Module upgrade management
- `src/hooks/modules/useModuleUpgrade.ts` - Module upgrade hook
- `src/components/ui/modules/ModuleUpgradeDisplay.tsx` - Module upgrade display
- `src/components/ui/modules/ModuleUpgradeVisualization.tsx` - Module upgrade visualization
- `src/initialization/moduleFrameworkInit.ts` - Module framework initialization

### Core Components

- `src/types/buildings/ModuleTypes.ts` - Core module type definitions
- `src/managers/module/ModuleManager.ts` - Central module management
- `src/lib/modules/ModuleEvents.ts` - Module event definitions
- `src/managers/module/ModuleAttachmentManager.ts` - Module attachment system
- `src/utils/modules/moduleValidation.ts` - Module validation utilities
- `src/components/ui/modules/ModuleHUD.tsx` - Dynamic module HUD components
- `src/hooks/modules/useModuleAutomation.ts` - Module automation hook
- `src/managers/module/SubModuleManager.ts` - Sub-module management
- `src/hooks/modules/useSubModules.ts` - Sub-module hook
- `src/components/ui/modules/SubModuleHUD.tsx` - Sub-module UI components
- `src/managers/module/ModuleStatusManager.ts` - Module status management
- `src/hooks/modules/useModuleStatus.ts` - Module status hook
- `src/components/ui/modules/ModuleStatusDisplay.tsx` - Module status display
- `src/managers/module/ModuleUpgradeManager.ts` - Module upgrade management
- `src/hooks/modules/useModuleUpgrade.ts` - Module upgrade hook
- `src/components/ui/modules/ModuleUpgradeDisplay.tsx` - Module upgrade display
- `src/components/ui/modules/ModuleUpgradeVisualization.tsx` - Module upgrade visualization
- `src/initialization/moduleFrameworkInit.ts` - Module framework initialization

### Core Components

- `src/types/buildings/ModuleTypes.ts` - Core module type definitions
- `src/managers/module/ModuleManager.ts` - Central module management
- `src/lib/modules/ModuleEvents.ts` - Module event definitions
- `src/managers/module/ModuleAttachmentManager.ts` - Module attachment system
- `src/utils/modules/moduleValidation.ts` - Module validation utilities
- `src/components/ui/modules/ModuleHUD.tsx` - Dynamic module HUD components
- `src/hooks/modules/useModuleAutomation.ts` - Module automation hook
- `src/managers/module/SubModuleManager.ts` - Sub-module management
- `src/hooks/modules/useSubModules.ts` - Sub-module hook
- `src/components/ui/modules/SubModuleHUD.tsx` - Sub-module UI components
- `src/managers/module/ModuleStatusManager.ts` - Module status management
- `src/hooks/modules/useModuleStatus.ts` - Module status hook
- `src/components/ui/modules/ModuleStatusDisplay.tsx` - Module status display
- `src/managers/module/ModuleUpgradeManager.ts` - Module upgrade management
- `src/hooks/modules/useModuleUpgrade.ts` - Module upgrade hook
- `src/components/ui/modules/ModuleUpgradeDisplay.tsx` - Module upgrade display
- `src/components/ui/modules/ModuleUpgradeVisualization.tsx` - Module upgrade visualization
- `src/initialization/moduleFrameworkInit.ts` - Module framework initialization

### Core Components

- `src/types/buildings/ModuleTypes.ts` - Core module type definitions
- `src/managers/module/ModuleManager.ts` - Central module management
- `src/lib/modules/ModuleEvents.ts` - Module event definitions
- `src/managers/module/ModuleAttachmentManager.ts` - Module attachment system
- `src/utils/modules/moduleValidation.ts` - Module validation utilities
- `src/components/ui/modules/ModuleHUD.tsx` - Dynamic module HUD components
- `src/hooks/modules/useModuleAutomation.ts` - Module automation hook
- `src/managers/module/SubModuleManager.ts` - Sub-module management
- `src/hooks/modules/useSubModules.ts` - Sub-module hook
- `src/components/ui/modules/SubModuleHUD.tsx` - Sub-module UI components
- `src/managers/module/ModuleStatusManager.ts` - Module status management
- `src/hooks/modules/useModuleStatus.ts` - Module status hook
- `src/components/ui/modules/ModuleStatusDisplay.tsx` - Module status display
- `src/managers/module/ModuleUpgradeManager.ts` - Module upgrade management
- `src/hooks/modules/useModuleUpgrade.ts` - Module upgrade hook
- `src/components/ui/modules/ModuleUpgradeDisplay.tsx` - Module upgrade display
- `src/components/ui/modules/ModuleUpgradeVisualization.tsx` - Module upgrade visualization
- `src/initialization/moduleFrameworkInit.ts` - Module framework initialization
