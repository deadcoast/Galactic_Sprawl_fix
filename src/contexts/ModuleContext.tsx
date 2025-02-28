import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { useGame } from '../contexts/GameContext';
import { moduleManager } from '../managers/module/ModuleManager';
import { BaseModule, ModularBuilding, ModuleType } from '../types/buildings/ModuleTypes';
import { Position } from '../types/core/GameTypes';

// State interface
interface ModuleState {
  activeModules: BaseModule[];
  buildings: ModularBuilding[];
  selectedModuleId?: string;
  selectedBuildingId?: string;
}

// Action types
type ModuleAction =
  | { type: 'CREATE_MODULE'; moduleType: ModuleType; position: Position }
  | { type: 'ATTACH_MODULE'; moduleId: string; buildingId: string; attachmentPointId: string }
  | { type: 'UPGRADE_MODULE'; moduleId: string }
  | { type: 'SET_MODULE_ACTIVE'; moduleId: string; active: boolean }
  | { type: 'SELECT_MODULE'; moduleId: string }
  | { type: 'SELECT_BUILDING'; buildingId: string }
  | { type: 'REGISTER_BUILDING'; building: ModularBuilding }
  | { type: 'UPDATE_ACTIVE_MODULES'; modules: BaseModule[] };

// Initial state
const initialState: ModuleState = {
  activeModules: [],
  buildings: [],
  selectedModuleId: undefined,
  selectedBuildingId: undefined,
};

// Reducer
function moduleReducer(state: ModuleState, action: ModuleAction): ModuleState {
  switch (action.type) {
    case 'CREATE_MODULE': {
      const module = moduleManager.createModule(action.moduleType, action.position);
      return {
        ...state,
        activeModules: moduleManager.getActiveModules(),
      };
    }

    case 'ATTACH_MODULE': {
      moduleManager.attachModule(action.moduleId, action.buildingId, action.attachmentPointId);
      return {
        ...state,
        buildings: Array.from(state.buildings),
      };
    }

    case 'UPGRADE_MODULE': {
      moduleManager.upgradeModule(action.moduleId);
      return {
        ...state,
        activeModules: moduleManager.getActiveModules(),
      };
    }

    case 'SET_MODULE_ACTIVE': {
      moduleManager.setModuleActive(action.moduleId, action.active);
      return {
        ...state,
        activeModules: moduleManager.getActiveModules(),
      };
    }

    case 'SELECT_MODULE':
      return {
        ...state,
        selectedModuleId: action.moduleId,
      };

    case 'SELECT_BUILDING':
      return {
        ...state,
        selectedBuildingId: action.buildingId,
      };

    case 'REGISTER_BUILDING': {
      moduleManager.registerBuilding(action.building);
      return {
        ...state,
        buildings: [...state.buildings, action.building],
      };
    }

    case 'UPDATE_ACTIVE_MODULES':
      return {
        ...state,
        activeModules: action.modules,
      };

    default:
      return state;
  }
}

// Context
interface ModuleContextType {
  state: ModuleState;
  dispatch: React.Dispatch<ModuleAction>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

// Provider
interface ModuleProviderProps {
  children: ReactNode;
}

export function ModuleProvider({ children }: ModuleProviderProps) {
  const [state, dispatch] = useReducer(moduleReducer, initialState);

  // Initialize state with default buildings
  useEffect(() => {
    const buildings = moduleManager.getBuildings();
    if (buildings.length > 0) {
      buildings.forEach(building => {
        dispatch({
          type: 'REGISTER_BUILDING',
          building,
        });
      });
    }
  }, []);

  return <ModuleContext.Provider value={{ state, dispatch }}>{children}</ModuleContext.Provider>;
}

// Hook
export function useModules() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
}

// Helper hooks
export function useSelectedModule() {
  const { state } = useModules();
  return state.selectedModuleId ? moduleManager.getModule(state.selectedModuleId) : undefined;
}

export function useSelectedBuilding() {
  const { state } = useModules();
  return state.selectedBuildingId ? moduleManager.getBuilding(state.selectedBuildingId) : undefined;
}

export function useModulesByType(type: ModuleType) {
  return moduleManager.getModulesByType(type);
}

export function useBuildingModules(buildingId: string) {
  return moduleManager.getBuildingModules(buildingId);
}

// Helper functions
export function canBuildModule(
  moduleType: ModuleType,
  cost: { minerals?: number; energy?: number }
) {
  const { state } = useGame();
  const { state: moduleState } = useModules();

  // Check resources
  const hasResources =
    (cost.minerals || 0) <= state.resources.minerals &&
    (cost.energy || 0) <= state.resources.energy;

  if (!hasResources) {
    return false;
  }

  // Find a suitable building and attachment point
  for (const building of moduleState.buildings) {
    for (const point of building.attachmentPoints) {
      if (point.allowedTypes.includes(moduleType) && !point.currentModule) {
        return true;
      }
    }
  }

  return false;
}

export function buildModule(moduleType: ModuleType, cost: { minerals?: number; energy?: number }) {
  const { dispatch, state } = useModules();

  // Find a suitable building and attachment point
  let targetBuilding: ModularBuilding | undefined;
  let targetPoint: string | undefined;

  for (const building of state.buildings) {
    for (const point of building.attachmentPoints) {
      if (point.allowedTypes.includes(moduleType) && !point.currentModule) {
        targetBuilding = building;
        targetPoint = point.id;
        break;
      }
    }
    if (targetBuilding) {
      break;
    }
  }

  if (!targetBuilding || !targetPoint) {
    console.error('No suitable attachment point found for module:', moduleType);
    return;
  }

  // Create and attach the module
  const position = targetBuilding.attachmentPoints.find(p => p.id === targetPoint)?.position || {
    x: 0,
    y: 0,
  };

  dispatch({
    type: 'CREATE_MODULE',
    moduleType,
    position,
  });

  // Get the newly created module's ID (it will be the last one created)
  const newModule = moduleManager.getModulesByType(moduleType).pop();
  if (!newModule) {
    console.error('Failed to create module:', moduleType);
    return;
  }

  // Attach the module
  dispatch({
    type: 'ATTACH_MODULE',
    moduleId: newModule.id,
    buildingId: targetBuilding.id,
    attachmentPointId: targetPoint,
  });

  // Activate the module
  dispatch({
    type: 'SET_MODULE_ACTIVE',
    moduleId: newModule.id,
    active: true,
  });
}
