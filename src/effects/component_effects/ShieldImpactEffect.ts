import { RenderBatcher } from '../../lib/optimization/RenderBatcher';
import { Position } from '../../types/core/Position';
import { VisualEffect, VisualEffectConfig } from './VisualEffect';

// Extend the RenderBatcher interface to include the missing methods
declare module '../../lib/optimization/RenderBatcher' {
  interface RenderBatcher {
    drawCircle(options: { x: number; y: number; radius: number; color: string }): void;

    drawHexagon(options: {
      x: number;
      y: number;
      size: number;
      color: string;
      strokeColor: string;
      strokeWidth: number;
    }): void;

    drawLine(options: { from: Position; to: Position; width: number; color: string }): void;
  }
}

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
    // Create points for the effect
    this.createRipplePoints();
    this.createHexagonPoints();

    // Only create cracks if damage is significant
    if (this.config.damage > this.config.shieldStrength * 0.5) {
      this.createCrackPoints();
    }

    // Debug logging
    console.warn(`[ShieldImpactEffect] Started effect with damage: ${this.config.damage}`);
  }

  protected onUpdate(_progress: number): void {
    // Progress is handled in the rendering methods
  }

  protected onComplete(): void {
    // Clear points arrays
    this.ripplePoints = [];
    this.hexagonPoints = [];
    this.crackPoints = [];

    console.warn('[ShieldImpactEffect] Completed effect');
  }

  protected onReset(): void {
    // Clear points arrays
    this.ripplePoints = [];
    this.hexagonPoints = [];
    this.crackPoints = [];
  }

  protected updateRendering(batcher: RenderBatcher): void {
    // Render the shield impact components
    this.renderRipple(batcher);
    this.renderHexGrid(batcher);

    // Only render cracks if they exist
    if (this.crackPoints.length > 0) {
      this.renderCracks(batcher);
    }
  }

  /**
   * Create points for the ripple effect
   */
  private createRipplePoints(): void {
    const pointCount = 24;
    this.ripplePoints = [];

    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      this.ripplePoints.push({
        x: Math.cos(angle),
        y: Math.sin(angle),
      });
    }
  }

  /**
   * Create points for the hexagonal grid
   */
  private createHexagonPoints(): void {
    const { radius } = this.config;
    const hexSize = radius / 4;
    const hexCount = Math.ceil(radius / hexSize) * 2;
    this.hexagonPoints = [];

    for (let x = -hexCount; x <= hexCount; x++) {
      for (let y = -hexCount; y <= hexCount; y++) {
        // Offset every other row
        const xPos = x * hexSize * 1.5;
        const yPos = y * hexSize * Math.sqrt(3) + (x % 2 === 0 ? 0 : (hexSize * Math.sqrt(3)) / 2);

        // Only include points within the radius
        const dist = Math.sqrt(xPos * xPos + yPos * yPos);
        if (dist <= radius) {
          this.hexagonPoints.push({
            x: xPos,
            y: yPos,
          });
        }
      }
    }
  }

  /**
   * Create points for the crack effect
   */
  private createCrackPoints(): void {
    const crackCount = Math.ceil((this.config.damage / this.config.shieldStrength) * 5);
    this.crackPoints = [];

    for (let i = 0; i < crackCount; i++) {
      const startAngle = Math.random() * Math.PI * 2;
      const startDist = this.config.radius * 0.2;
      const length = this.config.radius * (0.5 + Math.random() * 0.5);

      let x = Math.cos(startAngle) * startDist;
      let y = Math.sin(startAngle) * startDist;

      this.crackPoints.push({ x, y });

      // Create a jagged line for each crack
      const segments = 5 + Math.floor(Math.random() * 5);
      for (let j = 0; j < segments; j++) {
        const segmentLength = length / segments;
        const jitter = segmentLength * 0.3;

        // Add some randomness to the crack direction
        // Use a new variable instead of modifying the constant
        const currentAngle = startAngle + (Math.random() - 0.5) * 0.5 * (j + 1);

        x += Math.cos(currentAngle) * segmentLength + (Math.random() - 0.5) * jitter;
        y += Math.sin(currentAngle) * segmentLength + (Math.random() - 0.5) * jitter;

        this.crackPoints.push({ x, y });
      }
    }
  }

  /**
   * Render the ripple effect
   */
  private renderRipple(batcher: RenderBatcher): void {
    const time = Date.now() / 1000;
    const baseRadius = this.config.radius;
    const rippleStrength = Math.max(0, 1 - this.progress * 2);

    // Render expanding ripple
    this.ripplePoints.forEach(point => {
      // Use the point's normalized direction (x,y) which represents a point on the unit circle
      // Calculate ripple offset based on time and the point's position for a wave-like effect
      const angle = Math.atan2(point.y, point.x);
      const rippleOffset = Math.sin(time * 5 + angle * 3) * 10 * rippleStrength;

      // Apply the offset to the base radius
      const radius = baseRadius + rippleOffset;

      // Calculate the position using the point's normalized direction and the radius
      const position = {
        x: this.config.position.x + point.x * radius,
        y: this.config.position.y + point.y * radius,
      };

      // Draw the ripple point
      batcher.drawCircle({
        x: position.x,
        y: position.y,
        radius: 1 + rippleStrength * 2,
        color: `rgba(100, 200, 255, ${rippleStrength * 0.7})`,
      });
    });
  }

  /**
   * Render the hexagonal grid
   */
  private renderHexGrid(batcher: RenderBatcher): void {
    const hexOpacity = Math.max(0, 1 - this.progress * 1.5);
    const hexSize = this.config.radius / 4;

    // Render hexagonal grid
    this.hexagonPoints.forEach(point => {
      const position = {
        x: this.config.position.x + point.x,
        y: this.config.position.y + point.y,
      };

      // Calculate distance from center for fade effect
      const dist = Math.sqrt(point.x * point.x + point.y * point.y);
      const distFactor = 1 - dist / this.config.radius;

      // Draw hexagon
      batcher.drawHexagon({
        x: position.x,
        y: position.y,
        size: hexSize * (0.8 + distFactor * 0.2),
        color: `rgba(100, 200, 255, ${hexOpacity * distFactor * 0.5})`,
        strokeColor: `rgba(150, 220, 255, ${hexOpacity * distFactor * 0.8})`,
        strokeWidth: 1,
      });
    });
  }

  /**
   * Render the crack effect
   */
  private renderCracks(batcher: RenderBatcher): void {
    const crackOpacity = Math.max(0, 1 - this.progress * 1.2);

    // Render cracks
    for (let i = 0; i < this.crackPoints.length - 1; i++) {
      // Skip if this is the end of a crack segment
      if (i > 0 && i % 6 === 0) {
        continue;
      }

      const start = {
        x: this.config.position.x + this.crackPoints[i].x,
        y: this.config.position.y + this.crackPoints[i].y,
      };

      const end = {
        x: this.config.position.x + this.crackPoints[i + 1].x,
        y: this.config.position.y + this.crackPoints[i + 1].y,
      };

      // Draw crack segment
      batcher.drawLine({
        from: start,
        to: end,
        width: 2,
        color: `rgba(200, 230, 255, ${crackOpacity})`,
      });

      // Add glow effect
      batcher.drawLine({
        from: start,
        to: end,
        width: 4,
        color: `rgba(100, 200, 255, ${crackOpacity * 0.5})`,
      });
    }
  }
}
