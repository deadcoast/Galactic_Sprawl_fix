/**
 * D3 Batched Updates System
 *
 * This module provides utilities for batching multiple DOM updates into a single render cycle,
 * reducing layout thrashing and improving animation performance. Key features include:
 *
 * 1. Update batching across multiple animations and selections
 * 2. Prioritized update scheduling based on visibility and importance
 * 3. DOM read/write separation to prevent layout thrashing
 * 4. Automatic microtask scheduling for optimal performance
 * 5. Integration with existing animation frame manager
 *
 * @note This file has known TypeScript typing issues that will be addressed in a future refactoring.
 * See src/utils/performance/.cursor/ignore/README.md for details.
 */

// TypeScript ignore directives - to be removed during comprehensive refactoring
/* eslint-disable @typescript-eslint/no-explicit-unknown */

import * as d3 from 'd3';
import { BaseType, Local, Selection, Transition, ValueFn } from 'd3';
import { animationFrameManager, AnimationPriority } from './D3AnimationFrameManager';

/**
 * Type for DOM operations that need to be scheduled together
 */
type BatchOperation = {
  /** Operation type - read operations execute before write operations */
  type: 'read' | 'write';
  /** The operation's unique ID */
  id: string;
  /** The callback function to execute */
  callback: () => void;
  /** Priority level for the operation */
  priority: BatchOperationPriority;
  /** When the operation was scheduled (for ordering operations with same priority) */
  timestamp: number;
  /** Element the operation is associated with (for grouping) */
  element?: Element;
  /** Animation ID this operation is associated with (for grouping) */
  animationId?: string;
};

/**
 * Priority levels for batch operations
 */
export type BatchOperationPriority = 'critical' | 'high' | 'normal' | 'low' | 'idle';

/**
 * Scheduling mode for batched updates
 */
export type BatchSchedulingMode = 'immediate' | 'animation-frame' | 'microtask' | 'idle-callback';

/**
 * Configuration options for the batch update system
 */
export interface BatchSystemConfig {
  /** Default scheduling mode */
  defaultSchedulingMode?: BatchSchedulingMode;
  /** Whether to automatically optimize the scheduling mode based on browser conditions */
  autoOptimize?: boolean;
  /** Maximum operations to process per batch before forcing a flush */
  maxOperationsPerBatch?: number;
  /** Whether to separate read and write operations to prevent layout thrashing */
  separateReadsWrites?: boolean;
  /** Whether to group operations by element */
  groupByElement?: boolean;
  /** Whether to enable debug logging */
  debugMode?: boolean;
}

/**
 * Options for batched operations
 */
export interface BatchOperationOptions {
  /** Operation priority */
  priority?: BatchOperationPriority;
  /** Element the operation is associated with */
  element?: Element;
  /** Animation ID this operation is associated with */
  animationId?: string;
  /** Scheduling mode for this operation */
  schedulingMode?: BatchSchedulingMode;
  /** Custom ID for the operation (for deduplication) */
  id?: string;
}

/**
 * Options for flushing batched operations
 */
export interface FlushOptions {
  /** Only flush operations for a specific element */
  forElement?: Element;
  /** Only flush operations for a specific animation */
  forAnimation?: string;
  /** Only flush operations with priority >= the specified level */
  minPriority?: BatchOperationPriority;
  /** Only flush read operations */
  readOnly?: boolean;
  /** Only flush write operations */
  writeOnly?: boolean;
}

/**
 * Stateful batch update manager for D3 animations
 */
export class D3BatchUpdateManager {
  /** Queue of pending read operations */
  private readQueue: BatchOperation[] = [];

  /** Queue of pending write operations */
  private writeQueue: BatchOperation[] = [];

  /** Whether a batch flush is scheduled */
  private flushScheduled = false;

  /** Current batch ID for tracking which batch operations belong to */
  private currentBatchId = 0;

  /** Whether the system is currently flushing operations */
  private isFlushing = false;

  /** Completed operation count for statistics */
  private completedOperations = 0;

  /** Map of operation IDs to avoid duplicates */
  private operationIds = new Set<string>();

