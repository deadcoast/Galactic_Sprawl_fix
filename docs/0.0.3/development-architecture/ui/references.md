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
    Dependencies: GameContext, ResourceManager, ModuleContext
    Features:
    - Dynamic menu categories with custom styling
    - Resource visualization and monitoring
    - Module building interface
    - Notification system integration
    - Keyboard shortcuts for view toggling
    - Resource threshold warnings
    - Tech level visualization
      Implementation:
    - Uses category-based menu system with icons and colors
    - Implements resource statistics tracking and visualization
    - Provides visual feedback for resource thresholds
    - Supports future UI theming through color and icon mappings
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

- **ModuleHUD Component**: src/components/ui/modules/ModuleHUD.tsx
  Purpose: Display module information and controls
  Dependencies: ModuleManager, ModuleEvents, React, useModuleState
  Features:
  - Real-time module status monitoring
  - Module alert system with severity levels
  - Interactive module controls and configuration
  - Resource consumption visualization
  - Module performance metrics
  - Status change event handling
  - Alert notification system
    Key Functions:
  - `handleModuleStatusChanged`: Handles module status change events
  - `handleModuleAlertAdded`: Processes and displays module alerts
  - `renderModuleControls`: Renders module-specific control interfaces
  - `renderModuleStatus`: Visualizes current module status and metrics
    Implementation Notes:
  - Uses event-based architecture for real-time updates
  - Implements modular design for different module types
  - Provides visual feedback for status changes and alerts
  - Supports keyboard shortcuts for module control
    Future Implementations:
  - Enhanced status indicators with animations
  - Alert categorization and filtering system
  - Interactive resolution options for alerts
  - Performance metrics tracking and visualization
  - Resource consumption optimization suggestions

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

## Game HUD System

- **GameHUD Component**: src/components/ui/GameHUD.tsx
  - Purpose: Main heads-up display for game interface
  - Dependencies: React, GameContext, ModuleContext, NotificationSystem
  - Features:
    - Category-based menu system for module building
    - Resource visualization and monitoring
    - Tech level visualization with tier-based colors
    - Notification system integration
    - Keyboard shortcuts for view toggling
    - Resource threshold warnings
    - Settings panel with resource analytics
  - Key Interfaces:
    - `MenuItem`: Interface for menu items with actions and costs
    - `_Notification`: Interface for future custom notification system
    - `MenuCategory`: Type for different menu categories
  - Implementation Notes:
    - Uses category colors and icons for visual theming
    - Implements resource statistics tracking with warning thresholds
    - Provides visual feedback for resource levels
    - Supports keyboard shortcuts for efficient navigation
    - Integrates with notification system for alerts
  - Future Implementations:
    - Dynamic UI theming through `__categoryColors` and `__categoryIcons`
    - Enhanced resource analytics through `__resourceStats`
    - Tech progression visualization through `__getTierColor`
    - Custom notification system through `_Notification` interface

## VPR (Visual Progress Representation) View

- Components:
  - VPR View: src/components/ui/VPRStarSystemView.tsx
  - Game Layout: src/components/ui/GameLayout.tsx

## Civilization Sprawl View [~40% Complete]

- Components:
  - Sprawl View: src/components/ui/SprawlView.tsx
  - Game Layout: src/components/ui/GameLayout.tsx

## Drag and Drop System

- **DragAndDrop Component**: src/components/ui/DragAndDrop.tsx
  - Purpose: Provides drag and drop functionality for various game elements
  - Dependencies: React
  - Features:
    - Generic type parameters for flexible data handling
    - Type-safe drag and drop operations
    - Preview component for dragged items
    - Drop target component for receiving dragged items
    - Custom hook for managing drag and drop state
  - Used By:
    - MiningWindow.tsx (for resource and ship dragging)
    - ExplorationHub.tsx (for ship assignment)
    - MothershipCore.tsx (for module attachment)
    - ColonyCore.tsx (for module management)
  - Key Interfaces:
    - `DragItem<T>`: Generic interface for draggable items
    - `DropTargetProps<T>`: Props for drop target component
    - `DraggableProps<T>`: Props for draggable component
  - Implementation Notes:
    - Uses generic type parameters for type-safe data handling
    - Safely extracts and displays properties from generic data
    - Handles serialization and deserialization of drag data
    - Provides customizable styling for drag and drop elements

