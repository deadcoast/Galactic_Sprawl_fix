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
import {
  createResetRatesAction,
  createUpdateRateAction,
  useResourceRates,
  useResourceRatesDispatch,
} from '../../contexts/ResourceRatesContext';
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

  // Get state and dispatch
  const resourceRates = useResourceRates(state => state.resourceRates);
  const dispatch = useResourceRatesDispatch();

  // Create action dispatchers
  const updateRates = useCallback(
    (type: ResourceType, production: number, consumption: number) => {
      dispatch(
        createUpdateRateAction(type, {
          production,
          consumption,
          net: production - consumption,
        })
      );
    },
    [dispatch]
  );

  const resetRates = useCallback(() => {
    dispatch(createResetRatesAction());
  }, [dispatch]);

  // Memoized selectors for individual resource types - with performance tracking
  const minerals = measureSelectorTime(
    'minerals',
    () =>
      useMemo(() => resourceRates[ResourceType.MINERALS], [resourceRates[ResourceType.MINERALS]]),
    resourceStatePerformanceConfig
  );

  const energy = measureSelectorTime(
    'energy',
    () => useMemo(() => resourceRates[ResourceType.ENERGY], [resourceRates[ResourceType.ENERGY]]),
    resourceStatePerformanceConfig
  );

  const population = measureSelectorTime(
    'population',
    () =>
      useMemo(
        () => resourceRates[ResourceType.POPULATION],
        [resourceRates[ResourceType.POPULATION]]
      ),
    resourceStatePerformanceConfig
  );

  const research = measureSelectorTime(
    'research',
    () =>
      useMemo(() => resourceRates[ResourceType.RESEARCH], [resourceRates[ResourceType.RESEARCH]]),
    resourceStatePerformanceConfig
  );

  // Memoized aggregate data - with performance tracking
  const _netRates = measureComputationTime(
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

  const _totalProduction = measureComputationTime(
    'totalProduction',
    () =>
      useMemo(
        () => minerals.production + energy.production + population.production + research.production,
        [minerals.production, energy.production, population.production, research.production]
      ),
    resourceStatePerformanceConfig
  );

  const _totalConsumption = measureComputationTime(
    'totalConsumption',
    () =>
      useMemo(
        () =>
          minerals.consumption + energy.consumption + population.consumption + research.consumption,
        [minerals.consumption, energy.consumption, population.consumption, research.consumption]
      ),
    resourceStatePerformanceConfig
  );

  // Utility function to get rate details for a specific resource type
  const getRateDetails = useCallback(
    (type: CoreResourceType): ResourceRateDetail => {
      return resourceRates[type];
    },
    [resourceRates]
  );

  // Utility function to get resource metadata
  const getResourceInfo = useCallback((type: CoreResourceType) => {
    return ResourceTypeInfo[type];
  }, []);

  // Utility function to check if a resource is in deficit
  const isResourceDeficit = useCallback(
    (type: CoreResourceType): boolean => {
      return resourceRates[type].net < 0;
    },
    [resourceRates]
  );

  // Return structured state and actions - measure computation time for the final object assembly
  return measureComputationTime(
    'returnStateObject',
    () => ({
      state: resourceRates,

      // Resource rate details
      minerals,
      energy,
      population,
      research,
      plasma: resourceRates[ResourceType.PLASMA],
      gas: resourceRates[ResourceType.GAS],
      exotic: resourceRates[ResourceType.EXOTIC],

      // Utility functions
      getRateDetails,
      getResourceInfo,
      isResourceDeficit,

      // Metadata
      lastUpdated: Date.now(),

      // Actions
      updateRates,
      resetRates,
    }),
    resourceStatePerformanceConfig
  );
}

/**
 * Hook to select only the minerals rate data
 */
export function useMineralsRate(): ResourceRateDetail {
  return useResourceRates(state => state.resourceRates[ResourceType.MINERALS]);
}

/**
 * Hook to select only the energy rate data
 */
export function useEnergyRate(): ResourceRateDetail {
  return useResourceRates(state => state.resourceRates[ResourceType.ENERGY]);
}

/**
 * Hook to select only the population rate data
 */
export function usePopulationRate(): ResourceRateDetail {
  return useResourceRates(state => state.resourceRates[ResourceType.POPULATION]);
}

/**
 * Hook to select only the research rate data
 */
export function useResearchRate(): ResourceRateDetail {
  return useResourceRates(state => state.resourceRates[ResourceType.RESEARCH]);
}

/**
 * Hook to get all net resource rates
 */
export function useNetRates(): Record<CoreResourceType, number> {
  return useResourceRates(state => {
    const rates = state.resourceRates;
    return {
      [ResourceType.MINERALS]: rates[ResourceType.MINERALS].net,
      [ResourceType.ENERGY]: rates[ResourceType.ENERGY].net,
      [ResourceType.POPULATION]: rates[ResourceType.POPULATION].net,
      [ResourceType.RESEARCH]: rates[ResourceType.RESEARCH].net,
    };
  });
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
    () => useResourceRates(state => state.resourceRates[type]),
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
      return useResourceRates(state => {
        return Object.entries(state.resourceRates)
          .filter(([key, value]) => {
            if (key === 'lastUpdated') return false;
            return (value as ResourceRateDetail).net > 0;
          })
          .map(([key]) => key as CoreResourceType);
      });
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
      return useResourceRates(state => {
        return Object.entries(state.resourceRates)
          .filter(([key, value]) => {
            if (key === 'lastUpdated') return false;
            return (value as ResourceRateDetail).net < 0;
          })
          .map(([key]) => key as CoreResourceType);
      });
    },
    performanceConfig
  );
}
