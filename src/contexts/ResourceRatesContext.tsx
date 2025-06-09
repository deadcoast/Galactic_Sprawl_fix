import * as React from 'react';
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { ResourceManager } from '../managers/game/ResourceManager';
import { BaseEvent, EventType } from '../types/events/EventTypes';
import { ResourceType } from './../types/resources/ResourceTypes';

/**
 * We're focusing only on the core resources for this context
 */
// Replace string-based type with enum
type _CoreResourceType =
  | ResourceType.MINERALS
  | ResourceType.ENERGY
  | ResourceType.POPULATION
  | ResourceType.RESEARCH;

/**
 * Interface for resource rates, including production, consumption and net rate
 */
interface ResourceRateDetail {
  production: number;
  consumption: number;
  net: number; // net rate (production - consumption)
}

/**
 * Enum for action types to ensure type safety
 */
export enum ResourceRatesActionType {
  UPDATE_RESOURCE_RATE = 'resourceRates/updateResourceRate',
  UPDATE_ALL_RATES = 'resourceRates/updateAllRates',
  RESET_RATES = 'resourceRates/resetRates',
  SET_LOADING = 'resourceRates/setLoading',
  SET_ERROR = 'resourceRates/setError',
}

/**
 * Type for actions that can be dispatched to the context
 */
export interface ResourceRatesAction {
  type: ResourceRatesActionType;
  payload: {
    resourceType?: ResourceType;
    rates?: ResourceRateDetail;
    allRates?: Record<ResourceType, ResourceRateDetail>;
    isLoading?: boolean;
    error?: string | null;
  };
}

/**
 * State interface extended with BaseState for standardized properties
 */
export interface ResourceRatesState {
  resourceRates: Record<ResourceType, ResourceRateDetail>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

/**
 * Default state with all rates at zero
 */
const defaultResourceRates: Record<ResourceType, ResourceRateDetail> = {
  [ResourceType.FOOD]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.MINERALS]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.ENERGY]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.POPULATION]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.RESEARCH]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.PLASMA]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.GAS]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.EXOTIC]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.ORGANIC]: { production: 0, consumption: 0, net: 0 },
  // Add missing resource types
  [ResourceType.IRON]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.COPPER]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.TITANIUM]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.URANIUM]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.WATER]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.HELIUM]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.DEUTERIUM]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.ANTIMATTER]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.DARK_MATTER]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.EXOTIC_MATTER]: { production: 0, consumption: 0, net: 0 },
};

/**
 * The initial state including BaseState properties
 */
const initialState: ResourceRatesState = {
  resourceRates: defaultResourceRates,
  isLoading: false,
  error: null,
  lastUpdated: Date.now(),
};

/**
 * Action creators for type-safe dispatch
 */
export const createUpdateRateAction = (
  resourceType: ResourceType,
  rates: ResourceRateDetail
): ResourceRatesAction => ({
  type: ResourceRatesActionType.UPDATE_RESOURCE_RATE,
  payload: { resourceType, rates },
});

export const createUpdateAllRatesAction = (
  allRates: Record<ResourceType, ResourceRateDetail>
): ResourceRatesAction => ({
  type: ResourceRatesActionType.UPDATE_ALL_RATES,
  payload: { allRates },
});

export const createResetRatesAction = (): ResourceRatesAction => ({
  type: ResourceRatesActionType.RESET_RATES,
  payload: {},
});

export const createSetLoadingAction = (isLoading: boolean): ResourceRatesAction => ({
  type: ResourceRatesActionType.SET_LOADING,
  payload: { isLoading },
});

export const createSetErrorAction = (error: string | null): ResourceRatesAction => ({
  type: ResourceRatesActionType.SET_ERROR,
  payload: { error },
});

/**
 * Helper function to calculate resource rates from event data
 */
const calculateRatesFromEvent = (event: BaseEvent): ResourceRateDetail => {
  // Extract resource rate data from event
  // This implementation would depend on the event structure
  const { production = 0, consumption = 0 } =
    (event?.data as { production?: number; consumption?: number }) ?? {};

  return {
    production,
    consumption,
    net: production - consumption,
  };
};

/**
 * Reducer function for state updates
 */
