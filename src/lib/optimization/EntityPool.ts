import { EventEmitter } from '../utils/EventEmitter';

export interface PooledEntity {
  reset(): void;
}

interface PoolEvents<T extends PooledEntity> {
  entityActivated: { entity: T };
  entityDeactivated: { entity: T };
  poolExpanded: { newSize: number };
  [key: string]: unknown;
}

/**
 * Generic entity pool for efficient object reuse
 */
export class EntityPool<T extends PooledEntity> extends EventEmitter<PoolEvents<T>> {
  private available: T[];
  private inUse: Set<T>;
  private factory: () => T;

  /**
   * Maximum size limit for the entity pool
   * Will be used in future implementations to:
   * 1. Prevent unbounded memory growth by limiting total entities
   * 2. Implement pool size policies based on application state
   * 3. Support dynamic resizing based on usage patterns
   * 4. Trigger cleanup operations when approaching size limits
   * 5. Provide metrics for memory optimization
   */
  private _maxSize: number; // Will be used to limit pool growth in future implementation

  /**
   * Size increment for pool expansion operations
   * Will be used in future implementations to:
   * 1. Control growth rate when pool needs to expand
   * 2. Implement adaptive expansion based on usage patterns
   * 3. Optimize memory allocation by batch-creating entities
   * 4. Support different expansion strategies (linear, exponential)
   * 5. Provide configuration options for performance tuning
   */
  private _expandSize: number; // Will be used for dynamic pool expansion in future implementation

  constructor(
    factory: () => T,
    initialSize: number,
    maxSize: number = 1000,
    expandSize: number = 50
  ) {
    super();
    this.factory = factory;
    this._maxSize = maxSize;
    this._expandSize = expandSize;
    this.available = [];
    this.inUse = new Set();

    // Pre-allocate initial pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }

    // Debug logging
    console.warn(`[EntityPool] Initialized with ${initialSize} entities (max: ${maxSize})`);
  }

  /**
   * Get an inactive entity from the pool
   */
  public acquire(): T | undefined {
    let entity: T;
    if (this.available.length > 0) {
      entity = this.available.pop()!;
    } else {
      // Check if we've reached the maximum pool size
      const totalEntities = this.getTotalCount();
      if (totalEntities >= this._maxSize) {
        console.warn(
          `[EntityPool] Maximum pool size (${this._maxSize}) reached, cannot create more entities`
        );
        return undefined;
      }

      // If we're running low on entities, expand the pool by _expandSize
      if (this.available.length === 0 && totalEntities < this._maxSize) {
        const expandSize = Math.min(this._expandSize, this._maxSize - totalEntities);
        console.warn(`[EntityPool] Expanding pool by ${expandSize} entities`);

        // Create new entities in batch
        for (let i = 0; i < expandSize; i++) {
          this.available.push(this.factory());
        }

        // Emit event for pool expansion
        this.emit('poolExpanded', { newSize: this.getTotalCount() });

        // Get an entity from the newly expanded pool
        entity = this.available.pop()!;
      } else {
        // Create a single new entity if we haven't expanded
        entity = this.factory();
      }
    }

    entity.reset();
    this.inUse.add(entity);
    this.emit('entityActivated', { entity });
    return entity;
  }

  /**
   * Return an entity to the pool
   */
  public release(entity: T): void {
    if (this.inUse.has(entity)) {
      this.inUse.delete(entity);
      entity.reset();
      this.available.push(entity);
      this.emit('entityDeactivated', { entity });
    }
  }

  /**
   * Get all active entities
   */
  public getActiveEntities(): T[] {
    return Array.from(this.inUse);
  }

  /**
   * Get total number of entities in pool
   */
  public getTotalCount(): number {
    return this.available.length + this.inUse.size;
  }

  /**
   * Get number of active entities
   */
  public getActiveCount(): number {
    return this.inUse.size;
  }

  /**
   * Get number of available entities
   */
  public getAvailableCount(): number {
    return this.available.length;
  }

  /**
   * Clear all entities from pool
   */
  public clear(): void {
    this.available = [];
    this.inUse.clear();
    this.emit('entityDeactivated', { entity: null as unknown as T });
    console.warn('[EntityPool] Pool cleared');
  }
}
