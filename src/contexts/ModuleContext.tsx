import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { BaseModule, ModuleType, ModularBuilding } from '../types/buildings/ModuleTypes';
import { moduleManager } from '../lib/modules/ModuleManager';
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

  return (
    <ModuleContext.Provider value={{ state, dispatch }}>
      {children}
    </ModuleContext.Provider>
  );
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