import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../services/logging/ErrorLoggingService';
import { Singleton } from '../patterns/Singleton';
import { BaseService } from '../services/BaseService';

/**
 * Interface for BaseManager (placeholder until we refactor managers)
 */
export interface BaseManager {
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  getName(): string;
}

/**
 * Registry entry with metadata
 */
export interface RegistryEntry<T> {
  instance: T;
  name: string;
  initialized: boolean;
  dependencies: string[];
}

/**
 * A unified service registry that handles both service and manager registration
 * with proper dependency handling and lifecycle management.
 */
export class ServiceRegistry extends Singleton<ServiceRegistry> {
  private services = new Map<string, RegistryEntry<BaseService>>();
  private managers = new Map<string, RegistryEntry<BaseManager>>();
  private initialized = false;

  protected constructor() {
    super();
  }

  /**
   * Registers a service with the registry
   * @param service The service instance to register
   * @param name Optional name for the service (defaults to service.getMetadata().name)
   * @param dependencies Optional array of dependency service names
   */
  public registerService(service: BaseService, name?: string, dependencies: string[] = []): void {
    const serviceName = name || service.getMetadata().name;

    if (this.services.has(serviceName)) {
      console.warn(`Service ${serviceName} is already registered. Skipping.`);
      return;
    }

    this.services.set(serviceName, {
      instance: service,
      name: serviceName,
      initialized: false,
      dependencies,
    });
  }

  /**
   * Registers a manager with the registry
   * @param manager The manager instance to register
   * @param name Optional name for the manager (defaults to manager.getName())
   * @param dependencies Optional array of dependency service/manager names
   */
  public registerManager(manager: BaseManager, name?: string, dependencies: string[] = []): void {
    const managerName = name || manager.getName();

    if (this.managers.has(managerName)) {
      console.warn(`Manager ${managerName} is already registered. Skipping.`);
      return;
    }

    this.managers.set(managerName, {
      instance: manager,
      name: managerName,
      initialized: false,
      dependencies,
    });
  }

  /**
   * Retrieves a service by name
   * @param name The name of the service to retrieve
   * @returns The service instance
   * @throws Error if service is not found
   */
  public getService<T extends BaseService>(name: string): T {
    const entry = this.services.get(name);
    if (!entry) {
      throw new Error(`Service ${name} not found in registry`);
    }
    return entry.instance as T;
  }

  /**
   * Retrieves a manager by name
   * @param name The name of the manager to retrieve
   * @returns The manager instance
   * @throws Error if manager is not found
   */
  public getManager<T extends BaseManager>(name: string): T {
    const entry = this.managers.get(name);
    if (!entry) {
      throw new Error(`Manager ${name} not found in registry`);
    }
    return entry.instance as T;
  }

