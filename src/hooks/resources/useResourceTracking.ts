import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ResourceType, 
  ResourceState, 
  ResourceTransfer,
  ResourceThreshold,
  ResourceAlert
} from '../../types/resources/ResourceTypes';

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
}

/**
 * Hook for tracking resources globally
 */
export function useResourceTracking(options: ResourceTrackingOptions = {}): ResourceTrackingResult {
  // Default options
  const {
    types = ['minerals', 'energy', 'population', 'research', 'plasma', 'gas', 'exotic'],
    updateInterval = 1000,
    historyLimit = 100,
    enableAlerts = true,
    enableThresholds = true
  } = options;
  
  // State
  const [state, setState] = useState<ResourceTrackingState>({
    resources: new Map(),
    history: [],
    alerts: [],
    lastUpdated: Date.now()
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [thresholds] = useState<Map<ResourceType, ResourceThreshold>>(new Map());
  
  // Initialize resources
  useEffect(() => {
    const initialResources = new Map<ResourceType, ResourceState>();
    
    // Initialize with default values
    for (const type of types) {
      initialResources.set(type, {
        current: 0,
        min: 0,
        max: 100,
        production: 0,
        consumption: 0
      });
    }
    
    // Try to load from storage
    try {
      const savedResources = localStorage.getItem('resources');
      if (savedResources) {
        const parsed = JSON.parse(savedResources);
        
        for (const [key, value] of Object.entries(parsed)) {
          if (types.includes(key as ResourceType)) {
            initialResources.set(key as ResourceType, value as ResourceState);
          }
        }
      }
      
      setState(prev => ({
        ...prev,
        resources: initialResources,
        lastUpdated: Date.now()
      }));
      
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
      const resourcesObj: Record<string, ResourceState> = {};
      
      // Convert Map entries to array to avoid MapIterator error
      const resourceEntries = Array.from(state.resources.entries());
      for (const [key, value] of resourceEntries) {
        resourcesObj[key] = value;
      }
      
      localStorage.setItem('resources', JSON.stringify(resourcesObj));
    } catch (err) {
      console.error('Failed to save resources:', err);
    }
  }, [state.resources, isLoading]);
  
  // Check thresholds
  useEffect(() => {
    if (!enableThresholds || isLoading) {
      return;
    }
    
    const checkThresholds = () => {
      const newAlerts: ResourceAlert[] = [];
      
      // Convert Map entries to array to avoid MapIterator error
      const thresholdEntries = Array.from(thresholds.entries());
      for (const [type, threshold] of thresholdEntries) {
        const resourceState = state.resources.get(type);
        if (!resourceState) {
          continue;
        }
        
        // Check min threshold
        if (threshold.min !== undefined && resourceState.current < threshold.min) {
          newAlerts.push({
            id: `${type}-min-${Date.now()}`,
            type,
            threshold,
            message: `${type} is below minimum threshold (${resourceState.current} < ${threshold.min})`,
            severity: 'critical'
          });
        }
        
        // Check max threshold
        if (threshold.max !== undefined && resourceState.current > threshold.max) {
          newAlerts.push({
            id: `${type}-max-${Date.now()}`,
            type,
            threshold,
            message: `${type} is above maximum threshold (${resourceState.current} > ${threshold.max})`,
            severity: 'medium'
          });
        }
        
        // Check target threshold
        if (threshold.target !== undefined) {
          const deviation = Math.abs(resourceState.current - threshold.target);
          const maxDeviation = threshold.target * 0.2; // 20% deviation
          
          if (deviation > maxDeviation) {
            newAlerts.push({
              id: `${type}-target-${Date.now()}`,
              type,
              threshold,
              message: `${type} is deviating from target (${resourceState.current} vs ${threshold.target})`,
              severity: 'low'
            });
          }
        }
      }
      
      if (newAlerts.length > 0) {
        setState(prev => ({
          ...prev,
          alerts: [...prev.alerts, ...newAlerts]
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
  }, [enableThresholds, isLoading, state.resources, thresholds, updateInterval]);
  
  // Update resource
  const updateResource = useCallback((type: ResourceType, update: Partial<ResourceState>) => {
    setState(prev => {
      const resources = new Map(prev.resources);
      const current = resources.get(type) || { 
        current: 0, 
        min: 0, 
        max: 100, 
        production: 0, 
        consumption: 0 
      };
      
      resources.set(type, {
        ...current,
        ...update
      });
      
      return {
        ...prev,
        resources,
        lastUpdated: Date.now()
      };
    });
  }, []);
  
  // Increment resource
  const incrementResource = useCallback((type: ResourceType, amount: number) => {
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
        consumption: 0 
      };
      
      const newValue = Math.min(current.current + amount, current.max);
      
      resources.set(type, {
        ...current,
        current: newValue
      });
      
      // Add to history
      const transfer: ResourceTransfer = {
        type,
        source: 'production',
        target: 'storage',
        amount,
        timestamp: Date.now()
      };
      
      const history = [transfer, ...prev.history].slice(0, historyLimit);
      
      return {
        ...prev,
        resources,
        history,
        lastUpdated: Date.now()
      };
    });
  }, [historyLimit]);
  
  // Decrement resource
  const decrementResource = useCallback((type: ResourceType, amount: number) => {
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
        consumption: 0 
      };
      
      const newValue = Math.max(current.current - amount, current.min);
      
      resources.set(type, {
        ...current,
        current: newValue
      });
      
      // Add to history
      const transfer: ResourceTransfer = {
        type,
        source: 'storage',
        target: 'consumption',
        amount,
        timestamp: Date.now()
      };
      
      const history = [transfer, ...prev.history].slice(0, historyLimit);
      
      return {
        ...prev,
        resources,
        history,
        lastUpdated: Date.now()
      };
    });
  }, [historyLimit]);
  
  // Transfer resource
  const transferResource = useCallback((transfer: ResourceTransfer): boolean => {
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
        current: sourceResource.current - transfer.amount
      });
      
      // Add to history
      const history = [transfer, ...prev.history].slice(0, historyLimit);
      
      success = true;
      
      return {
        ...prev,
        resources,
        history,
        lastUpdated: Date.now()
      };
    });
    
    return success;
  }, [historyLimit]);
  
  // Set threshold
  const setThreshold = useCallback((type: ResourceType, threshold: ResourceThreshold) => {
    thresholds.set(type, threshold);
  }, [thresholds]);
  
  // Remove threshold
  const removeThreshold = useCallback((type: ResourceType) => {
    thresholds.delete(type);
  }, [thresholds]);
  
  // Get resource
  const getResource = useCallback((type: ResourceType) => {
    return state.resources.get(type);
  }, [state.resources]);
  
  // Get history by type
  const getHistoryByType = useCallback((type: ResourceType) => {
    return state.history.filter(item => item.type === type);
  }, [state.history]);
  
  // Clear history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: []
    }));
  }, []);
  
  // Get alerts by type
  const getAlertsByType = useCallback((type: ResourceType) => {
    return state.alerts.filter(alert => alert.type === type);
  }, [state.alerts]);
  
  // Clear alerts
  const clearAlerts = useCallback(() => {
    setState(prev => ({
      ...prev,
      alerts: []
    }));
  }, []);
  
  // Dismiss alert
  const dismissAlert = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== id)
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
  const getResourcePercentage = useCallback((type: ResourceType) => {
    const resource = state.resources.get(type);
    if (!resource) {
      return 0;
    }
    
    return (resource.current / resource.max) * 100;
  }, [state.resources]);
  
  // Get resources above threshold
  const getResourcesAboveThreshold = useCallback((percentage: number) => {
    const result: ResourceType[] = [];
    
    // Convert Map entries to array to avoid MapIterator error
    const resourceEntries = Array.from(state.resources.entries());
    for (const [type, resource] of resourceEntries) {
      const resourcePercentage = (resource.current / resource.max) * 100;
      
      if (resourcePercentage >= percentage) {
        result.push(type);
      }
    }
    
    return result;
  }, [state.resources]);
  
  // Get resources below threshold
  const getResourcesBelowThreshold = useCallback((percentage: number) => {
    const result: ResourceType[] = [];
    
    // Convert Map entries to array to avoid MapIterator error
    const resourceEntries = Array.from(state.resources.entries());
    for (const [type, resource] of resourceEntries) {
      const resourcePercentage = (resource.current / resource.max) * 100;
      
      if (resourcePercentage <= percentage) {
        result.push(type);
      }
    }
    
    return result;
  }, [state.resources]);
  
  // Create resource list
  const resourceList = useMemo(() => {
    return Array.from(state.resources.entries()).map(([type, state]) => ({
      type,
      state
    }));
  }, [state.resources]);
  
  // Convert resources to array for serialization
  const serializeResources = (state: ResourceTrackingState): SerializedResourceState => {
    const resources: Record<string, SerializedResource> = {};
    
    // Convert Map entries to array to avoid MapIterator error
    const resourceEntries = Array.from(state.resources.entries());
    for (const [key, value] of resourceEntries) {
      resources[key] = {
        current: value.current,
        capacity: value.capacity,
        production: value.production,
        consumption: value.consumption,
        history: value.history
      };
    }
    
    return {
      resources,
      thresholds: serializeThresholds(state.thresholds),
      alerts: state.alerts
    };
  };

  // Convert thresholds to array for serialization
  const serializeThresholds = (thresholds: Map<ResourceType, ResourceThreshold[]>): Record<string, SerializedThreshold[]> => {
    const result: Record<string, SerializedThreshold[]> = {};
    
    // Convert Map entries to array to avoid MapIterator error
    const thresholdEntries = Array.from(thresholds.entries());
    for (const [type, threshold] of thresholdEntries) {
      result[type] = threshold.map(t => ({
        min: t.min,
        max: t.max,
        target: t.target,
        alert: t.alert
      }));
    }
    
    return result;
  };

  // Calculate total production and consumption
  const calculateTotals = useCallback((resources: Map<ResourceType, ResourceState>): ResourceTotals => {
    const totals: ResourceTotals = {
      production: 0,
      consumption: 0,
      net: 0
    };
    
    // Convert Map entries to array to avoid MapIterator error
    const resourceEntries = Array.from(resources.entries());
    for (const [type, resource] of resourceEntries) {
      totals.production += resource.production;
      totals.consumption += resource.consumption;
    }
    
    totals.net = totals.production - totals.consumption;
    return totals;
  }, []);

  // Calculate resource percentages
  const calculatePercentages = useCallback((resources: Map<ResourceType, ResourceState>): Record<ResourceType, number> => {
    const percentages: Record<ResourceType, number> = {} as Record<ResourceType, number>;
    
    // Convert Map entries to array to avoid MapIterator error
    const resourceEntries = Array.from(resources.entries());
    for (const [type, resource] of resourceEntries) {
      if (resource.capacity > 0) {
        percentages[type] = (resource.current / resource.capacity) * 100;
      } else {
        percentages[type] = 0;
      }
    }
    
    return percentages;
  }, []);

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
    error
  };
} 