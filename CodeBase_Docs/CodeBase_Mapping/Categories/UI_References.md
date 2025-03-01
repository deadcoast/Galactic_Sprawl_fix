---
UI COMPONENTS REFERENCES
---

# UI Components

## UI Framework [~30% Complete]

- Main layout: src/components/ui/GameLayout.tsx
- Star system view: src/components/ui/VPRStarSystemView.tsx
- Tech tree: src/components/ui/TechTree.tsx
- Game HUD: src/components/ui/GameHUD.tsx

## View System Architecture

### Core UI Framework

- Primary Components:
  - Main Layout: src/components/ui/GameLayout.tsx
    Purpose: Main game layout structure
    Used By: All view components
  - Game HUD: src/components/ui/GameHUD.tsx
    Purpose: Heads-up display interface
    Dependencies: GameContext, ResourceManager
  - VPR View: src/components/ui/VPRStarSystemView.tsx
    Purpose: Visual progress representation
    Dependencies: GameLayout, ResourceManager
  - Tech Tree: src/components/ui/TechTree.tsx
    Purpose: Technology progression interface
    Dependencies: GameContext, ResourceManager

### Visualization Components

- Primary Components:
  - Star System View: src/components/ui/VPRStarSystemView.tsx
    Purpose: Main game view interface
    Dependencies: GameLayout, ThreeJS
  - Sprawl View: src/components/ui/SprawlView.tsx
    Purpose: Civilization expansion interface
    Dependencies: GameLayout, D3

### Module-Specific Views

- Primary Components:
  - Colony Core: src/components/buildings/colony/ColonyCore.tsx
    Purpose: Colony management interface
    Dependencies: ModuleManager, ResourceManager
  - Mining Hub: src/components/buildings/modules/MiningHub/MiningControls.tsx
    Purpose: Mining operations interface
    Dependencies: MiningShipManager, ResourceManager
  - Exploration Hub: src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
    Purpose: Exploration management interface
    Dependencies: ReconShipManager

### Rendering Systems

- Primary Components:
  - Parallax System: src/systems/rendering/ParallaxSystem.ts
    Purpose: Handle multi-layer background effects
    Dependencies: ThreeJS, GameContext
  - Environmental Effects: src/systems/rendering/EnvironmentalEffects.ts
    Purpose: Manage weather and lighting effects
    Dependencies: ThreeJS, GameContext
  - Animation Manager: src/systems/rendering/AnimationManager.ts
    Purpose: Coordinate complex animations and transitions
    Dependencies: GSAP, Framer Motion

### Interactive Systems

- Primary Components:
  - Navigation Controller: src/systems/interaction/NavigationController.ts
    Purpose: Handle zoom, pan, and camera controls
    Dependencies: React-zoom-pan-pinch
  - Tooltip Manager: src/systems/interaction/TooltipManager.ts
    Purpose: Manage information display and tooltips
    Dependencies: React-tooltip
  - Asset Controller: src/systems/interaction/AssetController.ts
    Purpose: Handle asset interactions and validations
    Dependencies: GameContext, ResourceManager

### Performance Systems

- Primary Components:
  - Render Optimizer: src/systems/performance/RenderOptimizer.ts
    Purpose: Optimize rendering performance
    Dependencies: ThreeJS, React-konva
  - Memory Manager: src/systems/performance/MemoryManager.ts
    Purpose: Handle memory management and cleanup
    Dependencies: GameContext
  - Effect Scheduler: src/systems/performance/EffectScheduler.ts
    Purpose: Manage and schedule visual effects
    Dependencies: GSAP, AnimationManager

## Module UI Components

- Module HUD: src/components/ui/modules/ModuleHUD.tsx
  Purpose: Display module information and controls
  Dependencies: ModuleManager, ModuleEvents
- Sub-Module HUD: src/components/ui/modules/SubModuleHUD.tsx
  Purpose: Display sub-module information and controls
  Dependencies: SubModuleManager, useSubModules
- Module Status Display: src/components/ui/modules/ModuleStatusDisplay.tsx
  Purpose: Visualize module status, metrics, and alerts
  Dependencies: useModuleStatus, ModuleManager
- Module Upgrade Display: src/components/ui/modules/ModuleUpgradeDisplay.tsx
  Purpose: Display module upgrade information and controls
  Dependencies: useModuleUpgrade, ModuleManager
- Module Upgrade Visualization: src/components/ui/modules/ModuleUpgradeVisualization.tsx
  Purpose: Visualize module upgrades with animations and effects
  Dependencies: useModuleUpgrade, ModuleUpgradeManager

## VPR (Visual Progress Representation) View

- Components:
  - VPR View: src/components/ui/VPRStarSystemView.tsx
  - Game Layout: src/components/ui/GameLayout.tsx

## Civilization Sprawl View [~40% Complete]

- Components:
  - Sprawl View: src/components/ui/SprawlView.tsx
  - Game Layout: src/components/ui/GameLayout.tsx