## Resource Visualization System

- **ResourceVisualization Component**: src/components/ui/ResourceVisualization.tsx
  - Purpose: Visualize resource levels and extraction rates
  - Dependencies: React, GameContext, Framer Motion
  - Features:
    - Animated resource displays with progress bars
    - Resource type icons and color coding
    - Extraction rate indicators
    - Warning indicators for low resources
  - Used By:
    - GameHUD.tsx (for resource monitoring)
    - ResourceManager.tsx (for detailed resource analytics)
  - Implementation Notes:
    - Uses Framer Motion for smooth animations
    - Provides visual feedback for resource thresholds
    - Supports multiple resource types with consistent styling
    - Integrates with notification system for resource warnings

## UI Component Library

- **Button Component**: src/components/ui/Button.tsx
  - Purpose: Reusable button component with variant support
  - Dependencies:
    - class-variance-authority (for styling variants)
    - React (for component framework)
  - Features:
    - Multiple style variants (default, destructive, outline, secondary, ghost, link)
    - Size variants (default, sm, lg)
    - Support for custom className
    - Forward ref implementation for accessibility
    - Polymorphic rendering via the `asChild` prop and Slot pattern
  - Key Parts:
    - `buttonVariants`: cva function that defines the button's visual variants
    - `Slot`: Component that enables polymorphic rendering
    - `mergeRefs`: Helper function for properly merging React refs
  - Implementation Notes:
    - Uses class-variance-authority for style composition
    - Implements proper TypeScript typing for props
    - Supports all standard button attributes
    - Uses the Slot pattern to enable rendering as different elements
  - Usage:
    - Used throughout the application for consistent button styling
    - Integrated with form components and interactive UI elements
    - Can be rendered as different elements using `asChild` prop:
      ```tsx
      <Button asChild>
        <a href="/some-path">Navigate</a>
      </Button>
      ```

- **Tabs Component**: src/components/ui/Tabs.tsx
  - Purpose: Tabbed interface component for organizing content
  - Dependencies:
    - @radix-ui/react-tabs (for accessible tab functionality)
    - React (for component framework)
  - Features:
    - Accessible tab navigation
    - Customizable tab triggers
    - Content panels associated with tabs
    - Support for custom styling
  - Implementation Notes:
    - Uses Radix UI for accessibility and keyboard navigation
    - Implements proper TypeScript typing for props
    - Supports all standard tab attributes
  - Usage:
    - Used in formation tactics panel for organizing different formation options
    - Used in resource management interfaces for categorized content
    - Used in settings panels for grouped configuration options

## Tech Tree System

- **TechTree Component**: src/components/ui/TechTree.tsx
  - Purpose: Visualize and manage technology progression
  - Dependencies: React, TechTreeManager
  - Features:
    - Interactive tech node visualization
    - Category-based filtering
    - Research progress tracking
    - Node unlocking system
    - Tech synergy visualization
    - Connection visualization between nodes
    - Tier-based organization
  - Key Interfaces:
    - `TechNode`: Interface extending ImportedTechNode with icon property
    - `NodeIconsType`: Type for node icons using Lucide icons
  - Helper Functions:
    - `_mapToLocalTechNode`: Maps imported tech nodes to local format
    - `getCategoryIcon`: Determines icon based on tech category
    - `getTierNodes`: Filters nodes by tier
    - `canUnlockNode`: Checks if a node can be unlocked
  - Implementation Notes:
    - Uses React state for managing tech nodes and research progress
    - Implements refs for node position tracking
    - Provides visual feedback for node status and research progress
    - Supports keyboard navigation and accessibility
  - Related Components:
    - `TechVisualFeedback`: src/components/ui/tech/TechVisualFeedback.tsx
    - `TechConnectionLine`: src/components/ui/tech/TechVisualFeedback.tsx
    - `ResearchProgressIndicator`: src/components/ui/tech/TechVisualFeedback.tsx
    - `TechSynergyIndicator`: src/components/ui/tech/TechVisualFeedback.tsx
