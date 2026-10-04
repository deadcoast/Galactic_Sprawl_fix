import { describe, expect, beforeEach, afterEach, it } from 'vitest';
import { BaseService, ServiceMetadata } from '../../lib/services/BaseService';
import { ServiceRegistry } from '../../lib/services/ServiceRegistry';

class TestService implements BaseService {
  public initializeCount = 0;
  public disposeCount = 0;
  private readonly initializeImpl: () => Promise<void>;

  constructor(initializeImpl?: () => Promise<void>) {
    this.initializeImpl = initializeImpl ?? (async () => {});
  }

  async initialize(): Promise<void> {
    this.initializeCount += 1;
    await this.initializeImpl();
  }

  async dispose(): Promise<void> {
    this.disposeCount += 1;
  }

  getMetadata(): ServiceMetadata {
    return {
      name: 'test',
      version: '1.0.0',
      status: 'ready',
    };
  }

  isReady(): boolean {
    return true;
  }

  handleError(): void {}
}

describe('ServiceRegistry', () => {
  const registry = ServiceRegistry.getInstance();

  beforeEach(async () => {
    await registry.dispose();
  });

  afterEach(async () => {
    await registry.dispose();
  });

  it('deduplicates concurrent initialization across shared dependencies', async () => {
    const dependencyService = new TestService(
      () =>
        new Promise(resolve => {
          setTimeout(resolve, 20);
        })
    );
    const parentService = new TestService();

    registry.register('dependency', () => dependencyService);
    registry.register('parent', () => parentService, {
      dependencies: ['dependency'],
    });

    await Promise.all([
      registry.getService('parent'),
      registry.getService('dependency'),
      registry.getService('parent'),
    ]);

    expect(dependencyService.initializeCount).toBe(1);
    expect(parentService.initializeCount).toBe(1);
  });

  it('throws with explicit chain when runtime dependency cycle exists', async () => {
    const serviceA = new TestService();
    const serviceB = new TestService();

    registry.register('serviceA', () => serviceA, { dependencies: ['serviceB'] });
    registry.register('serviceB', () => serviceB, { dependencies: ['serviceA'] });

    await expect(registry.getService('serviceA')).rejects.toThrow(
      /Circular dependency detected while initializing serviceA: serviceA -> serviceB -> serviceA/
    );
  });

  it('allows retry after failed initialization', async () => {
    let attempts = 0;
    const unstableService = new TestService(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('Transient init failure');
      }
    });

    registry.register('unstable', () => unstableService);

    await expect(registry.getService('unstable')).rejects.toThrow(/Transient init failure/);
    await expect(registry.getService('unstable')).resolves.toBeTruthy();
    expect(unstableService.initializeCount).toBe(2);
  });
});
