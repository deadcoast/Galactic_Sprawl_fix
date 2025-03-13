import { AbstractBaseManager, ManagerStatus } from '../../../lib/managers/BaseManager';
import { BaseEvent } from '../../../lib/events/UnifiedEventSystem';
import { errorLoggingService } from '../../../services/ErrorLoggingService';

// Mock error logging service
jest.mock('../../../services/ErrorLoggingService', () => ({
  errorLoggingService: {
    logError: jest.fn(),
  },
  ErrorType: {
    RUNTIME: 'runtime',
  },
}));

/**
 * Simple event for testing
 */
interface TestEvent extends BaseEvent {
  type: string;
  payload?: any;
}

/**
 * Concrete implementation of AbstractBaseManager for testing
 */
class TestManager extends AbstractBaseManager<TestEvent> {
  public initializeCalled = false;
  public updateCalled = false;
  public disposeCalled = false;
  public initializationDelay = 0;
  public shouldFailInitialization = false;
  public shouldFailDisposal = false;
  public dependencies: Record<string, unknown> | undefined;
  public deltaTime = 0;

  constructor() {
    super('TestManager');
  }

  protected async onInitialize(dependencies?: Record<string, unknown>): Promise<void> {
    this.initializeCalled = true;
    this.dependencies = dependencies;

    if (this.initializationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.initializationDelay));
    }

    if (this.shouldFailInitialization) {
      throw new Error('Initialization failed');
    }
  }

  protected onUpdate(deltaTime: number): void {
    this.updateCalled = true;
    this.deltaTime = deltaTime;
  }

  protected async onDispose(): Promise<void> {
    this.disposeCalled = true;

    if (this.shouldFailDisposal) {
      throw new Error('Disposal failed');
    }
  }

  // Expose protected methods for testing
  public testPublish(event: TestEvent): void {
    this.publish(event);
  }

  public testSubscribe(eventType: string, handler: (event: TestEvent) => void): () => void {
    return this.subscribe(eventType, handler);
  }

  public getUnsubscribeFunctionsCount(): number {
    return this.unsubscribeFunctions.length;
  }

  public testIncrementMetric(key: string, increment = 1): void {
    this.incrementMetric(key, increment);
  }

  public testUpdateMetric(key: string, value: number): void {
    this.updateMetric(key, value);
  }
}

