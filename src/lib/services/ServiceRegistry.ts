import { BaseService, ServiceMetadata } from './BaseService';

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
 * Service factory function type
 */
export type ServiceFactory = (dependencies: Record<string, BaseService>) => BaseService;

/**
 * Service registration information
 */
interface ServiceRegistration {
  name: string;
  factory: ServiceFactory;
  config: ServiceConfig;
  instance?: BaseService;
  initialized: boolean;
}

/**
 * Service registry that manages service lifecycle and dependencies
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services = new Map<string, ServiceRegistration>();
  private initializing = new Set<string>();

  protected constructor() {}

  /**
   * Get the singleton instance of the service registry
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a new service with the registry
   */
  public register(
    name: string,
    factory: ServiceFactory,
    config: Partial<ServiceConfig> = {}
  ): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }

    const defaultConfig: ServiceConfig = {
      dependencies: [],
      lazyInit: false,
      priority: 0,
      required: true,
    };

    this.services.set(name, {
      name,
      factory,
      config: { ...defaultConfig, ...config },
      initialized: false,
    });
  }

  /**
   * Initialize all registered services in dependency order
   */
  public async initialize(): Promise<void> {
    const sortedServices = this.sortServicesByDependencies();

    for (const service of sortedServices) {
      if (!service.config.lazyInit) {
        await this.initializeService(service.name);
      }
    }
  }

  /**
   * Get a service instance by name
   */
  public async getService<T extends BaseService>(name: string): Promise<T> {
    const registration = this.services.get(name);
    if (!registration) {
      throw new Error(`Service ${name} is not registered`);
    }

    if (!registration.initialized) {
      await this.initializeService(name);
    }

    return registration.instance as T;
  }

  /**
   * Get metadata for all registered services
   */
  public getServicesMetadata(): Record<string, ServiceMetadata> {
    const metadata: Record<string, ServiceMetadata> = {};
    for (const [name, registration] of this.services) {
      if (registration.instance) {
        metadata[name] = registration.instance.getMetadata();
      }
    }
    return metadata;
  }

  /**
   * Dispose of all services in reverse dependency order
   */
  public async dispose(): Promise<void> {
    const sortedServices = this.sortServicesByDependencies().reverse();

    for (const service of sortedServices) {
      if (service.instance) {
        await service.instance.dispose();
      }
    }

    this.services.clear();
  }

  private async initializeService(name: string): Promise<void> {
    if (this.initializing.has(name)) {
      throw new Error(`Circular dependency detected while initializing ${name}`);
    }

    const registration = this.services.get(name);
    if (!registration) {
      throw new Error(`Service ${name} is not registered`);
    }

    if (registration.initialized) {
      return;
    }

    this.initializing.add(name);

    try {
      // Initialize dependencies first
      const dependencies: Record<string, BaseService> = {};
      for (const depName of registration.config.dependencies ?? []) {
        dependencies[depName] = await this.getService(depName);
      }

      // Create and initialize the service
      const instance = registration.factory(dependencies);
      await instance.initialize(dependencies);

      registration.instance = instance;
      registration.initialized = true;
    } finally {
      this.initializing.delete(name);
    }
  }

  private sortServicesByDependencies(): ServiceRegistration[] {
    const visited = new Set<string>();
    const sorted: ServiceRegistration[] = [];

    const visit = (name: string, path: Set<string>) => {
      if (path.has(name)) {
        throw new Error(
          `Circular dependency detected: ${Array.from(path).join(' -> ')} -> ${name}`
        );
      }

      if (visited.has(name)) {
        return;
      }

      const registration = this.services.get(name);
      if (!registration) {
        throw new Error(`Service ${name} is not registered`);
      }

      path.add(name);

      for (const dep of registration.config.dependencies ?? []) {
        visit(dep, new Set(path));
      }

      path.delete(name);
      visited.add(name);
      sorted.push(registration);
    };

    for (const [name] of this.services) {
      visit(name, new Set());
    }

    return sorted.sort((a, b) => (b.config.priority ?? 0) - (a.config.priority ?? 0));
  }
}
