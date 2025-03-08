import { BaseManager, ManagerMetadata } from './BaseManager';

/**
 * Error thrown when service initialization fails
 */
export class ServiceInitializationError extends Error {
  constructor(serviceName: string, cause?: Error) {
    super(`Failed to initialize service: ${serviceName}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'ServiceInitializationError';
    this.cause = cause;
  }
}

/**
 * Error thrown when a dependency cycle is detected
 */
export class DependencyCycleError extends Error {
  constructor(services: string[]) {
    super(`Dependency cycle detected: ${services.join(' -> ')}`);
    this.name = 'DependencyCycleError';
  }
}

/**
 * Configuration for a service registration
 */
export interface ServiceConfig {
  /**
   * An array of service names that this service depends on
   */
  dependencies?: string[];

  /**
   * Whether the service should be lazy initialized (on first request)
   * Default: false
   */
  lazyInit?: boolean;

  /**
   * Priority for initialization (higher values initialized first within same dependency level)
   * Default: 0
   */
  priority?: number;

  /**
   * Whether the service is required for the application to function
   * Default: true
   */
  required?: boolean;
}

/**
 * Registry of all services in the application, managing initialization order and dependencies
 */
export class ServiceRegistry {
  private services = new Map<string, BaseManager>();
  private serviceConfigs = new Map<string, ServiceConfig>();
  private initializedServices = new Set<string>();
  private initializationPromise: Promise<void> | null = null;
  private isInitializing = false;
  private isDisposing = false;

  /**
   * Register a service with the registry
   * @param service The service to register
   * @param config Configuration for how the service should be initialized
   * @returns The service registry (for chaining)
   */
  register<T extends BaseManager>(service: T, config: ServiceConfig = {}): this {
    if (this.services.has(service.name)) {
      throw new Error(`Service '${service.name}' already registered`);
    }

    this.services.set(service.name, service);
    this.serviceConfigs.set(service.name, {
      dependencies: [],
      lazyInit: false,
      priority: 0,
      required: true,
      ...config,
    });

    return this;
  }

  /**
   * Get a service by name
   * @param name The name of the service to get
   * @returns The service instance or undefined if not found
   */
  getService<T extends BaseManager>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  /**
   * Initialize all registered services, respecting their dependency order
   * @returns Promise that resolves when all services are initialized
   */
  async initialize(): Promise<void> {
    if (this.isInitializing) {
      return this.initializationPromise as Promise<void>;
    }

    this.isInitializing = true;
    this.initializationPromise = this.doInitialization();

    try {
      await this.initializationPromise;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Dispose all services in reverse initialization order
   * @returns Promise that resolves when all services are disposed
   */
  async dispose(): Promise<void> {
    if (this.isDisposing) {
      throw new Error('ServiceRegistry is already disposing');
    }

    this.isDisposing = true;

    try {
      // Dispose in reverse initialization order
      const servicesInInitOrder = Array.from(this.initializedServices);
      for (let i = servicesInInitOrder.length - 1; i >= 0; i--) {
        const serviceName = servicesInInitOrder[i];
        const service = this.services.get(serviceName);
        if (service) {
          await service.dispose();
        }
      }

      this.initializedServices.clear();
    } finally {
      this.isDisposing = false;
    }
  }

  /**
   * Get metadata for all services
   * @returns Array of service metadata
   */
  getServicesMetadata(): ManagerMetadata[] {
    return Array.from(this.services.values()).map(service => service.getMetadata());
  }

  /**
   * Check if a service is initialized
   * @param name The name of the service to check
   * @returns True if the service is initialized, false otherwise
   */
  isServiceInitialized(name: string): boolean {
    return this.initializedServices.has(name);
  }

  /**
   * Implementation of the initialization process
   */
  private async doInitialization(): Promise<void> {
    // Resolve dependencies order
    const initOrder = this.resolveInitializationOrder();

    // Initialize in dependency order
    for (const serviceName of initOrder) {
      const service = this.services.get(serviceName);
      const config = this.serviceConfigs.get(serviceName);

      if (!service || !config) {
        continue;
      }

      // Skip lazy services
      if (config.lazyInit) {
        continue;
      }

      try {
        // Collect dependencies
        const deps: Record<string, BaseManager> = {};
        for (const depName of config.dependencies || []) {
          const dep = this.services.get(depName);
          if (!dep) {
            throw new Error(`Dependency '${depName}' not found for service '${serviceName}'`);
          }

          // If dependency is not initialized yet, initialize it now
          if (!this.initializedServices.has(depName)) {
            await this.initializeService(depName);
          }

          deps[depName] = dep;
        }

        await service.initialize(deps);
        this.initializedServices.add(serviceName);
      } catch (error) {
        if (error instanceof Error && config.required) {
          throw new ServiceInitializationError(serviceName, error);
        }

        console.error(`Failed to initialize service '${serviceName}':`, error);
      }
    }
  }

  /**
   * Initialize a specific service by name
   */
  private async initializeService(name: string): Promise<void> {
    if (this.initializedServices.has(name)) {
      return;
    }

    const service = this.services.get(name);
    const config = this.serviceConfigs.get(name);

    if (!service || !config) {
      throw new Error(`Service '${name}' not found`);
    }

    // Collect dependencies
    const deps: Record<string, BaseManager> = {};
    for (const depName of config.dependencies || []) {
      const dep = this.services.get(depName);
      if (!dep) {
        throw new Error(`Dependency '${depName}' not found for service '${name}'`);
      }

      // Recursively initialize dependencies
      if (!this.initializedServices.has(depName)) {
        await this.initializeService(depName);
      }

      deps[depName] = dep;
    }

    await service.initialize(deps);
    this.initializedServices.add(name);
  }

  /**
   * Resolve the order in which services should be initialized based on dependencies
   * @returns Array of service names in initialization order
   */
  private resolveInitializationOrder(): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const temporaryMarked = new Set<string>();

    const visit = (serviceName: string, path: string[] = []): void => {
      // Check for circular dependencies
      if (temporaryMarked.has(serviceName)) {
        throw new DependencyCycleError([...path, serviceName]);
      }

      if (visited.has(serviceName)) {
        return;
      }

      // Mark the node temporarily to detect cycles
      temporaryMarked.add(serviceName);
      path.push(serviceName);

      // Get dependencies
      const config = this.serviceConfigs.get(serviceName);
      const dependencies = config?.dependencies || [];

      // Prioritize dependencies by their priority
      const prioritizedDeps = [...dependencies]
        .map(dep => ({
          name: dep,
          priority: this.serviceConfigs.get(dep)?.priority || 0,
        }))
        .sort((a, b) => b.priority - a.priority);

      // Visit dependencies first
      for (const dep of prioritizedDeps) {
        if (this.services.has(dep.name)) {
          visit(dep.name, [...path]);
        }
      }

      // Mark node as visited and add to result
      temporaryMarked.delete(serviceName);
      visited.add(serviceName);
      result.push(serviceName);
    };

    // Get all services sorted by priority
    const servicesByPriority = Array.from(this.services.keys())
      .map(name => ({
        name,
        priority: this.serviceConfigs.get(name)?.priority || 0,
      }))
      .sort((a, b) => b.priority - a.priority);

    // Visit each node
    for (const service of servicesByPriority) {
      if (!visited.has(service.name)) {
        visit(service.name);
      }
    }

    return result;
  }
}

// Create singleton instance
export const serviceRegistry = new ServiceRegistry();