  /** Priority order for sorting operations */
  private priorityOrder: Record<BatchOperationPriority, number> = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3,
    idle: 4,
  };

  /**
   * Create a new batch update manager
   */
  constructor(private config: BatchSystemConfig = {}) {
    this.config = {
      defaultSchedulingMode: 'microtask',
      autoOptimize: true,
      maxOperationsPerBatch: 100,
      separateReadsWrites: true,
      groupByElement: true,
      debugMode: false,
      ...config,
    };
  }

  /**
   * Determine the best scheduling mode based on browser conditions
   */
  private determineBestSchedulingMode(): BatchSchedulingMode {
    if (!this.config.autoOptimize) {
      return this.config.defaultSchedulingMode!;
    }

    // Use immediate mode for small batches or if we're already in a requestAnimationFrame
    if (this.getTotalPendingOperations() < 10) {
      return 'immediate';
    }

    // Use requestAnimationFrame for larger batches
    if (this.getTotalPendingOperations() >= 10 && this.getTotalPendingOperations() < 50) {
      return 'animation-frame';
    }

    // Use idle callback for background operations if available
    if (
      typeof window.requestIdleCallback === 'function' &&
      this.readQueue.every(op => op.priority === 'idle' || op.priority === 'low') &&
      this.writeQueue.every(op => op.priority === 'idle' || op.priority === 'low')
    ) {
      return 'idle-callback';
    }

    // Default to microtask for most cases
    return 'microtask';
  }

  /**
   * Schedule a batch flush with the appropriate timing
   */
  private scheduleFlush(mode?: BatchSchedulingMode): void {
    if (this.flushScheduled) {
      return;
    }

    this.flushScheduled = true;
    const schedulingMode = mode || this.determineBestSchedulingMode();

    switch (schedulingMode) {
      case 'immediate':
        this.flush();
        break;

      case 'animation-frame':
        requestAnimationFrame(() => this.flush());
        break;

      case 'microtask':
        Promise.resolve().then(() => this.flush());
        break;

      case 'idle-callback':
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(
            deadline => {
              const timeRemaining = deadline.timeRemaining();
              // Only process if we have enough time
              if (timeRemaining > 10 || deadline.didTimeout) {
                this.flush();
              } else {
                // If not enough time, reschedule with animation frame
                this.flushScheduled = false;
                this.scheduleFlush('animation-frame');
              }
            },
            { timeout: 100 }
          ); // Give it a reasonable timeout
        } else {
          // Fall back to requestAnimationFrame if requestIdleCallback is not available
          requestAnimationFrame(() => this.flush());
        }
        break;
    }
  }

  /**
   * Flush all pending operations
   */
  private flush(options?: FlushOptions): void {
    this.isFlushing = true;
    this.flushScheduled = false;

    // Track the current batch
    const batchId = this.currentBatchId++;

    // Filter operations based on options
    const filterOperation = (op: BatchOperation): boolean => {
      if (options?.forElement && op.element !== options?.forElement) {
        return false;
      }
      if (options?.forAnimation && op.animationId !== options?.forAnimation) {
        return false;
      }
      if (
        options?.minPriority &&
        this.priorityOrder[op.priority] > this.priorityOrder[options?.minPriority]
      ) {
        return false;
      }
      return true;
    };

    // Get operations to flush
    const readOps = options?.writeOnly ? [] : this.readQueue.filter(filterOperation);
    const writeOps = options?.readOnly ? [] : this.writeQueue.filter(filterOperation);

    // Sort operations by priority and timestamp
    const sortOperations = (a: BatchOperation, b: BatchOperation) => {
      if (a.priority !== b.priority) {
        return this.priorityOrder[a.priority] - this.priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    };

    readOps.sort(sortOperations);
    writeOps.sort(sortOperations);

    // Remember operations we're going to process
    const readOpsToProcess = readOps;
    const writeOpsToProcess = writeOps;

    // Remove operations we're about to process from the queues
    this.readQueue = this.readQueue.filter(op => !readOpsToProcess.includes(op));
    this.writeQueue = this.writeQueue.filter(op => !writeOpsToProcess.includes(op));

    try {
      // Process read operations first to prevent layout thrashing
      readOpsToProcess.forEach(op => {
        try {
          op.callback();
          this.completedOperations++;
        } catch (err) {
          console.error(`Error in read operation ${op.id}:`, err);
        }
      });

      // Then process write operations
      writeOpsToProcess.forEach(op => {
        try {
          op.callback();
          this.completedOperations++;
        } catch (err) {
          console.error(`Error in write operation ${op.id}:`, err);
        }
      });
    } finally {
      this.isFlushing = false;

      // Clear processed operation IDs
      readOpsToProcess.concat(writeOpsToProcess).forEach(op => {
        this.operationIds.delete(op.id);
      });
    }

    // If there are still operations pending, schedule another flush
    if (this.getTotalPendingOperations() > 0) {
      this.scheduleFlush();
    }

    if (this.config.debugMode) {
      console.warn(
        `Batch #${batchId} processed: ${readOpsToProcess.length} reads, ${writeOpsToProcess.length} writes`
      );
    }
  }

  /**
   * Get the total number of pending operations
   */
  private getTotalPendingOperations(): number {
    return this.readQueue.length + this.writeQueue.length;
  }

  /**
   * Add a read operation to the batch queue
   */
  public read<T>(callback: () => T, options: BatchOperationOptions = {}): T | undefined {
    return this.addOperation('read', callback, options);
  }

  /**
   * Add a write operation to the batch queue
   */
  public write<T>(callback: () => T, options: BatchOperationOptions = {}): T | undefined {
    return this.addOperation('write', callback, options);
  }

  /**
   * Add an operation to the appropriate queue
   */
  private addOperation<T>(
    type: 'read' | 'write',
    callback: () => T,
    options: BatchOperationOptions
  ): T | undefined {
    const { priority = 'normal', element, animationId, schedulingMode, id: customId } = options;

    // Generate a unique ID for the operation
    const baseId = customId || `${type}-${Date.now()}-${Math.round(Math.random() * 10000)}`;

    // For element-specific operations, make the ID element-specific to enable deduplication
    const id = element ? `${baseId}-${element.tagName}-${priority}` : baseId;

    // Skip if this exact operation was already scheduled (deduplication)
    if (this.operationIds.has(id)) {
      if (this.config.debugMode) {
        console.warn(`Skipping duplicate operation ${id}`);
      }
      return undefined;
    }

    // If we're already flushing and this is an immediate operation, execute it directly
    if (this.isFlushing && schedulingMode === 'immediate') {
      try {
        return callback();
      } catch (err) {
        console.error(`Error in immediate ${type} operation:`, err);
        return undefined;
      }
    }

    // Create the operation
    const operation: BatchOperation = {
      type,
      id,
      callback: () => callback(),
      priority,
      timestamp: Date.now(),
      element,
      animationId,
    };

    // Add to the appropriate queue
    if (type === 'read') {
      this.readQueue.push(operation);
    } else {
      this.writeQueue.push(operation);
    }

    // Record the operation ID
    this.operationIds.add(id);

    // Schedule a flush if needed
    if (!this.flushScheduled) {
      this.scheduleFlush(schedulingMode);
    } else if (priority === 'critical' && schedulingMode === 'immediate') {
      // Force an immediate flush for critical operations
      this.flush({
        minPriority: 'critical',
      });
    }

    // For immediate operations, we can return the result
    if (schedulingMode === 'immediate') {
      return callback();
    }

    return undefined;
  }

  /**
   * Manually flush all pending operations
   */
  public flushAll(): void {
    this.flush();
  }

  /**
   * Manually flush operations for a specific element
   */
  public flushForElement(element: Element): void {
    this.flush({ forElement: element });
  }

  /**
   * Manually flush operations for a specific animation
   */
  public flushForAnimation(animationId: string): void {
    this.flush({ forAnimation: animationId });
  }

  /**
   * Get statistics about the batch manager
   */
  public getStats() {
    return {
      pendingReads: this.readQueue.length,
      pendingWrites: this.writeQueue.length,
      totalPending: this.getTotalPendingOperations(),
      completedOperations: this.completedOperations,
      isFlushing: this.isFlushing,
      flushScheduled: this.flushScheduled,
      batchCount: this.currentBatchId,
    };
  }

  /**
   * Cancel all pending operations
   */
  public cancelAll(): void {
    this.readQueue = [];
    this.writeQueue = [];
    this.operationIds.clear();
    this.flushScheduled = false;
  }
}

