import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { BaseState } from '../lib/contexts/BaseContext';
import { serviceRegistry } from '../lib/managers/ServiceRegistry';
import { moduleManager } from '../managers/module/ModuleManager';
import { moduleManagerWrapper } from '../managers/module/ModuleManagerWrapper';
import { ModularBuilding, ModuleType } from '../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../types/events/EventTypes';
import {
  IModuleManager,
  LegacyModuleAction,
  Module,
  moduleEventToEventType,
  ModuleEventType,
  ModuleStatus,
} from '../types/modules/ModuleTypes';
import { ResourceType } from './../types/resources/ResourceTypes';

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
 * Interface for actions that can be dispatched to the module reducer
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
 * Interface defining the state structure for the module context
 */
export interface ModuleState extends BaseState {
  modules: Record<string, Module>;
  activeModuleIds: string[];
  selectedModuleId: string | null;
  categories: string[];
  buildings: ModularBuilding[]; // Needed for the helper functions
}

/**
 * Default initial state for the module context
 */
const initialState: ModuleState = {
  modules: {},
  activeModuleIds: [],
  selectedModuleId: null,
  categories: [],
  buildings: [],
  isLoading: false,
  error: null,
  lastUpdated: Date.now(),
};

// Action Creators

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

// Reducer function

export const moduleReducer = (state: ModuleState, action: ModuleAction): ModuleState => {
  // Define variables outside case blocks to satisfy linter
  let newActiveModuleIds: string[];
  let newSelectedModuleId: string | null;
  let removedModule: Module | undefined;
  let remainingModules: Record<string, Module>;

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

      // Define these outside case block to satisfy linter
      removedModule = state.modules[action.payload.moduleId];
      if (!removedModule) {
        return state;
      }

      // Create a new modules object without the removed module
      remainingModules = { ...state.modules };
      delete remainingModules[action.payload.moduleId];

      // Remove from active modules if present
      newActiveModuleIds = state.activeModuleIds.filter(id => id !== action.payload.moduleId);

      // Clear selected module if it's being removed
      newSelectedModuleId =
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
        selectedModuleId: action.payload.selectedModuleId ?? null,
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
        isLoading: action.payload.isLoading || false,
      };
    case ModuleActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload.error ?? null,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Selectors
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

// Context type definition
type ModuleContextType = {
  state: ModuleState;
  dispatch: React.Dispatch<ModuleAction>;
  manager?: IModuleManager; // Use the extended interface
};

// Create context
const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

// Provider props interface
interface ModuleProviderProps {
  children: ReactNode;
  manager?: IModuleManager;
  initialState?: Partial<ModuleState>;
}

// Type-safe helper for event subscriptions that accepts any event bus type
function subscribeToModuleEvent(
  eventBus: {
    subscribe: (eventType: EventType | '*', handler: (event: BaseEvent) => void) => () => void;
  },
  eventType: ModuleEventType,
  handler: (event: BaseEvent) => void
): () => void {
  // Convert ModuleEventType to EventType using our helper function
  const convertedType = moduleEventToEventType(eventType) as EventType;
  // Safely subscribe with any event bus type
  return eventBus.subscribe(convertedType, handler);
}

// Helper for type-safe dispatch of legacy actions
function _dispatchLegacyAction(manager: IModuleManager, action: LegacyModuleAction): void {
  if (manager.dispatch) {
    manager.dispatch(action as unknown as { type: string });
  } else {
    console.warn('Manager does not support dispatch method:', action);
  }
}