  /**
   * Checks if a service is registered
   * @param name The name of the service to check
   * @returns True if the service is registered, false otherwise
   */
  public hasService(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Checks if a manager is registered
   * @param name The name of the manager to check
   * @returns True if the manager is registered, false otherwise
   */
  public hasManager(name: string): boolean {
    return this.managers.has(name);
  }

  /**
   * Initializes all registered services and managers in dependency order
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Check for circular dependencies
      this.detectCircularDependencies();

      // Initialize services in dependency order
      const serviceInitOrder = this.getInitializationOrder([...this.services.keys()], true);
      for (const serviceName of serviceInitOrder) {
        const entry = this.services.get(serviceName);
        if (!entry) {
          continue;
        }

        try {
          await entry.instance.initialize();
          entry.initialized = true;
        } catch (error) {
          errorLoggingService.logError(error as Error, ErrorType.INITIALIZATION, undefined, {
            service: serviceName,
          });
          throw error;
        }
      }

      // Initialize managers in dependency order
      const managerInitOrder = this.getInitializationOrder([...this.managers.keys()], false);
      for (const managerName of managerInitOrder) {
        const entry = this.managers.get(managerName);
        if (!entry) {
          continue;
        }

        try {
          await entry.instance.initialize();
          entry.initialized = true;
        } catch (error) {
          errorLoggingService.logError(error as Error, ErrorType.INITIALIZATION, undefined, {
            manager: managerName,
          });
          throw error;
        }
      }

      this.initialized = true;
    } catch (error) {
      errorLoggingService.logError(error as Error, ErrorType.INITIALIZATION, undefined, {
        context: 'ServiceRegistry.initialize',
      });
      throw error;
    }
  }

  /**
   * Disposes of all registered services and managers in reverse dependency order
   */
  public async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Dispose managers in reverse initialization order
      const managerInitOrder = this.getInitializationOrder([...this.managers.keys()], false);
      for (const managerName of managerInitOrder.reverse()) {
        const entry = this.managers.get(managerName);
        if (!entry?.initialized) {
          continue;
        }

        try {
          await entry.instance.dispose();
          entry.initialized = false;
        } catch (error) {
          errorLoggingService.logError(error as Error, ErrorType.INITIALIZATION, undefined, {
            manager: managerName,
          });
        }
      }

      // Dispose services in reverse initialization order
      const serviceInitOrder = this.getInitializationOrder([...this.services.keys()], true);
      for (const serviceName of serviceInitOrder.reverse()) {
        const entry = this.services.get(serviceName);
        if (!entry?.initialized) {
          continue;
        }

        try {
          await entry.instance.dispose();
          entry.initialized = false;
        } catch (error) {
          errorLoggingService.logError(error as Error, ErrorType.INITIALIZATION, undefined, {
            service: serviceName,
          });
        }
      }

      this.initialized = false;
    } catch (error) {
      errorLoggingService.logError(error as Error, ErrorType.INITIALIZATION, undefined, {
        context: 'ServiceRegistry.dispose',
      });
      throw error;
    }
  }

  /**
   * Gets the initialization order for a set of services or managers
   * @param names The names of the services/managers to order
   * @param isService Whether to check service dependencies (true) or manager dependencies (false)
   * @returns An array of names in dependency order
   */
  private getInitializationOrder(names: string[], isService: boolean): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (name: string) => {
      if (visited.has(name)) {
        return;
      }
      visited.add(name);

      const entries = isService ? this.services : this.managers;
      const entry = entries.get(name);
      if (!entry) {
        return;
      }

      // Visit dependencies first
      for (const dep of entry.dependencies) {
        visit(dep);
      }

      result?.push(name);
    };

    for (const name of names) {
      visit(name);
    }

    return result;
  }

  /**
   * Detects circular dependencies in the services and managers
   * @throws Error if a circular dependency is detected
   */
  private detectCircularDependencies(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkForCycles = (name: string, isService: boolean): boolean => {
      if (recursionStack.has(name)) {
        throw new Error(`Circular dependency detected involving ${name}`);
      }

      if (visited.has(name)) {
        return false;
      }

      visited.add(name);
      recursionStack.add(name);

      const entries = isService ? this.services : this.managers;
      const entry = entries.get(name);

      if (entry) {
        for (const dep of entry.dependencies) {
          const isDepService = this.services.has(dep);
          checkForCycles(dep, isDepService);
        }
      }

      recursionStack.delete(name);
      return false;
    };

    // Check all services and managers
    for (const name of this.services.keys()) {
      checkForCycles(name, true);
    }

    for (const name of this.managers.keys()) {
      checkForCycles(name, false);
    }
  }
}

// Create a class with a public constructor that extends ServiceRegistry
class ServiceRegistryInstance extends ServiceRegistry {}

// Export singleton instance with a TypeScript expect-error comment to bypass the 'this' context error
// @ts-expect-error: The 'this' context error is a TypeScript limitation with singleton pattern
export const serviceRegistry = ServiceRegistryInstance.getInstance();
