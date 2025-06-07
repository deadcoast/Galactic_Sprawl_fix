import { RenderBatcher } from '../../lib/optimization/RenderBatcher';
import { Position } from '../../types/core/Position';

export interface VisualEffectConfig {
  id?: string;
  position: Position;
  color?: string;
  duration?: number;
}

export abstract class VisualEffect {
  protected id: string;
  protected config: VisualEffectConfig;
  protected progress = 0;
  protected batchId: string | null = null;
  protected startTime: number;
  protected isComplete = false;

  constructor(config: VisualEffectConfig) {
    this.id = config.id || Math.random().toString(36).substring(7);
    this.config = config;
    this.startTime = Date.now();
  }

  public start(): void {
    this.onStart();
    console.warn(`[${this.getEffectType()}] Started effect ${this.id}`);
  }

  public update(): void {
    if (this.isComplete) return;

    const elapsed = Date.now() - this.startTime;
    const duration = this.config.duration || 1000;
    this.progress = Math.min(elapsed / duration, 1);

    this.onUpdate(this.progress);

    if (this.progress >= 1) {
      this.complete();
    }
  }

  public render(batcher: RenderBatcher): void {
    if (!this.batchId) {
      this.batchId = batcher.createBatch(this.getEffectType());
    }
    this.updateRendering(batcher);
  }

  public complete(): void {
    if (this.isComplete) return;
    this.isComplete = true;
    this.onComplete();
    console.warn(`[${this.getEffectType()}] Completed effect ${this.id}`);
  }

  public reset(): void {
    this.progress = 0;
    this.startTime = Date.now();
    this.isComplete = false;
    this.onReset();
  }

  public isFinished(): boolean {
    return this.isComplete;
  }

  protected abstract getEffectType(): string;
  protected abstract onStart(): void;
  protected abstract onUpdate(progress: number): void;
  protected abstract updateRendering(batcher: RenderBatcher): void;
  protected abstract onComplete(): void;
  protected abstract onReset(): void;
}
