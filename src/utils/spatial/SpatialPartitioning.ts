/**
 * SpatialPartitioning.ts
 *
 * Provides spatial partitioning utilities for optimizing geographical resource networks.
 * Implements quadtree-based spatial indexing for efficient querying of nearby nodes.
 */

/**
 * Interface for objects with spatial coordinates
 */
export interface SpatialObject {
  id: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

/**
 * Quadtree node for spatial partitioning
 */
export class QuadTree<T extends SpatialObject> {
  private readonly capacity: number;
  private readonly boundary: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  private objects: T[] = [];
  private divided = false;
  private northwest?: QuadTree<T>;
  private northeast?: QuadTree<T>;
  private southwest?: QuadTree<T>;
  private southeast?: QuadTree<T>;

  /**
   * Create a new QuadTree instance
   *
   * @param x - X coordinate of the quadtree boundary's top-left corner
   * @param y - Y coordinate of the quadtree boundary's top-left corner
   * @param width - Width of the quadtree boundary
   * @param height - Height of the quadtree boundary
   * @param capacity - Maximum number of objects per quadtree node before subdivision
   */
  constructor(x: number, y: number, width: number, height: number, capacity = 4) {
    this.boundary = { x, y, width, height };
    this.capacity = capacity;
  }

  /**
   * Check if a point is within this quadtree's boundary
   */
  private contains(x: number, y: number): boolean {
    return (
      x >= this.boundary.x &&
      x < this.boundary.x + this.boundary.width &&
      y >= this.boundary.y &&
      y < this.boundary.y + this.boundary.height
    );
  }

  /**
   * Check if a point is within a circular range
   */
  private isInRange(x1: number, y1: number, x2: number, y2: number, range: number): boolean {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy <= range * range;
  }

  /**
   * Check if this quadtree boundary intersects with a circular range
   */
  private intersectsRange(x: number, y: number, range: number): boolean {
    // Find the closest point on the rectangle to the center of the circle
    const closestX = Math.max(this.boundary.x, Math.min(x, this.boundary.x + this.boundary.width));
    const closestY = Math.max(this.boundary.y, Math.min(y, this.boundary.y + this.boundary.height));

    // Calculate distance between the closest point and circle center
    const dx = x - closestX;
    const dy = y - closestY;

    // If the distance is less than or equal to the range, they intersect
    return dx * dx + dy * dy <= range * range;
  }

  /**
   * Subdivide this quadtree into four quadrants
   */
  private subdivide(): void {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const halfWidth = this.boundary.width / 2;
    const halfHeight = this.boundary.height / 2;

    this.northwest = new QuadTree<T>(x, y, halfWidth, halfHeight, this.capacity);
    this.northeast = new QuadTree<T>(x + halfWidth, y, halfWidth, halfHeight, this.capacity);
    this.southwest = new QuadTree<T>(x, y + halfHeight, halfWidth, halfHeight, this.capacity);
    this.southeast = new QuadTree<T>(
      x + halfWidth,
      y + halfHeight,
      halfWidth,
      halfHeight,
      this.capacity
    );

    this.divided = true;

    // Move existing objects into children
    for (const obj of this.objects) {
      this.insertIntoChildren(obj);
    }

    this.objects = [];
  }

  /**
   * Insert an object into the appropriate children
   */
  private insertIntoChildren(obj: T): boolean {
    if (!this.divided) return false;

    if (this.northwest?.contains(obj.x, obj.y)) {
      return this.northwest.insert(obj);
    } else if (this.northeast?.contains(obj.x, obj.y)) {
      return this.northeast.insert(obj);
    } else if (this.southwest?.contains(obj.x, obj.y)) {
      return this.southwest.insert(obj);
    } else if (this.southeast?.contains(obj.x, obj.y)) {
      return this.southeast.insert(obj);
    }

    return false;
  }

  /**
   * Insert an object into this quadtree
   */
  public insert(obj: T): boolean {
    // Check if this object is within the boundary
    if (!this.contains(obj.x, obj.y)) {
      return false;
    }

    // If there's space and we haven't divided, add the object
    if (this.objects.length < this.capacity && !this.divided) {
      this.objects.push(obj);
      return true;
    }

    // If we haven't divided yet, do so now
    if (!this.divided) {
      this.subdivide();
    }

    // Try to insert into children
    return this.insertIntoChildren(obj);
  }

  /**
   * Query objects within a circular range
   */
  public queryRange(x: number, y: number, range: number): T[] {
    // If this quadtree doesn't intersect with the range, return empty array
    if (!this.intersectsRange(x, y, range)) {
      return [];
    }

    // Start with objects in this quadtree that are within range
    const found: T[] = this.objects.filter(obj => this.isInRange(obj.x, obj.y, x, y, range));

    // If this quadtree is divided, query children too
    if (this.divided) {
      found.push(...(this.northwest?.queryRange(x, y, range) ?? []));
      found.push(...(this.northeast?.queryRange(x, y, range) ?? []));
      found.push(...(this.southwest?.queryRange(x, y, range) ?? []));
      found.push(...(this.southeast?.queryRange(x, y, range) ?? []));
    }

    return found;
  }