// Provider component
export const ModuleProvider: React.FC<ModuleProviderProps> = ({
  children,
  manager = moduleManagerWrapper, // Use the wrapper which implements IModuleManager
  initialState: initialStateOverride,
}) => {
  // Create effective initial state
  const effectiveInitialState = useMemo(() => {
    // Get initial modules from manager if available
    if (manager) {
      try {
        const modules = manager.getActiveModules() ?? [];
        const moduleMap = modules.reduce((acc: Record<string, Module>, module: Module) => {
          acc[module.id] = module;
          return acc;
        }, {});

        return {
          ...initialState,
          modules: moduleMap,
          activeModuleIds: modules.map(m => m.id),
          categories: manager.getModuleCategories?.() ?? [],
          buildings: manager.getBuildings?.() ?? [],
          ...(initialStateOverride ?? {}),
        };
      } catch (error) {
        console.error('Error initializing module state from manager:', error);
      }
    }

    return { ...initialState, ...(initialStateOverride ?? {}) };
  }, [manager, initialStateOverride]);

  // Create reducer
  const [state, dispatch] = useReducer(moduleReducer, effectiveInitialState);

  // Set up event subscriptions
  useEffect(() => {
    if (!manager) {
      return undefined;
    }

    // Use eventBus instead of 'events' - fixed property name
    const moduleEvents = manager.eventBus;
    if (!moduleEvents) {
      return undefined;
    }

    // Module event handlers
    const handleModuleCreated = (event: BaseEvent) => {
      if (event?.data && typeof event.data === 'object' && 'module' in event.data) {
        // Safely access module property with proper type checking
        const moduleData = event.data;
        if (moduleData && 'module' in moduleData && moduleData.module) {
          const module = moduleData.module as Module;
          dispatch(createAddModuleAction(module));
        }
      }
    };

    const handleModuleUpdated = (event: BaseEvent) => {
      if (
        event?.data &&
        typeof event.data === 'object' &&
        'moduleId' in event.data &&
        'updates' in event.data
      ) {
        // Safely extract values with proper type checking
        const eventData = event.data;
        if (eventData && 'moduleId' in eventData && 'updates' in eventData) {
          const moduleId = eventData.moduleId as string;
          const updates = eventData.updates as Partial<Module>;
          dispatch(createUpdateModuleAction(moduleId, updates));
        }
      }
    };

    const handleModuleRemoved = (event: BaseEvent) => {
      if (event?.data && typeof event.data === 'object' && 'moduleId' in event.data) {
        // Safely access moduleId property with proper type checking
        const eventData = event.data;
        if (eventData && 'moduleId' in eventData && eventData.moduleId) {
          const moduleId = eventData.moduleId as string;
          dispatch(createRemoveModuleAction(moduleId));
        }
      }
    };

    const handleStatusChanged = (event: BaseEvent) => {
      if (
        event?.data &&
        typeof event.data === 'object' &&
        'moduleId' in event.data &&
        'status' in event.data
      ) {
        // Safely extract values with proper type checking
        const eventData = event.data;
        if (eventData && 'moduleId' in eventData && 'status' in eventData) {
          const moduleId = eventData.moduleId as string;
          const status = eventData.status as ModuleStatus;
          dispatch(createUpdateModuleAction(moduleId, { status }));
        }
      }
    };

    // Set up subscriptions using type-safe wrapper
    const unsubModuleCreated = subscribeToModuleEvent(
      moduleEvents,
      ModuleEventType.MODULE_CREATED,
      handleModuleCreated
    );

    const unsubModuleUpdated = subscribeToModuleEvent(
      moduleEvents,
      ModuleEventType.MODULE_UPDATED,
      handleModuleUpdated
    );

    const unsubModuleRemoved = subscribeToModuleEvent(
      moduleEvents,
      ModuleEventType.MODULE_REMOVED,
      handleModuleRemoved
    );

    const unsubStatusChanged = subscribeToModuleEvent(
      moduleEvents,
      ModuleEventType.MODULE_STATUS_CHANGED,
      handleStatusChanged
    );

    // Clean up subscriptions
    return () => {
      if (unsubModuleCreated) {
        unsubModuleCreated();
      }
      if (unsubModuleUpdated) {
        unsubModuleUpdated();
      }
      if (unsubModuleRemoved) {
        unsubModuleRemoved();
      }
      if (unsubStatusChanged) {
        unsubStatusChanged();
      }
    };
  }, [manager]);

  // Create context value
  const contextValue = useMemo(() => ({ state, dispatch, manager }), [state, manager]);

  return <ModuleContext.Provider value={contextValue}>{children}</ModuleContext.Provider>;
};

// Hooks

// Generic module state selector hook
export const useModules = <T,>(selector: (state: ModuleState) => T): T => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return selector(context.state);
};

// Hook to access the full context
export const useModuleContext = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleContext must be used within a ModuleProvider');
  }
  return context;
};

// Hook to get the dispatch function only
export const useModuleDispatch = (): React.Dispatch<ModuleAction> => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleDispatch must be used within a ModuleProvider');
  }
  return context.dispatch;
};

// Specialized hooks
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

