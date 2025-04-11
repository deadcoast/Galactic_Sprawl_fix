import { useCallback, useEffect, useMemo, useState } from 'react';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import {
  isSerializedResourceState,
  ResourceTotals,
  SerializedResource,
  SerializedResourceState,
  SerializedThreshold,
  serializeResourceMap,
  validateResourceState,
} from '../../types/resources/ResourceSerializationTypes';
import {
  ResourceState,
  ResourceThreshold,
  ResourceTransfer,
  ResourceType,
} from '../../types/resources/ResourceTypes';

/**
 * Resource alert interface
 */
export interface ResourceAlert {
  id: string;
  type: ResourceType;
  message: string;
  severity: 'critical' | 'medium' | 'low';
  timestamp: number;
  threshold?: ResourceThreshold;
  dismissed?: boolean;
}

/**
 * Resource tracking options
 */
export interface ResourceTrackingOptions {
  types?: ResourceType[];
  updateInterval?: number;
  historyLimit?: number;
  enableAlerts?: boolean;
  enableThresholds?: boolean;
}

/**
 * Resource tracking state
 */
export interface ResourceTrackingState {
  resources: Map<ResourceType, ResourceState>;
  history: ResourceTransfer[];
  alerts: ResourceAlert[];
  lastUpdated: number;
  thresholds: Map<ResourceType, ResourceThreshold[]>;
}

/**
 * Resource tracking result
 */
export interface ResourceTrackingResult {
  // Resource states
  resources: Map<ResourceType, ResourceState>;
  resourceList: Array<{ type: ResourceType; state: ResourceState }>;
  getResource: (type: ResourceType) => ResourceState | undefined;

  // Resource history
  history: ResourceTransfer[];
  getHistoryByType: (type: ResourceType) => ResourceTransfer[];
  clearHistory: () => void;

  // Resource alerts
  alerts: ResourceAlert[];
  getAlertsByType: (type: ResourceType) => ResourceAlert[];
  clearAlerts: () => void;
  dismissAlert: (id: string) => void;

  // Resource thresholds
  setThreshold: (type: ResourceType, threshold: ResourceThreshold) => void;
  removeThreshold: (type: ResourceType) => void;

  // Resource updates
  updateResource: (type: ResourceType, update: Partial<ResourceState>) => void;
  incrementResource: (type: ResourceType, amount: number) => void;
  decrementResource: (type: ResourceType, amount: number) => void;
  transferResource: (transfer: ResourceTransfer) => boolean;

  // Utility functions
  getTotalResources: () => number;
  getResourcePercentage: (type: ResourceType) => number;
  getResourcesAboveThreshold: (percentage: number) => ResourceType[];
  getResourcesBelowThreshold: (percentage: number) => ResourceType[];

  // Metadata
  lastUpdated: number;
  isLoading: boolean;
  error: Error | null;

  // Resource metrics
  resourceMetrics: {
    totals: ResourceTotals;
    percentages: Record<ResourceType, number>;
    criticalResources: ResourceType[];
    abundantResources: ResourceType[];
  };
}

/**
 * Hook for tracking resources globally
 */