  /**
   * Get all objects in this quadtree and its children
   */
  public getAllObjects(): T[] {
    const all = [...this.objects];

    if (this.divided) {
      all.push(...(this.northwest?.getAllObjects() ?? []));
      all.push(...(this.northeast?.getAllObjects() ?? []));
      all.push(...(this.southwest?.getAllObjects() ?? []));
      all.push(...(this.southeast?.getAllObjects() ?? []));
    }

    return all;
  }

  /**
   * Remove an object from the quadtree
   */
  public remove(id: string): T | null {
    // Check if object is in this node
    const index = this.objects.findIndex(obj => obj.id === id);
    if (index !== -1) {
      return this.objects.splice(index, 1)[0];
    }

    // If not found here and we're divided, check children
    if (this.divided) {
      return (
        this.northwest?.remove(id) ||
        this.northeast?.remove(id) ||
        this.southwest?.remove(id) ||
        this.southeast?.remove(id) ||
        null
      );
    }

    return null;
  }

  /**
   * Clear all objects from this quadtree
   */
  public clear(): void {
    this.objects = [];

    if (this.divided) {
      this.northwest?.clear();
      this.northeast?.clear();
      this.southwest?.clear();
      this.southeast?.clear();

      this.divided = false;
      this.northwest = undefined;
      this.northeast = undefined;
      this.southwest = undefined;
      this.southeast = undefined;
    }
  }
}

/**
 * Spatial indexing system for resource network nodes
 */
export class SpatialIndex<T extends SpatialObject> {
  private quadtree: QuadTree<T>;
  private objectCount = 0;

  /**
   * Create a new SpatialIndex
   *
   * @param worldBounds - The bounds of the world {minX, minY, maxX, maxY}
   * @param capacity - Maximum objects per quadtree node
   */
  constructor(
    worldBounds: { minX: number; minY: number; maxX: number; maxY: number },
    capacity = 8
  ) {
    const width = worldBounds.maxX - worldBounds.minX;
    const height = worldBounds.maxY - worldBounds.minY;
    this.quadtree = new QuadTree<T>(worldBounds.minX, worldBounds.minY, width, height, capacity);
  }

  /**
   * Add an object to the index
   */
  public add(obj: T): boolean {
    const success = this.quadtree.insert(obj);
    if (success) {
      this.objectCount++;
    }
    return success;
  }

  /**
   * Add multiple objects to the index
   */
  public addAll(objects: T[]): number {
    let successCount = 0;
    for (const obj of objects) {
      if (this.add(obj)) {
        successCount++;
      }
    }
    return successCount;
  }

  /**
   * Find objects within a given range of a point
   */
  public findNearby(x: number, y: number, range: number): T[] {
    return this.quadtree.queryRange(x, y, range);
  }

  /**
   * Find the nearest neighbors of a point
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param count - Number of neighbors to find
   * @param maxRange - Maximum search range
   */
  public findNearestNeighbors(x: number, y: number, count: number, maxRange = Infinity): T[] {
    // Start with a reasonable search range if maxRange is Infinity
    let searchRange = maxRange === Infinity ? 100 : maxRange;
    let found: T[] = [];

    // Expand search range until we find enough objects or hit maxRange
    while (found.length < count && searchRange <= maxRange) {
      found = this.findNearby(x, y, searchRange);

      // If we didn't find enough objects, double the search range
      if (found.length < count) {
        searchRange *= 2;
      }
    }

    // Sort by distance and return the closest 'count' objects
    return found
      .sort((a, b) => {
        const distA = Math.pow(a.x - x, 2) + Math.pow(a.y - y, 2);
        const distB = Math.pow(b.x - x, 2) + Math.pow(b.y - y, 2);
        return distA - distB;
      })
      .slice(0, count);
  }

  /**
   * Remove an object from the index
   */
  public remove(id: string): T | null {
    const removed = this.quadtree.remove(id);
    if (removed) {
      this.objectCount--;
    }
    return removed;
  }

  /**
   * Get all objects in the index
   */
  public getAll(): T[] {
    return this.quadtree.getAllObjects();
  }

  /**
   * Get the number of objects in the index
   */
  public getCount(): number {
    return this.objectCount;
  }

  /**
   * Clear the index
   */
  public clear(): void {
    this.quadtree.clear();
    this.objectCount = 0;
  }

  /**
   * Update an object's position in the index
   *
   * @param id - Object ID
   * @param x - New X coordinate
   * @param y - New Y coordinate
   */
  public updatePosition(id: string, x: number, y: number): boolean {
    // Remove the object
    const obj = this.remove(id);
    if (!obj) {
      return false;
    }

    // Update coordinates
    obj.x = x;
    obj.y = y;

    // Reinsert with new position
    return this.add(obj);
  }
}
