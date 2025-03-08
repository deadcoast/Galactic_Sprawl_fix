import { useGame } from '../contexts/GameContext';
import { BaseState, createStandardContext, ManagerConfig } from '../lib/contexts/BaseContext';
import { moduleManager } from '../managers/module/ModuleManager';
import { ModularBuilding, ModuleType } from '../types/buildings/ModuleTypes';
import { EventType } from '../types/events/EventTypes';
import { Module, ModuleStatus } from '../types/modules/ModuleTypes';
import { ModuleManager } from '../managers/module/ModuleManager';

/**
 * Enum for action types to ensure type safety
 */
export enum ModuleActionType {
  ADD_MODULE = 'module/addModule',
  UPDATE_MODULE = 'module/updateModule',
  REMOVE_MODULE = 'module/removeModule',
  SELECT_MODULE = 'module/selectModule',
  SET_ACTIVE_MODULES = 'module/setActiveModules',
  SET_CATEGORIES = 'module/setCategories',
  SET_LOADING = 'module/setLoading',
  SET_ERROR = 'module/setError',
}

/**
 * Type for actions that can be dispatched to the context
 */
export interface ModuleAction {
  type: ModuleActionType;
  payload: {
    module?: Module;
    moduleId?: string;
    updates?: Partial<Module>;
    activeModuleIds?: string[];
    selectedModuleId?: string | null;
    categories?: string[];
    isLoading?: boolean;
    error?: string | null;
  };
}

/**
 * State interface extended with BaseState for standardized properties
 */
export interface ModuleState extends BaseState {
  modules: Record<string, Module>;
  activeModuleIds: string[];
  selectedModuleId: string | null;
  categories: string[];
}

/**
 * The initial state
 */
const initialState: ModuleState = {
  modules: {},
  activeModuleIds: [],
  selectedModuleId: null,
  categories: [],
  isLoading: false,
  error: null,
  lastUpdated: Date.now(),
};

/**
 * Action creators for type-safe dispatch
 */
export const createAddModuleAction = (module: Module): ModuleAction => ({
  type: ModuleActionType.ADD_MODULE,
  payload: { module },
});

export const createUpdateModuleAction = (
  moduleId: string,
  updates: Partial<Module>
): ModuleAction => ({
  type: ModuleActionType.UPDATE_MODULE,
  payload: { moduleId, updates },
});

export const createRemoveModuleAction = (moduleId: string): ModuleAction => ({
  type: ModuleActionType.REMOVE_MODULE,
  payload: { moduleId },
});

export const createSelectModuleAction = (selectedModuleId: string | null): ModuleAction => ({
  type: ModuleActionType.SELECT_MODULE,
  payload: { selectedModuleId },
});

export const createSetActiveModulesAction = (activeModuleIds: string[]): ModuleAction => ({
  type: ModuleActionType.SET_ACTIVE_MODULES,
  payload: { activeModuleIds },
});

export const createSetCategoriesAction = (categories: string[]): ModuleAction => ({
  type: ModuleActionType.SET_CATEGORIES,
  payload: { categories },
});

export const createSetLoadingAction = (isLoading: boolean): ModuleAction => ({
  type: ModuleActionType.SET_LOADING,
  payload: { isLoading },
});

export const createSetErrorAction = (error: string | null): ModuleAction => ({
  type: ModuleActionType.SET_ERROR,
  payload: { error },
});

/**
 * Reducer function for state updates
 */
export const moduleReducer = (state: ModuleState, action: ModuleAction): ModuleState => {
  switch (action.type) {
    case ModuleActionType.ADD_MODULE:
      if (!action.payload.module) {
        return state;
      }
      return {
        ...state,
        modules: {
          ...state.modules,
          [action.payload.module.id]: action.payload.module,
        },
        lastUpdated: Date.now(),
      };

    case ModuleActionType.UPDATE_MODULE:
      if (!action.payload.moduleId || !action.payload.updates) {
        return state;
      }

      // Check if the module exists
      if (!state.modules[action.payload.moduleId]) {
        return state;
      }

      return {
        ...state,
        modules: {
          ...state.modules,
          [action.payload.moduleId]: {
            ...state.modules[action.payload.moduleId],
            ...action.payload.updates,
          },
        },
        lastUpdated: Date.now(),
      };

    case ModuleActionType.REMOVE_MODULE:
      if (!action.payload.moduleId) {
        return state;
      }

      // Create a new modules object without the removed module
      const { [action.payload.moduleId]: removedModule, ...remainingModules } = state.modules;

      // Remove from active modules if present
      const newActiveModuleIds = state.activeModuleIds.filter(id => id !== action.payload.moduleId);

      // Clear selected module if it's the one being removed
      const newSelectedModuleId =
        state.selectedModuleId === action.payload.moduleId ? null : state.selectedModuleId;

      return {
        ...state,
        modules: remainingModules,
        activeModuleIds: newActiveModuleIds,
        selectedModuleId: newSelectedModuleId,
        lastUpdated: Date.now(),
      };

    case ModuleActionType.SELECT_MODULE:
      return {
        ...state,
        selectedModuleId: action.payload.selectedModuleId || null,
        lastUpdated: Date.now(),
      };

    case ModuleActionType.SET_ACTIVE_MODULES:
      if (!action.payload.activeModuleIds) {
        return state;
      }

      return {
        ...state,
        activeModuleIds: action.payload.activeModuleIds,
        lastUpdated: Date.now(),
      };

    case ModuleActionType.SET_CATEGORIES:
      if (!action.payload.categories) {
        return state;
      }

      return {
        ...state,
        categories: action.payload.categories,
        lastUpdated: Date.now(),
      };

    case ModuleActionType.SET_LOADING:
      return {
        ...state,
        isLoading: !!action.payload.isLoading,
      };

    case ModuleActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
      };

    default:
      return state;
  }
};

