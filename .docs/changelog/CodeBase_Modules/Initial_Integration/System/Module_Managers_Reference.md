### Module Managers

- `src/managers/buildings/ShipHangarManager.ts` - Ship hangar module management

12. Automation System [~90% Complete]

- Primary Components:
  - Global Automation Manager: src/managers/automation/GlobalAutomationManager.ts
    Purpose: Manage global automation routines and execution
    Dependencies: AutomationManager, GameLoopManager, EventCommunication
  - Automation Visualization: src/components/ui/automation/AutomationVisualization.tsx
    Purpose: Visualize and control automation routines
    Dependencies: GlobalAutomationManager, CSS Styling
  - Automation CSS: src/styles/automation.css
    Purpose: Style the automation visualization components
    Dependencies: None
  - Automation Hook: src/hooks/automation/useAutomation.ts
    Purpose: React hook for accessing the global automation system
    Dependencies: GlobalAutomationManager, AutomationManager
  - Automation System Initialization: src/initialization/automationSystemInit.ts
    Purpose: Initialize the automation system and register default routines
    Dependencies: GlobalAutomationManager, EventDispatcher

### Module Managers

- `src/managers/buildings/ShipHangarManager.ts` - Ship hangar module management

12. Automation System [~90% Complete]

- Primary Components:
  - Global Automation Manager: src/managers/automation/GlobalAutomationManager.ts
    Purpose: Manage global automation routines and execution
    Dependencies: AutomationManager, GameLoopManager, EventCommunication
  - Automation Visualization: src/components/ui/automation/AutomationVisualization.tsx
    Purpose: Visualize and control automation routines
    Dependencies: GlobalAutomationManager, CSS Styling
  - Automation CSS: src/styles/automation.css
    Purpose: Style the automation visualization components
    Dependencies: None
  - Automation Hook: src/hooks/automation/useAutomation.ts
    Purpose: React hook for accessing the global automation system
    Dependencies: GlobalAutomationManager, AutomationManager
  - Automation System Initialization: src/initialization/automationSystemInit.ts
    Purpose: Initialize the automation system and register default routines
    Dependencies: GlobalAutomationManager, EventDispatcher
