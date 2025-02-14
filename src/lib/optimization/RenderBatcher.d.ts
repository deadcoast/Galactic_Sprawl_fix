import { EventEmitter } from '../utils/EventEmitter';
import { Position } from '../../types/core/Position';

interface RenderBatch {
  id: string;
  type: string;
  zIndex: number;
  items: RenderItem[];
}

interface RenderItem {
  id: string;
  position: Position;
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  color: string;
  texture?: string;
  shader?: string;
  uniforms?: Record<string, any>;
}

interface RenderBatcherEvents {
  batchCreated: { batch: RenderBatch };
  batchUpdated: { batch: RenderBatch };
  batchRemoved: { batchId: string };
  frameStarted: { timestamp: number };
  frameEnded: { timestamp: number; drawCalls: number };
}

export declare class RenderBatcher extends EventEmitter<RenderBatcherEvents> {
  createBatch(type: string, zIndex?: number): string;
  addItem(batchId: string, item: RenderItem): void;
  removeItem(batchId: string, itemId: string): void;
  removeBatch(batchId: string): void;
  beginFrame(timestamp: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  endFrame(timestamp: number): void;
  cleanup(): void;
}
