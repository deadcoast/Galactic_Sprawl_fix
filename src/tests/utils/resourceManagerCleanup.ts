import { registerResourceManager } from './testStateReset';

/**
 * Interface for resource managers that support cleanup
 */
export interface CleanableResourceManager {
  cleanup?: () => void;
  reset?: () => void;
  clear?: () => void;
  dispose?: () => void;
}

/**
 * Register a resource manager for cleanup
 * This function will try to call the appropriate cleanup method on the manager
 * @param manager The resource manager to clean up
 * @param name Optional name for logging purposes
 */
export function registerManagerForCleanup<T extends CleanableResourceManager>(
  manager: T,
  name?: string
): void {
  registerResourceManager({
    cleanup: () => {
      const managerName = name || manager.constructor?.name || 'Unknown Manager';

      // Try different cleanup methods in order of preference
      if (typeof manager.cleanup === 'function') {
        manager.cleanup();
      } else if (typeof manager.reset === 'function') {
        manager.reset();
      } else if (typeof manager.clear === 'function') {
        manager.clear();
      } else if (typeof manager.dispose === 'function') {
        manager.dispose();
      } else {
        console.warn(`No cleanup method found for ${managerName}`);
      }
    },
  });
}

/**
 * Create a cleanup wrapper for a resource manager
 * This ensures that the manager is properly cleaned up after each test
 * @param managerFactory Factory function that creates the manager
 * @param name Optional name for logging purposes
 * @returns The created manager
 */
export function createCleanableManager<T extends CleanableResourceManager>(
  managerFactory: () => T,
  name?: string
): T {
  const manager = managerFactory();
  registerManagerForCleanup(manager, name);
  return manager;
}

/**
 * Utility class for managing multiple resource managers
 * This class provides methods for registering and cleaning up multiple managers
 */
export class ResourceManagerRegistry {
  private managers: Array<{ manager: CleanableResourceManager; name?: string }> = [];

  /**
   * Register a manager for cleanup
   * @param manager The manager to register
   * @param name Optional name for logging purposes
   * @returns The registered manager (for chaining)
   */
  register<T extends CleanableResourceManager>(manager: T, name?: string): T {
    this.managers.push({ manager, name });
    registerManagerForCleanup(manager, name);
    return manager;
  }

  /**
   * Create and register a manager
   * @param managerFactory Factory function that creates the manager
   * @param name Optional name for logging purposes
   * @returns The created manager
   */
  create<T extends CleanableResourceManager>(managerFactory: () => T, name?: string): T {
    const manager = managerFactory();
    return this.register(manager, name);
  }

  /**
   * Clean up all registered managers
   */
  cleanup(): void {
    // Clean up in reverse order (last registered, first cleaned up)
    for (let i = this.managers.length - 1; i >= 0; i--) {
      const { manager, name } = this.managers[i];
      try {
        if (typeof manager.cleanup === 'function') {
          manager.cleanup();
        } else if (typeof manager.reset === 'function') {
          manager.reset();
        } else if (typeof manager.clear === 'function') {
          manager.clear();
        } else if (typeof manager.dispose === 'function') {
          manager.dispose();
        }
      } catch (error) {
        console.warn(`Error cleaning up manager ${name || 'unknown'}:`, error);
      }
    }

    // Clear the managers array
    this.managers = [];
  }
}

/**
 * Create a registry for managing multiple resource managers
 * @returns A new ResourceManagerRegistry
 */
export function createResourceManagerRegistry(): ResourceManagerRegistry {
  const registry = new ResourceManagerRegistry();

  // Register the registry's cleanup method to be called during global state reset
  registerResourceManager({
    cleanup: () => registry.cleanup(),
  });

  return registry;
}
