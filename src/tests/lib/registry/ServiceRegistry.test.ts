import { ServiceRegistry } from '../../../lib/registry/ServiceRegistry';
import { BaseService, ServiceMetadata } from '../../../lib/services/BaseService';
import { ErrorType } from '../../../services/ErrorLoggingService';

// ---- Mock for services ----
class MockService implements BaseService {
  private metadata: ServiceMetadata;
  private initializeCalled = false;
  private disposeCalled = false;

  constructor(name: string, public initializeDelay = 0, public shouldFailInit = false) {
    this.metadata = {
      name,
      version: '1.0.0',
      status: 'initializing',
    };
  }

  async initialize(): Promise<void> {
    this.initializeCalled = true;
    if (this.initializeDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.initializeDelay));
    }
    if (this.shouldFailInit) {
      throw new Error(`Failed to initialize ${this.metadata.name}`);
    }
    this.metadata.status = 'ready';
  }

  async dispose(): Promise<void> {
    this.disposeCalled = true;
    this.metadata.status = 'disposed';
  }

  getMetadata(): ServiceMetadata {
    return { ...this.metadata };
  }

  isReady(): boolean {
    return this.metadata.status === 'ready';
  }

  handleError(error: Error): void {
    this.metadata.lastError = {
      type: ErrorType.UNKNOWN,
      message: error.message,
      timestamp: Date.now(),
    };
  }

  wasInitializeCalled(): boolean {
    return this.initializeCalled;
  }

  wasDisposeCalled(): boolean {
    return this.disposeCalled;
  }
}

// ---- Mock for managers ----
class MockManager {
  private initialized = false;
  private disposed = false;

  constructor(private name: string, public initializeDelay = 0, public shouldFailInit = false) {}

  async initialize(): Promise<void> {
    this.initialized = true;
    if (this.initializeDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.initializeDelay));
    }
    if (this.shouldFailInit) {
      throw new Error(`Failed to initialize ${this.name}`);
    }
  }

  async dispose(): Promise<void> {
    this.disposed = true;
  }

  getName(): string {
    return this.name;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isDisposed(): boolean {
    return this.disposed;
  }
}

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    // Reset the singleton instance between tests
    ServiceRegistry['resetInstance']('ServiceRegistry');
    registry = ServiceRegistry.getInstance();
  });

  it('should register and retrieve services', () => {
    const serviceA = new MockService('ServiceA');
    registry.registerService(serviceA);

    const retrievedService = registry.getService('ServiceA');
    expect(retrievedService).toBe(serviceA);
  });

  it('should register and retrieve managers', () => {
    const managerA = new MockManager('ManagerA');
    registry.registerManager(managerA);

    const retrievedManager = registry.getManager('ManagerA');
    expect(retrievedManager).toBe(managerA);
  });

  it('should initialize services in dependency order', async () => {
    const serviceA = new MockService('ServiceA');
    const serviceB = new MockService('ServiceB');
    const serviceC = new MockService('ServiceC');
    
    registry.registerService(serviceA);
    registry.registerService(serviceB, undefined, ['ServiceA']);
    registry.registerService(serviceC, undefined, ['ServiceB']);
    
    await registry.initialize();
    
    expect(serviceA.wasInitializeCalled()).toBe(true);
    expect(serviceB.wasInitializeCalled()).toBe(true);
    expect(serviceC.wasInitializeCalled()).toBe(true);
  });

  it('should handle circular dependencies', async () => {
    const serviceA = new MockService('ServiceA');
    const serviceB = new MockService('ServiceB');
    
    registry.registerService(serviceA, undefined, ['ServiceB']);
    registry.registerService(serviceB, undefined, ['ServiceA']);
    
    await expect(registry.initialize()).rejects.toThrow(/Circular dependency detected/);
  });

  it('should dispose services in reverse dependency order', async () => {
    const serviceA = new MockService('ServiceA');
    const serviceB = new MockService('ServiceB');
    
    registry.registerService(serviceA);
    registry.registerService(serviceB, undefined, ['ServiceA']);
    
    await registry.initialize();
    await registry.dispose();
    
    expect(serviceA.wasDisposeCalled()).toBe(true);
    expect(serviceB.wasDisposeCalled()).toBe(true);
  });

  it('should handle initialization failures gracefully', async () => {
    const serviceA = new MockService('ServiceA', 0, true); // This service will fail to initialize
    const serviceB = new MockService('ServiceB');
    
    registry.registerService(serviceA);
    registry.registerService(serviceB, undefined, ['ServiceA']);
    
    await expect(registry.initialize()).rejects.toThrow(/Failed to initialize ServiceA/);
  });

  it('should check if services and managers exist', () => {
    const serviceA = new MockService('ServiceA');
    const managerA = new MockManager('ManagerA');
    
    registry.registerService(serviceA);
    registry.registerManager(managerA);
    
    expect(registry.hasService('ServiceA')).toBe(true);
    expect(registry.hasService('ServiceB')).toBe(false);
    expect(registry.hasManager('ManagerA')).toBe(true);
    expect(registry.hasManager('ManagerB')).toBe(false);
  });

  it('should throw an error when getting non-existent services or managers', () => {
    expect(() => registry.getService('NonExistentService')).toThrow(/not found in registry/);
    expect(() => registry.getManager('NonExistentManager')).toThrow(/not found in registry/);
  });
});