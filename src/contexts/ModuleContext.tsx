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
import { errorLoggingService, ErrorSeverity, ErrorType } from '../services/logging/ErrorLoggingService';
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
  ACTIVATE_MODULE = 'module/activateModule',
  DEACTIVATE_MODULE = 'module/deactivateModule',
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
    selectedBuildingId?: string;
    building?: ModularBuilding;
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

export const createActivateModuleAction = (moduleId: string): ModuleAction => ({
  type: ModuleActionType.ACTIVATE_MODULE,
  payload: { moduleId },
});

export const createDeactivateModuleAction = (moduleId: string): ModuleAction => ({
  type: ModuleActionType.DEACTIVATE_MODULE,
  payload: { moduleId },
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
        isLoading: action.payload.isLoading ?? false,
      };
    case ModuleActionType.ACTIVATE_MODULE:
      if (!action.payload.moduleId) {
        return state;
      }
      
      // Add to active modules if not already present and update module status
      newActiveModuleIds = state.activeModuleIds.includes(action.payload.moduleId)
        ? state.activeModuleIds
        : [...state.activeModuleIds, action.payload.moduleId];
      
      return {
        ...state,
        activeModuleIds: newActiveModuleIds,
        modules: state.modules[action.payload.moduleId] ? {
          ...state.modules,
          [action.payload.moduleId]: {
            ...state.modules[action.payload.moduleId],
            status: 'active',
            isActive: true,
          },
        } : state.modules,
        lastUpdated: Date.now(),
      };
      
    case ModuleActionType.DEACTIVATE_MODULE:
      if (!action.payload.moduleId) {
        return state;
      }
      
      // Remove from active modules and update module status
      newActiveModuleIds = state.activeModuleIds.filter(id => id !== action.payload.moduleId);
      
      return {
        ...state,
        activeModuleIds: newActiveModuleIds,
        modules: state.modules[action.payload.moduleId] ? {
          ...state.modules,
          [action.payload.moduleId]: {
            ...state.modules[action.payload.moduleId],
            status: 'inactive',
            isActive: false,
          },
        } : state.modules,
        lastUpdated: Date.now(),
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
interface ModuleContextType {
  state: ModuleState;
  dispatch: React.Dispatch<ModuleAction>;
  manager?: IModuleManager; // Use the extended interface
}

// Create context
const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

// Provider props interface
interface ModuleProviderProps {
  children: ReactNode;
  manager?: IModuleManager;
  initialState?: Partial<ModuleState>;
}

// Type-safe helper for event subscriptions that accepts unknown event bus type
function subscribeToModuleEvent(
  eventBus: {
    subscribe: (eventType: EventType | '*', handler: (event: BaseEvent) => void) => () => void;
  },
  eventType: ModuleEventType,
  handler: (event: BaseEvent) => void
): () => void {
  // Convert ModuleEventType to EventType using our helper function
  const convertedType = moduleEventToEventType(eventType) as EventType;
  // Safely subscribe with unknown event bus type
  return eventBus.subscribe(convertedType, handler);
}

/**
 * Hook providing legacy action dispatching functionality
 * This is intended to be used inside components that need to dispatch legacy actions
 */
export function useDispatchLegacyAction(): (
  moduleId: string,
  action: string,
  data?: unknown
) => void {
  const { dispatch, manager } = useModuleContext();

  // Return the function that can be called by components
  return (moduleId: string, action: string, data?: unknown): void => {
    errorLoggingService.logWarn('[ModuleContext] Legacy dispatch is deprecated, use moduleManager instead', {
      componentName: 'ModuleContext',
      action: 'dispatchLegacyAction'
    });

    // First check if the module exists
    const module = manager?.getModule?.(moduleId);
    if (!module) {
      errorLoggingService.logError(`Module not found: ${moduleId}`, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
        componentName: 'ModuleContext',
        moduleId,
        action: 'dispatchLegacyAction'
      });
      return;
    }

    // Implement the legacy action handling
    switch (action) {
      case 'activate':
        // Use manager's activateModule if available, otherwise update via dispatch
        if (manager && typeof manager.activateModule === 'function') {
          manager.activateModule(moduleId);
        } else {
          // Fallback to dispatch
          dispatch(createUpdateModuleAction(moduleId, { status: 'active' }));
        }
        break;

      case 'deactivate':
        // Use manager's deactivateModule if available, otherwise update via dispatch
        if (manager && typeof manager.deactivateModule === 'function') {
          manager.deactivateModule(moduleId);
        } else {
          // Fallback to dispatch
          dispatch(createUpdateModuleAction(moduleId, { status: 'inactive' }));
        }
        break;

      case 'update':
        if (typeof data === 'object' && data !== null) {
          // Use dispatch for updates
          dispatch(createUpdateModuleAction(moduleId, data as Partial<Module>));
        } else {
          errorLoggingService.logError(`Invalid data for 'update' action on module ${moduleId}`, ErrorType.RUNTIME, ErrorSeverity.LOW, {
            componentName: 'ModuleContext',
            moduleId,
            action: 'dispatchLegacyAction'
          });
        }
        break;

      case 'delete':
        // Use dispatch for module removal
        dispatch(createRemoveModuleAction(moduleId));
        break;

      default:
        errorLoggingService.logError(`Unknown legacy action '${action}'`, ErrorType.RUNTIME, ErrorSeverity.LOW, {
          componentName: 'ModuleContext',
          moduleId,
          action: 'dispatchLegacyAction'
        });
    }
  };
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
        // Try to get all modules first, then active modules
        const allModules = manager.getModules?.() ?? [];
        const activeModules = manager.getActiveModules?.() ?? [];
        
        // Create module map from all modules
        const moduleMap = allModules.reduce((acc: Record<string, Module>, module: Module) => {
          acc[module.id] = module;
          return acc;
        }, {});

        // Get active module IDs from active modules
        const activeModuleIds = activeModules.map(m => m.id);

        return {
          ...initialState,
          modules: moduleMap,
          activeModuleIds,
          categories: manager.getModuleCategories?.() ?? [],
          buildings: manager.getBuildings?.() ?? [],
          ...(initialStateOverride ?? {}),
        };
      } catch (error) {
        errorLoggingService.logError(error instanceof Error ? error : new Error(String(error)), ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
          componentName: 'ModuleContext',
          action: 'initializeState'
        });
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
      // Check if the event has the data directly on the event object (test format)
      if ('module' in event) {
        const module = event.module as Module;
        dispatch(createAddModuleAction(module));
        return;
      }
      
      // Check if the event has the data in the data property (production format)
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
      // Check if the event has the data directly on the event object (test format)
      if ('moduleId' in event && 'updates' in event) {
        const moduleId = event.moduleId;
        const updates = event.updates as Partial<Module>;
        dispatch(createUpdateModuleAction(moduleId, updates));
        return;
      }
      
      // Check if the event has the data in the data property (production format)
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
      // Check if the event has the data directly on the event object (test format)
      if ('moduleId' in event && event.moduleId) {
        const moduleId = event.moduleId;
        dispatch(createRemoveModuleAction(moduleId));
        return;
      }
      
      // Check if the event has the data in the data property (production format)
      if (event?.data && typeof event.data === 'object' && 'moduleId' in event.data) {
        // Safely access moduleId property with proper type checking
        const eventData = event.data;
        if (eventData && 'moduleId' in eventData && eventData.moduleId) {
          const moduleId = eventData.moduleId as string;
          dispatch(createRemoveModuleAction(moduleId));
        }
      }
    };

    const handleModuleActivated = (event: BaseEvent) => {
      // Check if the event has the data directly on the event object (test format)
      if ('moduleId' in event && event.moduleId) {
        const moduleId = event.moduleId;
        dispatch(createActivateModuleAction(moduleId));
        return;
      }
      
      // Check if the event has the data in the data property (production format)
      if (event?.data && typeof event.data === 'object' && 'moduleId' in event.data) {
        const eventData = event.data;
        if (eventData && 'moduleId' in eventData && eventData.moduleId) {
          const moduleId = eventData.moduleId as string;
          dispatch(createActivateModuleAction(moduleId));
        }
      }
    };

    const handleModuleDeactivated = (event: BaseEvent) => {
      // Check if the event has the data directly on the event object (test format)
      if ('moduleId' in event && event.moduleId) {
        const moduleId = event.moduleId;
        dispatch(createDeactivateModuleAction(moduleId));
        return;
      }
      
      // Check if the event has the data in the data property (production format)
      if (event?.data && typeof event.data === 'object' && 'moduleId' in event.data) {
        const eventData = event.data;
        if (eventData && 'moduleId' in eventData && eventData.moduleId) {
          const moduleId = eventData.moduleId as string;
          dispatch(createDeactivateModuleAction(moduleId));
        }
      }
    };

    const handleStatusChanged = (event: BaseEvent) => {
      // Check if the event has the data directly on the event object (test format)
      if ('moduleId' in event && 'status' in event && event.moduleId && event.status) {
        const moduleId = event.moduleId;
        const status = event.status as ModuleStatus;
        dispatch(createUpdateModuleAction(moduleId, { status }));
        return;
      }
      
      // Check if the event has the data in the data property (production format)
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

    // Set up subscriptions directly using EventType enum values
    const unsubModuleCreated = moduleEvents.subscribe(EventType.MODULE_CREATED, handleModuleCreated);
    const unsubModuleUpdated = moduleEvents.subscribe(EventType.MODULE_UPDATED, handleModuleUpdated);
    const unsubModuleRemoved = moduleEvents.subscribe(EventType.MODULE_REMOVED, handleModuleRemoved);
    const unsubModuleActivated = moduleEvents.subscribe(EventType.MODULE_ACTIVATED, handleModuleActivated);
    const unsubModuleDeactivated = moduleEvents.subscribe(EventType.MODULE_DEACTIVATED, handleModuleDeactivated);
    const unsubStatusChanged = moduleEvents.subscribe(EventType.MODULE_STATUS_CHANGED, handleStatusChanged);

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
      if (unsubModuleActivated) {
        unsubModuleActivated();
      }
      if (unsubModuleDeactivated) {
        unsubModuleDeactivated();
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
        if (manager?.activateModule) {
          manager.activateModule(moduleId);
        }
      },
      [manager]
    ),

    deactivateModule: useCallback(
      (moduleId: string) => {
        if (manager?.deactivateModule) {
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
    errorLoggingService.logError('Resource manager not found', ErrorType.RUNTIME, ErrorSeverity.HIGH, {
      componentName: 'ModuleContext',
      action: 'canBuildModule'
    });
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
    errorLoggingService.logError(error instanceof Error ? error : new Error(String(error)), ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
      componentName: 'ModuleContext',
      action: 'canBuildModule'
    });
    return false;
  }

  if (currentMinerals < mineralCost || currentEnergy < energyCost) {
    errorLoggingService.logWarn(
      `Cannot build module: not enough resources. Needs ${mineralCost} minerals and ${energyCost} energy.`,
      { componentName: 'ModuleContext', action: 'canBuildModule' }
    );
    return false;
  }

  // Add other conditions as needed
  return true;
}

