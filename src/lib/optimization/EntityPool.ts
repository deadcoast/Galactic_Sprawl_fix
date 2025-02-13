import { EventEmitter } from "../utils/EventEmitter";

interface PooledEntity {
  id: string;
  active: boolean;
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
  private entities: T[] = [];
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
    this.initialize(initialSize);

    // Debug logging
    console.debug(`[EntityPool] Initialized with ${initialSize} entities (max: ${maxSize})`);
  }

  /**
   * Initialize pool with entities
   */
  private initialize(size: number): void {
    for (let i = 0; i < size; i++) {
      const entity = this.factory();
      entity.active = false;
      this.entities.push(entity);
    }
  }

  /**
   * Get an inactive entity from the pool
   */
  public acquire(): T | null {
    // Try to find an inactive entity
    const entity = this.entities.find(e => !e.active);
    
    if (entity) {
      entity.active = true;
      this.emit("entityActivated", { entity });
      return entity;
    }

    // If no inactive entities and below max size, expand pool
    if (this.entities.length < this.maxSize) {
      const expandAmount = Math.min(
        this.expandSize,
        this.maxSize - this.entities.length
      );
      
      console.debug(`[EntityPool] Expanding pool by ${expandAmount} entities`);
      
      this.initialize(expandAmount);
      this.emit("poolExpanded", { newSize: this.entities.length });
      
      // Return first entity from expansion
      const newEntity = this.entities[this.entities.length - expandAmount];
      newEntity.active = true;
      this.emit("entityActivated", { entity: newEntity });
      return newEntity;
    }

    console.warn("[EntityPool] Pool exhausted, no entities available");
    return null;
  }

  /**
   * Return an entity to the pool
   */
  public release(entity: T): void {
    const pooledEntity = this.entities.find(e => e.id === entity.id);
    if (pooledEntity && pooledEntity.active) {
      pooledEntity.active = false;
      pooledEntity.reset();
      this.emit("entityDeactivated", { entity: pooledEntity });
    }
  }

  /**
   * Get all active entities
   */
  public getActiveEntities(): T[] {
    return this.entities.filter(e => e.active);
  }

  /**
   * Get total number of entities in pool
   */
  public getTotalSize(): number {
    return this.entities.length;
  }

  /**
   * Get number of active entities
   */
  public getActiveCount(): number {
    return this.entities.filter(e => e.active).length;
  }

  /**
   * Get number of available entities
   */
  public getAvailableCount(): number {
    return this.entities.filter(e => !e.active).length;
  }

  /**
   * Clear all entities from pool
   */
  public clear(): void {
    this.entities.forEach(entity => {
      if (entity.active) {
        this.release(entity);
      }
    });
    this.entities = [];
    console.debug("[EntityPool] Pool cleared");
  }
} 