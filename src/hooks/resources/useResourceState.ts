/**
 * @file useResourceState.ts
 * Provides standardized hooks for accessing ResourceRatesContext with selector pattern.
 *
 * This implementation:
 * 1. Uses selector pattern for better performance
 * 2. Provides type safety for resource state data
 * 3. Offers specialized selectors for different resource types and metrics
 * 4. Follows the standardized context access pattern
 * 5. Includes performance monitoring for selectors and computations
 */

import { useCallback, useMemo } from 'react';
import { useResourceRates } from '../../contexts/ResourceRatesContext';
import { ResourceType, ResourceTypeInfo } from '../../types/resources/StandardizedResourceTypes';
import {
  HookPerformanceConfig,
  defaultPerformanceConfig,
  measureComputationTime,
  measureSelectorTime,
  trackHookRender,
} from '../../utils/performance/hookPerformanceMonitor';

// Type for core resources tracked in ResourceRatesContext
type CoreResourceType =
  | ResourceType.MINERALS
  | ResourceType.ENERGY
  | ResourceType.POPULATION
  | ResourceType.RESEARCH;

// Interface for resource rate details
interface ResourceRateDetail {
  production: number;
  consumption: number;
  net: number;
}

// Performance monitoring configuration
const resourceStatePerformanceConfig: HookPerformanceConfig = {
  ...defaultPerformanceConfig,
  hookName: 'useResourceState',
};

/**
 * Hook to access resource state with selector pattern for performance optimization
 *
 * @returns The resource state with structured access to rates and helper methods
 */
export function useResourceState() {
  // Track hook render
  trackHookRender(resourceStatePerformanceConfig);

  const { state, updateRates, resetRates } = useResourceRates();

  // Memoized selectors for individual resource types - with performance tracking
  const minerals = measureSelectorTime(
    'minerals',
    () => useMemo(() => state[ResourceType.MINERALS], [state[ResourceType.MINERALS]]),
    resourceStatePerformanceConfig
  );

  const energy = measureSelectorTime(
    'energy',
    () => useMemo(() => state[ResourceType.ENERGY], [state[ResourceType.ENERGY]]),
    resourceStatePerformanceConfig
  );

  const population = measureSelectorTime(
    'population',
    () => useMemo(() => state[ResourceType.POPULATION], [state[ResourceType.POPULATION]]),
    resourceStatePerformanceConfig
  );

  const research = measureSelectorTime(
    'research',
    () => useMemo(() => state[ResourceType.RESEARCH], [state[ResourceType.RESEARCH]]),
    resourceStatePerformanceConfig
  );

  // Memoized aggregate data - with performance tracking
  const netRates = measureComputationTime(
    'netRates',
    () =>
      useMemo(
        () => ({
          [ResourceType.MINERALS]: minerals.net,
          [ResourceType.ENERGY]: energy.net,
          [ResourceType.POPULATION]: population.net,
          [ResourceType.RESEARCH]: research.net,
        }),
        [minerals.net, energy.net, population.net, research.net]
      ),
    resourceStatePerformanceConfig
  );

  const totalProduction = measureComputationTime(
    'totalProduction',
    () =>
      useMemo(
        () => minerals.production + energy.production + population.production + research.production,
        [minerals.production, energy.production, population.production, research.production]
      ),
    resourceStatePerformanceConfig
  );

  const totalConsumption = measureComputationTime(
    'totalConsumption',
    () =>
      useMemo(
        () =>
          minerals.consumption + energy.consumption + population.consumption + research.consumption,
        [minerals.consumption, energy.consumption, population.consumption, research.consumption]
      ),
    resourceStatePerformanceConfig
  );

  // Action creators with standardized pattern
  const updateResourceRates = useCallback(
    (type: CoreResourceType, production: number, consumption: number) => {
      updateRates(type, production, consumption);
    },
    [updateRates]
  );

  const resetResourceRates = useCallback(() => {
    resetRates();
  }, [resetRates]);

  // Utility function to get rate details for a specific resource type
  const getRateDetails = useCallback(
    (type: CoreResourceType): ResourceRateDetail => {
      return state[type];
    },
    [state]
  );

  // Utility function to get resource metadata
  const getResourceInfo = useCallback((type: CoreResourceType) => {
    return ResourceTypeInfo[type];
  }, []);

  // Utility function to check if a resource is in deficit
  const isResourceDeficit = useCallback(
    (type: CoreResourceType): boolean => {
      return state[type].net < 0;
    },
    [state]
  );

  // Return structured state and actions - measure computation time for the final object assembly
  return measureComputationTime(
    'returnStateObject',
    () => ({
      // Individual resource data
      resources: {
        minerals,
        energy,
        population,
        research,
      },

      // Resource access by enum type
      resourcesByType: {
        [ResourceType.MINERALS]: minerals,
        [ResourceType.ENERGY]: energy,
        [ResourceType.POPULATION]: population,
        [ResourceType.RESEARCH]: research,
      },

      // Aggregated data
      netRates,
      totalProduction,
      totalConsumption,

      // Metadata
      lastUpdated: state.lastUpdated,

      // Actions
      updateResourceRates,
      resetResourceRates,

      // Utility functions
      getRateDetails,
      getResourceInfo,
      isResourceDeficit,
    }),
    resourceStatePerformanceConfig
  );
}

