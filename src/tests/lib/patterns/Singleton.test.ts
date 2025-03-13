import { Singleton } from '../../../lib/patterns/Singleton';

// Test class extending Singleton
class TestSingleton extends Singleton<TestSingleton> {
  public value: number = 0;

  protected constructor() {
    super();
  }

  public setValue(value: number): void {
    this.value = value;
  }

  public async initialize(): Promise<void> {
    this.value = 42;
  }

  public async dispose(): Promise<void> {
    this.value = 0;
  }
}

// Another test class for multiple singleton types
class AnotherSingleton extends Singleton<AnotherSingleton> {
  public name: string = '';

  protected constructor() {
    super();
  }

  public setName(name: string): void {
    this.name = name;
  }
}

describe('Singleton', () => {
  afterEach(() => {
    // Reset singleton instances between tests
    Singleton['instances'] = new Map();
  });

  it('should create only one instance', () => {
    const instance1 = TestSingleton.getInstance();
    const instance2 = TestSingleton.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should maintain separate instances for different classes', () => {
    const testInstance = TestSingleton.getInstance();
    const anotherInstance = AnotherSingleton.getInstance();

    testInstance.setValue(10);
    anotherInstance.setName('test');

    expect(testInstance.value).toBe(10);
    expect(anotherInstance.name).toBe('test');

    // Get instances again to ensure they're the same
    const testInstance2 = TestSingleton.getInstance();
    const anotherInstance2 = AnotherSingleton.getInstance();

    expect(testInstance2.value).toBe(10);
    expect(anotherInstance2.name).toBe('test');
  });

  it('should properly initialize instance', async () => {
    const instance = TestSingleton.getInstance();
    await instance.initialize?.();
    expect(instance.value).toBe(42);
  });

  it('should properly dispose instance', async () => {
    const instance = TestSingleton.getInstance();
    instance.setValue(100);
    await instance.dispose?.();
    expect(instance.value).toBe(0);
  });

  it('should reset instance when calling resetInstance', () => {
    const instance1 = TestSingleton.getInstance();
    instance1.setValue(10);
    
    // Reset the instance
    Singleton.resetInstance('TestSingleton');
    
    // Get a new instance
    const instance2 = TestSingleton.getInstance();
    
    // Should be a new instance with default value
    expect(instance1).not.toBe(instance2);
    expect(instance2.value).toBe(0);
  });
});