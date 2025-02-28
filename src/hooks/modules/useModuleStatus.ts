import { useCallback, useEffect, useState } from 'react';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  ExtendedModuleStatus,
  ModuleStatusDetails,
  moduleStatusManager,
} from '../../managers/module/ModuleStatusManager';

/**
 * Hook for tracking and managing module status
 */
export function useModuleStatus(moduleId?: string) {
  const [statusDetails, setStatusDetails] = useState<ModuleStatusDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load status details
  useEffect(() => {
    if (!moduleId) {
      setStatusDetails(null);
      setIsLoading(false);
      return;
    }

    try {
      const details = moduleStatusManager.getModuleStatusDetails(moduleId);

      if (details) {
        setStatusDetails(details);
      } else {
        // Initialize status tracking if not already done
        moduleStatusManager.initializeModuleStatus(moduleId);
        const newDetails = moduleStatusManager.getModuleStatusDetails(moduleId);
        setStatusDetails(newDetails || null);
      }

      setIsLoading(false);
    } catch (err) {
      setError(`Error loading module status: ${err}`);
      setIsLoading(false);
    }
  }, [moduleId]);

  // Subscribe to status events
  useEffect(() => {
    if (!moduleId) {
      return;
    }

    const handleStatusChanged = (event: any) => {
      if (event.moduleId === moduleId) {
        const details = moduleStatusManager.getModuleStatusDetails(moduleId);
        setStatusDetails(details || null);
      }
    };

    const handleErrorOccurred = (event: any) => {
      if (event.moduleId === moduleId) {
        const details = moduleStatusManager.getModuleStatusDetails(moduleId);
        setStatusDetails(details || null);
      }
    };

    // Subscribe to events
    const unsubscribeStatus = moduleEventBus.subscribe(
      'STATUS_CHANGED' as ModuleEventType,
      handleStatusChanged
    );
    const unsubscribeError = moduleEventBus.subscribe(
      'ERROR_OCCURRED' as ModuleEventType,
      handleErrorOccurred
    );

    return () => {
      if (typeof unsubscribeStatus === 'function') {
        unsubscribeStatus();
      }
      if (typeof unsubscribeError === 'function') {
        unsubscribeError();
      }
    };
  }, [moduleId]);

  // Update module status
  const updateStatus = useCallback(
    (status: ExtendedModuleStatus, reason?: string) => {
      if (!moduleId) {
        return false;
      }
      return moduleStatusManager.updateModuleStatus(moduleId, status, reason);
    },
    [moduleId]
  );

  // Add an alert
  const addAlert = useCallback(
    (level: 'info' | 'warning' | 'error' | 'critical', message: string) => {
      if (!moduleId) {
        return;
      }
      moduleStatusManager.addAlert(moduleId, level, message);
    },
    [moduleId]
  );

  // Acknowledge an alert
  const acknowledgeAlert = useCallback(
    (alertIndex: number) => {
      if (!moduleId) {
        return false;
      }
      return moduleStatusManager.acknowledgeAlert(moduleId, alertIndex);
    },
    [moduleId]
  );

  // Get status color
  const getStatusColor = useCallback((status?: ExtendedModuleStatus): string => {
    if (!status) {
      return 'gray';
    }

    switch (status) {
      case 'active':
        return 'green';
      case 'constructing':
        return 'yellow';
      case 'inactive':
        return 'gray';
      case 'optimized':
        return 'blue';
      case 'boost':
        return 'purple';
      case 'degraded':
        return 'orange';
      case 'overloaded':
        return 'orange';
      case 'maintenance':
      case 'upgrading':
      case 'repairing':
        return 'yellow';
      case 'error':
        return 'red';
      case 'critical':
        return 'darkred';
      case 'offline':
        return 'black';
      case 'standby':
        return 'lightblue';
      case 'powersave':
        return 'teal';
      default:
        return 'gray';
    }
  }, []);

  // Get alert color
  const getAlertColor = useCallback((level: 'info' | 'warning' | 'error' | 'critical'): string => {
    switch (level) {
      case 'info':
        return 'blue';
      case 'warning':
        return 'orange';
      case 'error':
        return 'red';
      case 'critical':
        return 'darkred';
      default:
        return 'gray';
    }
  }, []);

  // Format uptime
  const formatUptime = useCallback((uptime: number): string => {
    const seconds = Math.floor(uptime / 1000);
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
    // State
    statusDetails,
    isLoading,
    error,

    // Current status
    currentStatus: statusDetails?.currentStatus,
    previousStatus: statusDetails?.previousStatus,
    history: statusDetails?.history || [],
    metrics: statusDetails?.metrics,
    alerts: statusDetails?.alerts || [],

    // Actions
    updateStatus,
    addAlert,
    acknowledgeAlert,

    // Utilities
    getStatusColor,
    getAlertColor,
    formatUptime,
  };
}

/**
 * Hook for tracking modules with specific status or alerts
 */
export function useModulesWithStatus(
  status?: ExtendedModuleStatus,
  alertLevel?: 'info' | 'warning' | 'error' | 'critical'
) {
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load modules with status or alerts
  useEffect(() => {
    try {
      let ids: string[] = [];

      if (status) {
        ids = moduleStatusManager.getModulesByStatus(status);
      } else if (alertLevel) {
        ids = moduleStatusManager.getModulesWithAlerts(alertLevel);
      } else {
        // Get all modules with any alerts
        ids = moduleStatusManager.getModulesWithAlerts();
      }

      setModuleIds(ids);
      setIsLoading(false);
    } catch (err) {
      setError(`Error loading modules: ${err}`);
      setIsLoading(false);
    }
  }, [status, alertLevel]);

  // Subscribe to status events
  useEffect(() => {
    const handleStatusChanged = () => {
      try {
        let ids: string[] = [];

        if (status) {
          ids = moduleStatusManager.getModulesByStatus(status);
        } else if (alertLevel) {
          ids = moduleStatusManager.getModulesWithAlerts(alertLevel);
        } else {
          // Get all modules with any alerts
          ids = moduleStatusManager.getModulesWithAlerts();
        }

        setModuleIds(ids);
      } catch (err) {
        setError(`Error updating modules: ${err}`);
      }
    };

    const handleErrorOccurred = () => {
      if (alertLevel || !status) {
        try {
          const ids = alertLevel
            ? moduleStatusManager.getModulesWithAlerts(alertLevel)
            : moduleStatusManager.getModulesWithAlerts();

          setModuleIds(ids);
        } catch (err) {
          setError(`Error updating modules: ${err}`);
        }
      }
    };

    // Subscribe to events
    const unsubscribeStatus = moduleEventBus.subscribe(
      'STATUS_CHANGED' as ModuleEventType,
      handleStatusChanged
    );
    const unsubscribeError = moduleEventBus.subscribe(
      'ERROR_OCCURRED' as ModuleEventType,
      handleErrorOccurred
    );

    return () => {
      if (typeof unsubscribeStatus === 'function') {
        unsubscribeStatus();
      }
      if (typeof unsubscribeError === 'function') {
        unsubscribeError();
      }
    };
  }, [status, alertLevel]);

  return {
    moduleIds,
    isLoading,
    error,
  };
}
