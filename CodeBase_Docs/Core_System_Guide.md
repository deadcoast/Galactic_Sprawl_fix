# Core System Guide - Galactic Sprawl

This document provides a simplified overview of the essential components and functionality in the Galactic Sprawl game. It's designed to help you understand how the core functionality works without getting lost in the hundreds of files that have been created.

## Essential Components

The game is built around these core components:

### 1. Core Contexts (State Management)

- **GameContext** (`src/contexts/GameContext.tsx`) - Main game state (resources, systems, etc.)
- **ModuleContext** (`src/contexts/ModuleContext.tsx`) - Module management state
- **ThresholdContext** (`src/contexts/ThresholdContext.tsx`) - Resource threshold management

### 2. Essential Managers

- **ModuleManager** (`src/managers/module/ModuleManager.ts`) - Creates and manages modules
- **ResourceManager** (`src/managers/game/ResourceManager.ts`) - Handles resources
- **gameManager** (`src/managers/game/gameManager.ts`) - Controls game initialization and loop

### 3. Core UI Components

- **App** (`src/App.tsx`) - Main application and initialization
- **GameLayout** (`src/components/ui/GameLayout.tsx`) - Main layout and view management
- **GameHUD** (`src/components/ui/GameHUD.tsx`) - User interface for module building and game controls
- **ResourceVisualization** (`src/components/ui/ResourceVisualization.tsx`) - Resource display

### 4. Configuration Files

- **defaultModuleConfigs** (`src/config/modules/defaultModuleConfigs.ts`) - Module configurations
- **defaultBuildings** (`src/config/buildings/defaultBuildings.ts`) - Building definitions

## How the Core Functionality Works

### Game Initialization Flow

1. **App Component** loads and initializes the game providers
2. **GameInitializer** component registers buildings, modules, and initial resources
3. **GameLayout** sets up the main layout with navigation
4. **GameHUD** provides interfaces for module building and view navigation

### Module Building Process

1. User clicks a module in the **GameHUD**
2. **canBuildModule** function checks if resources are sufficient
3. **buildModuleLocally** function:
   - Finds a suitable attachment point
   - Creates a module through ModuleManager
   - Dispatches actions to ModuleContext
   - Updates game resources through GameContext
4. Notification is shown to the user

### View Navigation

GameLayout manages views, which are toggled by:

- Clicking menu items in GameHUD
- Clicking navigation buttons in the sidebar
- Using keyboard shortcuts

## Common Issues and Fixes

### 1. Module Building Not Working

**Symptoms**: Clicking module buttons does nothing, no errors in console
**Fix**: Replace imported context functions with local implementations:

```tsx
// WRONG: importing functions that use hooks
import { buildModule } from '../../contexts/ModuleContext';

// RIGHT: using the context directly within the component
const moduleContext = useModules();
const buildModuleLocally = (moduleType, cost) => {
  moduleContext.dispatch({
    type: 'CREATE_MODULE',
    moduleType,
    position,
  });
  // ...rest of implementation
};
```

### 2. Game Initialization Issues

**Symptoms**: Missing buildings, modules not registering
**Fix**: Ensure proper registration in App.tsx:

```tsx
// Register default buildings with both moduleManager and ModuleContext
moduleManager.registerBuilding(defaultMothership);
moduleDispatch({
  type: 'REGISTER_BUILDING',
  building: defaultMothership,
});
```

### 3. View Toggle Issues

**Symptoms**: Views not showing when toggled
**Fix**: Implement proper toggle functions with state management

```tsx
const handleToggleView = () => {
  setShowView(prev => !prev);
  // Hide other views if this one is being shown
  if (!showView) {
    setShowOtherView(false);
  }
};
```

## Essential Files to Focus On

To get a working understanding of the codebase, focus on these files:

1. `src/App.tsx` - Game initialization
2. `src/contexts/GameContext.tsx` - Main game state
3. `src/contexts/ModuleContext.tsx` - Module management state
4. `src/components/ui/GameHUD.tsx` - User interface
5. `src/components/ui/GameLayout.tsx` - Layout and views
6. `src/managers/module/ModuleManager.ts` - Module creation and management
7. `src/managers/game/ResourceManager.ts` - Resource handling
8. `src/config/modules/defaultModuleConfigs.ts` - Module definitions
9. `src/config/buildings/defaultBuildings.ts` - Building definitions

By understanding these files, you'll grasp the core functionality without getting lost in the hundreds of other files.

## Debugging Tips

1. Add console logging to component renders and event handlers
2. Check state values after actions
3. Inspect the module and building registrations
4. Focus on the essential files listed above
5. Access manager instances directly from the browser console in development mode:

   ```javascript
   // Access the ship hangar manager
   window.shipHangarManager.getDockedShips();

   // Check build queue status
   window.shipHangarManager.getBuildQueue();
   ```

## Next Steps for Development

1. **Simplify the codebase**:

   - Remove unnecessary files and features
   - Focus on making core functionality work properly
   - Only add features once the foundation is solid

2. **Improve feedback**:

   - Add more detailed console logging
   - Enhance user notifications
   - Add visual indicators for successful/failed actions

3. **Test core features**:
   - Module building
   - Resource management
   - View navigation

## Officer and Ship Management Systems

The game includes advanced officer and ship management systems that are critical to gameplay.

### Officer Management System

The Officer Management System allows players to:

- Recruit officers with different specializations (War, Recon, Mining)
- Train officers to improve their skills
- Assign officers to squads or ships for bonuses
- Manage officer progression through ranks

Key components:

- **OfficerManager**: Core class that handles all officer-related operations
- **OfficerAcademy**: UI component that displays officers and allows interactions
- **Squad System**: Groups officers together for enhanced bonuses

The Officer System integrates with:

- **Tech Tree System**: Tier upgrades are unlocked through tech progression
- **Ship Hangar System**: Officers can be assigned to ships for performance bonuses
- **Resource System**: Hiring and training officers requires resources

### Ship Hangar System

The Ship Hangar System manages all aspects of ship operations:

- Construction of new ships with different classes and capabilities
- Maintenance of ship bays for optimal performance
- Deployment of ships for exploration, mining, or combat
- Upgrading and repairing ships

Key components:

- **ShipHangarManager**: Core class handling construction, maintenance, and deployment
- **ShipHangar UI**: Visual interface for managing ships and build queue
- **Bay Management**: System for organizing docked ships and managing capacity

The Ship Hangar System integrates with:

- **Officer System**: Officers can be assigned to ships for performance bonuses
- **Resource System**: Ship construction and repairs require resources
- **Module System**: The hangar itself is a module that can be upgraded

### Integration Flow

When a player builds the Academy or Hangar modules:

1. The respective manager is activated via ModuleEvents
2. The UI components connect to the managers to display available options
3. Player actions trigger manager methods that modify game state
4. Resource costs are validated and deducted via ResourceManager
5. Events are emitted to update UI and trigger related systems

Relationship with Resource Management:

- Ship construction and officer training consume resources at regular intervals
- Higher tier ships and officers provide better resource collection efficiency
- Officer specializations can enhance specific resource-related operations
