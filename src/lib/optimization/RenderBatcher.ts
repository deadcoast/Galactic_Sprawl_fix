import { Position } from '../../types/core/Position';
import { EventEmitter } from '../utils/EventEmitter';

export interface RenderBatch {
  id: string;
  type: string;
  zIndex: number;
  items: RenderItem[];
}

export interface RenderItem {
  id: string;
  position: Position;
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  color: string;
  texture?: string;
  shader?: string;
  uniforms?: Record<string, unknown>;
}

export interface RenderBatcherEvents {
  batchCreated: { batch: RenderBatch };
  batchUpdated: { batch: RenderBatch };
  batchRemoved: { batchId: string };
  frameStarted: { timestamp: number };
  frameEnded: { timestamp: number; drawCalls: number };
  [key: string]: unknown;
}

/**
 * Manages render batching for optimized drawing
 */
export class RenderBatcher extends EventEmitter<RenderBatcherEvents> {
  private batches: Map<string, RenderBatch> = new Map();
  private sortedBatches: RenderBatch[] = [];
  private needsSort: boolean = false;
  private drawCalls: number = 0;

  constructor() {
    super();
    console.warn('[RenderBatcher] Initialized');
  }

  /**
   * Create a new render batch
   */
  public createBatch(type: string, zIndex: number = 0): string {
    const id = `batch-${type}-${Date.now()}`;
    const batch: RenderBatch = {
      id,
      type,
      zIndex,
      items: [],
    };

    this.batches.set(id, batch);
    this.needsSort = true;
    this.emit('batchCreated', { batch });

    return id;
  }

  /**
   * Add item to a batch
   */
  public addItem(batchId: string, item: RenderItem): void {
    const batch = this.batches.get(batchId);
    if (batch) {
      batch.items.push(item);
      this.emit('batchUpdated', { batch });
    }
  }

  /**
   * Remove item from a batch
   */
  public removeItem(batchId: string, itemId: string): void {
    const batch = this.batches.get(batchId);
    if (batch) {
      const index = batch.items.findIndex(item => item.id === itemId);
      if (index !== -1) {
        batch.items.splice(index, 1);
        this.emit('batchUpdated', { batch });
      }
    }
  }

  /**
   * Remove a batch
   */
  public removeBatch(batchId: string): void {
    if (this.batches.delete(batchId)) {
      this.needsSort = true;
      this.emit('batchRemoved', { batchId });
    }
  }

  /**
   * Sort batches by z-index
   */
  private sortBatches(): void {
    if (!this.needsSort) {
      return;
    }

    this.sortedBatches = Array.from(this.batches.values()).sort((a, b) => a.zIndex - b.zIndex);
    this.needsSort = false;
  }

  /**
   * Begin frame
   */
  public beginFrame(timestamp: number): void {
    this.drawCalls = 0;
    this.emit('frameStarted', { timestamp });
  }

  /**
   * Render all batches
   */
  public render(ctx: CanvasRenderingContext2D): void {
    this.sortBatches();

    // Group items by shader and texture to minimize state changes
    this.sortedBatches.forEach(batch => {
      const byShader = new Map<string, RenderItem[]>();

      batch.items.forEach(item => {
        const key = `${item.shader || 'default'}-${item.texture || 'none'}`;
        if (!byShader.has(key)) {
          byShader.set(key, []);
        }
        byShader.get(key)!.push(item);
      });

      // Render each group
      byShader.forEach((items, _key) => {
        // Set up shader and texture once for the group
        this.setupShaderAndTexture(ctx, items[0]);
        this.drawCalls++;

        // Render all items in the group
        items.forEach(item => {
          this.renderItem(ctx, item);
        });
      });
    });
  }

  /**
   * Set up shader and texture for a group
   */
  private setupShaderAndTexture(ctx: CanvasRenderingContext2D, item: RenderItem): void {
    // Set global alpha
    ctx.globalAlpha = item.opacity;

    // Set blend mode based on shader
    if (item.shader === 'additive') {
      ctx.globalCompositeOperation = 'lighter';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    // Set color
    ctx.fillStyle = item.color;
    ctx.strokeStyle = item.color;
  }

  /**
   * Render a single item
   */
  private renderItem(ctx: CanvasRenderingContext2D, item: RenderItem): void {
    ctx.save();

    // Transform
    ctx.translate(item.position.x, item.position.y);
    ctx.rotate(item.rotation);

    // Draw
    if (item.texture) {
      // Draw textured quad
      ctx.fillRect(-item.size.width / 2, -item.size.height / 2, item.size.width, item.size.height);
    } else {
      // Draw colored quad
      ctx.fillRect(-item.size.width / 2, -item.size.height / 2, item.size.width, item.size.height);
    }

    ctx.restore();
  }

  /**
   * End frame
   */
  public endFrame(timestamp: number): void {
    this.emit('frameEnded', {
      timestamp,
      drawCalls: this.drawCalls,
    });
  }

  /**
   * Clean up
   */
  public cleanup(): void {
    this.batches.clear();
    this.sortedBatches = [];
    this.needsSort = false;
    this.drawCalls = 0;
  }
}