describe('AbstractBaseManager', () => {
  let manager: TestManager;

  beforeEach(() => {
    // Create a new manager instance for each test
    manager = new TestManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    manager.reset();
  });

  describe('initialization', () => {
    it('should initialize correctly', async () => {
      expect(manager.getStatus()).toBe(ManagerStatus.UNINITIALIZED);
      
      await manager.initialize();
      
      expect(manager.initializeCalled).toBe(true);
      expect(manager.getStatus()).toBe(ManagerStatus.READY);
      expect(manager.isInitialized()).toBe(true);
    });

    it('should handle dependencies', async () => {
      const dependencies = {
        dep1: 'value1',
        dep2: 'value2'
      };
      
      await manager.initialize(dependencies);
      
      expect(manager.dependencies).toEqual(dependencies);
      expect(manager.getMetadata().dependencies).toEqual(['dep1', 'dep2']);
    });

    it('should not reinitialize if already initialized', async () => {
      await manager.initialize();
      manager.initializeCalled = false;
      
      await manager.initialize();
      
      expect(manager.initializeCalled).toBe(false);
    });

    it('should handle initialization errors', async () => {
      manager.shouldFailInitialization = true;
      
      await expect(manager.initialize()).rejects.toThrow('Initialization failed');
      
      expect(manager.getStatus()).toBe(ManagerStatus.ERROR);
      expect(errorLoggingService.logError).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update when initialized', async () => {
      await manager.initialize();
      
      manager.update(16.67);
      
      expect(manager.updateCalled).toBe(true);
      expect(manager.deltaTime).toBe(16.67);
    });

    it('should not update when not initialized', () => {
      manager.update(16.67);
      
      expect(manager.updateCalled).toBe(false);
    });
  });

  describe('disposal', () => {
    it('should dispose correctly', async () => {
      await manager.initialize();
      
      await manager.dispose();
      
      expect(manager.disposeCalled).toBe(true);
      expect(manager.getStatus()).toBe(ManagerStatus.DISPOSED);
    });

    it('should not dispose if already disposed', async () => {
      await manager.initialize();
      await manager.dispose();
      
      manager.disposeCalled = false;
      
      await manager.dispose();
      
      expect(manager.disposeCalled).toBe(false);
    });

    it('should handle disposal errors', async () => {
      await manager.initialize();
      
      manager.shouldFailDisposal = true;
      
      await expect(manager.dispose()).rejects.toThrow('Disposal failed');
      
      expect(errorLoggingService.logError).toHaveBeenCalled();
    });
  });

  describe('events', () => {
    it('should handle event subscriptions and publishing', async () => {
      const handler = jest.fn();
      
      manager.testSubscribe('TEST_EVENT', handler);
      
      manager.testPublish({ type: 'TEST_EVENT', payload: 'test' });
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'TEST_EVENT',
        payload: 'test'
      }));
    });

    it('should track and clean up subscriptions', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      const unsubscribe1 = manager.testSubscribe('EVENT1', handler1);
      manager.testSubscribe('EVENT2', handler2);
      
      expect(manager.getUnsubscribeFunctionsCount()).toBe(2);
      
      unsubscribe1();
      
      expect(manager.getUnsubscribeFunctionsCount()).toBe(1);
      
      await manager.dispose();
      
      expect(manager.getUnsubscribeFunctionsCount()).toBe(0);
    });
  });

  describe('metrics', () => {
    it('should track metrics correctly', () => {
      manager.testUpdateMetric('testMetric', 42);
      
      expect(manager.getMetrics().testMetric).toBe(42);
      
      manager.testIncrementMetric('testMetric');
      
      expect(manager.getMetrics().testMetric).toBe(43);
      
      manager.testIncrementMetric('testMetric', 5);
      
      expect(manager.getMetrics().testMetric).toBe(48);
    });

    it('should convert metrics to stats in metadata', () => {
      manager.testUpdateMetric('metric1', 10);
      manager.testUpdateMetric('metric2', 20);
      
      const metadata = manager.getMetadata();
      
      expect(metadata.stats).toEqual({
        metric1: 10,
        metric2: 20,
      });
    });
  });

  describe('error handling', () => {
    it('should handle errors correctly', () => {
      const error = new Error('Test error');
      
      manager.handleError(error, { context: 'test' });
      
      expect(errorLoggingService.logError).toHaveBeenCalledWith(
        error,
        'runtime',
        undefined,
        expect.objectContaining({
          manager: 'TestManager',
          context: 'test'
        })
      );
    });
  });

  describe('reset', () => {
    it('should reset the manager state', async () => {
      await manager.initialize();
      
      manager.testUpdateMetric('metric1', 10);
      manager.testSubscribe('EVENT', jest.fn());
      
      manager.reset();
      
      expect(manager.getStatus()).toBe(ManagerStatus.UNINITIALIZED);
      expect(manager.getMetrics()).toEqual({});
      expect(manager.getUnsubscribeFunctionsCount()).toBe(0);
    });
  });

  describe('metadata', () => {
    it('should provide complete metadata', async () => {
      await manager.initialize();
      
      manager.testUpdateMetric('testMetric', 42);
      
      const metadata = manager.getMetadata();
      
      expect(metadata.name).toBe('TestManager');
      expect(metadata.isInitialized).toBe(true);
      expect(metadata.status).toBe('active');
      expect(metadata.stats).toEqual({ testMetric: 42 });
    });
  });
});