/**
 * Memoized selectors for performance optimization
 */
export const selectModules = (state: ModuleState) => state.modules;
export const selectModuleById = (state: ModuleState, id: string) => state.modules[id];
export const selectActiveModules = (state: ModuleState) => {
  return state.activeModuleIds.map(id => state.modules[id]).filter(Boolean);
};
export const selectSelectedModule = (state: ModuleState) => {
  return state.selectedModuleId ? state.modules[state.selectedModuleId] : null;
};
export const selectCategories = (state: ModuleState) => state.categories;
export const selectModulesByType = (state: ModuleState, type: ModuleType) => {
  return Object.values(state.modules).filter(module => module.type === type);
};
export const selectModulesByStatus = (state: ModuleState, status: ModuleStatus) => {
  return Object.values(state.modules).filter(module => module.status === status);
};

// Define module-specific event types
enum ModuleEventType {
  MODULE_CREATED = 'MODULE_CREATED',
  MODULE_UPDATED = 'MODULE_UPDATED',
  MODULE_REMOVED = 'MODULE_REMOVED',
  MODULE_STATUS_CHANGED = 'MODULE_STATUS_CHANGED'
}

/**
 * Configuration for connecting with ModuleManager
 */
const managerConfig: ManagerConfig<ModuleState, ModuleManager> = {
  connect: (manager: ModuleManager, dispatch: (action: ModuleAction) => void) => {
    // Subscribe to module events
    const unsubscribeModuleCreated = manager.subscribeToEvent(
      ModuleEventType.MODULE_CREATED as unknown as EventType,
      (event: any) => {
        if (event.data && event.data.module) {
          dispatch(createAddModuleAction(event.data.module));
        }
      }
    );
    
    const unsubscribeModuleUpdated = manager.subscribeToEvent(
      ModuleEventType.MODULE_UPDATED as unknown as EventType,
      (event: any) => {
        if (event.data && event.data.moduleId && event.data.updates) {
          dispatch(createUpdateModuleAction(event.data.moduleId, event.data.updates));
        }
      }
    );
    
    const unsubscribeModuleRemoved = manager.subscribeToEvent(
      ModuleEventType.MODULE_REMOVED as unknown as EventType,
      (event: any) => {
        if (event.data && event.data.moduleId) {
          dispatch(createRemoveModuleAction(event.data.moduleId));
        }
      }
    );
    
    const unsubscribeModuleStatusChanged = manager.subscribeToEvent(
      ModuleEventType.MODULE_STATUS_CHANGED as unknown as EventType,
      (event: any) => {
        if (event.data && event.data.moduleId && event.data.status) {
          dispatch(createUpdateModuleAction(event.data.moduleId, { status: event.data.status }));
        }
      }
    );
    
    // Return cleanup function
    return () => {
      unsubscribeModuleCreated();
      unsubscribeModuleUpdated();
      unsubscribeModuleRemoved();
      unsubscribeModuleStatusChanged();
    };
  },
  
  getInitialState: (manager: ModuleManager) => {
    // Get initial modules and state
    const modules = manager.getAllModules?.() || [];
    const moduleMap = modules.reduce(
      (acc, module) => {
        acc[module.id] = module;
        return acc;
      },
      {} as Record<string, Module>
    );
    
    return {
      modules: moduleMap,
      activeModuleIds: manager.getActiveModuleIds?.() || [],
      selectedModuleId: null,
      categories: manager.getModuleCategories?.() || [],
      isLoading: false,
      error: null,
      lastUpdated: Date.now(),
    };
  }
};

/**
 * Create the context provider and hook using the standard template
 */
export const [ModuleProvider, useModulesBase] = createStandardContext<
  ModuleState,
  ModuleAction,
  ModuleManager
>({
  name: 'Module',
  reducer: moduleReducer,
  initialState,
  managerConfig,
});

/**
 * Enhanced hook with selectors
 */
export const useModules = useModulesBase;

/**
 * Specialized hooks for specific module data
 */
export const useModule = (moduleId: string): Module | undefined => {
  return useModules(state => selectModuleById(state, moduleId));
};

export const useActiveModules = (): Module[] => {
  return useModules(selectActiveModules);
};

export const useSelectedModule = (): Module | null => {
  return useModules(selectSelectedModule);
};

export const useModuleCategories = (): string[] => {
  return useModules(selectCategories);
};

export const useModulesByType = (type: ModuleType): Module[] => {
  return useModules(state => selectModulesByType(state, type));
};

export const useModulesByStatus = (status: ModuleStatus): Module[] => {
  return useModules(state => selectModulesByStatus(state, status));
};

/**
 * Hook for module actions
 */
export const useModuleActions = () => {
  const dispatch = useModules(state => state.dispatch);
  
  return {
    addModule: (module: Module) => dispatch(createAddModuleAction(module)),
    updateModule: (moduleId: string, updates: Partial<Module>) => 
      dispatch(createUpdateModuleAction(moduleId, updates)),
    removeModule: (moduleId: string) => dispatch(createRemoveModuleAction(moduleId)),
    selectModule: (moduleId: string | null) => dispatch(createSelectModuleAction(moduleId)),
    setActiveModules: (moduleIds: string[]) => dispatch(createSetActiveModulesAction(moduleIds)),
  };
};

// Helper hooks
export function useSelectedBuilding() {
  const { state } = useModules();
  return state.selectedModuleId ? moduleManager.getModule(state.selectedModuleId) : undefined;
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

export function buildModule(moduleType: ModuleType, _cost: { minerals?: number; energy?: number }) {
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