/**
 * Singleton instance for easy access
 */
export const batchUpdateManager = new D3BatchUpdateManager();

/**
 * Helper to batch read operations related to DOM measurements
 */
export function batchRead<T>(
  callback: () => T,
  options: BatchOperationOptions = {}
): T | undefined {
  return batchUpdateManager.read(callback, options);
}

/**
 * Helper to batch write operations related to DOM modifications
 */
export function batchWrite<T>(
  callback: () => T,
  options: BatchOperationOptions = {}
): T | undefined {
  return batchUpdateManager.write(callback, options);
}

// Define a more permissive type for D3 transition methods when using unknown/dynamic types
type D3GenericFunction = (...args: unknown[]) => unknown;

// Redefine D3MethodOverride to use unknown instead of unknown for better D3 compatibility
type D3MethodOverride = unknown; // Use unknown to avoid type conflicts with complex D3 method signatures

/**
 * Define proper types for D3 selection methods to use in our overrides
 */
interface D3SelectionMethods<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
  attr: {
    (name: string): string;
    (
      name: string,
      value:
        | string
        | number
        | boolean
        | readonly (string | number)[]
        | ValueFn<GElement, Datum, string | number | boolean | readonly (string | number)[] | null>
        | null
    ): Selection<GElement, Datum, PElement, PDatum>;
  };
  style: {
    (name: string): string;
    (name: string, value: null): Selection<GElement, Datum, PElement, PDatum>;
    (
      name: string,
      value: string | number | boolean,
      priority?: 'important' | null | undefined
    ): Selection<GElement, Datum, PElement, PDatum>;
    (
      name: string,
      value: ValueFn<GElement, Datum, string | number | boolean | null>,
      priority?: 'important' | null | undefined
    ): Selection<GElement, Datum, PElement, PDatum>;
  };
  property: {
    (name: string): unknown;
    <T>(name: Local<T>): T | undefined;
    (
      name: string,
      value: ValueFn<GElement, Datum, unknown> | null
    ): Selection<GElement, Datum, PElement, PDatum>;
    (name: string, value: unknown): Selection<GElement, Datum, PElement, PDatum>;
    <T>(
      name: Local<T>,
      value: ValueFn<GElement, Datum, T | null> | null
    ): Selection<GElement, Datum, PElement, PDatum>;
    <T>(name: Local<T>, value: T): Selection<GElement, Datum, PElement, PDatum>;
  };
  html: {
    (): string;
    (
      value: string | ValueFn<GElement, Datum, string | null> | null
    ): Selection<GElement, Datum, PElement, PDatum>;
  };
  text: {
    (): string;
    (
      value:
        | string
        | number
        | boolean
        | ValueFn<GElement, Datum, string | number | boolean | null>
        | null
    ): Selection<GElement, Datum, PElement, PDatum>;
  };
  transition: {
    (name?: string): Transition<GElement, Datum, PElement, PDatum>;
    (
      transition: Transition<BaseType, unknown, BaseType, unknown>
    ): Transition<GElement, Datum, PElement, PDatum>;
  };
}