/**
 * Hook to select only the minerals rate data
 */
export function useMineralsRate(): ResourceRateDetail {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useMineralsRate',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  // Get and measure state
  return measureSelectorTime(
    'minerals',
    () => {
      const { state } = useResourceRates();
      return state[ResourceType.MINERALS];
    },
    performanceConfig
  );
}

/**
 * Hook to select only the energy rate data
 */
export function useEnergyRate(): ResourceRateDetail {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useEnergyRate',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  // Get and measure state
  return measureSelectorTime(
    'energy',
    () => {
      const { state } = useResourceRates();
      return state[ResourceType.ENERGY];
    },
    performanceConfig
  );
}

/**
 * Hook to select only the population rate data
 */
export function usePopulationRate(): ResourceRateDetail {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'usePopulationRate',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  // Get and measure state
  return measureSelectorTime(
    'population',
    () => {
      const { state } = useResourceRates();
      return state[ResourceType.POPULATION];
    },
    performanceConfig
  );
}

/**
 * Hook to select only the research rate data
 */
export function useResearchRate(): ResourceRateDetail {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useResearchRate',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  // Get and measure state
  return measureSelectorTime(
    'research',
    () => {
      const { state } = useResourceRates();
      return state[ResourceType.RESEARCH];
    },
    performanceConfig
  );
}

/**
 * Hook to get all net resource rates
 */
export function useNetRates(): Record<CoreResourceType, number> {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useNetRates',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  // Get and measure state calculation
  return measureComputationTime(
    'netRates',
    () => {
      const { state } = useResourceRates();
      return {
        [ResourceType.MINERALS]: state[ResourceType.MINERALS].net,
        [ResourceType.ENERGY]: state[ResourceType.ENERGY].net,
        [ResourceType.POPULATION]: state[ResourceType.POPULATION].net,
        [ResourceType.RESEARCH]: state[ResourceType.RESEARCH].net,
      };
    },
    performanceConfig
  );
}

/**
 * Hook to select resource rate for a specific resource type
 *
 * @param type The resource type to get rates for
 * @returns The rate details for the specified resource
 */
export function useResourceTypeRate(type: CoreResourceType): ResourceRateDetail {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useResourceTypeRate',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  // Get and measure state access
  return measureSelectorTime(
    `type:${type}`,
    () => {
      const { state } = useResourceRates();
      return state[type];
    },
    performanceConfig
  );
}

/**
 * Hook to get resources with positive net production
 */
export function usePositiveNetResources(): CoreResourceType[] {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'usePositiveNetResources',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  // Get and measure computation
  return measureComputationTime(
    'positiveResources',
    () => {
      const { state } = useResourceRates();

      return Object.entries(state)
        .filter(([key, value]) => key !== 'lastUpdated' && value.net > 0)
        .map(([key]) => key as CoreResourceType);
    },
    performanceConfig
  );
}

/**
 * Hook to get resources with negative net production (in deficit)
 */
export function useResourceDeficits(): CoreResourceType[] {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useResourceDeficits',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  // Get and measure computation
  return measureComputationTime(
    'deficitResources',
    () => {
      const { state } = useResourceRates();

      return Object.entries(state)
        .filter(([key, value]) => key !== 'lastUpdated' && value.net < 0)
        .map(([key]) => key as CoreResourceType);
    },
    performanceConfig
  );
}
