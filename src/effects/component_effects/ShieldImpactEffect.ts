import { VisualEffect, VisualEffectConfig } from './VisualEffect';
import { RenderBatcher } from '../../lib/optimization/RenderBatcher';
import { Position } from '../../types/core/Position';

interface ShieldImpactConfig extends VisualEffectConfig {
  radius: number;
  damage: number;
  shieldStrength: number;
}

/**
 * Visual effect for shield impacts
 */
export class ShieldImpactEffect extends VisualEffect {
  protected override config: ShieldImpactConfig;
  private ripplePoints: Position[] = [];
  private hexagonPoints: Position[] = [];
  private crackPoints: Position[] = [];

  constructor(config: ShieldImpactConfig) {
    super(config);
    this.config = config;
  }

  protected getEffectType(): string {
    return 'shield-impact';
  }

  protected onStart(): void {
    // Create initial points
    this.createRipplePoints();
    this.createHexagonPoints();
    this.createCrackPoints();

    // Debug logging
    console.debug(`[ShieldImpactEffect] Started effect with damage: ${this.config.damage}`);
  }

  protected onUpdate(progress: number): void {
    // No additional update needed as points are transformed during rendering
  }

  protected onComplete(): void {
    this.ripplePoints = [];
    this.hexagonPoints = [];
    this.crackPoints = [];

    console.debug('[ShieldImpactEffect] Completed effect');
  }

  protected onReset(): void {
    this.ripplePoints = [];
    this.hexagonPoints = [];
    this.crackPoints = [];
  }

  protected updateRendering(batcher: RenderBatcher): void {
    if (!this.batchId) {
      return;
    }

    // Render shield components
    this.renderRipple(batcher);
    this.renderHexGrid(batcher);
    this.renderCracks(batcher);
  }

  private createRipplePoints(): void {
    const segments = 32;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      this.ripplePoints.push({
        x: Math.cos(angle) * this.config.radius,
        y: Math.sin(angle) * this.config.radius,
      });
    }
  }

  private createHexagonPoints(): void {
    // Create hexagonal grid pattern
    const hexRadius = 20;
    const rows = Math.ceil(this.config.radius / (hexRadius * 1.5));
    const cols = Math.ceil(this.config.radius / (hexRadius * Math.sqrt(3)));

    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        const x = col * hexRadius * Math.sqrt(3);
        const y = row * hexRadius * 1.5 + (col % 2) * hexRadius * 0.75;

        // Only add points within shield radius
        if (Math.sqrt(x * x + y * y) <= this.config.radius) {
          this.hexagonPoints.push({ x, y });
        }
      }
    }
  }

  private createCrackPoints(): void {
    if (this.config.damage <= 0) {
      return;
    }

    // Create crack pattern based on damage
    const crackCount = Math.ceil((this.config.damage / this.config.shieldStrength) * 5);
    const angleStep = (Math.PI * 2) / crackCount;

    for (let i = 0; i < crackCount; i++) {
      const baseAngle = angleStep * i;
      let currentPoint = {
        x: Math.cos(baseAngle) * this.config.radius * 0.2,
        y: Math.sin(baseAngle) * this.config.radius * 0.2,
      };

      // Create branching cracks
      for (let j = 0; j < 5; j++) {
        const angle = baseAngle + ((Math.random() - 0.5) * Math.PI) / 4;
        const length = Math.random() * this.config.radius * 0.3;

        const endPoint = {
          x: currentPoint.x + Math.cos(angle) * length,
          y: currentPoint.y + Math.sin(angle) * length,
        };

        this.crackPoints.push(currentPoint, endPoint);
        currentPoint = endPoint;
      }
    }
  }

  private renderRipple(batcher: RenderBatcher): void {
    const time = Date.now() / 1000;
    const baseRadius = this.config.radius;
    const rippleStrength = Math.max(0, 1 - this.progress * 2);

    // Render expanding ripple
    this.ripplePoints.forEach((point, index) => {
      const angle = (index / this.ripplePoints.length) * Math.PI * 2;
      const rippleOffset = Math.sin(time * 5 + angle * 3) * 10 * rippleStrength;
      const radius = baseRadius + rippleOffset;

      const position = {
        x: this.config.position.x + Math.cos(angle) * radius,
        y: this.config.position.y + Math.sin(angle) * radius,
      };

      batcher.addItem(this.batchId!, {
        id: `${this.id}-ripple-${index}`,
        position,
        size: { width: 4, height: 4 },
        rotation: angle,
        opacity: rippleStrength * 0.5,
        color: this.config.color || '#00ffff',
        shader: 'additive',
      });
    });
  }

  private renderHexGrid(batcher: RenderBatcher): void {
    const time = Date.now() / 1000;
    const hexOpacity = Math.max(0, 1 - this.progress * 3);

    this.hexagonPoints.forEach((point, index) => {
      const distance = Math.sqrt(point.x * point.x + point.y * point.y);
      const distanceRatio = distance / this.config.radius;
      const pulse = Math.sin(time * 3 + distanceRatio * 5) * 0.3 + 0.7;

      batcher.addItem(this.batchId!, {
        id: `${this.id}-hex-${index}`,
        position: {
          x: this.config.position.x + point.x,
          y: this.config.position.y + point.y,
        },
        size: { width: 30, height: 30 },
        rotation: time + index,
        opacity: hexOpacity * pulse * (1 - distanceRatio),
        color: this.config.color || '#00ffff',
        shader: 'additive',
      });
    });
  }

  private renderCracks(batcher: RenderBatcher): void {
    if (this.crackPoints.length === 0) {
      return;
    }

    const crackOpacity = Math.max(0, 1 - this.progress * 4);
    const time = Date.now() / 1000;

    for (let i = 0; i < this.crackPoints.length; i += 2) {
      const start = this.crackPoints[i];
      const end = this.crackPoints[i + 1];

      const centerX = (start.x + end.x) / 2;
      const centerY = (start.y + end.y) / 2;
      const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      const angle = Math.atan2(end.y - start.y, end.x - start.x);

      // Render crack line
      batcher.addItem(this.batchId!, {
        id: `${this.id}-crack-${i}`,
        position: {
          x: this.config.position.x + centerX,
          y: this.config.position.y + centerY,
        },
        size: { width: length, height: 2 },
        rotation: angle,
        opacity: crackOpacity * (0.8 + Math.sin(time * 10 + i) * 0.2),
        color: this.config.color || '#00ffff',
        shader: 'additive',
      });

      // Render glow
      batcher.addItem(this.batchId!, {
        id: `${this.id}-crack-glow-${i}`,
        position: {
          x: this.config.position.x + centerX,
          y: this.config.position.y + centerY,
        },
        size: { width: length, height: 6 },
        rotation: angle,
        opacity: crackOpacity * 0.5 * (0.8 + Math.sin(time * 10 + i) * 0.2),
        color: this.config.color || '#00ffff',
        shader: 'additive',
      });
    }
  }
}