export function useResourceTracking(options: ResourceTrackingOptions = {}): ResourceTrackingResult {
  // Default options
  const {
    types = [
      ResourceType.MINERALS,
      ResourceType.ENERGY,
      ResourceType.POPULATION,
      ResourceType.RESEARCH,
      ResourceType.PLASMA,
      ResourceType.GAS,
      ResourceType.EXOTIC,
    ],
    updateInterval = 1000,
    historyLimit = 100,
    enableAlerts: _enableAlerts = true,
    enableThresholds = true,
  } = options;

  // State
  const [state, setState] = useState<ResourceTrackingState>({
    resources: new Map(),
    history: [],
    alerts: [],
    lastUpdated: Date.now(),
    thresholds: new Map(),
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize resources
  useEffect(() => {
    const initialResources = new Map<ResourceType, ResourceState>();
    const initialThresholds = new Map<ResourceType, ResourceThreshold[]>();

    // Initialize with default values
    for (const type of types) {
      initialResources.set(type, {
        current: 0,
        min: 0,
        max: 100,
        production: 0,
        consumption: 0,
      });
      initialThresholds.set(type, []);
    }

    // Try to load from storage
    try {
      const savedResources = localStorage.getItem('resources');
      if (savedResources) {
        const parsed = JSON.parse(savedResources);

        // Validate the parsed data
        if (isSerializedResourceState(parsed) && validateResourceState(parsed)) {
          // Convert serialized resources to Map with proper type conversion
          const resourceMap = new Map<ResourceType, ResourceState>();

          // Process each resource entry with proper conversion
          for (const [key, value] of Object.entries(parsed.resources)) {
            if (types.includes(key as ResourceType)) {
              const serializedResource = value as SerializedResource;
              resourceMap.set(key as ResourceType, {
                current: serializedResource.current,
                min: 0, // Default value
                max: serializedResource.capacity || 100, // Use capacity or default
                production: serializedResource.production,
                consumption: serializedResource.consumption,
              });
            }
          }

          // Convert serialized thresholds to Map
          const thresholdMap = new Map<ResourceType, ResourceThreshold[]>();
          for (const [key, thresholds] of Object.entries(parsed.thresholds)) {
            if (types.includes(key as ResourceType)) {
              thresholdMap.set(key as ResourceType, thresholds as ResourceThreshold[]);
            }
          }

          setState(prev => ({
            ...prev,
            resources: resourceMap,
            thresholds: thresholdMap,
            alerts: parsed.alerts ?? [],
            lastUpdated: parsed.timestamp || Date.now(),
          }));
        } else {
          console.warn('Invalid resource data in localStorage, using defaults');
          setState(prev => ({
            ...prev,
            resources: initialResources,
            thresholds: initialThresholds,
            lastUpdated: Date.now(),
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          resources: initialResources,
          thresholds: initialThresholds,
          lastUpdated: Date.now(),
        }));
      }

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load resources'));
      setIsLoading(false);
    }
  }, [types]);

  // Save resources to storage
  useEffect(() => {
    if (isLoading) {
      return;
    }

    try {
      // Serialize the state
      const serializedState: SerializedResourceState = {
        resources: Object.fromEntries(
          Array.from(state.resources.entries()).map(([key, value]) => [
            key,
            {
              current: value.current,
              capacity: value.max, // Convert max to capacity
              production: value.production,
              consumption: value.consumption,
            } as SerializedResource,
          ])
        ) as Record<ResourceType, SerializedResource>,
        thresholds: serializeResourceMap(state.thresholds) as Record<string, SerializedThreshold[]>,
        alerts: state.alerts,
        timestamp: Date.now(),
      };

      localStorage.setItem('resources', JSON.stringify(serializedState));
    } catch (err) {
      errorLoggingService.logError(
        err instanceof Error ? err : new Error('Failed to save resources to localStorage'),
        ErrorType.RUNTIME,
        ErrorSeverity.MEDIUM,
        { componentName: 'useResourceTracking', action: 'saveStateEffect' }
      );
    }
  }, [state, isLoading]);

  // Check thresholds
  useEffect(() => {
    if (!enableThresholds || isLoading) {
      return;
    }

    const checkThresholds = () => {
      const newAlerts: ResourceAlert[] = [];

      // Convert Map entries to array to avoid MapIterator error
      const thresholdEntries = Array.from(state.thresholds.entries());
      for (const [type, thresholdList] of thresholdEntries) {
        const resourceState = state.resources.get(type);
        if (!resourceState) {
          continue;
        }

        for (const threshold of thresholdList) {
          // Check critical threshold
          if (threshold.critical !== undefined && resourceState.current < threshold.critical) {
            newAlerts.push({
              id: `${type}-critical-${Date.now()}`,
              type,
              threshold,
              message: `${type} is below critical threshold (${resourceState.current}/${threshold.critical})`,
              severity: 'critical',
              timestamp: Date.now(),
            });
          }
          // Check low threshold
          else if (threshold.low !== undefined && resourceState.current < threshold.low) {
            newAlerts.push({
              id: `${type}-low-${Date.now()}`,
              type,
              threshold,
              message: `${type} is below low threshold (${resourceState.current}/${threshold.low})`,
              severity: 'medium',
              timestamp: Date.now(),
            });
          }
          // Check target threshold
          else if (threshold.target !== undefined && resourceState.current < threshold.target) {
            newAlerts.push({
              id: `${type}-target-${Date.now()}`,
              type,
              threshold,
              message: `${type} is below target threshold (${resourceState.current}/${threshold.target})`,
              severity: 'low',
              timestamp: Date.now(),
            });
          }
        }
      }

      // Update alerts if there are new ones
      if (newAlerts.length > 0) {
        setState(prev => ({
          ...prev,
          alerts: [...prev.alerts, ...newAlerts],
        }));
      }
    };

    // Check thresholds initially
    checkThresholds();

    // Set up interval for checking thresholds
    const intervalId = setInterval(checkThresholds, updateInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enableThresholds, isLoading, state.resources, state.thresholds, updateInterval]);

  // Update resource
  const updateResource = useCallback((type: ResourceType, update: Partial<ResourceState>) => {
    setState(prev => {
      const resources = new Map(prev.resources);
      const current = resources.get(type) || {
        current: 0,
        min: 0,
        max: 100,
        production: 0,
        consumption: 0,
      };

      resources.set(type, {
        ...current,
        ...update,
      });

      return {
        ...prev,
        resources,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  // Increment resource
  const incrementResource = useCallback(
    (type: ResourceType, amount: number) => {
      if (amount <= 0) {
        return;
      }

      setState(prev => {
        const resources = new Map(prev.resources);
        const current = resources.get(type) || {
          current: 0,
          min: 0,
          max: 100,
          production: 0,
          consumption: 0,
        };

        const newValue = Math.min(current.current + amount, current.max);

        resources.set(type, {
          ...current,
          current: newValue,
        });

        // Add to history
        const transfer: ResourceTransfer = {
          type,
          source: 'production',
          target: 'storage',
          amount,
          timestamp: Date.now(),
        };

        const history = [transfer, ...prev.history].slice(0, historyLimit);

        return {
          ...prev,
          resources,
          history,
          lastUpdated: Date.now(),
        };
      });
    },
    [historyLimit]
  );

  // Decrement resource
  const decrementResource = useCallback(
    (type: ResourceType, amount: number) => {
      if (amount <= 0) {
        return;
      }

      setState(prev => {
        const resources = new Map(prev.resources);
        const current = resources.get(type) || {
          current: 0,
          min: 0,
          max: 100,
          production: 0,
          consumption: 0,
        };

        const newValue = Math.max(current.current - amount, current.min);

        resources.set(type, {
          ...current,
          current: newValue,
        });

        // Add to history
        const transfer: ResourceTransfer = {
          type,
          source: 'storage',
          target: 'consumption',
          amount,
          timestamp: Date.now(),
        };

        const history = [transfer, ...prev.history].slice(0, historyLimit);

        return {
          ...prev,
          resources,
          history,
          lastUpdated: Date.now(),
        };
      });
    },
    [historyLimit]
  );

  // Transfer resource
  const transferResource = useCallback(
    (transfer: ResourceTransfer): boolean => {
      if (transfer.amount <= 0) {
        return false;
      }

      let success = false;

      setState(prev => {
        const resources = new Map(prev.resources);

        // Get source resource
        const sourceResource = resources.get(transfer.type);
        if (!sourceResource || sourceResource.current < transfer.amount) {
          return prev; // Not enough resources
        }

        // Update source
        resources.set(transfer.type, {
          ...sourceResource,
          current: sourceResource.current - transfer.amount,
        });

        // Add to history
        const history = [transfer, ...prev.history].slice(0, historyLimit);

        success = true;

        return {
          ...prev,
          resources,
          history,
          lastUpdated: Date.now(),
        };
      });

      return success;
    },
    [historyLimit]
  );

  // Set threshold
  const setThreshold = useCallback(
    (type: ResourceType, threshold: ResourceThreshold) => {
      const thresholds = new Map(state.thresholds);
      const currentThresholds = thresholds.get(type) ?? [];
      thresholds.set(type, [...currentThresholds, threshold]);
      setState(prev => ({ ...prev, thresholds }));
    },
    [state.thresholds]
  );

  // Remove threshold
  const removeThreshold = useCallback(
    (type: ResourceType) => {
      const thresholds = new Map(state.thresholds);
      thresholds.set(type, []);
      setState(prev => ({ ...prev, thresholds }));
    },
    [state.thresholds]
  );

  // Get resource
  const getResource = useCallback(
    (type: ResourceType) => {
      return state.resources.get(type);
    },
    [state.resources]
  );

  // Get history by type
  const getHistoryByType = useCallback(
    (type: ResourceType) => {
      return state.history.filter(item => item?.type === type);
    },
    [state.history]
  );

  // Clear history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: [],
    }));
  }, []);

  // Get alerts by type
  const getAlertsByType = useCallback(
    (type: ResourceType) => {
      return state.alerts.filter(alert => alert.type === type);
    },
    [state.alerts]
  );

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setState(prev => ({
      ...prev,
      alerts: [],
    }));
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== id),
    }));
  }, []);

  // Get total resources
  const getTotalResources = useCallback(() => {
    let total = 0;

    // Convert Map entries to array to avoid MapIterator error
    const resourceValues = Array.from(state.resources.values());
    for (const resource of resourceValues) {
      total += resource.current;
    }

    return total;
  }, [state.resources]);

  // Get resource percentage
  const getResourcePercentage = useCallback(
    (type: ResourceType) => {
      const resource = state.resources.get(type);
      if (!resource) {
        return 0;
      }

      return (resource.current / resource.max) * 100;
    },
    [state.resources]
  );

  // Get resources above threshold
  const getResourcesAboveThreshold = useCallback(
    (percentage: number) => {
      const result: ResourceType[] = [];

      // Convert Map entries to array to avoid MapIterator error
      const resourceEntries = Array.from(state.resources.entries());
      for (const [type, resource] of resourceEntries) {
        const resourcePercentage = (resource.current / resource.max) * 100;

        if (resourcePercentage >= percentage) {
          result?.push(type);
        }
      }

      return result;
    },
    [state.resources]
  );

  // Get resources below threshold
  const getResourcesBelowThreshold = useCallback(
    (percentage: number) => {
      const result: ResourceType[] = [];

      // Convert Map entries to array to avoid MapIterator error
      const resourceEntries = Array.from(state.resources.entries());
      for (const [type, resource] of resourceEntries) {
        const resourcePercentage = (resource.current / resource.max) * 100;

        if (resourcePercentage <= percentage) {
          result?.push(type);
        }
      }

      return result;
    },
    [state.resources]
  );

  // Create resource list
  const resourceList = useMemo(() => {
    return Array.from(state.resources.entries()).map(([type, state]) => ({
      type,
      state,
    }));
  }, [state.resources]);

  // Calculate resource totals
  const _calculateTotals = useCallback(
    (resources: Map<ResourceType, ResourceState>): ResourceTotals => {
      const totals: ResourceTotals = {
        production: 0,
        consumption: 0,
        net: 0,
        amounts: {} as Record<ResourceType, number>,
        capacities: {} as Record<ResourceType, number>,
        rates: {} as Record<ResourceType, number>,
      };

      // Convert Map entries to array to avoid MapIterator error
      const resourceEntries = Array.from(resources.entries());
      for (const [type, resource] of resourceEntries) {
        totals.production += resource.production;
        totals.consumption += resource.consumption;

        if (totals.amounts) {
          totals.amounts[type] = resource.current;
        }

        if (totals.capacities) {
          totals.capacities[type] = resource.max;
        }

        if (totals.rates) {
          totals.rates[type] = resource.production - resource.consumption;
        }
      }

      totals.net = totals.production - totals.consumption;
      return totals;
    },
    []
  );

  // Calculate resource percentages
  const _calculatePercentages = useCallback(
    (resources: Map<ResourceType, ResourceState>): Record<ResourceType, number> => {
      const percentages: Record<ResourceType, number> = {} as Record<ResourceType, number>;

      // Convert Map entries to array to avoid MapIterator error
      const resourceEntries = Array.from(resources.entries());
      for (const [type, resource] of resourceEntries) {
        if (resource.max > 0) {
          percentages[type] = (resource.current / resource.max) * 100;
        } else {
          percentages[type] = 0;
        }
      }

      return percentages;
    },
    []
  );

  // Calculate current resource totals and percentages for the UI
  const resourceMetrics = useMemo(() => {
    const totals = _calculateTotals(state.resources);
    const percentages = _calculatePercentages(state.resources);

    return {
      totals,
      percentages,
      criticalResources: Object.entries(percentages)
        .filter(([_, percent]) => percent < 10)
        .map(([type]) => type as ResourceType),
      abundantResources: Object.entries(percentages)
        .filter(([_, percent]) => percent > 90)
        .map(([type]) => type as ResourceType),
    };
  }, [state.resources, _calculateTotals, _calculatePercentages]);

  return {
    // Resource states
    resources: state.resources,
    resourceList,
    getResource,

    // Resource history
    history: state.history,
    getHistoryByType,
    clearHistory,

    // Resource alerts
    alerts: state.alerts,
    getAlertsByType,
    clearAlerts,
    dismissAlert,

    // Resource thresholds
    setThreshold,
    removeThreshold,

    // Resource updates
    updateResource,
    incrementResource,
    decrementResource,
    transferResource,

    // Utility functions
    getTotalResources,
    getResourcePercentage,
    getResourcesAboveThreshold,
    getResourcesBelowThreshold,

    // Metadata
    lastUpdated: state.lastUpdated,
    isLoading,
    error,

    // Resource metrics
    resourceMetrics,
  };
}
