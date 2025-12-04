/**
 * @context: ui-system, module-system, hooks-library
 *
 * Hook for integrating UI components with the Module System
 */
import { useCallback, useEffect, useState } from 'react';
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
import { moduleManager } from '../../managers/module/ModuleManager';
import
  {
    errorLoggingService,
    ErrorSeverity,
    ErrorType,
  } from '../../services/logging/ErrorLoggingService';
import { BaseModule, ModuleType } from '../../types/buildings/ModuleTypes';
import { EventType } from '../../types/events/EventTypes';
import { ModuleStatus } from '../../types/modules/ModuleTypes';

/**
 * Hook for retrieving and interacting with a specific module
 *
 * @param moduleId The ID of the module to interact with
 * @returns Object containing module data, status, and module-related functions
 */
export function useModule(moduleId: string) {
  const [module, setModule] = useState<BaseModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch module data
  useEffect(() => {
    const fetchModule = () => {
      try {
        setLoading(true);

        // Get module data
        const moduleData = moduleManager.getModule(moduleId);
        setModule(moduleData ?? null);
        setError(null);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);

        // Log error
        errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
          component: 'useModule',
          moduleId,
        });
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchModule();

    // Subscribe to module events
    const moduleEventTypes = [
      EventType.MODULE_UPDATED,
      EventType.MODULE_STATUS_CHANGED,
      EventType.MODULE_ACTIVATED,
      EventType.MODULE_DEACTIVATED,
      EventType.MODULE_UPGRADED,
    ];

    const unsubscribes = moduleEventTypes.map(eventType =>
      moduleEventBus.subscribe(eventType, event => {
        if (event?.data?.moduleId === moduleId) {
          fetchModule();
        }
      })
    );

    // Return cleanup function
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [moduleId]);

  // Module activation function
  const activateModule = useCallback(() => {
    try {
      // Use setModuleActive method from moduleManager instead of legacy dispatch
      moduleManager.setModuleActive(moduleId, true);
      return true;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);

      // Log error
      errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
        component: 'useModule.activateModule',
        moduleId,
      });

      return false;
    }
  }, [moduleId]);

  // Module deactivation function
  const deactivateModule = useCallback(() => {
    try {
      // Use setModuleActive method from moduleManager instead of legacy dispatch
      moduleManager.setModuleActive(moduleId, false);
      return true;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);

      // Log error
      errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
        component: 'useModule.deactivateModule',
        moduleId,
      });

      return false;
    }
  }, [moduleId]);

  // Module upgrade function
  const upgradeModule = useCallback(() => {
    try {
      moduleManager.upgradeModule(moduleId);
      return true;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);

      // Log error
      errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
        component: 'useModule.upgradeModule',
        moduleId,
      });

      return false;
    }
  }, [moduleId]);

  return {
    module,
    loading,
    error,
    activateModule,
    deactivateModule,
    upgradeModule,
    status: module?.status ?? ModuleStatus.INACTIVE,
  };
}

/**
 * Hook for retrieving and interacting with all modules of a specific type
 *
 * @param moduleType Optional type of modules to retrieve (all modules if omitted)
 * @returns Object containing module data, loading state, and module-related functions
 */
export function useModules(moduleType?: ModuleType) {
  const [modules, setModules] = useState<BaseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch modules
  useEffect(() => {
    const fetchModules = () => {
      try {
        setLoading(true);

        // Get modules
        let moduleData: BaseModule[];

        if (moduleType) {
          moduleData = moduleManager.getModulesByType(moduleType);
        } else {
          // Get all modules by combining active modules and filtering by type
          moduleData = Array.from(moduleManager.getActiveModules());
        }

        setModules(moduleData || []);
        setError(null);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);

        // Log error
        errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
          component: 'useModules',
          moduleType: moduleType ?? 'all',
        });
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchModules();

    // Subscribe to module events
    const moduleEventTypes = [
      EventType.MODULE_CREATED,
      EventType.MODULE_REMOVED,
      EventType.MODULE_UPDATED,
      EventType.MODULE_STATUS_CHANGED,
      EventType.MODULE_ACTIVATED,
      EventType.MODULE_DEACTIVATED,
      EventType.MODULE_UPGRADED,
    ];

    const unsubscribes = moduleEventTypes.map(eventType =>
      moduleEventBus.subscribe(eventType, _event => {
        // Refetch all modules when unknown module event occurs
        fetchModules();
      })
    );

    // Return cleanup function
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [moduleType]);

  // Function to create a new module
  const createModule = useCallback(
    (moduleConfig: { name: string; type: ModuleType; position?: { x: number; y: number } }) => {
      try {
        // Provide default position if not provided
        const position = moduleConfig.position ?? { x: 0, y: 0 };
        return moduleManager.createModule(moduleConfig.type, position);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);

        // Log error
        errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
          component: 'useModules.createModule',
          moduleConfig: JSON.stringify(moduleConfig),
        });

        return null;
      }
    },
    []
  );

  // Function to remove a module
  const removeModule = useCallback(
    (moduleId: string) => {
      try {
        // Try to use proper removal method or log error if not available
        // Cast to unknown first then to an interface with optional destroyModule method
        const extendedManager = moduleManager as unknown as {
          destroyModule?: (moduleId: string) => boolean;
        };

        if (typeof extendedManager.destroyModule === 'function') {
          return extendedManager.destroyModule(moduleId);
        }

        console.warn('[useModules] removeModule: No direct module removal method available');
        moduleEventBus.emit({
          type: EventType.MODULE_REMOVED,
          moduleId,
          moduleType: modules.find(m => m.id === moduleId)?.type ?? ('unknown' as ModuleType),
          timestamp: Date.now(),
          data: { moduleId },
        });

        return true;
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);

        // Log error
        errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
          component: 'useModules.removeModule',
          moduleId,
        });

        return false;
      }
    },
    [modules]
  );

  return {
    modules,
    loading,
    error,
    createModule,
    removeModule,
    getModuleById: useCallback((id: string) => modules.find(m => m.id === id), [modules]),
  };
}
