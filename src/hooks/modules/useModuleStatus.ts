import { useCallback, useEffect, useState } from 'react';
import { moduleManager } from '../../managers/module/ModuleManager';
import {
    ExtendedModuleStatus,
    ModuleAlert,
    moduleStatusManager,
    StatusHistoryEntry
} from '../../managers/module/ModuleStatusManager';
import { BaseModule, ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';

// Interface for module status hook result
interface UseModuleStatusResult {
  statusDetails: {
    currentStatus: ExtendedModuleStatus;
    previousStatus?: ExtendedModuleStatus;
    history: StatusHistoryEntry[];
    lastUpdated: number;
    metrics: {
      uptime: number;
      efficiency: number;
      reliability: number;
      performance: number;
    };
    alerts: ModuleAlert[];
  } | null;
  isLoading: boolean;
  error: string | null;
  module: BaseModule | null;
  currentStatus: ExtendedModuleStatus;
  previousStatus?: ExtendedModuleStatus;
  history: StatusHistoryEntry[];
  metrics: Record<string, number> | null;
  alerts: ModuleAlert[];
  updateStatus: (status: ExtendedModuleStatus, reason?: string) => void;
  acknowledgeAlert: (alertIndex: number) => void;
  getStatusColor: (status: ExtendedModuleStatus) => string;
  getAlertColor: (level: 'info' | 'warning' | 'error' | 'critical') => string;
  formatUptime: (ms: number) => string;
}

/**
 * Hook for accessing and managing module status
 * This connects to both the ModuleManager and ModuleStatusManager
 */
export function useModuleStatus(moduleId: string): UseModuleStatusResult {
  const [statusDetails, setStatusDetails] = useState<UseModuleStatusResult['statusDetails']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<BaseModule | null>(null);

  // Fetch module status on mount
  useEffect(() => {
    const fetchModuleStatus = () => {
      try {
        setIsLoading(true);

        // Get the module from ModuleManager
        const moduleData = moduleManager.getModule(moduleId);
        if (!moduleData) {
          throw new Error(`Module not found: ${moduleId}`);
        }
        setModule(moduleData);

        // Get status details from ModuleStatusManager
        const details = moduleStatusManager.getModuleStatusDetails(moduleId);
        if (!details) {
          throw new Error(`Status details not found for module: ${moduleId}`);
        }
        setStatusDetails(details);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModuleStatus();

    // Subscribe to module status events
    const unsubscribe = moduleManager.subscribeToEvent(
      EventType.MODULE_STATUS_CHANGED,
      (event: BaseEvent) => {
        if (event?.moduleId === moduleId) {
          // Refresh module status when it changes
          fetchModuleStatus();
        }
      }
    );

    return () => {
      // Cleanup subscription
      unsubscribe();
    };
  }, [moduleId]);

  // Update module status
  const updateStatus = useCallback(
    (status: ExtendedModuleStatus, reason?: string) => {
      try {
        const success = moduleStatusManager.updateModuleStatus(moduleId, status, reason);
        if (!success) {
          throw new Error(`Failed to update status for module: ${moduleId}`);
        }

        // Trigger a status changed event through the module manager
        moduleManager.publishEvent({
          type: EventType.MODULE_STATUS_CHANGED,
          moduleId,
          moduleType: module?.type ?? ('unknown' as ModuleType),
          timestamp: Date.now(),
          data: {
            status,
            reason,
            previousStatus: statusDetails?.currentStatus,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    },
    [moduleId, module, statusDetails]
  );

  // Acknowledge an alert
  const acknowledgeAlert = useCallback(
    (alertIndex: number) => {
      try {
        const success = moduleStatusManager.acknowledgeAlert(moduleId, alertIndex);
        if (!success) {
          throw new Error(`Failed to acknowledge alert for module: ${moduleId}`);
        }
        // Refresh status after acknowledging alert
        const updatedDetails = moduleStatusManager.getModuleStatusDetails(moduleId);
        if (updatedDetails) {
          setStatusDetails(updatedDetails);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    },
    [moduleId]
  );

  // Get status color
  const getStatusColor = useCallback((status: ExtendedModuleStatus): string => {
    switch (status) {
      case 'active':
        return '#4CAF50'; // Green
      case 'standby':
        return '#2196F3'; // Blue
      case 'constructing':
        return '#FF9800'; // Orange
      case 'inactive':
        return '#9E9E9E'; // Gray
      case 'maintenance':
        return '#FFEB3B'; // Yellow
      case 'error':
        return '#F44336'; // Red
      case 'critical':
        return '#D32F2F'; // Dark Red
      case 'offline':
        return '#000000'; // Black
      case 'optimized':
        return '#00C853'; // Light Green
      case 'degraded':
        return '#FFD600'; // Amber
      case 'overloaded':
        return '#FF6D00'; // Deep Orange
      case 'upgrading':
        return '#673AB7'; // Deep Purple
      case 'repairing':
        return '#00BCD4'; // Cyan
      case 'powersave':
        return '#3F51B5'; // Indigo
      case 'boost':
        return '#E91E63'; // Pink
      default:
        return '#9E9E9E'; // Default Gray
    }
  }, []);

  // Get alert color
  const getAlertColor = useCallback((level: 'info' | 'warning' | 'error' | 'critical'): string => {
    switch (level) {
      case 'info':
        return '#2196F3'; // Blue
      case 'warning':
        return '#FF9800'; // Orange
      case 'error':
        return '#F44336'; // Red
      case 'critical':
        return '#D32F2F'; // Dark Red
      default:
        return '#9E9E9E'; // Gray
    }
  }, []);

  // Format uptime
  const formatUptime = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }, []);

  return {
    statusDetails,
    isLoading,
    error,
    module,
    currentStatus: statusDetails?.currentStatus ?? 'inactive',
    previousStatus: statusDetails?.previousStatus,
    history: statusDetails?.history ?? [],
    metrics: statusDetails?.metrics ?? null,
    alerts: statusDetails?.alerts ?? [],
    updateStatus,
    acknowledgeAlert,
    getStatusColor,
    getAlertColor,
    formatUptime,
  };
}

/**
 * Hook to get all modules with their status
 */
export function useModulesWithStatus() {
  const [modules, setModules] = useState<BaseModule[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, ExtendedModuleStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModulesWithStatus = () => {
      try {
        setIsLoading(true);

        // Get all active modules
        const allModules = moduleManager.getActiveModules();
        setModules(allModules);

        // Get status for each module
        const statusMapping: Record<string, ExtendedModuleStatus> = {};
        allModules.forEach(module => {
          const status = moduleStatusManager.getModuleStatus(module.id);
          if (status) {
            statusMapping[module.id] = status;
          }
        });

        setStatusMap(statusMapping);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModulesWithStatus();

    // Subscribe to module status changes
    const unsubscribe = moduleManager.subscribeToEvent(EventType.MODULE_STATUS_CHANGED, () => {
      // Refresh all modules when unknown module status changes
      fetchModulesWithStatus();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    modules,
    statusMap,
    isLoading,
    error,
  };
}

/**
 * Hook to get modules with alerts
 */
export function useModuleAlerts(alertLevel?: 'info' | 'warning' | 'error' | 'critical') {
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [alertCounts, setAlertCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModuleAlerts = () => {
      try {
        setIsLoading(true);

        // Get modules with alerts
        const modulesWithAlerts = moduleStatusManager.getModulesWithAlerts(alertLevel);
        setModuleIds(modulesWithAlerts);

        // Count alerts for each module
        const counts: Record<string, number> = {};
        modulesWithAlerts.forEach(moduleId => {
          const alerts = moduleStatusManager.getModuleAlerts(moduleId, true);
          counts[moduleId] = alerts.length;
        });

        setAlertCounts(counts);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModuleAlerts();

    // Subscribe to error events
    const unsubscribe = moduleManager.subscribeToEvent(EventType.ERROR_OCCURRED, () => {
      // Refresh alerts when unknown error occurs
      fetchModuleAlerts();
    });

    return () => {
      unsubscribe();
    };
  }, [alertLevel]);

  return {
    moduleIds,
    alertCounts,
    isLoading,
    error,
  };
}
