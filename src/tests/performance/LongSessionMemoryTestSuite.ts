/**
 * LongSessionMemoryTestSuite.ts
 *
 * Test suite for long-term memory performance testing
 */

export interface MemoryTestResult {
  testName: string;
  startTime: number;
  endTime: number;
  memoryBefore: number;
  memoryAfter: number;
  heapUsed: number;
  duration: number;
  passed: boolean;
  details?: string;
}

export interface MemorySuiteConfig {
  iterations: number;
  dataSize: 'small' | 'medium' | 'large';
  allowGC: boolean;
  trackDetailedStats: boolean;
  delayBetweenTests: number;
}

/**
 * Long session memory test suite
 */
export class LongSessionMemoryTestSuite {
  private config: MemorySuiteConfig;
  private results: MemoryTestResult[] = [];
  private isRunning = false;
  private onProgressCallback?: (progress: number) => void;
  private onTestCompleteCallback?: (result: MemoryTestResult) => void;
  private onSuiteCompleteCallback?: (results: MemoryTestResult[]) => void;

  constructor(config: Partial<MemorySuiteConfig> = {}) {
    this.config = {
      iterations: config.iterations || 10,
      dataSize: config.dataSize || 'medium',
      allowGC: config.allowGC !== undefined ? config.allowGC : true,
      trackDetailedStats: config.trackDetailedStats || false,
      delayBetweenTests: config.delayBetweenTests || 1000,
    };
  }

  public async runSuite(): Promise<MemoryTestResult[]> {
    if (this.isRunning) {
      throw new Error('Test suite is already running');
    }

    this.isRunning = true;
    this.results = [];

    // Run the memory leak tests
    await this.runMemoryLeakTest();
    await this.runLargeObjectsTest();
    await this.runEventListenerTest();
    await this.runDOMReferenceTest();
    await this.runCircularReferenceTest();

    this.isRunning = false;

    if (this.onSuiteCompleteCallback) {
      this.onSuiteCompleteCallback(this.results);
    }

    return this.results;
  }

  public onProgress(callback: (progress: number) => void): void {
    this.onProgressCallback = callback;
  }

  public onTestComplete(callback: (result: MemoryTestResult) => void): void {
    this.onTestCompleteCallback = callback;
  }

  public onSuiteComplete(callback: (results: MemoryTestResult[]) => void): void {
    this.onSuiteCompleteCallback = callback;
  }

  public cancelTests(): void {
    this.isRunning = false;
  }

  public getResults(): MemoryTestResult[] {
    return [...this.results];
  }

  private async runMemoryLeakTest(): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    // Create large arrays and objects multiple times
    const dataSize = this.getDataSize();
    const containers: any[] = [];

    for (let i = 0; i < this.config.iterations; i++) {
      // Creating potentially leaky objects
      const obj = {
        data: new Array(dataSize).fill(0).map((_, idx) => ({ id: idx, value: `value-${idx}` })),
        metadata: { created: Date.now(), iterations: i },
      };

      containers.push(obj);

      // Report progress
      if (this.onProgressCallback) {
        this.onProgressCallback((i / this.config.iterations) * 20); // First test = 0-20%
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 10));

