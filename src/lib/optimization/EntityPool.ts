import { EventEmitter } from '../utils/EventEmitter';

export interface PooledEntity {
  reset(): void;
}

interface PoolEvents<T extends PooledEntity> {
  entityActivated: { entity: T };
  entityDeactivated: { entity: T };
  poolExpanded: { newSize: number };
}

/**
 * Generic entity pool for efficient object reuse
 */
export class EntityPool<T extends PooledEntity> extends EventEmitter<PoolEvents<T>> {
  private available: T[];
  private inUse: Set<T>;
  private factory: () => T;
  private maxSize: number;
  private expandSize: number;

  constructor(
    factory: () => T,
    initialSize: number,
    maxSize: number = 1000,
    expandSize: number = 50
  ) {
    super();
    this.factory = factory;
    this.maxSize = maxSize;
    this.expandSize = expandSize;
    this.available = [];
    this.inUse = new Set();

    // Pre-allocate initial pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }

    // Debug logging
    console.debug(`[EntityPool] Initialized with ${initialSize} entities (max: ${maxSize})`);
  }

  /**
   * Get an inactive entity from the pool
   */
  public acquire(): T | undefined {
    let entity: T;
    if (this.available.length > 0) {
      entity = this.available.pop()!;
    } else {
      entity = this.factory();
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
    this.emit('entityDeactivated', { entity: null });
    console.debug('[EntityPool] Pool cleared');
  }
}