export function buildModule(
  moduleType: ModuleType,
  // Rename _cost to cost and remove the underscore since ESLint flags it
  cost: { minerals?: number; energy?: number }
) {
  // Maybe use cost within the method
  errorLoggingService.logInfo(`Building module of type ${moduleType}`, {
    componentName: 'ModuleContext',
    action: 'buildModule',
    cost
  });

  // Get the first colony building to attach the module to
  const buildings = moduleManagerWrapper.getBuildings();
  const targetBuilding = buildings.find(building => building.type === 'colony');

  if (!targetBuilding) {
    errorLoggingService.logError('No colony building found to attach module to', ErrorType.RUNTIME, ErrorSeverity.MEDIUM, { componentName: 'ModuleContext', action: 'buildModule' });
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
    errorLoggingService.logError('No available attachment points on colony building', ErrorType.RUNTIME, ErrorSeverity.MEDIUM, { componentName: 'ModuleContext', action: 'buildModule' });
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
    errorLoggingService.logError('Failed to create new module', ErrorType.RUNTIME, ErrorSeverity.MEDIUM, { componentName: 'ModuleContext', action: 'buildModule' });
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

// Placeholder for handling potential legacy actions if needed
const handleLegacyAction = (_action: string, _data: unknown) => {
  errorLoggingService.logWarn(`Received legacy action: ${_action}`, { componentName: 'ModuleContext', action: 'handleLegacyAction', data: _data });
};