/**
 * Define proper types for D3 transition methods to use in our overrides
 */
interface D3TransitionMethods<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
  attr: {
    (
      name: string,
      value: string | number | boolean | null
    ): Transition<GElement, Datum, PElement, PDatum>;
    (
      name: string,
      value: ValueFn<GElement, Datum, string | number | boolean | null>
    ): Transition<GElement, Datum, PElement, PDatum>;
  };
  style: {
    (name: string, value: null): Transition<GElement, Datum, PElement, PDatum>;
    (
      name: string,
      value: string | number | boolean,
      priority?: 'important' | null
    ): Transition<GElement, Datum, PElement, PDatum>;
    (
      name: string,
      value: ValueFn<GElement, Datum, string | number | boolean | null>,
      priority?: 'important' | null
    ): Transition<GElement, Datum, PElement, PDatum>;
  };
  attrTween: {
    (name: string): ValueFn<GElement, Datum, (this: GElement, t: number) => string> | undefined;
    (name: string, factory: null): Transition<GElement, Datum, PElement, PDatum>;
    (
      name: string,
      factory: ValueFn<GElement, Datum, (this: GElement, t: number) => string>
    ): Transition<GElement, Datum, PElement, PDatum>;
  };
  styleTween: {
    (name: string): ValueFn<GElement, Datum, (this: GElement, t: number) => string> | undefined;
    (
      name: string,
      factory: null,
      priority?: 'important' | null
    ): Transition<GElement, Datum, PElement, PDatum>;
    (
      name: string,
      factory: ValueFn<GElement, Datum, (this: GElement, t: number) => string>,
      priority?: 'important' | null
    ): Transition<GElement, Datum, PElement, PDatum>;
  };
}

/**
 * Type for D3 selection method override
 */
type D3SelectionMethodOverride<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
> = (
  this: d3.Selection<GElement, Datum, PElement, PDatum>,
  ...args: unknown[]
) => string | d3.Selection<GElement, Datum, PElement, PDatum>;

