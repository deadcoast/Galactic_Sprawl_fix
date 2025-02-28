import { RenderBatcher } from '../../lib/optimization/RenderBatcher';
import { Position } from '../../types/core/Position';
import { VisualEffect, VisualEffectConfig } from './VisualEffect';

interface EngineTrailConfig extends VisualEffectConfig {
  engineSize: number;
  enginePower: number;
  velocity: Position;
}

/**
 * Visual effect for ship engine trails
 */
export class EngineTrailEffect extends VisualEffect {
  protected override config: EngineTrailConfig;
  private trailPoints: Array<{
    position: Position;
    size: number;
    opacity: number;
    rotation: number;
    time: number;
  }> = [];
  private lastEmitTime: number = 0;
  private emitInterval: number = 50; // ms

  constructor(config: EngineTrailConfig) {
    super(config);
    this.config = config;
  }

  protected getEffectType(): string {
    return 'engine-trail';
  }

  protected onStart(): void {
    this.lastEmitTime = Date.now();
    console.debug(`[EngineTrailEffect] Started with power: ${this.config.enginePower}`);
  }

  protected onUpdate(progress: number): void {
    const now = Date.now();

    // Emit new particles
    if (now - this.lastEmitTime >= this.emitInterval) {
      this.emitParticles();
      this.lastEmitTime = now;
    }

    // Update existing particles
    this.updateParticles();
  }

  protected onComplete(): void {
    this.trailPoints = [];
    console.debug('[EngineTrailEffect] Completed');
  }

  protected onReset(): void {
    this.trailPoints = [];
    this.lastEmitTime = 0;
  }

  protected updateRendering(batcher: RenderBatcher): void {
    if (!this.batchId) {
      return;
    }

    // Render core engine glow
    this.renderEngineCore(batcher);

    // Render trail particles
    this.renderTrail(batcher);
  }

  private emitParticles(): void {
    const baseSize = this.config.engineSize;
    const particleCount = Math.ceil(this.config.enginePower * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spread = this.config.engineSize * 0.3;
      const offset = {
        x: Math.cos(angle) * spread,
        y: Math.sin(angle) * spread,
      };

      this.trailPoints.push({
        position: {
          x: this.config.position.x + offset.x,
          y: this.config.position.y + offset.y,
        },
        size: baseSize * (0.5 + Math.random() * 0.5),
        opacity: 0.8 + Math.random() * 0.2,
        rotation: angle,
        time: Date.now(),
      });
    }

    // Limit total particles
    while (this.trailPoints.length > 100) {
      this.trailPoints.shift();
    }
  }

  private updateParticles(): void {
    const now = Date.now();
    const deltaTime = 1 / 60; // Assume 60fps for physics

    this.trailPoints = this.trailPoints.filter(point => {
      // Update position based on velocity
      point.position.x -= this.config.velocity.x * deltaTime;
      point.position.y -= this.config.velocity.y * deltaTime;

      // Add some turbulence
      const age = (now - point.time) / 1000;
      const turbulence = Math.sin(age * 10 + point.rotation) * 2;
      point.position.x += Math.cos(point.rotation) * turbulence * deltaTime;
      point.position.y += Math.sin(point.rotation) * turbulence * deltaTime;

      // Fade out based on age
      point.opacity = Math.max(0, point.opacity - deltaTime);

      // Keep particle if still visible
      return point.opacity > 0;
    });
  }

  private renderEngineCore(batcher: RenderBatcher): void {
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 10) * 0.2 + 0.8;
    const coreSize = this.config.engineSize * this.config.enginePower;

    // Core glow
    batcher.addItem(this.batchId!, {
      id: `${this.id}-core`,
      position: this.config.position,
      size: { width: coreSize * 2, height: coreSize * 2 },
      rotation: 0,
      opacity: 0.8 * pulse,
      color: this.config.color || '#00ffff',
      shader: 'additive',
    });

    // Inner core
    batcher.addItem(this.batchId!, {
      id: `${this.id}-inner`,
      position: this.config.position,
      size: { width: coreSize, height: coreSize },
      rotation: time * 2,
      opacity: 1,
      color: '#ffffff',
      shader: 'additive',
    });
  }

  private renderTrail(batcher: RenderBatcher): void {
    this.trailPoints.forEach((point, index) => {
      const time = Date.now() / 1000;
      const flicker = Math.sin(time * 20 + index) * 0.2 + 0.8;

      // Trail particle
      batcher.addItem(this.batchId!, {
        id: `${this.id}-trail-${index}`,
        position: point.position,
        size: { width: point.size, height: point.size },
        rotation: point.rotation + time,
        opacity: point.opacity * flicker,
        color: this.config.color || '#00ffff',
        shader: 'additive',
      });

      // Particle glow
      batcher.addItem(this.batchId!, {
        id: `${this.id}-glow-${index}`,
        position: point.position,
        size: { width: point.size * 2, height: point.size * 2 },
        rotation: -point.rotation + time,
        opacity: point.opacity * 0.5 * flicker,
        color: this.config.color || '#00ffff',
        shader: 'additive',
      });
    });
  }
}