export const resourceRatesReducer = (
  state: ResourceRatesState,
  action: ResourceRatesAction
): ResourceRatesState => {
  switch (action.type) {
    case ResourceRatesActionType.UPDATE_RESOURCE_RATE:
      if (!action.payload.resourceType || !action.payload.rates) {
        return state;
      }
      return {
        ...state,
        resourceRates: {
          ...state.resourceRates,
          [action.payload.resourceType]: action.payload.rates,
        },
        lastUpdated: Date.now(),
      };

    case ResourceRatesActionType.UPDATE_ALL_RATES:
      if (!action.payload.allRates) {
        return state;
      }
      return {
        ...state,
        resourceRates: action.payload.allRates,
        lastUpdated: Date.now(),
      };

    case ResourceRatesActionType.RESET_RATES:
      return {
        ...state,
        resourceRates: defaultResourceRates,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      };

    case ResourceRatesActionType.SET_LOADING:
      return {
        ...state,
        isLoading: !!action.payload.isLoading,
      };

    case ResourceRatesActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload.error ?? null,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Create context
interface ResourceRatesContextType {
  state: ResourceRatesState;
  dispatch: React.Dispatch<ResourceRatesAction>;
}

const ResourceRatesContext = createContext<ResourceRatesContextType | undefined>(undefined);

// Provider component
export const ResourceRatesProvider: React.FC<{
  children: React.ReactNode;
  manager?: ResourceManager;
  initialState?: Partial<ResourceRatesState>;
}> = ({ children, manager, initialState: initialStateOverride }) => {
  // Get initial state from ResourceManager if available
  const effectiveInitialState = useMemo((): ResourceRatesState => {
    if (manager) {
      try {
        // Ensure we have a complete set of resource rates
        const managerRates = manager.getAllResourceRates?.() ?? {};
        const rates = { ...defaultResourceRates, ...managerRates };

        return {
          ...initialState,
          resourceRates: rates,
          ...(initialStateOverride ?? {}),
        } as ResourceRatesState;
      } catch (error) {
        console.error('Error getting resource rates from manager:', error);
      }
    }
    return { ...initialState, ...(initialStateOverride ?? {}) } as ResourceRatesState;
  }, [manager, initialStateOverride]);

  // Create reducer
  const [state, dispatch] = useReducer(resourceRatesReducer, effectiveInitialState);

  // Set up event subscriptions with the manager when provided
  useEffect(() => {
    if (manager) {
      // Create event handler with dispatch
      const eventHandler = (event: BaseEvent) => {
        if (event.data && typeof event.data === 'object' && 'resourceType' in event.data) {
          const resourceType = event.data.resourceType as ResourceType;
          const rates = calculateRatesFromEvent(event);
          dispatch(createUpdateRateAction(resourceType, rates));
        }
      };

      // Set up event subscriptions
      const unsubscribeResourceUpdated = manager.subscribeToEvent(
        EventType.RESOURCE_UPDATED,
        eventHandler
      );

      const unsubscribeResourceProduced = manager.subscribeToEvent(
        EventType.RESOURCE_PRODUCED,
        eventHandler
      );

      const unsubscribeResourceConsumed = manager.subscribeToEvent(
        EventType.RESOURCE_CONSUMED,
        eventHandler
      );

      // Clean up subscriptions
      return () => {
        unsubscribeResourceUpdated();
        unsubscribeResourceProduced();
        unsubscribeResourceConsumed();
      };
    }
    return undefined;
  }, [manager]);

  // Create context value
  const contextValue = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <ResourceRatesContext.Provider value={contextValue}>{children}</ResourceRatesContext.Provider>
  );
};

// Hook to use the context
export const useResourceRates = <T,>(selector: (state: ResourceRatesState) => T): T => {
  const context = useContext(ResourceRatesContext);
  if (!context) {
    throw new Error('useResourceRates must be used within a ResourceRatesProvider');
  }
  return selector(context.state);
};

// Hook to use the dispatch function
export const useResourceRatesDispatch = (): React.Dispatch<ResourceRatesAction> => {
  const context = useContext(ResourceRatesContext);
  if (!context) {
    throw new Error('useResourceRatesDispatch must be used within a ResourceRatesProvider');
  }
  return context.dispatch;
};

// Specialized hooks for specific resource types
export const useResourceRate = (resourceType: ResourceType): ResourceRateDetail => {
  return useResourceRates((state: ResourceRatesState) => state.resourceRates[resourceType]);
};

export const useNetResourceRate = (resourceType: ResourceType): number => {
  return useResourceRates((state: ResourceRatesState) => {
    const rates = state.resourceRates[resourceType];
    return rates ? rates.net : 0;
  });
};

// Hook to access all resource rates at once
export const useAllResourceRates = () => {
  return useResourceRates((state: ResourceRatesState) => ({
    minerals: state.resourceRates[ResourceType.MINERALS],
    energy: state.resourceRates[ResourceType.ENERGY],
    population: state.resourceRates[ResourceType.POPULATION],
    research: state.resourceRates[ResourceType.RESEARCH],
    plasma: state.resourceRates[ResourceType.PLASMA],
    gas: state.resourceRates[ResourceType.GAS],
    exotic: state.resourceRates[ResourceType.EXOTIC],
  }));
};