/**
 * Type for D3 property method override
 */
type D3PropertyMethodOverride<GElement extends Element, Datum, PElement extends Element, PDatum> = (
  this: d3.Selection<GElement, Datum, PElement, PDatum>,
  name: string | d3.Local<unknown>,
  value?: ValueFn<GElement, Datum, unknown> | unknown | null
) => unknown | d3.Selection<GElement, Datum, PElement, PDatum>;

/**
 * Creates optimized D3 selection methods that use batched updates
 */
export function createBatchedSelection<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  options: BatchOperationOptions = {}
): d3.Selection<GElement, Datum, PElement, PDatum> {
  // Clone the selection to avoid modifying the original
  const batchedSelection = selection.clone() as d3.Selection<GElement, Datum, PElement, PDatum>;

  // Store original methods
  const origAttr = batchedSelection.attr;
  const origStyle = batchedSelection.style;
  const origProperty = batchedSelection.property;
  const origHtml = batchedSelection.html;
  const origText = batchedSelection.text;

  // Override attr to use batched writes
  (
    batchedSelection as unknown as {
      attr: (
        this: d3.Selection<GElement, Datum, PElement, PDatum>,
        name: string,
        value?:
          | string
          | number
          | boolean
          | readonly (string | number)[]
          | ValueFn<
              GElement,
              Datum,
              string | number | boolean | readonly (string | number)[] | null
            >
          | null
      ) => unknown;
    }
  ).attr = function (
    this: d3.Selection<GElement, Datum, PElement, PDatum>,
    name: string,
    value?:
      | string
      | number
      | boolean
      | readonly (string | number)[]
      | ValueFn<GElement, Datum, string | number | boolean | readonly (string | number)[] | null>
      | null
  ): unknown {
    if (arguments.length === 1) {
      return (origAttr as (name: string) => string).call(this, name);
    }

    // Setter case: Write operation - can be batched
    batchWrite(
      () => {
        (origAttr as unknown as (...args: unknown[]) => unknown).call(
          this,
          name,
          value === undefined ? null : value
        );
      },
      {
        ...options,
        element: (this.node() as Element) || undefined,
      }
    );

    return this;
  } as D3SelectionMethodOverride<GElement, Datum, PElement, PDatum>;

  // Override style to use batched writes
  (
    batchedSelection as unknown as {
      style: (
        this: d3.Selection<GElement, Datum, PElement, PDatum>,
        name: string,
        value?:
          | string
          | number
          | boolean
          | ValueFn<GElement, Datum, string | number | boolean | null>
          | null,
        priority?: 'important' | null | undefined
      ) => unknown;
    }
  ).style = function (
    this: d3.Selection<GElement, Datum, PElement, PDatum>,
    name: string,
    value?:
      | string
      | number
      | boolean
      | ValueFn<GElement, Datum, string | number | boolean | null>
      | null,
    priority?: 'important' | null | undefined
  ): unknown {
    if (arguments.length === 1) {
      return (origStyle as (name: string) => string).call(this, name);
    }

    // Setter case: Write operation - can be batched
    batchWrite(
      () => {
        const valToPass = value === undefined ? null : value;
        if (arguments.length === 2) {
          (origStyle as unknown as (...args: unknown[]) => unknown).call(this, name, valToPass);
        } else {
          (origStyle as unknown as (...args: unknown[]) => unknown).call(
            this,
            name,
            valToPass,
            priority
          );
        }
      },
      {
        ...options,
        element: (this.node() as Element) || undefined,
      }
    );

    return this;
  } as D3SelectionMethodOverride<GElement, Datum, PElement, PDatum>;

  // Override property to use batched writes
  (
    batchedSelection as unknown as {
      property: <T>(
        this: d3.Selection<GElement, Datum, PElement, PDatum>,
        name: string | d3.Local<T>,
        value?: ValueFn<GElement, Datum, T | null> | T | null | unknown
      ) => unknown;
    }
  ).property = function <T>(
    this: d3.Selection<GElement, Datum, PElement, PDatum>,
    name: string | d3.Local<T>,
    value?: ValueFn<GElement, Datum, T | null> | T | null | unknown
  ): unknown {
    if (arguments.length === 1) {
      if (typeof name === 'string') {
        return (origProperty as (name: string) => unknown).call(this, name);
      } else {
        return (origProperty as <T>(name: Local<T>) => T | undefined).call(this, name);
      }
    }

    // Setter case: Write operation - can be batched
    batchWrite(
      () => {
        const valToPass = value === undefined ? null : value;
        if (typeof name === 'string') {
          (origProperty as unknown as (name: string, value: unknown) => typeof this).call(
            this,
            name,
            valToPass
          );
        } else {
          // Assuming name is Local<T> - Cast name explicitly in the call
          (
            origProperty as unknown as <T>(
              name: Local<T>,
              value: ValueFn<GElement, Datum, T | null> | T | null
            ) => typeof this
          ).call(
            this,
            name as d3.Local<T>,
            valToPass as ValueFn<GElement, Datum, T | null> | T | null
          );
        }
      },
      {
        ...options,
        element: (this.node() as Element) || undefined,
      }
    );

    return this;
  } as D3PropertyMethodOverride<GElement, Datum, PElement, PDatum>;

  // Override html to use batched writes
  (
    batchedSelection as unknown as {
      html: (
        this: d3.Selection<GElement, Datum, PElement, PDatum>,
        value?: string | ValueFn<GElement, Datum, string | null> | null
      ) => unknown;
    }
  ).html = function (
    this: d3.Selection<GElement, Datum, PElement, PDatum>,
    value?: string | ValueFn<GElement, Datum, string | null> | null
  ): unknown {
    if (arguments.length === 0) {
      return (origHtml as () => string).call(this);
    }

    // Setter case: Write operation - can be batched
    batchWrite(
      () => {
        (origHtml as unknown as (...args: unknown[]) => unknown).call(
          this,
          value === undefined ? null : value
        );
      },
      {
        ...options,
        element: (this.node() as Element) || undefined,
      }
    );

    return this;
  } as D3SelectionMethodOverride<GElement, Datum, PElement, PDatum>;

  // Override text to use batched writes
  (
    batchedSelection as unknown as {
      text: (
        this: d3.Selection<GElement, Datum, PElement, PDatum>,
        value?:
          | string
          | number
          | boolean
          | ValueFn<GElement, Datum, string | number | boolean | null>
          | null
      ) => unknown;
    }
  ).text = function (
    this: d3.Selection<GElement, Datum, PElement, PDatum>,
    value?:
      | string
      | number
      | boolean
      | ValueFn<GElement, Datum, string | number | boolean | null>
      | null
  ): unknown {
    if (arguments.length === 0) {
      return (origText as () => string).call(this);
    }

    // Setter case: Write operation - can be batched
    batchWrite(
      () => {
        (origText as unknown as (...args: unknown[]) => unknown).call(
          this,
          value === undefined ? null : value
        );
      },
      {
        ...options,
        element: (this.node() as Element) || undefined,
      }
    );

    return this;
  } as D3SelectionMethodOverride<GElement, Datum, PElement, PDatum>;

  return batchedSelection;
}

