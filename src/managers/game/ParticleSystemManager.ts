import { v4 as uuidv4 } from 'uuid';
import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import { EntityPool } from '../../lib/optimization/EntityPool';
import { Position } from '../../types/core/GameTypes';
import { EventType, ParticleSystemUpdateEventData } from '../../types/events/EventTypes';

interface Particle {
  id: string;
  active: boolean;
  position: Position;
  velocity: Position;
  acceleration: Position;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  reset(): void;
}

/**
 * Manages particle systems with efficient pooling
 */
export class ParticleSystemManager {
  private particlePool: EntityPool<Particle>;
  private systems: Map<string, ParticleSystem> = new Map();
  private lastUpdate: number = 0;

  constructor(initialPoolSize: number = 1000) {
    this.particlePool = new EntityPool<Particle>(() => this.createParticle(), initialPoolSize);

    // Debug logging
    console.warn(`[ParticleSystemManager] Initialized with pool size ${initialPoolSize}`);
  }

  /**
   * Create a new particle
   */
  private createParticle(): Particle {
    return {
      id: uuidv4(),
      active: false,
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      size: 1,
      color: '#ffffff',
      opacity: 1,
      life: 1,
      maxLife: 1,
      reset(): void {
        this.active = false;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.size = 1;
        this.color = '#ffffff';
        this.opacity = 1;
        this.life = 1;
        this.maxLife = 1;
      },
    };
  }

  /**
   * Create a new particle system
   */
  public createSystem(config: ParticleSystemConfig): string {
    const id = uuidv4();
    this.systems.set(id, new ParticleSystem(this.particlePool, config));
    return id;
  }

  /**
   * Remove a particle system
   */
  public removeSystem(id: string): void {
    const system = this.systems.get(id);
    if (system) {
      system.cleanup();
      this.systems.delete(id);
    }
  }

  /**
   * Update all particle systems
   */
  public update(timestamp: number): void {
    const deltaTime = this.lastUpdate ? (timestamp - this.lastUpdate) / 1000 : 0;
    this.lastUpdate = timestamp;

    let totalActiveParticles = 0;

    this.systems.forEach(system => {
      system.update(deltaTime);
      totalActiveParticles += system.getActiveParticleCount();
    });

    const eventData: ParticleSystemUpdateEventData = {
      activeCount: totalActiveParticles,
    };
    eventSystem.publish({
      type: EventType.PARTICLE_SYSTEM_UPDATED,
      managerId: 'ParticleSystemManager',
      timestamp: Date.now(),
      data: eventData,
    });
  }

  /**
   * Clean up all systems
   */
  public cleanup(): void {
    this.systems.forEach(system => system.cleanup());
    this.systems.clear();
    this.particlePool.clear();
  }
}

interface ParticleSystemConfig {
  maxParticles: number;
  spawnRate: number;
  position: Position;
  spread: number;
  initialVelocity: {
    min: Position;
    max: Position;
  };
  acceleration: Position;
  size: {
    min: number;
    max: number;
  };
  life: {
    min: number;
    max: number;
  };
  color: string | string[];
  blendMode?: 'normal' | 'additive';
}

/**
 * Individual particle system instance
 */
class ParticleSystem {
  private pool: EntityPool<Particle>;
  private config: ParticleSystemConfig;
  private particles: Set<Particle> = new Set();
  private timeSinceLastSpawn: number = 0;

  constructor(pool: EntityPool<Particle>, config: ParticleSystemConfig) {
    this.pool = pool;
    this.config = config;
  }

  /**
   * Spawn a new particle
   */
  private spawnParticle(): void {
    if (this.particles.size >= this.config.maxParticles) {
      return;
    }

    const particle = this.pool.acquire();
    if (!particle) {
      return;
    }

    // Initialize particle properties
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.config.spread;

    particle.position = {
      x: this.config.position.x + Math.cos(angle) * distance,
      y: this.config.position.y + Math.sin(angle) * distance,
    };

    particle.velocity = {
      x:
        this.config.initialVelocity.min.x +
        Math.random() * (this.config.initialVelocity.max.x - this.config.initialVelocity.min.x),
      y:
        this.config.initialVelocity.min.y +
        Math.random() * (this.config.initialVelocity.max.y - this.config.initialVelocity.min.y),
    };

    particle.acceleration = { ...this.config.acceleration };
    particle.size =
      this.config.size.min + Math.random() * (this.config.size.max - this.config.size.min);

    particle.life =
      this.config.life.min + Math.random() * (this.config.life.max - this.config.life.min);
    particle.maxLife = particle.life;

    if (Array.isArray(this.config.color)) {
      const colorIndex = Math.floor(Math.random() * this.config.color.length);
      particle.color = this.config.color[colorIndex];
    } else {
      particle.color = this.config.color;
    }

    this.particles.add(particle);
  }

  /**
   * Update particle system
   */
  public update(deltaTime: number): void {
    // Spawn new particles
    this.timeSinceLastSpawn += deltaTime;
    const spawnInterval = 1 / this.config.spawnRate;

    while (this.timeSinceLastSpawn >= spawnInterval) {
      this.spawnParticle();
      this.timeSinceLastSpawn -= spawnInterval;
    }

    // Update existing particles
    this.particles.forEach(particle => {
      // Update life
      particle.life -= deltaTime;
      if (particle.life <= 0) {
        this.particles.delete(particle);
        this.pool.release(particle);
        return;
      }

      // Update physics
      particle.velocity.x += particle.acceleration.x * deltaTime;
      particle.velocity.y += particle.acceleration.y * deltaTime;
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;

      // Update opacity based on life
      particle.opacity = particle.life / particle.maxLife;
    });
  }

  /**
   * Get number of active particles
   */
  public getActiveParticleCount(): number {
    return this.particles.size;
  }

  /**
   * Clean up particle system
   */
  public cleanup(): void {
    this.particles.forEach(particle => {
      this.pool.release(particle);
    });
    this.particles.clear();
  }
}
