import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ModuleEvent, moduleEventBus } from '../lib/modules/ModuleEvents';
import { useModules } from './ModuleContext';

/**
 * We're focusing only on the core resources for this context
 */
type CoreResourceType = 'minerals' | 'energy' | 'population' | 'research';

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
  minerals: ResourceRateDetail;
  energy: ResourceRateDetail;
  population: ResourceRateDetail;
  research: ResourceRateDetail;
  lastUpdated: number;
}

/**
 * Default state with all rates at zero
 */
const defaultResourceRates: ResourceRatesState = {
  minerals: { production: 0, consumption: 0, net: 0 },
  energy: { production: 0, consumption: 0, net: 0 },
  population: { production: 0, consumption: 0, net: 0 },
  research: { production: 0, consumption: 0, net: 0 },
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
  const { state: moduleState } = useModules();

  // Method to update resource rates
  const updateRates = (type: CoreResourceType, production: number, consumption: number) => {
    setState(prevState => {
      // Only update if values have changed to avoid unnecessary renders
      if (
        prevState[type]?.production === production &&
        prevState[type]?.consumption === consumption
      ) {
        return prevState;
      }

      return {
        ...prevState,
        [type]: {
          production,
          consumption,
          net: production - consumption,
        },
        lastUpdated: Date.now(),
      };
    });
  };

  // Reset rates to default
  const resetRates = () => {
    setState(defaultResourceRates);
  };

  // Subscribe to resource update events
  useEffect(() => {
    const handleResourceUpdate = (event: ModuleEvent) => {
      if (
        event.type === 'RESOURCE_UPDATED' &&
        event.data &&
        typeof event.data === 'object' &&
        'resources' in event.data &&
        event.data.resources
      ) {
        const resources = event.data.resources as Record<string, number>;

        // Update rates from event data if available
        if (resources.mineralRate !== undefined) {
          updateRates(
            'minerals',
            (resources.mineralProduction as number) || 0,
            (resources.mineralConsumption as number) || 0
          );
        }

        if (resources.energyRate !== undefined) {
          updateRates(
            'energy',
            (resources.energyProduction as number) || 0,
            (resources.energyConsumption as number) || 0
          );
        }

        if (resources.populationRate !== undefined) {
          updateRates(
            'population',
            (resources.populationProduction as number) || 0,
            (resources.populationConsumption as number) || 0
          );
        }

        if (resources.researchRate !== undefined) {
          updateRates(
            'research',
            (resources.researchProduction as number) || 0,
            (resources.researchConsumption as number) || 0
          );
        }
      }
    };

    // Subscribe to module events - returns an unsubscribe function
    const unsubscribe = moduleEventBus.subscribe('RESOURCE_UPDATED', handleResourceUpdate);

    // Calculate initial rates based on active modules
    // This is a simplified calculation just to initialize rates
    // The real values will come from resource events
    const calculateInitialRates = () => {
      // Default production values based on active modules
      // This is just a simple initialization and will be overridden by real events
      const production = {
        minerals: moduleState.activeModules.filter(m => m.type === 'mineral').length * 0.5,
        energy: moduleState.activeModules.filter(m => m.type === 'infrastructure').length * 0.6,
        population: moduleState.activeModules.filter(m => m.type === 'population').length * 0.2,
        research: moduleState.activeModules.filter(m => m.type === 'research').length * 0.4,
      };

      // Default consumption values
      const consumption = {
        minerals: moduleState.activeModules.length * 0.1,
        energy: moduleState.activeModules.length * 0.3,
        population: moduleState.activeModules.filter(m => m.isActive).length * 0.05,
        research: 0,
      };

      // Update all rates
      updateRates('minerals', production.minerals, consumption.minerals);
      updateRates('energy', production.energy, consumption.energy);
      updateRates('population', production.population, consumption.population);
      updateRates('research', production.research, consumption.research);
    };

    // Initialize with rough estimates
    calculateInitialRates();

    // Cleanup subscription
    return unsubscribe;
  }, [moduleState.activeModules]);

  // Create the context value
  const contextValue: ResourceRatesContextType = {
    state,
    updateRates,
    resetRates,
  };

  return (
    <ResourceRatesContext.Provider value={contextValue}>{children}</ResourceRatesContext.Provider>
  );
}

/**
 * Custom hook to use the ResourceRatesContext
 */
export function useResourceRates() {
  const context = useContext(ResourceRatesContext);
  if (!context) {
    throw new Error('useResourceRates must be used within a ResourceRatesProvider');
  }
  return context;
}

/**
 * Specialized hook to get just the net rates for core resources
 */
export function useNetResourceRates(): Record<CoreResourceType, number> {
  const { state } = useResourceRates();
  return {
    minerals: state.minerals.net,
    energy: state.energy.net,
    population: state.population.net,
    research: state.research.net,
  };
}

/**
 * Hook to get detailed rates for a specific resource
 */
export function useResourceRateDetails(type: CoreResourceType): ResourceRateDetail {
  const { state } = useResourceRates();
  return state[type];
}