/**
 * Enhances a D3 selection factory function to use batched updates
 */
export function createBatchedSelectionFactory<GElement extends Element = HTMLElement>(
  options: BatchOperationOptions = {}
) {
  return function selectWithBatching<Datum = unknown>(
    selector: string | GElement
  ): d3.Selection<GElement, Datum, Element, undefined> {
    // Use proper type casting for different selector types
    const selection =
      typeof selector === 'string'
        ? (d3.select(selector) as unknown as d3.Selection<GElement, Datum, Element, undefined>)
        : (d3.select(selector as Element) as unknown as d3.Selection<
            GElement,
            Datum,
            Element,
            undefined
          >);

    return createBatchedSelection(selection, options);
  };
}

/**
 * Type for D3 transition attr method override
 */
type AttrTweenFunctionType<
  GElement extends BaseType,
  Datum,
  PElement extends BaseType,
  PDatum,
> = D3TransitionMethods<GElement, Datum, PElement, PDatum>['attrTween'];

/**
 * Type for D3 transition style method override
 */
type StyleTweenFunctionType<
  GElement extends BaseType,
  Datum,
  PElement extends BaseType,
  PDatum,
> = D3TransitionMethods<GElement, Datum, PElement, PDatum>['styleTween'];

/**
 * Type for D3 transition override
 */
type TransitionFunctionType<
  GElement extends BaseType,
  Datum,
  PElement extends BaseType,
  PDatum,
> = D3SelectionMethods<GElement, Datum, PElement, PDatum>['transition'];

