/**
 * @context: ui-system, registry-system, hooks-library
 *
 * Hook for integrating UI components with the Manager Registry system
 */
import { useCallback, useEffect, useState } from 'react';
import { ManagerStatus } from '../../lib/managers/BaseManager';
import { ServiceRegistry } from '../../lib/registry/ServiceRegistry';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';

// Define a compatible BaseManager interface that aligns with what ServiceRegistry expects
// We need this to avoid type conflicts between different BaseManager definitions in the codebase
interface RegistryCompatibleManager {
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  getName(): string;
}

// More flexible manager type interfaces for different manager implementations
interface HasInitialize {
  initialize: (dependencies?: Record<string, unknown>) => Promise<void>;
}

interface HasIsInitialized {
  isInitialized: () => boolean;
}

interface HasGetStatus {
  getStatus: () => ManagerStatus | string;
}

interface HasGetName {
  getName: () => string;
}

// Type guard functions
function hasInitialize(obj: unknown): obj is HasInitialize {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'initialize' in obj &&
    typeof (obj as HasInitialize).initialize === 'function'
  );
}

function hasIsInitialized(obj: unknown): obj is HasIsInitialized {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'isInitialized' in obj &&
    typeof (obj as HasIsInitialized).isInitialized === 'function'
  );
}

function hasGetStatus(obj: unknown): obj is HasGetStatus {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'getStatus' in obj &&
    typeof (obj as HasGetStatus).getStatus === 'function'
  );
}

function hasGetName(obj: unknown): obj is HasGetName {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'getName' in obj &&
    typeof (obj as HasGetName).getName === 'function'
  );
}

/**
 * Hook for accessing a manager from the registry and handling its lifecycle
 *
 * @param managerGetter Function that gets the manager from the registry
 * @param dependencies Optional dependency array for when to refresh manager access
 * @returns The manager instance and loading/error states
 */
export function useManager<T>(managerGetter: () => T, dependencies: unknown[] = []) {
  const [manager, setManager] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get the manager instance
  useEffect(() => {
    const getManager = async () => {
      try {
        setLoading(true);
        const managerInstance = managerGetter();

        // Use type guards for safe method access
        if (hasInitialize(managerInstance)) {
          // Check initialization state if available
          if (hasIsInitialized(managerInstance)) {
            if (!managerInstance.isInitialized()) {
              await managerInstance.initialize();
            }
          } else {
            // If no isInitialized method, try to initialize unknownway
            // Munknown managers can handle multiple initialize calls
            await managerInstance.initialize();
          }
        }

        // Set initialized state based on available methods
        let initialized = false;
        if (hasIsInitialized(managerInstance)) {
          initialized = managerInstance.isInitialized();
        } else if (hasGetStatus(managerInstance)) {
          // Check if it has IBaseManager's getStatus
          const status = managerInstance.getStatus();
          initialized = status === ManagerStatus.READY || status === 'ready';
        } else {
          // Assume initialized if we got this far
          initialized = true;
        }

        setManager(managerInstance);
        setIsInitialized(initialized);
        setError(null);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);

        // Get manager name safely
        let managerName = 'unknown';
        try {
          // Try to get function name from managerGetter
          managerName = managerGetter.name || 'unknown';
        } catch {
          // Fallback silently
        }

        // Log error
        errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.HIGH, {
          component: 'useManager',
          managerName,
        });

        setManager(null);
        setIsInitialized(false);
      } finally {
        setLoading(false);
      }
    };

    getManager();

    // Cleanup - dispose manager if needed
    return () => {
      // Manager disposal would typically be handled by the registry
      // We don't want to dispose managers when components unmount
      // because they are singletons used across the application
    };
  }, dependencies);

  return {
    manager,
    loading,
    error,
    isInitialized,
  };
}

/**
 * Hook for accessing the service registry directly
 *
 * @returns The service registry instance
 */
export function useServiceRegistry() {
  const [registry, setRegistry] = useState<ServiceRegistry | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Get the registry instance
  useEffect(() => {
    try {
      // We need to use call to properly bind the 'this' context because of the protected constructor
      // @ts-expect-error - ServiceRegistry's getInstance needs to be called this way
      const registryInstance = ServiceRegistry.getInstance.call(ServiceRegistry);
      // Cast the instance to ServiceRegistry since we know that's what it returns
      setRegistry(registryInstance as unknown as ServiceRegistry);
      setError(null);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);

      // Log error
      errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.HIGH, {
        component: 'useServiceRegistry',
      });

      setRegistry(null);
    }
  }, []);

  // Check if a manager is registered
  const hasManager = useCallback(
    (name: string): boolean => {
      if (!registry) {
        return false;
      }

      try {
        return registry.hasManager(name);
      } catch (e) {
        return false;
      }
    },
    [registry]
  );

  // Get a manager by name
  // Use a generic with the RegistryCompatibleManager constraint to match ServiceRegistry
  const getManager = useCallback(
    <T extends RegistryCompatibleManager>(name: string): T | null => {
      if (!registry) {
        return null;
      }

      try {
        // ServiceRegistry.getManager returns T extends BaseManager
        return registry.getManager<T>(name);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));

        // Log error
        errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
          component: 'useServiceRegistry.getManager',
          managerName: name,
        });

        return null;
      }
    },
    [registry]
  );

  return {
    registry,
    error,
    hasManager,
    getManager,
  };
}

/**
 * Hook for registering a new manager
 *
 * @returns Function to register a manager
 */
export function useManagerRegistration() {
  const { registry, error: registryError } = useServiceRegistry();
  const [error, setError] = useState<Error | null>(registryError);

  // Using a more specific type for the registry, but a more general type for the manager
  // to improve compatibility with different manager implementations
  const registerManager = useCallback(
    (manager: unknown, name?: string, dependencies: string[] = []): boolean => {
      if (!registry) {
        setError(new Error('Registry not available'));
        return false;
      }

      try {
        // Get manager name safely
        let managerName = name;
        if (!managerName) {
          if (hasGetName(manager)) {
            managerName = manager.getName();
          } else if (
            manager !== null &&
            typeof manager === 'object' &&
            'name' in manager &&
            typeof (manager as { name: string }).name === 'string'
          ) {
            // Try to get from name property
            managerName = (manager as { name: string }).name;
          }
        }

        // Use a cast to RegistryCompatibleManager which matches what ServiceRegistry expects
        registry.registerManager(manager as RegistryCompatibleManager, managerName, dependencies);
        return true;
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);

        // Try to get a name for the manager for logging purposes
        let managerDisplayName = name || 'unknown';
        if (!name) {
          if (hasGetName(manager)) {
            managerDisplayName = manager.getName();
          } else if (
            manager !== null &&
            typeof manager === 'object' &&
            'name' in manager &&
            typeof (manager as { name: string }).name === 'string'
          ) {
            managerDisplayName = (manager as { name: string }).name;
          }
        }

        // Log error
        errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
          component: 'useManagerRegistration.registerManager',
          managerName: managerDisplayName,
        });

        return false;
      }
    },
    [registry]
  );

  return {
    registerManager,
    error,
  };
}