// Module action hooks
export const useModuleActions = () => {
  const { dispatch, manager } = useModuleContext();

  return {
    addModule: useCallback(
      (module: Module) => {
        dispatch(createAddModuleAction(module));
      },
      [dispatch]
    ),

    updateModule: useCallback(
      (moduleId: string, updates: Partial<Module>) => {
        dispatch(createUpdateModuleAction(moduleId, updates));
      },
      [dispatch]
    ),

    removeModule: useCallback(
      (moduleId: string) => {
        dispatch(createRemoveModuleAction(moduleId));
      },
      [dispatch]
    ),

    selectModule: useCallback(
      (moduleId: string | null) => {
        dispatch(createSelectModuleAction(moduleId));
      },
      [dispatch]
    ),

    setActiveModules: useCallback(
      (activeModuleIds: string[]) => {
        dispatch(createSetActiveModulesAction(activeModuleIds));
      },
      [dispatch]
    ),

    setCategories: useCallback(
      (categories: string[]) => {
        dispatch(createSetCategoriesAction(categories));
      },
      [dispatch]
    ),

    activateModule: useCallback(
      (moduleId: string) => {
        if (manager && manager.activateModule) {
          manager.activateModule(moduleId);
        }
      },
      [manager]
    ),

    deactivateModule: useCallback(
      (moduleId: string) => {
        if (manager && manager.deactivateModule) {
          manager.deactivateModule(moduleId);
        }
      },
      [manager]
    ),
  };
};

// Helper hooks for building-related functionality
export function useSelectedBuilding() {
  const selectedModule = useSelectedModule();
  return selectedModule?.buildingId && moduleManager.getBuilding
    ? moduleManager.getBuilding(selectedModule.buildingId)
    : null;
}

export function useBuildingModules(buildingId: string) {
  return useModules(state => Object.values(state.modules).filter(m => m.buildingId === buildingId));
}

export function canBuildModule(
  _moduleType: ModuleType,
  cost: { minerals?: number; energy?: number }
) {
  const mineralCost = cost.minerals ?? 0;
  const energyCost = cost.energy ?? 0;

  // Check if the player has enough resources
  const resourceManager = serviceRegistry.getService('ResourceManager');
  if (!resourceManager) {
    console.error('Resource manager not found');
    return false;
  }

  // Safely access resource amounts
  let currentMinerals = 0;
  let currentEnergy = 0;

  try {
    // Type assertion to a more specific interface with getResourceAmount
    const typedResourceManager = resourceManager as unknown as {
      getResourceAmount: (resourceType: ResourceType) => number;
    };

    currentMinerals = typedResourceManager.getResourceAmount(ResourceType.MINERALS) ?? 0;
    currentEnergy = typedResourceManager.getResourceAmount(ResourceType.ENERGY) ?? 0;
  } catch (error) {
    console.error('Error getting resource amounts:', error);
    return false;
  }

  if (currentMinerals < mineralCost || currentEnergy < energyCost) {
    console.warn(
      `Cannot build module: not enough resources. Needs ${mineralCost} minerals and ${energyCost} energy.`
    );
    return false;
  }

  // Add other conditions as needed
  return true;
}

export function buildModule(moduleType: ModuleType, _cost: { minerals?: number; energy?: number }) {
  // Get the first colony building to attach the module to
  const buildings = moduleManagerWrapper.getBuildings();
  const targetBuilding = buildings.find(building => building.type === 'colony');

  if (!targetBuilding) {
    console.error('No colony building found to attach module to');
    return;
  }

  // Get an available attachment point
  const attachmentPoints = targetBuilding.attachmentPoints ?? [];

  // Find modules attached to this building
  const modules = moduleManagerWrapper.getModules();

  const usedPoints = modules
    .filter((module: Module) => module.buildingId === targetBuilding.id)
    .map((module: Module) => module.attachmentPointId)
    .filter(Boolean) as string[];

  const availablePoints = attachmentPoints.filter(point => !usedPoints.includes(point.id));

  if (availablePoints.length === 0) {
    console.error('No available attachment points on colony building');
    return;
  }

  const targetPoint = availablePoints[0].id;

  // Create the module
  const position = { x: Math.random() * 100, y: Math.random() * 100 };

  // Use safer type assertion with LegacyModuleAction interface
  const legacyCreateAction: LegacyModuleAction = {
    type: 'CREATE_MODULE',
    moduleType,
    position,
  };

  moduleManagerWrapper.dispatch(legacyCreateAction);

  // Get the newly created module's ID (it will be the last one created)
  const newModule = moduleManagerWrapper.getModulesByType(moduleType).pop();

  if (!newModule) {
    console.error('Failed to create new module');
    return;
  }

  // Attach the module to the building
  const legacyAttachAction: LegacyModuleAction = {
    type: 'ATTACH_MODULE',
    moduleId: newModule.id,
    buildingId: targetBuilding.id,
    attachmentPointId: targetPoint,
  };

  moduleManagerWrapper.dispatch(legacyAttachAction);

  // Activate the module
  const legacyActivateAction: LegacyModuleAction = {
    type: 'SET_MODULE_ACTIVE',
    moduleId: newModule.id,
    active: true,
  };

  moduleManagerWrapper.dispatch(legacyActivateAction);
}