/**
 * Creates a new Transition object with batched methods (attr, style, etc.)
 */
function createBatchedTransitionInstance<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(
  transition: d3.Transition<GElement, Datum, PElement, PDatum>,
  options: BatchOperationOptions = {}
): d3.Transition<GElement, Datum, PElement, PDatum> {
  // Clone the transition? D3 transitions might not be directly cloneable.
  // We might need to proxy the methods instead.
  // For now, let's try modifying the existing transition instance carefully.

  const origAttr = transition.attr;
  const origStyle = transition.style;
  const origAttrTween = transition.attrTween;
  const origStyleTween = transition.styleTween;
  // Add other methods like text, html if needed

  // Override attr
  (
    transition as unknown as {
      attr: (
        this: d3.Transition<GElement, Datum, PElement, PDatum>,
        name: string,
        value:
          | string
          | number
          | boolean
          | ValueFn<GElement, Datum, string | number | boolean | null>
          | null
      ) => unknown;
    }
  ).attr = function (
    this: d3.Transition<GElement, Datum, PElement, PDatum>,
    name: string,
    value:
      | string
      | number
      | boolean
      | ValueFn<GElement, Datum, string | number | boolean | null>
      | null
  ): unknown {
    batchWrite(
      () => {
        (origAttr as unknown as (...args: unknown[]) => unknown).call(
          this,
          name,
          value === undefined ? null : value
        );
      },
      { ...options, animationId: options.animationId || 'transition' }
    );
    return this;
  };

  // Override style
  (
    transition as unknown as {
      style: (
        this: d3.Transition<GElement, Datum, PElement, PDatum>,
        name: string,
        value:
          | string
          | number
          | boolean
          | ValueFn<GElement, Datum, string | number | boolean | null>
          | null,
        priority?: 'important' | null
      ) => unknown;
    }
  ).style = function (
    this: d3.Transition<GElement, Datum, PElement, PDatum>,
    name: string,
    value:
      | string
      | number
      | boolean
      | ValueFn<GElement, Datum, string | number | boolean | null>
      | null,
    priority?: 'important' | null
  ): unknown {
    batchWrite(
      () => {
        // Explicitly type valToPass as unknown to handle null vs ValueFn conflict
        const valToPass: unknown = value === undefined ? null : value;
        // Check if priority was provided to the override function
        if (priority === undefined) {
          // Cast origStyle to unknown then function type accepting unknown
          (origStyle as unknown as (...args: unknown[]) => unknown).call(this, name, valToPass);
        } else {
          // Cast origStyle to unknown then function type accepting unknown
          (origStyle as unknown as (...args: unknown[]) => unknown).call(
            this,
            name,
            valToPass,
            priority
          );
        }
      },
      { ...options, animationId: options.animationId || 'transition' }
    );
    return this;
  };

  // Override attrTween
  (
    transition as unknown as {
      attrTween: (
        this: d3.Transition<GElement, Datum, PElement, PDatum>,
        name: string,
        factory: ValueFn<GElement, Datum, (this: GElement, t: number) => string> | null
      ) => unknown;
    }
  ).attrTween = function (
    this: d3.Transition<GElement, Datum, PElement, PDatum>,
    name: string,
    factory: ValueFn<GElement, Datum, (this: GElement, t: number) => string> | null
  ): unknown {
    // Tween functions often involve reads AND writes. Batching might be complex.
    // For now, let's make it a write operation.
    batchWrite(
      () => {
        // Explicitly cast factory to the expected union type
        // Cast origAttrTween to unknown then function type accepting unknown
        (origAttrTween as unknown as (...args: unknown[]) => unknown).call(
          this,
          name,
          factory as ValueFn<GElement, Datum, (this: GElement, t: number) => string> | null
        );
      },
      { ...options, animationId: options.animationId || 'transition' }
    );
    return this;
  };

  // Override styleTween
  (
    transition as unknown as {
      styleTween: (
        this: d3.Transition<GElement, Datum, PElement, PDatum>,
        name: string,
        factory: ValueFn<GElement, Datum, (this: GElement, t: number) => string> | null,
        priority?: 'important' | null
      ) => unknown;
    }
  ).styleTween = function (
    this: d3.Transition<GElement, Datum, PElement, PDatum>,
    name: string,
    factory: ValueFn<GElement, Datum, (this: GElement, t: number) => string> | null,
    priority?: 'important' | null
  ): unknown {
    // Similar to attrTween, batching is complex. Treat as write for now.
    batchWrite(
      () => {
        // Check if priority was provided to the override function
        // Explicitly cast factory to the expected union type
        const factoryToPass = factory as ValueFn<
          GElement,
          Datum,
          (this: GElement, t: number) => string
        > | null;
        if (priority === undefined) {
          // Cast origStyleTween to unknown then function type accepting unknown
          (origStyleTween as unknown as (...args: unknown[]) => unknown).call(
            this,
            name,
            factoryToPass
          );
        } else {
          // Cast origStyleTween to unknown then function type accepting unknown
          (origStyleTween as unknown as (...args: unknown[]) => unknown).call(
            this,
            name,
            factoryToPass,
            priority
          );
        }
      },
      { ...options, animationId: options.animationId || 'transition' }
    );
    return this;
  };

  // Return the modified transition
  return transition;
}

