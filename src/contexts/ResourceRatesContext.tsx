import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ModuleEvent, moduleEventBus } from '../lib/modules/ModuleEvents';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';
import { useModules } from './ModuleContext';

/**
 * We're focusing only on the core resources for this context
 */
// Replace string-based type with enum
type CoreResourceType =
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
 * State interface for ResourceRatesContext
 */
interface ResourceRatesState {
  [ResourceType.MINERALS]: ResourceRateDetail;
  [ResourceType.ENERGY]: ResourceRateDetail;
  [ResourceType.POPULATION]: ResourceRateDetail;
  [ResourceType.RESEARCH]: ResourceRateDetail;
  lastUpdated: number;
}

/**
 * Default state with all rates at zero
 */
const defaultResourceRates: ResourceRatesState = {
  [ResourceType.MINERALS]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.ENERGY]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.POPULATION]: { production: 0, consumption: 0, net: 0 },
  [ResourceType.RESEARCH]: { production: 0, consumption: 0, net: 0 },
  lastUpdated: Date.now(),
};

/**
 * Context type including the state and update methods
 */
interface ResourceRatesContextType {
  state: ResourceRatesState;
  updateRates: (type: CoreResourceType, production: number, consumption: number) => void;
  resetRates: () => void;
}

// Create the context
const ResourceRatesContext = createContext<ResourceRatesContextType | undefined>(undefined);

/**
 * Provider component for resource rates
 */
export function ResourceRatesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResourceRatesState>(defaultResourceRates);
  const { modules } = useModules();

  // Update rates for a specific resource type
  const updateRates = (type: CoreResourceType, production: number, consumption: number) => {
    setState(prevState => ({
      ...prevState,
      [type]: {
        production,
        consumption,
        net: production - consumption,
      },
      lastUpdated: Date.now(),
    }));
  };

  // Reset all rates to zero
  const resetRates = () => {
    setState(defaultResourceRates);
  };

  // Subscribe to resource update events
  useEffect(() => {
    const handleResourceUpdate = (event: ModuleEvent) => {
      const { data } = event;

      if (data && data.resourceType) {
        // Check if this is a core resource type we're tracking
        const resourceType = data.resourceType as CoreResourceType;

        // For compatibility with legacy code that might use string types
        if (typeof resourceType === 'string') {
          // Convert string type to enum if needed (this would be handled by ResourceTypeHelpers
          // but we're keeping this simple for this example)
          let enumType: CoreResourceType | undefined;

          switch (resourceType) {
            case 'minerals':
              enumType = ResourceType.MINERALS;
              break;
            case 'energy':
              enumType = ResourceType.ENERGY;
              break;
            case 'population':
              enumType = ResourceType.POPULATION;
              break;
            case 'research':
              enumType = ResourceType.RESEARCH;
              break;
          }

          if (enumType && state[enumType]) {
            let production = state[enumType].production;
            let consumption = state[enumType].consumption;

            if (data.production !== undefined) {
              production = data.production;
            }
            if (data.consumption !== undefined) {
              consumption = data.consumption;
            }

            updateRates(enumType, production, consumption);
          }
        }
        // If it's already an enum type
        else if (state[resourceType]) {
          let production = state[resourceType].production;
          let consumption = state[resourceType].consumption;

          if (data.production !== undefined) {
            production = data.production;
          }
          if (data.consumption !== undefined) {
            consumption = data.consumption;
          }

          updateRates(resourceType, production, consumption);
        }
      }
    };

    moduleEventBus.subscribe('RESOURCE_UPDATED', handleResourceUpdate);
    moduleEventBus.subscribe('RESOURCE_PRODUCED', handleResourceUpdate);
    moduleEventBus.subscribe('RESOURCE_CONSUMED', handleResourceUpdate);

    return () => {
      moduleEventBus.unsubscribe('RESOURCE_UPDATED', handleResourceUpdate);
      moduleEventBus.unsubscribe('RESOURCE_PRODUCED', handleResourceUpdate);
      moduleEventBus.unsubscribe('RESOURCE_CONSUMED', handleResourceUpdate);
    };
  }, [state]);

  // Calculate initial rates from modules
  useEffect(() => {
    const calculateInitialRates = () => {
      // Map to hold the calculated rates
      const rates: Partial<Record<CoreResourceType, ResourceRateDetail>> = {};

      // Initialize with zeros
      rates[ResourceType.MINERALS] = { production: 0, consumption: 0, net: 0 };
      rates[ResourceType.ENERGY] = { production: 0, consumption: 0, net: 0 };
      rates[ResourceType.POPULATION] = { production: 0, consumption: 0, net: 0 };
      rates[ResourceType.RESEARCH] = { production: 0, consumption: 0, net: 0 };

      // Calculate rates from active modules
      if (modules) {
        modules.forEach(module => {
          if (module.active) {
            // Process production
            if (module.production) {
              module.production.forEach(production => {
                const resourceType = production.type as unknown as CoreResourceType;
                if (rates[resourceType]) {
                  rates[resourceType]!.production += production.amount;
                }
              });
            }

            // Process consumption
            if (module.consumption) {
              module.consumption.forEach(consumption => {
                const resourceType = consumption.type as unknown as CoreResourceType;
                if (rates[resourceType]) {
                  rates[resourceType]!.consumption += consumption.amount;
                }
              });
            }
          }
        });
      }

      // Calculate net rates and update state
      Object.entries(rates).forEach(([type, detail]) => {
        if (detail) {
          detail.net = detail.production - detail.consumption;
          updateRates(type as CoreResourceType, detail.production, detail.consumption);
        }
      });
    };

    calculateInitialRates();
  }, [modules]);

  return (
    <ResourceRatesContext.Provider value={{ state, updateRates, resetRates }}>
      {children}
    </ResourceRatesContext.Provider>
  );
}

/**
 * Hook to access the resource rates context
 */
export function useResourceRates(): ResourceRatesContextType {
  const context = useContext(ResourceRatesContext);
  if (!context) {
    throw new Error('useResourceRates must be used within a ResourceRatesProvider');
  }
  return context;
}

/**
 * Hook to get net resource rates as a simple record
 */
export function useNetResourceRates(): Record<CoreResourceType, number> {
  const { state } = useResourceRates();
  return {
    [ResourceType.MINERALS]: state[ResourceType.MINERALS].net,
    [ResourceType.ENERGY]: state[ResourceType.ENERGY].net,
    [ResourceType.POPULATION]: state[ResourceType.POPULATION].net,
    [ResourceType.RESEARCH]: state[ResourceType.RESEARCH].net,
  };
}

/**
 * Hook to get detailed rates for a specific resource type
 */
export function useResourceRateDetails(type: CoreResourceType): ResourceRateDetail {
  const { state } = useResourceRates();
  return state[type];
}