      if (!this.isRunning) break;
    }

    // Allow objects to be garbage collected if config allows
    if (this.config.allowGC) {
      containers.length = 0;
      if (window.gc) window.gc();
    }

    const memoryAfter = this.getMemoryUsage();
    const endTime = performance.now();

    const result: MemoryTestResult = {
      testName: 'Memory Leak Test',
      startTime,
      endTime,
      memoryBefore,
      memoryAfter,
      heapUsed: memoryAfter - memoryBefore,
      duration: endTime - startTime,
      passed: this.config.allowGC ? memoryAfter - memoryBefore < dataSize * 10 : true,
    };

    this.results.push(result);

    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(result);
    }

    // Delay before next test
    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenTests));
  }

  private async runLargeObjectsTest(): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    // Create and destroy large objects
    const dataSize = this.getDataSize();

    for (let i = 0; i < this.config.iterations; i++) {
      // Large object creation
      const largeObject = new Array(dataSize).fill(0).map(() => {
        return {
          id: Math.random().toString(36).substring(2),
          timestamp: Date.now(),
          data: new Array(100).fill(Math.random()),
        };
      });

      // Do something with the object to prevent optimization
      const sum = largeObject.reduce((acc, item) => acc + item.data.reduce((a, b) => a + b, 0), 0);

      // Report progress
      if (this.onProgressCallback) {
        this.onProgressCallback(20 + (i / this.config.iterations) * 20); // Second test = 20-40%
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 10));

      if (!this.isRunning) break;
    }

    // Force garbage collection if available and allowed
    if (this.config.allowGC && window.gc) {
      window.gc();
    }

    const memoryAfter = this.getMemoryUsage();
    const endTime = performance.now();

    const result: MemoryTestResult = {
      testName: 'Large Objects Test',
      startTime,
      endTime,
      memoryBefore,
      memoryAfter,
      heapUsed: memoryAfter - memoryBefore,
      duration: endTime - startTime,
      passed: true, // We can't really determine a "pass" here, just collecting metrics
    };

    this.results.push(result);

    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(result);
    }

    // Delay before next test
    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenTests));
  }

  private async runEventListenerTest(): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    // Create elements and attach event listeners
    const elements: HTMLDivElement[] = [];
    const eventHandlers: ((e: Event) => void)[] = [];

    for (let i = 0; i < Math.min(this.config.iterations, 100); i++) {
      const element = document.createElement('div');
      element.style.display = 'none';
      document.body.appendChild(element);
      elements.push(element);

      // Create listener
      const handler = (e: Event) => {
        console.log('Event handled', e.type, i);
      };

      // Attach listener
      element.addEventListener('click', handler);
      eventHandlers.push(handler);

      // Report progress
      if (this.onProgressCallback) {
        this.onProgressCallback(40 + (i / Math.min(this.config.iterations, 100)) * 20); // Third test = 40-60%
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 10));

      if (!this.isRunning) break;
    }

    // Remove event listeners and elements if configured to do so
    if (this.config.allowGC) {
      elements.forEach((element, i) => {
        element.removeEventListener('click', eventHandlers[i]);
        element.remove();
      });
    }

    const memoryAfter = this.getMemoryUsage();
    const endTime = performance.now();

    const result: MemoryTestResult = {
      testName: 'Event Listener Test',
      startTime,
      endTime,
      memoryBefore,
      memoryAfter,
      heapUsed: memoryAfter - memoryBefore,
      duration: endTime - startTime,
      passed: this.config.allowGC ? memoryAfter - memoryBefore < 1000000 : true, // 1MB threshold
    };

    this.results.push(result);

    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(result);
    }

    // Delay before next test
    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenTests));
  }

  private async runDOMReferenceTest(): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    // Create DOM elements and store references
    const references: HTMLElement[] = [];

    for (let i = 0; i < Math.min(this.config.iterations * 10, 500); i++) {
      const element = document.createElement('div');
      element.innerHTML = `<span>Test element ${i}</span><ul>${Array(10)
        .fill(0)
        .map((_, idx) => `<li>Item ${idx}</li>`)
        .join('')}</ul>`;
      element.style.display = 'none';
      document.body.appendChild(element);

      references.push(element);

      // Report progress
      if (this.onProgressCallback) {
        this.onProgressCallback(60 + (i / Math.min(this.config.iterations * 10, 500)) * 20); // Fourth test = 60-80%
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 5));

      if (!this.isRunning) break;
    }

    // Clean up if configured to do so
    if (this.config.allowGC) {
      references.forEach(element => element.remove());
      references.length = 0;
    }

    const memoryAfter = this.getMemoryUsage();
    const endTime = performance.now();

    const result: MemoryTestResult = {
      testName: 'DOM Reference Test',
      startTime,
      endTime,
      memoryBefore,
      memoryAfter,
      heapUsed: memoryAfter - memoryBefore,
      duration: endTime - startTime,
      passed: this.config.allowGC ? memoryAfter - memoryBefore < 2000000 : true, // 2MB threshold
    };

    this.results.push(result);

    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(result);
    }

    // Delay before next test
    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenTests));
  }

  private async runCircularReferenceTest(): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    // Create objects with circular references
    const objects: any[] = [];

    for (let i = 0; i < this.config.iterations; i++) {
      const parent: any = { name: `parent-${i}`, children: [] };
      const child1: any = { name: `child1-${i}`, parent: parent };
      const child2: any = { name: `child2-${i}`, parent: parent, sibling: child1 };

      child1.sibling = child2;
      parent.children.push(child1, child2);

      objects.push(parent);

      // Create deeper circular structures
      if (i % 2 === 0) {
        const deepStructure: any = { level: 0 };
        let current = deepStructure;

        for (let j = 1; j < 20; j++) {
          current.next = { level: j, previous: current };
          current = current.next;
        }

        // Complete the circle
        current.next = deepStructure;
        deepStructure.previous = current;

        objects.push(deepStructure);
      }

      // Report progress
      if (this.onProgressCallback) {
        this.onProgressCallback(80 + (i / this.config.iterations) * 20); // Fifth test = 80-100%
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 10));

      if (!this.isRunning) break;
    }

    // Break circular references if configured to do so
    if (this.config.allowGC) {
      objects.forEach(obj => {
        if (obj.children) {
          obj.children.forEach((child: any) => {
            child.parent = null;
            child.sibling = null;
          });
          obj.children = null;
        }

        // Break deep circular references
        if (obj.level !== undefined) {
          let current = obj;
          let maxIterations = 100; // Safety to prevent infinite loops

          while (current && current.next && maxIterations-- > 0) {
            const next = current.next;
            current.next = null;
            current.previous = null;
            current = next;

            // If we've looped back to the beginning
            if (current === obj) break;
          }
        }
      });

      objects.length = 0;

      // Force garbage collection if available
      if (window.gc) window.gc();
    }

    const memoryAfter = this.getMemoryUsage();
    const endTime = performance.now();

    const result: MemoryTestResult = {
      testName: 'Circular Reference Test',
      startTime,
      endTime,
      memoryBefore,
      memoryAfter,
      heapUsed: memoryAfter - memoryBefore,
      duration: endTime - startTime,
      passed: this.config.allowGC ? memoryAfter - memoryBefore < 1000000 : true, // 1MB threshold
    };

    this.results.push(result);

    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(result);
    }
  }

  private getMemoryUsage(): number {
    if (window.performance && window.performance.memory) {
      return (window.performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getDataSize(): number {
    switch (this.config.dataSize) {
      case 'small':
        return 10000;
      case 'medium':
        return 100000;
      case 'large':
        return 1000000;
      default:
        return 100000;
    }
  }
}

// Add the global gc declaration for TypeScript
declare global {
  interface Window {
    gc?: () => void;
  }
}