/**
 * (Renamed) Applies batched transition overrides TO A SELECTION.
 * Previously createBatchedTransition
 */
export function applyBatchedTransitionOverride<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  options: BatchOperationOptions = {}
): d3.Selection<GElement, Datum, PElement, PDatum> {
  // Store original transition method from the selection
  const origTransition = selection.transition;

  // Override selection.transition
  (
    selection as unknown as {
      transition: (
        this: d3.Selection<GElement, Datum, PElement, PDatum>,
        nameOrTransition?: string | d3.Transition<BaseType, unknown, BaseType, unknown>
      ) => d3.Transition<GElement, Datum, PElement, PDatum>;
    }
  ).transition = function (
    // Use specific cast for assignment
    this: d3.Selection<GElement, Datum, PElement, PDatum>,
    nameOrTransition?: string | d3.Transition<BaseType, unknown, BaseType, unknown>
  ): d3.Transition<GElement, Datum, PElement, PDatum> {
    let underlyingTransition: d3.Transition<GElement, Datum, PElement, PDatum>;

    // Call the original transition method to get the actual transition object
    if (arguments.length === 0) {
      underlyingTransition = (
        origTransition as () => d3.Transition<GElement, Datum, PElement, PDatum>
      ).call(this);
    } else if (typeof nameOrTransition === 'string') {
      underlyingTransition = (
        origTransition as (name?: string) => d3.Transition<GElement, Datum, PElement, PDatum>
      ).call(this, nameOrTransition);
    } else {
      // Cast the provided transition object - use BaseType instead of unknown for constraints
      underlyingTransition = (
        origTransition as (
          trans: d3.Transition<BaseType, unknown, BaseType, unknown>
        ) => d3.Transition<GElement, Datum, PElement, PDatum>
      ).call(this, nameOrTransition as d3.Transition<BaseType, unknown, BaseType, unknown>);
    }

    // Wrap the resulting transition object's methods with batching
    return createBatchedTransitionInstance(underlyingTransition, options);
  };

  return selection;
}

/**
 * Integrates batch update manager with the animation frame manager
 */
export function registerBatchUpdateSystem(
  animationId: string,
  priority: AnimationPriority = 'high'
): void {
  animationFrameManager.registerAnimation(
    {
      id: `batch-updater-${animationId}`,
      name: 'Batch Update Processor',
      priority,
      type: 'custom',
      duration: 0, // Runs indefinitely
      loop: true,
    },
    (_elapsed, _deltaTime, frameInfo) => {
      // Flush batched operations on each animation frame
      // Use frame budget to determine how much we can process
      if (frameInfo.remainingFrameBudget > 2) {
        // Only flush if we have time left in the frame
        batchUpdateManager.flushAll();
      }

      return false; // Never complete this animation
    }
  );

  // Start the animation
  animationFrameManager.startAnimation(`batch-updater-${animationId}`);
}

/**
 * Helper to optimize a D3 visualization with batched updates
 */
export function optimizeWithBatchedUpdates<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  animationId: string,
  options: BatchOperationOptions = {}
): d3.Selection<GElement, Datum, PElement, PDatum> {
  // Set up batching integration with animation frame manager
  registerBatchUpdateSystem(animationId);

  // Set up default options
  const batchOptions: BatchOperationOptions = {
    animationId,
    priority: 'normal',
    ...options,
  };

  // Apply batched selections
  const batchedSelection = createBatchedSelection(selection, batchOptions);

  // Apply batched transitions (using the renamed function)
  return applyBatchedTransitionOverride(batchedSelection, batchOptions);
}
